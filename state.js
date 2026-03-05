/* ============================================================
   state.js — Lightweight observable state management
   Provides centralized state with change notifications.
   Load before view files, after data.js.
   ============================================================ */

var EMRState = (function() {
  // Internal state store
  var _state = {
    app: {
      currentView: null,
      currentParam: null,
      sidebarOpen: false,
      darkMode: false,
    },
    chart: {
      patientId: null,
      activeTab: 'overview',
      activeSubTab: 'profile',
      notesSortDir: 'desc',
      notesView: 'grouped',
      searchOpen: false,
      pendingScrollSection: null,
    },
    encounter: {
      encounterId: null,
      isDirty: false,
      autosaveActive: false,
    },
    orders: {
      encounterId: null,
      patientId: null,
      selectedType: 'Medication',
      selectedPriority: 'Routine',
    },
    dashboard: {
      myPatientsOnly: false,
      currentPage: 1,
      filterActive: false,
    },
  };

  // Subscribers: key = namespace (or namespace.field), value = array of callbacks
  var _subscribers = {};

  function _notify(namespace, field, oldVal, newVal) {
    // Notify namespace-level subscribers
    var nsKey = namespace;
    if (_subscribers[nsKey]) {
      _subscribers[nsKey].forEach(function(cb) {
        try { cb(field, newVal, oldVal); } catch(e) { console.warn('[EMRState] Subscriber error:', e); }
      });
    }
    // Notify field-level subscribers
    var fieldKey = namespace + '.' + field;
    if (_subscribers[fieldKey]) {
      _subscribers[fieldKey].forEach(function(cb) {
        try { cb(newVal, oldVal); } catch(e) { console.warn('[EMRState] Subscriber error:', e); }
      });
    }
  }

  return {
    /**
     * Get a value: EMRState.get('chart.patientId') or EMRState.get('chart') for full namespace
     */
    get: function(path) {
      var parts = path.split('.');
      var ns = parts[0];
      if (!_state[ns]) return undefined;
      if (parts.length === 1) {
        // Return a shallow copy of the namespace
        return Object.assign({}, _state[ns]);
      }
      return _state[ns][parts[1]];
    },

    /**
     * Set a value: EMRState.set('chart.patientId', '123')
     * Or set multiple: EMRState.set('chart', { patientId: '123', activeTab: 'notes' })
     */
    set: function(path, value) {
      var parts = path.split('.');
      var ns = parts[0];
      if (!_state[ns]) _state[ns] = {};

      if (parts.length === 1 && typeof value === 'object' && value !== null) {
        // Merge multiple fields
        var keys = Object.keys(value);
        keys.forEach(function(k) {
          var oldVal = _state[ns][k];
          if (oldVal !== value[k]) {
            _state[ns][k] = value[k];
            _notify(ns, k, oldVal, value[k]);
          }
        });
      } else if (parts.length === 2) {
        var field = parts[1];
        var oldVal = _state[ns][field];
        if (oldVal !== value) {
          _state[ns][field] = value;
          _notify(ns, field, oldVal, value);
        }
      }
    },

    /**
     * Subscribe to changes:
     *   EMRState.on('chart', fn)           — any chart field change
     *   EMRState.on('chart.patientId', fn) — specific field change
     * Returns an unsubscribe function.
     */
    on: function(path, callback) {
      if (!_subscribers[path]) _subscribers[path] = [];
      _subscribers[path].push(callback);
      // Return unsubscribe function
      return function() {
        var arr = _subscribers[path];
        if (!arr) return;
        var idx = arr.indexOf(callback);
        if (idx !== -1) arr.splice(idx, 1);
      };
    },

    /**
     * Reset a namespace to defaults
     */
    reset: function(namespace) {
      var defaults = {
        app: { currentView: null, currentParam: null, sidebarOpen: false, darkMode: false },
        chart: { patientId: null, activeTab: 'overview', activeSubTab: 'profile', notesSortDir: 'desc', notesView: 'grouped', searchOpen: false, pendingScrollSection: null },
        encounter: { encounterId: null, isDirty: false, autosaveActive: false },
        orders: { encounterId: null, patientId: null, selectedType: 'Medication', selectedPriority: 'Routine' },
        dashboard: { myPatientsOnly: false, currentPage: 1, filterActive: false },
      };
      if (defaults[namespace]) {
        _state[namespace] = Object.assign({}, defaults[namespace]);
        _notify(namespace, '_reset', null, _state[namespace]);
      }
    },

    /**
     * Debug: dump entire state
     */
    dump: function() {
      return JSON.parse(JSON.stringify(_state));
    }
  };
})();
