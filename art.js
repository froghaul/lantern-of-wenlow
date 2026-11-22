// The Lantern of Wenlow — scene artwork (all original, drawn with SVG shapes)
'use strict';
const W = 400, H = 250;
const r = (x, y, w, h, f, ex = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" ${ex}/>`;
const p = (d, f, ex = '') => `<path d="${d}" fill="${f}" ${ex}/>`;
const c = (x, y, R, f, ex = '') => `<circle cx="${x}" cy="${y}" r="${R}" fill="${f}" ${ex}/>`;
const el = (x, y, rx, ry, f, ex = '') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}" ${ex}/>`;
const ln = (x1, y1, x2, y2, s, w = 1, ex = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${s}" stroke-width="${w}" ${ex}/>`;

function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function lgrad(id, stops) {
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, col]) => `<stop offset="${o}" stop-color="${col}"/>`).join('')}</linearGradient></defs>`;
}
function rgrad(id, inner, outer) {
  return `<defs><radialGradient id="${id}"><stop offset="0" stop-color="${inner}"/><stop offset="1" stop-color="${outer}" stop-opacity="0"/></radialGradient></defs>`;
}
function sky(id, top, bot) { return lgrad(id, [[0, top], [1, bot]]) + r(0, 0, W, H, `url(#${id})`); }

function hills(y, col, amp, seed, freq = 1) {
  const R = rng(seed); const ph = R() * 6; const ph2 = R() * 6;
  let d = `M0,${H} L0,${y}`;
  for (let x = 0; x <= W; x += 10) d += ` L${x},${(y + Math.sin(x / 60 * freq + ph) * amp + Math.sin(x / 23 * freq + ph2) * amp * .3).toFixed(1)}`;
  return p(d + ` L${W},${H}Z`, col);
}
function stars(n, seed, maxY = 120) {
  const R = rng(seed); let s = '';
  for (let i = 0; i < n; i++) s += c((R() * W).toFixed(1), (R() * maxY).toFixed(1), (R() * 1 + .3).toFixed(2), '#fff', `opacity="${(R() * .7 + .3).toFixed(2)}"`);
  return s;
}
function cloud(x, y, s = 1, col = '#ffffff', o = .85) {
  return `<g transform="translate(${x} ${y}) scale(${s})" opacity="${o}">${el(0, 0, 22, 8, col)}${el(-14, 2, 14, 6, col)}${el(14, 1, 16, 7, col)}${el(-4, -5, 12, 7, col)}</g>`;
}
function tree(x, y, s = 1, leaf = '#3f6b2f', dark = '#2c4f22', trunk = '#5a3d22') {
  return `<g transform="translate(${x} ${y}) scale(${s})">${r(-3, -22, 6, 22, trunk)}${c(0, -34, 16, dark)}${c(-9, -28, 11, dark)}${c(9, -28, 11, dark)}${c(-3, -38, 11, leaf)}${c(6, -32, 8, leaf)}</g>`;
}
function pine(x, y, s = 1, col = '#24452a', trunk = '#3b2a1a') {
  return `<g transform="translate(${x} ${y}) scale(${s})">${r(-2, -8, 4, 8, trunk)}${p('M0,-60 L-12,-30 L-6,-30 L-16,-8 L16,-8 L6,-30 L12,-30Z', col)}</g>`;
}
function bricks(id, base, line, w = 24, h = 12) {
  return `<defs><pattern id="${id}" width="${w}" height="${h * 2}" patternUnits="userSpaceOnUse">${r(0, 0, w, h * 2, base)}${ln(0, h, w, h, line, 1)}${ln(0, h * 2, w, h * 2, line, 1)}${ln(w / 2, 0, w / 2, h, line, 1)}${ln(0, h, 0, h * 2, line, 1)}</pattern></defs>`;
}
function crenels(x, y, w, col, step = 14) {
  let s = '';
  for (let i = x; i < x + w; i += step) s += r(i, y - 8, step / 2, 8, col);
  return s;
}

// A person, feet at (x,y). Options choose clothes and features.
function person(x, y, o = {}) {
  const s = o.s || 1, skin = o.skin || '#e2b791', t = o.tunic || '#4f7a35', leg = o.legs || '#4a3222', hair = o.hair || '#5a3a1a';
  let g = `<g transform="translate(${x} ${y}) scale(${o.flip ? -s : s} ${s})">`;
  g += el(0, 0, 14, 3, '#0005');
  if (o.cloak) g += p('M-13,-2 L13,-2 L10,-50 L-10,-50Z', o.cloak);
  if (o.robe) g += p('M-12,0 L12,0 L9,-48 L-9,-48Z', t);
  else g += r(-7, -22, 5, 22, leg) + r(2, -22, 5, 22, leg) + r(-8, -3, 7, 3, '#2a1c10') + r(1, -3, 7, 3, '#2a1c10') + p('M-11,-20 L11,-20 L9,-48 L-9,-48Z', t) + r(-10, -25, 20, 3, o.belt || '#3a2510');
  if (o.apron) g += p('M-7,-44 L7,-44 L9,-14 L-9,-14Z', o.apron);
  const sl = o.sleeve || t;
  g += p('M-8,-47 L-15,-27 L-11,-25 L-5,-42Z', sl) + p('M8,-47 L15,-27 L11,-25 L5,-42Z', sl);
  g += c(-13, -25, 2.6, skin) + c(13, -25, 2.6, skin);
  if (o.sword) g += r(12, -48, 2.2, 24, '#cfd6dc') + r(9, -26, 8, 2, '#8a6a2a');
  if (o.staff) g += r(-16, -70, 2.5, 70, '#6b4a26');
  if (o.hammer) g += r(12, -36, 2, 14, '#6b4a26') + r(9, -39, 8, 5, '#555');
  if (o.hood) g += p('M-11,-50 Q-12,-72 0,-72 Q12,-72 11,-50Z', o.hood);
  g += r(-3, -52, 6, 5, skin);
  g += c(0, -59, 8, o.hidden ? '#15151c' : skin);
  if (o.hidden) g += c(-3, -59, 1.3, '#bfe7ff') + c(3, -59, 1.3, '#bfe7ff');
  else {
    if (!o.hood && !o.helm && !o.scarf) g += p('M-8.5,-59 Q-8,-68 0,-68 Q8,-68 8.5,-59 Q4,-64 0,-64 Q-4,-64 -8.5,-59Z', hair);
    if (o.longhair) g += p('M-8.6,-60 L-10,-44 L-6,-46 L-6,-60Z', hair) + p('M8.6,-60 L10,-44 L6,-46 L6,-60Z', hair);
    g += c(-3, -59, 1.1, '#222') + c(3, -59, 1.1, '#222');
    if (o.beard) g += p('M-7.5,-57 Q0,-38 7.5,-57 Q0,-52 -7.5,-57Z', o.beard);
    if (o.mask) g += r(-8, -57, 16, 6, o.mask);
  }
  if (o.hood) g += p('M-11,-50 Q-12,-72 0,-72 Q12,-72 11,-50 L8,-52 Q9,-66 0,-67 Q-9,-66 -8,-52Z', o.hood);
  if (o.scarf) g += p('M-9.5,-58 Q-10,-71 0,-71 Q10,-71 9.5,-58 L9,-48 L7,-58 Q0,-66 -7,-58 L-9,-48Z', o.scarf);
  if (o.helm) g += p('M-9,-58 Q-9,-70 0,-70 Q9,-70 9,-58Z', o.helm) + r(-1, -61, 2, 8, o.helm);
  g += '</g>';
  return g;
}

function wolf(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">${el(0, 0, 34, 4, '#0006')}
  ${p('M-30,-22 Q-46,-30 -48,-14 Q-40,-22 -30,-16Z', '#5d6068')}
  ${el(-4, -22, 28, 12, '#6e727b')}${r(-26, -16, 6, 16, '#5d6068')}${r(-14, -14, 6, 14, '#5d6068')}${r(12, -14, 6, 14, '#5d6068')}${r(20, -16, 6, 16, '#5d6068')}
  ${p('M18,-30 L40,-26 L46,-16 L30,-14 L18,-18Z', '#7d828b')}${p('M20,-30 L22,-42 L28,-31Z', '#5d6068')}${p('M28,-30 L32,-41 L35,-29Z', '#5d6068')}
  ${c(32, -24, 1.8, '#ffd23a')}${p('M38,-17 L45,-16 L44,-14 L38,-15Z', '#fff')}</g>`;
}

function lantern(x, y, lit) {
  let g = `<g transform="translate(${x} ${y})">`;
  if (lit) g += rgrad('lg', '#fff6b0', '#ffb030') + c(0, -40, 70, 'url(#lg)', 'opacity=".9"');
  g += r(-26, 0, 52, 10, '#4b4f57') + r(-18, -6, 36, 6, '#5a5f68');
  g += p('M-16,-6 L16,-6 L20,-62 L-20,-62Z', lit ? '#ffe680' : '#1e2430', 'stroke="#2b2f36" stroke-width="3"');
  g += ln(0, -6, 0, -62, '#2b2f36', 2) + ln(-18, -34, 18, -34, '#2b2f36', 2);
  g += p('M-26,-62 L26,-62 L0,-84Z', '#3c4048') + c(0, -88, 5, 'none', 'stroke="#3c4048" stroke-width="2.5"');
  if (lit) g += el(0, -30, 6, 12, '#fff', 'opacity=".95"') + el(0, -26, 4, 8, '#ffb347');
  return g + '</g>';
}

// ---------------- Scenes ----------------
const ART = {};

ART.hall = (f) => {
  let s = bricks('hb', '#6f6a63', '#57524c') + r(0, 0, W, 195, 'url(#hb)');
  s += lgrad('hf', [[0, '#4a4038'], [1, '#2c251f']]) + r(0, 190, W, 60, 'url(#hf)');
  for (let i = 0; i < 9; i++) s += ln(i * 50 - 20, 250, i * 50 + 10 - (i - 4) * 12, 190, '#00000055', 1);
  s += ln(0, 215, W, 215, '#00000040') + ln(0, 236, W, 236, '#00000040');
  // windows
  for (const wx of [200]) s += p(`M${wx - 14},70 L${wx - 14},30 Q${wx},10 ${wx + 14},30 L${wx + 14},70Z`, '#8fb8e0') + ln(wx, 18, wx, 70, '#57524c', 2) + ln(wx - 14, 45, wx + 14, 45, '#57524c', 2);
  // banners
  for (const [bx, col] of [[160, '#8a1f24'], [240, '#1f3f8a']]) s += p(`M${bx - 13},40 L${bx + 13},40 L${bx + 13},110 L${bx},100 L${bx - 13},110Z`, col) + c(bx, 66, 7, '#d9b44a') + r(bx - 16, 37, 32, 4, '#4a3018');
  // door
  s += p('M18,212 L18,140 Q43,112 68,140 L68,212Z', '#3d2817') + p('M23,212 L23,142 Q43,120 63,142 L63,212Z', '#5b3b20');
  for (let i = 0; i < 4; i++) s += ln(30 + i * 9, 130, 30 + i * 9, 212, '#3d2817', 1.5);
  s += c(55, 178, 2.5, '#c9a24a');
  // shield on wall
  if (!f.shield) s += c(105, 105, 17, '#e8e2d0') + c(105, 105, 17, 'none', 'stroke="#7a5a2a" stroke-width="3"') + p('M98,96 L103,104 L101,115 L109,115 L107,104 L112,96 L106,101 L105,93 L104,101Z', '#fff') + p('M97,98 L105,92 L113,98 L105,120Z', '#ffffff00') + p('M99,108 L105,98 L111,108 L105,116Z', '#3a6b3a', 'opacity=".0"') + c(105, 105, 5, '#3a6b3a');
  else s += c(105, 105, 17, '#00000022');
  // bier & king
  s += r(140, 168, 120, 30, '#8a847a') + r(136, 162, 128, 8, '#9c968b') + r(140, 196, 120, 4, '#5e5850');
  if (f.ending) {
    s += person(200, 196, { robe: true, tunic: '#5a2a7a', beard: '#eee', hair: '#ddd', s: 1.1 }) + p('M192,-0 L208,0', '#fff') + p('M191,121 L194,113 L197,119 L200,111 L203,119 L206,113 L209,121Z', '#e8c040');
  } else {
    s += p('M158,162 Q200,148 250,156 L252,163 L158,163Z', '#5a2a7a') + r(150, 158, 16, 6, '#e8e2d0');
    s += c(158, 152, 8, '#e2b791') + p('M152,155 Q158,168 164,155Z', '#eee') + p('M151,146 L153,139 L156,144 L158,137 L160,144 L163,139 L165,146Z', '#e8c040');
    s += el(158, 152, 6, 1.2, '#0000');
  }
  // candles
  for (const cx of [132, 268]) s += r(cx - 3, 140, 6, 30, '#eee5cc') + r(cx - 6, 168, 12, 4, '#8c6b30') + el(cx, 135, 3, 6, f.ending ? '#ffb347' : '#ffcf5c') + c(cx, 133, 12, '#ffd56b', 'opacity=".18"');
  // steward Maud
  s += person(322, 218, { robe: true, tunic: '#365b4a', scarf: '#efe8d8', s: 1.15 });
  if (f.ending) s += lgrad('dawn', [[0, '#fff3b0'], [1, '#fff3b000']]) + r(186, 20, 28, 120, 'url(#dawn)');
  return s;
};

ART.courtyard = (f) => {
  let s = sky('cs', '#7fb2e5', '#cfe3f2') + cloud(80, 30, 1.2) + cloud(300, 22, .9);
  s += bricks('cb', '#8c857a', '#6f685e') + r(0, 70, W, 110, 'url(#cb)') + crenels(0, 70, W, '#8c857a');
  // gate
  s += p('M165,180 L165,110 Q200,78 235,110 L235,180Z', '#2c2a28') + p('M172,180 L172,113 Q200,88 228,113 L228,180Z', '#89b86a') + r(172, 150, 56, 30, '#6b9a4e') + p('M190,180 L210,180 L204,150 L196,150Z', '#c7ad7a');
  for (let i = 0; i < 6; i++) s += ln(176 + i * 10, 92, 176 + i * 10, 104, '#3a3632', 2);
  // ground
  s += r(0, 178, W, 72, '#a79c86') + p('M150,250 L190,180 L210,180 L250,250Z', '#bcae92');
  const R = rng(5); for (let i = 0; i < 40; i++) s += el(R() * W, 182 + R() * 66, 4, 1.5, '#8f846f');
  // smithy
  s += r(0, 120, 110, 62, '#5d4630') + p('M-5,122 L118,122 L100,98 L0,98Z', '#7a3b26');
  s += r(14, 148, 40, 34, '#4a4440') + r(18, 152, 32, 18, '#ff7b29') + r(22, 156, 24, 10, '#ffd36b') + c(34, 160, 26, '#ff9a40', 'opacity=".18"');
  s += p('M66,172 L94,172 L90,164 L70,164Z', '#3a3a3e') + r(76, 172, 8, 10, '#3a3a3e');
  s += person(100, 214, { tunic: '#7a4a2a', apron: '#4b3a2e', beard: '#2b1d12', hair: '#2b1d12', hammer: true, s: 1.1 });
  // hall door (right tower)
  s += r(320, 60, 70, 122, '#7d766b') + crenels(320, 60, 70, '#7d766b', 12) + p('M336,182 L336,140 Q352,122 368,140 L368,182Z', '#5b3b20') + c(362, 162, 2, '#c9a24a');
  // barrels / hay
  s += el(270, 186, 16, 8, '#d8c070') + el(268, 180, 14, 7, '#e5d084');
  return s;
};

ART.crossroads = (f) => {
  let s = sky('xs', '#6ea8e0', '#e8f0d8') + cloud(130, 28, 1) + cloud(260, 40, .8);
  // mountains (north)
  s += p('M130,110 L180,40 L205,70 L230,30 L290,110Z', '#8d93a0') + p('M180,40 L170,56 L186,52 L192,58Z', '#fff') + p('M230,30 L218,50 L232,46 L240,52Z', '#fff');
  // tower on hill (west)
  s += hills(100, '#7d9a62', 8, 3, .7);
  s += r(52, 38, 16, 50, '#6b6f78') + p('M48,40 L60,22 L72,40Z', '#4d5058') + r(57, 52, 4, 8, '#20232a');
  for (let i = 0; i < 5; i++) s += el(40 + i * 10, 80 - (i % 2) * 18, 20, 6, '#e8ecf2', 'opacity=".55"');
  // castle (far east)
  s += r(352, 70, 34, 26, '#9a948a') + r(348, 58, 10, 38, '#9a948a') + r(380, 58, 10, 38, '#9a948a') + crenels(348, 58, 42, '#9a948a', 8);
  s += hills(120, '#6c9150', 10, 7);
  // forest (west)
  for (let i = 0; i < 9; i++) s += pine(5 + i * 11, 190 - (i % 3) * 6, .9 + (i % 2) * .3, i % 2 ? '#1f3d26' : '#2a4f2f');
  // village (east)
  for (const [hx, hy] of [[330, 140], [360, 132], [385, 145]]) s += r(hx - 12, hy - 14, 24, 16, '#e6dcc4') + p(`M${hx - 15},${hy - 13} L${hx},${hy - 26} L${hx + 15},${hy - 13}Z`, '#8a4a2a');
  s += r(0, 150, W, 100, '#7aa05a', 'opacity="0"');
  // roads
  s += hills(150, '#7fa85c', 4, 9);
  s += p('M185,250 L195,150 L205,150 L235,250Z', '#c9b48a') + p('M196,152 L190,112 L206,112 L204,152Z', '#c9b48a');
  s += p('M0,175 L195,155 L200,162 L0,195Z', '#c9b48a') + p('M400,160 L205,152 L205,160 L400,180Z', '#c9b48a');
  // signpost
  s += r(198, 118, 5, 60, '#6b4a26') + p('M170,124 L198,124 L198,134 L170,134 L164,129Z', '#a07a44') + p('M203,128 L232,128 L238,133 L232,138 L203,138Z', '#a07a44') + p('M180,142 L198,142 L198,150 L180,150 L175,146Z', '#a07a44');
  s += tree(270, 205, 1.2) + tree(120, 215, 1);
  return s;
};

ART.village = (f) => {
  let s = sky('vs', '#8bbbe8', '#eef3e4') + cloud(200, 30, 1.1);
  s += hills(130, '#88a866', 6, 2);
  // houses
  const house = (x, y, w, h, roof, wall = '#efe4c8') => r(x, y, w, h, wall) + ln(x, y + h / 2, x + w, y + h / 2, '#5a3a22', 2) + ln(x + w / 2, y, x + w / 2, y + h, '#5a3a22', 2) + ln(x, y, x + w / 2, y + h / 2, '#5a3a22', 2) + p(`M${x - 6},${y + 2} L${x + w / 2},${y - h * .7} L${x + w + 6},${y + 2}Z`, roof);
  s += house(20, 105, 70, 55, '#7d4a2a') + house(110, 98, 60, 55, '#6b5a3a');
  s += house(270, 100, 110, 90, '#8a3c24');
  s += r(300, 140, 30, 50, '#4b2e18') + c(322, 166, 2, '#c9a24a');
  // tavern sign
  s += ln(340, 120, 372, 120, '#3a2614', 3) + r(348, 122, 22, 18, '#b98a4a') + p('M354,126 L364,126 L364,136 L354,136Z', '#f3e5b0') + p('M364,128 Q369,131 364,134', 'none', 'stroke="#f3e5b0" stroke-width="2"');
  // ground
  s += r(0, 175, W, 75, '#bfae8c');
  const R = rng(11); for (let i = 0; i < 50; i++) s += r(R() * W, 178 + R() * 70, 6, 3, '#a99a7a');
  // fountain
  s += el(205, 200, 42, 12, '#7a7f88') + el(205, 196, 38, 9, '#6fa3cf') + r(201, 160, 8, 36, '#8c919a') + el(205, 160, 14, 4, '#8c919a') + p('M205,152 Q195,160 192,175 M205,152 Q215,160 218,175', 'none', 'stroke="#bfe3ff" stroke-width="2"');
  if (!f.fountain) s += c(220, 197, 2.2, '#e8e8f0');
  // beggar
  if (!f.fedBeggar) s += person(120, 212, { robe: true, tunic: '#6d6654', hood: '#5a5446', beard: '#bbb', s: .95 }) + el(138, 210, 5, 2, '#5a4a3a');
  else s += person(120, 212, { robe: true, tunic: '#6d6654', hood: '#5a5446', beard: '#bbb', s: .95 });
  // road back
  s += p('M0,215 L60,205 L60,250 L0,250Z', '#c9b48a');
  return s;
};

ART.tavern = (f) => {
  let s = r(0, 0, W, H, '#3b2a1c');
  for (let i = 0; i < 12; i++) s += r(i * 36, 0, 3, 130, '#2e2015');
  s += r(0, 18, W, 8, '#2a1c10');
  s += r(0, 175, W, 75, '#5a3f28');
  for (let i = 0; i < 8; i++) s += ln(0, 180 + i * 10, W, 180 + i * 10, '#4a3320', 1);
  // hearth
  s += r(20, 100, 80, 85, '#6f6a63') + r(32, 130, 56, 55, '#1b120c') + p('M40,185 Q50,140 60,165 Q66,135 76,185Z', '#ff8a2a') + p('M48,185 Q55,158 62,172 Q66,155 70,185Z', '#ffd36b') + c(60, 160, 50, '#ff9a40', 'opacity=".15"');
  // shelf + mugs
  s += r(140, 60, 130, 6, '#5a3a20'); for (let i = 0; i < 6; i++) s += r(148 + i * 20, 46, 10, 14, '#c8b58c');
  // keeper Hild behind counter
  s += person(205, 178, { robe: true, tunic: '#8a4a5a', hair: '#c9842e', longhair: true, apron: '#e8dcc0', s: 1.1 });
  s += r(120, 140, 200, 45, '#6b4426') + r(115, 136, 210, 8, '#8a5a32');
  s += r(150, 124, 10, 12, '#c8b58c') + r(260, 126, 18, 10, '#d6c49a');
  // barrels
  for (const bx of [330, 360]) s += el(bx, 200, 16, 22, '#7a5230') + ln(bx - 16, 192, bx + 16, 192, '#3a2614', 2) + ln(bx - 16, 208, bx + 16, 208, '#3a2614', 2);
  // door
  s += r(354, 100, 40, 90, '#2a1a0e') + r(358, 104, 32, 86, '#5b3b20');
  return s;
};

ART.darkwood = (f) => {
  let s = sky('ds', '#1c2a26', '#33463a');
  const R = rng(21);
  for (let i = 0; i < 18; i++) { const x = R() * W, w = 8 + R() * 14; s += r(x, 0, w, 210, i % 2 ? '#1a2018' : '#232b20'); }
  s += el(200, 120, 40, 30, '#4a6450', 'opacity=".5"');
  s += r(0, 180, W, 70, '#1f2a1c') + p('M150,250 L185,135 L215,135 L250,250Z', '#3d3a2a');
  for (let i = 0; i < 6; i++) { const x = R() * W; s += r(x, 0, 22 + R() * 10, 230, '#121611'); }
  for (let i = 0; i < 12; i++) s += el(R() * W, 200 + R() * 40, 18, 6, '#24331f');
  if (!f.wolfGone) s += wolf(200, 200, 1.25);
  s += p('M0,210 L70,205 L70,250 L0,250Z', '#3d3a2a');
  for (let i = 0; i < 5; i++) s += el(R() * W, 150 + R() * 40, 60, 6, '#9fb7a8', 'opacity=".07"');
  return s;
};

ART.moonpool = (f) => {
  let s = sky('ms', '#0b1430', '#26305a') + stars(70, 4, 110) + c(320, 40, 18, '#f4f1dc') + c(312, 36, 16, '#26305a', 'opacity=".0"');
  for (let i = 0; i < 10; i++) s += pine(i * 44 - 10, 150, 1.4, '#0f1d1a');
  s += r(0, 145, W, 105, '#1f3326');
  s += rgrad('pg', '#e6f6ff', '#9fd6ff') + el(200, 180, 90, 30, 'url(#pg)', 'opacity=".35"');
  s += el(200, 180, 64, 18, '#5a6270') + el(200, 178, 56, 14, '#123050') + el(200, 178, 30, 6, '#bfe6ff', 'opacity=".7"') + c(200, 178, 4, '#fff');
  const R = rng(8); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; s += el(200 + Math.cos(a) * 62, 180 + Math.sin(a) * 18, 7, 5, '#7d8590'); }
  if (f.riddle && !f.oil) s += `<g opacity=".7">${person(200, 172, { robe: true, tunic: '#cfe8ff', hair: '#e8f4ff', longhair: true, s: 1.2 })}</g>` + el(200, 172, 30, 6, '#e6f6ff', 'opacity=".5"');
  if (f.ropeTied) s += ln(254, 180, 210, 178, '#c9a96a', 2.5);
  s += p('M0,200 L60,195 L60,250 L0,250Z', '#2d3a2a');
  return s;
};

ART.river = (f) => {
  let s = sky('rs', '#85b8e6', '#e5eef0') + cloud(90, 30) + cloud(280, 20, 1.2);
  s += hills(80, '#7ca061', 6, 12) + r(0, 92, W, 20, '#7ca061');
  // far hut
  s += r(198, 70, 34, 22, '#d8c8a2') + p('M194,72 L215,56 L236,72Z', '#9a7a3e') + r(222, 56, 5, 10, '#6b6f78');
  for (let i = 0; i < 4; i++) s += c(226 + i * 3, 50 - i * 7, 3 + i, '#ddd', 'opacity=".5"');
  // river
  s += lgrad('rw', [[0, '#5b93c2'], [1, '#2f6390']]) + r(0, 110, W, 60, 'url(#rw)');
  for (let i = 0; i < 14; i++) s += ln(i * 30, 125 + (i % 3) * 12, i * 30 + 18, 125 + (i % 3) * 12, '#a8d4f5', 1.5, 'opacity=".6"');
  s += r(0, 168, W, 82, '#8aa865');
  // reeds
  for (let i = 0; i < 18; i++) { const x = 12 + i * 4; s += ln(x, 210, x + (i % 3 - 1) * 4, 150 + (i % 4) * 6, '#4f6b2a', 2) + el(x + (i % 3 - 1) * 4, 150 + (i % 4) * 6, 1.8, 5, '#6b4a26'); }
  if (!f.spindle) s += r(40, 196, 14, 3, '#c49a5a') + c(44, 197.5, 3, '#a87a3a');
  // boat + ferryman
  s += p('M285,184 L370,184 L360,198 L295,198Z', '#6b4426') + r(285, 182, 85, 3, '#8a5a32');
  s += person(270, 210, { tunic: '#3d5a7a', hair: '#888', beard: '#888', s: 1.05 }) + ln(258, 212, 250, 140, '#6b4a26', 2.5);
  // road back
  s += p('M160,250 L180,222 L220,222 L240,250Z', '#c9b48a');
  return s;
};

ART.spinner = (f) => {
  let s = sky('ss', '#85b8e6', '#eef0e0') + cloud(320, 30);
  s += hills(110, '#86aa67', 6, 30);
  // cottage
  s += r(70, 90, 140, 95, '#e2d3b0') + p('M58,95 L140,40 L222,95Z', '#b08a44') + r(122, 130, 34, 55, '#5b3b20') + r(84, 110, 26, 22, '#3a4a5a') + ln(97, 110, 97, 132, '#5b3b20', 2) + r(185, 30, 14, 40, '#7a7f88');
  for (const [fx, fc] of [[230, '#d86a8a'], [245, '#f0c040'], [260, '#a86ad8'], [60, '#f0c040'], [44, '#d86a8a']]) s += ln(fx, 190, fx, 175, '#3f6b2f', 2) + c(fx, 173, 4, fc);
  s += r(0, 185, W, 65, '#9ab878');
  // spinning wheel
  s += c(285, 165, 22, 'none', 'stroke="#7a5230" stroke-width="3"') + c(285, 165, 3, '#7a5230');
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; s += ln(285, 165, 285 + Math.cos(a) * 22, 165 + Math.sin(a) * 22, '#7a5230', 1.5); }
  s += ln(270, 200, 285, 165, '#7a5230', 3) + ln(300, 200, 285, 165, '#7a5230', 3) + r(300, 175, 30, 4, '#7a5230');
  if (f.wick) s += ln(310, 175, 330, 160, '#fff6b0', 1.5);
  // Nan Gethin
  s += person(240, 212, { robe: true, tunic: '#7a5a8a', scarf: '#d8d0c0', s: 1.05 });
  // water + boat back
  s += r(0, 215, 120, 35, '#4b86b8') + p('M20,222 L95,222 L88,236 L28,236Z', '#6b4426');
  return s;
};

ART.mountain = (f) => {
  let s = sky('mts', '#9cc0e4', '#e8eef4');
  s += p('M0,140 L70,40 L120,90 L190,10 L260,80 L320,30 L400,120 L400,250 L0,250Z', '#8d8f98');
  s += p('M190,10 L172,36 L190,30 L204,40Z', '#fff') + p('M320,30 L306,50 L322,44 L334,52Z', '#fff') + p('M70,40 L60,56 L72,52 L80,58Z', '#fff');
  s += p('M0,170 L120,120 L260,110 L400,150 L400,250 L0,250Z', '#77787f');
  // cave
  s += el(320, 92, 26, 20, '#1b1a1e') + p('M294,96 Q320,60 346,96Z', '#626269', 'opacity=".4"');
  // path
  s += p('M20,250 L80,215 L240,190 L230,170 L300,140 L310,108 L328,108 L318,145 L255,175 L262,195 L100,225 L70,250Z', '#a5977b');
  const R = rng(40); for (let i = 0; i < 16; i++) s += el(R() * W, 170 + R() * 80, 10 + R() * 10, 5 + R() * 4, '#6a6b72');
  if (!f.bandit) s += person(205, 200, { tunic: '#3f5a2a', hood: '#2f4a22', mask: '#222', sword: true, s: 1.15 });
  return s;
};

ART.hermit = (f) => {
  let s = r(0, 0, W, H, '#2a2622');
  s += p('M0,0 L400,0 L400,250 L0,250Z', '#2a2622') + el(200, 40, 260, 70, '#1d1a17');
  s += p('M0,40 Q30,30 50,60 L55,200 Q30,215 0,210Z', '#d8e4ef');
  s += r(0, 200, W, 50, '#3a332c');
  s += r(90, 90, 80, 5, '#5a4630'); for (let i = 0; i < 5; i++) s += r(96 + i * 15, 76, 9, 14, ['#8a6a3a', '#5a7a5a', '#a05a3a', '#c9b48a', '#6a6a8a'][i]);
  s += rgrad('fg', '#ffd36b', '#ff7b29') + c(190, 190, 60, 'url(#fg)', 'opacity=".35"');
  s += el(190, 205, 26, 6, '#555') + p('M172,205 Q180,170 190,190 Q196,160 210,205Z', '#ff8a2a') + p('M182,205 Q188,182 194,195 Q200,180 202,205Z', '#ffd36b');
  s += person(272, 212, { robe: true, tunic: '#6b5236', hood: '#5a4430', beard: '#f2f2f2', staff: true, s: 1.15 });
  return s;
};

ART.tower = (f) => {
  let s = sky('ts', '#5b6478', '#a8adb8') + cloud(60, 40, 1.3, '#c8ccd4') + cloud(330, 30, 1.1, '#c8ccd4');
  s += hills(170, '#5d6b52', 8, 50);
  s += bricks('tb', '#7a7d86', '#62656e', 20, 10) + r(150, 20, 100, 190, 'url(#tb)') + crenels(146, 20, 108, '#7a7d86', 12) + r(146, 12, 108, 10, '#7a7d86', 'opacity="0"');
  s += r(192, 60, 10, 18, '#1a1c22') + r(192, 110, 10, 18, '#1a1c22');
  s += p('M180,210 L180,160 Q200,140 220,160 L220,210Z', f.warden ? '#1a1c22' : '#3a2a1c');
  for (let i = 0; i < 7; i++) s += el(40 + i * 55, 200 + (i % 2) * 15, 60, 10, '#e8ecf2', `opacity="${f.warden ? .2 : .5}"`);
  if (!f.warden) s += person(200, 222, { robe: true, tunic: '#4a4c55', cloak: '#33353d', hood: '#2a2c33', hidden: true, sword: true, s: 1.3 });
  s += p('M0,225 L80,215 L80,250 L0,250Z', '#5d5547');
  return s;
};

ART.towertop = (f) => {
  let s = f.lit ? sky('tts', '#ffcf7a', '#ffeec4') : sky('tts', '#141a36', '#4a3a6a') + stars(60, 77, 150);
  if (f.lit) s += c(70, 150, 40, '#fff2b0', 'opacity=".9"');
  s += hills(150, f.lit ? '#7ca061' : '#2a3a3a', 10, 60) + hills(175, f.lit ? '#6c9150' : '#22302f', 8, 61);
  s += r(0, 190, W, 60, '#6f727b') + crenels(0, 198, W, '#6f727b', 20);
  s += r(170, 175, 60, 22, '#55585f');
  s += lantern(200, 170, f.lit);
  s += r(330, 196, 60, 54, '#3a3c42') + p('M340,250 L340,215 L380,215 L380,250Z', '#1a1b1f');
  return s;
};

// Foe portraits for the duel screen
const FOE_ART = {
  wolf: () => wolf(200, 205, 2.4),
  bandit: () => person(200, 230, { tunic: '#3f5a2a', hood: '#2f4a22', mask: '#222', sword: true, s: 2.6 }),
  warden: () => person(200, 235, { robe: true, tunic: '#4a4c55', cloak: '#33353d', hood: '#2a2c33', hidden: true, sword: true, s: 2.6 }),
};
function duelBackdrop(kind) {
  if (kind === 'wolf') return sky('db', '#1c2a26', '#33463a') + r(0, 200, W, 50, '#1f2a1c');
  if (kind === 'bandit') return sky('db', '#9cc0e4', '#e8eef4') + p('M0,150 L90,60 L170,120 L260,40 L400,130 L400,250 L0,250Z', '#8d8f98') + r(0, 210, W, 40, '#a5977b');
  return sky('db', '#3a4058', '#8a8fa0') + r(0, 210, W, 40, '#5d5547');
}

function iconSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#1b1410"/>${rgrad('ig', '#fff3a0', '#ff9a30')}<circle cx="256" cy="270" r="230" fill="url(#ig)" opacity=".55"/><g transform="translate(256 412) scale(3.4)">${lantern(0, 0, true).replace(/<defs>.*?<\/defs>/, '').replace(/<circle cx="0" cy="-40" r="70"[^>]*\/>/, '')}</g></svg>`;
}
