#!/usr/bin/env python3
import asyncio
import gzip, json, os, ssl, time, urllib.request
import concurrent.futures
import threading
from collections import defaultdict
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

CDN   = "https://v3.traincdn.com/resized/size32/sfiles/logo_teams"
HEADERS = {
    "x-app-n": "__BETTING_APP__",
    "x-svc-source": "__BETTING_APP__",
    "x-requested-with": "XMLHttpRequest",
    "referer": "https://888starz.bet/en",
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36",
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
TOP_CACHE_TTL = 30
FETCH_TIMEOUT = 3
CIRCUIT_OPEN_SECS = 30
DISK_CACHE_FILE = "/tmp/proxy_disk_cache.json"

_cache: dict = {}
_circuit: dict = {}
_bg_lock = threading.Lock()

# ---------------------------------------------------------------------------
# Disk cache: survive proxy restarts
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
# Helpers
# ---------------------------------------------------------------------------
def icon_url(img_list):
    if not img_list: return None
    name = img_list[0].rsplit(".", 1)[0]
    return f"{CDN}/{name}.webp"

def _circuit_open(key: str) -> bool:
    t = _circuit.get(key, 0)
    return (time.time() - t) < CIRCUIT_OPEN_SECS

def _circuit_trip(key: str):
    _circuit[key] = time.time()

def _circuit_reset(key: str):
    _circuit.pop(key, None)

def fetch_raw(url: str) -> list:
    ctx = ssl._create_unverified_context()
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=FETCH_TIMEOUT, context=ctx) as r:
        raw = r.read()
        if r.headers.get("Content-Encoding") == "gzip":
            raw = gzip.decompress(raw)
        return json.loads(raw).get("Value", [])

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
# Background-only refresh (API endpoints NEVER call fetch_raw)
# ---------------------------------------------------------------------------
def _refresh_sport(key: str):
    if _circuit_open(key):
        return
    url, sport_name, odds_type = SPORTS_CONFIG[key]
    try:
        raw = fetch_raw(url)
        fresh = [parse(m, odds_type) for m in raw if m.get("SE") == sport_name][:50]
        if fresh:
            _cache[key] = {"data": fresh, "ts": time.time()}
            _circuit_reset(key)
            _save_disk_cache()
    except Exception:
        _circuit_trip(key)

def _refresh_top():
    if _circuit_open("_top"):
        return
    try:
        raw = fetch_raw(TOP_GAMES_URL)
        fresh = [parse_top(m) for m in raw]
        if fresh:
            _cache["_top"] = {"data": fresh, "ts": time.time()}
            _circuit_reset("_top")
            _save_disk_cache()
    except Exception:
        _circuit_trip("_top")

def _refresh_counts():
    if _circuit_open("_counts"):
        return
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
    except Exception:
        _circuit_trip("_counts")

def _do_refresh():
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
        futs = [ex.submit(_refresh_sport, k) for k in SPORTS_CONFIG]
        futs.append(ex.submit(_refresh_counts))
        futs.append(ex.submit(_refresh_top))
        concurrent.futures.wait(futs, timeout=FETCH_TIMEOUT + 2)

async def _bg_refresh():
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _do_refresh)
    while True:
        await asyncio.sleep(25)
        await loop.run_in_executor(None, _do_refresh)

# ---------------------------------------------------------------------------
# Cache readers (instant, never block on network)
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

# ---------------------------------------------------------------------------
# API endpoints — pure cache reads, zero network blocking
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
