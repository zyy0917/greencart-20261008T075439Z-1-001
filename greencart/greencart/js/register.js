/* Register page */
(function () {
  // Only people who agreed in the popup on the landing page can use this form.
  if (!window.GreenCartConsent.hasRegisterConsent()) {
    location.replace('index.html?register=1');
    return;
  }

  var $ = function (id) { return document.getElementById(id); };
  var msg = $('r-msg');
  var form = $('register-form');
  var Account = window.GreenCartAccount;   // saves the account and a hash of the password
  var Policy = window.GreenCartPassword;   // password rules shared with the profile page
  var submitBtn = form.querySelector('button[type="submit"]');
  var submitText = submitBtn.textContent;

  /* =======================================================
     Security constraints 
     ======================================================= */
  var LIMITS = { nameMax: 60, userMin: 3, userMax: 20, emailMax: 254 };

  // Usernames people could use to pretend to be the shop
  var RESERVED_USERNAMES = ['admin', 'administrator', 'root', 'system', 'support', 'help', 'staff',
    'moderator', 'owner', 'security', 'official', 'null', 'undefined'];

  // Remove invisible control characters and extra spaces
  function clean(text) {
    return text.replace(/[\u0000-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim();
  }

  function checkName(name) {
    if (name.length > LIMITS.nameMax) return 'Your name can be up to ' + LIMITS.nameMax + ' characters.';
    // Letters from any language (ñ, é…), plus spaces, hyphens, apostrophes and periods
    if (!/^\p{L}[\p{L}\p{M} .'-]*$/u.test(name) || (name.match(/\p{L}/gu) || []).length < 2) {
      return 'Use letters in your name. Spaces, hyphens, apostrophes and periods are okay.';
    }
    return '';
  }

  function checkUsername(user) {
    if (user.length < LIMITS.userMin || user.length > LIMITS.userMax) {
      return 'Usernames are ' + LIMITS.userMin + ' to ' + LIMITS.userMax + ' characters long.';
    }
    if (!/^[a-z][a-z0-9._]*$/.test(user)) {
      return 'Start your username with a letter, then use only letters, numbers, . or _';
    }
    if (/[._]{2}/.test(user) || /[._]$/.test(user)) {
      return "Usernames can't end with . or _ or have two of them in a row.";
    }
    if (RESERVED_USERNAMES.indexOf(user) > -1 || user.indexOf('greencart') > -1) {
      return 'That username is reserved. Please choose another one.';
    }
    if (Account.isTaken(user)) return 'That username is already taken. Please choose another one.';
    return '';
  }

  function checkEmail(email) {
    if (email.length > LIMITS.emailMax || !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) {
      return 'Enter a valid email address.';
    }
    if (Account.isTaken(email)) return 'An account with this email already exists. Try logging in instead.';
    return '';
  }

  // What the password may not contain
  function personalInfo() {
    return [clean($('r-name').value), $('r-user').value.trim(), $('r-email').value.trim()];
  }

  /* ---------- Live feedback ---------- */
  var STRENGTH = [
    null,
    { label: 'Weak', color: '#b3412e', width: '25%' },
    { label: 'Fair', color: '#c98a1e', width: '50%' },
    { label: 'Good', color: '#6f8f4e', width: '75%' },
    { label: 'Strong', color: '#3f5f39', width: '100%' }
  ];

  function setRule(listId, rule, met) {
    var li = document.querySelector('#' + listId + ' [data-rule="' + rule + '"]');
    if (li) li.classList.toggle('met', met);
  }

  function updatePasswordFeedback() {
    var p1 = $('r-pass').value, p2 = $('r-pass2').value;
    var rules = Policy.rules(p1, personalInfo());
    setRule('r-pass-rules', 'length', rules.length);
    setRule('r-pass-rules', 'common', rules.common);
    setRule('r-pass-rules', 'personal', rules.personal);
    setRule('r-pass2-rules', 'match', !!p2 && p1 === p2);

    var meter = $('r-pass-meter');
    var s = STRENGTH[Policy.strength(p1, personalInfo())];
    meter.hidden = !s;
    if (s) {
      var bar = meter.querySelector('.pw-bar span');
      bar.style.width = s.width;
      bar.style.background = s.color;
      var label = meter.querySelector('.pw-label');
      label.textContent = s.label;
      label.style.color = s.color;
    }
  }

  function markInvalid(id, invalid) {
    var input = $(id);
    input.closest('.field').classList.toggle('invalid', invalid);
    if (invalid) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  function fail(id, text) {
    msg.classList.remove('ok');
    msg.textContent = text;
    markInvalid(id, true);
    $(id).focus();
  }

  ['r-name', 'r-user', 'r-email', 'r-pass', 'r-pass2'].forEach(function (id) {
    $(id).addEventListener('input', function () {
      // the message was about this field, and they're fixing it now
      if ($(id).closest('.field').classList.contains('invalid')) msg.textContent = '';
      markInvalid(id, false);
      updatePasswordFeedback(); // name, username and email affect the "personal" rule
    });
  });

  // Tidy up as people leave a field: usernames and emails are not case-sensitive
  $('r-user').addEventListener('blur', function () { this.value = this.value.trim().toLowerCase(); });
  $('r-email').addEventListener('blur', function () { this.value = this.value.trim().toLowerCase(); });
  $('r-name').addEventListener('blur', function () { this.value = clean(this.value); });

  var submitting = false;

  $('register-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (submitting) return; // stop double submits
    form.classList.add('tried');

    var name = clean($('r-name').value), user = $('r-user').value.trim().toLowerCase(), email = $('r-email').value.trim().toLowerCase();
    var p1 = $('r-pass').value, p2 = $('r-pass2').value;

    // Original checks
    if (!name || !user || !email || !p1 || !p2) {
      var empty = ['r-name', 'r-user', 'r-email', 'r-pass', 'r-pass2'].filter(function (id) { return !$(id).value.trim(); })[0];
      fail(empty, 'Fill in every field to create your account.');
      return;
    }

    // Added constraints, checked top to bottom so the first problem is shown
    var problems = [
      ['r-name', checkName(name)],
      ['r-user', checkUsername(user)],
      ['r-email', checkEmail(email)],
      ['r-pass', Policy.problem(p1, [name, user, email])],
      ['r-pass2', p1 !== p2 ? 'The two passwords do not match.' : '']
    ];
    for (var i = 0; i < problems.length; i++) {
      if (problems[i][1]) { fail(problems[i][0], problems[i][1]); return; }
    }

    submitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account…';

    // Save the details and a salted hash of the password. The password itself is never saved.
    Account.createAccount({ fullName: name, username: user, email: email }, p1).then(function (result) {
      if (!result.ok) {
        submitting = false;
        submitBtn.disabled = false;
        submitBtn.textContent = submitText;
        fail('r-email', result.message);
        return;
      }
      $('r-pass').value = '';
      $('r-pass2').value = '';
      msg.textContent = '';
      location.href = 'login.html?registered=1';
    });
  });
})();
