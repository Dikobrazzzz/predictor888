#!/usr/bin/env python3
import asyncio
import gzip, json, os, random, ssl, time, urllib.request, urllib.parse
import concurrent.futures
import threading
from collections import defaultdict
from datetime import datetime, timedelta
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

CDN = "https://v3.traincdn.com/resized/size32/sfiles/logo_teams"

# Cloudflare Worker URLs — primary + backups (comma-separated in env or hardcoded fallback)
_CF_WORKER_ENV = os.environ.get("CF_WORKER_URL", "")
CF_WORKER_URLS: list[str] = [u.strip() for u in _CF_WORKER_ENV.split(",") if u.strip()] if _CF_WORKER_ENV else []
# Backwards-compat alias used in /api/status
CF_WORKER_URL = CF_WORKER_URLS[0] if CF_WORKER_URLS else ""

# Per-worker failure tracking: url -> last_failure_time
_worker_failures: dict[str, float] = {}
WORKER_COOLDOWN_SECS = 60  # skip a worker for 60s after it fails

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
]

def _make_headers():
    return {
        "x-app-n": "__BETTING_APP__",
        "x-svc-source": "__BETTING_APP__",
        "x-requested-with": "XMLHttpRequest",
        "referer": "https://888starz.bet/en",
        "user-agent": random.choice(USER_AGENTS),
        "accept": "application/json, text/plain, */*",
        "accept-encoding": "gzip, deflate",
    }

SPORTS_CONFIG = {
    "football":   (
        "https://888starz.bet/service-api/LiveFeed/Get1x2_VZip?sports=1&count=50&lng=en&gr=789&mode=4&country=197&partner=233&getEmpty=true",
        "Football", "1x2_g"
    ),
    "basketball": (
        "https://888starz.bet/service-api/LiveFeed/Get1x2_VZip?sports=3&count=40&lng=en&mode=4&country=197&partner=233&getEmpty=true",
        "Basketball", "bball"
    ),
    "tennis": (
        "https://888starz.bet/service-api/LiveFeed/Get1x2_VZip?sports=4&count=40&lng=en&gr=789&mode=4&country=197&partner=233&getEmpty=true&virtualSports=true&noFilterBlockEvent=true",
        "Tennis", "12_g"
    ),
    "hockey": (
        "https://888starz.bet/service-api/LiveFeed/Get1x2_VZip?sports=2&count=40&lng=en&gr=789&mode=4&country=197&partner=233&getEmpty=true&virtualSports=true&noFilterBlockEvent=true",
        "Ice Hockey", "1x2_g"
    ),
}

TOP_GAMES_URL = "https://888starz.bet/service-api/LiveFeed/GetTopGamesStatZip?lng=en&antisports=66&partner=233"
COUNTS_URL = "https://888starz.bet/service-api/LiveFeed/GetSportsShortZip?sports=1,2,3,4&lng=en&gr=789&country=197&partner=233&virtualSports=true&groupChamps=true"
COUNTS_MAP = {
    "Football":   "football",
    "Basketball": "basketball",
    "Tennis":     "tennis",
    "Ice Hockey": "hockey",
}

CACHE_TTL = 30
COUNTS_TTL = 60
FETCH_TIMEOUT = 12
CIRCUIT_OPEN_SECS = 90
DISK_CACHE_FILE = "/tmp/proxy_disk_cache.json"

# ---------------------------------------------------------------------------
# Recommendation system — eventsstat.com upcoming top events
# ---------------------------------------------------------------------------
EVENTSSTAT_BASE = "https://eventsstat.com/en/services-api/core-api/v1/daygames"
EVENTSSTAT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15",
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://eventsstat.com/en/statistic/",
}
EVENTSSTAT_CDN = "https://eventsstat.com"

# (sportId, sport_display_name, top_league_keywords)
EVENTSSTAT_SPORTS = {
    "football":   (1, "Football",   ["champions league", "premier league", "la liga", "bundesliga",
                                      "serie a", "ligue 1", "eredivisie", "primeira liga",
                                      "europa league", "conference league", "serie b"]),
    "hockey":     (2, "Ice Hockey", ["khl", "nhl", "kontinental", "liiga", "shl", "nl "]),
    "basketball": (3, "Basketball", ["nba", "euroleague", "acb", "bbl", "nbl", "lnb"]),
    "tennis":     (4, "Tennis",     ["atp", "wta", "grand slam", "masters"]),
}

RECOMMEND_DAYS    = 4    # aggregate upcoming events over N days
RECOMMEND_TOP_N   = 5    # top N events per sport
RECOMMEND_TTL     = 1800 # cache TTL seconds (30 min)

_cache: dict = {}
_circuit: dict = {}

# ---------------------------------------------------------------------------
# Disk cache
# ---------------------------------------------------------------------------
def _load_disk_cache():
    try:
        if not os.path.exists(DISK_CACHE_FILE):
            return
        with open(DISK_CACHE_FILE, "r") as f:
            saved = json.load(f)
        now = time.time()
        for key, entry in saved.items():
            if entry.get("data"):
                _cache[key] = {"data": entry["data"], "ts": now - CACHE_TTL + 5}
    except Exception:
        pass

def _save_disk_cache():
    try:
        snapshot = {k: {"data": v["data"]} for k, v in _cache.items() if v.get("data")}
        with open(DISK_CACHE_FILE, "w") as f:
            json.dump(snapshot, f)
    except Exception:
        pass

_load_disk_cache()

# ---------------------------------------------------------------------------
# Circuit breaker
# ---------------------------------------------------------------------------
def _circuit_open(key: str) -> bool:
    t = _circuit.get(key, 0)
    return (time.time() - t) < CIRCUIT_OPEN_SECS

def _circuit_trip(key: str):
    _circuit[key] = time.time()

def _circuit_reset(key: str):
    _circuit.pop(key, None)

# ---------------------------------------------------------------------------
# fetch_raw: Worker → Direct → fail
# ---------------------------------------------------------------------------
def _fetch_one_worker(worker_url: str, target_url: str) -> list:
    """Fetch through a single Cloudflare Worker relay."""
    relay = f"{worker_url}?url={urllib.parse.quote(target_url, safe='')}"
    ctx = ssl._create_unverified_context()
    req = urllib.request.Request(relay, headers={"user-agent": random.choice(USER_AGENTS)})
    with urllib.request.urlopen(req, timeout=FETCH_TIMEOUT, context=ctx) as r:
        raw = r.read()
        enc = r.headers.get("Content-Encoding", "")
        if enc == "gzip" or (raw[:2] == b'\x1f\x8b'):
            raw = gzip.decompress(raw)
        return json.loads(raw).get("Value", [])

def _fetch_direct(url: str) -> list:
    """Fetch directly from 888starz.bet."""
    ctx = ssl._create_unverified_context()
    req = urllib.request.Request(url, headers=_make_headers())
    with urllib.request.urlopen(req, timeout=FETCH_TIMEOUT, context=ctx) as r:
        raw = r.read()
        if r.headers.get("Content-Encoding") == "gzip":
            raw = gzip.decompress(raw)
        return json.loads(raw).get("Value", [])

def fetch_raw(url: str) -> list:
    """Try each Worker in round-robin order, skip recently-failed ones, then direct fallback."""
    now = time.time()

    # Shuffle workers so load is spread across them randomly
    workers = list(CF_WORKER_URLS)
    random.shuffle(workers)

    for w in workers:
        # Skip worker if it failed recently
        if now - _worker_failures.get(w, 0) < WORKER_COOLDOWN_SECS:
            continue
        try:
            result = _fetch_one_worker(w, url)
            # Success — clear failure record for this worker
            _worker_failures.pop(w, None)
            return result
        except Exception as e:
            print(f"[WARN] worker {w}: {e}", flush=True)
            _worker_failures[w] = now
            # Try next worker

    # All workers failed or in cooldown — go direct
    return _fetch_direct(url)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def icon_url(img_list):
    if not img_list: return None
    name = img_list[0].rsplit(".", 1)[0]
    return f"{CDN}/{name}.webp"

# ---------------------------------------------------------------------------
# Parsers
# ---------------------------------------------------------------------------
def parse(m: dict, odds_type: str) -> dict:
    sc = m.get("SC") or {}
    score = None
    if sc:
        fs = sc.get("FS", {})
        ss = sc.get("SS", {})
        if fs and fs.get("S1") is not None:
            score = f"{fs.get('S1',0)}-{fs.get('S2',0)}"
        elif ss and ss.get("S1") not in (None, ""):
            score = f"{ss.get('S1',0)}-{ss.get('S2',0)}"

    e = m.get("E", [])
    if odds_type == "1x2_gs":
        odds = {o["T"]: o["C"] for o in e if o.get("GS") == 1}
        coef = {"home": odds.get(1), "draw": odds.get(2), "away": odds.get(3)}
    elif odds_type == "1x2_g":
        odds = {o["T"]: o["C"] for o in e if o.get("G") == 1 and o.get("T") in (1, 2, 3)}
        coef = {"home": odds.get(1), "draw": odds.get(2), "away": odds.get(3)}
    elif odds_type == "bball":
        odds = {o["T"]: o["C"] for o in e if o.get("G") == 101 and o.get("T") in (401, 402)}
        coef = {"home": odds.get(401), "draw": None, "away": odds.get(402)}
    else:
        odds = {o["T"]: o["C"] for o in e if o.get("G") == 1 and o.get("T") in (1, 3)}
        coef = {"home": odds.get(1), "draw": None, "away": odds.get(3)}

    return {
        "id":       m.get("I"),
        "league":   m.get("L", ""),
        "sport":    m.get("SE", ""),
        "status":   "live",
        "timeLeft": sc.get("SLS", "LIVE") if sc else "LIVE",
        "home":     m.get("O1", ""),
        "away":     m.get("O2", ""),
        "homeIcon": icon_url(m.get("O1IMG")),
        "awayIcon": icon_url(m.get("O2IMG")),
        "score":    score,
        "coef":     coef,
    }

def parse_top(m: dict) -> dict:
    sc = m.get("SC") or {}
    score = None
    if sc:
        fs = sc.get("FS", {})
        ss = sc.get("SS", {})
        if fs and fs.get("S1") is not None:
            score = f"{fs.get('S1',0)}-{fs.get('S2',0)}"
        elif ss and ss.get("S1") not in (None, ""):
            score = f"{ss.get('S1',0)}-{ss.get('S2',0)}"

    e = m.get("E", [])
    odds_gs1 = {o["T"]: o["C"] for o in e if o.get("GS") == 1 and o.get("T") in (1, 2, 3)}
    if odds_gs1:
        coef = {"home": odds_gs1.get(1), "draw": odds_gs1.get(2), "away": odds_gs1.get(3)}
    else:
        gs_groups = sorted(set(o.get("GS") for o in e if o.get("GS") is not None))
        coef = {"home": None, "draw": None, "away": None}
        if gs_groups:
            best_gs = gs_groups[0]
            outcomes = sorted(
                [o for o in e if o.get("GS") == best_gs and o.get("C")],
                key=lambda o: o.get("T", 0)
            )
            if len(outcomes) >= 2:
                coef["home"] = outcomes[0]["C"]
                coef["away"] = outcomes[-1]["C"]
            if len(outcomes) == 3:
                coef["draw"] = outcomes[1]["C"]

    return {
        "id":       m.get("I"),
        "league":   m.get("L", "") or m.get("LE", ""),
        "sport":    m.get("SE", "Football"),
        "status":   "live",
        "timeLeft": sc.get("SLS", "LIVE") if sc else "LIVE",
        "home":     m.get("O1", ""),
        "away":     m.get("O2", ""),
        "homeIcon": icon_url(m.get("O1IMG")),
        "awayIcon": icon_url(m.get("O2IMG")),
        "score":    score,
        "coef":     coef,
    }

# ---------------------------------------------------------------------------
# Background-only refresh — API endpoints NEVER block on network
# ---------------------------------------------------------------------------
def _refresh_sport(key: str):
    if _circuit_open(key):
        return
    url, sport_name, odds_type = SPORTS_CONFIG[key]
    time.sleep(random.uniform(0, 3))
    try:
        raw = fetch_raw(url)
        fresh = [parse(m, odds_type) for m in raw if m.get("SE") == sport_name][:50]
        if fresh:
            _cache[key] = {"data": fresh, "ts": time.time()}
            _circuit_reset(key)
            _save_disk_cache()
    except Exception as e:
        print(f"[WARN] {key}: {e}", flush=True)
        _circuit_trip(key)

def _refresh_top():
    if _circuit_open("_top"):
        return
    time.sleep(random.uniform(0, 2))
    try:
        raw = fetch_raw(TOP_GAMES_URL)
        fresh = [parse_top(m) for m in raw]
        if fresh:
            _cache["_top"] = {"data": fresh, "ts": time.time()}
            _circuit_reset("_top")
            _save_disk_cache()
    except Exception as e:
        print(f"[WARN] _top: {e}", flush=True)
        _circuit_trip("_top")

def _refresh_counts():
    if _circuit_open("_counts"):
        return
    time.sleep(random.uniform(0, 1))
    try:
        raw = fetch_raw(COUNTS_URL)
        totals: dict = defaultdict(int)
        for s in raw:
            name = s.get("N", "")
            if name in COUNTS_MAP:
                totals[COUNTS_MAP[name]] += s.get("C", 0) or 0
        result = dict(totals)
        _cache["_counts"] = {"data": result, "ts": time.time()}
        _circuit_reset("_counts")
        _save_disk_cache()
    except Exception as e:
        print(f"[WARN] _counts: {e}", flush=True)
        _circuit_trip("_counts")

# ---------------------------------------------------------------------------
# Recommendations — fetch + parse + rank upcoming top events
# ---------------------------------------------------------------------------
def _fetch_eventsstat(url: str) -> dict:
    ctx = ssl._create_unverified_context()
    req = urllib.request.Request(url, headers=EVENTSSTAT_HEADERS)
    with urllib.request.urlopen(req, timeout=15, context=ctx) as r:
        return json.load(r)

def _score_league(league_title: str, keywords: list) -> int:
    lt = league_title.lower()
    for kw in keywords:
        if kw in lt:
            return 100
    return 0

def _format_kickoff(ts: int, day_offset: int) -> str:
    """Convert unix timestamp to readable time label for upcoming events."""
    dt = datetime.fromtimestamp(ts)
    hm = dt.strftime("%H:%M")
    if day_offset == 0:
        return f"Today {hm}"
    if day_offset == 1:
        return f"Tomorrow {hm}"
    return dt.strftime(f"%a {hm}")   # e.g. "Sun 17:30"

def _refresh_recommendations_sport(sport_key: str):
    sport_id, sport_name, kw = EVENTSSTAT_SPORTS[sport_key]
    today = datetime.now()
    all_matches = []

    for day_offset in range(RECOMMEND_DAYS):
        date_str = (today + timedelta(days=day_offset)).strftime("%d.%m.%Y")
        url = (f"{EVENTSSTAT_BASE}?sportId={sport_id}&timeZone=3&lng=en"
               f"&ref=233&gr=789&fcountry=197&page=1&date={date_str}")
        try:
            data = _fetch_eventsstat(url)
        except Exception as e:
            print(f"[REC WARN] {sport_key} day+{day_offset}: {e}", flush=True)
            continue

        teams_by_id = {t["id"]: t for t in data.get("teams", [])}
        entity = data.get("entity", {})

        for stage in entity.get("stages", []):
            si    = stage.get("stage", {})
            league = si.get("title", "")
            league_score = _score_league(league, kw)

            for g in stage.get("games", []):
                t1_obj = teams_by_id.get(g.get("team1", ""), {})
                t2_obj = teams_by_id.get(g.get("team2", ""), {})
                t1_img = t1_obj.get("image")
                t2_img = t2_obj.get("image")

                score = league_score + (RECOMMEND_DAYS - day_offset) * 20
                all_matches.append({
                    "id":        f"rec_{g.get('id', '')}",
                    "league":    league,
                    "sport":     sport_name,
                    "status":    "upcoming",
                    "timeLeft":  _format_kickoff(g.get("dateStart", 0), day_offset),
                    "home":      t1_obj.get("title", "?"),
                    "away":      t2_obj.get("title", "?"),
                    "homeIcon":  (EVENTSSTAT_CDN + t1_img) if t1_img else None,
                    "awayIcon":  (EVENTSSTAT_CDN + t2_img) if t2_img else None,
                    "score":     None,
                    "coef":      {"home": None, "draw": None, "away": None},
                    "_score":    score,
                })

    if not all_matches:
        return

    all_matches.sort(key=lambda m: -m["_score"])
    top = all_matches[:RECOMMEND_TOP_N]
    for m in top:
        m.pop("_score", None)

    _cache[f"_rec_{sport_key}"] = {"data": top, "ts": time.time()}
    print(f"[REC] {sport_key}: cached top {len(top)} upcoming", flush=True)

def _do_refresh_recommendations():
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
        futs = [ex.submit(_refresh_recommendations_sport, k) for k in EVENTSSTAT_SPORTS]
        concurrent.futures.wait(futs, timeout=60)

async def _bg_refresh_recommendations():
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _do_refresh_recommendations)
    while True:
        await asyncio.sleep(RECOMMEND_TTL // 2)   # refresh every 15 min
        await loop.run_in_executor(None, _do_refresh_recommendations)

# ---------------------------------------------------------------------------

def _do_refresh():
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
        futs = [ex.submit(_refresh_sport, k) for k in SPORTS_CONFIG]
        futs.append(ex.submit(_refresh_counts))
        futs.append(ex.submit(_refresh_top))
        # Wait max FETCH_TIMEOUT + jitter buffer
        concurrent.futures.wait(futs, timeout=FETCH_TIMEOUT + 5)

async def _bg_refresh():
    loop = asyncio.get_event_loop()
    # Initial warm-up
    await loop.run_in_executor(None, _do_refresh)
    while True:
        # Randomized interval: 25–40 seconds
        sleep_sec = 25 + random.uniform(0, 15)
        await asyncio.sleep(sleep_sec)
        await loop.run_in_executor(None, _do_refresh)

# ---------------------------------------------------------------------------
# Cache readers — instant, never block on network
# ---------------------------------------------------------------------------
def _read_cache(key: str) -> list:
    entry = _cache.get(key)
    return entry["data"] if entry and entry.get("data") else []

def _read_all() -> list:
    results, seen = [], set()
    for key in SPORTS_CONFIG:
        for m in _read_cache(key):
            if m["id"] not in seen:
                seen.add(m["id"])
                results.append(m)
    order = list(SPORTS_CONFIG.keys())
    sport_of = {v[1]: k for k, v in SPORTS_CONFIG.items()}
    results.sort(key=lambda m: order.index(sport_of.get(m["sport"], "football")))
    return results

# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def startup():
    asyncio.create_task(_bg_refresh())
    asyncio.create_task(_bg_refresh_recommendations())

# ---------------------------------------------------------------------------
# API endpoints — pure cache reads
# ---------------------------------------------------------------------------
@app.get("/api/live/counts")
def live_counts():
    entry = _cache.get("_counts")
    return entry["data"] if entry and entry.get("data") else {}

@app.get("/api/live/match")
def live_match():
    items = _read_cache("football") or _read_cache("_top")
    return items[0] if items else {"error": "No matches"}

@app.get("/api/live/football")
def live_football():
    return _read_cache("football")

@app.get("/api/live/all")
def live_all():
    return _read_all()

@app.get("/api/live/home")
def live_home():
    return _read_cache("_top")

@app.get("/api/live/matches")
def live_matches():
    return _read_cache("football")

@app.get("/api/recommended")
def recommended():
    """Top upcoming events per sport from eventsstat.com."""
    result = {}
    for sport_key in EVENTSSTAT_SPORTS:
        entry = _cache.get(f"_rec_{sport_key}")
        result[sport_key] = entry["data"] if entry and entry.get("data") else []
    return result

@app.get("/api/status")
def status():
    """Show cache status and circuit breaker state."""
    now = time.time()
    info = {}
    for k, v in _cache.items():
        age = int(now - v.get("ts", 0))
        info[k] = {"items": len(v.get("data", [])), "age_sec": age}
    worker_health = {}
    for w in CF_WORKER_URLS:
        last_fail = _worker_failures.get(w, 0)
        cooldown_left = max(0, int(WORKER_COOLDOWN_SECS - (now - last_fail)))
        worker_health[w] = "ok" if cooldown_left == 0 else f"cooldown {cooldown_left}s"

    rec_info = {}
    for sport_key in EVENTSSTAT_SPORTS:
        entry = _cache.get(f"_rec_{sport_key}")
        if entry:
            rec_info[sport_key] = {"items": len(entry.get("data", [])), "age_sec": int(now - entry.get("ts", 0))}
        else:
            rec_info[sport_key] = {"items": 0, "age_sec": -1}

    return {
        "cache": info,
        "circuits_open": {k: int(now - t) for k, t in _circuit.items() if (now - t) < CIRCUIT_OPEN_SECS},
        "workers": worker_health or {"status": "NOT SET"},
        "recommendations": rec_info,
    }
