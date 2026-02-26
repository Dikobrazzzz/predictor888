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

# odds_type legend:
#   "1x2_gs"  GetTopGamesStatZip: GS==1, T=1 home, T=2 draw, T=3 away
#   "1x2_g"   Get1x2_VZip 1X2:   G==1,  T=1 home, T=2 draw, T=3 away  (hockey)
#   "12_g"    Get1x2_VZip 2-way: G==1,  T=1 home, T=3 away            (tennis)
#   "bball"   Get1x2_VZip bball: G==101, T=401 home, T=402 away
SPORTS_CONFIG = {
    "football":   (
        "https://888starz.bet/service-api/LiveFeed/GetTopGamesStatZip?lng=en&antisports=66&partner=233&sports=1",
        "Football", "1x2_gs"
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
TOP_CACHE_TTL = 30

COUNTS_URL = "https://888starz.bet/service-api/LiveFeed/GetSportsShortZip?sports=1,2,3,4&lng=en&gr=789&country=197&partner=233&virtualSports=true&groupChamps=true"
# Map API sport names → our keys
COUNTS_MAP = {
    "Football":   "football",
    "Basketball": "basketball",
    "Tennis":     "tennis",
    "Ice Hockey": "hockey",
}

_cache: dict = {}
CACHE_TTL = 30
COUNTS_TTL = 60
DISK_CACHE_FILE = "/tmp/proxy_disk_cache.json"

# One lock per sport key + one for counts + one for top games — prevents thundering herd
_locks: dict = {k: threading.Lock() for k in ("football", "basketball", "tennis", "hockey", "_counts", "_top")}

def _load_disk_cache():
    """Pre-populate in-memory cache from disk on startup — zero cold-start delay."""
    try:
        if not os.path.exists(DISK_CACHE_FILE):
            return
        with open(DISK_CACHE_FILE, "r") as f:
            saved = json.load(f)
        now = time.time()
        for key, entry in saved.items():
            # Load stale data — background refresh will update it soon
            _cache[key] = {"data": entry["data"], "ts": now - CACHE_TTL + 5}
    except Exception:
        pass

def _save_disk_cache():
    """Persist current in-memory cache to disk after each refresh cycle."""
    try:
        snapshot = {k: {"data": v["data"]} for k, v in _cache.items() if v.get("data")}
        with open(DISK_CACHE_FILE, "w") as f:
            json.dump(snapshot, f)
    except Exception:
        pass

_load_disk_cache()

def icon_url(img_list):
    if not img_list: return None
    name = img_list[0].rsplit(".", 1)[0]
    return f"{CDN}/{name}.webp"

def fetch_raw(url: str) -> list:
    ctx = ssl._create_unverified_context()
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=8, context=ctx) as r:
        raw = r.read()
        if r.headers.get("Content-Encoding") == "gzip":
            raw = gzip.decompress(raw)
        return json.loads(raw).get("Value", [])

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
    else:  # "12_g" tennis
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
    """Parse a match from GetTopGamesStatZip (all sports, no sport filter).
    Tries GS==1 (1x2) first, then falls back to the first available GS group."""
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

    # Try standard 1x2 (GS==1)
    odds_gs1 = {o["T"]: o["C"] for o in e if o.get("GS") == 1 and o.get("T") in (1, 2, 3)}
    if odds_gs1:
        coef = {
            "home": odds_gs1.get(1),
            "draw": odds_gs1.get(2),
            "away": odds_gs1.get(3),
        }
    else:
        # Fallback: find lowest GS group and map first 2-3 outcomes
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

def get_top_cached() -> list:
    """Fetch and cache the 5 top games from GetTopGamesStatZip (no sport filter)."""
    entry = _cache.get("_top")
    if entry and (time.time() - entry["ts"]) < TOP_CACHE_TTL:
        return entry["data"]
    with _locks["_top"]:
        entry = _cache.get("_top")
        if entry and (time.time() - entry["ts"]) < TOP_CACHE_TTL:
            return entry["data"]
        try:
            raw = fetch_raw(TOP_GAMES_URL)
            fresh = [parse_top(m) for m in raw]
            if fresh:
                _cache["_top"] = {"data": fresh, "ts": time.time()}
                return fresh
        except Exception:
            pass
        return entry["data"] if entry else []

def get_cached(key: str) -> list:
    url, sport_name, odds_type = SPORTS_CONFIG[key]
    # Fast path: cache is fresh, no lock needed
    entry = _cache.get(key)
    if entry and (time.time() - entry["ts"]) < CACHE_TTL:
        return entry["data"]
    # Slow path: only one thread fetches, others wait then reuse result
    with _locks[key]:
        entry = _cache.get(key)  # double-check after acquiring lock
        if entry and (time.time() - entry["ts"]) < CACHE_TTL:
            return entry["data"]
        try:
            raw = fetch_raw(url)
            fresh = [parse(m, odds_type) for m in raw if m.get("SE") == sport_name][:40]
            if fresh:
                _cache[key] = {"data": fresh, "ts": time.time()}
                return fresh
        except Exception:
            pass
        return entry["data"] if entry else []

def get_counts_cached() -> dict:
    """Returns {football: N, basketball: N, tennis: N, hockey: N} from GetSportsShortZip."""
    entry = _cache.get("_counts")
    if entry and (time.time() - entry["ts"]) < COUNTS_TTL:
        return entry["data"]
    with _locks["_counts"]:
        entry = _cache.get("_counts")
        if entry and (time.time() - entry["ts"]) < COUNTS_TTL:
            return entry["data"]
        try:
            raw = fetch_raw(COUNTS_URL)
            totals: dict = defaultdict(int)
            for s in raw:
                name = s.get("N", "")
                if name in COUNTS_MAP:
                    totals[COUNTS_MAP[name]] += s.get("C", 0) or 0
            result = dict(totals)
            _cache["_counts"] = {"data": result, "ts": time.time()}
            return result
        except Exception:
            return entry["data"] if entry else {}

def fetch_all() -> list:
    """Up to 40 matches per sport for Events page."""
    results, seen = [], set()
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
        futures = {ex.submit(get_cached, k): k for k in SPORTS_CONFIG}
        for fut in concurrent.futures.as_completed(futures):
            for m in fut.result():
                if m["id"] not in seen:
                    seen.add(m["id"])
                    results.append(m)
    order = list(SPORTS_CONFIG.keys())
    sport_of = {v[1]: k for k, v in SPORTS_CONFIG.items()}
    results.sort(key=lambda m: order.index(sport_of.get(m["sport"], "football")))
    return results

def fetch_home() -> list:
    """Top 5 events from GetTopGamesStatZip (dedicated endpoint, always 5)."""
    return get_top_cached()

async def _bg_refresh():
    """Warm up cache on startup, then refresh every 25 s in background."""
    # Initial warm-up: fetch all sports + top games in parallel
    loop = asyncio.get_event_loop()
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
        futs = [loop.run_in_executor(ex, get_cached, k) for k in SPORTS_CONFIG]
        futs.append(loop.run_in_executor(ex, get_counts_cached))
        futs.append(loop.run_in_executor(ex, get_top_cached))
        await asyncio.gather(*futs, return_exceptions=True)

    while True:
        await asyncio.sleep(25)
        loop = asyncio.get_event_loop()
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
            futs = [loop.run_in_executor(ex, get_cached, k) for k in SPORTS_CONFIG]
            futs.append(loop.run_in_executor(ex, get_counts_cached))
            futs.append(loop.run_in_executor(ex, get_top_cached))
            await asyncio.gather(*futs, return_exceptions=True)
        _save_disk_cache()

@app.on_event("startup")
async def startup():
    asyncio.create_task(_bg_refresh())

@app.get("/api/live/counts")
def live_counts():
    """Real live match counts per sport from GetSportsShortZip."""
    try:
        return get_counts_cached()
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/live/match")
def live_match():
    try:
        items = get_cached("football") or fetch_home()
        return items[0] if items else {"error": "No matches"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/live/football")
def live_football():
    try:
        return get_cached("football")
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/live/all")
def live_all():
    try:
        return fetch_all()
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/live/home")
def live_home():
    try:
        return fetch_home()
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/live/matches")
def live_matches():
    return live_football()
