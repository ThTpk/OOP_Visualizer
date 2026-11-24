// The cinema box office, drawn as a street elevation (no perspective) the way
// references/style.md asks for: plain paper left open, density on the building.
// Built once; only the pennant and the bulbs move.
import { el, pen, shape, blot, paint, f, PEN, type Vec } from './lib/ink.ts';

export const GEO = {
  ground: 288,
  win: { x0: 400, x1: 525, y0: 158, y1: 215 },
  counter: { x0: 388, x1: 540, y: 215, h: 8 },
  stand: 352,          // where the moviegoer stops
  cashier: 462,        // centre of the booth
};

export interface BoxOffice {
  /** re-tint the flat accents when the palette changes */
  tint(colour: string): void;
  /** the booth interior: whoever stands here is hidden from the waist down by the counter */
  booth: SVGGElement;
  /** the pennant above the roof; pass the pointer wind each frame */
  step(t: number, dt: number, wind: number, lamp: number): void;
}

export function boxOffice(parent: Element, accent: string): BoxOffice {
  const G = GEO;
  const g = el('g', {}, parent);

  // --- pavement
  pen(g, 0.9).setAttribute('d', `M0 ${G.ground} L720 ${G.ground} M0 ${G.ground + 10} L720 ${G.ground + 10}`);
  pen(g, 0.5).setAttribute('d', Array.from({ length: 9 }, (_, i) => `M${i * 40 + 12} ${G.ground} l0 10`).join(' '));

  // --- façade wall, paper so the pavement stops behind it
  shape(g, 0.95).setAttribute('d', `M330 ${G.ground} L330 100 L700 100 L700 ${G.ground}Z`);

  // --- cornice with dentils, slightly overhanging
  shape(g, 0.95).setAttribute('d', 'M318 100 L712 100 L712 88 L318 88Z');
  pen(g, PEN * 0.45).setAttribute('d',
    Array.from({ length: 24 }, (_, i) => `M${f(326 + i * 16)} 100 l0 -7`).join(' '));
  pen(g, 0.8).setAttribute('d', 'M322 88 Q515 83 708 88');

  // --- marquee board with real lettering and a row of bulbs
  shape(g, 0.95).setAttribute('d', 'M348 146 L686 146 L686 106 L348 106Z');
  pen(g, PEN * 0.5).setAttribute('d', 'M354 141 L680 141 M354 111 L680 111');
  el('text', {
    x: 517, y: 134, 'text-anchor': 'middle', fill: 'currentColor',
    'font-family': 'ui-monospace, monospace', 'font-size': 21, 'letter-spacing': 7, 'font-weight': 600,
  }, g).textContent = 'CINEMA';
  const bulbs: SVGCircleElement[] = [];
  for (let i = 0; i < 20; i++) {
    bulbs.push(el('circle', {
      cx: f(357 + i * 17.4), cy: 151.5, r: 2.2, fill: 'var(--paper)', stroke: 'currentColor', 'stroke-width': PEN * 0.55,
    }, g));
  }

  // --- the booth window: frame, dark reveal, back wall
  shape(g, 1.05).setAttribute('d', `M${G.win.x0} ${G.win.y1} L${G.win.x0} ${G.win.y0} L${G.win.x1} ${G.win.y0} L${G.win.x1} ${G.win.y1}Z`);
  pen(g, PEN * 0.5).setAttribute('d',
    `M${G.win.x0 + 5} ${G.win.y1} L${G.win.x0 + 5} ${G.win.y0 + 5} L${G.win.x1 - 5} ${G.win.y0 + 5} L${G.win.x1 - 5} ${G.win.y1}`);
  // speaker grille beside the glass
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      blot(g).setAttribute('d', `M${f(372 + c * 5)} ${f(182 + r * 5)} a1 1 0 1 0 0.1 0Z`);

  // the cashier goes in here, before the counter is drawn over the legs
  const booth = el('g', {}, g);

  // --- counter slab the ticket slides across
  shape(g, 1.0).setAttribute('d',
    `M${G.counter.x0} ${G.counter.y} L${G.counter.x1} ${G.counter.y} L${G.counter.x1} ${G.counter.y + G.counter.h} L${G.counter.x0} ${G.counter.y + G.counter.h}Z`);
  pen(g, PEN * 0.45).setAttribute('d', `M${G.counter.x0 + 4} ${G.counter.y + G.counter.h} L${G.counter.x1 - 4} ${G.counter.y + G.counter.h}`);

  // --- poster case, right: one flat accent, a title block, a frame
  shape(g, 1.0).setAttribute('d', 'M566 252 L566 150 L664 150 L664 252Z');
  const poster = paint(g, accent, PEN * 0.6);
  poster.setAttribute('d', 'M574 212 L574 158 L656 158 L656 212Z');
  pen(g, PEN * 0.45).setAttribute('d', 'M576 222 L654 222 M576 231 L632 231 M576 240 L644 240');

  // --- a pennant on a pole above the cornice; the only thing the wind moves
  pen(g, 0.9).setAttribute('d', 'M352 88 L352 52');
  const flag = paint(g, accent, PEN * 0.6);

  return {
    booth,
    tint(c) { poster.setAttribute('fill', c); flag.setAttribute('fill', c); },
    step(t, _dt, wind, lamp) {
      const s = Math.sin(t * 2.1) * 0.5 + wind * 2.4;
      const tip: Vec = [352 + 26, 60 + s * 2.2];
      flag.setAttribute('d',
        `M352 54 Q${f(366 + s * 1.6)} ${f(52 + s * 2)} ${f(tip[0])} ${f(tip[1])}` +
        ` Q${f(366 - s)} ${f(66 + s * 1.4)} 352 68Z`);
      // at night the bulbs fill in instead of reading as empty rings
      for (const b of bulbs) b.setAttribute('fill', lamp > 0.5 ? 'currentColor' : 'var(--paper)');
    },
  };
}
