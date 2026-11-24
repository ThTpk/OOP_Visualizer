// ---------------------------------------------------------------------------
// OOP Lab 10 · the objects. A class is a crate on the bench, and its footprint
// is its measured line count — so the row literally gets longer as the refactor
// adds code. A crate that has been tested is sealed. Opening a sealed crate to
// make a change is what each principle is trying to avoid.
// Own design, not a real product. World cm, z up; the +y face reads to camera.
// ---------------------------------------------------------------------------
const CR = { d: 7.0, h: 3.6, lid: 0.7, perLine: 0.78, minW: 3.6, gap: 1.7 };

// demo.js writes this before drawing; floorShadow needs the width too
const MB = {};
const mbW = (id) => (MB[id] && MB[id].w) || CR.minW;

defineAsset('crate', {
  name: 'class', group: 'floor', layer: 1, O: [0, 0, 0],
  anchor: [2, CR.d / 2, CR.h], ring: [3, 3, CR.h + 0.4], lab: [0, 0, 1.4], dropH: 8,
  draw(G, xf, st, inst) {
    const s = MB[inst.id] || {};
    const w = s.w || CR.minW;
    const open = s.open || 0;            // 0 shut .. 1 lid lifted off
    const broken = !!s.broken;
    const fresh = !!s.fresh;             // arrived as a new class, never sealed
    const body = CR.h - CR.lid;

    // the crate body
    drawBox(G, xf, [0, 0, 0], [w, CR.d, body], broken ? M.beige : M.acr, {
      lw: 1.6,
      py: (c) => {
        c.fillStyle = '#eceadf'; prect(c, 0.16, 0.16, w - 0.32, body - 0.32, 0.16); c.fill();
        ptxt(c, s.name || '', w / 2, body / 2 + 0.3, Math.min(0.62, w * 0.1), '#2b3044', 700, 'center');
        if (s.loc) ptxt(c, s.loc + ' lines', w / 2, body - 0.42, 0.34, '#8b8f9e', 700, 'center');
      },
    });

    if (open > 0.05) {
      const c = G.ctx, q = [[0.3, 0.3], [w - 0.3, 0.3], [w - 0.3, CR.d - 0.3], [0.3, CR.d - 0.3]]
        .map((pp) => G.cam.p(xf.p([pp[0], pp[1], body - 0.05])));
      c.fillStyle = 'rgba(42,48,70,' + (0.16 + open * 0.3) + ')';
      c.beginPath(); c.moveTo(q[0][0], q[0][1]);
      for (let i = 1; i < 4; i++) c.lineTo(q[i][0], q[i][1]);
      c.closePath(); c.fill();
    }

    // the lid: lifts and tilts when the crate has to be opened
    const lift = open * 1.7;
    const lxf = compose(xf, [0, open * 0.9, body + lift], open * 0.05, [0, 0, 0]);
    drawBox(G, lxf, [0, 0, 0], [w, CR.d, CR.lid], broken ? M.beige : M.acr, {
      lw: 1.5,
      top: (c) => {
        // the seal band across the lid: intact means the tests still hold
        const col = broken ? '#ef4444' : fresh ? '#8b8f9e' : '#2fbf71';
        c.fillStyle = col; prect(c, w * 0.18, CR.d / 2 - 0.42, w * 0.64, 0.84, 0.16); c.fill();
        ptxt(c, broken ? 'OPENED' : fresh ? 'NEW' : 'TESTED', w / 2, CR.d / 2 + 0.22,
          Math.min(0.42, w * 0.075), '#ffffff', 700, 'center');
        if (broken) {
          c.strokeStyle = 'rgba(239,68,68,.9)'; c.lineWidth = 0.1;
          c.beginPath(); c.moveTo(w * 0.18, CR.d / 2 - 0.42); c.lineTo(w * 0.82, CR.d / 2 + 0.42); c.stroke();
        }
      },
    });
  },
  floorShadow(xf) { return [boxCorners(xf, [0, 0, 0], [mbW(this.id), CR.d, 0.1])]; },
});

// The change order that arrives: a small card the bench has to absorb.
defineAsset('order', {
  name: 'PromptPay', group: 'floor', layer: 2, O: [0, 0, 0],
  anchor: [2.8, 2.5, 2.6], ring: [3.2, 3.2, 2.8], lab: [0, 0, 1.2], dropH: 10,
  draw(G, xf, st) {
    const s = MB.__order || {};
    drawBox(G, xf, [0, 0, 0], [5.6, 5.0, 1.8], M.acr, {
      lw: 1.5,
      top: (c) => {
        c.fillStyle = '#d9a441'; prect(c, 0.34, 0.34, 4.92, 4.32, 0.22); c.fill();
        ptxt(c, 'PROMPTPAY', 2.8, 2.2, 0.56, '#4a3410', 700, 'center');
        ptxt(c, 'new payment type', 2.8, 3.3, 0.38, '#6b4f1c', 700, 'center');
      },
    });
    if (s.glow) {
      const p = G.cam.p(xf.p([2.8, 2.5, 2.6]));
      const c = G.ctx;
      c.fillStyle = 'rgba(217,164,65,.28)';
      c.beginPath(); c.arc(p[0], p[1], 16 + s.glow * 10, 0, 7); c.fill();
    }
  },
  floorShadow(xf) { return [boxCorners(xf, [0, 0, 0], [5.6, 5.0, 0.1])]; },
});

