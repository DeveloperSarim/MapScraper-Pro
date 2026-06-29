// MapScraper Pro — main app
const { useState, useEffect, useMemo, useRef, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "sage",
  "satellite": false
}/*EDITMODE-END*/;

const ACCENTS = {
  sage:   { a: "oklch(0.55 0.08 175)", aI: "oklch(0.32 0.06 175)", aS: "oklch(0.94 0.025 175)", aL: "oklch(0.85 0.04 175)" },
  ink:    { a: "oklch(0.30 0.02 80)",  aI: "oklch(0.20 0.02 80)",  aS: "oklch(0.94 0.005 80)",  aL: "oklch(0.85 0.01 80)"  },
  amber:  { a: "oklch(0.65 0.13 65)",  aI: "oklch(0.40 0.10 65)",  aS: "oklch(0.95 0.04 65)",   aL: "oklch(0.87 0.06 65)"  },
  violet: { a: "oklch(0.55 0.13 290)", aI: "oklch(0.36 0.10 290)", aS: "oklch(0.95 0.03 290)",  aL: "oklch(0.86 0.05 290)" },
};

function App() {
  const [t, setT] = useTweaks(TWEAK_DEFAULTS);

  const [lang, setLang] = useState("en");
  const [geo, setGeo] = useState({ country: "🇸🇦 Saudi Arabia", city: "Jeddah", districts: [], areas: [] });
  const [categories, setCategories] = useState(window.DEFAULT_CATEGORIES);
  const [keywords, setKeywords] = useState(window.DEFAULT_KEYWORDS);
  const [radius, setRadius] = useState("5 km");
  const [maxResults, setMaxResults] = useState(250);

  const [businesses, setBusinesses] = useState([]);
  const [running, setRunning] = useState(false);
  const [found, setFound] = useState(0);
  const [logIdx, setLogIdx] = useState(0);

  const loadRecents = () => {
    try { return JSON.parse(localStorage.getItem("msp_recents") || "[]"); } catch { return []; }
  };
  const [recentSearches, setRecentSearches] = useState(loadRecents);

  const saveRecent = (cats, geoVal, count) => {
    const entry = {
      cat: cats[0] || "Search",
      loc: geoVal.city || "",
      count,
      geo: geoVal,
      cats,
      ts: Date.now(),
    };
    const prev = loadRecents().filter(r => !(r.cat === entry.cat && r.loc === entry.loc));
    const next = [entry, ...prev].slice(0, 8);
    localStorage.setItem("msp_recents", JSON.stringify(next));
    setRecentSearches(next);
  };

  const [view, setView] = useState("split");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [emptyState, setEmptyState] = useState(true);

  const [filterOpen, setFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [bulkWAOpen, setBulkWAOpen] = useState(false);

  const [sortBy, setSortBy] = useState("rating");
  const [sortDir, setSortDir] = useState("desc");

  const [toast, setToast] = useState(null);
  const [mobSideOpen, setMobSideOpen] = useState(false);

  const [satellite, setSatellite] = useState(t.satellite);
  const [mapMode, setMapMode] = useState("split");

  const [pinSearch, setPinSearch] = useState(null);
  const [polygonSearch, setPolygonSearch] = useState(null);
  // null | { polygon: [{lat,lng}], active: boolean }

  // Filter state
  const [fRatingMin, setFRatingMin] = useState(0);
  const [fHasPhone, setFHasPhone] = useState("any");
  const [fHasEmail, setFHasEmail] = useState("any");
  const [fHasWebsite, setFHasWebsite] = useState("any");
  const [fStatus, setFStatus] = useState("any");
  const [fCats, setFCats] = useState([]);
  const [fPrice, setFPrice] = useState([]);
  const [fMinReviews, setFMinReviews] = useState(0);

  // Pre-filter chips
  const [pfPhone, setPfPhone] = useState(false);
  const [pfEmail, setPfEmail] = useState(false);
  const [pfWebsite, setPfWebsite] = useState(false);
  const [pfOpen, setPfOpen] = useState(false);
  const [pfRated, setPfRated] = useState(false);

  // Scraping abort controller
  const abortRef = useRef(null);

  useEffect(() => {
    const a = ACCENTS[t.accent] || ACCENTS.sage;
    const r = document.documentElement.style;
    r.setProperty("--accent", a.a);
    r.setProperty("--accent-ink", a.aI);
    r.setProperty("--accent-soft", a.aS);
    r.setProperty("--accent-line", a.aL);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [t.accent, lang]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(id);
  }, [toast]);

  // Build human-readable location string for the backend search query
  const buildLocationString = (geoVal) => {
    const areas      = geoVal?.areas      || [];
    const districts  = geoVal?.districts  || [];
    const city       = geoVal?.city       || "";
    const countryName = (geoVal?.country || "").replace(/^\S+\s+/, "").trim();
    const parts = [];
    if (areas.length === 1)          parts.push(areas[0]);
    else if (districts.length === 1) parts.push(districts[0]);
    else if (districts.length > 1)   parts.push(...districts.slice(0, 2));
    if (city) parts.push(city);
    if (countryName) parts.push(countryName);
    return parts.join(", ");
  };

  // Resolve coordinates: use pre-built DISTRICT_CENTERS first (fastest),
  // then fall back to Nominatim, then city center
  const resolveSearchCoords = async (geoVal) => {
    const cityC = window.CITY_CENTERS?.[geoVal?.city];
    if (!cityC) return null;

    const areas     = geoVal?.areas     || [];
    const districts = geoVal?.districts || [];
    const singleArea     = areas.length === 1;
    const singleDistrict = districts.length === 1 && areas.length === 0;

    if (!singleArea && !singleDistrict) return { lat: cityC.lat, lng: cityC.lng };

    const targetName   = singleArea ? areas[0] : districts[0];
    const parentDistrict = districts[0] || ""; // used when area selected but not in lookup

    // 1️⃣ Pre-built lookup — instant, reliable, no network call
    const prebuilt = window.DISTRICT_CENTERS?.[targetName]
                  || window.DISTRICT_CENTERS?.[parentDistrict]; // area → fall back to parent district
    if (prebuilt) return { lat: prebuilt.lat, lng: prebuilt.lng };

    // 2️⃣ Nominatim geocoding — strip parenthetical suffixes that confuse OSM
    try {
      const countryName = (geoVal?.country || "").replace(/^\S+\s+/, "").trim();
      const cleanName = targetName.replace(/\s*\([^)]*\)/g, "").trim(); // strip "(North Obhur)" etc.
      const term = `${cleanName}, ${geoVal.city}, ${countryName}`;
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(term)}&format=json&limit=1`,
        { signal: AbortSignal.timeout(4000) }
      );
      const data = await res.json();
      if (data[0]) return { lat: +data[0].lat, lng: +data[0].lon };
    } catch (_) {}

    // 3️⃣ City center fallback
    return { lat: cityC.lat, lng: cityC.lng };
  };

  // Helper: resolve coords for a single named target (district or area)
  const resolveTargetCoords = async (targetName, parentDistrict, geoVal) => {
    const prebuilt = window.DISTRICT_CENTERS?.[targetName] || window.DISTRICT_CENTERS?.[parentDistrict];
    if (prebuilt) return { lat: prebuilt.lat, lng: prebuilt.lng };
    try {
      const city = geoVal?.city || "";
      const countryName = (geoVal?.country || "").replace(/^\S+\s+/, "").trim();
      const cleanName = targetName.replace(/\s*\([^)]*\)/g, "").trim();
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${cleanName}, ${city}, ${countryName}`)}&format=json&limit=1`,
        { signal: AbortSignal.timeout(4000) }
      );
      const data = await res.json();
      if (data[0]) return { lat: +data[0].lat, lng: +data[0].lon };
    } catch (_) {}
    const cityC = window.CITY_CENTERS?.[geoVal?.city];
    return cityC ? { lat: cityC.lat, lng: cityC.lng } : null;
  };

  // Point-in-polygon ray-casting
  const pointInPolygon = (lat, lng, poly) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].lat, yi = poly[i].lng;
      const xj = poly[j].lat, yj = poly[j].lng;
      if (((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  };

  // ── Multi-area scrape: one separate scrape per district ───────────────────
  const doMultiScrape = useCallback(async (geoVal, cats, radiusM) => {
    const districts    = geoVal?.districts || [];
    const city         = geoVal?.city || "";
    const countryName  = (geoVal?.country || "").replace(/^\S+\s+/, "").trim();

    setRunning(true);
    setEmptyState(false);
    setBusinesses([]);
    setFound(0);
    setActiveId(null);
    setDetailOpen(false);

    const logTimer = setInterval(() => setLogIdx(x => x + 1), 800);
    let firstResultShown = false;
    let streamedCount = 0;
    let bizIdSeq = 1;
    const uiSeenKeys = new Set();

    const onPhoneUpdate = (name, phone) => {
      setBusinesses(prev => prev.map(b => b.name === name && !b.phone ? { ...b, phone } : b));
    };

    const onBusiness = (b) => {
      const normName = (b.name || "").toLowerCase().replace(/[^a-z0-9؀-ۿ]/g, "").slice(0, 20);
      const coordKey = b.lat ? `${(+b.lat).toFixed(3)}_${(+b.lng).toFixed(3)}` : "";
      if ((normName.length > 4 && uiSeenKeys.has("n_" + normName)) || (coordKey && uiSeenKeys.has("c_" + coordKey))) return;
      if (normName.length > 4) uiSeenKeys.add("n_" + normName);
      if (coordKey) uiSeenKeys.add("c_" + coordKey);
      const biz = { ...b, id: bizIdSeq++ };
      streamedCount++;
      setFound(streamedCount);
      setBusinesses(prev => {
        if (prev.length >= (maxResults >= 500 ? 9999 : maxResults)) return prev;
        if (!firstResultShown) { firstResultShown = true; setActiveId(biz.id); setDetailOpen(true); }
        return [...prev, biz];
      });
    };

    try {
      for (const district of districts) {
        const coords = await resolveTargetCoords(district, "", geoVal);
        if (!coords) continue;
        const locStr = `${district}, ${city}, ${countryName}`;
        setToast(`Scraping ${district}…`);
        await window.fetchBusinessesFromOverpass(coords.lat, coords.lng, radiusM, cats, null, onBusiness, locStr, onPhoneUpdate);
      }
    } catch (err) {
      console.error("Multi-area scrape error:", err);
    } finally {
      clearInterval(logTimer);
      setRunning(false);
      if (streamedCount > 0) {
        setToast(`${streamedCount} businesses found across ${districts.length} areas`);
      } else {
        setToast("No results found — try a larger radius or different category");
        setEmptyState(true);
      }
    }
  }, [maxResults]);

  // ── Single-area scrape ───────────────────────────────────────────────────
  const doScrape = useCallback(async (lat, lng, radiusM, cats, locationStr = "") => {
    setRunning(true);
    setEmptyState(false);
    setBusinesses([]);
    setFound(0);
    setActiveId(null);
    setDetailOpen(false);

    const logTimer = setInterval(() => setLogIdx(x => x + 1), 800);
    let firstResultShown = false;
    let streamedCount = 0;
    let bizIdSeq = 1;

    // Track seen names/coords in the UI to catch any duplicates the backend missed
    const uiSeenKeys = new Set();

    const onPhoneUpdate = (name, phone) => {
      setBusinesses(prev => prev.map(b => b.name === name && !b.phone ? { ...b, phone } : b));
    };

    // onBusiness: called for each result as it streams in from backend
    const onBusiness = (b) => {
      const normName = (b.name || "").toLowerCase().replace(/[^a-z0-9؀-ۿ]/g, "").slice(0, 20);
      const coordKey = b.lat ? `${(+b.lat).toFixed(3)}_${(+b.lng).toFixed(3)}` : "";
      if ((normName.length > 4 && uiSeenKeys.has("n_" + normName)) || (coordKey && uiSeenKeys.has("c_" + coordKey))) return;
      if (normName.length > 4) uiSeenKeys.add("n_" + normName);
      if (coordKey) uiSeenKeys.add("c_" + coordKey);

      const biz = { ...b, id: bizIdSeq++ };
      streamedCount++;
      setFound(streamedCount);
      setBusinesses(prev => {
        if (prev.length >= (maxResults >= 500 ? 9999 : maxResults)) return prev;
        if (!firstResultShown) {
          firstResultShown = true;
          setActiveId(biz.id);
          setDetailOpen(true);
        }
        return [...prev, biz];
      });
    };

    try {
      const results = await window.fetchBusinessesFromOverpass(lat, lng, radiusM, cats, null, onBusiness, locationStr, onPhoneUpdate);
      clearInterval(logTimer);

      // If no streaming happened (OSM path), apply results now
      if (streamedCount === 0) {
        if (results.length === 0) {
          const hasKey = !!(window.GOOGLE_API_KEY || localStorage.getItem("gApiKey") || "").trim();
          const backendOk = window._backendAvailable;
          const msg = backendOk
            ? "No results found — try a larger radius or different category"
            : hasKey
              ? "No businesses found — try a larger radius"
              : "No data in OpenStreetMap — start the backend scraper (see sidebar) for real Google Maps data";
          setToast(msg);
          setEmptyState(true);
        } else {
          const capped = results.slice(0, maxResults >= 500 ? 9999 : maxResults).map((b, i) => ({ ...b, id: i + 1 }));
          setBusinesses(capped);
          setFound(capped.length);
          setActiveId(capped[0]?.id ?? null);
          setDetailOpen(true);
          setToast(`${capped.length} businesses found`);
          saveRecent(cats, geo, capped.length);
        }
      } else {
        setFound(streamedCount);
        setToast(`${streamedCount} businesses found`);
        saveRecent(cats, locationStr ? geo : geo, streamedCount);
      }
    } catch (err) {
      clearInterval(logTimer);
      console.error("Scrape error:", err);
      const msg = err.message?.includes("Google API") || err.message?.includes("quota")
        ? err.message
        : "Search failed — check your connection and try again";
      setToast(msg);
      if (streamedCount === 0) setEmptyState(true);
    } finally {
      setRunning(false);
    }
  }, [maxResults]);

  const sorted = useMemo(() => {
    const arr = [...businesses];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      const va = a[sortBy] ?? a.name, vb = b[sortBy] ?? b.name;
      if (typeof va === "string") return va.localeCompare(vb) * dir;
      return (va - vb) * dir;
    });
    return arr;
  }, [businesses, sortBy, sortDir]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const poly = polygonSearch?.polygon;
    return sorted.filter(b => {
      if (q && !(b.name + b.category + b.address).toLowerCase().includes(q)) return false;
      if (b.rating < fRatingMin) return false;
      if (pfPhone && !b.phone) return false;
      if (pfEmail && !b.email) return false;
      if (pfWebsite && !b.website) return false;
      if (pfOpen && b.status !== "open") return false;
      if (pfRated && b.rating < 4) return false;
      if (fHasPhone === "yes" && !b.phone) return false;
      if (fHasPhone === "no" && b.phone) return false;
      if (fHasEmail === "yes" && !b.email) return false;
      if (fHasEmail === "no" && b.email) return false;
      if (fHasWebsite === "yes" && !b.website) return false;
      if (fHasWebsite === "no" && b.website) return false;
      if (fStatus !== "any" && b.status !== fStatus) return false;
      if (fCats.length && !fCats.some(c => b.category?.toLowerCase().includes(c.toLowerCase()))) return false;
      if (fPrice.length && !fPrice.includes(b.price)) return false;
      if (b.reviews < fMinReviews) return false;
      if (poly?.length >= 3 && b.lat && b.lng && !pointInPolygon(b.lat, b.lng, poly)) return false;
      return true;
    });
  }, [sorted, search, fRatingMin, fHasPhone, fHasEmail, fHasWebsite, fStatus, fCats, fPrice, fMinReviews, pfPhone, pfEmail, pfWebsite, pfOpen, pfRated, polygonSearch?.polygon]);

  const active = filtered.find(b => b.id === activeId) || null;
  const ar = lang === "ar";

  const activeFilters =
    (fRatingMin > 0 ? 1 : 0) + (fHasPhone !== "any" ? 1 : 0) + (fHasEmail !== "any" ? 1 : 0) +
    (fHasWebsite !== "any" ? 1 : 0) + (fStatus !== "any" ? 1 : 0) + fCats.length + fPrice.length +
    (fMinReviews > 0 ? 1 : 0) + (pfPhone ? 1 : 0) + (pfEmail ? 1 : 0) + (pfWebsite ? 1 : 0) + (pfOpen ? 1 : 0) + (pfRated ? 1 : 0);

  const setMulti = (patch) => Object.entries(patch).forEach(([k, v]) => {
    const map = {
      geo: setGeo, categories: setCategories, keywords: setKeywords, radius: setRadius,
      maxResults: setMaxResults, lang: setLang, view: setView, search: setSearch,
      exportOpen: setExportOpen, filterOpen: setFilterOpen,
      fRatingMin: setFRatingMin, fHasPhone: setFHasPhone, fHasEmail: setFHasEmail,
      fHasWebsite: setFHasWebsite, fStatus: setFStatus, fCats: setFCats, fPrice: setFPrice,
      fMinReviews: setFMinReviews,
    };
    if (map[k]) map[k](v);
  });

  const on = {
    set: setMulti,

    toggleRun: async () => {
      if (running) { setRunning(false); return; }

      const cats      = categories.length > 0 ? categories : ["Restaurant"];
      const districts = geo?.districts || [];
      const areas     = geo?.areas     || [];

      // Polygon search — use drawn polygon's centroid + bounding radius
      if (polygonSearch?.polygon?.length >= 3) {
        const poly    = polygonSearch.polygon;
        const centLat = poly.reduce((s, p) => s + p.lat, 0) / poly.length;
        const centLng = poly.reduce((s, p) => s + p.lng, 0) / poly.length;
        const radiusM = Math.max(500, poly.reduce((max, p) => {
          const dist = Math.sqrt((p.lat - centLat) ** 2 + (p.lng - centLng) ** 2) * 111320;
          return Math.max(max, dist);
        }, 0) * 1.25);
        setView("split");
        setMapMode("split");
        await doScrape(centLat, centLng, radiusM, cats, buildLocationString(geo));
        return;
      }

      if (pinSearch?.lat != null) {
        // Pin drop search
        const lat     = pinSearch.lat;
        const lng     = pinSearch.lng;
        const radiusM = window.radiusToMetres(pinSearch.radius || radius);
        const locStr  = buildLocationString(geo);
        await doScrape(lat, lng, radiusM, cats, locStr);

      } else if (geo.city && districts.length > 1 && areas.length === 0) {
        // Multiple districts selected → separate targeted scrape per district
        setView("split");
        await doMultiScrape(geo, cats, window.radiusToMetres(radius));

      } else if (geo.city) {
        // Single district / area / city-only search
        const coords = await resolveSearchCoords(geo);
        if (!coords) { setToast("Please select a city first"); return; }
        const radiusM = window.radiusToMetres(radius);
        const locStr  = buildLocationString(geo);
        setView("split");
        await doScrape(coords.lat, coords.lng, radiusM, cats, locStr);

      } else {
        setToast("Please select a city first or drop a pin on the map");
      }
    },

    doExport: (kind) => {
      if (filtered.length === 0) { setToast("No data to export"); return; }
      if (kind === "CSV") {
        const headers = ["Name","Category","Rating","Reviews","Phone","Email","Website","Address","Status","Price","Lat","Lng"];
        const rows = filtered.map(b => [b.name,b.category,b.rating,b.reviews,b.phone,b.email,b.website,b.address,b.status,b.price,b.lat,b.lng]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? "").replace(/"/g,'""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
        a.download = `mapscraper-${Date.now()}.csv`; a.click();
      } else if (kind === "JSON") {
        const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
        a.download = `mapscraper-${Date.now()}.json`; a.click();
      }
      setToast(`${filtered.length} businesses exported to ${kind}`);
      setExportOpen(false);
    },

    resetFilters: () => {
      setFRatingMin(0); setFHasPhone("any"); setFHasEmail("any"); setFHasWebsite("any");
      setFStatus("any"); setFCats([]); setFPrice([]); setFMinReviews(0);
      setPfPhone(false); setPfEmail(false); setPfWebsite(false); setPfOpen(false); setPfRated(false);
    },

    openPinSearch: () => {
      setEmptyState(false);
      setView("map");
      setMapMode("full");
      setPinSearch({ active: false, dropping: true, point: null, cats: categories, radius: "3 km" });
      setDetailOpen(false);
    },

    onPinDrop: (point) => {
      setPinSearch(p => ({ ...p, dropping: false, active: true, lat: point.lat, lng: point.lng }));
    },

    onPinSearchRun: async ({ cats: pinCats, radius: pinRadius, keywords: pinKws }) => {
      const pinLat = pinSearch?.lat;
      const pinLng = pinSearch?.lng;

      setCategories(pinCats);
      setRadius(pinRadius);
      if (pinKws?.length > 0) setKeywords(pinKws);
      // Keep lat/lng/radius so pin marker + radius circle stay visible on map;
      // just hide the search card (active: false) and stop dropping mode
      setPinSearch(prev => prev ? { ...prev, dropping: false, active: false } : null);
      setMapMode("split");
      setView("split");

      if (pinLat != null && pinLng != null) {
        const radiusM = window.radiusToMetres(pinRadius);
        const searchCats = pinCats.length > 0 ? pinCats : (pinKws?.length > 0 ? pinKws : ["Restaurant"]);
        await doScrape(pinLat, pinLng, radiusM, searchCats, buildLocationString(geo));
      }
    },

    resetAll: () => {
      setBusinesses([]); setFound(0); setRunning(false); setActiveId(null);
      setDetailOpen(false); setEmptyState(true); setSearch("");
      setPinSearch(null); setMapMode("split"); setView("split");
      setFRatingMin(0); setFHasPhone("any"); setFHasEmail("any");
      setFHasWebsite("any"); setFStatus("any"); setFCats([]); setFPrice([]);
      setFMinReviews(0);
      setPfPhone(false); setPfEmail(false); setPfWebsite(false); setPfOpen(false); setPfRated(false);
    },

    onPinRadiusChange: (r) => setPinSearch(p => p ? { ...p, radius: r } : p),

    onPinSearchCancel: () => { setPinSearch(null); setMapMode("split"); },

    onPolygonDrawn: (polygon) => {
      setPolygonSearch({ polygon, active: true, cats: categories });
    },

    onPolygonSearchRun: async ({ cats: polyCats, keywords: polyKws }) => {
      const poly = polygonSearch?.polygon;
      if (!poly) return;
      const centLat = poly.reduce((s, p) => s + p.lat, 0) / poly.length;
      const centLng = poly.reduce((s, p) => s + p.lng, 0) / poly.length;
      const radiusM = Math.max(500, poly.reduce((max, p) => {
        const dist = Math.sqrt((p.lat - centLat) ** 2 + (p.lng - centLng) ** 2) * 111320;
        return Math.max(max, dist);
      }, 0) * 1.25);
      setCategories(polyCats);
      if (polyKws?.length > 0) setKeywords(polyKws);
      setPolygonSearch(prev => ({ ...prev, active: false }));
      setMapMode("split");
      setView("split");
      await doScrape(centLat, centLng, radiusM, polyCats, buildLocationString(geo));
    },

    onPolygonClear: () => setPolygonSearch(null),

    onStartPinDrop: () => {
      if (pinSearch?.dropping) {
        setPinSearch(null);
      } else {
        setPinSearch({ active: false, dropping: true, point: null, cats: categories, radius });
      }
    },

    loadRecent: (r) => { setGeo(r.geo); setCategories(r.cats); setEmptyState(false); },

    togglePf: (key) => {
      if (key === "pfPhone"   || key === "phone")   setPfPhone(v => !v);
      if (key === "pfEmail"   || key === "email")   setPfEmail(v => !v);
      if (key === "pfWebsite" || key === "website") setPfWebsite(v => !v);
      if (key === "pfOpen"    || key === "open")    setPfOpen(v => !v);
      if (key === "pfRated"   || key === "rated")   setPfRated(v => !v);
    },
    pfState: { pfPhone, pfEmail, pfWebsite, pfOpen, pfRated },
  };

  const recent = recentSearches;

  const hasPolygon = !!(polygonSearch?.polygon?.length >= 3) && !polygonSearch?.active;
  const sideState = { lang, geo, categories, keywords, radius, maxResults, running, found, total: filtered.length, logIdx, recent, pfState: on.pfState, hasResults: businesses.length > 0, hasPolygon };
  const topState  = { lang, view, total: filtered.length, found, running, search, exportOpen, filterOpen, activeFilters, geo, categories };
  const mapProps  = {
    businesses: filtered, active: active?.id, onSelect: (id) => { setActiveId(id); setDetailOpen(true); },
    running, found, mapMode, setMapMode, satellite, setSatellite, geo,
    pinSearch, onPinDrop: on.onPinDrop, onPinSearchRun: on.onPinSearchRun,
    onPinSearchCancel: on.onPinSearchCancel, onStartPinDrop: on.onStartPinDrop,
    onPinRadiusChange: on.onPinRadiusChange,
    drawnPolygon: polygonSearch?.polygon || null,
    polygonSearchActive: polygonSearch?.active || false,
    polygonDefaultCats: polygonSearch?.cats || [],
    onPolygonDrawn: on.onPolygonDrawn,
    onPolygonSearchRun: on.onPolygonSearchRun,
    onPolygonClear: on.onPolygonClear,
  };
  const cardProps = { businesses: filtered, active: active?.id, onSelect: (id) => { setActiveId(id); setDetailOpen(true); }, sortBy, setSortBy, sortDir, setSortDir, ar, running, onBulkWA: () => setBulkWAOpen(true), onRemove: (id) => { setBusinesses(prev => prev.filter(b => b.id !== id)); if (activeId === id) { setActiveId(null); setDetailOpen(false); } } };
  const viewState = { ...mapProps, ...cardProps };
  const filtState = { fRatingMin, fHasPhone, fHasEmail, fHasWebsite, fStatus, fCats, fPrice, fMinReviews };

  const showDetail = detailOpen && active && view !== "map" && !emptyState && !pinSearch?.active;

  return (
    <div className={"app" + (showDetail ? " has-detail" : "")} data-screen-label="01 App">
      <Sidebar state={sideState} on={on} mobOpen={mobSideOpen} onMobClose={() => setMobSideOpen(false)} />
      <button className="mob-side-toggle" onClick={() => setMobSideOpen(o => !o)} title="Search panel">
        {mobSideOpen ? I.x({ size: 16 }) : I.search({ size: 16 })}
      </button>
      <div className="main">
        {running && <div className="loadbar" />}
        <TopBar state={topState} on={on} />
        <div className="view">
          {emptyState ? (
            <EmptyState ar={ar}
              onStart={() => { setEmptyState(false); on.toggleRun(); }}
              onPinSearch={on.openPinSearch} />
          ) : (view === "split" || view === "map") ? (
            <SplitView {...viewState} mapOnly={view === "map"} />
          ) : view === "list" ? (
            <ListView {...viewState} />
          ) : view === "grid" ? (
            <GridView {...viewState} />
          ) : (
            <SheetView {...viewState} />
          )}
        </div>
      </div>
      {showDetail && <DetailPanel b={active} ar={ar} onClose={() => setDetailOpen(false)} onExport={() => on.doExport("CSV")} />}
      <FilterDrawer open={filterOpen} onClose={() => setFilterOpen(false)} state={filtState} on={on} ar={ar} />
      {bulkWAOpen && <BulkWAModal contacts={filtered} onClose={() => setBulkWAOpen(false)} />}
      <Toast toast={toast} onClose={() => setToast(null)} />

      <TweaksPanel title="Tweaks">
        <TweakSection title="Accent">
          <TweakColor label="Color"
            value={ACCENTS[t.accent].a}
            options={[ACCENTS.sage.a, ACCENTS.ink.a, ACCENTS.amber.a, ACCENTS.violet.a]}
            onChange={(v) => { const key = Object.keys(ACCENTS).find(k => ACCENTS[k].a === v) || "sage"; setT("accent", key); }} />
        </TweakSection>
        <TweakSection title="Map">
          <TweakRadio label="Style" value={satellite ? "sat" : "map"}
            options={[{ value: "map", label: "Map" }, { value: "sat", label: "Satellite" }]}
            onChange={(v) => setSatellite(v === "sat")} />
        </TweakSection>
        <TweakSection title="Demo">
          <TweakButton label="Toggle empty state" onClick={() => setEmptyState(e => !e)} />
          <TweakButton label="Pin-search demo" onClick={on.openPinSearch} />
          <TweakButton label="Cycle view" onClick={() => { const order = ["split","map","list","sheet"]; setView(order[(order.indexOf(view)+1) % order.length]); }} />
        </TweakSection>
        <TweakSection title="Language">
          <TweakRadio label="UI" value={lang}
            options={[{ value: "en", label: "EN" }, { value: "ar", label: "AR" }]} onChange={setLang} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
