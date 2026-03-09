/* ============================================================
   views/claim-scrub.js — Claim Scrubbing / Pre-submission Validation
   ============================================================ */

/* ---------- CCI Bundling Edits (common pairs) ---------- */
const CCI_EDITS = [
  { primary: '99213', secondary: '36415', reason: 'Venipuncture bundled with E&M', fixable: true, fix: 'Add modifier 25 to E&M if separate service' },
  { primary: '99214', secondary: '36415', reason: 'Venipuncture bundled with E&M', fixable: true, fix: 'Add modifier 25 to E&M if separate service' },
  { primary: '99215', secondary: '36415', reason: 'Venipuncture bundled with E&M', fixable: true, fix: 'Add modifier 25 to E&M if separate service' },
  { primary: '99213', secondary: '96372', reason: 'Injection bundled with E&M', fixable: true, fix: 'Add modifier 25 to E&M if significant separate service' },
  { primary: '99214', secondary: '96372', reason: 'Injection bundled with E&M', fixable: true, fix: 'Add modifier 25 to E&M if significant separate service' },
  { primary: '10060', secondary: '10061', reason: 'Simple and complicated I&D cannot be billed together', fixable: false },
  { primary: '11100', secondary: '11101', reason: 'Must bill 11101 as add-on to 11100', fixable: true, fix: 'Use 11101 only as add-on with appropriate units' },
  { primary: '99213', secondary: '99214', reason: 'Cannot bill two E&M codes same encounter', fixable: true, fix: 'Select the appropriate single E&M level' },
  { primary: '80048', secondary: '80053', reason: 'BMP is a subset of CMP; bill only CMP', fixable: true, fix: 'Remove BMP (80048) and bill only CMP (80053)' },
  { primary: '85025', secondary: '85027', reason: 'CBC with diff includes without diff', fixable: true, fix: 'Remove 85027 and bill only 85025 (CBC with diff)' },
  { primary: '20610', secondary: '20605', reason: 'Cannot bill large and intermediate joint injection same encounter', fixable: true, fix: 'Use appropriate single joint injection code with modifier 59 if different joints' },
];

/* ---------- Gender-specific procedure rules ---------- */
const GENDER_RULES = [
  { codes: ['76830', '76856', '76857', '58100', '58120', '58150', '58558', '58571'], gender: 'Female', description: 'Gynecologic/uterine procedure' },
  { codes: ['76872', '55700', '55810', '55840', '55845', '55866'], gender: 'Male', description: 'Prostate procedure' },
  { codes: ['77065', '77066', '77067'], gender: 'Female', description: 'Mammography' },
  { codes: ['55250'], gender: 'Male', description: 'Vasectomy' },
];

/* ---------- Age-specific rules ---------- */
const AGE_RULES = [
  { codes: ['99381', '99391'], ageMin: 0, ageMax: 1, description: 'Infant preventive visit (under 1 year)' },
  { codes: ['99382', '99392'], ageMin: 1, ageMax: 4, description: 'Early childhood preventive visit (1-4 years)' },
  { codes: ['99395'], ageMin: 18, ageMax: 39, description: 'Adult preventive visit (18-39)' },
  { codes: ['99396'], ageMin: 40, ageMax: 64, description: 'Adult preventive visit (40-64)' },
  { codes: ['99397'], ageMin: 65, ageMax: 150, description: 'Senior preventive visit (65+)' },
];

/* ---------- Modifier requirement rules ---------- */
const MODIFIER_RULES = [
  { condition: 'em_with_procedure', description: 'E&M with procedure on same day requires modifier 25 on E&M', fix: 'Add modifier 25 to the E&M code' },
  { condition: 'bilateral', description: 'Bilateral procedure requires modifier 50', fix: 'Add modifier 50 for bilateral procedures' },
];

/* ============================================================
   SCRUB ENGINE
   ============================================================ */
function scrubClaim(claimId) {
  var claim = getClaim(claimId);
  if (!claim) return { errors: [{ severity: 'error', code: 'CLAIM_NOT_FOUND', message: 'Claim not found' }], warnings: [] };

  var patient = getPatient(claim.patientId);
  var encounter = claim.encounterId ? getEncounter(claim.encounterId) : null;
  var errors = [];
  var warnings = [];

  // 1. Check for missing diagnoses
  if (!claim.diagnoses || claim.diagnoses.length === 0) {
    errors.push({
      severity: 'error',
      code: 'MISSING_DX',
      message: 'No diagnosis codes on claim',
      fix: 'Add at least one ICD-10 diagnosis code',
    });
  } else {
    // Check for invalid ICD-10 format
    claim.diagnoses.forEach(function(dx, i) {
      if (!dx.icd10 || dx.icd10.trim() === '') {
        errors.push({
          severity: 'error',
          code: 'EMPTY_DX',
          message: 'Diagnosis #' + (i + 1) + ' has no ICD-10 code',
          fix: 'Enter a valid ICD-10 code or remove the empty diagnosis',
        });
      } else if (!/^[A-Z]\d{2}(\.\d{1,4})?$/i.test(dx.icd10.trim())) {
        warnings.push({
          severity: 'warning',
          code: 'INVALID_DX_FORMAT',
          message: 'Diagnosis "' + dx.icd10 + '" may not be a valid ICD-10 format',
          fix: 'Verify ICD-10 code format (e.g., E11.9, I10, J06.9)',
        });
      }
    });
  }

  // 2. Check for missing charges
  if (!claim.charges || claim.charges.length === 0) {
    errors.push({
      severity: 'error',
      code: 'MISSING_CHARGES',
      message: 'No charges/line items on claim',
      fix: 'Add at least one CPT code / charge line item',
    });
  } else {
    claim.charges.forEach(function(ch, i) {
      // Empty CPT code
      if (!ch.cptCode || ch.cptCode.trim() === '') {
        errors.push({
          severity: 'error',
          code: 'EMPTY_CPT',
          message: 'Line item #' + (i + 1) + ' has no CPT code',
          fix: 'Enter a valid CPT code or remove the empty line item',
        });
      }

      // Zero charge amount
      if (!ch.unitCharge || parseFloat(ch.unitCharge) <= 0) {
        warnings.push({
          severity: 'warning',
          code: 'ZERO_CHARGE',
          message: 'Line item "' + (ch.cptCode || '#' + (i + 1)) + '" has $0 charge',
          fix: 'Enter the appropriate charge amount for ' + (ch.cptCode || 'this code'),
        });
      }

      // Check diagnosis pointers
      if (!ch.diagnosisPointers || ch.diagnosisPointers.length === 0) {
        warnings.push({
          severity: 'warning',
          code: 'MISSING_DX_POINTER',
          message: 'Line item "' + (ch.cptCode || '#' + (i + 1)) + '" has no diagnosis pointer',
          fix: 'Link at least one diagnosis to this charge',
        });
      }
    });

    // 3. Duplicate charge detection
    var cptCounts = {};
    claim.charges.forEach(function(ch) {
      var key = (ch.cptCode || '').trim();
      if (key) {
        cptCounts[key] = (cptCounts[key] || 0) + 1;
      }
    });
    Object.keys(cptCounts).forEach(function(code) {
      if (cptCounts[code] > 1) {
        warnings.push({
          severity: 'warning',
          code: 'DUPLICATE_CPT',
          message: 'CPT code ' + code + ' appears ' + cptCounts[code] + ' times — possible duplicate',
          fix: 'Verify this is intentional. If duplicate, remove extra line item. If intentional, add appropriate modifier (e.g., 59, 76)',
        });
      }
    });

    // 4. CCI bundling edits
    var claimCpts = claim.charges.map(function(ch) { return (ch.cptCode || '').trim(); }).filter(Boolean);
    CCI_EDITS.forEach(function(edit) {
      if (claimCpts.indexOf(edit.primary) !== -1 && claimCpts.indexOf(edit.secondary) !== -1) {
        // Check if modifier 25 or 59 already present
        var hasModifier = false;
        claim.charges.forEach(function(ch) {
          if (ch.cptCode === edit.primary && ch.modifiers) {
            if (ch.modifiers.indexOf('25') !== -1 || ch.modifiers.indexOf('59') !== -1) hasModifier = true;
          }
        });
        if (!hasModifier) {
          errors.push({
            severity: 'error',
            code: 'CCI_BUNDLE',
            message: 'CCI Edit: ' + edit.primary + ' + ' + edit.secondary + ' — ' + edit.reason,
            fix: edit.fix || 'Review bundling rules and add appropriate modifier or remove one code',
            fixable: edit.fixable || false,
          });
        }
      }
    });

    // 5. E&M with procedure check (modifier 25)
    var hasEM = claimCpts.some(function(c) { return /^992\d{2}$/.test(c); });
    var hasProcedure = claimCpts.some(function(c) { return !(/^992\d{2}$/.test(c)) && !(/^8\d{4}$/.test(c)); });
    if (hasEM && hasProcedure) {
      var emCharge = claim.charges.find(function(ch) { return /^992\d{2}$/.test(ch.cptCode || ''); });
      if (emCharge && (!emCharge.modifiers || emCharge.modifiers.indexOf('25') === -1)) {
        warnings.push({
          severity: 'warning',
          code: 'MISSING_MOD_25',
          message: 'E&M code billed with procedure — modifier 25 may be needed',
          fix: 'Add modifier 25 to E&M code if separately identifiable service was performed',
        });
      }
    }

    // 6. Multiple E&M codes
    var emCodes = claimCpts.filter(function(c) { return /^992\d{2}$/.test(c); });
    if (emCodes.length > 1) {
      errors.push({
        severity: 'error',
        code: 'MULTIPLE_EM',
        message: 'Multiple E&M codes on same claim: ' + emCodes.join(', '),
        fix: 'Select the single appropriate E&M level for this encounter',
      });
    }
  }

  // 7. Gender mismatch
  if (patient && patient.sex) {
    var patGender = patient.sex;
    (claim.charges || []).forEach(function(ch) {
      GENDER_RULES.forEach(function(rule) {
        if (rule.codes.indexOf(ch.cptCode) !== -1 && patGender !== rule.gender) {
          errors.push({
            severity: 'error',
            code: 'GENDER_MISMATCH',
            message: 'CPT ' + ch.cptCode + ' (' + rule.description + ') is gender-specific (' + rule.gender + ') but patient is ' + patGender,
            fix: 'Verify the correct CPT code for this patient',
          });
        }
      });
    });
  }

  // 8. Age mismatch for preventive codes
  if (patient && patient.dob) {
    var age = _calcAge(patient.dob);
    (claim.charges || []).forEach(function(ch) {
      AGE_RULES.forEach(function(rule) {
        if (rule.codes.indexOf(ch.cptCode) !== -1) {
          if (age < rule.ageMin || age > rule.ageMax) {
            errors.push({
              severity: 'error',
              code: 'AGE_MISMATCH',
              message: 'CPT ' + ch.cptCode + ' (' + rule.description + ') — patient age ' + age + ' is outside range ' + rule.ageMin + '-' + rule.ageMax,
              fix: 'Select the age-appropriate preventive visit code',
            });
          }
        }
      });
    });
  }

  // 9. Missing payer
  if (!claim.payerName || claim.payerName.trim() === '') {
    warnings.push({
      severity: 'warning',
      code: 'MISSING_PAYER',
      message: 'No payer specified on claim',
      fix: 'Add the insurance/payer name',
    });
  }

  // 10. Missing place of service
  if (!claim.placeOfService) {
    warnings.push({
      severity: 'warning',
      code: 'MISSING_POS',
      message: 'No place of service specified',
      fix: 'Select the appropriate place of service code',
    });
  }

  // 11. Consult without referring provider
  var consultCodes = ['99241', '99242', '99243', '99244', '99245', '99251', '99252', '99253', '99254', '99255'];
  var hasConsult = (claim.charges || []).some(function(ch) { return consultCodes.indexOf(ch.cptCode) !== -1; });
  if (hasConsult && !claim.referringProvider) {
    errors.push({
      severity: 'error',
      code: 'MISSING_REFERRING',
      message: 'Consult code requires a referring provider',
      fix: 'Add the referring provider to the claim',
    });
  }

  return {
    claimId: claimId,
    errors: errors,
    warnings: warnings,
    isClean: errors.length === 0,
    totalIssues: errors.length + warnings.length,
  };
}

function _calcAge(dob) {
  if (!dob) return 0;
  var birth = new Date(dob);
  var now = new Date();
  var age = now.getFullYear() - birth.getFullYear();
  var m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

/* ============================================================
   BATCH SCRUB ALL PENDING CLAIMS
   ============================================================ */
function batchScrubClaims() {
  var claims = getClaims().filter(function(c) {
    return c.status === 'Draft' || c.status === 'Ready';
  });

  var results = [];
  claims.forEach(function(c) {
    var result = scrubClaim(c.id);
    results.push(result);
  });

  return {
    totalClaims: claims.length,
    cleanClaims: results.filter(function(r) { return r.isClean; }).length,
    errorClaims: results.filter(function(r) { return !r.isClean; }).length,
    totalErrors: results.reduce(function(sum, r) { return sum + r.errors.length; }, 0),
    totalWarnings: results.reduce(function(sum, r) { return sum + r.warnings.length; }, 0),
    results: results,
  };
}

/* ============================================================
   CLAIM SCRUB VIEW
   ============================================================ */
function renderClaimScrub() {
  var app = document.getElementById('app');
  app.innerHTML = '';

  setTopbar({ title: 'Claim Scrubbing', meta: '', actions: '' });
  setActiveNav('claim-scrub');

  // Batch scrub button
  var toolbar = document.createElement('div');
  toolbar.className = 'billing-toolbar';

  var batchBtn = document.createElement('button');
  batchBtn.className = 'btn btn-primary';
  batchBtn.textContent = 'Scrub All Pending Claims';
  batchBtn.addEventListener('click', function() {
    var results = batchScrubClaims();
    _renderScrubResults(app, results);
  });
  toolbar.appendChild(batchBtn);

  var backBtn = document.createElement('button');
  backBtn.className = 'btn btn-secondary';
  backBtn.textContent = 'Back to Billing';
  backBtn.addEventListener('click', function() { navigate('#billing'); });
  toolbar.appendChild(backBtn);

  app.appendChild(toolbar);

  // Run initial batch scrub
  var results = batchScrubClaims();
  _renderScrubResults(app, results);
}

function _renderScrubResults(app, batchResult) {
  // Remove old results
  var old = document.getElementById('scrub-results-container');
  if (old) old.remove();

  var container = document.createElement('div');
  container.id = 'scrub-results-container';

  // Summary stats
  var statsBar = document.createElement('div');
  statsBar.className = 'billing-summary-bar';
  [
    { value: batchResult.totalClaims, label: 'Claims Scrubbed' },
    { value: batchResult.cleanClaims, label: 'Clean Claims', cls: 'stat-success' },
    { value: batchResult.errorClaims, label: 'Claims with Issues', cls: batchResult.errorClaims > 0 ? 'stat-danger' : '' },
    { value: batchResult.totalErrors, label: 'Errors', cls: batchResult.totalErrors > 0 ? 'stat-danger' : '' },
    { value: batchResult.totalWarnings, label: 'Warnings', cls: batchResult.totalWarnings > 0 ? 'stat-warning' : '' },
  ].forEach(function(s) {
    var card = document.createElement('div');
    card.className = 'summary-stat';
    card.innerHTML = '<div class="summary-stat-value' + (s.cls ? ' ' + s.cls : '') + '">' + s.value + '</div><div class="summary-stat-label">' + esc(s.label) + '</div>';
    statsBar.appendChild(card);
  });
  container.appendChild(statsBar);

  // Claims with issues first, then clean
  var sorted = batchResult.results.slice().sort(function(a, b) {
    if (a.isClean === b.isClean) return 0;
    return a.isClean ? 1 : -1;
  });

  if (sorted.length === 0) {
    var empty = document.createElement('div');
    empty.className = 'card';
    empty.innerHTML = '<div style="padding:32px;text-align:center;color:var(--text-muted);">No pending claims to scrub. Create claims in Draft or Ready status.</div>';
    container.appendChild(empty);
  }

  sorted.forEach(function(result) {
    var claim = getClaim(result.claimId);
    if (!claim) return;

    var patient = getPatient(claim.patientId);
    var patName = patient ? esc(patient.firstName + ' ' + patient.lastName) : 'Unknown';

    var card = document.createElement('div');
    card.className = 'card scrub-result-card' + (result.isClean ? ' scrub-clean' : ' scrub-issues');
    card.style.marginBottom = '12px';

    var header = document.createElement('div');
    header.className = 'scrub-result-header';
    header.innerHTML =
      '<div style="display:flex;align-items:center;gap:12px;">' +
      '<span class="scrub-status-icon">' + (result.isClean ? '<span style="color:var(--success);font-size:18px;font-weight:700;">&#10003;</span>' : '<span style="color:var(--danger);font-size:18px;font-weight:700;">&#10007;</span>') + '</span>' +
      '<div>' +
      '<div style="font-weight:600;">' + patName + ' — ' + _claimStatusBadge(claim.status) + '</div>' +
      '<div style="font-size:12px;color:var(--text-muted);">Claim ' + esc(claim.id.slice(0, 8)) + ' | ' + esc((claim.serviceDate || claim.createdAt || '').slice(0, 10)) + '</div>' +
      '</div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;">' +
      (result.errors.length > 0 ? '<span class="badge billing-badge-denied">' + result.errors.length + ' error' + (result.errors.length !== 1 ? 's' : '') + '</span>' : '') +
      (result.warnings.length > 0 ? '<span class="badge billing-badge-submitted">' + result.warnings.length + ' warning' + (result.warnings.length !== 1 ? 's' : '') + '</span>' : '') +
      (result.isClean ? '<span class="badge billing-badge-paid">Clean</span>' : '') +
      '</div>';
    card.appendChild(header);

    // Issues list
    if (result.errors.length > 0 || result.warnings.length > 0) {
      var issueList = document.createElement('div');
      issueList.className = 'scrub-issues-list';

      result.errors.forEach(function(err) {
        var item = document.createElement('div');
        item.className = 'scrub-issue-item scrub-issue-error';
        item.innerHTML =
          '<div class="scrub-issue-icon">&#x26A0;</div>' +
          '<div class="scrub-issue-body">' +
          '<div class="scrub-issue-msg">' + esc(err.message) + '</div>' +
          (err.fix ? '<div class="scrub-issue-fix">Fix: ' + esc(err.fix) + '</div>' : '') +
          '</div>';
        issueList.appendChild(item);
      });

      result.warnings.forEach(function(warn) {
        var item = document.createElement('div');
        item.className = 'scrub-issue-item scrub-issue-warning';
        item.innerHTML =
          '<div class="scrub-issue-icon">&#x26A0;</div>' +
          '<div class="scrub-issue-body">' +
          '<div class="scrub-issue-msg">' + esc(warn.message) + '</div>' +
          (warn.fix ? '<div class="scrub-issue-fix">Fix: ' + esc(warn.fix) + '</div>' : '') +
          '</div>';
        issueList.appendChild(item);
      });

      card.appendChild(issueList);

      // Fix button
      var fixBar = document.createElement('div');
      fixBar.style.cssText = 'padding:8px 16px;border-top:1px solid var(--border);display:flex;gap:8px;';
      var viewBtn = document.createElement('button');
      viewBtn.className = 'btn btn-secondary btn-sm';
      viewBtn.textContent = 'View Claim';
      viewBtn.addEventListener('click', function() { openClaimDetailModal(claim.id); });
      fixBar.appendChild(viewBtn);
      card.appendChild(fixBar);
    }

    container.appendChild(card);
  });

  app.appendChild(container);
}

/* ============================================================
   SINGLE CLAIM SCRUB MODAL (callable from claim detail)
   ============================================================ */
function openClaimScrubModal(claimId) {
  var result = scrubClaim(claimId);
  var claim = getClaim(claimId);
  var patient = claim ? getPatient(claim.patientId) : null;
  var patName = patient ? esc(patient.firstName + ' ' + patient.lastName) : 'Unknown';

  var body = '';

  // Status header
  body += '<div style="text-align:center;margin-bottom:16px;">';
  if (result.isClean) {
    body += '<div style="font-size:48px;color:var(--success);">&#10003;</div>';
    body += '<div style="font-size:18px;font-weight:700;color:var(--success);">Claim is Clean</div>';
    body += '<div style="color:var(--text-muted);font-size:13px;">No errors or warnings found.</div>';
  } else {
    body += '<div style="font-size:48px;color:var(--danger);">&#10007;</div>';
    body += '<div style="font-size:18px;font-weight:700;color:var(--danger);">' + result.errors.length + ' Error' + (result.errors.length !== 1 ? 's' : '') + ', ' + result.warnings.length + ' Warning' + (result.warnings.length !== 1 ? 's' : '') + '</div>';
  }
  body += '</div>';

  // Issues
  if (result.errors.length > 0) {
    body += '<h4 style="color:var(--danger);margin-bottom:8px;">Errors (must fix)</h4>';
    result.errors.forEach(function(err) {
      body += '<div class="scrub-issue-item scrub-issue-error">';
      body += '<div class="scrub-issue-icon">&#x26A0;</div>';
      body += '<div class="scrub-issue-body">';
      body += '<div class="scrub-issue-msg">' + esc(err.message) + '</div>';
      if (err.fix) body += '<div class="scrub-issue-fix">Fix: ' + esc(err.fix) + '</div>';
      body += '</div></div>';
    });
  }

  if (result.warnings.length > 0) {
    body += '<h4 style="color:var(--warning);margin:12px 0 8px;">Warnings (review recommended)</h4>';
    result.warnings.forEach(function(warn) {
      body += '<div class="scrub-issue-item scrub-issue-warning">';
      body += '<div class="scrub-issue-icon">&#x26A0;</div>';
      body += '<div class="scrub-issue-body">';
      body += '<div class="scrub-issue-msg">' + esc(warn.message) + '</div>';
      if (warn.fix) body += '<div class="scrub-issue-fix">Fix: ' + esc(warn.fix) + '</div>';
      body += '</div></div>';
    });
  }

  var footer = '<button class="btn btn-ghost" onclick="closeModal()">Close</button>';
  if (!result.isClean) {
    footer += '<button class="btn btn-primary" id="scrub-fix-btn">Edit Claim</button>';
  }

  openModal({ title: 'Claim Scrub — ' + patName, bodyHTML: body, footerHTML: footer });

  setTimeout(function() {
    var fixBtn = document.getElementById('scrub-fix-btn');
    if (fixBtn) {
      fixBtn.addEventListener('click', function() {
        closeModal();
        openClaimDetailModal(claimId);
      });
    }
  }, 50);
}
