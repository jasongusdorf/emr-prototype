/* ============================================================
   data.js — localStorage CRUD layer
   Only this file reads/writes localStorage.
   ============================================================ */

/* ---------- Keys ---------- */
const KEYS = {
  patients:      'emr_patients',
  providers:     'emr_providers',
  encounters:    'emr_encounters',
  notes:         'emr_notes',
  orders:        'emr_orders',
  mrnCounter:    'emr_mrn_counter',
  allergies:     'emr_allergies',
  pmh:           'emr_pmh',
  patientMeds:   'emr_patient_meds',
  socialHistory: 'emr_social_history',
  surgeries:     'emr_surgeries',
  vitals:        'emr_vitals',
  familyHistory: 'emr_family_history',
  problems:      'emr_problems',
  labResults:    'emr_lab_results',
  immunizations: 'emr_immunizations',
  referrals:     'emr_referrals',
  screenings:    'emr_screenings',
  documents:     'emr_documents',
  auditLog:      'emr_audit_log',
  medRec:        'emr_med_rec',
  noteTemplates: 'emr_note_templates',
  appointments:  'emr_appointments',
  currentProvider: 'emr_current_provider',
  users:           'emr_users',
  session:         'emr_session',
  encounterMode:   'emr_encounter_mode',
  systemAuditLog:  'emr_system_audit_log',
  messages:        'emr_messages',
  loginAttempts:   'emr_login_attempts',
  hospitals:       'emr_hospitals',
  wards:           'emr_wards',
  bedAssignments:  'emr_bed_assignments',
  patientLists:    'emr_patient_lists',
  imagingResults:  'emr_imaging_results',
  microResults:    'emr_micro_results',
  pathResults:     'emr_path_results',
  patientListPrefs:'emr_patient_list_prefs',
  smartLists:      'emr_smart_lists',
  handoffNotes:    'emr_handoff_notes',
  listSubscriptions:'emr_list_subscriptions',
  claims:          'emr_claims',
  priorAuths:      'emr_prior_auths',
  payerRules:      'emr_payer_rules',
  careGapRules:    'emr_care_gap_rules',
  patientCareGaps: 'emr_patient_care_gaps',
  smartPhrases:    'emr_smart_phrases',
  secureChats:     'emr_secure_chats',
  chatMessages:    'emr_chat_messages',
  externalRecords: 'emr_external_records',
  patientMedia:    'emr_patient_media',
  letters:         'emr_letters',
  letterTemplates: 'emr_letter_templates',
  reminders:       'emr_reminders',
  slicerQueries:   'emr_slicer_queries',
};

/* ---------- Data Versioning ---------- */
var DATA_VERSION = 1;
var DATA_VERSION_KEY = 'emr_data_version';

function runMigrations() {
  var currentVersion = parseInt(_storageAdapter.getItem(DATA_VERSION_KEY) || '0', 10);
  if (currentVersion >= DATA_VERSION) return;

  // Migration 1: Add _deleted support (ensure all records are clean)
  if (currentVersion < 1) {
    console.log('[EMR] Running migration to v1: soft-delete support');
    // No data changes needed for v1 — just marks the schema version
  }

  _storageAdapter.setItem(DATA_VERSION_KEY, String(DATA_VERSION));
  console.log('[EMR] Data migrated to v' + DATA_VERSION);
}

/* ---------- Utility ---------- */
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function generateMRN() {
  const counter = parseInt(_storageAdapter.getItem(KEYS.mrnCounter) || '1000', 10);
  _storageAdapter.setItem(KEYS.mrnCounter, String(counter + 1));
  return 'MRN' + String(counter).padStart(6, '0');
}

function safeSave(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      // Defer to app.js showToast if available
      if (typeof showToast === 'function') {
        showToast('Storage quota exceeded. Please clear some data.', 'error');
      } else {
        alert('Storage quota exceeded. Please clear some data.');
      }
    }
    throw e;
  }
}

var _dataCache = {};

function loadAll(key, includeDeleted) {
  var cacheKey = key + (includeDeleted ? ':all' : '');
  if (_dataCache[cacheKey]) return _dataCache[cacheKey];
  var arr;
  try {
    arr = _storageAdapter.getAll(key);
  } catch (e) {
    console.error('[EMR] Data corrupted for key "' + key + '":', e.message);
    if (typeof showToast === 'function') {
      showToast('Data error in ' + key.replace('emr_', '') + ' — some records may be missing', 'error', 5000);
    }
    return [];
  }
  if (!Array.isArray(arr)) arr = [];
  if (!includeDeleted) {
    arr = arr.filter(function(x) { return !x._deleted; });
  }
  _dataCache[cacheKey] = arr;
  return arr;
}

function _invalidateCache(key) {
  delete _dataCache[key + ':all'];
  delete _dataCache[key];
}

/* ---------- DataStore Adapter (PR-21) ---------- */
/* Wraps storage behind a swappable interface.
   Current adapter: localStorage.
   To migrate to a backend API, replace _storageAdapter methods. */

var _storageAdapter = {
  name: 'localStorage',

  getAll: function(key) {
    var raw = localStorage.getItem(key);
    if (raw === null) return [];
    return JSON.parse(raw);
  },

  putAll: function(key, arr) {
    safeSave(key, JSON.stringify(arr));
  },

  getItem: function(key) {
    return localStorage.getItem(key);
  },

  setItem: function(key, value) {
    safeSave(key, value);
  },

  removeItem: function(key) {
    localStorage.removeItem(key);
  }
};

/**
 * Switch to a different storage adapter.
 * adapter must implement: getAll(key), putAll(key, arr), getItem(key), setItem(key, value), removeItem(key)
 * Example: setStorageAdapter(apiAdapter) to switch from localStorage to a REST API.
 */
function setStorageAdapter(adapter) {
  if (!adapter || typeof adapter.getAll !== 'function' || typeof adapter.putAll !== 'function') {
    throw new Error('Invalid storage adapter: must implement getAll and putAll');
  }
  _storageAdapter = adapter;
  _dataCache = {}; // Clear cache on adapter switch
  console.log('[EMR] Storage adapter switched to: ' + (adapter.name || 'custom'));
}

function getStorageAdapter() {
  return _storageAdapter;
}

function saveAll(key, arr) {
  _invalidateCache(key);
  _storageAdapter.putAll(key, arr);
}

function softDeleteRecord(key, id) {
  var all = loadAll(key, true);
  var idx = all.findIndex(function(x) { return x.id === id; });
  if (idx === -1) return false;
  all[idx]._deleted = true;
  all[idx]._deletedAt = new Date().toISOString();
  saveAll(key, all);
  return true;
}

function restoreRecord(key, id) {
  var all = loadAll(key, true);
  var idx = all.findIndex(function(x) { return x.id === id; });
  if (idx === -1) return false;
  delete all[idx]._deleted;
  delete all[idx]._deletedAt;
  saveAll(key, all);
  return true;
}

/* ---------- Generic Validation Helpers (hardening) ---------- */
/**
 * validateRequired — checks that each field in `fields` exists on `data`
 * and is a non-empty string (or truthy value for non-strings).
 * Returns { valid: boolean, errors: string[] }
 */
function validateRequired(data, fields) {
  const errors = [];
  fields.forEach(function (f) {
    if (data[f] === undefined || data[f] === null || (typeof data[f] === 'string' && data[f].trim() === '')) {
      errors.push(f + ' is required');
    }
  });
  return { valid: errors.length === 0, errors: errors };
}

/**
 * validateEmail — returns true if `email` has a valid format.
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * validatePhone — returns true if `phone` has at least 10 digits.
 */
function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  var digits = phone.replace(/\D/g, '');
  return digits.length >= 10;
}

/**
 * validateDate — returns true if `dateStr` is a valid date string.
 */
function validateDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  var d = new Date(dateStr);
  return !isNaN(d.getTime());
}

/* ---------- Entity Schemas & Schema Validation ---------- */
var ENTITY_SCHEMAS = {
  patient: {
    required: ['firstName', 'lastName'],
    strings: ['firstName', 'lastName', 'email', 'phone', 'insurance'],
    maxLength: { firstName: 100, lastName: 100, email: 200, phone: 20, insurance: 100, addressStreet: 200 }
  },
  encounter: {
    required: ['patientId'],
    enums: { visitType: ['Outpatient', 'Inpatient', 'Emergency', 'Urgent Care'], status: ['Open', 'Signed', 'Cancelled'] }
  },
  order: {
    required: ['patientId', 'type'],
    enums: { type: ['Medication', 'Lab', 'Imaging', 'Consult'], priority: ['Routine', 'Urgent', 'STAT'], status: ['Pending', 'Active', 'Completed', 'Cancelled'] }
  },
  allergy: {
    required: ['patientId', 'allergen'],
    enums: { severity: ['Mild', 'Moderate', 'Severe', 'Life-threatening'], type: ['Drug', 'Food', 'Environmental', 'Other'] }
  },
  note: {
    required: ['encounterId']
  },
  vital: {
    required: ['encounterId', 'patientId']
  },
  appointment: {
    required: ['patientId', 'providerId', 'dateTime'],
    enums: { status: ['Scheduled', 'Checked In', 'In Progress', 'Completed', 'Cancelled', 'No Show'] }
  },
  message: {
    required: ['fromId', 'toId', 'body']
  },
  claim: {
    required: ['encounterId', 'patientId'],
    enums: { status: ['Draft', 'Ready', 'Submitted', 'Accepted', 'Denied', 'Paid', 'Appealed'] }
  },
  priorAuth: {
    required: ['patientId', 'requestedService'],
    enums: {
      status: ['Required', 'Submitted', 'Approved', 'Denied', 'Expired', 'Not Required'],
      urgency: ['Standard', 'Urgent', 'Retrospective']
    }
  }
};

function validateSchema(data, schemaName) {
  var schema = ENTITY_SCHEMAS[schemaName];
  if (!schema) return { valid: true, errors: [] };
  var errors = [];

  // Required fields
  if (schema.required) {
    schema.required.forEach(function(f) {
      if (data[f] === undefined || data[f] === null || (typeof data[f] === 'string' && data[f].trim() === '')) {
        errors.push(f + ' is required');
      }
    });
  }

  // String type checks
  if (schema.strings) {
    schema.strings.forEach(function(f) {
      if (data[f] !== undefined && data[f] !== null && data[f] !== '' && typeof data[f] !== 'string') {
        errors.push(f + ' must be a string');
      }
    });
  }

  // Max length
  if (schema.maxLength) {
    Object.keys(schema.maxLength).forEach(function(f) {
      if (typeof data[f] === 'string' && data[f].length > schema.maxLength[f]) {
        errors.push(f + ' exceeds maximum length of ' + schema.maxLength[f]);
      }
    });
  }

  // Enum checks
  if (schema.enums) {
    Object.keys(schema.enums).forEach(function(f) {
      if (data[f] !== undefined && data[f] !== null && data[f] !== '' && schema.enums[f].indexOf(data[f]) === -1) {
        errors.push(f + ' must be one of: ' + schema.enums[f].join(', '));
      }
    });
  }

  return { valid: errors.length === 0, errors: errors };
}

/* ============================================================
   Encounter Mode (Outpatient / Inpatient)
   ============================================================ */
function getEncounterMode() {
  const v = _storageAdapter.getItem(KEYS.encounterMode);
  return v === 'inpatient' ? 'inpatient' : 'outpatient';
}

function setEncounterMode(mode) {
  if (mode !== 'outpatient' && mode !== 'inpatient') return;
  _storageAdapter.setItem(KEYS.encounterMode, mode);
}

function encounterMatchesMode(encounter, mode) {
  if (!encounter) return true;
  const vt = (encounter.visitType || '').toLowerCase();
  if (mode === 'inpatient') {
    return vt === 'inpatient';
  }
  // Outpatient mode: everything except Inpatient (Emergency/Other grouped with outpatient)
  return vt !== 'inpatient';
}

function getPatientsWithActiveInpatientEncounters() {
  const encounters = getEncounters().filter(e =>
    (e.visitType || '').toLowerCase() === 'inpatient' && e.status !== 'Signed' && e.status !== 'Cancelled'
  );
  const patientIds = [...new Set(encounters.map(e => e.patientId))];
  return patientIds.map(id => getPatient(id)).filter(Boolean);
}

/* ============================================================
   Patients
   ============================================================ */
function getPatients() { return loadAll(KEYS.patients); }

function getPatient(id) { return getPatients().find(p => p.id === id) || null; }

function savePatient(data) {
  /* --- Schema validation (PR-7) --- */
  if (!data.id || !getPatient(data.id)) {
    var schemaCheck = validateSchema(data, 'patient');
    if (!schemaCheck.valid) return { error: true, errors: schemaCheck.errors };
  }
  /* --- Data validation (hardening) --- */
  // Only validate on new patient creation (no existing id) or if names are explicitly being set
  if (!data.id || !getPatient(data.id)) {
    const reqCheck = validateRequired(data, ['firstName', 'lastName']);
    if (!reqCheck.valid) return { error: true, errors: reqCheck.errors };
    if (typeof data.firstName !== 'string' || data.firstName.trim() === '') {
      return { error: true, errors: ['firstName must be a non-empty string'] };
    }
    if (typeof data.lastName !== 'string' || data.lastName.trim() === '') {
      return { error: true, errors: ['lastName must be a non-empty string'] };
    }
  }
  if (data.email && data.email.trim() !== '' && !validateEmail(data.email)) {
    return { error: true, errors: ['Invalid email format'] };
  }
  if (data.phone && data.phone.trim() !== '' && !validatePhone(data.phone)) {
    return { error: true, errors: ['Phone must have at least 10 digits'] };
  }
  if (data.dob && data.dob.trim() !== '' && !validateDate(data.dob)) {
    return { error: true, errors: ['DOB must be a valid date'] };
  }
  /* --- End validation --- */

  const patients = loadAll(KEYS.patients, true);
  const existing = patients.findIndex(p => p.id === data.id);
  if (existing >= 0) {
    patients[existing] = { ...patients[existing], ...data };
  } else {
    const newPatient = {
      id:        generateId(),
      mrn:       generateMRN(),
      firstName: '',
      lastName:  '',
      dob:       '',
      sex:       '',
      phone:     '',
      insurance: '',
      email:     '',
      addressStreet: '',
      addressCity:   '',
      addressState:  '',
      addressZip:    '',
      emergencyContactName:         '',
      emergencyContactPhone:        '',
      emergencyContactRelationship: '',
      pharmacyName:  '',
      pharmacyPhone: '',
      pharmacyFax:   '',
      panelProviders: [],
      createdAt: new Date().toISOString(),
      ...data,
    };
    patients.push(newPatient);
    saveAll(KEYS.patients, patients);
    return newPatient;
  }
  saveAll(KEYS.patients, patients);
  return patients[existing >= 0 ? existing : patients.length - 1];
}

function deletePatient(id) {
  // Cascade soft-delete: encounters, notes, orders, vitals
  var encounters = getEncounters().filter(function(e) { return e.patientId === id; });
  encounters.forEach(function(e) {
    deleteNote(e.id);
    deleteOrdersByEncounter(e.id);
    loadAll(KEYS.vitals).filter(function(v) { return v.encounterId === e.id; }).forEach(function(v) {
      softDeleteRecord(KEYS.vitals, v.id);
    });
    softDeleteRecord(KEYS.encounters, e.id);
  });
  // Soft-delete patient-level clinical records
  var cascadeKeys = [
    { key: KEYS.allergies,      field: 'patientId' },
    { key: KEYS.pmh,            field: 'patientId' },
    { key: KEYS.patientMeds,    field: 'patientId' },
    { key: KEYS.socialHistory,  field: 'patientId' },
    { key: KEYS.surgeries,      field: 'patientId' },
    { key: KEYS.familyHistory,  field: 'patientId' },
    { key: KEYS.problems,       field: 'patientId' },
    { key: KEYS.labResults,     field: 'patientId' },
    { key: KEYS.immunizations,  field: 'patientId' },
    { key: KEYS.referrals,      field: 'patientId' },
    { key: KEYS.screenings,     field: 'patientId' },
    { key: KEYS.documents,      field: 'patientId' },
    { key: KEYS.medRec,         field: 'patientId' },
    { key: KEYS.auditLog,       field: 'patientId' },
    { key: KEYS.messages,       field: 'patientId' },
    { key: KEYS.appointments,   field: 'patientId' },
  ];
  cascadeKeys.forEach(function(ck) {
    loadAll(ck.key).filter(function(r) { return r[ck.field] === id; }).forEach(function(r) {
      softDeleteRecord(ck.key, r.id);
    });
  });
  // Soft-delete the patient record itself
  softDeleteRecord(KEYS.patients, id);
}

/* ============================================================
   Providers
   ============================================================ */
function getProviders() { return loadAll(KEYS.providers); }

function getProvider(id) { return getProviders().find(p => p.id === id) || null; }

function saveProvider(data) {
  const providers = loadAll(KEYS.providers, true);
  const existing = providers.findIndex(p => p.id === data.id);
  if (existing >= 0) {
    providers[existing] = { ...providers[existing], ...data };
  } else {
    const newProvider = {
      id:        generateId(),
      firstName: '',
      lastName:  '',
      degree:    'MD',
      role:      'Attending',
      ...data,
    };
    providers.push(newProvider);
    saveAll(KEYS.providers, providers);
    return newProvider;
  }
  saveAll(KEYS.providers, providers);
  return providers[existing];
}

function deleteProvider(id) {
  // Encounters still reference providerId; renderer falls back to '[Removed Provider]'
  softDeleteRecord(KEYS.providers, id);
  var user = getSessionUser();
  logSystemAudit('PROVIDER_DELETED', user ? user.id : '', id, 'Provider soft-deleted (id: ' + id + ')', user ? user.email : '');
}

/* ============================================================
   Encounters
   ============================================================ */
function getEncounters() { return loadAll(KEYS.encounters); }

function getEncountersByPatient(patientId) {
  return getEncounters()
    .filter(e => e.patientId === patientId)
    .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
}

function getEncounter(id) { return getEncounters().find(e => e.id === id) || null; }

function saveEncounter(data) {
  /* --- Schema validation (PR-7) --- */
  if (!data.id || !getEncounter(data.id)) {
    var schemaCheck = validateSchema(data, 'encounter');
    if (!schemaCheck.valid) return { error: true, errors: schemaCheck.errors };
  }
  /* --- Data validation (hardening) --- */
  if (!data.id || !getEncounter(data.id)) {
    var encReq = validateRequired(data, ['patientId']);
    if (!encReq.valid) return { error: true, errors: encReq.errors };
    var VALID_ENCOUNTER_VISIT_TYPES = ['Outpatient', 'Inpatient', 'Emergency'];
    if (data.visitType && VALID_ENCOUNTER_VISIT_TYPES.indexOf(data.visitType) < 0) {
      console.warn('saveEncounter: non-standard visitType "' + data.visitType + '". Recommended: Outpatient, Inpatient, Emergency.');
    }
  }
  /* --- End validation --- */

  const encounters = loadAll(KEYS.encounters, true);
  const existing = encounters.findIndex(e => e.id === data.id);
  if (existing >= 0) {
    encounters[existing] = { ...encounters[existing], ...data };
    saveAll(KEYS.encounters, encounters);
    return encounters[existing];
  } else {
    const newEncounter = {
      id:          generateId(),
      patientId:   '',
      providerId:  '',
      visitType:   'Outpatient',
      visitSubtype:'',
      dateTime:    new Date().toISOString(),
      status:      'Open',
      diagnoses:   [],
      cptCodes:    [],
      ...data,
    };
    encounters.push(newEncounter);
    saveAll(KEYS.encounters, encounters);
    logAudit('Encounter Created', 'encounter', newEncounter.id, newEncounter.patientId, newEncounter.visitType);
    return newEncounter;
  }
}

function deleteEncounter(id) {
  deleteNote(id);
  deleteOrdersByEncounter(id);
  loadAll(KEYS.vitals).filter(function(v) { return v.encounterId === id; }).forEach(function(v) {
    softDeleteRecord(KEYS.vitals, v.id);
  });
  loadAll(KEYS.medRec).filter(function(r) { return r.encounterId === id; }).forEach(function(r) {
    softDeleteRecord(KEYS.medRec, r.id);
  });
  softDeleteRecord(KEYS.encounters, id);
}

/* ============================================================
   Notes  (keyed by encounterId — one note per encounter)
   ============================================================ */
function getNotes() { return loadAll(KEYS.notes); }

function getNoteByEncounter(encounterId) {
  return getNotes().find(n => n.encounterId === encounterId) || null;
}

function saveNote(data) {
  /* --- Schema validation (PR-7) --- */
  var existingNote = getNotes().find(function(n) { return n.encounterId === data.encounterId; });
  if (!existingNote) {
    var schemaCheck = validateSchema(data, 'note');
    if (!schemaCheck.valid) return { error: true, errors: schemaCheck.errors };
  }
  const notes = loadAll(KEYS.notes, true);
  const existing = notes.findIndex(n => n.encounterId === data.encounterId);
  if (existing >= 0) {
    const wasUnsigned = !notes[existing].signed;
    notes[existing] = {
      ...notes[existing],
      ...data,
      lastModified: new Date().toISOString(),
    };
    saveAll(KEYS.notes, notes);
    if (wasUnsigned && notes[existing].signed) {
      logAudit('Note Signed', 'note', notes[existing].id, notes[existing].encounterId, 'Signed by ' + (notes[existing].signedBy || ''));
    }
    return notes[existing];
  } else {
    const newNote = {
      id:             generateId(),
      encounterId:    '',
      noteBody:       '',
      chiefComplaint: '',
      hpi:            '',
      ros:            '',
      physicalExam:   '',
      assessment:     '',
      plan:           '',
      signed:         false,
      signedBy:       null,
      signedAt:       null,
      pinned:         false,
      lastModified:   new Date().toISOString(),
      addenda:        [],
      ...data,
    };
    notes.push(newNote);
    saveAll(KEYS.notes, notes);
    return newNote;
  }
}

function deleteNote(encounterId) {
  getNotes().filter(function(n) { return n.encounterId === encounterId; }).forEach(function(n) {
    softDeleteRecord(KEYS.notes, n.id);
  });
}

/* ============================================================
   Orders
   ============================================================ */
function getOrders() { return loadAll(KEYS.orders); }

function getOrdersByEncounter(encounterId) {
  return getOrders()
    .filter(o => o.encounterId === encounterId)
    .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
}

function getOrder(id) { return getOrders().find(o => o.id === id) || null; }

function saveOrder(data) {
  /* --- Schema validation (PR-7) --- */
  if (!data.id || !getOrder(data.id)) {
    var schemaCheck = validateSchema(data, 'order');
    if (!schemaCheck.valid) return { error: true, errors: schemaCheck.errors };
  }
  /* --- Data validation (hardening) --- */
  var VALID_ORDER_TYPES = ['Medication', 'Lab', 'Imaging', 'Consult'];
  if (!data.id || !getOrder(data.id)) {
    var ordReq = validateRequired(data, ['encounterId', 'patientId']);
    if (!ordReq.valid) return { error: true, errors: ordReq.errors };
    if (data.type && VALID_ORDER_TYPES.indexOf(data.type) < 0) {
      return { error: true, errors: ['Order type must be one of: ' + VALID_ORDER_TYPES.join(', ')] };
    }
    var orderType = data.type || 'Medication';
    var detail = data.detail || {};
    if (orderType === 'Medication' && (!detail.drug || detail.drug.trim() === '')) {
      return { error: true, errors: ['Drug name is required for Medication orders'] };
    }
    if (orderType === 'Lab' && (!detail.panel || detail.panel.trim() === '')) {
      return { error: true, errors: ['Panel is required for Lab orders'] };
    }
    if (orderType === 'Imaging') {
      var imgErrors = [];
      if (!detail.modality || detail.modality.trim() === '') imgErrors.push('Modality is required for Imaging orders');
      if (!detail.bodyPart || detail.bodyPart.trim() === '') imgErrors.push('Body part is required for Imaging orders');
      if (imgErrors.length > 0) return { error: true, errors: imgErrors };
    }
  }
  /* --- End validation --- */

  const orders = loadAll(KEYS.orders, true);
  const existing = orders.findIndex(o => o.id === data.id);
  if (existing >= 0) {
    orders[existing] = { ...orders[existing], ...data };
    saveAll(KEYS.orders, orders);
    return orders[existing];
  } else {
    const newOrder = {
      id:          generateId(),
      encounterId: '',
      patientId:   '',
      orderedBy:   '',
      type:        'Medication',
      priority:    'Routine',
      status:      'Pending',
      detail:      {},
      dateTime:    new Date().toISOString(),
      completedAt: null,
      notes:       '',
      ...data,
    };
    orders.push(newOrder);
    saveAll(KEYS.orders, orders);
    logAudit('Order Placed', 'order', newOrder.id, newOrder.patientId, newOrder.type);
    /* --- System audit for order placement (hardening) --- */
    var orderUser = getSessionUser();
    logSystemAudit('ORDER_PLACED', orderUser ? orderUser.id : (newOrder.orderedBy || ''), newOrder.patientId, 'Order placed: ' + newOrder.type + ' (id: ' + newOrder.id + ')', orderUser ? orderUser.email : '');
    /* --- End audit --- */
    return newOrder;
  }
}

function deleteOrder(id) {
  softDeleteRecord(KEYS.orders, id);
}

function deleteOrdersByEncounter(encounterId) {
  getOrders().filter(function(o) { return o.encounterId === encounterId; }).forEach(function(o) {
    softDeleteRecord(KEYS.orders, o.id);
  });
}

function updateOrderStatus(id, status) {
  const orders = loadAll(KEYS.orders, true);
  const idx = orders.findIndex(o => o.id === id);
  if (idx < 0) return null;
  orders[idx].status = status;
  if (status === 'Completed') orders[idx].completedAt = new Date().toISOString();
  saveAll(KEYS.orders, orders);
  /* --- Audit logging for order status changes (hardening) --- */
  if (status === 'Cancelled') {
    var user = getSessionUser();
    logSystemAudit('ORDER_CANCELLED', user ? user.id : '', orders[idx].patientId, 'Order cancelled: ' + orders[idx].type + ' (id: ' + id + ')', user ? user.email : '');
  }
  /* --- End audit --- */
  return orders[idx];
}

/* ============================================================
   Addenda (appended to signed notes)
   ============================================================ */
function addNoteAddendum(encounterId, { text, addedBy }) {
  const notes = loadAll(KEYS.notes, true);
  const idx   = notes.findIndex(n => n.encounterId === encounterId);
  if (idx < 0) return null;
  if (!Array.isArray(notes[idx].addenda)) notes[idx].addenda = [];
  notes[idx].addenda.push({
    id:      generateId(),
    text,
    addedBy,
    addedAt: new Date().toISOString(),
  });
  notes[idx].lastModified = new Date().toISOString();
  saveAll(KEYS.notes, notes);
  logAudit('Addendum Added', 'note', notes[idx].id, notes[idx].encounterId, 'Added by ' + (addedBy || ''));
  return notes[idx];
}

/* ============================================================
   Vital Signs (one record per encounter)
   ============================================================ */
function getEncounterVitals(encounterId) {
  return loadAll(KEYS.vitals).find(v => v.encounterId === encounterId) || null;
}

function getLatestVitalsByPatient(patientId) {
  const encs = getEncountersByPatient(patientId);
  for (const enc of encs) {
    const v = getEncounterVitals(enc.id);
    if (v) return { vitals: v, encounter: enc };
  }
  return null;
}

function saveEncounterVitals(data) {
  /* --- Schema validation (PR-7) --- */
  var existingVital = loadAll(KEYS.vitals).find(function(v) { return v.encounterId === data.encounterId; });
  if (!existingVital) {
    var schemaCheck = validateSchema(data, 'vital');
    if (!schemaCheck.valid) return { error: true, errors: schemaCheck.errors };
  }
  const all = loadAll(KEYS.vitals, true);
  const idx = all.findIndex(v => v.encounterId === data.encounterId);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...data };
  } else {
    all.push({
      id:              generateId(),
      encounterId:     '',
      patientId:       '',
      bpSystolic:      '',
      bpDiastolic:     '',
      heartRate:       '',
      respiratoryRate: '',
      tempF:           '',
      spo2:            '',
      weightLbs:       '',
      heightIn:        '',
      recordedAt:      new Date().toISOString(),
      recordedBy:      '',
      ...data,
    });
  }
  saveAll(KEYS.vitals, all);
}

/* ============================================================
   Family History (one record per patient)
   ============================================================ */
function getFamilyHistory(patientId) {
  return loadAll(KEYS.familyHistory).find(f => f.patientId === patientId) || null;
}

function saveFamilyHistory(data) {
  const all = loadAll(KEYS.familyHistory, true);
  const idx = all.findIndex(f => f.patientId === data.patientId);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...data };
  } else {
    all.push({
      patientId:            '',
      mother:               '',
      father:               '',
      siblings:             '',
      maternalGrandparents: '',
      paternalGrandparents: '',
      other:                '',
      notes:                '',
      ...data,
    });
  }
  saveAll(KEYS.familyHistory, all);
}

/* ============================================================
   Orders — additional query
   ============================================================ */
function getOrdersByPatient(patientId) {
  return getOrders()
    .filter(o => o.patientId === patientId)
    .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
}

/* ============================================================
   Allergies
   ============================================================ */
function getPatientAllergies(patientId) {
  return loadAll(KEYS.allergies).filter(a => a.patientId === patientId);
}

function savePatientAllergy(data) {
  /* --- Schema validation (PR-7) --- */
  if (!data.id || loadAll(KEYS.allergies).findIndex(function(a) { return a.id === data.id; }) < 0) {
    var schemaCheck = validateSchema(data, 'allergy');
    if (!schemaCheck.valid) return { error: true, errors: schemaCheck.errors };
  }
  const all = loadAll(KEYS.allergies, true);
  const idx = all.findIndex(a => a.id === data.id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...data };
  } else {
    all.push({
      id:        generateId(),
      patientId: '',
      allergen:  '',
      reaction:  '',
      severity:  'Moderate',
      type:      'Drug',
      ...data,
    });
  }
  saveAll(KEYS.allergies, all);
}

function deletePatientAllergy(id) {
  softDeleteRecord(KEYS.allergies, id);
}

/* ============================================================
   Past Medical History (PMH / Diagnoses)
   ============================================================ */
function getPatientDiagnoses(patientId) {
  return loadAll(KEYS.pmh).filter(d => d.patientId === patientId);
}

function savePatientDiagnosis(data) {
  const all = loadAll(KEYS.pmh, true);
  const idx = all.findIndex(d => d.id === data.id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...data };
  } else {
    all.push({
      id:            generateId(),
      patientId:     '',
      name:          '',
      icd10:         '',
      onsetDate:     '',
      evidenceNotes: '',
      ...data,
    });
  }
  saveAll(KEYS.pmh, all);
}

function deletePatientDiagnosis(id) {
  softDeleteRecord(KEYS.pmh, id);
}

/* ============================================================
   Patient Medications (patient-level, not encounter orders)
   ============================================================ */
function getPatientMedications(patientId) {
  return loadAll(KEYS.patientMeds).filter(m => m.patientId === patientId);
}

function savePatientMedication(data) {
  const all = loadAll(KEYS.patientMeds, true);
  const idx = all.findIndex(m => m.id === data.id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...data };
  } else {
    all.push({
      id:           generateId(),
      patientId:    '',
      name:         '',
      dose:         '',
      unit:         'mg',
      route:        'PO',
      frequency:    'QDay',
      status:       'Current',
      setting:      'Outpatient',
      startDate:    '',
      endDate:      '',
      indication:   '',
      prescribedBy: '',
      ...data,
    });
  }
  saveAll(KEYS.patientMeds, all);
}

function deletePatientMedication(id) {
  softDeleteRecord(KEYS.patientMeds, id);
}

/* ============================================================
   Social History  (one record per patient)
   ============================================================ */
function getSocialHistory(patientId) {
  return loadAll(KEYS.socialHistory).find(s => s.patientId === patientId) || null;
}

function saveSocialHistory(data) {
  const all = loadAll(KEYS.socialHistory, true);
  const idx = all.findIndex(s => s.patientId === data.patientId);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...data };
  } else {
    all.push({
      patientId:       '',
      smokingStatus:   '',
      tobaccoUse:      '',
      alcoholUse:      '',
      substanceUse:    '',
      occupation:      '',
      maritalStatus:   '',
      livingSituation: '',
      exercise:        '',
      diet:            '',
      notes:           '',
      ...data,
    });
  }
  saveAll(KEYS.socialHistory, all);
}

/* ============================================================
   Past Surgeries
   ============================================================ */
function getPatientSurgeries(patientId) {
  return loadAll(KEYS.surgeries)
    .filter(s => s.patientId === patientId)
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

function savePatientSurgery(data) {
  const all = loadAll(KEYS.surgeries, true);
  const idx = all.findIndex(s => s.id === data.id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...data };
  } else {
    all.push({
      id:        generateId(),
      patientId: '',
      procedure: '',
      date:      '',
      hospital:  '',
      surgeon:   '',
      notes:     '',
      ...data,
    });
  }
  saveAll(KEYS.surgeries, all);
}

function deletePatientSurgery(id) {
  softDeleteRecord(KEYS.surgeries, id);
}

/* ============================================================
   Active Problem List
   ============================================================ */
function getActiveProblems(patientId) {
  return loadAll(KEYS.problems).filter(p => p.patientId === patientId);
}

function saveActiveProblem(data) {
  const all = loadAll(KEYS.problems, true);
  const idx = all.findIndex(p => p.id === data.id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...data };
  } else {
    all.push({
      id:             generateId(),
      patientId:      '',
      name:           '',
      icd10:          '',
      onset:          '',
      status:         'Active',
      priority:       'Medium',
      lastReviewDate: '',
      notes:          '',
      ...data,
    });
  }
  saveAll(KEYS.problems, all);
}

function deleteActiveProblem(id) {
  softDeleteRecord(KEYS.problems, id);
}

/* ============================================================
   Lab Results
   ============================================================ */
function getLabResults(patientId) {
  return loadAll(KEYS.labResults)
    .filter(l => l.patientId === patientId)
    .sort((a, b) => new Date(b.resultDate) - new Date(a.resultDate));
}

function saveLabResult(data) {
  const all = loadAll(KEYS.labResults, true);
  const idx = all.findIndex(l => l.id === data.id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...data };
  } else {
    all.push({
      id:         generateId(),
      patientId:  '',
      encounterId:null,
      orderId:    null,
      panel:      '',
      resultDate: new Date().toISOString(),
      resultedBy: '',
      tests:      [],
      notes:      '',
      reviewedBy: null,
      reviewedAt: null,
      ...data,
    });
  }
  saveAll(KEYS.labResults, all);
}

function deleteLabResult(id) {
  softDeleteRecord(KEYS.labResults, id);
}

/* ============================================================
   Imaging Results
   ============================================================ */
function getImagingResults(patientId) {
  return loadAll(KEYS.imagingResults)
    .filter(r => r.patientId === patientId)
    .sort((a, b) => new Date(b.resultDate) - new Date(a.resultDate));
}

function saveImagingResult(data) {
  const all = loadAll(KEYS.imagingResults, true);
  const idx = all.findIndex(r => r.id === data.id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...data };
  } else {
    all.push({
      id:           generateId(),
      patientId:    '',
      studyType:    '',
      modality:     '',
      bodyRegion:   '',
      resultDate:   new Date().toISOString(),
      orderedBy:    '',
      readBy:       '',
      indication:   '',
      findings:     '',
      impression:   '',
      status:       'Final',
      ...data,
    });
  }
  saveAll(KEYS.imagingResults, all);
}

function deleteImagingResult(id) {
  softDeleteRecord(KEYS.imagingResults, id);
}

/* ============================================================
   Microbiology Results
   ============================================================ */
function getMicroResults(patientId) {
  return loadAll(KEYS.microResults)
    .filter(r => r.patientId === patientId)
    .sort((a, b) => new Date(b.collectionDate) - new Date(a.collectionDate));
}

function saveMicroResult(data) {
  const all = loadAll(KEYS.microResults, true);
  const idx = all.findIndex(r => r.id === data.id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...data };
  } else {
    all.push({
      id:              generateId(),
      patientId:       '',
      cultureSite:     '',
      collectionDate:  new Date().toISOString(),
      organism:        '',
      gramStain:       '',
      sensitivities:   [],
      status:          'Final',
      notes:           '',
      ...data,
    });
  }
  saveAll(KEYS.microResults, all);
}

function deleteMicroResult(id) {
  softDeleteRecord(KEYS.microResults, id);
}

/* ============================================================
   Pathology Results
   ============================================================ */
function getPathResults(patientId) {
  return loadAll(KEYS.pathResults)
    .filter(r => r.patientId === patientId)
    .sort((a, b) => new Date(b.resultDate) - new Date(a.resultDate));
}

function savePathResult(data) {
  const all = loadAll(KEYS.pathResults, true);
  const idx = all.findIndex(r => r.id === data.id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...data };
  } else {
    all.push({
      id:            generateId(),
      patientId:     '',
      specimenType:  '',
      specimenSite:  '',
      collectionDate:new Date().toISOString(),
      resultDate:    new Date().toISOString(),
      pathologist:   '',
      grossDesc:     '',
      microDesc:     '',
      diagnosis:     '',
      status:        'Final',
      notes:         '',
      ...data,
    });
  }
  saveAll(KEYS.pathResults, all);
}

function deletePathResult(id) {
  softDeleteRecord(KEYS.pathResults, id);
}

/* ============================================================
   Immunizations
   ============================================================ */
function getImmunizations(patientId) {
  return loadAll(KEYS.immunizations)
    .filter(i => i.patientId === patientId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function saveImmunization(data) {
  const all = loadAll(KEYS.immunizations, true);
  const idx = all.findIndex(i => i.id === data.id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...data };
  } else {
    all.push({
      id:           generateId(),
      patientId:    '',
      vaccine:      '',
      date:         '',
      lot:          '',
      manufacturer: '',
      site:         '',
      givenBy:      '',
      nextDue:      '',
      notes:        '',
      ...data,
    });
  }
  saveAll(KEYS.immunizations, all);
}

function deleteImmunization(id) {
  softDeleteRecord(KEYS.immunizations, id);
}

/* ============================================================
   Referrals
   ============================================================ */
function getReferrals(patientId) {
  return loadAll(KEYS.referrals)
    .filter(r => r.patientId === patientId)
    .sort((a, b) => new Date(b.referralDate) - new Date(a.referralDate));
}

function saveReferral(data) {
  const all = loadAll(KEYS.referrals, true);
  const idx = all.findIndex(r => r.id === data.id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...data };
  } else {
    all.push({
      id:              generateId(),
      patientId:       '',
      encounterId:     null,
      specialty:       '',
      providerName:    '',
      reason:          '',
      urgency:         'Routine',
      status:          'Pending',
      referralDate:    new Date().toISOString(),
      appointmentDate: '',
      responseNotes:   '',
      ...data,
    });
  }
  saveAll(KEYS.referrals, all);
}

function deleteReferral(id) {
  softDeleteRecord(KEYS.referrals, id);
}

/* ============================================================
   Preventive Care Screenings
   ============================================================ */
function getScreeningRecords(patientId) {
  return loadAll(KEYS.screenings).filter(s => s.patientId === patientId);
}

function saveScreeningRecord(data) {
  const all = loadAll(KEYS.screenings, true);
  const idx = all.findIndex(s => s.id === data.id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...data };
  } else {
    all.push({
      id:            generateId(),
      patientId:     '',
      screening:     '',
      completedDate: '',
      nextDue:       '',
      ...data,
    });
  }
  saveAll(KEYS.screenings, all);
}

/* ============================================================
   Documents
   ============================================================ */
function getDocuments(patientId) {
  return loadAll(KEYS.documents)
    .filter(d => d.patientId === patientId)
    .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
}

function saveDocument(data) {
  const all = loadAll(KEYS.documents, true);
  const idx = all.findIndex(d => d.id === data.id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...data };
  } else {
    all.push({
      id:          generateId(),
      patientId:   '',
      name:        '',
      type:        '',
      category:    'Clinical',
      uploadDate:  new Date().toISOString(),
      description: '',
      fileSize:    0,
      fileData:    null,
      ...data,
    });
  }
  saveAll(KEYS.documents, all);
}

function deleteDocument(id) {
  softDeleteRecord(KEYS.documents, id);
}

/* ============================================================
   Audit Log
   ============================================================ */
function logAudit(action, entityType, entityId, patientId, details) {
  const all = loadAll(KEYS.auditLog, true);
  all.push({
    id:         generateId(),
    timestamp:  new Date().toISOString(),
    action,
    entityType,
    entityId:   entityId || '',
    patientId:  patientId || '',
    details:    details || '',
  });
  // Rotate: keep max 1000 entries (newest)
  if (all.length > 1000) all.splice(0, all.length - 1000);
  saveAll(KEYS.auditLog, all);
}

function getAuditLog(patientId) {
  return loadAll(KEYS.auditLog)
    .filter(e => e.patientId === patientId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/* ============================================================
   Medication Reconciliation
   ============================================================ */
function getMedRec(encounterId) {
  return loadAll(KEYS.medRec).filter(r => r.encounterId === encounterId);
}

function saveMedRec(encounterId, records) {
  const all = loadAll(KEYS.medRec, true).filter(r => r.encounterId !== encounterId || r._deleted);
  records.forEach(r => {
    all.push({
      id:          generateId(),
      encounterId,
      medId:       r.medId || '',
      medName:     r.medName || '',
      action:      r.action || 'Continued',
      notes:       r.notes || '',
      patientId:   r.patientId || '',
    });
  });
  saveAll(KEYS.medRec, all);
}

/* ============================================================
   Note Templates
   ============================================================ */
function getNoteTemplates() {
  return loadAll(KEYS.noteTemplates);
}

function saveNoteTemplate(data) {
  const all = loadAll(KEYS.noteTemplates, true);
  const idx = all.findIndex(t => t.id === data.id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...data };
  } else {
    all.push({
      id:             generateId(),
      name:           '',
      visitType:      '',
      chiefComplaint: '',
      hpi:            '',
      ros:            '',
      physicalExam:   '',
      assessment:     '',
      plan:           '',
      isBuiltIn:      false,
      ...data,
    });
  }
  saveAll(KEYS.noteTemplates, all);
}

function deleteNoteTemplate(id) {
  softDeleteRecord(KEYS.noteTemplates, id);
}

/* ============================================================
   Appointments
   ============================================================ */
function getAppointments() { return loadAll(KEYS.appointments); }

function getAppointmentsByDate(dateStr) {
  return getAppointments().filter(a => a.dateTime && a.dateTime.startsWith(dateStr))
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
}

function getAppointmentsByPatient(patientId) {
  return getAppointments().filter(a => a.patientId === patientId)
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
}

function getAppointmentsByProvider(providerId) {
  return getAppointments().filter(a => a.providerId === providerId)
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
}

function getAppointmentsByWeek(mondayStr) {
  const monday = new Date(mondayStr + 'T00:00:00');
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 7);
  return getAppointments().filter(a => {
    const d = new Date(a.dateTime);
    return d >= monday && d < sunday;
  }).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
}

function saveAppointment(data) {
  /* --- Schema validation (PR-7) --- */
  if (!data.id || !getAppointments().find(function(a) { return a.id === data.id; })) {
    var schemaCheck = validateSchema(data, 'appointment');
    if (!schemaCheck.valid) return { error: true, errors: schemaCheck.errors };
  }
  const all = loadAll(KEYS.appointments, true);
  const idx = all.findIndex(a => a.id === data.id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...data };
    saveAll(KEYS.appointments, all);
    return all[idx];
  }
  const newAppt = {
    id:        generateId(),
    patientId: '',
    providerId:'',
    dateTime:  '',
    duration:  30,
    visitType: 'Follow-Up',
    reason:    '',
    status:    'Scheduled',
    createdAt: new Date().toISOString(),
    ...data,
  };
  all.push(newAppt);
  saveAll(KEYS.appointments, all);
  return newAppt;
}

function deleteAppointment(id) {
  softDeleteRecord(KEYS.appointments, id);
}

/* ============================================================
   Panel / Provider Assignment
   ============================================================ */
function assignPanel(patientId, providerIds) {
  const pat = getPatient(patientId);
  if (pat) savePatient({ id: patientId, panelProviders: providerIds });
}

function getCurrentProvider() {
  return _storageAdapter.getItem(KEYS.currentProvider) || '';
}

function setCurrentProvider(providerId) {
  _storageAdapter.setItem(KEYS.currentProvider, providerId || '');
}

/* ============================================================
   Authentication — Users & Sessions
   ============================================================ */
function getUsers() { return loadAll(KEYS.users); }

function getUser(id) { return getUsers().find(u => u.id === id) || null; }

function getUserByEmail(email) {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

function saveUser(data) {
  const users = loadAll(KEYS.users, true);
  const existing = users.findIndex(u => u.id === data.id);
  if (existing >= 0) {
    users[existing] = { ...users[existing], ...data };
    saveAll(KEYS.users, users);
    return users[existing];
  }
  const newUser = {
    id: generateId(),
    firstName: '',
    lastName: '',
    dob: '',
    npiNumber: '',
    email: '',
    phone: '',
    degree: 'MD',
    passwordHash: '',
    role: 'user',
    status: 'pending',
    mustChangePassword: false,
    approvedBy: '',
    approvedAt: '',
    deactivatedAt: '',
    lastPasswordChange: '',
    createdAt: new Date().toISOString(),
    ...data,
  };
  users.push(newUser);
  saveAll(KEYS.users, users);
  return newUser;
}

async function hashPassword(pw) {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pw);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  throw new Error('Secure hashing unavailable — crypto.subtle requires HTTPS or localhost. Please use a local server.');
}

/* ---------- Account Lockout Helpers (hardening) ---------- */
var MAX_LOGIN_ATTEMPTS = 5;
var LOCKOUT_MINUTES = 15;

function getLoginAttempts() {
  try {
    var raw = _storageAdapter.getItem(KEYS.loginAttempts);
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}

function saveLoginAttempts(data) {
  _storageAdapter.setItem(KEYS.loginAttempts, JSON.stringify(data));
}

function recordFailedLogin(email) {
  var all = getLoginAttempts();
  var record = all[email] || { attempts: 0, lastAttempt: null, lockedUntil: null };
  record.attempts += 1;
  record.lastAttempt = new Date().toISOString();
  if (record.attempts >= MAX_LOGIN_ATTEMPTS) {
    var lockUntil = new Date();
    lockUntil.setMinutes(lockUntil.getMinutes() + LOCKOUT_MINUTES);
    record.lockedUntil = lockUntil.toISOString();
  }
  all[email] = record;
  saveLoginAttempts(all);
}

function clearLoginAttempts(email) {
  var all = getLoginAttempts();
  delete all[email];
  saveLoginAttempts(all);
}

function isAccountLocked(email) {
  var all = getLoginAttempts();
  var record = all[email];
  if (!record || !record.lockedUntil) return { locked: false, minutesRemaining: 0 };
  var lockUntil = new Date(record.lockedUntil);
  var now = new Date();
  if (now >= lockUntil) {
    // Lockout expired — clear
    clearLoginAttempts(email);
    return { locked: false, minutesRemaining: 0 };
  }
  var remaining = Math.ceil((lockUntil.getTime() - now.getTime()) / 60000);
  return { locked: true, minutesRemaining: remaining };
}

async function login(email, password) {
  /* --- Account lockout check (hardening) --- */
  var lockStatus = isAccountLocked(email);
  if (lockStatus.locked) {
    logSystemAudit('LOGIN_FAILED', '', '', 'Account locked: ' + email, email);
    return { ok: false, error: 'Account locked. Try again in ' + lockStatus.minutesRemaining + ' minutes.' };
  }
  /* --- End lockout check --- */

  const user = getUserByEmail(email);
  if (!user) {
    recordFailedLogin(email);
    logSystemAudit('LOGIN_FAILED', '', '', 'Invalid email: ' + email, email);
    return { ok: false, error: 'No user exists with this email.' };
  }
  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) {
    recordFailedLogin(email);
    logSystemAudit('LOGIN_FAILED', user.id, '', 'Wrong password (attempt ' + ((getLoginAttempts()[email] || {}).attempts || 1) + '/' + MAX_LOGIN_ATTEMPTS + ')', user.email);
    var afterLock = isAccountLocked(email);
    if (afterLock.locked) {
      return { ok: false, error: 'Account locked. Try again in ' + afterLock.minutesRemaining + ' minutes.' };
    }
    return { ok: false, error: 'Incorrect password.' };
  }
  // Backwards compat: treat missing status as active
  const status = user.status || 'active';
  if (status === 'denied') {
    logSystemAudit('LOGIN_FAILED', user.id, '', 'Account denied', user.email);
    return { ok: false, error: 'Your account has been denied. Please contact an administrator.' };
  }
  if (status === 'deactivated') {
    logSystemAudit('LOGIN_FAILED', user.id, '', 'Account deactivated', user.email);
    return { ok: false, error: 'Your account has been deactivated. Please contact an administrator.' };
  }
  /* --- Clear lockout on successful login (hardening) --- */
  clearLoginAttempts(email);
  /* --- End lockout clear --- */
  _storageAdapter.setItem(KEYS.session, JSON.stringify({ userId: user.id, loginAt: new Date().toISOString(), lastActivity: new Date().toISOString() }));
  logSystemAudit('LOGIN', user.id, '', 'Successful login', user.email);
  return { ok: true, user };
}

function logout() {
  const user = getSessionUser();
  if (user) logSystemAudit('LOGOUT', user.id, '', 'User logged out', user.email);
  _storageAdapter.removeItem(KEYS.session);
}

function getSession() {
  try {
    const raw = _storageAdapter.getItem(KEYS.session);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function isAuthenticated() {
  const session = getSession();
  if (!session || !session.userId) return false;
  return !!getUser(session.userId);
}

function getSessionUser() {
  const session = getSession();
  return session ? getUser(session.userId) : null;
}

/* ============================================================
   System Audit Log (HIPAA)
   ============================================================ */
function logSystemAudit(action, userId, targetUserId, details, email) {
  const all = loadAll(KEYS.systemAuditLog, true);
  all.push({
    id:           generateId(),
    timestamp:    new Date().toISOString(),
    action,
    userId:       userId || '',
    targetUserId: targetUserId || '',
    details:      details || '',
    email:        email || '',
  });
  if (all.length > 2000) all.splice(0, all.length - 2000);
  saveAll(KEYS.systemAuditLog, all);
}

function getSystemAuditLog() {
  return loadAll(KEYS.systemAuditLog)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/* ============================================================
   Session Management (HIPAA)
   ============================================================ */
function updateSessionActivity() {
  const session = getSession();
  if (!session) return;
  session.lastActivity = new Date().toISOString();
  _storageAdapter.setItem(KEYS.session, JSON.stringify(session));
}

function isSessionExpired(timeoutMinutes = 15) {
  const session = getSession();
  if (!session || !session.lastActivity) return false;
  const elapsed = (Date.now() - new Date(session.lastActivity).getTime()) / 60000;
  return elapsed >= timeoutMinutes;
}

/* ============================================================
   Password & User Management (HIPAA)
   ============================================================ */
function validatePasswordStrength(password) {
  const errors = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('At least one number');
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:',.<>?\/]/.test(password)) errors.push('At least one special character');
  return { valid: errors.length === 0, errors };
}

/**
 * validatePasswordComplexity — enhanced password validation including
 * special character requirement and email comparison.
 * Returns { valid: boolean, errors: string[] }
 */
function validatePasswordComplexity(password, email) {
  var result = validatePasswordStrength(password);
  if (email && typeof email === 'string' && password.toLowerCase() === email.toLowerCase()) {
    result.errors.push('Password cannot be the same as your email address');
    result.valid = false;
  }
  return result;
}

async function changePassword(userId, newPassword) {
  const user = getUser(userId);
  if (!user) return false;
  /* --- Validate password complexity on change (hardening) --- */
  var pwCheck = validatePasswordComplexity(newPassword, user.email);
  if (!pwCheck.valid) return { error: true, errors: pwCheck.errors };
  /* --- End validation --- */
  const passwordHash = await hashPassword(newPassword);
  saveUser({ id: userId, passwordHash, mustChangePassword: false, lastPasswordChange: new Date().toISOString() });
  logSystemAudit('PASSWORD_CHANGED', userId, '', 'Password changed', user.email);
  return true;
}

function generateTempPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const specials = '!@#$%^&*_+-=';
  let pw = '';
  pw += upper[Math.floor(Math.random() * upper.length)];
  pw += lower[Math.floor(Math.random() * lower.length)];
  pw += digits[Math.floor(Math.random() * digits.length)];
  pw += specials[Math.floor(Math.random() * specials.length)];
  const all = upper + lower + digits + specials;
  for (let i = 0; i < 4; i++) pw += all[Math.floor(Math.random() * all.length)];
  return pw.split('').sort(() => Math.random() - 0.5).join('');
}

async function resetPasswordForUser(userId, initiatorId) {
  const user = getUser(userId);
  if (!user) return null;
  const tempPw = generateTempPassword();
  const passwordHash = await hashPassword(tempPw);
  saveUser({ id: userId, passwordHash, mustChangePassword: true });
  const who = initiatorId ? (getUser(initiatorId) || {}).email || 'admin' : 'self-service';
  logSystemAudit('PASSWORD_RESET', initiatorId || userId, userId, 'Password reset by ' + who, user.email);
  return tempPw;
}

function approveUser(targetUserId, adminUserId) {
  const target = getUser(targetUserId);
  const admin = getUser(adminUserId);
  if (!target || !admin) return false;
  saveUser({ id: targetUserId, status: 'active', approvedBy: adminUserId, approvedAt: new Date().toISOString() });
  logSystemAudit('USER_APPROVED', adminUserId, targetUserId, admin.email + ' approved ' + target.email, admin.email);
  return true;
}

function denyUser(targetUserId, adminUserId) {
  const target = getUser(targetUserId);
  const admin = getUser(adminUserId);
  if (!target || !admin) return false;
  saveUser({ id: targetUserId, status: 'denied' });
  logSystemAudit('USER_DENIED', adminUserId, targetUserId, admin.email + ' denied ' + target.email, admin.email);
  return true;
}

function deactivateUser(targetUserId, adminUserId) {
  const target = getUser(targetUserId);
  const admin = getUser(adminUserId);
  if (!target || !admin) return false;
  saveUser({ id: targetUserId, status: 'deactivated', deactivatedAt: new Date().toISOString() });
  logSystemAudit('USER_DEACTIVATED', adminUserId, targetUserId, admin.email + ' deactivated ' + target.email, admin.email);
  return true;
}

function reactivateUser(targetUserId, adminUserId) {
  const target = getUser(targetUserId);
  const admin = getUser(adminUserId);
  if (!target || !admin) return false;
  saveUser({ id: targetUserId, status: 'active', deactivatedAt: '' });
  logSystemAudit('USER_REACTIVATED', adminUserId, targetUserId, admin.email + ' reactivated ' + target.email, admin.email);
  return true;
}

function promoteToAdmin(targetUserId, adminUserId) {
  const target = getUser(targetUserId);
  const admin = getUser(adminUserId);
  if (!target || !admin) return false;
  saveUser({ id: targetUserId, role: 'admin' });
  logSystemAudit('USER_PROMOTED', adminUserId, targetUserId, admin.email + ' promoted ' + target.email + ' to admin', admin.email);
  return true;
}

function demoteFromAdmin(targetUserId, adminUserId) {
  const target = getUser(targetUserId);
  const admin = getUser(adminUserId);
  if (!target || !admin) return false;
  saveUser({ id: targetUserId, role: 'user' });
  logSystemAudit('USER_DEMOTED', adminUserId, targetUserId, admin.email + ' demoted ' + target.email + ' from admin', admin.email);
  return true;
}

function getPendingUsers() {
  return getUsers().filter(u => u.status === 'pending');
}

function isAdmin(userId) {
  if (!userId) {
    const user = getSessionUser();
    return user ? user.role === 'admin' : false;
  }
  const user = getUser(userId);
  return user ? user.role === 'admin' : false;
}

/* ============================================================
   Role-Based Access Control Helpers (hardening)
   ============================================================ */
var ROLE_HIERARCHY = ['admin', 'attending', 'resident', 'nurse', 'medical_assistant', 'front_desk'];

var ROLE_PERMISSIONS = {
  admin:              ['view_admin', 'place_orders', 'sign_notes', 'write_notes', 'edit_patient', 'view_chart', 'send_messages', 'prescribe_controlled', 'export_data'],
  attending:          ['place_orders', 'sign_notes', 'write_notes', 'edit_patient', 'view_chart', 'send_messages', 'prescribe_controlled', 'export_data'],
  resident:           ['place_orders', 'write_notes', 'edit_patient', 'view_chart', 'send_messages'],
  nurse:              ['write_notes', 'edit_patient', 'view_chart', 'send_messages'],
  medical_assistant:  ['view_chart', 'send_messages'],
  front_desk:         ['send_messages'],
  user:               ['view_chart', 'send_messages'],
};

var ALL_PERMISSIONS = ['view_admin', 'place_orders', 'sign_notes', 'write_notes', 'edit_patient', 'view_chart', 'send_messages', 'prescribe_controlled', 'export_data'];

function getCustomRolePermissions() {
  try { return JSON.parse(_storageAdapter.getItem('emr_custom_role_permissions') || '{}'); } catch(e) { return {}; }
}
function saveCustomRolePermissions(perms) {
  _storageAdapter.setItem('emr_custom_role_permissions', JSON.stringify(perms));
}
function getEffectivePermissions(role) {
  const custom = getCustomRolePermissions();
  if (custom[role]) return custom[role];
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['user'];
}

/**
 * Normalize role string from user record to lowercase key matching ROLE_PERMISSIONS.
 * Handles legacy role values like 'Attending', 'Nurse', 'Admin', 'MA', etc.
 */
function normalizeRole(role) {
  if (!role) return 'user';
  var lower = role.toLowerCase().trim();
  if (lower === 'ma') return 'medical_assistant';
  if (lower === 'frontdesk' || lower === 'front desk' || lower === 'front_desk') return 'front_desk';
  if (lower === 'medical_assistant') return 'medical_assistant';
  if (ROLE_HIERARCHY.indexOf(lower) >= 0) return lower;
  return 'user';
}

/**
 * hasPermission — check if the current session user has a specific permission.
 */
function hasPermission(permission) {
  var user = getSessionUser();
  if (!user) return false;
  var role = normalizeRole(user.role);
  var perms = getEffectivePermissions(role);
  return perms.indexOf(permission) >= 0;
}

/**
 * canPlaceOrders — attending and resident roles.
 */
function canPlaceOrders() {
  var user = getSessionUser();
  if (!user) return false;
  var role = normalizeRole(user.role);
  return role === 'admin' || role === 'attending' || role === 'resident';
}

/**
 * canSignNotes — attending only.
 */
function canSignNotes() {
  var user = getSessionUser();
  if (!user) return false;
  var role = normalizeRole(user.role);
  return role === 'admin' || role === 'attending';
}

/**
 * canPrescribeControlled — attending with DEA number.
 */
function canPrescribeControlled() {
  var user = getSessionUser();
  if (!user) return false;
  var role = normalizeRole(user.role);
  if (role !== 'attending' && role !== 'admin') return false;
  return !!(user.dea && user.dea.trim() !== '');
}

/**
 * canViewAdmin — admin role only.
 */
function canViewAdmin() {
  return isAdmin();
}

/**
 * canEditPatient — attending, resident, nurse.
 */
function canEditPatient() {
  var user = getSessionUser();
  if (!user) return false;
  var role = normalizeRole(user.role);
  return role === 'admin' || role === 'attending' || role === 'resident' || role === 'nurse';
}

/**
 * canViewChart — all clinical roles.
 */
function canViewChart() {
  var user = getSessionUser();
  if (!user) return false;
  var role = normalizeRole(user.role);
  return role === 'admin' || role === 'attending' || role === 'resident' || role === 'nurse' || role === 'medical_assistant' || role === 'user';
}

/**
 * canSendMessages — all roles.
 */
function canSendMessages() {
  var user = getSessionUser();
  return !!user;
}

/* ============================================================
   Lab Results — global query
   ============================================================ */
function getAllLabResults() {
  return loadAll(KEYS.labResults).sort((a, b) => new Date(b.resultDate) - new Date(a.resultDate));
}

/* ============================================================
   Messages — Patient/Provider messaging
   ============================================================ */
function getMessages() {
  return loadAll(KEYS.messages);
}

function getMessagesByPatient(patientId) {
  return getMessages().filter(function(m) { return m.patientId === patientId; });
}

function getMessageThread(threadId) {
  return getMessages()
    .filter(function(m) { return m.threadId === threadId; })
    .sort(function(a, b) { return new Date(a.createdAt) - new Date(b.createdAt); });
}

function getUnreadMessages(userId, userType) {
  return getMessages().filter(function(m) {
    return m.toId === userId && m.toType === userType && m.status === 'Sent';
  });
}

function getUnreadMessageCount(userId, userType) {
  return getUnreadMessages(userId, userType).length;
}

function saveMessage(data) {
  /* --- Schema validation (PR-7) --- */
  var existingMsg = data.id ? getMessages().find(function(m) { return m.id === data.id; }) : null;
  if (!existingMsg) {
    var schemaCheck = validateSchema(data, 'message');
    if (!schemaCheck.valid) return { error: true, errors: schemaCheck.errors };
  }
  var all = loadAll(KEYS.messages, true);
  var idx = all.findIndex(function(m) { return m.id === data.id; });
  if (idx >= 0) {
    all[idx] = Object.assign({}, all[idx], data);
    saveAll(KEYS.messages, all);
    return all[idx];
  }
  var msg = {
    id:          generateId(),
    threadId:    '',
    type:        'general',
    fromType:    'provider',
    fromId:      '',
    fromName:    '',
    toType:      'patient',
    toId:        '',
    toName:      '',
    patientId:   '',
    subject:     '',
    body:        '',
    priority:    'Normal',
    status:      'Sent',
    readAt:      null,
    attachments: [],
    createdAt:   new Date().toISOString(),
  };
  Object.assign(msg, data);
  if (!msg.id) msg.id = generateId();
  if (!msg.threadId) msg.threadId = msg.id;
  all.push(msg);
  saveAll(KEYS.messages, all);
  logAudit('MESSAGE_SENT', 'message', msg.id, msg.patientId, 'Message sent: ' + msg.subject);
  /* --- System audit for message sent (hardening) --- */
  var msgUser = getSessionUser();
  logSystemAudit('MESSAGE_SENT', msgUser ? msgUser.id : (msg.fromId || ''), msg.patientId || '', 'Message sent: ' + msg.subject, msgUser ? msgUser.email : '');
  /* --- End audit --- */
  return msg;
}

function markMessageRead(messageId) {
  var all = loadAll(KEYS.messages, true);
  var idx = all.findIndex(function(m) { return m.id === messageId; });
  if (idx < 0) return null;
  all[idx].status = 'Read';
  all[idx].readAt = new Date().toISOString();
  saveAll(KEYS.messages, all);
  return all[idx];
}

/* ============================================================
   Claims / Billing
   ============================================================ */

var PLACE_OF_SERVICE = {
  '11': 'Office',
  '21': 'Inpatient Hospital',
  '23': 'Emergency Room',
  '22': 'Outpatient Hospital',
  '02': 'Telehealth',
};

function getClaims() { return loadAll(KEYS.claims); }
function getClaimsByPatient(patientId) { return getClaims().filter(function(c) { return c.patientId === patientId; }); }
function getClaimsByEncounter(encounterId) { return getClaims().filter(function(c) { return c.encounterId === encounterId; }); }
function getClaim(id) { return getClaims().find(function(c) { return c.id === id; }) || null; }

function saveClaim(data) {
  var all = loadAll(KEYS.claims, true);
  var existing = data.id ? all.find(function(c) { return c.id === data.id; }) : null;

  if (!existing) {
    var schemaCheck = validateSchema(data, 'claim');
    if (!schemaCheck.valid) return { error: true, errors: schemaCheck.errors };

    var newClaim = {
      id: generateId(),
      status: 'Draft',
      charges: [],
      diagnoses: [],
      totalCharge: 0,
      allowedAmount: 0,
      paidAmount: 0,
      patientResponsibility: 0,
      placeOfService: '11',
      createdAt: new Date().toISOString(),
      createdBy: (typeof getSessionUser === 'function' && getSessionUser()) ? getSessionUser().id : null,
      ...data,
    };
    if (!newClaim.id || newClaim.id === data.id) newClaim.id = generateId();
    all.push(newClaim);
  } else {
    Object.assign(existing, data);
  }
  saveAll(KEYS.claims, all);
  return existing || all[all.length - 1];
}

function deleteClaim(id) { return softDeleteRecord(KEYS.claims, id); }

function updateClaimStatus(id, status, details) {
  var claim = getClaim(id);
  if (!claim) return null;
  claim.status = status;
  if (details) Object.assign(claim, details);
  if (status === 'Submitted') claim.submittedDate = new Date().toISOString();
  if (status === 'Accepted' || status === 'Denied' || status === 'Paid') claim.adjudicatedDate = new Date().toISOString();
  return saveClaim(claim);
}

function generateClaimFromEncounter(encounterId) {
  var enc = getEncounter(encounterId);
  if (!enc) return { error: true, errors: ['Encounter not found'] };

  var existing = getClaimsByEncounter(encounterId);
  if (existing.length > 0) return { error: true, errors: ['Claim already exists for this encounter'] };

  var patient = getPatient(enc.patientId);
  var charges = [];
  var diagnoses = [];

  // Pull diagnoses from encounter
  if (enc.diagnoses && enc.diagnoses.length > 0) {
    diagnoses = enc.diagnoses.map(function(dx, i) {
      return { icd10: dx.code || dx.icd10 || '', description: dx.name || dx.description || '', rank: i + 1 };
    });
  }

  // Pull CPT codes from encounter
  if (enc.cptCodes && enc.cptCodes.length > 0) {
    charges = enc.cptCodes.map(function(cpt) {
      return {
        cptCode: cpt.code || cpt,
        description: cpt.description || '',
        units: 1,
        unitCharge: 0,
        modifiers: [],
        diagnosisPointers: [1],
      };
    });
  }

  // Determine place of service
  var pos = '11';
  if (enc.visitType === 'Inpatient') pos = '21';
  else if (enc.visitType === 'Emergency') pos = '23';

  return saveClaim({
    encounterId: encounterId,
    patientId: enc.patientId,
    providerId: enc.providerId,
    payerName: patient ? patient.insurance || '' : '',
    serviceDate: enc.dateTime || enc.visitDate,
    charges: charges,
    diagnoses: diagnoses,
    placeOfService: pos,
  });
}

function getClaimStats() {
  var claims = getClaims();
  var stats = { total: claims.length, draft: 0, ready: 0, submitted: 0, accepted: 0, denied: 0, paid: 0, appealed: 0, totalCharged: 0, totalPaid: 0 };
  claims.forEach(function(c) {
    var key = (c.status || 'draft').toLowerCase();
    if (stats[key] !== undefined) stats[key]++;
    stats.totalCharged += (c.totalCharge || 0);
    stats.totalPaid += (c.paidAmount || 0);
  });
  return stats;
}

/* ============================================================
   Prior Authorizations
   ============================================================ */

var PA_RULES_DEFAULT = [
  { type: 'Imaging', matchPattern: 'MRI|CT|PET', requiresPA: true, description: 'Advanced imaging requires prior authorization' },
  { type: 'Medication', matchPattern: 'brand|biologic|specialty', requiresPA: true, description: 'Brand-name and specialty medications require PA' },
  { type: 'Consult', matchPattern: 'surgery|transplant', requiresPA: true, description: 'Surgical and transplant consults require PA' },
];

function getPriorAuths() { return loadAll(KEYS.priorAuths); }
function getPriorAuthsByPatient(patientId) { return getPriorAuths().filter(function(pa) { return pa.patientId === patientId; }); }
function getPriorAuthByOrder(orderId) { return getPriorAuths().find(function(pa) { return pa.orderId === orderId; }) || null; }
function getPriorAuth(id) { return getPriorAuths().find(function(pa) { return pa.id === id; }) || null; }

function savePriorAuth(data) {
  var all = loadAll(KEYS.priorAuths, true);
  var existing = data.id ? all.find(function(pa) { return pa.id === data.id; }) : null;

  if (!existing) {
    var schemaCheck = validateSchema(data, 'priorAuth');
    if (!schemaCheck.valid) return { error: true, errors: schemaCheck.errors };

    var newPA = {
      id: generateId(),
      status: 'Required',
      urgency: 'Standard',
      documents: [],
      createdAt: new Date().toISOString(),
      createdBy: (typeof getSessionUser === 'function' && getSessionUser()) ? getSessionUser().id : null,
      ...data,
    };
    if (!newPA.id || newPA.id === data.id) newPA.id = generateId();
    all.push(newPA);
  } else {
    Object.assign(existing, data);
  }
  saveAll(KEYS.priorAuths, all);
  return existing || all[all.length - 1];
}

function deletePriorAuth(id) { return softDeleteRecord(KEYS.priorAuths, id); }

function updatePriorAuthStatus(id, status, details) {
  var pa = getPriorAuth(id);
  if (!pa) return null;
  pa.status = status;
  if (details) Object.assign(pa, details);
  if (status === 'Submitted') pa.submittedDate = new Date().toISOString();
  if (status === 'Approved' || status === 'Denied') pa.responseDate = new Date().toISOString();
  return savePriorAuth(pa);
}

function checkPriorAuthRequired(order) {
  if (!order || !order.type) return false;
  var rules = loadAll(KEYS.payerRules);
  if (rules.length === 0) rules = PA_RULES_DEFAULT;

  var detail = order.detail || {};
  var searchText = [
    order.type,
    detail.drug || detail.drugName || '',
    detail.panel || '',
    detail.modality || '',
    detail.studyName || '',
    detail.service || '',
  ].join(' ').toLowerCase();

  for (var i = 0; i < rules.length; i++) {
    var rule = rules[i];
    if (rule.type && rule.type !== order.type) continue;
    if (rule.matchPattern) {
      var patterns = rule.matchPattern.toLowerCase().split('|');
      for (var j = 0; j < patterns.length; j++) {
        if (searchText.indexOf(patterns[j]) !== -1) return { required: true, reason: rule.description || 'Prior authorization required' };
      }
    }
  }
  return { required: false };
}

function getPriorAuthStats() {
  var auths = getPriorAuths();
  return {
    total: auths.length,
    required: auths.filter(function(pa) { return pa.status === 'Required'; }).length,
    submitted: auths.filter(function(pa) { return pa.status === 'Submitted'; }).length,
    approved: auths.filter(function(pa) { return pa.status === 'Approved'; }).length,
    denied: auths.filter(function(pa) { return pa.status === 'Denied'; }).length,
    expired: auths.filter(function(pa) { return pa.status === 'Expired'; }).length,
  };
}

/* ============================================================
   Data Export / Import (hardening — data portability)
   ============================================================ */

/**
 * exportAllData — returns a JSON string of ALL localStorage EMR keys.
 */
function exportAllData() {
  var exported = {};
  var keyNames = Object.keys(KEYS);
  keyNames.forEach(function (k) {
    var storageKey = KEYS[k];
    var raw = _storageAdapter.getItem(storageKey);
    if (raw !== null) {
      exported[storageKey] = raw;
    }
  });
  var user = getSessionUser();
  logSystemAudit('DATA_EXPORT', user ? user.id : '', '', 'Full data export', user ? user.email : '');
  return JSON.stringify(exported, null, 2);
}

/**
 * importAllData — validates and imports data from a JSON string.
 * Returns { ok: boolean, error?: string, keysImported?: number }
 */
function importAllData(jsonString) {
  var parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    return { ok: false, error: 'Invalid JSON format.' };
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: 'Expected a JSON object with storage keys.' };
  }
  // Validate that keys are known EMR keys
  var validKeys = Object.values(KEYS);
  var keysToImport = Object.keys(parsed);
  var unknownKeys = keysToImport.filter(function (k) { return validKeys.indexOf(k) < 0; });
  if (unknownKeys.length > 0) {
    return { ok: false, error: 'Unknown keys found: ' + unknownKeys.join(', ') };
  }
  // Perform import
  var count = 0;
  keysToImport.forEach(function (k) {
    _invalidateCache(k);
    _storageAdapter.setItem(k, parsed[k]);
    count++;
  });
  var user = getSessionUser();
  logSystemAudit('DATA_IMPORT', user ? user.id : '', '', 'Imported ' + count + ' keys', user ? user.email : '');
  return { ok: true, keysImported: count };
}

/**
 * exportPatientData — exports a single patient's complete record.
 * Includes demographics, encounters, orders, notes, allergies, meds, vitals, etc.
 */
function exportPatientData(patientId) {
  var patient = getPatient(patientId);
  if (!patient) return null;
  var encounters = getEncountersByPatient(patientId);
  var encounterIds = encounters.map(function (e) { return e.id; });
  var notes = getNotes().filter(function (n) { return encounterIds.indexOf(n.encounterId) >= 0; });
  var orders = getOrdersByPatient(patientId);
  var allergies = getPatientAllergies(patientId);
  var medications = getPatientMedications(patientId);
  var diagnoses = getPatientDiagnoses(patientId);
  var socialHistory = getSocialHistory(patientId);
  var surgeries = getPatientSurgeries(patientId);
  var familyHistory = getFamilyHistory(patientId);
  var problems = getActiveProblems(patientId);
  var labResults = getLabResults(patientId);
  var immunizations = getImmunizations(patientId);
  var referrals = getReferrals(patientId);
  var screenings = getScreeningRecords(patientId);
  var documents = getDocuments(patientId);
  var vitals = [];
  encounterIds.forEach(function (eid) {
    var v = getEncounterVitals(eid);
    if (v) vitals.push(v);
  });
  var messages = getMessagesByPatient(patientId);
  var auditLog = getAuditLog(patientId);

  var exportData = {
    exportedAt: new Date().toISOString(),
    patient: patient,
    encounters: encounters,
    notes: notes,
    orders: orders,
    allergies: allergies,
    medications: medications,
    diagnoses: diagnoses,
    socialHistory: socialHistory,
    surgeries: surgeries,
    familyHistory: familyHistory,
    problems: problems,
    labResults: labResults,
    immunizations: immunizations,
    referrals: referrals,
    screenings: screenings,
    documents: documents,
    vitals: vitals,
    messages: messages,
    auditLog: auditLog,
  };

  var user = getSessionUser();
  logSystemAudit('PATIENT_DATA_EXPORT', user ? user.id : '', patientId, 'Patient data export: ' + patient.firstName + ' ' + patient.lastName, user ? user.email : '');
  return JSON.stringify(exportData, null, 2);
}

/* ============================================================
   Hospitals, Wards, Bed Assignments
   ============================================================ */
function getHospitals() { return loadAll(KEYS.hospitals); }
function getHospital(id) { return getHospitals().find(h => h.id === id) || null; }
function saveHospital(data) {
  const all = loadAll(KEYS.hospitals, true);
  const idx = all.findIndex(h => h.id === data.id);
  if (idx >= 0) { all[idx] = { ...all[idx], ...data }; }
  else { all.push({ id: generateId(), name: '', ...data }); }
  saveAll(KEYS.hospitals, all);
  return all[idx >= 0 ? idx : all.length - 1];
}

function getWards() { return loadAll(KEYS.wards); }
function getWard(id) { return getWards().find(w => w.id === id) || null; }
function getWardsByHospital(hospitalId) { return getWards().filter(w => w.hospitalId === hospitalId); }
function saveWard(data) {
  const all = loadAll(KEYS.wards, true);
  const idx = all.findIndex(w => w.id === data.id);
  if (idx >= 0) { all[idx] = { ...all[idx], ...data }; }
  else { all.push({ id: generateId(), hospitalId: '', floor: '', unit: '', name: '', beds: 0, ...data }); }
  saveAll(KEYS.wards, all);
  return all[idx >= 0 ? idx : all.length - 1];
}

function getBedAssignments() { return loadAll(KEYS.bedAssignments); }
function getBedAssignment(patientId) { return getBedAssignments().find(b => b.patientId === patientId && b.active) || null; }
function getBedAssignmentsByWard(wardId) { return getBedAssignments().filter(b => b.wardId === wardId && b.active); }
function saveBedAssignment(data) {
  const all = loadAll(KEYS.bedAssignments, true);
  const idx = all.findIndex(b => b.id === data.id);
  if (idx >= 0) { all[idx] = { ...all[idx], ...data }; }
  else { all.push({ id: generateId(), patientId: '', wardId: '', bed: '', active: true, assignedAt: new Date().toISOString(), ...data }); }
  saveAll(KEYS.bedAssignments, all);
  return all[idx >= 0 ? idx : all.length - 1];
}

/* ============================================================
   Patient Lists
   ============================================================ */
function getPatientLists() { return loadAll(KEYS.patientLists); }
function getPatientList(id) { return getPatientLists().find(l => l.id === id) || null; }
function getPatientListsByOwner(ownerId) { return getPatientLists().filter(l => l.ownerId === ownerId); }
function getSharedPatientLists() { return getPatientLists().filter(l => l.shared); }
function savePatientList(data) {
  const all = loadAll(KEYS.patientLists, true);
  const idx = all.findIndex(l => l.id === data.id);
  if (idx >= 0) { all[idx] = { ...all[idx], ...data }; }
  else { all.push({ id: generateId(), name: '', ownerId: '', patientIds: [], shared: false, createdAt: new Date().toISOString(), ...data }); }
  saveAll(KEYS.patientLists, all);
  return all[idx >= 0 ? idx : all.length - 1];
}
function deletePatientList(id) {
  softDeleteRecord(KEYS.patientLists, id);
}
function addPatientToList(listId, patientId) {
  const list = getPatientList(listId);
  if (!list) return null;
  if (!list.patientIds.includes(patientId)) {
    list.patientIds.push(patientId);
    return savePatientList(list);
  }
  return list;
}
function removePatientFromList(listId, patientId) {
  const list = getPatientList(listId);
  if (!list) return null;
  list.patientIds = list.patientIds.filter(id => id !== patientId);
  return savePatientList(list);
}

/* ============================================================
   Patient List Column/View Preferences (per provider)
   ============================================================ */
const PATIENT_COLUMNS = [
  { key: 'name',          label: 'Name',                default: true,  sortable: true  },
  { key: 'age',           label: 'Age',                 default: true,  sortable: true  },
  { key: 'sex',           label: 'Sex',                 default: true,  sortable: false },
  { key: 'dob',           label: 'DOB',                 default: true,  sortable: true  },
  { key: 'lastEncounter', label: 'Last Encounter',      default: true,  sortable: true  },
  { key: 'mrn',           label: 'MRN',                 default: true,  sortable: true  },
  { key: 'phone',         label: 'Phone',               default: false, sortable: false },
  { key: 'insurance',     label: 'Insurance',           default: false, sortable: false },
  { key: 'alerts',        label: 'Alerts',              default: true,  sortable: false },
  { key: 'codeStatus',    label: 'Code Status',         default: false, sortable: false },
  { key: 'allergies',     label: 'Allergies',           default: false, sortable: false },
  { key: 'activeMeds',    label: 'Active Meds',         default: false, sortable: true  },
  { key: 'problems',      label: 'Problems',            default: false, sortable: false },
  { key: 'provider',      label: 'Provider(s)',         default: false, sortable: true  },
  { key: 'lastVitals',    label: 'Last Vitals (BP/HR)', default: false, sortable: false },
  { key: 'pendingOrders', label: 'Pending Orders',      default: false, sortable: true  },
];

function getDefaultColumnKeys() {
  return PATIENT_COLUMNS.filter(c => c.default).map(c => c.key);
}

function getPatientListPrefs(providerId) {
  const all = loadAll(KEYS.patientListPrefs);
  const pref = all.find(p => p.providerId === providerId);
  if (pref) return pref;
  return { providerId: providerId, columns: getDefaultColumnKeys(), defaultSort: { col: 'name', dir: 'asc' }, pageSize: 25 };
}

function savePatientListPrefs(providerId, prefs) {
  const all = loadAll(KEYS.patientListPrefs, true);
  const idx = all.findIndex(p => p.providerId === providerId);
  const record = { providerId: providerId, ...prefs };
  if (idx >= 0) { all[idx] = { ...all[idx], ...record }; }
  else { all.push(record); }
  saveAll(KEYS.patientListPrefs, all);
}

/* ============================================================
   Smart / Dynamic Lists
   ============================================================ */
function getSmartLists() { return loadAll(KEYS.smartLists); }

function getSmartListsByOwner(ownerId) {
  return getSmartLists().filter(l => l.ownerId === ownerId);
}

function getSmartList(id) { return getSmartLists().find(l => l.id === id) || null; }

function saveSmartList(data) {
  const all = loadAll(KEYS.smartLists, true);
  const idx = all.findIndex(l => l.id === data.id);
  if (idx >= 0) { all[idx] = { ...all[idx], ...data }; }
  else {
    all.push({
      id: generateId(),
      name: '',
      ownerId: '',
      shared: false,
      type: 'smart',
      criteria: { provider: '', sex: '', ageMin: null, ageMax: null, insurance: '', codeStatus: '',
                  hasOverdueScreenings: false, hasUnsignedNotes: false, hasPendingOrders: false, diagnosis: '' },
      createdAt: new Date().toISOString(),
      ...data,
    });
  }
  saveAll(KEYS.smartLists, all);
  return all[idx >= 0 ? idx : all.length - 1];
}

function deleteSmartList(id) {
  softDeleteRecord(KEYS.smartLists, id);
}

function evaluateSmartList(listId) {
  const sl = getSmartList(listId);
  if (!sl) return [];
  return evaluateSmartCriteria(sl.criteria);
}

function evaluateSmartCriteria(criteria) {
  let patients = getPatients();
  if (!criteria) return patients;

  if (criteria.provider) {
    patients = patients.filter(p => (p.panelProviders || []).includes(criteria.provider));
  }
  if (criteria.sex) {
    patients = patients.filter(p => (p.sex || '').toLowerCase() === criteria.sex.toLowerCase());
  }
  if (criteria.ageMin != null && criteria.ageMin !== '') {
    patients = patients.filter(p => {
      const age = _calcPatientAge(p.dob);
      return age !== null && age >= Number(criteria.ageMin);
    });
  }
  if (criteria.ageMax != null && criteria.ageMax !== '') {
    patients = patients.filter(p => {
      const age = _calcPatientAge(p.dob);
      return age !== null && age <= Number(criteria.ageMax);
    });
  }
  if (criteria.insurance) {
    const q = criteria.insurance.toLowerCase();
    patients = patients.filter(p => (p.insurance || '').toLowerCase().includes(q));
  }
  if (criteria.codeStatus) {
    patients = patients.filter(p => (p.codeStatus || '').toLowerCase() === criteria.codeStatus.toLowerCase());
  }
  if (criteria.hasOverdueScreenings) {
    patients = patients.filter(p => typeof getOverdueScreeningsCount === 'function' && getOverdueScreeningsCount(p) > 0);
  }
  if (criteria.hasUnsignedNotes) {
    patients = patients.filter(p => typeof getUnsignedNotesCount === 'function' && getUnsignedNotesCount(p.id) > 0);
  }
  if (criteria.hasPendingOrders) {
    patients = patients.filter(p => getOrdersByPatient(p.id).filter(o => o.status === 'Pending').length > 0);
  }
  if (criteria.diagnosis) {
    const q = criteria.diagnosis.toLowerCase();
    patients = patients.filter(p => {
      const probs = typeof getActiveProblems === 'function' ? getActiveProblems(p.id) : [];
      return probs.some(pr => (pr.name || '').toLowerCase().includes(q));
    });
  }
  return patients;
}

function _calcPatientAge(dob) {
  if (!dob) return null;
  const d = new Date(dob + 'T00:00:00');
  if (isNaN(d)) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

/* ============================================================
   Handoff Notes (per patient per list)
   ============================================================ */
function getHandoffNotes(listId, patientId) {
  return loadAll(KEYS.handoffNotes)
    .filter(n => n.listId === listId && n.patientId === patientId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getHandoffNotesByList(listId) {
  return loadAll(KEYS.handoffNotes)
    .filter(n => n.listId === listId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function saveHandoffNote(data) {
  const all = loadAll(KEYS.handoffNotes, true);
  all.push({
    id: generateId(),
    listId: '',
    patientId: '',
    authorId: '',
    text: '',
    category: 'update',
    createdAt: new Date().toISOString(),
    ...data,
  });
  saveAll(KEYS.handoffNotes, all);
  return all[all.length - 1];
}

function deleteHandoffNote(id) {
  softDeleteRecord(KEYS.handoffNotes, id);
}

/* ============================================================
   List Subscriptions (live references to shared lists)
   ============================================================ */
function getListSubscriptions(providerId) {
  return loadAll(KEYS.listSubscriptions).filter(s => s.subscriberId === providerId);
}

function subscribeToList(listId, subscriberId) {
  const all = loadAll(KEYS.listSubscriptions, true);
  if (all.some(s => !s._deleted && s.listId === listId && s.subscriberId === subscriberId)) return null;
  const sub = { id: generateId(), listId: listId, subscriberId: subscriberId, createdAt: new Date().toISOString() };
  all.push(sub);
  saveAll(KEYS.listSubscriptions, all);
  return sub;
}

function unsubscribeFromList(listId, subscriberId) {
  var all = loadAll(KEYS.listSubscriptions, true);
  var idx = all.findIndex(function(s) { return !s._deleted && s.listId === listId && s.subscriberId === subscriberId; });
  if (idx >= 0) {
    all[idx]._deleted = true;
    all[idx]._deletedAt = new Date().toISOString();
    saveAll(KEYS.listSubscriptions, all);
  }
}

/* ============================================================
   Enhanced Patient List Meta (priority, notes per patient per list)
   ============================================================ */
function getPatientListMeta(listId) {
  const list = getPatientList(listId);
  return (list && list.patientMeta) ? list.patientMeta : {};
}

function setPatientListMeta(listId, patientId, meta) {
  const list = getPatientList(listId);
  if (!list) return null;
  if (!list.patientMeta) list.patientMeta = {};
  list.patientMeta[patientId] = { ...(list.patientMeta[patientId] || {}), ...meta };
  return savePatientList(list);
}

/* ============================================================
   Seed data — populates on first load
   ============================================================ */
async function seedAdminIfNeeded() {
  runMigrations();
  const existing = getUserByEmail('admin@clinic.com');
  if (existing) return;
  const passwordHash = await hashPassword('Admin123');
  const adminId = generateId();
  const adminUser = saveUser({
    id: adminId,
    firstName: 'System',
    lastName: 'Admin',
    dob: '',
    npiNumber: '',
    email: 'admin@clinic.com',
    phone: '',
    degree: 'MD',
    passwordHash,
    role: 'admin',
    status: 'active',
    mustChangePassword: true,
  });
  saveProvider({
    id: adminUser.id,
    firstName: 'System',
    lastName: 'Admin',
    degree: 'MD',
    role: 'Admin',
    npiNumber: '',
    email: 'admin@clinic.com',
    phone: '',
  });
}

async function seedIfEmpty() {
  await seedAdminIfNeeded();
  if (getPatients().length > 0) return; // already seeded

  // Providers
  const prov1 = saveProvider({
    id: generateId(), firstName: 'Sarah', lastName: 'Chen',
    degree: 'MD', role: 'Attending',
  });
  const prov2 = saveProvider({
    id: generateId(), firstName: 'Marcus', lastName: 'Webb',
    degree: 'NP', role: 'Nurse',
  });

  // Patients
  const pat1 = savePatient({
    id: generateId(), mrn: 'MRN001001',
    firstName: 'Alice', lastName: 'Johnson',
    dob: '1968-04-15', sex: 'Female',
    phone: '(555) 210-1001', insurance: 'Blue Cross PPO',
    email: 'alice.johnson@email.com',
    addressStreet: '742 Maple Avenue', addressCity: 'Springfield', addressState: 'IL', addressZip: '62704',
    emergencyContactName: 'Tom Johnson', emergencyContactPhone: '(555) 210-2001', emergencyContactRelationship: 'Spouse',
    pharmacyName: 'CVS Pharmacy #4521', pharmacyPhone: '(555) 300-1001', pharmacyFax: '(555) 300-1002',
    panelProviders: [],
    createdAt: new Date('2024-01-10').toISOString(),
  });
  const pat2 = savePatient({
    id: generateId(), mrn: 'MRN001002',
    firstName: 'Robert', lastName: 'Kim',
    dob: '1955-11-30', sex: 'Male',
    phone: '(555) 210-1002', insurance: 'Medicare',
    email: 'robert.kim@email.com',
    addressStreet: '1895 Oak Drive', addressCity: 'Springfield', addressState: 'IL', addressZip: '62701',
    emergencyContactName: 'Lisa Kim', emergencyContactPhone: '(555) 210-2002', emergencyContactRelationship: 'Daughter',
    pharmacyName: 'Walgreens #7830', pharmacyPhone: '(555) 300-2001', pharmacyFax: '(555) 300-2002',
    panelProviders: [],
    createdAt: new Date('2024-02-05').toISOString(),
  });
  const pat3 = savePatient({
    id: generateId(), mrn: 'MRN001003',
    firstName: 'Maria', lastName: 'Garcia',
    dob: '1982-07-22', sex: 'Female',
    phone: '(555) 210-1003', insurance: 'Aetna HMO',
    createdAt: new Date('2024-03-12').toISOString(),
  });

  // Set MRN counter past seeds
  _storageAdapter.setItem(KEYS.mrnCounter, '1004');

  // Encounter 1 — pat1 — signed note + all 4 order types
  const enc1 = saveEncounter({
    id: generateId(),
    patientId:   pat1.id,
    providerId:  prov1.id,
    visitType:   'Outpatient',
    visitSubtype:'Primary Care',
    dateTime:    new Date('2025-11-18T09:30:00').toISOString(),
    status:      'Signed',
  });

  saveNote({
    id: generateId(),
    encounterId:    enc1.id,
    chiefComplaint: 'Patient presents with persistent headache x 3 days.',
    hpi:            'Alice is a 57-year-old female with a history of migraines who presents with a throbbing bifrontal headache rated 7/10. Onset was gradual, worsening with light and movement. No fever, neck stiffness, or visual changes. Has tried OTC ibuprofen with partial relief.',
    ros:            'Constitutional: No fever, chills, or weight loss. Neurologic: Headache as described, photophobia and phonophobia present, no focal deficits, no syncope. CV: No chest pain or palpitations. Pulmonary: No dyspnea or cough. GI: Mild nausea with headache, no vomiting. All other systems reviewed and negative.',
    physicalExam:   'General: Alert, oriented ×3, in mild distress from headache. Vitals: See above. HEENT: Normocephalic, atraumatic. PERRL, EOMs intact. No papilledema on funduscopic exam. No sinus tenderness. Neck: Supple, full ROM, negative Kernig\'s and Brudzinski\'s signs, no meningismus. Neuro: CN II–XII intact. Gait normal. No focal deficits. Funduscopic: No papilledema. CV/Pulm: Regular rate and rhythm; lungs clear to auscultation bilaterally.',
    assessment:     '1. Migraine without aura (G43.009) — consistent with prior episodes.\n2. HTN, well-controlled on current regimen.',
    plan:           '1. Sumatriptan 50 mg PO PRN for acute migraine attacks.\n2. Continue lisinopril 10 mg daily.\n3. Encourage hydration and sleep hygiene.\n4. Return precautions reviewed. Follow-up in 4 weeks or sooner if symptoms worsen.',
    signed:         true,
    signedBy:       prov1.id,
    signedAt:       new Date('2025-11-18T10:15:00').toISOString(),
    lastModified:   new Date('2025-11-18T10:15:00').toISOString(),
    addenda:        [],
  });

  // Vitals for enc1
  saveEncounterVitals({
    encounterId: enc1.id, patientId: pat1.id,
    bpSystolic: '128', bpDiastolic: '78', heartRate: '72', respiratoryRate: '14',
    tempF: '98.4', spo2: '98', weightLbs: '152', heightIn: '64',
    recordedAt: new Date('2025-11-18T09:32:00').toISOString(), recordedBy: prov1.id,
  });

  saveOrder({
    encounterId: enc1.id, patientId: pat1.id,
    orderedBy: prov1.id, type: 'Medication',
    priority: 'Routine', status: 'Active',
    detail: { drug: 'Sumatriptan', dose: '50', unit: 'mg', route: 'PO', frequency: 'PRN', prn: true, indication: 'Migraine' },
    dateTime: new Date('2025-11-18T09:45:00').toISOString(),
  });

  saveOrder({
    encounterId: enc1.id, patientId: pat1.id,
    orderedBy: prov1.id, type: 'Lab',
    priority: 'Routine', status: 'Completed',
    detail: { panel: 'Basic Metabolic Panel', tests: ['Na', 'K', 'Cl', 'CO2', 'BUN', 'Cr', 'Glucose'], specimen: 'Blood' },
    dateTime: new Date('2025-11-18T09:50:00').toISOString(),
    completedAt: new Date('2025-11-18T11:00:00').toISOString(),
  });

  saveOrder({
    encounterId: enc1.id, patientId: pat1.id,
    orderedBy: prov1.id, type: 'Imaging',
    priority: 'Routine', status: 'Completed',
    detail: { modality: 'MRI', bodyPart: 'Brain', indication: 'Recurrent headache, r/o structural lesion' },
    dateTime: new Date('2025-11-18T09:55:00').toISOString(),
    completedAt: new Date('2025-11-18T14:00:00').toISOString(),
  });

  saveOrder({
    encounterId: enc1.id, patientId: pat1.id,
    orderedBy: prov1.id, type: 'Consult',
    priority: 'Routine', status: 'Pending',
    detail: { service: 'Neurology', reason: 'Evaluation of recurrent migraines unresponsive to standard therapy', urgency: 'Routine' },
    dateTime: new Date('2025-11-18T10:00:00').toISOString(),
  });

  // Encounter 2 — pat2 — open
  const enc2 = saveEncounter({
    id: generateId(),
    patientId:   pat2.id,
    providerId:  prov1.id,
    visitType:   'Outpatient',
    visitSubtype:'Primary Care',
    dateTime:    new Date('2025-12-02T14:00:00').toISOString(),
    status:      'Open',
  });

  saveNote({
    id: generateId(),
    encounterId:    enc2.id,
    chiefComplaint: 'Annual wellness exam.',
    hpi:            '',
    assessment:     '',
    plan:           '',
    signed:         false,
    lastModified:   new Date('2025-12-02T14:00:00').toISOString(),
  });

  // Encounter 3 — pat3 — open
  const enc3 = saveEncounter({
    id: generateId(),
    patientId:   pat3.id,
    providerId:  prov2.id,
    visitType:   'Urgent Care',
    visitSubtype:'',
    dateTime:    new Date('2025-12-10T10:15:00').toISOString(),
    status:      'Open',
  });

  saveNote({
    id: generateId(),
    encounterId:    enc3.id,
    chiefComplaint: 'Sore throat and fever x 2 days.',
    hpi:            '',
    assessment:     '',
    plan:           '',
    signed:         false,
    lastModified:   new Date('2025-12-10T10:15:00').toISOString(),
  });

  // Encounter 4 — pat2 — inpatient admission (open)
  const enc4 = saveEncounter({
    id: generateId(),
    patientId:   pat2.id,
    providerId:  prov1.id,
    visitType:   'Inpatient',
    visitSubtype:'General Ward',
    dateTime:    new Date('2025-12-08T07:00:00').toISOString(),
    status:      'Open',
  });

  saveNote({
    id: generateId(),
    encounterId:    enc4.id,
    chiefComplaint: 'Acute CHF exacerbation — increasing dyspnea and lower extremity edema.',
    hpi:            'Robert Kim is a 70-year-old male with known CHF (EF 42%) presenting with worsening dyspnea on exertion and bilateral LE edema over the past 3 days. Weight up 6 lbs from baseline. Reports 3-pillow orthopnea and PND. Dietary indiscretion (high-sodium meals) identified.',
    assessment:     '1. Acute on chronic systolic heart failure exacerbation (I50.23).\n2. Volume overload — likely dietary non-compliance.',
    plan:           '1. IV Furosemide 40 mg BID, strict I&Os, daily weights.\n2. Sodium restriction 2g.\n3. Repeat BMP and BNP in AM.\n4. Cardiology consult for optimization.\n5. Telemetry monitoring.',
    signed:         false,
    lastModified:   new Date('2025-12-08T08:30:00').toISOString(),
  });

  /* ---- Patient-level clinical records ---- */

  // Alice Johnson (pat1) — Allergies
  savePatientAllergy({ patientId: pat1.id, allergen: 'Penicillin', reaction: 'Anaphylaxis', severity: 'Life-threatening', type: 'Drug' });
  savePatientAllergy({ patientId: pat1.id, allergen: 'Sulfonamides', reaction: 'Maculopapular rash, pruritus', severity: 'Mild', type: 'Drug' });
  savePatientAllergy({ patientId: pat1.id, allergen: 'Latex', reaction: 'Contact dermatitis, urticaria', severity: 'Moderate', type: 'Environmental' });

  // Alice Johnson — PMH
  savePatientDiagnosis({ patientId: pat1.id, name: 'Migraine without aura', icd10: 'G43.009', onsetDate: '2015-01-01',
    evidenceNotes: 'MRI brain (Nov 2025): no structural lesion identified. Typical bifrontal throbbing headache with photophobia and nausea. IHS diagnostic criteria met. Prior workup included CBC, BMP — unremarkable.' });
  savePatientDiagnosis({ patientId: pat1.id, name: 'Essential Hypertension', icd10: 'I10', onsetDate: '2018-03-15',
    evidenceNotes: 'BP >140/90 on three separate clinic readings (Mar 2018). Currently well-controlled on Lisinopril 10 mg daily. Most recent reading: 128/78 (Nov 2025). BMP: Cr 0.9, K 4.1 — stable renal function.' });
  savePatientDiagnosis({ patientId: pat1.id, name: 'Type 2 Diabetes Mellitus', icd10: 'E11.9', onsetDate: '2020-06-10',
    evidenceNotes: 'HbA1c 7.2% (Jun 2025). Fasting glucose 138 mg/dL at diagnosis. On Metformin 500 mg BID with good tolerance. Annual ophthalmology and podiatry follow-up in place. No evidence of nephropathy or neuropathy.' });

  // Alice Johnson — Medications
  savePatientMedication({ patientId: pat1.id, name: 'Lisinopril', dose: '10', unit: 'mg', route: 'PO', frequency: 'QDay', status: 'Current', startDate: '2018-04-01', indication: 'Essential Hypertension', prescribedBy: 'Dr. Chen' });
  savePatientMedication({ patientId: pat1.id, name: 'Metformin', dose: '500', unit: 'mg', route: 'PO', frequency: 'BID', status: 'Current', startDate: '2020-06-15', indication: 'Type 2 Diabetes Mellitus', prescribedBy: 'Dr. Chen' });
  savePatientMedication({ patientId: pat1.id, name: 'Sumatriptan', dose: '50', unit: 'mg', route: 'PO', frequency: 'PRN', status: 'Current', startDate: '2025-11-18', indication: 'Migraine — acute attack', prescribedBy: 'Dr. Chen' });
  savePatientMedication({ patientId: pat1.id, name: 'Ibuprofen', dose: '400', unit: 'mg', route: 'PO', frequency: 'PRN', status: 'Past', startDate: '2019-01-01', endDate: '2025-11-18', indication: 'Migraine (partial relief — discontinued)', prescribedBy: 'Self' });

  // Alice Johnson — Social History
  saveSocialHistory({ patientId: pat1.id, smokingStatus: 'Never smoker', tobaccoUse: 'None', alcoholUse: 'Occasional — 1–2 drinks/week', substanceUse: 'None', occupation: 'High school English teacher', maritalStatus: 'Married', livingSituation: 'Lives with spouse and one adult child (suburban)', exercise: 'Moderate — 30-min walks 3×/week', diet: 'Mediterranean diet, low sodium', notes: '' });

  // Alice Johnson — Past Surgeries
  savePatientSurgery({ patientId: pat1.id, procedure: 'Laparoscopic Appendectomy', date: '2001-07-15', hospital: 'General Hospital', surgeon: 'Dr. Williams', notes: 'Uncomplicated. Full recovery. No postoperative complications.' });
  savePatientSurgery({ patientId: pat1.id, procedure: 'Primary Cesarean Section', date: '2005-03-22', hospital: "St. Mary's Medical Center", surgeon: 'Dr. Patel', notes: 'Elective at 39 weeks gestation. Healthy delivery, uneventful recovery.' });

  // Family history — Alice Johnson
  saveFamilyHistory({ patientId: pat1.id,
    mother:               'HTN, Type 2 DM — deceased age 74 (ischemic stroke)',
    father:               'HTN, prostate cancer — deceased age 68',
    siblings:             '1 sister — migraine (since age 30), hypothyroidism',
    maternalGrandparents: 'Maternal grandmother: T2DM, CAD (MI age 72)',
    paternalGrandparents: 'Paternal grandfather: COPD (heavy smoker), deceased age 70',
    other:                '',
    notes:                'Strong familial clustering of HTN and DM on both sides. Patient counseled on hereditary risk.',
  });

  // Robert Kim (pat2) — Allergies
  savePatientAllergy({ patientId: pat2.id, allergen: 'Aspirin', reaction: 'Gastrointestinal bleeding (upper GI)', severity: 'Severe', type: 'Drug' });
  savePatientAllergy({ patientId: pat2.id, allergen: 'Codeine', reaction: 'Severe nausea, vomiting, respiratory depression', severity: 'Severe', type: 'Drug' });

  // Robert Kim — PMH
  savePatientDiagnosis({ patientId: pat2.id, name: 'Congestive Heart Failure', icd10: 'I50.9', onsetDate: '2019-08-01',
    evidenceNotes: 'Echo (Aug 2019): EF 35%, dilated LV, trace MR. On Furosemide + Carvedilol. Repeat echo (Oct 2024): EF improved to 42%. BNP trending down — currently 420 pg/mL.' });
  savePatientDiagnosis({ patientId: pat2.id, name: 'Chronic Obstructive Pulmonary Disease', icd10: 'J44.1', onsetDate: '2017-05-01',
    evidenceNotes: 'PFTs (2017): FEV1/FVC 0.62, FEV1 58% predicted. GOLD Stage 2 (Moderate). 30 pack-year smoking history, quit 2015. On Tiotropium 18 mcg inhaled QDay.' });
  savePatientDiagnosis({ patientId: pat2.id, name: 'Chronic Kidney Disease, Stage 3a', icd10: 'N18.3', onsetDate: '2021-02-01',
    evidenceNotes: 'eGFR 42 mL/min/1.73m² (baseline, stable). Spot urine ACR 45 mg/g (microalbuminuria). Nephrology follows annually. Renally dose-adjust medications as needed.' });

  // Robert Kim — Medications
  savePatientMedication({ patientId: pat2.id, name: 'Furosemide', dose: '40', unit: 'mg', route: 'PO', frequency: 'QDay', status: 'Current', startDate: '2019-08-15', indication: 'CHF / volume overload', prescribedBy: 'Dr. Chen' });
  savePatientMedication({ patientId: pat2.id, name: 'Carvedilol', dose: '12.5', unit: 'mg', route: 'PO', frequency: 'BID', status: 'Current', startDate: '2019-08-15', indication: 'CHF — beta blockade', prescribedBy: 'Dr. Chen' });
  savePatientMedication({ patientId: pat2.id, name: 'Tiotropium', dose: '18', unit: 'mcg', route: 'Inhaled', frequency: 'QDay', status: 'Current', startDate: '2017-06-01', indication: 'COPD maintenance', prescribedBy: 'Dr. Chen' });

  // Robert Kim — Social History
  saveSocialHistory({ patientId: pat2.id, smokingStatus: 'Former smoker (quit 2015)', tobaccoUse: '30 pack-years', alcoholUse: 'None (quit 2019, per cardiologist recommendation)', substanceUse: 'None', occupation: 'Retired civil engineer', maritalStatus: 'Widowed (2022)', livingSituation: 'Lives alone; daughter lives 10 min away', exercise: 'Light — short walks as cardiac status permits', diet: 'Low sodium / cardiac diet, 2g Na restriction', notes: 'DNR/DNI discussed at last visit — patient deferred decision.' });

  // Family history — Robert Kim
  saveFamilyHistory({ patientId: pat2.id,
    mother:               'CHF, HTN — deceased age 80',
    father:               'MI age 62, T2DM — deceased age 71',
    siblings:             '2 brothers — older brother: CAD (stent age 58); younger brother: healthy',
    maternalGrandparents: 'Maternal grandfather: MI age 60; grandmother: HTN',
    paternalGrandparents: 'Paternal grandfather: MI age 55 (fatal); grandmother: unknown',
    other:                '',
    notes:                'Significant family history of premature CAD and cardiometabolic disease on both sides. High risk.',
  });

  // Robert Kim — Past Surgeries
  savePatientSurgery({ patientId: pat2.id, procedure: 'Coronary Angiography', date: '2019-08-05', hospital: 'University Medical Center', surgeon: 'Dr. Rodriguez', notes: 'Three-vessel disease identified. Patient and family elected medical management over revascularization after informed discussion.' });
  savePatientSurgery({ patientId: pat2.id, procedure: 'Pacemaker Implantation (dual-chamber)', date: '2022-11-14', hospital: 'University Medical Center', surgeon: 'Dr. Okafor', notes: 'Indicated for complete heart block. Uneventful procedure. Device checks Q6mo.' });

  /* ---- Active Problem Lists ---- */
  saveActiveProblem({ patientId: pat1.id, name: 'Migraine without aura', icd10: 'G43.009', onset: '2015-01-01', status: 'Active', priority: 'High', lastReviewDate: '2025-11-18', notes: 'Recurrent bifrontal throbbing, photophobia. On sumatriptan PRN.' });
  saveActiveProblem({ patientId: pat1.id, name: 'Essential Hypertension', icd10: 'I10', onset: '2018-03-15', status: 'Chronic', priority: 'Medium', lastReviewDate: '2025-11-18', notes: 'Well-controlled on lisinopril 10mg. Last BP 128/78.' });
  saveActiveProblem({ patientId: pat2.id, name: 'Congestive Heart Failure', icd10: 'I50.9', onset: '2019-08-01', status: 'Chronic', priority: 'High', lastReviewDate: '2025-12-02', notes: 'EF improved to 42% on repeat echo. On furosemide + carvedilol.' });
  saveActiveProblem({ patientId: pat2.id, name: 'COPD', icd10: 'J44.1', onset: '2017-05-01', status: 'Chronic', priority: 'High', lastReviewDate: '2025-12-02', notes: 'GOLD Stage 2. 30 pack-year history, quit 2015. On tiotropium.' });

  /* ---- Lab Results ---- */
  saveLabResult({
    patientId: pat1.id, encounterId: enc1.id, panel: 'Basic Metabolic Panel',
    resultDate: new Date('2025-11-18T11:00:00').toISOString(), resultedBy: 'Lab — General Hospital',
    tests: [
      { name: 'Sodium',     value: '139', unit: 'mEq/L', referenceRange: '136–145', flag: 'Normal' },
      { name: 'Potassium',  value: '4.1', unit: 'mEq/L', referenceRange: '3.5–5.1', flag: 'Normal' },
      { name: 'Chloride',   value: '102', unit: 'mEq/L', referenceRange: '98–107',  flag: 'Normal' },
      { name: 'CO2',        value: '24',  unit: 'mEq/L', referenceRange: '22–29',   flag: 'Normal' },
      { name: 'BUN',        value: '14',  unit: 'mg/dL', referenceRange: '7–20',    flag: 'Normal' },
      { name: 'Creatinine', value: '0.9', unit: 'mg/dL', referenceRange: '0.6–1.2', flag: 'Normal' },
      { name: 'Glucose',    value: '138', unit: 'mg/dL', referenceRange: '70–99',   flag: 'High'   },
      { name: 'eGFR',       value: '>60', unit: 'mL/min/1.73m²', referenceRange: '>60', flag: 'Normal' },
    ],
    notes: 'Elevated glucose consistent with known T2DM.',
  });
  saveLabResult({
    patientId: pat2.id, encounterId: enc2.id, panel: 'CBC',
    resultDate: new Date('2025-12-02T15:00:00').toISOString(), resultedBy: 'Lab — General Hospital',
    tests: [
      { name: 'WBC',        value: '7.2',  unit: 'K/uL',  referenceRange: '4.5–11.0', flag: 'Normal' },
      { name: 'Hemoglobin', value: '11.8', unit: 'g/dL',  referenceRange: '13.5–17.5', flag: 'Low'   },
      { name: 'Hematocrit', value: '36.2', unit: '%',     referenceRange: '41–53',    flag: 'Low'   },
      { name: 'Platelets',  value: '210',  unit: 'K/uL',  referenceRange: '150–400',  flag: 'Normal' },
      { name: 'MCV',        value: '88',   unit: 'fL',    referenceRange: '80–100',   flag: 'Normal' },
    ],
    notes: 'Mild anemia — monitor, consider iron studies.',
  });
  saveLabResult({
    patientId: pat2.id, encounterId: enc2.id, panel: 'BNP',
    resultDate: new Date('2025-12-02T15:00:00').toISOString(), resultedBy: 'Lab — General Hospital',
    tests: [
      { name: 'BNP', value: '420', unit: 'pg/mL', referenceRange: '<100', flag: 'High' },
    ],
    notes: 'Elevated but trending down from prior value of 680 pg/mL.',
  });

  /* ---- Immunizations ---- */
  saveImmunization({ patientId: pat1.id, vaccine: 'Influenza (IIV4)', date: '2024-10-05', lot: 'FL2024-A', manufacturer: 'Sanofi', site: 'L deltoid', givenBy: 'Dr. Chen', nextDue: '2025-10-01', notes: '' });
  saveImmunization({ patientId: pat1.id, vaccine: 'Tdap', date: '2021-03-12', lot: 'TD21-B', manufacturer: 'GlaxoSmithKline', site: 'R deltoid', givenBy: 'Dr. Chen', nextDue: '2031-03-12', notes: '' });
  saveImmunization({ patientId: pat1.id, vaccine: 'COVID-19 (mRNA bivalent)', date: '2023-09-20', lot: 'CV23-X', manufacturer: 'Moderna', site: 'L deltoid', givenBy: 'Pharmacy', nextDue: '', notes: 'Annual boosters per CDC guidance.' });
  saveImmunization({ patientId: pat2.id, vaccine: 'Influenza (IIV4)', date: '2024-10-08', lot: 'FL2024-B', manufacturer: 'Sanofi', site: 'L deltoid', givenBy: 'Dr. Chen', nextDue: '2025-10-01', notes: '' });
  saveImmunization({ patientId: pat2.id, vaccine: 'Pneumococcal (PCV20)', date: '2022-06-01', lot: 'PN22-A', manufacturer: 'Pfizer', site: 'R deltoid', givenBy: 'Dr. Chen', nextDue: '', notes: 'One-time per ACIP guidelines for age 65+.' });
  saveImmunization({ patientId: pat2.id, vaccine: 'Shingrix (RZV) — Dose 2', date: '2023-04-15', lot: 'SH23-D2', manufacturer: 'GlaxoSmithKline', site: 'L deltoid', givenBy: 'Dr. Chen', nextDue: '', notes: 'Series complete.' });

  /* ---- Referrals ---- */
  saveReferral({ patientId: pat1.id, encounterId: enc1.id, specialty: 'Neurology', providerName: 'Dr. James Park', reason: 'Evaluation of recurrent migraines unresponsive to standard therapy. Consideration of preventive agents.', urgency: 'Routine', status: 'Sent', referralDate: new Date('2025-11-18').toISOString(), appointmentDate: '', responseNotes: '' });
  saveReferral({ patientId: pat2.id, encounterId: enc2.id, specialty: 'Cardiology', providerName: 'Dr. Elena Rodriguez', reason: 'CHF follow-up, EF re-evaluation, optimization of heart failure regimen.', urgency: 'Routine', status: 'Accepted', referralDate: new Date('2025-12-02').toISOString(), appointmentDate: '2026-01-15', responseNotes: 'Appointment confirmed. Patient to bring all cardiac records.' });

  /* ---- Built-in Note Templates ---- */
  _seedBuiltInTemplates();
}

function _seedBuiltInTemplates() {
  function _tmpl(tmpl) {
    // Only insert if a template with this name doesn't already exist
    var existing = getNoteTemplates().find(function(t) { return t.name === tmpl.name; });
    if (!existing) saveNoteTemplate(tmpl);
  }
  _tmpl({ name: 'Annual Physical', visitType: 'Outpatient', isBuiltIn: true,
    chiefComplaint: 'Annual wellness exam.',
    hpi: 'Patient presents for routine annual physical examination. No acute concerns. Review of interval health changes since last visit.',
    ros: 'Constitutional: No fever, chills, or unintentional weight changes.\nCardiovascular: No chest pain, palpitations, or edema.\nPulmonary: No dyspnea, cough, or wheezing.\nGI: No abdominal pain, nausea, or bowel habit changes.\nGU: No dysuria or hematuria.\nMusculoskeletal: No joint pain or swelling.\nNeuro: No headaches, dizziness, or focal deficits.\nSkin: No new rashes or lesions.\nAll other systems reviewed and negative.',
    physicalExam: 'General: Well-appearing, no acute distress.\nVitals: See above.\nHEENT: Normocephalic, PERRL, TMs clear, pharynx benign.\nNeck: Supple, no LAD or thyromegaly.\nCV: RRR, no murmurs/rubs/gallops.\nLungs: CTA bilaterally, no wheeze or rhonchi.\nAbdomen: Soft, NT/ND, normoactive bowel sounds.\nExtremities: No edema, pulses 2+ and symmetric.\nNeuro: CN II–XII grossly intact, normal gait.',
    assessment: '1. Health maintenance — up to date.\n2. [List chronic conditions].',
    plan: '1. Update immunizations per schedule.\n2. Order age-appropriate screening labs.\n3. Provide preventive counseling (diet, exercise, smoking).\n4. Follow-up in 12 months or as needed.',
  });
  _tmpl({ name: 'Diabetic Follow-up', visitType: 'Outpatient', isBuiltIn: true,
    chiefComplaint: 'Diabetes follow-up.',
    hpi: 'Patient presents for diabetes management follow-up. Review of blood glucose logs, symptoms of hypo/hyperglycemia, and medication adherence.',
    ros: 'Constitutional: No fever or weight change.\nCardiovascular: No chest pain or edema.\nNeuro: No numbness, tingling, or vision changes.\nGU: No polyuria, polydipsia, or dysuria.\nSkin: No non-healing wounds or foot ulcers.',
    physicalExam: 'General: Alert and oriented, no acute distress.\nVitals: See above.\nFeet: No open wounds, sensation intact to monofilament bilaterally, DP/PT pulses 2+.\nEyes: Deferred — ophthalmology follow-up documented.',
    assessment: '1. Type 2 Diabetes Mellitus (E11.9) — [controlled/uncontrolled].\n2. Most recent HbA1c: [value] ([date]).',
    plan: '1. Continue/adjust [medication].\n2. Repeat HbA1c in 3 months.\n3. Order microalbumin/creatinine ratio.\n4. Annual foot exam and ophthalmology referral.\n5. Diet and exercise counseling reinforced.',
  });
  _tmpl({ name: 'Post-Op Check', visitType: 'Outpatient', isBuiltIn: true,
    chiefComplaint: 'Post-operative follow-up.',
    hpi: 'Patient returns for post-operative follow-up after [procedure] performed on [date]. Reports [pain level]/10 pain, wound healing [per description]. No fever, increased drainage, or concerning symptoms.',
    ros: 'Pain: [Location, severity, character].\nWound: No purulent drainage, dehiscence, or erythema.\nFever/Chills: None.\nActivity: Tolerating [diet/activity level].',
    physicalExam: 'General: Alert, in [mild/no] distress.\nWound: [Clean/dry/intact]. No erythema, purulence, or dehiscence. Sutures/staples [intact/removed].\nAbdomen/Extremity (as applicable): [findings].',
    assessment: '1. Post-operative status following [procedure] — healing [as expected/complications noted].',
    plan: '1. Wound care instructions reviewed.\n2. Activity restrictions: [per protocol].\n3. Follow-up in [X] weeks.\n4. Return precautions reviewed. Call/return for fever >101.5°F, increased pain, purulence.',
  });
  _tmpl({ name: 'Urgent Care Visit', visitType: 'Urgent Care', isBuiltIn: true,
    chiefComplaint: 'Urgent care visit.',
    hpi: 'Patient presents to urgent care with [chief complaint] for [duration]. Onset was [gradual/sudden]. [Additional history including associated symptoms, aggravating/relieving factors, prior episodes, and relevant past medical history].',
    ros: 'Constitutional: [Fever, chills, fatigue — as applicable].\n[System-specific review based on chief complaint].\nAll other reviewed systems negative.',
    physicalExam: 'General: [Appearance].\nVitals: See above.\n[Targeted physical exam based on chief complaint].',
    assessment: '1. [Primary diagnosis].',
    plan: '1. [Diagnostic studies ordered, if applicable].\n2. [Treatment — medications, procedures].\n3. Return precautions reviewed.\n4. Follow-up with PCP in [X] days or sooner if symptoms worsen.',
  });
  _tmpl({ name: 'Cardiology Follow-up', visitType: 'Outpatient', isBuiltIn: true,
    chiefComplaint: 'Cardiology follow-up.',
    hpi: 'Patient presents for cardiology follow-up for [condition]. Reviews functional status (NYHA Class [I–IV]), symptoms of chest pain, dyspnea, palpitations, syncope, and lower extremity edema.',
    ros: 'CV: [Chest pain, dyspnea, palpitations, edema — as applicable].\nPulmonary: Dyspnea on exertion at [X] flights/blocks. Orthopnea: [Y] pillows. PND: [present/absent].\nNeuro: No syncope or pre-syncope.',
    physicalExam: 'General: [Appearance], no acute distress.\nVitals: See above.\nCV: RRR, [murmur description if present], JVP [elevated/normal].\nLungs: [CTA/bibasilar crackles].\nExtremities: [No edema/pitting edema X+] bilateral LE.',
    assessment: '1. [Cardiac condition] — [stable/improved/worsening].\n2. Last echo: EF [X]% on [date].',
    plan: '1. Continue/adjust [medications].\n2. Repeat labs: BMP, BNP.\n3. Follow-up echo in [X] months.\n4. Restrict sodium <2g/day, daily weights.\n5. Return for weight gain >3 lbs in 1 day or >5 lbs in 1 week.',
  });

  _tmpl({ name: 'Hypertension Follow-up', visitType: 'Outpatient', isBuiltIn: true,
    chiefComplaint: 'Hypertension follow-up.',
    hpi: 'Patient presents for hypertension management follow-up. Home BP readings averaging [X/Y mmHg]. Reports [good/poor] medication adherence. [No/reports] headaches, visual changes, chest pain, or palpitations.',
    ros: 'Constitutional: No fatigue or weight change.\nCV: No chest pain, palpitations, or palpitations.\nNeuro: No headache, visual changes, or focal deficits.\nRenal: No hematuria, foamy urine, or edema.\nEndocrine: No polyuria or polydipsia.',
    physicalExam: 'General: Well-appearing, no acute distress.\nVitals: See above. Bilateral arm pressures: R [X/Y], L [X/Y].\nFunduscopic: [AV nicking/papilledema/normal].\nNeck: No carotid bruits, JVP normal.\nCV: RRR, no murmurs. PMI non-displaced.\nLungs: CTA bilaterally.\nAbdomen: No renal bruits. No pulsatile mass.\nExtremities: No edema. Pulses 2+ and symmetric.',
    assessment: '1. Essential hypertension (I10) — [controlled/uncontrolled].\n2. Current regimen: [medications].',
    plan: '1. [Continue/adjust] antihypertensive regimen.\n2. BP goal <130/80 mmHg.\n3. Lifestyle counseling: low-sodium diet (<2.3g/day), DASH diet, aerobic exercise 150 min/week, limit alcohol, smoking cessation.\n4. Labs: BMP, lipids, UA.\n5. Return in [4–12] weeks to reassess BP control.',
  });

  _tmpl({ name: 'New Patient Intake', visitType: 'Outpatient', isBuiltIn: true,
    chiefComplaint: 'New patient — comprehensive intake evaluation.',
    hpi: 'New patient presents for comprehensive initial evaluation. Patient is a [age]-year-old [sex] with past medical history significant for [PMH]. Transferred care from [prior provider/location]. Primary concerns today: [list concerns].',
    ros: 'Constitutional: No fever, chills, or significant unintentional weight changes.\nHEENT: No vision or hearing changes, no headache.\nCV: No chest pain, palpitations, or lower extremity edema.\nPulmonary: No dyspnea, cough, or wheezing.\nGI: No abdominal pain, nausea, vomiting, or bowel habit changes.\nGU: No dysuria, frequency, or hematuria.\nMusculoskeletal: No joint pain or muscle weakness.\nNeuro: No dizziness, syncope, numbness, or tingling.\nPsychiatric: No depression, anxiety, or sleep disturbance.\nSkin: No rashes or lesions.\nEndocrine: No polyuria, polydipsia, or heat/cold intolerance.',
    physicalExam: 'General: Well-appearing, no acute distress.\nVitals: See above.\nHEENT: Normocephalic, PERRL, EOM intact, TMs clear, pharynx benign.\nNeck: Supple, no LAD, no thyromegaly, no bruits.\nCV: RRR, no murmurs/rubs/gallops. No JVD.\nLungs: CTA bilaterally, no wheezes, rales, or rhonchi.\nAbdomen: Soft, NT/ND, normoactive bowel sounds, no organomegaly.\nExtremities: No clubbing, cyanosis, or edema. Pulses 2+.\nSkin: No significant rashes or lesions.\nNeuro: Alert and oriented x3. CN II–XII intact. Strength 5/5. Reflexes 2+ and symmetric.',
    assessment: '1. New patient evaluation — history reviewed and documented.\n2. [List active diagnoses].',
    plan: '1. Establish care — records requested from prior provider.\n2. Order baseline labs: CBC, CMP, fasting lipids, HbA1c, TSH, UA.\n3. Age-appropriate cancer screenings reviewed and ordered as indicated.\n4. Immunizations reviewed; update per schedule.\n5. Medication reconciliation completed.\n6. Patient education provided.\n7. Return in [4–12] weeks or as needed.',
  });

  _tmpl({ name: 'COPD Follow-up', visitType: 'Outpatient', isBuiltIn: true,
    chiefComplaint: 'COPD follow-up.',
    hpi: 'Patient presents for COPD management follow-up. Reports [improved/stable/worsening] symptoms. Dyspnea on exertion at [X flights/blocks]. Sputum production: [none/minimal/increased], [color]. Number of exacerbations in past 12 months: [X]. Rescue inhaler use: [X times/week]. Adherence to maintenance inhalers: [good/poor].',
    ros: 'Pulmonary: [Dyspnea, cough, wheezing, sputum — as applicable]. No hemoptysis.\nCV: No chest pain or palpitations.\nSleep: [No/reports] nocturnal dyspnea or sleep disruption.',
    physicalExam: 'General: [Well-appearing/mild respiratory distress], speaking in full sentences.\nVitals: See above. SpO2 [X]% on [room air/O2 Xm/LNC].\nLungs: [Diminished breath sounds/diffuse expiratory wheezing/prolonged expiratory phase]. [No/mild] accessory muscle use.\nCV: RRR, no murmurs. No JVD.\nExtremities: No cyanosis. [No/pitting] edema.',
    assessment: '1. COPD (J44.1) — [GOLD Stage I–IV], [Group A–D].\n2. Last PFTs: FEV1 [X]% predicted, FEV1/FVC [X] on [date].',
    plan: '1. Continue/optimize [LABA/LAMA/ICS/combo inhaler].\n2. Rescue albuterol PRN — technique reviewed.\n3. Pulmonary rehab: [enrolled/referral placed/not a candidate].\n4. Smoking cessation counseling; [NRT/pharmacotherapy] offered.\n5. Annual influenza and pneumococcal vaccines reviewed.\n6. Supplemental O2 if SpO2 ≤88% at rest or with exertion.\n7. Action plan for exacerbations reviewed.\n8. Return in [3–6] months or sooner if exacerbation.',
  });

  _tmpl({ name: 'Asthma Follow-up', visitType: 'Outpatient', isBuiltIn: true,
    chiefComplaint: 'Asthma follow-up.',
    hpi: 'Patient presents for asthma management. Symptom frequency: daytime symptoms [X/week], nighttime awakenings [X/month]. Rescue inhaler use: [X puffs/week]. Activity limitation: [present/absent]. ER visits or systemic steroid courses in past year: [X]. Known triggers: [list]. Adherence to controller therapy: [good/poor].',
    ros: 'Pulmonary: [Wheeze, cough, dyspnea — as applicable]. No hemoptysis.\nENT: [Rhinitis, postnasal drip] — may be contributing.\nSkin: [Eczema or urticaria].',
    physicalExam: 'General: No acute respiratory distress, speaking in full sentences.\nVitals: See above. Peak flow: [X L/min] ([X]% predicted).\nLungs: [CTA/expiratory wheeze bilaterally]. No accessory muscle use.\nSkin: [No rash/eczema noted].',
    assessment: '1. Asthma (J45.X) — [intermittent/mild persistent/moderate persistent/severe persistent].\n2. Asthma control: [well-controlled/not well-controlled/very poorly controlled].',
    plan: '1. [Step up/maintain/step down] therapy per GINA guidelines.\n2. Inhaler technique reviewed and corrected as needed.\n3. Asthma action plan updated and provided.\n4. Identify and minimize triggers.\n5. Spirometry: [within past 12 months/order now].\n6. Allergy evaluation/immunotherapy: [considered/deferred].\n7. Return in [1–6] months.',
  });

  _tmpl({ name: 'Depression / Anxiety Follow-up', visitType: 'Outpatient', isBuiltIn: true,
    chiefComplaint: 'Mental health follow-up.',
    hpi: 'Patient presents for follow-up of [depression/anxiety/both]. Current PHQ-9 score: [X/27] ([severity]). Current GAD-7 score: [X/21]. Reports [improvement/stability/worsening] in mood, energy, and sleep since last visit. Medication adherence: [good/poor]. Therapy participation: [individual/group/none].',
    ros: 'Psychiatric: [Depressed mood, anhedonia, sleep disturbance, appetite changes, fatigue, concentration difficulty — as applicable]. No psychosis, mania, or suicidal ideation.\nSleep: [Insomnia/hypersomnia, describe].\nConstitutional: No weight change.',
    physicalExam: 'General: Alert, cooperative, mood appears [euthymic/dysthymic/anxious].\nAffect: [congruent/flat/restricted/labile].\nSpeech: Normal rate, rhythm, and volume.\nThought process: Linear and goal-directed.\nThought content: No SI/HI/AVH. No delusions.\nCognition: Alert and oriented x3. Memory grossly intact.',
    assessment: '1. [Major Depressive Disorder (F32.X)/Generalized Anxiety Disorder (F41.1)] — [in remission/mild/moderate/severe].\n2. PHQ-9: [X], GAD-7: [X].',
    plan: '1. Continue/adjust [antidepressant/anxiolytic] — [dose/timing change].\n2. Safety plan reviewed. Patient denies SI/HI.\n3. Referral to therapy: [in place/placed today/declined].\n4. Sleep hygiene counseling provided.\n5. Limit alcohol and caffeine.\n6. Return in [4–8] weeks. Contact office or 988 Lifeline if crisis.',
  });

  _tmpl({ name: 'Upper Respiratory Infection', visitType: 'Urgent Care', isBuiltIn: true,
    chiefComplaint: 'Upper respiratory infection symptoms.',
    hpi: 'Patient presents with [X]-day history of upper respiratory symptoms including [sore throat/rhinorrhea/nasal congestion/cough/malaise/low-grade fever]. Denies high fever, shortness of breath, rash, ear pain, or neck stiffness. No known sick contacts. No recent travel.',
    ros: 'Constitutional: [Low-grade fever, malaise, fatigue].\nHEENT: [Sore throat, rhinorrhea, nasal congestion, ear pain].\nPulmonary: [Cough — productive/non-productive]. No dyspnea or hemoptysis.\nGI: No nausea, vomiting, or diarrhea.',
    physicalExam: 'General: Alert, mild distress.\nVitals: See above. Temp [X]°F.\nHEENT: [Mild pharyngeal erythema/tonsillar exudate/no exudate]. TMs: [clear bilaterally/dull]. Nares: [erythematous, clear/mucopurulent discharge]. No sinus tenderness.\nNeck: Supple, [no/mild anterior cervical] LAD.\nLungs: CTA bilaterally, no wheeze.',
    assessment: '1. Viral upper respiratory infection (J06.9) — most likely etiology.\n2. [Strep pharyngitis ruled out by rapid test — negative/Strep rapid test positive].',
    plan: '1. Supportive care: rest, hydration, saline nasal rinse.\n2. Symptomatic relief: [acetaminophen/ibuprofen, decongestant, antihistamine, cough suppressant] as appropriate.\n3. [Antibiotics not indicated for viral URI / Amoxicillin prescribed for confirmed strep].\n4. Return precautions: ER for dyspnea, worsening fever >5 days, neck stiffness, or rash.\n5. Follow-up with PCP if no improvement in [5–7] days.',
  });

  _tmpl({ name: 'Urinary Tract Infection', visitType: 'Urgent Care', isBuiltIn: true,
    chiefComplaint: 'Urinary symptoms.',
    hpi: 'Patient presents with [X]-day history of [dysuria/urinary frequency/urgency/hematuria/suprapubic pain]. [No/reports] fever, flank pain, nausea, or vomiting. Last menstrual period: [date/N/A]. [Not/possibly] pregnant. No indwelling catheter. No recent urologic procedures.',
    ros: 'GU: [Dysuria, frequency, urgency, hematuria, suprapubic discomfort]. No vaginal/penile discharge.\nConstitutional: [No/low-grade] fever or chills.\nGI: No nausea, vomiting, or diarrhea.',
    physicalExam: 'General: Alert, in mild discomfort.\nVitals: See above. Afebrile/Temp [X]°F.\nAbdomen: Soft, [suprapubic tenderness/no tenderness]. No CVA tenderness.\nGU: [External genitalia — normal/discharge noted].',
    assessment: '1. Uncomplicated urinary tract infection (N39.0) — [cystitis].\n2. UA: [WBCs, bacteria, nitrites, leukocyte esterase results].\n[3. Urine culture sent.]',
    plan: '1. [Nitrofurantoin 100mg ER BID x5d / Trimethoprim-sulfamethoxazole DS BID x3d / Fosfomycin 3g x1 dose] — based on local resistance patterns and allergy history.\n2. Increase fluid intake.\n3. Phenazopyridine PRN dysuria relief x2 days (urine will turn orange).\n4. Culture results: follow up in [2–3] days; adjust antibiotic if needed.\n5. Return for fever, flank pain, or worsening symptoms (concern for pyelonephritis).',
  });

  _tmpl({ name: 'Low Back Pain', visitType: 'Outpatient', isBuiltIn: true,
    chiefComplaint: 'Low back pain.',
    hpi: 'Patient presents with [acute/subacute/chronic] low back pain x [duration]. Onset: [gradual/sudden after lifting/twisting/no inciting event]. Pain is [X/10], described as [aching/sharp/burning/radiating]. Radiation: [none/into buttock/down [R/L] leg to knee/below knee]. Associated symptoms: [paresthesias/weakness/bladder/bowel changes]. Prior episodes: [yes/no]. Prior treatment: [PT/chiropractic/injections]. No red flag symptoms.',
    ros: 'Musculoskeletal: Pain as described. No joint swelling.\nNeuro: [No/reports] lower extremity weakness, numbness, or tingling. [No/reports] saddle anesthesia.\nConstitutional: No fever, chills, or unintentional weight loss.\nGU: No bladder or bowel dysfunction.',
    physicalExam: 'General: Ambulatory, mildly antalgic gait.\nSpine: [Paraspinal muscle tenderness at L[X]. No midline bony tenderness. Limited lumbar flexion/extension due to pain].\nNeurological: Lower extremity strength 5/5. Sensation intact. DTRs 2+ and symmetric. Straight leg raise: [negative/positive at [X]° reproducing radicular pain].\nGait: [Normal/antalgic].',
    assessment: '1. [Acute/Chronic] low back pain [without/with] radiculopathy (M54.5[X]).\n2. [No red flag features. Imaging not indicated at this time.]',
    plan: '1. NSAIDs: [ibuprofen 400–600mg TID with food] or [naproxen 500mg BID] x [5–10] days.\n2. Topical diclofenac or lidocaine patch PRN.\n3. Muscle relaxant: [cyclobenzaprine 5mg TID PRN] x [5–7] days — counsel re: drowsiness.\n4. Heat therapy, activity as tolerated. Avoid prolonged bed rest.\n5. Physical therapy referral.\n6. Imaging (MRI lumbar): [not indicated/ordered — [indication]].\n7. Return or ER if bladder/bowel dysfunction, saddle anesthesia, or progressive weakness.',
  });

  _tmpl({ name: 'Chest Pain Evaluation', visitType: 'Urgent Care', isBuiltIn: true,
    chiefComplaint: 'Chest pain evaluation.',
    hpi: 'Patient presents with [acute/subacute] chest pain x [duration]. Character: [sharp/pressure/tightness/burning/pleuritic]. Location: [substernal/left-sided/right-sided/diffuse]. Radiation: [none/to left arm/jaw/back/shoulder]. Onset: [exertional/at rest/positional/after meals]. Severity: [X/10]. Associated symptoms: [dyspnea/diaphoresis/nausea/palpitations/fever/cough]. Alleviating factors: [rest/antacids/position/nothing]. TIMI Risk Score: [X/7].',
    ros: 'CV: [Chest pain as above. No prior MI or stents. No palpitations.]\nPulmonary: [No/reports] dyspnea, cough, or hemoptysis.\nGI: [No/reports] heartburn, regurgitation, or dysphagia.\nMusculoskeletal: [No/reports] chest wall tenderness or recent trauma.\nConstitutional: [No/reports] fever or recent immobility (DVT/PE risk).',
    physicalExam: 'General: [Appears comfortable/in discomfort]. Diaphoretic: [no/yes].\nVitals: See above. Bilateral arm BP: R [X/Y], L [X/Y].\nCV: RRR, no murmurs/rubs/gallops. No JVD.\nLungs: CTA bilaterally. No friction rub.\nAbdomen: Soft, NT/ND. No epigastric tenderness.\nChest wall: [No/tenderness with palpation reproducing pain].\nExtremities: No DVT signs. No edema.',
    assessment: '1. Chest pain, [likely musculoskeletal/GI/cardiac etiology] — workup in progress.\n2. ACS risk: [low/intermediate/high].\n3. EKG: [NSR without ischemic changes/LBBB/ST changes].\n4. Initial troponin: [pending/negative/elevated at X].',
    plan: '1. [Discharge with follow-up/Transfer to ED for further evaluation] based on risk stratification.\n2. EKG performed and reviewed.\n3. Serial troponins: [ordered/pending].\n4. Chest X-ray: [normal/results pending].\n5. [Aspirin 325mg given if ACS suspected].\n6. Cardiology consultation: [placed/not indicated].\n7. Strict return precautions: ER immediately for recurrent or worsening chest pain, dyspnea, or syncope.',
  });

  _tmpl({ name: 'Headache / Migraine', visitType: 'Outpatient', isBuiltIn: true,
    chiefComplaint: 'Headache evaluation.',
    hpi: 'Patient presents with [recurring/new onset] headaches. Frequency: [X/month]. Duration: [X hours/days]. Character: [throbbing/pressure/stabbing]. Location: [bilateral/unilateral — R/L frontotemporal/occipital]. Severity: [X/10] at peak. Associated symptoms: [nausea/vomiting/photophobia/phonophobia/aura — describe]. Aggravating factors: [stress/menses/sleep changes/foods/weather]. Relieving factors: [OTC analgesics/rest/dark/quiet room]. Prior treatment: [medications tried, response].',
    ros: 'Neuro: [Headache as described]. No focal weakness, numbness, or vision changes.\nHEENT: No eye pain or jaw claudication.\nConstitutional: No fever, weight loss, or neck stiffness.\nPsychiatric: [Stress, anxiety, depression — contributing factors].',
    physicalExam: 'General: Alert, in [mild/no] distress.\nVitals: See above.\nHEENT: No sinus tenderness. No temporal artery tenderness.\nNeck: Supple, no meningismus.\nFunduscopic: [Discs sharp, no papilledema].\nNeuro: CN II–XII intact. Motor 5/5. Sensory intact. Coordination normal. Gait normal.',
    assessment: '1. [Migraine without aura (G43.909) / Tension-type headache (G44.209) / Cluster headache].\n2. Analgesic overuse: [present — counsel on medication overuse headache / absent].',
    plan: '1. Acute treatment: [sumatriptan 50–100mg at onset; ibuprofen 600mg; ketorolac 15–30mg IM if severe].\n2. Preventive therapy: [topiramate/amitriptyline/propranolol/valproate — if ≥4 migraines/month].\n3. Headache diary — record frequency, triggers, severity.\n4. Lifestyle: regular sleep schedule, hydration, limit caffeine and alcohol, manage stress.\n5. Limit analgesics to ≤2 days/week to prevent medication overuse headache.\n6. Neurology referral: [not needed/placed for refractory migraines].\n7. MRI brain: [not indicated/ordered — indication: [x]].\n8. Return in [4–8] weeks to reassess frequency and preventive response.',
  });

  _tmpl({ name: 'Hypothyroidism Follow-up', visitType: 'Outpatient', isBuiltIn: true,
    chiefComplaint: 'Hypothyroidism follow-up.',
    hpi: 'Patient presents for hypothyroidism management. Last TSH: [X] on [date]. Reports [good/poor] medication adherence. Symptoms: [fatigue/weight gain/cold intolerance/constipation/dry skin/hair loss/depression — present/absent]. Taking levothyroxine [dose] [X] minutes before breakfast.',
    ros: 'Constitutional: [Fatigue, weight gain, cold intolerance — as applicable].\nGI: [Constipation].\nDerm: [Dry skin, hair loss].\nPsychiatric: [Mood changes, cognitive slowing].\nCV: No palpitations, chest pain.',
    physicalExam: 'General: Well-appearing, no acute distress.\nVitals: See above.\nNeck: Thyroid [not palpable/enlarged — describe]. No nodules.\nSkin: [Dry/normal].\nHair: [Normal/brittle/thinning].\nReflexes: [Normal/delayed relaxation phase].\nEdema: [None/periorbital/pretibial myxedema].',
    assessment: '1. Hypothyroidism (E03.9) — [on appropriate dose/undertreated/overtreated].\n2. Most recent TSH: [X] (goal 0.5–4.0 mIU/L; [in range/below/above]).',
    plan: '1. [Continue/adjust levothyroxine] — [dose].\n2. Take on empty stomach 30–60 min before breakfast; avoid calcium, iron within 4 hours.\n3. Repeat TSH in [6–8 weeks after dose change / 6–12 months if stable].\n4. Annual TSH monitoring when stable.\n5. Patient education: symptoms of over/undertreatment reviewed.\n6. Return in [3–6] months.',
  });

  _tmpl({ name: 'Hyperlipidemia Follow-up', visitType: 'Outpatient', isBuiltIn: true,
    chiefComplaint: 'Hyperlipidemia follow-up.',
    hpi: 'Patient presents for lipid management follow-up. Most recent fasting lipid panel: TC [X], LDL [X], HDL [X], TG [X] on [date]. On statin therapy: [medication/dose] since [date]. Adherence: [good/poor]. Reports [no/muscle aches, CK checked]. ASCVD 10-year risk: [X]%.',
    ros: 'Musculoskeletal: [No/muscle pain, weakness, or tenderness].\nConstitutional: No fatigue.\nGI: No GI intolerance with current statin.',
    physicalExam: 'General: Well-appearing.\nVitals: See above.\nCV: RRR, no murmurs.\nXanthomas/xanthelasma: [absent/present — describe].\nExtremities: Pulses 2+ bilaterally. No peripheral arterial findings.',
    assessment: '1. Hyperlipidemia (E78.5) — LDL [at goal/above goal].\n2. ASCVD risk category: [low/<5% / intermediate/5–20% / high/>20%].\n3. LDL goal: [<100 / <70 / <55 mg/dL] based on risk.',
    plan: '1. [Continue/increase/change statin] to [high/moderate/low] intensity.\n2. Lifestyle: Mediterranean diet, limit saturated fat and trans fat, increase soluble fiber, exercise 150 min/week.\n3. Add ezetimibe if LDL not at goal on maximum tolerated statin.\n4. PCSK9 inhibitor: [considered/ordered for very high risk patients].\n5. Repeat fasting lipid panel in [6–12] weeks after medication change; otherwise annually.\n6. AST/ALT and CK: [not routinely needed/check if symptomatic].',
  });

  _tmpl({ name: 'Medication Refill', visitType: 'Outpatient', isBuiltIn: true,
    chiefComplaint: 'Medication refill.',
    hpi: 'Patient presents for medication refill visit for [list medications]. Reports stable symptoms and [good/adequate/poor] control on current regimen. No new adverse effects. Adherence: [good/occasionally missed doses]. Last office visit: [date]. Labs reviewed: [results].',
    ros: 'System-specific review based on conditions being treated — no significant new complaints.',
    physicalExam: 'Vitals: See above.\nGeneral: Alert, no acute distress.\n[Targeted examination based on condition — BP check, heart and lung auscultation, etc.]',
    assessment: '1. [Condition 1] — stable on current regimen.\n2. [Condition 2] — stable.',
    plan: '1. Refill [medication/dose/quantity/#30–90 days supply].\n2. [Address any lab or monitoring requirements before next refill].\n3. Prior authorization submitted: [yes/no/pending].\n4. Patient instructed to continue current doses and contact office for any side effects.\n5. Follow-up in [3–6] months or as needed.',
  });

  _tmpl({ name: 'Telehealth Visit', visitType: 'Telehealth', isBuiltIn: true,
    chiefComplaint: 'Telehealth visit — [chief complaint].',
    hpi: 'Patient seen via [video/telephone] telehealth visit for [chief complaint]. Patient [alone/with caregiver] at [home/work/other location]. Verbal consent for telehealth visit obtained. [Describe history of present illness as applicable].',
    ros: '[System-specific review based on chief complaint].\nAll reviewed systems otherwise negative.',
    physicalExam: 'Visit conducted via [video — limited physical exam / telephone — no physical exam possible].\nPatient appears [well/in mild distress] on video.\n[Limited observations: general appearance, speech, movement].\nVitals: Patient-reported — BP [X/Y], HR [X], SpO2 [X]%, Temp [X]°F [by home equipment].',
    assessment: '1. [Diagnosis/diagnoses].\n2. Telehealth visit deemed [appropriate/adequate] for this presentation.',
    plan: '1. [Treatment plan].\n2. Prescriptions sent electronically to [pharmacy].\n3. Orders placed: [labs/imaging].\n4. Patient instructed to seek in-person care if symptoms worsen or cannot be managed remotely.\n5. Follow-up: [in-person in X weeks / repeat telehealth in X weeks].',
  });

  _tmpl({ name: 'Inpatient H&P', visitType: 'Inpatient', isBuiltIn: true,
    chiefComplaint: 'Inpatient admission — [reason for admission].',
    hpi: 'Patient is a [age]-year-old [sex] with past medical history significant for [PMH] who presents with [chief complaint] x [duration]. [Detailed HPI including onset, character, severity, associated symptoms, aggravating/relieving factors, pertinent positives and negatives, and events leading to admission]. Patient [was/was not] in usual state of health prior to this illness.',
    ros: 'Constitutional: [Fever, chills, diaphoresis, weight loss].\nCV: [Chest pain, palpitations, edema].\nPulmonary: [Dyspnea, cough, hemoptysis].\nGI: [Nausea, vomiting, diarrhea, abdominal pain, melena, hematochezia].\nGU: [Dysuria, hematuria, decreased urine output].\nMusculoskeletal: [Arthralgias, myalgias].\nNeuro: [Headache, confusion, focal weakness, numbness].\nPsychiatric: [Orientation, mood, cooperation].',
    physicalExam: 'General: [Appearance, level of distress, alert and oriented x3].\nVitals: T [X]°F, HR [X], BP [X/Y], RR [X], SpO2 [X]% on [RA/O2 amount].\nHEENT: [Findings].\nNeck: [Supple, JVD, LAD].\nCV: [RRR/irregular, murmurs, peripheral pulses].\nLungs: [CTA/findings].\nAbdomen: [Soft/tender/distended, bowel sounds, organomegaly].\nExtremities: [Edema, clubbing, cyanosis, skin changes].\nSkin: [Rash, jaundice, turgor].\nNeuro: [Mental status, CN, motor, sensation, reflexes, gait].',
    assessment: '1. [Primary admitting diagnosis].\n2. [Secondary diagnoses].\n3. [Active problem list].',
    plan: '1. [Workup: labs, imaging, cultures, EKG, other diagnostics].\n2. [IV access, monitoring, telemetry if indicated].\n3. [Medications: IV fluids, antibiotics, analgesics, home medications].\n4. [Consultations ordered: specify].\n5. [Diet: NPO/clear/regular/specific restrictions].\n6. [Activity: bedrest/ambulate TID/fall precautions].\n7. [DVT prophylaxis: LMWH/SQH/SCDs/hold — reasoning].\n8. [Disposition plan: goal for discharge — [criteria]].',
  });

  _tmpl({ name: 'Inpatient Progress Note', visitType: 'Inpatient', isBuiltIn: true,
    chiefComplaint: 'Inpatient daily progress note — hospital day [X].',
    hpi: 'Patient is a [age]-year-old [sex] admitted [date] for [admission diagnosis], now on hospital day [X]. Subjective: [Patient reports/overnight events/nursing notes reviewed — patient resting comfortably/had fever/desaturation/pain episode]. Review of intake/output: [X mL in, X mL out].',
    ros: '[Targeted review of systems relevant to active problems — e.g., Pulmonary: dyspnea trending better/worse. GI: tolerating diet/NPO. GU: urine output adequate/oliguria].',
    physicalExam: 'Vitals: T [X]°F (Tmax [X]°F), HR [X], BP [X/Y], RR [X], SpO2 [X]% on [RA/O2].\nGeneral: Alert, [oriented x3/confused], appears [comfortable/ill].\nCV: [RRR/irregular]. No new murmurs.\nLungs: [CTA/bibasilar crackles/wheeze].\nAbdomen: [Soft/tender].\nExtremities: [No edema/edema unchanged/improved].\nLines/Drains: [PIV/PICC/Foley/surgical drain — site appearance].',
    assessment: '1. [Primary diagnosis] — [improving/stable/worsening].\n2. [Active problems — update each].',
    plan: '1. [Continue/adjust medications].\n2. [Labs: BMP, CBC, cultures — results reviewed, pending].\n3. [Imaging reviewed: findings].\n4. [Consultations: updated recs from [specialty]].\n5. [Anticipated discharge: [date/criteria — tolerating PO/afebrile 24h/ambulating/arrangements]].',
  });

  _tmpl({ name: 'Discharge Summary', visitType: 'Inpatient', isBuiltIn: true,
    chiefComplaint: 'Inpatient discharge summary.',
    hpi: 'Patient is a [age]-year-old [sex] admitted on [date] and discharged on [date] (length of stay: [X] days) for [primary diagnosis].\n\nAdmitting Diagnosis: [diagnosis].\nDischarge Diagnosis: [diagnosis].\n\nHospital Course: [Concise narrative of key events, treatments, procedures, and response to therapy during admission].',
    ros: 'Discharge Condition: [Stable/improved/fair]. Mental status: [Alert and oriented]. Ambulatory status: [Ambulating independently/with assistance/non-ambulatory].',
    physicalExam: 'Discharge Vitals: T [X]°F, HR [X], BP [X/Y], RR [X], SpO2 [X]% on [RA/O2 at home].\nWeight at discharge: [X kg/lbs] (admission weight: [X]).\nExam: [Brief relevant findings at discharge].',
    assessment: '1. [Primary discharge diagnosis].\n2. [Secondary diagnoses managed during admission].\n3. [Pending results at discharge — follow up with PCP].',
    plan: 'Discharge Medications: [Reconciled medication list — highlight changes: NEW, CHANGED, DISCONTINUED].\n\nDischarge Instructions:\n1. Diet: [specific diet restrictions].\n2. Activity: [restrictions/return to normal activity].\n3. Wound care: [specific instructions if applicable].\n4. Signs to return to ER: [fever >101°F, chest pain, dyspnea, wound changes, etc.].\n\nFollow-up Appointments:\n1. PCP: in [5–7] days — Dr. [name], [phone].\n2. [Specialist]: in [X] weeks — Dr. [name].\n\nPending Labs/Studies: [list — results to be communicated by PCP].\n\nPatient/caregiver verbalized understanding of instructions. Discharge instructions provided in writing.',
  });

  _tmpl({ name: 'Consult Note', visitType: 'Outpatient', isBuiltIn: true,
    chiefComplaint: 'Consultation for [specialty] regarding [reason for referral].',
    hpi: 'Consultation requested by Dr. [referring provider] for evaluation of [reason for consult]. Patient is a [age]-year-old [sex] with PMH significant for [PMH]. [Detailed relevant HPI including onset, prior evaluations, treatments tried, and current status].\n\nReason for Referral: [Specific question(s) to be answered by consultant].',
    ros: '[Focused review of systems pertinent to the consult question and specialty].\nAll other reviewed systems negative.',
    physicalExam: 'General: [Appearance, level of distress].\nVitals: See above.\n[Detailed specialty-specific physical examination relevant to reason for consult].',
    assessment: 'I have evaluated this [age]-year-old [sex] at the request of Dr. [referring provider] for [reason].\n\n1. [Primary finding/diagnosis].\n2. [Additional relevant findings].\n3. [Differential diagnosis if applicable].',
    plan: '1. [Recommendations — numbered, clear, actionable].\n2. [Diagnostic workup recommended].\n3. [Treatment recommendations].\n4. [Medication changes].\n5. [Further specialty follow-up: will follow/return PRN/follow-up in X weeks].\n\nThank you for this interesting consultation. We will continue to follow as needed.',
  });

  _tmpl({ name: 'Chronic Kidney Disease Follow-up', visitType: 'Outpatient', isBuiltIn: true,
    chiefComplaint: 'CKD follow-up.',
    hpi: 'Patient presents for CKD management follow-up. Most recent creatinine: [X] mg/dL, eGFR: [X] mL/min/1.73m² ([stage]) on [date]. Trend: [stable/declining]. Etiology: [DM/HTN/glomerulonephritis/unknown]. Reports [no/edema/dyspnea/fatigue/decreased urine output]. Adherence to renal diet and medications: [good/poor].',
    ros: 'GU: [Decreased urine output, foamy urine, hematuria — as applicable]. No dysuria.\nCV: [Dyspnea, edema, chest pain].\nConstitutional: [Fatigue, poor appetite, nausea — uremic symptoms].\nNeuro: [Confusion, restless legs].',
    physicalExam: 'General: Alert, no acute distress.\nVitals: See above. BP [controlled/elevated at X/Y].\nCV: RRR, no rub.\nLungs: [CTA/crackles].\nAbdomen: No bruit. No peritoneal signs.\nExtremities: [No/pitting] edema [grade X, bilateral LE].\nSkin: [Normal/pallor/uremic frost — rare late finding].',
    assessment: '1. CKD Stage [1–5] (N18.X), eGFR [X] — [stable/progressive].\n2. Etiology: [DM nephropathy/HTN nephrosclerosis/other].\n3. Complications: [Anemia/hyperkalemia/metabolic acidosis/hyperphosphatemia — as present].',
    plan: '1. BP target <130/80: [optimize ACE-I or ARB — first-line nephroprotection].\n2. Glycemic control if diabetic: HbA1c goal <7–8%.\n3. Protein restriction: 0.6–0.8g/kg/day.\n4. Low-potassium, low-phosphorus diet counseling.\n5. Avoid NSAIDs and nephrotoxic agents.\n6. Labs in [3] months: BMP, CBC, urine microalbumin/creatinine.\n7. Nephrology referral: [placed/in place — eGFR <30 threshold].\n8. Vaccinations: Hepatitis B series if not immune (for future HD access).\n9. Anemia management: [ferritin/iron, ESA therapy if applicable].',
  });

  _tmpl({ name: 'Obesity / Weight Management', visitType: 'Outpatient', isBuiltIn: true,
    chiefComplaint: 'Weight management visit.',
    hpi: 'Patient presents for obesity management. Current weight: [X lbs/kg], BMI: [X]. Baseline weight: [X] on [date]. Dietary history reviewed: [describe typical diet]. Physical activity: [X minutes/week]. Prior weight loss attempts: [list]. Weight loss goals: [X lbs over X months]. Comorbidities related to weight: [HTN/DM2/GERD/OSA/osteoarthritis/NASH].',
    ros: 'Constitutional: Reports [fatigue, low energy].\nPulmonary: [Dyspnea on exertion, snoring/witnessed apnea].\nGI: [Reflux, constipation].\nMusculoskeletal: [Joint pain limiting exercise].\nPsychiatric: [Emotional eating, depression, anxiety contributing to weight].',
    physicalExam: 'Vitals: See above. Height [X], Weight [X], BMI [X].\nGeneral: BMI Class [I/II/III]. [Cushingoid features absent/present].\nNeck: [No acanthosis nigricans / acanthosis nigricans noted].\nAbdomen: Waist circumference [X cm].\nSkin: [Striae, intertrigo in skin folds].',
    assessment: '1. Obesity, Class [I/II/III] (E66.01) — BMI [X].\n2. [Associated comorbidities].',
    plan: '1. Goal: 5–10% body weight reduction over 6 months (realistic, evidence-based).\n2. Dietary plan: [500–750 kcal/day deficit, Mediterranean/low-carb/structured program].\n3. Physical activity: increase to 150–300 min/week moderate intensity.\n4. Behavioral support: [referral to registered dietitian, structured weight management program].\n5. Pharmacotherapy: [consider if BMI ≥30 or ≥27 with comorbidity — options: orlistat, phentermine, naltrexone/bupropion, semaglutide, tirzepatide].\n6. Bariatric surgery referral: [considered if BMI ≥40 or ≥35 with comorbidity, after 6-month medical program].\n7. OSA screening: [STOP-BANG score — sleep study ordered if indicated].\n8. Follow-up in [4–8] weeks to reassess and provide ongoing support.',
  });

  _tmpl({ name: 'Rheumatology Follow-up', visitType: 'Outpatient', isBuiltIn: true,
    chiefComplaint: 'Rheumatology follow-up for [RA/lupus/gout/other].',
    hpi: 'Patient presents for follow-up of [condition]. Disease activity: [remission/low/moderate/high]. Joint symptoms: [morning stiffness x [X] minutes, swollen/tender joints — specify]. Functional status: [mRS/HAQ score]. Recent flares: [none/X in past 3 months]. Adherence to DMARDs/biologics: [good/poor]. Side effects: [none/[describe]].',
    ros: 'Musculoskeletal: [Joint pain, swelling, stiffness, reduced ROM — specify joints].\nConstitutional: [Fatigue, fever, weight loss].\nDerm: [Rash — malar/photosensitive/nodules].\nRenal: [Hematuria, foamy urine — lupus nephritis monitoring].\nPulmonary: [Pleuritis, dyspnea — serositis].\nOphthalmologic: [Eye redness, pain, photophobia — uveitis/dry eye].',
    physicalExam: 'General: Alert, no acute distress.\nJoints: [Tender joints: [X]. Swollen joints: [X]. Active synovitis: [present/absent].\nSkin: [Rash/nodules/tophi description or absent].\nEyes: [Red/injected or normal].\nLungs: [CTA or crackles].',
    assessment: '1. [RA (M05.X)/SLE (M32.X)/Gout (M10.X)/Other] — disease activity [low/moderate/high/remission].\n2. DAS28/SLEDAI/other score: [X].',
    plan: '1. [Continue/adjust DMARD/biologic regimen].\n2. Labs for drug monitoring: CBC, CMP, ESR, CRP, [anti-dsDNA, complement if SLE].\n3. Uric acid target <6 mg/dL if gout — [allopurinol/febuxostat dose].\n4. Hydroxychloroquine: annual ophthalmology exam ordered.\n5. Vaccinations: live vaccines avoided while on immunosuppression; pneumococcal and annual flu up to date.\n6. Osteoporosis prevention if on chronic steroids: calcium, vitamin D, bisphosphonate.\n7. Return in [3] months.',
  });

  _tmpl({ name: 'Neurology Follow-up', visitType: 'Outpatient', isBuiltIn: true,
    chiefComplaint: 'Neurology follow-up for [condition].',
    hpi: 'Patient presents for follow-up of [Parkinson disease/MS/epilepsy/neuropathy/other]. [Condition-specific history: seizure frequency, PD motor scores, MS relapse history, neuropathy symptoms]. Current medications: [list]. Side effects: [none/[describe]]. Functional status: [working/ADLs independent/requiring assistance].',
    ros: 'Neuro: [Tremor, gait difficulty, weakness, numbness, tingling, vision changes, speech difficulty, cognitive changes, seizures].\nConstitutional: No fever or weight loss.\nPsychiatric: [Mood, cognition, sleep].',
    physicalExam: 'Mental Status: Alert and oriented x3. Memory grossly intact. Language fluent.\nCranial Nerves: CN II–XII intact.\nMotor: Strength 5/5 all extremities. [Tremor/rigidity/bradykinesia — describe if present].\nSensory: [Intact / Decreased — distribution].\nReflexes: [2+ symmetric / Hyperreflexia / Areflexia].\nCoordination: Finger-nose-finger [intact/dysmetric]. Heel-shin [intact/ataxic].\nGait: [Normal/antalgic/shuffling/broad-based/unsteady].',
    assessment: '1. [Neurological condition] — [stable/improving/progressing].\n2. [Most recent imaging/lab result].',
    plan: '1. [Continue/adjust medications].\n2. [MRI/EEG/nerve conduction study — if indicated].\n3. Physical therapy/occupational therapy/speech therapy: [referral placed/ongoing].\n4. [Condition-specific monitoring — seizure diary, DBS programming, MS infusion schedule].\n5. Return in [3–6] months.',
  });

  _tmpl({ name: 'Skin Lesion / Dermatology', visitType: 'Outpatient', isBuiltIn: true,
    chiefComplaint: 'Skin lesion evaluation.',
    hpi: 'Patient presents for evaluation of [X] skin lesion(s). Location: [describe]. Duration: [X months/years]. Changes: [growing/bleeding/color change/itching/painful]. History of prior skin cancers: [none/BCC/SCC/melanoma]. Sun exposure history: [moderate/heavy — tanning beds: yes/no]. Family history of melanoma: [yes/no].',
    ros: 'Skin: [Lesion as described. No other new lesions reported].\nConstitutional: No fever, night sweats, or weight loss (lymphoma screen).\nLymph nodes: No noted swelling.',
    physicalExam: 'Skin — Primary Lesion:\nType: [macule/papule/plaque/nodule/vesicle/pustule/ulcer].\nSize: [X × Y mm].\nShape: [round/oval/irregular].\nBorder: [well-defined/ill-defined/irregular].\nColor: [tan/brown/pink/red/variegated — specify].\nSurface: [smooth/scaly/crusted/ulcerated].\nLocation: [anatomic site].\n\nDermatoscopy: [pearly/pigmented network/vascular pattern/other].\nRegional lymph nodes: [No palpable LAD].',
    assessment: '1. [Benign seborrheic keratosis / Actinic keratosis / Basal cell carcinoma / Squamous cell carcinoma / Melanoma / Dysplastic nevus / Other] — clinical impression.\n2. [Additional lesions — as applicable].',
    plan: '1. [No intervention/shave biopsy/punch biopsy/excision] — [lesion description].\n2. Pathology sent to [lab]. Results expected in [X–X] business days.\n3. [Cryotherapy/topical 5-FU/imiquimod] for [actinic keratoses].\n4. Sun protection counseling: SPF 30+ broad-spectrum daily, UV-protective clothing, avoid tanning beds.\n5. Full-body skin check recommended [annually/every 6 months for high-risk].\n6. Return to discuss biopsy results.',
  });

  _tmpl({ name: 'Osteoporosis Management', visitType: 'Outpatient', isBuiltIn: true,
    chiefComplaint: 'Osteoporosis management.',
    hpi: 'Patient presents for osteoporosis management. Most recent DEXA: T-score [spine: X, hip: X, femoral neck: X] on [date]. FRAX 10-year fracture risk: major osteoporotic [X]%, hip [X]%. [No/prior fracture history — describe]. On bisphosphonate/other therapy x [X] years. Calcium [X mg/day, dietary + supplement] and vitamin D [X IU/day]. Fall risk: [low/moderate/high].',
    ros: 'Musculoskeletal: [Back pain, height loss, kyphosis].\nConstitutional: No fever or weight loss.\nGI: [GI tolerance of bisphosphonate].\nOral: [Dental hygiene, recent dental procedures — osteonecrosis of jaw risk].',
    physicalExam: 'Vitals: Weight [X kg/lbs].\nPosture: [Kyphosis noted/absent].\nHeight: [X cm] (prior: [X] — [no change/X cm loss]).\nMobility: [Gets up from chair without arm use: yes/no]. Gait [steady/unsteady].',
    assessment: '1. [Osteoporosis (M81.0) / Osteopenia (Z87.39)] — T-score [X].\n2. High fracture risk based on FRAX.\n3. [Prior fragility fracture: yes/no].',
    plan: '1. Calcium: 1000–1200 mg/day total (dietary preferred + supplement if needed).\n2. Vitamin D: 800–2000 IU/day; recheck 25-OH vitamin D in 3 months if deficient.\n3. [Continue/initiate bisphosphonate: alendronate 70mg weekly / risedronate 35mg weekly].\n4. Bisphosphonate holiday: [consider after 5 years oral / 3 years IV if low risk].\n5. [Denosumab/teriparatide/romosozumab — for severe or refractory cases].\n6. Fall prevention: balance exercises, home safety evaluation, review medications causing orthostasis.\n7. Repeat DEXA in [2] years.\n8. Dental exam before starting/continuing denosumab.',
  });

  _tmpl({ name: 'Substance Use / Alcohol Disorder', visitType: 'Outpatient', isBuiltIn: true,
    chiefComplaint: 'Substance use disorder follow-up.',
    hpi: 'Patient presents for follow-up of [alcohol use disorder/opioid use disorder/other]. Sobriety/abstinence: [X days/months/years]. AUDIT-C score: [X/12] or DAST-10 score: [X/10]. Last use: [date/never since treatment]. Currently on [MAT: buprenorphine/naltrexone/acamprosate/methadone]. Therapy/AA/NA participation: [active/lapsed]. Triggers and stressors: [social/occupational/family].',
    ros: 'Psychiatric: [Cravings, mood, anxiety, sleep — as applicable]. No active SI/HI.\nGI: [Nausea, GI discomfort].\nConstitutional: [Fatigue, appetite changes].',
    physicalExam: 'General: Alert and cooperative. Appears [well/withdrawn/diaphoretic].\nVitals: See above.\nSkin: [No track marks/track marks noted at [site]].\nAbdomen: [Liver size — hepatomegaly if applicable].\nNeuro: [No tremor/asterixis noted].',
    assessment: '1. [Alcohol Use Disorder (F10.XX) / Opioid Use Disorder (F11.XX)] — [in remission/active].\n2. MAT adherence: [good/poor].',
    plan: '1. Continue [buprenorphine/naltrexone/acamprosate] — prescription provided.\n2. UDS ordered: [results reviewed — negative/positive for [substance]].\n3. Counseling reinforced: [individual/group therapy, AA/NA].\n4. Naloxone kit: prescribed/patient has active kit — rescue technique reviewed.\n5. Labs: LFTs, CBC, hepatitis B/C screen if not done.\n6. Safe storage of medications discussed.\n7. Safety planning for relapse: contact sponsor, call office, use crisis line (988).\n8. Return in [2–4] weeks.',
  });

  _tmpl({ name: 'Prenatal Visit', visitType: 'Outpatient', isBuiltIn: true,
    chiefComplaint: 'Prenatal care visit — [X] weeks gestation.',
    hpi: 'Patient is a [age]-year-old G[X]P[X] female at [X] weeks gestation by [LMP/ultrasound dating]. EDC: [date]. Prenatal labs and first trimester screen reviewed. Reports [good fetal movement/no fetal movement concerns]. [No/reports] vaginal bleeding, contractions, leakage of fluid, or dysuria. Prenatal vitamins with folic acid: [adherent]. Nausea/vomiting: [resolved/persistent — severity].',
    ros: 'OB: [Fetal movement, contractions, vaginal bleeding or discharge, leakage of fluid].\nGU: No dysuria or hematuria.\nConstitutional: [Fatigue, nausea — trimester appropriate or not].\nCV: No chest pain or palpitations. [Leg swelling — physiologic vs. preeclampsia screen].',
    physicalExam: 'Vitals: See above.\nWeight: [X] (total gain: [X lbs] over [X weeks]).\nFundal height: [X cm] (matches/[X] cm discrepancy from dates).\nFetal heart tones: [X bpm by Doppler].\nPresentation: [cephalic/breech/transverse] at [X] weeks.\nEdema: [none/lower extremity — pitting/non-pitting].\nCervical exam (if indicated): [dilated Xcm, effaced X%, station [X]].',
    assessment: '1. Intrauterine pregnancy at [X] weeks, [appropriate/large/small] for gestational age.\n2. [Trimester-specific complications or findings — if applicable].',
    plan: '1. Routine labs ordered: [GBS at 35–37 weeks / GDM screen at 24–28 weeks / anatomy scan at 18–22 weeks].\n2. Folic acid 400–800 mcg daily through 12 weeks; continue prenatal vitamin.\n3. Counseling: activity, diet, listeria avoidance, no alcohol/tobacco/recreational drugs.\n4. [Tdap vaccine at 27–36 weeks / flu vaccine offered].\n5. Kick counts starting at 28 weeks.\n6. Return in [2–4] weeks for next prenatal visit.',
  });

  _tmpl({ name: 'Pediatric Well Visit', visitType: 'Outpatient', isBuiltIn: true,
    chiefComplaint: 'Pediatric well child visit — [age].',
    hpi: 'Patient is a [age]-year-old [boy/girl/child] presenting for routine well child visit. Parent/guardian present: [yes/no]. Child has been [healthy/had the following interval illnesses: X]. Development: [meeting milestones — see below / concern for delay in [X]].',
    ros: 'Constitutional: No fever, weight changes.\nNutrition: [Breastfed/formula/table food/no concerns].\nSleep: [X hours/night, [no/yes] concerns].\nBehavior/Development: [As described below].\nSafety: [Helmet use, car seat, firearms secured, smoke alarms].',
    physicalExam: 'Vitals: Height [X cm] ([X]%ile), Weight [X kg] ([X]%ile), BMI [X] ([X]%ile), HC [if <3 years: X cm ([X]%ile)].\nGeneral: Alert, active, well-nourished, well-developed, no acute distress.\nHEENT: Normocephalic, fontanelles closed/open-flat. Red reflex bilateral. TMs clear. Pharynx benign.\nNeck: Supple, no LAD.\nCV: RRR, no murmurs.\nLungs: CTA bilaterally.\nAbdomen: Soft, NT/ND, no organomegaly.\nGU: [Tanner stage X / genitalia normal / testes descended bilaterally].\nMusculoskeletal: Normal tone and strength. Hips [Ortolani/Barlow negative in infants].\nSkin: No rashes.\nNeuro: Age-appropriate reflexes and tone.',
    assessment: '1. [Age]-year-old — healthy and developing [appropriately / with the following concerns: X].\n2. Growth: [within normal limits / [above/below] curve — monitoring].',
    plan: '1. Immunizations administered today: [list vaccines, lots, sites].\n2. Labs: [lead/iron/lipid/TB screening — per AAP schedule].\n3. Vision and hearing screen: [passed/referred].\n4. Developmental screening tool (M-CHAT/ASQ): [normal/concerns — referral].\n5. Anticipatory guidance: [age-specific safety, nutrition, screen time, sleep, dental, discipline].\n6. Next well visit: [next age-based interval].\n7. Contact office for fever, illness, or concerns.',
  });

  /* ---- Panel Provider Assignments ---- */
  assignPanel(pat1.id, [prov1.id]);
  assignPanel(pat2.id, [prov1.id]);
  assignPanel(pat3.id, [prov2.id]);

  /* ---- Sample Appointments ---- */
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1); // This week's Monday

  function apptDate(dayOffset, hour, min) {
    const d = new Date(monday);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, min, 0, 0);
    return d.toISOString();
  }

  saveAppointment({ patientId: pat1.id, providerId: prov1.id, dateTime: apptDate(1, 9, 0),  duration: 30, visitType: 'Follow-Up',       reason: 'Migraine follow-up',     status: 'Scheduled' });
  saveAppointment({ patientId: pat2.id, providerId: prov1.id, dateTime: apptDate(3, 14, 0), duration: 45, visitType: 'Annual Physical',  reason: 'Annual wellness exam',   status: 'Scheduled' });
  saveAppointment({ patientId: pat3.id, providerId: prov2.id, dateTime: apptDate(7, 10, 30), duration: 30, visitType: 'Follow-Up',       reason: 'Sore throat follow-up',  status: 'Scheduled' });
  saveAppointment({ patientId: pat1.id, providerId: prov1.id, dateTime: apptDate(9, 11, 0), duration: 60, visitType: 'New Patient',      reason: 'Comprehensive evaluation', status: 'Scheduled' });

  // ===== Inpatient Infrastructure Seed Data =====
  const hospital = saveHospital({ id: generateId(), name: 'Gusdorf Hospital' });

  const wardCardio = saveWard({ id: generateId(), hospitalId: hospital.id, floor: 'Goose 1', unit: 'Cardiology', name: 'Cardiology - Goose 1', beds: 12 });
  const wardNephro = saveWard({ id: generateId(), hospitalId: hospital.id, floor: 'Goose 2', unit: 'Nephrology', name: 'Nephrology - Goose 2', beds: 10 });
  const wardHosp = saveWard({ id: generateId(), hospitalId: hospital.id, floor: 'Goose 3', unit: 'Hospitalist', name: 'Hospitalist - Goose 3', beds: 14 });
  const wardHepat = saveWard({ id: generateId(), hospitalId: hospital.id, floor: 'Goose 3', unit: 'Hepatology', name: 'Hepatology - Goose 3', beds: 8 });
  const wardSurg = saveWard({ id: generateId(), hospitalId: hospital.id, floor: 'Goose 4', unit: 'Surgery', name: 'Surgery - Goose 4', beds: 12 });
  const wardNeuro = saveWard({ id: generateId(), hospitalId: hospital.id, floor: 'Goose 5', unit: 'Neurology', name: 'Neurology - Goose 5', beds: 10 });

  // --- Cardiology (Goose 1) - 5 patients ---
  const ip01 = savePatient({ id: generateId(), mrn: 'MRN001004', firstName: 'Harold', lastName: 'Jennings', dob: '1948-03-14', sex: 'M', phone: '(555) 201-1001', insurance: 'Medicare', createdAt: new Date().toISOString() });
  const ipEnc01 = saveEncounter({ id: generateId(), patientId: ip01.id, providerId: prov1.id, visitType: 'Inpatient', visitSubtype: 'Cardiology', dateTime: new Date('2026-02-20T07:00:00').toISOString(), status: 'Open' });
  saveNote({ id: generateId(), encounterId: ipEnc01.id, chiefComplaint: 'CHF exacerbation with worsening dyspnea and bilateral lower extremity edema', signed: false, lastModified: new Date().toISOString() });
  saveBedAssignment({ patientId: ip01.id, wardId: wardCardio.id, bed: '1-01' });

  const ip02 = savePatient({ id: generateId(), mrn: 'MRN001005', firstName: 'Gloria', lastName: 'Whitfield', dob: '1955-07-22', sex: 'F', phone: '(555) 201-1002', insurance: 'Aetna', createdAt: new Date().toISOString() });
  const ipEnc02 = saveEncounter({ id: generateId(), patientId: ip02.id, providerId: prov2.id, visitType: 'Inpatient', visitSubtype: 'Cardiology', dateTime: new Date('2026-02-21T08:30:00').toISOString(), status: 'Open' });
  saveNote({ id: generateId(), encounterId: ipEnc02.id, chiefComplaint: 'NSTEMI with troponin elevation and substernal chest pain', signed: false, lastModified: new Date().toISOString() });
  saveBedAssignment({ patientId: ip02.id, wardId: wardCardio.id, bed: '1-02' });

  const ip03 = savePatient({ id: generateId(), mrn: 'MRN001006', firstName: 'Raymond', lastName: 'Okamoto', dob: '1960-11-05', sex: 'M', phone: '(555) 201-1003', insurance: 'BlueCross', createdAt: new Date().toISOString() });
  const ipEnc03 = saveEncounter({ id: generateId(), patientId: ip03.id, providerId: prov1.id, visitType: 'Inpatient', visitSubtype: 'Cardiology', dateTime: new Date('2026-02-22T06:45:00').toISOString(), status: 'Open' });
  saveNote({ id: generateId(), encounterId: ipEnc03.id, chiefComplaint: 'New-onset atrial fibrillation with rapid ventricular response', signed: false, lastModified: new Date().toISOString() });
  saveBedAssignment({ patientId: ip03.id, wardId: wardCardio.id, bed: '1-03' });

  const ip04 = savePatient({ id: generateId(), mrn: 'MRN001007', firstName: 'Dolores', lastName: 'Pereira', dob: '1943-09-30', sex: 'F', phone: '(555) 201-1004', insurance: 'Medicare', createdAt: new Date().toISOString() });
  const ipEnc04 = saveEncounter({ id: generateId(), patientId: ip04.id, providerId: prov2.id, visitType: 'Inpatient', visitSubtype: 'Cardiology', dateTime: new Date('2026-02-23T10:00:00').toISOString(), status: 'Open' });
  saveNote({ id: generateId(), encounterId: ipEnc04.id, chiefComplaint: 'Hypertensive emergency with SBP >220 and end-organ damage', signed: false, lastModified: new Date().toISOString() });
  saveBedAssignment({ patientId: ip04.id, wardId: wardCardio.id, bed: '1-04' });

  const ip05 = savePatient({ id: generateId(), mrn: 'MRN001008', firstName: 'Winston', lastName: 'Abernathy', dob: '1970-01-18', sex: 'M', phone: '(555) 201-1005', insurance: 'UnitedHealth', createdAt: new Date().toISOString() });
  const ipEnc05 = saveEncounter({ id: generateId(), patientId: ip05.id, providerId: prov1.id, visitType: 'Inpatient', visitSubtype: 'Cardiology', dateTime: new Date('2026-02-24T07:15:00').toISOString(), status: 'Open' });
  saveNote({ id: generateId(), encounterId: ipEnc05.id, chiefComplaint: 'Acute pericarditis with pleuritic chest pain and diffuse ST elevation', signed: false, lastModified: new Date().toISOString() });
  saveBedAssignment({ patientId: ip05.id, wardId: wardCardio.id, bed: '1-05' });

  // --- Nephrology (Goose 2) - 4 patients ---
  const ip06 = savePatient({ id: generateId(), mrn: 'MRN001009', firstName: 'Evelyn', lastName: 'Matsuda', dob: '1952-04-09', sex: 'F', phone: '(555) 202-2001', insurance: 'Medicare', createdAt: new Date().toISOString() });
  const ipEnc06 = saveEncounter({ id: generateId(), patientId: ip06.id, providerId: prov2.id, visitType: 'Inpatient', visitSubtype: 'Nephrology', dateTime: new Date('2026-02-21T09:00:00').toISOString(), status: 'Open' });
  saveNote({ id: generateId(), encounterId: ipEnc06.id, chiefComplaint: 'Acute kidney injury with creatinine rise from 1.2 to 4.8', signed: false, lastModified: new Date().toISOString() });
  saveBedAssignment({ patientId: ip06.id, wardId: wardNephro.id, bed: '2-01' });

  const ip07 = savePatient({ id: generateId(), mrn: 'MRN001010', firstName: 'Terrence', lastName: 'McAllister', dob: '1965-12-27', sex: 'M', phone: '(555) 202-2002', insurance: 'Cigna', createdAt: new Date().toISOString() });
  const ipEnc07 = saveEncounter({ id: generateId(), patientId: ip07.id, providerId: prov1.id, visitType: 'Inpatient', visitSubtype: 'Nephrology', dateTime: new Date('2026-02-22T11:30:00').toISOString(), status: 'Open' });
  saveNote({ id: generateId(), encounterId: ipEnc07.id, chiefComplaint: 'CKD Stage 4 exacerbation with hyperkalemia and metabolic acidosis', signed: false, lastModified: new Date().toISOString() });
  saveBedAssignment({ patientId: ip07.id, wardId: wardNephro.id, bed: '2-02' });

  const ip08 = savePatient({ id: generateId(), mrn: 'MRN001011', firstName: 'Priya', lastName: 'Raghavan', dob: '1978-06-03', sex: 'F', phone: '(555) 202-2003', insurance: 'BlueCross', createdAt: new Date().toISOString() });
  const ipEnc08 = saveEncounter({ id: generateId(), patientId: ip08.id, providerId: prov2.id, visitType: 'Inpatient', visitSubtype: 'Nephrology', dateTime: new Date('2026-02-23T08:00:00').toISOString(), status: 'Open' });
  saveNote({ id: generateId(), encounterId: ipEnc08.id, chiefComplaint: 'Nephrotic syndrome with 3+ proteinuria and anasarca', signed: false, lastModified: new Date().toISOString() });
  saveBedAssignment({ patientId: ip08.id, wardId: wardNephro.id, bed: '2-03' });

  const ip09 = savePatient({ id: generateId(), mrn: 'MRN001012', firstName: 'Leonard', lastName: 'Dubois', dob: '1940-08-15', sex: 'M', phone: '(555) 202-2004', insurance: 'Medicare', createdAt: new Date().toISOString() });
  const ipEnc09 = saveEncounter({ id: generateId(), patientId: ip09.id, providerId: prov1.id, visitType: 'Inpatient', visitSubtype: 'Nephrology', dateTime: new Date('2026-02-24T07:45:00').toISOString(), status: 'Open' });
  saveNote({ id: generateId(), encounterId: ipEnc09.id, chiefComplaint: 'ESRD requiring urgent hemodialysis initiation for volume overload', signed: false, lastModified: new Date().toISOString() });
  saveBedAssignment({ patientId: ip09.id, wardId: wardNephro.id, bed: '2-04' });

  // --- Hospitalist (Goose 3) - 7 patients ---
  const ip10 = savePatient({ id: generateId(), mrn: 'MRN001013', firstName: 'Margaret', lastName: 'Kowalski', dob: '1958-02-11', sex: 'F', phone: '(555) 203-3001', insurance: 'Aetna', createdAt: new Date().toISOString() });
  const ipEnc10 = saveEncounter({ id: generateId(), patientId: ip10.id, providerId: prov2.id, visitType: 'Inpatient', visitSubtype: 'Hospitalist', dateTime: new Date('2026-02-20T14:00:00').toISOString(), status: 'Open' });
  saveNote({ id: generateId(), encounterId: ipEnc10.id, chiefComplaint: 'Community-acquired pneumonia with fever, productive cough, and hypoxia', signed: false, lastModified: new Date().toISOString() });
  saveBedAssignment({ patientId: ip10.id, wardId: wardHosp.id, bed: '3-01' });

  const ip11 = savePatient({ id: generateId(), mrn: 'MRN001014', firstName: 'Carlos', lastName: 'Delgado', dob: '1972-10-25', sex: 'M', phone: '(555) 203-3002', insurance: 'UnitedHealth', createdAt: new Date().toISOString() });
  const ipEnc11 = saveEncounter({ id: generateId(), patientId: ip11.id, providerId: prov1.id, visitType: 'Inpatient', visitSubtype: 'Hospitalist', dateTime: new Date('2026-02-21T06:30:00').toISOString(), status: 'Open' });
  saveNote({ id: generateId(), encounterId: ipEnc11.id, chiefComplaint: 'Sepsis secondary to urinary source with lactate 4.2', signed: false, lastModified: new Date().toISOString() });
  saveBedAssignment({ patientId: ip11.id, wardId: wardHosp.id, bed: '3-02' });

  const ip12 = savePatient({ id: generateId(), mrn: 'MRN001015', firstName: 'Dorothy', lastName: 'Flemming', dob: '1946-05-19', sex: 'F', phone: '(555) 203-3003', insurance: 'Medicare', createdAt: new Date().toISOString() });
  const ipEnc12 = saveEncounter({ id: generateId(), patientId: ip12.id, providerId: prov2.id, visitType: 'Inpatient', visitSubtype: 'Hospitalist', dateTime: new Date('2026-02-22T09:15:00').toISOString(), status: 'Open' });
  saveNote({ id: generateId(), encounterId: ipEnc12.id, chiefComplaint: 'Acute COPD exacerbation with increased work of breathing and wheezing', signed: false, lastModified: new Date().toISOString() });
  saveBedAssignment({ patientId: ip12.id, wardId: wardHosp.id, bed: '3-03' });

  const ip13 = savePatient({ id: generateId(), mrn: 'MRN001016', firstName: 'Andre', lastName: 'Washington', dob: '1985-03-08', sex: 'M', phone: '(555) 203-3004', insurance: 'Cigna', createdAt: new Date().toISOString() });
  const ipEnc13 = saveEncounter({ id: generateId(), patientId: ip13.id, providerId: prov1.id, visitType: 'Inpatient', visitSubtype: 'Hospitalist', dateTime: new Date('2026-02-23T12:00:00').toISOString(), status: 'Open' });
  saveNote({ id: generateId(), encounterId: ipEnc13.id, chiefComplaint: 'Diabetic ketoacidosis with blood glucose 485 and anion gap 22', signed: false, lastModified: new Date().toISOString() });
  saveBedAssignment({ patientId: ip13.id, wardId: wardHosp.id, bed: '3-04' });

  const ip14 = savePatient({ id: generateId(), mrn: 'MRN001017', firstName: 'Sandra', lastName: 'Nygaard', dob: '1968-07-14', sex: 'F', phone: '(555) 203-3005', insurance: 'BlueCross', createdAt: new Date().toISOString() });
  const ipEnc14 = saveEncounter({ id: generateId(), patientId: ip14.id, providerId: prov2.id, visitType: 'Inpatient', visitSubtype: 'Hospitalist', dateTime: new Date('2026-02-25T08:00:00').toISOString(), status: 'Open' });
  saveNote({ id: generateId(), encounterId: ipEnc14.id, chiefComplaint: 'Left lower extremity cellulitis with spreading erythema and fever', signed: false, lastModified: new Date().toISOString() });
  saveBedAssignment({ patientId: ip14.id, wardId: wardHosp.id, bed: '3-05' });

  const ip15 = savePatient({ id: generateId(), mrn: 'MRN001018', firstName: 'James', lastName: 'Okonkwo', dob: '1953-11-02', sex: 'M', phone: '(555) 203-3006', insurance: 'Medicare', createdAt: new Date().toISOString() });
  const ipEnc15 = saveEncounter({ id: generateId(), patientId: ip15.id, providerId: prov1.id, visitType: 'Inpatient', visitSubtype: 'Hospitalist', dateTime: new Date('2026-02-26T07:30:00').toISOString(), status: 'Open' });
  saveNote({ id: generateId(), encounterId: ipEnc15.id, chiefComplaint: 'Complicated UTI with pyelonephritis, fever 102.4, and flank pain', signed: false, lastModified: new Date().toISOString() });
  saveBedAssignment({ patientId: ip15.id, wardId: wardHosp.id, bed: '3-06' });

  const ip16 = savePatient({ id: generateId(), mrn: 'MRN001019', firstName: 'Beatrice', lastName: 'Tanaka', dob: '1961-09-20', sex: 'F', phone: '(555) 203-3007', insurance: 'Aetna', createdAt: new Date().toISOString() });
  const ipEnc16 = saveEncounter({ id: generateId(), patientId: ip16.id, providerId: prov2.id, visitType: 'Inpatient', visitSubtype: 'Hospitalist', dateTime: new Date('2026-02-27T10:45:00').toISOString(), status: 'Open' });
  saveNote({ id: generateId(), encounterId: ipEnc16.id, chiefComplaint: 'Upper GI bleed with melena and hemoglobin drop from 12 to 7.8', signed: false, lastModified: new Date().toISOString() });
  saveBedAssignment({ patientId: ip16.id, wardId: wardHosp.id, bed: '3-07' });

  // --- Hepatology (Goose 3) - 3 patients ---
  const ip17 = savePatient({ id: generateId(), mrn: 'MRN001020', firstName: 'Victor', lastName: 'Salazar', dob: '1957-04-06', sex: 'M', phone: '(555) 203-4001', insurance: 'UnitedHealth', createdAt: new Date().toISOString() });
  const ipEnc17 = saveEncounter({ id: generateId(), patientId: ip17.id, providerId: prov1.id, visitType: 'Inpatient', visitSubtype: 'Hepatology', dateTime: new Date('2026-02-22T13:00:00').toISOString(), status: 'Open' });
  saveNote({ id: generateId(), encounterId: ipEnc17.id, chiefComplaint: 'Hepatic encephalopathy grade II with confusion and asterixis', signed: false, lastModified: new Date().toISOString() });
  saveBedAssignment({ patientId: ip17.id, wardId: wardHepat.id, bed: '3H-01' });

  const ip18 = savePatient({ id: generateId(), mrn: 'MRN001021', firstName: 'Irene', lastName: 'Baxter', dob: '1950-12-31', sex: 'F', phone: '(555) 203-4002', insurance: 'Medicare', createdAt: new Date().toISOString() });
  const ipEnc18 = saveEncounter({ id: generateId(), patientId: ip18.id, providerId: prov2.id, visitType: 'Inpatient', visitSubtype: 'Hepatology', dateTime: new Date('2026-02-24T15:30:00').toISOString(), status: 'Open' });
  saveNote({ id: generateId(), encounterId: ipEnc18.id, chiefComplaint: 'Esophageal variceal bleeding with hematemesis and hemodynamic instability', signed: false, lastModified: new Date().toISOString() });
  saveBedAssignment({ patientId: ip18.id, wardId: wardHepat.id, bed: '3H-02' });

  const ip19 = savePatient({ id: generateId(), mrn: 'MRN001022', firstName: 'Nathan', lastName: 'Cho', dob: '1980-08-23', sex: 'M', phone: '(555) 203-4003', insurance: 'BlueCross', createdAt: new Date().toISOString() });
  const ipEnc19 = saveEncounter({ id: generateId(), patientId: ip19.id, providerId: prov1.id, visitType: 'Inpatient', visitSubtype: 'Hepatology', dateTime: new Date('2026-02-26T09:00:00').toISOString(), status: 'Open' });
  saveNote({ id: generateId(), encounterId: ipEnc19.id, chiefComplaint: 'Acute hepatitis with jaundice, AST 1200, ALT 1450', signed: false, lastModified: new Date().toISOString() });
  saveBedAssignment({ patientId: ip19.id, wardId: wardHepat.id, bed: '3H-03' });

  // --- Surgery (Goose 4) - 5 patients ---
  const ip20 = savePatient({ id: generateId(), mrn: 'MRN001023', firstName: 'Denise', lastName: 'Rivera', dob: '1974-01-29', sex: 'F', phone: '(555) 204-5001', insurance: 'Cigna', createdAt: new Date().toISOString() });
  const ipEnc20 = saveEncounter({ id: generateId(), patientId: ip20.id, providerId: prov2.id, visitType: 'Inpatient', visitSubtype: 'Surgery', dateTime: new Date('2026-02-20T16:00:00').toISOString(), status: 'Open' });
  saveNote({ id: generateId(), encounterId: ipEnc20.id, chiefComplaint: 'Post-appendectomy POD 1, monitoring for surgical site infection', signed: false, lastModified: new Date().toISOString() });
  saveBedAssignment({ patientId: ip20.id, wardId: wardSurg.id, bed: '4-01' });

  const ip21 = savePatient({ id: generateId(), mrn: 'MRN001024', firstName: 'Franklin', lastName: 'Bergstrom', dob: '1966-06-12', sex: 'M', phone: '(555) 204-5002', insurance: 'Aetna', createdAt: new Date().toISOString() });
  const ipEnc21 = saveEncounter({ id: generateId(), patientId: ip21.id, providerId: prov1.id, visitType: 'Inpatient', visitSubtype: 'Surgery', dateTime: new Date('2026-02-21T11:00:00').toISOString(), status: 'Open' });
  saveNote({ id: generateId(), encounterId: ipEnc21.id, chiefComplaint: 'Post-laparoscopic cholecystectomy POD 2, tolerating clear liquids', signed: false, lastModified: new Date().toISOString() });
  saveBedAssignment({ patientId: ip21.id, wardId: wardSurg.id, bed: '4-02' });

  const ip22 = savePatient({ id: generateId(), mrn: 'MRN001025', firstName: 'Miriam', lastName: 'Al-Rashid', dob: '1945-10-07', sex: 'F', phone: '(555) 204-5003', insurance: 'Medicare', createdAt: new Date().toISOString() });
  const ipEnc22 = saveEncounter({ id: generateId(), patientId: ip22.id, providerId: prov2.id, visitType: 'Inpatient', visitSubtype: 'Surgery', dateTime: new Date('2026-02-23T05:30:00').toISOString(), status: 'Open' });
  saveNote({ id: generateId(), encounterId: ipEnc22.id, chiefComplaint: 'Small bowel obstruction with abdominal distension and vomiting, NGT placed', signed: false, lastModified: new Date().toISOString() });
  saveBedAssignment({ patientId: ip22.id, wardId: wardSurg.id, bed: '4-03' });

  const ip23 = savePatient({ id: generateId(), mrn: 'MRN001026', firstName: 'George', lastName: 'Petrov', dob: '1941-02-14', sex: 'M', phone: '(555) 204-5004', insurance: 'Medicare', createdAt: new Date().toISOString() });
  const ipEnc23 = saveEncounter({ id: generateId(), patientId: ip23.id, providerId: prov1.id, visitType: 'Inpatient', visitSubtype: 'Surgery', dateTime: new Date('2026-02-25T07:00:00').toISOString(), status: 'Open' });
  saveNote({ id: generateId(), encounterId: ipEnc23.id, chiefComplaint: 'Right hip fracture s/p ORIF, weight bearing as tolerated, PT consult', signed: false, lastModified: new Date().toISOString() });
  saveBedAssignment({ patientId: ip23.id, wardId: wardSurg.id, bed: '4-04' });

  const ip24 = savePatient({ id: generateId(), mrn: 'MRN001027', firstName: 'Catherine', lastName: 'Huang', dob: '1959-08-30', sex: 'F', phone: '(555) 204-5005', insurance: 'UnitedHealth', createdAt: new Date().toISOString() });
  const ipEnc24 = saveEncounter({ id: generateId(), patientId: ip24.id, providerId: prov2.id, visitType: 'Inpatient', visitSubtype: 'Surgery', dateTime: new Date('2026-02-27T08:00:00').toISOString(), status: 'Open' });
  saveNote({ id: generateId(), encounterId: ipEnc24.id, chiefComplaint: 'Post-sigmoid colectomy POD 3 for diverticular perforation, drain in place', signed: false, lastModified: new Date().toISOString() });
  saveBedAssignment({ patientId: ip24.id, wardId: wardSurg.id, bed: '4-05' });

  // --- Neurology (Goose 5) - 4 patients ---
  const ip25 = savePatient({ id: generateId(), mrn: 'MRN001028', firstName: 'Robert', lastName: 'Lindqvist', dob: '1956-05-17', sex: 'M', phone: '(555) 205-6001', insurance: 'BlueCross', createdAt: new Date().toISOString() });
  const ipEnc25 = saveEncounter({ id: generateId(), patientId: ip25.id, providerId: prov1.id, visitType: 'Inpatient', visitSubtype: 'Neurology', dateTime: new Date('2026-02-22T04:30:00').toISOString(), status: 'Open' });
  saveNote({ id: generateId(), encounterId: ipEnc25.id, chiefComplaint: 'Acute ischemic stroke with left-sided hemiparesis, tPA administered', signed: false, lastModified: new Date().toISOString() });
  saveBedAssignment({ patientId: ip25.id, wardId: wardNeuro.id, bed: '5-01' });

  const ip26 = savePatient({ id: generateId(), mrn: 'MRN001029', firstName: 'Angela', lastName: 'Baptiste', dob: '1990-11-08', sex: 'F', phone: '(555) 205-6002', insurance: 'Cigna', createdAt: new Date().toISOString() });
  const ipEnc26 = saveEncounter({ id: generateId(), patientId: ip26.id, providerId: prov2.id, visitType: 'Inpatient', visitSubtype: 'Neurology', dateTime: new Date('2026-02-24T22:15:00').toISOString(), status: 'Open' });
  saveNote({ id: generateId(), encounterId: ipEnc26.id, chiefComplaint: 'New-onset seizure disorder with two witnessed generalized tonic-clonic seizures', signed: false, lastModified: new Date().toISOString() });
  saveBedAssignment({ patientId: ip26.id, wardId: wardNeuro.id, bed: '5-02' });

  const ip27 = savePatient({ id: generateId(), mrn: 'MRN001030', firstName: 'Thomas', lastName: 'Eriksson', dob: '1982-03-26', sex: 'M', phone: '(555) 205-6003', insurance: 'Aetna', createdAt: new Date().toISOString() });
  const ipEnc27 = saveEncounter({ id: generateId(), patientId: ip27.id, providerId: prov1.id, visitType: 'Inpatient', visitSubtype: 'Neurology', dateTime: new Date('2026-02-25T11:00:00').toISOString(), status: 'Open' });
  saveNote({ id: generateId(), encounterId: ipEnc27.id, chiefComplaint: 'Guillain-Barre syndrome with progressive ascending weakness and areflexia', signed: false, lastModified: new Date().toISOString() });
  saveBedAssignment({ patientId: ip27.id, wardId: wardNeuro.id, bed: '5-03' });

  const ip28 = savePatient({ id: generateId(), mrn: 'MRN001031', firstName: 'Yolanda', lastName: 'Fischer', dob: '1976-07-04', sex: 'F', phone: '(555) 205-6004', insurance: 'UnitedHealth', createdAt: new Date().toISOString() });
  const ipEnc28 = saveEncounter({ id: generateId(), patientId: ip28.id, providerId: prov2.id, visitType: 'Inpatient', visitSubtype: 'Neurology', dateTime: new Date('2026-02-28T08:30:00').toISOString(), status: 'Open' });
  saveNote({ id: generateId(), encounterId: ipEnc28.id, chiefComplaint: 'Multiple sclerosis exacerbation with optic neuritis and new sensory deficits', signed: false, lastModified: new Date().toISOString() });
  saveBedAssignment({ patientId: ip28.id, wardId: wardNeuro.id, bed: '5-04' });

  // Update MRN counter to account for 28 new patients (MRN001004-MRN001031 -> next is 1032)
  _storageAdapter.setItem(KEYS.mrnCounter, '1032');
}

function seedExtraPatients() {
  if (getPatients().find(p => p.mrn === 'MRN002001')) return; // already seeded
  const provs = getProviders();
  const p1 = provs[0] || { id: 'prov1' };
  const p2 = provs[1] || p1;

  /* ── 1. Margaret Chen ── */
  const s1 = savePatient({ id: generateId(), mrn: 'MRN002001', firstName: 'Margaret', lastName: 'Chen', dob: '1959-03-14', sex: 'Female', phone: '(555) 310-1001', insurance: 'Medicare Advantage', email: 'margaret.chen@email.com', addressStreet: '84 Birchwood Lane', addressCity: 'Springfield', addressState: 'IL', addressZip: '62703', emergencyContactName: 'David Chen', emergencyContactPhone: '(555) 310-2001', emergencyContactRelationship: 'Son', pharmacyName: 'CVS Pharmacy #1122', pharmacyPhone: '(555) 400-1001', pharmacyFax: '(555) 400-1002', panelProviders: [p1.id], createdAt: new Date('2023-02-10').toISOString() });
  savePatientAllergy({ patientId: s1.id, allergen: 'Penicillin', reaction: 'Urticaria, angioedema', severity: 'Severe', type: 'Drug' });
  savePatientAllergy({ patientId: s1.id, allergen: 'Contrast dye (iodinated)', reaction: 'Anaphylaxis', severity: 'Life-threatening', type: 'Drug' });
  savePatientMedication({ patientId: s1.id, name: 'Metformin', dose: '1000', unit: 'mg', route: 'PO', frequency: 'BID', status: 'Current', startDate: '2016-05-01', indication: 'Type 2 Diabetes', prescribedBy: 'Dr. Chen' });
  savePatientMedication({ patientId: s1.id, name: 'Lisinopril', dose: '20', unit: 'mg', route: 'PO', frequency: 'QDay', status: 'Current', startDate: '2014-08-01', indication: 'HTN / CKD nephroprotection', prescribedBy: 'Dr. Chen' });
  savePatientMedication({ patientId: s1.id, name: 'Atorvastatin', dose: '40', unit: 'mg', route: 'PO', frequency: 'QDay', status: 'Current', startDate: '2017-01-15', indication: 'Dyslipidemia / CAD', prescribedBy: 'Dr. Chen' });
  savePatientMedication({ patientId: s1.id, name: 'Aspirin', dose: '81', unit: 'mg', route: 'PO', frequency: 'QDay', status: 'Current', startDate: '2017-01-15', indication: 'CAD secondary prevention', prescribedBy: 'Dr. Chen' });
  savePatientMedication({ patientId: s1.id, name: 'Amlodipine', dose: '5', unit: 'mg', route: 'PO', frequency: 'QDay', status: 'Current', startDate: '2020-03-01', indication: 'Hypertension', prescribedBy: 'Dr. Chen' });
  saveActiveProblem({ patientId: s1.id, name: 'Type 2 Diabetes Mellitus', icd10: 'E11.9', onset: '2016-05-01', status: 'Chronic', priority: 'High', lastReviewDate: '2025-10-15', notes: 'HbA1c 7.4% (Oct 2025). On metformin, monitoring for CKD progression.' });
  saveActiveProblem({ patientId: s1.id, name: 'CKD Stage 3a', icd10: 'N18.31', onset: '2019-06-01', status: 'Chronic', priority: 'High', lastReviewDate: '2025-10-15', notes: 'eGFR 48 mL/min. Avoid NSAIDs, contrast. Annual nephrology follow-up.' });
  saveActiveProblem({ patientId: s1.id, name: 'Essential Hypertension', icd10: 'I10', onset: '2014-08-01', status: 'Chronic', priority: 'Medium', lastReviewDate: '2025-10-15', notes: 'BP 136/82 at last visit. On lisinopril + amlodipine.' });
  saveActiveProblem({ patientId: s1.id, name: 'Coronary Artery Disease', icd10: 'I25.10', onset: '2017-01-10', status: 'Chronic', priority: 'High', lastReviewDate: '2025-10-15', notes: 'Single-vessel disease on cath 2017, medically managed. On statin + ASA.' });
  savePatientDiagnosis({ patientId: s1.id, name: 'Type 2 Diabetes Mellitus', icd10: 'E11.9', onsetDate: '2016-05-01', evidenceNotes: 'Fasting glucose 228 mg/dL (May 2016). HbA1c 9.1% at diagnosis. Now 7.4% (Oct 2025).' });
  savePatientDiagnosis({ patientId: s1.id, name: 'CKD Stage 3a', icd10: 'N18.31', onsetDate: '2019-06-01', evidenceNotes: 'eGFR 48 (stable). Urinalysis with microalbuminuria 45 mg/g. Lisinopril for nephroprotection.' });
  savePatientDiagnosis({ patientId: s1.id, name: 'Coronary Artery Disease', icd10: 'I25.10', onsetDate: '2017-01-10', evidenceNotes: 'Cath Jan 2017: 70% stenosis LAD, medically managed. Stress test 2024: no ischemia.' });
  saveSocialHistory({ patientId: s1.id, smokingStatus: 'Former smoker (quit 2010)', tobaccoUse: '15 pack-years', alcoholUse: 'None', substanceUse: 'None', occupation: 'Retired accountant', maritalStatus: 'Married', livingSituation: 'Lives with husband', exercise: 'Light — 20 min walks daily', diet: 'Low carb, low sodium', notes: '' });
  saveFamilyHistory({ patientId: s1.id, mother: 'T2DM, HTN — deceased age 78 (stroke)', father: 'MI age 60 — deceased age 62', siblings: '1 brother: T2DM, CKD', maternalGrandparents: 'T2DM, HTN', paternalGrandparents: 'CAD', other: '', notes: 'Strong cardiometabolic family history.' });
  savePatientSurgery({ patientId: s1.id, procedure: 'Coronary Angiography', date: '2017-01-10', hospital: 'University Medical Center', surgeon: 'Dr. Rodriguez', notes: 'Single-vessel LAD disease, medical management elected.' });
  savePatientSurgery({ patientId: s1.id, procedure: 'Cholecystectomy (laparoscopic)', date: '2009-07-22', hospital: 'General Hospital', surgeon: 'Dr. Kim', notes: 'Symptomatic cholelithiasis, uncomplicated.' });
  const e1a = saveEncounter({ id: generateId(), patientId: s1.id, providerId: p1.id, visitType: 'Outpatient', visitSubtype: 'Primary Care', dateTime: new Date('2025-10-15T10:00:00').toISOString(), status: 'Signed' });
  saveNote({ id: generateId(), encounterId: e1a.id, chiefComplaint: 'Diabetes and CKD management follow-up.', hpi: 'Margaret is a 66-year-old female with T2DM, CKD 3a, CAD, and HTN presenting for routine follow-up. Reports good medication compliance. Home BP logs averaging 138/84. Denies chest pain, dyspnea, edema. Mild fatigue.', ros: 'Constitutional: Mild fatigue. CV: No chest pain. Pulmonary: No dyspnea. GI: No nausea. GU: No dysuria. Neuro: No focal deficits.', physicalExam: 'Vitals: See above. General: Well-appearing, no distress. CV: RRR, no murmurs. Lungs: CTA bilaterally. Abdomen: Soft, non-tender. Extremities: No edema. Skin: No lesions.', assessment: '1. T2DM (E11.9) — HbA1c 7.4%, adequate control.\n2. CKD 3a (N18.31) — eGFR 48, stable.\n3. HTN (I10) — near goal, continue current regimen.\n4. CAD (I25.10) — stable, no anginal symptoms.', plan: '1. Continue metformin 1000mg BID; add empagliflozin 10mg QDay for cardiorenal benefit.\n2. Repeat BMP and urine ACR in 3 months.\n3. Refer to nephrology for CKD co-management.\n4. Continue ASA 81mg and atorvastatin 40mg.\n5. Follow-up in 3 months.', signed: true, signedBy: p1.id, signedAt: new Date('2025-10-15T11:00:00').toISOString(), lastModified: new Date('2025-10-15T11:00:00').toISOString(), addenda: [] });
  saveEncounterVitals({ encounterId: e1a.id, patientId: s1.id, bpSystolic: '138', bpDiastolic: '84', heartRate: '76', respiratoryRate: '16', tempF: '98.2', spo2: '97', weightLbs: '168', heightIn: '62', recordedAt: new Date('2025-10-15T10:05:00').toISOString(), recordedBy: p1.id });
  saveLabResult({ patientId: s1.id, encounterId: e1a.id, panel: 'Comprehensive Metabolic Panel', resultDate: new Date('2025-10-15T13:00:00').toISOString(), resultedBy: 'Lab — General Hospital', tests: [{ name: 'Sodium', value: '138', unit: 'mEq/L', referenceRange: '136–145', flag: 'Normal' }, { name: 'Potassium', value: '4.3', unit: 'mEq/L', referenceRange: '3.5–5.1', flag: 'Normal' }, { name: 'BUN', value: '22', unit: 'mg/dL', referenceRange: '7–20', flag: 'High' }, { name: 'Creatinine', value: '1.3', unit: 'mg/dL', referenceRange: '0.6–1.2', flag: 'High' }, { name: 'eGFR', value: '48', unit: 'mL/min/1.73m²', referenceRange: '>60', flag: 'Low' }, { name: 'Glucose', value: '142', unit: 'mg/dL', referenceRange: '70–99', flag: 'High' }, { name: 'ALT', value: '28', unit: 'U/L', referenceRange: '7–56', flag: 'Normal' }], notes: 'Stable CKD. Elevated glucose consistent with T2DM.' });
  saveLabResult({ patientId: s1.id, encounterId: e1a.id, panel: 'HbA1c', resultDate: new Date('2025-10-15T13:00:00').toISOString(), resultedBy: 'Lab — General Hospital', tests: [{ name: 'HbA1c', value: '7.4', unit: '%', referenceRange: '<7.0', flag: 'High' }], notes: 'Mildly above target. Consider medication optimization.' });
  saveImmunization({ patientId: s1.id, vaccine: 'Influenza (IIV4)', date: '2024-10-01', lot: 'FL24-C', manufacturer: 'Sanofi', site: 'L deltoid', givenBy: p1.id, nextDue: '2025-10-01', notes: '' });
  saveImmunization({ patientId: s1.id, vaccine: 'Pneumococcal (PPSV23)', date: '2022-03-15', lot: 'PN22-A', manufacturer: 'Merck', site: 'R deltoid', givenBy: p1.id, nextDue: '', notes: 'Indicated for CKD and DM.' });
  saveReferral({ patientId: s1.id, encounterId: e1a.id, specialty: 'Nephrology', providerName: 'Dr. Anita Sharma', reason: 'CKD 3a co-management, empagliflozin initiation, proteinuria monitoring.', urgency: 'Routine', status: 'Sent', referralDate: new Date('2025-10-15').toISOString(), appointmentDate: '', responseNotes: '' });

  /* ── 2. David Washington ── */
  const s2 = savePatient({ id: generateId(), mrn: 'MRN002002', firstName: 'David', lastName: 'Washington', dob: '1972-08-05', sex: 'Male', phone: '(555) 310-1002', insurance: 'BlueCross PPO', email: 'david.washington@email.com', addressStreet: '312 Elm Street', addressCity: 'Springfield', addressState: 'IL', addressZip: '62701', emergencyContactName: 'Tamara Washington', emergencyContactPhone: '(555) 310-2002', emergencyContactRelationship: 'Wife', pharmacyName: 'Walgreens #2255', pharmacyPhone: '(555) 400-2001', pharmacyFax: '(555) 400-2002', panelProviders: [p1.id], createdAt: new Date('2023-05-20').toISOString() });
  savePatientAllergy({ patientId: s2.id, allergen: 'Codeine', reaction: 'Nausea, vomiting, dysphoria', severity: 'Moderate', type: 'Drug' });
  savePatientMedication({ patientId: s2.id, name: 'Lisinopril', dose: '10', unit: 'mg', route: 'PO', frequency: 'QDay', status: 'Current', startDate: '2019-04-01', indication: 'Hypertension', prescribedBy: 'Dr. Chen' });
  savePatientMedication({ patientId: s2.id, name: 'CPAP therapy', dose: '10', unit: 'cmH2O', route: 'Inhaled', frequency: 'QNight', status: 'Current', startDate: '2021-09-01', indication: 'Obstructive Sleep Apnea', prescribedBy: 'Dr. Nguyen' });
  savePatientMedication({ patientId: s2.id, name: 'Omeprazole', dose: '20', unit: 'mg', route: 'PO', frequency: 'QDay', status: 'Current', startDate: '2022-01-01', indication: 'GERD', prescribedBy: 'Dr. Chen' });
  saveActiveProblem({ patientId: s2.id, name: 'Essential Hypertension', icd10: 'I10', onset: '2019-04-01', status: 'Chronic', priority: 'Medium', lastReviewDate: '2025-09-10', notes: 'BP 142/88 at last visit. On lisinopril 10mg.' });
  saveActiveProblem({ patientId: s2.id, name: 'Obesity', icd10: 'E66.9', onset: '2015-01-01', status: 'Chronic', priority: 'High', lastReviewDate: '2025-09-10', notes: 'BMI 36.2. Counseled on diet, exercise, weight loss program referral pending.' });
  saveActiveProblem({ patientId: s2.id, name: 'Obstructive Sleep Apnea', icd10: 'G47.33', onset: '2021-09-01', status: 'Chronic', priority: 'Medium', lastReviewDate: '2025-09-10', notes: 'AHI 28 on PSG. On CPAP 10 cmH2O. Compliance ~70%.' });
  saveActiveProblem({ patientId: s2.id, name: 'GERD', icd10: 'K21.0', onset: '2022-01-01', status: 'Active', priority: 'Low', lastReviewDate: '2025-09-10', notes: 'Typical heartburn, responds to PPI.' });
  savePatientDiagnosis({ patientId: s2.id, name: 'Obstructive Sleep Apnea', icd10: 'G47.33', onsetDate: '2021-09-01', evidenceNotes: 'PSG Sept 2021: AHI 28, O2 nadir 82%. CPAP initiated, good symptomatic response.' });
  savePatientDiagnosis({ patientId: s2.id, name: 'Obesity', icd10: 'E66.9', onsetDate: '2015-01-01', evidenceNotes: 'BMI 36.2 (weight 245 lbs, height 69 in). Metabolic panel normal. No T2DM yet.' });
  saveSocialHistory({ patientId: s2.id, smokingStatus: 'Never smoker', tobaccoUse: 'None', alcoholUse: '2–3 drinks/week', substanceUse: 'None', occupation: 'High school football coach', maritalStatus: 'Married', livingSituation: 'Lives with wife and two children', exercise: 'Moderate — coaching activities, light gym', diet: 'High calorie, working on improvement', notes: '' });
  saveFamilyHistory({ patientId: s2.id, mother: 'T2DM, HTN — alive, age 72', father: 'HTN, MI age 55 — deceased age 67', siblings: '2 brothers — both HTN, 1 T2DM', maternalGrandparents: 'T2DM, HTN', paternalGrandparents: 'CAD, stroke', other: '', notes: 'Strong family history of HTN and metabolic disease.' });
  const e2a = saveEncounter({ id: generateId(), patientId: s2.id, providerId: p1.id, visitType: 'Outpatient', visitSubtype: 'Primary Care', dateTime: new Date('2025-09-10T14:00:00').toISOString(), status: 'Signed' });
  saveNote({ id: generateId(), encounterId: e2a.id, chiefComplaint: 'HTN follow-up, weight management.', hpi: 'David is a 53-year-old male with HTN, obesity, OSA, and GERD presenting for follow-up. BP home logs averaging 146/90. CPAP compliance ~70%, reports improved energy. Weight up 4 lbs since last visit. Denies chest pain or dyspnea.', assessment: '1. HTN (I10) — suboptimally controlled, uptitrate lisinopril.\n2. Obesity (E66.9) — BMI 36.2, refer to weight management.\n3. OSA (G47.33) — on CPAP, improve compliance.\n4. GERD (K21.0) — stable on omeprazole.', plan: '1. Increase lisinopril to 20mg QDay.\n2. Refer to weight management program.\n3. Reinforce CPAP compliance; follow-up with sleep medicine.\n4. Continue omeprazole 20mg QDay.\n5. CBC, BMP, lipid panel ordered.\n6. Follow-up 6 weeks.', signed: true, signedBy: p1.id, signedAt: new Date('2025-09-10T15:00:00').toISOString(), lastModified: new Date('2025-09-10T15:00:00').toISOString(), addenda: [] });
  saveEncounterVitals({ encounterId: e2a.id, patientId: s2.id, bpSystolic: '144', bpDiastolic: '90', heartRate: '82', respiratoryRate: '16', tempF: '98.6', spo2: '96', weightLbs: '245', heightIn: '69', recordedAt: new Date('2025-09-10T14:05:00').toISOString(), recordedBy: p1.id });
  saveLabResult({ patientId: s2.id, encounterId: e2a.id, panel: 'Lipid Panel', resultDate: new Date('2025-09-10T17:00:00').toISOString(), resultedBy: 'Lab — General Hospital', tests: [{ name: 'Total Cholesterol', value: '218', unit: 'mg/dL', referenceRange: '<200', flag: 'High' }, { name: 'LDL', value: '138', unit: 'mg/dL', referenceRange: '<100', flag: 'High' }, { name: 'HDL', value: '38', unit: 'mg/dL', referenceRange: '>40', flag: 'Low' }, { name: 'Triglycerides', value: '212', unit: 'mg/dL', referenceRange: '<150', flag: 'High' }], notes: 'Dyslipidemia. Consider statin therapy.' });
  saveImmunization({ patientId: s2.id, vaccine: 'Influenza (IIV4)', date: '2024-10-15', lot: 'FL24-D', manufacturer: 'AstraZeneca', site: 'L deltoid', givenBy: p1.id, nextDue: '2025-10-01', notes: '' });

  /* ── 3. Sarah O'Brien ── */
  const s3 = savePatient({ id: generateId(), mrn: 'MRN002003', firstName: 'Sarah', lastName: "O'Brien", dob: '1986-11-30', sex: 'Female', phone: '(555) 310-1003', insurance: 'Aetna HMO', email: 'sarah.obrien@email.com', addressStreet: '57 Willow Court', addressCity: 'Springfield', addressState: 'IL', addressZip: '62706', emergencyContactName: 'Patrick O\'Brien', emergencyContactPhone: '(555) 310-2003', emergencyContactRelationship: 'Husband', pharmacyName: 'Rite Aid #3341', pharmacyPhone: '(555) 400-3001', pharmacyFax: '(555) 400-3002', panelProviders: [p1.id], createdAt: new Date('2022-08-15').toISOString() });
  savePatientAllergy({ patientId: s3.id, allergen: 'Sulfonamides', reaction: 'Maculopapular rash', severity: 'Mild', type: 'Drug' });
  savePatientAllergy({ patientId: s3.id, allergen: 'NSAIDs', reaction: 'GI bleeding, worsening IBD symptoms', severity: 'Moderate', type: 'Drug' });
  savePatientMedication({ patientId: s3.id, name: 'Mesalamine', dose: '800', unit: 'mg', route: 'PO', frequency: 'TID', status: 'Current', startDate: '2018-03-01', indication: "Crohn's Disease maintenance", prescribedBy: 'Dr. Patel' });
  savePatientMedication({ patientId: s3.id, name: 'Azathioprine', dose: '100', unit: 'mg', route: 'PO', frequency: 'QDay', status: 'Current', startDate: '2020-06-01', indication: "Crohn's Disease immunomodulation", prescribedBy: 'Dr. Patel' });
  savePatientMedication({ patientId: s3.id, name: 'Ferrous sulfate', dose: '325', unit: 'mg', route: 'PO', frequency: 'BID', status: 'Current', startDate: '2023-01-01', indication: 'Iron deficiency anemia', prescribedBy: 'Dr. Chen' });
  savePatientMedication({ patientId: s3.id, name: 'Sertraline', dose: '50', unit: 'mg', route: 'PO', frequency: 'QDay', status: 'Current', startDate: '2021-04-01', indication: 'Anxiety disorder', prescribedBy: 'Dr. Chen' });
  saveActiveProblem({ patientId: s3.id, name: "Crohn's Disease", icd10: 'K50.90', onset: '2018-03-01', status: 'Chronic', priority: 'High', lastReviewDate: '2025-08-20', notes: 'Ileocolonic disease. Currently in remission on mesalamine + azathioprine. GI follow-up q6mo.' });
  saveActiveProblem({ patientId: s3.id, name: 'Iron Deficiency Anemia', icd10: 'D50.9', onset: '2023-01-01', status: 'Chronic', priority: 'Medium', lastReviewDate: '2025-08-20', notes: 'Secondary to chronic GI blood loss. On ferrous sulfate BID. Hgb 10.8 (Aug 2025).' });
  saveActiveProblem({ patientId: s3.id, name: 'Generalized Anxiety Disorder', icd10: 'F41.1', onset: '2021-04-01', status: 'Chronic', priority: 'Medium', lastReviewDate: '2025-08-20', notes: 'On sertraline 50mg. Engaged in CBT.' });
  savePatientDiagnosis({ patientId: s3.id, name: "Crohn's Disease, ileocolonic", icd10: 'K50.90', onsetDate: '2018-03-01', evidenceNotes: 'Colonoscopy Mar 2018: discontinuous ileocolonic inflammation with skip lesions. Biopsy: granulomatous inflammation. Currently in remission (CDAI <150, CRP 4.2 mg/L).' });
  savePatientDiagnosis({ patientId: s3.id, name: 'Iron Deficiency Anemia', icd10: 'D50.9', onsetDate: '2023-01-01', evidenceNotes: 'Ferritin 6 ng/mL, Fe sat 8%, Hgb 9.2 g/dL at diagnosis. Now Hgb 10.8 on ferrous sulfate.' });
  saveSocialHistory({ patientId: s3.id, smokingStatus: 'Never smoker', tobaccoUse: 'None', alcoholUse: 'Rare — avoids due to IBD', substanceUse: 'None', occupation: 'Graphic designer (remote)', maritalStatus: 'Married', livingSituation: 'Lives with husband and 1 child', exercise: 'Light — walks, yoga during remission', diet: 'Low-residue, avoids raw vegetables and high-fiber foods', notes: '' });
  saveFamilyHistory({ patientId: s3.id, mother: 'Ulcerative colitis — alive, age 61', father: 'HTN — alive, age 64', siblings: '1 sister: Crohn\'s disease (dx 2022)', maternalGrandparents: 'IBD (unspecified)', paternalGrandparents: 'Unknown', other: '', notes: 'IBD clusters in family.' });
  savePatientSurgery({ patientId: s3.id, procedure: 'Ileoscopy with biopsy', date: '2018-03-15', hospital: 'General Hospital', surgeon: 'Dr. Patel', notes: 'Diagnostic. Confirmed Crohn\'s ileocolonic. No resection needed.' });
  const e3a = saveEncounter({ id: generateId(), patientId: s3.id, providerId: p1.id, visitType: 'Outpatient', visitSubtype: 'Primary Care', dateTime: new Date('2025-08-20T09:30:00').toISOString(), status: 'Signed' });
  saveNote({ id: generateId(), encounterId: e3a.id, chiefComplaint: "Crohn's follow-up, anemia check.", hpi: "Sarah is a 38-year-old female with Crohn's disease (ileocolonic, in remission) and iron deficiency anemia presenting for follow-up. No abdominal pain, diarrhea, or bleeding since last visit. Taking ferrous sulfate BID. Reports mild fatigue but improved from 3 months ago. Sertraline tolerated well.", assessment: "1. Crohn's disease (K50.90) — in remission.\n2. Iron deficiency anemia (D50.9) — improving on supplementation.\n3. Anxiety (F41.1) — stable on sertraline.", plan: "1. Continue mesalamine 800mg TID and azathioprine 100mg QDay.\n2. Continue ferrous sulfate BID; recheck CBC in 8 weeks.\n3. Continue sertraline 50mg; reinforce CBT.\n4. GI referral for colonoscopy surveillance in 6 months.\n5. Follow-up 3 months.", signed: true, signedBy: p1.id, signedAt: new Date('2025-08-20T10:15:00').toISOString(), lastModified: new Date('2025-08-20T10:15:00').toISOString(), addenda: [] });
  saveEncounterVitals({ encounterId: e3a.id, patientId: s3.id, bpSystolic: '110', bpDiastolic: '70', heartRate: '88', respiratoryRate: '14', tempF: '98.4', spo2: '99', weightLbs: '128', heightIn: '64', recordedAt: new Date('2025-08-20T09:35:00').toISOString(), recordedBy: p1.id });
  saveLabResult({ patientId: s3.id, encounterId: e3a.id, panel: 'CBC', resultDate: new Date('2025-08-20T12:00:00').toISOString(), resultedBy: 'Lab — General Hospital', tests: [{ name: 'WBC', value: '5.8', unit: 'K/uL', referenceRange: '4.5–11.0', flag: 'Normal' }, { name: 'Hemoglobin', value: '10.8', unit: 'g/dL', referenceRange: '12.0–16.0', flag: 'Low' }, { name: 'Hematocrit', value: '33.2', unit: '%', referenceRange: '36–46', flag: 'Low' }, { name: 'MCV', value: '74', unit: 'fL', referenceRange: '80–100', flag: 'Low' }, { name: 'Ferritin', value: '14', unit: 'ng/mL', referenceRange: '12–150', flag: 'Normal' }, { name: 'Platelets', value: '290', unit: 'K/uL', referenceRange: '150–400', flag: 'Normal' }], notes: 'Microcytic anemia improving on iron supplementation. Ferritin normalizing.' });
  saveImmunization({ patientId: s3.id, vaccine: 'Influenza (IIV4)', date: '2024-10-20', lot: 'FL24-E', manufacturer: 'Sanofi', site: 'L deltoid', givenBy: p1.id, nextDue: '2025-10-01', notes: '' });
  saveImmunization({ patientId: s3.id, vaccine: 'Hepatitis B series (complete)', date: '2022-09-01', lot: 'HB22-A', manufacturer: 'Merck', site: 'R deltoid', givenBy: p1.id, nextDue: '', notes: 'Indicated for immunomodulator use.' });

  /* ── 4. James Patel ── */
  const s4 = savePatient({ id: generateId(), mrn: 'MRN002004', firstName: 'James', lastName: 'Patel', dob: '1953-06-22', sex: 'Male', phone: '(555) 310-1004', insurance: 'Medicare', email: 'james.patel@email.com', addressStreet: '929 Oakwood Drive', addressCity: 'Springfield', addressState: 'IL', addressZip: '62704', emergencyContactName: 'Priya Patel', emergencyContactPhone: '(555) 310-2004', emergencyContactRelationship: 'Wife', pharmacyName: 'CVS Pharmacy #3344', pharmacyPhone: '(555) 400-4001', pharmacyFax: '(555) 400-4002', panelProviders: [p1.id], createdAt: new Date('2022-01-05').toISOString() });
  savePatientAllergy({ patientId: s4.id, allergen: 'ACE Inhibitors', reaction: 'Cough', severity: 'Mild', type: 'Drug' });
  savePatientAllergy({ patientId: s4.id, allergen: 'Aspirin', reaction: 'Bronchospasm', severity: 'Severe', type: 'Drug' });
  savePatientMedication({ patientId: s4.id, name: 'Tiotropium', dose: '18', unit: 'mcg', route: 'Inhaled', frequency: 'QDay', status: 'Current', startDate: '2016-02-01', indication: 'COPD maintenance', prescribedBy: 'Dr. Chen' });
  savePatientMedication({ patientId: s4.id, name: 'Albuterol MDI', dose: '90', unit: 'mcg', route: 'Inhaled', frequency: 'PRN', status: 'Current', startDate: '2016-02-01', indication: 'COPD rescue', prescribedBy: 'Dr. Chen' });
  savePatientMedication({ patientId: s4.id, name: 'Apixaban', dose: '5', unit: 'mg', route: 'PO', frequency: 'BID', status: 'Current', startDate: '2019-08-01', indication: 'Atrial fibrillation — stroke prevention', prescribedBy: 'Dr. Chen' });
  savePatientMedication({ patientId: s4.id, name: 'Metoprolol succinate', dose: '50', unit: 'mg', route: 'PO', frequency: 'QDay', status: 'Current', startDate: '2019-08-01', indication: 'A-fib rate control / CHF', prescribedBy: 'Dr. Chen' });
  savePatientMedication({ patientId: s4.id, name: 'Furosemide', dose: '40', unit: 'mg', route: 'PO', frequency: 'QDay', status: 'Current', startDate: '2020-03-01', indication: 'CHF volume management', prescribedBy: 'Dr. Chen' });
  savePatientMedication({ patientId: s4.id, name: 'Spironolactone', dose: '25', unit: 'mg', route: 'PO', frequency: 'QDay', status: 'Current', startDate: '2020-03-01', indication: 'CHF — neurohormonal blockade', prescribedBy: 'Dr. Chen' });
  saveActiveProblem({ patientId: s4.id, name: 'COPD — Gold Stage 3', icd10: 'J44.1', onset: '2016-02-01', status: 'Chronic', priority: 'High', lastReviewDate: '2025-11-01', notes: 'FEV1 42% predicted. On tiotropium QDay + albuterol PRN. 1 exacerbation past year.' });
  saveActiveProblem({ patientId: s4.id, name: 'Atrial Fibrillation', icd10: 'I48.91', onset: '2019-08-01', status: 'Chronic', priority: 'High', lastReviewDate: '2025-11-01', notes: 'Persistent A-fib. CHA2DS2-VASc 4 — on apixaban 5mg BID. Rate controlled with metoprolol.' });
  saveActiveProblem({ patientId: s4.id, name: 'Heart Failure with Reduced EF (HFrEF)', icd10: 'I50.20', onset: '2020-03-01', status: 'Chronic', priority: 'High', lastReviewDate: '2025-11-01', notes: 'EF 38% on echo 2024. On metoprolol + furosemide + spironolactone. NYHA Class II.' });
  savePatientDiagnosis({ patientId: s4.id, name: 'COPD', icd10: 'J44.1', onsetDate: '2016-02-01', evidenceNotes: 'PFTs Feb 2016: FEV1/FVC 0.58, FEV1 42% predicted. 45 pack-year smoking history. Now on LAMA monotherapy.' });
  savePatientDiagnosis({ patientId: s4.id, name: 'Atrial Fibrillation', icd10: 'I48.91', onsetDate: '2019-08-01', evidenceNotes: 'Persistent A-fib on ECG Aug 2019. CHA2DS2-VASc score 4. Anticoagulated with apixaban. Rate-controlled (resting HR <80).' });
  savePatientDiagnosis({ patientId: s4.id, name: 'HFrEF', icd10: 'I50.20', onsetDate: '2020-03-01', evidenceNotes: 'Echo Mar 2020: EF 38%, mild LV dilation. NYHA Class II. On GDMT: beta-blocker, loop diuretic, MRA.' });
  saveSocialHistory({ patientId: s4.id, smokingStatus: 'Former smoker (quit 2010)', tobaccoUse: '45 pack-years', alcoholUse: 'None', substanceUse: 'None', occupation: 'Retired pharmacist', maritalStatus: 'Married', livingSituation: 'Lives with wife, single-story home', exercise: 'Very limited — dyspnea on minimal exertion', diet: 'Cardiac diet, 2g Na restriction', notes: 'DNR/DNI on file.' });
  saveFamilyHistory({ patientId: s4.id, mother: 'COPD, HTN — deceased age 74', father: 'MI age 58, T2DM — deceased age 66', siblings: '2 siblings: 1 brother COPD, 1 sister HTN', maternalGrandparents: 'COPD (smokers)', paternalGrandparents: 'CAD', other: '', notes: 'Strong cardiopulmonary family history.' });
  savePatientSurgery({ patientId: s4.id, procedure: 'DC Cardioversion', date: '2019-10-15', hospital: 'University Medical Center', surgeon: 'Dr. Shah', notes: 'Attempted cardioversion for A-fib; sinus rhythm restored briefly, reverted to A-fib within 6 weeks.' });
  const e4a = saveEncounter({ id: generateId(), patientId: s4.id, providerId: p1.id, visitType: 'Outpatient', visitSubtype: 'Primary Care', dateTime: new Date('2025-11-01T11:00:00').toISOString(), status: 'Signed' });
  saveNote({ id: generateId(), encounterId: e4a.id, chiefComplaint: 'CHF/COPD/A-fib management.', hpi: 'James is a 72-year-old male with COPD Gold 3, persistent A-fib, and HFrEF (EF 38%) presenting for quarterly follow-up. Reports stable dyspnea (NYHA Class II). No new edema. Weight stable. No anticoagulation issues.', assessment: '1. COPD (J44.1) — Gold 3, stable. Continue LAMA + rescue inhaler.\n2. A-fib (I48.91) — rate controlled, on apixaban.\n3. HFrEF (I50.20) — compensated, EF 38%, continue GDMT.', plan: '1. Continue tiotropium, albuterol PRN.\n2. Continue apixaban 5mg BID — do not discontinue.\n3. Continue metoprolol 50mg, furosemide 40mg, spironolactone 25mg.\n4. Echo in 6 months to reassess EF.\n5. Cardiology follow-up in 3 months.\n6. Flu and pneumococcal vaccines administered today.', signed: true, signedBy: p1.id, signedAt: new Date('2025-11-01T12:00:00').toISOString(), lastModified: new Date('2025-11-01T12:00:00').toISOString(), addenda: [] });
  saveEncounterVitals({ encounterId: e4a.id, patientId: s4.id, bpSystolic: '122', bpDiastolic: '74', heartRate: '68', respiratoryRate: '18', tempF: '98.0', spo2: '94', weightLbs: '176', heightIn: '70', recordedAt: new Date('2025-11-01T11:05:00').toISOString(), recordedBy: p1.id });
  saveLabResult({ patientId: s4.id, encounterId: e4a.id, panel: 'BNP + BMP', resultDate: new Date('2025-11-01T14:00:00').toISOString(), resultedBy: 'Lab — General Hospital', tests: [{ name: 'BNP', value: '310', unit: 'pg/mL', referenceRange: '<100', flag: 'High' }, { name: 'Creatinine', value: '1.4', unit: 'mg/dL', referenceRange: '0.7–1.3', flag: 'High' }, { name: 'Potassium', value: '4.6', unit: 'mEq/L', referenceRange: '3.5–5.1', flag: 'Normal' }, { name: 'Sodium', value: '136', unit: 'mEq/L', referenceRange: '136–145', flag: 'Normal' }], notes: 'Mildly elevated BNP — stable from prior 340. Mild CKD likely cardiorenal.' });
  saveImmunization({ patientId: s4.id, vaccine: 'Influenza (IIV4)', date: '2025-11-01', lot: 'FL25-A', manufacturer: 'Sanofi', site: 'L deltoid', givenBy: p1.id, nextDue: '2026-10-01', notes: '' });
  saveImmunization({ patientId: s4.id, vaccine: 'Pneumococcal (PCV20)', date: '2025-11-01', lot: 'PN25-B', manufacturer: 'Pfizer', site: 'R deltoid', givenBy: p1.id, nextDue: '', notes: 'Indicated for COPD and age >65.' });

  /* ── 5. Patricia Rodriguez ── */
  const s5 = savePatient({ id: generateId(), mrn: 'MRN002005', firstName: 'Patricia', lastName: 'Rodriguez', dob: '1969-12-04', sex: 'Female', phone: '(555) 310-1005', insurance: 'Medicaid', email: 'patricia.rodriguez@email.com', addressStreet: '225 Pine Street', addressCity: 'Springfield', addressState: 'IL', addressZip: '62702', emergencyContactName: 'Carlos Rodriguez', emergencyContactPhone: '(555) 310-2005', emergencyContactRelationship: 'Son', pharmacyName: 'Walgreens #4422', pharmacyPhone: '(555) 400-5001', pharmacyFax: '(555) 400-5002', panelProviders: [p2.id], createdAt: new Date('2021-04-12').toISOString() });
  savePatientAllergy({ patientId: s5.id, allergen: 'Penicillin', reaction: 'Rash', severity: 'Mild', type: 'Drug' });
  savePatientAllergy({ patientId: s5.id, allergen: 'Sulfonamides', reaction: 'Stevens-Johnson syndrome', severity: 'Life-threatening', type: 'Drug' });
  savePatientMedication({ patientId: s5.id, name: 'Hydroxychloroquine', dose: '200', unit: 'mg', route: 'PO', frequency: 'BID', status: 'Current', startDate: '2015-06-01', indication: 'Systemic Lupus Erythematosus', prescribedBy: 'Dr. Park' });
  savePatientMedication({ patientId: s5.id, name: 'Prednisone', dose: '5', unit: 'mg', route: 'PO', frequency: 'QDay', status: 'Current', startDate: '2023-03-01', indication: 'SLE — maintenance low-dose', prescribedBy: 'Dr. Park' });
  savePatientMedication({ patientId: s5.id, name: 'Levothyroxine', dose: '75', unit: 'mcg', route: 'PO', frequency: 'QDay', status: 'Current', startDate: '2018-09-01', indication: 'Hypothyroidism', prescribedBy: 'Dr. Chen' });
  savePatientMedication({ patientId: s5.id, name: 'Sertraline', dose: '100', unit: 'mg', route: 'PO', frequency: 'QDay', status: 'Current', startDate: '2020-01-01', indication: 'Major Depressive Disorder', prescribedBy: 'Dr. Chen' });
  savePatientMedication({ patientId: s5.id, name: 'Calcium + Vitamin D3', dose: '600/400', unit: 'mg/IU', route: 'PO', frequency: 'BID', status: 'Current', startDate: '2023-03-01', indication: 'Osteoporosis prevention (chronic steroids)', prescribedBy: 'Dr. Chen' });
  saveActiveProblem({ patientId: s5.id, name: 'Systemic Lupus Erythematosus', icd10: 'M32.9', onset: '2015-06-01', status: 'Chronic', priority: 'High', lastReviewDate: '2025-07-10', notes: 'Mucocutaneous and joint involvement. SLEDAI 4 at last rheum visit. On HCQ + low-dose prednisone.' });
  saveActiveProblem({ patientId: s5.id, name: 'Hypothyroidism', icd10: 'E03.9', onset: '2018-09-01', status: 'Chronic', priority: 'Medium', lastReviewDate: '2025-07-10', notes: 'TSH 2.1 (Jul 2025). Well-controlled on levothyroxine 75mcg.' });
  saveActiveProblem({ patientId: s5.id, name: 'Major Depressive Disorder', icd10: 'F33.1', onset: '2020-01-01', status: 'Chronic', priority: 'Medium', lastReviewDate: '2025-07-10', notes: 'Moderate severity. PHQ-9 score 8 (Jul 2025). On sertraline 100mg.' });
  savePatientDiagnosis({ patientId: s5.id, name: 'Systemic Lupus Erythematosus', icd10: 'M32.9', onsetDate: '2015-06-01', evidenceNotes: 'ANA titer 1:320 (homogeneous), anti-dsDNA positive, low complement. Malar rash, oral ulcers, arthritis. ACR/EULAR criteria met.' });
  savePatientDiagnosis({ patientId: s5.id, name: 'Hypothyroidism', icd10: 'E03.9', onsetDate: '2018-09-01', evidenceNotes: 'TSH 8.4 at diagnosis, free T4 0.7 (low). Now well-controlled on levothyroxine. Likely Hashimoto\'s (anti-TPO positive).' });
  saveSocialHistory({ patientId: s5.id, smokingStatus: 'Never smoker', tobaccoUse: 'None', alcoholUse: 'None', substanceUse: 'None', occupation: 'Part-time school aide (limited hours due to illness)', maritalStatus: 'Divorced', livingSituation: 'Lives with adult son', exercise: 'Light — walks when joints permit', diet: 'Anti-inflammatory diet', notes: 'Sunscreen use strictly advised for SLE.' });
  saveFamilyHistory({ patientId: s5.id, mother: 'SLE — alive, age 74', father: 'HTN — deceased age 70 (stroke)', siblings: '2 sisters: 1 SLE, 1 hypothyroidism', maternalGrandparents: 'Autoimmune (unspecified)', paternalGrandparents: 'Unknown', other: '', notes: 'Strong autoimmune clustering in family.' });
  const e5a = saveEncounter({ id: generateId(), patientId: s5.id, providerId: p2.id, visitType: 'Outpatient', visitSubtype: 'Primary Care', dateTime: new Date('2025-07-10T13:00:00').toISOString(), status: 'Signed' });
  saveNote({ id: generateId(), encounterId: e5a.id, chiefComplaint: 'SLE, hypothyroid, depression follow-up.', hpi: 'Patricia is a 55-year-old female with SLE, hypothyroidism, and MDD presenting for follow-up. No SLE flare symptoms (SLEDAI 4, stable). Joint pain mildly improved on HCQ + prednisone. Depression — PHQ-9 score 8, improved from 12. TSH within target range.', assessment: '1. SLE (M32.9) — stable, SLEDAI 4.\n2. Hypothyroidism (E03.9) — well-controlled, TSH 2.1.\n3. MDD (F33.1) — moderate, improving on sertraline 100mg.', plan: '1. Continue hydroxychloroquine 200mg BID; annual eye exam scheduled.\n2. Continue prednisone 5mg QDay; calcium/Vit D for bone protection.\n3. Continue levothyroxine 75mcg; recheck TSH in 6 months.\n4. Continue sertraline 100mg; consider referral to psychiatry if no further improvement.', signed: true, signedBy: p2.id, signedAt: new Date('2025-07-10T14:00:00').toISOString(), lastModified: new Date('2025-07-10T14:00:00').toISOString(), addenda: [] });
  saveEncounterVitals({ encounterId: e5a.id, patientId: s5.id, bpSystolic: '118', bpDiastolic: '72', heartRate: '78', respiratoryRate: '14', tempF: '98.6', spo2: '99', weightLbs: '142', heightIn: '63', recordedAt: new Date('2025-07-10T13:05:00').toISOString(), recordedBy: p2.id });
  saveLabResult({ patientId: s5.id, encounterId: e5a.id, panel: 'Thyroid Panel + CMP', resultDate: new Date('2025-07-10T16:00:00').toISOString(), resultedBy: 'Lab — General Hospital', tests: [{ name: 'TSH', value: '2.1', unit: 'mIU/L', referenceRange: '0.4–4.0', flag: 'Normal' }, { name: 'Free T4', value: '1.2', unit: 'ng/dL', referenceRange: '0.8–1.8', flag: 'Normal' }, { name: 'Creatinine', value: '0.8', unit: 'mg/dL', referenceRange: '0.6–1.1', flag: 'Normal' }, { name: 'ALT', value: '32', unit: 'U/L', referenceRange: '7–56', flag: 'Normal' }], notes: 'Thyroid well-controlled. CMP normal.' });
  saveImmunization({ patientId: s5.id, vaccine: 'Influenza (IIV4)', date: '2024-10-08', lot: 'FL24-F', manufacturer: 'Sanofi', site: 'L deltoid', givenBy: p2.id, nextDue: '2025-10-01', notes: 'Live vaccines contraindicated due to immunosuppression.' });

  /* ── 6. Michael Thompson ── */
  const s6 = savePatient({ id: generateId(), mrn: 'MRN002006', firstName: 'Michael', lastName: 'Thompson', dob: '1979-04-17', sex: 'Male', phone: '(555) 310-1006', insurance: 'Aetna PPO', email: 'michael.thompson@email.com', addressStreet: '610 Maple Terrace', addressCity: 'Springfield', addressState: 'IL', addressZip: '62701', emergencyContactName: 'Jerome Thompson', emergencyContactPhone: '(555) 310-2006', emergencyContactRelationship: 'Brother', pharmacyName: 'CVS Pharmacy #5511', pharmacyPhone: '(555) 400-6001', pharmacyFax: '(555) 400-6002', panelProviders: [p1.id], createdAt: new Date('2020-06-01').toISOString() });
  savePatientAllergy({ patientId: s6.id, allergen: 'Abacavir', reaction: 'Hypersensitivity reaction (fever, rash)', severity: 'Severe', type: 'Drug' });
  savePatientMedication({ patientId: s6.id, name: 'Biktarvy (BIC/TAF/FTC)', dose: '1', unit: 'tablet', route: 'PO', frequency: 'QDay', status: 'Current', startDate: '2020-06-15', indication: 'HIV-1 infection', prescribedBy: 'Dr. Chen' });
  savePatientMedication({ patientId: s6.id, name: 'Lisinopril', dose: '10', unit: 'mg', route: 'PO', frequency: 'QDay', status: 'Current', startDate: '2022-09-01', indication: 'Hypertension', prescribedBy: 'Dr. Chen' });
  savePatientMedication({ patientId: s6.id, name: 'Atorvastatin', dose: '20', unit: 'mg', route: 'PO', frequency: 'QDay', status: 'Current', startDate: '2022-09-01', indication: 'Dyslipidemia', prescribedBy: 'Dr. Chen' });
  saveActiveProblem({ patientId: s6.id, name: 'HIV-1 Infection (on ART)', icd10: 'B20', onset: '2020-05-01', status: 'Chronic', priority: 'High', lastReviewDate: '2025-10-01', notes: 'CD4 680, viral load undetectable on Biktarvy.' });
  saveActiveProblem({ patientId: s6.id, name: 'Essential Hypertension', icd10: 'I10', onset: '2022-09-01', status: 'Chronic', priority: 'Medium', lastReviewDate: '2025-10-01', notes: 'BP 132/80 on lisinopril 10mg.' });
  saveActiveProblem({ patientId: s6.id, name: 'Dyslipidemia', icd10: 'E78.5', onset: '2022-09-01', status: 'Chronic', priority: 'Low', lastReviewDate: '2025-10-01', notes: 'LDL 98 on atorvastatin 20mg.' });
  savePatientDiagnosis({ patientId: s6.id, name: 'HIV-1 Infection', icd10: 'B20', onsetDate: '2020-05-01', evidenceNotes: 'HIV-1 dx May 2020. HLA-B*5701 negative. ART: Biktarvy. CD4 nadir 310 (2020), now 680. Viral load undetectable x 4 years.' });
  saveSocialHistory({ patientId: s6.id, smokingStatus: 'Current smoker — 5 cpd', tobaccoUse: '10 pack-years', alcoholUse: '1–2 drinks/week', substanceUse: 'None', occupation: 'IT security analyst', maritalStatus: 'Single', livingSituation: 'Lives alone', exercise: 'Moderate — gym 3×/week', diet: 'Balanced', notes: 'Counseled on smoking cessation.' });
  saveFamilyHistory({ patientId: s6.id, mother: 'HTN, T2DM — alive, age 68', father: 'Unknown', siblings: '1 brother healthy', maternalGrandparents: 'HTN', paternalGrandparents: 'Unknown', other: '', notes: '' });
  const e6a = saveEncounter({ id: generateId(), patientId: s6.id, providerId: p1.id, visitType: 'Outpatient', visitSubtype: 'Primary Care', dateTime: new Date('2025-10-01T09:00:00').toISOString(), status: 'Signed' });
  saveNote({ id: generateId(), encounterId: e6a.id, chiefComplaint: 'HIV management, annual wellness.', hpi: 'Michael is a 46-year-old male with HIV-1 on ART presenting for annual wellness. Adherent to Biktarvy. CD4 680, VL undetectable. BP mildly elevated at home. No opportunistic infections.', assessment: '1. HIV-1 (B20) — virologically suppressed.\n2. HTN (I10) — near goal.\n3. Dyslipidemia (E78.5) — LDL 98 on statin.\n4. Smoking — cessation counseled.', plan: '1. Continue Biktarvy QDay.\n2. Continue lisinopril 10mg, atorvastatin 20mg.\n3. Offer varenicline for smoking cessation.\n4. CD4/VL in 6 months with ID.', signed: true, signedBy: p1.id, signedAt: new Date('2025-10-01T10:00:00').toISOString(), lastModified: new Date('2025-10-01T10:00:00').toISOString(), addenda: [] });
  saveEncounterVitals({ encounterId: e6a.id, patientId: s6.id, bpSystolic: '136', bpDiastolic: '84', heartRate: '74', respiratoryRate: '14', tempF: '98.4', spo2: '98', weightLbs: '182', heightIn: '71', recordedAt: new Date('2025-10-01T09:05:00').toISOString(), recordedBy: p1.id });
  saveLabResult({ patientId: s6.id, encounterId: e6a.id, panel: 'HIV Panel', resultDate: new Date('2025-10-01T12:00:00').toISOString(), resultedBy: 'Lab — General Hospital', tests: [{ name: 'CD4 Count', value: '680', unit: 'cells/uL', referenceRange: '>500', flag: 'Normal' }, { name: 'HIV Viral Load', value: '<20', unit: 'copies/mL', referenceRange: 'Undetectable', flag: 'Normal' }, { name: 'Creatinine', value: '1.0', unit: 'mg/dL', referenceRange: '0.7–1.3', flag: 'Normal' }], notes: 'Excellent virologic control.' });
  saveImmunization({ patientId: s6.id, vaccine: 'Influenza (IIV4)', date: '2024-10-01', lot: 'FL24-G', manufacturer: 'Sanofi', site: 'L deltoid', givenBy: p1.id, nextDue: '2025-10-01', notes: '' });

  /* ── 7. Dorothy Williams ── */
  const s7 = savePatient({ id: generateId(), mrn: 'MRN002007', firstName: 'Dorothy', lastName: 'Williams', dob: '1946-02-28', sex: 'Female', phone: '(555) 310-1007', insurance: 'Medicare', email: '', addressStreet: '1441 Chestnut Ave', addressCity: 'Springfield', addressState: 'IL', addressZip: '62703', emergencyContactName: 'Barbara Williams', emergencyContactPhone: '(555) 310-2007', emergencyContactRelationship: 'Daughter', pharmacyName: 'CVS Pharmacy #6622', pharmacyPhone: '(555) 400-7001', pharmacyFax: '(555) 400-7002', panelProviders: [p2.id], createdAt: new Date('2019-03-15').toISOString() });
  savePatientAllergy({ patientId: s7.id, allergen: 'Aspirin', reaction: 'GI bleeding', severity: 'Severe', type: 'Drug' });
  savePatientMedication({ patientId: s7.id, name: 'Donepezil', dose: '10', unit: 'mg', route: 'PO', frequency: 'QNight', status: 'Current', startDate: '2021-06-01', indication: "Alzheimer's dementia" });
  savePatientMedication({ patientId: s7.id, name: 'Memantine', dose: '10', unit: 'mg', route: 'PO', frequency: 'BID', status: 'Current', startDate: '2023-01-01', indication: "Moderate Alzheimer's" });
  savePatientMedication({ patientId: s7.id, name: 'Apixaban', dose: '2.5', unit: 'mg', route: 'PO', frequency: 'BID', status: 'Current', startDate: '2020-04-01', indication: 'A-fib (reduced dose)' });
  savePatientMedication({ patientId: s7.id, name: 'Alendronate', dose: '70', unit: 'mg', route: 'PO', frequency: 'Weekly', status: 'Current', startDate: '2020-01-01', indication: 'Osteoporosis' });
  saveActiveProblem({ patientId: s7.id, name: "Alzheimer's Dementia — Moderate", icd10: 'G30.9', onset: '2021-06-01', status: 'Chronic', priority: 'High', lastReviewDate: '2025-09-05', notes: 'MMSE 16/30. Dependent for IADLs. Daughter is primary caregiver.' });
  saveActiveProblem({ patientId: s7.id, name: 'Atrial Fibrillation', icd10: 'I48.91', onset: '2020-04-01', status: 'Chronic', priority: 'High', lastReviewDate: '2025-09-05', notes: 'Persistent A-fib. CHA2DS2-VASc 6. Low-dose apixaban.' });
  saveActiveProblem({ patientId: s7.id, name: 'Osteoporosis', icd10: 'M81.0', onset: '2020-01-01', status: 'Chronic', priority: 'Medium', lastReviewDate: '2025-09-05', notes: 'T-score -2.8. On alendronate weekly.' });
  savePatientDiagnosis({ patientId: s7.id, name: "Alzheimer's Dementia", icd10: 'G30.9', onsetDate: '2021-06-01', evidenceNotes: 'MRI 2021: cortical atrophy, hippocampal volume loss. MMSE 24 (2021), now 16. PET: amyloid positive.' });
  savePatientDiagnosis({ patientId: s7.id, name: 'Osteoporosis', icd10: 'M81.0', onsetDate: '2020-01-01', evidenceNotes: 'DEXA 2020: lumbar T-score -2.8. Prior L1 compression fracture (2019).' });
  saveSocialHistory({ patientId: s7.id, smokingStatus: 'Former smoker (quit 1985)', tobaccoUse: '10 pack-years', alcoholUse: 'None', substanceUse: 'None', occupation: 'Retired schoolteacher', maritalStatus: 'Widowed (2018)', livingSituation: 'Lives with daughter — full-time caregiver', exercise: 'Supervised walking only', diet: 'Soft diet', notes: 'Fall risk. Walker in use. No driving.' });
  saveFamilyHistory({ patientId: s7.id, mother: 'Dementia — deceased age 84', father: 'Stroke, HTN — deceased age 76', siblings: '1 sister: dementia', maternalGrandparents: 'Dementia', paternalGrandparents: 'Stroke', other: '', notes: 'Strong dementia history.' });
  savePatientSurgery({ patientId: s7.id, procedure: 'Right Total Hip Replacement', date: '2016-04-10', hospital: 'General Hospital', surgeon: 'Dr. Kowalski', notes: 'Right hip OA. Uncomplicated.' });
  const e7a = saveEncounter({ id: generateId(), patientId: s7.id, providerId: p2.id, visitType: 'Outpatient', visitSubtype: 'Primary Care', dateTime: new Date('2025-09-05T10:30:00').toISOString(), status: 'Signed' });
  saveNote({ id: generateId(), encounterId: e7a.id, chiefComplaint: 'Dementia care review. Accompanied by daughter.', hpi: "Dorothy is a 79-year-old female with moderate Alzheimer's, A-fib, osteoporosis. Daughter reports mild worsening confusion. No falls in 3 months. MMSE 16.", assessment: "1. Alzheimer's (G30.9) — moderate, gradual progression.\n2. A-fib (I48.91) — rate-controlled, anticoagulated.\n3. Osteoporosis (M81.0) — stable.", plan: '1. Continue donepezil + memantine.\n2. Continue apixaban 2.5mg BID.\n3. Continue alendronate + calcium/Vit D.\n4. Neurology referral.\n5. OT for home safety.', signed: true, signedBy: p2.id, signedAt: new Date('2025-09-05T11:30:00').toISOString(), lastModified: new Date('2025-09-05T11:30:00').toISOString(), addenda: [] });
  saveEncounterVitals({ encounterId: e7a.id, patientId: s7.id, bpSystolic: '124', bpDiastolic: '70', heartRate: '72', respiratoryRate: '16', tempF: '97.8', spo2: '96', weightLbs: '118', heightIn: '60', recordedAt: new Date('2025-09-05T10:35:00').toISOString(), recordedBy: p2.id });
  saveImmunization({ patientId: s7.id, vaccine: 'Influenza High-Dose', date: '2024-10-12', lot: 'FHD24-A', manufacturer: 'Sanofi', site: 'L deltoid', givenBy: p2.id, nextDue: '2025-10-01', notes: 'High-dose for age ≥65.' });

  /* ── 8. Carlos Mendez ── */
  const s8 = savePatient({ id: generateId(), mrn: 'MRN002008', firstName: 'Carlos', lastName: 'Mendez', dob: '1991-07-14', sex: 'Male', phone: '(555) 310-1008', insurance: 'BlueCross PPO', email: 'carlos.mendez@email.com', addressStreet: '88 Cedar Lane', addressCity: 'Springfield', addressState: 'IL', addressZip: '62705', emergencyContactName: 'Rosa Mendez', emergencyContactPhone: '(555) 310-2008', emergencyContactRelationship: 'Mother', pharmacyName: 'Walgreens #7733', pharmacyPhone: '(555) 400-8001', pharmacyFax: '(555) 400-8002', panelProviders: [p1.id], createdAt: new Date('2021-11-20').toISOString() });
  savePatientAllergy({ patientId: s8.id, allergen: 'Latex', reaction: 'Urticaria, bronchospasm', severity: 'Severe', type: 'Environmental' });
  savePatientMedication({ patientId: s8.id, name: 'Fluticasone/Salmeterol (Advair 250/50)', dose: '1', unit: 'puff', route: 'Inhaled', frequency: 'BID', status: 'Current', startDate: '2019-03-01', indication: 'Moderate persistent asthma' });
  savePatientMedication({ patientId: s8.id, name: 'Albuterol MDI', dose: '90', unit: 'mcg', route: 'Inhaled', frequency: 'PRN', status: 'Current', startDate: '2015-06-01', indication: 'Asthma rescue' });
  savePatientMedication({ patientId: s8.id, name: 'Escitalopram', dose: '10', unit: 'mg', route: 'PO', frequency: 'QDay', status: 'Current', startDate: '2022-02-01', indication: 'Generalized Anxiety Disorder' });
  saveActiveProblem({ patientId: s8.id, name: 'Asthma — Moderate Persistent', icd10: 'J45.40', onset: '2012-01-01', status: 'Chronic', priority: 'High', lastReviewDate: '2025-06-15', notes: 'On ICS/LABA. FEV1 78%. 0 ED visits this year.' });
  saveActiveProblem({ patientId: s8.id, name: 'Generalized Anxiety Disorder', icd10: 'F41.1', onset: '2022-02-01', status: 'Chronic', priority: 'Medium', lastReviewDate: '2025-06-15', notes: 'GAD-7 score 9. On escitalopram 10mg.' });
  savePatientDiagnosis({ patientId: s8.id, name: 'Asthma', icd10: 'J45.40', onsetDate: '2012-01-01', evidenceNotes: 'Spirometry 2019: FEV1 78%, bronchodilator reversibility 15%. Moderate persistent.' });
  saveSocialHistory({ patientId: s8.id, smokingStatus: 'Never smoker', tobaccoUse: 'None', alcoholUse: 'Social', substanceUse: 'Occasional marijuana (counseled — worsens asthma)', occupation: 'Personal trainer', maritalStatus: 'Single', livingSituation: 'Apartment with roommate', exercise: 'Very active — gym daily', diet: 'High protein', notes: '' });
  saveFamilyHistory({ patientId: s8.id, mother: 'Asthma, allergic rhinitis', father: 'HTN', siblings: '1 sister: asthma', maternalGrandparents: 'Asthma', paternalGrandparents: 'Unknown', other: '', notes: 'Atopic family.' });
  const e8a = saveEncounter({ id: generateId(), patientId: s8.id, providerId: p1.id, visitType: 'Outpatient', visitSubtype: 'Primary Care', dateTime: new Date('2025-06-15T15:00:00').toISOString(), status: 'Signed' });
  saveNote({ id: generateId(), encounterId: e8a.id, chiefComplaint: 'Asthma and anxiety review.', hpi: 'Carlos, 33-year-old male, presents for asthma/anxiety follow-up. Rescue inhaler ~1×/week. No nighttime symptoms. Anxiety improving on escitalopram, GAD-7 down from 14 to 9.', assessment: '1. Asthma (J45.40) — well-controlled.\n2. GAD (F41.1) — improving on escitalopram.', plan: '1. Continue Advair 250/50 BID + albuterol PRN.\n2. Continue escitalopram 10mg; consider uptitrating to 20mg.\n3. Spirometry in 1 year.', signed: true, signedBy: p1.id, signedAt: new Date('2025-06-15T16:00:00').toISOString(), lastModified: new Date('2025-06-15T16:00:00').toISOString(), addenda: [] });
  saveEncounterVitals({ encounterId: e8a.id, patientId: s8.id, bpSystolic: '118', bpDiastolic: '72', heartRate: '68', respiratoryRate: '14', tempF: '98.6', spo2: '98', weightLbs: '172', heightIn: '70', recordedAt: new Date('2025-06-15T15:05:00').toISOString(), recordedBy: p1.id });
  saveImmunization({ patientId: s8.id, vaccine: 'Influenza (IIV4)', date: '2024-10-05', lot: 'FL24-H', manufacturer: 'Sanofi', site: 'L deltoid', givenBy: p1.id, nextDue: '2025-10-01', notes: '' });

  /* ── 9. Helen Fischer ── */
  const s9 = savePatient({ id: generateId(), mrn: 'MRN002009', firstName: 'Helen', lastName: 'Fischer', dob: '1963-09-01', sex: 'Female', phone: '(555) 310-1009', insurance: 'UnitedHealthcare', email: 'helen.fischer@email.com', addressStreet: '430 Sycamore Road', addressCity: 'Springfield', addressState: 'IL', addressZip: '62704', emergencyContactName: 'Otto Fischer', emergencyContactPhone: '(555) 310-2009', emergencyContactRelationship: 'Husband', pharmacyName: 'CVS Pharmacy #8844', pharmacyPhone: '(555) 400-9001', pharmacyFax: '(555) 400-9002', panelProviders: [p2.id], createdAt: new Date('2020-11-01').toISOString() });
  savePatientAllergy({ patientId: s9.id, allergen: 'Tamoxifen', reaction: 'DVT', severity: 'Severe', type: 'Drug' });
  savePatientMedication({ patientId: s9.id, name: 'Anastrozole', dose: '1', unit: 'mg', route: 'PO', frequency: 'QDay', status: 'Current', startDate: '2021-03-01', indication: 'Breast cancer adjuvant' });
  savePatientMedication({ patientId: s9.id, name: 'Levothyroxine', dose: '100', unit: 'mcg', route: 'PO', frequency: 'QDay', status: 'Current', startDate: '2015-05-01', indication: 'Hypothyroidism' });
  savePatientMedication({ patientId: s9.id, name: 'Alendronate', dose: '70', unit: 'mg', route: 'PO', frequency: 'Weekly', status: 'Current', startDate: '2021-06-01', indication: 'Anastrozole-induced osteoporosis' });
  saveActiveProblem({ patientId: s9.id, name: 'Breast Cancer (Stage IIA, ER+) — Remission', icd10: 'C50.911', onset: '2020-11-01', status: 'Active', priority: 'High', lastReviewDate: '2025-11-10', notes: '5-year disease-free on anastrozole through 2026.' });
  saveActiveProblem({ patientId: s9.id, name: 'Hypothyroidism', icd10: 'E03.9', onset: '2015-05-01', status: 'Chronic', priority: 'Medium', lastReviewDate: '2025-11-10', notes: 'TSH 1.8. Stable on levothyroxine 100mcg.' });
  saveActiveProblem({ patientId: s9.id, name: 'Osteoporosis', icd10: 'M81.0', onset: '2021-06-01', status: 'Chronic', priority: 'Medium', lastReviewDate: '2025-11-10', notes: 'Anastrozole-induced. T-score -2.2. On alendronate.' });
  savePatientDiagnosis({ patientId: s9.id, name: 'Breast Cancer ER+', icd10: 'C50.911', onsetDate: '2020-11-01', evidenceNotes: 'R breast IDC ER+/PR+/HER2−. Lumpectomy + radiation. AC-T chemo completed. 5-year anastrozole course.' });
  saveSocialHistory({ patientId: s9.id, smokingStatus: 'Never smoker', tobaccoUse: 'None', alcoholUse: '1–2 drinks/week', substanceUse: 'None', occupation: 'High school librarian', maritalStatus: 'Married', livingSituation: 'Lives with husband', exercise: 'Moderate — walks, yoga', diet: 'Plant-based', notes: 'Cancer survivors group.' });
  saveFamilyHistory({ patientId: s9.id, mother: 'Breast cancer (ER+, dx 58) — alive, age 82', father: 'Prostate cancer', siblings: '1 sister: breast cancer (2022)', maternalGrandparents: 'Breast cancer (grandmother)', paternalGrandparents: 'Unknown', other: '', notes: 'BRCA1/2 testing negative (2020).' });
  savePatientSurgery({ patientId: s9.id, procedure: 'Right Breast Lumpectomy + Sentinel Node Biopsy', date: '2020-12-08', hospital: 'University Medical Center', surgeon: 'Dr. Martinez', notes: '1 of 3 nodes positive. Clean margins. Radiation completed 2021.' });
  const e9a = saveEncounter({ id: generateId(), patientId: s9.id, providerId: p2.id, visitType: 'Outpatient', visitSubtype: 'Primary Care', dateTime: new Date('2025-11-10T11:00:00').toISOString(), status: 'Signed' });
  saveNote({ id: generateId(), encounterId: e9a.id, chiefComplaint: 'Breast cancer surveillance, hypothyroid, osteoporosis.', hpi: 'Helen, 62-year-old, presents for follow-up. No new breast symptoms. Anastrozole tolerated. TSH stable. No fractures.', assessment: '1. Breast CA remission (C50.911) — year 5, no recurrence.\n2. Hypothyroidism (E03.9) — TSH 1.8, well-controlled.\n3. Osteoporosis (M81.0) — T-score -2.2, stable.', plan: '1. Continue anastrozole through 2026.\n2. Continue levothyroxine 100mcg.\n3. Continue alendronate weekly.\n4. Annual mammography.\n5. DEXA in 1 year.', signed: true, signedBy: p2.id, signedAt: new Date('2025-11-10T12:00:00').toISOString(), lastModified: new Date('2025-11-10T12:00:00').toISOString(), addenda: [] });
  saveEncounterVitals({ encounterId: e9a.id, patientId: s9.id, bpSystolic: '122', bpDiastolic: '76', heartRate: '70', respiratoryRate: '14', tempF: '98.2', spo2: '99', weightLbs: '148', heightIn: '65', recordedAt: new Date('2025-11-10T11:05:00').toISOString(), recordedBy: p2.id });
  saveLabResult({ patientId: s9.id, encounterId: e9a.id, panel: 'Thyroid + Calcium', resultDate: new Date('2025-11-10T14:00:00').toISOString(), resultedBy: 'Lab — General Hospital', tests: [{ name: 'TSH', value: '1.8', unit: 'mIU/L', referenceRange: '0.4–4.0', flag: 'Normal' }, { name: 'Calcium', value: '9.4', unit: 'mg/dL', referenceRange: '8.5–10.5', flag: 'Normal' }, { name: 'Vitamin D (25-OH)', value: '38', unit: 'ng/mL', referenceRange: '30–100', flag: 'Normal' }], notes: 'Thyroid stable. Vit D adequate.' });
  saveImmunization({ patientId: s9.id, vaccine: 'Influenza (IIV4)', date: '2024-10-18', lot: 'FL24-I', manufacturer: 'Sanofi', site: 'L deltoid', givenBy: p2.id, nextDue: '2025-10-01', notes: '' });

  /* ── 10. Raymond Brooks ── */
  const s10 = savePatient({ id: generateId(), mrn: 'MRN002010', firstName: 'Raymond', lastName: 'Brooks', dob: '1957-01-19', sex: 'Male', phone: '(555) 310-1010', insurance: 'Medicare', email: 'raymond.brooks@email.com', addressStreet: '715 Magnolia Drive', addressCity: 'Springfield', addressState: 'IL', addressZip: '62702', emergencyContactName: 'Denise Brooks', emergencyContactPhone: '(555) 310-2010', emergencyContactRelationship: 'Wife', pharmacyName: 'Walgreens #8855', pharmacyPhone: '(555) 400-0001', pharmacyFax: '(555) 400-0002', panelProviders: [p1.id], createdAt: new Date('2018-04-22').toISOString() });
  savePatientAllergy({ patientId: s10.id, allergen: 'Penicillin', reaction: 'Rash', severity: 'Mild', type: 'Drug' });
  savePatientMedication({ patientId: s10.id, name: 'Insulin glargine', dose: '28', unit: 'units', route: 'Subcutaneous', frequency: 'QNight', status: 'Current', startDate: '2021-03-01', indication: 'Type 2 Diabetes' });
  savePatientMedication({ patientId: s10.id, name: 'Metformin', dose: '500', unit: 'mg', route: 'PO', frequency: 'BID', status: 'Current', startDate: '2015-01-01', indication: 'Type 2 Diabetes' });
  savePatientMedication({ patientId: s10.id, name: 'Lisinopril', dose: '10', unit: 'mg', route: 'PO', frequency: 'QDay', status: 'Current', startDate: '2015-06-01', indication: 'HTN/CKD protection' });
  savePatientMedication({ patientId: s10.id, name: 'Atorvastatin', dose: '80', unit: 'mg', route: 'PO', frequency: 'QDay', status: 'Current', startDate: '2018-01-01', indication: 'PAD/dyslipidemia' });
  savePatientMedication({ patientId: s10.id, name: 'Clopidogrel', dose: '75', unit: 'mg', route: 'PO', frequency: 'QDay', status: 'Current', startDate: '2018-06-01', indication: 'PAD antiplatelet' });
  saveActiveProblem({ patientId: s10.id, name: 'Type 2 Diabetes Mellitus', icd10: 'E11.9', onset: '2015-01-01', status: 'Chronic', priority: 'High', lastReviewDate: '2025-10-20', notes: 'HbA1c 8.1%. On metformin + basal insulin.' });
  saveActiveProblem({ patientId: s10.id, name: 'Peripheral Artery Disease', icd10: 'I73.9', onset: '2018-06-01', status: 'Chronic', priority: 'High', lastReviewDate: '2025-10-20', notes: 'ABI 0.62 bilateral. Claudication at 1 block.' });
  saveActiveProblem({ patientId: s10.id, name: 'CKD Stage 4', icd10: 'N18.4', onset: '2022-01-01', status: 'Chronic', priority: 'High', lastReviewDate: '2025-10-20', notes: 'eGFR 22. Preparing for renal replacement therapy.' });
  savePatientDiagnosis({ patientId: s10.id, name: 'Peripheral Artery Disease', icd10: 'I73.9', onsetDate: '2018-06-01', evidenceNotes: 'ABI 0.62 bilateral. MRA: bilateral SFA disease. On antiplatelet + statin.' });
  savePatientDiagnosis({ patientId: s10.id, name: 'CKD Stage 4', icd10: 'N18.4', onsetDate: '2022-01-01', evidenceNotes: 'eGFR 22 (down from 38 in 2020). T2DM + HTN etiology. Proteinuria 800 mg/g. AV fistula placed 2024.' });
  saveSocialHistory({ patientId: s10.id, smokingStatus: 'Former smoker (quit 2012)', tobaccoUse: '35 pack-years', alcoholUse: 'None', substanceUse: 'None', occupation: 'Retired truck driver', maritalStatus: 'Married', livingSituation: 'Lives with wife', exercise: 'Very limited — claudication', diet: 'Diabetic + renal diet', notes: 'On transplant evaluation list.' });
  saveFamilyHistory({ patientId: s10.id, mother: 'T2DM — deceased age 72 (ESRD)', father: 'HTN, MI — deceased age 65', siblings: '1 brother: T2DM, amputee (PAD)', maternalGrandparents: 'T2DM', paternalGrandparents: 'CAD', other: '', notes: 'High-risk vascular/metabolic family history.' });
  savePatientSurgery({ patientId: s10.id, procedure: 'AV Fistula Creation (left forearm)', date: '2024-08-15', hospital: 'University Medical Center', surgeon: 'Dr. Okafor', notes: 'Anticipatory dialysis access. Fistula maturing.' });
  const e10a = saveEncounter({ id: generateId(), patientId: s10.id, providerId: p1.id, visitType: 'Outpatient', visitSubtype: 'Primary Care', dateTime: new Date('2025-10-20T08:30:00').toISOString(), status: 'Signed' });
  saveNote({ id: generateId(), encounterId: e10a.id, chiefComplaint: 'T2DM, CKD 4, PAD quarterly follow-up.', hpi: 'Raymond, 68-year-old with T2DM, CKD 4, PAD. eGFR 22 stable. Claudication unchanged. AV fistula placed 2024.', assessment: '1. T2DM (E11.9) — HbA1c 8.1%, uptitrate insulin.\n2. CKD Stage 4 (N18.4) — eGFR 22, pre-dialysis planning.\n3. PAD (I73.9) — stable.', plan: '1. Increase insulin glargine to 32 units QNight.\n2. Continue metformin (hold if eGFR <30), clopidogrel, atorvastatin.\n3. Nephrology in 4 weeks.\n4. Foot exam — no ulcers.', signed: true, signedBy: p1.id, signedAt: new Date('2025-10-20T09:30:00').toISOString(), lastModified: new Date('2025-10-20T09:30:00').toISOString(), addenda: [] });
  saveEncounterVitals({ encounterId: e10a.id, patientId: s10.id, bpSystolic: '148', bpDiastolic: '88', heartRate: '78', respiratoryRate: '16', tempF: '98.0', spo2: '96', weightLbs: '198', heightIn: '70', recordedAt: new Date('2025-10-20T08:35:00').toISOString(), recordedBy: p1.id });
  saveLabResult({ patientId: s10.id, encounterId: e10a.id, panel: 'CMP + HbA1c', resultDate: new Date('2025-10-20T11:00:00').toISOString(), resultedBy: 'Lab — General Hospital', tests: [{ name: 'eGFR', value: '22', unit: 'mL/min/1.73m²', referenceRange: '>60', flag: 'Low' }, { name: 'Creatinine', value: '2.9', unit: 'mg/dL', referenceRange: '0.7–1.3', flag: 'High' }, { name: 'Potassium', value: '5.1', unit: 'mEq/L', referenceRange: '3.5–5.1', flag: 'Normal' }, { name: 'Phosphorus', value: '5.4', unit: 'mg/dL', referenceRange: '2.5–4.5', flag: 'High' }, { name: 'HbA1c', value: '8.1', unit: '%', referenceRange: '<7.0', flag: 'High' }, { name: 'Hemoglobin', value: '10.2', unit: 'g/dL', referenceRange: '13.5–17.5', flag: 'Low' }], notes: 'CKD 4, anemia of CKD, hyperphosphatemia, HbA1c above target.' });
  saveImmunization({ patientId: s10.id, vaccine: 'Hepatitis B series (complete)', date: '2022-10-01', lot: 'HB22-C', manufacturer: 'Merck', site: 'R deltoid', givenBy: p1.id, nextDue: '', notes: 'Pre-dialysis indication.' });
  saveImmunization({ patientId: s10.id, vaccine: 'Influenza (IIV4)', date: '2024-10-22', lot: 'FL24-J', manufacturer: 'Sanofi', site: 'L deltoid', givenBy: p1.id, nextDue: '2025-10-01', notes: '' });

  // ── Patient 11: Jennifer Park ──────────────────────────────────────
  const s11 = savePatient({ id: generateId(), mrn: 'MRN002011', firstName: 'Jennifer', lastName: 'Park', dob: '1984-06-15', sex: 'Female', phone: '(555) 310-1011', insurance: 'Cigna HMO', email: 'jennifer.park@email.com', addressStreet: '202 Clover Street', addressCity: 'Springfield', addressState: 'IL', addressZip: '62701', emergencyContactName: 'Daniel Park', emergencyContactPhone: '(555) 310-2011', emergencyContactRelationship: 'Husband', pharmacyName: 'CVS Pharmacy #9900', pharmacyPhone: '(555) 400-1101', pharmacyFax: '(555) 400-1102', panelProviders: [p1.id], createdAt: new Date('2022-03-08').toISOString() });
  saveAllergy({ patientId: s11.id, allergen: 'Sulfonamides', reaction: 'Rash', severity: 'Moderate', recordedBy: p1.id, recordedAt: new Date('2022-03-08').toISOString() });
  saveMedication({ patientId: s11.id, drug: 'Levothyroxine', dose: '75', unit: 'mcg', route: 'Oral', frequency: 'QAM', status: 'Active', prescribedBy: p1.id, startDate: '2020-01-10', instructions: 'Take on empty stomach 30 min before breakfast.' });
  saveMedication({ patientId: s11.id, drug: 'Escitalopram', dose: '10', unit: 'mg', route: 'Oral', frequency: 'Daily', status: 'Active', prescribedBy: p1.id, startDate: '2023-07-01', instructions: 'Take in the morning.' });
  saveMedication({ patientId: s11.id, drug: 'Prenatal vitamin', dose: '1', unit: 'tablet', route: 'Oral', frequency: 'Daily', status: 'Active', prescribedBy: p1.id, startDate: '2024-02-01', instructions: '' });
  saveDiagnosis({ patientId: s11.id, code: 'E03.9', description: 'Hypothyroidism, unspecified', diagnosedDate: '2020-01-10', status: 'Active', providerId: p1.id });
  saveDiagnosis({ patientId: s11.id, code: 'F32.1', description: 'Major depressive disorder, single episode, moderate', diagnosedDate: '2023-07-01', status: 'Active', providerId: p1.id });
  saveDiagnosis({ patientId: s11.id, code: 'Z34.39', description: 'Encounter for supervision of other normal pregnancy', diagnosedDate: '2024-02-14', status: 'Active', providerId: p1.id });
  saveDiagnosis({ patientId: s11.id, code: 'N92.0', description: 'Excessive and frequent menstruation with regular cycle', diagnosedDate: '2018-05-01', status: 'Resolved', providerId: p1.id });
  saveSocialHistory({ patientId: s11.id, smokingStatus: 'Never', alcoholUse: 'Occasional (1-2 drinks/week)', recreationalDrugUse: 'None', exerciseFrequency: '3x/week', occupation: 'Graphic designer', maritalStatus: 'Married', livingSituation: 'Lives with husband and one child' });
  saveFamilyHistory({ patientId: s11.id, relation: 'Mother', condition: 'Hypothyroidism, breast cancer (age 55)' });
  saveFamilyHistory({ patientId: s11.id, relation: 'Father', condition: 'Type 2 diabetes, hypertension' });
  const e11a = saveEncounter({ id: generateId(), patientId: s11.id, providerId: p1.id, visitType: 'Outpatient', visitSubtype: 'Primary Care', dateTime: new Date('2025-08-12T10:00:00').toISOString(), status: 'Signed' });
  saveNote({ id: generateId(), encounterId: e11a.id, chiefComplaint: 'Prenatal visit 28 weeks, thyroid check.', hpi: 'Jennifer is 28 weeks pregnant. TSH 4.2 — above target for pregnancy. Mood stable on escitalopram. No adverse prenatal symptoms.', assessment: '1. Hypothyroidism (E03.9) — TSH above target (goal <2.5 in pregnancy); uptitrate levothyroxine.\n2. Normal pregnancy 28 weeks (Z34.39) — fetal movements present.\n3. MDD (F32.1) — stable on escitalopram; safe to continue in pregnancy.', plan: '1. Increase levothyroxine to 88 mcg QAM.\n2. Recheck TSH in 4 weeks.\n3. Continue escitalopram 10 mg.\n4. OB referral confirmed — 30-week anatomy review.\n5. Continue prenatal vitamins.', signed: true, signedBy: p1.id, signedAt: new Date('2025-08-12T11:00:00').toISOString(), lastModified: new Date('2025-08-12T11:00:00').toISOString(), addenda: [] });
  saveEncounterVitals({ encounterId: e11a.id, patientId: s11.id, bpSystolic: '112', bpDiastolic: '70', heartRate: '88', respiratoryRate: '18', tempF: '98.4', spo2: '99', weightLbs: '156', heightIn: '64', recordedAt: new Date('2025-08-12T10:05:00').toISOString(), recordedBy: p1.id });
  saveLabResult({ patientId: s11.id, encounterId: e11a.id, panel: 'TSH + Free T4', resultDate: new Date('2025-08-12T13:00:00').toISOString(), resultedBy: 'Lab — General Hospital', tests: [{ name: 'TSH', value: '4.2', unit: 'mIU/L', referenceRange: '0.4–4.0 (0.1–2.5 in pregnancy)', flag: 'High' }, { name: 'Free T4', value: '0.9', unit: 'ng/dL', referenceRange: '0.8–1.8', flag: 'Normal' }], notes: 'TSH above pregnancy target; uptitrate levothyroxine.' });
  saveImmunization({ patientId: s11.id, vaccine: 'Tdap', date: '2024-06-15', lot: 'TD24-P', manufacturer: 'GSK', site: 'L deltoid', givenBy: p1.id, nextDue: '', notes: 'Prenatal Tdap.' });

  // ── Patient 12: Frank Novak ────────────────────────────────────────
  const s12 = savePatient({ id: generateId(), mrn: 'MRN002012', firstName: 'Frank', lastName: 'Novak', dob: '1949-11-03', sex: 'Male', phone: '(555) 310-1012', insurance: 'Medicare', email: '', addressStreet: '88 Ironwood Road', addressCity: 'Springfield', addressState: 'IL', addressZip: '62703', emergencyContactName: 'Anna Novak', emergencyContactPhone: '(555) 310-2012', emergencyContactRelationship: 'Wife', pharmacyName: 'Walgreens #1234', pharmacyPhone: '(555) 400-1201', pharmacyFax: '(555) 400-1202', panelProviders: [p2.id], createdAt: new Date('2017-09-01').toISOString() });
  saveAllergy({ patientId: s12.id, allergen: 'Aspirin', reaction: 'GI bleed', severity: 'Severe', recordedBy: p2.id, recordedAt: new Date('2017-09-01').toISOString() });
  saveMedication({ patientId: s12.id, drug: 'Warfarin', dose: '5', unit: 'mg', route: 'Oral', frequency: 'Daily', status: 'Active', prescribedBy: p2.id, startDate: '2018-03-01', instructions: 'INR target 2.0–3.0. Avoid NSAIDs.' });
  saveMedication({ patientId: s12.id, drug: 'Metoprolol succinate', dose: '50', unit: 'mg', route: 'Oral', frequency: 'Daily', status: 'Active', prescribedBy: p2.id, startDate: '2018-03-01', instructions: '' });
  saveMedication({ patientId: s12.id, drug: 'Furosemide', dose: '40', unit: 'mg', route: 'Oral', frequency: 'Daily', status: 'Active', prescribedBy: p2.id, startDate: '2020-06-10', instructions: 'Take in the morning.' });
  saveMedication({ patientId: s12.id, drug: 'Spironolactone', dose: '25', unit: 'mg', route: 'Oral', frequency: 'Daily', status: 'Active', prescribedBy: p2.id, startDate: '2020-06-10', instructions: 'Monitor potassium.' });
  saveMedication({ patientId: s12.id, drug: 'Sacubitril-valsartan', dose: '24-26', unit: 'mg', route: 'Oral', frequency: 'BID', status: 'Active', prescribedBy: p2.id, startDate: '2021-02-15', instructions: 'Do not use with ACE inhibitor within 36 hours.' });
  saveDiagnosis({ patientId: s12.id, code: 'I50.22', description: 'Chronic systolic (congestive) heart failure', diagnosedDate: '2018-02-20', status: 'Active', providerId: p2.id });
  saveDiagnosis({ patientId: s12.id, code: 'I48.91', description: 'Unspecified atrial fibrillation', diagnosedDate: '2018-02-20', status: 'Active', providerId: p2.id });
  saveDiagnosis({ patientId: s12.id, code: 'J44.1', description: 'COPD with acute exacerbation', diagnosedDate: '2019-11-15', status: 'Active', providerId: p2.id });
  saveDiagnosis({ patientId: s12.id, code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', diagnosedDate: '2010-04-01', status: 'Active', providerId: p2.id });
  saveSocialHistory({ patientId: s12.id, smokingStatus: 'Former smoker (quit 2018, 40 pack-years)', alcoholUse: 'None', recreationalDrugUse: 'None', exerciseFrequency: 'Sedentary', occupation: 'Retired machinist', maritalStatus: 'Married', livingSituation: 'Lives with wife' });
  saveFamilyHistory({ patientId: s12.id, relation: 'Father', condition: 'CAD (MI age 62, fatal)' });
  saveFamilyHistory({ patientId: s12.id, relation: 'Brother', condition: 'Heart failure, COPD' });
  const e12a = saveEncounter({ id: generateId(), patientId: s12.id, providerId: p2.id, visitType: 'Outpatient', visitSubtype: 'Primary Care', dateTime: new Date('2025-09-04T09:00:00').toISOString(), status: 'Signed' });
  saveNote({ id: generateId(), encounterId: e12a.id, chiefComplaint: 'CHF, Afib, COPD follow-up; increased leg edema.', hpi: 'Frank, 75-year-old with CHF (EF 35%), Afib on warfarin, COPD. Reports 3 days of worsening lower extremity edema and dyspnea with minimal exertion. INR 2.4. No fever.', assessment: '1. CHF exacerbation (I50.22) — edema, dyspnea; uptitrate furosemide.\n2. Afib (I48.91) — INR therapeutic at 2.4; continue warfarin.\n3. COPD (J44.1) — stable today, no acute exacerbation.\n4. T2DM (E11.9) — HbA1c 7.6%, reasonable control.', plan: '1. Increase furosemide to 80 mg daily x 7 days, then return to 40 mg.\n2. Daily weights, call if gain >2 lbs/day.\n3. Recheck BMP in 1 week.\n4. Continue sacubitril-valsartan, metoprolol, spironolactone, warfarin.\n5. Cardiology follow-up in 4 weeks.', signed: true, signedBy: p2.id, signedAt: new Date('2025-09-04T10:00:00').toISOString(), lastModified: new Date('2025-09-04T10:00:00').toISOString(), addenda: [] });
  saveEncounterVitals({ encounterId: e12a.id, patientId: s12.id, bpSystolic: '136', bpDiastolic: '82', heartRate: '74', respiratoryRate: '20', tempF: '97.8', spo2: '94', weightLbs: '212', heightIn: '68', recordedAt: new Date('2025-09-04T09:05:00').toISOString(), recordedBy: p2.id });
  saveLabResult({ patientId: s12.id, encounterId: e12a.id, panel: 'BMP + INR', resultDate: new Date('2025-09-04T11:00:00').toISOString(), resultedBy: 'Lab — General Hospital', tests: [{ name: 'INR', value: '2.4', unit: '', referenceRange: '2.0–3.0', flag: 'Normal' }, { name: 'BUN', value: '28', unit: 'mg/dL', referenceRange: '7–25', flag: 'High' }, { name: 'Creatinine', value: '1.4', unit: 'mg/dL', referenceRange: '0.7–1.3', flag: 'High' }, { name: 'Potassium', value: '4.8', unit: 'mEq/L', referenceRange: '3.5–5.1', flag: 'Normal' }, { name: 'BNP', value: '840', unit: 'pg/mL', referenceRange: '<100', flag: 'High' }], notes: 'Elevated BNP consistent with CHF exacerbation.' });
  saveImmunization({ patientId: s12.id, vaccine: 'Pneumococcal (PPSV23)', date: '2022-04-01', lot: 'PN22-F', manufacturer: 'Merck', site: 'R deltoid', givenBy: p2.id, nextDue: '', notes: 'Age-based indication.' });

  // ── Patient 13: Nancy Hartman ──────────────────────────────────────
  const s13 = savePatient({ id: generateId(), mrn: 'MRN002013', firstName: 'Nancy', lastName: 'Hartman', dob: '1967-04-22', sex: 'Female', phone: '(555) 310-1013', insurance: 'BlueCross PPO', email: 'nancy.hartman@email.com', addressStreet: '54 Sunrise Blvd', addressCity: 'Springfield', addressState: 'IL', addressZip: '62704', emergencyContactName: 'Steven Hartman', emergencyContactPhone: '(555) 310-2013', emergencyContactRelationship: 'Husband', pharmacyName: 'CVS Pharmacy #1314', pharmacyPhone: '(555) 400-1301', pharmacyFax: '(555) 400-1302', panelProviders: [p1.id], createdAt: new Date('2019-07-20').toISOString() });
  saveAllergy({ patientId: s13.id, allergen: 'Latex', reaction: 'Contact dermatitis', severity: 'Moderate', recordedBy: p1.id, recordedAt: new Date('2019-07-20').toISOString() });
  saveMedication({ patientId: s13.id, drug: 'Alendronate', dose: '70', unit: 'mg', route: 'Oral', frequency: 'Weekly', status: 'Active', prescribedBy: p1.id, startDate: '2021-03-01', instructions: 'Take on empty stomach with full glass of water; remain upright 30 min.' });
  saveMedication({ patientId: s13.id, drug: 'Vitamin D3', dose: '2000', unit: 'IU', route: 'Oral', frequency: 'Daily', status: 'Active', prescribedBy: p1.id, startDate: '2021-03-01', instructions: '' });
  saveMedication({ patientId: s13.id, drug: 'Calcium carbonate', dose: '500', unit: 'mg', route: 'Oral', frequency: 'BID with meals', status: 'Active', prescribedBy: p1.id, startDate: '2021-03-01', instructions: 'Take with meals for best absorption.' });
  saveMedication({ patientId: s13.id, drug: 'Duloxetine', dose: '60', unit: 'mg', route: 'Oral', frequency: 'Daily', status: 'Active', prescribedBy: p1.id, startDate: '2022-09-15', instructions: 'For fibromyalgia pain and mood.' });
  saveDiagnosis({ patientId: s13.id, code: 'M81.0', description: 'Osteoporosis without current pathological fracture', diagnosedDate: '2021-02-15', status: 'Active', providerId: p1.id });
  saveDiagnosis({ patientId: s13.id, code: 'M79.7', description: 'Fibromyalgia', diagnosedDate: '2022-08-01', status: 'Active', providerId: p1.id });
  saveDiagnosis({ patientId: s13.id, code: 'N95.1', description: 'Menopausal and female climacteric states', diagnosedDate: '2019-07-20', status: 'Active', providerId: p1.id });
  saveDiagnosis({ patientId: s13.id, code: 'K21.0', description: 'GERD with esophagitis', diagnosedDate: '2015-03-01', status: 'Active', providerId: p1.id });
  saveSocialHistory({ patientId: s13.id, smokingStatus: 'Never', alcoholUse: 'Social (1-2 glasses of wine/week)', recreationalDrugUse: 'None', exerciseFrequency: 'Yoga 2x/week, walking', occupation: 'High school teacher', maritalStatus: 'Married', livingSituation: 'Lives with husband; two adult children' });
  saveFamilyHistory({ patientId: s13.id, relation: 'Mother', condition: 'Osteoporosis, hip fracture (age 70)' });
  saveFamilyHistory({ patientId: s13.id, relation: 'Father', condition: 'Colon cancer (age 68)' });
  const e13a = saveEncounter({ id: generateId(), patientId: s13.id, providerId: p1.id, visitType: 'Outpatient', visitSubtype: 'Primary Care', dateTime: new Date('2025-07-22T14:00:00').toISOString(), status: 'Signed' });
  saveNote({ id: generateId(), encounterId: e13a.id, chiefComplaint: 'Fibromyalgia pain management, osteoporosis follow-up.', hpi: 'Nancy, 58-year-old with fibromyalgia and osteoporosis. Reports 6/10 diffuse musculoskeletal pain. Sleep poor. DEXA scan T-score -2.8 lumbar (unchanged from 2023). On alendronate 70 mg weekly.', assessment: '1. Fibromyalgia (M79.7) — moderate pain, suboptimal sleep; add low-dose amitriptyline for sleep.\n2. Osteoporosis (M81.0) — T-score -2.8, stable; continue alendronate.\n3. Menopause (N95.1) — on no HRT per preference.\n4. GERD (K21.0) — controlled on dietary measures.', plan: '1. Add amitriptyline 10 mg QHS for sleep and pain.\n2. Continue duloxetine 60 mg, alendronate 70 mg weekly, calcium, vitamin D.\n3. Physical therapy referral for fibromyalgia.\n4. DEXA repeat in 2 years.\n5. Colonoscopy screening due — order.', signed: true, signedBy: p1.id, signedAt: new Date('2025-07-22T15:00:00').toISOString(), lastModified: new Date('2025-07-22T15:00:00').toISOString(), addenda: [] });
  saveEncounterVitals({ encounterId: e13a.id, patientId: s13.id, bpSystolic: '124', bpDiastolic: '78', heartRate: '72', respiratoryRate: '16', tempF: '98.2', spo2: '99', weightLbs: '142', heightIn: '65', recordedAt: new Date('2025-07-22T14:05:00').toISOString(), recordedBy: p1.id });
  saveLabResult({ patientId: s13.id, encounterId: e13a.id, panel: 'CMP + Vit D', resultDate: new Date('2025-07-22T16:00:00').toISOString(), resultedBy: 'Lab — General Hospital', tests: [{ name: '25-OH Vitamin D', value: '28', unit: 'ng/mL', referenceRange: '30–100', flag: 'Low' }, { name: 'Calcium', value: '9.4', unit: 'mg/dL', referenceRange: '8.5–10.5', flag: 'Normal' }, { name: 'Creatinine', value: '0.8', unit: 'mg/dL', referenceRange: '0.5–1.1', flag: 'Normal' }], notes: 'Vitamin D borderline low; uptitrate supplementation.' });
  saveImmunization({ patientId: s13.id, vaccine: 'Shingrix (RZV) — dose 1', date: '2023-11-01', lot: 'SZ23-N', manufacturer: 'GSK', site: 'R deltoid', givenBy: p1.id, nextDue: '2024-03-01', notes: 'Dose 2 needed.' });
  saveImmunization({ patientId: s13.id, vaccine: 'Shingrix (RZV) — dose 2', date: '2024-03-14', lot: 'SZ24-M', manufacturer: 'GSK', site: 'L deltoid', givenBy: p1.id, nextDue: '', notes: 'Series complete.' });

  // ── Patient 14: Kevin Okafor ───────────────────────────────────────
  const s14 = savePatient({ id: generateId(), mrn: 'MRN002014', firstName: 'Kevin', lastName: 'Okafor', dob: '1988-02-09', sex: 'Male', phone: '(555) 310-1014', insurance: 'Aetna PPO', email: 'kevin.okafor@email.com', addressStreet: '321 Spruce Way', addressCity: 'Springfield', addressState: 'IL', addressZip: '62706', emergencyContactName: 'Chioma Okafor', emergencyContactPhone: '(555) 310-2014', emergencyContactRelationship: 'Wife', pharmacyName: 'Walgreens #5566', pharmacyPhone: '(555) 400-1401', pharmacyFax: '(555) 400-1402', panelProviders: [p1.id], createdAt: new Date('2023-01-15').toISOString() });
  saveAllergy({ patientId: s14.id, allergen: 'NKDA', reaction: '', severity: '', recordedBy: p1.id, recordedAt: new Date('2023-01-15').toISOString() });
  saveMedication({ patientId: s14.id, drug: 'Albuterol inhaler', dose: '90', unit: 'mcg/actuation', route: 'Inhalation', frequency: 'PRN (2 puffs q4-6h)', status: 'Active', prescribedBy: p1.id, startDate: '2023-01-15', instructions: 'Use for acute bronchospasm. Rinse mouth after use.' });
  saveMedication({ patientId: s14.id, drug: 'Fluticasone-salmeterol (Advair)', dose: '250-50', unit: 'mcg', route: 'Inhalation', frequency: 'BID', status: 'Active', prescribedBy: p1.id, startDate: '2024-04-01', instructions: 'Rinse mouth after each dose.' });
  saveMedication({ patientId: s14.id, drug: 'Montelukast', dose: '10', unit: 'mg', route: 'Oral', frequency: 'QNight', status: 'Active', prescribedBy: p1.id, startDate: '2024-04-01', instructions: '' });
  saveDiagnosis({ patientId: s14.id, code: 'J45.41', description: 'Moderate persistent asthma with acute exacerbation', diagnosedDate: '2015-08-01', status: 'Active', providerId: p1.id });
  saveDiagnosis({ patientId: s14.id, code: 'J30.9', description: 'Allergic rhinitis, unspecified', diagnosedDate: '2023-01-15', status: 'Active', providerId: p1.id });
  saveDiagnosis({ patientId: s14.id, code: 'L20.9', description: 'Atopic dermatitis, unspecified', diagnosedDate: '2010-01-01', status: 'Resolved', providerId: p1.id });
  saveSocialHistory({ patientId: s14.id, smokingStatus: 'Never', alcoholUse: 'Occasional (weekends)', recreationalDrugUse: 'Marijuana (occasional)', exerciseFrequency: '5x/week (runs)', occupation: 'Software engineer', maritalStatus: 'Married', livingSituation: 'Lives with wife and infant' });
  saveFamilyHistory({ patientId: s14.id, relation: 'Mother', condition: 'Asthma, eczema' });
  saveFamilyHistory({ patientId: s14.id, relation: 'Father', condition: 'Hypertension' });
  const e14a = saveEncounter({ id: generateId(), patientId: s14.id, providerId: p1.id, visitType: 'Outpatient', visitSubtype: 'Primary Care', dateTime: new Date('2025-10-06T11:30:00').toISOString(), status: 'Signed' });
  saveNote({ id: generateId(), encounterId: e14a.id, chiefComplaint: 'Asthma follow-up — worsening symptoms in fall.', hpi: 'Kevin, 37-year-old with moderate persistent asthma. Reports increased albuterol use (daily x 1 week) with fall allergen season. No ED visits. Using Advair BID. ACT score 14 (not well controlled).', assessment: '1. Moderate persistent asthma (J45.41) — not well controlled (ACT 14); step up therapy.\n2. Allergic rhinitis (J30.9) — likely contributing; add nasal steroid.\n3. Allergen testing referral.', plan: '1. Add fluticasone nasal spray 50 mcg/spray BID.\n2. Continue Advair 250/50 BID, montelukast, albuterol PRN.\n3. Allergy referral for allergen immunotherapy evaluation.\n4. ACT at next visit; target ≥20.\n5. Asthma action plan reviewed.', signed: true, signedBy: p1.id, signedAt: new Date('2025-10-06T12:30:00').toISOString(), lastModified: new Date('2025-10-06T12:30:00').toISOString(), addenda: [] });
  saveEncounterVitals({ encounterId: e14a.id, patientId: s14.id, bpSystolic: '118', bpDiastolic: '72', heartRate: '76', respiratoryRate: '16', tempF: '98.6', spo2: '97', weightLbs: '176', heightIn: '72', recordedAt: new Date('2025-10-06T11:35:00').toISOString(), recordedBy: p1.id });
  saveLabResult({ patientId: s14.id, encounterId: e14a.id, panel: 'Spirometry', resultDate: new Date('2025-10-06T12:00:00').toISOString(), resultedBy: 'Pulmonary Lab', tests: [{ name: 'FEV1', value: '72', unit: '% predicted', referenceRange: '>80%', flag: 'Low' }, { name: 'FVC', value: '88', unit: '% predicted', referenceRange: '>80%', flag: 'Normal' }, { name: 'FEV1/FVC', value: '0.68', unit: '', referenceRange: '>0.70', flag: 'Low' }], notes: 'Obstructive pattern, moderate severity.' });
  saveImmunization({ patientId: s14.id, vaccine: 'Influenza (IIV4)', date: '2024-09-20', lot: 'FL24-K', manufacturer: 'GSK', site: 'L deltoid', givenBy: p1.id, nextDue: '2025-09-01', notes: '' });

  // ── Patient 15: Linda Chu ──────────────────────────────────────────
  const s15 = savePatient({ id: generateId(), mrn: 'MRN002015', firstName: 'Linda', lastName: 'Chu', dob: '1971-08-30', sex: 'Female', phone: '(555) 310-1015', insurance: 'UnitedHealthcare', email: 'linda.chu@email.com', addressStreet: '900 Lakeview Drive', addressCity: 'Springfield', addressState: 'IL', addressZip: '62701', emergencyContactName: 'Kevin Chu', emergencyContactPhone: '(555) 310-2015', emergencyContactRelationship: 'Son', pharmacyName: 'CVS Pharmacy #1516', pharmacyPhone: '(555) 400-1501', pharmacyFax: '(555) 400-1502', panelProviders: [p2.id], createdAt: new Date('2018-06-11').toISOString() });
  saveAllergy({ patientId: s15.id, allergen: 'Codeine', reaction: 'Nausea/vomiting', severity: 'Moderate', recordedBy: p2.id, recordedAt: new Date('2018-06-11').toISOString() });
  saveAllergy({ patientId: s15.id, allergen: 'Penicillin', reaction: 'Hives', severity: 'Moderate', recordedBy: p2.id, recordedAt: new Date('2018-06-11').toISOString() });
  saveMedication({ patientId: s15.id, drug: 'Metformin', dose: '1000', unit: 'mg', route: 'Oral', frequency: 'BID with meals', status: 'Active', prescribedBy: p2.id, startDate: '2019-02-01', instructions: '' });
  saveMedication({ patientId: s15.id, drug: 'Semaglutide (Ozempic)', dose: '1', unit: 'mg', route: 'Subcutaneous', frequency: 'Weekly', status: 'Active', prescribedBy: p2.id, startDate: '2023-08-01', instructions: 'Inject subcutaneously abdomen, thigh, or upper arm. Rotate sites.' });
  saveMedication({ patientId: s15.id, drug: 'Atorvastatin', dose: '40', unit: 'mg', route: 'Oral', frequency: 'QNight', status: 'Active', prescribedBy: p2.id, startDate: '2019-02-01', instructions: '' });
  saveMedication({ patientId: s15.id, drug: 'Lisinopril', dose: '10', unit: 'mg', route: 'Oral', frequency: 'Daily', status: 'Active', prescribedBy: p2.id, startDate: '2019-02-01', instructions: 'Monitor kidney function and potassium.' });
  saveDiagnosis({ patientId: s15.id, code: 'E11.65', description: 'Type 2 diabetes mellitus with hyperglycemia', diagnosedDate: '2019-01-10', status: 'Active', providerId: p2.id });
  saveDiagnosis({ patientId: s15.id, code: 'E66.01', description: 'Morbid (severe) obesity due to excess calories', diagnosedDate: '2019-01-10', status: 'Active', providerId: p2.id });
  saveDiagnosis({ patientId: s15.id, code: 'I10', description: 'Essential hypertension', diagnosedDate: '2019-01-10', status: 'Active', providerId: p2.id });
  saveDiagnosis({ patientId: s15.id, code: 'E78.5', description: 'Hyperlipidemia, unspecified', diagnosedDate: '2019-01-10', status: 'Active', providerId: p2.id });
  saveSocialHistory({ patientId: s15.id, smokingStatus: 'Never', alcoholUse: 'None', recreationalDrugUse: 'None', exerciseFrequency: 'Walking 20 min, 3x/week', occupation: 'Accountant', maritalStatus: 'Divorced', livingSituation: 'Lives alone; one adult son nearby' });
  saveFamilyHistory({ patientId: s15.id, relation: 'Father', condition: 'T2DM, HTN, MI (age 60)' });
  saveFamilyHistory({ patientId: s15.id, relation: 'Mother', condition: 'T2DM, obesity' });
  const e15a = saveEncounter({ id: generateId(), patientId: s15.id, providerId: p2.id, visitType: 'Outpatient', visitSubtype: 'Primary Care', dateTime: new Date('2025-11-03T13:00:00').toISOString(), status: 'Signed' });
  saveNote({ id: generateId(), encounterId: e15a.id, chiefComplaint: 'T2DM, obesity, HTN follow-up. GLP-1 response check.', hpi: 'Linda, 54-year-old on semaglutide since Aug 2023. Has lost 18 lbs (BMI 34 → 30.8). HbA1c improved from 9.2% to 6.9%. BP well controlled on lisinopril. No GI side effects from semaglutide.', assessment: '1. T2DM (E11.65) — excellent response to semaglutide; HbA1c 6.9%. Continue.\n2. Obesity (E66.01) — BMI 30.8, down from 34; continue GLP-1 and lifestyle.\n3. HTN (I10) — controlled on lisinopril 10 mg.\n4. Hyperlipidemia (E78.5) — LDL 68, at goal on atorvastatin 40 mg.', plan: '1. Continue semaglutide 1 mg weekly, metformin 1000 mg BID.\n2. Continue lisinopril, atorvastatin.\n3. HbA1c in 3 months.\n4. Lifestyle: Mediterranean diet, increase exercise.\n5. Annual microalbumin/creatinine ratio.', signed: true, signedBy: p2.id, signedAt: new Date('2025-11-03T14:00:00').toISOString(), lastModified: new Date('2025-11-03T14:00:00').toISOString(), addenda: [] });
  saveEncounterVitals({ encounterId: e15a.id, patientId: s15.id, bpSystolic: '128', bpDiastolic: '80', heartRate: '80', respiratoryRate: '16', tempF: '98.2', spo2: '98', weightLbs: '195', heightIn: '63', recordedAt: new Date('2025-11-03T13:05:00').toISOString(), recordedBy: p2.id });
  saveLabResult({ patientId: s15.id, encounterId: e15a.id, panel: 'HbA1c + Lipid Panel + CMP', resultDate: new Date('2025-11-03T15:00:00').toISOString(), resultedBy: 'Lab — General Hospital', tests: [{ name: 'HbA1c', value: '6.9', unit: '%', referenceRange: '<7.0', flag: 'Normal' }, { name: 'LDL', value: '68', unit: 'mg/dL', referenceRange: '<100', flag: 'Normal' }, { name: 'eGFR', value: '72', unit: 'mL/min/1.73m²', referenceRange: '>60', flag: 'Normal' }, { name: 'ALT', value: '32', unit: 'U/L', referenceRange: '7–56', flag: 'Normal' }, { name: 'Microalbumin/Cr', value: '18', unit: 'mg/g', referenceRange: '<30', flag: 'Normal' }], notes: 'Excellent metabolic control. Continue current regimen.' });
  saveImmunization({ patientId: s15.id, vaccine: 'Influenza (IIV4)', date: '2024-10-01', lot: 'FL24-L', manufacturer: 'Sanofi', site: 'L deltoid', givenBy: p2.id, nextDue: '2025-10-01', notes: '' });

  // ── Patient 16: George Sullivan ────────────────────────────────────
  const s16 = savePatient({ id: generateId(), mrn: 'MRN002016', firstName: 'George', lastName: 'Sullivan', dob: '1944-05-18', sex: 'Male', phone: '(555) 310-1016', insurance: 'Medicare', email: '', addressStreet: '11 Veteran Lane', addressCity: 'Springfield', addressState: 'IL', addressZip: '62702', emergencyContactName: 'Maureen Sullivan', emergencyContactPhone: '(555) 310-2016', emergencyContactRelationship: 'Daughter', pharmacyName: 'CVS Pharmacy #1617', pharmacyPhone: '(555) 400-1601', pharmacyFax: '(555) 400-1602', panelProviders: [p2.id], createdAt: new Date('2015-01-07').toISOString() });
  saveAllergy({ patientId: s16.id, allergen: 'Morphine', reaction: 'Confusion, urinary retention', severity: 'Severe', recordedBy: p2.id, recordedAt: new Date('2015-01-07').toISOString() });
  saveMedication({ patientId: s16.id, drug: 'Donepezil', dose: '10', unit: 'mg', route: 'Oral', frequency: 'QNight', status: 'Active', prescribedBy: p2.id, startDate: '2022-05-01', instructions: 'Take at bedtime.' });
  saveMedication({ patientId: s16.id, drug: 'Memantine', dose: '10', unit: 'mg', route: 'Oral', frequency: 'BID', status: 'Active', prescribedBy: p2.id, startDate: '2023-01-01', instructions: '' });
  saveMedication({ patientId: s16.id, drug: 'Aspirin', dose: '81', unit: 'mg', route: 'Oral', frequency: 'Daily', status: 'Active', prescribedBy: p2.id, startDate: '2010-03-01', instructions: 'Take with food.' });
  saveMedication({ patientId: s16.id, drug: 'Atorvastatin', dose: '20', unit: 'mg', route: 'Oral', frequency: 'QNight', status: 'Active', prescribedBy: p2.id, startDate: '2010-03-01', instructions: '' });
  saveMedication({ patientId: s16.id, drug: 'Tamsulosin', dose: '0.4', unit: 'mg', route: 'Oral', frequency: 'Daily after meals', status: 'Active', prescribedBy: p2.id, startDate: '2018-07-01', instructions: 'Take 30 min after same meal each day.' });
  saveDiagnosis({ patientId: s16.id, code: 'G30.1', description: "Alzheimer's disease with late onset", diagnosedDate: '2022-04-15', status: 'Active', providerId: p2.id });
  saveDiagnosis({ patientId: s16.id, code: 'N40.1', description: 'Benign prostatic hyperplasia with lower urinary tract symptoms', diagnosedDate: '2018-06-01', status: 'Active', providerId: p2.id });
  saveDiagnosis({ patientId: s16.id, code: 'I25.10', description: 'Atherosclerotic heart disease of native coronary artery without angina pectoris', diagnosedDate: '2010-02-01', status: 'Active', providerId: p2.id });
  saveDiagnosis({ patientId: s16.id, code: 'F32.9', description: 'Major depressive disorder, unspecified', diagnosedDate: '2023-03-01', status: 'Active', providerId: p2.id });
  saveSocialHistory({ patientId: s16.id, smokingStatus: 'Former smoker (quit 1990, 25 pack-years)', alcoholUse: 'None', recreationalDrugUse: 'None', exerciseFrequency: 'Short walks with caregiver', occupation: 'Retired (Vietnam veteran, USMC)', maritalStatus: 'Widowed', livingSituation: 'Lives with daughter (primary caregiver)' });
  saveFamilyHistory({ patientId: s16.id, relation: 'Mother', condition: "Alzheimer's disease" });
  saveFamilyHistory({ patientId: s16.id, relation: 'Father', condition: 'CAD, stroke' });
  const e16a = saveEncounter({ id: generateId(), patientId: s16.id, providerId: p2.id, visitType: 'Outpatient', visitSubtype: 'Primary Care', dateTime: new Date('2025-09-18T09:00:00').toISOString(), status: 'Signed' });
  saveNote({ id: generateId(), encounterId: e16a.id, chiefComplaint: "Alzheimer's disease follow-up. Daughter concerned about increased agitation at night.", hpi: "George, 81-year-old with late-onset Alzheimer's and CAD. Daughter reports increased nighttime confusion, restlessness, and occasional verbal agitation. MMSE 14 (was 18 in 2023). ADLs partially dependent. No falls.", assessment: "1. Alzheimer's disease (G30.1) — progressive, MMSE 14; nighttime agitation (sundowning). Add low-dose mirtazapine.\n2. BPH (N40.1) — stable on tamsulosin; no acute retention.\n3. CAD (I25.10) — stable on aspirin, atorvastatin.\n4. MDD (F32.9) — mirtazapine will address both mood and sleep.", plan: '1. Add mirtazapine 7.5 mg QHS for agitation/sleep.\n2. Continue donepezil 10 mg, memantine 10 mg BID.\n3. Caregiver support resources provided.\n4. Social work referral for respite care.\n5. Next visit 3 months.', signed: true, signedBy: p2.id, signedAt: new Date('2025-09-18T10:00:00').toISOString(), lastModified: new Date('2025-09-18T10:00:00').toISOString(), addenda: [] });
  saveEncounterVitals({ encounterId: e16a.id, patientId: s16.id, bpSystolic: '130', bpDiastolic: '76', heartRate: '70', respiratoryRate: '16', tempF: '97.6', spo2: '97', weightLbs: '158', heightIn: '68', recordedAt: new Date('2025-09-18T09:05:00').toISOString(), recordedBy: p2.id });
  saveImmunization({ patientId: s16.id, vaccine: 'Pneumococcal (PCV20)', date: '2023-04-01', lot: 'PC23-G', manufacturer: 'Pfizer', site: 'R deltoid', givenBy: p2.id, nextDue: '', notes: 'Age/comorbidity indication.' });

  // ── Patient 17: Ruth Nakamura ──────────────────────────────────────
  const s17 = savePatient({ id: generateId(), mrn: 'MRN002017', firstName: 'Ruth', lastName: 'Nakamura', dob: '1955-12-12', sex: 'Female', phone: '(555) 310-1017', insurance: 'Medicare Advantage', email: 'ruth.nakamura@email.com', addressStreet: '77 Cherry Blossom Way', addressCity: 'Springfield', addressState: 'IL', addressZip: '62704', emergencyContactName: 'Alan Nakamura', emergencyContactPhone: '(555) 310-2017', emergencyContactRelationship: 'Son', pharmacyName: 'Walgreens #1718', pharmacyPhone: '(555) 400-1701', pharmacyFax: '(555) 400-1702', panelProviders: [p1.id], createdAt: new Date('2016-08-22').toISOString() });
  saveAllergy({ patientId: s17.id, allergen: 'NKDA', reaction: '', severity: '', recordedBy: p1.id, recordedAt: new Date('2016-08-22').toISOString() });
  saveMedication({ patientId: s17.id, drug: 'Methotrexate', dose: '15', unit: 'mg', route: 'Oral', frequency: 'Weekly (Monday)', status: 'Active', prescribedBy: p1.id, startDate: '2020-03-01', instructions: 'Take with folic acid. Avoid alcohol and NSAIDs.' });
  saveMedication({ patientId: s17.id, drug: 'Folic acid', dose: '1', unit: 'mg', route: 'Oral', frequency: 'Daily (except MTX day)', status: 'Active', prescribedBy: p1.id, startDate: '2020-03-01', instructions: 'Reduces methotrexate side effects.' });
  saveMedication({ patientId: s17.id, drug: 'Hydroxychloroquine', dose: '200', unit: 'mg', route: 'Oral', frequency: 'BID', status: 'Active', prescribedBy: p1.id, startDate: '2017-05-01', instructions: 'Take with food or milk.' });
  saveMedication({ patientId: s17.id, drug: 'Prednisone', dose: '5', unit: 'mg', route: 'Oral', frequency: 'Daily', status: 'Active', prescribedBy: p1.id, startDate: '2021-01-01', instructions: 'Taper as directed by rheumatology.' });
  saveDiagnosis({ patientId: s17.id, code: 'M05.79', description: 'Rheumatoid arthritis with rheumatoid factor, multiple sites', diagnosedDate: '2016-09-01', status: 'Active', providerId: p1.id });
  saveDiagnosis({ patientId: s17.id, code: 'M81.0', description: 'Osteoporosis without current pathological fracture', diagnosedDate: '2020-11-01', status: 'Active', providerId: p1.id });
  saveDiagnosis({ patientId: s17.id, code: 'K21.0', description: 'GERD with esophagitis', diagnosedDate: '2019-04-01', status: 'Active', providerId: p1.id });
  saveSocialHistory({ patientId: s17.id, smokingStatus: 'Never', alcoholUse: 'None (avoided due to methotrexate)', recreationalDrugUse: 'None', exerciseFrequency: 'Aquatherapy 2x/week', occupation: 'Retired librarian', maritalStatus: 'Widowed', livingSituation: 'Lives alone; son checks in weekly' });
  saveFamilyHistory({ patientId: s17.id, relation: 'Mother', condition: 'RA, osteoporosis' });
  saveFamilyHistory({ patientId: s17.id, relation: 'Father', condition: 'Hypertension, stroke' });
  const e17a = saveEncounter({ id: generateId(), patientId: s17.id, providerId: p1.id, visitType: 'Outpatient', visitSubtype: 'Primary Care', dateTime: new Date('2025-10-14T10:00:00').toISOString(), status: 'Signed' });
  saveNote({ id: generateId(), encounterId: e17a.id, chiefComplaint: 'RA follow-up. MTX monitoring labs.', hpi: 'Ruth, 70-year-old with seropositive RA. Reports moderate improvement in joint pain on current regimen. Morning stiffness ~30 min. Recent MTX labs: LFTs normal, CBC normal. No oral ulcers. Mild GERD symptoms.', assessment: '1. RA (M05.79) — partial response on MTX + HCQ + prednisone 5 mg. Rheumatology recommends adding biologic (adalimumab); patient deferred pending insurance.\n2. Osteoporosis (M81.0) — on prednisone; add alendronate, vitamin D, calcium.\n3. GERD (K21.0) — add omeprazole 20 mg daily.', plan: '1. Continue MTX 15 mg weekly, HCQ 200 mg BID, prednisone 5 mg daily.\n2. Start alendronate 70 mg weekly, calcium 500 mg BID, vitamin D 2000 IU daily.\n3. Start omeprazole 20 mg daily for GERD.\n4. Rheumatology follow-up re adalimumab prior auth.\n5. MTX labs in 3 months.', signed: true, signedBy: p1.id, signedAt: new Date('2025-10-14T11:00:00').toISOString(), lastModified: new Date('2025-10-14T11:00:00').toISOString(), addenda: [] });
  saveEncounterVitals({ encounterId: e17a.id, patientId: s17.id, bpSystolic: '126', bpDiastolic: '74', heartRate: '74', respiratoryRate: '16', tempF: '98.4', spo2: '99', weightLbs: '138', heightIn: '62', recordedAt: new Date('2025-10-14T10:05:00').toISOString(), recordedBy: p1.id });
  saveLabResult({ patientId: s17.id, encounterId: e17a.id, panel: 'MTX Monitoring (CBC + CMP)', resultDate: new Date('2025-10-14T12:00:00').toISOString(), resultedBy: 'Lab — General Hospital', tests: [{ name: 'WBC', value: '5.8', unit: 'K/uL', referenceRange: '4.5–11.0', flag: 'Normal' }, { name: 'Hemoglobin', value: '11.8', unit: 'g/dL', referenceRange: '12.0–16.0', flag: 'Low' }, { name: 'ALT', value: '24', unit: 'U/L', referenceRange: '7–56', flag: 'Normal' }, { name: 'AST', value: '22', unit: 'U/L', referenceRange: '10–40', flag: 'Normal' }, { name: 'Creatinine', value: '0.9', unit: 'mg/dL', referenceRange: '0.5–1.1', flag: 'Normal' }], notes: 'Mild anemia, otherwise MTX monitoring labs acceptable.' });
  saveImmunization({ patientId: s17.id, vaccine: 'Influenza (IIV4)', date: '2024-09-30', lot: 'FL24-R', manufacturer: 'Sanofi', site: 'R deltoid', givenBy: p1.id, nextDue: '2025-09-01', notes: 'Inactivated only — on immunosuppressants.' });

  // ── Patient 18: Thomas Jensen ──────────────────────────────────────
  const s18 = savePatient({ id: generateId(), mrn: 'MRN002018', firstName: 'Thomas', lastName: 'Jensen', dob: '1975-09-25', sex: 'Male', phone: '(555) 310-1018', insurance: 'Cigna PPO', email: 'thomas.jensen@email.com', addressStreet: '456 Pinehurst Court', addressCity: 'Springfield', addressState: 'IL', addressZip: '62705', emergencyContactName: 'Lisa Jensen', emergencyContactPhone: '(555) 310-2018', emergencyContactRelationship: 'Wife', pharmacyName: 'Walgreens #1819', pharmacyPhone: '(555) 400-1801', pharmacyFax: '(555) 400-1802', panelProviders: [p1.id], createdAt: new Date('2021-06-14').toISOString() });
  saveAllergy({ patientId: s18.id, allergen: 'Tetracycline', reaction: 'Photosensitivity rash', severity: 'Mild', recordedBy: p1.id, recordedAt: new Date('2021-06-14').toISOString() });
  saveMedication({ patientId: s18.id, drug: 'Buprenorphine-naloxone (Suboxone)', dose: '8-2', unit: 'mg', route: 'Sublingual', frequency: 'BID', status: 'Active', prescribedBy: p1.id, startDate: '2021-07-01', instructions: 'Place under tongue until dissolved. Do not swallow. Take at consistent times.' });
  saveMedication({ patientId: s18.id, drug: 'Sertraline', dose: '100', unit: 'mg', route: 'Oral', frequency: 'Daily', status: 'Active', prescribedBy: p1.id, startDate: '2021-07-15', instructions: 'Take in the morning with food.' });
  saveMedication({ patientId: s18.id, drug: 'Clonazepam', dose: '0.5', unit: 'mg', route: 'Oral', frequency: 'QNight PRN', status: 'Active', prescribedBy: p1.id, startDate: '2022-01-01', instructions: 'Use only as directed for sleep. Do not combine with alcohol.' });
  saveDiagnosis({ patientId: s18.id, code: 'F11.20', description: 'Opioid dependence, uncomplicated', diagnosedDate: '2021-06-14', status: 'Active', providerId: p1.id });
  saveDiagnosis({ patientId: s18.id, code: 'F32.1', description: 'Major depressive disorder, single episode, moderate', diagnosedDate: '2021-07-15', status: 'Active', providerId: p1.id });
  saveDiagnosis({ patientId: s18.id, code: 'F43.10', description: 'Post-traumatic stress disorder, unspecified', diagnosedDate: '2022-02-01', status: 'Active', providerId: p1.id });
  saveDiagnosis({ patientId: s18.id, code: 'L30.9', description: 'Dermatitis, unspecified', diagnosedDate: '2019-08-01', status: 'Resolved', providerId: p1.id });
  saveSocialHistory({ patientId: s18.id, smokingStatus: 'Current smoker (½ ppd)', alcoholUse: 'None (in recovery)', recreationalDrugUse: 'Opioid use disorder — in remission on MOUD', exerciseFrequency: '3x/week (gym)', occupation: 'Plumber (self-employed)', maritalStatus: 'Married', livingSituation: 'Lives with wife and two children' });
  saveFamilyHistory({ patientId: s18.id, relation: 'Father', condition: 'Alcohol use disorder, depression' });
  saveFamilyHistory({ patientId: s18.id, relation: 'Brother', condition: 'Opioid use disorder (overdose death 2019)' });
  const e18a = saveEncounter({ id: generateId(), patientId: s18.id, providerId: p1.id, visitType: 'Outpatient', visitSubtype: 'Primary Care', dateTime: new Date('2025-11-10T08:00:00').toISOString(), status: 'Signed' });
  saveNote({ id: generateId(), encounterId: e18a.id, chiefComplaint: 'MOUD monthly check-in. No drug use. Doing well.', hpi: 'Thomas, 50-year-old on buprenorphine-naloxone for OUD (4+ years sobriety). Reports no opioid use. Mood stable on sertraline. PTSD symptoms managed with therapy. Urine drug screen negative for illicit opioids, positive for buprenorphine.', assessment: '1. OUD (F11.20) — sustained remission on MOUD; continue buprenorphine-naloxone.\n2. MDD (F32.1) — stable on sertraline 100 mg.\n3. PTSD (F43.10) — in EMDR therapy; improving.\n4. Smoking cessation — patient open to NRT; order nicotine patch.', plan: '1. Continue buprenorphine-naloxone 8/2 mg SL BID; 30-day supply. Prescription Monitoring Program checked — no concerns.\n2. Continue sertraline 100 mg daily, clonazepam 0.5 mg QHS PRN.\n3. Prescribe nicotine patch 14 mg/24 hr x 6 weeks with step-down plan.\n4. Continue therapy referral for PTSD (EMDR).\n5. Next MOUD visit in 4 weeks.', signed: true, signedBy: p1.id, signedAt: new Date('2025-11-10T09:00:00').toISOString(), lastModified: new Date('2025-11-10T09:00:00').toISOString(), addenda: [] });
  saveEncounterVitals({ encounterId: e18a.id, patientId: s18.id, bpSystolic: '122', bpDiastolic: '76', heartRate: '72', respiratoryRate: '16', tempF: '98.6', spo2: '98', weightLbs: '188', heightIn: '71', recordedAt: new Date('2025-11-10T08:05:00').toISOString(), recordedBy: p1.id });
  saveLabResult({ patientId: s18.id, encounterId: e18a.id, panel: 'UDS + Hepatitis Panel', resultDate: new Date('2025-11-10T10:00:00').toISOString(), resultedBy: 'Lab — General Hospital', tests: [{ name: 'UDS — Opiates', value: 'Negative', unit: '', referenceRange: 'Negative', flag: 'Normal' }, { name: 'UDS — Buprenorphine', value: 'Positive', unit: '', referenceRange: 'Expected positive', flag: 'Normal' }, { name: 'Hep C Ab', value: 'Negative', unit: '', referenceRange: 'Negative', flag: 'Normal' }, { name: 'Hep B sAg', value: 'Negative', unit: '', referenceRange: 'Negative', flag: 'Normal' }], notes: 'UDS consistent with MOUD adherence. No illicit opioids.' });
  saveImmunization({ patientId: s18.id, vaccine: 'Hepatitis A series (complete)', date: '2021-08-01', lot: 'HA21-T', manufacturer: 'Merck', site: 'R deltoid', givenBy: p1.id, nextDue: '', notes: 'OUD indication.' });
  saveImmunization({ patientId: s18.id, vaccine: 'Hepatitis B series (complete)', date: '2021-10-01', lot: 'HB21-T', manufacturer: 'Merck', site: 'L deltoid', givenBy: p1.id, nextDue: '', notes: 'OUD indication.' });

  // ── Patient 19: Barbara Quinn ──────────────────────────────────────
  const s19 = savePatient({ id: generateId(), mrn: 'MRN002019', firstName: 'Barbara', lastName: 'Quinn', dob: '1962-03-07', sex: 'Female', phone: '(555) 310-1019', insurance: 'BlueCross PPO', email: 'barbara.quinn@email.com', addressStreet: '38 Foxglove Lane', addressCity: 'Springfield', addressState: 'IL', addressZip: '62703', emergencyContactName: 'Michael Quinn', emergencyContactPhone: '(555) 310-2019', emergencyContactRelationship: 'Husband', pharmacyName: 'CVS Pharmacy #1920', pharmacyPhone: '(555) 400-1901', pharmacyFax: '(555) 400-1902', panelProviders: [p2.id], createdAt: new Date('2017-02-14').toISOString() });
  saveAllergy({ patientId: s19.id, allergen: 'ACE inhibitors', reaction: 'Angioedema', severity: 'Severe', recordedBy: p2.id, recordedAt: new Date('2017-02-14').toISOString() });
  saveMedication({ patientId: s19.id, drug: 'Losartan', dose: '50', unit: 'mg', route: 'Oral', frequency: 'Daily', status: 'Active', prescribedBy: p2.id, startDate: '2017-03-01', instructions: 'ARB — alternative to ACE inhibitor. Monitor kidney function and potassium.' });
  saveMedication({ patientId: s19.id, drug: 'Amlodipine', dose: '5', unit: 'mg', route: 'Oral', frequency: 'Daily', status: 'Active', prescribedBy: p2.id, startDate: '2019-06-01', instructions: '' });
  saveMedication({ patientId: s19.id, drug: 'Insulin glargine (Lantus)', dose: '20', unit: 'units', route: 'Subcutaneous', frequency: 'QNight', status: 'Active', prescribedBy: p2.id, startDate: '2022-01-10', instructions: 'Inject into abdomen, thigh, or upper arm. Rotate sites.' });
  saveMedication({ patientId: s19.id, drug: 'Sitagliptin', dose: '100', unit: 'mg', route: 'Oral', frequency: 'Daily', status: 'Active', prescribedBy: p2.id, startDate: '2020-05-01', instructions: '' });
  saveMedication({ patientId: s19.id, drug: 'Rosuvastatin', dose: '20', unit: 'mg', route: 'Oral', frequency: 'QNight', status: 'Active', prescribedBy: p2.id, startDate: '2019-06-01', instructions: '' });
  saveDiagnosis({ patientId: s19.id, code: 'I10', description: 'Essential hypertension', diagnosedDate: '2017-02-14', status: 'Active', providerId: p2.id });
  saveDiagnosis({ patientId: s19.id, code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', diagnosedDate: '2018-10-01', status: 'Active', providerId: p2.id });
  saveDiagnosis({ patientId: s19.id, code: 'E78.5', description: 'Hyperlipidemia, unspecified', diagnosedDate: '2019-05-01', status: 'Active', providerId: p2.id });
  saveDiagnosis({ patientId: s19.id, code: 'C18.9', description: 'Malignant neoplasm of colon, unspecified — Stage 2, resected 2021', diagnosedDate: '2021-04-01', status: 'Resolved', providerId: p2.id });
  saveSocialHistory({ patientId: s19.id, smokingStatus: 'Former smoker (quit 2000, 10 pack-years)', alcoholUse: 'None', recreationalDrugUse: 'None', exerciseFrequency: 'Walking 30 min daily', occupation: 'Nurse practitioner (retired)', maritalStatus: 'Married', livingSituation: 'Lives with husband' });
  saveFamilyHistory({ patientId: s19.id, relation: 'Father', condition: 'Colon cancer (age 60), T2DM' });
  saveFamilyHistory({ patientId: s19.id, relation: 'Mother', condition: 'HTN, stroke' });
  const e19a = saveEncounter({ id: generateId(), patientId: s19.id, providerId: p2.id, visitType: 'Outpatient', visitSubtype: 'Primary Care', dateTime: new Date('2025-10-28T11:00:00').toISOString(), status: 'Signed' });
  saveNote({ id: generateId(), encounterId: e19a.id, chiefComplaint: 'T2DM, HTN annual follow-up. Colon cancer surveillance CEA.', hpi: 'Barbara, 63-year-old, 4 years post colon cancer resection (Stage 2, no adjuvant chemo). CEA 1.8 ng/mL (normal). BP 138/84 on losartan + amlodipine — consider uptitrating. HbA1c 7.4%.', assessment: '1. T2DM (E11.9) — HbA1c 7.4%, near goal; continue current regimen.\n2. HTN (I10) — BP above goal on two agents; uptitrate amlodipine.\n3. Hyperlipidemia (E78.5) — LDL 72, at goal.\n4. Colon cancer surveillance — CEA 1.8, normal; colonoscopy due 2026.', plan: '1. Uptitrate amlodipine to 10 mg daily.\n2. Continue losartan 50 mg, insulin glargine 20 units QNight, sitagliptin, rosuvastatin.\n3. HbA1c in 3 months.\n4. Schedule colonoscopy 2026 (5-year post-resection).\n5. Annual CEA ordered for next visit.', signed: true, signedBy: p2.id, signedAt: new Date('2025-10-28T12:00:00').toISOString(), lastModified: new Date('2025-10-28T12:00:00').toISOString(), addenda: [] });
  saveEncounterVitals({ encounterId: e19a.id, patientId: s19.id, bpSystolic: '138', bpDiastolic: '84', heartRate: '76', respiratoryRate: '16', tempF: '98.0', spo2: '98', weightLbs: '167', heightIn: '65', recordedAt: new Date('2025-10-28T11:05:00').toISOString(), recordedBy: p2.id });
  saveLabResult({ patientId: s19.id, encounterId: e19a.id, panel: 'HbA1c + Lipid + CEA + CMP', resultDate: new Date('2025-10-28T13:00:00').toISOString(), resultedBy: 'Lab — General Hospital', tests: [{ name: 'HbA1c', value: '7.4', unit: '%', referenceRange: '<7.0', flag: 'High' }, { name: 'LDL', value: '72', unit: 'mg/dL', referenceRange: '<100', flag: 'Normal' }, { name: 'CEA', value: '1.8', unit: 'ng/mL', referenceRange: '<3.0', flag: 'Normal' }, { name: 'Creatinine', value: '1.0', unit: 'mg/dL', referenceRange: '0.5–1.1', flag: 'Normal' }, { name: 'Potassium', value: '4.4', unit: 'mEq/L', referenceRange: '3.5–5.1', flag: 'Normal' }], notes: 'CEA within normal limits. HbA1c slightly above target.' });
  saveImmunization({ patientId: s19.id, vaccine: 'Shingrix (RZV) series (complete)', date: '2023-05-01', lot: 'SZ23-B', manufacturer: 'GSK', site: 'R deltoid', givenBy: p2.id, nextDue: '', notes: 'Series completed May–Sept 2023.' });

  // ── Patient 20: Marcus Rivera ──────────────────────────────────────
  const s20 = savePatient({ id: generateId(), mrn: 'MRN002020', firstName: 'Marcus', lastName: 'Rivera', dob: '1993-10-11', sex: 'Male', phone: '(555) 310-1020', insurance: 'Marketplace (Bronze)', email: 'marcus.rivera@email.com', addressStreet: '199 Aspen Court', addressCity: 'Springfield', addressState: 'IL', addressZip: '62706', emergencyContactName: 'Elena Rivera', emergencyContactPhone: '(555) 310-2020', emergencyContactRelationship: 'Mother', pharmacyName: 'CVS Pharmacy #2021', pharmacyPhone: '(555) 400-2001', pharmacyFax: '(555) 400-2002', panelProviders: [p1.id], createdAt: new Date('2024-01-08').toISOString() });
  saveAllergy({ patientId: s20.id, allergen: 'NKDA', reaction: '', severity: '', recordedBy: p1.id, recordedAt: new Date('2024-01-08').toISOString() });
  saveMedication({ patientId: s20.id, drug: 'Isotretinoin', dose: '40', unit: 'mg', route: 'Oral', frequency: 'BID with fatty meal', status: 'Active', prescribedBy: p1.id, startDate: '2024-03-01', instructions: 'iPLEDGE enrolled. No Vitamin A supplements. Avoid pregnancy (Category X).' });
  saveMedication({ patientId: s20.id, drug: 'Doxycycline', dose: '100', unit: 'mg', route: 'Oral', frequency: 'BID', status: 'Discontinued', prescribedBy: p1.id, startDate: '2023-08-01', instructions: 'Discontinued after starting isotretinoin.' });
  saveMedication({ patientId: s20.id, drug: 'Benzoyl peroxide 5% wash', dose: '1', unit: 'application', route: 'Topical', frequency: 'Daily', status: 'Active', prescribedBy: p1.id, startDate: '2024-03-01', instructions: 'Apply to face daily during isotretinoin course.' });
  saveDiagnosis({ patientId: s20.id, code: 'L70.0', description: 'Acne vulgaris', diagnosedDate: '2023-07-01', status: 'Active', providerId: p1.id });
  saveDiagnosis({ patientId: s20.id, code: 'F41.1', description: 'Generalized anxiety disorder', diagnosedDate: '2024-01-08', status: 'Active', providerId: p1.id });
  saveDiagnosis({ patientId: s20.id, code: 'J30.9', description: 'Allergic rhinitis, unspecified', diagnosedDate: '2020-04-01', status: 'Active', providerId: p1.id });
  saveSocialHistory({ patientId: s20.id, smokingStatus: 'Never', alcoholUse: 'Social (beer, 3-4 drinks/week)', recreationalDrugUse: 'Marijuana (2-3x/week)', exerciseFrequency: '4x/week (weightlifting)', occupation: 'College student / barista', maritalStatus: 'Single', livingSituation: 'College apartment with 2 roommates' });
  saveFamilyHistory({ patientId: s20.id, relation: 'Father', condition: 'Severe acne (required isotretinoin), anxiety' });
  saveFamilyHistory({ patientId: s20.id, relation: 'Mother', condition: 'Asthma, allergic rhinitis' });
  const e20a = saveEncounter({ id: generateId(), patientId: s20.id, providerId: p1.id, visitType: 'Outpatient', visitSubtype: 'Primary Care', dateTime: new Date('2025-09-25T15:00:00').toISOString(), status: 'Signed' });
  saveNote({ id: generateId(), encounterId: e20a.id, chiefComplaint: 'Isotretinoin month 6 check. Labs and iPLEDGE review.', hpi: 'Marcus, 32-year-old on isotretinoin 40 mg BID (month 6 of planned 6-month course). Acne dramatically improved — no new nodular lesions. Lips chapped, skin dry (expected side effects). Mood stable. No depression symptoms on PHQ-9 (score 2). iPLEDGE requirements met this month.', assessment: '1. Acne vulgaris (L70.0) — excellent response to isotretinoin; consider completing course at month 6 or extending 1 month per dermatology.\n2. GAD (F41.1) — mild, managed with CBT therapy; PHQ-9 2 (minimal).\n3. iPLEDGE — compliant, monthly labs normal.', plan: '1. Complete isotretinoin course (final month). Derm will reassess for extension vs completion.\n2. Moisturizer, SPF 30+ daily, lip balm for dryness.\n3. Continue benzoyl peroxide wash.\n4. Continue CBT for GAD; sertraline deferred per patient preference.\n5. Counsel on marijuana use and anxiety.\n6. Next visit 6 weeks post-course.', signed: true, signedBy: p1.id, signedAt: new Date('2025-09-25T16:00:00').toISOString(), lastModified: new Date('2025-09-25T16:00:00').toISOString(), addenda: [] });
  saveEncounterVitals({ encounterId: e20a.id, patientId: s20.id, bpSystolic: '116', bpDiastolic: '70', heartRate: '66', respiratoryRate: '14', tempF: '98.4', spo2: '100', weightLbs: '172', heightIn: '70', recordedAt: new Date('2025-09-25T15:05:00').toISOString(), recordedBy: p1.id });
  saveLabResult({ patientId: s20.id, encounterId: e20a.id, panel: 'iPLEDGE Labs (CBC + CMP + Lipids)', resultDate: new Date('2025-09-25T17:00:00').toISOString(), resultedBy: 'Lab — General Hospital', tests: [{ name: 'WBC', value: '6.2', unit: 'K/uL', referenceRange: '4.5–11.0', flag: 'Normal' }, { name: 'Triglycerides', value: '142', unit: 'mg/dL', referenceRange: '<150', flag: 'Normal' }, { name: 'ALT', value: '28', unit: 'U/L', referenceRange: '7–56', flag: 'Normal' }, { name: 'Creatinine', value: '0.9', unit: 'mg/dL', referenceRange: '0.7–1.3', flag: 'Normal' }], notes: 'iPLEDGE labs within acceptable range. Mild triglyceride rise — acceptable.' });
  saveImmunization({ patientId: s20.id, vaccine: 'Influenza (IIV4)', date: '2024-10-05', lot: 'FL24-M', manufacturer: 'GSK', site: 'L deltoid', givenBy: p1.id, nextDue: '2025-10-01', notes: '' });
  saveImmunization({ patientId: s20.id, vaccine: 'Meningococcal (MenACWY)', date: '2024-01-08', lot: 'MC24-MR', manufacturer: 'Sanofi', site: 'R deltoid', givenBy: p1.id, nextDue: '', notes: 'College student booster indication.' });
}
