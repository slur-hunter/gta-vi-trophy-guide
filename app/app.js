// GTA VI Trophy Guide: checklist tracker + roadmap + cited guides.
// Data lives in data/trophies.json (55 trophies, official names/descriptions/grades,
// our own guides with sources, kind, missable flag, roadmap stage). Progress is kept
// in localStorage under KEY and can be exported to a file and imported back.
const KEY = 'gta6-trophy-checklist';
const SPOILER_KEY = 'gta6-trophy-spoilers';

const ROADMAP = [
  { stage: 1, title: 'Story — Chapters 1–4 and the finale', note: 'Play the story in order. Keep a manual save at the start of every chapter and one before the final mission: no mission replay is reported. Earns the 12 chapter and mission trophies plus the gold for the final mission.' },
  { stage: 2, title: 'Strangers & side missions', note: 'Finish 8 stranger strands, including the final missions for Andy, Kenton, Billy, Randy, Tyrone and Bret’s hunt. Stranger markers appear as you explore Leonida.' },
  { stage: 3, title: 'Collectibles & exploration', note: 'Meditate at all 18 spots (do Lucia’s balcony in Chapter 1 — it is the one missable trophy), complete 3 card sets, WAiNK 100 locations, discover 100 vehicles and explore all 52 areas of Leonida.' },
  { stage: 4, title: 'Activities & challenges', note: '250 stunts, 42 gold Shooting Range challenges, 14 drone race wins, 20 race wins, the fishing challenge against Cal, one arcade game — and 50 challenges along the way.' },
  { stage: 5, title: 'Combat, wanted & robberies', note: 'Partner wanted-level escapes, shop and bank robberies, the armored truck, the VCIA departure, gang operations and the melee drive-by.' },
  { stage: 6, title: 'Money, property & cleanup', note: 'Launder $250,000 of Marked Bills, spend $100,000 in shops, buy all 8 garages, register 10 vehicles with Scooter Bros — and mop up the vague ones (choices, second tries, strange sights) as they pop.' },
  { stage: 7, title: '100% completion, then the platinum', note: 'Sweep the in-game 100% checklist for A Long Road (gold). The platinum, Vice Got a Price!, unlocks automatically once the other 54 are earned.' },
];

const KIND_LABELS = {
  story: 'Story', side: 'Strangers & side', collectibles: 'Collectibles',
  activities: 'Activities', combat: 'Combat & robberies', exploration: 'Exploration',
  misc: 'Money & misc',
};

const rowsEl = document.getElementById('rows');
const detailEl = document.getElementById('detail');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kind');
const gradeEl = document.getElementById('grade');
const statusEl = document.getElementById('status');
const spoilerEl = document.getElementById('spoilers');

let earned = new Set();
try { earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]')); } catch { earned = new Set(); }
spoilerEl.checked = localStorage.getItem(SPOILER_KEY) === '1';

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));
let selectedId = null;

function save() {
  localStorage.setItem(KEY, JSON.stringify([...earned]));
}

function gradeLabel(g) { return g[0].toUpperCase() + g.slice(1); }

function isHiddenBySpoiler(t) {
  return spoilerEl.checked && t.kind === 'story' && !earned.has(t.id);
}

function sourceLink(key) {
  const s = doc.sources_index[key];
  if (!s) return key;
  if (s.url) {
    const a = document.createElement('a');
    a.href = s.url; a.target = '_blank'; a.rel = 'noopener';
    a.textContent = s.name;
    return a;
  }
  return document.createTextNode(s.name);
}

function renderProgress() {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  const totals = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) {
    totals[t.grade] += 1;
    if (earned.has(t.id)) counts[t.grade] += 1;
  }
  document.getElementById('progressText').textContent = `${earned.size} of ${trophies.length} earned`;
  document.getElementById('progressFill').style.width = `${(earned.size / trophies.length) * 100}%`;
  document.getElementById('progressDetail').textContent =
    `Platinum ${counts.platinum}/${totals.platinum} · Gold ${counts.gold}/${totals.gold} · Silver ${counts.silver}/${totals.silver} · Bronze ${counts.bronze}/${totals.bronze}`;
}

function renderRoadmap() {
  const ol = document.getElementById('roadmapStages');
  ol.replaceChildren();
  for (const r of ROADMAP) {
    const done = trophies.filter((t) => t.roadmap_stage === r.stage && earned.has(t.id)).length;
    const total = trophies.filter((t) => t.roadmap_stage === r.stage).length;
    const li = document.createElement('li');
    const h = document.createElement('h3');
    h.textContent = `Stage ${r.stage} — ${r.title}`;
    const p = document.createElement('p');
    p.textContent = r.note;
    const meta = document.createElement('p');
    meta.className = 'stage-meta';
    meta.textContent = `${done} of ${total} trophies earned in this stage`;
    li.append(h, p, meta);
    ol.append(li);
  }
}

function renderSources() {
  const ul = document.getElementById('sourceList');
  ul.replaceChildren();
  for (const key of Object.keys(doc.sources_index)) {
    const li = document.createElement('li');
    li.append(sourceLink(key));
    ul.append(li);
  }
}

function visibleTrophies() {
  const q = searchEl.value.trim().toLowerCase();
  return trophies.filter((t) => {
    if (kindEl.value === 'missable' && !t.missable) return false;
    if (kindEl.value === 'online') return false;
    if (kindEl.value !== 'all' && kindEl.value !== 'missable' && t.kind !== kindEl.value) return false;
    if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
    if (statusEl.value === 'earned' && !earned.has(t.id)) return false;
    if (statusEl.value === 'todo' && earned.has(t.id)) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.guide.toLowerCase().includes(q))) return false;
    return true;
  });
}

function renderList() {
  const list = visibleTrophies();
  rowsEl.replaceChildren();
  const emptyEl = document.getElementById('empty');
  if (kindEl.value === 'online') {
    emptyEl.hidden = false;
    emptyEl.textContent = 'No online trophies: all 55 trophies are single-player. Nothing here needs GTA Online or any online mode.';
  } else if (list.length === 0) {
    emptyEl.hidden = false;
    emptyEl.textContent = 'No trophies match these filters.';
  } else {
    emptyEl.hidden = true;
  }
  document.getElementById('listMeta').textContent = `Showing ${list.length} of ${trophies.length} trophies`;
  for (const t of list) {
    const li = document.createElement('li');
    li.className = 'row' + (earned.has(t.id) ? ' earned' : '') + (selectedId === t.id ? ' selected' : '');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${t.name} as earned`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id); else earned.delete(t.id);
      save(); renderAll();
    });
    const body = document.createElement('button');
    body.type = 'button';
    body.className = 'row-body';
    body.addEventListener('click', () => {
      selectedId = t.id;
      renderAll();
      detailEl.scrollIntoView({ block: 'nearest' });
    });
    const name = document.createElement('span');
    name.className = 't-name';
    const desc = document.createElement('span');
    desc.className = 't-desc';
    const hidden = isHiddenBySpoiler(t);
    name.textContent = hidden ? 'Hidden story trophy — earn it to reveal' : t.name;
    desc.textContent = hidden ? 'Spoilers hidden until earned.' : t.description;
    const badges = document.createElement('span');
    badges.className = 'badges';
    const g = document.createElement('span');
    g.className = `grade grade-${t.grade}`;
    g.textContent = gradeLabel(t.grade);
    badges.append(g);
    const k = document.createElement('span');
    k.className = 'kind';
    k.textContent = KIND_LABELS[t.kind] ?? t.kind;
    badges.append(k);
    if (t.missable) {
      const m = document.createElement('span');
      m.className = 'missable';
      m.textContent = 'Missable';
      badges.append(m);
    }
    body.append(name, desc, badges);
    li.append(box, body);
    rowsEl.append(li);
  }
}

function renderDetail() {
  detailEl.replaceChildren();
  if (selectedId == null) {
    const p = document.createElement('p');
    p.className = 'detail-empty';
    p.textContent = 'Pick a trophy above to see its guide, steps and sources.';
    detailEl.append(p);
    return;
  }
  const t = byId.get(selectedId);
  if (!t) return;
  const hidden = isHiddenBySpoiler(t);
  const h = document.createElement('h2');
  h.textContent = hidden ? 'Hidden story trophy' : t.name;
  const meta = document.createElement('p');
  meta.className = 'detail-meta';
  meta.textContent = hidden
    ? 'Spoilers hidden until earned — tick it off once you have earned it.'
    : `${gradeLabel(t.grade)} · ${KIND_LABELS[t.kind] ?? t.kind} · Roadmap stage ${t.roadmap_stage}${t.missable ? ' · Missable' : ''}`;
  detailEl.append(h, meta);
  if (!hidden) {
    const desc = document.createElement('p');
    desc.className = 'official';
    desc.textContent = `Official description: “${t.description}”`;
    const guide = document.createElement('p');
    guide.className = 'guide';
    guide.textContent = t.guide;
    detailEl.append(desc, guide);
    if (t.steps?.length) {
      const sh = document.createElement('h3');
      sh.textContent = 'Steps';
      const ol = document.createElement('ol');
      for (const s of t.steps) {
        const li = document.createElement('li');
        li.textContent = s;
        ol.append(li);
      }
      detailEl.append(sh, ol);
    }
    const sh = document.createElement('h3');
    sh.textContent = 'Sources';
    const ul = document.createElement('ul');
    for (const key of t.sources) {
      const li = document.createElement('li');
      li.append(sourceLink(key));
      ul.append(li);
    }
    detailEl.append(sh, ul);
  }
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.textContent = earned.has(t.id) ? 'Mark as not earned' : 'Mark as earned';
  toggle.addEventListener('click', () => {
    if (earned.has(t.id)) earned.delete(t.id); else earned.add(t.id);
    save(); renderAll();
  });
  detailEl.append(toggle);
}

function renderAll() {
  renderProgress();
  renderRoadmap();
  renderList();
  renderDetail();
}

document.getElementById('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned].sort((x, y) => x - y) }, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
});
document.getElementById('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    const next = new Set(ids.filter((id) => byId.has(id)));
    earned = next;
    save();
    renderAll();
  } catch {
    alert('That file is not a valid progress export.');
  }
});
for (const el of [searchEl, kindEl, gradeEl, statusEl]) el.addEventListener('input', renderAll);
spoilerEl.addEventListener('change', () => {
  localStorage.setItem(SPOILER_KEY, spoilerEl.checked ? '1' : '0');
  renderAll();
});

renderSources();
renderAll();
