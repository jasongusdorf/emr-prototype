/* ============================================================
   test-framework.js — Minimal browser test framework
   ============================================================ */
var TestRunner = (function() {
  var suites = [];
  var currentSuite = null;

  function describe(name, fn) {
    currentSuite = { name: name, tests: [], passed: 0, failed: 0 };
    suites.push(currentSuite);
    fn();
    currentSuite = null;
  }

  function it(name, fn) {
    if (!currentSuite) throw new Error('it() must be inside describe()');
    var test = { name: name, passed: false, error: null, duration: 0 };
    currentSuite.tests.push(test);
    var start = performance.now();
    try {
      fn();
      test.passed = true;
      currentSuite.passed++;
    } catch (e) {
      test.error = e.message || String(e);
      currentSuite.failed++;
    }
    test.duration = performance.now() - start;
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
  }

  function assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error((message || 'assertEqual') + ': expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
    }
  }

  function assertDeepEqual(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error((message || 'assertDeepEqual') + ': expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
    }
  }

  function assertThrows(fn, message) {
    var threw = false;
    try { fn(); } catch(e) { threw = true; }
    if (!threw) throw new Error(message || 'Expected function to throw');
  }

  function assertNotNull(value, message) {
    if (value === null || value === undefined) {
      throw new Error(message || 'Expected non-null value, got ' + value);
    }
  }

  function assertContains(str, substr, message) {
    if (typeof str !== 'string' || str.indexOf(substr) === -1) {
      throw new Error((message || 'assertContains') + ': "' + str + '" does not contain "' + substr + '"');
    }
  }

  // Setup/teardown for localStorage isolation
  var _lsBackup = null;

  function beforeEach() {
    // Save and clear localStorage for test isolation
    _lsBackup = {};
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      _lsBackup[key] = localStorage.getItem(key);
    }
    // Clear only emr_ keys
    Object.keys(_lsBackup).forEach(function(k) {
      if (k.startsWith('emr_')) localStorage.removeItem(k);
    });
    // Clear data cache
    if (typeof _dataCache !== 'undefined') {
      for (var k in _dataCache) delete _dataCache[k];
    }
  }

  function afterEach() {
    // Restore localStorage
    // First remove any emr_ keys created during test
    for (var i = localStorage.length - 1; i >= 0; i--) {
      var key = localStorage.key(i);
      if (key && key.startsWith('emr_')) localStorage.removeItem(key);
    }
    // Restore original values
    if (_lsBackup) {
      Object.keys(_lsBackup).forEach(function(k) {
        localStorage.setItem(k, _lsBackup[k]);
      });
      _lsBackup = null;
    }
  }

  function run() {
    var resultsEl = document.getElementById('results');
    var summaryEl = document.getElementById('summary');
    var totalPassed = 0, totalFailed = 0;

    suites.forEach(function(suite) {
      var suiteEl = document.createElement('div');
      suiteEl.className = 'suite';
      var nameEl = document.createElement('div');
      nameEl.className = 'suite-name';
      nameEl.textContent = suite.name + ' (' + suite.passed + '/' + suite.tests.length + ')';
      suiteEl.appendChild(nameEl);

      suite.tests.forEach(function(test) {
        var testEl = document.createElement('div');
        testEl.className = 'test ' + (test.passed ? 'pass' : 'fail');
        var icon = test.passed ? '\u2713' : '\u2717';
        testEl.innerHTML = '<span class="icon">' + icon + '</span>' +
          '<span>' + test.name + '</span>' +
          '<span class="duration">' + test.duration.toFixed(1) + 'ms</span>';
        if (test.error) {
          testEl.innerHTML += '<div class="error">' + test.error + '</div>';
        }
        suiteEl.appendChild(testEl);
      });

      resultsEl.appendChild(suiteEl);
      totalPassed += suite.passed;
      totalFailed += suite.failed;
    });

    var total = totalPassed + totalFailed;
    summaryEl.className = 'summary ' + (totalFailed === 0 ? 'pass' : 'fail');
    summaryEl.textContent = totalPassed + '/' + total + ' tests passed' +
      (totalFailed > 0 ? ' (' + totalFailed + ' failed)' : ' — All green!');
  }

  // Public API
  window.describe = describe;
  window.it = it;
  window.assert = assert;
  window.assertEqual = assertEqual;
  window.assertDeepEqual = assertDeepEqual;
  window.assertThrows = assertThrows;
  window.assertNotNull = assertNotNull;
  window.assertContains = assertContains;
  window.beforeEach = beforeEach;
  window.afterEach = afterEach;

  return { run: run };
})();
