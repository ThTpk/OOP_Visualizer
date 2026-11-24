// ---------------------------------------------------------------------------
// OOP Lab 05 · INHERITANCE. Eight employee types on one bench. First they are
// eight independent classes, each with its own copy of the same six lines; the
// rule changes twice and you count the places you had to go. Then the same
// eight are rebuilt under one Employee, and the rule changes once.
// Only one system stands on the bench at a time, so each gets the whole frame.
// Numbers: model.js (all measured by measure.py / measure_rule.py).
// ---------------------------------------------------------------------------
const L5 = { y: -3.5, x0: -18, cardX0: -10.4, N: 8, headZ: 8.6, TRAVEL: 0.6, STAMP: 0.66 };

function l5Insts() {
  const L = [];
  for (let i = 0; i < L5.N; i++)
    L.push(place('cabRec', 'd' + i, {
      at: [L5.x0 + i * CAB.pitch, L5.y, 0], cls: IN.names[i],
      label: i === 0 ? 'one class, its own copy of every field' : undefined,
      code: 'class ' + IN.names[i] + ':  # its own copy of 6 shared fields',
    }));
  L.push(place('cabBase', 'base', { at: [L5.x0, L5.y, 0], label: 'the shared rule lives here', code: 'class Employee:  # the shared rule, once' }));
  for (let i = 0; i < L5.N; i++)
    L.push(place('cardSub', 's' + i, {
      at: [L5.cardX0 + i * SUB.pitch, L5.y + 1.3, 0], cls: IN.names[i],
      label: i === 0 ? 'subtypes: only what is their own' : undefined,
      code: 'class ' + IN.names[i] + '(Employee):  # + its own extra',
    }));
  L.push(place('cardSub', 'pay', { at: [L5.cardX0 + 2 * SUB.pitch, L5.y + 10.4, 0], cls: 'Payslip', code: '# a Payslip is NOT an Employee' }));
  return L;
}

const l5HeadX = (i) => L5.x0 + i * CAB.pitch + CAB.w / 2;
const L5_DUP = (n) => [[L5.x0, L5.y, 0], [L5.x0 + n * CAB.pitch, L5.y + CAB.d, 0], [L5.x0, L5.y + CAB.d, CAB.h + 2.5], [L5.x0 + 4, L5.y + CAB.d, 0]];
const L5_INH = (n) => [[L5.x0, L5.y, 0], [L5.cardX0 + n * SUB.pitch, L5.y + CAB.d, 0], [L5.x0, L5.y + CAB.d, L5B.h + 2.5], [L5.cardX0 + 2 * SUB.pitch, L5.y + 10.4 + SUB.d, 0]];

function l5Timeline(params) {
  const insts = l5Insts(), byId = Object.fromEntries(insts.map((i) => [i.id, i]));
  const n0 = clamp(Math.round(params.n ?? L5.N), 2, 8);
  const base = { insts, byId, n: n0, camDup: fitCam(L5_DUP(L5.N), 0.95), camInh: fitCam(L5_INH(L5.N), 0.95) };
  if (params.live)
    return Object.assign(base, { T: { end: 2400, caption: null, labelsOut: 0 }, sched: {}, total: L5.N, CH: [], live: true, tabs: [], tabAt: () => 0 });

  // only the copy-paste rank is built on camera; the inheritance side arrives in its own chapter
  const { sched, end, total } = scheduleBuild(insts.filter((i) => i.id[0] === 'd'), 0.3);
  const step = 0.52, n = L5.N, sweep = (n - 1) * step;
  let t = end + 0.7;
  const CH = [];
  const ch = (id, btn, dur, o) => { CH.push(Object.assign({ id, btn, t0: t, t1: t + dur }, o)); t += dur; };
  ch('copy', 'Copy-paste', 3.6, { side: 'dup' });
  ch('field', 'Add a field', 1.0 + sweep + 4.0, { side: 'dup', lead: 1.0, step: step, quiet: false });
  ch('quiet', 'Change a rule', 0.9 + sweep + 4.2, { side: 'dup', lead: 0.9, step: step, quiet: true });
  ch('one', 'One place', 1.6 + 1.2 + 3.8, { side: 'inh', lead: 1.6, bus: 1.2 });
  ch('much', 'Too much', 3.4, { side: 'inh' });
  const T = { buildEnd: end, caption: t + 0.3 };
  T.end = T.caption + 4.6; T.labelsOut = CH[0].t0 + 0.6;
  const names = Object.fromEntries(insts.map((i) => [i.id, i.name]));
  const tabs = [armadoTab(autoArmado(insts, 'lab', '// Lab 05 · one line per class on the bench'), sched, total, names)];
  return Object.assign(base, { T: T, sched: sched, total: total, CH: CH, live: false, tabs: tabs, tabAt: () => 0 });
}

const l5Chapter = (TL, t) => { for (let k = TL.CH.length - 1; k >= 0; k--) if (t >= TL.CH[k].t0) return k; return -1; };

function l5State(TL, t) {
  const st = { t: t, CB: {} };
  partsAt(TL, t, st);
  const n = TL.live ? clamp(Math.round(liveVal(LIVE.ev, 'n', t, TL.n)), 2, 8) : L5.N;
  st.n = n;
  const M0 = inAt(n);
  let edited = 0, quiet = false, side = 'dup', inh = false, head = null, bus = 0;
  let sweeping = false, payslip = false, ch = null, u = 0, inhIn = 0;

  if (TL.live) {
    const ev = LIVE.ev.filter((e) => (e[1] === 'copy' || e[1] === 'inherit') && e[0] <= t);
    const last = ev[ev.length - 1];
    if (last) {
      const u2 = t - last[0];
      if (last[1] === 'copy') {
        const kk = u2 / 0.42, i0 = Math.floor(kk), f = kk - i0;
        edited = clamp(i0 + (f >= L5.STAMP ? 1 : 0), 0, n - 1);
        sweeping = edited < n - 1;
        quiet = ev.filter((e) => e[1] === 'copy').length % 2 === 0;
        if (sweeping) {
          const a = clamp(i0 - 1, 0, n - 2), b = clamp(i0, 0, n - 2);
          head = { x: lerp(l5HeadX(a), l5HeadX(b), smooth(clamp(f / L5.TRAVEL, 0, 1))), z: L5.headZ, hot: f >= L5.STAMP && f < L5.STAMP + 0.22 };
        }
      } else { side = 'inh'; inh = true; inhIn = 1; bus = clamp(u2 / 0.7, 0, 1); }
    }
  } else {
    ch = TL.CH[l5Chapter(TL, t)]; u = ch ? t - ch.t0 : 0; side = ch ? ch.side : 'dup';
    if (ch && ch.lead != null && ch.step) {
      // the head travels over the first 60% of each step, then presses and stamps
      const kk = (u - ch.lead) / ch.step, i0 = Math.floor(kk), f = kk - i0;
      edited = clamp(i0 + (f >= L5.STAMP ? 1 : 0), 0, n - 1);
      sweeping = u >= ch.lead && edited < n - 1;
      quiet = ch.id === 'quiet';
      if (u >= ch.lead) {
        const a = clamp(i0 - 1, 0, n - 2), b = clamp(i0, 0, n - 2);
        const press = f >= L5.TRAVEL ? smooth(clamp((f - L5.TRAVEL) / 0.14, 0, 1)) * (1 - smooth(clamp((f - L5.STAMP - 0.1) / 0.18, 0, 1))) : 0;
        head = {
          x: lerp(l5HeadX(a), l5HeadX(b), smooth(clamp(f / L5.TRAVEL, 0, 1))),
          z: L5.headZ - press * 1.5 + (i0 === 0 ? (1 - smooth(clamp(f / L5.TRAVEL, 0, 1))) * 5.5 : 0),
          hot: f >= L5.STAMP && f < L5.STAMP + 0.22 && i0 < n - 1,
        };
      }
    }
    if (ch && (ch.id === 'one' || ch.id === 'much')) {
      inhIn = ch.id === 'much' ? 1 : clamp(u / ch.lead, 0, 1);
      inh = ch.id === 'much' || u >= ch.lead;
      bus = ch.id === 'much' ? 1 : clamp((u - ch.lead) / ch.bus, 0, 1);
      payslip = ch.id === 'much' && u > 1.0;
    }
  }

  // one system on the bench at a time
  const showInh = side === 'inh';
  // the copy-paste bench is cleared away rather than cut, so the swap is not a jump
  const clearing = showInh && ch && ch.id === 'one' ? clamp(1 - u / 0.55, 0, 1) : 0;
  for (let i = 0; i < L5.N; i++) {
    if (showInh || i >= n) st.parts['d' + i] = i < n ? clamp(clearing * 1.5 - i * 0.04, 0, 1) : 0;
    st.parts['s' + i] = showInh && i < n ? clamp((inhIn - 0.25 - i * 0.055) / 0.45, 0, 1) : 0;
  }
  st.parts.base = showInh ? clamp(inhIn / 0.4, 0, 1) : 0;
  st.parts.pay = payslip ? clamp((u - 1.0) / 0.5, 0, 1) : 0;

  // faces, all from the one number
  for (let i = 0; i < n; i++) {
    const done = i < edited, isStale = !sweeping && edited === n - 1 && i === n - 1;
    st.CB['d' + i] = {
      k: IN.fields + (done ? 1 : 0), hot: done ? IN.fields : undefined,
      stale: isStale && !quiet, dim: isStale && quiet,
      lamp: isStale ? (quiet ? '#f0b429' : '#ef4444') : done ? '#2fbf71' : undefined,
      note: isStale ? (quiet ? 'never updated' : 'CRASH') : done ? 'updated' : undefined,
    };
    st.CB['s' + i] = { inh: bus > (i + 0.5) / n, k: IN.fields + (inh ? 1 : 0) };
  }
  st.CB.base = { k: IN.fields + (inh ? 1 : 0), hot: inh ? IN.fields : undefined, note: inh ? 'edited once' : 'the shared rule, once' };
  st.CB.pay = { inh: bus > 0.5, k: IN.fields + 1 };

  const run = showInh ? { ok: inh ? n : 0, stale: 0, err: null, quiet: false }
    : sweeping || edited === 0 ? { ok: edited, stale: 0, err: null, quiet: quiet }
    : inRun(n, edited, quiet);
  const edits = showInh ? (inh ? M0.editsInh : 0) : edited;
  const verdict = showInh
    ? (inh ? ['ONE PLACE', 'one edit reached all ' + n + ' subtypes', 'lime'] : ['REBUILDING', 'the same eight, under one Employee', 'grey'])
    : sweeping ? ['EDITING', edited + ' of ' + n + ' classes opened so far', 'amber']
    : edited === 0 ? ['CONSISTENT', 'all ' + n + ' copies agree — for now', 'grey']
    : inVerdict(n, edits, run.stale, quiet);

  Object.assign(st, {
    side: side, edited: edited, quiet: quiet, inh: inh, bus: bus, head: head, sweeping: sweeping,
    payslip: payslip, ch: ch ? ch.id : null, u: u, run: run, M: M0, edits: edits, verdict: verdict,
    sweepEnd: ch && ch.step ? ch.lead + (n - 1) * ch.step : 0,
    loc: showInh ? M0.locInh : M0.locDup,
  });
  st.cam = showInh && ch && ch.id === 'one'
    ? mixCam(TL.camDup, TL.camInh, smooth(clamp(u / 0.95, 0, 1)))
    : showInh ? TL.camInh : TL.camDup;
  return st;
}

// the bus: one ribbon from Employee to every subtype card, lit by st.bus.
// G.cam.p() already returns canvas coords - no G.k here.
function l5Bus(G, base, st) {
  if (st.side !== 'inh' || st.bus <= 0) return;
  const c = G.ctx, yb = L5.y + 1.3 + SUB.d + 1.5, yc = L5.y + 1.3 + SUB.d, z = 0.1;  // +y is toward the viewer
  const A = G.cam.p(base.p([L5.x0 + L5B.w - 0.6, L5.y + L5B.d, z]));
  const S = G.cam.p(base.p([L5.x0 + L5B.w + 0.8, yb, z]));
  const E = G.cam.p(base.p([L5.cardX0 + (st.n - 1) * SUB.pitch + SUB.w, yb, z]));
  const X = [S[0] + (E[0] - S[0]) * st.bus, S[1] + (E[1] - S[1]) * st.bus];
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  c.lineWidth = 3.0; c.strokeStyle = 'rgba(42,48,70,.20)';
  c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(S[0], S[1]); c.lineTo(E[0], E[1]); c.stroke();
  c.lineWidth = 4.2; c.strokeStyle = 'rgba(255,122,47,.95)';
  c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(S[0], S[1]); c.lineTo(X[0], X[1]); c.stroke();
  for (let i = 0; i < st.n; i++) {
    const u = (i + 0.5) / st.n;
    if (u > st.bus) break;
    const sx = L5.cardX0 + i * SUB.pitch + SUB.w / 2;
    const q = G.cam.p(base.p([sx, yb, z])), r = G.cam.p(base.p([sx, yc, z]));
    c.lineWidth = 3.2; c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(r[0], r[1]); c.stroke();
    c.fillStyle = 'rgba(255,122,47,.95)'; c.beginPath(); c.arc(r[0], r[1], 3.2, 0, 7); c.fill();
  }
  c.restore();
}

const DEMO = {
  brand: 'SIMULAB', id: 'INHERIT', num: '05', title: 'INHERITANCE',
  tagline: 'ONE RULE · ONE PLACE', category: 'OOP · 01276131',
  plate: ['OOP 01276131 · CHAPTER 5 · INHERITANCE', 'Eight employee types, one shared rule, and the edits it costs'],
  chips: ['8 SUBTYPES · 6 SHARED FIELDS', 'KMITL · INTERNATIONAL PROGRAMME'],
  caption: 'A shared rule should have exactly one place to be changed.',
  intro: { seconds: 5, lines: ['Add one field to every', 'employee type. How many edits?'], pill: 'OOP · LAB 05 · INHERITANCE', src: (TL) => TL.CH[1].t0 + 1.6, rate: 0.9 },
  major: ['base', 'd0', 's0'],
  params: { n: L5.N },
  knob: { key: 'n', label: 'EMPLOYEE SUBTYPES', min: 2, max: 8, step: 1, unit: '', fmt: (v) => String(Math.round(v)) },
  live: {
    label: 'CHANGE THE SHARED RULE',
    controls: [
      { key: 'copy', label: 'copy-paste', keys: ['KeyC'], kbd: 'C' },
      { key: 'inherit', label: 'inheritance', keys: ['KeyI'], kbd: 'I' },
    ],
  },
  timeline: (params) => l5Timeline(params),
  steps: (TL) => TL.CH.map((c, i) => [(i + 1) + ' · ' + c.btn, c.t0 - 0.2]),
  state(TL, t) { return l5State(TL, t); },
  drawScene(G, st, TL) {
    drawTapete(G, st, { x0: -23, x1: 25, y0: -14, y1: 17 });
    const base = new Xf();
    drawAssembly(G, st, TL.insts, base);
    if (st.head) drawHead(G, base, st.head.x, L5.y + CAB.d + 1.6, st.head.z != null ? st.head.z : L5.headZ, st.head.hot);
    return base;
  },
  drawFx(G, st, TL, base) { l5Bus(G, base, st); },
  drawNotes(G, st, TL, base) {
    const c = G.ctx, P = (p) => G.cam.p(base.p(p)), u = st.u;
    const fade = (a, b) => seg(u, a, a + 0.3) * (1 - seg(u, b - 0.3, b));
    if (!TL.live && st.t >= TL.T.caption - 0.3) return;
    const topOf = (i) => [l5HeadX(i), L5.y + CAB.d, CAB.h];
    if (st.ch === 'copy')
      callout(c, P(topOf(2)), -46, -132, 'Every cabinet carries its own copy of the same six lines', fade(0.7, 3.4), '#ffffff');
    if (st.ch === 'field' && st.run.stale)
      callout(c, P(topOf(L5.N - 1)), -70, 132, IN_LOUD, fade(st.sweepEnd + 0.12, 99), '#ff9e93');
    if (st.ch === 'quiet' && st.run.stale)
      callout(c, P(topOf(L5.N - 1)), -70, 132, 'Nothing was raised. It still stores ' + IN_QUIET, fade(st.sweepEnd + 0.12, 99), '#ffcf6b');
    if (st.ch === 'one' && st.bus > 0.92)
      callout(c, P([L5.x0 + L5B.w / 2, L5.y + L5B.d, L5B.h]), -40, -126, 'One edit here. All ' + st.n + ' subtypes have it.', fade(2.9, 99), '#c8f04a');
    if (st.payslip)
      callout(c, P([L5.cardX0 + 2 * SUB.pitch + SUB.w / 2, L5.y + 10.4 + SUB.d, SUB.h]), 34, 132,
        'A Payslip is not an Employee. Shared fields are not an is-a test.', fade(1.4, 3.4), '#ff9e93');
  },
  speedBadge(TL, st) {
    if (st.placedCount < L5.N && st.side === 'dup' && !st.edited) return { txt: 'BUILDING', bg: BAY_BG.amber };
    if (st.run.stale && !st.quiet) return { txt: 'CRASH', bg: BAY_BG.coral };
    if (st.run.stale && st.quiet) return { txt: 'SILENT DRIFT', bg: BAY_BG.amber };
    if (st.sweeping) return { txt: 'EDITING · ' + st.edited, bg: BAY_BG.amber };
    return { txt: st.edits === 1 ? 'ONE EDIT' : st.side === 'inh' ? 'INHERITANCE' : 'COPY-PASTE', bg: st.edits === 1 ? BAY_BG.lime : BAY_BG.grey };
  },
  footer(TL, st) {
    return [
      { text: st.side === 'inh' ? 'INHERITANCE' : 'COPY-PASTE', dot: st.side === 'inh' ? UIC.lime : UIC.coral },
      { text: st.n + ' SUBTYPES · ' + IN.fields + ' SHARED FIELDS' },
      { text: 'EDIT SITES · ' + st.edits },
    ];
  },
  drawBays(c, TL, st) {
    let b = bayFrame(c, 0, 'BAY 01 · LINES OF CODE', st.side === 'inh' ? 'INHERITANCE' : 'COPY-PASTE', st.side === 'inh' ? BAY_BG.lime : BAY_BG.coral);
    bigValue(c, b, String(st.loc), 'lines', 'measured with the Python tokenizer');
    barPair(c, b, [['COPY-PASTE', st.M.locDup / 64], ['INHERITANCE', st.M.locInh / 64]]);

    b = bayFrame(c, 1, 'BAY 02 · EDIT SITES', st.edits === 1 ? 'ONE' : String(st.edits), st.edits === 1 ? BAY_BG.lime : st.edits ? BAY_BG.coral : BAY_BG.grey);
    bigValue(c, b, String(st.edits), st.edits === 1 ? 'place' : 'places', 'classes you open to add ' + IN.added);
    barPair(c, b, [['COPY-PASTE', st.M.editsDup / 8], ['INHERITANCE', st.M.editsInh / 8]]);

    b = bayFrame(c, 2, 'BAY 03 · SUBTYPES WITH THE FIELD', st.run.ok + '/' + st.n, st.run.stale ? BAY_BG.coral : st.run.ok === st.n ? BAY_BG.lime : BAY_BG.grey);
    bigValue(c, b, st.run.ok + '/' + st.n, '', st.run.stale ? st.run.stale + ' subtype nobody updated' : st.run.ok === st.n ? 'every subtype, from one place' : 'the engraver is still working');
    barPair(c, b, [['UPDATED', st.run.ok / st.n], ['STALE', st.run.stale / st.n]]);

    const v = st.verdict;
    b = bayFrame(c, 3, 'BAY 04 · WHAT A RUN FINDS', v[0], BAY_BG[v[2]] || BAY_BG.grey);
    bigValue(c, b, v[0], '', v[1]);
  },
  audioCues(TL) {
    const cu = [{ type: 'caption', t: TL.T.caption }];
    for (const ch of TL.CH) {
      cu.push({ type: 'blip', t: ch.t0, f: 880, gain: 0.1, teaser: true });
      if (ch.step) {
        for (let i = 0; i < L5.N - 1; i++) cu.push({ type: 'detent', t: ch.t0 + ch.lead + i * ch.step, gain: 0.09 });
        cu.push({ type: ch.quiet ? 'thud' : 'error', t: ch.t0 + ch.lead + (L5.N - 1) * ch.step + 0.35 });
      }
      if (ch.id === 'one') cu.push({ type: 'ding', t: ch.t0 + ch.lead + ch.bus });
    }
    return cu;
  },
};
