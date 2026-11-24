// ---------------------------------------------------------------------------
// OOP Lab 05 · the objects. A class is a filing cabinet; each line of its
// __init__ is one engraved bar on its face. Copy-paste means every cabinet
// carries its own copy of the same bars, so a cabinet nobody updated is
// visibly one bar short. Own design, not a real product.
// Cabinet: 3.8 cm wide (x), 7 cm deep (y), 6 cm tall. The +y face is the one
// the camera reads. World cm, z up.
// ---------------------------------------------------------------------------
const CAB = { w: 3.8, d: 7.0, h: 6.0, pitch: 4.6 };
const BAR = { x0: 0.42, w: 2.96, h: 0.3, gap: 0.52, top: 1.68 };   // bars on the face, in cm

// one engraved bar per line; k = how many bars, hot = index drawn in the accent colour
function cabFace(c, title, k, o = {}) {
  const tone = o.dim ? 0.45 : 1;
  c.fillStyle = o.bg || '#eceadf'; prect(c, 0.16, 0.16, CAB.w - 0.32, CAB.h - 0.32, 0.18); c.fill();
  c.fillStyle = o.plate || '#2b3044'; prect(c, 0.3, 0.38, CAB.w - 0.6, 0.82, 0.12); c.fill();
  ptxt(c, title, CAB.w / 2, 1.0, 0.46, o.titleCol || '#f3f1e6', 700, 'center');
  for (let i = 0; i < k; i++) {
    const y = BAR.top + i * BAR.gap, hot = o.hot === i;
    c.fillStyle = hot ? (o.hotCol || '#ff7a2f') : `rgba(42,48,70,${0.74 * tone})`;
    prect(c, BAR.x0, y, BAR.w * (hot ? 1 : 0.86 - (i % 3) * 0.06), BAR.h, 0.07); c.fill();
  }
  if (o.lamp) { c.fillStyle = o.lamp; c.beginPath(); c.arc(CAB.w - 0.52, CAB.h - 0.46, 0.2, 0, 7); c.fill(); }
  if (o.note) ptxt(c, o.note, CAB.w / 2, CAB.h - 0.34, 0.34, o.noteCol || '#8b8f9e', 700, 'center');
}

// a copy-paste class: one independent cabinet. st.CB[id] = {k, hot, lamp, dim, note}
defineAsset('cabRec', {
  name: 'record cabinet', group: 'floor', layer: 1, O: [0, 0, 0], anchor: [CAB.w / 2, CAB.d / 2, CAB.h],
  ring: [CAB.w * 0.8, CAB.d * 0.8, CAB.h + 0.3], lab: [0, 0, 1.6], dropH: 9,
  draw(G, xf, st, inst) {
    const s = (st.CB && st.CB[inst.id]) || {};
    drawBox(G, xf, [0, 0, 0], [CAB.w, CAB.d, CAB.h], s.dim ? M.beige : M.acr, {
      lw: 1.6,
      py: (c) => cabFace(c, inst.opts.cls || '', s.k ?? 0, {
        hot: s.hot, lamp: s.lamp, dim: s.dim, note: s.note,
        bg: s.dim ? '#dcd8c8' : '#eceadf', plate: s.stale ? '#7a2f2f' : '#2b3044',
      }),
      top: (c) => { c.fillStyle = 'rgba(42,48,70,.10)'; prect(c, 0.3, 0.3, CAB.w - 0.6, CAB.d - 0.6, 0.2); c.fill(); },
    });
  },
  floorShadow(xf) { return [boxCorners(xf, [0, 0, 0], [CAB.w, CAB.d, 0.1])]; },
});

// the Employee superclass: one wider, taller cabinet. The shared rule lives here only.
const L5B = { w: 5.6, d: 7.0, h: 8.2 };
defineAsset('cabBase', {
  name: 'Employee', group: 'floor', layer: 1, O: [0, 0, 0], anchor: [L5B.w / 2, L5B.d / 2, L5B.h],
  ring: [L5B.w * 0.8, L5B.d * 0.8, L5B.h + 0.3], lab: [0, 0, 1.8], dropH: 11,
  draw(G, xf, st) {
    const s = (st.CB && st.CB.base) || {};
    drawBox(G, xf, [0, 0, 0], [L5B.w, L5B.d, L5B.h], M.teal, {
      lw: 1.7,
      py: (c) => {
        c.fillStyle = '#e7efee'; prect(c, 0.18, 0.18, L5B.w - 0.36, L5B.h - 0.36, 0.2); c.fill();
        c.fillStyle = '#17494a'; prect(c, 0.34, 0.42, L5B.w - 0.68, 0.98, 0.14); c.fill();
        ptxt(c, 'class Employee', L5B.w / 2, 1.14, 0.5, '#eafaf7', 700, 'center');
        for (let i = 0; i < (s.k ?? 0); i++) {
          const hot = s.hot === i;
          c.fillStyle = hot ? '#ff7a2f' : 'rgba(23,73,74,.78)';
          prect(c, 0.5, 2.0 + i * 0.66, (L5B.w - 1.0) * (hot ? 1 : 0.9), 0.36, 0.08); c.fill();
        }
        ptxt(c, s.note || 'the shared rule, once', L5B.w / 2, L5B.h - 0.4, 0.36, '#4d7a78', 700, 'center');
      },
      top: (c) => { c.fillStyle = 'rgba(23,73,74,.12)'; prect(c, 0.3, 0.3, L5B.w - 0.6, L5B.d - 0.6, 0.22); c.fill(); },
    });
  },
  floorShadow(xf) { return [boxCorners(xf, [0, 0, 0], [L5B.w, L5B.d, 0.1])]; },
});

// a subtype under Employee: a thin card that carries only what is its own
const SUB = { w: 3.6, d: 4.4, h: 3.2, pitch: 4.1 };
defineAsset('cardSub', {
  name: 'subtype', group: 'floor', layer: 1, O: [0, 0, 0], anchor: [SUB.w / 2, SUB.d / 2, SUB.h],
  ring: [SUB.w * 0.8, SUB.d * 0.8, SUB.h + 0.3], lab: [0, 0, 1.2], dropH: 7,
  draw(G, xf, st, inst) {
    const s = (st.CB && st.CB[inst.id]) || {};
    drawBox(G, xf, [0, 0, 0], [SUB.w, SUB.d, SUB.h], M.acr, {
      lw: 1.5,
      py: (c) => {
        c.fillStyle = '#eceadf'; prect(c, 0.14, 0.14, SUB.w - 0.28, SUB.h - 0.28, 0.14); c.fill();
        c.fillStyle = '#2b3044'; prect(c, 0.26, 0.32, SUB.w - 0.52, 0.86, 0.11); c.fill();
        ptxt(c, inst.opts.cls || '', SUB.w / 2, 0.92, 0.5, '#f3f1e6', 700, 'center');
        c.fillStyle = 'rgba(42,48,70,.7)'; prect(c, 0.42, 1.48, SUB.w - 0.84, 0.3, 0.07); c.fill();
        c.fillStyle = s.inh ? 'rgba(255,122,47,.9)' : 'rgba(42,48,70,.22)';
        prect(c, 0.42, 2.0, (SUB.w - 0.84) * (s.inh ? 1 : 0.4), 0.3, 0.07); c.fill();
        ptxt(c, s.inh ? 'inherited · ' + (s.k ?? 0) : 'inherits', SUB.w / 2, SUB.h - 0.32, 0.34, '#8b8f9e', 700, 'center');
      },
    });
  },
  floorShadow(xf) { return [boxCorners(xf, [0, 0, 0], [SUB.w, SUB.d, 0.1])]; },
});

// the travelling engraving head, drawn by the demo at x along the rail
function drawHead(G, base, x, y, z, hot) {
  const xf = compose(base, [x, y, z], 0, [0, 0, 0]);
  drawBox(G, xf, [-0.9, -0.8, 0], [0.9, 0.8, 1.4], M.blk, { lw: 1.5 });
  drawCyl(G, xf, [0, 0, -0.9], [0, 0, 1], 0.22, 0.95, M.brass, { lw: 1.4 });
  if (hot) { const c = G.ctx, p = G.cam.p(xf.p([0, 0, -1.0])); c.fillStyle = 'rgba(255,122,47,.85)'; c.beginPath(); c.arc(p[0], p[1], 5.2, 0, 7); c.fill(); }
}
