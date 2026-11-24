// ---------------------------------------------------------------------------
// OOP Lab 10 · SOLID. The Order example as a bench of crates: one crate per
// class, its footprint its measured line count, sealed once it is tested.
// At every stage the same change order arrives — add PromptPay — and the lab
// counts how many sealed crates have to be opened to take it.
// Numbers: model.js (all measured by measure.py).
// ---------------------------------------------------------------------------
const L10 = { y: -3.5, x0: -20, N: 6, SETTLE: 1.0, ARRIVE: 1.3, HOLD: 3.0 };

function l10Insts() {
  const L = [];
  for (let i = 0; i < L10.N; i++) L.push(place('crate', 'c' + i, { at: [L10.x0, L10.y, 0], label: i === 0 ? 'one crate, one class' : undefined }));
  L.push(place('order', 'ord', { at: [26, L10.y + 1.3, 0], label: 'the change that arrives' }));
  return L;
}

// lay the stage's classes out along the bench and tell parts.js their sizes
function l10Lay(s) {
  let x = 0;
  const out = s.cls.map(function (c, i) {
    const w = Math.max(CR.minW, c[1] * CR.perLine);
    const o = { id: 'c' + i, name: c[0], loc: c[1], w: w, x: x };
    x += w + CR.gap;
    return o;
  });
  return { boxes: out, width: Math.max(0, x - CR.gap) };
}

function l10Timeline(params) {
  const insts = l10Insts(), byId = Object.fromEntries(insts.map((i) => [i.id, i]));
  const n0 = clamp(Math.round(params.stage ?? 0), 0, SO.length - 1);
  const base = { insts, byId, stage: n0 };
  if (params.live)
    return Object.assign(base, { T: { end: 2400, caption: null, labelsOut: 0 }, sched: {}, total: 3, CH: [], live: true, tabs: [], tabAt: () => 0 });

  const { sched, end, total } = scheduleBuild(insts.filter((i) => i.id === 'c0'), 0.3);
  let t = end + 0.5;
  const CH = [];
  SO.forEach(function (s, i) {
    const dur = L10.SETTLE + L10.ARRIVE + L10.HOLD + (i === 0 ? 1.0 : 0);
    CH.push({ id: s.tag, btn: (s.letter || '0') + ' · ' + s.tag, i: i, t0: t, t1: t + dur });
    t += dur;
  });
  CH.push({ id: 'BILL', btn: 'The bill', i: SO.length - 1, bill: true, t0: t, t1: t + 4.2 });
  t += 4.2;
  const T = { buildEnd: end, caption: t + 0.3 };
  T.end = T.caption + 4.6; T.labelsOut = CH[0].t0 + 0.6;
  const names = Object.fromEntries(insts.map((i) => [i.id, i.name]));
  const tabs = [armadoTab(autoArmado(insts, 'lab', '// Lab 10 · one crate per class'), sched, total, names)];
  return Object.assign(base, { T: T, sched: sched, total: total, CH: CH, live: false, tabs: tabs, tabAt: () => 0 });
}

const l10Chapter = (TL, t) => { for (let k = TL.CH.length - 1; k >= 0; k--) if (t >= TL.CH[k].t0) return k; return -1; };

function l10State(TL, t) {
  const st = { t: t, MB: MB };
  partsAt(TL, t, st);
  let ch = null, u = 0, idx = TL.stage, armed = 0, opening = 0, bill = false;

  if (TL.live) {
    idx = clamp(Math.round(liveVal(LIVE.ev, 'stage', t, TL.stage)), 0, SO.length - 1);
    const ev = LIVE.ev.filter((e) => e[1] === 'send' && e[0] <= t);
    const last = ev[ev.length - 1];
    if (last) { const u2 = t - last[0]; armed = clamp(u2 / 0.8, 0, 1); opening = clamp((u2 - 0.9) / 0.5, 0, 1); }
  } else {
    ch = TL.CH[l10Chapter(TL, t)];
    u = ch ? t - ch.t0 : 0;
    idx = ch ? ch.i : 0;
    bill = !!(ch && ch.bill);
    if (ch && !bill) {
      const lead = L10.SETTLE + (ch.i === 0 ? 1.0 : 0);
      armed = smooth(seg(u, lead, lead + 0.7));
      opening = smooth(seg(u, lead + 0.8, lead + 1.4));
    } else if (bill) { armed = 1; opening = 1; }
  }

  const s = soAt(idx);
  // between chapters the bench re-settles into the next stage instead of cutting:
  // crates slide and resize, and a class that is new to this stage grows in
  const k = TL.live || !ch || bill ? 1 : smooth(seg(u, 0, 0.75));
  const lay = l10Lay(s);
  if (k < 1 && idx > 0) {
    const prev = l10Lay(soAt(idx - 1));
    lay.boxes.forEach(function (b, i) {
      const p = prev.boxes[i];
      const fromX = p ? p.x : prev.width, fromW = p ? p.w : 0.8;
      b.x = fromX + (b.x - fromX) * k;
      b.w = fromW + (b.w - fromW) * k;
    });
    lay.width = prev.width + (lay.width - prev.width) * k;
  }
  st.s = s; st.idx = idx; st.armed = armed; st.opening = opening; st.bill = bill;

  // crates: position, size and seal, straight from the measured table
  for (let i = 0; i < L10.N; i++) {
    const b = lay.boxes[i];
    if (!b) { st.parts['c' + i] = 0; delete MB['c' + i]; continue; }
    const willOpen = s.opened.indexOf(b.name) >= 0;
    MB['c' + i] = {
      w: b.w, name: soShort(b.name), loc: b.loc,
      open: willOpen ? opening : 0,
      broken: willOpen && opening > 0.5,
      fresh: false,
    };
    TL.byId['c' + i].at = [L10.x0 + b.x, L10.y, 0];
    // stages after the build get their crates placed without the drop animation
    if (t > TL.T.buildEnd + 0.2 || i === 0) st.parts['c' + i] = 1;
  }
  // the change order slides in from the right and parks at the end of the bench
  const parkX = L10.x0 + lay.width + 2.6;
  TL.byId.ord.at = [parkX + (1 - smooth(armed)) * 22, L10.y + 1.3, 0];
  MB.__order = { glow: armed * (s.opened.length ? 0.2 : 1) };
  st.parts.ord = armed > 0.02 ? 1 : 0;

  // when nothing has to be opened, PromptPay simply becomes the next crate
  st.lands = !s.opened.length && opening > 0.6;

  const V = soVerdict(s, opening > 0.5);
  Object.assign(st, {
    ch: ch ? ch.id : null, u: u, verdict: V, cost: soCost(idx), width: lay.width,
    cam: fitCam([[L10.x0 - 3, L10.y - 2, 0], [L10.x0 + lay.width + 9, L10.y + CR.d + 2, 0],
      [L10.x0, L10.y + CR.d, CR.h + 4], [L10.x0 + 6, L10.y + 10, 1]], 0.95),
  });
  return st;
}

const DEMO = {
  brand: 'SIMULAB', id: 'SOLID', num: '10', title: 'SOLID',
  tagline: 'FIVE REFACTORS · ONE BILL', category: 'OOP · 01276131',
  plate: ['OOP 01276131 · CHAPTER 10 · SOLID', 'One Order class, five principles, and what each one actually buys'],
  chips: ['6 VERSIONS · MEASURED FROM REAL PYTHON', 'KMITL · INTERNATIONAL PROGRAMME'],
  caption: 'Each principle buys one kind of change, and charges you in lines.',
  intro: { seconds: 5, lines: ['A new payment type arrives.', 'How much tested code must you open?'], pill: 'OOP · LAB 10 · SOLID', src: (TL) => TL.CH[0].t0 + 1.8, rate: 0.9 },
  major: ['c0', 'c1', 'ord'],
  params: { stage: 0 },
  knob: { key: 'stage', label: 'HOW FAR THROUGH THE REFACTOR', min: 0, max: 5, step: 1, unit: '',
    fmt: (v) => (SO[clamp(Math.round(v), 0, 5)].letter || '0') + ' · ' + SO[clamp(Math.round(v), 0, 5)].tag },
  live: { label: 'SEND THE CHANGE', controls: [{ key: 'send', label: 'add PromptPay', keys: ['KeyP'], kbd: 'P' }] },
  timeline: (params) => l10Timeline(params),
  steps: (TL) => TL.CH.map((c) => [c.btn, c.t0 - 0.2]),
  state(TL, t) { return l10State(TL, t); },
  drawScene(G, st, TL) {
    drawTapete(G, st, { x0: -26, x1: 30, y0: -14, y1: 14 });
    const base = new Xf();
    drawAssembly(G, st, TL.insts, base);
    return base;
  },
  drawNotes(G, st, TL, base) {
    const c = G.ctx, P = (p) => G.cam.p(base.p(p));
    if (!TL.live && st.t >= TL.T.caption - 0.3) return;
    const s = st.s;
    if (st.bill) {
      callout(c, P([L10.x0 + st.width / 2, L10.y + CR.d, CR.h + 2]), -20, -120,
        'Same basket, same ' + SO_T + ' total: ' + SO[0].loc + ' lines became ' + s.loc, 1, '#ffcf6b');
      return;
    }
    if (st.opening > 0.6 && s.opened.length)
      callout(c, P([L10.x0 + 2, L10.y + CR.d, CR.h + 2]), -10, -112,
        s.opened[0] + ' was tested. You have to open it again.', 1, '#ff9e93');
    if (st.lands)
      callout(c, P([L10.x0 + st.width + 4.4, L10.y + CR.d, 2.4]), -44, -118,
        'A new class. Every seal is still intact.', 1, '#c8f04a');
    if (st.armed < 0.2 && s.letter)
      callout(c, P([L10.x0 + st.width / 2, L10.y + CR.d, CR.h + 1]), -30, -104, s.gain, 1, '#ffffff');
  },
  speedBadge(TL, st) {
    if (st.bill) return { txt: 'THE BILL', bg: BAY_BG.amber };
    if (st.opening > 0.5 && st.s.opened.length) return { txt: 'SEAL BROKEN', bg: BAY_BG.coral };
    if (st.lands) return { txt: 'NOTHING OPENED', bg: BAY_BG.lime };
    return { txt: (st.s.letter || 'START') + ' · ' + st.s.name.toUpperCase(), bg: BAY_BG.grey };
  },
  footer(TL, st) {
    return [
      { text: st.s.letter ? st.s.letter + ' · ' + st.s.name : 'BEFORE ANY PRINCIPLE', dot: st.s.opened.length ? UIC.coral : UIC.lime },
      { text: st.s.cls.length + ' CLASSES · ' + st.s.loc + ' LINES' },
      { text: 'OPENED · ' + st.s.opened.length },
    ];
  },
  drawBays(c, TL, st) {
    const s = st.s;
    let b = bayFrame(c, 0, 'BAY 01 · REASONS TO CHANGE', s.reasons === 3 ? 'THREE' : 'TWO',
      s.reasons >= 3 ? BAY_BG.coral : BAY_BG.amber);
    bigValue(c, b, String(s.reasons), 'in the worst class', 'of 3 independent changes, how many touch it');
    barPair(c, b, [['START', SO[0].reasons / 3], ['NOW', s.reasons / 3]]);

    b = bayFrame(c, 1, 'BAY 02 · OPENED TO ADD PROMPTPAY', s.opened.length ? String(s.opened.length) : 'NONE',
      s.opened.length ? BAY_BG.coral : BAY_BG.lime);
    bigValue(c, b, String(s.opened.length), s.opened.length === 1 ? 'tested class' : 'tested classes',
      s.openedLines ? s.openedLines + ' lines written inside it' : 'the change is a new class only');
    barPair(c, b, [['CLASSES', s.opened.length / 2], ['LINES', s.openedLines / 6]]);

    const fitted = s.reqCredit != null;
    b = bayFrame(c, 2, 'BAY 03 · THE CONTRACT', s.forced ? 'DEMANDS ' + s.forced : s.injected ? 'INJECTED' : 'OPEN',
      s.forced ? BAY_BG.coral : BAY_BG.lime);
    bigValue(c, b, fitted ? s.reqCredit + '/' + s.reqCreditFat : String(s.forced),
      fitted ? 'methods a credit card needs' : 'credentials forced on all',
      fitted ? 'with one fat interface it would be ' + s.reqCreditFat
        : s.injected ? 'the authoriser is handed in, not constructed'
        : s.forced ? 'PromptPay has no security code, yet must accept one' : 'each processor declares its own');

    const v = st.verdict;
    b = bayFrame(c, 3, 'BAY 04 · WHAT THE CHANGE COSTS', v[0], BAY_BG[v[2]] || BAY_BG.grey);
    bigValue(c, b, st.bill ? '+' + st.cost : v[0], st.bill ? 'lines since START' : '', st.bill ? 'for the same ' + SO_T + ' basket' : v[1]);
  },
  audioCues(TL) {
    const cu = [{ type: 'caption', t: TL.T.caption }];
    for (const ch of TL.CH) {
      const s = SO[ch.i], lead = L10.SETTLE + (ch.i === 0 ? 1.0 : 0);
      cu.push({ type: 'blip', t: ch.t0, f: 820, gain: 0.1, teaser: true });
      if (ch.bill) continue;
      cu.push({ type: 'whoosh', t: ch.t0 + lead, t1: ch.t0 + lead + 0.6 });
      cu.push({ type: s.opened.length ? 'error' : 'ding', t: ch.t0 + lead + 1.0 });
    }
    return cu;
  },
};
