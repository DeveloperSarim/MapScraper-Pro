// MapScraper Pro — left sidebar (search panel) — v2 with cascade location, multi-category, keyword chips

// ── Data Source status (backend + optional Google key) ────────────────────────
function ApiKeyInput({ ar }) {
  const [backendOk, setBackendOk] = React.useState(null); // null=checking, true, false
  const [googleKey, setGoogleKey] = React.useState(localStorage.getItem("gApiKey") || "");
  const [showKeyForm, setShowKeyForm] = React.useState(false);
  const [keyInput, setKeyInput] = React.useState(localStorage.getItem("gApiKey") || "");

  // Check backend health on mount + every 8s
  React.useEffect(() => {
    const v = localStorage.getItem("gApiKey") || "";
    window.GOOGLE_API_KEY = v;

    const check = async () => {
      try {
        const backendBase = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
          ? "http://127.0.0.1:8000/api/v1"
          : "/api/v1";
        const r = await fetch(`${backendBase}/health`, { signal: AbortSignal.timeout(2000) });
        setBackendOk(r.ok);
        if (r.ok) window._backendAvailable = true;
      } catch(_) {
        setBackendOk(false);
        window._backendAvailable = false;
      }
    };
    check();
    const id = setInterval(check, 8000);
    return () => clearInterval(id);
  }, []);

  const saveKey = () => {
    const v = keyInput.trim();
    localStorage.setItem("gApiKey", v);
    window.GOOGLE_API_KEY = v;
    setGoogleKey(v);
    setShowKeyForm(false);
  };

  const clearKey = () => {
    localStorage.removeItem("gApiKey");
    window.GOOGLE_API_KEY = "";
    setGoogleKey("");
    setKeyInput("");
  };

  const hasKey = !!googleKey;
  const sourceLabel = backendOk
    ? "Google Maps Scraper ✓"
    : hasKey
      ? "Google Places API ✓"
      : "OpenStreetMap (limited)";
  const dotOn = backendOk || hasKey;

  return (
    <div className="api-key-wrap">
      <div className="api-key-status">
        <span className={"api-dot" + (dotOn ? " on" : "")} />
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,fontWeight:600,color: dotOn ? "var(--accent)" : "var(--ink-3)"}}>
            {backendOk === null ? "Checking data source…" : sourceLabel}
          </div>
          {!backendOk && !hasKey && (
            <div style={{fontSize:11,color:"var(--ink-4)",marginTop:1}}>
              Add a Google API key for real data
            </div>
          )}
        </div>
        {!hasKey
          ? <button className="api-toggle-btn" onClick={() => setShowKeyForm(s => !s)}>
              {showKeyForm ? "Hide" : "API Key"}
            </button>
          : <button className="api-toggle-btn" onClick={clearKey} style={{color:"#d44"}}>Remove</button>
        }
      </div>

      {showKeyForm && !hasKey && (
        <div className="api-key-form">
          <input
            type="password"
            className="api-key-inp"
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            placeholder="AIza… paste Google API key"
            onKeyDown={e => { if (e.key === "Enter") saveKey(); }}
            autoFocus
          />
          <button className="api-key-save" onClick={saveKey} disabled={!keyInput.trim()}>Save</button>
        </div>
      )}

      {!backendOk && !hasKey && (
        <div className="api-key-hint">
          The backend scraper is offline. Start it to get real Google Maps data without any API key.
        </div>
      )}
    </div>
  );
}

function Ring({ pct = 0 }) {
  const r = 15, c = 2 * Math.PI * r;
  return (
    <div className="ring">
      <svg width="38" height="38">
        <circle className="ring-track" cx="19" cy="19" r={r} fill="none" strokeWidth="2.5" />
        <circle className="ring-fill" cx="19" cy="19" r={r} fill="none" strokeWidth="2.5"
                strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" />
      </svg>
      <div className="ring-num">{Math.round(pct * 100)}</div>
    </div>
  );
}

function Sidebar({ state, on, mobOpen, onMobClose }) {
  const { lang, geo, categories, keywords, radius, maxResults, running, found, total, logIdx, recent, pfState, hasResults, hasPolygon } = state;
  const ar = lang === "ar";
  const pct = (running && total > 0) ? Math.min(found / total, 1) : 0;

  return (
    <aside className={"side" + (mobOpen ? " mob-open" : "")}>
      <div className="side-scroll">
        <div className="logo">
          <div className="logo-mark">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M8 14s5-4.2 5-8.2A5 5 0 1 0 3 5.8C3 9.8 8 14 8 14z" />
              <circle cx="8" cy="5.8" r="1.6" />
            </svg>
          </div>
          <div className="logo-wm">MapScraper <em>Pro</em></div>
        </div>

        {/* Map-based pin search shortcut */}
        <button className="pin-search-btn" onClick={() => on.openPinSearch()}>
          <span className="pin-search-ic">{I.pin({ size: 14 })}</span>
          <span>
            <span className="pin-search-t">{ar ? "بحث من الخريطة" : "Search from map"}</span>
            <span className="pin-search-s">{ar ? "ضع دبوسًا واختر الفئات" : "Drop a pin, pick categories"}</span>
          </span>
          {I.expand({ size: 12 })}
        </button>

        <div className="side-section">
          <div className="side-label">
            <span>{ar ? "بحث جديد" : "New Query"}</span>
            <span className="kbd">⌘ K</span>
          </div>

          {/* Location cascade */}
          <div className="field-stack">
            <div className="field-label">
              {ar ? "الموقع" : "Location"}
              {geo.city && <span className="field-hint">{geo.country.split(" ")[0]} {geo.city}</span>}
            </div>
            <LocationCascade value={geo} onChange={(v) => on.set({ geo: v })} />
            {(geo.districts?.length > 0 || geo.areas?.length > 0) && (
              <div className="chiprow">
                {geo.districts.map(d => (
                  <span key={"d-" + d} className="kw small loc-d">
                    {I.pin({ size: 8 })} {d}
                    <button onClick={() => on.set({ geo: { ...geo, districts: geo.districts.filter(x => x !== d), areas: geo.areas.filter(a => !((window.GEO_DATA[geo.country]?.[geo.city]?.[d]) || []).includes(a)) } })}>{I.x({ size: 8, strokeWidth: 2.4 })}</button>
                  </span>
                ))}
                {geo.areas.map(a => (
                  <span key={"a-" + a} className="kw small loc-a">
                    {a}
                    <button onClick={() => on.set({ geo: { ...geo, areas: geo.areas.filter(x => x !== a) } })}>{I.x({ size: 8, strokeWidth: 2.4 })}</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Category multi-select with groups */}
          <div className="field-stack">
            <div className="field-label">{ar ? "الفئات" : "Categories"}</div>
            <Combobox
              icon={I.tag({ size: 13 })}
              placeholder={ar ? "ابحث في فئات Google Maps…" : "Search Google Maps categories…"}
              groups={window.CATEGORY_GROUPS}
              value={categories}
              onChange={(v) => on.set({ categories: v })}
              label="categories"
            />
            {categories.length > 0 && (
              <div className="chiprow">
                {categories.slice(0, 6).map(c => (
                  <span key={c} className="kw small">
                    {c}
                    <button onClick={() => on.set({ categories: categories.filter(x => x !== c) })}>{I.x({ size: 8, strokeWidth: 2.4 })}</button>
                  </span>
                ))}
                {categories.length > 6 && <span className="kw small more">+{categories.length - 6}</span>}
              </div>
            )}
          </div>

          {/* Keywords — chips */}
          <div className="field-stack">
            <div className="field-label">
              {ar ? "الكلمات المفتاحية" : "Keywords"}
              <span className="field-hint">{ar ? "اضغط Enter بعد كل كلمة" : "press Enter after each"}</span>
            </div>
            <KeywordChips
              value={keywords}
              onChange={(v) => on.set({ keywords: v })}
              placeholder={ar ? "فاخر، توصيل، 24 ساعة…" : "luxury, 24-hour, delivery…"}
              suggestions={["delivery","24-hour","outdoor seating","family-friendly","luxury","valet","reservations"]}
            />
          </div>

          <div className="field-row">
            <div className="field-stack" style={{ flex: 1 }}>
              <div className="field-label small">{ar ? "نصف القطر" : "Radius"}</div>
              <div className="field">
                <span className="field-icon">{I.ruler({ size: 13 })}</span>
                <select value={radius} onChange={(e) => on.set({ radius: e.target.value })}>
                  <option>0.5 km</option><option>1 km</option><option>5 km</option><option>10 km</option><option>Unlimited</option>
                </select>
              </div>
            </div>
            <div className="field-stack" style={{ flex: 1 }}>
              <div className="field-label small">{ar ? "حد النتائج" : "Max"}</div>
              <div className="slider-row mini">
                <input type="range" min="10" max="500" step="10" value={maxResults}
                       onChange={(e) => on.set({ maxResults: +e.target.value })} />
                <span className="val">{maxResults >= 500 ? "∞" : maxResults}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="side-section">
          <div className="side-label"><span>{ar ? "تصفية مسبقة" : "Pre-filters"}</span></div>
          <div className="chips" style={{ padding: "0 2px" }}>
            {[
              { key: "pfPhone",   label: "Has phone" },
              { key: "pfEmail",   label: "Has email" },
              { key: "pfWebsite", label: "Has website" },
              { key: "pfOpen",    label: "Open now" },
              { key: "pfRated",   label: "Rated 4+" },
            ].map(({ key, label }) => (
              <button key={key} className={"chip" + ((pfState && pfState[key]) ? " on" : "")}
                      onClick={() => on.togglePf(key)}>{label}</button>
            ))}
          </div>
        </div>

        <div className="side-section">
          <div className="side-label"><span>{ar ? "البحث الأخير" : "Recent searches"}</span></div>
          <div className="recent-list">
            {recent.length === 0
              ? <div style={{ fontSize: 12, color: "var(--ink-4)", padding: "4px 2px" }}>No searches yet — results will appear here</div>
              : recent.map((r, i) => (
                <div key={i} className="recent" onClick={() => on.loadRecent(r)}>
                  <span className="dot" />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.cat} <span style={{ color: "var(--ink-4)" }}>· {r.loc}</span>
                  </span>
                  <span className="meta">{r.count}</span>
                </div>
              ))
            }
          </div>
        </div>

        <div className="side-section">
          <div className="side-label">
            <span>{ar ? "مصدر البيانات" : "Data Source"}</span>
          </div>
          <ApiKeyInput ar={ar} />
        </div>

        <div className="side-section">
          <div className="side-label"><span>{ar ? "اللغة" : "Language"}</span></div>
          <div className="lang">
            <button className={lang === "en" ? "on" : ""} onClick={() => on.set({ lang: "en" })} data-l="en">EN</button>
            <button className={lang === "ar" ? "on" : ""} onClick={() => on.set({ lang: "ar" })} data-l="ar">العربية</button>
          </div>
        </div>
      </div>

      <div className="side-foot">
        <div className="cta-row">
          <button
            className={"cta" + (running ? " running" : "") + (hasPolygon ? " poly-mode" : "")}
            onClick={on.toggleRun}
            disabled={categories.length === 0 || (!geo.city && !hasPolygon)}>
            {running
              ? (ar ? "جاري الجمع…" : "Scraping…")
              : hasPolygon
                ? (ar ? "ابدأ البحث في المنطقة" : "Search Polygon Area")
                : (ar ? "ابدأ الجمع" : "Start Scraping")}
            {!running && <span className="kbd-inline">⏎</span>}
          </button>
          <button className="reset-btn" onClick={on.resetAll} title="Reset everything">
            {I.refresh({ size: 13 })}
          </button>
        </div>

        {!running && categories.length === 0 && (
          <div className="side-warn">
            {ar ? "اختر فئة واحدة على الأقل" : "Pick at least one category"}
          </div>
        )}
        {!running && categories.length > 0 && !geo.city && !hasPolygon && (
          <div className="side-warn">
            {ar ? "اختر المدينة أولاً" : "Pick a city or draw a polygon"}
          </div>
        )}

        {running && (
          <div className="progress">
            <Ring pct={pct} />
            <div className="progress-body">
              <div className="progress-title">
                {ar ? "تم العثور على" : "Found"} <strong>{found}</strong> {ar ? "نشاطًا" : "businesses"}
              </div>
              <div className="progress-sub">{window.SCRAPE_LOG_LINES[logIdx % window.SCRAPE_LOG_LINES.length]}</div>
            </div>
            <button className="cancel-link" onClick={on.toggleRun}>{ar ? "إلغاء" : "Cancel"}</button>
          </div>
        )}
      </div>
    </aside>
  );
}

window.Sidebar = Sidebar;
