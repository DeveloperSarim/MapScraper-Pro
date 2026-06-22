// MapScraper Pro — Combobox, LocationCascade, KeywordChips
const useStateC = React.useState;
const useEffectC = React.useEffect;
const useRefC = React.useRef;

// Hook: close popover on outside click
function useOutside(ref, onClose) {
  useEffectC(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
}

// ============ Combobox (grouped multi-select with search) ============
function Combobox({ icon, placeholder, groups, value, onChange, label = "items" }) {
  const [open, setOpen] = useStateC(false);
  const [q, setQ] = useStateC("");
  const ref = useRefC(null);
  const inputRef = useRefC(null);
  useOutside(ref, () => setOpen(false));

  useEffectC(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  const ql = q.toLowerCase().trim();
  const matched = React.useMemo(() => {
    const out = {};
    Object.entries(groups).forEach(([g, items]) => {
      const m = items.filter(it => it.toLowerCase().includes(ql));
      if (m.length) out[g] = m;
    });
    return out;
  }, [groups, ql]);

  const totalMatched = Object.values(matched).reduce((s, a) => s + a.length, 0);

  const toggle = (item) => {
    if (value.includes(item)) onChange(value.filter(v => v !== item));
    else onChange([...value, item]);
  };

  const summary = value.length === 0
    ? <span className="ph">{placeholder}</span>
    : value.length === 1 ? value[0]
    : `${value[0]} + ${value.length - 1} more`;

  return (
    <div className="combo" ref={ref}>
      <button type="button" className={"field-trigger" + (open ? " open" : "")} onClick={() => setOpen(o => !o)}>
        <span className="field-icon">{icon}</span>
        <span className="field-summary">{summary}</span>
        {value.length > 0 && <span className="field-count">{value.length}</span>}
        <span className="field-caret">{I.chevD({ size: 11 })}</span>
      </button>
      {open && (
        <div className="combo-pop">
          <div className="combo-search">
            {I.search({ size: 13 })}
            <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${label}…`} />
            {q && <button className="combo-clear" onClick={() => setQ("")}>Clear</button>}
          </div>
          <div className="combo-list">
            {totalMatched === 0 ? (
              <div className="combo-empty">No matches for "{q}"</div>
            ) : Object.entries(matched).map(([g, items]) => (
              <React.Fragment key={g}>
                <div className="combo-group-h">{g}</div>
                {items.map(it => {
                  const on = value.includes(it);
                  return (
                    <button key={g + "|" + it} type="button" className={"combo-row" + (on ? " on" : "")} onClick={() => toggle(it)}>
                      <span className="combo-check">{on && I.check({ size: 10, strokeWidth: 2.5 })}</span>
                      <span className="combo-label">{it}</span>
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          <div className="combo-foot">
            <span>{value.length} selected</span>
            <div style={{ display: "flex", gap: 6 }}>
              {value.length > 0 && <button className="combo-clear" onClick={() => onChange([])}>Clear all</button>}
              <button onClick={() => setOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ LocationCascade — sequential stepper: Country → City → Districts → Areas ============
function LocationCascade({ value, onChange }) {
  const [open, setOpen] = useStateC(false);
  const [step, setStep] = useStateC(0);
  const [country, setCountry] = useStateC("");
  const [city, setCity] = useStateC("");
  const [districts, setDistricts] = useStateC([]);
  const [areas, setAreas] = useStateC([]);
  const [dq, setDq] = useStateC("");
  const ref = useRefC(null);
  const triggerRef = useRefC(null);
  const [popPos, setPopPos] = useStateC(null);
  useOutside(ref, () => setOpen(false));

  // Sync from parent value whenever popover opens
  const openPop = () => {
    // Calculate fixed position from trigger rect so sidebar overflow:hidden can't clip it
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPopPos({ top: r.bottom + 4, left: r.left, width: Math.max(320, r.width) });
    }
    const c = value.country || "", ci = value.city || "";
    const d = value.districts || [], a = value.areas || [];
    setCountry(c); setCity(ci); setDistricts(d); setAreas(a); setDq("");
    if (!c) setStep(0);
    else if (!ci) setStep(1);
    else setStep(2);
    setOpen(true);
  };

  const data = window.GEO_DATA || {};
  const countries = Object.keys(data);
  const cities = country ? Object.keys(data[country] || {}) : [];
  const districtMap = country && city ? (data[country]?.[city] || {}) : {};
  const allDistricts = Object.keys(districtMap);

  const toggleD = (d) => {
    if (districts.includes(d)) {
      setDistricts(districts.filter(x => x !== d));
      setAreas(areas.filter(a => !(districtMap[d] || []).includes(a)));
    } else {
      setDistricts([...districts, d]);
    }
  };

  const toggleA = (a) => {
    if (areas.includes(a)) setAreas(areas.filter(x => x !== a));
    else setAreas([...areas, a]);
  };

  const apply = () => { onChange({ country, city, districts, areas }); setOpen(false); };

  const totalCount = districts.length + areas.length;

  const summary = !value.country
    ? <span className="ph">Pick a location…</span>
    : (() => {
        const flag = value.country.split(" ")[0];
        const parts = [value.city || "—"];
        if ((value.areas || []).length) parts.push(`${value.areas.length} area${value.areas.length === 1 ? "" : "s"}`);
        else if ((value.districts || []).length) parts.push(value.districts.length === 1 ? value.districts[0] : `${value.districts.length} districts`);
        return flag + " " + parts.join(" · ");
      })();

  return (
    <div className="combo" ref={ref}>
      <button ref={triggerRef} type="button" className={"field-trigger" + (open ? " open" : "")} onClick={openPop}>
        <span className="field-icon">{I.pin({ size: 13 })}</span>
        <span className="field-summary">{summary}</span>
        {totalCount > 0 && <span className="field-count">{totalCount}</span>}
        <span className="field-caret">{I.chevD({ size: 11 })}</span>
      </button>

      {open && (
        <div className="combo-pop casc-step-pop" style={popPos ? {
          position: "fixed",
          top: popPos.top,
          left: popPos.left,
          width: popPos.width,
          maxWidth: "min(360px, calc(100vw - 20px))",
          zIndex: 400,
        } : {}}>

          {/* Breadcrumb nav */}
          <div className="casc-nav">
            <div className="casc-breadcrumbs">
              <button className={"casc-crumb" + (step === 0 ? " active" : "")} onClick={() => setStep(0)}>
                {country ? country.split(" ").slice(0, 2).join(" ") : "Country"}
              </button>
              {country && (
                <React.Fragment>
                  <span className="casc-sep">{I.chevR({ size: 9 })}</span>
                  <button className={"casc-crumb" + (step === 1 ? " active" : "")} onClick={() => setStep(1)}>
                    {city || "City"}
                  </button>
                </React.Fragment>
              )}
              {city && (
                <React.Fragment>
                  <span className="casc-sep">{I.chevR({ size: 9 })}</span>
                  <button className={"casc-crumb" + (step === 2 ? " active" : "")} onClick={() => setStep(2)}>
                    {districts.length > 0 ? `${districts.length} district${districts.length === 1 ? "" : "s"}` : "Districts"}
                  </button>
                </React.Fragment>
              )}
              {districts.length > 0 && (
                <React.Fragment>
                  <span className="casc-sep">{I.chevR({ size: 9 })}</span>
                  <button className={"casc-crumb" + (step === 3 ? " active" : "")} onClick={() => setStep(3)}>
                    {areas.length > 0 ? `${areas.length} area${areas.length === 1 ? "" : "s"}` : "Areas"}
                  </button>
                </React.Fragment>
              )}
            </div>
          </div>

          {/* Step 0 — Country */}
          {step === 0 && (
            <div className="casc-list">
              <div className="casc-list-h">Select Country</div>
              {countries.map(c => (
                <button key={c} type="button" className={"cascade-row" + (country === c ? " on" : "")}
                  onClick={() => { setCountry(c); setCity(""); setDistricts([]); setAreas([]); setStep(1); }}>
                  <span>{c}</span>
                  {I.chevR({ size: 10 })}
                </button>
              ))}
            </div>
          )}

          {/* Step 1 — City */}
          {step === 1 && (
            <div className="casc-list">
              <div className="casc-list-h">Select City — {country.split(" ").slice(1).join(" ") || country}</div>
              {cities.length === 0
                ? <div className="cascade-empty">No cities available</div>
                : cities.map(c => (
                  <button key={c} type="button" className={"cascade-row" + (city === c ? " on" : "")}
                    onClick={() => { setCity(c); setDistricts([]); setAreas([]); setStep(2); }}>
                    <span>{c}</span>
                    {I.chevR({ size: 10 })}
                  </button>
                ))
              }
            </div>
          )}

          {/* Step 2 — Districts (multi) */}
          {step === 2 && (
            <div className="casc-list">
              <div className="casc-list-h">
                Districts — {city}
                {districts.length > 0 && <span className="cascade-pill">{districts.length}</span>}
              </div>
              <div className="casc-search-wrap">
                {I.search({ size: 12 })}
                <input
                  className="casc-search-inp"
                  placeholder="Search districts…"
                  value={dq}
                  onChange={e => setDq(e.target.value)}
                  autoFocus
                />
                {dq && <button className="casc-search-clear" onClick={() => setDq("")}>{I.x({ size: 9 })}</button>}
              </div>
              {!dq && (
                <button type="button"
                  className={"cascade-row multi cascade-all" + (allDistricts.length > 0 && districts.length === allDistricts.length ? " on" : "")}
                  onClick={() => {
                    if (districts.length === allDistricts.length) { setDistricts([]); setAreas([]); }
                    else setDistricts([...allDistricts]);
                  }}>
                  <span className="cascade-check">
                    {allDistricts.length > 0 && districts.length === allDistricts.length && I.check({ size: 9, strokeWidth: 2.5 })}
                  </span>
                  <span>All Districts</span>
                  <span className="cascade-all-count">{allDistricts.length}</span>
                </button>
              )}
              {(() => {
                const filtered = dq.trim()
                  ? allDistricts.filter(d => d.toLowerCase().includes(dq.toLowerCase()))
                  : allDistricts;
                return filtered.length === 0
                  ? <div className="cascade-empty">No districts match "{dq}"</div>
                  : filtered.map(d => {
                    const on = districts.includes(d);
                    return (
                      <button key={d} type="button" className={"cascade-row multi" + (on ? " on" : "")} onClick={() => toggleD(d)}>
                        <span className="cascade-check">{on && I.check({ size: 9, strokeWidth: 2.5 })}</span>
                        <span>{d}</span>
                      </button>
                    );
                  });
              })()}
            </div>
          )}

          {/* Step 3 — Areas (multi) */}
          {step === 3 && (
            <div className="casc-list">
              <div className="casc-list-h">
                Areas
                {areas.length > 0 && <span className="cascade-pill">{areas.length}</span>}
              </div>
              {districts.length === 0
                ? <div className="cascade-empty">Select districts first…</div>
                : districts.map(d => {
                  const dAreas = districtMap[d] || [];
                  const allSel = dAreas.length > 0 && dAreas.every(a => areas.includes(a));
                  return (
                    <React.Fragment key={d}>
                      <div className="cascade-sub">
                        {d}
                        <button className="cascade-sub-all" onClick={() => {
                          if (allSel) setAreas(areas.filter(a => !dAreas.includes(a)));
                          else setAreas([...new Set([...areas, ...dAreas])]);
                        }}>{allSel ? "Clear" : "All"}</button>
                      </div>
                      {dAreas.map(a => {
                        const on = areas.includes(a);
                        return (
                          <button key={a} type="button" className={"cascade-row multi" + (on ? " on" : "")} onClick={() => toggleA(a)}>
                            <span className="cascade-check">{on && I.check({ size: 9, strokeWidth: 2.5 })}</span>
                            <span>{a}</span>
                          </button>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              }
            </div>
          )}

          {/* Footer */}
          <div className="cascade-foot">
            <div className="cascade-sumtext">
              {country && city
                ? <React.Fragment>
                    {country.split(" ")[0]} <strong>{city}</strong>
                    {districts.length > 0 ? ` · ${districts.length} district${districts.length === 1 ? "" : "s"}` : ""}
                    {areas.length > 0 ? ` · ${areas.length} area${areas.length === 1 ? "" : "s"}` : ""}
                  </React.Fragment>
                : "Select country and city to continue"}
            </div>
            <div className="cascade-foot-btns">
              {step === 2 && districts.length > 0 && (
                <button className="cascade-btn" onClick={() => setStep(3)}>Areas →</button>
              )}
              <button className="cascade-btn" onClick={() => setOpen(false)}>Cancel</button>
              <button className="cascade-btn primary" disabled={!city} onClick={apply}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ KeywordChips (Enter to add) ============
function KeywordChips({ value, onChange, placeholder, suggestions = [] }) {
  const [draft, setDraft] = useStateC("");
  const inputRef = useRefC(null);

  const add = (raw) => {
    const v = (raw ?? draft).trim().replace(/,$/, "");
    if (!v) return;
    if (!value.includes(v)) onChange([...value, v]);
    setDraft("");
  };

  const onKey = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }
    else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
  };

  const remove = (k) => onChange(value.filter(x => x !== k));

  const unused = suggestions.filter(s => !value.includes(s));

  return (
    <div className="kw-wrap">
      <div className="kw-box" onClick={() => inputRef.current?.focus()}>
        {value.map(k => (
          <span key={k} className="kw">
            {k}
            <button onClick={(e) => { e.stopPropagation(); remove(k); }}>{I.x({ size: 9, strokeWidth: 2.4 })}</button>
          </span>
        ))}
        <input ref={inputRef} value={draft}
               onChange={(e) => setDraft(e.target.value)}
               onKeyDown={onKey}
               placeholder={value.length === 0 ? placeholder : ""} />
        {draft && (
          <button className="kw-add" onClick={() => add()}>{I.plus({ size: 11, strokeWidth: 2.6 })}</button>
        )}
      </div>
      {unused.length > 0 && value.length < 8 && (
        <div className="kw-sugg">
          <span className="kw-sugg-label">Suggest:</span>
          {unused.slice(0, 5).map(s => (
            <button key={s} className="kw-sugg-chip" onClick={() => add(s)}>+ {s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Combobox, LocationCascade, KeywordChips, useStateC });
