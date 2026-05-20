/**
 * twitch-auth.js — Twitch OAuth авторизація для GitHub Pages
 * Тільки sun69wukong може зайти на захищені сторінки.
 *
 * НАЛАШТУВАННЯ:
 *   1. Зареєструй app на https://dev.twitch.tv/console
 *   2. Redirect URI: https://<user>.github.io/<repo>/twitch-callback.html
 *   3. Встав Client ID нижче
 */

const TWITCH_CONFIG = {
  clientId:    'j7514269pj4qpxe7fcgxgwk9sx2u3e',
  redirectUri: (function() {
    const p = window.location.pathname;
    const base = window.location.origin + p.substring(0, p.lastIndexOf('/') + 1);
    return base + 'twitch-callback.html';
  })(),
  allowedUser: 'sun69wukong',
  scopes:      'user:read:email',
  tokenKey:    'twitch_token',
  userKey:     'twitch_user',
};

const TwitchAuth = {
  saveSession(token, user) {
    sessionStorage.setItem(TWITCH_CONFIG.tokenKey, token);
    sessionStorage.setItem(TWITCH_CONFIG.userKey, JSON.stringify(user));
  },
  clearSession() {
    sessionStorage.removeItem(TWITCH_CONFIG.tokenKey);
    sessionStorage.removeItem(TWITCH_CONFIG.userKey);
  },
  getSavedUser() {
    const raw = sessionStorage.getItem(TWITCH_CONFIG.userKey);
    return raw ? JSON.parse(raw) : null;
  },
  getToken() {
    return sessionStorage.getItem(TWITCH_CONFIG.tokenKey);
  },
  isLoggedIn() {
    return !!(this.getToken() && this.getSavedUser());
  },
  isOwner() {
    const u = this.getSavedUser();
    return u && u.login.toLowerCase() === TWITCH_CONFIG.allowedUser.toLowerCase();
  },

  login(returnPage) {
    if (returnPage) sessionStorage.setItem('twitch_return', returnPage);
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

  logout() {
    this.clearSession();
    window.location.reload();
  },

  /**
   * Захищає сторінку — сторінка залишається ВИДИМОЮ,
   * але контент замінюється на екран блокування якщо немає доступу.
   */
  protect(onSuccess) {
    if (this.isLoggedIn() && this.isOwner()) {
      this._injectNavAuth(true);
      onSuccess && onSuccess(this.getSavedUser());
      return;
    }
    if (this.isLoggedIn() && !this.isOwner()) {
      this._showDenied(this.getSavedUser().login);
      return;
    }
    // Не залогінений
    this._showLoginGate();
  },

  /**
   * Додає кнопку входу/виходу у навбар — для публічних сторінок (index, about...)
   */
  addNavAuth() {
    this._injectNavAuth(false);
  },

  /** Вставляє кнопку входу або виходу в навбар */
  _injectNavAuth(isProtectedPage) {
    // Чекаємо поки DOM завантажиться
    const inject = () => {
      const nav = document.querySelector('.nav-links');
      if (!nav) return;

      // Видаляємо старий якщо є
      const old = nav.querySelector('.twitch-nav-btn');
      if (old) old.remove();

      const btn = document.createElement('button');
      btn.className = 'twitch-nav-btn';

      if (this.isLoggedIn() && this.isOwner()) {
        const u = this.getSavedUser();
        btn.innerHTML = `<span style="color:#9146FF">⬡</span> ${u.display_name} <span style="opacity:.5;font-size:9px">ВИЙТИ</span>`;
        btn.title = 'Вийти з Twitch';
        btn.onclick = () => this.logout();
      } else {
        btn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="#9146FF" style="margin-right:4px"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>УВІЙТИ`;
        btn.title = 'Увійти через Twitch';
        btn.onclick = () => this.login(window.location.pathname.split('/').pop());
      }

      btn.style.cssText = `
        font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;
        color:#6e6e90;background:none;border:1px solid rgba(145,70,255,.25);
        cursor:pointer;font-family:inherit;padding:4px 10px;border-radius:3px;
        display:inline-flex;align-items:center;gap:4px;
        transition:color .2s,border-color .2s;white-space:nowrap;
      `;
      btn.onmouseenter = () => {
        btn.style.color = this.isLoggedIn() ? '#ff4d4d' : '#9146FF';
        btn.style.borderColor = this.isLoggedIn() ? 'rgba(255,77,77,.4)' : 'rgba(145,70,255,.6)';
      };
      btn.onmouseleave = () => {
        btn.style.color = '#6e6e90';
        btn.style.borderColor = 'rgba(145,70,255,.25)';
      };
      nav.appendChild(btn);
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', inject);
    } else {
      inject();
    }
  },

  /** Замінює весь body на екран входу */
  _showLoginGate() {
    const currentPage = window.location.pathname.split('/').pop() || 'scripts.html';
    document.addEventListener('DOMContentLoaded', () => {
      document.body.style.visibility = 'visible';
      document.body.innerHTML = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@600;700&family=JetBrains+Mono:wght@400;700&display=swap');
          *{box-sizing:border-box;margin:0;padding:0}
          body{font-family:'Rajdhani',sans-serif;background:#07070f;color:#eeeef8;min-height:100vh;
            display:flex;align-items:center;justify-content:center;
            background-image:linear-gradient(rgba(145,70,255,.04) 1px,transparent 1px),
              linear-gradient(90deg,rgba(145,70,255,.04) 1px,transparent 1px);
            background-size:44px 44px;}
          .gate{text-align:center;padding:48px 36px;background:rgba(13,13,26,.97);
            border:1px solid rgba(145,70,255,.25);border-radius:16px;max-width:440px;width:90%;
            box-shadow:0 0 80px rgba(145,70,255,.12);}
          .gate-logo{font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:4px;
            color:#9146FF;text-decoration:none;display:block;margin-bottom:28px;}
          .gate-icon{font-size:50px;margin-bottom:14px;}
          .gate-title{font-family:'Bebas Neue',sans-serif;font-size:34px;letter-spacing:5px;
            color:#9146FF;margin-bottom:8px;}
          .gate-sub{font-size:14px;color:#6e6e90;margin-bottom:30px;line-height:1.55;}
          .twitch-btn{
            display:inline-flex;align-items:center;gap:12px;
            padding:14px 36px;background:#9146FF;color:#fff;
            font-family:'Bebas Neue',sans-serif;font-size:19px;letter-spacing:3px;
            border:none;border-radius:6px;cursor:pointer;
            box-shadow:0 0 30px rgba(145,70,255,.5);transition:transform .2s,box-shadow .2s;}
          .twitch-btn:hover{transform:translateY(-3px);box-shadow:0 12px 44px rgba(145,70,255,.7);}
          .gate-note{margin-top:16px;font-family:'JetBrains Mono',monospace;font-size:10px;
            color:rgba(110,110,144,.5);letter-spacing:1px;}
          .back-link{display:inline-block;margin-top:14px;font-size:12px;color:#6e6e90;
            text-decoration:none;transition:color .2s;}
          .back-link:hover{color:#9146FF;}
        </style>
        <div class="gate">
          <a href="index.html" class="gate-logo">sun69wukong</a>
          <div class="gate-icon">🔒</div>
          <div class="gate-title">ДОСТУП ЗАКРИТО</div>
          <p class="gate-sub">Ця сторінка доступна тільки для авторизованих.<br>Увійдіть через Twitch щоб продовжити.</p>
          <button class="twitch-btn" onclick="TwitchAuth.login('${currentPage}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
            </svg>
            УВІЙТИ ЧЕРЕЗ TWITCH
          </button>
          <p class="gate-note">// тільки дозволені акаунти мають доступ</p>
          <a class="back-link" href="index.html">← повернутись на головну</a>
        </div>
      `;
    });
  },

  /** Замінює весь body на "нема доступу" */
  _showDenied(login) {
    this.clearSession();
    document.addEventListener('DOMContentLoaded', () => {
      document.body.innerHTML = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@600;700&family=JetBrains+Mono:wght@400;700&display=swap');
          *{box-sizing:border-box;margin:0;padding:0}
          body{font-family:'Rajdhani',sans-serif;background:#07070f;color:#eeeef8;min-height:100vh;
            display:flex;align-items:center;justify-content:center;
            background-image:linear-gradient(rgba(255,68,68,.04) 1px,transparent 1px),
              linear-gradient(90deg,rgba(255,68,68,.04) 1px,transparent 1px);
            background-size:44px 44px;}
          .gate{text-align:center;padding:48px 36px;background:rgba(13,13,26,.97);
            border:1px solid rgba(255,68,68,.25);border-radius:16px;max-width:440px;width:90%;
            box-shadow:0 0 80px rgba(255,68,68,.10);}
          .gate-logo{font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:4px;
            color:#9146FF;text-decoration:none;display:block;margin-bottom:28px;}
          .gate-icon{font-size:50px;margin-bottom:14px;}
          .gate-title{font-family:'Bebas Neue',sans-serif;font-size:34px;letter-spacing:5px;
            color:#ff4d4d;margin-bottom:8px;}
          .gate-sub{font-size:14px;color:#6e6e90;margin-bottom:10px;line-height:1.55;}
          .gate-login{font-family:'JetBrains Mono',monospace;font-size:13px;color:#ff4d4d;
            background:rgba(255,68,68,.08);border:1px solid rgba(255,68,68,.2);
            padding:8px 18px;border-radius:4px;display:inline-block;margin-bottom:24px;}
          .back-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 30px;
            background:transparent;color:#6e6e90;font-family:'Bebas Neue',sans-serif;
            font-size:17px;letter-spacing:3px;border:1px solid rgba(110,110,144,.3);
            border-radius:6px;cursor:pointer;text-decoration:none;transition:all .2s;}
          .back-btn:hover{color:#eeeef8;border-color:rgba(110,110,144,.6);}
        </style>
        <div class="gate">
          <a href="index.html" class="gate-logo">sun69wukong</a>
          <div class="gate-icon">🚫</div>
          <div class="gate-title">НЕМАЄ ДОСТУПУ</div>
          <p class="gate-sub">Акаунт не авторизований.</p>
          <div class="gate-login">${login}</div><br>
          <a class="back-btn" href="index.html">← НА ГОЛОВНУ</a>
        </div>
      `;
    });
  },

  /** Callback — викликати на twitch-callback.html */
  async handleCallback() {
    const hash  = new URLSearchParams(window.location.hash.slice(1));
    const token = hash.get('access_token');
    const state = hash.get('state');
    const saved = sessionStorage.getItem('twitch_state');
    const el    = document.getElementById('cb-status');
    const spin  = document.getElementById('spinner');

    if (!token) { el.textContent = '❌ Токен не отримано.'; return; }
    if (state !== saved) { el.textContent = '❌ Невірний state.'; return; }
    sessionStorage.removeItem('twitch_state');
    el.textContent = '⏳ Перевіряємо акаунт...';

    try {
      const res  = await fetch('https://api.twitch.tv/helix/users', {
        headers: { 'Authorization': `Bearer ${token}`, 'Client-Id': TWITCH_CONFIG.clientId }
      });
      const data = await res.json();
      if (!data.data || !data.data[0]) {
        if (spin) spin.style.display = 'none';
        el.innerHTML = `<span style="color:#ff4d4d">❌ Помилка API Twitch: ${data.message || 'невідома помилка'}. Перевір Client ID.</span>`;
        return;
      }
      const user = data.data[0];

      if (user.login.toLowerCase() !== TWITCH_CONFIG.allowedUser.toLowerCase()) {
        if (spin) spin.style.display = 'none';
        el.innerHTML = `<span style="color:#ff4d4d">❌ Акаунт <b>${user.display_name}</b> не має доступу.</span>`;
        setTimeout(() => { window.location.href = 'index.html'; }, 3000);
        return;
      }
      this.saveSession(token, user);
      if (spin) spin.style.display = 'none';
      el.innerHTML = `<span style="color:#9146FF">✅ Ласкаво просимо, <b>${user.display_name}</b>!</span>`;
      const returnTo = sessionStorage.getItem('twitch_return') || 'scripts.html';
      sessionStorage.removeItem('twitch_return');
      setTimeout(() => { window.location.href = returnTo; }, 1200);
    } catch(e) {
      el.textContent = '❌ Помилка: ' + e.message;
    }
  }
};
