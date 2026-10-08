/* Consent state shared across pages.
   Exposes window.GreenCartConsent = {
     state, save(),                                cookie choices (popup on first visit + privacy page)
     hasRegisterConsent(), giveRegisterConsent()   agreement to register (popup on the Register button)

     Added for the profile page (Privacy Settings & Consent Preferences):
     get()                 current choices as { essential, analytics, marketing }
     save(prefs, source)   set the choices and log where they were made, e.g.
                             save({ analytics: true, marketing: true }, 'Accepted all on privacy notice')
                           save() with no arguments still saves `state` exactly as before
     withdraw(source)      turn analytics and marketing off and log it
     hasDecided()          true once the user has made a choice
     allows(category)      check before running analytics or marketing code:
                             if (GreenCartConsent.allows('analytics')) { ... }
     record()              { decided, updatedAt, source, history } for the profile page
   } */
window.GreenCartConsent = (function () {
  var KEY = 'greencart-consent';
  var HISTORY_KEY = 'greencart-consent-history';
  var REG_KEY = 'greencart-register-consent';
  var MAX_HISTORY = 20;

  // Privacy by default: only essential cookies are on until the user opts in.
  var DEFAULTS = Object.freeze({ essential: true, analytics: false, marketing: false });

  var state = { analytics: false, marketing: false, decided: false };
  var meta = { updatedAt: null, source: null };

  // Read the saved choice into `state`. Called again before each read so
  // changes made on another page or tab are picked up.
  function load() {
    try {
      var saved = localStorage.getItem(KEY);
      var p = saved ? JSON.parse(saved) : {};
      state.analytics = !!p.analytics;
      state.marketing = !!p.marketing;
      state.decided = !!p.decided;
      meta.updatedAt = p.updatedAt || null;
      meta.source = p.source || null;
    } catch (e) { /* storage unavailable: keep what we have */ }
  }
  load();

  function readHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') || []; }
    catch (e) { return []; }
  }

  // save()               saves `state` as it is (how the popup and privacy page already use it)
  // save(prefs, source)  sets the choices first and records where they were made
  // Returns true if the choice was stored, false if the browser blocked storage.
  function save(prefs, source) {
    if (prefs) {
      state.analytics = !!prefs.analytics;
      state.marketing = !!prefs.marketing;
    }
    state.decided = true;
    meta.updatedAt = new Date().toISOString();
    meta.source = source || 'Privacy notice';

    try {
      localStorage.setItem(KEY, JSON.stringify({
        analytics: state.analytics,
        marketing: state.marketing,
        decided: true,
        updatedAt: meta.updatedAt,
        source: meta.source
      }));
    } catch (e) {
      return false;
    }

    // Keep a short log of every change so users can review what they agreed to and when
    try {
      var entry = {
        at: meta.updatedAt,
        source: meta.source,
        prefs: { essential: true, analytics: state.analytics, marketing: state.marketing }
      };
      localStorage.setItem(HISTORY_KEY, JSON.stringify([entry].concat(readHistory()).slice(0, MAX_HISTORY)));
    } catch (e) { /* the choice itself is saved even if the log can't be */ }

    try {
      window.dispatchEvent(new CustomEvent('greencart:consentchange', {
        detail: { analytics: state.analytics, marketing: state.marketing }
      }));
    } catch (e) {}
    return true;
  }

  function get() {
    load();
    return { essential: true, analytics: state.analytics, marketing: state.marketing };
  }

  function hasDecided() {
    load();
    return state.decided;
  }

  function allows(category) {
    if (category === 'essential') return true;
    load();
    return state.decided && state[category] === true;
  }

  function withdraw(source) {
    return save({ analytics: false, marketing: false }, source || 'Withdrew all consent');
  }

  function record() {
    load();
    return {
      decided: state.decided,
      updatedAt: meta.updatedAt,
      source: meta.source,
      history: readHistory()
    };
  }

  function storageWorks() {
    try { localStorage.setItem('gc-test', '1'); localStorage.removeItem('gc-test'); return true; }
    catch (e) { return false; }
  }

  // If the browser blocks storage we can't remember the choice, so don't lock people out.
  function hasRegisterConsent() {
    if (!storageWorks()) return true;
    try { return !!JSON.parse(localStorage.getItem(REG_KEY) || 'null'); } catch (e) { return false; }
  }

  function giveRegisterConsent() {
    try { localStorage.setItem(REG_KEY, JSON.stringify({ agreed: true, at: new Date().toISOString() })); } catch (e) {}
  }

  return {
    // existing
    state: state,
    save: save,
    hasRegisterConsent: hasRegisterConsent,
    giveRegisterConsent: giveRegisterConsent,
    // added for the profile page
    STORAGE_KEY: KEY,
    DEFAULTS: DEFAULTS,
    get: get,
    withdraw: withdraw,
    hasDecided: hasDecided,
    allows: allows,
    record: record
  };
})();
