with open('scripts.html', 'r') as f:
    content = f.read()

# Замінити старий блок захисту на новий
old = '''<body>
<script src="twitch-auth.js"></script>
<script>
  // Захист сторінки — тільки sun69wukong може зайти
  TwitchAuth.protect(function(user) {
    // Юзер авторизований — показуємо сторінку
    document.body.style.visibility = 'visible';
    // Додаємо кнопку виходу в навбар
    const nav = document.querySelector('.nav-links');
    if (nav) {
      const logoutBtn = document.createElement('button');
      logoutBtn.textContent = '⬡ ВИЙТИ';
      logoutBtn.style.cssText = `
        font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;
        color:#6e6e90;background:none;border:none;cursor:pointer;font-family:inherit;
        transition:color .2s;padding-bottom:2px;
      `;
      logoutBtn.onmouseenter = () => logoutBtn.style.color = '#ff4d4d';
      logoutBtn.onmouseleave = () => logoutBtn.style.color = '#6e6e90';
      logoutBtn.onclick = () => TwitchAuth.logout();
      nav.appendChild(logoutBtn);
    }
  });
  document.body.style.visibility = 'hidden';
</script>'''

new = '''<body>
<script src="twitch-auth.js"></script>
<script>
  // Захист сторінки — тільки sun69wukong може зайти
  // Сторінка видима одразу, але якщо нема доступу — контент замінюється
  TwitchAuth.protect(function(user) {
    // Авторизований — все ок, навбар вже оновиться через _injectNavAuth
    console.log('✅ Доступ дозволено:', user.display_name);
  });
</script>'''

if old in content:
    content = content.replace(old, new)
    print("REPLACED OK")
else:
    print("NOT FOUND - trying alternate")
    # fallback - just inject at body
    print(repr(content[content.find('<body>'): content.find('<body>')+400]))

with open('scripts.html', 'w') as f:
    f.write(content)
