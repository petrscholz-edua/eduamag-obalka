// ─── Ruka: ručně kreslené doodles jako vektory ─────────────────────────────────
// Kresby i písmo jsou zadané jako jednoduché čáry (lomené čáry a oblouky). Při vykreslení se
// čáry lehce roztřesou, konce se přetáhnou a vznikne linka jako od fixy. Všechno je ve stejných
// jednotkách, takže tloušťka čáry je u všech doodles i písmen stejná.
// Náhoda se předává zvenku (funkce vracející 0–1), aby stejné číslo varianty dalo stejnou kresbu.
const Ruka = (() => {
  const rad = d => d * Math.PI / 180;

  // ── stavební kameny čar ──
  const arc = (cx, cy, rx, ry, t0, t1, n) => {
    n = n || Math.max(6, Math.round(Math.abs(t1 - t0) / 12));
    const p = [];
    for (let i = 0; i <= n; i++) { const t = rad(t0 + (t1 - t0) * i / n); p.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]); }
    return p;
  };
  const bez = (a, b, c, d, n = 14) => {
    const p = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, m = 1 - t;
      p.push([m * m * m * a[0] + 3 * m * m * t * b[0] + 3 * m * t * t * c[0] + t * t * t * d[0],
              m * m * m * a[1] + 3 * m * m * t * b[1] + 3 * m * t * t * c[1] + t * t * t * d[1]]);
    }
    return p;
  };
  const join = (...parts) => parts.reduce((acc, p) => acc.concat(acc.length ? p.slice(1) : p), []);
  const mirror = s => s.map(([x, y]) => [-x, y]);
  const dot = (x, y, r = 0.55) => arc(x, y, r, r, 0, 360, 8);
  const move = (strokes, dx, dy, k = 1, rot = 0) => {
    const c = Math.cos(rad(rot)), s = Math.sin(rad(rot));
    return strokes.map(st => st.map(([x, y]) => [dx + (x * c - y * s) * k, dy + (x * s + y * c) * k]));
  };
  const bbox = strokes => {
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    strokes.forEach(st => st.forEach(([x, y]) => { x1 = Math.min(x1, x); y1 = Math.min(y1, y); x2 = Math.max(x2, x); y2 = Math.max(y2, y); }));
    return { x1, y1, x2, y2, w: x2 - x1, h: y2 - y1 };
  };

  // ── roztřesení a převod na křivku ──
  // step = jak husté jsou body, amp = jak moc se čára chvěje, over = jak daleko přetáhne konce
  function shake(st, R, amp, step, over) {
    const pts = [];
    for (let i = 0; i < st.length - 1; i++) {
      const [x0, y0] = st[i], [x1, y1] = st[i + 1];
      const k = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
      for (let j = 0; j < k; j++) pts.push([x0 + (x1 - x0) * j / k, y0 + (y1 - y0) * j / k]);
    }
    pts.push(st[st.length - 1]);
    let ox = 0, oy = 0;
    const out = pts.map(([x, y]) => { ox = ox * 0.65 + (R() * 2 - 1) * amp * 0.7; oy = oy * 0.65 + (R() * 2 - 1) * amp * 0.7; return [x + ox, y + oy]; });
    if (out.length > 1 && over > 0) {
      const ext = (a, b, d) => { const l = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1; return [a[0] + (a[0] - b[0]) / l * d, a[1] + (a[1] - b[1]) / l * d]; };
      out[0] = ext(out[0], out[1], R() * over);
      out[out.length - 1] = ext(out[out.length - 1], out[out.length - 2], R() * over);
    }
    return out;
  }
  const f = v => Math.round(v * 10) / 10;
  function pathD(p) {
    if (p.length < 2) return '';
    if (p.length === 2) return `M${f(p[0][0])} ${f(p[0][1])}L${f(p[1][0])} ${f(p[1][1])}`;
    const P = [p[0], ...p, p[p.length - 1]];
    let d = `M${f(P[1][0])} ${f(P[1][1])}`;
    for (let i = 1; i < P.length - 2; i++) {
      const [a, b, c, e] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
      d += `C${f(b[0] + (c[0] - a[0]) / 6)} ${f(b[1] + (c[1] - a[1]) / 6)} ${f(c[0] - (e[0] - b[0]) / 6)} ${f(c[1] - (e[1] - b[1]) / 6)} ${f(c[0])} ${f(c[1])}`;
    }
    return d;
  }
  // všechny čáry kresby jako jedna cesta (v Illustratoru jeden objekt)
  const draw = (strokes, R, amp = 1.3, step = 14, over = 4) => strokes.map(st => pathD(shake(st, R, amp, step, over))).join('');

  // ── ručně psané verzálky ──
  // jednotky: výška verzálek 14, účaří y = 14; [šířka, čáry]
  const G = {
    A: [10, [[[0, 14], [5, 0], [10, 14]], [[2.2, 9], [7.8, 9]]]],
    B: [9, [join([[0, 14], [0, 0], [5, 0]], arc(5, 3.5, 3.5, 3.5, -90, 90), [[5, 7], [0, 7]]), join([[0, 7], [5.5, 7]], arc(5.5, 10.5, 3.5, 3.5, -90, 90), [[5.5, 14], [0, 14]])]],
    C: [10.5, [arc(6, 7, 6, 7, -40, -320)]],
    D: [10, [join([[0, 14], [0, 0], [4, 0]], arc(4, 7, 6, 7, -90, 90), [[4, 14], [0, 14]])]],
    E: [8, [[[8, 0], [0, 0], [0, 14], [8, 14]], [[0, 7], [6.5, 7]]]],
    F: [8, [[[8, 0], [0, 0], [0, 14]], [[0, 7], [6.5, 7]]]],
    G: [12, [join(arc(6, 7, 6, 7, -40, -360), [[12, 7], [7.5, 7]])]],
    H: [10, [[[0, 0], [0, 14]], [[10, 0], [10, 14]], [[0, 7], [10, 7]]]],
    I: [0, [[[0, 0], [0, 14]]]],
    J: [8, [join([[8, 0], [8, 10]], arc(4, 10, 4, 4, 0, 180))]],
    K: [9, [[[0, 0], [0, 14]], [[9, 0], [0, 8.5]], [[3.2, 6], [9, 14]]]],
    L: [8, [[[0, 0], [0, 14], [8, 14]]]],
    M: [12, [[[0, 14], [0, 0], [6, 9], [12, 0], [12, 14]]]],
    N: [10, [[[0, 14], [0, 0], [10, 14], [10, 0]]]],
    O: [12, [arc(6, 7, 6, 7, -90, 270)]],
    P: [9, [join([[0, 14], [0, 0], [5, 0]], arc(5, 3.75, 3.75, 3.75, -90, 90), [[5, 7.5], [0, 7.5]])]],
    Q: [12, [arc(6, 7, 6, 7, -90, 270), [[7.5, 10], [12.5, 15]]]],
    R: [9, [join([[0, 14], [0, 0], [5, 0]], arc(5, 3.75, 3.75, 3.75, -90, 90), [[5, 7.5], [0, 7.5]]), [[4, 7.5], [9, 14]]]],
    S: [9, [join(arc(4.6, 3.6, 4.4, 3.6, -15, -270), arc(4.6, 10.5, 4.6, 3.5, -90, 165))]],
    T: [10, [[[0, 0], [10, 0]], [[5, 0], [5, 14]]]],
    U: [10, [join([[0, 0], [0, 9]], arc(5, 9, 5, 5, 180, 0), [[10, 9], [10, 0]])]],
    V: [10, [[[0, 0], [5, 14], [10, 0]]]],
    W: [14, [[[0, 0], [3.5, 14], [7, 4], [10.5, 14], [14, 0]]]],
    X: [10, [[[0, 0], [10, 14]], [[10, 0], [0, 14]]]],
    Y: [10, [[[0, 0], [5, 7], [10, 0]], [[5, 7], [5, 14]]]],
    Z: [10, [[[0, 0], [10, 0], [0, 14], [10, 14]]]],
    0: [9, [arc(4.5, 7, 4.5, 7, -90, 270)]],
    1: [5, [[[1, 3], [5, 0], [5, 14]]]],
    2: [9, [join(arc(4.5, 4.2, 4.5, 4.2, -170, 20), [[8.7, 5.6], [0, 14], [9, 14]])]],
    5: [9, [join([[8.5, 0], [1, 0], [0.3, 6.2]], arc(4.5, 9.5, 4.5, 4.5, -125, 150))]],
    '!': [0, [[[0, 0], [0, 9.5]], dot(0, 13.4)]],
    '?': [8, [join(arc(4, 4, 4, 4, -160, 90), [[4, 8], [4, 10]]), dot(4, 13.4)]],
    '.': [0, [dot(0, 13.4)]],
    ',': [1, [[[0.8, 12.8], [0, 15.5]]]],
    ':': [0, [dot(0, 5), dot(0, 13.4)]],
    '-': [5, [[[0, 8], [5, 8]]]],
    '…': [6, [dot(0, 13.4), dot(3, 13.4), dot(6, 13.4)]],
    '#': [9, [[[3, 0], [2, 14]], [[7, 0], [6, 14]], [[0, 4.5], [9, 4.5]], [[0, 9.5], [9, 9.5]]]],
    '✓': [10, [[[0, 8], [3.5, 13], [10, 1]]]],
    "'": [0, [[[0, 0], [0, 3]]]],
    '→': [12, [[[0, 7], [12, 7]], [[8, 3], [12, 7], [8, 11]]]],
  };
  const ACC = { 'Á': ['A', 'a'], 'É': ['E', 'a'], 'Í': ['I', 'a'], 'Ó': ['O', 'a'], 'Ú': ['U', 'a'], 'Ý': ['Y', 'a'], 'Ů': ['U', 'o'],
    'Č': ['C', 'v'], 'Ď': ['D', 'v'], 'Ě': ['E', 'v'], 'Ň': ['N', 'v'], 'Ř': ['R', 'v'], 'Š': ['S', 'v'], 'Ť': ['T', 'v'], 'Ž': ['Z', 'v'] };
  function glyph(ch) {
    if (G[ch]) return G[ch];
    const a = ACC[ch];
    if (!a) return null;
    const [w, st] = G[a[0]], cx = w / 2;
    const mark = a[1] === 'a' ? [[cx - 1, -2], [cx + 1.6, -4.6]] : a[1] === 'v' ? [[cx - 2, -4.4], [cx, -2], [cx + 2, -4.4]] : arc(cx, -3.4, 1.5, 1.5, 0, 360, 10);
    return [w, [...st, mark]];
  }
  // Text → čáry. Řádky odděluje \n. Vrací čáry v jednotkách výstupu, začátek vlevo nahoře.
  function letter(text, R, { cap = 60, align = 'left', gap = 1.55, wobble = 1 } = {}) {
    const s = cap / 14, out = [], lines = String(text).toLocaleUpperCase('cs').split('\n');
    const widths = lines.map(line => [...line].reduce((w, ch) => w + (ch === ' ' ? 6 : ((glyph(ch) || [6])[0] + 2.6)), 0) - 2.6);
    const maxW = Math.max(...widths);
    lines.forEach((line, li) => {
      let x = align === 'center' ? (maxW - widths[li]) / 2 : align === 'right' ? maxW - widths[li] : 0;
      const y = li * 14 * gap;
      [...line].forEach(ch => {
        if (ch === ' ') { x += 6; return; }
        const g = glyph(ch);
        if (!g) { x += 6; return; }
        const [w, st] = g, rot = (R() * 2 - 1) * 4 * wobble, k = 1 + (R() * 2 - 1) * 0.05 * wobble, dy = (R() * 2 - 1) * 0.5 * wobble;
        const c = Math.cos(rad(rot)), sn = Math.sin(rad(rot)), cx = w / 2, cy = 7;
        st.forEach(p => out.push(p.map(([px, py]) => {
          const ux = (px - cx) * k, uy = (py - cy) * k;
          return [(x + cx + ux * c - uy * sn) * s, (y + cy + dy + ux * sn + uy * c) * s];
        })));
        x += w + 2.6;
      });
    });
    return { strokes: out, w: maxW * s, h: (14 + (lines.length - 1) * 14 * gap) * s };
  }

  // ── kresby ──
  // Každá je vystředěná kolem (0, 0); „size“ je přibližná šířka, „seat“ říká, kam patří na obličej.
  const leaf = (bx, by, ang, len = 26, wid = 9) => {
    const c = Math.cos(rad(ang)), s = Math.sin(rad(ang)), P = (u, v) => [bx + u * c - v * s, by + u * s + v * c];
    return [join(bez(P(0, 0), P(len * 0.3, -wid), P(len * 0.7, -wid), P(len, 0), 8), bez(P(len, 0), P(len * 0.7, wid), P(len * 0.3, wid), P(0, 0), 8))];
  };
  const cloud = (rx, ry, n, bump, start = 0) => {
    const pts = [];
    for (let i = 0; i < n; i++) { const t = rad(start + 360 * i / n); pts.push([rx * Math.cos(t), ry * Math.sin(t)]); }
    const st = [pts[0]];
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], l = Math.hypot(m[0], m[1]) || 1;
      const c1 = [a[0] + (m[0] / l) * bump, a[1] + (m[1] / l) * bump], c2 = [b[0] + (m[0] / l) * bump, b[1] + (m[1] / l) * bump];
      st.push(...bez(a, c1, c2, b, 8).slice(1));
    }
    return st;
  };
  // vlákno žárovky: pár závitů mezi dvěma drátky
  function Ruka_spiral() { const p = []; for (let i = 0; i <= 40; i++) { const t = i / 40; p.push([-10 + 20 * t + Math.sin(t * Math.PI * 6) * 2, -2 - Math.cos(t * Math.PI * 6) * 7]); } return p; }
  const DRAW = {
    knirek: { label: 'knírek', seat: 'usta', size: 290, strokes: () => {
      const top = join(bez([0, -4], [25, -26], [70, -30], [105, -12]), bez([105, -12], [122, -3], [140, -10], [142, -26]), bez([142, -26], [144, -40], [124, -42], [122, -30], 8), bez([122, -30], [121, -24], [126, -22], [130, -24], 4));
      const bot = join(bez([0, 6], [30, 12], [80, 18], [108, 4]), bez([108, 4], [118, -2], [128, -4], [138, -12], 8));
      return [top, bot, mirror(top), mirror(bot)];
    } },
    bryle: { label: 'brýle', seat: 'oci', size: 340, strokes: () => [
      arc(-75, 0, 55, 50, -90, 270), arc(75, 0, 55, 50, -90, 270), arc(0, 6, 22, 16, 200, 340),
      [[-130, -6], [-170, -14]], [[130, -6], [170, -14]], [[-104, -22], [-92, -34]], [[46, -22], [58, -34]]] },
    cepice: { label: 'absolventská čepice', seat: 'hlava', size: 270, strokes: () => [
      [[-135, 0], [0, -50], [135, 0], [0, 50], [-135, 0]],
      join([[-78, 28], [-74, 76]], arc(0, 76, 74, 18, 180, 0), [[74, 76], [78, 28]]),
      arc(0, 0, 6, 4, 0, 360, 10),
      join([[0, 0]], bez([0, 0], [50, 0], [96, 8], [100, 64], 10)),
      [[100, 64], [90, 104]], [[100, 64], [100, 108]], [[100, 64], [110, 104]], [[92, 78], [108, 78]]] },
    koruna: { label: 'korunka', seat: 'hlava', size: 250, strokes: () => [
      [[-110, 15], [-122, -45], [-60, -5], [0, -62], [60, -5], [122, -45], [110, 15]],
      [[-110, 15], [110, 15]], [[-110, 15], [-110, 42], [110, 42], [110, 15]],
      arc(-122, -54, 8, 8, 0, 360, 10), arc(0, -71, 8, 8, 0, 360, 10), arc(122, -54, 8, 8, 0, 360, 10),
      arc(-55, 29, 5, 5, 0, 360, 8), arc(0, 29, 5, 5, 0, 360, 8), arc(55, 29, 5, 5, 0, 360, 8)] },
    svatozar: { label: 'svatozář', seat: 'hlava', size: 250, strokes: () => [
      arc(0, 0, 120, 26, 200, 614, 36), [[-62, -42], [-70, -62]], [[0, -48], [0, -70]], [[62, -42], [70, -62]]] },
    party: { label: 'párty klobouček 25', seat: 'hlava', size: 170, strokes: () => {
      const n = letter('25', () => 0.5, { cap: 34, wobble: 0 });
      return [[[-62, 70], [0, -86], [62, 70]], arc(0, 70, 62, 14, 0, 180),
        [[0, -86], [0, -104]], [[0, -86], [16, -100]], [[0, -86], [-16, -100]], [[0, -86], [18, -86]], [[0, -86], [-18, -86]],
        ...move(n.strokes, -n.w / 2 - 4, 16)];
    } },
    zarovka: { label: 'žárovka (nápad)', seat: 'nad', size: 200, strokes: () => [
      join(arc(0, -20, 52, 55, 128, 412)), [[-32, 23], [-24, 60]], [[32, 23], [24, 60]],
      [[-26, 62], [26, 62]], [[-24, 74], [24, 74]], [[-20, 86], [20, 86]], arc(0, 88, 12, 8, 0, 180),
      [[-12, 26], [-10, -2]], [[12, 26], [10, -2]], Ruka_spiral(),
      ...[-150, -120, -90, -60, -30].map(a => [[Math.cos(rad(a)) * 78, -20 + Math.sin(rad(a)) * 80], [Math.cos(rad(a)) * 102, -20 + Math.sin(rad(a)) * 104]])] },
    mozek: { label: 'mozek', seat: 'nad', size: 250, strokes: () => [
      cloud(118, 82, 9, 24, 10), bez([0, -88], [-16, -50], [16, -10], [0, 70], 12),
      bez([-80, -30], [-50, -46], [-40, -10], [-60, 10], 8), bez([-70, 40], [-40, 30], [-30, 60], [-10, 50], 8),
      bez([80, -30], [50, -46], [40, -10], [60, 10], 8), bez([70, 40], [40, 30], [30, 60], [10, 50], 8),
      [[-10, 86], [-6, 118]], [[10, 86], [6, 118]]] },
    zvonek: { label: 'vypnuté notifikace', seat: 'okraj', size: 180, strokes: () => {
      const half = join(bez([0, -58], [-30, -58], [-40, -30], [-42, 0], 8), bez([-42, 0], [-44, 20], [-56, 28], [-62, 38], 6), [[-62, 38], [0, 38]]);
      return [half, mirror(half), arc(0, -64, 7, 7, 0, 360, 10), arc(0, 40, 13, 12, 0, 180), [[-78, -70], [78, 70]]];
    } },
    vavrin: { label: 'vavřínový věnec', seat: 'okraj', size: 240, strokes: () => {
      const L = [arc(0, 0, 100, 100, 100, 250)];
      // lístky míří po směru větvičky, jeden ven a jeden dovnitř
      for (let t = 110; t <= 240; t += 26) { const x = 100 * Math.cos(rad(t)), y = 100 * Math.sin(rad(t)); L.push(...leaf(x, y, t + 55, 28, 9), ...leaf(x, y, t + 125, 24, 8)); }
      return [...L, ...L.map(mirror)];
    } },
    srdce: { label: 'srdíčko', seat: 'okraj', size: 120, strokes: () => [join(bez([0, 34], [-64, -6], [-42, -64], [0, -26]), bez([0, -26], [42, -64], [64, -6], [0, 34]))] },
    jiskry: { label: 'jiskřičky', seat: 'okraj', size: 160, strokes: () => {
      const star = (x, y, r) => [join(bez([x, y - r], [x + r * 0.15, y - r * 0.15], [x + r * 0.15, y - r * 0.15], [x + r, y], 5), bez([x + r, y], [x + r * 0.15, y + r * 0.15], [x + r * 0.15, y + r * 0.15], [x, y + r], 5), bez([x, y + r], [x - r * 0.15, y + r * 0.15], [x - r * 0.15, y + r * 0.15], [x - r, y], 5), bez([x - r, y], [x - r * 0.15, y - r * 0.15], [x - r * 0.15, y - r * 0.15], [x, y - r], 5))];
      return [...star(-20, 0, 44), ...star(46, -42, 24), ...star(52, 34, 15)];
    } },
    bublina: { label: 'bublina', seat: 'okraj', size: 300, strokes: () => [join(arc(0, 0, 150, 70, 125, 470), [[-51, 66], [-96, 118], [-86, 57]])] },
    myslenka: { label: 'myšlenková bublina', seat: 'okraj', size: 300, strokes: () => [cloud(140, 66, 9, 22, 5), arc(-104, 96, 15, 13, 0, 360, 12), arc(-140, 126, 8, 7, 0, 360, 10)] },
    lodka: { label: 'origami loďka', seat: 'okraj', size: 240, strokes: () => [[[-115, 20], [115, 20], [78, 62], [-78, 62], [-115, 20]], [[-62, 20], [0, -72], [62, 20]], [[0, -72], [0, 20]]] },
    kniha: { label: 'kniha', seat: 'okraj', size: 240, strokes: () => {
      const page = [...bez([0, -34], [-40, -50], [-80, -52], [-112, -42], 10), [-112, 42], ...bez([-112, 42], [-80, 32], [-40, 34], [0, 54], 10).slice(1)];
      const lines = [[[-92, -24], [-22, -16]], [[-92, -6], [-22, 2]], [[-92, 12], [-40, 18]]];
      return [page, mirror(page), [[0, -34], [0, 54]], ...lines, ...lines.map(mirror)];
    } },
    kompas: { label: 'kompas (hodnoty)', seat: 'okraj', size: 190, strokes: () => {
      const n = letter('N', () => 0.5, { cap: 26, wobble: 0 });
      return [arc(0, 0, 76, 76, -90, 270), arc(0, 0, 64, 64, -80, 280), [[0, -50], [13, 0], [0, 50], [-13, 0], [0, -50]], [[-13, 0], [13, 0]], ...move(n.strokes, -n.w / 2, -116)];
    } },
    fajfka: { label: 'fajfka', seat: 'okraj', size: 130, strokes: () => [[[-60, 0], [-20, 44], [62, -50]]] },
  };

  return { arc, bez, join, mirror, move, bbox, draw, letter, glyph, DRAW };
})();
