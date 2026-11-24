// Dev harness: one figure on a card, so it can be checked on its own before the
// scene exists. Served at /visuals/figures/ch07-usecase/dev.html
import { el, pen, inkDefs, run } from './lib/ink.ts';
import { moviegoer } from './people.ts';

const W = 480, H = 240, GROUND = 196, SCALE = 1.25;
const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Line drawing of a moviegoer walking' });
const { filter } = inkDefs(svg, 'uc');
document.querySelector('#stage')!.appendChild(svg);
const scene = el('g', { filter }, svg);

pen(scene, 0.9).setAttribute('d', `M0 ${GROUND} L${W} ${GROUND}`);

const her = moviegoer(scene, Number(new URLSearchParams(location.search).get("x") ?? -40), GROUND, SCALE);
const stopAt = Number(new URLSearchParams(location.search).get('stop') ?? 300);
run((t, dt) => {
  her.step(t, dt, { stopAt });
  if (her.x > W + 60) her.x = -40;
});
