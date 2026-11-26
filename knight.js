// The Lantern of Wenlow: the player's knight (drawing, walkable ground, path-finding, walking)
'use strict';

// Knight figure, feet at (0,0), facing right. t = walk phase, moving = animate limbs.
function knightSVG(t, moving, shield) {
  const a = moving ? Math.sin(t) * 26 : 0, arm = moving ? Math.sin(t) * 18 : 0;
  const bob = moving ? Math.abs(Math.sin(t)) * -1.5 : 0;
  let g = el(0, 0, 13, 3, '#0005') + `<g transform="translate(0 ${bob.toFixed(2)})">`;
  // back arm + back leg (darker)
  g += `<g transform="rotate(${(-arm).toFixed(1)} -2 -46)">${r(-5, -46, 5, 19, '#7d838c')}${c(-2.5, -26, 2.6, '#6a6f77')}</g>`;
  g += `<g transform="rotate(${a.toFixed(1)} 0 -22)">${r(-4, -22, 5, 20, '#7d838c')}${r(-5, -3, 8, 3, '#2e2116')}</g>`;
  g += `<g transform="rotate(${(-a).toFixed(1)} 0 -22)">${r(-1, -22, 5, 20, '#a0a6ae')}${r(-2, -3, 9, 3, '#3a2a1a')}</g>`;
  // mail body, tabard, belt
  g += p('M-9,-23 L9,-23 L8,-48 L-8,-48Z', '#a0a6ae');
  g += p('M-7,-47 L7,-47 L8,-19 L0,-16 L-8,-19Z', '#2f5a8a') + p('M0,-41 L3,-36 L0,-31 L-3,-36Z', '#e8c040');
  g += r(-9, -27, 18, 2.5, '#5a3a1a') + r(6, -27, 2, 10, '#5a3a1a') + r(7, -20, 2, 9, '#cfd6dc');
  // front arm (and shield)
  g += `<g transform="rotate(${arm.toFixed(1)} 2 -46)">${r(0, -46, 5, 19, '#a0a6ae')}${c(2.5, -26, 2.6, '#e2b791')}</g>`;
  if (shield) g += el(7, -35, 5, 11, '#e8e2d0', 'stroke="#7a5a2a" stroke-width="1.5"') + c(7, -35, 2, '#3a6b3a');
  // head + helm with plume
  g += r(-3, -52, 6, 5, '#e2b791') + c(1, -58, 7.5, '#e2b791') + c(4.5, -58.5, 1.1, '#222');
  g += p('M-7.5,-57 Q-8,-70 1,-70 Q9.5,-70 9,-58 L7,-58 Q6,-65 1,-65 Q-4,-65 -5,-57Z', '#c2c8d0') + r(4, -64, 1.8, 8, '#c2c8d0');
  g += p('M-1,-69 Q-10,-80 -16,-68 Q-9,-73 -1,-69Z', '#b8322a');
  return g + '</g>';
}

// Walkable ground per scene: polygons (any shape), hubs (corner points to route around),
// depth scale [farY, farScale, nearY, nearScale], and a default spawn point.
const WALK = {
  hall: { polys: [[[8, 212], [392, 212], [400, 250], [0, 250]]], depth: [212, 1.0, 250, 1.18], spawn: [200, 236] },
  courtyard: { polys: [[[0, 188], [400, 188], [400, 250], [0, 250]], [[186, 180], [214, 180], [218, 190], [182, 190]]], depth: [180, .82, 250, 1.12], spawn: [200, 230] },
  crossroads: { polys: [[[0, 172], [192, 150], [208, 150], [400, 166], [400, 250], [0, 250]]], depth: [150, .42, 250, 1.0], spawn: [215, 225] },
  village: { polys: [[[0, 186], [400, 194], [400, 250], [0, 250]]], depth: [186, .8, 250, 1.05], spawn: [60, 230] },
  tavern: { polys: [[[0, 194], [400, 194], [400, 250], [0, 250]]], depth: [194, 1.0, 250, 1.15], spawn: [340, 228] },
  darkwood: { polys: [[[0, 212], [400, 212], [400, 250], [0, 250]], [[150, 214], [188, 140], [212, 140], [250, 214]]], hubs: [[200, 214]], depth: [140, .5, 250, 1.02], spawn: [40, 232] },
  moonpool: { polys: [[[0, 198], [400, 198], [400, 250], [0, 250]]], depth: [198, .85, 250, 1.05], spawn: [40, 228] },
  river: { polys: [[[0, 182], [400, 182], [400, 250], [0, 250]]], depth: [182, .82, 250, 1.06], spawn: [200, 238] },
  spinner: { polys: [[[115, 190], [400, 190], [400, 250], [118, 250]]], depth: [190, .86, 250, 1.06], spawn: [130, 232] },
  mountain: { polys: [[[20, 250], [80, 215], [240, 190], [230, 170], [300, 140], [310, 108], [328, 108], [318, 145], [255, 175], [262, 195], [100, 225], [70, 250]]], hubs: [[245, 186], [250, 176], [305, 140]], depth: [108, .45, 250, 1.06], spawn: [50, 244] },
  hermit: { polys: [[[0, 200], [400, 200], [400, 250], [0, 250]]], depth: [200, .95, 250, 1.12], spawn: [30, 225] },
  tower: { polys: [[[0, 214], [400, 210], [400, 250], [0, 250]]], depth: [210, .95, 250, 1.1], spawn: [30, 238] },
  towertop: { polys: [[[0, 205], [400, 205], [400, 250], [0, 250]]], depth: [205, .95, 250, 1.12], spawn: [360, 228] },
};

// Where the knight stands to use each hotspot, keyed "scene:hotspot name". Values may be functions.
const STAND = {
  'hall:King Aldren': [214, 222], 'hall:Maud the Steward': [284, 226], 'hall:Shield on the wall': [108, 220], 'hall:Banners': [200, 222], 'hall:Door to the courtyard': [44, 216],
  'courtyard:Brannoc the Smith': [136, 222], 'courtyard:Forge': [40, 236], 'courtyard:Main gate': [200, 184], 'courtyard:Door to the Great Hall': [352, 196], 'courtyard:Hay': [240, 210],
  'crossroads:Signpost': [222, 178], 'crossroads:Crag Road (north)': [200, 153], 'crossroads:Ashby village (east)': [392, 172], 'crossroads:The Darkwood (west)': [10, 178], 'crossroads:Road to the ford (south)': [212, 246], 'crossroads:Castle Wenlow': [392, 168], 'crossroads:The Grey Tower': [14, 176],
  'village:The Bent Nail tavern': [315, 200], 'village:Tavern sign': [345, 204], 'village:Fountain': [258, 218], 'village:Odo the beggar': [152, 222], 'village:Road back to the crossroads': [18, 236],
  'tavern:Hild': [212, 206], 'tavern:Hearth': [104, 214], 'tavern:Barrels': [300, 226], 'tavern:Door': [374, 204],
  'darkwood:Grey wolf': [140, 232], 'darkwood:Path deeper into the wood': () => S.f.wolfGone ? [200, 146] : [200, 230], 'darkwood:Path back to the crossroads': [16, 234],
  'moonpool:The Moon Pool': [200, 212], 'moonpool:The moon': [300, 206], 'moonpool:Path back': [16, 232],
  'river:Reeds': [80, 216], 'river:Wat the ferryman': [236, 218], 'river:Ferry boat': [326, 206], 'river:Cottage across the river': [214, 190], 'river:Road back to the crossroads': [200, 244],
  'spinner:Nan Gethin': [206, 224], 'spinner:Spinning wheel': [318, 214], 'spinner:Cottage': [150, 198], 'spinner:Boat back across': [124, 238],
  'mountain:Masked bandit': [170, 206], 'mountain:Cave mouth': () => S.f.bandit ? [318, 112] : [170, 206], 'mountain:Path back down': [44, 244],
  'hermit:Brother Ivo': [234, 224], 'hermit:Fire': [152, 224], 'hermit:Shelf of jars': [130, 212], 'hermit:Cave mouth': [12, 220],
  'tower:The Grey Warden': [150, 234], 'tower:Tower door': [200, 214], 'tower:Way back': [16, 240],
  'towertop:Lantern of Dawn': [150, 228], 'towertop:The view': [80, 224], 'towertop:Stairs down': [362, 226],
};
// Which scene each exit leads to, so the knight arrives at the matching doorway.
const EXIT_TO = {
  'hall:Door to the courtyard': 'courtyard', 'courtyard:Main gate': 'crossroads', 'courtyard:Door to the Great Hall': 'hall',
  'crossroads:Crag Road (north)': 'mountain', 'crossroads:Ashby village (east)': 'village', 'crossroads:The Darkwood (west)': 'darkwood', 'crossroads:Road to the ford (south)': 'river', 'crossroads:Castle Wenlow': 'courtyard', 'crossroads:The Grey Tower': 'tower',
  'village:The Bent Nail tavern': 'tavern', 'village:Road back to the crossroads': 'crossroads', 'tavern:Door': 'village',
  'darkwood:Path deeper into the wood': 'moonpool', 'darkwood:Path back to the crossroads': 'crossroads', 'moonpool:Path back': 'darkwood',
  'river:Ferry boat': 'spinner', 'river:Road back to the crossroads': 'crossroads', 'spinner:Boat back across': 'river',
  'mountain:Cave mouth': 'hermit', 'mountain:Path back down': 'crossroads', 'hermit:Cave mouth': 'mountain',
  'tower:Tower door': 'towertop', 'tower:Way back': 'crossroads', 'towertop:Stairs down': 'tower',
};

// ---- geometry ----
function inPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function walkable(x, y, w) { return w.polys.some(pl => inPoly(x, y, pl)); }
function nearestOnSeg(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L));
  return [ax + t * dx, ay + t * dy];
}
// Snap a point onto the walkable ground (nudged slightly inside).
function clampToFloor(x, y, w) {
  if (walkable(x, y, w)) return [x, y];
  let best = null, bd = Infinity;
  for (const pl of w.polys) for (let i = 0; i < pl.length; i++) {
    const q = nearestOnSeg(x, y, pl[i], pl[(i + 1) % pl.length]); const d = (q[0] - x) ** 2 + (q[1] - y) ** 2;
    if (d < bd) { bd = d; best = q; }
  }
  // nudge inward until walkable
  for (const [dx, dy] of [[0, 1.5], [0, -1.5], [1.5, 0], [-1.5, 0], [1.5, 1.5], [-1.5, 1.5], [0, 3], [3, 0], [-3, 0]]) if (walkable(best[0] + dx, best[1] + dy, w)) return [best[0] + dx, best[1] + dy];
  return best;
}
function clearLine(a, b, w) {
  const n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3));
  for (let i = 1; i < n; i++) { const t = i / n; if (!walkable(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, w)) return false; }
  return true;
}
// Shortest route via hub points (tiny Dijkstra). Falls back to a straight line.
function route(from, to, w) {
  if (clearLine(from, to, w)) return [to];
  const nodes = [from, ...(w.hubs || []), to], N = nodes.length;
  const dist = Array(N).fill(Infinity), prev = Array(N).fill(-1), done = Array(N).fill(false); dist[0] = 0;
  for (let k = 0; k < N; k++) {
    let u = -1; for (let i = 0; i < N; i++) if (!done[i] && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || dist[u] === Infinity) break; done[u] = true;
    for (let v = 0; v < N; v++) if (!done[v] && clearLine(nodes[u], nodes[v], w)) { const d = dist[u] + Math.hypot(nodes[u][0] - nodes[v][0], nodes[u][1] - nodes[v][1]); if (d < dist[v]) { dist[v] = d; prev[v] = u; } }
  }
  if (dist[N - 1] === Infinity) return [to];
  const path = []; for (let v = N - 1; v > 0; v = prev[v]) path.unshift(nodes[v]);
  return path;
}

// ---- the knight on screen ----
const K = { x: 200, y: 230, face: 1, t: 0, moving: false, path: [], done: null, raf: 0 };
function depthScale(y) { const [y0, s0, y1, s1] = WALK[S.scene].depth; const t = Math.max(0, Math.min(1, (y - y0) / (y1 - y0))); return s0 + (s1 - s0) * t; }
function drawKnight() {
  const g = document.getElementById('knight'); if (!g) return;
  const s = depthScale(K.y);
  g.setAttribute('transform', `translate(${K.x.toFixed(1)} ${K.y.toFixed(1)}) scale(${(K.face * s).toFixed(3)} ${s.toFixed(3)})`);
  g.innerHTML = knightSVG(K.t, K.moving, has('shield'));
}
function placeKnight(fromScene) {
  const w = WALK[S.scene]; let pt = w.spawn;
  if (fromScene) for (const [k, to] of Object.entries(EXIT_TO)) {
    const [sc, name] = k.split(':');
    if (sc === S.scene && to === fromScene) { const st = STAND[k]; if (st) pt = typeof st === 'function' ? st() : st; break; }
  }
  [K.x, K.y] = clampToFloor(pt[0], pt[1], w);
  K.face = K.x > 200 ? -1 : 1; K.moving = false; K.path = []; K.done = null; cancelAnimationFrame(K.raf);
}
function standFor(h) {
  const st = STAND[`${S.scene}:${h.name}`];
  if (st) return typeof st === 'function' ? st() : st;
  const [x, y, bw, bh] = h.box; return [x + bw / 2, y + bh + 10];
}
function walkTo(target, done) {
  const w = WALK[S.scene];
  const dest = clampToFloor(target[0], target[1], w);
  cancelAnimationFrame(K.raf);
  K.path = route([K.x, K.y], dest, w); K.done = done || null;
  if (Math.hypot(dest[0] - K.x, dest[1] - K.y) < 2) { K.path = []; finishWalk(); return; }
  K.moving = true; let last = performance.now();
  const step = (now) => {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const tgt = K.path[0]; if (!tgt) { finishWalk(); return; }
    const dx = tgt[0] - K.x, dy = tgt[1] - K.y, d = Math.hypot(dx, dy);
    const speed = 95 * depthScale(K.y);
    if (Math.abs(dx) > .5) K.face = dx > 0 ? 1 : -1;
    if (d <= speed * dt) { K.x = tgt[0]; K.y = tgt[1]; K.path.shift(); }
    else { K.x += dx / d * speed * dt; K.y += dy / d * speed * dt; }
    K.t += dt * 11; drawKnight();
    if (K.path.length) K.raf = requestAnimationFrame(step); else finishWalk();
  };
  K.raf = requestAnimationFrame(step);
}
function finishWalk() { K.moving = false; K.t = 0; drawKnight(); const cb = K.done; K.done = null; if (cb) cb(); }
function faceToward(h) { const cx = h.box[0] + h.box[2] / 2; if (Math.abs(cx - K.x) > 4) K.face = cx > K.x ? 1 : -1; drawKnight(); }
