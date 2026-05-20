/**
 * twitch-auth.js — Twitch OAuth авторизація для GitHub Pages
 * Тільки sun69wukong може зайти. Решта — access denied.
 *
 * НАЛАШТУВАННЯ:
 *   1. Зареєструй app на https://dev.twitch.tv/console
 *   2. Redirect URI встанови: https://<твій-github-user>.github.io/sunwukong/twitch-callback.html
 *   3. Встав свій Client ID нижче
 */

const TWITCH_CONFIG = {
  clientId:    'j7514269pj4qpxe7fcgxgwk9sx2u3e',          // ← ЗАМІНИТИ
  redirectUri: window.location.origin + (window.location.pathname.includes('/sunwukong') ? '/sunwukong' : '') + '/twitch-callback.html',
  allowedUser: 'sun69wukong',                     // єдиний дозволений логін
  scopes:      'user:read:email',
  tokenKey:    'twitch_token',
  userKey:     'twitch_user',
};

const TwitchAuth = {
  /** Зберегти токен/юзера в sessionStorage */
  saveSession(token, user) {
    sessionStorage.setItem(TWITCH_CONFIG.tokenKey, token);
    sessionStorage.setItem(TWITCH_CONFIG.userKey, JSON.stringify(user));
  },

  /** Очистити сесію */
  clearSession() {
    sessionStorage.removeItem(TWITCH_CONFIG.tokenKey);
    sessionStorage.removeItem(TWITCH_CONFIG.userKey);
  },

  /** Отримати збереженого юзера */
  getSavedUser() {
    const raw = sessionStorage.getItem(TWITCH_CONFIG.userKey);
    return raw ? JSON.parse(raw) : null;
  },

  /** Редірект на Twitch OAuth */
  login() {
    const state = Math.random().toString(36).slice(2);
    sessionStorage.setItem('twitch_state', state);
    const url = new URL('https://id.twitch.tv/oauth2/authorize');
    url.searchParams.set('client_id',     TWITCH_CONFIG.clientId);
    url.searchParams.set('redirect_uri',  TWITCH_CONFIG.redirectUri);
    url.searchParams.set('response_type', 'token');
    url.searchParams.set('scope',         TWITCH_CONFIG.scopes);
    url.searchParams.set('state',         state);
    window.location.href = url.toString();
  },

  /** Вийти */
  logout() {
    this.clearSession();
    window.location.href = 'index.html';
  },

  /** Отримати дані юзера за токеном */
  async fetchUser(token) {
    const res = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id':     TWITCH_CONFIG.clientId,
      }
    });
    if (!res.ok) throw new Error('Twitch API error: ' + res.status);
    const data = await res.json();
    return data.data[0];
  },

  /**
   * Захистити сторінку — викликати на початку захищених сторінок.
   * Якщо юзер не авторизований або не дозволений — показує екран блокування.
   * Колбек onSuccess(user) викликається коли все ок.
   */
  protect(onSuccess) {
    const token = sessionStorage.getItem(TWITCH_CONFIG.tokenKey);
    const saved  = this.getSavedUser();

    if (token && saved) {
      if (saved.login.toLowerCase() !== TWITCH_CONFIG.allowedUser.toLowerCase()) {
        this._showDenied(saved.login);
        return;
      }
      onSuccess && onSuccess(saved);
      return;
    }

    // Немає сесії — показати екран входу
    this._showLogin();
  },

  /** Обробити callback після Twitch OAuth (викликати на twitch-callback.html) */
  async handleCallback() {
    const hash   = new URLSearchParams(window.location.hash.slice(1));
    const params = new URLSearchParams(window.location.search);
    const token  = hash.get('access_token');
    const state  = hash.get('state') || params.get('state');
    const saved  = sessionStorage.getItem('twitch_state');

    if (!token) {
      document.getElementById('cb-status').textContent = '❌ Токен не отримано. Спробуй ще раз.';
      return;
    }
    if (state !== saved) {
      document.getElementById('cb-status').textContent = '❌ Невірний state. Можлива атака CSRF.';
      return;
    }

    sessionStorage.removeItem('twitch_state');
    document.getElementById('cb-status').textContent = '⏳ Перевіряємо акаунт...';

    try {
      const user = await this.fetchUser(token);
      if (user.login.toLowerCase() !== TWITCH_CONFIG.allowedUser.toLowerCase()) {
        sessionStorage.removeItem('twitch_token');
        document.getElementById('cb-status').innerHTML =
          `<span style="color:#ff4d4d">❌ Акаунт <b>${user.display_name}</b> не має доступу.</span>`;
        setTimeout(() => { window.location.href = 'index.html'; }, 3000);
        return;
      }
      this.saveSession(token, user);
      const returnTo = sessionStorage.getItem('twitch_return') || 'scripts.html';
      sessionStorage.removeItem('twitch_return');
      document.getElementById('cb-status').innerHTML =
        `<span style="color:#9146FF">✅ Ласкаво просимо, <b>${user.display_name}</b>!</span>`;
      setTimeout(() => { window.location.href = returnTo; }, 1200);
    } catch(e) {
      document.getElementById('cb-status').textContent = '❌ Помилка: ' + e.message;
    }
  },

  /** Внутрішній — показати екран входу поверх сторінки */
  _showLogin() {
    sessionStorage.setItem('twitch_return', window.location.pathname.split('/').pop());
    document.body.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@600;700&family=JetBrains+Mono:wght@400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Rajdhani',sans-serif;background:#07070f;color:#eeeef8;min-height:100vh;
          display:flex;align-items:center;justify-content:center;
          background-image:linear-gradient(rgba(145,70,255,.04) 1px,transparent 1px),
            linear-gradient(90deg,rgba(145,70,255,.04) 1px,transparent 1px);
          background-size:44px 44px;}
        .gate{text-align:center;padding:40px 32px;background:rgba(13,13,26,.95);
          border:1px solid rgba(145,70,255,.25);border-radius:16px;max-width:440px;width:90%;
          box-shadow:0 0 80px rgba(145,70,255,.12);}
        .gate-icon{font-size:54px;margin-bottom:16px;}
        .gate-title{font-family:'Bebas Neue',sans-serif;font-size:36px;letter-spacing:5px;
          color:#9146FF;margin-bottom:8px;}
        .gate-sub{font-size:14px;color:#6e6e90;margin-bottom:28px;line-height:1.5;}
        .twitch-btn{
          display:inline-flex;align-items:center;gap:12px;
          padding:14px 36px;background:#9146FF;color:#fff;
          font-family:'Bebas Neue',sans-serif;font-size:19px;letter-spacing:3px;
          border:none;border-radius:6px;cursor:pointer;text-decoration:none;
          box-shadow:0 0 30px rgba(145,70,255,.5);transition:transform .2s,box-shadow .2s;}
        .twitch-btn:hover{transform:translateY(-3px);box-shadow:0 12px 44px rgba(145,70,255,.7);}
        .gate-note{margin-top:18px;font-family:'JetBrains Mono',monospace;font-size:10px;
          color:rgba(110,110,144,.6);letter-spacing:1px;}
        .back-link{display:inline-block;margin-top:16px;font-size:12px;color:#6e6e90;
          text-decoration:none;transition:color .2s;}
        .back-link:hover{color:#9146FF;}
      </style>
      <div class="gate">
        <div class="gate-icon">🔒</div>
        <div class="gate-title">ДОСТУП ЗАКРИТО</div>
        <p class="gate-sub">Ця сторінка доступна тільки для авторизованих користувачів.<br>Увійдіть через Twitch щоб продовжити.</p>
        <button class="twitch-btn" onclick="TwitchAuth.login()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
          </svg>
          УВІЙТИ ЧЕРЕЗ TWITCH
        </button>
        <p class="gate-note">// тільки дозволені акаунти можуть зайти</p>
        <a class="back-link" href="index.html">← повернутись на головну</a>
      </div>
    `;
  },

  /** Внутрішній — показати екран "нема доступу" */
  _showDenied(login) {
    this.clearSession();
    document.body.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@600;700&family=JetBrains+Mono:wght@400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Rajdhani',sans-serif;background:#07070f;color:#eeeef8;min-height:100vh;
          display:flex;align-items:center;justify-content:center;
          background-image:linear-gradient(rgba(255,68,68,.04) 1px,transparent 1px),
            linear-gradient(90deg,rgba(255,68,68,.04) 1px,transparent 1px);
          background-size:44px 44px;}
        .gate{text-align:center;padding:40px 32px;background:rgba(13,13,26,.95);
          border:1px solid rgba(255,68,68,.25);border-radius:16px;max-width:440px;width:90%;
          box-shadow:0 0 80px rgba(255,68,68,.10);}
        .gate-icon{font-size:54px;margin-bottom:16px;}
        .gate-title{font-family:'Bebas Neue',sans-serif;font-size:36px;letter-spacing:5px;
          color:#ff4d4d;margin-bottom:8px;}
        .gate-sub{font-size:14px;color:#6e6e90;margin-bottom:10px;line-height:1.5;}
        .gate-login{font-family:'JetBrains Mono',monospace;font-size:13px;color:#ff4d4d;
          background:rgba(255,68,68,.08);border:1px solid rgba(255,68,68,.2);
          padding:8px 18px;border-radius:4px;display:inline-block;margin-bottom:24px;}
        .back-btn{
          display:inline-flex;align-items:center;gap:8px;
          padding:12px 30px;background:transparent;color:#6e6e90;
          font-family:'Bebas Neue',sans-serif;font-size:17px;letter-spacing:3px;
          border:1px solid rgba(110,110,144,.3);border-radius:6px;
          cursor:pointer;text-decoration:none;transition:all .2s;}
        .back-btn:hover{color:#eeeef8;border-color:rgba(110,110,144,.6);}
      </style>
      <div class="gate">
        <div class="gate-icon">🚫</div>
        <div class="gate-title">НЕМАЄ ДОСТУПУ</div>
        <p class="gate-sub">Акаунт не авторизований для перегляду цієї сторінки.</p>
        <div class="gate-login">${login}</div>
        <br>
        <a class="back-btn" href="index.html">← НА ГОЛОВНУ</a>
      </div>
    `;
  }
};
