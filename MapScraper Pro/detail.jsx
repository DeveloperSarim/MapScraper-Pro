// MapScraper Pro — Detail panel + Filter drawer + Empty state + Toast

function DetailPanel({ b, ar, onClose, onExport }) {
  if (!b) return null;
  return (
    <aside className="detail">
      <div className="detail-head">
        <button className="detail-close" onClick={onClose}>{I.x({ size: 12 })}</button>
        <div className="detail-eyebrow">{b.category} · #{String(b.id).padStart(3,"0")}</div>
        <h2 className="detail-name">{b.name}</h2>
        <div className="detail-namear">{b.nameAr}</div>
        <div className="detail-row">
          <Stars rating={b.rating} reviews={b.reviews} />
          <span className={"tag " + b.status}>{b.status === "open" ? (ar ? "مفتوح الآن" : "Open now") : (ar ? "مغلق" : "Closed")}</span>
          <span className="tag price">{b.price}</span>
        </div>
      </div>

      <div className="detail-grid">
        <div className="kv"><div className="k">Phone</div><div className="v mono">{b.phone}</div></div>
        <div className="kv"><div className="k">Email</div><div className="v mono">{b.email}</div></div>
        <div className="kv"><div className="k">Website</div><div className="v">{b.website ? <a href={"https://" + b.website} target="_blank" rel="noopener noreferrer">{b.website} ↗</a> : <span style={{color:"var(--ink-4)"}}>—</span>}</div></div>
        <div className="kv"><div className="k">Maps Link</div><div className="v">{b.mapsLink ? <a href={b.mapsLink} target="_blank" rel="noopener noreferrer">{b.mapsLink.replace("https://","").slice(0,32)}… ↗</a> : <span style={{color:"var(--ink-4)"}}>—</span>}</div></div>
        <div className="kv"><div className="k">Address</div><div className="v">{b.address}</div></div>
        <div className="kv"><div className="k">Coordinates</div><div className="v mono">{b.lat.toFixed(4)}, {b.lng.toFixed(4)}</div></div>
      </div>

      <div className="detail-section">
        <h4>{ar ? "الخدمات" : "Services"}</h4>
        <div className="tags">{b.services.map(s => <span key={s} className="tg">{s}</span>)}</div>
      </div>

      <div className="detail-section">
        <h4>{ar ? "الوصف" : "Description"}</h4>
        <div className="detail-desc">{b.desc}</div>
      </div>

      <div className="detail-cta">
        <a className="btn primary" href={b.mapsLink} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:6,textDecoration:"none"}}>{I.link({ size: 12 })} Open in Maps</a>
        <button className="btn" onClick={onExport}>{I.download({ size: 12 })} Export Record</button>
      </div>
    </aside>
  );
}

function FilterDrawer({ open, onClose, state, on, ar }) {
  if (!open) return null;
  const { fRatingMin, fHasPhone, fHasEmail, fHasWebsite, fStatus, fCats, fPrice, fMinReviews } = state;
  const Tristate = ({ value, setValue }) => (
    <div className="tristate">
      {["any","yes","no"].map(v => (
        <button key={v} className={value === v ? "on" : ""} onClick={() => setValue(v)}>
          {v === "any" ? "Any" : v === "yes" ? "Yes" : "No"}
        </button>
      ))}
    </div>
  );
  return (
    <React.Fragment>
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer">
        <div className="drawer-head">
          <h3>{ar ? "تصفية النتائج" : "Filter results"}</h3>
          <button className="iconbtn" onClick={onClose}>{I.x({ size: 12 })}</button>
        </div>
        <div className="drawer-body">
          <div className="fgroup">
            <h5>Rating range</h5>
            <div className="range-row">
              <input type="number" min="0" max="5" step="0.1" defaultValue={fRatingMin} onChange={e => on.set({ fRatingMin: +e.target.value })} />
              <span className="dash">—</span>
              <input type="number" min="0" max="5" step="0.1" defaultValue="5.0" />
              <span style={{ marginLeft: 12, color: "var(--ink-3)", fontSize: 12 }}>stars</span>
            </div>
          </div>

          <div className="fgroup">
            <h5>Has phone number</h5>
            <Tristate value={fHasPhone} setValue={v => on.set({ fHasPhone: v })} />
          </div>
          <div className="fgroup">
            <h5>Has website</h5>
            <Tristate value={fHasWebsite} setValue={v => on.set({ fHasWebsite: v })} />
          </div>
          <div className="fgroup">
            <h5>Has email</h5>
            <Tristate value={fHasEmail} setValue={v => on.set({ fHasEmail: v })} />
          </div>

          <div className="fgroup">
            <h5>Business status</h5>
            <div className="tristate">
              {[["any","Any"],["open","Open"],["closed","Closed"]].map(([v,l]) => (
                <button key={v} className={fStatus === v ? "on" : ""} onClick={() => on.set({ fStatus: v })}>{l}</button>
              ))}
            </div>
          </div>

          <div className="fgroup">
            <h5>Category</h5>
            <div className="chips">
              {window.CATEGORIES.map(c => (
                <button key={c} className={"chip" + (fCats.includes(c) ? " on" : "")}
                        onClick={() => on.set({ fCats: fCats.includes(c) ? fCats.filter(x => x !== c) : [...fCats, c] })}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="fgroup">
            <h5>Price range</h5>
            <div className="chips">
              {["$","$$","$$$","$$$$"].map(p => (
                <button key={p} className={"chip" + (fPrice.includes(p) ? " on" : "")}
                        onClick={() => on.set({ fPrice: fPrice.includes(p) ? fPrice.filter(x => x !== p) : [...fPrice, p] })}
                        style={{ fontFamily: "var(--font-mono)" }}>{p}</button>
              ))}
            </div>
          </div>

          <div className="fgroup">
            <h5>Minimum reviews</h5>
            <div className="range-row">
              <input type="number" min="0" defaultValue={fMinReviews} onChange={e => on.set({ fMinReviews: +e.target.value })} />
              <span style={{ marginLeft: 12, color: "var(--ink-3)", fontSize: 12 }}>or more</span>
            </div>
          </div>
        </div>
        <div className="drawer-foot">
          <button className="reset" onClick={() => on.resetFilters()}>Reset all</button>
          <div style={{ flex: 1 }} />
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn dark" onClick={onClose}>Apply filters</button>
        </div>
      </aside>
    </React.Fragment>
  );
}

function EmptyState({ ar, onStart, onPinSearch, onRestoreAutosave }) {
  const hasAutosave = !!localStorage.getItem("msp_autosave");
  return (
    <div className="empty">
      <div className="empty-inner">
        <div className="empty-illu">
          <svg viewBox="0 0 200 140" fill="none">
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-soft)" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            {/* paper map */}
            <rect x="22" y="20" width="156" height="100" rx="4" fill="var(--panel)" stroke="var(--line-strong)" />
            <path d="M22 50 Q 60 45 100 55 T 178 50" stroke="var(--line-2)" fill="none" />
            <path d="M22 80 Q 60 75 100 90 T 178 80" stroke="var(--line-2)" fill="none" />
            <path d="M60 20 Q 65 60 50 100 T 60 120" stroke="var(--line-2)" fill="none" />
            <path d="M130 20 Q 140 55 120 95 T 130 120" stroke="var(--line-2)" fill="none" />
            {/* fold */}
            <path d="M100 20 V 120" stroke="var(--line)" strokeDasharray="2 3" />
            {/* pins */}
            <g>
              <path d="M68 60 c0-4 3-7 7-7s7 3 7 7-7 12-7 12-7-8-7-12z" fill="var(--accent)" stroke="#fff" strokeWidth="1.2" />
              <circle cx="75" cy="60" r="2" fill="#fff" />
            </g>
            <g>
              <path d="M118 80 c0-4 3-7 7-7s7 3 7 7-7 12-7 12-7-8-7-12z" fill="var(--ink)" stroke="#fff" strokeWidth="1.2" />
              <circle cx="125" cy="80" r="2" fill="#fff" />
            </g>
            <g opacity="0.5">
              <path d="M145 38 c0-3 2-5 5-5s5 2 5 5-5 9-5 9-5-6-5-9z" fill="var(--ink-3)" />
            </g>
            {/* compass */}
            <circle cx="36" cy="106" r="8" fill="var(--panel-soft)" stroke="var(--line-strong)" />
            <path d="M36 100 L38 106 L36 112 L34 106 Z" fill="var(--ink)" />
          </svg>
        </div>
        <h2>Search any business <em>on Google Maps.</em></h2>
        <p>Pin a location, pick a category, hit start. Results stream in live.</p>
        <p className="ar">حدد الموقع، اختر الفئة، ثم ابدأ. تظهر النتائج مباشرةً.</p>
        <div className="empty-ctas">
          <button className="empty-cta-primary" onClick={onPinSearch}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M8 14s5-4.2 5-8.2A5 5 0 1 0 3 5.8C3 9.8 8 14 8 14z"/>
              <circle cx="8" cy="5.8" r="1.6"/>
            </svg>
            {ar ? "ابحث من الخريطة" : "Drop a pin on map"}
          </button>
          <button className="empty-cta-sec" onClick={onStart}>
            {ar ? "ابدأ البحث ←" : "Start with sidebar →"}
          </button>
          {hasAutosave && onRestoreAutosave && (
            <button className="empty-cta-sec" onClick={onRestoreAutosave}>
              {I.refresh({ size: 12 })} Restore last session
            </button>
          )}
        </div>
        <div className="empty-hint">
          <span>Try</span>
          <span className="kbd-inline">⌘</span>
          <span className="kbd-inline">K</span>
          <span>to focus the location field</span>
        </div>
      </div>
    </div>
  );
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className="toast">
      <span className="check">{I.check({ size: 11, strokeWidth: 2.2 })}</span>
      <span>{toast}</span>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
}

Object.assign(window, { DetailPanel, FilterDrawer, EmptyState, Toast });
