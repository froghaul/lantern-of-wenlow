// The Lantern of Wenlow — an original tap-to-explore quest
'use strict';
const SAVE_KEY = 'wenlow-save-v1';
const MAX_SCORE = 120;
const MAX_HP = 10;

const ITEMS = {
  shield: { name: 'White hart shield', icon: '🛡️', desc: 'An old round shield painted with a white hart. It will make blocking easier in a fight.' },
  rope: { name: 'Coil of rope', icon: '🪢', desc: 'Thirty feet of good hemp rope from Brannoc\'s smithy.' },
  bread: { name: 'Loaf of bread', icon: '🍞', desc: 'A warm brown loaf from the Bent Nail tavern.' },
  flask: { name: 'Empty flask', icon: '🏺', desc: 'A small clay flask with a wax stopper.' },
  rue: { name: 'Sprig of wolfsbane', icon: '🌿', desc: 'Bitter-smelling leaves. Odo says wolves cannot abide the stink of it.' },
  oil: { name: 'Flask of moon-oil', icon: '✨', desc: 'The flask glows faintly, like pearl in moonlight.' },
  spindle: { name: 'Carved spindle', icon: '🪵', desc: 'A wooden spindle carved with tiny stars. Someone must be missing it.' },
  wick: { name: 'Starlight wick', icon: '🕯️', desc: 'A wick spun from thread that shimmers even in daylight.' },
  flint: { name: 'Sunstone flint', icon: '🔥', desc: 'A warm, honey-coloured stone. Struck, it throws sparks like a small sun.' },
};

let S; // game state
const $ = (id) => document.getElementById(id);
const has = (i) => S.inv.includes(i);
const give = (i) => { if (!has(i)) S.inv.push(i); sfx('get'); };
const lose = (i) => { S.inv = S.inv.filter(x => x !== i); if (S.sel === i) S.sel = null; };
function award(key, pts) { if (S.scored[key]) return; S.scored[key] = pts; S.score += pts; sfx('chime'); flashScore(pts); }

function newState() { return { scene: 'hall', inv: [], coins: 0, score: 0, f: {}, scored: {}, sel: null, last: 'hall' }; }
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { } }
function load() { try { const j = localStorage.getItem(SAVE_KEY); if (j) return JSON.parse(j); } catch (e) { } return null; }

// ---------- Sound (tiny synth, no files) ----------
let AC = null, soundOn = localStorage.getItem('wenlow-sound') !== 'off';
function tone(freq, dur, type = 'square', vol = .06, slide = 0) {
  if (!soundOn) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
    o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(AC.destination); o.start(t); o.stop(t + dur);
  } catch (e) { }
}
function sfx(k) {
  if (k === 'tap') tone(660, .05, 'square', .03);
  if (k === 'get') { tone(523, .08); setTimeout(() => tone(784, .12), 80); }
  if (k === 'chime') { tone(784, .1, 'triangle', .08); setTimeout(() => tone(1046, .18, 'triangle', .08), 100); }
  if (k === 'block') tone(1400, .12, 'square', .05, -600);
  if (k === 'hurt') tone(180, .25, 'sawtooth', .08, -120);
  if (k === 'hit') tone(320, .12, 'square', .08, -200);
  if (k === 'warn') tone(880, .06, 'square', .04);
  if (k === 'win') [523, 659, 784, 1046].forEach((n, i) => setTimeout(() => tone(n, .2, 'triangle', .08), i * 120));
}

// ---------- UI helpers ----------
function say(text) { const t = $('text'); t.innerHTML = text; t.classList.remove('fade'); void t.offsetWidth; t.classList.add('fade'); }
function flashScore(n) { const e = document.createElement('div'); e.className = 'pop'; e.textContent = `+${n}`; $('stage').appendChild(e); setTimeout(() => e.remove(), 1200); }
function overlay(html) { const o = $('overlay'); o.innerHTML = `<div class="panel">${html}</div>`; o.hidden = false; return o; }
function closeOverlay() { $('overlay').hidden = true; $('overlay').innerHTML = ''; }
// choose(text, [[label, fn], ...]) — a dialogue box with choices
function choose(text, opts, who) {
  const o = overlay(`${who ? `<div class="who">${who}</div>` : ''}<div class="say">${text}</div><div class="opts"></div>`);
  const box = o.querySelector('.opts');
  opts.forEach(([label, fn]) => { const b = document.createElement('button'); b.textContent = label; b.onclick = () => { sfx('tap'); closeOverlay(); fn && fn(); refresh(); }; box.appendChild(b); });
}
function talk(who, text, next) { choose(text, [['Continue', next]], who); }

// ---------- Scenes ----------
const go = (scene) => () => { S.last = S.scene; S.scene = scene; S.sel = null; render(); enterText(); save(); };
function enterText() { const sc = SCENES[S.scene]; say(typeof sc.enter === 'function' ? sc.enter() : sc.enter); }

const SCENES = {
  hall: {
    name: 'The Great Hall of Wenlow',
    enter: () => S.f.quest ? 'The Great Hall is hushed. Candles burn beside the sleeping King.' : 'You kneel in the Great Hall of Wenlow. The King lies still upon his bier, and Maud the Steward beckons you over.',
    hot: [
      { name: 'King Aldren', box: [140, 132, 125, 66], look: 'King Aldren lies upon his bier, breathing as slow as winter. Since the Lantern of Dawn went dark, nothing in the realm can wake him.', talk: () => say('You whisper his name. He does not stir.') },
      { name: 'Maud the Steward', box: [298, 140, 48, 82], look: 'Maud has kept the castle running for thirty years. Her eyes are red from too many nights without sleep.', talk: () => maudTalk() },
      { name: 'Shield on the wall', box: [85, 86, 40, 40], when: () => !S.f.shield, look: 'An old round shield, painted with a white hart. It has hung here since the King was young.', take: () => { S.f.shield = 1; give('shield'); award('shield', 2); say('You lift the white hart shield from its hooks. Maud nods: "Take it. It has turned many a blade."'); } },
      { name: 'Banners', box: [145, 36, 110, 75], look: 'The red banner of Wenlow and the blue of the Queen\'s house hang side by side, dusty and still.' },
      { name: 'Door to the courtyard', box: [18, 115, 50, 97], exit: true, go: () => { if (!S.f.quest) { talk('Maud', '"Sir Knight — wait! Hear me before you go anywhere."'); return; } go('courtyard')(); } },
    ],
  },
  courtyard: {
    name: 'Castle Courtyard',
    enter: 'The castle courtyard. Hammer-blows ring from Brannoc\'s smithy, and the main gate stands open to the road.',
    hot: [
      { name: 'Brannoc the Smith', box: [80, 140, 44, 78], look: 'Brannoc, broad as a door, with arms like oak roots and a beard singed at the edges.', talk: () => smithTalk() },
      { name: 'Forge', box: [12, 146, 44, 36], look: 'The forge glows white-hot. You could warm your hands here all day.' },
      { name: 'Main gate', box: [168, 95, 64, 88], exit: true, go: go('crossroads') },
      { name: 'Door to the Great Hall', box: [330, 125, 44, 60], exit: true, go: go('hall') },
      { name: 'Hay', box: [250, 172, 40, 22], look: 'A pile of hay. Nothing hidden in it but a sleepy cat, who glares at you.' },
    ],
  },
  crossroads: {
    name: 'The Crossroads',
    enter: 'Four roads meet beneath an old signpost. Far to the west, grey mist clings to a lonely tower.',
    hot: [
      { name: 'Signpost', box: [162, 116, 80, 62], look: 'The arms read: NORTH — the Crag Road. EAST — Ashby. WEST — the Darkwood. SOUTH — Gethin\'s Ford. Someone has scratched beneath them: "Beware the tower."' },
      { name: 'Crag Road (north)', box: [150, 30, 140, 80], exit: true, go: go('mountain') },
      { name: 'Ashby village (east)', box: [312, 104, 88, 50], exit: true, go: go('village') },
      { name: 'The Darkwood (west)', box: [0, 120, 110, 75], exit: true, go: go('darkwood') },
      { name: 'Road to the ford (south)', box: [170, 205, 80, 45], exit: true, go: go('river') },
      { name: 'Castle Wenlow', box: [344, 50, 52, 48], exit: true, go: go('courtyard') },
      { name: 'The Grey Tower', box: [30, 18, 60, 72], exit: true, go: () => { if (has('oil') && has('wick') && has('flint') || S.f.warden) go('tower')(); else say('As you walk toward the Grey Tower, the mist thickens until you cannot see your own hands. You come out where you started. You need everything the Lantern needs: <b>moon-oil</b>, a <b>wick</b> and a <b>flint</b>.'); } },
    ],
  },
  village: {
    name: 'Ashby Village',
    enter: () => S.f.fedBeggar ? 'Ashby village. Odo dozes happily by the fountain.' : 'Ashby village. Chickens wander about the fountain, where a ragged old man sits with his hand out.',
    hot: [
      { name: 'The Bent Nail tavern', box: [296, 136, 38, 54], exit: true, go: go('tavern') },
      { name: 'Tavern sign', box: [344, 116, 30, 26], look: 'A painted sign shows a tankard with a bent nail through it. The Bent Nail.' },
      { name: 'Fountain', box: [162, 150, 88, 60], look: () => S.f.fountain ? 'Clear water splashes over mossy stone.' : 'Clear water splashes over mossy stone. Something glints at the bottom: a silver penny!', take: () => { if (S.f.fountain) return say('There\'s nothing left in the fountain but moss.'); S.f.fountain = 1; S.coins++; sfx('get'); award('fountain', 2); say('You fish the silver penny out of the water. Someone\'s wish is now your fortune.'); } },
      { name: 'Odo the beggar', box: [98, 150, 46, 64], look: 'An old man in a patched grey hood. His eyes are sharper than his rags suggest.', talk: () => odoTalk(), use: { bread: () => feedOdo() } },
      { name: 'Road back to the crossroads', box: [0, 200, 62, 50], exit: true, go: go('crossroads') },
    ],
  },
  tavern: {
    name: 'The Bent Nail',
    enter: 'The Bent Nail is warm and smells of woodsmoke and stew. Hild the tavern keeper wipes down the counter.',
    hot: [
      { name: 'Hild', box: [184, 92, 44, 50], look: 'Hild runs the Bent Nail and knows every bit of gossip within twenty miles.', talk: () => hildTalk() },
      { name: 'Hearth', box: [20, 100, 80, 85], look: 'A great crackling fire. A pot of stew bubbles above it.' },
      { name: 'Barrels', box: [312, 176, 66, 48], look: 'Barrels of ale. Hild watches you closely as you look at them.' },
      { name: 'Door', box: [354, 100, 40, 76], exit: true, go: go('village') },
    ],
  },
  darkwood: {
    name: 'The Darkwood',
    enter: () => S.f.wolfGone ? 'The Darkwood is quiet now. The path winds on toward a faint silver light.' : 'The trees close in overhead. On the path ahead, a great grey wolf rises to its feet, growling low.',
    hot: [
      { name: 'Grey wolf', box: [140, 160, 120, 46], when: () => !S.f.wolfGone, look: 'A huge grey wolf with yellow eyes. It guards the path and shows no fear of you at all.', talk: () => say('You speak softly to the wolf. It growls louder.'), acts: [['Fight the wolf', () => fight('wolf', () => { S.f.wolfGone = 1; award('wolf', 5); go('darkwood')(); say('The wolf yelps and limps away into the trees. The path is clear.'); })]], use: { rue: () => { lose('rue'); S.f.wolfGone = 1; award('wolf', 8); render(); say('You hold out the wolfsbane. The wolf catches the smell, sneezes, and slinks off into the dark. No blood spilled today.'); } } },
      { name: 'Path deeper into the wood', box: [172, 112, 56, 46], exit: true, go: () => S.f.wolfGone ? go('moonpool')() : say('The wolf stands squarely in the way.') },
      { name: 'Path back to the crossroads', box: [0, 200, 72, 50], exit: true, go: go('crossroads') },
    ],
  },
  moonpool: {
    name: 'The Moon Pool',
    enter: 'In a clearing where it is always night, a ring of old stones circles a pool so deep and still it holds the moon in it.',
    hot: [
      { name: 'The Moon Pool', box: [130, 150, 140, 52], look: () => S.f.oil ? 'The pool is still once more.' : 'Far, far below the surface, something glows like pearl. The water is too deep to reach from the edge.', acts: [['Call into the pool', () => ladyTalk()]], use: { rope: () => { if (!S.f.riddle) return say('You lower the rope, but something in the water pushes it gently back up.'); S.f.ropeTied = 1; lose('rope'); render(); say('With the Lady\'s leave, you tie the rope to a standing stone and let it down into the glowing water.'); }, flask: () => { if (!S.f.riddle) return say('You reach toward the water, but a cold voice says: "Not without my leave."'); if (!S.f.ropeTied) return say('The glow is far below, out of reach. If only you had a rope to climb down.'); lose('flask'); give('oil'); S.f.oil = 1; award('oil', 10); render(); say('You climb down the rope and fill the flask with glowing moon-oil. When you climb out, the Lady has gone, and only the moon remains.'); } } },
      { name: 'The moon', box: [295, 18, 50, 46], look: 'The moon hangs above the clearing, though it was midday when you entered the wood.' },
      { name: 'Path back', box: [0, 195, 62, 55], exit: true, go: go('darkwood') },
    ],
  },
  river: {
    name: 'Gethin\'s Ford',
    enter: 'The river runs wide and fast here. An old ferryman leans on his pole beside his boat. Across the water, smoke rises from a cottage.',
    hot: [
      { name: 'Reeds', box: [8, 145, 80, 65], look: () => S.f.spindle ? 'Tall reeds sway in the current.' : 'Tall reeds sway in the current. Something carved and wooden is tangled at their roots.', take: () => { if (S.f.spindle) return say('Just reeds now.'); S.f.spindle = 1; give('spindle'); award('spindle', 3); render(); say('You wade in and pull free a carved wooden spindle, decorated with tiny stars.'); } },
      { name: 'Wat the ferryman', box: [250, 140, 42, 72], look: 'Wat has ferried folk across this river for forty years and has never once fallen in, or so he says.', talk: () => watTalk() },
      { name: 'Ferry boat', box: [282, 178, 92, 24], exit: true, go: () => S.f.ferry ? go('spinner')() : watTalk() },
      { name: 'Cottage across the river', box: [190, 44, 52, 50], look: 'Nan Gethin\'s cottage. They say she spins the finest thread in the realm.' },
      { name: 'Road back to the crossroads', box: [150, 218, 100, 32], exit: true, go: go('crossroads') },
    ],
  },
  spinner: {
    name: 'Nan Gethin\'s Cottage',
    enter: 'Flowers crowd around a little cottage. An old woman sits beside a spinning wheel that isn\'t turning.',
    hot: [
      { name: 'Nan Gethin', box: [222, 140, 40, 75], look: 'Nan Gethin is small and bright-eyed, with clever fingers that can\'t keep still.', talk: () => nanTalk(), use: { spindle: () => giveSpindle() } },
      { name: 'Spinning wheel', box: [262, 140, 70, 62], look: () => S.f.wick ? 'The wheel turns lazily in the breeze.' : 'A fine spinning wheel, but its spindle is missing.' },
      { name: 'Cottage', box: [70, 50, 140, 135], look: 'A neat little cottage with a crooked chimney.' },
      { name: 'Boat back across', box: [10, 214, 100, 30], exit: true, go: go('river') },
    ],
  },
  mountain: {
    name: 'The Crag Road',
    enter: () => S.f.bandit ? 'The Crag Road winds up toward a cave mouth high on the mountain.' : 'The Crag Road climbs into the mountains. A masked figure steps out from behind a rock, sword drawn.',
    hot: [
      { name: 'Masked bandit', box: [182, 116, 46, 86], when: () => !S.f.bandit, look: 'A lean young man in a green hood and a black mask. His sword is notched, and his boots have holes in them.', talk: () => banditTalk() },
      { name: 'Cave mouth', box: [290, 68, 60, 46], exit: true, go: () => S.f.bandit ? go('hermit')() : say('The bandit blocks the path. "Not so fast!"') },
      { name: 'Path back down', box: [0, 205, 90, 45], exit: true, go: go('crossroads') },
    ],
  },
  hermit: {
    name: 'The Hermit\'s Cave',
    enter: 'A dry, warm cave. A small fire crackles, and beside it sits a hermit with a long white beard.',
    hot: [
      { name: 'Brother Ivo', box: [250, 125, 50, 90], look: 'Brother Ivo has lived on this mountain longer than anyone can remember. They say he was a knight once.', talk: () => ivoTalk() },
      { name: 'Fire', box: [160, 160, 60, 46], look: 'The fire burns with no smoke at all.' },
      { name: 'Shelf of jars', box: [88, 72, 84, 24], look: 'Jars of dried herbs, honey and something that might be pickled toad.' },
      { name: 'Cave mouth', box: [0, 40, 56, 170], exit: true, go: go('mountain') },
    ],
  },
  tower: {
    name: 'The Grey Tower',
    enter: () => S.f.warden ? 'The tower door stands open. Stone stairs spiral upward into the dark.' : 'The mist parts. Before the tower door stands a tall figure in grey, face hidden in shadow.',
    hot: [
      { name: 'The Grey Warden', box: [172, 120, 56, 104], when: () => !S.f.warden, look: 'The Grey Warden. Where a face should be, you see only two pale lights.', talk: () => wardenTalk() },
      { name: 'Tower door', box: [180, 150, 40, 60], when: () => S.f.warden, exit: true, go: go('towertop') },
      { name: 'Way back', box: [0, 212, 82, 38], exit: true, go: go('crossroads') },
    ],
  },
  towertop: {
    name: 'Top of the Grey Tower',
    enter: () => S.f.lit ? 'Dawn light floods across Wenlow.' : 'The top of the tower. The great iron Lantern of Dawn stands cold and dark. The whole sleeping realm lies below.',
    hot: [
      { name: 'Lantern of Dawn', box: [170, 80, 60, 115], look: () => `The great iron Lantern. ${S.f.oilIn ? 'Moon-oil shimmers in its bowl. ' : 'Its bowl is dry. '}${S.f.wickIn ? 'A starlight wick stands ready.' : 'It has no wick.'}`, use: { oil: () => { lose('oil'); S.f.oilIn = 1; award('oilIn', 4); say('You pour the moon-oil into the Lantern\'s bowl. It glimmers like a pool of moonlight.'); }, wick: () => { lose('wick'); S.f.wickIn = 1; award('wickIn', 4); say('You set the starlight wick in the Lantern. It drinks up the oil and shines faintly.'); }, flint: () => { if (!S.f.oilIn || !S.f.wickIn) return say('You strike sparks, but there is nothing in the Lantern to catch them yet.'); lose('flint'); S.f.lit = 1; award('lit', 10); render(); sfx('win'); setTimeout(ending, 1600); say('You strike the sunstone flint. A single spark leaps, and the Lantern of Dawn blazes into light!'); } } },
      { name: 'The view', box: [0, 120, 160, 60], look: 'You can see the whole realm from here: the Darkwood, the river, Ashby and Castle Wenlow, all asleep.' },
      { name: 'Stairs down', box: [330, 196, 60, 54], exit: true, go: go('tower') },
    ],
  },
};

// ---------- Conversations & puzzles ----------
function maudTalk() {
  if (!S.f.quest) {
    talk('Maud the Steward', '"Thank heaven you\'ve come. On Midsummer night the <b>Grey Warden</b> crept into the Grey Tower and put out the <b>Lantern of Dawn</b>. While it stays dark, the King sleeps and the land withers."', () =>
      talk('Maud the Steward', '"To light it again you need three things: <b>oil from the Moon Pool</b> in the Darkwood, a <b>wick spun by Nan Gethin</b> across the river, and the <b>sunstone flint</b> kept by the hermit on the mountain."', () =>
        talk('Maud the Steward', '"Here: three silver pennies. It is all the treasury can spare. And take the old shield from the wall. You may need it."', () => { S.f.quest = 1; S.coins += 3; sfx('get'); award('quest', 5); say('Maud presses three silver pennies into your hand. Your quest has begun.'); save(); })));
    return;
  }
  const need = [!has('oil') && !S.f.oilIn && 'moon-oil', !has('wick') && !S.f.wickIn && 'the wick', !has('flint') && 'the flint'].filter(Boolean);
  if (need.length) talk('Maud the Steward', `"You still need ${need.join(', ')}. Go with care, Sir Knight."`);
  else talk('Maud the Steward', '"You have them all! Go to the Grey Tower, quickly, and may the dawn go with you."');
}
function smithTalk() {
  const opts = [];
  if (!has('rope') && !S.f.ropeTied) opts.push(['Buy rope (1 penny)', () => { if (S.coins < 1) return talk('Brannoc', '"No penny, no rope. I\'ve a forge to feed."'); S.coins--; give('rope'); award('rope', 2); talk('Brannoc', '"Good hemp, that. It\'ll hold a horse."'); }]);
  opts.push(['Any advice?', () => talk('Brannoc', '"In a fight, watch the blade, not the eyes. When they lift it high, guard high. When they swing low, guard low. Block first, then strike while they\'re off balance."')]);
  opts.push(['Goodbye', null]);
  choose('"Morning, Sir Knight. Need anything from the smithy?"', opts, 'Brannoc the Smith');
}
function hildTalk() {
  const opts = [];
  if (!has('bread') && !S.f.fedBeggar) opts.push(['Buy bread (1 penny)', () => { if (S.coins < 1) return talk('Hild', '"I don\'t give credit, dearie."'); S.coins--; give('bread'); talk('Hild', '"Fresh this morning."'); }]);
  if (!has('flask') && !S.f.oil) opts.push(['Buy a flask (1 penny)', () => { if (S.coins < 1) return talk('Hild', '"A penny, love. Flasks don\'t grow on trees."'); S.coins--; give('flask'); talk('Hild', '"Stoppered tight. Mind you don\'t drop it."'); }]);
  opts.push(['Heard any news?', () => talk('Hild', ['"Old Wat at the ford lost his tongue for anything but pennies, same as always."', '"They say the Lady of the Moon Pool won\'t speak to anyone who can\'t answer her riddle."', '"Nan Gethin hasn\'t spun a thread since her spindle went in the river. Poor dear."', '"There\'s a young lad robbing folk on the Crag Road. Jory, his name is. He was a good boy once, before his family lost their farm."'][Math.floor(Math.random() * 4)])]);
  opts.push(['Goodbye', null]);
  choose('"Welcome to the Bent Nail! What\'ll it be?"', opts, 'Hild');
}
function odoTalk() {
  if (S.f.fedBeggar) return talk('Odo', '"Remember: walk your answer to the Lady, don\'t think it. And bless you for the bread."');
  talk('Odo', '"Spare a crust, good knight? I\'ve not eaten since Lammas."');
}
function feedOdo() {
  lose('bread'); S.f.fedBeggar = 1; give('rue'); award('odo', 5); render();
  talk('Odo', '"Bless you! Here, take this wolfsbane. The grey wolf of the Darkwood can\'t stand the smell of it."', () =>
    talk('Odo', '"And if the Lady of the Pool asks you a riddle... think about <i>walking</i>."'));
}
function ladyTalk() {
  if (S.f.oil) return say('Only the moon answers you.');
  if (S.f.riddle) return say('The Lady\'s voice whispers: "You have my leave. Take what you need."');
  render();
  talk('The Lady of the Pool', 'A pale figure rises from the water. "Who calls on the Moon Pool? Answer me truly and its oil is yours."', () =>
    choose('"<b>The more of me you make, the more you leave behind. What am I?</b>"', [
      ['A shadow', ladyWrong], ['Footsteps', () => { S.f.riddle = 1; award('riddle', 8); render(); talk('The Lady of the Pool', '"Truly answered. You may take what you need from my pool."'); }], ['A secret', ladyWrong], ['Years', ladyWrong],
    ], 'The Lady of the Pool'));
}
function ladyWrong() { talk('The Lady of the Pool', '"No." The Lady sinks back below the water. Perhaps you can call her again once you\'ve had a think.'); }
function watTalk() {
  if (S.f.ferry) return talk('Wat', '"Hop in. You\'ve paid already."', go('spinner'));
  choose('"A penny to cross, Sir Knight. River\'s too fast to wade."', [
    ['Pay a penny', () => { if (S.coins < 1) return talk('Wat', '"No penny, no passage."'); S.coins--; S.f.ferry = 1; award('ferry', 2); talk('Wat', '"Right you are. That\'ll do you there and back."', go('spinner')); }],
    ['Not now', null],
  ], 'Wat the Ferryman');
}
function nanTalk() {
  if (S.f.wick) return talk('Nan Gethin', '"That wick will burn until the end of the world, dearie. Off you go now."');
  talk('Nan Gethin', '"A wick for the Lantern? Oh, I could spin you one from starlight. But my lovely spindle fell in the river, and I can\'t spin a thread without it."');
}
function giveSpindle() {
  lose('spindle'); S.f.wick = 1; give('wick'); award('wick', 10); render();
  talk('Nan Gethin', '"My spindle! Oh, you dear thing." She sets the wheel spinning, and thread like starlight runs through her fingers. "There. A wick fit for the Lantern of Dawn."');
}
function banditTalk() {
  choose('"Your purse or your life, Sir Knight!"', [
    ['Draw your sword', () => fight('bandit', banditBeaten)],
    ['"Are you Jory? Hild says you were a good lad once."', () => talk('Jory', '"What would she know about it? Now hand over the purse, or else!"', () => fight('bandit', banditBeaten))],
    ['Back away', () => go('crossroads')()],
  ], 'Masked bandit');
}
function banditBeaten() {
  award('bandit', 5);
  choose('The bandit drops his sword and falls to his knees. "Mercy! I only stole because we were starving!"', [
    ['Spare him', () => { S.f.bandit = 'spared'; S.f.spared = 1; S.coins++; award('mercy', 10); go('mountain')(); talk('Jory', '"Thank you, sir. Here, this penny\'s yours, by rights. I\'ll go home and work honest."'); }],
    ['Drive him off', () => { S.f.bandit = 'driven'; award('drive', 3); go('mountain')(); say('The bandit runs off down the mountain and does not look back.'); }],
  ], 'Victory');
}
function ivoTalk() {
  if (has('flint') || S.f.lit) return talk('Brother Ivo', '"Strike true, young knight."');
  talk('Brother Ivo', '"So. You want the sunstone flint. First, answer me one question."', () =>
    choose('"<b>What is a knight\'s sword for?</b>"', [
      ['To win glory and fame', ivoWrong],
      ['To take what the strong deserve', ivoWrong],
      ['To protect those who cannot protect themselves', () => {
        give('flint'); award('flint', 10);
        const extra = S.f.spared ? ' "And I hear you showed young Jory mercy on the road. That was well done."' : '';
        if (S.f.spared) award('ivoMercy', 5);
        talk('Brother Ivo', `"A true answer." He places a warm, honey-coloured stone in your hand: the sunstone flint.${extra}`);
      }],
    ], 'Brother Ivo'));
}
function ivoWrong() { talk('Brother Ivo', '"Hmm. Sit by the fire and think about it a while. Then ask me again."'); }
function wardenTalk() {
  choose('"So, the little knight has brought the makings of the light. You will not carry them past me."', [
    ['Fight the Grey Warden', () => fight('warden', () => { S.f.warden = 1; award('warden', 15); go('tower')(); say('The Grey Warden breaks apart into mist and blows away on the wind. The tower door swings open.'); })],
    ['Retreat for now', () => go('crossroads')()],
  ], 'The Grey Warden');
}

// ---------- Combat ----------
const FOES = {
  wolf: { name: 'The grey wolf', hp: 5, dmg: 2, tele: 950, idle: [800, 1600], parry: .4, hi: 'leaps for your throat', lo: 'snaps at your legs' },
  bandit: { name: 'The bandit', hp: 6, dmg: 2, tele: 850, idle: [700, 1400], parry: .5, hi: 'raises his sword high', lo: 'swings low at your knees' },
  warden: { name: 'The Grey Warden', hp: 9, dmg: 3, tele: 700, idle: [550, 1200], parry: .65, hi: 'lifts a pale blade high', lo: 'sweeps low like the wind' },
};
let F = null;
function fight(kind, onWin) {
  const foe = FOES[kind], shield = has('shield');
  F = { kind, foe, php: MAX_HP, fhp: foe.hp, phase: 'start', atk: null, guard: null, timer: null, onWin, win: shield ? 220 : 0 };
  const o = $('overlay');
  o.innerHTML = `<div class="duel">
    <div class="bars"><div><span>You</span><div class="bar"><i id="pb"></i></div></div><div><span>${foe.name}</span><div class="bar foe"><i id="fb"></i></div></div></div>
    <svg viewBox="0 0 400 250" id="duelsvg">${duelBackdrop(kind)}<g id="foeg">${FOE_ART[kind]()}</g><g id="ind"></g></svg>
    <div id="dmsg">Get ready…</div>
    <div class="dbtns"><button id="gh">⬆ Guard high</button><button id="st">⚔ Strike</button><button id="gl">⬇ Guard low</button></div>
    ${shield ? '<div class="hint">Your white hart shield makes blocking easier.</div>' : '<div class="hint">Tip: a shield would make blocking easier.</div>'}
  </div>`;
  o.hidden = false;
  const bind = (id, fn) => { const b = $(id); b.addEventListener('pointerdown', (e) => { e.preventDefault(); fn(); b.classList.add('pressed'); setTimeout(() => b.classList.remove('pressed'), 150); }); };
  bind('gh', () => setGuard('high')); bind('gl', () => setGuard('low')); bind('st', strike);
  bars();
  F.timer = setTimeout(nextRound, 1200);
}
function dmsg(t) { const m = $('dmsg'); if (m) m.innerHTML = t; }
function bars() { $('pb').style.width = (F.php / MAX_HP * 100) + '%'; $('fb').style.width = (F.fhp / F.foe.hp * 100) + '%'; }
function indicator(kind) {
  const g = $('ind'); if (!g) return;
  if (!kind) { g.innerHTML = ''; return; }
  const y = kind === 'high' ? 50 : 200;
  g.innerHTML = `<g class="blink"><path d="M${kind === 'high' ? '300,70 L320,40 L340,70Z' : '300,180 L320,210 L340,180Z'}" fill="#ff3b30"/><path d="M${kind === 'high' ? '60,70 L80,40 L100,70Z' : '60,180 L80,210 L100,180Z'}" fill="#ff3b30"/><rect x="110" y="${y - 6}" width="180" height="12" rx="6" fill="#ff3b30" opacity=".35"/></g>`;
}
function shake(id) { const e = $(id); if (!e) return; e.classList.remove('shake'); void e.getBoundingClientRect(); e.classList.add('shake'); }
function nextRound() {
  if (!F) return; F.phase = 'idle'; F.guard = null; F.atk = null; indicator(null);
  dmsg(`${F.foe.name} circles you, looking for an opening…`);
  const [a, b] = F.foe.idle; F.timer = setTimeout(telegraph, a + Math.random() * (b - a));
}
function telegraph(fast) {
  if (!F) return; F.phase = 'tele'; F.guard = null; F.atk = Math.random() < .5 ? 'high' : 'low';
  indicator(F.atk); sfx('warn');
  dmsg(`<b>${F.foe.name} ${F.atk === 'high' ? F.foe.hi : F.foe.lo}!</b> Guard ${F.atk === 'high' ? 'HIGH' : 'LOW'}!`);
  F.timer = setTimeout(resolve, (fast ? F.foe.tele * .8 : F.foe.tele) + F.win);
}
function setGuard(g) { if (!F) return; if (F.phase === 'tele') F.guard = g; else if (F.phase === 'idle') dmsg('You raise your guard, but nothing is coming yet. Watch for the attack!'); }
function resolve() {
  if (!F) return; indicator(null);
  if (F.guard === F.atk) {
    sfx('block'); F.phase = 'open'; dmsg('<b>Blocked!</b> They\'re off balance. STRIKE now!');
    F.timer = setTimeout(() => { if (F && F.phase === 'open') { dmsg('Too slow. They recover.'); F.timer = setTimeout(nextRound, 400); F.phase = 'wait'; } }, 1000 + F.win);
  } else {
    F.php = Math.max(0, F.php - F.foe.dmg); sfx('hurt'); shake('duelsvg'); bars();
    dmsg(F.guard ? `You guarded ${F.guard}, but the blow came ${F.atk}! You're hit.` : 'The blow lands! You\'re hit.');
    F.phase = 'wait';
    if (F.php <= 0) { F.timer = setTimeout(defeated, 700); return; }
    F.timer = setTimeout(nextRound, 800);
  }
}
function strike() {
  if (!F) return;
  if (F.phase === 'open') { clearTimeout(F.timer); F.fhp = Math.max(0, F.fhp - 2); sfx('hit'); shake('foeg'); bars(); dmsg('<b>A solid hit!</b>'); F.phase = 'wait'; if (F.fhp <= 0) { F.timer = setTimeout(victory, 600); return; } F.timer = setTimeout(nextRound, 700); return; }
  if (F.phase === 'idle') {
    clearTimeout(F.timer);
    if (Math.random() > F.foe.parry) { F.fhp = Math.max(0, F.fhp - 1); sfx('hit'); shake('foeg'); bars(); dmsg('You catch them off guard. A glancing hit!'); if (F.fhp <= 0) { F.phase = 'wait'; F.timer = setTimeout(victory, 600); return; } F.phase = 'wait'; F.timer = setTimeout(nextRound, 700); }
    else { sfx('block'); dmsg('Parried! And they come straight back at you…'); F.phase = 'wait'; F.timer = setTimeout(() => telegraph(true), 450); }
    return;
  }
  if (F.phase === 'tele') { dmsg('You swing into their attack! Guard instead!'); }
}
function victory() { const cb = F.onWin; clearTimeout(F.timer); F = null; sfx('win'); closeOverlay(); cb(); refresh(); save(); }
function defeated() {
  const { kind, onWin } = F; clearTimeout(F.timer); F = null;
  choose('You fall to one knee, your vision swimming… but a knight of Wenlow does not give up so easily.', [
    ['Try again', () => fight(kind, onWin)],
    ['Retreat and recover', () => go(S.scene === 'tower' || S.scene === 'mountain' || S.scene === 'darkwood' ? 'crossroads' : S.scene)()],
  ], 'Defeated');
}

// ---------- Ending ----------
function ending() {
  S.f.ending = 1; S.scene = 'hall'; save(); render();
  const pct = S.score / MAX_SCORE;
  const rank = pct >= 1 ? 'Paragon of Wenlow' : pct >= .85 ? 'Knight of the Dawn' : pct >= .65 ? 'Trusted Knight' : 'Squire with promise';
  overlay(`<div class="who">Dawn</div><div class="say">Light pours from the Grey Tower across the whole realm. Birds begin to sing. In the Great Hall, King Aldren opens his eyes, sits up, and asks why everyone is crying.<br><br>Maud laughs through her tears. "Because, Your Majesty, a knight of Wenlow brought back the dawn."<br><br><b>Score: ${S.score} of ${MAX_SCORE}</b><br>Title earned: <b>${rank}</b>${S.score < MAX_SCORE ? '<br><small>Some deeds went undone. Mercy and gentleness earn the most honour.</small>' : ''}</div><div class="opts"><button id="next">Continue…</button></div>`);
  $('next').onclick = () => overlay(`<div class="who">Chapter One complete</div><div class="say">That evening, far up the mountain, Brother Ivo stands at the mouth of his cave and stares north, where a thin grey line smudges the horizon.<br><br>"The Warden was only a shadow," he murmurs. "Something cast it. And it is still out there."<br><br><i>The Wenlow Chronicles continue in <b>Chapter Two: The Northern Shadow</b>.</i></div><div class="opts"><button id="share">📣 Share with a friend</button><button id="again">Play again</button><button id="stay">Admire the hall</button></div>`) && bindEnd();
}
function bindEnd() {
  $('share').onclick = () => shareGame(true);
  $('again').onclick = () => { closeOverlay(); S = newState(); start(); };
  $('stay').onclick = () => { closeOverlay(); say('King Aldren is awake, and the hall is full of light. Well done, Sir Knight.'); };
}
function shareGame(won) {
  const url = location.href.split(/[?#]/)[0];
  const text = won ? `I relit the Lantern of Dawn and scored ${S.score}/${MAX_SCORE} in The Lantern of Wenlow. Free to play on your phone:` : 'The Lantern of Wenlow: a free old-school quest adventure you can play on your phone:';
  if (navigator.share) navigator.share({ title: 'The Lantern of Wenlow', text, url }).catch(() => { });
  else if (navigator.clipboard) navigator.clipboard.writeText(`${text} ${url}`).then(() => say('Link copied. Paste it to a friend!'), () => say(url));
  else say(`Share this link: ${url}`);
}

// ---------- Rendering ----------
function sceneHot() { return SCENES[S.scene].hot.filter(h => !h.when || h.when()); }
function render() {
  const sc = SCENES[S.scene];
  const hs = sceneHot().map((h, i) => `<rect class="hs${h.exit ? ' exit' : ''}" data-i="${i}" x="${h.box[0]}" y="${h.box[1]}" width="${h.box[2]}" height="${h.box[3]}" rx="6"/>`).join('');
  $('scene').innerHTML = `<svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice">${ART[S.scene](S.f)}<g id="knight"></g>${hs}</svg>`;
  $('sceneName').textContent = sc.name;
  if (K.scene !== S.scene) { placeKnight(K.scene); K.scene = S.scene; }
  drawKnight();
  refresh();
}
function refresh() {
  $('coins').textContent = S.coins; $('score').textContent = `${S.score}/${MAX_SCORE}`;
  const inv = $('inv');
  inv.innerHTML = S.inv.length ? '' : '<span class="empty">Your pack is empty</span>';
  S.inv.forEach(id => {
    const b = document.createElement('button'); b.className = 'item' + (S.sel === id ? ' sel' : ''); b.innerHTML = `<span>${ITEMS[id].icon}</span><small>${ITEMS[id].name}</small>`;
    b.onclick = () => { sfx('tap'); if (S.sel === id) { S.sel = null; say(ITEMS[id].desc); } else { S.sel = id; say(`<b>${ITEMS[id].name}</b>: ${ITEMS[id].desc}<br><i>Now tap something in the scene to use it there.</i>`); } refresh(); };
    inv.appendChild(b);
  });
}
function val(v) { return typeof v === 'function' ? v() : v; }
function tapHot(h) {
  sfx('tap');
  const it = S.sel;
  walkTo(standFor(h), () => { faceToward(h); actOn(h, it); });
}
function actOn(h, it) {
  if (it) {
    S.sel = null;
    const fn = h.use && h.use[it];
    if (fn) fn(); else say(`Using the ${ITEMS[it].name.toLowerCase()} on ${h.name.toLowerCase()} doesn't help.`);
    refresh(); save(); return;
  }
  const acts = [];
  if (h.look) acts.push(['👁 Look', () => say(val(h.look))]);
  if (h.talk) acts.push(['💬 Talk', h.talk]);
  if (h.take) acts.push(['✋ Take', h.take]);
  (h.acts || []).forEach(a => acts.push(a));
  if (h.go && acts.length === 0) { h.go(); return; }
  if (h.go) acts.push(['🚶 Go', h.go]);
  const o = overlay(`<div class="who">${h.name}</div><div class="opts"></div><button class="cancel">Cancel</button>`);
  o.querySelector('.cancel').onclick = closeOverlay;
  const box = o.querySelector('.opts');
  acts.forEach(([label, fn]) => { const b = document.createElement('button'); b.textContent = label; b.onclick = () => { sfx('tap'); closeOverlay(); fn(); refresh(); save(); }; box.appendChild(b); });
}

function menu() {
  const o = overlay(`<div class="who">Menu</div><div class="opts">
    <button id="m-hints">${document.body.classList.contains('showhs') ? 'Hide' : 'Show'} tappable spots</button>
    <button id="m-sound">Sound: ${soundOn ? 'on' : 'off'}</button>
    <button id="m-help">How to play</button>
    <button id="m-share">Share the game with a friend</button>
    <button id="m-new">Start a new game</button>
    <button id="m-about">About</button></div><button class="cancel">Close</button>`);
  o.querySelector('.cancel').onclick = closeOverlay;
  $('m-hints').onclick = () => { document.body.classList.toggle('showhs'); localStorage.setItem('wenlow-hs', document.body.classList.contains('showhs') ? '1' : '0'); closeOverlay(); };
  $('m-sound').onclick = () => { soundOn = !soundOn; localStorage.setItem('wenlow-sound', soundOn ? 'on' : 'off'); closeOverlay(); };
  $('m-help').onclick = help;
  $('m-share').onclick = () => { closeOverlay(); shareGame(); };
  $('m-new').onclick = () => choose('Start over from the beginning? Your current progress will be lost.', [['Yes, start over', () => { S = newState(); start(); }], ['No', null]]);
  $('m-about').onclick = () => talk('About', '<b>The Lantern of Wenlow</b><br>Chapter One of <i>The Wenlow Chronicles</i>.<br>An original adventure in the spirit of old-school quest games. Everything you see (story, characters, art and sound) was made new for this game.<br><br>Your progress saves automatically on this device.');
}
function help() {
  talk('How to play', '• <b>Tap the ground</b> to walk your knight there.<br>• <b>Tap</b> people and things and your knight walks over to look, talk or take.<br>• <b>Dashed edges</b> are ways out to other places.<br>• <b>Tap an item</b> in your pack, then tap something in the scene to use it there.<br>• <b>In a fight</b>, watch the red arrows: guard HIGH or LOW, then STRIKE while they\'re off balance.<br>• Turn your phone <b>sideways</b> for a bigger picture.<br>• Stuck? Turn on "Show tappable spots" in the ☰ menu.<br><br>Your game saves itself automatically.');
}

function start() { K.scene = null; closeOverlay(); render(); enterText(); save(); if (!S.f.seenIntro) { S.f.seenIntro = 1; intro(); } }
function intro() {
  talk('The Lantern of Wenlow', 'For a hundred years the <b>Lantern of Dawn</b> has burned atop the Grey Tower, and while it burned, the realm of Wenlow knew good harvests, gentle winters and a wise king.<br><br>Then, on Midsummer night, it went dark, and King Aldren fell into a sleep from which no one can wake him.<br><br>You are a young knight of Wenlow, summoned to the Great Hall at dawn…<br><br><i>The Wenlow Chronicles, Chapter One</i>', help);
}

window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('wenlow-hs') === '1') document.body.classList.add('showhs');
  $('scene').addEventListener('click', (e) => {
    const t = e.target.closest('.hs');
    if (t) { const h = sceneHot()[+t.dataset.i]; if (h) tapHot(h); return; }
    const svg = $('scene').querySelector('svg'); if (!svg) return;
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const q = pt.matrixTransform(svg.getScreenCTM().inverse());
    walkTo([q.x, q.y]);
  });
  $('menuBtn').onclick = menu;
  S = load() || newState();
  if (S.f.ending) { S = newState(); }
  start();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });
});
