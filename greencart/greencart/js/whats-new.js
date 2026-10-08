(function () {
  'use strict';

  const Account = window.GreenCartAccount;
  const Consent = window.GreenCartConsent;
  const user = Account && Account.current();
  const privacy = document.getElementById('privacy');
  const list = privacy && privacy.querySelector('.consent-list');

  if (!user || !Consent || !list || document.getElementById('gc-updates')) return;

  const $ = id => document.getElementById(id);
  const key = 'greencart-feature-email-' + user.id;

  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value && typeof value.allowed === 'boolean'
        ? value
        : { allowed: false, updatedAt: null };
    } catch (error) {
      return { allowed: false, updatedAt: null };
    }
  }

  let saved = read();
  let draft = saved.allowed;

  const item = document.createElement('div');
  item.id = 'gc-updates';
  item.className = 'consent-item';

  item.innerHTML = `
    <div class="consent-row">
      <div style="min-width:0">
        <h3 id="gc-updates-label">GreenCart Updates</h3>
        <p id="gc-updates-description">Allow GreenCart to use my saved email for occasional updates about new features and improvements. Optional and separate from meal suggestions and marketing.</p>
      </div>
      <div class="switch-wrap">
        <span class="switch-state" id="gc-updates-state">Off</span>
        <button class="switch" type="button" role="switch" aria-checked="false"
          aria-labelledby="gc-updates-label"
          aria-describedby="gc-updates-description gc-updates-status"
          id="gc-updates-toggle"></button>
      </div>
    </div>
    <details>
      <summary>How your email would be used</summary>
      <ul>
        <li>Only your saved email would be used for occasional feature announcements.</li>
        <li>This permission does not include promotions, meal suggestions, or maintenance alerts.</li>
        <li>Choosing Off does not prevent you from using GreenCart.</li>
        <li>Turn this off and press Save Preferences to withdraw permission.</li>
        <li>This prototype saves permission only. It does not send emails.</li>
      </ul>
    </details>
    <p id="gc-updates-status" role="status" aria-live="polite"
       style="margin-top:10px;font-size:12px"></p>`;

  const meal = $('gc-meal-choice');

  if (meal && meal.parentElement === list) {
    meal.after(item);
  } else {
    list.appendChild(item);
  }

  const withdrawalList = document.querySelector('#withdrawModal ul');

  if (withdrawalList) {
    const note = document.createElement('li');
    note.textContent = 'Permission for GreenCart Updates emails also turns off.';
    withdrawalList.appendChild(note);
  }

  function updateData() {
    const body = $('gc-data-rows');
    if (!body) return;

    let row = $('gc-updates-data');

    if (!row) {
      row = document.createElement('tr');
      row.id = 'gc-updates-data';

      ['Information', 'Saved value', 'Purpose'].forEach(label => {
        const cell = document.createElement('td');
        cell.dataset.label = label;
        row.appendChild(cell);
      });

      body.appendChild(row);
    }

    const values = [
      'GreenCart Updates emails',
      saved.allowed ? 'Allowed' : 'Not allowed',
      'Remember your separate permission to use your saved email for feature announcements. Email delivery is not connected.'
    ];

    values.forEach((value, index) => {
      if (row.children[index].textContent !== value) {
        row.children[index].textContent = value;
      }
    });
  }

  function render(message, error) {
    $('gc-updates-toggle').setAttribute('aria-checked', String(draft));
    $('gc-updates-state').textContent = draft ? 'On' : 'Off';

    const status = $('gc-updates-status');
    const dirty = draft !== saved.allowed;

    status.style.color = error
      ? 'var(--danger)'
      : dirty
        ? 'var(--warn)'
        : 'var(--muted)';

    status.textContent = message || (
      dirty
        ? 'Unsaved change. Press Save Preferences to apply.'
        : saved.updatedAt
          ? 'Saved ' + new Date(saved.updatedAt).toLocaleString()
            + '. This prototype does not send emails.'
          : 'Off by default. No permission has been given.'
    );

    updateData();
  }

  function save(allowed, source) {
    const current = Account.current();

    if (!current || current.id !== user.id) {
      render('Your session changed. Reload this page before saving.', true);
      return false;
    }

    const record = {
      allowed: allowed,
      updatedAt: new Date().toISOString(),
      purpose: 'Use my saved email for occasional GreenCart feature announcements.',
      purposeVersion: 'feature-email-v1',
      source: source
    };

    try {
      localStorage.setItem(key, JSON.stringify(record));
    } catch (error) {
      render('Could not save this permission. Browser storage may be blocked.', true);
      return false;
    }

    saved = record;
    draft = saved.allowed;
    render();
    return true;
  }

  $('gc-updates-toggle').addEventListener('click', function () {
    draft = !draft;
    render();
  });

  $('savePrefs').addEventListener('click', function () {
    if (draft !== saved.allowed) {
      const prefs = Consent.get();

      const originalsSaved = ['analytics', 'marketing'].every(name =>
        privacy.querySelector('[data-consent="' + name + '"]')
          .getAttribute('aria-checked') === String(prefs[name])
      );

      if (save(draft, 'Saved on profile page') && originalsSaved) {
        const toast = $('toast');

        if (toast) {
          toast.textContent =
            'Preferences processed. See each permission\'s saved status below.';
          toast.classList.add('show');
          setTimeout(() => toast.classList.remove('show'), 3800);
        }
      }
    }

    updateData();
  });

  $('resetPrefs').addEventListener('click', function () {
    draft = false;
    render();
  });

  window.addEventListener('greencart:consentchange', function () {
    if (Consent.record().source === 'Withdrew all consent') {
      save(false, 'Withdrew all consent');
    }
  });

  const body = $('gc-data-rows');

  if (body) {
    new MutationObserver(updateData).observe(body, { childList: true });
  }

  window.addEventListener('storage', function (event) {
    const current = Account.current();

    if (!current || current.id !== user.id) {
      location.reload();
      return;
    }

    if (event.key === key || event.key === null) {
      const dirty = draft !== saved.allowed;
      saved = read();

      if (!dirty) draft = saved.allowed;

      render();
    }
  });

  window.addEventListener('beforeunload', function (event) {
    if (draft !== saved.allowed) {
      event.preventDefault();
      event.returnValue = '';
    }
  });

  render();
})();