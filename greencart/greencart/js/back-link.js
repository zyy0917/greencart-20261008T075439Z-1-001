/* Privacy page navigation.
   - <a data-back-link>  "Back to GreenCart" returns to the GreenCart page the visitor came from
                         (home or profile when signed in, index.html from the landing page).
   - <a data-home-link>  the logo goes to home.html when signed in, index.html when not.
   Load js/account.js first. Only GreenCart pages are allowed as destinations, so a
   crafted link can't use this page to send people to another website. */
(function () {
  var SITE_PAGES = ['index.html', 'home.html', 'profile.html', 'login.html', 'register.html'];
  var SIGNED_IN_PAGES = ['home.html', 'profile.html'];
  var STORE_KEY = 'greencart-privacy-back';   // remembers where they came from while they click around this page

  var signedIn = !!(window.GreenCartAccount && window.GreenCartAccount.current());
  var homePage = signedIn ? 'home.html' : 'index.html';

  // The GreenCart page that opened this one, if any
  function cameFrom() {
    if (!document.referrer) return null;
    try {
      var ref = new URL(document.referrer);
      if (ref.origin !== location.origin) return null;          // another website: ignore
      var page = ref.pathname.split('/').pop() || 'index.html';
      return SITE_PAGES.indexOf(page) > -1 ? page : null;       // privacy.html itself or unknown: ignore
    } catch (e) {
      return null;
    }
  }

  var back = cameFrom();
  try {
    if (back) sessionStorage.setItem(STORE_KEY, back);
    else back = sessionStorage.getItem(STORE_KEY);              // e.g. after clicking a link on this page
  } catch (e) { /* storage blocked: fall back below */ }

  if (!back || SITE_PAGES.indexOf(back) === -1) back = homePage;
  // Signed out: don't send them into the account area
  if (!signedIn && SIGNED_IN_PAGES.indexOf(back) > -1) back = 'index.html';

  var i;
  var backLinks = document.querySelectorAll('[data-back-link]');
  for (i = 0; i < backLinks.length; i++) backLinks[i].setAttribute('href', back);

  var homeLinks = document.querySelectorAll('[data-home-link]');
  for (i = 0; i < homeLinks.length; i++) homeLinks[i].setAttribute('href', homePage);
})();
