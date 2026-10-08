(function () {
  'use strict';

  const Account = window.GreenCartAccount;
  const Consent = window.GreenCartConsent;
  const user = Account && Account.current();
  const privacy = document.getElementById('privacy');
  if (!user || !Consent || !privacy || document.getElementById('gc-my-data')) return;

  const key = 'greencart-meal-email-' + user.id;
  const purpose = 'Use my email to send weekly healthy meal suggestions.';
  const $ = id => document.getElementById(id);

  function readChoice() {
    try {
      const record = JSON.parse(localStorage.getItem(key) || 'null');
      return record && typeof record.allowed === 'boolean'
        ? record : { allowed: false, updatedAt: null };
    } catch (error) {
      return { allowed: false, updatedAt: null };
    }
  }

  let saved = readChoice();
  let draft = saved.allowed;

  const style = document.createElement('style');
  style.textContent = `
    #gc-my-data .gc-data-table { table-layout: fixed; }
    #gc-my-data .gc-data-table th:nth-child(1) { width: 24%; }
    #gc-my-data .gc-data-table th:nth-child(2) { width: 31%; }
    #gc-my-data .gc-data-table th:nth-child(3) { width: 45%; }
    #gc-my-data .gc-data-table td { vertical-align: top; overflow-wrap: anywhere; }
    #gc-my-data .gc-data-table td:first-child { font-weight: 600; }
    #gc-my-data .gc-data-note { margin: 16px 0 0; font-size: 12.5px; color: var(--muted); }
    #gc-meal-choice .gc-meal-copy { min-width: 0; }
    #gc-meal-choice .gc-meal-status { margin-top: 10px; font-size: 12px; }
    #gc-meal-choice .gc-meal-status.gc-unsaved { color: var(--warn); }
    #gc-meal-choice .gc-meal-status.gc-error { color: var(--danger); }
    @media (max-width: 600px) {
      #gc-my-data .gc-data-table thead { display: none; }
      #gc-my-data .gc-data-table,
      #gc-my-data .gc-data-table tbody,
      #gc-my-data .gc-data-table tr,
      #gc-my-data .gc-data-table td { display: block; width: 100%; }
      #gc-my-data .gc-data-table tr { padding: 12px 0; border-bottom: 1px solid var(--line); }
      #gc-my-data .gc-data-table tr:last-child { border-bottom: 0; }
      #gc-my-data .gc-data-table td { padding: 4px 0; border: 0; }
      #gc-my-data .gc-data-table td::before {
        content: attr(data-label) ': ';
        font-weight: 600;
        color: var(--green-900);
      }
    }
  `;
  document.head.appendChild(style);

  const card = document.createElement('section');
  card.className = 'card';
  card.id = 'gc-my-data';
  card.setAttribute('aria-labelledby', 'gc-my-data-title');
  card.innerHTML = `
    <div class="section-title">
      <span class="title-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="3" width="16" height="18" rx="2"/>
          <path d="M8 8h8M8 12h8M8 16h5"/>
        </svg>
      </span>
      <h2 id="gc-my-data-title">What GreenCart Knows About Me</h2>
    </div>
    <p class="muted">Your saved information and the purpose of each item.</p>
    <div class="table-wrap">
      <table class="gc-data-table">
        <thead><tr>
          <th scope="col">Information</th>
          <th scope="col">Saved value</th>
          <th scope="col">Why it is used</th>
        </tr></thead>
        <tbody id="gc-data-rows"></tbody>
      </table>
    </div>
    <p class="gc-data-note">This shows saved details, not unsaved edits. Use Personal Information above to update them. Account details are stored in this browser in the prototype.</p>
  `;
  privacy.before(card);

  const item = document.createElement('div');
  item.className = 'consent-item';
  item.id = 'gc-meal-choice';
  item.innerHTML = `
    <div class="consent-row">
      <div class="gc-meal-copy">
        <h3 id="gc-meal-label">Weekly Healthy Meal Suggestions</h3>
        <p id="gc-meal-desc">Allow GreenCart to use your email to send weekly healthy meal ideas. This is optional and separate from marketing.</p>
      </div>
      <div class="switch-wrap">
        <span class="switch-state" id="gc-meal-state">Off</span>
        <button class="switch" type="button" role="switch" aria-checked="false"
          aria-labelledby="gc-meal-label" aria-describedby="gc-meal-desc gc-meal-status"
          id="gc-meal-toggle"></button>
      </div>
    </div>
    <details>
      <summary>How your email would be used</summary>
      <ul>
        <li>Only your saved email would be used for weekly meal suggestions.</li>
        <li>Choosing Off does not stop you from using your account.</li>
        <li>You can turn this off and press Save Preferences to withdraw permission.</li>
        <li>This prototype saves your permission only. It does not send emails.</li>
      </ul>
    </details>
    <p class="gc-meal-status" id="gc-meal-status" role="status" aria-live="polite"></p>
  `;
  privacy.querySelector('.consent-list').appendChild(item);

  const withdrawalList = document.querySelector('#withdrawModal ul');
  if (withdrawalList) {
    const explanation = document.createElement('li');
    explanation.textContent = 'Permission for weekly healthy meal suggestions also turns off.';
    withdrawalList.appendChild(explanation);
  }

  function renderData() {
    const current = Account.current();
    if (!current || current.id !== user.id) return;
    const prefs = Consent.get();
    const rows = [
      ['Full name', current.fullName || 'Not provided', 'Identify your account.'],
      ['Username', current.username || 'Not provided', 'Let you sign in using your username.'],
      ['Email', current.email || 'Not provided', saved.allowed
        ? 'Identify your account; you also allowed weekly meal suggestions. Email delivery is not connected.'
        : 'Identify your account. Permission for weekly meal suggestions is off.'],
      ['Phone number', current.phone || 'Not provided', 'Optional contact detail. Delivery contact is planned for the prototype.'],
      ['Delivery address', current.address || 'Not provided', 'Optional delivery detail. Delivery processing is not connected.'],
      ['Profile photo', current.photo ? 'Photo saved' : 'No photo saved', 'Display your chosen account photo.'],
      ['Analytics choice', prefs.analytics ? 'On' : 'Off', 'Remember your saved analytics preference on this browser.'],
      ['Marketing choice', prefs.marketing ? 'On' : 'Off', 'Remember your saved marketing preference on this browser.'],
      ['Weekly meal suggestions', saved.allowed ? 'Allowed' : 'Not allowed', 'Remember your separate permission for this email purpose.']
    ];
    $('gc-data-rows').replaceChildren();
    rows.forEach(values => {
      const row = document.createElement('tr');
      values.forEach((value, index) => {
        const cell = document.createElement('td');
        cell.dataset.label = ['Information', 'Saved value', 'Purpose'][index];
        cell.textContent = value;
        row.appendChild(cell);
      });
      $('gc-data-rows').appendChild(row);
    });
  }

  function renderChoice(message, error) {
    const dirty = draft !== saved.allowed;
    $('gc-meal-toggle').setAttribute('aria-checked', String(draft));
    $('gc-meal-state').textContent = draft ? 'On' : 'Off';
    const status = $('gc-meal-status');
    status.classList.toggle('gc-unsaved', dirty);
    status.classList.toggle('gc-error', Boolean(error));
    status.textContent = message || (dirty
      ? 'Unsaved change. Press Save Preferences to apply.'
      : saved.updatedAt
        ? 'Saved ' + new Date(saved.updatedAt).toLocaleString() + '. Emails are not sent by this prototype.'
        : 'Off by default. No permission has been given.');
  }

  function saveChoice(allowed, source) {
    const current = Account.current();
    if (!current || current.id !== user.id) {
      renderChoice('Your session changed. Reload this page before saving.', true);
      return false;
    }
    const record = {
      allowed: allowed,
      updatedAt: new Date().toISOString(),
      purpose: purpose,
      purposeVersion: 'meal-email-v1',
      source: source
    };
    try {
      localStorage.setItem(key, JSON.stringify(record));
    } catch (error) {
      renderChoice('Could not save this permission. Browser storage may be blocked.', true);
      return false;
    }
    saved = record;
    draft = saved.allowed;
    renderChoice();
    renderData();
    return true;
  }

  $('gc-meal-toggle').addEventListener('click', function () {
    draft = !draft;
    renderChoice();
  });

  $('savePrefs').addEventListener('click', function () {
    if (draft !== saved.allowed) {
      const originalChoices = Consent.get();
      const analyticsSwitch = privacy.querySelector('[data-consent="analytics"]');
      const marketingSwitch = privacy.querySelector('[data-consent="marketing"]');
      const originalsSaved = [
        [analyticsSwitch, originalChoices.analytics],
        [marketingSwitch, originalChoices.marketing]
      ].every(pair => pair[0].getAttribute('aria-checked') === String(pair[1]));
      const ok = saveChoice(draft, 'Saved on profile page');
      if (ok && originalsSaved) {
        const toast = $('toast');
        if (toast) {
          toast.textContent = 'Preferences saved. Weekly meal suggestions: ' + (saved.allowed ? 'On.' : 'Off.');
          toast.classList.add('show');
          setTimeout(() => toast.classList.remove('show'), 3800);
        }
      }
    }
    renderData();
  });

  $('resetPrefs').addEventListener('click', function () {
    draft = false;
    renderChoice();
  });

  window.addEventListener('greencart:consentchange', function () {
    const record = Consent.record();
    if (record.source === 'Withdrew all consent') {
      saveChoice(false, 'Withdrew all consent');
    }
    renderData();
  });

  $('profileForm').addEventListener('submit', renderData);
  const personal = $('personal');
  if (personal) {
    new MutationObserver(renderData).observe(personal, {
      attributes: true, childList: true, subtree: true
    });
  }

  window.addEventListener('storage', function (event) {
    const current = Account.current();
    if (!current || current.id !== user.id) {
      location.reload();
      return;
    }
    if (event.key === key || event.key === null) {
      const hadUnsavedChange = draft !== saved.allowed;
      saved = readChoice();
      if (!hadUnsavedChange) draft = saved.allowed;
      renderChoice();
    }
    renderData();
  });

  window.addEventListener('beforeunload', function (event) {
    if (draft !== saved.allowed) {
      event.preventDefault();
      event.returnValue = '';
    }
  });

  renderChoice();
  renderData();
})();