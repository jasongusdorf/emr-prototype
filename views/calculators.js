/* ============================================================
   views/calculators.js — Clinical calculators modal
   Exposes: openCalculatorsModal()
   No localStorage reads/writes — purely computational.
   ============================================================ */

function _getCalcPatientContext() {
  // Try to get patient from current route (chart or encounter)
  try {
    const hash = window.location.hash || '';
    let patientId = '';
    if (hash.startsWith('#chart/')) patientId = hash.split('/')[1];
    else if (hash.startsWith('#encounter/')) {
      const encId = hash.split('/')[1];
      const enc = typeof getEncounter === 'function' ? getEncounter(encId) : null;
      if (enc) patientId = enc.patientId;
    }
    if (patientId) {
      const p = typeof getPatient === 'function' ? getPatient(patientId) : null;
      if (p) {
        const age = p.dob ? Math.floor((Date.now() - new Date(p.dob).getTime()) / 31557600000) : null;
        const sex = (p.sex || '').toLowerCase().startsWith('f') ? 'female' : ((p.sex || '').toLowerCase().startsWith('m') ? 'male' : null);
        return { patientId, age, sex };
      }
    }
  } catch (e) { /* ignore */ }
  return { patientId: null, age: null, sex: null };
}

function _getLatestCreatinine(patientId) {
  if (!patientId || typeof getLabResults !== 'function') return null;
  var labs = getLabResults(patientId);
  var latestCr = null;
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
    });
  });
  return latestCr;
}

function openCalculatorsModal() {
  const TABS = [
    { id: 'bmi',        label: 'BMI'             },
    { id: 'egfr',       label: 'eGFR'            },
    { id: 'cha2ds2',    label: 'CHA₂DS₂-VASc'   },
    { id: 'curb65',     label: 'CURB-65'         },
    { id: 'wells',      label: 'Wells DVT'       },
    { id: 'framingham', label: 'Framingham CV'   },
    { id: 'troponin',   label: 'Troponin Delta'  },
    { id: 'kfre',       label: 'KFRE'            },
    { id: 'caprini',    label: 'Caprini VTE'     },
  ];

  const backdrop = document.getElementById('modal-backdrop');
  const modal    = document.getElementById('modal');
  document.getElementById('modal-title').textContent = 'Clinical Calculators';
  document.getElementById('modal-footer').innerHTML = '<button class="btn btn-secondary" id="calc-close">Close</button>';
  modal.className = 'modal modal-lg';
  backdrop.classList.remove('hidden');

  const body = document.getElementById('modal-body');
  body.innerHTML = '';
  body.style.padding = '0';

  // Tab bar
  const tabBar = document.createElement('div');
  tabBar.className = 'calc-tabs';
  tabBar.style.padding = '0 20px';
  TABS.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'calc-tab' + (t.id === 'bmi' ? ' active' : '');
    btn.textContent = t.label;
    btn.dataset.tab = t.id;
    btn.addEventListener('click', () => {
      tabBar.querySelectorAll('.calc-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      body.querySelectorAll('.calc-panel').forEach(p => p.classList.remove('active'));
      const panel = body.querySelector('#calc-' + t.id);
      if (panel) panel.classList.add('active');
    });
    tabBar.appendChild(btn);
  });
  body.appendChild(tabBar);

  const panels = document.createElement('div');
  panels.style.padding = '20px';
  panels.appendChild(_buildBMIPanel());
  panels.appendChild(_buildEGFRPanel());
  panels.appendChild(_buildCHA2DS2Panel());
  panels.appendChild(_buildCURB65Panel());
  panels.appendChild(_buildWellsPanel());
  panels.appendChild(_buildFraminghamPanel());
  panels.appendChild(_buildTroponinDeltaPanel());
  panels.appendChild(_buildKFREPanel());
  panels.appendChild(_buildCapriniPanel());
  body.appendChild(panels);

  document.getElementById('calc-close').addEventListener('click', closeModal);
}

/* ============================================================
   BMI Calculator
   ============================================================ */
function _buildBMIPanel() {
  const panel = document.createElement('div');
  panel.className = 'calc-panel active';
  panel.id = 'calc-bmi';

  const left = document.createElement('div');
  left.innerHTML = `
    <div class="form-group">
      <label class="form-label">Weight (lbs)</label>
      <input class="form-control" id="bmi-weight" type="number" min="0" step="0.1" placeholder="e.g. 154" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Height — Feet</label>
        <input class="form-control" id="bmi-ft" type="number" min="0" max="8" step="1" placeholder="5" />
      </div>
      <div class="form-group">
        <label class="form-label">Inches</label>
        <input class="form-control" id="bmi-in" type="number" min="0" max="11" step="1" placeholder="7" />
      </div>
    </div>
  `;

  const right = document.createElement('div');
  right.className = 'calc-result-box';
  right.id = 'bmi-result';
  right.innerHTML = '<div class="calc-result-value">—</div><div class="calc-result-label">BMI (kg/m²)</div><div class="calc-result-category"></div>';

  panel.appendChild(left);
  panel.appendChild(right);

  function calc() {
    const w  = parseFloat(document.getElementById('bmi-weight')?.value) || 0;
    const ft = parseFloat(document.getElementById('bmi-ft')?.value) || 0;
    const ins = parseFloat(document.getElementById('bmi-in')?.value) || 0;
    const totalIn = ft * 12 + ins;
    const valEl = right.querySelector('.calc-result-value');
    const catEl = right.querySelector('.calc-result-category');
    if (!w || !totalIn) { valEl.textContent = '—'; catEl.textContent = ''; return; }
    const heightM = totalIn * 0.0254;
    const weightKg = w * 0.453592;
    const bmi = weightKg / (heightM * heightM);
    valEl.textContent = bmi.toFixed(1);
    let cat = '', color = '';
    if (bmi < 18.5)      { cat = 'Underweight'; color = '#3182ce'; }
    else if (bmi < 25)   { cat = 'Normal';       color = '#276749'; }
    else if (bmi < 30)   { cat = 'Overweight';   color = '#c05621'; }
    else                 { cat = 'Obese';         color = '#c53030'; }
    catEl.textContent = cat;
    catEl.style.background = 'transparent';
    catEl.style.color = color;
    catEl.style.fontWeight = '600';
  }

  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn-secondary btn-sm';
  resetBtn.textContent = 'Reset';
  resetBtn.style.marginTop = '12px';
  resetBtn.addEventListener('click', () => {
    ['bmi-weight','bmi-ft','bmi-in'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    right.querySelector('.calc-result-value').textContent = '—';
    right.querySelector('.calc-result-category').textContent = '';
  });
  left.appendChild(resetBtn);

  setTimeout(() => {
    document.getElementById('bmi-weight')?.addEventListener('input', calc);
    document.getElementById('bmi-ft')?.addEventListener('input', calc);
    document.getElementById('bmi-in')?.addEventListener('input', calc);
  }, 0);

  return panel;
}

/* ============================================================
   eGFR (CKD-EPI 2021 — Race-Free)
   Auto-pulls creatinine from latest lab result if available.
   ============================================================ */
function _calcEGFR_CKDEPI(cr, age, sex) {
  // CKD-EPI 2021 (race-free):
  // eGFR = 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^(−1.200) × 0.9938^age × (1.012 if female)
  // κ = 0.7 (female) or 0.9 (male), α = −0.241 (female) or −0.302 (male)
  if (!cr || cr <= 0 || !age || age < 18) return null;
  var isFemale = sex === 'female';
  var kappa = isFemale ? 0.7 : 0.9;
  var alpha = isFemale ? -0.241 : -0.302;
  var sexFactor = isFemale ? 1.012 : 1.0;
  var ratio = cr / kappa;
  return 142 *
    Math.pow(Math.min(ratio, 1), alpha) *
    Math.pow(Math.max(ratio, 1), -1.200) *
    Math.pow(0.9938, age) *
    sexFactor;
}

function _getCKDStage(egfr) {
  if (egfr >= 90)      return { stage: 'G1', label: 'Normal', color: '#276749' };
  else if (egfr >= 60) return { stage: 'G2', label: 'Mildly decreased', color: '#276749' };
  else if (egfr >= 45) return { stage: 'G3a', label: 'Mild-moderately decreased', color: '#c05621' };
  else if (egfr >= 30) return { stage: 'G3b', label: 'Moderately-severely decreased', color: '#c05621' };
  else if (egfr >= 15) return { stage: 'G4', label: 'Severely decreased', color: '#c53030' };
  else                 return { stage: 'G5', label: 'Kidney failure', color: '#c53030' };
}

function _buildEGFRPanel() {
  const panel = document.createElement('div');
  panel.className = 'calc-panel';
  panel.id = 'calc-egfr';

  const left = document.createElement('div');
  left.innerHTML = `
    <div class="form-group">
      <label class="form-label">Serum Creatinine (mg/dL)</label>
      <input class="form-control" id="egfr-cr" type="number" min="0" step="0.01" placeholder="e.g. 1.2" />
      <small id="egfr-cr-source" style="color:var(--text-muted);font-size:11px"></small>
    </div>
    <div class="form-group">
      <label class="form-label">Age (years)</label>
      <input class="form-control" id="egfr-age" type="number" min="18" max="110" step="1" placeholder="e.g. 65" />
    </div>
    <div class="form-group">
      <label class="form-label">Sex</label>
      <select class="form-control" id="egfr-sex">
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
    </div>
  `;

  const right = document.createElement('div');
  right.className = 'calc-result-box';
  right.id = 'egfr-result';
  right.innerHTML = '<div class="calc-result-value">—</div><div class="calc-result-label">eGFR (mL/min/1.73m²)</div><div class="calc-result-category"></div>';

  panel.appendChild(left);
  panel.appendChild(right);

  function calc() {
    const cr  = parseFloat(document.getElementById('egfr-cr')?.value);
    const age = parseFloat(document.getElementById('egfr-age')?.value);
    const sex = document.getElementById('egfr-sex')?.value;
    const valEl = right.querySelector('.calc-result-value');
    const catEl = right.querySelector('.calc-result-category');
    if (!cr || !age || cr <= 0 || age < 18) {
      valEl.textContent = '—';
      catEl.textContent = age && age < 18 ? 'Age must be \u2265 18' : '';
      return;
    }

    const egfr = _calcEGFR_CKDEPI(cr, age, sex);
    if (egfr === null) { valEl.textContent = '—'; catEl.textContent = ''; return; }

    valEl.textContent = Math.round(egfr);
    const ckd = _getCKDStage(egfr);
    catEl.innerHTML = '';
    const stageLine = document.createElement('div');
    stageLine.textContent = 'CKD Stage ' + ckd.stage + ' \u2014 ' + ckd.label;
    stageLine.style.color = ckd.color;
    stageLine.style.fontWeight = '600';
    catEl.appendChild(stageLine);
  }

  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn-secondary btn-sm';
  resetBtn.textContent = 'Reset';
  resetBtn.style.marginTop = '12px';
  resetBtn.addEventListener('click', () => {
    ['egfr-cr','egfr-age'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const sexEl = document.getElementById('egfr-sex'); if (sexEl) sexEl.selectedIndex = 0;
    right.querySelector('.calc-result-value').textContent = '—';
    right.querySelector('.calc-result-category').textContent = '';
    const srcEl = document.getElementById('egfr-cr-source'); if (srcEl) srcEl.textContent = '';
  });
  left.appendChild(resetBtn);

  setTimeout(() => {
    // Pre-fill from patient context
    const ctx = _getCalcPatientContext();
    if (ctx.age) { const el = document.getElementById('egfr-age'); if (el && !el.value) el.value = ctx.age; }
    if (ctx.sex) { const el = document.getElementById('egfr-sex'); if (el) el.value = ctx.sex; }

    // Auto-pull creatinine from latest lab result
    if (ctx.patientId) {
      const latestCr = _getLatestCreatinine(ctx.patientId);
      if (latestCr) {
        const crEl = document.getElementById('egfr-cr');
        if (crEl && !crEl.value) {
          crEl.value = latestCr.value;
          const srcEl = document.getElementById('egfr-cr-source');
          if (srcEl) srcEl.textContent = 'Auto-filled from lab (' + (typeof formatDateTime === 'function' ? formatDateTime(latestCr.date) : latestCr.date) + ')';
          calc();
        }
      }
    }

    document.getElementById('egfr-cr')?.addEventListener('input', function() {
      const srcEl = document.getElementById('egfr-cr-source');
      if (srcEl) srcEl.textContent = '';
      calc();
    });
    document.getElementById('egfr-age')?.addEventListener('input', calc);
    document.getElementById('egfr-sex')?.addEventListener('change', calc);
  }, 0);

  return panel;
}

/* ============================================================
   CHA₂DS₂-VASc
   ============================================================ */
function _buildCHA2DS2Panel() {
  const panel = document.createElement('div');
  panel.className = 'calc-panel';
  panel.id = 'calc-cha2ds2';

  const factors = [
    { id: 'cha-chf',       label: 'Congestive Heart Failure',       pts: 1 },
    { id: 'cha-htn',       label: 'Hypertension',                   pts: 1 },
    { id: 'cha-age75',     label: 'Age ≥ 75 years',                 pts: 2 },
    { id: 'cha-dm',        label: 'Diabetes Mellitus',               pts: 1 },
    { id: 'cha-stroke',    label: 'Stroke / TIA / Thromboembolism',  pts: 2 },
    { id: 'cha-vasc',      label: 'Vascular Disease (MI, PAD, aorta)',pts: 1 },
    { id: 'cha-age6574',   label: 'Age 65–74 years',                 pts: 1 },
    { id: 'cha-female',    label: 'Female Sex',                      pts: 1 },
  ];

  const left = document.createElement('div');
  factors.forEach(f => {
    const grp = document.createElement('div');
    grp.className = 'checkbox-group';
    grp.style.marginBottom = '8px';
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.id = f.id;
    cb.addEventListener('change', () => {
      // Age mutual exclusivity: ≥75 and 65-74 cannot both be checked
      if (f.id === 'cha-age75' && cb.checked) {
        const other = document.getElementById('cha-age6574');
        if (other) other.checked = false;
      } else if (f.id === 'cha-age6574' && cb.checked) {
        const other = document.getElementById('cha-age75');
        if (other) other.checked = false;
      }
      calc();
    });
    const lbl = document.createElement('label');
    lbl.htmlFor = f.id;
    lbl.textContent = f.label + ' (+' + f.pts + ')';
    grp.appendChild(cb); grp.appendChild(lbl);
    left.appendChild(grp);
  });

  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn-secondary btn-sm';
  resetBtn.textContent = 'Reset';
  resetBtn.style.marginTop = '8px';
  resetBtn.addEventListener('click', () => {
    factors.forEach(f => { const el = document.getElementById(f.id); if (el) el.checked = false; });
    calc();
  });
  left.appendChild(resetBtn);

  const right = document.createElement('div');
  right.className = 'calc-result-box';
  right.innerHTML = '<div class="calc-result-value">0</div><div class="calc-result-label">CHA₂DS₂-VASc Score</div><div class="calc-result-category"></div>';

  panel.appendChild(left);
  panel.appendChild(right);

  const riskTable = [0, 0, 1.3, 2.2, 3.2, 4.0, 6.7, 9.6, 6.7, 15.2];

  function calc() {
    let score = 0;
    factors.forEach(f => { if (document.getElementById(f.id)?.checked) score += f.pts; });
    const valEl = right.querySelector('.calc-result-value');
    const catEl = right.querySelector('.calc-result-category');
    valEl.textContent = score;
    const risk = score < riskTable.length ? riskTable[score] : riskTable[riskTable.length - 1];
    const isFemale = document.getElementById('cha-female')?.checked;

    // Recommendation per guidelines:
    // 0 (male) or 1 (female, where the 1 point is solely from sex) = no therapy
    // 1 (male) = consider anticoagulation
    // >=2 = anticoagulation recommended
    let rec = '', color = '';
    if (score === 0) {
      rec = 'No anticoagulation therapy needed';
      color = '#276749';
    } else if (score === 1 && isFemale) {
      rec = 'No anticoagulation therapy needed (female sex is sole risk factor)';
      color = '#276749';
    } else if (score === 1) {
      rec = 'Consider anticoagulation (male with 1 non-sex risk factor)';
      color = '#c05621';
    } else {
      rec = 'Anticoagulation recommended (score \u22652)';
      color = '#c53030';
    }
    catEl.innerHTML = '';
    const riskLine = document.createElement('div');
    riskLine.textContent = 'Annual Stroke Risk ~' + risk.toFixed(1) + '%';
    riskLine.style.fontSize = '13px';
    riskLine.style.marginBottom = '4px';
    const recLine = document.createElement('div');
    recLine.textContent = rec;
    recLine.style.color = color;
    recLine.style.fontWeight = '600';
    catEl.appendChild(riskLine);
    catEl.appendChild(recLine);
  }

  return panel;
}

/* ============================================================
   CURB-65
   ============================================================ */
function _buildCURB65Panel() {
  const panel = document.createElement('div');
  panel.className = 'calc-panel';
  panel.id = 'calc-curb65';

  const criteria = [
    { id: 'curb-bun',      label: 'BUN > 19 mg/dL (7 mmol/L)' },
    { id: 'curb-rr',       label: 'Respiratory Rate ≥ 30/min' },
    { id: 'curb-bp',       label: 'Low BP (SBP < 90 or DBP ≤ 60 mmHg)' },
    { id: 'curb-age',      label: 'Age ≥ 65 years' },
    { id: 'curb-confusion',label: 'Confusion (new disorientation)' },
  ];

  const left = document.createElement('div');
  criteria.forEach(c => {
    const grp = document.createElement('div');
    grp.className = 'checkbox-group';
    grp.style.marginBottom = '10px';
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.id = c.id;
    cb.addEventListener('change', calc);
    const lbl = document.createElement('label');
    lbl.htmlFor = c.id;
    lbl.textContent = c.label;
    grp.appendChild(cb); grp.appendChild(lbl);
    left.appendChild(grp);
  });

  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn-secondary btn-sm';
  resetBtn.textContent = 'Reset';
  resetBtn.style.marginTop = '8px';
  resetBtn.addEventListener('click', () => {
    criteria.forEach(c => { const el = document.getElementById(c.id); if (el) el.checked = false; });
    calc();
  });
  left.appendChild(resetBtn);

  const right = document.createElement('div');
  right.className = 'calc-result-box';
  right.innerHTML = '<div class="calc-result-value">0</div><div class="calc-result-label">CURB-65 Score</div><div class="calc-result-category"></div>';

  panel.appendChild(left);
  panel.appendChild(right);

  function calc() {
    let score = 0;
    criteria.forEach(c => { if (document.getElementById(c.id)?.checked) score++; });
    const valEl = right.querySelector('.calc-result-value');
    const catEl = right.querySelector('.calc-result-category');
    valEl.textContent = score;
    let rec = '', mortality = '', color = '';
    if (score <= 1)      { rec = 'Outpatient treatment appropriate';    mortality = '30-day mortality <3%';  color = '#276749'; }
    else if (score === 2){ rec = 'Consider short inpatient admission';  mortality = '30-day mortality ~9%';  color = '#c05621'; }
    else                 { rec = 'Inpatient / ICU consideration';        mortality = '30-day mortality ~17–57%'; color = '#c53030'; }
    catEl.innerHTML = '';
    const m = document.createElement('div');
    m.textContent = mortality;
    m.style.fontSize = '12px';
    m.style.color = 'var(--text-muted)';
    m.style.marginBottom = '4px';
    const r = document.createElement('div');
    r.textContent = rec;
    r.style.color = color;
    r.style.fontWeight = '600';
    r.style.fontSize = '13px';
    catEl.appendChild(m);
    catEl.appendChild(r);
  }

  return panel;
}

/* ============================================================
   Wells DVT Score
   ============================================================ */
function _buildWellsPanel() {
  const panel = document.createElement('div');
  panel.className = 'calc-panel';
  panel.id = 'calc-wells';

  const criteria = [
    { id: 'wells-paralysis',   label: 'Active paralysis, paresis, or cast immobilization of lower extremity',   pts:  1 },
    { id: 'wells-bedridden',   label: 'Recently bedridden ≥3 days or major surgery in last 12 weeks',           pts:  1 },
    { id: 'wells-tenderness',  label: 'Localized tenderness along deep venous system',                          pts:  1 },
    { id: 'wells-swelling',    label: 'Entire leg swelling',                                                    pts:  1 },
    { id: 'wells-calf',        label: 'Calf swelling >3 cm compared to asymptomatic leg',                       pts:  1 },
    { id: 'wells-pitting',     label: 'Pitting edema confined to symptomatic leg',                              pts:  1 },
    { id: 'wells-collateral',  label: 'Collateral superficial veins (non-varicose)',                            pts:  1 },
    { id: 'wells-cancer',      label: 'Active cancer (treated within 6 months or palliative)',                  pts:  1 },
    { id: 'wells-alt',         label: 'Alternative diagnosis at least as likely as DVT',                        pts: -2 },
  ];

  const left = document.createElement('div');
  criteria.forEach(c => {
    const grp = document.createElement('div');
    grp.className = 'checkbox-group';
    grp.style.marginBottom = '8px';
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.id = c.id;
    cb.addEventListener('change', calc);
    const lbl = document.createElement('label');
    lbl.htmlFor = c.id;
    lbl.textContent = c.label + ' (' + (c.pts > 0 ? '+' : '') + c.pts + ')';
    grp.appendChild(cb); grp.appendChild(lbl);
    left.appendChild(grp);
  });

  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn-secondary btn-sm';
  resetBtn.textContent = 'Reset';
  resetBtn.style.marginTop = '8px';
  resetBtn.addEventListener('click', () => {
    criteria.forEach(c => { const el = document.getElementById(c.id); if (el) el.checked = false; });
    calc();
  });
  left.appendChild(resetBtn);

  const right = document.createElement('div');
  right.className = 'calc-result-box';
  right.innerHTML = '<div class="calc-result-value">0</div><div class="calc-result-label">Wells DVT Score</div><div class="calc-result-category"></div>';

  panel.appendChild(left);
  panel.appendChild(right);

  function calc() {
    let score = 0;
    criteria.forEach(c => { if (document.getElementById(c.id)?.checked) score += c.pts; });
    const valEl = right.querySelector('.calc-result-value');
    const catEl = right.querySelector('.calc-result-category');
    valEl.textContent = score;
    let prob = '', rec = '', color = '';
    if (score <= 0)      { prob = 'Low probability (~3%)';    rec = 'D-dimer may rule out DVT';    color = '#276749'; }
    else if (score <= 2) { prob = 'Moderate probability (~17%)'; rec = 'Ultrasound recommended';  color = '#c05621'; }
    else                 { prob = 'High probability (~75%)';  rec = 'Ultrasound + anticoagulation consideration'; color = '#c53030'; }
    catEl.innerHTML = '';
    const p = document.createElement('div');
    p.textContent = prob;
    p.style.fontWeight = '600';
    p.style.color = color;
    const r = document.createElement('div');
    r.textContent = rec;
    r.style.fontSize = '12px';
    r.style.color = 'var(--text-muted)';
    r.style.marginTop = '4px';
    catEl.appendChild(p);
    catEl.appendChild(r);
  }

  return panel;
}

/* ============================================================
   Framingham 10-Year CV Risk (simplified)
   ============================================================ */
function _buildFraminghamPanel() {
  const panel = document.createElement('div');
  panel.className = 'calc-panel';
  panel.id = 'calc-framingham';

  const left = document.createElement('div');
  left.innerHTML = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Age (years)</label>
        <input class="form-control" id="frs-age" type="number" min="30" max="79" placeholder="e.g. 55" />
      </div>
      <div class="form-group">
        <label class="form-label">Sex</label>
        <select class="form-control" id="frs-sex">
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Total Cholesterol (mg/dL)</label>
        <input class="form-control" id="frs-chol" type="number" min="100" max="400" placeholder="e.g. 210" />
      </div>
      <div class="form-group">
        <label class="form-label">HDL Cholesterol (mg/dL)</label>
        <input class="form-control" id="frs-hdl" type="number" min="20" max="120" placeholder="e.g. 50" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Systolic BP (mmHg)</label>
      <input class="form-control" id="frs-sbp" type="number" min="90" max="200" placeholder="e.g. 130" />
    </div>
    <div class="form-group">
      <label class="form-label">BP Treatment</label>
      <select class="form-control" id="frs-bptx">
        <option value="0">Not on blood pressure treatment</option>
        <option value="1">On blood pressure treatment</option>
      </select>
    </div>
    <div class="checkbox-group" style="margin-bottom:10px">
      <input type="checkbox" id="frs-smoker" />
      <label for="frs-smoker">Current smoker</label>
    </div>
    <div class="checkbox-group">
      <input type="checkbox" id="frs-dm" />
      <label for="frs-dm">Diabetes</label>
    </div>
  `;

  const right = document.createElement('div');
  right.className = 'calc-result-box';
  right.innerHTML = '<div class="calc-result-value">—</div><div class="calc-result-label">10-Year CV Risk</div><div class="calc-result-category"></div>';

  panel.appendChild(left);
  panel.appendChild(right);

  // Framingham point tables (ATP III)
  const malePoints = {
    age:    { 30:0, 35:2, 40:5, 45:6, 50:8, 55:10, 60:11, 65:12, 70:14, 75:15 },
    chol:   { 160:0, 200:4, 240:7, 280:9, 320:11 },
    hdl:    { 60:-1, 50:0, 45:1, 35:2, 0:2 },
    sbpTx:  { 120:0, 130:1, 140:2, 160:3, 0:4 },
    sbpNoTx:{ 120:0, 130:0, 140:1, 160:2, 0:3 },
    risk: [-100,1,1,1,1,2,2,3,4,5,6,8,10,12,16,20,25,30,100].map((v,i)=>v),
  };
  const femalePoints = {
    age:    { 30:-9, 35:-4, 40:0, 45:3, 50:6, 55:7, 60:8, 65:8, 70:10, 75:10 },
    chol:   { 160:0, 200:4, 240:8, 280:11, 320:13 },
    hdl:    { 60:-1, 50:0, 45:1, 35:2, 0:3 },
    sbpTx:  { 120:0, 130:3, 140:4, 160:5, 0:6 },
    sbpNoTx:{ 120:-3, 130:0, 140:1, 160:2, 0:4 },
    risk: [-100,1,1,1,1,1,1,1,1,1,2,3,4,5,6,8,11,14,18,100].map((v,i)=>v),
  };

  function getPoints(table, val) {
    const keys = Object.keys(table).map(Number).sort((a,b) => a-b);
    for (let i = keys.length - 1; i >= 0; i--) {
      if (val >= keys[i]) return table[keys[i]];
    }
    return 0;
  }

  function calc() {
    const age    = parseInt(document.getElementById('frs-age')?.value) || 0;
    const sex    = document.getElementById('frs-sex')?.value;
    const chol   = parseInt(document.getElementById('frs-chol')?.value) || 0;
    const hdl    = parseInt(document.getElementById('frs-hdl')?.value) || 0;
    const sbp    = parseInt(document.getElementById('frs-sbp')?.value) || 0;
    const bpTx   = parseInt(document.getElementById('frs-bptx')?.value) || 0;
    const smoke  = document.getElementById('frs-smoker')?.checked ? 1 : 0;
    const dm     = document.getElementById('frs-dm')?.checked ? 1 : 0;
    const valEl  = right.querySelector('.calc-result-value');
    const catEl  = right.querySelector('.calc-result-category');

    if (!age || !chol || !hdl || !sbp) { valEl.textContent = '—'; catEl.textContent = ''; return; }

    const T = sex === 'male' ? malePoints : femalePoints;
    const ageKey = [30,35,40,45,50,55,60,65,70,75].reduce((prev, k) => age >= k ? k : prev, 30);
    const pts = (T.age[ageKey] || 0)
      + getPoints(T.chol, chol)
      + getPoints(T.hdl, hdl)
      + (bpTx ? getPoints(T.sbpTx, sbp) : getPoints(T.sbpNoTx, sbp))
      + (smoke ? 3 : 0)
      + (dm ? 2 : 0);

    // Map points to risk %
    const riskArr = sex === 'male'
      ? [1,1,1,1,1,2,2,3,4,5,6,8,10,12,16,20,25,30]
      : [1,1,1,1,1,1,1,1,1,2,3,4,5,6,8,11,14,18];
    const idx = Math.max(0, Math.min(pts, riskArr.length - 1));
    const risk = pts < 0 ? riskArr[0] : (pts >= riskArr.length ? riskArr[riskArr.length-1] : riskArr[pts]);

    valEl.textContent = risk + '%';
    let cat = '', color = '';
    if (risk < 7.5)      { cat = 'Low Risk (<7.5%)';      color = '#276749'; }
    else if (risk < 20)  { cat = 'Intermediate Risk';     color = '#c05621'; }
    else                 { cat = 'High Risk (≥20%)';       color = '#c53030'; }
    catEl.textContent = cat;
    catEl.style.color = color;
    catEl.style.fontWeight = '600';
  }

  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn-secondary btn-sm';
  resetBtn.textContent = 'Reset';
  resetBtn.style.marginTop = '12px';
  resetBtn.addEventListener('click', () => {
    ['frs-age','frs-chol','frs-hdl','frs-sbp'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    ['frs-sex','frs-bptx'].forEach(id => { const el = document.getElementById(id); if (el) el.selectedIndex = 0; });
    ['frs-smoker','frs-dm'].forEach(id => { const el = document.getElementById(id); if (el) el.checked = false; });
    right.querySelector('.calc-result-value').textContent = '—';
    right.querySelector('.calc-result-category').textContent = '';
  });
  left.appendChild(resetBtn);

  setTimeout(() => {
    // Pre-fill from patient context
    const ctx = _getCalcPatientContext();
    if (ctx.age) { const el = document.getElementById('frs-age'); if (el && !el.value) el.value = ctx.age; }
    if (ctx.sex) { const el = document.getElementById('frs-sex'); if (el) el.value = ctx.sex; }
    ['frs-age','frs-chol','frs-hdl','frs-sbp'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', calc);
    });
    ['frs-sex','frs-bptx'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', calc);
    });
    document.getElementById('frs-smoker')?.addEventListener('change', calc);
    document.getElementById('frs-dm')?.addEventListener('change', calc);
  }, 0);

  return panel;
}

/* ============================================================
   Troponin Delta Calculator
   ============================================================ */
function _buildTroponinDeltaPanel() {
  const panel = document.createElement('div');
  panel.className = 'calc-panel';
  panel.id = 'calc-troponin';

  const left = document.createElement('div');
  left.innerHTML = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">1st Troponin (ng/L)</label>
        <input class="form-control" id="trop-val1" type="number" min="0" step="0.001" placeholder="e.g. 14" />
      </div>
      <div class="form-group">
        <label class="form-label">1st Time</label>
        <input class="form-control" id="trop-time1" type="datetime-local" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">2nd Troponin (ng/L)</label>
        <input class="form-control" id="trop-val2" type="number" min="0" step="0.001" placeholder="e.g. 42" />
      </div>
      <div class="form-group">
        <label class="form-label">2nd Time</label>
        <input class="form-control" id="trop-time2" type="datetime-local" />
      </div>
    </div>
  `;

  const right = document.createElement('div');
  right.className = 'calc-result-box';
  right.id = 'trop-result';
  right.innerHTML = '<div class="calc-result-value">\u2014</div><div class="calc-result-label">Troponin Delta</div><div class="calc-result-category"></div>';

  panel.appendChild(left);
  panel.appendChild(right);

  function calc() {
    const v1 = parseFloat(document.getElementById('trop-val1')?.value);
    const v2 = parseFloat(document.getElementById('trop-val2')?.value);
    const t1 = document.getElementById('trop-time1')?.value;
    const t2 = document.getElementById('trop-time2')?.value;
    const valEl = right.querySelector('.calc-result-value');
    const catEl = right.querySelector('.calc-result-category');

    if (isNaN(v1) || isNaN(v2)) { valEl.textContent = '\u2014'; catEl.innerHTML = ''; return; }

    const absDelta = v2 - v1;
    const pctChange = v1 > 0 ? ((absDelta / v1) * 100) : (v2 > 0 ? Infinity : 0);
    const absPct = Math.abs(pctChange);

    valEl.textContent = (absDelta >= 0 ? '+' : '') + absDelta.toFixed(1) + ' ng/L';
    catEl.innerHTML = '';

    // Time interval
    if (t1 && t2) {
      const d1 = new Date(t1);
      const d2 = new Date(t2);
      const diffMin = Math.round((d2 - d1) / 60000);
      const hrs = Math.floor(Math.abs(diffMin) / 60);
      const mins = Math.abs(diffMin) % 60;
      const timeLine = document.createElement('div');
      timeLine.textContent = 'Interval: ' + hrs + 'h ' + mins + 'm';
      timeLine.style.fontSize = '12px';
      timeLine.style.color = 'var(--text-muted)';
      timeLine.style.marginBottom = '4px';
      catEl.appendChild(timeLine);
    }

    const pctLine = document.createElement('div');
    pctLine.textContent = 'Change: ' + (pctChange === Infinity ? '\u221E' : (pctChange >= 0 ? '+' : '') + pctChange.toFixed(1)) + '%';
    pctLine.style.fontSize = '13px';
    pctLine.style.marginBottom = '4px';
    catEl.appendChild(pctLine);

    const sigLine = document.createElement('div');
    sigLine.style.fontWeight = '600';
    if (absPct > 20) {
      sigLine.textContent = 'Significant change (>20%) \u2014 Concerning for acute MI';
      sigLine.style.color = '#c53030';
    } else {
      sigLine.textContent = 'Not significant (\u226420% change)';
      sigLine.style.color = '#276749';
    }
    catEl.appendChild(sigLine);
  }

  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn-secondary btn-sm';
  resetBtn.textContent = 'Reset';
  resetBtn.style.marginTop = '12px';
  resetBtn.addEventListener('click', () => {
    ['trop-val1','trop-val2','trop-time1','trop-time2'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    right.querySelector('.calc-result-value').textContent = '\u2014';
    right.querySelector('.calc-result-category').innerHTML = '';
  });
  left.appendChild(resetBtn);

  setTimeout(() => {
    ['trop-val1','trop-val2'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', calc);
    });
    ['trop-time1','trop-time2'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', calc);
    });
  }, 0);

  return panel;
}

/* ============================================================
   KFRE (Kidney Failure Risk Equation) — 4-Variable
   ============================================================ */
function _buildKFREPanel() {
  const panel = document.createElement('div');
  panel.className = 'calc-panel';
  panel.id = 'calc-kfre';

  const left = document.createElement('div');
  left.innerHTML = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Age (years)</label>
        <input class="form-control" id="kfre-age" type="number" min="18" max="110" step="1" placeholder="e.g. 65" />
      </div>
      <div class="form-group">
        <label class="form-label">Sex</label>
        <select class="form-control" id="kfre-sex">
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">eGFR (mL/min/1.73m\u00B2)</label>
      <input class="form-control" id="kfre-egfr" type="number" min="1" max="200" step="1" placeholder="e.g. 35" />
      <small id="kfre-egfr-source" style="color:var(--text-muted);font-size:11px"></small>
    </div>
    <div class="form-group">
      <label class="form-label">ACR \u2014 Albumin-Creatinine Ratio (mg/g)</label>
      <input class="form-control" id="kfre-acr" type="number" min="0" step="1" placeholder="e.g. 300" />
    </div>
  `;

  const right = document.createElement('div');
  right.className = 'calc-result-box';
  right.id = 'kfre-result';
  right.innerHTML = '<div class="calc-result-value">\u2014</div><div class="calc-result-label">Kidney Failure Risk</div><div class="calc-result-category"></div>';

  panel.appendChild(left);
  panel.appendChild(right);

  function calc() {
    const age  = parseFloat(document.getElementById('kfre-age')?.value);
    const sex  = document.getElementById('kfre-sex')?.value;
    const egfr = parseFloat(document.getElementById('kfre-egfr')?.value);
    const acr  = parseFloat(document.getElementById('kfre-acr')?.value);
    const valEl = right.querySelector('.calc-result-value');
    const catEl = right.querySelector('.calc-result-category');

    if (!age || !egfr || !acr || acr <= 0) { valEl.textContent = '\u2014'; catEl.innerHTML = ''; return; }

    var male = sex === 'male' ? 1 : 0;
    // 4-variable KFRE linear predictor
    var lp = -0.2201 * (age / 10 - 7.036)
           + 0.2467 * (male - 0.5642)
           - 0.5567 * (egfr / 5 - 7.222)
           + 0.4510 * (Math.log(acr) - 5.137);

    var risk2yr = 1 - Math.pow(0.9832, Math.exp(lp));
    var risk5yr = 1 - Math.pow(0.9365, Math.exp(lp));

    valEl.textContent = (risk2yr * 100).toFixed(1) + '%';
    catEl.innerHTML = '';

    var line2 = document.createElement('div');
    line2.textContent = '2-year risk: ' + (risk2yr * 100).toFixed(1) + '%';
    line2.style.fontWeight = '600';
    line2.style.fontSize = '13px';
    line2.style.marginBottom = '4px';

    var line5 = document.createElement('div');
    line5.textContent = '5-year risk: ' + (risk5yr * 100).toFixed(1) + '%';
    line5.style.fontWeight = '600';
    line5.style.fontSize = '13px';
    line5.style.marginBottom = '6px';

    var recLine = document.createElement('div');
    recLine.style.fontSize = '12px';
    if (risk5yr >= 0.15) {
      line2.style.color = '#c53030';
      line5.style.color = '#c53030';
      recLine.textContent = 'High risk \u2014 consider nephrology referral and kidney replacement therapy planning.';
      recLine.style.color = '#c53030';
    } else if (risk5yr >= 0.05) {
      line2.style.color = '#c05621';
      line5.style.color = '#c05621';
      recLine.textContent = 'Moderate risk \u2014 close monitoring and nephrology involvement recommended.';
      recLine.style.color = '#c05621';
    } else {
      line2.style.color = '#276749';
      line5.style.color = '#276749';
      recLine.textContent = 'Lower risk \u2014 continue CKD management and monitoring.';
      recLine.style.color = '#276749';
    }

    catEl.appendChild(line2);
    catEl.appendChild(line5);
    catEl.appendChild(recLine);
  }

  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn-secondary btn-sm';
  resetBtn.textContent = 'Reset';
  resetBtn.style.marginTop = '12px';
  resetBtn.addEventListener('click', () => {
    ['kfre-age','kfre-egfr','kfre-acr'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const sexEl = document.getElementById('kfre-sex'); if (sexEl) sexEl.selectedIndex = 0;
    right.querySelector('.calc-result-value').textContent = '\u2014';
    right.querySelector('.calc-result-category').innerHTML = '';
    const srcEl = document.getElementById('kfre-egfr-source'); if (srcEl) srcEl.textContent = '';
  });
  left.appendChild(resetBtn);

  setTimeout(() => {
    const ctx = _getCalcPatientContext();
    if (ctx.age) { const el = document.getElementById('kfre-age'); if (el && !el.value) el.value = ctx.age; }
    if (ctx.sex) { const el = document.getElementById('kfre-sex'); if (el) el.value = ctx.sex; }

    // Auto-fill eGFR from patient labs if available
    if (ctx.patientId && ctx.age) {
      const latestCr = _getLatestCreatinine(ctx.patientId);
      if (latestCr) {
        const calcEgfr = _calcEGFR_CKDEPI(latestCr.value, ctx.age, ctx.sex || 'male');
        if (calcEgfr !== null) {
          const egfrEl = document.getElementById('kfre-egfr');
          if (egfrEl && !egfrEl.value) {
            egfrEl.value = Math.round(calcEgfr);
            const srcEl = document.getElementById('kfre-egfr-source');
            if (srcEl) srcEl.textContent = 'Auto-calculated from latest Cr ' + latestCr.value + ' mg/dL';
            calc();
          }
        }
      }
    }

    ['kfre-age','kfre-egfr','kfre-acr'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', calc);
    });
    document.getElementById('kfre-sex')?.addEventListener('change', calc);
  }, 0);

  return panel;
}

/* ============================================================
   Caprini VTE Risk Assessment
   ============================================================ */
function _buildCapriniPanel() {
  const panel = document.createElement('div');
  panel.className = 'calc-panel';
  panel.id = 'calc-caprini';

  const groups = [
    { pts: 1, label: '1 Point Each', items: [
      { id: 'cap-age41', label: 'Age 41-60' },
      { id: 'cap-minor-surg', label: 'Minor surgery' },
      { id: 'cap-bmi25', label: 'BMI > 25' },
      { id: 'cap-swollen', label: 'Swollen legs' },
      { id: 'cap-varicose', label: 'Varicose veins' },
      { id: 'cap-preg', label: 'Pregnancy/postpartum' },
      { id: 'cap-stillbirth', label: 'Hx unexplained stillbirth' },
      { id: 'cap-ocp', label: 'Oral contraceptives/HRT' },
      { id: 'cap-sepsis', label: 'Sepsis (<1mo)' },
      { id: 'cap-lung', label: 'Serious lung disease' },
      { id: 'cap-pfts', label: 'Abnormal pulmonary function' },
      { id: 'cap-mi', label: 'Acute MI' },
      { id: 'cap-chf', label: 'CHF (<1mo)' },
      { id: 'cap-ibd', label: 'IBD' },
      { id: 'cap-bedrest', label: 'Medical patient on bed rest' },
    ]},
    { pts: 2, label: '2 Points Each', items: [
      { id: 'cap-age61', label: 'Age 61-74' },
      { id: 'cap-arthro', label: 'Arthroscopic surgery' },
      { id: 'cap-major-surg', label: 'Major open surgery (>45min)' },
      { id: 'cap-lap-surg', label: 'Laparoscopic surgery (>45min)' },
      { id: 'cap-malig', label: 'Malignancy' },
      { id: 'cap-confined', label: 'Confined to bed (>72hr)' },
      { id: 'cap-cast', label: 'Immobilizing plaster cast' },
      { id: 'cap-cva', label: 'Central venous access' },
    ]},
    { pts: 3, label: '3 Points Each', items: [
      { id: 'cap-age75', label: 'Age \u226575' },
      { id: 'cap-dvtpe', label: 'History of DVT/PE' },
      { id: 'cap-fam-dvt', label: 'Family history DVT/PE' },
      { id: 'cap-fvl', label: 'Factor V Leiden' },
      { id: 'cap-pt20210', label: 'Prothrombin 20210A' },
      { id: 'cap-lupus', label: 'Lupus anticoagulant' },
      { id: 'cap-acl', label: 'Anticardiolipin antibodies' },
      { id: 'cap-homocys', label: 'Elevated homocysteine' },
      { id: 'cap-hit', label: 'HIT' },
      { id: 'cap-thrombophilia', label: 'Other congenital/acquired thrombophilia' },
    ]},
    { pts: 5, label: '5 Points Each', items: [
      { id: 'cap-stroke', label: 'Stroke (<1mo)' },
      { id: 'cap-trauma', label: 'Multiple trauma (<1mo)' },
      { id: 'cap-sci', label: 'Acute spinal cord injury (<1mo)' },
      { id: 'cap-arthroplasty', label: 'Major lower extremity arthroplasty' },
    ]},
  ];

  const left = document.createElement('div');
  left.style.maxHeight = '400px';
  left.style.overflowY = 'auto';

  var allItems = [];
  groups.forEach(function(g) {
    var heading = document.createElement('div');
    heading.textContent = g.label;
    heading.style.cssText = 'font-weight:600;font-size:13px;margin:10px 0 6px;color:var(--text-muted)';
    left.appendChild(heading);

    g.items.forEach(function(item) {
      allItems.push({ id: item.id, pts: g.pts });
      var grp = document.createElement('div');
      grp.className = 'checkbox-group';
      grp.style.marginBottom = '4px';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = item.id;
      cb.addEventListener('change', calc);
      var lbl = document.createElement('label');
      lbl.htmlFor = item.id;
      lbl.textContent = item.label;
      lbl.style.fontSize = '13px';
      grp.appendChild(cb);
      grp.appendChild(lbl);
      left.appendChild(grp);
    });
  });

  const right = document.createElement('div');
  right.className = 'calc-result-box';
  right.innerHTML = '<div class="calc-result-value">0</div><div class="calc-result-label">Caprini VTE Score</div><div class="calc-result-category"></div>';

  panel.appendChild(left);
  panel.appendChild(right);

  function calc() {
    var score = 0;
    allItems.forEach(function(item) {
      var el = document.getElementById(item.id);
      if (el && el.checked) score += item.pts;
    });
    const valEl = right.querySelector('.calc-result-value');
    const catEl = right.querySelector('.calc-result-category');
    valEl.textContent = score;
    catEl.innerHTML = '';

    var risk = '', rec = '', color = '';
    if (score === 0) {
      risk = 'Lowest risk';
      rec = 'Early ambulation';
      color = '#276749';
    } else if (score <= 2) {
      risk = 'Low risk';
      rec = 'SCDs (sequential compression devices)';
      color = '#276749';
    } else if (score <= 4) {
      risk = 'Moderate risk';
      rec = 'SCDs + pharmacologic prophylaxis';
      color = '#c05621';
    } else {
      risk = 'High risk (score \u22655)';
      rec = 'Pharmacologic prophylaxis + SCDs';
      color = '#c53030';
    }

    var riskLine = document.createElement('div');
    riskLine.textContent = risk;
    riskLine.style.fontWeight = '600';
    riskLine.style.color = color;
    riskLine.style.marginBottom = '4px';

    var recLine = document.createElement('div');
    recLine.textContent = rec;
    recLine.style.fontSize = '12px';
    recLine.style.color = 'var(--text-muted)';

    catEl.appendChild(riskLine);
    catEl.appendChild(recLine);
  }

  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn-secondary btn-sm';
  resetBtn.textContent = 'Reset';
  resetBtn.style.marginTop = '8px';
  resetBtn.addEventListener('click', () => {
    allItems.forEach(function(item) {
      var el = document.getElementById(item.id);
      if (el) el.checked = false;
    });
    calc();
  });
  left.appendChild(resetBtn);

  return panel;
}
