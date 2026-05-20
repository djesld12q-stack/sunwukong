/**
 * editor.js — Панель редагування для власника sun69wukong
 * Використовує GitHub API для збереження змін прямо на GitHub Pages
 *
 * НАЛАШТУВАННЯ: встав свій GitHub токен (Settings → Developer → Personal access tokens → repo scope)
 */

const EDITOR_CONFIG = {
  repo:   'djesld12q-stack/sunwukong',   // owner/repo
  branch: 'main',
  token:  '',   // ← GitHub Personal Access Token (repo scope)
                // Отримай: https://github.com/settings/tokens → Generate new token (classic) → repo ✅
};

// ─────────────────────────────────────────────────────────────────────────────
//  ВИЗНАЧЕННЯ ПОЛІВ ДЛЯ КОЖНОЇ СТОРІНКИ
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_SCHEMAS = {

  'clips.html': {
    label:   'КЛІП',
    varName: 'CLIPS',
    fields: [
      { key: 'title',    label: 'Назва',         type: 'text',   required: true  },
      { key: 'clipId',   label: 'Clip ID',        type: 'text',   required: true,
        hint: 'Частина URL після останнього /  напр. AbcDefGhi123' },
      { key: 'thumb',    label: 'Прев\'ю URL',    type: 'text',   required: false },
      { key: 'game',     label: 'Гра',            type: 'text',   required: false },
      { key: 'views',    label: 'Переглядів',     type: 'number', required: false },
      { key: 'duration', label: 'Тривалість (сек)',type:'number', required: false },
      { key: 'date',     label: 'Дата (дд.мм.рррр)', type: 'text', required: false },
    ],
  },

  'donators.html': {
    label:   'ДОНАТЕР',
    varName: 'DONATORS',
    fields: [
      { key: 'name',   label: 'Нік',            type: 'text',   required: true  },
      { key: 'amount', label: 'Сума (₴)',        type: 'number', required: true  },
      { key: 'label',  label: 'Підпис (необов.)',type: 'text',   required: false },
      { key: 'img',    label: 'Аватарка URL',    type: 'text',   required: false },
    ],
  },

  'scripts.html': {
    label:   'СКРИПТ',
    varName: 'SCRIPTS',
    fields: [
      { key: 'name', label: 'Назва',       type: 'text', required: true  },
      { key: 'desc', label: 'Опис',        type: 'text', required: true  },
      { key: 'img',  label: 'Зображення URL', type: 'text', required: false },
      { key: 'url',  label: 'Посилання',   type: 'text', required: true  },
    ],
  },

  'stream.html': {
    label:   'СТРІМЕР',
    varName: 'STREAMERS',
    fields: [
      { key: 'name',   label: 'Нік',             type: 'text', required: true  },
      { key: 'url',    label: 'Twitch URL',       type: 'text', required: true  },
      { key: 'avatar', label: 'Аватарка URL',     type: 'text', required: false },
      { key: 'twitch', label: 'Twitch логін',     type: 'text', required: false,
        hint: 'Тільки логін без URL, для прев\'ю трансляції' },
    ],
  },

  'games.html': {
    label:   'ГРА',
    varName: '__HTML_GAMES__',   // спеціальний режим — HTML-рядки
    fields: [
      { key: 'title',  label: 'Назва гри',    type: 'text',   required: true  },
      { key: 'img',    label: 'Обкладинка URL', type: 'text', required: true  },
      { key: 'status', label: 'Статус',        type: 'select', required: true,
        options: ['played','playing','planned'] },
      { key: 'rating', label: 'Оцінка (1-10)', type: 'number', required: false },
      { key: 'review', label: 'Відгук',        type: 'textarea', required: false },
    ],
  },

  'links.html': {
    label:   'ПОСИЛАННЯ',
    varName: '__HTML_LINKS__',
    fields: [
      { key: 'name',   label: 'Назва',    type: 'text', required: true  },
      { key: 'handle', label: 'Підпис',   type: 'text', required: false },
      { key: 'url',    label: 'URL',      type: 'text', required: true  },
      { key: 'icon',   label: 'Emoji або URL іконки', type: 'text', required: false },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  CSS ПАНЕЛІ
// ─────────────────────────────────────────────────────────────────────────────
function _injectEditorCSS() {
  if (document.getElementById('editor-css')) return;
  const style = document.createElement('style');
  style.id = 'editor-css';
  style.textContent = `
    /* ── КНОПКА РЕДАГУВАТИ ── */
    #editor-fab {
      position: fixed; bottom: 28px; right: 28px; z-index: 9000;
      display: flex; align-items: center; gap: 8px;
      padding: 11px 20px; border-radius: 30px;
      background: #9146FF; color: #fff; border: none; cursor: pointer;
      font-family: 'Bebas Neue', 'Rajdhani', sans-serif;
      font-size: 14px; letter-spacing: 2px;
      box-shadow: 0 4px 24px rgba(145,70,255,.5);
      transition: transform .2s, box-shadow .2s;
    }
    #editor-fab:hover { transform: translateY(-3px); box-shadow: 0 8px 36px rgba(145,70,255,.7); }
    #editor-fab:active { transform: scale(.96); }

    /* ── OVERLAY ── */
    #editor-overlay {
      display: none; position: fixed; inset: 0; z-index: 9100;
      background: rgba(4,4,12,.85); backdrop-filter: blur(8px);
      align-items: center; justify-content: center;
    }
    #editor-overlay.open { display: flex; }

    /* ── МОДАЛЬНЕ ВІКНО ── */
    #editor-modal {
      background: #0d0d1e; border: 1px solid rgba(145,70,255,.35);
      border-radius: 14px; width: 92vw; max-width: 680px;
      max-height: 88vh; display: flex; flex-direction: column;
      box-shadow: 0 0 80px rgba(145,70,255,.2);
      font-family: 'Rajdhani', sans-serif;
    }

    /* ── ШАПКА ── */
    #editor-modal .em-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 22px; border-bottom: 1px solid rgba(145,70,255,.18);
      flex-shrink: 0;
    }
    #editor-modal .em-head h2 {
      font-family: 'Bebas Neue', sans-serif; font-size: 20px;
      letter-spacing: 3px; color: #9146FF; margin: 0;
    }
    #editor-modal .em-close {
      background: none; border: none; color: #6e6e90; font-size: 20px;
      cursor: pointer; padding: 4px; line-height: 1; transition: color .2s;
    }
    #editor-modal .em-close:hover { color: #ff4d4d; }

    /* ── ТІЛО ── */
    #editor-body {
      overflow-y: auto; padding: 18px 22px; flex: 1;
    }

    /* ── СПИСОК ЕЛЕМЕНТІВ ── */
    .em-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px; border-radius: 8px;
      background: rgba(145,70,255,.06); border: 1px solid rgba(145,70,255,.12);
      margin-bottom: 8px; cursor: default;
    }
    .em-item-name {
      flex: 1; font-size: 14px; font-weight: 600; color: #eeeef8;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .em-item-sub {
      font-family: 'JetBrains Mono', monospace; font-size: 10px;
      color: #6e6e90; margin-left: 4px;
    }
    .em-btn-del {
      background: none; border: 1px solid rgba(255,77,77,.3); color: #ff4d4d;
      border-radius: 5px; padding: 4px 10px; font-size: 11px; cursor: pointer;
      font-family: 'JetBrains Mono', monospace; letter-spacing: 1px;
      transition: background .2s, border-color .2s; white-space: nowrap; flex-shrink: 0;
    }
    .em-btn-del:hover { background: rgba(255,77,77,.1); border-color: rgba(255,77,77,.6); }

    /* ── ФОРМА ДОДАВАННЯ ── */
    .em-add-section {
      margin-top: 20px; padding-top: 18px;
      border-top: 1px solid rgba(145,70,255,.15);
    }
    .em-add-title {
      font-family: 'Bebas Neue', sans-serif; font-size: 15px;
      letter-spacing: 2px; color: #9146FF; margin-bottom: 14px;
    }
    .em-field { margin-bottom: 12px; }
    .em-field label {
      display: block; font-size: 11px; font-weight: 700;
      letter-spacing: 1.5px; text-transform: uppercase; color: #6e6e90; margin-bottom: 5px;
    }
    .em-field label span { color: #ff4d4d; }
    .em-field input, .em-field select, .em-field textarea {
      width: 100%; background: rgba(145,70,255,.07); border: 1px solid rgba(145,70,255,.25);
      border-radius: 6px; color: #eeeef8; padding: 9px 12px;
      font-family: 'JetBrains Mono', monospace; font-size: 12px;
      outline: none; transition: border-color .2s; box-sizing: border-box;
    }
    .em-field input:focus, .em-field select:focus, .em-field textarea:focus {
      border-color: rgba(145,70,255,.7);
    }
    .em-field textarea { resize: vertical; min-height: 70px; }
    .em-field select option { background: #0d0d1e; }
    .em-field-hint { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #6e6e90; margin-top: 4px; }

    /* ── ПІДВАЛ ФОРМИ ── */
    .em-add-row { display: flex; gap: 10px; margin-top: 16px; }
    .em-btn-add {
      flex: 1; padding: 11px; border-radius: 7px;
      background: #9146FF; color: #fff; border: none; cursor: pointer;
      font-family: 'Bebas Neue', sans-serif; font-size: 15px; letter-spacing: 2px;
      transition: opacity .2s, transform .15s;
    }
    .em-btn-add:hover { opacity: .85; transform: translateY(-1px); }
    .em-btn-add:disabled { opacity: .4; cursor: not-allowed; transform: none; }

    /* ── СТАТУС ── */
    #em-status {
      margin: 10px 0 0; padding: 9px 14px; border-radius: 7px;
      font-family: 'JetBrains Mono', monospace; font-size: 11px;
      display: none; letter-spacing: .5px;
    }
    #em-status.ok   { background: rgba(0,200,100,.1); border: 1px solid rgba(0,200,100,.3); color: #00c864; display: block; }
    #em-status.err  { background: rgba(255,77,77,.1);  border: 1px solid rgba(255,77,77,.3);  color: #ff4d4d; display: block; }
    #em-status.info { background: rgba(145,70,255,.1); border: 1px solid rgba(145,70,255,.3); color: #b489ff; display: block; }

    /* ── ТОКЕН-СЕКЦІЯ ── */
    #em-token-section {
      padding: 16px; border-radius: 8px; margin-bottom: 14px;
      background: rgba(255,170,0,.06); border: 1px solid rgba(255,170,0,.2);
    }
    #em-token-section label {
      display: block; font-size: 11px; font-weight: 700; letter-spacing: 1.5px;
      text-transform: uppercase; color: #ffaa00; margin-bottom: 8px;
    }
    #em-token-section p {
      font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #6e6e90;
      margin: 0 0 8px; line-height: 1.5;
    }
    #em-token-input {
      width: 100%; background: rgba(0,0,0,.3); border: 1px solid rgba(255,170,0,.3);
      border-radius: 6px; color: #eeeef8; padding: 9px 12px;
      font-family: 'JetBrains Mono', monospace; font-size: 12px;
      outline: none; box-sizing: border-box;
    }
    #em-token-save {
      margin-top: 8px; padding: 7px 16px; border-radius: 5px;
      background: rgba(255,170,0,.15); color: #ffaa00; border: 1px solid rgba(255,170,0,.3);
      cursor: pointer; font-family: 'JetBrains Mono', monospace; font-size: 11px;
      letter-spacing: 1px; transition: background .2s;
    }
    #em-token-save:hover { background: rgba(255,170,0,.25); }

    @media(max-width: 480px) {
      #editor-modal { max-height: 96vh; }
      #editor-fab { bottom: 16px; right: 16px; padding: 10px 16px; font-size: 12px; }
    }
  `;
  document.head.appendChild(style);
}

// ─────────────────────────────────────────────────────────────────────────────
//  GITHUB API
// ─────────────────────────────────────────────────────────────────────────────
async function githubGetFile(path) {
  const token = _getToken();
  const res = await fetch(`https://api.github.com/repos/${EDITOR_CONFIG.repo}/contents/${path}?ref=${EDITOR_CONFIG.branch}`, {
    headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github+json' }
  });
  if (!res.ok) throw new Error(`GitHub GET ${path}: ${res.status} ${res.statusText}`);
  return res.json();   // { content (base64), sha, ... }
}

async function githubPutFile(path, content, sha, message) {
  const token = _getToken();
  const res = await fetch(`https://api.github.com/repos/${EDITOR_CONFIG.repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: btoa(unescape(encodeURIComponent(content))),
      sha,
      branch: EDITOR_CONFIG.branch,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub PUT ${path}: ${res.status}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
//  ТОКЕН (зберігається в sessionStorage)
// ─────────────────────────────────────────────────────────────────────────────
function _getToken() {
  return sessionStorage.getItem('gh_editor_token') || EDITOR_CONFIG.token || '';
}
function _saveToken(t) {
  sessionStorage.setItem('gh_editor_token', t);
}
function _hasToken() {
  return !!_getToken();
}

// ─────────────────────────────────────────────────────────────────────────────
//  ПАРСИНГ / СЕРІАЛІЗАЦІЯ масиву з JS файлу
// ─────────────────────────────────────────────────────────────────────────────
function extractArray(source, varName) {
  // Знаходимо "const VARNAME = [" ... "];"
  const startMarker = `const ${varName} = [`;
  const si = source.indexOf(startMarker);
  if (si === -1) throw new Error(`Не знайдено масив ${varName} у файлі`);
  let depth = 0, i = si + startMarker.length - 1;
  const start = i;
  while (i < source.length) {
    if (source[i] === '[') depth++;
    else if (source[i] === ']') { depth--; if (depth === 0) break; }
    i++;
  }
  const arrStr = source.slice(start, i + 1);
  // Безпечний eval через Function
  try {
    // eslint-disable-next-line no-new-func
    return new Function(`return ${arrStr}`)();
  } catch(e) {
    throw new Error('Не вдалося розпарсити масив: ' + e.message);
  }
}

function serializeArray(arr, varName, source) {
  const startMarker = `const ${varName} = [`;
  const si = source.indexOf(startMarker);
  let depth = 0, i = si + startMarker.length - 1;
  while (i < source.length) {
    if (source[i] === '[') depth++;
    else if (source[i] === ']') { depth--; if (depth === 0) break; }
    i++;
  }
  const jsonStr = JSON.stringify(arr, null, 2)
    .replace(/^{/gm, '  {')
    .replace(/"([^"]+)":/g, (_, k) => `${k}:`);  // ключі без лапок (стиль JS)
  const newArr = startMarker + '\n' + arr.map(item => {
    const lines = Object.entries(item).map(([k, v]) => `    ${k}: ${JSON.stringify(v)}`);
    return '  {\n' + lines.join(',\n') + '\n  }';
  }).join(',\n') + '\n]';
  return source.slice(0, si) + newArr + source.slice(i + 1);
}

// ─────────────────────────────────────────────────────────────────────────────
//  HTML-ІГРИ (games.html) — парсинг data-* атрибутів
// ─────────────────────────────────────────────────────────────────────────────
function extractGames(html) {
  const items = [];
  const re = /data-title="([^"]*)"[^>]*data-img="([^"]*)"[^>]*data-rating="([^"]*)"[^>]*data-review="([^"]*)"/g;
  // також визначаємо статус по класу overlay
  const cardRe = /<div class="game-card"([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    // визначимо статус: шукаємо ближчий overlay після поточної позиції
    const after = html.slice(m.index, m.index + 600);
    let status = 'played';
    if (after.includes('planned-overlay')) status = 'planned';
    else if (after.includes('playing-overlay')) status = 'playing';
    items.push({ title: m[1], img: m[2], status, rating: m[3], review: m[4] });
  }
  return items;
}

function buildGameCard(g) {
  const statusLabel = g.status === 'planned' ? '⏳ планах пограти' : g.status === 'playing' ? '▶ граю зараз' : '';
  const overlayClass = g.status === 'planned' ? 'planned-overlay' : g.status === 'playing' ? 'playing-overlay' : '';
  const overlayHtml = overlayClass ? `\n      <div class="game-card-overlay ${overlayClass}">${statusLabel}</div>` : '';
  return `    <div class="game-card"
         data-title="${g.title}"
         data-img="${g.img}"
         data-rating="${g.rating || ''}"
         data-review="${(g.review || '').replace(/"/g, '&quot;')}">
      <div class="card-hover-hint">👁 ПОДИВИТИСЬ</div>${overlayHtml}
      <div class="game-card-body">
        <div class="game-card-title">${g.title}</div>
        <div class="game-card-meta">
        </div>
      </div>
    </div>`;
}

function serializeGames(games, html) {
  // Знаходимо перший і останній game-card і замінюємо весь блок
  const firstCard = html.indexOf('<div class="game-card"');
  if (firstCard === -1) return html;
  // Знаходимо контейнер (games-grid)
  const gridStart = html.lastIndexOf('<div', firstCard);
  // Знаходимо закриття контейнера
  let depth = 0, i = gridStart;
  while (i < html.length) {
    if (html[i] === '<') {
      if (html.slice(i, i+4) === '<div') depth++;
      else if (html.slice(i, i+6) === '</div>') { depth--; if (depth === 0) { i += 6; break; } }
    }
    i++;
  }
  const beforeGrid = html.slice(0, gridStart);
  const afterGrid  = html.slice(i);
  const gridOpen = html.slice(gridStart, html.indexOf('>', gridStart) + 1);
  const cardsHtml = '\n' + games.map(buildGameCard).join('\n\n') + '\n  ';
  return beforeGrid + gridOpen + cardsHtml + '</div>' + afterGrid;
}

// ─────────────────────────────────────────────────────────────────────────────
//  HTML-ПОСИЛАННЯ (links.html) — парсинг .link-card
// ─────────────────────────────────────────────────────────────────────────────
function extractLinks(html) {
  const items = [];
  const re = /<a[^>]*href="([^"]*)"[^>]*class="link-card"[\s\S]*?<div class="link-name">([^<]*)<\/div>\s*<div class="link-handle">([^<]*)<\/div>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    items.push({ url: m[1], name: m[2], handle: m[3], icon: '' });
  }
  return items;
}

function buildLinkCard(l) {
  return `    <a href="${l.url}" target="_blank" class="link-card">
      <div class="link-ico">
        ${l.icon && l.icon.startsWith('http') ? `<img src="${l.icon}" alt="${l.name}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;">` : `<span style="font-size:22px">${l.icon || '🔗'}</span>`}
      </div>
      <div class="link-info">
        <div class="link-name">${l.name}</div>
        <div class="link-handle">${l.handle || ''}</div>
      </div>
    </a>`;
}

function serializeLinks(links, html) {
  const listStart = html.indexOf('<div class="links-list">');
  if (listStart === -1) return html;
  let depth = 0, i = listStart;
  while (i < html.length) {
    if (html[i] === '<') {
      if (html.slice(i, i+4) === '<div') depth++;
      else if (html.slice(i, i+6) === '</div>') { depth--; if (depth === 0) { i += 6; break; } }
    }
    i++;
  }
  const before = html.slice(0, listStart);
  const after  = html.slice(i);
  const cardsHtml = '\n' + links.map(buildLinkCard).join('\n') + '\n  ';
  return before + '<div class="links-list">' + cardsHtml + '</div>' + after;
}

// ─────────────────────────────────────────────────────────────────────────────
//  ГОЛОВНА ЛОГІКА — завантаження, збереження
// ─────────────────────────────────────────────────────────────────────────────
let _ghSha = null;    // SHA поточного файлу
let _currentItems = [];
let _currentSchema = null;
let _currentPage = null;

async function editorLoad() {
  _currentPage = window.location.pathname.split('/').pop() || 'index.html';
  _currentSchema = PAGE_SCHEMAS[_currentPage];
  if (!_currentSchema) return;

  setStatus('info', '⏳ Завантажуємо файл з GitHub...');

  try {
    const file = await githubGetFile(_currentPage);
    _ghSha = file.sha;
    const source = decodeURIComponent(escape(atob(file.content.replace(/\n/g, ''))));

    if (_currentSchema.varName === '__HTML_GAMES__') {
      _currentItems = extractGames(source);
    } else if (_currentSchema.varName === '__HTML_LINKS__') {
      _currentItems = extractLinks(source);
    } else {
      _currentItems = extractArray(source, _currentSchema.varName);
    }

    setStatus('ok', `✅ Завантажено ${_currentItems.length} елементів`);
    renderList();
  } catch(e) {
    setStatus('err', '❌ ' + e.message);
  }
}

async function editorSave(newItems, actionLabel) {
  setStatus('info', '⏳ Зберігаємо на GitHub...');
  document.getElementById('em-btn-save') && (document.getElementById('em-btn-save').disabled = true);

  try {
    const file = await githubGetFile(_currentPage);
    _ghSha = file.sha;
    const source = decodeURIComponent(escape(atob(file.content.replace(/\n/g, ''))));
    let newSource;

    if (_currentSchema.varName === '__HTML_GAMES__') {
      newSource = serializeGames(newItems, source);
    } else if (_currentSchema.varName === '__HTML_LINKS__') {
      newSource = serializeLinks(newItems, source);
    } else {
      newSource = serializeArray(newItems, _currentSchema.varName, source);
    }

    const result = await githubPutFile(_currentPage, newSource, file.sha, `editor: ${actionLabel} on ${_currentPage}`);
    _ghSha = result.content.sha;
    _currentItems = newItems;
    setStatus('ok', `✅ Збережено! GitHub Pages оновиться за ~1 хв.`);
    renderList();
  } catch(e) {
    setStatus('err', '❌ ' + e.message);
  } finally {
    const btn = document.getElementById('em-btn-save');
    if (btn) btn.disabled = false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  РЕНДЕР СПИСКУ
// ─────────────────────────────────────────────────────────────────────────────
function renderList() {
  const body = document.getElementById('editor-body');
  if (!body) return;

  const schema = _currentSchema;
  const nameKey = schema.fields[0].key;
  const subKey  = schema.fields[1] ? schema.fields[1].key : null;

  let html = `<div id="em-items-list">`;
  if (_currentItems.length === 0) {
    html += `<div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#6e6e90;padding:12px 0">// список порожній</div>`;
  } else {
    _currentItems.forEach((item, idx) => {
      const name = item[nameKey] || `#${idx+1}`;
      const sub  = subKey && item[subKey] ? ` <span class="em-item-sub">${String(item[subKey]).slice(0,40)}</span>` : '';
      html += `<div class="em-item">
        <span class="em-item-name">${name}${sub}</span>
        <button class="em-btn-del" onclick="editorDeleteItem(${idx})">🗑 ВИДАЛИТИ</button>
      </div>`;
    });
  }
  html += `</div>`;

  // Форма додавання
  html += `<div class="em-add-section">
    <div class="em-add-title">// ДОДАТИ ${schema.label}</div>`;

  schema.fields.forEach(f => {
    html += `<div class="em-field">
      <label>${f.label}${f.required ? ' <span>*</span>' : ''}</label>`;
    if (f.type === 'select') {
      html += `<select id="emf-${f.key}">
        ${f.options.map(o => `<option value="${o}">${o}</option>`).join('')}
      </select>`;
    } else if (f.type === 'textarea') {
      html += `<textarea id="emf-${f.key}" placeholder="${f.label}"></textarea>`;
    } else {
      html += `<input type="${f.type === 'number' ? 'number' : 'text'}" id="emf-${f.key}" placeholder="${f.label}">`;
    }
    if (f.hint) html += `<div class="em-field-hint">// ${f.hint}</div>`;
    html += `</div>`;
  });

  html += `<div class="em-add-row">
    <button class="em-btn-add" id="em-btn-save" onclick="editorAddItem()">
      ➕ ДОДАТИ І ЗБЕРЕГТИ
    </button>
  </div>`;

  html += `<div id="em-status"></div>`;
  html += `</div>`;

  body.innerHTML = html;

  // Відновлюємо статус якщо є
  const statusEl = document.getElementById('em-status');
  if (statusEl && window._editorLastStatus) {
    statusEl.className = window._editorLastStatus.cls;
    statusEl.textContent = window._editorLastStatus.msg;
  }
}

function setStatus(cls, msg) {
  window._editorLastStatus = { cls, msg };
  const el = document.getElementById('em-status');
  if (el) { el.className = cls; el.textContent = msg; }
}

// ─────────────────────────────────────────────────────────────────────────────
//  ДІЇ
// ─────────────────────────────────────────────────────────────────────────────
function editorDeleteItem(idx) {
  if (!confirm(`Видалити "${_currentItems[idx][_currentSchema.fields[0].key]}"?`)) return;
  const newItems = _currentItems.filter((_, i) => i !== idx);
  editorSave(newItems, `delete item ${idx}`);
}

function editorAddItem() {
  const schema = _currentSchema;
  const item = {};
  let valid = true;

  schema.fields.forEach(f => {
    const el = document.getElementById(`emf-${f.key}`);
    if (!el) return;
    const val = el.value.trim();
    if (f.required && !val) { el.style.borderColor = '#ff4d4d'; valid = false; return; }
    el.style.borderColor = '';
    if (f.type === 'number') item[f.key] = val ? Number(val) : undefined;
    else item[f.key] = val || undefined;
    // чистимо undefined
    if (item[f.key] === undefined) delete item[f.key];
  });

  if (!valid) { setStatus('err', '❌ Заповни обов\'язкові поля'); return; }

  const newItems = [..._currentItems, item];
  editorSave(newItems, `add ${item[schema.fields[0].key]}`);
}

// ─────────────────────────────────────────────────────────────────────────────
//  ІНІЦІАЛІЗАЦІЯ
// ─────────────────────────────────────────────────────────────────────────────
const SiteEditor = {
  init() {
    // Показуємо тільки для власника
    const checkAndInit = () => {
      if (!window.TwitchAuth || !TwitchAuth.isOwner()) return;

      const page = window.location.pathname.split('/').pop() || 'index.html';
      if (!PAGE_SCHEMAS[page]) return;   // сторінка не підтримується

      _injectEditorCSS();

      // Кнопка FAB
      const fab = document.createElement('button');
      fab.id = 'editor-fab';
      fab.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg> РЕДАГУВАТИ`;
      fab.onclick = () => openEditor();
      document.body.appendChild(fab);

      // Оверлей + модальне вікно
      const overlay = document.createElement('div');
      overlay.id = 'editor-overlay';
      overlay.innerHTML = `
        <div id="editor-modal">
          <div class="em-head">
            <h2>⚙ РЕДАКТОР СТОРІНКИ</h2>
            <button class="em-close" onclick="closeEditor()">✕</button>
          </div>
          <div id="editor-token-wrap"></div>
          <div id="editor-body" style="padding:18px 22px">
            <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#6e6e90">// натисни РЕДАГУВАТИ щоб завантажити</div>
          </div>
        </div>`;
      overlay.addEventListener('click', e => { if (e.target === overlay) closeEditor(); });
      document.body.appendChild(overlay);
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkAndInit);
    } else {
      // Twitch auth може ще не визначити власника — чекаємо трохи
      setTimeout(checkAndInit, 300);
    }
  }
};

function openEditor() {
  // Перевірка токена
  const tokenWrap = document.getElementById('editor-token-wrap');
  if (!_hasToken()) {
    tokenWrap.innerHTML = `
      <div id="em-token-section">
        <label>🔑 GITHUB ТОКЕН (потрібен один раз)</label>
        <p>Отримай на: github.com/settings/tokens → Generate new token (classic) → обов'язково ✅ repo<br>
        Токен зберігається тільки в sessionStorage (до закриття вкладки)</p>
        <input id="em-token-input" type="password" placeholder="ghp_xxxxxxxxxxxx">
        <button id="em-token-save" onclick="
          const t = document.getElementById('em-token-input').value.trim();
          if (t) { _saveToken(t); document.getElementById('editor-token-wrap').innerHTML=''; editorLoad(); }
        ">ЗБЕРЕГТИ І ПРОДОВЖИТИ</button>
      </div>`;
  } else {
    tokenWrap.innerHTML = '';
    editorLoad();
  }
  document.getElementById('editor-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeEditor() {
  document.getElementById('editor-overlay').classList.remove('open');
  document.body.style.overflow = '';
  window._editorLastStatus = null;
}

// Запускаємо
SiteEditor.init();
