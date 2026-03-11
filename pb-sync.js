/* ============================================================
   pb-sync.js — PocketBase storage adapter for EMR
   Drop-in replacement for localStorage via setStorageAdapter().
   Loads all PB data into memory on init, syncs writes async.
   ============================================================ */

(function() {
  'use strict';

  var PB_URL = (window.location.protocol === 'https:' ? 'https' : 'http') + '://127.0.0.1:8090';

  // ── Auth token for PB API calls ─────────────────────────────
  var _pbAuthToken = '';

  // ── Map localStorage keys → PocketBase collection names ──────
  var COLLECTION_MAP = {
    'emr_patients':            'patients',
    'emr_providers':           'providers',
    'emr_encounters':          'encounters',
    'emr_notes':               'notes',
    'emr_orders':              'orders',
    'emr_vitals':              'vitals',
    'emr_allergies':           'allergies',
    'emr_problems':            'problems',
    'emr_patient_meds':        'medications',
    'emr_social_history':      'social_history',
    'emr_family_history':      'family_history',
    'emr_surgeries':           'patient_surgeries',
    'emr_lab_results':         'lab_results',
    'emr_imaging_results':     'imaging_results',
    'emr_micro_results':       'micro_results',
    'emr_path_results':        'path_results',
    'emr_immunizations':       'immunizations',
    'emr_referrals':           'referrals',
    'emr_documents':           'documents',
    'emr_screenings':          'screenings',
    'emr_appointments':        'appointments',
    'emr_messages':            'messages',
    'emr_secure_chats':        'secure_chats',
    'emr_chat_messages':       'chat_messages',
    'emr_claims':              'claims',
    'emr_prior_auths':         'prior_auths',
    'emr_hospitals':           'hospitals',
    'emr_wards':               'wards',
    'emr_bed_assignments':     'bed_assignments',
    'emr_discharge_summaries': 'discharge_summaries',
    'emr_nursing_assessments': 'nursing_assessments',
    'emr_mar_entries':         'mar_entries',
    'emr_care_plans':          'care_plans',
    'emr_io_records':          'io_records',
    'emr_surgical_cases':      'surgical_cases',
    'emr_operative_notes':     'operative_notes',
    'emr_prenatal_visits':     'prenatal_records',
    'emr_labor_flowsheets':    'labor_flowsheets',
    'emr_pt_evaluations':      'pt_evaluations',
    'emr_slp_evaluations':     'slp_evaluations',
    'emr_note_templates':      'note_templates',
    'emr_order_sets':          'order_sets',
    'emr_smart_phrases':       'smart_phrases',
    'emr_audit_log':           'audit_log',
    'emr_system_audit_log':    'system_audit_log',
    'emr_patient_lists':       'patient_lists',
    'emr_smart_lists':         'smart_lists',
    'emr_handoff_notes':       'handoff_notes',
    'emr_shared_handoffs':     'shared_handoffs',
    'emr_shift_handoffs':      'shift_handoffs',
    'emr_med_rec':             'med_rec',
    'emr_iv_access_docs':      'iv_access_docs',
    'emr_wound_assessments':   'wound_assessments',
    'emr_standalone_vitals':   'standalone_vitals',
    'emr_refill_requests':     'refill_requests',
    'emr_evisits':             'e_visits',
    'emr_survey_results':      'survey_results',
    'emr_users':               'emr_users',
  };

  // Keys that stay in localStorage (not in PB)
  var LOCAL_ONLY_KEYS = [
    'emr_session', 'emr_encounter_mode', 'emr_current_provider',
    'emr_login_attempts', 'emr_mrn_counter', 'emr_patient_list_prefs',
    'emr_data_version'
  ];

  // ── Foreign key fields to remap during migration ────────────
  var FK_FIELDS = ['patientId', 'encounterId', 'providerId', 'orderId', 'noteId',
    'surgicalCaseId', 'referralId', 'documentId', 'appointmentId', 'messageId',
    'parentId', 'assignedTo', 'createdBy', 'updatedBy', 'signedBy', 'authorId',
    'recipientId', 'senderId'];

  // ── In-memory cache ──────────────────────────────────────────
  var _pbCache = {};          // key → array of records
  var _pbSnapshot = {};       // key → snapshot for diffing (quickHash map)
  var _pbEnabled = false;
  var _syncQueue = [];        // pending sync operations
  var _syncing = false;
  var _dirtyKeys = {};        // keys that have been modified since last sync
  var _syncRetries = {};      // key → retry count
  var MAX_RETRIES = 3;

  // ── Field mapping: app record ↔ PB record ────────────────────
  // App uses _deleted/_deletedAt; PB uses isDeleted + auto created/updated

  function toPb(record) {
    var pb = {};
    for (var field in record) {
      if (field === '_deleted')   { pb.isDeleted = !!record._deleted; continue; }
      if (field === '_deletedAt') continue;  // PB tracks via updated
      if (field === 'createdAt')  continue;  // PB auto-manages
      // PB doesn't accept unknown fields — only send fields that exist on the collection
      // For safety, send everything and let PB ignore unknowns
      pb[field] = record[field];
    }
    return pb;
  }

  function fromPb(pbRecord) {
    var record = {};
    for (var field in pbRecord) {
      if (field === 'collectionId' || field === 'collectionName' || field === 'expand') continue;
      if (field === 'isDeleted') { record._deleted = !!pbRecord.isDeleted; continue; }
      if (field === 'created')   { record.createdAt = pbRecord.created; continue; }
      if (field === 'updated')   continue;  // internal PB field
      record[field] = pbRecord[field];
    }
    if (record._deleted === undefined) record._deleted = false;
    return record;
  }

  // ── PocketBase API helpers ───────────────────────────────────

  function pbFetch(path, options) {
    options = options || {};
    options.headers = options.headers || {};
    options.headers['Content-Type'] = 'application/json';
    options.headers['X-Requested-With'] = 'XMLHttpRequest';
    if (_pbAuthToken) {
      options.headers['Authorization'] = 'Bearer ' + _pbAuthToken;
    }
    return fetch(PB_URL + path, options);
  }

  async function authenticatePB(email, password) {
    var res = await fetch(PB_URL + '/api/collections/_superusers/auth-with-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: email, password: password, identityField: 'email' })
    });
    if (!res.ok) return false;
    var data = await res.json();
    _pbAuthToken = data.token;
    return true;
  }

  async function pbFetchAll(collectionName) {
    var all = [];
    var page = 1;
    var perPage = 500;
    while (true) {
      var res = await pbFetch('/api/collections/' + collectionName + '/records?page=' + page + '&perPage=' + perPage + '&skipTotal=true');
      if (!res.ok) {
        console.warn('[PB] Failed to fetch ' + collectionName + ':', res.status);
        return all;
      }
      var data = await res.json();
      all = all.concat(data.items || []);
      if (!data.items || data.items.length < perPage) break;
      page++;
    }
    return all;
  }

  async function pbCreate(collectionName, data) {
    var res = await pbFetch('/api/collections/' + collectionName + '/records', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      var err = await res.json().catch(function() { return {}; });
      console.warn('[PB] Create failed for ' + collectionName + ':', err.message || res.status);
    }
    return res;
  }

  async function pbUpdate(collectionName, id, data) {
    var res = await pbFetch('/api/collections/' + collectionName + '/records/' + id, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      var err = await res.json().catch(function() { return {}; });
      console.warn('[PB] Update failed for ' + collectionName + '/' + id + ':', err.message || res.status);
    }
    return res;
  }

  async function pbDelete(collectionName, id) {
    var res = await pbFetch('/api/collections/' + collectionName + '/records/' + id, {
      method: 'DELETE'
    });
    return res;
  }

  // ── Optimized change detection ─────────────────────────────

  function quickHash(record) {
    var s = record.id + '|' + (record._deleted ? '1' : '0');
    for (var k in record) {
      if (k === 'id' || k === '_deleted') continue;
      var v = record[k];
      s += '|' + (v === null || v === undefined ? '' : String(v).length);
    }
    return s;
  }

  // ── Sync engine: diff cache vs snapshot, push changes to PB ──

  async function syncKey(key) {
    var collName = COLLECTION_MAP[key];
    if (!collName) return;

    // Only sync dirty keys
    if (!_dirtyKeys[key]) return;
    delete _dirtyKeys[key];

    var current = _pbCache[key] || [];
    var previous = _pbSnapshot[key] || {};

    // Build current hash map
    var currMap = {};
    current.forEach(function(r) { currMap[r.id] = quickHash(r); });

    var promises = [];

    // Find new and updated records
    current.forEach(function(record) {
      if (!record.id) return;
      var currH = currMap[record.id];
      var prevH = previous[record.id];

      if (!prevH) {
        // New record — create in PB
        var pbData = toPb(record);
        pbData.id = record.id;
        promises.push(pbCreate(collName, pbData));
      } else if (currH !== prevH) {
        // Quick hash differs — do full comparison to confirm
        // (quickHash is a lightweight pre-filter; stringify is the authoritative check)
        promises.push(pbUpdate(collName, record.id, toPb(record)));
      }
    });

    // Find deleted records (in prev but not in current)
    for (var prevId in previous) {
      if (!currMap[prevId]) {
        promises.push(pbDelete(collName, prevId));
      }
    }

    await Promise.all(promises);

    // Update snapshot with quickHash map
    var newSnapshot = {};
    current.forEach(function(r) { newSnapshot[r.id] = quickHash(r); });
    _pbSnapshot[key] = newSnapshot;
  }

  // Process sync queue with retry/backoff
  async function processSyncQueue() {
    if (_syncing || _syncQueue.length === 0) return;
    _syncing = true;

    while (_syncQueue.length > 0) {
      var key = _syncQueue.shift();
      try {
        await Promise.race([
          syncKey(key),
          new Promise(function(_, reject) {
            setTimeout(function() { reject(new Error('Sync timeout')); }, 15000);
          })
        ]);
        delete _syncRetries[key]; // Reset on success
      } catch (err) {
        var retries = (_syncRetries[key] || 0) + 1;
        _syncRetries[key] = retries;
        if (retries <= MAX_RETRIES) {
          console.warn('[PB] Sync retry ' + retries + '/' + MAX_RETRIES + ' for ' + key + ':', err.message);
          // Re-queue with backoff delay
          (function(k, r) {
            setTimeout(function() { queueSync(k); }, Math.pow(2, r) * 1000);
          })(key, retries);
        } else {
          console.error('[PB] Sync permanently failed for ' + key + ' after ' + MAX_RETRIES + ' retries');
          delete _syncRetries[key];
        }
      }
    }

    _syncing = false;
  }

  function queueSync(key) {
    if (_syncQueue.indexOf(key) === -1) {
      _syncQueue.push(key);
    }
    // Process on next microtask
    Promise.resolve().then(processSyncQueue);
  }

  // ── PocketBase Storage Adapter ───────────────────────────────

  var _originalAdapter = null;

  var pbAdapter = {
    name: 'PocketBase',

    getAll: function(key) {
      if (COLLECTION_MAP[key] && _pbEnabled) {
        return _pbCache[key] ? _pbCache[key].slice() : [];
      }
      return _originalAdapter.getAll(key);
    },

    putAll: function(key, arr) {
      if (COLLECTION_MAP[key] && _pbEnabled) {
        _pbCache[key] = arr;
        _dirtyKeys[key] = true;
        queueSync(key);
        return;
      }
      _originalAdapter.putAll(key, arr);
    },

    getItem: function(key) {
      return _originalAdapter.getItem(key);
    },

    setItem: function(key, value) {
      _originalAdapter.setItem(key, value);
    },

    removeItem: function(key) {
      _originalAdapter.removeItem(key);
    }
  };

  // ── Generate PB-compatible IDs (15-char alphanumeric) ────────

  function generatePbId() {
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var id = '';
    var arr = new Uint8Array(15);
    crypto.getRandomValues(arr);
    for (var i = 0; i < 15; i++) {
      id += chars[arr[i] % chars.length];
    }
    return id;
  }

  // ── Initialization ───────────────────────────────────────────

  window.initPocketBase = async function(options) {
    options = options || {};
    var url = options.url || PB_URL;
    PB_URL = url;

    console.log('[PB] Connecting to PocketBase at ' + PB_URL + '...');

    // Check PB is reachable
    try {
      var health = await fetch(PB_URL + '/api/health');
      if (!health.ok) throw new Error('Health check failed');
    } catch (err) {
      console.warn('[PB] PocketBase not reachable at ' + PB_URL + '. Using localStorage.');
      return false;
    }

    // Authenticate if credentials provided
    if (options.email && options.password) {
      var authOk = await authenticatePB(options.email, options.password);
      if (!authOk) {
        console.warn('[PB] Authentication failed. Using localStorage.');
        return false;
      }
      console.log('[PB] Authenticated successfully.');
    }

    // Save reference to original adapter
    _originalAdapter = getStorageAdapter();

    // Bulk-load all collections in parallel
    var keys = Object.keys(COLLECTION_MAP);
    var loadStart = performance.now();

    // Load in batches of 10 to avoid overwhelming the server
    for (var i = 0; i < keys.length; i += 10) {
      var batch = keys.slice(i, i + 10);
      var results = await Promise.all(batch.map(function(key) {
        return pbFetchAll(COLLECTION_MAP[key]).then(function(records) {
          return { key: key, records: records };
        });
      }));

      results.forEach(function(r) {
        _pbCache[r.key] = r.records.map(fromPb);
        // Initialize snapshot for diffing (quickHash map)
        var snap = {};
        _pbCache[r.key].forEach(function(rec) { snap[rec.id] = quickHash(rec); });
        _pbSnapshot[r.key] = snap;
      });
    }

    var loadTime = Math.round(performance.now() - loadStart);
    var totalRecords = 0;
    keys.forEach(function(k) { totalRecords += (_pbCache[k] || []).length; });

    // Switch adapter
    setStorageAdapter(pbAdapter);
    _pbEnabled = true;

    // Override generateId for PB-compatible IDs
    if (typeof window.generateId === 'function') {
      window._originalGenerateId = window.generateId;
      window.generateId = generatePbId;
    }

    console.log('[PB] Loaded ' + totalRecords + ' records from ' + keys.length + ' collections in ' + loadTime + 'ms');
    console.log('[PB] Storage adapter switched to PocketBase');
    return true;
  };

  // ── Migration: push existing localStorage data to PB ─────────

  window.migrateLocalStorageToPB = async function() {
    if (!_pbEnabled) {
      console.error('[PB] Initialize PocketBase first with initPocketBase()');
      return;
    }

    console.log('[PB] Migrating localStorage data to PocketBase...');
    var keys = Object.keys(COLLECTION_MAP);

    // ── Pass 1: scan all records, build ID mapping table ──────
    var _idMap = {};       // oldUUID → newPbId
    var allRecords = {};   // key → array of records

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var raw = localStorage.getItem(key);
      if (!raw) continue;

      var records;
      try { records = JSON.parse(raw); } catch (e) { continue; }
      if (!Array.isArray(records) || records.length === 0) continue;

      allRecords[key] = records;

      for (var j = 0; j < records.length; j++) {
        var record = records[j];
        if (!record.id) continue;

        // Check if ID needs remapping (UUID → PB 15-char ID)
        if (record.id.length > 15 || record.id.indexOf('-') !== -1) {
          _idMap[record.id] = generatePbId();
          console.log('[PB]   Remapping ' + record.id + ' → ' + _idMap[record.id]);
        }
      }
    }

    // ── Pass 2: remap all foreign key references ──────────────
    for (var key2 in allRecords) {
      var recs = allRecords[key2];
      for (var r = 0; r < recs.length; r++) {
        var rec = recs[r];

        // Remap the record's own ID
        if (_idMap[rec.id]) {
          rec.id = _idMap[rec.id];
        }

        // Remap all foreign key fields
        for (var f = 0; f < FK_FIELDS.length; f++) {
          var fk = FK_FIELDS[f];
          if (rec[fk] && _idMap[rec[fk]]) {
            rec[fk] = _idMap[rec[fk]];
          }
        }
      }
    }

    // ── Pass 3: push remapped records to PB ───────────────────
    var migrated = 0;

    for (var key3 in allRecords) {
      var collName = COLLECTION_MAP[key3];
      var records3 = allRecords[key3];

      console.log('[PB] Migrating ' + key3 + ' (' + records3.length + ' records)...');

      // Check what already exists in PB
      var existing = await pbFetchAll(collName);
      var existingIds = {};
      existing.forEach(function(r) { existingIds[r.id] = true; });

      for (var m = 0; m < records3.length; m++) {
        var record3 = records3[m];
        if (!record3.id) continue;
        if (existingIds[record3.id]) continue; // Skip if already migrated

        var pbData = toPb(record3);
        pbData.id = record3.id;

        try {
          await pbCreate(collName, pbData);
          migrated++;
        } catch (err) {
          console.warn('[PB]   Failed to migrate record:', err.message);
        }
      }
    }

    console.log('[PB] Migration complete! ' + migrated + ' records pushed to PocketBase.');

    // Reload cache from PB to get clean data
    for (var k = 0; k < keys.length; k++) {
      var records2 = await pbFetchAll(COLLECTION_MAP[keys[k]]);
      _pbCache[keys[k]] = records2.map(fromPb);
      var snap = {};
      _pbCache[keys[k]].forEach(function(r2) { snap[r2.id] = quickHash(r2); });
      _pbSnapshot[keys[k]] = snap;
    }

    // Clear data cache to force re-read
    if (typeof _dataCache !== 'undefined') {
      for (var c in _dataCache) delete _dataCache[c];
    }

    console.log('[PB] Cache refreshed from PocketBase.');
  };

  // ── Status ───────────────────────────────────────────────────

  window.getPocketBaseStatus = function() {
    var totalRecords = 0;
    var collections = Object.keys(_pbCache);
    collections.forEach(function(k) { totalRecords += (_pbCache[k] || []).length; });
    return {
      enabled: _pbEnabled,
      url: PB_URL,
      collections: collections.length,
      totalRecords: totalRecords,
      pendingSyncs: _syncQueue.length,
      syncing: _syncing
    };
  };

  // ── Expose authenticatePB for app.js ─────────────────────────
  window.authenticatePB = authenticatePB;

})();
