/* Privacy Notice page */
(function () {
  var consent = window.GreenCartConsent, state = consent.state;
  var $ = function (id) { return document.getElementById(id); };
  var analytics = $('p-analytics'), marketing = $('p-marketing'), status = $('p-status');

  function render() {
    analytics.setAttribute('aria-checked', state.analytics ? 'true' : 'false');
    marketing.setAttribute('aria-checked', state.marketing ? 'true' : 'false');
  }
  function say(text) { status.textContent = text; }

  analytics.addEventListener('click', function () { state.analytics = !state.analytics; render(); say(''); });
  marketing.addEventListener('click', function () { state.marketing = !state.marketing; render(); say(''); });

  $('p-accept').addEventListener('click', function () { state.analytics = state.marketing = true; consent.save(); render(); say('All cookies accepted.'); });
  $('p-reject').addEventListener('click', function () { state.analytics = state.marketing = false; consent.save(); render(); say('Optional cookies rejected.'); });
  $('p-save').addEventListener('click', function () { consent.save(); say('Preferences saved.'); });

  render();
})();
