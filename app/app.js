// Vice Platinum Guide — tracker and guide for the 55 GTA 6 trophies.
// A static app: it loads only its own data file and makes no other
// network request at run time. Progress lives in localStorage, and
// export/import moves it around as JSON.
const STORE_KEY = 'vice-platinum-guide-v1';
const DATA_URL = 'data/trophies.json';

const listEl = document.getElementById('trophy-list');
const detailEl = document.getElementById('detail');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kind');
const gradeEl = document.getElementById('grade');
const earnedFilterEl = document.getElementById('earned-filter');
const missableOnlyEl = document.getElementById('missable-only');
const spoilerEl = document.getElementById('spoiler');
const resultCountEl = document.getElementById('result-count');
const progressTextEl = document.getElementById('progress-text');
const progressPctEl = document.getElementById('progress-pct');
const progressFillEl = document.getElementById('progress-fill');
const progressGradesEl = document.getElementById('progress-grades');

let trophies = [];
let earned = new Set();
let spoiler = false;
let selectedId = null;

const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
const KIND_LABEL = {
  platinum: 'Platinum', story: 'Story', side: 'Side stories', collectibles: 'Collectibles',
  activities: 'Activities', crime: 'Crime', money: 'Money', exploration: 'Exploration',
};
const STAGES = [
  { n: 1, title: 'Stage 1 — Play the story', desc: 'Chapters 1–4, the final mission and the named story missions. All 12 story trophies pop as you play. Keep a manual save at the start of each chapter.' },
  { n: 2, title: 'Stage 2 — Side stories & partner', desc: 'The stranger strands and their finales (Andy, Kenton, Billy, Randy, Tyrone, Bret), plus the one missable trophy: do Lucia’s balcony meditation in Chapter 1, before this stage is over.' },
  { n: 3, title: 'Stage 3 — Activities & crime', desc: 'Races, the shooting range, fishing, arcade, bowling, the gym, stunts, challenges — and the robbery set: jewelry stores, bank vaults, armored trucks, illegal operations, the tank and the plane.' },
  { n: 4, title: 'Stage 4 — Collectibles & cleanup', desc: 'Cards, WAiNK tags, vehicles, exploring all 52 areas, the garages — then the 100% completion checklist for A Long Road, and the platinum pops.' },
];

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (raw && Array.isArray(raw.earned)) earned = new Set(raw.earned.filter((id) => Number.isInteger(id)));
    if (raw && typeof raw.spoiler === 'boolean') spoiler = raw.spoiler;
  } catch { earned = new Set(); spoiler = false; }
  spoilerEl.checked = spoiler;
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify({ earned: [...earned].sort((a, b) => a - b), spoiler }));
}

function hiddenBySpoiler(t) {
  return spoiler && t.secret && !earned.has(t.id);
}

function displayName(t) {
  return hiddenBySpoiler(t) ? 'Hidden trophy — earn it to reveal' : t.name;
}

function displayDesc(t) {
  return hiddenBySpoiler(t) ? 'Its name and description stay hidden in spoiler-safe mode until you earn it.' : t.description;
}

function trophyMatches(t) {
  const q = searchEl.value.trim().toLowerCase();
  if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
  if (kindEl.value !== 'all' && t.kind !== kindEl.value) return false;
  if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
  if (earnedFilterEl.value === 'earned' && !earned.has(t.id)) return false;
  if (earnedFilterEl.value === 'unearned' && earned.has(t.id)) return false;
  if (missableOnlyEl.checked && !t.missable) return false;
  return true;
}

function badge(t) {
  return '<span class="badge badge-' + t.grade + '">' + GRADE_LABEL[t.grade] + '</span>';
}

function kindBadge(t) {
  return t.kind !== 'platinum' ? '<span class="badge badge-kind">' + KIND_LABEL[t.kind] + '</span>' : '';
}

function renderProgress() {
  const total = trophies.length;
  const n = earned.size;
  const pct = total ? Math.round((n / total) * 100) : 0;
  progressTextEl.textContent = n + ' of ' + total + ' earned';
  progressPctEl.textContent = pct + '%';
  progressFillEl.style.width = pct + '%';
  const byGrade = {};
  for (const t of trophies) if (earned.has(t.id)) byGrade[t.grade] = (byGrade[t.grade] || 0) + 1;
  progressGradesEl.textContent = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => (byGrade[g] || 0) + ' ' + GRADE_LABEL[g].toLowerCase())
    .join(' · ');
  const missableN = trophies.filter((t) => t.missable).length;
  document.getElementById('missable-count').textContent = missableN;
}

function renderList() {
  const shown = trophies.filter(trophyMatches);
  listEl.replaceChildren();
  resultCountEl.textContent = shown.length + ' of ' + trophies.length + ' trophies shown';
  if (!shown.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'No trophies match these filters. Clear the search or widen the filters.';
    listEl.append(li);
    return;
  }
  for (const t of shown) {
    const li = document.createElement('li');
    li.className = 'trophy' + (earned.has(t.id) ? ' earned' : '') + (selectedId === t.id ? ' selected' : '');
    li.dataset.id = t.id;
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', 'Mark ' + displayName(t) + ' as earned');
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id); else earned.delete(t.id);
      saveState(); renderAll();
    });
    box.addEventListener('click', (e) => e.stopPropagation());
    const main = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'trophy-name';
    name.textContent = displayName(t);
    const desc = document.createElement('div');
    desc.className = 'trophy-desc';
    desc.textContent = '“' + displayDesc(t) + '”';
    const meta = document.createElement('div');
    meta.className = 'trophy-meta';
    meta.innerHTML = badge(t) + kindBadge(t)
      + (t.secret ? '<span class="badge badge-secret">Hidden</span>' : '')
      + (t.missable ? '<span class="badge badge-missable">Missable</span>' : '')
      + (earned.has(t.id) ? '<span class="badge badge-earned">Earned ✓</span>' : '');
    main.append(name, desc, meta);
    const target = document.createElement('span');
    target.className = 'trophy-target';
    target.textContent = t.target ? '0/' + t.target.toLocaleString('en-US') : '';
    li.append(box, main, target);
    li.addEventListener('click', () => { selectedId = t.id; renderAll(); });
    listEl.append(li);
  }
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function renderDetail() {
  const t = trophies.find((x) => x.id === selectedId);
  detailEl.replaceChildren();
  if (!t) {
    detailEl.append(el('p', 'detail-empty', 'Select a trophy on the left to see its guide, steps and sources.'));
    return;
  }
  if (hiddenBySpoiler(t)) {
    detailEl.append(el('h2', null, 'Hidden trophy'));
    detailEl.append(el('p', 'official', 'Spoiler-safe mode hides this trophy until you earn it. Tick its box in the list when it pops, and the guide will open.'));
    return;
  }
  detailEl.append(el('h2', null, t.name));
  const meta = el('div', 'trophy-meta');
  meta.innerHTML = badge(t) + kindBadge(t)
    + (t.secret ? '<span class="badge badge-secret">Hidden</span>' : '')
    + (t.missable ? '<span class="badge badge-missable">Missable</span>' : '');
  detailEl.append(meta);
  detailEl.append(el('p', 'official', 'Official description: “' + t.description + '”'));
  if (t.target) detailEl.append(el('p', 'target-note', 'PlayStation tracks a count for this one: 0/' + t.target.toLocaleString('en-US') + ' — check it in-game under the trophy’s progress.'));
  if (t.missable) {
    const warn = el('div', 'warning');
    warn.innerHTML = '<strong>Missable — read before you play on.</strong> ' + t.guide.split('MISSABLE — read this first:')[1].split('.')[0] + '. See the Missables tab for the full warning.';
    detailEl.append(warn);
  }
  detailEl.append(el('h3', null, 'How to earn it'));
  const steps = el('ol', 'steps');
  for (const s of t.steps) steps.append(el('li', null, s));
  detailEl.append(steps);
  detailEl.append(el('h3', null, 'Sources'));
  const src = el('div', 'sources', 'Each fact above comes from one of these — the official list for the name, description and grade, and the named guides for the how-to. Open a source only by clicking it; this app fetches nothing itself.');
  const ul = el('ul');
  for (const s of t.sources) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.url; a.textContent = s.name; a.target = '_blank'; a.rel = 'noopener';
    li.append(a);
    ul.append(li);
  }
  src.append(ul);
  detailEl.append(src);
  detailEl.append(el('h3', null, 'Guide'));
  detailEl.append(el('p', 'guide', t.guide));
  const actions = el('div', 'detail-actions');
  const toggle = el('button', 'btn btn-primary', earned.has(t.id) ? '✓ Earned — unmark' : 'Mark as earned');
  toggle.type = 'button';
  toggle.addEventListener('click', () => {
    if (earned.has(t.id)) earned.delete(t.id); else earned.add(t.id);
    saveState(); renderAll();
  });
  actions.append(toggle);
  detailEl.append(actions);
}

function renderRoadmap() {
  const host = document.getElementById('roadmap-stages');
  host.replaceChildren();
  for (const stage of STAGES) {
    const list = trophies.filter((t) => t.stage === stage.n);
    const done = list.filter((t) => earned.has(t.id)).length;
    const box = el('section', 'stage');
    const head = el('div', 'stage-head');
    head.append(el('h3', null, stage.title));
    head.append(el('span', 'stage-count', done + ' / ' + list.length + ' earned'));
    box.append(head);
    box.append(el('p', 'stage-desc', stage.desc));
    const chips = el('div', 'stage-trophies');
    for (const t of list) {
      const chip = el('button', 'chip' + (earned.has(t.id) ? ' earned' : ''), displayName(t));
      chip.type = 'button';
      const g = el('span', 'chip-grade', GRADE_LABEL[t.grade]);
      chip.append(g);
      chip.addEventListener('click', () => { selectedId = t.id; showView('guide'); renderAll(); });
      chips.append(chip);
    }
    box.append(chips);
    host.append(box);
  }
}

function renderMissables() {
  const host = document.getElementById('missable-list');
  host.replaceChildren();
  const bad = trophies.filter((t) => t.missable);
  for (const t of bad) {
    const card = el('article', 'missable-card');
    card.append(el('h3', null, '⚠ ' + t.name + ' — the only missable trophy'));
    card.append(el('p', null, 'Official description: “' + t.description + '”'));
    card.append(el('p', null, t.guide));
    const open = el('button', 'btn', 'Open its guide');
    open.type = 'button';
    open.addEventListener('click', () => { selectedId = t.id; showView('guide'); renderAll(); });
    card.append(open);
    host.append(card);
  }
  const safe = el('div', 'safe-note');
  safe.innerHTML = '<h3>Everything else is safe</h3><p>Every other trophy stays available after the credits: side-story finales, activities, collectibles and the 100% checklist. The one habit that still matters is the chapter save — keep a manual save at the start of every chapter and one from just before the final mission, because there is no mission replay and no New Game Plus.</p>';
  host.append(safe);
}

function showView(view) {
  for (const v of ['guide', 'roadmap', 'missables']) {
    document.getElementById('view-' + v).hidden = v !== view;
    document.getElementById('tab-' + v).classList.toggle('active', v === view);
  }
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissables();
}

function download(filename, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

for (const tab of document.querySelectorAll('.tab')) {
  tab.addEventListener('click', () => showView(tab.dataset.view));
}
for (const input of [searchEl, kindEl, gradeEl, earnedFilterEl, missableOnlyEl]) {
  input.addEventListener('input', renderList);
  input.addEventListener('change', renderList);
}
spoilerEl.addEventListener('change', () => { spoiler = spoilerEl.checked; saveState(); renderAll(); });

document.getElementById('export').addEventListener('click', () => {
  download('vice-platinum-progress.json', JSON.stringify({
    app: 'Vice Platinum Guide', game: 'Grand Theft Auto VI', exportedAt: new Date().toISOString(),
    earned: [...earned].sort((a, b) => a - b), spoiler,
  }, null, 2));
});
document.getElementById('import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(ids)) throw new Error('no earned list');
    earned = new Set(ids.filter((id) => Number.isInteger(id) && trophies.some((t) => t.id === id)));
    if (typeof data.spoiler === 'boolean') { spoiler = data.spoiler; spoilerEl.checked = spoiler; }
    saveState(); renderAll();
  } catch {
    alert('That file is not a Vice Platinum Guide progress export.');
  }
  e.target.value = '';
});
document.getElementById('reset').addEventListener('click', () => {
  if (!confirm('Clear all earned trophies in this guide? This cannot be undone.')) return;
  earned = new Set(); selectedId = null; saveState(); renderAll();
});

// Small handle for the maker's own screenshot script (seeds progress, opens views).
window.VPG = {
  get trophies() { return trophies; },
  get earned() { return [...earned]; },
  setEarned(ids) { earned = new Set(ids); saveState(); renderAll(); },
  setSpoiler(v) { spoiler = !!v; spoilerEl.checked = spoiler; saveState(); renderAll(); },
  showView, select(id) { selectedId = id; renderAll(); },
};

loadState();
fetch(DATA_URL)
  .then((r) => { if (!r.ok) throw new Error('trophies.json failed to load'); return r.json(); })
  .then((doc) => {
    trophies = doc.trophies || doc;
    renderAll();
  })
  .catch(() => {
    listEl.replaceChildren();
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Could not load data/trophies.json. Serve the app/ folder over HTTP (for example: cd app && python3 -m http.server) and reload.';
    listEl.append(li);
  });
