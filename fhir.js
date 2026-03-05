/* ============================================================
   fhir.js — FHIR R4 Resource Mapping Layer
   Maps EMR internal data models to/from FHIR R4 resources.
   Reference: https://hl7.org/fhir/R4/
   ============================================================ */

var FHIR = (function() {

  /* ---------- Coding Systems ---------- */
  var SYSTEMS = {
    icd10:    'http://hl7.org/fhir/sid/icd-10-cm',
    snomed:   'http://snomed.info/sct',
    loinc:    'http://loinc.org',
    rxnorm:   'http://www.nlm.nih.gov/research/umls/rxnorm',
    cpt:      'http://www.ama-assn.org/go/cpt',
    npi:      'http://hl7.org/fhir/sid/us-npi',
    mrn:      'http://gusdorfemr.local/fhir/mrn',
    v2_0203:  'http://terminology.hl7.org/CodeSystem/v2-0203',
    v3_role:  'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
    allergyType: 'http://terminology.hl7.org/CodeSystem/allergy-intolerance-type',
    allergyCat:  'http://terminology.hl7.org/CodeSystem/allergy-intolerance-category',
    allergyCrit: 'http://terminology.hl7.org/CodeSystem/allergy-intolerance-criticality',
    condClinical: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
    condCategory: 'http://terminology.hl7.org/CodeSystem/condition-category',
    obsCategory:  'http://terminology.hl7.org/CodeSystem/observation-category',
    medReqIntent: 'http://hl7.org/fhir/CodeSystem/medicationrequest-intent',
    encounterClass: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
  };

  /* ---------- Helper: Build CodeableConcept ---------- */
  function codeable(code, display, system) {
    var cc = { text: display || code };
    if (code && system) {
      cc.coding = [{ system: system, code: code, display: display || code }];
    }
    return cc;
  }

  /* ---------- Helper: Build Reference ---------- */
  function ref(resourceType, id, display) {
    var r = { reference: resourceType + '/' + id };
    if (display) r.display = display;
    return r;
  }

  /* ---------- Helper: Build Identifier ---------- */
  function identifier(system, value, type) {
    var id = { system: system, value: value };
    if (type) id.type = codeable(type, type, SYSTEMS.v2_0203);
    return id;
  }

  /* ---------- Map severity ---------- */
  function mapAllergySeverity(sev) {
    var map = { 'Mild': 'low', 'Moderate': 'low', 'Severe': 'high', 'Life-threatening': 'high' };
    return map[sev] || 'unable-to-assess';
  }

  function mapAllergyCategory(type) {
    var map = { 'Drug': 'medication', 'Food': 'food', 'Environmental': 'environment', 'Other': 'biologic' };
    return map[type] || 'medication';
  }

  function mapEncounterClass(visitType) {
    var map = { 'Outpatient': 'AMB', 'Inpatient': 'IMP', 'Emergency': 'EMER', 'Urgent Care': 'AMB' };
    return map[visitType] || 'AMB';
  }

  function mapEncounterStatus(status) {
    var map = { 'Open': 'in-progress', 'Signed': 'finished', 'Cancelled': 'cancelled' };
    return map[status] || 'unknown';
  }

  function mapOrderStatus(status) {
    var map = { 'Pending': 'active', 'Active': 'active', 'Completed': 'completed', 'Cancelled': 'cancelled' };
    return map[status] || 'unknown';
  }

  function mapPriority(pri) {
    var map = { 'Routine': 'routine', 'Urgent': 'urgent', 'STAT': 'stat' };
    return map[pri] || 'routine';
  }

  /* ============================================================
     TO FHIR: EMR → FHIR R4 Resources
     ============================================================ */

  function patientToFHIR(pat) {
    var resource = {
      resourceType: 'Patient',
      id: pat.id,
      identifier: [],
      name: [{
        use: 'official',
        family: pat.lastName,
        given: [pat.firstName],
      }],
      gender: (pat.sex || '').toLowerCase() === 'male' ? 'male' :
              (pat.sex || '').toLowerCase() === 'female' ? 'female' : 'unknown',
      birthDate: pat.dob || null,
      telecom: [],
      address: [],
    };

    if (pat.mrn) resource.identifier.push(identifier(SYSTEMS.mrn, pat.mrn, 'MR'));
    if (pat.phone) resource.telecom.push({ system: 'phone', value: pat.phone, use: 'home' });
    if (pat.email) resource.telecom.push({ system: 'email', value: pat.email });

    if (pat.addressStreet || pat.addressCity) {
      resource.address.push({
        use: 'home',
        line: pat.addressStreet ? [pat.addressStreet] : [],
        city: pat.addressCity || '',
        state: pat.addressState || '',
        postalCode: pat.addressZip || '',
      });
    }

    if (pat.emergencyContactName) {
      resource.contact = [{
        relationship: [codeable('C', 'Emergency Contact')],
        name: { text: pat.emergencyContactName },
        telecom: pat.emergencyContactPhone ? [{ system: 'phone', value: pat.emergencyContactPhone }] : [],
      }];
    }

    return resource;
  }

  function practitionerToFHIR(prov) {
    var resource = {
      resourceType: 'Practitioner',
      id: prov.id,
      identifier: [],
      name: [{
        use: 'official',
        family: prov.lastName,
        given: [prov.firstName],
        suffix: prov.degree ? [prov.degree] : [],
      }],
      telecom: [],
      qualification: [],
    };

    if (prov.npiNumber) resource.identifier.push(identifier(SYSTEMS.npi, prov.npiNumber, 'NPI'));
    if (prov.phone) resource.telecom.push({ system: 'phone', value: prov.phone });
    if (prov.email) resource.telecom.push({ system: 'email', value: prov.email });
    if (prov.degree) {
      resource.qualification.push({
        code: codeable(prov.degree, prov.degree),
      });
    }

    return resource;
  }

  function encounterToFHIR(enc) {
    var resource = {
      resourceType: 'Encounter',
      id: enc.id,
      status: mapEncounterStatus(enc.status),
      class: {
        system: SYSTEMS.encounterClass,
        code: mapEncounterClass(enc.visitType),
        display: enc.visitType,
      },
      subject: ref('Patient', enc.patientId),
      participant: [],
      period: { start: enc.dateTime || enc.visitDate },
    };

    if (enc.providerId) {
      resource.participant.push({
        type: [codeable('ATND', 'Attender', SYSTEMS.v3_role)],
        individual: ref('Practitioner', enc.providerId),
      });
    }

    if (enc.diagnoses && enc.diagnoses.length > 0) {
      resource.diagnosis = enc.diagnoses.map(function(dx, i) {
        return {
          condition: ref('Condition', dx.id || ('dx-' + i)),
          rank: i + 1,
        };
      });
    }

    return resource;
  }

  function allergyToFHIR(allergy) {
    return {
      resourceType: 'AllergyIntolerance',
      id: allergy.id,
      clinicalStatus: codeable('active', 'Active', SYSTEMS.condClinical),
      category: [mapAllergyCategory(allergy.type)],
      criticality: mapAllergySeverity(allergy.severity),
      code: codeable(null, allergy.allergen),
      patient: ref('Patient', allergy.patientId),
      reaction: allergy.reaction ? [{
        manifestation: [codeable(null, allergy.reaction)],
        severity: (allergy.severity || '').toLowerCase() === 'severe' || (allergy.severity || '').toLowerCase() === 'life-threatening' ? 'severe' : 'moderate',
      }] : [],
    };
  }

  function conditionToFHIR(problem) {
    var resource = {
      resourceType: 'Condition',
      id: problem.id,
      clinicalStatus: codeable(
        (problem.status || 'Active').toLowerCase() === 'active' ? 'active' : 'resolved',
        problem.status || 'Active',
        SYSTEMS.condClinical
      ),
      category: [codeable('problem-list-item', 'Problem List Item', SYSTEMS.condCategory)],
      code: codeable(problem.icd10 || null, problem.name, problem.icd10 ? SYSTEMS.icd10 : null),
      subject: ref('Patient', problem.patientId),
    };

    if (problem.onset) resource.onsetDateTime = problem.onset;
    if (problem.notes) resource.note = [{ text: problem.notes }];

    return resource;
  }

  function medicationRequestToFHIR(order) {
    var detail = order.detail || {};
    return {
      resourceType: 'MedicationRequest',
      id: order.id,
      status: mapOrderStatus(order.status),
      intent: 'order',
      priority: mapPriority(order.priority),
      medicationCodeableConcept: codeable(null, detail.drug || detail.drugName),
      subject: ref('Patient', order.patientId),
      encounter: order.encounterId ? ref('Encounter', order.encounterId) : undefined,
      dosageInstruction: [{
        text: [detail.dose, detail.unit, detail.route, detail.frequency].filter(Boolean).join(' '),
        timing: detail.frequency ? { code: codeable(null, detail.frequency) } : undefined,
        route: detail.route ? codeable(null, detail.route) : undefined,
        doseAndRate: detail.dose ? [{
          doseQuantity: { value: parseFloat(detail.dose) || 0, unit: detail.unit || 'mg' },
        }] : [],
      }],
      note: order.notes ? [{ text: order.notes }] : [],
    };
  }

  function observationToFHIR(vital, component) {
    // Map a single vital sign component to FHIR Observation
    var loincMap = {
      bpSystolic:  { code: '8480-6', display: 'Systolic blood pressure', unit: 'mmHg' },
      bpDiastolic: { code: '8462-4', display: 'Diastolic blood pressure', unit: 'mmHg' },
      heartRate:   { code: '8867-4', display: 'Heart rate', unit: '/min' },
      respRate:    { code: '9279-1', display: 'Respiratory rate', unit: '/min' },
      tempF:       { code: '8310-5', display: 'Body temperature', unit: '[degF]' },
      spo2:        { code: '2708-6', display: 'Oxygen saturation', unit: '%' },
      weightLbs:   { code: '29463-7', display: 'Body weight', unit: '[lb_av]' },
      heightIn:    { code: '8302-2', display: 'Body height', unit: '[in_i]' },
    };

    var mapping = loincMap[component];
    if (!mapping) return null;

    var value = vital[component];
    if (value === undefined || value === null || value === '') return null;

    return {
      resourceType: 'Observation',
      id: vital.id + '-' + component,
      status: 'final',
      category: [codeable('vital-signs', 'Vital Signs', SYSTEMS.obsCategory)],
      code: codeable(mapping.code, mapping.display, SYSTEMS.loinc),
      subject: ref('Patient', vital.patientId),
      encounter: vital.encounterId ? ref('Encounter', vital.encounterId) : undefined,
      effectiveDateTime: vital.recordedAt || new Date().toISOString(),
      valueQuantity: {
        value: parseFloat(value),
        unit: mapping.unit,
        system: 'http://unitsofmeasure.org',
        code: mapping.unit,
      },
    };
  }

  function vitalsToFHIR(vital) {
    // Convert all vital sign components to FHIR Observations
    var components = ['bpSystolic', 'bpDiastolic', 'heartRate', 'respRate', 'tempF', 'spo2', 'weightLbs', 'heightIn'];
    return components.map(function(c) { return observationToFHIR(vital, c); }).filter(Boolean);
  }

  function labResultToFHIR(lab) {
    var resource = {
      resourceType: 'DiagnosticReport',
      id: lab.id,
      status: 'final',
      category: [codeable('LAB', 'Laboratory', SYSTEMS.obsCategory)],
      code: codeable(null, lab.panel || 'Lab Panel'),
      subject: ref('Patient', lab.patientId),
      effectiveDateTime: lab.resultDate,
      result: [],
    };

    if (lab.tests && lab.tests.length > 0) {
      resource.result = lab.tests.map(function(test, i) {
        return ref('Observation', lab.id + '-obs-' + i, test.name);
      });
    }

    return resource;
  }

  function immunizationToFHIR(imm) {
    return {
      resourceType: 'Immunization',
      id: imm.id,
      status: 'completed',
      vaccineCode: codeable(null, imm.vaccine),
      patient: ref('Patient', imm.patientId),
      occurrenceDateTime: imm.date,
      lotNumber: imm.lot || undefined,
      manufacturer: imm.manufacturer ? { display: imm.manufacturer } : undefined,
      site: imm.site ? codeable(null, imm.site) : undefined,
      performer: imm.givenBy ? [{ actor: { display: imm.givenBy } }] : [],
      note: imm.notes ? [{ text: imm.notes }] : [],
    };
  }

  /* ============================================================
     FROM FHIR: FHIR R4 → EMR internal models
     ============================================================ */

  function patientFromFHIR(fhirPatient) {
    var name = (fhirPatient.name && fhirPatient.name[0]) || {};
    var phone = (fhirPatient.telecom || []).find(function(t) { return t.system === 'phone'; });
    var email = (fhirPatient.telecom || []).find(function(t) { return t.system === 'email'; });
    var addr = (fhirPatient.address && fhirPatient.address[0]) || {};
    var mrnId = (fhirPatient.identifier || []).find(function(id) {
      return id.system === SYSTEMS.mrn || (id.type && id.type.text === 'MR');
    });

    return {
      id: fhirPatient.id,
      mrn: mrnId ? mrnId.value : undefined,
      firstName: (name.given && name.given[0]) || '',
      lastName: name.family || '',
      dob: fhirPatient.birthDate || '',
      sex: fhirPatient.gender === 'male' ? 'Male' : fhirPatient.gender === 'female' ? 'Female' : '',
      phone: phone ? phone.value : '',
      email: email ? email.value : '',
      addressStreet: (addr.line && addr.line[0]) || '',
      addressCity: addr.city || '',
      addressState: addr.state || '',
      addressZip: addr.postalCode || '',
    };
  }

  function allergyFromFHIR(fhirAllergy) {
    var catMap = { medication: 'Drug', food: 'Food', environment: 'Environmental', biologic: 'Other' };
    var critMap = { low: 'Moderate', high: 'Severe', 'unable-to-assess': 'Moderate' };
    var category = fhirAllergy.category && fhirAllergy.category[0];

    return {
      id: fhirAllergy.id,
      patientId: fhirAllergy.patient ? fhirAllergy.patient.reference.split('/')[1] : '',
      allergen: (fhirAllergy.code && fhirAllergy.code.text) || '',
      type: catMap[category] || 'Drug',
      severity: critMap[fhirAllergy.criticality] || 'Moderate',
      reaction: fhirAllergy.reaction && fhirAllergy.reaction[0] && fhirAllergy.reaction[0].manifestation
        ? fhirAllergy.reaction[0].manifestation[0].text || '' : '',
    };
  }

  function conditionFromFHIR(fhirCondition) {
    var codeText = (fhirCondition.code && fhirCondition.code.text) || '';
    var icd10 = '';
    if (fhirCondition.code && fhirCondition.code.coding) {
      var icdCoding = fhirCondition.code.coding.find(function(c) { return c.system === SYSTEMS.icd10; });
      if (icdCoding) icd10 = icdCoding.code;
    }
    var clinStatus = fhirCondition.clinicalStatus && fhirCondition.clinicalStatus.coding
      ? fhirCondition.clinicalStatus.coding[0].code : 'active';

    return {
      id: fhirCondition.id,
      patientId: fhirCondition.subject ? fhirCondition.subject.reference.split('/')[1] : '',
      name: codeText,
      icd10: icd10,
      status: clinStatus === 'active' ? 'Active' : 'Resolved',
      onset: fhirCondition.onsetDateTime || '',
      notes: fhirCondition.note && fhirCondition.note[0] ? fhirCondition.note[0].text : '',
    };
  }

  /* ============================================================
     BUNDLE: Export/Import as FHIR Bundle
     ============================================================ */

  function patientToBundle(patientId) {
    if (typeof getPatient !== 'function') return null;
    var pat = getPatient(patientId);
    if (!pat) return null;

    var entries = [];

    // Patient resource
    entries.push({ resource: patientToFHIR(pat), request: { method: 'PUT', url: 'Patient/' + pat.id } });

    // Allergies
    if (typeof loadAll === 'function') {
      var allergies = loadAll('emr_allergies').filter(function(a) { return a.patientId === patientId; });
      allergies.forEach(function(a) {
        entries.push({ resource: allergyToFHIR(a), request: { method: 'PUT', url: 'AllergyIntolerance/' + a.id } });
      });

      // Problems
      var problems = loadAll('emr_problems').filter(function(p) { return p.patientId === patientId; });
      problems.forEach(function(p) {
        entries.push({ resource: conditionToFHIR(p), request: { method: 'PUT', url: 'Condition/' + p.id } });
      });

      // Immunizations
      var imms = loadAll('emr_immunizations').filter(function(i) { return i.patientId === patientId; });
      imms.forEach(function(i) {
        entries.push({ resource: immunizationToFHIR(i), request: { method: 'PUT', url: 'Immunization/' + i.id } });
      });

      // Medication orders
      var orders = loadAll('emr_orders').filter(function(o) { return o.patientId === patientId && o.type === 'Medication'; });
      orders.forEach(function(o) {
        entries.push({ resource: medicationRequestToFHIR(o), request: { method: 'PUT', url: 'MedicationRequest/' + o.id } });
      });

      // Encounters
      var encounters = loadAll('emr_encounters').filter(function(e) { return e.patientId === patientId; });
      encounters.forEach(function(e) {
        entries.push({ resource: encounterToFHIR(e), request: { method: 'PUT', url: 'Encounter/' + e.id } });
      });

      // Vitals → Observations
      var vitals = loadAll('emr_vitals').filter(function(v) { return v.patientId === patientId; });
      vitals.forEach(function(v) {
        vitalsToFHIR(v).forEach(function(obs) {
          entries.push({ resource: obs, request: { method: 'PUT', url: 'Observation/' + obs.id } });
        });
      });
    }

    return {
      resourceType: 'Bundle',
      type: 'transaction',
      timestamp: new Date().toISOString(),
      entry: entries,
    };
  }

  /* ============================================================
     PUBLIC API
     ============================================================ */
  return {
    SYSTEMS: SYSTEMS,

    // To FHIR
    patient:     patientToFHIR,
    practitioner: practitionerToFHIR,
    encounter:   encounterToFHIR,
    allergy:     allergyToFHIR,
    condition:   conditionToFHIR,
    medicationRequest: medicationRequestToFHIR,
    observation: observationToFHIR,
    vitals:      vitalsToFHIR,
    labResult:   labResultToFHIR,
    immunization: immunizationToFHIR,

    // From FHIR
    fromPatient:   patientFromFHIR,
    fromAllergy:   allergyFromFHIR,
    fromCondition: conditionFromFHIR,

    // Bundle
    patientBundle: patientToBundle,

    // Helpers
    codeable: codeable,
    ref: ref,
    identifier: identifier,
  };
})();
