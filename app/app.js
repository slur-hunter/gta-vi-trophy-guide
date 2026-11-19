/* GTA VI Trophy Guide — the tracker.
 *
 * One classic script, no libraries, no build step. It fetches the guide's own
 * data file (app/data/trophies.json — the only request the app makes), keeps
 * earned trophies and count progress in localStorage, and renders the
 * checklist, the roadmap, the missable page and the trophy detail pane.
 * Everything it loads lives under app/, so it works with the network off.
 */
'use strict';

var DATA_URL = 'data/trophies.json';
var STORAGE_KEY = 'gta6-trophy-guide-v2';

var KIND_LABELS = {
  story: 'Story',
  strangers: 'Strangers & side',
  collectibles: 'Collectibles',
  activities: 'Activities',
  combat: 'Combat & robberies',
  exploration: 'Exploration',
  money: 'Money & misc'
};

var GRADE_LABELS = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze'
};

/* The seven stages of the roadmap, in the order to play them. */
var STAGES = [
  { n: 1, title: 'Story: Chapters 1–2', text: 'Play the opening and the first two chapters. Three trophies here, all unmissable.' },
  { n: 2, title: 'Story: Chapters 3–4 and the finale', text: 'Finish the story: the last two chapters, the final mission and the six named story missions.' },
  { n: 3, title: 'Strangers and side missions', text: 'Seven stranger strands around Leonida, including the silver for finishing any 8 strands.' },
  { n: 4, title: 'Collectibles', text: 'Meditation spots, card sets and WAiNK It photos. Do the Chapter 1 meditation spot first — it is the one missable trophy.' },
  { n: 5, title: 'Activities', text: 'Stunts, races, the shooting range, fishing, bowling and the arcade. Nine activity types, 50 of 80 challenges.' },
  { n: 6, title: 'Robberies, combat and money', text: 'Vaults, shops, armored trucks, gang operations and the money totals. The longest grind stage.' },
  { n: 7, title: 'Exploration and 100% completion', text: 'See all of Leonida, then finish the 100% checklist. The platinum pops with the last trophy.' }
];

var trophies = [];

var state = {
  earned: {},
  counts: {},
  spoiler: false,
  view: 'checklist',
  selected: null,
  filters: { q: '', kind: 'all', grade: 'all', status: 'all' }
};

function $(id) { return document.getElementById(id); }

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function trophyById(id) {
  for (var i = 0; i < trophies.length; i++) {
    if (trophies[i].id === id) return trophies[i];
  }
  return null;
}

function isEarned(t) { return !!state.earned[t.id]; }

function isHidden(t) {
  return state.spoiler && t.kind === 'story' && !isEarned(t);
}

/* ---- Saved progress (localStorage) ---- */

function loadSaved() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    var saved = JSON.parse(raw);
    if (saved && typeof saved === 'object') {
      if (Array.isArray(saved.earned)) {
        saved.earned.forEach(function (id) { state.earned[id] = true; });
      }
      if (saved.counts && typeof saved.counts === 'object') state.counts = saved.counts;
      if (typeof saved.spoiler === 'boolean') state.spoiler = saved.spoiler;
    }
  } catch (err) {
    /* A corrupt save is ignored: the tracker starts empty rather than dying. */
  }
}

function saveProgress() {
  var earnedIds = [];
  Object.keys(state.earned).forEach(function (id) {
    if (state.earned[id]) earnedIds.push(Number(id));
  });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      earned: earnedIds, counts: state.counts, spoiler: state.spoiler
    }));
  } catch (err) {
    /* Storage full or blocked: the page still works for this visit. */
  }
}

/* ---- Filtering ---- */

function trophyMatches(t) {
  var f = state.filters;
  if (f.kind === 'online') return false;
  if (f.kind === 'missable' && !t.missable) return false;
  if (f.kind !== 'all' && f.kind !== 'missable' && t.kind !== f.kind) return false;
  if (f.grade !== 'all' && t.grade !== f.grade) return false;
  if (f.status === 'earned' && !isEarned(t)) return false;
  if (f.status === 'unearned' && isEarned(t)) return false;
  if (f.q) {
    if (isHidden(t)) return false;
    var hay = (t.name + ' ' + t.description + ' ' + t.guide + ' ' + (KIND_LABELS[t.kind] || '')).toLowerCase();
    if (hay.indexOf(f.q) === -1) return false;
  }
  return true;
}

function visibleTrophies() {
  return trophies.filter(trophyMatches);
}

/* ---- Progress ---- */

function gradeCounts() {
  var counts = { platinum: [0, 0], gold: [0, 0], silver: [0, 0], bronze: [0, 0] };
  trophies.forEach(function (t) {
    if (counts[t.grade]) {
      counts[t.grade][1] += 1;
      if (isEarned(t)) counts[t.grade][0] += 1;
    }
  });
  return counts;
}

function stageProgress(stageNumber) {
  var inStage = trophies.filter(function (t) { return t.stage === stageNumber; });
  var done = inStage.filter(isEarned).length;
  return { done: done, total: inStage.length };
}

function renderProgress() {
  var earnedTotal = trophies.filter(isEarned).length;
  var total = trophies.length;
  $('earned-count').textContent = earnedTotal + ' / ' + total;
  var pct = total ? Math.round((earnedTotal / total) * 100) : 0;
  $('progress-fill').style.width = pct + '%';
  $('progress-bar').setAttribute('aria-valuenow', String(earnedTotal));

  var counts = gradeCounts();
  var html = '';
  ['platinum', 'gold', 'silver', 'bronze'].forEach(function (grade) {
    var pair = counts[grade];
    html += '<span class="grade-count"><span class="dot dot-' + grade + '"></span>' +
      GRADE_LABELS[grade] + ' ' + pair[0] + '/' + pair[1] + '</span>';
  });
  $('grade-counts').innerHTML = html;

  var doneStages = 0;
  var currentStage = null;
  STAGES.forEach(function (stage) {
    var p = stageProgress(stage.n);
    if (p.total > 0 && p.done === p.total) doneStages += 1;
    else if (!currentStage) currentStage = { stage: stage, progress: p };
  });
  var summary = doneStages + ' of 7 roadmap stages complete.';
  if (currentStage) {
    summary += ' Now on Stage ' + currentStage.stage.n + ' — ' + currentStage.stage.title +
      ' (' + currentStage.progress.done + '/' + currentStage.progress.total + ').';
  } else if (earnedTotal === total && total > 0) {
    summary += ' Every stage is done — that is the platinum.';
  }
  $('stage-summary').textContent = summary;
}

/* ---- Display names (the spoiler rule lives in one place) ---- */

function displayName(t) {
  return isHidden(t) ? 'Hidden story trophy' : t.name;
}

function displayDescription(t) {
  return isHidden(t) ? 'Earn this trophy to reveal its name and description.' : t.description;
}

function gradeChip(t) {
  return '<span class="chip chip-' + t.grade + '">' + GRADE_LABELS[t.grade] + '</span>';
}

function kindChip(t) {
  return '<span class="chip chip-kind">' + (KIND_LABELS[t.kind] || t.kind) + '</span>';
}

function countChip(t) {
  if (!t.count) return '';
  var have = state.counts[t.id] || 0;
  return '<span class="chip chip-count">' + have + ' / ' + t.count + ' ' + (t.countUnit || '') + '</span>';
}

/* ---- Checklist ---- */

function renderList() {
  var list = $('trophy-list');
  var empty = $('list-empty');
  var shown = visibleTrophies();
  var html = '';
  shown.forEach(function (t) {
    var earned = isEarned(t);
    var hidden = isHidden(t);
    var classes = 'trophy-row grade-' + t.grade +
      (earned ? ' earned' : '') +
      (state.selected === t.id ? ' selected' : '');
    html += '<li class="' + classes + '" data-id="' + t.id + '">' +
      '<input type="checkbox" class="trophy-check" ' + (earned ? 'checked' : '') +
      ' aria-label="Mark ' + esc(displayName(t)) + ' as earned">' +
      '<span class="trophy-name">' + esc(displayName(t)) +
      (earned ? ' <span class="earned-mark" title="Earned">&#10003;</span>' : '') + '</span>' +
      '<span class="trophy-desc">' + esc(displayDescription(t)) + '</span>' +
      '<span class="trophy-meta">' + gradeChip(t) + kindChip(t) +
      (t.missable ? '<span class="chip chip-missable">Missable</span>' : '') +
      (hidden ? '<span class="chip chip-kind">Hidden</span>' : '') +
      (hidden ? '' : countChip(t)) + '</span>' +
      '<span class="trophy-kind-side">#' + t.id + '</span></li>';
  });
  list.innerHTML = html;
  if (state.filters.kind === 'online') {
    empty.hidden = false;
    empty.textContent = 'No online trophies — all 55 trophies are single-player. Nothing to track here.';
  } else if (shown.length === 0) {
    empty.hidden = false;
    empty.textContent = 'No trophies match these filters. Try clearing the search or a filter.';
  } else {
    empty.hidden = true;
  }
}

/* ---- Detail pane ---- */

function sourceListHtml(t) {
  var html = '';
  (t.sources || []).forEach(function (source) {
    if (source.url) {
      html += '<li><a href="' + esc(source.url) + '" target="_blank" rel="noopener">' + esc(source.label) + '</a></li>';
    } else {
      html += '<li>' + esc(source.label) + '</li>';
    }
  });
  return html;
}

function renderDetail() {
  var box = $('detail-body');
  var t = state.selected ? trophyById(state.selected) : null;
  if (!t) {
    box.innerHTML = '<div class="detail-placeholder"><h2>Pick a trophy</h2>' +
      '<p>Click any trophy in the checklist to see its guide here: what to do, the steps, and the sources behind each fact.</p>' +
      '<p><strong>Start with the missable one:</strong> Positive Mental Attitude is the only trophy that can be missed. Its Chapter 1 meditation spot is reported to disappear after the chapter, so do it the moment it is offered — and keep a manual save at the start of every chapter.</p>' +
      '<p>Your progress is saved in this browser automatically. Use Export progress to keep a backup file.</p></div>';
    return;
  }
  if (isHidden(t)) {
    box.innerHTML = '<h2>Hidden story trophy</h2>' +
      '<p class="detail-official">This is a story trophy. Turn off "Hide story spoilers" to see its name and description, or earn it in the game to reveal it here.</p>' +
      '<p class="detail-note">Grade: ' + GRADE_LABELS[t.grade] + ' &middot; Trophy #' + t.id + '</p>';
    return;
  }
  var html = '<h2>' + esc(t.name) + '</h2>' +
    '<p class="trophy-meta">' + gradeChip(t) + kindChip(t) +
    (t.missable ? '<span class="chip chip-missable">Missable</span>' : '') + '</p>' +
    '<p class="detail-official"><strong>Official description:</strong> ' + esc(t.description) + '</p>';
  if (t.missable) {
    html += '<p class="missable-warning"><strong>Missable.</strong> ' +
      'The Chapter 1 meditation spot is reported to disappear after the chapter, and there is no mission replay. ' +
      'Meditate at the spot the moment it is offered, and keep a manual save at the start of every chapter.</p>';
  }
  html += '<p class="detail-guide">' + esc(t.guide) + '</p>';
  if (t.steps && t.steps.length) {
    html += '<h3>Steps</h3><ol class="detail-steps">';
    t.steps.forEach(function (step) { html += '<li>' + esc(step) + '</li>'; });
    html += '</ol>';
  }
  if (t.count) {
    var have = state.counts[t.id] || 0;
    html += '<div class="count-box"><span class="count-label">Your count</span>' +
      '<button type="button" class="count-btn" data-action="count-minus" data-id="' + t.id + '" aria-label="Decrease count">&minus;</button>' +
      '<span class="count-value">' + have + ' / ' + t.count + ' ' + esc(t.countUnit || '') + '</span>' +
      '<button type="button" class="count-btn" data-action="count-plus" data-id="' + t.id + '" aria-label="Increase count">+</button>' +
      '<input type="number" class="count-input" data-action="count-input" data-id="' + t.id + '" value="' + have +
      '" min="0" max="' + t.count + '" aria-label="Your count so far"></div>';
  }
  html += '<h3>Sources</h3><ul class="detail-sources">' + sourceListHtml(t) + '</ul>' +
    '<p class="detail-note">Guide text is written for this guide, in our own words. A source is cited, never copied. ' +
    'Steps marked reported or unverified come from launch guides, not from the game itself.</p>' +
    '<div class="detail-actions"><button type="button" class="btn ' + (isEarned(t) ? 'btn-quiet' : 'btn-accent') +
    '" data-action="toggle-earned" data-id="' + t.id + '">' +
    (isEarned(t) ? 'Mark as not earned' : 'Mark as earned') + '</button></div>';
  box.innerHTML = html;
}

/* ---- Roadmap ---- */

function renderRoadmap() {
  var html = '';
  STAGES.forEach(function (stage) {
    var p = stageProgress(stage.n);
    var pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
    html += '<article class="stage-card"><div class="stage-head"><h3>Stage ' + stage.n + ' — ' + esc(stage.title) + '</h3>' +
      '<span class="stage-count">' + p.done + ' / ' + p.total + ' earned</span></div>' +
      '<div class="stage-bar"><div class="stage-bar-fill" style="width: ' + pct + '%"></div></div>' +
      '<p>' + esc(stage.text) + '</p><ul class="stage-trophies">';
    trophies.filter(function (t) { return t.stage === stage.n; }).forEach(function (t) {
      html += '<li><button type="button" data-stage-trophy="' + t.id + '"' +
        (isEarned(t) ? ' class="done"' : '') + '>' +
        (isEarned(t) ? '✓ ' : '') + esc(displayName(t)) + '</button></li>';
    });
    html += '</ul></article>';
  });
  $('stage-list').innerHTML = html;
}

/* ---- Missable page ---- */

function renderMissable() {
  var missed = trophies.filter(function (t) { return t.missable; });
  var html = '';
  missed.forEach(function (t) {
    html += '<article class="trophy-row grade-' + t.grade + (isEarned(t) ? ' earned' : '') + '" data-id="' + t.id + '">' +
      '<input type="checkbox" class="trophy-check" ' + (isEarned(t) ? 'checked' : '') +
      ' aria-label="Mark ' + esc(t.name) + ' as earned">' +
      '<span class="trophy-name">' + esc(t.name) + (isEarned(t) ? ' <span class="earned-mark">&#10003;</span>' : '') + '</span>' +
      '<span class="trophy-desc">' + esc(t.description) + '</span>' +
      '<span class="trophy-meta">' + gradeChip(t) + kindChip(t) +
      '<span class="chip chip-missable">Missable</span>' + countChip(t) + '</span>' +
      '<span class="trophy-kind-side">#' + t.id + '</span></article>';
  });
  if (!missed.length) html = '<p class="empty-state">No missable trophies are flagged in this list.</p>';
  $('missable-list').innerHTML = html;
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissable();
}

/* ---- Views ---- */

function setView(view) {
  state.view = view;
  document.body.setAttribute('data-view', view);
  ['checklist', 'roadmap', 'missable', 'about'].forEach(function (v) {
    $('view-' + v).hidden = (v !== view);
  });
  document.querySelectorAll('#view-tabs .tab').forEach(function (button) {
    var active = button.getAttribute('data-view') === view;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
}

function selectTrophy(id) {
  state.selected = id;
  renderList();
  renderDetail();
  var row = document.querySelector('.trophy-row[data-id="' + id + '"]');
  if (row) row.scrollIntoView({ block: 'nearest' });
}

function toggleEarned(id) {
  if (state.earned[id]) delete state.earned[id];
  else state.earned[id] = true;
  saveProgress();
  renderAll();
}

function setCount(id, value) {
  var t = trophyById(id);
  if (!t || !t.count) return;
  var clamped = Math.max(0, Math.min(t.count, Math.round(value) || 0));
  state.counts[id] = clamped;
  saveProgress();
  renderAll();
}

/* ---- Export and import ---- */

function downloadExport() {
  var earnedIds = [];
  Object.keys(state.earned).forEach(function (id) {
    if (state.earned[id]) earnedIds.push(Number(id));
  });
  var payload = {
    app: 'gta6-trophy-guide',
    version: 2,
    exportedAt: new Date().toISOString(),
    earned: earnedIds,
    counts: state.counts,
    spoiler: state.spoiler
  };
  var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url;
  link.download = 'gta6-trophy-progress.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

function importFile(file) {
  var reader = new FileReader();
  reader.onload = function () {
    try {
      var data = JSON.parse(String(reader.result));
      if (!data || !Array.isArray(data.earned)) throw new Error('bad file');
      var fresh = {};
      var imported = 0;
      data.earned.forEach(function (id) {
        if (typeof id === 'number' && id >= 1 && id <= 55) { fresh[id] = true; imported += 1; }
      });
      var freshCounts = {};
      if (data.counts && typeof data.counts === 'object') {
        Object.keys(data.counts).forEach(function (id) {
          var t = trophyById(Number(id));
          if (t && t.count) freshCounts[id] = Math.max(0, Math.min(t.count, Number(data.counts[id]) || 0));
        });
      }
      state.earned = fresh;
      state.counts = freshCounts;
      if (typeof data.spoiler === 'boolean') {
        state.spoiler = data.spoiler;
        $('spoiler-toggle').checked = data.spoiler;
      }
      saveProgress();
      renderAll();
      alert('Imported ' + imported + ' earned trophies.');
    } catch (err) {
      alert('That file is not a progress export from this guide.');
    }
  };
  reader.readAsText(file);
}

/* ---- Deep links (?view= &trophy= &kind= &spoiler=) ---- */

function applyParams() {
  var params = new URLSearchParams(window.location.search);
  var view = params.get('view');
  if (view === 'roadmap' || view === 'missable' || view === 'about' || view === 'checklist') setView(view);
  var kind = params.get('kind');
  if (kind) {
    state.filters.kind = kind;
    $('kind-filter').value = kind;
  }
  var grade = params.get('grade');
  if (grade) {
    state.filters.grade = grade;
    $('grade-filter').value = grade;
  }
  var spoiler = params.get('spoiler');
  if (spoiler === 'on') {
    state.spoiler = true;
    $('spoiler-toggle').checked = true;
  }
  var trophy = Number(params.get('trophy'));
  if (trophy >= 1 && trophy <= 55) state.selected = trophy;
}

/* ---- Wiring and start ---- */

function wireEvents() {
  document.querySelectorAll('#view-tabs .tab').forEach(function (button) {
    button.addEventListener('click', function () { setView(button.getAttribute('data-view')); });
  });
  $('search-input').addEventListener('input', function (event) {
    state.filters.q = event.target.value.trim().toLowerCase();
    renderList();
  });
  $('kind-filter').addEventListener('change', function (event) {
    state.filters.kind = event.target.value;
    renderList();
  });
  $('grade-filter').addEventListener('change', function (event) {
    state.filters.grade = event.target.value;
    renderList();
  });
  $('status-filter').addEventListener('change', function (event) {
    state.filters.status = event.target.value;
    renderList();
  });
  $('spoiler-toggle').addEventListener('change', function (event) {
    state.spoiler = event.target.checked;
    saveProgress();
    renderAll();
  });
  $('export-btn').addEventListener('click', downloadExport);
  $('import-file').addEventListener('change', function (event) {
    if (event.target.files && event.target.files[0]) importFile(event.target.files[0]);
    event.target.value = '';
  });
  $('clear-btn').addEventListener('click', function () {
    if (window.confirm('Clear all earned trophies and counts?')) {
      state.earned = {};
      state.counts = {};
      saveProgress();
      renderAll();
    }
  });

  $('trophy-list').addEventListener('click', function (event) {
    var row = event.target.closest('.trophy-row');
    if (!row) return;
    var id = Number(row.getAttribute('data-id'));
    if (event.target.classList.contains('trophy-check')) toggleEarned(id);
    else selectTrophy(id);
  });
  $('missable-list').addEventListener('click', function (event) {
    var card = event.target.closest('.trophy-row');
    if (!card) return;
    var id = Number(card.getAttribute('data-id'));
    if (event.target.classList.contains('trophy-check')) toggleEarned(id);
    else { setView('checklist'); selectTrophy(id); }
  });
  $('stage-list').addEventListener('click', function (event) {
    var button = event.target.closest('[data-stage-trophy]');
    if (!button) return;
    setView('checklist');
    selectTrophy(Number(button.getAttribute('data-stage-trophy')));
  });
  $('detail-body').addEventListener('click', function (event) {
    var target = event.target.closest('[data-action]');
    if (!target) return;
    var id = Number(target.getAttribute('data-id'));
    var action = target.getAttribute('data-action');
    if (action === 'toggle-earned') toggleEarned(id);
    else if (action === 'count-plus') setCount(id, (state.counts[id] || 0) + 1);
    else if (action === 'count-minus') setCount(id, (state.counts[id] || 0) - 1);
  });
  $('detail-body').addEventListener('change', function (event) {
    var target = event.target.closest('[data-action="count-input"]');
    if (!target) return;
    setCount(Number(target.getAttribute('data-id')), Number(target.value));
  });
}

wireEvents();
loadSaved();
$('spoiler-toggle').checked = state.spoiler;

fetch(DATA_URL)
  .then(function (response) {
    if (!response.ok) throw new Error('could not load ' + DATA_URL);
    return response.json();
  })
  .then(function (data) {
    trophies = Array.isArray(data) ? data : (data.trophies || []);
    applyParams();
    renderAll();
  })
  .catch(function () {
    $('list-empty').hidden = false;
    $('list-empty').textContent = 'The trophy data could not be loaded. Check that app/data/trophies.json is present and try again.';
  });
