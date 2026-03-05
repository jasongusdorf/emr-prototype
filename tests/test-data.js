/* ============================================================
   test-data.js — Tests for data.js CRUD operations
   ============================================================ */

/* ----------------------------------------------------------
   1. generateId / generateMRN
   ---------------------------------------------------------- */
describe('generateId / generateMRN — ID generation', function() {

  it('generateId returns a non-empty string', function() {
    beforeEach();
    var id = generateId();
    assert(typeof id === 'string' && id.length > 0, 'ID should be a non-empty string');
    afterEach();
  });

  it('generateId returns unique values on successive calls', function() {
    beforeEach();
    var ids = {};
    for (var i = 0; i < 100; i++) {
      var id = generateId();
      assert(!ids[id], 'Duplicate ID detected: ' + id);
      ids[id] = true;
    }
    afterEach();
  });

  it('generateMRN returns an MRN-prefixed string', function() {
    beforeEach();
    var mrn = generateMRN();
    assert(mrn.indexOf('MRN') === 0, 'MRN should start with "MRN"');
    afterEach();
  });

  it('generateMRN returns incrementing values', function() {
    beforeEach();
    var mrn1 = generateMRN();
    var mrn2 = generateMRN();
    var num1 = parseInt(mrn1.replace('MRN', ''), 10);
    var num2 = parseInt(mrn2.replace('MRN', ''), 10);
    assertEqual(num2, num1 + 1, 'MRN should increment by 1');
    afterEach();
  });

  it('generateMRN pads to at least 6 digits', function() {
    beforeEach();
    var mrn = generateMRN();
    var numPart = mrn.replace('MRN', '');
    assert(numPart.length >= 6, 'MRN number part should be at least 6 digits, got: ' + numPart);
    afterEach();
  });

});

/* ----------------------------------------------------------
   2. Patient CRUD
   ---------------------------------------------------------- */
describe('Patient CRUD — savePatient, getPatient, getPatients, deletePatient', function() {

  it('savePatient creates a new patient with auto-generated id and mrn', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'John', lastName: 'Doe' });
    assertNotNull(pat.id, 'Patient should have an id');
    assertNotNull(pat.mrn, 'Patient should have an MRN');
    assertEqual(pat.firstName, 'John');
    assertEqual(pat.lastName, 'Doe');
    afterEach();
  });

  it('getPatient retrieves a saved patient by id', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'Jane', lastName: 'Smith' });
    var retrieved = getPatient(pat.id);
    assertNotNull(retrieved, 'getPatient should find the patient');
    assertEqual(retrieved.firstName, 'Jane');
    assertEqual(retrieved.lastName, 'Smith');
    afterEach();
  });

  it('getPatient returns null for non-existent id', function() {
    beforeEach();
    var result = getPatient('non-existent-id-999');
    assertEqual(result, null, 'Should return null for unknown id');
    afterEach();
  });

  it('getPatients returns all patients', function() {
    beforeEach();
    savePatient({ firstName: 'A', lastName: 'One' });
    savePatient({ firstName: 'B', lastName: 'Two' });
    var patients = getPatients();
    assert(patients.length >= 2, 'Should have at least 2 patients');
    afterEach();
  });

  it('savePatient updates an existing patient when given matching id', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'Old', lastName: 'Name' });
    savePatient({ id: pat.id, firstName: 'New' });
    var updated = getPatient(pat.id);
    assertEqual(updated.firstName, 'New');
    assertEqual(updated.lastName, 'Name', 'Unchanged fields should persist');
    afterEach();
  });

  it('savePatient sets default fields on new patient', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'Test', lastName: 'Default' });
    assertEqual(pat.email, '', 'email should default to empty string');
    assertEqual(pat.phone, '', 'phone should default to empty string');
    assertEqual(pat.insurance, '', 'insurance should default to empty string');
    assertNotNull(pat.createdAt, 'createdAt should be set');
    afterEach();
  });

  it('deletePatient soft-deletes the patient', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'Del', lastName: 'Me' });
    deletePatient(pat.id);
    var result = getPatient(pat.id);
    assertEqual(result, null, 'Soft-deleted patient should not appear in getPatient');
    afterEach();
  });

  it('deletePatient preserves patient in includeDeleted mode', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'Del', lastName: 'Keep' });
    deletePatient(pat.id);
    var all = loadAll(KEYS.patients, true);
    var found = all.find(function(p) { return p.id === pat.id; });
    assertNotNull(found, 'Deleted patient should be in includeDeleted results');
    assert(found._deleted === true, 'Record should have _deleted flag');
    afterEach();
  });

});

/* ----------------------------------------------------------
   3. Patient Validation
   ---------------------------------------------------------- */
describe('Patient Validation — required fields, email, phone', function() {

  it('savePatient rejects missing firstName', function() {
    beforeEach();
    var result = savePatient({ lastName: 'Only' });
    assert(result.error === true, 'Should return error');
    assert(result.errors.length > 0, 'Should have error messages');
    afterEach();
  });

  it('savePatient rejects missing lastName', function() {
    beforeEach();
    var result = savePatient({ firstName: 'Only' });
    assert(result.error === true, 'Should return error');
    afterEach();
  });

  it('savePatient rejects empty firstName', function() {
    beforeEach();
    var result = savePatient({ firstName: '   ', lastName: 'Test' });
    assert(result.error === true, 'Should reject whitespace-only firstName');
    afterEach();
  });

  it('savePatient rejects invalid email format', function() {
    beforeEach();
    var result = savePatient({ firstName: 'Test', lastName: 'Email', email: 'not-an-email' });
    assert(result.error === true, 'Should reject invalid email');
    assertContains(result.errors[0], 'email', 'Error should mention email');
    afterEach();
  });

  it('savePatient accepts valid email format', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'Test', lastName: 'Email', email: 'test@example.com' });
    assert(!pat.error, 'Should accept valid email');
    assertEqual(pat.email, 'test@example.com');
    afterEach();
  });

  it('savePatient rejects phone with fewer than 10 digits', function() {
    beforeEach();
    var result = savePatient({ firstName: 'Test', lastName: 'Phone', phone: '555-1234' });
    assert(result.error === true, 'Should reject short phone');
    afterEach();
  });

  it('savePatient accepts phone with 10+ digits', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'Test', lastName: 'Phone', phone: '(555) 123-4567' });
    assert(!pat.error, 'Should accept valid phone');
    afterEach();
  });

  it('savePatient allows empty optional fields', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'Min', lastName: 'Patient', email: '', phone: '' });
    assert(!pat.error, 'Empty optional fields should be allowed');
    afterEach();
  });

});

/* ----------------------------------------------------------
   4. Encounter CRUD
   ---------------------------------------------------------- */
describe('Encounter CRUD — saveEncounter, getEncounter, getEncountersByPatient', function() {

  it('saveEncounter creates a new encounter with defaults', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'Enc', lastName: 'Test' });
    var enc = saveEncounter({ patientId: pat.id });
    assertNotNull(enc.id, 'Encounter should have an id');
    assertEqual(enc.patientId, pat.id);
    assertEqual(enc.status, 'Open', 'Default status should be Open');
    assertEqual(enc.visitType, 'Outpatient', 'Default visitType should be Outpatient');
    afterEach();
  });

  it('getEncounter retrieves by id', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'Enc', lastName: 'Get' });
    var enc = saveEncounter({ patientId: pat.id, visitType: 'Inpatient' });
    var retrieved = getEncounter(enc.id);
    assertNotNull(retrieved);
    assertEqual(retrieved.visitType, 'Inpatient');
    afterEach();
  });

  it('getEncounter returns null for unknown id', function() {
    beforeEach();
    var result = getEncounter('fake-enc-id');
    assertEqual(result, null);
    afterEach();
  });

  it('getEncountersByPatient returns encounters for a specific patient', function() {
    beforeEach();
    var pat1 = savePatient({ firstName: 'Pat', lastName: 'One' });
    var pat2 = savePatient({ firstName: 'Pat', lastName: 'Two' });
    saveEncounter({ patientId: pat1.id });
    saveEncounter({ patientId: pat1.id });
    saveEncounter({ patientId: pat2.id });
    var enc1 = getEncountersByPatient(pat1.id);
    var enc2 = getEncountersByPatient(pat2.id);
    assertEqual(enc1.length, 2, 'Pat1 should have 2 encounters');
    assertEqual(enc2.length, 1, 'Pat2 should have 1 encounter');
    afterEach();
  });

  it('saveEncounter updates an existing encounter', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'Enc', lastName: 'Update' });
    var enc = saveEncounter({ patientId: pat.id });
    saveEncounter({ id: enc.id, status: 'Signed' });
    var updated = getEncounter(enc.id);
    assertEqual(updated.status, 'Signed');
    afterEach();
  });

  it('saveEncounter rejects missing patientId on new encounter', function() {
    beforeEach();
    var result = saveEncounter({});
    assert(result.error === true, 'Should reject encounter without patientId');
    afterEach();
  });

});

/* ----------------------------------------------------------
   5. Order CRUD
   ---------------------------------------------------------- */
describe('Order CRUD — saveOrder, getOrder, getOrdersByPatient, getOrdersByEncounter', function() {

  it('saveOrder creates a Medication order with defaults', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'Ord', lastName: 'Test' });
    var enc = saveEncounter({ patientId: pat.id });
    var ord = saveOrder({
      encounterId: enc.id,
      patientId: pat.id,
      type: 'Medication',
      detail: { drug: 'Amoxicillin' }
    });
    assertNotNull(ord.id);
    assertEqual(ord.type, 'Medication');
    assertEqual(ord.status, 'Pending', 'Default status should be Pending');
    assertEqual(ord.priority, 'Routine', 'Default priority should be Routine');
    afterEach();
  });

  it('getOrder retrieves by id', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'Ord', lastName: 'Get' });
    var enc = saveEncounter({ patientId: pat.id });
    var ord = saveOrder({
      encounterId: enc.id,
      patientId: pat.id,
      type: 'Lab',
      detail: { panel: 'CBC' }
    });
    var retrieved = getOrder(ord.id);
    assertNotNull(retrieved);
    assertEqual(retrieved.type, 'Lab');
    afterEach();
  });

  it('getOrdersByPatient returns orders for a patient', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'Ord', lastName: 'ByPat' });
    var enc = saveEncounter({ patientId: pat.id });
    saveOrder({ encounterId: enc.id, patientId: pat.id, type: 'Medication', detail: { drug: 'DrugA' } });
    saveOrder({ encounterId: enc.id, patientId: pat.id, type: 'Medication', detail: { drug: 'DrugB' } });
    var orders = getOrdersByPatient(pat.id);
    assertEqual(orders.length, 2);
    afterEach();
  });

  it('getOrdersByEncounter returns orders for an encounter', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'Ord', lastName: 'ByEnc' });
    var enc1 = saveEncounter({ patientId: pat.id });
    var enc2 = saveEncounter({ patientId: pat.id });
    saveOrder({ encounterId: enc1.id, patientId: pat.id, type: 'Medication', detail: { drug: 'DrugX' } });
    saveOrder({ encounterId: enc2.id, patientId: pat.id, type: 'Medication', detail: { drug: 'DrugY' } });
    var orders1 = getOrdersByEncounter(enc1.id);
    var orders2 = getOrdersByEncounter(enc2.id);
    assertEqual(orders1.length, 1);
    assertEqual(orders2.length, 1);
    afterEach();
  });

  it('saveOrder rejects Medication order without drug name', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'Ord', lastName: 'NoDrug' });
    var enc = saveEncounter({ patientId: pat.id });
    var result = saveOrder({
      encounterId: enc.id,
      patientId: pat.id,
      type: 'Medication',
      detail: {}
    });
    assert(result.error === true, 'Should reject Medication order without drug');
    afterEach();
  });

  it('saveOrder rejects Lab order without panel', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'Ord', lastName: 'NoPanel' });
    var enc = saveEncounter({ patientId: pat.id });
    var result = saveOrder({
      encounterId: enc.id,
      patientId: pat.id,
      type: 'Lab',
      detail: {}
    });
    assert(result.error === true, 'Should reject Lab order without panel');
    afterEach();
  });

  it('saveOrder rejects missing encounterId and patientId', function() {
    beforeEach();
    var result = saveOrder({ type: 'Medication', detail: { drug: 'Test' } });
    assert(result.error === true, 'Should reject order without encounterId/patientId');
    afterEach();
  });

  it('updateOrderStatus changes order status', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'Ord', lastName: 'Status' });
    var enc = saveEncounter({ patientId: pat.id });
    var ord = saveOrder({
      encounterId: enc.id,
      patientId: pat.id,
      type: 'Medication',
      detail: { drug: 'Test' }
    });
    var updated = updateOrderStatus(ord.id, 'Completed');
    assertNotNull(updated);
    assertEqual(updated.status, 'Completed');
    assertNotNull(updated.completedAt, 'Completed order should have completedAt timestamp');
    afterEach();
  });

});

/* ----------------------------------------------------------
   6. Schema Validation (validateSchema)
   ---------------------------------------------------------- */
describe('Schema Validation — validateSchema', function() {

  it('validates patient: passes with required fields', function() {
    beforeEach();
    var result = validateSchema({ firstName: 'A', lastName: 'B' }, 'patient');
    assert(result.valid === true, 'Should pass with required fields');
    assertEqual(result.errors.length, 0);
    afterEach();
  });

  it('validates patient: fails without firstName', function() {
    beforeEach();
    var result = validateSchema({ lastName: 'B' }, 'patient');
    assert(result.valid === false);
    assert(result.errors.length > 0);
    afterEach();
  });

  it('validates encounter: fails without patientId', function() {
    beforeEach();
    var result = validateSchema({}, 'encounter');
    assert(result.valid === false);
    assertContains(result.errors[0], 'patientId');
    afterEach();
  });

  it('validates order: fails without patientId and type', function() {
    beforeEach();
    var result = validateSchema({}, 'order');
    assert(result.valid === false);
    assert(result.errors.length >= 2, 'Should report at least 2 missing fields');
    afterEach();
  });

  it('validates order: rejects invalid enum value for type', function() {
    beforeEach();
    var result = validateSchema({ patientId: 'x', type: 'InvalidType' }, 'order');
    assert(result.valid === false);
    assertContains(result.errors[0], 'must be one of');
    afterEach();
  });

  it('validates order: accepts valid enum values', function() {
    beforeEach();
    var result = validateSchema({ patientId: 'x', type: 'Medication' }, 'order');
    assert(result.valid === true);
    afterEach();
  });

  it('validates patient: rejects non-string fields', function() {
    beforeEach();
    var result = validateSchema({ firstName: 'A', lastName: 'B', email: 12345 }, 'patient');
    assert(result.valid === false);
    assertContains(result.errors[0], 'must be a string');
    afterEach();
  });

  it('validates unknown schema name: passes by default', function() {
    beforeEach();
    var result = validateSchema({ anything: true }, 'nonExistentSchema');
    assert(result.valid === true, 'Unknown schema should pass');
    afterEach();
  });

});

/* ----------------------------------------------------------
   7. Soft Delete, Restore, Cascade
   ---------------------------------------------------------- */
describe('Soft Delete / Restore / Cascade', function() {

  it('softDeleteRecord marks a record as _deleted', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'Soft', lastName: 'Del' });
    var result = softDeleteRecord(KEYS.patients, pat.id);
    assert(result === true, 'softDeleteRecord should return true on success');
    var all = loadAll(KEYS.patients, true);
    var found = all.find(function(p) { return p.id === pat.id; });
    assert(found._deleted === true);
    assertNotNull(found._deletedAt, '_deletedAt should be set');
    afterEach();
  });

  it('softDeleteRecord returns false for non-existent id', function() {
    beforeEach();
    var result = softDeleteRecord(KEYS.patients, 'ghost-id');
    assertEqual(result, false);
    afterEach();
  });

  it('loadAll filters out soft-deleted records by default', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'Filter', lastName: 'Test' });
    softDeleteRecord(KEYS.patients, pat.id);
    var patients = loadAll(KEYS.patients);
    var found = patients.find(function(p) { return p.id === pat.id; });
    assertEqual(found, undefined, 'Soft-deleted record should not appear in loadAll');
    afterEach();
  });

  it('loadAll with includeDeleted=true includes soft-deleted records', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'Include', lastName: 'Del' });
    softDeleteRecord(KEYS.patients, pat.id);
    var all = loadAll(KEYS.patients, true);
    var found = all.find(function(p) { return p.id === pat.id; });
    assertNotNull(found, 'Should include deleted record when includeDeleted=true');
    afterEach();
  });

  it('restoreRecord removes _deleted flag', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'Restore', lastName: 'Me' });
    softDeleteRecord(KEYS.patients, pat.id);
    var restored = restoreRecord(KEYS.patients, pat.id);
    assert(restored === true, 'restoreRecord should return true');
    var retrieved = getPatient(pat.id);
    assertNotNull(retrieved, 'Restored patient should be retrievable');
    assertEqual(retrieved.firstName, 'Restore');
    afterEach();
  });

  it('restoreRecord returns false for non-existent id', function() {
    beforeEach();
    var result = restoreRecord(KEYS.patients, 'nonexistent-restore');
    assertEqual(result, false);
    afterEach();
  });

  it('deletePatient cascades to encounters and orders', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'Cascade', lastName: 'Test' });
    var enc = saveEncounter({ patientId: pat.id });
    saveOrder({ encounterId: enc.id, patientId: pat.id, type: 'Medication', detail: { drug: 'TestDrug' } });
    deletePatient(pat.id);
    // Patient should be soft-deleted
    assertEqual(getPatient(pat.id), null, 'Patient should not appear after cascade delete');
    // Encounter should be soft-deleted
    assertEqual(getEncounter(enc.id), null, 'Encounter should be cascade-deleted');
    // Orders for that encounter should be soft-deleted
    var orders = getOrdersByEncounter(enc.id);
    assertEqual(orders.length, 0, 'Orders should be cascade-deleted');
    afterEach();
  });

  it('deletePatient cascades to allergies', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'Allergy', lastName: 'Cascade' });
    savePatientAllergy({ patientId: pat.id, allergen: 'Peanuts', severity: 'Severe', type: 'Food' });
    deletePatient(pat.id);
    var allergies = getPatientAllergies(pat.id);
    assertEqual(allergies.length, 0, 'Allergies should be cascade-deleted');
    afterEach();
  });

});

/* ----------------------------------------------------------
   8. Note CRUD & Addenda
   ---------------------------------------------------------- */
describe('Note CRUD — saveNote, getNoteByEncounter, addNoteAddendum', function() {

  it('saveNote creates a new note keyed by encounterId', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'Note', lastName: 'Test' });
    var enc = saveEncounter({ patientId: pat.id });
    var note = saveNote({ encounterId: enc.id, noteBody: 'Test note body' });
    assertNotNull(note.id);
    assertEqual(note.encounterId, enc.id);
    assertEqual(note.noteBody, 'Test note body');
    assertEqual(note.signed, false, 'Note should start unsigned');
    afterEach();
  });

  it('getNoteByEncounter retrieves the correct note', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'Note', lastName: 'Get' });
    var enc = saveEncounter({ patientId: pat.id });
    saveNote({ encounterId: enc.id, chiefComplaint: 'Headache' });
    var retrieved = getNoteByEncounter(enc.id);
    assertNotNull(retrieved);
    assertEqual(retrieved.chiefComplaint, 'Headache');
    afterEach();
  });

  it('getNoteByEncounter returns null for encounter with no note', function() {
    beforeEach();
    var result = getNoteByEncounter('no-note-enc-id');
    assertEqual(result, null);
    afterEach();
  });

  it('saveNote updates existing note for same encounterId', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'Note', lastName: 'Update' });
    var enc = saveEncounter({ patientId: pat.id });
    saveNote({ encounterId: enc.id, noteBody: 'Original' });
    saveNote({ encounterId: enc.id, noteBody: 'Updated' });
    var note = getNoteByEncounter(enc.id);
    assertEqual(note.noteBody, 'Updated');
    // Should still be only one note for this encounter
    var allNotes = getNotes().filter(function(n) { return n.encounterId === enc.id; });
    assertEqual(allNotes.length, 1, 'Should not duplicate notes');
    afterEach();
  });

  it('addNoteAddendum appends an addendum to a note', function() {
    beforeEach();
    var pat = savePatient({ firstName: 'Note', lastName: 'Addendum' });
    var enc = saveEncounter({ patientId: pat.id });
    saveNote({ encounterId: enc.id, noteBody: 'Base note', signed: true, signedBy: 'Dr. Test' });
    var updated = addNoteAddendum(enc.id, { text: 'Addendum text', addedBy: 'Dr. Test' });
    assertNotNull(updated);
    assert(Array.isArray(updated.addenda), 'addenda should be an array');
    assertEqual(updated.addenda.length, 1);
    assertEqual(updated.addenda[0].text, 'Addendum text');
    assertEqual(updated.addenda[0].addedBy, 'Dr. Test');
    assertNotNull(updated.addenda[0].addedAt, 'Addendum should have addedAt');
    afterEach();
  });

  it('addNoteAddendum returns null for non-existent encounter', function() {
    beforeEach();
    var result = addNoteAddendum('fake-encounter-id', { text: 'Nope', addedBy: 'Nobody' });
    assertEqual(result, null);
    afterEach();
  });

  it('saveNote rejects note without encounterId', function() {
    beforeEach();
    var result = saveNote({});
    assert(result.error === true, 'Should reject note without encounterId');
    afterEach();
  });

});

/* ----------------------------------------------------------
   9. Data Corruption & Cache
   ---------------------------------------------------------- */
describe('Data Corruption & Cache — loadAll, saveAll, _dataCache', function() {

  it('loadAll returns empty array for corrupted JSON', function() {
    beforeEach();
    localStorage.setItem(KEYS.patients, '{{{invalid json!!!');
    // Clear cache so it reads from storage
    if (typeof _dataCache !== 'undefined') {
      for (var k in _dataCache) delete _dataCache[k];
    }
    var result = loadAll(KEYS.patients);
    assert(Array.isArray(result), 'Should return an array');
    assertEqual(result.length, 0, 'Should return empty array for corrupted data');
    afterEach();
  });

  it('loadAll returns cached results on second call', function() {
    beforeEach();
    savePatient({ firstName: 'Cache', lastName: 'Test' });
    var first = loadAll(KEYS.patients);
    var second = loadAll(KEYS.patients);
    assert(first === second, 'Second call should return same array reference (cached)');
    afterEach();
  });

  it('saveAll invalidates cache', function() {
    beforeEach();
    savePatient({ firstName: 'Cache', lastName: 'Invalidate' });
    var before = loadAll(KEYS.patients);
    saveAll(KEYS.patients, before.concat([{ id: 'manual-insert', firstName: 'X', lastName: 'Y' }]));
    var after = loadAll(KEYS.patients);
    assert(before !== after, 'Cache should be invalidated after saveAll');
    assert(after.length === before.length + 1, 'New record should appear after cache invalidation');
    afterEach();
  });

  it('loadAll returns empty array for non-existent key', function() {
    beforeEach();
    var result = loadAll('emr_nonexistent_key_12345');
    assert(Array.isArray(result), 'Should return an array');
    assertEqual(result.length, 0);
    afterEach();
  });

});
