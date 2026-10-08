/* Login page */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var msg = $('l-msg');
  var params = new URLSearchParams(location.search);
  var submitBtn = $('login-form').querySelector('button[type="submit"]');
  var submitText = submitBtn.textContent;

  // arriving from the register page
  if (params.get('registered') === '1') {
    msg.classList.add('ok');
    msg.textContent = 'Account created. Sign in to continue.';
  }

  // arriving after logging out
  if (params.get('signedout') === '1') {
    msg.classList.add('ok');
    msg.textContent = "You've been signed out.";
  }

  // arriving after the session ran out
  if (params.get('expired') === '1') {
    msg.classList.remove('ok');
    msg.textContent = 'Your session expired. Please sign in again.';
  }

  // Where to go after signing in. Only pages from this site are allowed, so a
  // link like login.html?next=https://evil.example can't send users elsewhere.
  function nextPage() {
    var next = params.get('next') || '';
    return /^[\w-]+\.html(#[\w-]+)?$/.test(next) ? next : 'home.html';
  }

  /* ---------- constraints (added) ---------- */
  // An email, or a username in the same format the register page allows
  function validIdentifier(value) {
    if (value.length > 254) return false;
    if (value.indexOf('@') > -1) return /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(value);
    return /^[a-z][a-z0-9._]{2,19}$/i.test(value);
  }

  function showError(text) {
    msg.classList.remove('ok');
    msg.textContent = text;
  }

  // After too many wrong passwords, sign-in pauses. The countdown is shown on the
  // button (not in the alert) so screen readers don't announce every second.
  var lockTimer = null;
  function showLock(seconds) {
    clearInterval(lockTimer);
    showError('Too many failed attempts. For your security, sign-in is paused for ' + formatWait(seconds) + '.');
    var left = seconds;
    submitBtn.disabled = true;
    function tick() {
      if (left <= 0) { endLock(); msg.classList.add('ok'); msg.textContent = 'You can try signing in again.'; return; }
      submitBtn.textContent = 'Try again in ' + formatWait(left);
      left--;
    }
    tick();
    lockTimer = setInterval(tick, 1000);
  }

  function endLock() {
    clearInterval(lockTimer);
    lockTimer = null;
    submitBtn.disabled = false;
    submitBtn.textContent = submitText;
  }

  function formatWait(seconds) {
    if (seconds < 60) return seconds + ' second' + (seconds === 1 ? '' : 's');
    var m = Math.floor(seconds / 60), s = seconds % 60;
    return m + ' min' + (s ? ' ' + s + ' s' : '');
  }

  // If they switch to a different account, a pause on the previous one shouldn't block them
  $('l-user').addEventListener('input', function () {
    if (lockTimer && !GreenCartAccount.loginLock($('l-user').value.trim()).locked) {
      endLock();
      msg.textContent = '';
    }
  });

  // Warn when Caps Lock is on, a common reason for a "wrong" password
  var caps = $('l-caps');
  function checkCaps(e) {
    if (e.getModifierState) caps.hidden = !e.getModifierState('CapsLock');
  }
  $('l-pass').addEventListener('keydown', checkCaps);
  $('l-pass').addEventListener('keyup', checkCaps);
  $('l-pass').addEventListener('blur', function () { caps.hidden = true; });

  var busy = false;

  $('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy || lockTimer) return;
    var user = $('l-user').value.trim();
    var pass = $('l-pass').value;
    if (!user || !pass) {
      showError('Enter your email or username and your password.');
      return;
    }
    if (!validIdentifier(user)) {
      showError('Enter a valid email address or username.');
      $('l-user').focus();
      return;
    }

    var lock = GreenCartAccount.loginLock(user);
    if (lock.locked) { showLock(lock.seconds); return; }

    busy = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in…';

    // Checks the password against the saved hash. The password itself is never saved.
    GreenCartAccount.signIn(user, pass).then(function (result) {
      busy = false;
      submitBtn.disabled = false;
      submitBtn.textContent = submitText;

      if (result.ok) {
        $('l-pass').value = '';
        msg.textContent = '';
        location.href = nextPage();
        return;
      }

      $('l-pass').value = '';
      if (result.locked) { showLock(result.retryIn); return; }

      // Same message whether the account exists or not, so attackers can't use
      // this form to find out which emails are registered.
      var warning = result.attemptsLeft > 0 && result.attemptsLeft <= 2
        ? ' ' + result.attemptsLeft + ' attempt' + (result.attemptsLeft === 1 ? '' : 's') + ' left before sign-in is paused.'
        : '';
      showError(result.message + warning);
      $('l-pass').focus();
    });
  });

  $('forgot').addEventListener('click', function (e) {
    e.preventDefault();
    msg.classList.remove('ok');
    msg.textContent = 'Password reset is not connected in this prototype.';
  });
})();
