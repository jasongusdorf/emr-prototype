/* ============================================================
   views/cds.js — Clinical Decision Support & Best Practice Alerts
   Provides checkCDS(order, patientId), getBPAs(patientId),
   and CDS dashboard / BPA banner system
   ============================================================ */

/* ---------- Drug Interaction Database ---------- */
var DRUG_INTERACTIONS = [
  // Anticoagulants + NSAIDs
  { drugs: ['warfarin', 'aspirin'], severity: 'critical', message: 'Warfarin + Aspirin: Increased bleeding risk. Monitor INR closely.' },
  { drugs: ['warfarin', 'ibuprofen'], severity: 'critical', message: 'Warfarin + Ibuprofen: Major bleeding risk. Avoid concurrent use.' },
  { drugs: ['warfarin', 'naproxen'], severity: 'critical', message: 'Warfarin + Naproxen: Major bleeding risk. Avoid concurrent use.' },
  { drugs: ['warfarin', 'ketorolac'], severity: 'critical', message: 'Warfarin + Ketorolac: Severe bleeding risk. CONTRAINDICATED.' },
  { drugs: ['heparin', 'aspirin'], severity: 'warning', message: 'Heparin + Aspirin: Increased bleeding risk.' },
  { drugs: ['heparin', 'warfarin'], severity: 'warning', message: 'Heparin + Warfarin: Overlap may increase bleeding risk. Monitor closely during transition.' },
  { drugs: ['enoxaparin', 'aspirin'], severity: 'warning', message: 'Enoxaparin + Aspirin: Increased bleeding risk.' },
  // Serotonergic interactions
  { drugs: ['sertraline', 'tramadol'], severity: 'critical', message: 'SSRI + Tramadol: Risk of serotonin syndrome.' },
  { drugs: ['escitalopram', 'tramadol'], severity: 'critical', message: 'SSRI + Tramadol: Risk of serotonin syndrome.' },
  { drugs: ['fluoxetine', 'tramadol'], severity: 'critical', message: 'Fluoxetine + Tramadol: Risk of serotonin syndrome.' },
  { drugs: ['sertraline', 'sumatriptan'], severity: 'warning', message: 'SSRI + Triptan: Theoretical risk of serotonin syndrome. Monitor symptoms.' },
  // ACE + K-sparing / potassium
  { drugs: ['lisinopril', 'spironolactone'], severity: 'warning', message: 'ACE Inhibitor + Spironolactone: Risk of hyperkalemia. Monitor potassium.' },
  { drugs: ['enalapril', 'spironolactone'], severity: 'warning', message: 'ACE Inhibitor + Spironolactone: Risk of hyperkalemia. Monitor potassium.' },
  { drugs: ['lisinopril', 'potassium chloride'], severity: 'warning', message: 'ACE Inhibitor + KCl: Risk of hyperkalemia. Monitor potassium levels.' },
  // QT prolongation
  { drugs: ['ondansetron', 'escitalopram'], severity: 'warning', message: 'Ondansetron + Escitalopram: Both prolong QTc. Monitor ECG.' },
  { drugs: ['ondansetron', 'fluoxetine'], severity: 'warning', message: 'Ondansetron + Fluoxetine: QT prolongation risk.' },
  { drugs: ['amiodarone', 'escitalopram'], severity: 'critical', message: 'Amiodarone + SSRI: High risk of QT prolongation and torsades de pointes.' },
  // Metformin + contrast
  { drugs: ['metformin', 'contrast dye'], severity: 'critical', message: 'Hold Metformin before/after contrast dye. Risk of lactic acidosis with renal impairment.' },
  // Statin interactions
  { drugs: ['simvastatin', 'amiodarone'], severity: 'warning', message: 'Simvastatin + Amiodarone: Increased risk of rhabdomyolysis. Limit dose to 20mg.' },
  { drugs: ['atorvastatin', 'clarithromycin'], severity: 'warning', message: 'Statin + Clarithromycin: Increased myopathy risk.' },
  // Digoxin
  { drugs: ['digoxin', 'amiodarone'], severity: 'critical', message: 'Digoxin + Amiodarone: Amiodarone increases digoxin levels. Reduce digoxin dose by 50%.' },
  { drugs: ['digoxin', 'verapamil'], severity: 'warning', message: 'Digoxin + Verapamil: Increased digoxin levels. Monitor levels.' },
  // Lithium
  { drugs: ['lithium', 'ibuprofen'], severity: 'critical', message: 'Lithium + NSAID: NSAIDs increase lithium levels. Avoid or monitor closely.' },
  { drugs: ['lithium', 'lisinopril'], severity: 'warning', message: 'Lithium + ACE Inhibitor: May increase lithium levels.' },
];

/* ---------- Allergy Cross-Reactivity Map ---------- */
var ALLERGY_CROSS_REACTIVITY = [
  { allergen: 'penicillin', crossReacts: ['amoxicillin', 'ampicillin', 'piperacillin', 'piperacillin-tazobactam', 'nafcillin', 'oxacillin', 'dicloxacillin'], message: 'Patient has Penicillin allergy. {drug} is a penicillin-class antibiotic.' },
  { allergen: 'penicillin', crossReacts: ['cephalexin', 'cefazolin', 'ceftriaxone', 'cefepime', 'cefdinir'], message: 'Patient has Penicillin allergy. {drug} is a cephalosporin — ~2% cross-reactivity risk.', severity: 'warning' },
  { allergen: 'sulfonamides', crossReacts: ['sulfamethoxazole', 'trimethoprim-sulfamethoxazole', 'sulfasalazine'], message: 'Patient has Sulfonamide allergy. {drug} contains sulfonamide.' },
  { allergen: 'sulfa', crossReacts: ['sulfamethoxazole', 'trimethoprim-sulfamethoxazole', 'sulfasalazine'], message: 'Patient has Sulfa allergy. {drug} contains sulfonamide.' },
  { allergen: 'nsaids', crossReacts: ['ibuprofen', 'naproxen', 'ketorolac', 'meloxicam', 'celecoxib', 'diclofenac', 'indomethacin'], message: 'Patient has NSAID allergy. {drug} is an NSAID.' },
  { allergen: 'aspirin', crossReacts: ['ibuprofen', 'naproxen', 'ketorolac'], message: 'Patient has Aspirin allergy. {drug} is an NSAID with cross-reactivity risk.' },
  { allergen: 'codeine', crossReacts: ['morphine', 'hydrocodone', 'oxycodone', 'hydromorphone'], message: 'Patient has Codeine allergy. {drug} is an opioid — consider alternative.' },
  { allergen: 'ace inhibitors', crossReacts: ['lisinopril', 'enalapril', 'ramipril', 'benazepril', 'captopril', 'fosinopril', 'quinapril'], message: 'Patient has ACE Inhibitor allergy. {drug} is an ACE inhibitor.' },
  { allergen: 'contrast dye', crossReacts: ['iodinated contrast'], message: 'Patient has Contrast Dye allergy. Pre-medicate with steroids/antihistamines if contrast imaging is necessary.' },
  { allergen: 'iodine', crossReacts: ['iodinated contrast', 'amiodarone'], message: 'Patient has Iodine allergy. {drug} may contain iodine.' },
  { allergen: 'latex', crossReacts: [], message: 'Patient has Latex allergy. Use non-latex gloves and equipment.' },
];

/* ---------- Dose Range Database ---------- */
var DOSE_RANGES = {
  'acetaminophen': { maxSingleDose: 1000, maxDailyDose: 4000, unit: 'mg', warningMsg: 'Acetaminophen: Max 1g/dose, 4g/day. Risk of hepatotoxicity.' },
  'ibuprofen': { maxSingleDose: 800, maxDailyDose: 3200, unit: 'mg', warningMsg: 'Ibuprofen: Max 800mg/dose, 3200mg/day.' },
  'lisinopril': { maxSingleDose: 80, maxDailyDose: 80, unit: 'mg', warningMsg: 'Lisinopril: Max 80mg/day. Usual max is 40mg/day.' },
  'metoprolol tartrate': { maxSingleDose: 200, maxDailyDose: 400, unit: 'mg', warningMsg: 'Metoprolol tartrate: Max 200mg/dose.' },
  'metoprolol succinate': { maxSingleDose: 400, maxDailyDose: 400, unit: 'mg', warningMsg: 'Metoprolol XL: Max 400mg/day.' },
  'amlodipine': { maxSingleDose: 10, maxDailyDose: 10, unit: 'mg', warningMsg: 'Amlodipine: Max 10mg/day.' },
  'atorvastatin': { maxSingleDose: 80, maxDailyDose: 80, unit: 'mg', warningMsg: 'Atorvastatin: Max 80mg/day.' },
  'metformin': { maxSingleDose: 1000, maxDailyDose: 2550, unit: 'mg', warningMsg: 'Metformin: Max 1000mg/dose, 2550mg/day.' },
  'furosemide': { maxSingleDose: 200, maxDailyDose: 600, unit: 'mg', warningMsg: 'Furosemide: Max 200mg IV single dose.' },
  'ondansetron': { maxSingleDose: 16, maxDailyDose: 32, unit: 'mg', warningMsg: 'Ondansetron: Max 16mg single IV dose (QT risk).' },
  'ketorolac': { maxSingleDose: 30, maxDailyDose: 120, unit: 'mg', warningMsg: 'Ketorolac: Max 30mg IV/dose. Limit to 5 days total.' },
  'digoxin': { maxSingleDose: 0.5, maxDailyDose: 0.5, unit: 'mg', warningMsg: 'Digoxin: Usual max 0.25-0.5mg/day. Monitor levels.' },
  'warfarin': { maxSingleDose: 15, maxDailyDose: 15, unit: 'mg', warningMsg: 'Warfarin: Doses >10mg unusual. Verify indication.' },
};

/* ---------- High-Alert Medications (7b) ---------- */
var HIGH_ALERT_MEDS = ['insulin', 'heparin', 'warfarin', 'morphine', 'fentanyl', 'hydromorphone', 'oxycodone', 'methadone', 'succinylcholine', 'rocuronium', 'vecuronium', 'potassium chloride', 'magnesium sulfate'];

/* ---------- Critical Lab Values (7d) ---------- */
var CRITICAL_VALUES = {
  'potassium': { low: 2.5, high: 6.0, unit: 'mEq/L' },
  'sodium': { low: 120, high: 160, unit: 'mEq/L' },
  'glucose': { low: 40, high: 500, unit: 'mg/dL' },
  'hemoglobin': { low: 7.0, high: null, unit: 'g/dL' },
  'platelets': { low: 20, high: null, unit: 'K/uL' },
  'wbc': { low: 1.0, high: 30.0, unit: 'K/uL' },
  'creatinine': { low: null, high: 10.0, unit: 'mg/dL' },
  'inr': { low: null, high: 5.0, unit: '' },
  'troponin': { low: null, high: 0.04, unit: 'ng/mL' },
};

/* ---------- Renal Dose Adjustments ---------- */
var RENAL_DOSE_ALERTS = {
  'metformin': { creatinineThreshold: 1.5, egfrThreshold: 30, message: 'Metformin: Contraindicated if eGFR <30. Reduce dose if eGFR 30-45.' },
  'enoxaparin': { creatinineThreshold: 1.5, egfrThreshold: 30, message: 'Enoxaparin: Reduce to 30mg QDay if CrCl <30 mL/min.' },
  'gabapentin': { creatinineThreshold: 1.5, egfrThreshold: 30, message: 'Gabapentin: Reduce dose in renal impairment (CrCl <60).' },
  'vancomycin': { creatinineThreshold: 1.3, egfrThreshold: 50, message: 'Vancomycin: Requires renal dose adjustment and trough monitoring.' },
  'digoxin': { creatinineThreshold: 1.3, egfrThreshold: 50, message: 'Digoxin: Primarily renally cleared. Reduce dose in renal impairment.' },
  'lithium': { creatinineThreshold: 1.3, egfrThreshold: 60, message: 'Lithium: Renally cleared. Reduce dose and monitor levels in CKD.' },
  'ibuprofen': { creatinineThreshold: 1.5, egfrThreshold: 45, message: 'Ibuprofen: Avoid in CKD Stage 3b-5 (eGFR <45). Risk of AKI and GI bleeding.' },
  'naproxen': { creatinineThreshold: 1.5, egfrThreshold: 45, message: 'Naproxen: Avoid in CKD Stage 3b-5 (eGFR <45). Risk of AKI and GI bleeding.' },
  'ketorolac': { creatinineThreshold: 1.3, egfrThreshold: 45, message: 'Ketorolac: Contraindicated in renal impairment (eGFR <45). Max 5 days use.' },
  'gentamicin': { creatinineThreshold: 1.3, egfrThreshold: 60, message: 'Gentamicin: Extended-interval dosing recommended. Monitor trough levels in renal impairment.' },
  'tobramycin': { creatinineThreshold: 1.3, egfrThreshold: 60, message: 'Tobramycin: Extended-interval dosing recommended. Monitor trough levels in renal impairment.' },
  'amikacin': { creatinineThreshold: 1.3, egfrThreshold: 60, message: 'Amikacin: Extended-interval dosing recommended. Monitor trough levels in renal impairment.' },
  'apixaban': { creatinineThreshold: 1.5, egfrThreshold: 25, message: 'Apixaban: Reduce to 2.5mg BID if CrCl 15-25 mL/min or if 2 of: age\u226580, weight\u226460kg, Cr\u22651.5.' },
  'rivaroxaban': { creatinineThreshold: 1.5, egfrThreshold: 50, message: 'Rivaroxaban: Avoid if CrCl <15. Reduce dose for CrCl 15-50 based on indication.' },
  'dabigatran': { creatinineThreshold: 1.5, egfrThreshold: 30, message: 'Dabigatran: Reduce to 75mg BID if CrCl 15-30. Contraindicated if CrCl <15.' },
};

/* ---------- CDS Alert History ---------- */
var _cdsAlertLog = [];

function logCDSAlert(alert, patientId, orderId) {
  var entry = {
    id: generateId(),
    patientId: patientId || '',
    orderId: orderId || '',
    severity: alert.severity,
    type: alert.type,
    message: alert.message,
    timestamp: new Date().toISOString(),
    acknowledged: false,
    acknowledgedBy: null,
    acknowledgedAt: null,
  };
  var all = loadAll(KEYS.cdsAlerts, true);
  all.push(entry);
  saveAll(KEYS.cdsAlerts, all);
  return entry;
}

function getCDSAlerts(patientId) {
  var all = loadAll(KEYS.cdsAlerts);
  if (patientId) return all.filter(function(a) { return a.patientId === patientId; });
  return all;
}

function acknowledgeCDSAlert(alertId) {
  var all = loadAll(KEYS.cdsAlerts, true);
  var idx = all.findIndex(function(a) { return a.id === alertId; });
  if (idx < 0) return;
  var user = getSessionUser();
  all[idx].acknowledged = true;
  all[idx].acknowledgedBy = user ? user.id : '';
  all[idx].acknowledgedAt = new Date().toISOString();
  saveAll(KEYS.cdsAlerts, all);
}

/* ---------- Main CDS Checking Function ---------- */
function checkCDS(order, patientId) {
  var alerts = [];
  if (!order || !patientId) return alerts;

  var patient = getPatient(patientId);
  if (!patient) return alerts;

  // Only check medication orders for drug interactions / allergy / dose
  if (order.type === 'Medication' && order.detail) {
    var drugName = (order.detail.drug || '').toLowerCase().trim();
    if (!drugName) return alerts;

    // 1. Allergy cross-reactivity
    var allergies = typeof getPatientAllergies === 'function' ? getPatientAllergies(patientId) : [];
    allergies.forEach(function(allergy) {
      var allergenLower = (allergy.allergen || '').toLowerCase().trim();
      if (allergenLower === 'nkda' || allergenLower === '') return;

      // Direct match — hard-stop blocked (7a)
      if (drugName.indexOf(allergenLower) >= 0 || allergenLower.indexOf(drugName) >= 0) {
        alerts.push({
          severity: 'critical',
          type: 'allergy-block',
          message: 'ORDER BLOCKED: Patient has documented allergy to "' + allergy.allergen + '". ' + (order.detail.drug) + ' is contraindicated. Reaction: ' + (allergy.reaction || 'Unknown'),
          blocked: true,
          allergen: allergy.allergen,
        });
      }

      // Cross-reactivity
      ALLERGY_CROSS_REACTIVITY.forEach(function(cr) {
        if (allergenLower.indexOf(cr.allergen) >= 0 || cr.allergen.indexOf(allergenLower) >= 0) {
          cr.crossReacts.forEach(function(xr) {
            if (drugName.indexOf(xr) >= 0 || xr.indexOf(drugName) >= 0) {
              var crossSeverity = cr.severity || 'critical';
              var isBlocked = crossSeverity === 'critical';
              alerts.push({
                severity: crossSeverity,
                type: isBlocked ? 'allergy-block' : 'allergy-cross',
                message: isBlocked
                  ? 'ORDER BLOCKED: ' + cr.message.replace('{drug}', order.detail.drug) + ' This medication is contraindicated.'
                  : cr.message.replace('{drug}', order.detail.drug),
                blocked: isBlocked,
                allergen: allergy.allergen,
              });
            }
          });
        }
      });
    });

    // 2. Drug-drug interactions (against current meds + active orders)
    var currentMeds = [];
    if (typeof getPatientMedications === 'function') {
      currentMeds = getPatientMedications(patientId)
        .filter(function(m) { return m.status === 'Current' || m.status === 'Active'; })
        .map(function(m) { return (m.name || m.drug || '').toLowerCase().trim(); });
    }

    // Also check active orders for this patient
    var activeOrders = getOrdersByPatient(patientId)
      .filter(function(o) { return o.type === 'Medication' && (o.status === 'Pending' || o.status === 'Active'); })
      .map(function(o) { return (o.detail.drug || '').toLowerCase().trim(); });

    var allActiveDrugs = currentMeds.concat(activeOrders);

    DRUG_INTERACTIONS.forEach(function(interaction) {
      var drugA = interaction.drugs[0];
      var drugB = interaction.drugs[1];
      var ordered = drugName;

      var matchesA = ordered.indexOf(drugA) >= 0 || drugA.indexOf(ordered) >= 0;
      var matchesB = ordered.indexOf(drugB) >= 0 || drugB.indexOf(ordered) >= 0;

      allActiveDrugs.forEach(function(activeDrug) {
        if (!activeDrug) return;
        var activeMatchA = activeDrug.indexOf(drugA) >= 0 || drugA.indexOf(activeDrug) >= 0;
        var activeMatchB = activeDrug.indexOf(drugB) >= 0 || drugB.indexOf(activeDrug) >= 0;

        if ((matchesA && activeMatchB) || (matchesB && activeMatchA)) {
          // Avoid duplicate alerts
          var existing = alerts.find(function(a) { return a.message === interaction.message; });
          if (!existing) {
            alerts.push({
              severity: interaction.severity,
              type: 'drug-interaction',
              message: interaction.message,
            });
          }
        }
      });
    });

    // 3. Duplicate order detection
    var existingOrders = getOrdersByPatient(patientId)
      .filter(function(o) { return o.type === 'Medication' && (o.status === 'Pending' || o.status === 'Active'); });

    existingOrders.forEach(function(existing) {
      var existingDrug = (existing.detail.drug || '').toLowerCase().trim();
      if (existingDrug && (drugName.indexOf(existingDrug) >= 0 || existingDrug.indexOf(drugName) >= 0)) {
        alerts.push({
          severity: 'warning',
          type: 'duplicate',
          message: 'Duplicate order: "' + order.detail.drug + '" already has an active/pending order. Ordered ' + formatDateTime(existing.dateTime),
        });
      }
    });

    // 4. Dose range checking
    var doseRange = null;
    Object.keys(DOSE_RANGES).forEach(function(key) {
      if (drugName.indexOf(key) >= 0 || key.indexOf(drugName) >= 0) {
        doseRange = DOSE_RANGES[key];
      }
    });

    if (doseRange && order.detail.dose) {
      var dose = parseFloat(order.detail.dose);
      if (!isNaN(dose) && dose > doseRange.maxSingleDose) {
        alerts.push({
          severity: 'warning',
          type: 'dose-range',
          message: doseRange.warningMsg + ' Ordered dose: ' + dose + (order.detail.unit || doseRange.unit) + '.',
        });
      }
    }

    // 5. Renal dose adjustment
    var renalAlert = null;
    Object.keys(RENAL_DOSE_ALERTS).forEach(function(key) {
      if (drugName.indexOf(key) >= 0 || key.indexOf(drugName) >= 0) {
        renalAlert = RENAL_DOSE_ALERTS[key];
      }
    });

    if (renalAlert) {
      // Check latest creatinine from labs
      var labs = typeof getLabResults === 'function' ? getLabResults(patientId) : [];
      var latestCr = null;
      var latestEgfr = null;

      labs.forEach(function(lab) {
        if (!lab.tests) return;
        lab.tests.forEach(function(test) {
          var testName = (test.name || '').toLowerCase();
          if (testName === 'creatinine' || testName === 'cr') {
            var val = parseFloat(test.value);
            if (!isNaN(val) && (latestCr === null || new Date(lab.resultDate) > new Date(latestCr.date))) {
              latestCr = { value: val, date: lab.resultDate };
            }
          }
          if (testName === 'egfr' || testName.indexOf('gfr') >= 0) {
            var val2 = parseFloat(test.value);
            if (!isNaN(val2) && (latestEgfr === null || new Date(lab.resultDate) > new Date(latestEgfr.date))) {
              latestEgfr = { value: val2, date: lab.resultDate };
            }
          }
        });
      });

      var needsAlert = false;
      if (latestCr && latestCr.value > renalAlert.creatinineThreshold) needsAlert = true;
      if (latestEgfr && latestEgfr.value < renalAlert.egfrThreshold) needsAlert = true;

      if (needsAlert) {
        var details = '';
        if (latestCr) details += ' Cr: ' + latestCr.value + ' mg/dL.';
        if (latestEgfr) details += ' eGFR: ' + latestEgfr.value + '.';
        alerts.push({
          severity: 'warning',
          type: 'renal-adjustment',
          message: renalAlert.message + details,
        });
      }
    }

    // 6. High-alert medication check (7b)
    var isHighAlert = HIGH_ALERT_MEDS.some(function(ham) {
      return drugName.indexOf(ham) >= 0 || ham.indexOf(drugName) >= 0;
    });
    if (isHighAlert) {
      alerts.push({
        severity: 'warning',
        type: 'high-alert',
        message: 'HIGH-ALERT MEDICATION: ' + order.detail.drug + ' requires independent double-check verification.',
        requiresDoubleCheck: true,
      });
    }
  }

  // Check Lab orders for duplicates
  if (order.type === 'Lab' && order.detail) {
    var panel = (order.detail.panel || '').toLowerCase().trim();
    if (panel) {
      var recentLabOrders = getOrdersByPatient(patientId)
        .filter(function(o) {
          return o.type === 'Lab' && (o.status === 'Pending' || o.status === 'Active') &&
            (o.detail.panel || '').toLowerCase().trim() === panel;
        });
      if (recentLabOrders.length > 0) {
        alerts.push({
          severity: 'warning',
          type: 'duplicate',
          message: 'Duplicate lab order: "' + (order.detail.panel) + '" is already pending/active. Ordered ' + formatDateTime(recentLabOrders[0].dateTime),
        });
      }
    }
  }

  // Log alerts
  alerts.forEach(function(alert) {
    logCDSAlert(alert, patientId);
  });

  return alerts;
}

/* ---------- Show CDS Alerts Modal ---------- */
function showCDSAlertsModal(alerts, onProceed) {
  var criticals = alerts.filter(function(a) { return a.severity === 'critical'; });
  var warnings = alerts.filter(function(a) { return a.severity === 'warning'; });

  var bodyHTML = '<div class="cds-alerts-modal">';

  if (criticals.length > 0) {
    bodyHTML += '<div class="cds-alert-section cds-critical-section">';
    bodyHTML += '<h3 class="cds-section-title cds-critical-title">Critical Alerts</h3>';
    criticals.forEach(function(a) {
      bodyHTML += '<div class="cds-alert-item cds-alert-critical">' +
        '<span class="cds-alert-icon"></span>' +
        '<div class="cds-alert-content">' +
        '<span class="cds-alert-type-badge cds-type-' + a.type + '">' + formatAlertType(a.type) + '</span>' +
        '<p class="cds-alert-msg">' + esc(a.message) + '</p>' +
        '</div></div>';
    });
    bodyHTML += '</div>';
  }

  if (warnings.length > 0) {
    bodyHTML += '<div class="cds-alert-section cds-warning-section">';
    bodyHTML += '<h3 class="cds-section-title cds-warning-title">Warnings</h3>';
    warnings.forEach(function(a) {
      bodyHTML += '<div class="cds-alert-item cds-alert-warning">' +
        '<span class="cds-alert-icon"></span>' +
        '<div class="cds-alert-content">' +
        '<span class="cds-alert-type-badge cds-type-' + a.type + '">' + formatAlertType(a.type) + '</span>' +
        '<p class="cds-alert-msg">' + esc(a.message) + '</p>' +
        '</div></div>';
    });
    bodyHTML += '</div>';
  }

  bodyHTML += '</div>';

  var proceedLabel = criticals.length > 0 ? 'Override &amp; Proceed' : 'Acknowledge &amp; Proceed';
  var proceedClass = criticals.length > 0 ? 'btn btn-danger' : 'btn btn-warning';

  var footerHTML = '<button class="btn btn-secondary" onclick="closeModal()">Cancel Order</button>' +
    '<button class="' + proceedClass + '" id="cds-proceed-btn">' + proceedLabel + '</button>';

  openModal({ title: 'Clinical Decision Support Alerts', bodyHTML: bodyHTML, footerHTML: footerHTML, size: 'lg' });

  document.getElementById('cds-proceed-btn').addEventListener('click', function() {
    closeModal();
    if (typeof onProceed === 'function') onProceed();
  });
}

// Alias used by order-sets.js
function showCDSAlertsBeforePlacing(alerts, onProceed) {
  showCDSAlertsModal(alerts, onProceed);
}

function formatAlertType(type) {
  var labels = {
    'allergy': 'Allergy',
    'allergy-block': 'Allergy Block',
    'allergy-cross': 'Cross-Reactivity',
    'drug-interaction': 'Drug Interaction',
    'duplicate': 'Duplicate',
    'dose-range': 'Dose Range',
    'high-alert': 'High-Alert Med',
    'critical-value': 'Critical Value',
    'renal-adjustment': 'Renal Dose',
    'bpa-anticoag': 'Anticoagulation',
    'bpa-dismissed': 'Dismissed',
    'stroke-slp': 'Stroke / SLP',
    'diet-slp': 'Diet / SLP',
  };
  return labels[type] || type;
}

/* ============================================================
   Best Practice Alerts (BPAs)
   ============================================================ */

function getBPAs(patientId) {
  var bpas = [];
  if (!patientId) return bpas;

  var patient = getPatient(patientId);
  if (!patient) return bpas;

  // Get patient data
  var encounters = typeof getEncountersByPatient === 'function' ? getEncountersByPatient(patientId) : [];
  var orders = getOrdersByPatient(patientId);
  var diagnoses = typeof getPatientDiagnoses === 'function' ? getPatientDiagnoses(patientId) : [];
  var problems = typeof getActiveProblems === 'function' ? getActiveProblems(patientId) : [];
  var allergies = typeof getPatientAllergies === 'function' ? getPatientAllergies(patientId) : [];
  var labs = typeof getLabResults === 'function' ? getLabResults(patientId) : [];
  var meds = typeof getPatientMedications === 'function' ? getPatientMedications(patientId) : [];
  var medRecs = loadAll(KEYS.medRec).filter(function(m) { return m.patientId === patientId; });

  // Check for inpatient encounters
  var openInpatient = encounters.filter(function(e) {
    return e.status === 'Open' && (e.visitType === 'Inpatient' || e.visitType === 'Emergency');
  });

  var isAdmitted = openInpatient.length > 0;

  // 1. VTE Prophylaxis check for admitted patients
  if (isAdmitted) {
    var hasVTE = orders.some(function(o) {
      if (o.status === 'Cancelled') return false;
      var drug = ((o.detail || {}).drug || '').toLowerCase();
      return drug.indexOf('enoxaparin') >= 0 || drug.indexOf('heparin') >= 0 ||
        drug.indexOf('fondaparinux') >= 0 || drug.indexOf('rivaroxaban') >= 0;
    });
    if (!hasVTE) {
      bpas.push({
        id: 'bpa-vte',
        severity: 'warning',
        category: 'VTE Prophylaxis',
        message: 'No VTE prophylaxis ordered for admitted patient. Consider enoxaparin or heparin SQ.',
        action: 'Order VTE Prophylaxis',
      });
    }
  }

  // 2. A1c > 9% check for diabetic patients
  var isDiabetic = diagnoses.some(function(d) {
    var name = ((d.name || d.description || '') + ' ' + (d.icd10 || '')).toLowerCase();
    return name.indexOf('diabetes') >= 0 || name.indexOf('e11') >= 0 || name.indexOf('e10') >= 0;
  }) || problems.some(function(p) {
    var name = ((p.name || '') + ' ' + (p.icd10 || '')).toLowerCase();
    return name.indexOf('diabetes') >= 0 || name.indexOf('e11') >= 0 || name.indexOf('e10') >= 0;
  });

  if (isDiabetic) {
    var latestA1c = null;
    labs.forEach(function(lab) {
      if (!lab.tests) return;
      lab.tests.forEach(function(test) {
        var testName = (test.name || '').toLowerCase();
        if (testName === 'hba1c' || testName === 'a1c' || testName === 'hemoglobin a1c') {
          var val = parseFloat(test.value);
          if (!isNaN(val)) {
            if (!latestA1c || new Date(lab.resultDate) > new Date(latestA1c.date)) {
              latestA1c = { value: val, date: lab.resultDate };
            }
          }
        }
      });
    });

    if (latestA1c && latestA1c.value > 9.0) {
      bpas.push({
        id: 'bpa-a1c',
        severity: 'warning',
        category: 'Diabetes Management',
        message: 'HbA1c ' + latestA1c.value + '% (>' + '9%) on ' + formatDateTime(latestA1c.date) + '. Consider endocrine referral and medication adjustment.',
        action: 'Refer to Endocrinology',
      });
    }
  }

  // 3. Sepsis screening — temp > 101.3 + HR > 90
  if (openInpatient.length > 0) {
    openInpatient.forEach(function(enc) {
      var vitals = typeof getEncounterVitals === 'function' ? getEncounterVitals(enc.id) : null;
      if (vitals) {
        var temp = parseFloat(vitals.tempF);
        var hr = parseFloat(vitals.heartRate);
        if (!isNaN(temp) && !isNaN(hr) && temp > 101.3 && hr > 90) {
          bpas.push({
            id: 'bpa-sepsis-' + enc.id,
            severity: 'critical',
            category: 'Sepsis Screening',
            message: 'Sepsis screening criteria met: Temp ' + temp + 'F, HR ' + hr + '. Consider sepsis workup (blood cultures, lactate, broad-spectrum abx).',
            action: 'Order Sepsis Bundle',
          });
        }
      }
    });
  }

  // 4. Fall risk assessment for inpatient admits
  if (isAdmitted) {
    var hasScreening = loadAll(KEYS.screenings).some(function(s) {
      return s.patientId === patientId && (s.type || '').toLowerCase().indexOf('fall') >= 0;
    });
    if (!hasScreening) {
      bpas.push({
        id: 'bpa-fall-risk',
        severity: 'warning',
        category: 'Fall Risk',
        message: 'Fall risk assessment not completed for inpatient admission.',
        action: 'Complete Assessment',
      });
    }
  }

  // 5. Medication reconciliation not completed on admission
  if (isAdmitted) {
    var hasMedRec = medRecs.some(function(mr) {
      return mr.status === 'Completed' || mr.status === 'completed';
    });
    if (!hasMedRec) {
      bpas.push({
        id: 'bpa-med-rec',
        severity: 'warning',
        category: 'Medication Reconciliation',
        message: 'Medication reconciliation has not been completed for this admission.',
        action: 'Complete Med Rec',
      });
    }
  }

  // 6. Atrial Fibrillation without anticoagulation
  var afibTerms = ['afib', 'atrial fibrillation', 'a-fib'];
  var hasAfib = problems.some(function(p) {
    var name = ((p.name || '') + ' ' + (p.icd10 || '')).toLowerCase();
    return afibTerms.some(function(term) { return name.indexOf(term) >= 0; });
  }) || diagnoses.some(function(d) {
    var name = ((d.name || d.description || '') + ' ' + (d.icd10 || '')).toLowerCase();
    return afibTerms.some(function(term) { return name.indexOf(term) >= 0; });
  });

  if (hasAfib) {
    var anticoagulants = ['warfarin', 'apixaban', 'rivaroxaban', 'dabigatran', 'edoxaban', 'enoxaparin', 'heparin'];
    var hasAnticoag = orders.some(function(o) {
      if (o.status === 'Cancelled') return false;
      var drug = ((o.detail || {}).drug || '').toLowerCase();
      return anticoagulants.some(function(ac) { return drug.indexOf(ac) >= 0; });
    });
    // Also check patient medications list
    if (!hasAnticoag) {
      hasAnticoag = meds.some(function(m) {
        if (m.status !== 'Current' && m.status !== 'Active') return false;
        var drug = (m.name || m.drug || '').toLowerCase();
        return anticoagulants.some(function(ac) { return drug.indexOf(ac) >= 0; });
      });
    }
    if (!hasAnticoag) {
      bpas.push({
        id: 'bpa-afib-anticoag',
        severity: 'warning',
        category: 'Anticoagulation',
        message: 'Patient has Atrial Fibrillation without active anticoagulation. Consider CHA2DS2-VASc scoring and anticoagulation.',
        action: 'Review Anticoagulation',
      });
    }
  }

  // 7. Stroke without SLP consult
  var strokeTerms = ['stroke', 'cva', 'cerebrovascular', 'cerebral infarction'];
  var hasStroke = problems.some(function(p) {
    var name = ((p.name || '') + ' ' + (p.icd10 || '')).toLowerCase();
    return strokeTerms.some(function(term) { return name.indexOf(term) >= 0; });
  }) || diagnoses.some(function(d) {
    var name = ((d.name || d.description || '') + ' ' + (d.icd10 || '')).toLowerCase();
    return strokeTerms.some(function(term) { return name.indexOf(term) >= 0; });
  });

  if (hasStroke) {
    var hasSLPConsult = orders.some(function(o) {
      if (o.status === 'Cancelled') return false;
      return o.type === 'Consult' && ((o.detail || {}).service || '').toLowerCase().indexOf('speech') >= 0;
    });
    if (!hasSLPConsult) {
      bpas.push({
        id: 'bpa-stroke-slp',
        severity: 'warning',
        category: 'Stroke Care',
        message: 'AHA Guidelines: Dysphagia screening required within 24 hours of stroke admission. Order Speech-Language Pathology consult.',
        action: 'Order SLP Consult',
      });
    }
  }

  // 8. Texture-modified diet without SLP evaluation
  var dietOrders = orders.filter(function(o) {
    if (o.type !== 'Diet' || o.status === 'Cancelled') return false;
    var dt = ((o.detail || {}).dietType || '').toLowerCase();
    var lt = ((o.detail || {}).liquidThickness || '');
    // Check for IDDSI level < 7
    var iddsiMatch = dt.match(/iddsi\s*(\d)/);
    if (iddsiMatch && parseInt(iddsiMatch[1]) < 7) return true;
    // Check for texture-modified keywords
    if (dt.indexOf('pureed') >= 0 || dt.indexOf('minced') >= 0 ||
        dt.indexOf('soft & bite') >= 0 || dt.indexOf('liquidised') >= 0) return true;
    // Check liquid thickness (anything other than Thin or empty)
    if (lt && lt.toLowerCase().indexOf('thin (iddsi 0)') < 0) return true;
    return false;
  });

  if (dietOrders.length > 0) {
    var hasSLPEval = orders.some(function(o) {
      if (o.status === 'Cancelled') return false;
      return o.type === 'Consult' &&
        ((o.detail || {}).service || '').toLowerCase().indexOf('speech') >= 0 &&
        (o.status === 'Completed');
    });
    if (!hasSLPEval) {
      bpas.push({
        id: 'bpa-diet-slp',
        severity: 'warning',
        category: 'Diet Safety',
        message: 'Texture-modified diet ordered without SLP evaluation on file. Consider SLP consult for formal dysphagia assessment.',
        action: 'Order SLP Consult',
      });
    }
  }

  // 7d: Critical value alerts
  var criticalVals = checkCriticalValues(patientId);
  criticalVals.forEach(function(cv) {
    bpas.push({
      id: 'bpa-critical-' + cv.testName.toLowerCase().replace(/\s+/g, '-'),
      severity: 'critical',
      category: 'Critical Value',
      message: 'CRITICAL VALUE: ' + cv.testName + ' = ' + cv.value + ' ' + cv.unit +
        ' (' + (cv.direction === 'high' ? 'above ' : 'below ') + cv.threshold + ' ' + cv.unit + ')',
      action: 'Review & Acknowledge',
    });
  });

  // Filter out dismissed BPAs for the current encounter
  var currentEncId = _getBPACurrentEncounterId(patientId);
  if (currentEncId) {
    bpas = bpas.filter(function(b) {
      return !_isBPADismissed(b.id, currentEncId);
    });
  }

  return bpas;
}

/* ---------- BPA Dismissal Persistence ---------- */
function _getBPACurrentEncounterId(patientId) {
  // Find the most recent open encounter for this patient
  try {
    var encs = typeof getEncountersByPatient === 'function' ? getEncountersByPatient(patientId) : [];
    var open = encs.filter(function(e) { return e.status === 'Open'; });
    if (open.length > 0) {
      open.sort(function(a, b) { return new Date(b.dateTime) - new Date(a.dateTime); });
      return open[0].id;
    }
    // Fallback: most recent encounter
    if (encs.length > 0) {
      encs.sort(function(a, b) { return new Date(b.dateTime) - new Date(a.dateTime); });
      return encs[0].id;
    }
  } catch (e) { /* ignore */ }
  return null;
}

function _isBPADismissed(alertId, encounterId) {
  var all = loadAll(KEYS.cdsAlerts);
  return all.some(function(a) {
    return a.bpaDismissed === true &&
           a.alertId === alertId &&
           a.encounterId === encounterId;
  });
}

function dismissBPA(alertId, encounterId, reason) {
  var user = getSessionUser();
  var entry = {
    id: generateId(),
    bpaDismissed: true,
    alertId: alertId,
    encounterId: encounterId || '',
    dismissedBy: user ? user.id : '',
    dismissedAt: new Date().toISOString(),
    reason: reason || '',
  };
  var all = loadAll(KEYS.cdsAlerts, true);
  all.push(entry);
  saveAll(KEYS.cdsAlerts, all);
  return entry;
}

/* ---------- BPA Banner for Chart ---------- */
function buildBPABanner(patientId) {
  var bpas = getBPAs(patientId);
  if (bpas.length === 0) return null;

  var banner = document.createElement('div');
  banner.className = 'bpa-banner';
  banner.id = 'bpa-banner';

  var criticals = bpas.filter(function(b) { return b.severity === 'critical'; });
  var warnings = bpas.filter(function(b) { return b.severity === 'warning'; });

  var html = '<div class="bpa-banner-header">' +
    '<span class="bpa-banner-icon"></span>' +
    '<strong>Best Practice Alerts (' + bpas.length + ')</strong>' +
    '<button class="bpa-dismiss-all" id="bpa-dismiss-btn">Dismiss All</button>' +
    '</div>';

  html += '<div class="bpa-banner-items">';

  if (criticals.length > 0) {
    criticals.forEach(function(b) {
      html += '<div class="bpa-item bpa-item-critical">' +
        '<span class="bpa-item-icon"></span>' +
        '<div class="bpa-item-content">' +
        '<span class="bpa-item-category">' + esc(b.category) + '</span>' +
        '<span class="bpa-item-msg">' + esc(b.message) + '</span>' +
        '</div>' +
        '</div>';
    });
  }

  warnings.forEach(function(b) {
    html += '<div class="bpa-item bpa-item-warning">' +
      '<span class="bpa-item-icon"></span>' +
      '<div class="bpa-item-content">' +
      '<span class="bpa-item-category">' + esc(b.category) + '</span>' +
      '<span class="bpa-item-msg">' + esc(b.message) + '</span>' +
      '</div>' +
      '</div>';
  });

  html += '</div>';
  banner.innerHTML = html;

  // Dismiss handler — persists dismissals so they don't re-fire for same encounter
  setTimeout(function() {
    var dismissBtn = document.getElementById('bpa-dismiss-btn');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', function() {
        var encId = _getBPACurrentEncounterId(patientId);
        bpas.forEach(function(b) {
          dismissBPA(b.id, encId, 'Dismissed via banner');
        });
        banner.classList.add('hidden');
        showToast('BPA alerts dismissed for this encounter.', 'success');
      });
    }
  }, 50);

  return banner;
}

/* ---------- CDS Dashboard Page ---------- */
function renderCDS() {
  var app = document.getElementById('app');
  app.innerHTML = '';

  setTopbar({ title: 'Clinical Decision Support', meta: 'Alert dashboard & history', actions: '' });
  setActiveNav('cds');

  var container = document.createElement('div');
  container.style.padding = '24px';
  container.style.maxWidth = '1100px';
  container.style.margin = '0 auto';

  // Summary cards
  var allAlerts = getCDSAlerts();
  var today = new Date().toISOString().slice(0, 10);
  var todayAlerts = allAlerts.filter(function(a) { return a.timestamp.slice(0, 10) === today; });
  var unacknowledged = allAlerts.filter(function(a) { return !a.acknowledged; });
  var criticalCount = allAlerts.filter(function(a) { return a.severity === 'critical'; }).length;

  var summaryHTML = '<div class="cds-summary-row">' +
    '<div class="cds-summary-card cds-summary-total"><div class="cds-summary-value">' + allAlerts.length + '</div><div class="cds-summary-label">Total Alerts</div></div>' +
    '<div class="cds-summary-card cds-summary-today"><div class="cds-summary-value">' + todayAlerts.length + '</div><div class="cds-summary-label">Today</div></div>' +
    '<div class="cds-summary-card cds-summary-unack"><div class="cds-summary-value">' + unacknowledged.length + '</div><div class="cds-summary-label">Unacknowledged</div></div>' +
    '<div class="cds-summary-card cds-summary-critical"><div class="cds-summary-value">' + criticalCount + '</div><div class="cds-summary-label">Critical</div></div>' +
    '</div>';

  var summaryDiv = document.createElement('div');
  summaryDiv.innerHTML = summaryHTML;
  container.appendChild(summaryDiv);

  // Alert type breakdown
  var typeBreakdown = {};
  allAlerts.forEach(function(a) {
    var t = a.type || 'unknown';
    typeBreakdown[t] = (typeBreakdown[t] || 0) + 1;
  });

  var breakdownCard = document.createElement('div');
  breakdownCard.className = 'card';
  breakdownCard.style.marginTop = '20px';
  var breakdownHeader = '<div class="card-header"><span class="card-title">Alert Breakdown by Type</span></div>';
  var breakdownBody = '<div class="card-body" style="padding:16px"><div class="cds-breakdown-row">';
  Object.keys(typeBreakdown).forEach(function(type) {
    breakdownBody += '<div class="cds-breakdown-item">' +
      '<div class="cds-breakdown-count">' + typeBreakdown[type] + '</div>' +
      '<div class="cds-breakdown-label">' + formatAlertType(type) + '</div>' +
      '</div>';
  });
  breakdownBody += '</div></div>';
  breakdownCard.innerHTML = breakdownHeader + breakdownBody;
  container.appendChild(breakdownCard);

  // Recent alerts table
  var tableCard = document.createElement('div');
  tableCard.className = 'card';
  tableCard.style.marginTop = '20px';

  var recentAlerts = allAlerts.sort(function(a, b) { return new Date(b.timestamp) - new Date(a.timestamp); }).slice(0, 50);

  var tableHTML = '<div class="card-header"><span class="card-title">Recent Alerts</span></div>' +
    '<div class="card-body" style="padding:0;overflow-x:auto">';

  if (recentAlerts.length === 0) {
    tableHTML += '<div style="padding:24px;text-align:center;color:var(--text-muted)">No CDS alerts recorded yet. Alerts are generated when placing orders.</div>';
  } else {
    tableHTML += '<table class="cds-table"><thead><tr>' +
      '<th>Time</th><th>Severity</th><th>Type</th><th>Patient</th><th>Message</th><th>Status</th>' +
      '</tr></thead><tbody>';

    recentAlerts.forEach(function(alert) {
      var patient = getPatient(alert.patientId);
      var patName = patient ? patient.firstName + ' ' + patient.lastName : alert.patientId ? 'Unknown' : '-';
      var sevClass = alert.severity === 'critical' ? 'cds-sev-critical' : 'cds-sev-warning';
      var statusText = alert.acknowledged ? 'Acknowledged' : 'Pending';
      var statusClass = alert.acknowledged ? 'cds-status-ack' : 'cds-status-pending';

      tableHTML += '<tr>' +
        '<td>' + formatDateTime(alert.timestamp) + '</td>' +
        '<td><span class="' + sevClass + '">' + esc(alert.severity) + '</span></td>' +
        '<td>' + formatAlertType(alert.type) + '</td>' +
        '<td>' + esc(patName) + '</td>' +
        '<td class="cds-msg-cell">' + esc(alert.message) + '</td>' +
        '<td><span class="' + statusClass + '">' + statusText + '</span></td>' +
        '</tr>';
    });

    tableHTML += '</tbody></table>';
  }

  tableHTML += '</div>';
  tableCard.innerHTML = tableHTML;
  container.appendChild(tableCard);

  app.appendChild(container);
}

/* ============================================================
   7d: Critical Value Alerting
   ============================================================ */
function checkCriticalValues(patientId) {
  var criticalAlerts = [];
  if (!patientId) return criticalAlerts;

  var labs = typeof getLabResults === 'function' ? getLabResults(patientId) : [];
  if (labs.length === 0) return criticalAlerts;

  // Build map of latest values per test
  var latestByTest = {};
  labs.forEach(function(lab) {
    if (!lab.tests) return;
    lab.tests.forEach(function(test) {
      var testName = (test.name || '').toLowerCase().trim();
      var val = parseFloat(test.value);
      if (isNaN(val)) return;
      var labDate = lab.resultDate || lab.createdAt || '';
      if (!latestByTest[testName] || new Date(labDate) > new Date(latestByTest[testName].date)) {
        latestByTest[testName] = { value: val, date: labDate, rawName: test.name };
      }
    });
  });

  // Check against critical thresholds
  Object.keys(CRITICAL_VALUES).forEach(function(testKey) {
    var threshold = CRITICAL_VALUES[testKey];
    var latest = latestByTest[testKey];
    if (!latest) return;

    if (threshold.low !== null && latest.value < threshold.low) {
      criticalAlerts.push({
        testName: latest.rawName || testKey,
        value: latest.value,
        threshold: threshold.low,
        direction: 'low',
        unit: threshold.unit,
        date: latest.date,
      });
    }
    if (threshold.high !== null && latest.value > threshold.high) {
      criticalAlerts.push({
        testName: latest.rawName || testKey,
        value: latest.value,
        threshold: threshold.high,
        direction: 'high',
        unit: threshold.unit,
        date: latest.date,
      });
    }
  });

  return criticalAlerts;
}
