/* Signed-in account for the prototype (kept in this browser's localStorage).
   Exposes window.GreenCartAccount = {
     createAccount(details, password)   register page: { fullName, email, username, phone, address }
                                         -> Promise<{ ok, account } | { ok: false, message }>
     signIn(emailOrUsername, password)  login page: checks the password
                                         -> Promise<{ ok, account } | { ok: false, message, attemptsLeft, locked, retryIn }>
     changePassword(current, next)      profile page -> Promise<{ ok, changedAt } | { ok: false, field, message }>
     loginLock(emailOrUsername)         { locked, seconds } while sign-in is paused after failed attempts
     current()                          the signed-in account, or null
     session()                          { accountId, signedInWith, signedInAt }, or null
     passwordChangedAt()                when the signed-in account's password was last set
     update(changes)                    save profile edits for the signed-in account; returns it, or null
     isTaken(emailOrUsername)           true if ANOTHER account already uses it
     register(details)                  save profile details only (no password)
     signOut()                          end the session (cookie and consent choices stay)
     requireSignIn()                    send visitors who aren't signed in to the login page
   }
   Any element with a data-account-link attribute opens the profile page when
   signed in, or the login page when not.

   Passwords are NEVER stored. Only a salted PBKDF2-SHA256 hash is kept, so even
   someone who reads localStorage can't see the password. (A real system would do
   this on the server.) Hashing needs a secure page: localhost, https or a file. */
window.GreenCartAccount = (function () {
  var ACCOUNTS_KEY = 'greencart-accounts';
  var CREDENTIALS_KEY = 'greencart-credentials';
  var ATTEMPTS_KEY = 'greencart-login-attempts';
  var SESSION_KEY = 'greencart-session';
  var LOGIN_PAGE = 'login.html';
  var PROFILE_PAGE = 'profile.html';
  var FIELDS = ['fullName', 'email', 'username', 'phone', 'address', 'photo'];

  var HASH_ITERATIONS = 600000;     // OWASP's current recommendation for PBKDF2-SHA256
  var MAX_ATTEMPTS = 5;             // failed sign-ins before a pause
  var FIRST_LOCK_SECONDS = 30;      // pause doubles each time: 30 s, 1 min, 2 min ... up to 15 min
  var MAX_LOCK_SECONDS = 15 * 60;
  var SESSION_HOURS = 8;            // sign in again after this long

  var WRONG_LOGIN = 'Incorrect email/username or password.';
  var NOT_SECURE = 'Passwords can only be protected on a secure page. Open the site through localhost or https.';
  var NO_STORAGE = 'This browser is blocking site storage, so we can\'t keep you signed in.';

  /* ---------- storage helpers ---------- */
  function read(key, fallback) {
    try {
      var value = JSON.parse(localStorage.getItem(key));
      return value == null ? fallback : value;
    } catch (e) { return fallback; }
  }

  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; } // storage full or blocked
  }

  function norm(text) { return String(text || '').trim().toLowerCase(); }
  function now() { return new Date().toISOString(); }
  function copy(obj) { return JSON.parse(JSON.stringify(obj)); }

  /* ---------- accounts (profile details, no passwords) ---------- */
  function accounts() {
    var list = read(ACCOUNTS_KEY, []);
    return Array.isArray(list) ? list : [];
  }

  function saveAccount(account) {
    var list = accounts().filter(function (a) { return a.id !== account.id; });
    list.push(account);
    return write(ACCOUNTS_KEY, list);
  }

  function credentials() {
    var all = read(CREDENTIALS_KEY, {});
    return all && typeof all === 'object' ? all : {};
  }

  function hasPassword(id) { return !!credentials()[id]; }

  // Find an account by its email or username (not case-sensitive).
  // Accounts with a password win over old profiles saved before passwords existed.
  function find(identifier) {
    var id = norm(identifier);
    if (!id) return null;
    var matches = accounts().filter(function (a) { return norm(a.email) === id || norm(a.username) === id; });
    for (var i = 0; i < matches.length; i++) if (hasPassword(matches[i].id)) return matches[i];
    return matches[0] || null;
  }

  // Keep only the profile fields we know about (so a password can never sneak in)
  function pick(details) {
    var out = {};
    FIELDS.forEach(function (field) {
      if (details && details[field] != null) out[field] = String(details[field]).trim();
    });
    return out;
  }

  function register(details) {
    var d = pick(details);
    var account = find(d.email) || find(d.username) || {
      id: 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      createdAt: now(),
      fullName: '', email: '', username: '', phone: '', address: '', photo: ''
    };
    Object.keys(d).forEach(function (field) { if (d[field]) account[field] = d[field]; });
    return saveAccount(account) ? copy(account) : null;
  }

  /* ---------- password hashing ---------- */
  function cryptoReady() { return !!(window.crypto && window.crypto.subtle && window.TextEncoder); }

  function toBase64(buffer) {
    var bytes = new Uint8Array(buffer), text = '';
    for (var i = 0; i < bytes.length; i++) text += String.fromCharCode(bytes[i]);
    return btoa(text);
  }

  function fromBase64(text) {
    var raw = atob(text), bytes = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes;
  }

  function derive(password, salt, iterations) {
    return crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
      .then(function (key) {
        return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt, iterations: iterations }, key, 256);
      })
      .then(toBase64);
  }

  function makeCredential(password) {
    var salt = crypto.getRandomValues(new Uint8Array(16)); // a new random salt for every password
    return derive(password, salt, HASH_ITERATIONS).then(function (hash) {
      return { algorithm: 'PBKDF2-SHA256', iterations: HASH_ITERATIONS, salt: toBase64(salt), hash: hash, changedAt: now() };
    });
  }

  // Compare every character so the time taken doesn't hint at how close a guess was
  function sameText(a, b) {
    if (a.length !== b.length) return false;
    var diff = 0;
    for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  function checkPassword(credential, password) {
    return derive(password, fromBase64(credential.salt), credential.iterations)
      .then(function (hash) { return sameText(hash, credential.hash); });
  }

  /* ---------- failed attempts and lockout ---------- */
  function lockKey(identifier) {
    var account = find(identifier);
    return account ? 'id:' + account.id : 'name:' + norm(identifier);
  }

  function loginLock(identifier) {
    var entry = read(ATTEMPTS_KEY, {})[lockKey(identifier)];
    var left = entry && entry.lockedUntil ? entry.lockedUntil - Date.now() : 0;
    return left > 0 ? { locked: true, seconds: Math.ceil(left / 1000) } : { locked: false, seconds: 0 };
  }

  function recordFailure(key) {
    var all = read(ATTEMPTS_KEY, {});
    var entry = all[key] || { count: 0, lockouts: 0 };
    entry.count++;
    var result = { attemptsLeft: MAX_ATTEMPTS - entry.count, locked: false, retryIn: 0 };
    if (entry.count >= MAX_ATTEMPTS) {
      var seconds = Math.min(FIRST_LOCK_SECONDS * Math.pow(2, entry.lockouts), MAX_LOCK_SECONDS);
      entry.lockedUntil = Date.now() + seconds * 1000;
      entry.lockouts++;
      entry.count = 0;
      result = { attemptsLeft: 0, locked: true, retryIn: seconds };
    }
    all[key] = entry;
    write(ATTEMPTS_KEY, all);
    return result;
  }

  function clearFailures(key) {
    var all = read(ATTEMPTS_KEY, {});
    delete all[key];
    write(ATTEMPTS_KEY, all);
  }

  /* ---------- create account, sign in, change password ---------- */
  function createAccount(details, password) {
    if (!cryptoReady()) return Promise.resolve({ ok: false, message: NOT_SECURE });
    var d = pick(details);
    var existing = find(d.email) || find(d.username);
    if (existing && hasPassword(existing.id)) {
      return Promise.resolve({ ok: false, message: 'An account with this email or username already exists.' });
    }
    return makeCredential(password).then(function (credential) {
      // Profiles saved before passwords existed keep their details and get the new password
      var account = register(details);
      if (!account) return { ok: false, message: NO_STORAGE };
      var all = credentials();
      all[account.id] = credential;
      return write(CREDENTIALS_KEY, all) ? { ok: true, account: account } : { ok: false, message: NO_STORAGE };
    });
  }

  function signIn(identifier, password) {
    var typed = String(identifier || '').trim();
    var key = lockKey(typed);
    var lock = loginLock(typed);
    if (lock.locked) return Promise.resolve({ ok: false, locked: true, retryIn: lock.seconds, message: WRONG_LOGIN });
    if (!cryptoReady()) return Promise.resolve({ ok: false, message: NOT_SECURE });

    var account = find(typed);
    var credential = account && credentials()[account.id];

    // Unknown account: still do the slow hash, so the response time doesn't
    // reveal which emails or usernames have accounts.
    var check = credential
      ? checkPassword(credential, String(password || ''))
      : derive(String(password || ''), new Uint8Array(16), HASH_ITERATIONS).then(function () { return false; });

    return check.then(function (ok) {
      if (!ok) {
        var failure = recordFailure(key);
        return { ok: false, message: WRONG_LOGIN, attemptsLeft: failure.attemptsLeft, locked: failure.locked, retryIn: failure.retryIn };
      }
      clearFailures(key);
      var saved = write(SESSION_KEY, { accountId: account.id, signedInWith: typed, signedInAt: now() });
      return saved ? { ok: true, account: copy(account) } : { ok: false, message: NO_STORAGE };
    });
  }

  function changePassword(currentPassword, newPassword) {
    var me = current();
    if (!me) return Promise.resolve({ ok: false, message: 'Please sign in again.' });
    if (!cryptoReady()) return Promise.resolve({ ok: false, message: NOT_SECURE });

    var key = 'id:' + me.id;
    var lock = loginLock(me.email || me.username);
    if (lock.locked) {
      return Promise.resolve({ ok: false, field: 'currentPassword', message: 'Too many wrong attempts. Try again in ' + lock.seconds + ' seconds.' });
    }

    return checkPassword(credentials()[me.id], String(currentPassword || '')).then(function (ok) {
      if (!ok) {
        var failure = recordFailure(key);
        return {
          ok: false, field: 'currentPassword',
          message: failure.locked
            ? 'Too many wrong attempts. Try again in ' + failure.retryIn + ' seconds.'
            : 'Your current password is incorrect.'
        };
      }
      clearFailures(key);
      return makeCredential(String(newPassword || '')).then(function (credential) {
        var all = credentials();
        all[me.id] = credential;
        return write(CREDENTIALS_KEY, all)
          ? { ok: true, changedAt: credential.changedAt }
          : { ok: false, message: NO_STORAGE };
      });
    });
  }

  /* ---------- session ---------- */
  function session() {
    var s = read(SESSION_KEY, null);
    return s && s.accountId ? s : null;
  }

  function expired(s) {
    return Date.now() - new Date(s.signedInAt).getTime() > SESSION_HOURS * 60 * 60 * 1000;
  }

  function current() {
    var s = session();
    if (!s) return null;
    if (expired(s)) { signOut(); return null; }
    var list = accounts();
    for (var i = 0; i < list.length; i++) {
      // Only accounts with a password count as signed in
      if (list[i].id === s.accountId && hasPassword(list[i].id)) return copy(list[i]);
    }
    return null;
  }

  function passwordChangedAt() {
    var me = current();
    var credential = me && credentials()[me.id];
    return credential ? credential.changedAt : null;
  }

  function isTaken(identifier) {
    var match = find(identifier);
    var me = current();
    return !!(match && hasPassword(match.id) && (!me || match.id !== me.id));
  }

  function update(changes) {
    var account = current();
    if (!account) return null;
    var d = pick(changes);
    Object.keys(d).forEach(function (field) { account[field] = d[field]; });
    account.updatedAt = now();
    return saveAccount(account) ? copy(account) : null;
  }

  function signOut() {
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
  }

  function requireSignIn() {
    var s = session();
    var timedOut = !!(s && expired(s));
    if (current()) return true;
    var page = (location.pathname.split('/').pop() || PROFILE_PAGE) + location.hash;
    location.replace(LOGIN_PAGE + '?next=' + encodeURIComponent(page) + (timedOut ? '&expired=1' : ''));
    return false;
  }

  /* ---------- header account links ---------- */
  function initials(account) {
    var name = (account && (account.fullName || account.email || account.username)) || '';
    return name.trim().split(/\s+/).slice(0, 2)
      .map(function (part) { return part.charAt(0); }).join('').toUpperCase() || '?';
  }

  function wireAccountLinks() {
    var me = current();
    var i;

    var links = document.querySelectorAll('[data-account-link]');
    for (i = 0; i < links.length; i++) {
      var label = me ? 'My account' : 'Sign in';
      links[i].setAttribute('aria-label', label);
      links[i].setAttribute('title', label);
      links[i].addEventListener('click', function (e) {
        e.preventDefault();
        location.href = current() ? PROFILE_PAGE : LOGIN_PAGE;
      });
    }

    // Avatar chips: show the signed-in user's photo or initials; hidden when signed out
    var avatars = document.querySelectorAll('[data-account-avatar]');
    for (i = 0; i < avatars.length; i++) {
      avatars[i].hidden = !me;
      if (!me) continue;
      if (me.photo) {
        avatars[i].style.backgroundImage = 'url("' + me.photo + '")';
        avatars[i].textContent = '';
      } else {
        avatars[i].textContent = initials(me);
      }
    }

    // An existing "Sign out" button (id="signout") also ends the saved session.
    // Its own click handler still runs afterwards, unchanged.
    var oldSignOut = document.getElementById('signout');
    if (oldSignOut) oldSignOut.addEventListener('click', signOut, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireAccountLinks);
  else wireAccountLinks();

  return {
    LOGIN_PAGE: LOGIN_PAGE,
    PROFILE_PAGE: PROFILE_PAGE,
    createAccount: createAccount,
    signIn: signIn,
    changePassword: changePassword,
    loginLock: loginLock,
    register: register,
    current: current,
    session: session,
    passwordChangedAt: passwordChangedAt,
    update: update,
    isTaken: isTaken,
    signOut: signOut,
    requireSignIn: requireSignIn
  };
})();
