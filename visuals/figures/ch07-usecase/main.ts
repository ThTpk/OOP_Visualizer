// Chapter 7 · the domain story the chapter already tells, played as the scene it
// describes: a moviegoer tells a cashier a film and a showtime, the cashier looks
// at the seating plan, the cashier gives a ticket. The three numbered arrows are
// domain storytelling's own notation, drawn over the moment it stands for.
//
// Mounts into every <div data-figure="ch07-usecase"> on the page.
import { el, pen, shape, blot, paint, inkDefs, run, f, PEN, type Vec } from './lib/ink.ts';
import { palette, applyPalette, nightTint } from './lib/daynight.ts';
import { pointerWind, clamp, smooth, ease } from './lib/motion.ts';
import { moviegoer, cashier } from './people.ts';
import { boxOffice, GEO } from './boxoffice.ts';

const W = 720, H = 330;
const ACCENT = '#a8402f';      // poster
const TICKET = '#d9a441';      // the work object that matters
const SCALE = 1.1, CASH_SCALE = 1.15, CASH_GROUND = 274;

// the beats, in seconds
const T = { tell: 3.2, look: 6.2, give: 9.0, hold: 12.2, leave: 14.4, end: 17.4 };

type Lbl = SVGTextElement;
const label = (parent: Element, size = 9.5): Lbl =>
  el('text', {
    fill: 'currentColor', 'font-family': 'ui-monospace, monospace', 'font-size': size,
    'letter-spacing': 0.6, 'text-anchor': 'middle', opacity: 0,
  }, parent);

/** One numbered activity arrow: a bowed line, a filled head, a ring with its number, a verb. */
function activity(parent: Element) {
  const g = el('g', { opacity: 0 }, parent);
  const line = pen(g, PEN * 0.85);
  const head = blot(g);
  const ring = el('circle', { r: 7.4, fill: 'var(--paper)', stroke: 'currentColor', 'stroke-width': PEN * 0.8 }, g);
  const num = el('text', {
    fill: 'currentColor', 'font-family': 'ui-monospace, monospace', 'font-size': 9,
    'text-anchor': 'middle', 'font-weight': 700,
  }, g);
  const verb = el('text', {
    fill: 'currentColor', 'font-family': 'ui-monospace, monospace', 'font-size': 9.5,
    'letter-spacing': 0.5, 'text-anchor': 'middle', 'font-style': 'italic',
  }, g);
  return {
    set(a: Vec, b: Vec, bow: number, n: number, word: string, alpha: number, ringAt = 0.5) {
      g.setAttribute('opacity', f(clamp(alpha, 0, 1)));
      if (alpha <= 0.01) return;
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const L = Math.hypot(dx, dy) || 1;
      const px = -dy / L, py = dx / L;                       // perpendicular
      const M: Vec = [mx + px * bow, my + py * bow];
      const C: Vec = [(4 * M[0] - a[0] - b[0]) / 2, (4 * M[1] - a[1] - b[1]) / 2];
      // draw only as far as alpha has arrived, so the arrow is written on
      const u = smooth(0, 0.85, alpha);
      const q = (s: number): Vec => [
        (1 - s) * (1 - s) * a[0] + 2 * (1 - s) * s * C[0] + s * s * b[0],
        (1 - s) * (1 - s) * a[1] + 2 * (1 - s) * s * C[1] + s * s * b[1],
      ];
      const tip = q(u);
      line.setAttribute('d', `M${f(a[0])} ${f(a[1])} Q${f(C[0] * u + a[0] * (1 - u))} ${f(C[1] * u + a[1] * (1 - u))} ${f(tip[0])} ${f(tip[1])}`);
      const back = q(Math.max(0, u - 0.06));
      const ax = tip[0] - back[0], ay = tip[1] - back[1], al = Math.hypot(ax, ay) || 1;
      const ux = ax / al, uy = ay / al;
      head.setAttribute('d',
        `M${f(tip[0])} ${f(tip[1])}` +
        ` L${f(tip[0] - ux * 7 - uy * 3.1)} ${f(tip[1] - uy * 7 + ux * 3.1)}` +
        ` L${f(tip[0] - ux * 7 + uy * 3.1)} ${f(tip[1] - uy * 7 - ux * 3.1)}Z`);
      const r = q(ringAt);
      ring.setAttribute('cx', f(r[0])); ring.setAttribute('cy', f(r[1]));
      num.setAttribute('x', f(r[0])); num.setAttribute('y', f(r[1] + 3.2)); num.textContent = String(n);
      verb.setAttribute('x', f(r[0])); verb.setAttribute('y', f(r[1] - 11)); verb.textContent = word;
    },
  };
}

function build(host: Element) {
  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, role: 'img',
    'aria-label': 'Line drawing of a cinema box office: a moviegoer tells a cashier a film and showtime, the cashier looks at the seating plan and gives a ticket',
  });
  const { filter } = inkDefs(svg, 'uc');
  host.appendChild(svg);
  // the figure carries its own paper rule and background, so it reads the same
  // wherever it is embedded and does not depend on the host page's CSS
  el('style', {}, svg).textContent = '.pp{fill:var(--paper,#fdfdfc)}';
  el('rect', { x: -2, y: -2, width: W + 4, height: H + 4, fill: 'var(--paper)' }, svg);
  const scene = el('g', { filter }, svg);

  const office = boxOffice(scene, ACCENT);

  // the cashier goes behind the counter
  const clerk = cashier(office.booth, GEO.cashier, CASH_GROUND, CASH_SCALE);

  // work objects: the seating plan on the counter, and the ticket
  const planG = el('g', {}, scene);
  const planSheet = shape(planG, PEN * 0.8);
  const planSeats: SVGPathElement[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) planSeats.push(pen(planG, PEN * 0.4));
  const ticketG = el('g', { opacity: 0 }, scene);
  const ticket = paint(ticketG, TICKET, PEN * 0.7);
  const ticketLine = pen(ticketG, PEN * 0.4);

  // the customer walks in last so she is drawn over the counter
  const her = moviegoer(scene, -60, GEO.ground, SCALE);

  const arrows = [activity(scene), activity(scene), activity(scene)];
  const names = { her: label(scene), clerk: label(scene), plan: label(scene, 8.5), ticket: label(scene, 8.5) };
  names.her.textContent = 'moviegoer';
  names.clerk.textContent = 'cashier';
  names.plan.textContent = 'seating plan';
  names.ticket.textContent = 'ticket';

  const wind = pointerWind(svg, 0.18);
  let tau = 0.5;
  const setTheme = () => {
    const forced = new URLSearchParams(location.search).get('theme');
    const theme = forced || document.documentElement.getAttribute('data-theme');
    tau = theme === 'light' ? 0.5 : 0.045;   // noon, or just past midnight
    const P = palette(tau);
    applyPalette(svg, P);
    svg.style.setProperty('--fig-paper', `rgb(${P.paper.join(',')})`);
    office.tint(nightTint(ACCENT, P, 0.62));
    return P;
  };
  let P = setTheme();
  new MutationObserver(() => { P = setTheme(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  let loop = 0;
  run((t, dt) => {
    const tt = t - loop;
    if (tt > T.end) { loop = t; her.x = -60; return; }
    wind.step(t);

    // --- beat envelopes, all from one clock
    const tellA = smooth(T.tell + 0.2, T.tell + 0.9, tt) * (1 - smooth(T.leave, T.leave + 0.7, tt));
    const lookA = smooth(T.look + 0.3, T.look + 1.0, tt) * (1 - smooth(T.leave, T.leave + 0.7, tt));
    const giveA = smooth(T.give + 0.9, T.give + 1.6, tt) * (1 - smooth(T.leave, T.leave + 0.7, tt));
    const look = smooth(T.look + 0.1, T.look + 0.7, tt) * (1 - smooth(T.give - 0.5, T.give + 0.1, tt));
    const give = smooth(T.give + 0.1, T.give + 0.7, tt) * (1 - smooth(T.hold + 0.4, T.hold + 1.1, tt));
    const reach = smooth(T.give + 0.5, T.give + 1.1, tt) * (1 - smooth(T.hold + 0.4, T.hold + 1.1, tt));
    const pass = smooth(T.give + 0.8, T.give + 1.7, tt);          // the ticket crossing the counter
    const leaving = tt > T.leave;
    her.dir = leaving ? -1 : 1;

    office.step(t, dt, wind.value, P.lamp);
    her.step(t, dt, { stopAt: leaving ? Infinity : GEO.stand, reach });
    clerk.step(t, dt, { look, give });

    // --- the seating plan lies on the counter and tilts up to be read
    const lift = ease(look);
    const px = 476 - lift * 2, py = 212 - lift * 24, tilt = lift * 0.3;
    const cs = Math.cos(tilt), sn = Math.sin(tilt);
    const PW = 38, PH = 26;
    const corner = (u: number, v: number): Vec => [px + (u * PW) * cs - (v * PH) * sn, py + (u * PW) * sn + (v * PH) * cs];
    const c00 = corner(0, 0), c10 = corner(1, 0), c11 = corner(1, 1), c01 = corner(0, 1);
    planSheet.setAttribute('d', `M${f(c00[0])} ${f(c00[1])} L${f(c10[0])} ${f(c10[1])} L${f(c11[0])} ${f(c11[1])} L${f(c01[0])} ${f(c01[1])}Z`);
    planSeats.forEach((s, i) => {
      const r = Math.floor(i / 6), c = i % 6;
      const a = corner(0.1 + c * 0.135, 0.18 + r * 0.26);
      const b = corner(0.1 + c * 0.135 + 0.085, 0.18 + r * 0.26);
      s.setAttribute('d', `M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}`);
      s.setAttribute('stroke-width', f(PEN * ((i * 7) % 5 === 0 ? 1.5 : 0.4)));   // a few seats already taken
    });

    // --- the ticket crosses the counter from his hand to hers
    const hisHand = clerk.hand, herHand = her.hand;
    const u = ease(pass);
    const tx = hisHand[0] + (herHand[0] - hisHand[0]) * u;
    const ty = hisHand[1] + (herHand[1] - hisHand[1]) * u - Math.sin(Math.PI * u) * 5;
    const tAlpha = smooth(T.give + 0.3, T.give + 0.6, tt) * (1 - smooth(T.leave + 0.6, T.leave + 1.4, tt));
    ticketG.setAttribute('opacity', f(tAlpha));
    ticket.setAttribute('fill', nightTint(TICKET, P));
    ticket.setAttribute('d', `M${f(tx - 10)} ${f(ty - 5.5)} L${f(tx + 10)} ${f(ty - 5.5)} L${f(tx + 10)} ${f(ty + 5.5)} L${f(tx - 10)} ${f(ty + 5.5)}Z`);
    ticketLine.setAttribute('d', `M${f(tx + 4)} ${f(ty - 5.5)} l0 11 M${f(tx - 7)} ${f(ty - 1.6)} l8 0 M${f(tx - 7)} ${f(ty + 1.8)} l8 0`);

    // --- the three activities of the domain story
    const herHead: Vec = [her.x + SCALE * 3, GEO.ground - SCALE * 88];
    const hisHead: Vec = [GEO.cashier - CASH_SCALE * 2.6, CASH_GROUND - CASH_SCALE * 85];
    arrows[0].set([herHead[0] + 11, herHead[1] - 10], [hisHead[0] - 18, hisHead[1] - 12], -26, 1, 'tells', tellA, 0.42);
    arrows[1].set([hisHead[0] + 9, hisHead[1] + 4], [c01[0] + 4, c01[1] - 7], -13, 2, 'looks at', lookA, 0.34);
    arrows[2].set([hisHead[0] - 10, hisHead[1] + 30], [herHead[0] + 15, herHead[1] + 34], -34, 3, 'gives', giveA, 0.5);

    // --- names: actors and work objects, the chapter's own vocabulary
    const nameA = smooth(1.4, 2.2, tt) * (1 - smooth(T.leave, T.leave + 0.7, tt));
    names.her.setAttribute('x', f(Math.max(46, her.x + 4))); names.her.setAttribute('y', f(GEO.ground + 24));
    names.her.setAttribute('opacity', f(nameA * (leaving ? 0 : 1)));
    names.clerk.setAttribute('x', f(GEO.cashier)); names.clerk.setAttribute('y', '248');
    names.clerk.setAttribute('opacity', f(nameA));
    names.plan.setAttribute('x', f(px + PW / 2)); names.plan.setAttribute('y', f(py + PH + 18));
    names.plan.setAttribute('opacity', f(nameA * lookA));
    names.ticket.setAttribute('x', f(tx)); names.ticket.setAttribute('y', f(ty + 28));
    names.ticket.setAttribute('opacity', f(tAlpha * 0.9));
  });
}

for (const host of document.querySelectorAll('[data-figure="ch07-usecase"]')) build(host);
