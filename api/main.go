package main

import (
	"context"
	"fmt"
	"log"
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
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-User-ID")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("cannot connect to db: %v", err)
	}
	defer pool.Close()

	if err := pool.Ping(context.Background()); err != nil {
		log.Fatalf("cannot ping db: %v", err)
	}

	runMigrations(pool)

	cfURLs := parseCFWorkerURLs(os.Getenv("CF_WORKER_URL"))

	auth := &handlers.AuthHandler{DB: pool}
	user := &handlers.UserHandler{DB: pool}
	pred := &handlers.PredictionHandler{DB: pool}
	lb := &handlers.LeaderboardHandler{DB: pool}
	live := handlers.NewLiveHandler(cfURLs)

	mux := http.NewServeMux()

	mux.HandleFunc("POST /api/auth/login", auth.Login)
	mux.HandleFunc("POST /api/auth/register", auth.Register)

	mux.HandleFunc("GET /api/user/profile", user.Profile)
	mux.HandleFunc("PUT /api/user/profile", user.Update)

	mux.HandleFunc("POST /api/predictions", pred.Create)
	mux.HandleFunc("GET /api/predictions", pred.ListByUser)

	mux.HandleFunc("GET /api/leaderboard", lb.Top)
	mux.HandleFunc("GET /api/leaderboard/me", lb.UserStats)

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

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      cors(mux),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		fmt.Printf("api server listening on :%s\n", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	log.Println("shutting down...")
	srv.Shutdown(ctx)
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

func runMigrations(pool *pgxpool.Pool) {
	sql, err := os.ReadFile("migrations/001_init.sql")
	if err != nil {
		log.Printf("no migrations file found, skipping: %v", err)
		return
	}
	if _, err := pool.Exec(context.Background(), string(sql)); err != nil {
		log.Printf("migration note (may already exist): %v", err)
	} else {
		log.Println("migrations applied successfully")
	}
}
