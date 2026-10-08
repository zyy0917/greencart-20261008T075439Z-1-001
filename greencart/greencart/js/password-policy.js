/* Password rules shared by the register page and the profile's Change Password,
   so both always enforce exactly the same thing.
   Exposes window.GreenCartPassword = {
     MIN, MAX
     rules(password, personal)     { length, common, personal } -> true when that rule is met
     problem(password, personal)   first problem as a message, or '' if the password is fine
     strength(password, personal)  0 = empty, 1 Weak (not accepted), 2 Fair, 3 Good, 4 Strong
   }
   `personal` is a list like [fullName, username, email]; the password may not contain them. */
window.GreenCartPassword = (function () {
  var MIN = 8, MAX = 128;

  // Passwords attackers try first. Checked without case, after removing numbers and
  // symbols from the start and end, and after undoing swaps like @ for a or 0 for o.
  var COMMON = ['password', 'passwd', 'qwerty', 'qwertyuiop', 'asdf', 'asdfgh', 'asdfghjk',
    'asdfghjkl', 'zxcvbnm', 'qazwsx', '1qaz2wsx', '1q2w3e4r', 'abc', 'abcd', 'abcdef', 'qwer', 'iloveyou',
    'iloveu', 'loveyou', 'love', 'lovely', 'sunshine', 'princess', 'football', 'baseball', 'basketball',
    'welcome', 'admin', 'administrator', 'letmein', 'trustno', 'superman', 'batman', 'starwars', 'dragon',
    'monkey', 'shadow', 'master', 'michael', 'jennifer', 'computer', 'internet', 'whatever', 'freedom',
    'changeme', 'secret', 'default', 'guest', 'user', 'test', 'login', 'hello', 'mahalkita', 'mahal',
    'pilipinas', 'philippines', 'manila', 'gwapo', 'maganda', 'greencart'];

  var LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's', '!': 'i' };

  // Easy to guess: common words, only numbers/symbols, one repeated character,
  // a repeated short pattern (abcabc, 121212), or a straight run (abcdefgh, 87654321)
  function isEasyToGuess(p) {
    var lower = p.toLowerCase();
    var core = lower.replace(/^[\d\W_]+|[\d\W_]+$/g, '');
    if (!core) return true;
    var unleet = core.replace(/[013457@$!]/g, function (c) { return LEET[c]; });
    if (COMMON.indexOf(core) > -1 || COMMON.indexOf(unleet) > -1) return true;
    if (unleet.indexOf('password') > -1 || unleet.indexOf('greencart') > -1) return true;
    if (/^(.{1,3})\1+$/.test(lower)) return true;

    var up = true, down = true;
    for (var i = 1; i < lower.length; i++) {
      var diff = lower.charCodeAt(i) - lower.charCodeAt(i - 1);
      if (diff !== 1) up = false;
      if (diff !== -1) down = false;
    }
    return up || down;
  }

  // Contains the person's own name, username or the first part of their email
  function hasPersonalInfo(p, personal) {
    var lower = p.toLowerCase();
    var parts = [];
    (personal || []).forEach(function (value) {
      value = String(value || '').trim().toLowerCase();
      if (!value) return;
      if (value.indexOf('@') > -1) parts.push(value.split('@')[0]);
      else parts = parts.concat(value.split(/\s+/), [value.replace(/\s+/g, '')]);
    });
    return parts.some(function (part) { return part.length >= 3 && lower.indexOf(part) > -1; });
  }

  function rules(p, personal) {
    p = p || '';
    return {
      length: p.length >= MIN && p.length <= MAX,
      common: !!p && !isEasyToGuess(p),
      personal: !!p && !hasPersonalInfo(p, personal)
    };
  }

  function problem(p, personal) {
    var r = rules(p, personal);
    if ((p || '').length < MIN) return 'Use at least 8 characters for your password.';
    if (!r.length) return 'Use ' + MAX + ' characters or fewer for your password.';
    if (!r.common) return 'That password is too common or easy to guess. Try three or four random words, like "mango river lamp".';
    if (!r.personal) return "Don't use your name, username or email in your password.";
    return '';
  }

  // Weak = won't be accepted. Accepted passwords start at Fair; longer ones
  // (or a mix of letters, numbers and symbols) score higher. Guidance only.
  function strength(p, personal) {
    if (!p) return 0;
    var r = rules(p, personal);
    if (!r.length || !r.common || !r.personal) return 1;
    var kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(function (re) { return re.test(p); }).length;
    var score = 2;
    if (p.length >= 12 || (p.length >= 10 && kinds >= 3)) score++;
    if (p.length >= 16 || (p.length >= 12 && kinds >= 3)) score++;
    return score;
  }

  return { MIN: MIN, MAX: MAX, rules: rules, problem: problem, strength: strength };
})();
