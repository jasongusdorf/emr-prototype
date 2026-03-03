/* ============================================================
   views/calculators.js — Clinical calculators modal
   Exposes: openCalculatorsModal()
   No localStorage reads/writes — purely computational.
   ============================================================ */

function openCalculatorsModal() {
  const TABS = [
    { id: 'bmi',        label: 'BMI'             },
    { id: 'egfr',       label: 'eGFR'            },
    { id: 'cha2ds2',    label: 'CHA₂DS₂-VASc'   },
    { id: 'curb65',     label: 'CURB-65'         },
    { id: 'wells',      label: 'Wells DVT'       },
    { id: 'framingham', label: 'Framingham CV'   },
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

  setTimeout(() => {
    document.getElementById('bmi-weight')?.addEventListener('input', calc);
    document.getElementById('bmi-ft')?.addEventListener('input', calc);
    document.getElementById('bmi-in')?.addEventListener('input', calc);
  }, 0);

  return panel;
}

/* ============================================================
   eGFR (CKD-EPI 2021)
   ============================================================ */
function _buildEGFRPanel() {
  const panel = document.createElement('div');
  panel.className = 'calc-panel';
  panel.id = 'calc-egfr';

  const left = document.createElement('div');
  left.innerHTML = `
    <div class="form-group">
      <label class="form-label">Serum Creatinine (mg/dL)</label>
      <input class="form-control" id="egfr-cr" type="number" min="0" step="0.01" placeholder="e.g. 1.2" />
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
    if (!cr || !age || cr <= 0 || age <= 0) { valEl.textContent = '—'; catEl.textContent = ''; return; }

    // CKD-EPI 2021 (race-free)
    const isFemale = sex === 'female';
    const kappa = isFemale ? 0.7 : 0.9;
    const alpha = isFemale ? -0.241 : -0.302;
    const sexFactor = isFemale ? 1.012 : 1.0;
    const ratio = cr / kappa;
    const egfr = 142 *
      Math.pow(Math.min(ratio, 1), alpha) *
      Math.pow(Math.max(ratio, 1), -1.200) *
      Math.pow(0.9938, age) *
      sexFactor;

    valEl.textContent = Math.round(egfr);
    let ckd = '', color = '';
    if (egfr >= 90)      { ckd = 'CKD Stage 1 (if markers) / Normal'; color = '#276749'; }
    else if (egfr >= 60) { ckd = 'CKD Stage 2 — Mildly Decreased';    color = '#276749'; }
    else if (egfr >= 45) { ckd = 'CKD Stage 3a — Mildly-Mod';         color = '#c05621'; }
    else if (egfr >= 30) { ckd = 'CKD Stage 3b — Mod-Severely';       color = '#c05621'; }
    else if (egfr >= 15) { ckd = 'CKD Stage 4 — Severely Decreased';  color = '#c53030'; }
    else                 { ckd = 'CKD Stage 5 — Kidney Failure';       color = '#c53030'; }
    catEl.textContent = ckd;
    catEl.style.color = color;
    catEl.style.fontWeight = '600';
  }

  setTimeout(() => {
    document.getElementById('egfr-cr')?.addEventListener('input', calc);
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
    cb.addEventListener('change', calc);
    const lbl = document.createElement('label');
    lbl.htmlFor = f.id;
    lbl.textContent = f.label + ' (+' + f.pts + ')';
    grp.appendChild(cb); grp.appendChild(lbl);
    left.appendChild(grp);
  });

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
    let rec = '', color = '';
    if (score === 0)      { rec = 'No anticoagulation';   color = '#276749'; }
    else if (score === 1) { rec = 'Consider anticoagulation'; color = '#c05621'; }
    else                  { rec = 'Anticoagulation recommended'; color = '#c53030'; }
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

  setTimeout(() => {
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
