// People for the chapter 7 figure: the cinema box office.
// Everyone is built in figure space — ~95 units tall, feet on y = 120, facing +x,
// standing at x = 40 — and placed into the scene with place().
import { el, pen, shape, blot, limb, shoe, place, f, PEN, PAPER, type Vec } from './lib/ink.ts';
import { gait } from './lib/gait.ts';
import { spring, clamp, ease } from './lib/motion.ts';

const lerpP = (a: Vec, b: Vec, t: number): Vec => {
  const u = clamp(t, 0, 1);
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
};

export interface Walker {
  g: SVGGElement;
  /** scene x of the figure's standing point */
  x: number;
  /** 0 while standing still, 1 at full walking speed */
  go: number;
  /** +1 faces right, -1 faces left */
  dir: 1 | -1;
  /** scene point of the near hand, for handing things over */
  hand: Vec;
  step(t: number, dt: number, o?: { stopAt?: number; reach?: number }): void;
}

/**
 * The moviegoer: a student in a hooded top, hair in a low bun. Walks in from the
 * left and slows to a stand at stopAt. The near hand is kept free and can reach
 * across the counter (reach 0..1), because taking the ticket is the whole point.
 */
export function moviegoer(parent: Element, startX: number, groundY: number, scale: number): Walker {
  const g = el('g', {}, parent);

  // back to front
  const farArm = limb(g, 3.3);
  const legs = [limb(g, 4.2), limb(g, 4.2)];
  const shoes = [blot(g), blot(g)];
  const neck = pen(g, PEN * 0.9);
  const top = shape(g);
  const hood = shape(g);
  const drawstring = pen(g, PEN * 0.5);
  const head = el('ellipse', { rx: 3.6, ry: 4.6, fill: PAPER, stroke: 'currentColor', 'stroke-width': PEN }, g);
  const hair = shape(g);
  const bun = blot(g);
  const nearArm = limb(g, 3.3);

  const walk = gait({ kind: 'walk' });
  const armSwing = [spring(58, 9), spring(58, 9)];
  const bunSwing = spring(80, 6);

  let phase = 0;
  const w: Walker = {
    g, x: startX, go: 1, dir: 1, hand: [0, 0],
    step(t, dt, o = {}) {
      // slow to a stand over the last 26 units before the counter
      const stopAt = o.stopAt ?? Infinity;
      const want = stopAt === Infinity ? 1 : clamp(w.dir * (stopAt - w.x) / 26, 0, 1);
      w.go += (want - w.go) * clamp(dt * 5, 0, 1);
      if (w.go < 0.02) w.go = 0;

      phase += (dt / walk.period) * w.go;
      w.x += w.dir * walk.speed * scale * dt * w.go;
      place(g, w.x, groundY, w.dir, scale);

      const p = walk.pose(phase, w.go);
      const b = p.bob;
      p.feet.forEach((fo, i) => { legs[i].draw([p.hip, fo.knee, fo.ankle], [0.3, 0.8]); shoe(shoes[i], fo.ankle, fo.pitch); });
      g.insertBefore(legs[p.front].g, top);
      g.insertBefore(shoes[p.front], top);

      // A hooded top: shoulder width, tapering in to the hip, hem at 68 so the
      // hands hang clear below it. The front hem lifts over the leading knee.
      const sh: Vec = [41, 41 + b];
      const kF = p.feet[p.front].knee;
      const hemY = 74 + b * 0.5;
      const lift = clamp((kF[0] - 40) * 0.1, -0.6, 2.2);
      top.setAttribute('d',
        `M${f(sh[0] - 5.6)} ${f(sh[1] + 1.6)}` +
        ` Q${f(sh[0] - 0.4)} ${f(sh[1] - 3.2)} ${f(sh[0] + 6)} ${f(sh[1] + 1.6)}` +
        ` Q${f(sh[0] + 5.8)} ${f(58 + b)} ${f(sh[0] + 4.8)} ${f(hemY - lift)}` +
        ` Q${f(sh[0] - 0.6)} ${f(hemY + 2 - lift * 0.4)} ${f(sh[0] - 5)} ${f(hemY + 0.6)}` +
        ` Q${f(sh[0] - 5.6)} ${f(58 + b)} ${f(sh[0] - 5.6)} ${f(sh[1] + 1.6)}Z`);
      drawstring.setAttribute('d',
        `M${f(sh[0] + 0.6)} ${f(sh[1] + 4.4)} l0 ${f(5.6)} M${f(sh[0] + 2.4)} ${f(sh[1] + 4.6)} l0.3 ${f(5)}`);
      // the hood sits as a lump behind the neck
      hood.setAttribute('d',
        `M${f(sh[0] - 6.2)} ${f(sh[1] + 1.2)}` +
        ` Q${f(sh[0] - 10.4)} ${f(sh[1] - 6.4)} ${f(sh[0] - 3.4)} ${f(sh[1] - 8.2)}` +
        ` Q${f(sh[0] + 1.6)} ${f(sh[1] - 6.8)} ${f(sh[0] + 2.4)} ${f(sh[1] - 0.6)}Z`);

      neck.setAttribute('d', `M${f(sh[0] - 1.4)} ${f(sh[1] + 0.4)} l-0.2 ${f(-4.2)} M${f(sh[0] + 2.2)} ${f(sh[1] + 0.6)} l0.2 ${f(-4.4)}`);

      // head, hair gathered into a low bun that lags behind the bob
      const hc: Vec = [42.8, 31.4 + b];
      head.setAttribute('cx', f(hc[0]));
      head.setAttribute('cy', f(hc[1]));
      hair.setAttribute('d',
        `M${f(hc[0] + 3.3)} ${f(hc[1] - 2.4)}` +
        ` Q${f(hc[0] + 1)} ${f(hc[1] - 6.8)} ${f(hc[0] - 3.4)} ${f(hc[1] - 4.4)}` +
        ` Q${f(hc[0] - 6.2)} ${f(hc[1] - 1.2)} ${f(hc[0] - 4.8)} ${f(hc[1] + 3.6)}` +
        ` Q${f(hc[0] - 2.6)} ${f(hc[1] + 1)} ${f(hc[0] - 1.2)} ${f(hc[1] - 2.2)}` +
        ` Q${f(hc[0] + 1)} ${f(hc[1] - 0.8)} ${f(hc[0] + 3.3)} ${f(hc[1] - 2.4)}Z`);
      const bs = bunSwing.step(b * 0.8, dt);
      bun.setAttribute('d', `M${f(hc[0] - 5.4)} ${f(hc[1] + 2.4 - bs * 0.35)} a2.6 2.4 0 1 0 0.1 0Z`);

      // arms swing opposite the legs, through springs so they lag and settle.
      // Shoulders sit just outside the silhouette so both arms read.
      const legSwing = (p.feet[0].ankle[0] - 40) / (walk.stride / 2);
      const farA = (armSwing[0].step(-legSwing * 15 * w.go, dt) * Math.PI) / 180;
      const nearA = (armSwing[1].step(legSwing * 13 * w.go, dt) * Math.PI) / 180;
      const shF: Vec = [sh[0] - 6.2, sh[1] + 2.6];
      const shN: Vec = [sh[0] + 5, sh[1] + 3.4];
      const elbF: Vec = [shF[0] + 16 * Math.sin(farA), shF[1] + 16 * Math.cos(farA)];
      farArm.draw([shF, elbF, [elbF[0] + 15 * Math.sin(farA + 0.22), elbF[1] + 15 * Math.cos(farA + 0.22)]], [0.2, 0.5]);

      // the near arm reaches across the counter when asked
      const reach = ease(clamp(o.reach ?? 0, 0, 1));
      const elbRest: Vec = [shN[0] + 15 * Math.sin(nearA), shN[1] + 15 * Math.cos(nearA)];
      const handRest: Vec = [elbRest[0] + 14 * Math.sin(nearA + 0.1), elbRest[1] + 14 * Math.cos(nearA + 0.1)];
      const elbN = lerpP(elbRest, [shN[0] + 11, shN[1] + 11], reach);
      const hand = lerpP(handRest, [shN[0] + 25.5, shN[1] + 10], reach);
      nearArm.draw([shN, elbN, hand], [0.2, 0.4]);
      w.hand = [w.x + w.dir * scale * (hand[0] - 40), groundY + scale * (hand[1] - 120)];
    },
  };
  return w;
}

export interface Cashier {
  g: SVGGElement;
  /** scene point of the hand that passes the ticket */
  hand: Vec;
  /** look: 0 facing the customer … 1 turned down to the seating plan. give: 0 … 1 arm across the counter */
  step(t: number, dt: number, o: { look: number; give: number }): void;
}

/**
 * The cashier, seen through the booth window. Only the upper body shows; the
 * counter is drawn over the rest. Leans down to read the seating plan, then
 * reaches across the counter with the ticket.
 */
export function cashier(parent: Element, x: number, groundY: number, scale: number): Cashier {
  const g = el('g', {}, parent);

  const farArm = limb(g, 3.3);
  const torso = shape(g);
  const collar = pen(g, PEN * 0.5);
  const neck = pen(g, PEN * 0.9);
  const head = el('ellipse', { rx: 3.6, ry: 4.6, fill: PAPER, stroke: 'currentColor', 'stroke-width': PEN }, g);
  const hair = shape(g);
  const nearArm = limb(g, 3.3);

  const lean = spring(70, 9);
  const c: Cashier = {
    g, hand: [0, 0],
    step(t, dt, o) {
      place(g, x, groundY, -1, scale);          // faces -x, toward the customer
      const look = ease(clamp(o.look, 0, 1));
      const give = ease(clamp(o.give, 0, 1));
      const dip = lean.step(look * 5.2, dt);    // leaning down to the plan
      const sway = Math.sin(t * 0.9) * 0.4;     // idle, so he is never perfectly still

      const sh: Vec = [41, 44 + dip];
      torso.setAttribute('d',
        `M${f(sh[0] - 5.6)} ${f(sh[1] + 1.6)}` +
        ` Q${f(sh[0] + 0.2)} ${f(sh[1] - 3.4)} ${f(sh[0] + 6.2)} ${f(sh[1] + 1.8)}` +
        ` Q${f(sh[0] + 7)} ${f(sh[1] + 26)} ${f(sh[0] + 6.4)} ${f(sh[1] + 40)}` +
        ` L${f(sh[0] - 6)} ${f(sh[1] + 40)}` +
        ` Q${f(sh[0] - 6.6)} ${f(sh[1] + 24)} ${f(sh[0] - 5.6)} ${f(sh[1] + 1.6)}Z`);
      collar.setAttribute('d',
        `M${f(sh[0] - 2.6)} ${f(sh[1] + 0.8)} L${f(sh[0] + 0.4)} ${f(sh[1] + 5)} L${f(sh[0] + 3.4)} ${f(sh[1] + 0.6)}`);
      neck.setAttribute('d', `M${f(sh[0] - 1)} ${f(sh[1] + 0.2)} l-0.2 -3.8 M${f(sh[0] + 2.4)} ${f(sh[1] + 0.4)} l0.2 -4`);

      // the head tips down with the lean, not just the body
      const hc: Vec = [42.6 + look * 1.6 + sway * 0.3, 34.4 + dip * 1.25];
      head.setAttribute('cx', f(hc[0]));
      head.setAttribute('cy', f(hc[1]));
      hair.setAttribute('d',
        `M${f(hc[0] + 3.4)} ${f(hc[1] - 2)}` +
        ` Q${f(hc[0] + 2.2)} ${f(hc[1] - 7)} ${f(hc[0] - 2.6)} ${f(hc[1] - 5.4)}` +
        ` Q${f(hc[0] - 6.4)} ${f(hc[1] - 3.4)} ${f(hc[0] - 5.2)} ${f(hc[1] + 1.4)}` +
        ` Q${f(hc[0] - 3.4)} ${f(hc[1] - 2.6)} ${f(hc[0] + 0.4)} ${f(hc[1] - 3)}` +
        ` Q${f(hc[0] + 2.4)} ${f(hc[1] - 2.6)} ${f(hc[0] + 3.4)} ${f(hc[1] - 2)}Z`);

      // far arm rests on the counter; near arm reaches out with the ticket
      const shF: Vec = [sh[0] - 4.4, sh[1] + 4];
      const shN: Vec = [sh[0] + 4.4, sh[1] + 4.4];
      farArm.draw([shF, [shF[0] - 3, shF[1] + 12], [shF[0] - 9 + look * 3, shF[1] + 21 + look * 2]], [0.2, 0.5]);

      const restElb: Vec = [shN[0] + 2.4, shN[1] + 13];
      const restHand: Vec = [shN[0] - 1.6 + look * 5, shN[1] + 24 + look * 3];
      const outElb: Vec = [shN[0] + 8, shN[1] + 11];
      const outHand: Vec = [shN[0] + 21, shN[1] + 16];
      const elb = lerpP(restElb, outElb, give);
      const hand = lerpP(restHand, outHand, give);
      nearArm.draw([shN, elb, hand], [0.2, 0.4]);
      c.hand = [x - scale * (hand[0] - 40), groundY + scale * (hand[1] - 120)];
    },
  };
  return c;
}
