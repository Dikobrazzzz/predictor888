package handlers

import (
	"bytes"
	"compress/gzip"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

var userAgents = []string{
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
	"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}

const (
	cdnBase           = "https://v3.traincdn.com/resized/size32/sfiles/logo_teams"
	cacheTTL          = 30 * time.Second
	countsTTL         = 60 * time.Second
	fetchTimeout      = 12 * time.Second
	circuitOpenSecs   = 90 * time.Second
	workerCooldownSec = 60
)

type sportConfig struct {
	URL      string
	Name     string
	OddsType string
}

var sportsConfig = map[string]sportConfig{
	"football": {
		"https://888starz.bet/service-api/LiveFeed/Get1x2_VZip?sports=1&count=50&lng=en&gr=789&mode=4&country=197&partner=233&getEmpty=true",
		"Football", "1x2_g",
	},
	"basketball": {
		"https://888starz.bet/service-api/LiveFeed/Get1x2_VZip?sports=3&count=40&lng=en&mode=4&country=197&partner=233&getEmpty=true",
		"Basketball", "bball",
	},
	"tennis": {
		"https://888starz.bet/service-api/LiveFeed/Get1x2_VZip?sports=4&count=40&lng=en&gr=789&mode=4&country=197&partner=233&getEmpty=true&virtualSports=true&noFilterBlockEvent=true",
		"Tennis", "12_g",
	},
	"hockey": {
		"https://888starz.bet/service-api/LiveFeed/Get1x2_VZip?sports=2&count=40&lng=en&gr=789&mode=4&country=197&partner=233&getEmpty=true&virtualSports=true&noFilterBlockEvent=true",
		"Ice Hockey", "1x2_g",
	},
}

var topGamesURL = "https://888starz.bet/service-api/LiveFeed/GetTopGamesStatZip?lng=en&antisports=66&partner=233"
var countsURL = "https://888starz.bet/service-api/LiveFeed/GetSportsShortZip?sports=1,2,3,4&lng=en&gr=789&country=197&partner=233&virtualSports=true&groupChamps=true"

var countsMap = map[string]string{
	"Football":   "football",
	"Basketball": "basketball",
	"Tennis":     "tennis",
	"Ice Hockey": "hockey",
}

type eventsstatSport struct {
	ID       int
	Name     string
	Keywords []string
}

var eventsstatSports = map[string]eventsstatSport{
	"football": {1, "Football", []string{"champions league", "premier league", "la liga", "bundesliga",
		"serie a", "ligue 1", "eredivisie", "primeira liga", "europa league", "conference league", "serie b"}},
	"hockey": {2, "Ice Hockey", []string{"khl", "nhl", "kontinental", "liiga", "shl", "nl "}},
	"basketball": {3, "Basketball", []string{"nba", "euroleague", "acb", "bbl", "nbl", "lnb"}},
	"tennis": {4, "Tennis", []string{"atp", "wta", "grand slam", "masters"}},
}

const (
	recommendDays = 4
	recommendTopN = 5
	recommendTTL  = 30 * time.Minute
)

type cacheEntry struct {
	data interface{}
	ts   time.Time
}

type LiveHandler struct {
	cfWorkerURLs   []string
	cache          sync.Map
	circuit        sync.Map
	workerFailures sync.Map
	httpClient     *http.Client
	cancel         context.CancelFunc
	wg             sync.WaitGroup

	jsonCache   sync.Map // key -> []byte (pre-serialized JSON for hot endpoints)
}

func NewLiveHandler(ctx context.Context, cfWorkerURLs []string) *LiveHandler {
	ctx, cancel := context.WithCancel(ctx)
	h := &LiveHandler{
		cfWorkerURLs: cfWorkerURLs,
		cancel:       cancel,
		httpClient: &http.Client{
			Timeout: fetchTimeout,
			Transport: &http.Transport{
				MaxIdleConns:        100,
				MaxIdleConnsPerHost: 20,
				MaxConnsPerHost:     30,
				IdleConnTimeout:     90 * time.Second,
				DialContext: (&net.Dialer{
					Timeout:   5 * time.Second,
					KeepAlive: 30 * time.Second,
				}).DialContext,
				ResponseHeaderTimeout: 10 * time.Second,
			},
		},
	}
	h.wg.Add(2)
	go h.bgRefresh(ctx)
	go h.bgRefreshRecommendations(ctx)
	return h
}

func (h *LiveHandler) Shutdown() {
	h.cancel()
	h.wg.Wait()
	log.Println("live handler background tasks stopped")
}

func (h *LiveHandler) makeHeaders() http.Header {
	hdr := http.Header{}
	hdr.Set("x-app-n", "__BETTING_APP__")
	hdr.Set("x-svc-source", "__BETTING_APP__")
	hdr.Set("x-requested-with", "XMLHttpRequest")
	hdr.Set("referer", "https://888starz.bet/en")
	hdr.Set("user-agent", userAgents[rand.Intn(len(userAgents))])
	hdr.Set("accept", "application/json, text/plain, */*")
	hdr.Set("accept-encoding", "gzip, deflate")
	return hdr
}

func (h *LiveHandler) fetchViaWorker(workerURL, targetURL string) ([]map[string]interface{}, error) {
	relay := fmt.Sprintf("%s?url=%s", workerURL, url.QueryEscape(targetURL))
	req, _ := http.NewRequest("GET", relay, nil)
	req.Header.Set("user-agent", userAgents[rand.Intn(len(userAgents))])

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var reader io.Reader = resp.Body
	if resp.Header.Get("Content-Encoding") == "gzip" {
		gr, err := gzip.NewReader(resp.Body)
		if err != nil {
			return nil, err
		}
		defer gr.Close()
		reader = gr
	}

	const maxResponseSize = 10 << 20 // 10 MB
	body, err := io.ReadAll(io.LimitReader(reader, maxResponseSize))
	if err != nil {
		return nil, err
	}

	if len(body) >= 2 && body[0] == 0x1f && body[1] == 0x8b {
		gr, err := gzip.NewReader(io.NopCloser(bytes.NewReader(body)))
		if err == nil {
			body, _ = io.ReadAll(io.LimitReader(gr, maxResponseSize))
			gr.Close()
		}
	}

	var wrapper struct {
		Value []map[string]interface{} `json:"Value"`
	}
	if err := json.Unmarshal(body, &wrapper); err != nil {
		return nil, err
	}
	return wrapper.Value, nil
}

func (h *LiveHandler) fetchDirect(targetURL string) ([]map[string]interface{}, error) {
	req, _ := http.NewRequest("GET", targetURL, nil)
	req.Header = h.makeHeaders()

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var reader io.Reader = resp.Body
	if resp.Header.Get("Content-Encoding") == "gzip" {
		gr, err := gzip.NewReader(resp.Body)
		if err != nil {
			return nil, err
		}
		defer gr.Close()
		reader = gr
	}

	const maxResponseSize = 10 << 20
	body, err := io.ReadAll(io.LimitReader(reader, maxResponseSize))
	if err != nil {
		return nil, err
	}

	var wrapper struct {
		Value []map[string]interface{} `json:"Value"`
	}
	if err := json.Unmarshal(body, &wrapper); err != nil {
		return nil, err
	}
	return wrapper.Value, nil
}

func (h *LiveHandler) fetchRaw(targetURL string) []map[string]interface{} {
	now := time.Now()
	workers := make([]string, len(h.cfWorkerURLs))
	copy(workers, h.cfWorkerURLs)
	rand.Shuffle(len(workers), func(i, j int) { workers[i], workers[j] = workers[j], workers[i] })

	for _, w := range workers {
		if v, ok := h.workerFailures.Load(w); ok {
			if now.Sub(v.(time.Time)).Seconds() < float64(workerCooldownSec) {
				continue
			}
		}
		result, err := h.fetchViaWorker(w, targetURL)
		if err != nil {
			fmt.Printf("[WARN] worker %s: %v\n", w, err)
			h.workerFailures.Store(w, now)
			continue
		}
		h.workerFailures.Delete(w)
		return result
	}

	result, err := h.fetchDirect(targetURL)
	if err != nil {
		fmt.Printf("[WARN] direct fetch: %v\n", err)
		return nil
	}
	return result
}

func iconURL(imgList interface{}) *string {
	if imgList == nil {
		return nil
	}
	arr, ok := imgList.([]interface{})
	if !ok || len(arr) == 0 {
		return nil
	}
	name := fmt.Sprintf("%v", arr[0])
	if idx := strings.LastIndex(name, "."); idx > 0 {
		name = name[:idx]
	}
	u := fmt.Sprintf("%s/%s.webp", cdnBase, name)
	return &u
}

func getStr(m map[string]interface{}, key string) string {
	v, ok := m[key]
	if !ok || v == nil {
		return ""
	}
	return fmt.Sprintf("%v", v)
}

func getFloat(m map[string]interface{}, key string) *float64 {
	v, ok := m[key]
	if !ok || v == nil {
		return nil
	}
	f, ok := v.(float64)
	if !ok {
		return nil
	}
	return &f
}

func parseMatch(m map[string]interface{}, oddsType string) map[string]interface{} {
	sc, _ := m["SC"].(map[string]interface{})
	var score *string
	if sc != nil {
		if fs, ok := sc["FS"].(map[string]interface{}); ok && fs["S1"] != nil {
			s := fmt.Sprintf("%v-%v", fs["S1"], fs["S2"])
			score = &s
		} else if ss, ok := sc["SS"].(map[string]interface{}); ok && ss["S1"] != nil {
			s := fmt.Sprintf("%v-%v", ss["S1"], ss["S2"])
			score = &s
		}
	}

	events, _ := m["E"].([]interface{})
	coef := map[string]interface{}{"home": nil, "draw": nil, "away": nil}

	for _, ev := range events {
		e, ok := ev.(map[string]interface{})
		if !ok {
			continue
		}
		t := e["T"]
		c := e["C"]
		switch oddsType {
		case "1x2_g":
			if g, _ := e["G"].(float64); g == 1 {
				switch t {
				case float64(1):
					coef["home"] = c
				case float64(2):
					coef["draw"] = c
				case float64(3):
					coef["away"] = c
				}
			}
		case "bball":
			if g, _ := e["G"].(float64); g == 101 {
				switch t {
				case float64(401):
					coef["home"] = c
				case float64(402):
					coef["away"] = c
				}
			}
		default:
			if g, _ := e["G"].(float64); g == 1 {
				switch t {
				case float64(1):
					coef["home"] = c
				case float64(3):
					coef["away"] = c
				}
			}
		}
	}

	timeLeft := "LIVE"
	if sc != nil {
		if sls, ok := sc["SLS"]; ok && sls != nil {
			timeLeft = fmt.Sprintf("%v", sls)
		}
	}

	return map[string]interface{}{
		"id":       m["I"],
		"league":   getStr(m, "L"),
		"sport":    getStr(m, "SE"),
		"status":   "live",
		"timeLeft": timeLeft,
		"home":     getStr(m, "O1"),
		"away":     getStr(m, "O2"),
		"homeIcon": iconURL(m["O1IMG"]),
		"awayIcon": iconURL(m["O2IMG"]),
		"score":    score,
		"coef":     coef,
	}
}

func parseTopMatch(m map[string]interface{}) map[string]interface{} {
	sc, _ := m["SC"].(map[string]interface{})
	var score *string
	if sc != nil {
		if fs, ok := sc["FS"].(map[string]interface{}); ok && fs["S1"] != nil {
			s := fmt.Sprintf("%v-%v", fs["S1"], fs["S2"])
			score = &s
		} else if ss, ok := sc["SS"].(map[string]interface{}); ok && ss["S1"] != nil {
			s := fmt.Sprintf("%v-%v", ss["S1"], ss["S2"])
			score = &s
		}
	}

	events, _ := m["E"].([]interface{})
	coef := map[string]interface{}{"home": nil, "draw": nil, "away": nil}

	oddsGS1 := map[float64]interface{}{}
	for _, ev := range events {
		e, ok := ev.(map[string]interface{})
		if !ok {
			continue
		}
		gs, _ := e["GS"].(float64)
		t, _ := e["T"].(float64)
		if gs == 1 && (t == 1 || t == 2 || t == 3) {
			oddsGS1[t] = e["C"]
		}
	}
	if len(oddsGS1) > 0 {
		coef["home"] = oddsGS1[1]
		coef["draw"] = oddsGS1[2]
		coef["away"] = oddsGS1[3]
	}

	timeLeft := "LIVE"
	if sc != nil {
		if sls, ok := sc["SLS"]; ok && sls != nil {
			timeLeft = fmt.Sprintf("%v", sls)
		}
	}

	league := getStr(m, "L")
	if league == "" {
		league = getStr(m, "LE")
	}
	sport := getStr(m, "SE")
	if sport == "" {
		sport = "Football"
	}

	return map[string]interface{}{
		"id":       m["I"],
		"league":   league,
		"sport":    sport,
		"status":   "live",
		"timeLeft": timeLeft,
		"home":     getStr(m, "O1"),
		"away":     getStr(m, "O2"),
		"homeIcon": iconURL(m["O1IMG"]),
		"awayIcon": iconURL(m["O2IMG"]),
		"score":    score,
		"coef":     coef,
	}
}

func (h *LiveHandler) circuitOpen(key string) bool {
	v, ok := h.circuit.Load(key)
	if !ok {
		return false
	}
	return time.Since(v.(time.Time)) < circuitOpenSecs
}

func (h *LiveHandler) circuitTrip(key string) {
	h.circuit.Store(key, time.Now())
}

func (h *LiveHandler) circuitReset(key string) {
	h.circuit.Delete(key)
}

func (h *LiveHandler) readCache(key string) interface{} {
	if v, ok := h.cache.Load(key); ok {
		return v.(cacheEntry).data
	}
	return nil
}

func (h *LiveHandler) refreshSport(key string) {
	if h.circuitOpen(key) {
		return
	}
	cfg := sportsConfig[key]
	time.Sleep(time.Duration(rand.Intn(3000)) * time.Millisecond)

	raw := h.fetchRaw(cfg.URL)
	if raw == nil {
		h.circuitTrip(key)
		return
	}

	matches := []map[string]interface{}{}
	for _, m := range raw {
		if getStr(m, "SE") == cfg.Name {
			matches = append(matches, parseMatch(m, cfg.OddsType))
			if len(matches) >= 50 {
				break
			}
		}
	}

	if len(matches) > 0 {
		h.cache.Store(key, cacheEntry{data: matches, ts: time.Now()})
		h.circuitReset(key)
		h.preSerialize(key, matches)
	}
}

func (h *LiveHandler) refreshTop() {
	if h.circuitOpen("_top") {
		return
	}
	time.Sleep(time.Duration(rand.Intn(2000)) * time.Millisecond)

	raw := h.fetchRaw(topGamesURL)
	if raw == nil {
		h.circuitTrip("_top")
		return
	}

	matches := []map[string]interface{}{}
	for _, m := range raw {
		matches = append(matches, parseTopMatch(m))
	}

	if len(matches) > 0 {
		h.cache.Store("_top", cacheEntry{data: matches, ts: time.Now()})
		h.circuitReset("_top")
		h.preSerialize("_top", matches)
	}
}

func (h *LiveHandler) refreshCounts() {
	if h.circuitOpen("_counts") {
		return
	}
	time.Sleep(time.Duration(rand.Intn(1000)) * time.Millisecond)

	raw := h.fetchRaw(countsURL)
	if raw == nil {
		h.circuitTrip("_counts")
		return
	}

	totals := map[string]int{}
	for _, s := range raw {
		name := getStr(s, "N")
		if key, ok := countsMap[name]; ok {
			c, _ := s["C"].(float64)
			totals[key] += int(c)
		}
	}

	h.cache.Store("_counts", cacheEntry{data: totals, ts: time.Now()})
	h.circuitReset("_counts")
	h.preSerialize("_counts", totals)
}

func (h *LiveHandler) refreshRecommendationsSport(sportKey string) {
	cfg := eventsstatSports[sportKey]
	now := time.Now()
	type scoredMatch struct {
		m     map[string]interface{}
		score int
	}
	var all []scoredMatch

	eventsstatBase := "https://eventsstat.com/en/services-api/core-api/v1/daygames"
	eventsstatCDN := "https://eventsstat.com"

	for dayOffset := 0; dayOffset < recommendDays; dayOffset++ {
		date := now.AddDate(0, 0, dayOffset).Format("02.01.2006")
		u := fmt.Sprintf("%s?sportId=%d&timeZone=3&lng=en&ref=233&gr=789&fcountry=197&page=1&date=%s",
			eventsstatBase, cfg.ID, date)

		req, _ := http.NewRequest("GET", u, nil)
		req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15")
		req.Header.Set("Accept", "application/json")
		req.Header.Set("Referer", "https://eventsstat.com/en/statistic/")

		resp, err := h.httpClient.Do(req)
		if err != nil {
			continue
		}
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		var data struct {
			Teams  []map[string]interface{} `json:"teams"`
			Entity struct {
				Stages []map[string]interface{} `json:"stages"`
			} `json:"entity"`
		}
		if json.Unmarshal(body, &data) != nil {
			continue
		}

		teamsById := map[interface{}]map[string]interface{}{}
		for _, t := range data.Teams {
			teamsById[t["id"]] = t
		}

		for _, stage := range data.Entity.Stages {
			si, _ := stage["stage"].(map[string]interface{})
			if si == nil {
				continue
			}
			league := getStr(si, "title")
			leagueScore := 0
			lt := strings.ToLower(league)
			for _, kw := range cfg.Keywords {
				if strings.Contains(lt, kw) {
					leagueScore = 100
					break
				}
			}

			games, _ := stage["games"].([]interface{})
			for _, gi := range games {
				g, ok := gi.(map[string]interface{})
				if !ok {
					continue
				}
				t1 := teamsById[g["team1"]]
				t2 := teamsById[g["team2"]]

				var homeIcon, awayIcon *string
				if t1 != nil {
					if img := getStr(t1, "image"); img != "" {
						full := eventsstatCDN + img
						homeIcon = &full
					}
				}
				if t2 != nil {
					if img := getStr(t2, "image"); img != "" {
						full := eventsstatCDN + img
						awayIcon = &full
					}
				}

				home := "?"
				away := "?"
				if t1 != nil {
					home = getStr(t1, "title")
				}
				if t2 != nil {
					away = getStr(t2, "title")
				}

				ds, _ := g["dateStart"].(float64)
				kickoff := time.Unix(int64(ds), 0)
				var timeLabel string
				switch dayOffset {
				case 0:
					timeLabel = fmt.Sprintf("Today %s", kickoff.Format("15:04"))
				case 1:
					timeLabel = fmt.Sprintf("Tomorrow %s", kickoff.Format("15:04"))
				default:
					timeLabel = kickoff.Format("Mon 15:04")
				}

				s := leagueScore + (recommendDays-dayOffset)*20
				all = append(all, scoredMatch{
					m: map[string]interface{}{
						"id":       fmt.Sprintf("rec_%v", g["id"]),
						"league":   league,
						"sport":    cfg.Name,
						"status":   "upcoming",
						"timeLeft": timeLabel,
						"home":     home,
						"away":     away,
						"homeIcon": homeIcon,
						"awayIcon": awayIcon,
						"score":    nil,
						"coef":     map[string]interface{}{"home": nil, "draw": nil, "away": nil},
					},
					score: s,
				})
			}
		}
	}

	if len(all) == 0 {
		return
	}

	for i := 0; i < len(all)-1; i++ {
		for j := i + 1; j < len(all); j++ {
			if all[j].score > all[i].score {
				all[i], all[j] = all[j], all[i]
			}
		}
	}

	top := make([]map[string]interface{}, 0, recommendTopN)
	for i := 0; i < len(all) && i < recommendTopN; i++ {
		top = append(top, all[i].m)
	}

	h.cache.Store("_rec_"+sportKey, cacheEntry{data: top, ts: time.Now()})
	fmt.Printf("[REC] %s: cached top %d upcoming\n", sportKey, len(top))
}

func (h *LiveHandler) bgRefresh(ctx context.Context) {
	defer h.wg.Done()
	h.doRefresh()
	for {
		sleepSec := 25 + rand.Intn(15)
		select {
		case <-ctx.Done():
			return
		case <-time.After(time.Duration(sleepSec) * time.Second):
			h.doRefresh()
		}
	}
}

func (h *LiveHandler) doRefresh() {
	var wg sync.WaitGroup
	for key := range sportsConfig {
		wg.Add(1)
		go func(k string) {
			defer wg.Done()
			h.refreshSport(k)
		}(key)
	}
	wg.Add(1)
	go func() { defer wg.Done(); h.refreshTop() }()
	wg.Add(1)
	go func() { defer wg.Done(); h.refreshCounts() }()
	wg.Wait()
	h.rebuildAllCache()
}

func (h *LiveHandler) rebuildAllCache() {
	seen := map[interface{}]bool{}
	results := []map[string]interface{}{}
	for _, key := range []string{"football", "basketball", "tennis", "hockey"} {
		if data := h.readCache(key); data != nil {
			if matches, ok := data.([]map[string]interface{}); ok {
				for _, m := range matches {
					if !seen[m["id"]] {
						seen[m["id"]] = true
						results = append(results, m)
					}
				}
			}
		}
	}
	h.preSerialize("_all", results)
}

func (h *LiveHandler) bgRefreshRecommendations(ctx context.Context) {
	defer h.wg.Done()
	h.doRefreshRecommendations()
	for {
		select {
		case <-ctx.Done():
			return
		case <-time.After(recommendTTL / 2):
			h.doRefreshRecommendations()
		}
	}
}

func (h *LiveHandler) doRefreshRecommendations() {
	var wg sync.WaitGroup
	for key := range eventsstatSports {
		wg.Add(1)
		go func(k string) {
			defer wg.Done()
			h.refreshRecommendationsSport(k)
		}(key)
	}
	wg.Wait()
	h.rebuildRecommendedCache()
}

func (h *LiveHandler) rebuildRecommendedCache() {
	result := map[string]interface{}{}
	for key := range eventsstatSports {
		data := h.readCache("_rec_" + key)
		if data == nil {
			data = []map[string]interface{}{}
		}
		result[key] = data
	}
	h.preSerialize("_recommended", result)
}

func (h *LiveHandler) preSerialize(key string, data interface{}) {
	b, err := json.Marshal(data)
	if err != nil {
		return
	}
	h.jsonCache.Store(key, b)
}

func (h *LiveHandler) writePreCached(w http.ResponseWriter, key string, fallback interface{}) {
	if cached, ok := h.jsonCache.Load(key); ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write(cached.([]byte))
		return
	}
	writeJSON(w, http.StatusOK, fallback)
}

func (h *LiveHandler) Counts(w http.ResponseWriter, r *http.Request) {
	h.writePreCached(w, "_counts", map[string]int{})
}

func (h *LiveHandler) Match(w http.ResponseWriter, r *http.Request) {
	data := h.readCache("football")
	if data == nil {
		data = h.readCache("_top")
	}
	if matches, ok := data.([]map[string]interface{}); ok && len(matches) > 0 {
		writeJSON(w, http.StatusOK, matches[0])
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"error": "No matches"})
}

func (h *LiveHandler) Football(w http.ResponseWriter, r *http.Request) {
	h.writePreCached(w, "football", []map[string]interface{}{})
}

func (h *LiveHandler) All(w http.ResponseWriter, r *http.Request) {
	h.writePreCached(w, "_all", []map[string]interface{}{})
}

func (h *LiveHandler) Home(w http.ResponseWriter, r *http.Request) {
	h.writePreCached(w, "_top", []map[string]interface{}{})
}

func (h *LiveHandler) Recommended(w http.ResponseWriter, r *http.Request) {
	h.writePreCached(w, "_recommended", map[string]interface{}{})
}

func (h *LiveHandler) Status(w http.ResponseWriter, r *http.Request) {
	now := time.Now()
	info := map[string]interface{}{}
	h.cache.Range(func(key, value interface{}) bool {
		e := value.(cacheEntry)
		age := int(now.Sub(e.ts).Seconds())
		count := 0
		switch d := e.data.(type) {
		case []map[string]interface{}:
			count = len(d)
		case map[string]int:
			count = len(d)
		}
		info[key.(string)] = map[string]interface{}{"items": count, "age_sec": age}
		return true
	})

	workerHealth := map[string]string{}
	for _, w := range h.cfWorkerURLs {
		if v, ok := h.workerFailures.Load(w); ok {
			cd := workerCooldownSec - int(now.Sub(v.(time.Time)).Seconds())
			if cd > 0 {
				workerHealth[w] = fmt.Sprintf("cooldown %ds", cd)
				continue
			}
		}
		workerHealth[w] = "ok"
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"cache":   info,
		"workers": workerHealth,
	})
}
