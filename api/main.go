package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"predictor888/handlers"

	"github.com/jackc/pgx/v5/pgxpool"
)

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-User-ID, Authorization")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		slog.Error("DATABASE_URL environment variable is required")
		os.Exit(1)
	}

	poolCfg, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		slog.Error("cannot parse db url", "err", err)
		os.Exit(1)
	}
	poolCfg.MaxConns = 30
	poolCfg.MinConns = 5
	poolCfg.MaxConnLifetime = 30 * time.Minute
	poolCfg.MaxConnIdleTime = 5 * time.Minute
	poolCfg.HealthCheckPeriod = 30 * time.Second

	pool, err := pgxpool.NewWithConfig(context.Background(), poolCfg)
	if err != nil {
		slog.Error("cannot connect to db", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	if err := pool.Ping(context.Background()); err != nil {
		slog.Error("cannot ping db", "err", err)
		os.Exit(1)
	}

	runMigrations(pool)

	cfURLs := parseCFWorkerURLs(os.Getenv("CF_WORKER_URL"))

	appCtx, appCancel := context.WithCancel(context.Background())
	defer appCancel()

	lookup := handlers.NewLookupClient(
		os.Getenv("LOOKUP_API_URL"),
		os.Getenv("LOOKUP_API_KEY"),
	)
	if lookup == nil {
		slog.Warn("LOOKUP_API_URL or LOOKUP_API_KEY not set, 888starz check disabled")
	}

	signer := handlers.NewTokenSigner(os.Getenv("SESSION_SECRET"))
	if signer == nil {
		slog.Warn("SESSION_SECRET not set or too short (<16 chars), bearer tokens disabled, falling back to X-User-ID")
	}
	handlers.SetSessionSigner(signer)

	auth := &handlers.AuthHandler{DB: pool, Lookup: lookup, Signer: signer}
	telegram := &handlers.TelegramHandler{DB: pool, Lookup: lookup}
	quests := &handlers.QuestHandler{DB: pool}
	promos := &handlers.PromoHandler{DB: pool}
	tokens := &handlers.TokenHandler{DB: pool}
	picks := &handlers.PickHandler{DB: pool}
	subs := handlers.NewSubscriptionHandler(pool)
	user := &handlers.UserHandler{DB: pool}
	pred := &handlers.PredictionHandler{DB: pool}
	lb := &handlers.LeaderboardHandler{DB: pool}
	resolver := handlers.NewResolver(pool)
	resolver.Restore(appCtx)
	live := handlers.NewLiveHandler(appCtx, cfURLs, resolver)

	// Догоняющий проход: закрывает прогнозы, которые live-цикл пропустил
	// (матч исчез из выдачи, сервис перезапустился).
	go func() {
		ticker := time.NewTicker(handlers.SweepInterval)
		defer ticker.Stop()
		resolver.Sweep(appCtx)
		for {
			select {
			case <-appCtx.Done():
				return
			case <-ticker.C:
				resolver.Sweep(appCtx)
			}
		}
	}()

	mux := http.NewServeMux()

	mux.HandleFunc("POST /api/auth/login", auth.Login)
	mux.HandleFunc("POST /api/auth/register", auth.Register)

	// Привязка Player ID к Telegram — вызывается до логина, поэтому без RequireUser.
	mux.HandleFunc("POST /api/telegram/link", telegram.Link)
	mux.HandleFunc("GET /api/telegram/link", telegram.Status)

	protected := handlers.RequireUser

	mux.Handle("GET /api/user/profile", protected(http.HandlerFunc(user.Profile)))
	mux.Handle("PUT /api/user/profile", protected(http.HandlerFunc(user.Update)))

	mux.Handle("POST /api/predictions", protected(http.HandlerFunc(pred.Create)))
	mux.Handle("GET /api/predictions", protected(http.HandlerFunc(pred.ListByUser)))

	mux.Handle("GET /api/quests", protected(http.HandlerFunc(quests.List)))
	mux.Handle("POST /api/quests/claim", protected(http.HandlerFunc(quests.Claim)))

	mux.Handle("GET /api/promos", protected(http.HandlerFunc(promos.List)))
	mux.Handle("POST /api/promos/claim", protected(http.HandlerFunc(promos.Claim)))

	mux.Handle("POST /api/visit", protected(http.HandlerFunc(tokens.Visit)))
	mux.Handle("POST /api/tokens/spend", protected(http.HandlerFunc(tokens.Spend)))

	mux.Handle("GET /api/subscription", protected(http.HandlerFunc(subs.Status)))
	mux.Handle("DELETE /api/user/profile", protected(http.HandlerFunc(subs.Delete)))

	mux.HandleFunc("GET /api/picks", picks.List)

	mux.HandleFunc("GET /api/leaderboard", lb.Top)
	mux.Handle("GET /api/leaderboard/me", protected(http.HandlerFunc(lb.UserStats)))

	mux.HandleFunc("GET /api/live/counts", live.Counts)
	mux.HandleFunc("GET /api/live/match", live.Match)
	mux.HandleFunc("GET /api/live/football", live.Football)
	mux.HandleFunc("GET /api/live/all", live.All)
	mux.HandleFunc("GET /api/live/home", live.Home)
	mux.HandleFunc("GET /api/live/matches", live.Football)
	mux.HandleFunc("GET /api/recommended", live.Recommended)
	mux.HandleFunc("GET /api/status", live.Status)

	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		if err := pool.Ping(r.Context()); err != nil {
			w.WriteHeader(http.StatusServiceUnavailable)
			w.Write([]byte(`{"status":"unhealthy"}`))
			return
		}
		w.Write([]byte(`{"status":"ok"}`))
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}

	handler := handlers.RequestID(handlers.AccessLog(cors(mux)))

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       120 * time.Second,
		MaxHeaderBytes:    1 << 20,
	}

	go func() {
		slog.Info("server started", "port", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "err", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down")
	appCancel()

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("server shutdown error", "err", err)
	}
	live.Shutdown()
	slog.Info("server stopped")
}

func parseCFWorkerURLs(env string) []string {
	if env == "" {
		return nil
	}
	parts := strings.Split(env, ",")
	urls := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			urls = append(urls, p)
		}
	}
	return urls
}

