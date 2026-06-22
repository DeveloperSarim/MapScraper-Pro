// MapScraper Pro — shared icon set (inline SVG components)
const Icon = ({ d, size = 14, strokeWidth = 1.6, fill = "none", style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill={fill} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);

const I = {
  pin:        (p) => <Icon {...p} d="M8 14s5-4.2 5-8.2A5 5 0 1 0 3 5.8C3 9.8 8 14 8 14z M8 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />,
  tag:        (p) => <Icon {...p} d="M2 8.5V3a1 1 0 0 1 1-1h5.5L14 7.5l-6.5 6.5L2 8.5z M5.5 5.5h.01" />,
  search:     (p) => <Icon {...p} d="M7 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M14 14l-3.5-3.5" />,
  ruler:      (p) => <Icon {...p} d="M2 6l8-4 4 8-8 4-4-8z M4.5 7.5l.7-.35 M6.5 8.5l1-.5 M8.5 9.5l.7-.35 M10.5 10.5l1-.5" />,
  bars:       (p) => <Icon {...p} d="M2 13V8 M6 13V4 M10 13V6 M14 13V2" />,
  globe:      (p) => <Icon {...p} d="M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z M2 8h12 M8 2c1.7 1.6 2.7 3.7 2.7 6S9.7 12.4 8 14 5.3 10.3 5.3 8 6.3 3.6 8 2z" />,
  map:        (p) => <Icon {...p} d="M2 4l4-2 4 2 4-2v10l-4 2-4-2-4 2V4z M6 2v10 M10 4v10" />,
  list:       (p) => <Icon {...p} d="M5 4h9 M5 8h9 M5 12h9 M2 4h.01 M2 8h.01 M2 12h.01" />,
  sheet:      (p) => <Icon {...p} d="M2 3h12v10H2z M2 6h12 M2 10h12 M6 3v10 M10 3v10" />,
  split:      (p) => <Icon {...p} d="M2 3h12v10H2z M8 3v10" />,
  funnel:     (p) => <Icon {...p} d="M2 3h12l-4.5 5.5V13l-3-1.5v-3L2 3z" />,
  download:   (p) => <Icon {...p} d="M8 2v8 M5 7l3 3 3-3 M3 13h10" />,
  chev:       (p) => <Icon {...p} d="M5 6l3 3 3-3" />,
  chevD:      (p) => <Icon {...p} d="M5 6l3 3 3-3" />,
  chevR:      (p) => <Icon {...p} d="M6 5l3 3-3 3" />,
  chevL:      (p) => <Icon {...p} d="M10 5L7 8l3 3" />,
  x:          (p) => <Icon {...p} d="M3 3l10 10 M13 3L3 13" />,
  star:       (p) => <Icon {...p} fill="currentColor" strokeWidth={0} d="M8 1.5l1.9 3.85 4.25.62-3.07 3 .72 4.23L8 11.2l-3.8 2L4.92 9 1.85 5.97l4.25-.62L8 1.5z" />,
  phone:      (p) => <Icon {...p} d="M3.5 2.5h2l1 3-1.5 1a8 8 0 0 0 4 4l1-1.5 3 1v2A1.5 1.5 0 0 1 11.5 13.5 10 10 0 0 1 2.5 4.5 1.5 1.5 0 0 1 3.5 2.5z" />,
  mail:       (p) => <Icon {...p} d="M2 4h12v8H2z M2 4l6 4.5L14 4" />,
  link:       (p) => <Icon {...p} d="M9.5 5l1.5-1.5a2.5 2.5 0 1 1 3.5 3.5L13 8.5 M6.5 11l-1.5 1.5a2.5 2.5 0 1 1-3.5-3.5L3 7.5 M5.5 10.5l5-5" />,
  home:       (p) => <Icon {...p} d="M2 7l6-5 6 5v6h-4V9H6v4H2V7z" />,
  copy:       (p) => <Icon {...p} d="M5 5V3a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-2 M2 6h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" />,
  plus:       (p) => <Icon {...p} d="M8 3v10 M3 8h10" />,
  minus:      (p) => <Icon {...p} d="M3 8h10" />,
  expand:     (p) => <Icon {...p} d="M3 6V3h3 M10 3h3v3 M13 10v3h-3 M6 13H3v-3" />,
  refresh:    (p) => <Icon {...p} d="M2 8a6 6 0 0 1 10.5-4 M14 8a6 6 0 0 1-10.5 4 M11 2v3h3 M5 14v-3H2" />,
  bell:       (p) => <Icon {...p} d="M3 11h10l-1-2V6a4 4 0 0 0-8 0v3L3 11z M6.5 13a1.5 1.5 0 0 0 3 0" />,
  clock:      (p) => <Icon {...p} d="M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z M8 4.5V8l2.5 1.5" />,
  doc:        (p) => <Icon {...p} d="M3.5 1.5h6L13 5v9a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V2.5a1 1 0 0 1 1-1z M9.5 1.5V5H13" />,
  spark:      (p) => <Icon {...p} d="M8 2v3 M8 11v3 M2 8h3 M11 8h3 M4 4l2 2 M10 10l2 2 M4 12l2-2 M10 6l2-2" />,
  cmd:        (p) => <Icon {...p} d="M4 6a1.5 1.5 0 1 1 1.5-1.5V11.5A1.5 1.5 0 1 1 4 10 M12 10a1.5 1.5 0 1 1-1.5 1.5V4.5A1.5 1.5 0 1 1 12 6 M5.5 4.5h5 v7 h-5z" />,
  filter:     (p) => <Icon {...p} d="M2 3h12 M4 7h8 M6 11h4" />,
  sort:       (p) => <Icon {...p} d="M4 3v10 M2 11l2 2 2-2 M12 3v10 M10 5l2-2 2 2" />,
  eye:        (p) => <Icon {...p} d="M1.5 8s2.5-5 6.5-5 6.5 5 6.5 5-2.5 5-6.5 5S1.5 8 1.5 8z M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />,
  dot3:       (p) => <Icon {...p} d="M4 8h.01 M8 8h.01 M12 8h.01" strokeWidth={2.4} />,
  check:      (p) => <Icon {...p} d="M3 8.5l3 3 7-7" />,
  grid:       (p) => <Icon {...p} d="M2 2h5v5H2z M9 2h5v5H9z M2 9h5v5H2z M9 9h5v5H9z" />,
  draw:       (p) => <Icon {...p} d="M3 13l2-1 7-7-1-1-7 7-1 2z M11 4l1 1 M9 3l2 2" />,
  polygon:    (p) => <Icon {...p} d="M8 2l5 4-2 6H5L3 6z" />,
};

window.I = I;
window.Icon = Icon;
