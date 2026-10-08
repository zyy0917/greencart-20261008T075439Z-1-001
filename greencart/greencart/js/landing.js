/* Landing page: cookie popup (first visit) and registration consent popup (Register button) */
(function () {
  var consent = window.GreenCartConsent, state = consent.state;
  var $ = function (id) { return document.getElementById(id); };

  // Where "Agree & Continue" goes. 'register.html' = the sign-up form, which then leads to login.
  // Change to 'login.html' to skip the form.
  var AFTER_AGREE = 'register.html';

  // true  = show the privacy popup every time index.html opens (it starts on the saved choice)
  // false = show it only until the visitor makes their first choice
  var SHOW_EVERY_VISIT = false;
  var answeredThisVisit = false;

  var cookieOverlay = $('consent-overlay'), sw = $('modal-analytics'), dot = $('modal-dot');
  // Added: Marketing row, so "Accept All" no longer turns on something people can't see
  var swMarketing = $('modal-marketing'), dotMarketing = $('modal-dot-marketing');
  var regOverlay = $('register-overlay'), agree = $('reg-agree'), regContinue = $('reg-continue'), note = $('reg-note');
  var pendingRegister = false;

  /* ---------- cookie popup ---------- */
  // Has the cookie popup been answered (this visit, or ever, depending on the setting)?
  function cookiesAnswered() {
    return SHOW_EVERY_VISIT ? answeredThisVisit : state.decided;
  }
  function renderCookies() {
    sw.setAttribute('aria-checked', state.analytics ? 'true' : 'false');
    dot.className = 'dot' + (state.analytics ? '' : ' off');
    if (swMarketing) {
      swMarketing.setAttribute('aria-checked', state.marketing ? 'true' : 'false');
      dotMarketing.className = 'dot' + (state.marketing ? '' : ' off');
    }
    cookieOverlay.hidden = cookiesAnswered();
  }
  function cookiesDone() {
    answeredThisVisit = true;
    consent.save();
    renderCookies();
    if (pendingRegister) { pendingRegister = false; openRegister(); }
  }

  sw.addEventListener('click', function () { state.analytics = !state.analytics; renderCookies(); });
  if (swMarketing) swMarketing.addEventListener('click', function () { state.marketing = !state.marketing; renderCookies(); });
  $('modal-accept').addEventListener('click', function () { state.analytics = state.marketing = true; cookiesDone(); });
  $('modal-reject').addEventListener('click', function () { state.analytics = state.marketing = false; cookiesDone(); });
  $('modal-manage').addEventListener('click', cookiesDone);

  /* ---------- registration consent popup ---------- */
  function openRegister() {
    if (!cookiesAnswered()) { pendingRegister = true; return; }   // cookie popup goes first
    note.textContent = '';
    agree.checked = false;
    regContinue.disabled = true;
    regOverlay.hidden = false;
    agree.focus();
  }
  function decline() {
    regOverlay.hidden = true;
    note.textContent = 'You need to agree to the Privacy Notice to create an account.';
    $('register-btn').focus();
  }

  $('register-btn').addEventListener('click', function (e) {
    e.preventDefault();
    if (consent.hasRegisterConsent()) { location.href = AFTER_AGREE; return; }
    openRegister();
  });
  agree.addEventListener('change', function () { regContinue.disabled = !agree.checked; });
  regContinue.addEventListener('click', function () {
    if (!agree.checked) return;
    consent.giveRegisterConsent();
    location.href = AFTER_AGREE;
  });
  $('reg-decline').addEventListener('click', decline);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !regOverlay.hidden) decline();
  });

  /* ---------- start ---------- */
  renderCookies();
  // register.html sends people here if they haven't agreed yet
  if (new URLSearchParams(location.search).get('register') === '1') {
    history.replaceState(null, '', location.pathname);
    openRegister();
  }

  // Browsers can restore this page from memory when someone presses Back, without
  // running this script again. Show the popup in that case too.
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && SHOW_EVERY_VISIT) {
      answeredThisVisit = false;
      pendingRegister = false;
      regOverlay.hidden = true;
      renderCookies();
    }
  });
})();
