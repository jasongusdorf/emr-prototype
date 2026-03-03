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
};

/* ---------- Utility ---------- */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function generateMRN() {
  const counter = parseInt(localStorage.getItem(KEYS.mrnCounter) || '1000', 10);
  safeSave(KEYS.mrnCounter, String(counter + 1));
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

function loadAll(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch { return []; }
}

function saveAll(key, arr) {
  safeSave(key, JSON.stringify(arr));
}

/* ============================================================
   Patients
   ============================================================ */
function getPatients() { return loadAll(KEYS.patients); }

function getPatient(id) { return getPatients().find(p => p.id === id) || null; }

function savePatient(data) {
  const patients = getPatients();
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
  // Cascade: delete encounters, notes, orders, vitals
  const encounters = getEncounters().filter(e => e.patientId === id);
  encounters.forEach(e => {
    deleteNote(e.id);
    deleteOrdersByEncounter(e.id);
    saveAll(KEYS.vitals, loadAll(KEYS.vitals).filter(v => v.encounterId !== e.id));
  });
  saveAll(KEYS.encounters,     getEncounters().filter(e => e.patientId !== id));
  // Delete patient-level clinical records
  saveAll(KEYS.allergies,      loadAll(KEYS.allergies).filter(a => a.patientId !== id));
  saveAll(KEYS.pmh,            loadAll(KEYS.pmh).filter(d => d.patientId !== id));
  saveAll(KEYS.patientMeds,    loadAll(KEYS.patientMeds).filter(m => m.patientId !== id));
  saveAll(KEYS.socialHistory,  loadAll(KEYS.socialHistory).filter(s => s.patientId !== id));
  saveAll(KEYS.surgeries,      loadAll(KEYS.surgeries).filter(s => s.patientId !== id));
  saveAll(KEYS.familyHistory,  loadAll(KEYS.familyHistory).filter(f => f.patientId !== id));
  saveAll(KEYS.problems,       loadAll(KEYS.problems).filter(p => p.patientId !== id));
  saveAll(KEYS.labResults,     loadAll(KEYS.labResults).filter(l => l.patientId !== id));
  saveAll(KEYS.immunizations,  loadAll(KEYS.immunizations).filter(i => i.patientId !== id));
  saveAll(KEYS.referrals,      loadAll(KEYS.referrals).filter(r => r.patientId !== id));
  saveAll(KEYS.screenings,     loadAll(KEYS.screenings).filter(s => s.patientId !== id));
  saveAll(KEYS.documents,      loadAll(KEYS.documents).filter(d => d.patientId !== id));
  saveAll(KEYS.medRec,         loadAll(KEYS.medRec).filter(r => r.patientId !== id));
  saveAll(KEYS.auditLog,       loadAll(KEYS.auditLog).filter(e => e.patientId !== id));
  saveAll(KEYS.patients,       getPatients().filter(p => p.id !== id));
}

/* ============================================================
   Providers
   ============================================================ */
function getProviders() { return loadAll(KEYS.providers); }

function getProvider(id) { return getProviders().find(p => p.id === id) || null; }

function saveProvider(data) {
  const providers = getProviders();
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
  saveAll(KEYS.providers, getProviders().filter(p => p.id !== id));
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
  const encounters = getEncounters();
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
  saveAll(KEYS.vitals,     loadAll(KEYS.vitals).filter(v => v.encounterId !== id));
  saveAll(KEYS.medRec,     loadAll(KEYS.medRec).filter(r => r.encounterId !== id));
  saveAll(KEYS.encounters, getEncounters().filter(e => e.id !== id));
}

/* ============================================================
   Notes  (keyed by encounterId — one note per encounter)
   ============================================================ */
function getNotes() { return loadAll(KEYS.notes); }

function getNoteByEncounter(encounterId) {
  return getNotes().find(n => n.encounterId === encounterId) || null;
}

function saveNote(data) {
  const notes = getNotes();
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
      chiefComplaint: '',
      hpi:            '',
      ros:            '',
      physicalExam:   '',
      assessment:     '',
      plan:           '',
      signed:         false,
      signedBy:       null,
      signedAt:       null,
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
  saveAll(KEYS.notes, getNotes().filter(n => n.encounterId !== encounterId));
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
  const orders = getOrders();
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
    return newOrder;
  }
}

function deleteOrder(id) {
  saveAll(KEYS.orders, getOrders().filter(o => o.id !== id));
}

function deleteOrdersByEncounter(encounterId) {
  saveAll(KEYS.orders, getOrders().filter(o => o.encounterId !== encounterId));
}

function updateOrderStatus(id, status) {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx < 0) return null;
  orders[idx].status = status;
  if (status === 'Completed') orders[idx].completedAt = new Date().toISOString();
  saveAll(KEYS.orders, orders);
  return orders[idx];
}

/* ============================================================
   Addenda (appended to signed notes)
   ============================================================ */
function addNoteAddendum(encounterId, { text, addedBy }) {
  const notes = getNotes();
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
  const all = loadAll(KEYS.vitals);
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
  const all = loadAll(KEYS.familyHistory);
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
  const all = loadAll(KEYS.allergies);
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
  saveAll(KEYS.allergies, loadAll(KEYS.allergies).filter(a => a.id !== id));
}

/* ============================================================
   Past Medical History (PMH / Diagnoses)
   ============================================================ */
function getPatientDiagnoses(patientId) {
  return loadAll(KEYS.pmh).filter(d => d.patientId === patientId);
}

function savePatientDiagnosis(data) {
  const all = loadAll(KEYS.pmh);
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
  saveAll(KEYS.pmh, loadAll(KEYS.pmh).filter(d => d.id !== id));
}

/* ============================================================
   Patient Medications (patient-level, not encounter orders)
   ============================================================ */
function getPatientMedications(patientId) {
  return loadAll(KEYS.patientMeds).filter(m => m.patientId === patientId);
}

function savePatientMedication(data) {
  const all = loadAll(KEYS.patientMeds);
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
  saveAll(KEYS.patientMeds, loadAll(KEYS.patientMeds).filter(m => m.id !== id));
}

/* ============================================================
   Social History  (one record per patient)
   ============================================================ */
function getSocialHistory(patientId) {
  return loadAll(KEYS.socialHistory).find(s => s.patientId === patientId) || null;
}

function saveSocialHistory(data) {
  const all = loadAll(KEYS.socialHistory);
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
  const all = loadAll(KEYS.surgeries);
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
  saveAll(KEYS.surgeries, loadAll(KEYS.surgeries).filter(s => s.id !== id));
}

/* ============================================================
   Active Problem List
   ============================================================ */
function getActiveProblems(patientId) {
  return loadAll(KEYS.problems).filter(p => p.patientId === patientId);
}

function saveActiveProblem(data) {
  const all = loadAll(KEYS.problems);
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
  saveAll(KEYS.problems, loadAll(KEYS.problems).filter(p => p.id !== id));
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
  const all = loadAll(KEYS.labResults);
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
      ...data,
    });
  }
  saveAll(KEYS.labResults, all);
}

function deleteLabResult(id) {
  saveAll(KEYS.labResults, loadAll(KEYS.labResults).filter(l => l.id !== id));
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
  const all = loadAll(KEYS.immunizations);
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
  saveAll(KEYS.immunizations, loadAll(KEYS.immunizations).filter(i => i.id !== id));
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
  const all = loadAll(KEYS.referrals);
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
  saveAll(KEYS.referrals, loadAll(KEYS.referrals).filter(r => r.id !== id));
}

/* ============================================================
   Preventive Care Screenings
   ============================================================ */
function getScreeningRecords(patientId) {
  return loadAll(KEYS.screenings).filter(s => s.patientId === patientId);
}

function saveScreeningRecord(data) {
  const all = loadAll(KEYS.screenings);
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
  const all = loadAll(KEYS.documents);
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
  saveAll(KEYS.documents, loadAll(KEYS.documents).filter(d => d.id !== id));
}

/* ============================================================
   Audit Log
   ============================================================ */
function logAudit(action, entityType, entityId, patientId, details) {
  const all = loadAll(KEYS.auditLog);
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
  const all = loadAll(KEYS.medRec).filter(r => r.encounterId !== encounterId);
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
  const all = loadAll(KEYS.noteTemplates);
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
  saveAll(KEYS.noteTemplates, loadAll(KEYS.noteTemplates).filter(t => t.id !== id));
}

/* ============================================================
   Seed data — populates on first load
   ============================================================ */
function seedIfEmpty() {
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
    createdAt: new Date('2024-01-10').toISOString(),
  });
  const pat2 = savePatient({
    id: generateId(), mrn: 'MRN001002',
    firstName: 'Robert', lastName: 'Kim',
    dob: '1955-11-30', sex: 'Male',
    phone: '(555) 210-1002', insurance: 'Medicare',
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
  safeSave(KEYS.mrnCounter, '1004');

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
  saveNoteTemplate({ name: 'Annual Physical', visitType: 'Outpatient', isBuiltIn: true,
    chiefComplaint: 'Annual wellness exam.',
    hpi: 'Patient presents for routine annual physical examination. No acute concerns. Review of interval health changes since last visit.',
    ros: 'Constitutional: No fever, chills, or unintentional weight changes.\nCardiovascular: No chest pain, palpitations, or edema.\nPulmonary: No dyspnea, cough, or wheezing.\nGI: No abdominal pain, nausea, or bowel habit changes.\nGU: No dysuria or hematuria.\nMusculoskeletal: No joint pain or swelling.\nNeuro: No headaches, dizziness, or focal deficits.\nSkin: No new rashes or lesions.\nAll other systems reviewed and negative.',
    physicalExam: 'General: Well-appearing, no acute distress.\nVitals: See above.\nHEENT: Normocephalic, PERRL, TMs clear, pharynx benign.\nNeck: Supple, no LAD or thyromegaly.\nCV: RRR, no murmurs/rubs/gallops.\nLungs: CTA bilaterally, no wheeze or rhonchi.\nAbdomen: Soft, NT/ND, normoactive bowel sounds.\nExtremities: No edema, pulses 2+ and symmetric.\nNeuro: CN II–XII grossly intact, normal gait.',
    assessment: '1. Health maintenance — up to date.\n2. [List chronic conditions].',
    plan: '1. Update immunizations per schedule.\n2. Order age-appropriate screening labs.\n3. Provide preventive counseling (diet, exercise, smoking).\n4. Follow-up in 12 months or as needed.',
  });
  saveNoteTemplate({ name: 'Diabetic Follow-up', visitType: 'Outpatient', isBuiltIn: true,
    chiefComplaint: 'Diabetes follow-up.',
    hpi: 'Patient presents for diabetes management follow-up. Review of blood glucose logs, symptoms of hypo/hyperglycemia, and medication adherence.',
    ros: 'Constitutional: No fever or weight change.\nCardiovascular: No chest pain or edema.\nNeuro: No numbness, tingling, or vision changes.\nGU: No polyuria, polydipsia, or dysuria.\nSkin: No non-healing wounds or foot ulcers.',
    physicalExam: 'General: Alert and oriented, no acute distress.\nVitals: See above.\nFeet: No open wounds, sensation intact to monofilament bilaterally, DP/PT pulses 2+.\nEyes: Deferred — ophthalmology follow-up documented.',
    assessment: '1. Type 2 Diabetes Mellitus (E11.9) — [controlled/uncontrolled].\n2. Most recent HbA1c: [value] ([date]).',
    plan: '1. Continue/adjust [medication].\n2. Repeat HbA1c in 3 months.\n3. Order microalbumin/creatinine ratio.\n4. Annual foot exam and ophthalmology referral.\n5. Diet and exercise counseling reinforced.',
  });
  saveNoteTemplate({ name: 'Post-Op Check', visitType: 'Outpatient', isBuiltIn: true,
    chiefComplaint: 'Post-operative follow-up.',
    hpi: 'Patient returns for post-operative follow-up after [procedure] performed on [date]. Reports [pain level]/10 pain, wound healing [per description]. No fever, increased drainage, or concerning symptoms.',
    ros: 'Pain: [Location, severity, character].\nWound: No purulent drainage, dehiscence, or erythema.\nFever/Chills: None.\nActivity: Tolerating [diet/activity level].',
    physicalExam: 'General: Alert, in [mild/no] distress.\nWound: [Clean/dry/intact]. No erythema, purulence, or dehiscence. Sutures/staples [intact/removed].\nAbdomen/Extremity (as applicable): [findings].',
    assessment: '1. Post-operative status following [procedure] — healing [as expected/complications noted].',
    plan: '1. Wound care instructions reviewed.\n2. Activity restrictions: [per protocol].\n3. Follow-up in [X] weeks.\n4. Return precautions reviewed. Call/return for fever >101.5°F, increased pain, purulence.',
  });
  saveNoteTemplate({ name: 'Urgent Care Visit', visitType: 'Urgent Care', isBuiltIn: true,
    chiefComplaint: 'Urgent care visit.',
    hpi: 'Patient presents to urgent care with [chief complaint] for [duration]. Onset was [gradual/sudden]. [Additional history including associated symptoms, aggravating/relieving factors, prior episodes, and relevant past medical history].',
    ros: 'Constitutional: [Fever, chills, fatigue — as applicable].\n[System-specific review based on chief complaint].\nAll other reviewed systems negative.',
    physicalExam: 'General: [Appearance].\nVitals: See above.\n[Targeted physical exam based on chief complaint].',
    assessment: '1. [Primary diagnosis].',
    plan: '1. [Diagnostic studies ordered, if applicable].\n2. [Treatment — medications, procedures].\n3. Return precautions reviewed.\n4. Follow-up with PCP in [X] days or sooner if symptoms worsen.',
  });
  saveNoteTemplate({ name: 'Cardiology Follow-up', visitType: 'Outpatient', isBuiltIn: true,
    chiefComplaint: 'Cardiology follow-up.',
    hpi: 'Patient presents for cardiology follow-up for [condition]. Reviews functional status (NYHA Class [I–IV]), symptoms of chest pain, dyspnea, palpitations, syncope, and lower extremity edema.',
    ros: 'CV: [Chest pain, dyspnea, palpitations, edema — as applicable].\nPulmonary: Dyspnea on exertion at [X] flights/blocks. Orthopnea: [Y] pillows. PND: [present/absent].\nNeuro: No syncope or pre-syncope.',
    physicalExam: 'General: [Appearance], no acute distress.\nVitals: See above.\nCV: RRR, [murmur description if present], JVP [elevated/normal].\nLungs: [CTA/bibasilar crackles].\nExtremities: [No edema/pitting edema X+] bilateral LE.',
    assessment: '1. [Cardiac condition] — [stable/improved/worsening].\n2. Last echo: EF [X]% on [date].',
    plan: '1. Continue/adjust [medications].\n2. Repeat labs: BMP, BNP.\n3. Follow-up echo in [X] months.\n4. Restrict sodium <2g/day, daily weights.\n5. Return for weight gain >3 lbs in 1 day or >5 lbs in 1 week.',
  });
}
