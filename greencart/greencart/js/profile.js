/* =========================================================
   GreenCart — Profile page
   ========================================================= */
(function () {
  'use strict';

  const Account = window.GreenCartAccount;
  const Consent = window.GreenCartConsent;
  if (!Account || !Consent) {
    console.error('profile.js: load js/consent.js and js/account.js before js/profile.js');
    return;
  }
  if (!Account.requireSignIn()) return;

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---------- Helpers ----------
  function formatDate(iso) {
    return new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
  }

  const toastEl = $('#toast');
  let toastTimer;
  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3800);
  }

  /* =======================================================
     Personal information (the signed-in account)
     ======================================================= */
  let user = Account.current();
  const session = Account.session();
  const form = $('#profileForm');
  const FIELDS = ['fullName', 'email', 'phone', 'address'];
  let profileDirty = false;

  function initials() {
    const name = user.fullName || user.email || user.username || '';
    return name.trim().split(/\s+/).slice(0, 2)
      .map(part => part[0]).join('').toUpperCase() || '?';
  }

  function renderAvatars() {
    $$('[data-avatar]').forEach(el => {
      if (user.photo) {
        el.style.backgroundImage = `url("${user.photo}")`;
        el.textContent = '';
      } else {
        el.style.backgroundImage = '';
        el.textContent = initials();
      }
    });
    $('#removePhoto').hidden = !user.photo;
  }

  // Show who is signed in, using what they typed on the login page
  function renderIdentity() {
    const name = $('#identityName');
    name.textContent = user.fullName || 'Add your name below';
    name.classList.toggle('empty', !user.fullName);

    const signedInAs = `Signed in as ${session.signedInWith}`;
    $('#identitySub').textContent = signedInAs;
    $('#sessionInfo').textContent =
      `${signedInAs} on this device since ${formatDate(session.signedInAt)}. Your privacy choices stay saved when you log out.`;
  }

  function fillForm() {
    FIELDS.forEach(name => { form.elements[name].value = user[name] || ''; });
  }

  const validators = {
    fullName: v => v.length >= 2 || 'Please enter your full name.',
    email: v => {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Enter a valid email, like name@example.com.';
      if (Account.isTaken(v)) return 'Another account on this device already uses this email.';
      return true;
    },
    // phone and address are optional, but must look right if filled in
    phone:   v => !v || (/^[+\d\s()-]+$/.test(v) && v.replace(/\D/g, '').length >= 7) || 'Enter a valid phone number.',
    address: v => !v || v.length >= 5 || 'Enter a full delivery address.'
  };

  function showError(input, message) {
    const error = $('#' + input.name + '-error');
    if (message) {
      input.setAttribute('aria-invalid', 'true');
      error.textContent = message;
    } else {
      input.removeAttribute('aria-invalid');
      error.textContent = '';
    }
  }

  function validateField(name) {
    const input = form.elements[name];
    const result = validators[name](input.value.trim());
    showError(input, result === true ? '' : result);
    return result === true;
  }

  form.addEventListener('input', e => {
    profileDirty = true;
    if (e.target.hasAttribute('aria-invalid')) validateField(e.target.name);
  });

  form.addEventListener('focusout', e => {
    if (FIELDS.includes(e.target.name) && e.target.value) validateField(e.target.name);
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const results = FIELDS.map(validateField);
    const firstInvalid = FIELDS.find((name, i) => !results[i]);
    if (firstInvalid) {
      form.elements[firstInvalid].focus();
      toast('Please fix the highlighted fields.');
      return;
    }
    const changes = {};
    FIELDS.forEach(name => { changes[name] = form.elements[name].value.trim(); });
    const updated = Account.update(changes);
    if (!updated) {
      toast('Could not save. Your browser storage is full or blocked.');
      return;
    }
    user = updated;
    profileDirty = false;
    renderAvatars();
    renderIdentity();
    toast('Your personal information was saved.');
  });

  // ---------- Profile photo ----------
  const photoInput = $('#photoInput');
  $('#changePhoto').addEventListener('click', () => photoInput.click());

  photoInput.addEventListener('change', () => {
    const file = photoInput.files[0];
    photoInput.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Please choose an image file (JPG, PNG, or WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('That image is over 5 MB. Please choose a smaller one.');
      return;
    }
    resizeImage(file, 256)
      .then(dataUrl => {
        const updated = Account.update({ photo: dataUrl });
        if (!updated) {
          toast('Could not save the photo. Your browser storage is full.');
          return;
        }
        user = updated;
        renderAvatars();
        toast('Profile photo updated.');
      })
      .catch(() => toast('Sorry, that image could not be opened.'));
  });

  $('#removePhoto').addEventListener('click', () => {
    const updated = Account.update({ photo: '' });
    if (updated) user = updated;
    renderAvatars();
    $('#changePhoto').focus();
    toast('Profile photo removed.');
  });

  // Crop to a square and shrink, so the photo fits comfortably in localStorage
  function resizeImage(file, size) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        canvas.getContext('2d').drawImage(
          img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size
        );
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(); };
      img.src = url;
    });
  }

  /* =======================================================
     Privacy settings & consent preferences
     ======================================================= */
  const LABELS = { analytics: 'Analytics', marketing: 'Marketing' };
  const switches = $$('.switch[data-consent]');
  const statusEl = $('#consentStatus');

  let saved = Consent.get();       // what is stored
  let draft = { ...saved };        // what the toggles currently show

  function consentDirty() {
    return Object.keys(LABELS).some(key => draft[key] !== saved[key]);
  }

  function describe(prefs) {
    return Object.keys(LABELS).map(key => `${LABELS[key]} ${prefs[key] ? 'on' : 'off'}`).join(', ');
  }

  function renderSwitches() {
    switches.forEach(sw => {
      const key = sw.dataset.consent;
      sw.setAttribute('aria-checked', String(draft[key]));
      $(`[data-state-for="${key}"]`).textContent = draft[key] ? 'On' : 'Off';
    });
    renderStatus();
  }

  function renderStatus() {
    const text = $('.status-text', statusEl);
    const record = Consent.record();
    const dirty = consentDirty();
    statusEl.classList.toggle('dirty', dirty);

    if (dirty) {
      text.textContent = 'You have unsaved changes. Press Save Preferences to apply them.';
    } else if (record && record.updatedAt) {
      text.textContent = `Last updated ${formatDate(record.updatedAt)} · ${record.source}`;
    } else if (record && record.decided) {
      // choice saved before change tracking was added, so there is no date to show
      text.textContent = 'Your current choice was saved earlier on the privacy notice.';
    } else {
      text.textContent = "You haven't made a choice yet, so only essential cookies are on.";
    }
  }

  // Consent history: filter by where the choice was made, show 5 at a time
  const HISTORY_STEP = 5;
  let historyShown = HISTORY_STEP;
  const historyFilter = $('#historyFilter');
  const historyMore = $('#historyMore');

  function historyType(source) {
    const s = (source || '').toLowerCase();
    if (s.includes('withdr')) return 'withdraw';
    if (s.includes('profile')) return 'profile';
    return 'notice';
  }

  function renderHistory() {
    const list = $('#historyList');
    const record = Consent.record();
    const all = (record && record.history) || [];
    const filter = historyFilter ? historyFilter.value : 'all';
    const matching = filter === 'all' ? all : all.filter(entry => historyType(entry.source) === filter);
    const entries = matching.slice(0, historyShown);
    list.replaceChildren();

    if ($('#historyTotal')) $('#historyTotal').textContent = all.length ? `(${all.length})` : '';
    if ($('#historyCount')) {
      $('#historyCount').textContent = matching.length ? `Showing ${entries.length} of ${matching.length}` : '';
    }
    if (historyMore) {
      historyMore.hidden = matching.length <= HISTORY_STEP;
      const left = matching.length - entries.length;
      historyMore.textContent = left > 0 ? `Show more (${Math.min(left, HISTORY_STEP)})` : 'Show less';
      historyMore.dataset.mode = left > 0 ? 'more' : 'less';
    }

    if (!entries.length) {
      const li = document.createElement('li');
      li.className = 'history-empty';
      li.textContent = all.length ? 'No changes of this type yet.' : 'No choices recorded yet.';
      list.append(li);
      return;
    }

    entries.forEach(entry => {
      const li = document.createElement('li');

      const info = document.createElement('div');
      const source = document.createElement('strong');
      source.textContent = entry.source;
      const time = document.createElement('time');
      time.dateTime = entry.at;
      time.textContent = formatDate(entry.at);
      info.append(source, document.createElement('br'), time);

      const chips = document.createElement('div');
      chips.className = 'chips';
      Object.keys(LABELS).forEach(key => {
        const chip = document.createElement('span');
        chip.className = 'chip' + (entry.prefs[key] ? ' on' : '');
        chip.textContent = `${LABELS[key]}: ${entry.prefs[key] ? 'On' : 'Off'}`;
        chips.append(chip);
      });

      li.append(info, chips);
      list.append(li);
    });
  }

  if (historyFilter) {
    historyFilter.addEventListener('change', () => {
      historyShown = HISTORY_STEP;   // start from the newest 5 again
      renderHistory();
    });
  }
  if (historyMore) {
    historyMore.addEventListener('click', () => {
      historyShown = historyMore.dataset.mode === 'more' ? historyShown + HISTORY_STEP : HISTORY_STEP;
      renderHistory();
    });
  }

  function refreshFromStore() {
    saved = Consent.get();
    draft = { ...saved };
    renderSwitches();
    renderHistory();
  }

  // Toggle a switch (changes the draft only; nothing is applied until Save)
  switches.forEach(sw => {
    sw.addEventListener('click', () => {
      const key = sw.dataset.consent;
      draft[key] = !draft[key];
      renderSwitches();
    });
  });

  // Save Preferences
  $('#savePrefs').addEventListener('click', () => {
    if (!consentDirty() && Consent.hasDecided()) {
      toast('No changes to save.');
      return;
    }
    if (!Consent.save(draft, 'Saved on profile page')) {
      toast('Could not save your preferences. Your browser storage is blocked.');
      return;
    }
    refreshFromStore();
    toast(`Preferences saved: ${describe(saved)}.`);
  });

  // Reset to Default (privacy by default: optional categories off)
  $('#resetPrefs').addEventListener('click', () => {
    draft = { ...Consent.DEFAULTS };
    renderSwitches();
    toast(consentDirty()
      ? 'Reset to default: analytics and marketing off. Press Save Preferences to apply.'
      : 'Your settings already match the default.');
  });

  // ---------- Withdraw All Consent (with confirmation) ----------
  const modal = $('#withdrawModal');
  let lastFocus = null;

  function openModal() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    $('[data-close]', modal).focus();
    document.addEventListener('keydown', onModalKey);
  }

  function closeModal() {
    modal.hidden = true;
    document.removeEventListener('keydown', onModalKey);
    if (lastFocus) lastFocus.focus();
  }

  function onModalKey(e) {
    if (e.key === 'Escape') {
      closeModal();
    } else if (e.key === 'Tab') {
      // keep keyboard focus inside the dialog
      const buttons = $$('button', modal);
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  $('#withdrawBtn').addEventListener('click', openModal);
  $('[data-close]', modal).addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  $('#confirmWithdraw').addEventListener('click', () => {
    if (!Consent.withdraw('Withdrew all consent')) {
      closeModal();
      toast('Could not save. Your browser storage is blocked.');
      return;
    }
    refreshFromStore();
    closeModal();
    toast('Consent withdrawn. Only essential cookies are on now.');
  });

  // Keep in sync if consent changes in another tab (e.g. the cookie banner)
  window.addEventListener('storage', e => {
    if (e.key === Consent.STORAGE_KEY && !consentDirty()) refreshFromStore();
  });

  // Warn before leaving with unsaved changes
  window.addEventListener('beforeunload', e => {
    if (profileDirty || consentDirty()) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  /* =======================================================
     Security
     ======================================================= */
  const pwForm = $('#passwordForm');
  const pwButton = pwForm.querySelector('button[type="submit"]');
  const pwButtonText = pwButton.textContent;
  let pwBusy = false;

  function renderPasswordInfo() {
    const changedAt = Account.passwordChangedAt();
    $('#pwChanged').textContent = changedAt ? `Password last changed ${formatDate(changedAt)}.` : '';
  }

  pwForm.addEventListener('input', e => {
    if (e.target.hasAttribute('aria-invalid')) showError(e.target, '');
  });

  pwForm.addEventListener('submit', e => {
    e.preventDefault();
    if (pwBusy) return;
    const current = pwForm.elements.currentPassword;
    const next = pwForm.elements.newPassword;
    const confirm = pwForm.elements.confirmPassword;

    // Same rules as the register page (js/password-policy.js)
    const policyProblem = window.GreenCartPassword
      ? window.GreenCartPassword.problem(next.value, [user.fullName, user.username, user.email])
      : (next.value.length < 8 ? 'Use at least 8 characters.' : '');

    const errors = [
      [current, current.value ? '' : 'Enter your current password.'],
      [next, policyProblem || (next.value === current.value ? 'Choose a password different from your current one.' : '')],
      [confirm, confirm.value === next.value ? '' : "Passwords don't match."]
    ];

    let firstInvalid = null;
    errors.forEach(([input, message]) => {
      showError(input, message);
      if (message && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) { firstInvalid.focus(); return; }

    // Checks the current password against the saved hash, then saves a new hash.
    // The password itself is never stored.
    pwBusy = true;
    pwButton.disabled = true;
    pwButton.textContent = 'Updating…';
    Account.changePassword(current.value, next.value).then(result => {
      pwBusy = false;
      pwButton.disabled = false;
      pwButton.textContent = pwButtonText;

      if (!result.ok) {
        const input = pwForm.elements[result.field] || current;
        if (result.field === 'currentPassword') current.value = '';
        showError(input, result.message);
        input.focus();
        return;
      }
      pwForm.reset();
      renderPasswordInfo();
      toast('Password updated. Use your new password next time you sign in.');
    });
  });

  $$('[data-action="logout"]').forEach(btn => {
    btn.addEventListener('click', () => {
      Account.signOut(); // consent choices are kept
      window.location.href = Account.LOGIN_PAGE + '?signedout=1';
    });
  });

  /* =======================================================
     Header menu and sidebar
     ======================================================= */
  const avatarBtn = $('#avatarBtn');
  const menu = $('#accountMenu');

  function setMenu(open) {
    menu.hidden = !open;
    avatarBtn.setAttribute('aria-expanded', String(open));
  }

  avatarBtn.addEventListener('click', e => { e.stopPropagation(); setMenu(menu.hidden); });
  document.addEventListener('click', e => { if (!menu.hidden && !menu.contains(e.target)) setMenu(false); });
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menu.hidden) { setMenu(false); avatarBtn.focus(); }
  });

  // Highlight the sidebar link for the section on screen
  const navLinks = $$('.nav-link');
  const sections = navLinks.map(link => $(link.getAttribute('href')));

  function setActive(id) {
    navLinks.forEach(link => {
      const isActive = link.getAttribute('href') === '#' + id;
      link.classList.toggle('active', isActive);
      if (isActive) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setActive(entry.target.id); });
    }, { rootMargin: '-30% 0px -65% 0px' });
    sections.forEach(section => observer.observe(section));
  }

  window.addEventListener('scroll', () => {
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom) setActive(sections[sections.length - 1].id);
  }, { passive: true });

  navLinks.forEach(link => {
    link.addEventListener('click', () => setActive(link.getAttribute('href').slice(1)));
  });

  // ---------- Start ----------
  fillForm();
  renderAvatars();
  renderIdentity();
  renderPasswordInfo();
  renderSwitches();
  renderHistory();
})();
