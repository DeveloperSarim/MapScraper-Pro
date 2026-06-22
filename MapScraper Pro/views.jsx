// Helper: get city center for Leaflet
function getCityCenter(city) {
  return window.CITY_CENTERS?.[city] || { lat: 25.2048, lng: 55.2708, zoom: 13 };
}

// Helper: parse "1 km" → 1000 metres
function parseRadiusM(r) {
  const n = parseFloat(r || "1");
  return (r || "").includes("km") ? n * 1000 : n * 1000;
}

// ============ Geocoding search bar (Nominatim) ============
function MapSearch({ mapRef }) {
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const timerRef = React.useRef(null);
  const wrapRef = React.useRef(null);

  React.useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setResults([]); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const doSearch = async (text) => {
    if (!text.trim() || text.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=6`;
      const res = await fetch(url);
      const data = await res.json();
      setResults(data.slice(0, 6));
    } catch (_) { setResults([]); }
    setLoading(false);
  };

  const onChange = (e) => {
    const v = e.target.value;
    setQ(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(v), 450);
  };

  const go = (r) => {
    if (mapRef.current) mapRef.current.flyTo([+r.lat, +r.lon], 14, { duration: 1.0 });
    setResults([]);
    setQ(r.display_name.split(",").slice(0, 2).join(", "));
  };

  return (
    <div className="map-search" ref={wrapRef}>
      <div className="map-search-box">
        <span className="map-search-icon">
          {loading
            ? <span className="map-spin" />
            : I.search({ size: 14 })}
        </span>
        <input
          className="map-search-inp"
          value={q}
          onChange={onChange}
          placeholder="Search city, area, district…"
          onKeyDown={(e) => { if (e.key === "Escape") { setResults([]); setQ(""); } }}
        />
        {q && (
          <button className="map-search-clr" onClick={() => { setQ(""); setResults([]); }}>
            {I.x({ size: 11 })}
          </button>
        )}
      </div>
      {results.length > 0 && (
        <div className="map-search-drop">
          {results.map((r, i) => (
            <button key={i} type="button" className="map-search-row" onClick={() => go(r)}>
              {I.pin({ size: 11 })}
              <div className="map-search-row-text">
                <span className="map-search-row-name">{r.display_name.split(",")[0]}</span>
                <span className="map-search-row-sub">{r.display_name.split(",").slice(1, 3).join(",").trim()}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Leaflet Map Pane ============
function MapPane({ businesses, active, onSelect, running, found, mapMode, setMapMode, satellite, setSatellite, pinSearch, onPinDrop, onPinSearchRun, onPinSearchCancel, onStartPinDrop, onPinRadiusChange, geo, drawnPolygon, polygonSearchActive, polygonDefaultCats, onPolygonDrawn, onPolygonSearchRun, onPolygonClear }) {
  const containerRef = React.useRef(null);
  const mapRef          = React.useRef(null);
  const tileRef         = React.useRef(null);
  const markersRef      = React.useRef([]);
  const pinMarkerRef    = React.useRef(null);
  const circleRef       = React.useRef(null);
  const myLocRef        = React.useRef(null);
  const myLocRingRef    = React.useRef(null);
  const areaHighlightRef = React.useRef(null);
  const polyDrawRef     = React.useRef(null);  // preview polyline while drawing
  const finalPolyRef    = React.useRef(null);  // final drawn polygon layer

  // Polygon draw state
  const [polyMode, setPolyMode] = React.useState(false);
  const [polyPoints, setPolyPoints] = React.useState([]);
  const polyModeRef = React.useRef(false);
  React.useEffect(() => { polyModeRef.current = polyMode; }, [polyMode]);

  // Keep latest callback refs to avoid stale closures in Leaflet event handlers
  const pinSearchRef  = React.useRef(pinSearch);
  const onPinDropRef  = React.useRef(onPinDrop);
  React.useEffect(() => { pinSearchRef.current = pinSearch; }, [pinSearch]);
  React.useEffect(() => { onPinDropRef.current = onPinDrop; }, [onPinDrop]);

  const [zoom, setZoom] = React.useState(13);

  const getTileUrl = (sat) => sat
    ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  const getTileOptions = (sat) => sat
    ? { maxZoom: 19 }
    : { maxZoom: 19, subdomains: "abcd" };

  // ── Init Leaflet map once ──────────────────────────────────────────────────
  React.useEffect(() => {
    if (!containerRef.current || mapRef.current || !window.L) return;
    const c = getCityCenter(geo?.city);
    const map = L.map(containerRef.current, {
      center: [c.lat, c.lng], zoom: c.zoom || 13,
      zoomControl: false, attributionControl: false,
    });
    mapRef.current = map;
    tileRef.current = L.tileLayer(getTileUrl(satellite), getTileOptions(satellite)).addTo(map);
    map.on("zoom", () => setZoom(map.getZoom()));
    map.on("click", (e) => {
      if (polyModeRef.current) {
        setPolyPoints(prev => [...prev, { lat: e.latlng.lat, lng: e.latlng.lng }]);
      } else if (pinSearchRef.current?.dropping) {
        onPinDropRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });

    // Auto-show user location silently on load
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        if (!mapRef.current || !window.L) return;
        const { latitude, longitude } = pos.coords;
        const dotIcon = L.divIcon({
          className: "",
          html: `<div class="my-loc-dot"><div class="my-loc-pulse"></div></div>`,
          iconSize: [20, 20], iconAnchor: [10, 10],
        });
        myLocRef.current = L.marker([latitude, longitude], { icon: dotIcon, zIndexOffset: 1000 }).addTo(mapRef.current);
        myLocRingRef.current = L.circle([latitude, longitude], {
          radius: 80, color: "#4285F4", fillColor: "#4285F4", fillOpacity: 0.15, weight: 2, dashArray: "4 3",
        }).addTo(mapRef.current);
      },
      () => {},
      { timeout: 5000, enableHighAccuracy: false }
    );

    // Auto-resize Leaflet when container dimensions change (e.g. split ↔ map-only layout)
    const ro = new ResizeObserver(() => {
      if (mapRef.current) mapRef.current.invalidateSize({ animate: false });
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); map.remove(); mapRef.current = null; };
  }, []);

  // ── Swap tiles when satellite toggle changes ───────────────────────────────
  React.useEffect(() => {
    if (!mapRef.current || !window.L) return;
    if (tileRef.current) mapRef.current.removeLayer(tileRef.current);
    tileRef.current = L.tileLayer(getTileUrl(satellite), getTileOptions(satellite)).addTo(mapRef.current);
  }, [satellite]);

  // ── Re-render markers when businesses/active changes ──────────────────────
  React.useEffect(() => {
    if (!mapRef.current || !window.L) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    businesses.slice(0, 80).forEach((b, i) => {
      const isActive = active === b.id;
      const icon = L.divIcon({
        className: "",
        html: `<div class="pin${isActive ? " active" : ""}"><div class="pin-tooltip"><strong>${b.name}</strong><em> · ${b.rating.toFixed(1)}</em></div><div class="pin-body"><span>${i + 1}</span></div></div>`,
        iconSize: [28, 38], iconAnchor: [14, 38],
      });
      const m = L.marker([b.lat, b.lng], { icon }).addTo(mapRef.current);
      m.on("click", (e) => { L.DomEvent.stopPropagation(e); onSelect(b.id); });
      markersRef.current.push(m);
    });
  }, [businesses, active]);

  // ── Fly to city when geo.city changes ─────────────────────────────────────
  React.useEffect(() => {
    if (!mapRef.current || !geo?.city) return;
    const c = getCityCenter(geo.city);
    mapRef.current.flyTo([c.lat, c.lng], c.zoom || 13, { duration: 1.0 });
  }, [geo?.city]);

  // ── Highlight ALL selected districts/areas on map ────────────────────────
  React.useEffect(() => {
    if (!mapRef.current || !window.L) return;
    // Remove previous highlight layers
    if (areaHighlightRef.current) {
      if (Array.isArray(areaHighlightRef.current)) areaHighlightRef.current.forEach(l => l.remove());
      else areaHighlightRef.current.remove();
      areaHighlightRef.current = null;
    }

    const districts = geo?.districts || [];
    const areas     = geo?.areas     || [];
    const city      = geo?.city;
    if (!city || (districts.length === 0 && areas.length === 0)) return;

    // Targets: use areas if selected, otherwise all districts
    const targets = areas.length > 0
      ? areas.map(a => ({ name: a, isArea: true, parent: districts[0] || "" }))
      : districts.map(d => ({ name: d, isArea: false, parent: "" }));

    const allLayers = [];
    const resolvedPoints = []; // { lat, lng } for each resolved target (to fit map bounds)

    const dotIcon = window.L.divIcon({
      className: "",
      html: `<div class="area-center-dot"></div>`,
      iconSize: [14, 14], iconAnchor: [7, 7],
    });

    const drawCircle = (lat, lng, isArea) => {
      if (!mapRef.current || !window.L) return;
      const r = isArea ? 900 : 1500;
      allLayers.push(
        window.L.circle([lat, lng], {
          radius: r,
          color: "var(--accent)", fillColor: "var(--accent)",
          fillOpacity: 0.13, weight: 2.5, dashArray: "10 6",
        }).addTo(mapRef.current),
        window.L.marker([lat, lng], { icon: dotIcon, interactive: false }).addTo(mapRef.current)
      );
      resolvedPoints.push({ lat, lng });
    };

    const resolveAndDraw = async (target) => {
      // 1️⃣ Pre-built DISTRICT_CENTERS — instant
      const pre = window.DISTRICT_CENTERS?.[target.name] || window.DISTRICT_CENTERS?.[target.parent];
      if (pre) { drawCircle(pre.lat, pre.lng, target.isArea); return; }

      // 2️⃣ Nominatim fallback — strip parentheses
      try {
        const countryName = (geo?.country || '').replace(/^\S+\s+/, '').trim();
        const clean = target.name.replace(/\s*\([^)]*\)/g, '').trim();
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${clean}, ${city}, ${countryName}`)}&format=json&limit=1`
        );
        const data = await r.json();
        if (data[0]) {
          const lat = +data[0].lat, lng = +data[0].lon;
          const bb = data[0].boundingbox;
          const latSpan = +bb[1] - +bb[0], lngSpan = +bb[3] - +bb[2];
          if (latSpan > 0.005 && lngSpan > 0.005) {
            const bounds = [[+bb[0], +bb[2]], [+bb[1], +bb[3]]];
            allLayers.push(
              window.L.rectangle(bounds, {
                color: "var(--accent)", fillColor: "var(--accent)",
                fillOpacity: 0.10, weight: 2.5, dashArray: "10 6",
              }).addTo(mapRef.current)
            );
            resolvedPoints.push({ lat: (+bb[0] + +bb[1]) / 2, lng: (+bb[2] + +bb[3]) / 2 });
          } else {
            drawCircle(lat, lng, target.isArea);
          }
        }
      } catch (_) {}
    };

    Promise.all(targets.map(t => resolveAndDraw(t))).then(() => {
      areaHighlightRef.current = allLayers;
      if (!mapRef.current || resolvedPoints.length === 0) return;
      if (resolvedPoints.length === 1) {
        // Single target — fly directly to it
        mapRef.current.flyTo([resolvedPoints[0].lat, resolvedPoints[0].lng], targets[0].isArea ? 15 : 14, { duration: 1.2 });
      } else {
        // Multiple targets — fit all into view
        const lats = resolvedPoints.map(p => p.lat);
        const lngs = resolvedPoints.map(p => p.lng);
        const bounds = [
          [Math.min(...lats) - 0.01, Math.min(...lngs) - 0.01],
          [Math.max(...lats) + 0.01, Math.max(...lngs) + 0.01],
        ];
        mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 14, animate: true });
      }
    });
  }, [geo?.districts?.join(','), geo?.areas?.join(',')]);

  // ── Polygon draw preview (live polyline as user clicks) ───────────────────
  React.useEffect(() => {
    if (!mapRef.current || !window.L) return;
    if (polyDrawRef.current) { polyDrawRef.current.remove(); polyDrawRef.current = null; }
    if (polyPoints.length < 2) return;
    const latlngs = polyPoints.map(p => [p.lat, p.lng]);
    // Close the visual loop if 3+ points
    if (polyPoints.length >= 3) latlngs.push(latlngs[0]);
    polyDrawRef.current = L.polyline(latlngs, {
      color: "var(--accent)", weight: 2.5, dashArray: "8 5", opacity: 0.85,
    }).addTo(mapRef.current);

    // Add dot markers at each vertex
    polyPoints.forEach(p => {
      L.circleMarker([p.lat, p.lng], {
        radius: 4, color: "var(--accent)", fillColor: "var(--accent)", fillOpacity: 1, weight: 2,
      }).addTo(mapRef.current);
    });
  }, [polyPoints]);

  // ── Final drawn polygon from app state ────────────────────────────────────
  React.useEffect(() => {
    if (!mapRef.current || !window.L) return;
    if (finalPolyRef.current) { finalPolyRef.current.remove(); finalPolyRef.current = null; }
    if (!drawnPolygon || drawnPolygon.length < 3) return;
    const latlngs = drawnPolygon.map(p => [p.lat, p.lng]);
    finalPolyRef.current = L.polygon(latlngs, {
      color: "var(--accent)", fillColor: "var(--accent)",
      fillOpacity: 0.12, weight: 2.5, dashArray: "10 6",
    }).addTo(mapRef.current);
  }, [drawnPolygon]);

  // ── Pin-search marker + radius circle ─────────────────────────────────────
  React.useEffect(() => {
    if (!mapRef.current || !window.L) return;
    if (pinMarkerRef.current) { pinMarkerRef.current.remove(); pinMarkerRef.current = null; }
    if (circleRef.current)    { circleRef.current.remove();    circleRef.current = null; }
    if (pinSearch?.lat != null && pinSearch?.lng != null) {
      const rad = parseRadiusM(pinSearch.radius);
      circleRef.current = L.circle([pinSearch.lat, pinSearch.lng], {
        radius: rad, color: "var(--accent)", fillColor: "var(--accent)", fillOpacity: 0.12, weight: 2, dashArray: "5 4",
      }).addTo(mapRef.current);
      const dropIcon = L.divIcon({
        className: "",
        html: `<div class="search-pin-dot"><svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M8 14s5-4.2 5-8.2A5 5 0 1 0 3 5.8C3 9.8 8 14 8 14z"/><circle cx="8" cy="5.8" r="1.6"/></svg></div>`,
        iconSize: [22, 22], iconAnchor: [11, 22],
      });
      pinMarkerRef.current = L.marker([pinSearch.lat, pinSearch.lng], { icon: dropIcon }).addTo(mapRef.current);
    }
  }, [pinSearch?.lat, pinSearch?.lng, pinSearch?.radius]);

  const handleZoomIn  = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const [locating, setLocating] = React.useState(false);

  const finishPoly = () => {
    if (polyPoints.length < 3) return;
    if (polyDrawRef.current) { polyDrawRef.current.remove(); polyDrawRef.current = null; }
    const pts = [...polyPoints];
    setPolyMode(false);
    setPolyPoints([]);
    onPolygonDrawn && onPolygonDrawn(pts);
  };

  const cancelPoly = () => {
    if (polyDrawRef.current) { polyDrawRef.current.remove(); polyDrawRef.current = null; }
    setPolyMode(false);
    setPolyPoints([]);
  };

  const placeMyLocation = (lat, lng) => {
    if (!mapRef.current || !window.L) return;
    // Remove previous location markers
    if (myLocRef.current)     { myLocRef.current.remove();     myLocRef.current = null; }
    if (myLocRingRef.current) { myLocRingRef.current.remove(); myLocRingRef.current = null; }

    // Pulsing accuracy circle
    myLocRingRef.current = L.circle([lat, lng], {
      radius: 80,
      color: "#4285F4", fillColor: "#4285F4", fillOpacity: 0.15,
      weight: 2, dashArray: "4 3",
    }).addTo(mapRef.current);

    // Blue dot marker (Google Maps style)
    const icon = L.divIcon({
      className: "",
      html: `<div class="my-loc-dot"><div class="my-loc-pulse"></div></div>`,
      iconSize: [20, 20], iconAnchor: [10, 10],
    });
    myLocRef.current = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(mapRef.current);
    mapRef.current.flyTo([lat, lng], 15, { duration: 1.2 });
  };

  const handleReset = () => {
    if (!navigator.geolocation) {
      const c = getCityCenter(geo?.city);
      if (mapRef.current) mapRef.current.flyTo([c.lat, c.lng], c.zoom || 13);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        placeMyLocation(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLocating(false);
        const c = getCityCenter(geo?.city);
        if (mapRef.current) mapRef.current.flyTo([c.lat, c.lng], c.zoom || 13);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  return (
    <div className={"map-pane leaflet-wrap" + (satellite ? " sat" : "") + (pinSearch?.dropping ? " dropping" : "")}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* Geocoding search bar */}
      <MapSearch mapRef={mapRef} />

      {/* Pin-search overlay card */}
      {pinSearch?.active && (
        <PinSearchOverlay state={pinSearch} onPinSearchRun={onPinSearchRun} onCancel={onPinSearchCancel} onRadiusChange={onPinRadiusChange} />
      )}

      {/* Map controls */}
      <div className="map-controls">
        <button title="Zoom in"  onClick={handleZoomIn}>{I.plus({ size: 13 })}</button>
        <button title="Zoom out" onClick={handleZoomOut}>{I.minus({ size: 13 })}</button>
        <button title="My location" onClick={handleReset} style={locating ? { color: "var(--accent)" } : {}}>
          {locating ? <span className="map-spin" /> : I.home({ size: 13 })}
        </button>
        <div className="map-ctrl-divider" />
        <button
          title={pinSearch?.dropping ? "Cancel pin drop" : "Drop a search pin"}
          className={"map-ctrl-pin" + (pinSearch?.dropping || pinSearch?.active ? " on" : "")}
          onClick={() => onStartPinDrop && onStartPinDrop()}>
          {I.pin({ size: 13 })}
        </button>
        <button
          title={polyMode ? "Cancel draw" : drawnPolygon ? "Clear drawn area" : "Draw custom search area"}
          className={"map-ctrl-poly" + (polyMode || drawnPolygon ? " on" : "")}
          onClick={() => {
            if (polyMode) { cancelPoly(); }
            else if (drawnPolygon) { onPolygonClear && onPolygonClear(); }
            else { setPolyMode(true); }
          }}>
          {I.draw({ size: 13 })}
        </button>
        <button title="Fullscreen" onClick={() => setMapMode && setMapMode(mapMode === "full" ? "split" : "full")}>
          {I.expand({ size: 13 })}
        </button>
      </div>

      {/* Satellite / Map toggle */}
      <div className="map-style">
        <button className={!satellite ? "on" : ""} onClick={() => setSatellite(false)}>{I.map({ size: 12 })} Map</button>
        <button className={satellite ? "on" : ""}  onClick={() => setSatellite(true)}>{I.globe({ size: 12 })} Satellite</button>
      </div>

      {pinSearch?.dropping && !polyMode && !drawnPolygon && (
        <div className="map-banner">
          <span className="banner-dot" />
          <strong>Click anywhere on the map</strong>
          <span>to drop a search pin</span>
          <button className="banner-cancel" onClick={onPinSearchCancel}>Cancel</button>
        </div>
      )}

      {polyMode && (
        <div className="map-banner map-banner--bottom">
          <span className="banner-dot" />
          <strong>Click to add points</strong>
          <span>{polyPoints.length >= 3
            ? `${polyPoints.length} points — click Done`
            : `${polyPoints.length}/3 min`}
          </span>
          {polyPoints.length >= 3 && (
            <button className="banner-ok" onClick={finishPoly}>Done ✓</button>
          )}
          <button className="banner-cancel" onClick={cancelPoly}>Cancel</button>
        </div>
      )}

      {polygonSearchActive && drawnPolygon && drawnPolygon.length >= 3 && (
        <PolygonSearchOverlay
          polygon={drawnPolygon}
          defaultCats={polygonDefaultCats}
          onSearch={onPolygonSearchRun}
          onCancel={onPolygonClear}
        />
      )}

      <div className="map-attr">© OpenStreetMap · CartoDB · z{zoom}</div>
    </div>
  );
}

function PinSearchOverlay({ state, onPinSearchRun, onCancel, onRadiusChange }) {
  const [cats, setCats] = useStateC(state.cats || []);
  const [kmVal, setKmVal] = useStateC(parseFloat(state.radius) || 3);
  const [kwInput, setKwInput] = React.useState("");
  const [kws, setKws] = React.useState(state.keywords || []);

  const setKm = (km) => {
    const v = parseFloat(km);
    setKmVal(v);
    const str = `${v} km`;
    if (onRadiusChange) onRadiusChange(str);
  };

  const addKw = (e) => {
    if ((e.key === "Enter" || e.key === ",") && kwInput.trim()) {
      e.preventDefault();
      const val = kwInput.trim().replace(/,$/, "");
      if (val && !kws.includes(val)) setKws(prev => [...prev, val]);
      setKwInput("");
    }
  };

  const removeKw = (kw) => setKws(prev => prev.filter(k => k !== kw));

  const displayRadius = kmVal < 1 ? `${kmVal * 1000} m` : `${kmVal} km`;
  const radiusStr = `${kmVal} km`;

  const PRESETS = [1, 3, 5, 10, 20];

  return (
    <div className="pin-search-card">
      <div className="psc-head">
        <div>
          <div className="psc-eyebrow">{I.pin({ size: 11 })} Pin Search</div>
          <div className="psc-title">What to find here?</div>
          <div className="psc-coord">{state.lat.toFixed(4)}°N · {state.lng.toFixed(4)}°E</div>
        </div>
        <button className="iconbtn" onClick={onCancel}>{I.x({ size: 12 })}</button>
      </div>

      <div className="psc-section">
        <div className="psc-label">Categories</div>
        <Combobox
          icon={I.tag({ size: 13 })}
          placeholder="Pick categories to search…"
          groups={window.CATEGORY_GROUPS}
          value={cats}
          onChange={setCats}
          label="categories"
        />
        {cats.length > 0 && (
          <div className="chiprow" style={{ marginTop: 6 }}>
            {cats.slice(0, 5).map(c => (
              <span key={c} className="kw small">{c}
                <button onClick={() => setCats(cats.filter(x => x !== c))}>{I.x({ size: 8, strokeWidth: 2.4 })}</button>
              </span>
            ))}
            {cats.length > 5 && <span className="kw small more">+{cats.length - 5}</span>}
          </div>
        )}
      </div>

      <div className="psc-section">
        <div className="psc-label">Keywords <span style={{ fontWeight: 400, color: "var(--ink-4)", fontSize: 10 }}>optional · press Enter after each</span></div>
        <div className="psc-kw-wrap">
          {I.search({ size: 12, style: { color: "var(--ink-4)", flexShrink: 0 } })}
          <input
            className="psc-kw-input"
            value={kwInput}
            onChange={e => setKwInput(e.target.value)}
            onKeyDown={addKw}
            placeholder="e.g. delivery, 24-hour, parking…"
          />
        </div>
        {kws.length > 0 && (
          <div className="chiprow" style={{ marginTop: 6 }}>
            {kws.map(k => (
              <span key={k} className="kw small">{k}
                <button onClick={() => removeKw(k)}>{I.x({ size: 8, strokeWidth: 2.4 })}</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="psc-section">
        <div className="psc-label-row">
          <span>Search radius</span>
          <span className="psc-radius-val">{displayRadius}</span>
        </div>
        <input
          type="range" min="0.5" max="20" step="0.5"
          value={kmVal}
          onChange={(e) => setKm(e.target.value)}
          className="psc-slider"
          style={{ "--val": `${((kmVal - 0.5) / 19.5) * 100}%` }}
        />
        <div className="psc-radii">
          {PRESETS.map(km => (
            <button key={km} className={"psc-radio" + (kmVal === km ? " on" : "")}
              onClick={() => setKm(km)}>{km} km</button>
          ))}
        </div>
      </div>

      <div className="psc-foot">
        <button className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn dark" disabled={cats.length === 0 && kws.length === 0} onClick={() => onPinSearchRun({ cats, radius: radiusStr, keywords: kws })}>
          {I.search({ size: 12 })} Search this area
        </button>
      </div>
    </div>
  );
}

function PolygonSearchOverlay({ polygon, defaultCats, onSearch, onCancel }) {
  const [cats, setCats] = useStateC(defaultCats || []);
  const [kwInput, setKwInput] = React.useState("");
  const [kws, setKws] = React.useState([]);

  const addKw = (e) => {
    if ((e.key === "Enter" || e.key === ",") && kwInput.trim()) {
      e.preventDefault();
      const val = kwInput.trim().replace(/,$/, "");
      if (val && !kws.includes(val)) setKws(prev => [...prev, val]);
      setKwInput("");
    }
  };

  return (
    <div className="pin-search-card">
      <div className="psc-head">
        <div>
          <div className="psc-eyebrow">{I.polygon({ size: 11 })} Polygon Search</div>
          <div className="psc-title">What to find in this area?</div>
          <div className="psc-coord">{polygon.length} points · custom shape</div>
        </div>
        <button className="iconbtn" onClick={onCancel}>{I.x({ size: 12 })}</button>
      </div>

      <div className="psc-section">
        <div className="psc-label">Categories</div>
        <Combobox
          icon={I.tag({ size: 13 })}
          placeholder="Pick categories to search…"
          groups={window.CATEGORY_GROUPS}
          value={cats}
          onChange={setCats}
          label="categories"
        />
        {cats.length > 0 && (
          <div className="chiprow" style={{ marginTop: 6 }}>
            {cats.slice(0, 5).map(c => (
              <span key={c} className="kw small">{c}
                <button onClick={() => setCats(cats.filter(x => x !== c))}>{I.x({ size: 8, strokeWidth: 2.4 })}</button>
              </span>
            ))}
            {cats.length > 5 && <span className="kw small more">+{cats.length - 5}</span>}
          </div>
        )}
      </div>

      <div className="psc-section">
        <div className="psc-label">Keywords <span style={{ fontWeight: 400, color: "var(--ink-4)", fontSize: 10 }}>optional · press Enter</span></div>
        <div className="psc-kw-wrap">
          {I.search({ size: 12, style: { color: "var(--ink-4)", flexShrink: 0 } })}
          <input className="psc-kw-input" value={kwInput} onChange={e => setKwInput(e.target.value)}
            onKeyDown={addKw} placeholder="e.g. delivery, parking…" />
        </div>
        {kws.length > 0 && (
          <div className="chiprow" style={{ marginTop: 6 }}>
            {kws.map(k => (
              <span key={k} className="kw small">{k}
                <button onClick={() => setKws(prev => prev.filter(x => x !== k))}>{I.x({ size: 8, strokeWidth: 2.4 })}</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="psc-foot">
        <button className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn dark" disabled={cats.length === 0 && kws.length === 0}
          onClick={() => onSearch({ cats, keywords: kws })}>
          {I.search({ size: 12 })} Search this area
        </button>
      </div>
    </div>
  );
}

function BulkWAModal({ contacts, onClose }) {
  const [msg, setMsg] = React.useState("Hi, I found your business on Google Maps and wanted to reach out.");
  const [sent, setSent] = React.useState(new Set());
  const [blocked, setBlocked] = React.useState(false);

  const toWaNum = (phone) => phone.replace(/\D/g, "");
  const waContacts = contacts.filter(c => c.phone && toWaNum(c.phone).length >= 9);

  const openOne = (c) => {
    const num = toWaNum(c.phone);
    const a = document.createElement("a");
    a.href = `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setSent(prev => new Set([...prev, num]));
  };

  const openAll = () => {
    const unsent = waContacts.filter(c => !sent.has(toWaNum(c.phone)));
    const newSent = new Set(sent);
    unsent.forEach(c => {
      const num = toWaNum(c.phone);
      const a = document.createElement("a");
      a.href = `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      newSent.add(num);
    });
    const test = window.open("", "_blank");
    if (!test) { setBlocked(true); } else { test.close(); }
    setSent(newSent);
  };

  return (
    <div className="bwa-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bwa-modal">
        <div className="bwa-head">
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Bulk WhatsApp</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{waContacts.length} contacts with phone numbers</div>
          </div>
          <button className="iconbtn" onClick={onClose}>{I.x({ size: 13 })}</button>
        </div>

        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Message Template</div>
          <textarea
            className="bwa-msg"
            value={msg}
            onChange={e => setMsg(e.target.value)}
            rows={3}
            style={{ width: "100%", resize: "vertical", border: "1px solid var(--line)", borderRadius: 6, padding: "8px 10px", fontSize: 13, fontFamily: "var(--font-sans)", background: "var(--panel-soft)", color: "var(--ink)", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <div className="bwa-sendall-wrap">
          <button className="bwa-sendall-btn" onClick={openAll} disabled={waContacts.every(c => sent.has(toWaNum(c.phone)))}>
            {I.wa ? I.wa({ size: 14 }) : "📱"} Open all {waContacts.filter(c => !sent.has(toWaNum(c.phone))).length} WhatsApp chats
          </button>
          {blocked && (
            <div style={{ fontSize: 11, color: "#d44", marginTop: 6 }}>
              Popups blocked — allow popups for this site in browser settings, then try again.
            </div>
          )}
          <div className="bwa-sendall-note">Browser may ask to allow popups — click Allow once</div>
        </div>

        <div className="bwa-list">
          {waContacts.map((c, i) => {
            const num = toWaNum(c.phone);
            const done = sent.has(num);
            return (
              <div key={i} className={"bwa-row" + (done ? " done" : "")}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 1 }}>{c.phone}</div>
                </div>
                <button className="bwa-open-btn" onClick={() => openOne(c)}>
                  {done ? "✓ Sent" : "Open"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="bwa-foot">
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{sent.size} / {waContacts.length} opened</span>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ============ Card list ============
function Stars({ rating, reviews }) {
  return (
    <span className="stars">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={"s" + (i > Math.round(rating) ? " dim" : "")}>{I.star({ size: 11 })}</span>
      ))}
      <span className="rating">{rating.toFixed(1)}</span>
      {reviews ? <span className="revs">({reviews.toLocaleString()})</span> : null}
    </span>
  );
}

function Card({ b, idx, active, alt, onClick, onView, onRemove, ar }) {
  return (
    <div className={"card" + (active ? " active" : "") + (alt ? " alt" : "")} onClick={onClick}>
      <div className="card-head">
        <div>
          <div className="card-name">{b.name}</div>
          <div className="card-meta"><Stars rating={b.rating} reviews={b.reviews} /></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="card-num">#{String(idx + 1).padStart(3, "0")}</span>
          <button className="card-remove" title="Remove listing" onClick={(e) => { e.stopPropagation(); onRemove && onRemove(b.id); }}>
            {I.x({ size: 10, strokeWidth: 2.2 })}
          </button>
        </div>
      </div>
      <div className="card-meta" style={{ marginTop: 8 }}>
        <span className="tag">{b.category}</span>
        <span className={"tag " + b.status}>{b.status === "open" ? (ar ? "مفتوح" : "Open") : (ar ? "مغلق" : "Closed")}</span>
        <span className="tag price">{b.price}</span>
      </div>
      <div className="card-rows">
        <div className="card-row">{I.phone({ size: 12 })}<span className="val">{b.phone}</span><span className="copy">⌘C</span></div>
        <div className="card-row">{I.link({ size: 12 })}<span className="val">{b.website}</span><span className="copy">↗</span></div>
        <div className="card-row">{I.pin({ size: 12 })}<span className="val">{b.address}</span></div>
      </div>
      <div className="card-actions">
        <button className="mini" onClick={(e) => { e.stopPropagation(); onView(); }}>{I.map({ size: 11 })} View on Map</button>
        <button className="mini" onClick={(e) => e.stopPropagation()}>{I.copy({ size: 11 })} Copy</button>
        <button className="mini" onClick={(e) => e.stopPropagation()}>{I.download({ size: 11 })} Export</button>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="skel">
      <div className="shimmer sk-line med" />
      <div className="shimmer sk-line short" />
      <div style={{ height: 10 }} />
      <div className="shimmer sk-line" />
      <div className="shimmer sk-line short" />
    </div>
  );
}

function CardsPane({ businesses, active, onSelect, sortBy, setSortBy, ar, running, onBulkWA, onRemove }) {
  const waCount = businesses.filter(b => b.phone).length;
  return (
    <div className="cards-pane">
      <div className="cards-head">
        <h3>{businesses.length} {ar ? "نتيجة" : "results"}</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {waCount > 0 && (
            <button className="btn" style={{ fontSize: 12, padding: "4px 10px", gap: 5 }} onClick={onBulkWA}>
              📱 WA ({waCount})
            </button>
          )}
          <div className="sort">
            {I.sort({ size: 12 })}
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="rating">Top rated</option>
              <option value="reviews">Most reviews</option>
              <option value="name">A → Z</option>
              <option value="recent">Recently scraped</option>
            </select>
          </div>
        </div>
      </div>
      <div className="cards">
        {businesses.map((b, i) => (
          <Card key={b.id} b={b} idx={i} ar={ar}
                active={active === b.id} alt={i % 2 === 1}
                onClick={() => onSelect(b.id)} onView={() => onSelect(b.id)} onRemove={onRemove} />
        ))}
        {running && (<React.Fragment><Skeleton /><Skeleton /></React.Fragment>)}
      </div>
    </div>
  );
}

function SplitView({ mapOnly, ...props }) {
  return (
    <div className={mapOnly ? "map-only" : "split"}>
      <MapPane {...props} />
      {!mapOnly && <CardsPane {...props} />}
    </div>
  );
}

function MapView(props) {
  return <SplitView mapOnly {...props} />;
}

function ListView(props) {
  return (
    <div className="cards-pane" style={{ height: "100%" }}>
      <div className="cards" style={{ maxWidth: 760, margin: "0 auto", padding: "20px 16px" }}>
        {props.businesses.map((b, i) => (
          <Card key={b.id} b={b} idx={i} ar={props.ar}
                active={props.active === b.id}
                onClick={() => props.onSelect(b.id)} onView={() => props.onSelect(b.id)} />
        ))}
      </div>
    </div>
  );
}

function GridView({ businesses, active, onSelect, ar, running }) {
  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "20px 16px" }}>
      <div className="grid-view">
        {businesses.map((b, i) => (
          <div key={b.id} className={"grid-card" + (active === b.id ? " active" : "")} onClick={() => onSelect(b.id)}>
            <div className="grid-card-top">
              <div className="grid-cat-tag">{b.category}</div>
              <div className={"grid-status " + b.status}>{b.status === "open" ? "Open" : "Closed"}</div>
            </div>
            <div className="grid-name">{b.name}</div>
            {b.nameAr && <div className="grid-name-ar">{b.nameAr}</div>}
            <div className="grid-meta">
              <Stars rating={b.rating} reviews={b.reviews} />
            </div>
            {b.phone && (
              <div className="grid-row">
                {I.phone({ size: 11 })}
                <span className="mono">{b.phone}</span>
              </div>
            )}
            {b.address && (
              <div className="grid-row">
                {I.pin({ size: 11 })}
                <span className="grid-addr">{b.address}</span>
              </div>
            )}
            <div className="grid-footer">
              <span className="grid-num">#{i + 1}</span>
              <span className="grid-price">{b.price}</span>
            </div>
          </div>
        ))}
        {running && [0,1,2,3].map(i => (
          <div key={"sk"+i} className="grid-card grid-sk">
            <div className="shimmer sk-line" style={{ width: "60%", marginBottom: 8 }} />
            <div className="shimmer sk-line" style={{ width: "40%", marginBottom: 12 }} />
            <div className="shimmer sk-line short" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SheetView({ businesses, active, onSelect, sortBy, setSortBy, sortDir, setSortDir, ar }) {
  const cols = [
    { id: "num", label: "#", w: 50 },
    { id: "name", label: "Name", w: 200 },
    { id: "category", label: "Category", w: 150 },
    { id: "rating", label: "Rating", w: 90 },
    { id: "reviews", label: "Reviews", w: 90 },
    { id: "phone", label: "Phone", w: 150 },
    { id: "email", label: "Email", w: 180 },
    { id: "website", label: "Website", w: 150 },
    { id: "address", label: "Address", w: 240 },
    { id: "status", label: "Status", w: 90 },
    { id: "actions", label: "", w: 60 },
  ];
  const [page, setPage] = useStateC(1);
  const [pageSize, setPageSize] = useStateC(50);
  const sliced = businesses.slice((page-1)*pageSize, page*pageSize);
  const sortClick = (id) => {
    if (sortBy === id) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(id); setSortDir("desc"); }
  };
  return (
    <div className="sheet">
      <div className="sheet-wrap">
        <table className="sheet-table">
          <thead>
            <tr>
              {cols.map(c => (
                <th key={c.id} style={{ width: c.w, minWidth: c.w }}
                    className={sortBy === c.id ? "sorted" : ""}
                    onClick={() => c.id !== "actions" && sortClick(c.id)}>
                  {c.label}
                  {c.id !== "num" && c.id !== "actions" && (
                    <span className="sortic">{sortBy === c.id ? (sortDir === "asc" ? "↑" : "↓") : "↕"}</span>
                  )}
                </th>
              ))}
            </tr>
            <tr className="filter-row">
              <td />
              <td><input placeholder="filter name…" /></td>
              <td><input placeholder="category…" /></td>
              <td><input placeholder="≥ 4.0" /></td>
              <td><input placeholder="≥ 100" /></td>
              <td><input placeholder="+971…" /></td>
              <td><input placeholder="@" /></td>
              <td><input placeholder=".ae" /></td>
              <td><input placeholder="any" /></td>
              <td><input placeholder="any" /></td>
              <td />
            </tr>
          </thead>
          <tbody>
            {sliced.map((b, i) => (
              <tr key={b.id} className={active === b.id ? "active" : ""} onClick={() => onSelect(b.id)}>
                <td className="num">{String((page-1)*pageSize + i + 1).padStart(3,"0")}</td>
                <td className="name">{b.name}</td>
                <td>{b.category}</td>
                <td><Stars rating={b.rating} reviews={0} /></td>
                <td className="num">{b.reviews.toLocaleString()}</td>
                <td className="num">{b.phone}</td>
                <td>{b.email}</td>
                <td>{b.website}</td>
                <td>{b.address}</td>
                <td><span className={"tag " + b.status}>{b.status}</span></td>
                <td><button className="iconbtn" style={{ width: 22, height: 22 }} onClick={(e) => e.stopPropagation()}>{I.dot3({ size: 12 })}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sheet-foot">
        <div>
          {ar ? "إظهار" : "Showing"} <strong>{(page-1)*pageSize + 1}</strong>–<strong>{Math.min(page*pageSize, businesses.length)}</strong> {ar ? "من" : "of"} <strong>{businesses.length}</strong>
          <span style={{ margin: "0 12px", color: "var(--ink-4)" }}>·</span>
          <select value={pageSize} onChange={(e) => { setPageSize(+e.target.value); setPage(1); }} style={{ background: "transparent", border: 0, color: "var(--ink)", fontSize: 12 }}>
            <option>25</option><option>50</option><option>100</option>
          </select> {ar ? "في الصفحة" : "per page"}
        </div>
        <div className="pages">
          <button onClick={() => setPage(Math.max(1, page-1))}>{I.chevL({ size: 11 })}</button>
          {[1,2,3,4].slice(0, Math.ceil(businesses.length / pageSize)).map(p => (
            <button key={p} className={p === page ? "on" : ""} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button onClick={() => setPage(Math.min(Math.ceil(businesses.length / pageSize), page+1))}>{I.chevR({ size: 11 })}</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SplitView, MapView, ListView, GridView, SheetView, Card, Stars, MapPane });
