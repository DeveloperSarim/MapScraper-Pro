// MapScraper Pro — top bar
function TopBar({ state, on }) {
  const { lang, view, total, running, search, exportOpen, columnsOpen, filterOpen, geo, categories } = state;
  const ar = lang === "ar";
  const viewOpts = [
    { id: "split", label: ar ? "مقسم" : "Split View", ic: I.split },
    { id: "map",   label: ar ? "خريطة" : "Map", ic: I.map },
    { id: "list",  label: ar ? "قائمة" : "List", ic: I.list },
    { id: "grid",  label: ar ? "شبكة" : "Grid", ic: I.grid },
    { id: "sheet", label: ar ? "جدول" : "Sheet", ic: I.sheet },
  ];

  const locationLabel = (() => {
    const parts = [];
    if (geo?.city) parts.push(geo.city);
    if (geo?.districts?.length === 1) parts.push(geo.districts[0]);
    else if (geo?.districts?.length > 1) parts.push(`${geo.districts.length} districts`);
    if (geo?.areas?.length > 0) parts.push(`${geo.areas.length} areas`);
    return parts.join(" · ") || "—";
  })();
  const categoryLabel = categories?.length > 0
    ? (categories.length === 1 ? categories[0] : `${categories[0]} +${categories.length - 1}`)
    : "—";

  return (
    <div className="top">
      <div className="crumbs">
        <span className="crumb">{ar ? "مساحات العمل" : "Workspaces"}</span>
        <span className="sep">/</span>
        <span className="crumb live">
          {categoryLabel} <em>·</em> {locationLabel}
        </span>
        <span className="badge" style={{ marginLeft: 8 }}>
          {running && <span className="pulse" />}
          <span>{total} {ar ? "نتيجة" : "businesses"}</span>
        </span>
      </div>

      <div className="spacer" />

      <div className="viewtog">
        {viewOpts.map(v => (
          <button key={v.id} className={state.view === v.id ? "on" : ""} onClick={() => on.set({ view: v.id })}>
            <v.ic size={13} /> {v.label}
          </button>
        ))}
      </div>

      <div className="inline-search">
        {I.search({ size: 13, style: { position: "absolute", left: 10 } })}
        <input value={search} onChange={(e) => on.set({ search: e.target.value })}
               placeholder={ar ? "بحث في النتائج…" : "Search within results…"} />
        <span className="kbd-inline">/</span>
      </div>

      <button className="iconbtn" title="Filters" onClick={() => on.set({ filterOpen: true })}>
        {I.funnel({ size: 14 })}
        {state.activeFilters > 0 && <span className="dot-on" />}
      </button>

      <button className="iconbtn" title="Refresh"><I.refresh size={14} /></button>

      <div className="dd-wrap">
        <button className="btn dark" onClick={() => on.set({ exportOpen: !exportOpen })}>
          <I.download size={13} /> {ar ? "تصدير" : "Export"} <I.chev size={11} />
        </button>
        {exportOpen && (
          <div className="dd-menu" onMouseLeave={() => on.set({ exportOpen: false })}>
            <div className="dd-section">{ar ? "تصدير الكل" : "Export all"} · {total}</div>
            <div className="dd-item" onClick={() => on.doExport("CSV")}><I.doc /> CSV<span className="ext">.csv</span></div>
            <div className="dd-item" onClick={() => on.doExport("Excel")}><I.sheet /> Excel<span className="ext">.xlsx</span></div>
            <div className="dd-item" onClick={() => on.doExport("PDF")}><I.doc /> PDF Report<span className="ext">.pdf</span></div>
            <div className="dd-item" onClick={() => on.doExport("JSON")}><I.doc /> JSON<span className="ext">.json</span></div>
            <div className="dd-section">{ar ? "إرسال إلى" : "Send to"}</div>
            <div className="dd-item"><I.link /> Google Sheets<span className="ext">⌘E</span></div>
            <div className="dd-item"><I.link /> Webhook<span className="ext">POST</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

window.TopBar = TopBar;
