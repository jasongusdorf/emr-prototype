/* ============================================================
   views/obgyn.js — OB/GYN Module
   Prenatal care, L&D, postpartum, GYN tracking
   ============================================================ */

/* 6c: Prenatal labs restructured by trimester */
var PRENATAL_LAB_GROUPS = [
  {
    heading: '1st Trimester',
    labs: [
      { key: 'bloodType',  label: 'Blood Type/Rh' },
      { key: 'rubella',    label: 'Rubella Immunity' },
      { key: 'hepatitisB', label: 'Hepatitis B (HBsAg)' },
      { key: 'hiv',        label: 'HIV' },
      { key: 'cbc1',       label: 'CBC' },
      { key: 'urinalysis', label: 'Urinalysis' },
      { key: 'chlamydia',  label: 'Chlamydia/GC' },
      { key: 'syphilis',   label: 'Syphilis (RPR)' },
      { key: 'pap',        label: 'Pap Smear' },
      { key: 'nipt',       label: 'NIPT' }
    ]
  },
  {
    heading: '2nd Trimester',
    labs: [
      { key: 'quadScreen', label: 'Quad Screen' },
      { key: 'gct',        label: 'GCT (1-hour glucose challenge)' },
      { key: 'cbc2',       label: 'Repeat CBC' }
    ]
  },
  {
    heading: '3rd Trimester',
    labs: [
      { key: 'gbs',        label: 'GBS' },
      { key: 'ogtt',       label: 'OGTT (if GCT abnormal)' },
      { key: 'cbc3',       label: 'Repeat CBC' },
      { key: 'rhogam',     label: 'RhoGAM Status' },
      { key: 'tdap',       label: 'Tdap Status' },
      { key: 'typeScreen',  label: 'Type & Screen' }
    ]
  }
];

/* Flat key list for backward compat */
var PRENATAL_LAB_KEYS = [];
PRENATAL_LAB_GROUPS.forEach(function(g) { g.labs.forEach(function(l) { PRENATAL_LAB_KEYS.push(l); }); });

var VISIT_SCHEDULE = [
  { weeks: '4-28',  frequency: 'Every 4 weeks',  visits: [4,8,12,16,20,24,28] },
  { weeks: '28-36', frequency: 'Every 2 weeks',  visits: [30,32,34,36] },
  { weeks: '36-40', frequency: 'Every week',      visits: [37,38,39,40] }
];

var DELIVERY_TYPES = ['SVD (Spontaneous Vaginal)', 'C-Section (Primary)', 'C-Section (Repeat)', 'Assisted (Vacuum)', 'Assisted (Forceps)', 'VBAC'];

/* 6d: Full EPDS with answer labels */
var EDINBURGH_QUESTIONS = [
  {
    text: 'I have been able to laugh and see the funny side of things',
    answers: ['As much as always', 'Not quite so much', 'Definitely not so much', 'Not at all'],
    reverse: true
  },
  {
    text: 'I have looked forward with enjoyment to things',
    answers: ['As much as ever', 'Rather less than usual', 'Definitely less than usual', 'Hardly at all'],
    reverse: true
  },
  {
    text: 'I have blamed myself unnecessarily when things went wrong',
    answers: ['No never', 'Not very often', 'Yes some of the time', 'Yes most of the time'],
    reverse: false
  },
  {
    text: 'I have been anxious or worried for no good reason',
    answers: ['No not at all', 'Hardly ever', 'Yes sometimes', 'Yes very often'],
    reverse: false
  },
  {
    text: 'I have felt scared or panicky for no very good reason',
    answers: ['No not at all', 'No not much', 'Yes sometimes', 'Yes quite a lot'],
    reverse: false
  },
  {
    text: 'Things have been getting on top of me',
    answers: ['No I\'ve been coping', 'No most of the time', 'Yes sometimes', 'Yes most of the time'],
    reverse: false
  },
  {
    text: 'I have been so unhappy that I have had difficulty sleeping',
    answers: ['No not at all', 'Not very often', 'Yes sometimes', 'Yes most of the time'],
    reverse: false
  },
  {
    text: 'I have felt sad or miserable',
    answers: ['No not at all', 'Not very often', 'Yes quite often', 'Yes most of the time'],
    reverse: false
  },
  {
    text: 'I have been so unhappy that I have been crying',
    answers: ['No never', 'Only occasionally', 'Yes quite often', 'Yes most of the time'],
    reverse: false
  },
  {
    text: 'The thought of harming myself has occurred to me',
    answers: ['Never', 'Hardly ever', 'Sometimes', 'Yes quite often'],
    reverse: false
  }
];

/* 6j: High-risk checklist items */
var HIGH_RISK_FACTORS = [
  { key: 'ama',            label: 'AMA (>=35)' },
  { key: 'multiples',      label: 'Multiples' },
  { key: 'priorPreeclampsia', label: 'Prior Preeclampsia' },
  { key: 'priorPreterm',   label: 'Prior Preterm Birth' },
  { key: 'gdm',            label: 'Gestational Diabetes (GDM)' },
  { key: 'chronicHTN',     label: 'Chronic HTN' },
  { key: 'autoimmune',     label: 'Autoimmune Disease' },
  { key: 'shortCervix',    label: 'Short Cervix' }
];

var _obgynTab = 'prenatal';

/* ============================================================
   MAIN RENDER
   ============================================================ */
function renderOBGYN(patientId) {
  var app = document.getElementById('app');
  app.innerHTML = '';

  var patient = patientId ? getPatient(patientId) : null;
  if (patientId && !patient) { app.textContent = 'Patient not found.'; return; }

  setTopbar({
    title: patient ? 'OB/GYN — ' + esc(patient.firstName + ' ' + patient.lastName) : 'OB/GYN',
    meta: patient ? esc(patient.mrn) : '',
    actions: ''
  });
  setActiveNav('obgyn');

  // Tabs
  var tabs = document.createElement('div');
  tabs.className = 'inbox-tabs';
  var tabDefs = [
    { key: 'prenatal', label: 'Prenatal' },
    { key: 'labs', label: 'Prenatal Labs' },
    { key: 'schedule', label: 'Visit Schedule' },
    { key: 'antenatal', label: 'Antenatal Surveillance' },
    { key: 'ld', label: 'Labor & Delivery' },
    { key: 'postpartum', label: 'Postpartum' },
    { key: 'gyn', label: 'GYN' }
  ];

  tabDefs.forEach(function(t) {
    var btn = document.createElement('button');
    btn.className = 'inbox-tab' + (_obgynTab === t.key ? ' active' : '');
    btn.textContent = t.label;
    btn.addEventListener('click', function() { _obgynTab = t.key; renderOBGYN(patientId); });
    tabs.appendChild(btn);
  });
  app.appendChild(tabs);

  if (!patient) { renderOBGYNPatientList(app); return; }

  var card = document.createElement('div');
  card.className = 'card';
  card.style.cssText = 'margin:16px 20px;padding:20px;';

  switch (_obgynTab) {
    case 'prenatal': buildPrenatalTab(card, patient); break;
    case 'labs': buildPrenatalLabsTab(card, patient); break;
    case 'schedule': buildVisitScheduleTab(card, patient); break;
    case 'antenatal': buildAntenatalSurveillanceTab(card, patient); break;
    case 'ld': buildLaborDeliveryTab(card, patient); break;
    case 'postpartum': buildPostpartumTab(card, patient); break;
    case 'gyn': buildGynTab(card, patient); break;
  }
  app.appendChild(card);
}

function renderOBGYNPatientList(app) {
  var card = document.createElement('div');
  card.className = 'card';
  card.style.cssText = 'margin:16px 20px;padding:20px;';
  card.innerHTML = '<h3 style="margin-bottom:12px">OB/GYN Patients</h3>';

  var patients = getPatients().filter(function(p) { return hasOBGYNRelevance(p.id); });
  if (patients.length === 0) {
    card.innerHTML += '<p class="text-muted">No patients with OB/GYN records. OB/GYN tools appear in patient charts for female patients or when relevant diagnoses exist.</p>';
  } else {
    var table = document.createElement('table');
    table.className = 'data-table';
    table.innerHTML = '<thead><tr><th>Patient</th><th>MRN</th><th>Prenatal Records</th><th>GYN Records</th></tr></thead>';
    var tbody = document.createElement('tbody');
    patients.forEach(function(p) {
      var pr = getPrenatalRecords(p.id).length;
      var gr = getGynRecords(p.id).length;
      var tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', function() { navigate('#obgyn/' + p.id); });
      tr.innerHTML = '<td>' + esc(p.firstName + ' ' + p.lastName) + '</td><td>' + esc(p.mrn) + '</td><td>' + pr + '</td><td>' + gr + '</td>';
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    card.appendChild(table);
  }
  app.appendChild(card);
}

function hasOBGYNRelevance(patientId) {
  var p = getPatient(patientId);
  if (!p) return false;
  if ((p.sex || '').toLowerCase() === 'female') return true;
  if (getPrenatalRecords(patientId).length > 0) return true;
  if (getGynRecords(patientId).length > 0) return true;
  return false;
}

/* ---------- Utility: EDD calculation ---------- */
function calculateEDD(lmp) {
  if (!lmp) return null;
  var d = new Date(lmp);
  d.setDate(d.getDate() + 280); // Naegele's rule: +280 days
  return d;
}

function calculateEGA(lmp) {
  if (!lmp) return '';
  var now = new Date();
  var start = new Date(lmp);
  var diffMs = now - start;
  var totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  var weeks = Math.floor(totalDays / 7);
  var days = totalDays % 7;
  return weeks + 'w ' + days + 'd';
}

/* 6a: Format GTPAL string */
function formatGTPAL(rec) {
  var g = rec.gravida || 0;
  var t = rec.term || 0;
  var p = rec.preterm || 0;
  var a = rec.abortus || 0;
  var l = rec.living || 0;
  return 'G' + g + 'T' + t + 'P' + p + 'A' + a + 'L' + l;
}

/* ============================================================
   TAB: Prenatal Flowsheet
   ============================================================ */
function buildPrenatalTab(card, patient) {
  card.innerHTML = '<h3 style="margin-bottom:12px">Prenatal Flowsheet</h3>';
  var records = getPrenatalRecords(patient.id);

  var addBtn = makeBtn('+ New Pregnancy Record', 'btn btn-sm btn-primary', function() { openPrenatalModal(patient.id); });
  addBtn.style.marginBottom = '12px';
  card.appendChild(addBtn);

  if (records.length === 0) {
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'No prenatal records.' }));
    return;
  }

  records.forEach(function(rec) {
    var section = document.createElement('div');
    section.className = 'specialty-record-card';
    var edd = rec.edd ? new Date(rec.edd).toLocaleDateString() : (rec.lmp ? calculateEDD(rec.lmp).toLocaleDateString() : '—');
    var ega = rec.lmp ? calculateEGA(rec.lmp) : '—';
    var gtpal = formatGTPAL(rec);

    /* 6j: High-risk badge */
    var highRiskBadge = rec.highRisk ? '<span class="badge badge-danger" style="margin-left:8px;background:var(--danger);color:#fff;">HIGH RISK</span>' : '';

    section.innerHTML =
      '<div class="specialty-record-header">' +
        '<strong>' + esc(gtpal) + '</strong>' + highRiskBadge +
        '<span class="badge badge-info">EDD: ' + edd + ' | EGA: ' + ega + '</span>' +
      '</div>' +
      '<div class="specialty-record-body">' +
        '<p><strong>LMP:</strong> ' + esc(rec.lmp || '—') + ' | <strong>EDD Source:</strong> ' + esc(rec.eddSource || 'LMP') + '</p>' +
      '</div>';

    // Visits table — 6b: expanded columns
    var visits = rec.visits || [];
    if (visits.length > 0) {
      var vTable = '<table class="data-table data-table-compact"><thead><tr><th>Date</th><th>EGA</th><th>Fundal Ht</th><th>FHR</th><th>Weight</th><th>BP</th><th>Urine Protein</th><th>Glucose</th><th>Edema</th><th>Presentation</th><th>Fetal Mvmt</th></tr></thead><tbody>';
      visits.forEach(function(v) {
        vTable += '<tr>' +
          '<td>' + esc(v.date || '') + '</td>' +
          '<td>' + esc(v.ega || '') + '</td>' +
          '<td>' + esc(v.fundalHeight || '') + '</td>' +
          '<td>' + esc(v.fhr || '') + '</td>' +
          '<td>' + esc(v.weight || '') + '</td>' +
          '<td>' + esc(v.bp || '') + '</td>' +
          '<td>' + esc(v.urineProtein || '') + '</td>' +
          '<td>' + esc(v.glucose || '') + '</td>' +
          '<td>' + esc(v.edema || '') + '</td>' +
          '<td>' + esc(v.fetalPresentation || '') + '</td>' +
          '<td>' + esc(v.fetalMovement || '') + '</td>' +
          '</tr>';
      });
      vTable += '</tbody></table>';
      var vDiv = document.createElement('div');
      vDiv.innerHTML = vTable;
      section.appendChild(vDiv);
    }

    var footer = document.createElement('div');
    footer.className = 'specialty-record-footer';
    var visitBtn = makeBtn('+ Add Visit', 'btn btn-xs btn-primary', function() { openPrenatalVisitModal(patient.id, rec); });
    var editBtn = makeBtn('Edit', 'btn btn-xs btn-secondary', function() { openPrenatalModal(patient.id, rec); });
    footer.appendChild(visitBtn);
    footer.appendChild(editBtn);
    section.appendChild(footer);

    card.appendChild(section);
  });
}

/* 6a: GTPAL expansion in prenatal modal + 6j: high-risk checklist */
function openPrenatalModal(patientId, existing) {
  var r = existing || {};
  var riskFactors = r.riskFactors || {};

  var bodyHTML =
    '<div class="form-row">' +
      '<div class="form-group"><label>LMP</label><input id="pn-lmp" type="date" class="form-control" value="' + esc(r.lmp || '') + '" /></div>' +
      '<div class="form-group"><label>EDD (auto-calculated if blank)</label><input id="pn-edd" type="date" class="form-control" value="' + esc(r.edd || '') + '" /></div>' +
    '</div>' +
    '<div class="form-group"><label>EDD Source</label><select id="pn-edd-source" class="form-control">' +
      ['LMP', 'Ultrasound Dating', 'IVF Transfer Date'].map(function(s) {
        return '<option' + (r.eddSource === s ? ' selected' : '') + '>' + s + '</option>';
      }).join('') +
    '</select></div>' +
    '<fieldset class="form-fieldset">' +
      '<legend>GTPAL</legend>' +
      '<div class="form-row">' +
        '<div class="form-group"><label>Gravida (G)</label><input id="pn-gravida" type="number" min="0" class="form-control" value="' + (r.gravida || 0) + '" /></div>' +
        '<div class="form-group"><label>Term (T)</label><input id="pn-term" type="number" min="0" class="form-control" value="' + (r.term || 0) + '" /></div>' +
        '<div class="form-group"><label>Preterm (P)</label><input id="pn-preterm" type="number" min="0" class="form-control" value="' + (r.preterm || 0) + '" /></div>' +
        '<div class="form-group"><label>Abortus (A)</label><input id="pn-abortus" type="number" min="0" class="form-control" value="' + (r.abortus || 0) + '" /></div>' +
        '<div class="form-group"><label>Living (L)</label><input id="pn-living" type="number" min="0" class="form-control" value="' + (r.living || 0) + '" /></div>' +
      '</div>' +
      '<div id="pn-gtpal-preview" style="margin-top:4px;font-weight:600;font-size:14px;"></div>' +
    '</fieldset>' +
    /* 6j: Risk checklist */
    '<fieldset class="form-fieldset">' +
      '<legend>High-Risk Pregnancy Factors</legend>' +
      HIGH_RISK_FACTORS.map(function(rf) {
        var checked = riskFactors[rf.key] ? ' checked' : '';
        return '<label style="display:block;margin:4px 0;font-size:13px;cursor:pointer;">' +
          '<input type="checkbox" class="pn-risk-factor" data-risk-key="' + rf.key + '"' + checked + ' /> ' + esc(rf.label) +
        '</label>';
      }).join('') +
    '</fieldset>';

  openModal({
    title: (existing ? 'Edit' : 'New') + ' Prenatal Record',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-pn-btn">Save</button>',
    size: 'lg'
  });

  /* Live GTPAL preview */
  function updateGTPALPreview() {
    var g = parseInt(document.getElementById('pn-gravida').value) || 0;
    var t = parseInt(document.getElementById('pn-term').value) || 0;
    var p = parseInt(document.getElementById('pn-preterm').value) || 0;
    var a = parseInt(document.getElementById('pn-abortus').value) || 0;
    var l = parseInt(document.getElementById('pn-living').value) || 0;
    var el = document.getElementById('pn-gtpal-preview');
    if (el) el.textContent = 'G' + g + 'T' + t + 'P' + p + 'A' + a + 'L' + l;
  }
  ['pn-gravida','pn-term','pn-preterm','pn-abortus','pn-living'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', updateGTPALPreview);
  });
  updateGTPALPreview();

  // Auto-calculate EDD from LMP
  document.getElementById('pn-lmp').addEventListener('change', function() {
    var eddField = document.getElementById('pn-edd');
    if (!eddField.value && this.value) {
      var edd = calculateEDD(this.value);
      if (edd) eddField.value = edd.toISOString().slice(0, 10);
    }
  });

  document.getElementById('save-pn-btn').addEventListener('click', function() {
    var lmp = document.getElementById('pn-lmp').value;
    var edd = document.getElementById('pn-edd').value;
    if (!edd && lmp) {
      var calc = calculateEDD(lmp);
      if (calc) edd = calc.toISOString().slice(0, 10);
    }

    /* 6j: collect risk factors */
    var riskObj = {};
    var anyRisk = false;
    document.querySelectorAll('.pn-risk-factor').forEach(function(cb) {
      var k = cb.getAttribute('data-risk-key');
      if (cb.checked) { riskObj[k] = true; anyRisk = true; }
    });

    savePrenatalRecord({
      id: existing ? existing.id : undefined,
      patientId: patientId,
      lmp: lmp,
      edd: edd,
      eddSource: document.getElementById('pn-edd-source').value,
      gravida: parseInt(document.getElementById('pn-gravida').value) || 0,
      term: parseInt(document.getElementById('pn-term').value) || 0,
      preterm: parseInt(document.getElementById('pn-preterm').value) || 0,
      abortus: parseInt(document.getElementById('pn-abortus').value) || 0,
      living: parseInt(document.getElementById('pn-living').value) || 0,
      riskFactors: riskObj,
      highRisk: anyRisk,
      visits: existing ? existing.visits : [],
      labs: existing ? existing.labs : {}
    });
    closeModal();
    showToast('Prenatal record saved', 'success');
    renderOBGYN(patientId);
  });
}

/* 6b: expanded prenatal visit modal */
function openPrenatalVisitModal(patientId, record) {
  var bodyHTML =
    '<div class="form-row">' +
      '<div class="form-group"><label>Visit Date</label><input id="pv-date" type="date" class="form-control" value="' + new Date().toISOString().slice(0, 10) + '" /></div>' +
      '<div class="form-group"><label>EGA</label><input id="pv-ega" class="form-control" value="' + (record.lmp ? calculateEGA(record.lmp) : '') + '" /></div>' +
    '</div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Fundal Height (cm)</label><input id="pv-fundal" class="form-control" /></div>' +
      '<div class="form-group"><label>Fetal Heart Rate</label><input id="pv-fhr" class="form-control" /></div>' +
    '</div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Weight (lbs)</label><input id="pv-weight" class="form-control" /></div>' +
      '<div class="form-group"><label>Blood Pressure</label><input id="pv-bp" class="form-control" placeholder="120/80" /></div>' +
    '</div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Urine Protein</label><select id="pv-protein" class="form-control"><option>Negative</option><option>Trace</option><option>1+</option><option>2+</option><option>3+</option><option>4+</option></select></div>' +
      '<div class="form-group"><label>Glucose</label><select id="pv-glucose" class="form-control"><option>Negative</option><option>Trace</option><option>1+</option><option>2+</option><option>3+</option><option>4+</option></select></div>' +
    '</div>' +
    /* 6b: new fields */
    '<div class="form-row">' +
      '<div class="form-group"><label>Edema</label><select id="pv-edema" class="form-control"><option value="">None</option><option>0</option><option>1+</option><option>2+</option><option>3+</option><option>4+</option></select></div>' +
      '<div class="form-group"><label>Fetal Presentation</label><select id="pv-presentation" class="form-control"><option value="">Select</option><option>Cephalic</option><option>Breech</option><option>Transverse</option></select></div>' +
      '<div class="form-group"><label>Fetal Movement</label><select id="pv-fetal-movement" class="form-control"><option value="">Select</option><option>Adequate</option><option>Decreased</option><option>None</option></select></div>' +
    '</div>' +
    /* Preeclampsia symptoms */
    '<fieldset class="form-fieldset">' +
      '<legend>Preeclampsia Symptoms</legend>' +
      '<label style="display:inline-block;margin-right:12px;font-size:13px;"><input type="checkbox" id="pv-pe-headache" /> Headache</label>' +
      '<label style="display:inline-block;margin-right:12px;font-size:13px;"><input type="checkbox" id="pv-pe-visual" /> Visual changes</label>' +
      '<label style="display:inline-block;margin-right:12px;font-size:13px;"><input type="checkbox" id="pv-pe-ruq" /> RUQ pain</label>' +
      '<label style="display:inline-block;margin-right:12px;font-size:13px;"><input type="checkbox" id="pv-pe-epigastric" /> Epigastric pain</label>' +
      '<label style="display:inline-block;margin-right:12px;font-size:13px;"><input type="checkbox" id="pv-pe-sob" /> SOB</label>' +
    '</fieldset>' +
    /* Cervical exam */
    '<fieldset class="form-fieldset">' +
      '<legend>Cervical Exam</legend>' +
      '<div class="form-row">' +
        '<div class="form-group"><label>Dilation (cm)</label><input id="pv-cx-dilation" type="number" min="0" max="10" step="0.5" class="form-control" /></div>' +
        '<div class="form-group"><label>Effacement (%)</label><input id="pv-cx-effacement" type="number" min="0" max="100" class="form-control" /></div>' +
        '<div class="form-group"><label>Station (-5 to +5)</label><input id="pv-cx-station" type="number" min="-5" max="5" class="form-control" /></div>' +
      '</div>' +
    '</fieldset>';

  openModal({
    title: 'Add Prenatal Visit',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-pv-btn">Save</button>',
    size: 'lg'
  });

  document.getElementById('save-pv-btn').addEventListener('click', function() {
    var peSymptoms = [];
    if (document.getElementById('pv-pe-headache').checked) peSymptoms.push('Headache');
    if (document.getElementById('pv-pe-visual').checked) peSymptoms.push('Visual changes');
    if (document.getElementById('pv-pe-ruq').checked) peSymptoms.push('RUQ pain');
    if (document.getElementById('pv-pe-epigastric').checked) peSymptoms.push('Epigastric pain');
    if (document.getElementById('pv-pe-sob').checked) peSymptoms.push('SOB');

    var visits = record.visits || [];
    visits.push({
      date: document.getElementById('pv-date').value,
      ega: document.getElementById('pv-ega').value,
      fundalHeight: document.getElementById('pv-fundal').value,
      fhr: document.getElementById('pv-fhr').value,
      weight: document.getElementById('pv-weight').value,
      bp: document.getElementById('pv-bp').value,
      urineProtein: document.getElementById('pv-protein').value,
      glucose: document.getElementById('pv-glucose').value,
      edema: document.getElementById('pv-edema').value,
      fetalPresentation: document.getElementById('pv-presentation').value,
      fetalMovement: document.getElementById('pv-fetal-movement').value,
      preeclampsiaSymptoms: peSymptoms,
      cervicalDilation: document.getElementById('pv-cx-dilation').value,
      cervicalEffacement: document.getElementById('pv-cx-effacement').value,
      cervicalStation: document.getElementById('pv-cx-station').value
    });
    savePrenatalRecord({ id: record.id, visits: visits });
    closeModal();
    showToast('Prenatal visit added', 'success');
    renderOBGYN(patientId);
  });
}

/* ============================================================
   TAB: Prenatal Labs (6c: trimester groups + 6f: structured GBS)
   ============================================================ */
function buildPrenatalLabsTab(card, patient) {
  card.innerHTML = '<h3 style="margin-bottom:12px">Prenatal Labs Tracker</h3>';
  var records = getPrenatalRecords(patient.id);
  if (records.length === 0) {
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'Create a prenatal record first.' }));
    return;
  }

  var rec = records[records.length - 1]; // most recent pregnancy
  var labs = rec.labs || {};

  PRENATAL_LAB_GROUPS.forEach(function(group) {
    var groupDiv = document.createElement('div');
    groupDiv.style.marginBottom = '20px';
    groupDiv.innerHTML = '<h4 style="margin-bottom:8px;border-bottom:1px solid var(--border);padding-bottom:4px;">' + esc(group.heading) + '</h4>';

    var table = '<table class="data-table"><thead><tr><th>Test</th><th>Status</th><th>Result</th><th>Date</th><th>Action</th></tr></thead><tbody>';
    group.labs.forEach(function(lk) {
      var lab = labs[lk.key] || {};
      var status = lab.result ? 'Completed' : 'Pending';
      var statusClass = lab.result ? 'badge-success' : 'badge-warning';
      table += '<tr>' +
        '<td>' + esc(lk.label) + '</td>' +
        '<td><span class="badge ' + statusClass + '">' + status + '</span></td>' +
        '<td>' + esc(lab.result || '—') + '</td>' +
        '<td>' + esc(lab.date || '—') + '</td>' +
        '<td><button class="btn btn-xs btn-secondary" data-lab-key="' + lk.key + '">Record</button></td>' +
        '</tr>';
    });
    table += '</tbody></table>';

    var tableDiv = document.createElement('div');
    tableDiv.innerHTML = table;
    groupDiv.appendChild(tableDiv);

    // Bind record buttons within this group
    tableDiv.querySelectorAll('[data-lab-key]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var key = this.getAttribute('data-lab-key');
        var label = PRENATAL_LAB_KEYS.find(function(l) { return l.key === key; }).label;
        openPrenatalLabModal(patient.id, rec, key, label);
      });
    });

    card.appendChild(groupDiv);
  });
}

/* 6f: structured GBS select in lab modal */
function openPrenatalLabModal(patientId, record, labKey, labLabel) {
  var existing = (record.labs || {})[labKey] || {};

  /* 6f: GBS uses structured select */
  var resultField;
  if (labKey === 'gbs') {
    var gbsOpts = ['', 'Positive', 'Negative', 'Pending', 'Not Done'].map(function(opt) {
      return '<option value="' + opt + '"' + (existing.result === opt ? ' selected' : '') + '>' + (opt || 'Select') + '</option>';
    }).join('');
    resultField = '<div class="form-group"><label>Result</label><select id="pl-result" class="form-control">' + gbsOpts + '</select></div>';
  } else {
    resultField = '<div class="form-group"><label>Result</label><input id="pl-result" class="form-control" value="' + esc(existing.result || '') + '" /></div>';
  }

  var bodyHTML =
    resultField +
    '<div class="form-group"><label>Date</label><input id="pl-date" type="date" class="form-control" value="' + esc(existing.date || new Date().toISOString().slice(0, 10)) + '" /></div>' +
    '<div class="form-group"><label>Notes</label><textarea id="pl-notes" class="form-control" rows="2">' + esc(existing.notes || '') + '</textarea></div>';

  openModal({
    title: 'Record — ' + labLabel,
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-pl-btn">Save</button>'
  });

  document.getElementById('save-pl-btn').addEventListener('click', function() {
    var labs = record.labs || {};
    labs[labKey] = {
      result: document.getElementById('pl-result').value,
      date: document.getElementById('pl-date').value,
      notes: document.getElementById('pl-notes').value
    };
    savePrenatalRecord({ id: record.id, labs: labs });
    closeModal();
    showToast('Lab result recorded', 'success');
    renderOBGYN(patientId);
  });
}

/* ============================================================
   TAB: Visit Schedule
   ============================================================ */
function buildVisitScheduleTab(card, patient) {
  card.innerHTML = '<h3 style="margin-bottom:12px">Recommended Visit Schedule</h3>';
  var records = getPrenatalRecords(patient.id);

  if (records.length === 0) {
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'Create a prenatal record to see the visit schedule.' }));
    return;
  }

  var rec = records[records.length - 1];
  var lmp = rec.lmp;
  if (!lmp) {
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'LMP needed to calculate visit schedule.' }));
    return;
  }

  var lmpDate = new Date(lmp);
  var visits = rec.visits || [];
  var visitDates = visits.map(function(v) { return v.date; });

  var table = '<table class="data-table"><thead><tr><th>Gestational Week</th><th>Target Date</th><th>Status</th></tr></thead><tbody>';
  var allWeeks = [4,8,12,16,20,24,28,30,32,34,36,37,38,39,40];

  allWeeks.forEach(function(week) {
    var targetDate = new Date(lmpDate);
    targetDate.setDate(targetDate.getDate() + (week * 7));
    var targetStr = targetDate.toISOString().slice(0, 10);
    var completed = visitDates.some(function(d) {
      if (!d) return false;
      var vd = new Date(d);
      var diff = Math.abs(vd - targetDate) / (1000 * 60 * 60 * 24);
      return diff < 10; // within 10 days
    });
    var isPast = targetDate < new Date();
    var status = completed ? '<span class="badge badge-success">Completed</span>' :
                 isPast ? '<span class="badge badge-danger">Overdue</span>' :
                 '<span class="badge badge-muted">Upcoming</span>';
    table += '<tr><td>' + week + ' weeks</td><td>' + targetDate.toLocaleDateString() + '</td><td>' + status + '</td></tr>';
  });

  table += '</tbody></table>';
  var div = document.createElement('div');
  div.innerHTML = table;
  card.appendChild(div);

  // Frequency guide
  var guide = document.createElement('div');
  guide.style.cssText = 'margin-top:16px;padding:12px;background:var(--bg-base);border-radius:6px;';
  guide.innerHTML = '<strong>Recommended Frequency:</strong><ul style="margin:8px 0 0 16px;">' +
    VISIT_SCHEDULE.map(function(vs) { return '<li>Weeks ' + vs.weeks + ': ' + vs.frequency + '</li>'; }).join('') +
    '</ul>';
  card.appendChild(guide);
}

/* ============================================================
   TAB: Antenatal Surveillance (6k)
   ============================================================ */
function buildAntenatalSurveillanceTab(card, patient) {
  card.innerHTML = '<h3 style="margin-bottom:12px">Antenatal Surveillance</h3>';

  var addNstBtn = makeBtn('+ NST', 'btn btn-sm btn-primary', function() { openNSTModal(patient.id); });
  var addBppBtn = makeBtn('+ BPP', 'btn btn-sm btn-primary', function() { openBPPModal(patient.id); });
  addNstBtn.style.marginBottom = '12px';
  addNstBtn.style.marginRight = '8px';
  addBppBtn.style.marginBottom = '12px';
  card.appendChild(addNstBtn);
  card.appendChild(addBppBtn);

  var records = getAntenatalSurveillance(patient.id);
  if (records.length === 0) {
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'No antenatal surveillance records.' }));
    return;
  }

  records.sort(function(a, b) { return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt); });

  var table = '<table class="data-table"><thead><tr><th>Date</th><th>Type</th><th>Result/Score</th><th>Notes</th></tr></thead><tbody>';
  records.forEach(function(r) {
    var score = '';
    if (r.type === 'NST') {
      score = esc(r.result || '—') + (r.duration ? ' (' + r.duration + ' min)' : '');
    } else if (r.type === 'BPP') {
      score = (r.totalScore !== undefined ? r.totalScore + '/10' : '—');
    }
    table += '<tr>' +
      '<td>' + esc(r.date || '') + '</td>' +
      '<td>' + esc(r.type || '') + '</td>' +
      '<td>' + score + '</td>' +
      '<td>' + esc(r.notes || '') + '</td>' +
      '</tr>';
  });
  table += '</tbody></table>';
  var div = document.createElement('div');
  div.innerHTML = table;
  card.appendChild(div);
}

function openNSTModal(patientId) {
  var bodyHTML =
    '<div class="form-group"><label>Date</label><input id="nst-date" type="date" class="form-control" value="' + new Date().toISOString().slice(0, 10) + '" /></div>' +
    '<div class="form-group"><label>Result</label><select id="nst-result" class="form-control"><option>Reactive</option><option>Non-reactive</option></select></div>' +
    '<div class="form-group"><label>Duration (minutes)</label><input id="nst-duration" type="number" min="0" class="form-control" /></div>' +
    '<div class="form-group"><label>Notes</label><textarea id="nst-notes" class="form-control" rows="2"></textarea></div>';

  openModal({
    title: 'New NST Record',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-nst-btn">Save</button>'
  });

  document.getElementById('save-nst-btn').addEventListener('click', function() {
    saveAntenatalSurveillance({
      patientId: patientId,
      type: 'NST',
      date: document.getElementById('nst-date').value,
      result: document.getElementById('nst-result').value,
      duration: document.getElementById('nst-duration').value,
      notes: document.getElementById('nst-notes').value,
      provider: getSessionUser().id
    });
    closeModal();
    showToast('NST record saved', 'success');
    renderOBGYN(patientId);
  });
}

function openBPPModal(patientId) {
  var components = [
    { key: 'fetalBreathing', label: 'Fetal Breathing' },
    { key: 'fetalMovement', label: 'Fetal Movement' },
    { key: 'fetalTone', label: 'Fetal Tone' },
    { key: 'amnioticFluid', label: 'Amniotic Fluid' },
    { key: 'nst', label: 'NST' }
  ];

  var bodyHTML =
    '<div class="form-group"><label>Date</label><input id="bpp-date" type="date" class="form-control" value="' + new Date().toISOString().slice(0, 10) + '" /></div>' +
    '<fieldset class="form-fieldset">' +
      '<legend>BPP Components (score 0 or 2)</legend>' +
      components.map(function(c) {
        return '<div class="form-row" style="margin-bottom:6px;align-items:center;">' +
          '<label style="flex:1;font-size:13px;">' + esc(c.label) + '</label>' +
          '<select class="form-control bpp-component" id="bpp-' + c.key + '" data-comp="' + c.key + '" style="max-width:80px;">' +
            '<option value="0">0</option><option value="2">2</option>' +
          '</select>' +
        '</div>';
      }).join('') +
      '<div id="bpp-total" style="margin-top:8px;font-weight:600;font-size:14px;">Total: 0/10</div>' +
    '</fieldset>' +
    '<div class="form-group"><label>Notes</label><textarea id="bpp-notes" class="form-control" rows="2"></textarea></div>';

  openModal({
    title: 'New BPP Record',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-bpp-btn">Save</button>'
  });

  function updateBPPTotal() {
    var total = 0;
    document.querySelectorAll('.bpp-component').forEach(function(sel) { total += parseInt(sel.value) || 0; });
    var el = document.getElementById('bpp-total');
    if (el) el.textContent = 'Total: ' + total + '/10';
    return total;
  }
  updateBPPTotal();
  document.querySelectorAll('.bpp-component').forEach(function(sel) { sel.addEventListener('change', updateBPPTotal); });

  document.getElementById('save-bpp-btn').addEventListener('click', function() {
    var compScores = {};
    document.querySelectorAll('.bpp-component').forEach(function(sel) {
      compScores[sel.getAttribute('data-comp')] = parseInt(sel.value) || 0;
    });
    var total = updateBPPTotal();
    saveAntenatalSurveillance({
      patientId: patientId,
      type: 'BPP',
      date: document.getElementById('bpp-date').value,
      components: compScores,
      totalScore: total,
      notes: document.getElementById('bpp-notes').value,
      provider: getSessionUser().id
    });
    closeModal();
    showToast('BPP record saved', 'success');
    renderOBGYN(patientId);
  });
}

/* ============================================================
   TAB: Labor & Delivery (6f: GBS alert, 6g: labor flowsheet, 6h: APGAR expansion, 6l: C-section op note)
   ============================================================ */
function buildLaborDeliveryTab(card, patient) {
  card.innerHTML = '<h3 style="margin-bottom:12px">Labor & Delivery Summary</h3>';

  /* 6f: GBS positive alert banner */
  var prenatalRecs = getPrenatalRecords(patient.id);
  if (prenatalRecs.length > 0) {
    var latestPrenatal = prenatalRecs[prenatalRecs.length - 1];
    var gbsLab = (latestPrenatal.labs || {}).gbs || {};
    if (gbsLab.result === 'Positive') {
      var gbsBanner = document.createElement('div');
      gbsBanner.style.cssText = 'background:var(--danger);color:#fff;padding:12px 16px;border-radius:6px;margin-bottom:12px;font-weight:600;font-size:14px;';
      gbsBanner.textContent = 'GBS POSITIVE — Administer prophylactic antibiotics.';
      card.appendChild(gbsBanner);
    }
  }

  var deliveries = getLaborDeliveries(patient.id);
  var addBtn = makeBtn('+ New L&D Record', 'btn btn-sm btn-primary', function() { openLDModal(patient.id); });
  addBtn.style.marginBottom = '12px';
  card.appendChild(addBtn);

  if (deliveries.length === 0) {
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'No labor & delivery records.' }));
  } else {
    deliveries.forEach(function(d) {
      var ldCard = document.createElement('div');
      ldCard.className = 'specialty-record-card';

      /* 6h: show expanded APGAR */
      var apgar1Display = formatApgarDisplay(d.apgar1Components, d.apgar1);
      var apgar5Display = formatApgarDisplay(d.apgar5Components, d.apgar5);
      var apgar10Html = '';
      var apgar5Total = d.apgar5Components ? sumApgar(d.apgar5Components) : (parseInt(d.apgar5) || 0);
      if (apgar5Total < 7 && d.apgar10Components) {
        apgar10Html = '<div><strong>APGAR 10 min:</strong> ' + formatApgarDisplay(d.apgar10Components, d.apgar10) + '</div>';
      }

      /* 6l: C-section op note display */
      var csHtml = '';
      if (d.uterineIncision || d.tubalLigation || d.placentaDelivery) {
        csHtml = '<div style="margin-top:6px;padding:8px;background:var(--bg-base);border-radius:4px;">' +
          '<strong>C-Section Details:</strong><br/>' +
          '<span><strong>Uterine Incision:</strong> ' + esc(d.uterineIncision || '—') + '</span> | ' +
          '<span><strong>Tubal Ligation:</strong> ' + esc(d.tubalLigation || '—') + '</span> | ' +
          '<span><strong>Placenta Delivery:</strong> ' + esc(d.placentaDelivery || '—') + '</span>' +
        '</div>';
      }

      ldCard.innerHTML =
        '<div class="specialty-record-header"><strong>' + esc(d.deliveryType || 'Delivery') + '</strong><span class="badge badge-info">' + esc(d.deliveryDate || '—') + '</span></div>' +
        '<div class="specialty-record-body">' +
          '<div class="form-row">' +
            '<div><strong>Date/Time:</strong> ' + esc(d.deliveryDate || '') + ' ' + esc(d.deliveryTime || '') + '</div>' +
            '<div><strong>Birth Weight:</strong> ' + esc(d.birthWeight || '—') + '</div>' +
          '</div>' +
          '<div class="form-row" style="margin-top:6px">' +
            '<div><strong>APGAR 1 min:</strong> ' + apgar1Display + '</div>' +
            '<div><strong>APGAR 5 min:</strong> ' + apgar5Display + '</div>' +
          '</div>' +
          apgar10Html +
          csHtml +
          (d.complications ? '<p style="margin-top:6px"><strong>Complications:</strong> ' + esc(d.complications) + '</p>' : '') +
          (d.notes ? '<p style="margin-top:6px"><strong>Notes:</strong> ' + esc(d.notes) + '</p>' : '') +
        '</div>';
      var editBtn = makeBtn('Edit', 'btn btn-xs btn-secondary', function() { openLDModal(patient.id, d); });
      var footer = document.createElement('div');
      footer.className = 'specialty-record-footer';
      footer.appendChild(editBtn);
      ldCard.appendChild(footer);
      card.appendChild(ldCard);
    });
  }

  /* 6g: Labor flowsheet section */
  var flowsheetSection = document.createElement('div');
  flowsheetSection.style.marginTop = '24px';
  flowsheetSection.innerHTML = '<h3 style="margin-bottom:12px;border-top:1px solid var(--border);padding-top:16px;">Labor Flowsheet</h3>';
  var addFlowBtn = makeBtn('+ Add Flowsheet Entry', 'btn btn-sm btn-primary', function() { openLaborFlowsheetModal(patient.id); });
  addFlowBtn.style.marginBottom = '12px';
  flowsheetSection.appendChild(addFlowBtn);

  var flowsheets = getLaborFlowsheets(patient.id);
  if (flowsheets.length === 0) {
    flowsheetSection.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'No labor flowsheet entries.' }));
  } else {
    flowsheets.sort(function(a, b) { return new Date(a.time || a.createdAt) - new Date(b.time || b.createdAt); });
    var fTable = '<table class="data-table data-table-compact"><thead><tr>' +
      '<th>Time</th><th>Dilation</th><th>Effacement</th><th>Station</th><th>FHR Cat</th><th>FHR Base</th><th>Contractions</th><th>Membrane</th><th>Oxytocin</th><th>Epidural</th>' +
      '</tr></thead><tbody>';
    flowsheets.forEach(function(f) {
      var contrStr = f.contractionFreq ? ('q' + f.contractionFreq + 'min/' + (f.contractionDuration || '—') + 's/' + (f.contractionIntensity || '')) : '—';
      var membrStr = f.membraneStatus || '—';
      if (f.membraneStatus && f.membraneStatus !== 'Intact' && f.ruptureTime) {
        membrStr += ' @ ' + esc(f.ruptureTime);
      }
      if (f.fluidColor) membrStr += ' (' + esc(f.fluidColor) + ')';

      fTable += '<tr>' +
        '<td>' + esc(f.time || '') + '</td>' +
        '<td>' + esc(f.dilation !== undefined && f.dilation !== '' ? f.dilation + ' cm' : '—') + '</td>' +
        '<td>' + esc(f.effacement !== undefined && f.effacement !== '' ? f.effacement + '%' : '—') + '</td>' +
        '<td>' + esc(f.station !== undefined && f.station !== '' ? String(f.station) : '—') + '</td>' +
        '<td>' + esc(f.fhrCategory || '—') + '</td>' +
        '<td>' + esc(f.fhrBaseline || '—') + '</td>' +
        '<td>' + contrStr + '</td>' +
        '<td>' + membrStr + '</td>' +
        '<td>' + esc(f.oxytocinRate !== undefined && f.oxytocinRate !== '' ? f.oxytocinRate + ' mU/min' : '—') + '</td>' +
        '<td>' + esc(f.epiduralStatus || '—') + '</td>' +
        '</tr>';
    });
    fTable += '</tbody></table>';
    var fDiv = document.createElement('div');
    fDiv.style.overflowX = 'auto';
    fDiv.innerHTML = fTable;
    flowsheetSection.appendChild(fDiv);
  }

  card.appendChild(flowsheetSection);
}

/* 6h: APGAR helpers */
function sumApgar(components) {
  if (!components) return 0;
  return (parseInt(components.appearance) || 0) +
    (parseInt(components.pulse) || 0) +
    (parseInt(components.grimace) || 0) +
    (parseInt(components.activity) || 0) +
    (parseInt(components.respiration) || 0);
}

function formatApgarDisplay(components, fallbackTotal) {
  if (!components) return esc(String(fallbackTotal || '—'));
  var total = sumApgar(components);
  return esc(total + '') + ' (A:' + (components.appearance || 0) + ' P:' + (components.pulse || 0) + ' G:' + (components.grimace || 0) + ' A:' + (components.activity || 0) + ' R:' + (components.respiration || 0) + ')';
}

function buildApgarFieldset(prefix, label, existing) {
  var c = existing || {};
  var fields = [
    { key: 'appearance', label: 'Appearance' },
    { key: 'pulse', label: 'Pulse' },
    { key: 'grimace', label: 'Grimace' },
    { key: 'activity', label: 'Activity' },
    { key: 'respiration', label: 'Respiration' }
  ];
  var html = '<fieldset class="form-fieldset">' +
    '<legend>' + esc(label) + '</legend>' +
    '<div class="form-row">';
  fields.forEach(function(f) {
    html += '<div class="form-group">' +
      '<label>' + f.label + '</label>' +
      '<select id="' + prefix + '-' + f.key + '" class="form-control ' + prefix + '-apgar-field">' +
        '<option value="0"' + (parseInt(c[f.key]) === 0 ? ' selected' : '') + '>0</option>' +
        '<option value="1"' + (parseInt(c[f.key]) === 1 ? ' selected' : '') + '>1</option>' +
        '<option value="2"' + (parseInt(c[f.key]) === 2 ? ' selected' : '') + '>2</option>' +
      '</select>' +
    '</div>';
  });
  html += '</div><div id="' + prefix + '-total" style="font-weight:600;margin-top:4px;"></div></fieldset>';
  return html;
}

function collectApgarComponents(prefix) {
  return {
    appearance: parseInt(document.getElementById(prefix + '-appearance').value) || 0,
    pulse: parseInt(document.getElementById(prefix + '-pulse').value) || 0,
    grimace: parseInt(document.getElementById(prefix + '-grimace').value) || 0,
    activity: parseInt(document.getElementById(prefix + '-activity').value) || 0,
    respiration: parseInt(document.getElementById(prefix + '-respiration').value) || 0
  };
}

function wireApgarAutoSum(prefix) {
  var fields = document.querySelectorAll('.' + prefix + '-apgar-field');
  function update() {
    var total = 0;
    fields.forEach(function(sel) { total += parseInt(sel.value) || 0; });
    var el = document.getElementById(prefix + '-total');
    if (el) el.textContent = 'Total: ' + total + '/10';
    return total;
  }
  fields.forEach(function(sel) { sel.addEventListener('change', update); });
  update();
  return update;
}

/* 6h + 6l: L&D modal */
function openLDModal(patientId, existing) {
  var d = existing || {};
  var bodyHTML =
    '<div class="form-row">' +
      '<div class="form-group"><label>Delivery Date</label><input id="ld-date" type="date" class="form-control" value="' + esc(d.deliveryDate || '') + '" /></div>' +
      '<div class="form-group"><label>Delivery Time</label><input id="ld-time" type="time" class="form-control" value="' + esc(d.deliveryTime || '') + '" /></div>' +
    '</div>' +
    '<div class="form-group"><label>Delivery Type</label><select id="ld-type" class="form-control">' +
      DELIVERY_TYPES.map(function(t) { return '<option' + (d.deliveryType === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') +
    '</select></div>' +
    /* 6h: APGAR component fields */
    buildApgarFieldset('apgar1', 'APGAR — 1 Minute', d.apgar1Components) +
    buildApgarFieldset('apgar5', 'APGAR — 5 Minute', d.apgar5Components) +
    '<div id="apgar10-container">' +
      (d.apgar10Components ? buildApgarFieldset('apgar10', 'APGAR — 10 Minute', d.apgar10Components) : '') +
    '</div>' +
    '<div class="form-group"><label>Birth Weight</label><input id="ld-weight" class="form-control" placeholder="e.g., 7 lbs 8 oz" value="' + esc(d.birthWeight || '') + '" /></div>' +
    '<div class="form-group"><label>Complications</label><textarea id="ld-complications" class="form-control" rows="2">' + esc(d.complications || '') + '</textarea></div>' +
    '<div class="form-group"><label>Notes</label><textarea id="ld-notes" class="form-control" rows="2">' + esc(d.notes || '') + '</textarea></div>' +
    /* 6l: C-section fields container */
    '<div id="ld-csection-fields"></div>';

  openModal({
    title: (existing ? 'Edit' : 'New') + ' Labor & Delivery Record',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-ld-btn">Save</button>',
    size: 'lg'
  });

  wireApgarAutoSum('apgar1');
  var apgar5Update = wireApgarAutoSum('apgar5');

  /* 6h: Show 10-min APGAR if 5-min < 7 */
  function check10MinApgar() {
    var total5 = 0;
    document.querySelectorAll('.apgar5-apgar-field').forEach(function(sel) { total5 += parseInt(sel.value) || 0; });
    var container = document.getElementById('apgar10-container');
    if (total5 < 7) {
      if (!document.getElementById('apgar10-appearance')) {
        container.innerHTML = buildApgarFieldset('apgar10', 'APGAR — 10 Minute (5-min < 7)', d.apgar10Components);
        wireApgarAutoSum('apgar10');
      }
    } else {
      container.innerHTML = '';
    }
  }
  document.querySelectorAll('.apgar5-apgar-field').forEach(function(sel) { sel.addEventListener('change', check10MinApgar); });
  check10MinApgar();

  /* 6l: C-section fields based on delivery type */
  function updateCSectionFields() {
    var deliveryType = document.getElementById('ld-type').value;
    var isCSection = /cesarean|c-section/i.test(deliveryType);
    var container = document.getElementById('ld-csection-fields');
    if (isCSection) {
      container.innerHTML =
        '<fieldset class="form-fieldset" style="border-width:2px;background:var(--bg-base);">' +
          '<legend>C-Section Details (Required)</legend>' +
          '<div class="form-group"><label>Uterine Incision Type</label><select id="ld-uterine-incision" class="form-control">' +
            ['Low Transverse', 'Classical', 'Low Vertical'].map(function(t) {
              return '<option' + (d.uterineIncision === t ? ' selected' : '') + '>' + t + '</option>';
            }).join('') +
          '</select></div>' +
          '<div class="form-group"><label>Tubal Ligation</label><select id="ld-tubal" class="form-control">' +
            ['No', 'Yes'].map(function(t) { return '<option' + (d.tubalLigation === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') +
          '</select></div>' +
          '<div class="form-group"><label>Placenta Delivery Method</label><select id="ld-placenta" class="form-control">' +
            ['Spontaneous', 'Manual'].map(function(t) { return '<option' + (d.placentaDelivery === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') +
          '</select></div>' +
        '</fieldset>';
    } else {
      container.innerHTML = '';
    }
  }
  document.getElementById('ld-type').addEventListener('change', updateCSectionFields);
  updateCSectionFields();

  document.getElementById('save-ld-btn').addEventListener('click', function() {
    var deliveryType = document.getElementById('ld-type').value;
    var isCSection = /cesarean|c-section/i.test(deliveryType);

    var apgar1Comp = collectApgarComponents('apgar1');
    var apgar5Comp = collectApgarComponents('apgar5');
    var apgar10Comp = document.getElementById('apgar10-appearance') ? collectApgarComponents('apgar10') : null;

    /* 6l: Validate C-section fields */
    if (isCSection) {
      var uInc = document.getElementById('ld-uterine-incision');
      if (uInc && !uInc.value) {
        showToast('Uterine incision type is required for C-section', 'error');
        return;
      }
    }

    var saveData = {
      id: existing ? existing.id : undefined,
      patientId: patientId,
      deliveryDate: document.getElementById('ld-date').value,
      deliveryTime: document.getElementById('ld-time').value,
      deliveryType: deliveryType,
      apgar1: sumApgar(apgar1Comp),
      apgar1Components: apgar1Comp,
      apgar5: sumApgar(apgar5Comp),
      apgar5Components: apgar5Comp,
      birthWeight: document.getElementById('ld-weight').value,
      complications: document.getElementById('ld-complications').value,
      notes: document.getElementById('ld-notes').value
    };

    if (apgar10Comp) {
      saveData.apgar10 = sumApgar(apgar10Comp);
      saveData.apgar10Components = apgar10Comp;
    }

    if (isCSection) {
      saveData.uterineIncision = document.getElementById('ld-uterine-incision').value;
      saveData.tubalLigation = document.getElementById('ld-tubal').value;
      saveData.placentaDelivery = document.getElementById('ld-placenta').value;
    }

    saveLaborDelivery(saveData);
    closeModal();
    showToast('L&D record saved', 'success');
    renderOBGYN(patientId);
  });
}

/* 6g: Labor flowsheet entry modal */
function openLaborFlowsheetModal(patientId) {
  var bodyHTML =
    '<div class="form-group"><label>Time</label><input id="lf-time" type="datetime-local" class="form-control" /></div>' +
    /* Cervical exam */
    '<fieldset class="form-fieldset">' +
      '<legend>Cervical Exam</legend>' +
      '<div class="form-row">' +
        '<div class="form-group"><label>Dilation (cm)</label><input id="lf-dilation" type="number" min="0" max="10" step="0.5" class="form-control" /></div>' +
        '<div class="form-group"><label>Effacement (%)</label><input id="lf-effacement" type="number" min="0" max="100" class="form-control" /></div>' +
        '<div class="form-group"><label>Station (-5 to +5)</label><input id="lf-station" type="number" min="-5" max="5" class="form-control" /></div>' +
      '</div>' +
      '<div class="form-group"><label>Examiner</label><input id="lf-examiner" class="form-control" /></div>' +
    '</fieldset>' +
    /* FHR */
    '<fieldset class="form-fieldset">' +
      '<legend>Fetal Heart Rate</legend>' +
      '<div class="form-row">' +
        '<div class="form-group"><label>Category</label><select id="lf-fhr-cat" class="form-control"><option value="">Select</option><option>I</option><option>II</option><option>III</option></select></div>' +
        '<div class="form-group"><label>Baseline (bpm)</label><input id="lf-fhr-base" type="number" class="form-control" /></div>' +
      '</div>' +
      '<div class="form-row">' +
        '<div class="form-group"><label>Variability</label><select id="lf-fhr-var" class="form-control"><option value="">Select</option><option>Absent</option><option>Minimal</option><option>Moderate</option><option>Marked</option></select></div>' +
        '<div class="form-group"><label>Accelerations</label><select id="lf-fhr-accel" class="form-control"><option value="">Select</option><option>Y</option><option>N</option></select></div>' +
        '<div class="form-group"><label>Decelerations</label><select id="lf-fhr-decel" class="form-control"><option value="">Select</option><option>None</option><option>Early</option><option>Variable</option><option>Late</option></select></div>' +
      '</div>' +
    '</fieldset>' +
    /* Contractions */
    '<fieldset class="form-fieldset">' +
      '<legend>Contractions</legend>' +
      '<div class="form-row">' +
        '<div class="form-group"><label>Frequency (every X min)</label><input id="lf-ctx-freq" type="number" min="0" class="form-control" /></div>' +
        '<div class="form-group"><label>Duration (seconds)</label><input id="lf-ctx-dur" type="number" min="0" class="form-control" /></div>' +
        '<div class="form-group"><label>Intensity</label><select id="lf-ctx-int" class="form-control"><option value="">Select</option><option>Mild</option><option>Moderate</option><option>Strong</option></select></div>' +
      '</div>' +
    '</fieldset>' +
    /* Membrane status */
    '<fieldset class="form-fieldset">' +
      '<legend>Membrane Status</legend>' +
      '<div class="form-row">' +
        '<div class="form-group"><label>Status</label><select id="lf-membrane" class="form-control"><option>Intact</option><option>SROM</option><option>AROM</option></select></div>' +
        '<div class="form-group"><label>Rupture Time</label><input id="lf-rupture-time" type="datetime-local" class="form-control" /></div>' +
        '<div class="form-group"><label>Fluid Color</label><select id="lf-fluid-color" class="form-control"><option value="">Select</option><option>Clear</option><option>Meconium-stained</option><option>Bloody</option></select></div>' +
      '</div>' +
    '</fieldset>' +
    /* Interventions */
    '<div class="form-row">' +
      '<div class="form-group"><label>Oxytocin Rate (mU/min)</label><input id="lf-oxytocin" type="number" min="0" step="0.5" class="form-control" /></div>' +
      '<div class="form-group"><label>Epidural Status</label><select id="lf-epidural" class="form-control"><option>None</option><option>Requested</option><option>Placed</option><option>Running</option></select></div>' +
    '</div>';

  openModal({
    title: 'Labor Flowsheet Entry',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-lf-btn">Save</button>',
    size: 'lg'
  });

  document.getElementById('save-lf-btn').addEventListener('click', function() {
    saveLaborFlowsheet({
      patientId: patientId,
      time: document.getElementById('lf-time').value,
      dilation: document.getElementById('lf-dilation').value,
      effacement: document.getElementById('lf-effacement').value,
      station: document.getElementById('lf-station').value,
      examiner: document.getElementById('lf-examiner').value,
      fhrCategory: document.getElementById('lf-fhr-cat').value,
      fhrBaseline: document.getElementById('lf-fhr-base').value,
      fhrVariability: document.getElementById('lf-fhr-var').value,
      fhrAccelerations: document.getElementById('lf-fhr-accel').value,
      fhrDecelerations: document.getElementById('lf-fhr-decel').value,
      contractionFreq: document.getElementById('lf-ctx-freq').value,
      contractionDuration: document.getElementById('lf-ctx-dur').value,
      contractionIntensity: document.getElementById('lf-ctx-int').value,
      membraneStatus: document.getElementById('lf-membrane').value,
      ruptureTime: document.getElementById('lf-rupture-time').value,
      fluidColor: document.getElementById('lf-fluid-color').value,
      oxytocinRate: document.getElementById('lf-oxytocin').value,
      epiduralStatus: document.getElementById('lf-epidural').value,
      provider: getSessionUser().id
    });
    closeModal();
    showToast('Labor flowsheet entry saved', 'success');
    renderOBGYN(patientId);
  });
}

/* ============================================================
   TAB: Postpartum (6d: EPDS fix, 6e: Q10 alert, 6m: visit timing)
   ============================================================ */
function buildPostpartumTab(card, patient) {
  card.innerHTML = '<h3 style="margin-bottom:12px">Postpartum Assessment</h3>';
  var assessments = getPostpartumAssessments(patient.id);
  var addBtn = makeBtn('+ New Assessment', 'btn btn-sm btn-primary', function() { openPostpartumModal(patient.id); });
  addBtn.style.marginBottom = '12px';
  card.appendChild(addBtn);

  if (assessments.length === 0) {
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'No postpartum assessments.' }));
    return;
  }

  /* 6m: get delivery date for timing */
  var deliveries = getLaborDeliveries(patient.id);
  var latestDelivery = deliveries.length > 0 ? deliveries[deliveries.length - 1] : null;

  assessments.forEach(function(a) {
    var ppCard = document.createElement('div');
    ppCard.className = 'specialty-record-card';
    var edinburghSeverity = a.edinburghScore >= 13 ? 'badge-danger' : a.edinburghScore >= 10 ? 'badge-warning' : 'badge-success';

    /* 6m: postpartum timing */
    var timingHtml = '';
    if (latestDelivery && latestDelivery.deliveryDate && a.assessmentDate) {
      var delivDate = new Date(latestDelivery.deliveryDate);
      var assessDate = new Date(a.assessmentDate);
      var daysPP = Math.floor((assessDate - delivDate) / (1000 * 60 * 60 * 24));
      if (daysPP >= 0) {
        timingHtml = '<span class="badge badge-info" style="margin-left:8px;">' + daysPP + ' days postpartum</span>';
        /* ACOG visit windows: 3 weeks (21 days) and 12 weeks (84 days) */
        if (daysPP >= 18 && daysPP <= 24) {
          timingHtml += '<span class="badge badge-success" style="margin-left:4px;">3-week ACOG window</span>';
        }
        if (daysPP >= 77 && daysPP <= 91) {
          timingHtml += '<span class="badge badge-success" style="margin-left:4px;">12-week ACOG window</span>';
        }
      }
    }

    ppCard.innerHTML =
      '<div class="specialty-record-header"><strong>' + esc(a.assessmentDate || '') + '</strong>' + timingHtml + '<span class="badge ' + edinburghSeverity + '">Edinburgh: ' + a.edinburghScore + '/30</span></div>' +
      '<div class="specialty-record-body">' +
        '<p><strong>Recovery:</strong> ' + esc(a.recovery || '—') + '</p>' +
        '<p><strong>Breastfeeding:</strong> ' + esc(a.breastfeeding || '—') + '</p>' +
        '<p><strong>Mood:</strong> ' + esc(a.mood || '—') + '</p>' +
        (a.notes ? '<p><strong>Notes:</strong> ' + esc(a.notes) + '</p>' : '') +
      '</div>';
    card.appendChild(ppCard);
  });

  /* 6m: Show recommended PP visit windows */
  if (latestDelivery && latestDelivery.deliveryDate) {
    var delivDate = new Date(latestDelivery.deliveryDate);
    var now = new Date();
    var daysSinceDelivery = Math.floor((now - delivDate) / (1000 * 60 * 60 * 24));

    if (daysSinceDelivery >= 0) {
      var timingCard = document.createElement('div');
      timingCard.style.cssText = 'margin-top:16px;padding:12px;background:var(--bg-base);border-radius:6px;';
      var threeWeekDate = new Date(delivDate);
      threeWeekDate.setDate(threeWeekDate.getDate() + 21);
      var twelveWeekDate = new Date(delivDate);
      twelveWeekDate.setDate(twelveWeekDate.getDate() + 84);

      var threeWeekStatus = daysSinceDelivery < 21 ? 'Upcoming' : (daysSinceDelivery <= 24 ? 'NOW' : 'Past');
      var twelveWeekStatus = daysSinceDelivery < 77 ? 'Upcoming' : (daysSinceDelivery <= 91 ? 'NOW' : 'Past');
      var threeWeekClass = threeWeekStatus === 'NOW' ? 'badge-success' : threeWeekStatus === 'Past' ? 'badge-muted' : 'badge-info';
      var twelveWeekClass = twelveWeekStatus === 'NOW' ? 'badge-success' : twelveWeekStatus === 'Past' ? 'badge-muted' : 'badge-info';

      timingCard.innerHTML = '<strong>Postpartum Visit Timing</strong> (' + daysSinceDelivery + ' days postpartum)' +
        '<ul style="margin:8px 0 0 16px;">' +
          '<li>3-week visit (day 21): ' + threeWeekDate.toLocaleDateString() + ' <span class="badge ' + threeWeekClass + '">' + threeWeekStatus + '</span></li>' +
          '<li>12-week visit (day 84): ' + twelveWeekDate.toLocaleDateString() + ' <span class="badge ' + twelveWeekClass + '">' + twelveWeekStatus + '</span></li>' +
        '</ul>';
      card.appendChild(timingCard);
    }
  }
}

/* 6d + 6e: Postpartum modal with full EPDS scoring and Q10 alert */
function openPostpartumModal(patientId, existing) {
  var a = existing || {};

  /* 6m: delivery date linking */
  var deliveries = getLaborDeliveries(patientId);
  var latestDelivery = deliveries.length > 0 ? deliveries[deliveries.length - 1] : null;
  var ppTimingHtml = '';
  if (latestDelivery && latestDelivery.deliveryDate) {
    var delivDate = new Date(latestDelivery.deliveryDate);
    var now = new Date();
    var daysPP = Math.floor((now - delivDate) / (1000 * 60 * 60 * 24));
    if (daysPP >= 0) {
      ppTimingHtml = '<div style="margin-bottom:12px;padding:8px;background:var(--bg-base);border-radius:4px;font-weight:600;">' +
        daysPP + ' days postpartum (delivered ' + delivDate.toLocaleDateString() + ')' +
      '</div>';
    }
  }

  var bodyHTML =
    ppTimingHtml +
    '<div class="form-group"><label>Assessment Date</label><input id="pp-date" type="date" class="form-control" value="' + esc(a.assessmentDate || new Date().toISOString().slice(0, 10)) + '" /></div>' +
    '<div class="form-group"><label>Recovery Status</label><select id="pp-recovery" class="form-control">' +
      ['Normal', 'Healing well', 'Complications present', 'Follow-up needed'].map(function(s) {
        return '<option' + (a.recovery === s ? ' selected' : '') + '>' + s + '</option>';
      }).join('') +
    '</select></div>' +
    '<div class="form-group"><label>Breastfeeding</label><select id="pp-bf" class="form-control">' +
      ['Exclusive breastfeeding', 'Supplementing with formula', 'Formula only', 'Pumping', 'Not applicable'].map(function(s) {
        return '<option' + (a.breastfeeding === s ? ' selected' : '') + '>' + s + '</option>';
      }).join('') +
    '</select></div>' +
    '<div class="form-group"><label>Mood</label><input id="pp-mood" class="form-control" value="' + esc(a.mood || '') + '" placeholder="e.g., euthymic, anxious..." /></div>' +
    '<fieldset class="form-fieldset">' +
      '<legend>Edinburgh Postnatal Depression Scale</legend>' +
      '<div id="edinburgh-questions"></div>' +
      '<div id="edinburgh-score" style="margin-top:8px;font-weight:600;"></div>' +
    '</fieldset>' +
    '<div class="form-group"><label>Notes</label><textarea id="pp-notes" class="form-control" rows="3">' + esc(a.notes || '') + '</textarea></div>';

  openModal({
    title: (existing ? 'Edit' : 'New') + ' Postpartum Assessment',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-pp-btn">Save</button>',
    size: 'lg'
  });

  // 6d: Build Edinburgh questions with proper labels and reverse scoring
  var qContainer = document.getElementById('edinburgh-questions');
  var responses = a.edinburghResponses || [];
  EDINBURGH_QUESTIONS.forEach(function(q, i) {
    var div = document.createElement('div');
    div.style.cssText = 'margin-bottom:10px;';
    var optionsHtml = '';
    q.answers.forEach(function(ans, score) {
      /* 6d: For Q1 and Q2 (reverse=true), the score mapping is still 0,1,2,3 in display order.
         The official EPDS scores Q1 and Q2 with the first option = 0, last option = 3,
         same as all other questions. "Reverse" means the POSITIVE answer scores 0, which is
         already how they're structured. All questions use 0-3 in order. */
      var selected = (responses[i] === score) ? ' selected' : '';
      optionsHtml += '<option value="' + score + '"' + selected + '>' + score + ' — ' + esc(ans) + '</option>';
    });

    div.innerHTML =
      '<label style="font-size:12px;display:block;margin-bottom:2px;">' + (i + 1) + '. ' + esc(q.text) + '</label>' +
      '<select class="form-control edinburgh-q" data-qi="' + i + '"' +
        (i === 9 ? ' id="epds-q10"' : '') + '>' +
        optionsHtml +
      '</select>';
    qContainer.appendChild(div);
  });

  function updateEdinburghScore() {
    var total = 0;
    document.querySelectorAll('.edinburgh-q').forEach(function(sel) { total += parseInt(sel.value) || 0; });
    var severity = total >= 13 ? 'Possible depression — refer for evaluation' : total >= 10 ? 'Possible depression — monitor closely' : 'Low risk';
    document.getElementById('edinburgh-score').textContent = 'Score: ' + total + '/30 — ' + severity;
    return total;
  }
  updateEdinburghScore();
  qContainer.addEventListener('change', updateEdinburghScore);

  document.getElementById('save-pp-btn').addEventListener('click', function() {
    var resp = [];
    document.querySelectorAll('.edinburgh-q').forEach(function(sel) { resp.push(parseInt(sel.value) || 0); });
    var score = resp.reduce(function(a, b) { return a + b; }, 0);

    /* 6e: Q10 self-harm alert */
    var q10Value = resp[9] || 0;
    if (q10Value > 0) {
      showSelfHarmAlert(patientId, q10Value, function() {
        // Save after acknowledgment
        doSavePostpartum(patientId, existing, resp, score);
      });
    } else {
      doSavePostpartum(patientId, existing, resp, score);
    }
  });
}

function doSavePostpartum(patientId, existing, resp, score) {
  savePostpartumAssessment({
    id: existing ? existing.id : undefined,
    patientId: patientId,
    assessmentDate: document.getElementById('pp-date').value,
    recovery: document.getElementById('pp-recovery').value,
    breastfeeding: document.getElementById('pp-bf').value,
    mood: document.getElementById('pp-mood').value,
    edinburghScore: score,
    edinburghResponses: resp,
    notes: document.getElementById('pp-notes').value
  });
  closeModal();
  showToast('Postpartum assessment saved', 'success');
  renderOBGYN(patientId);
}

/* 6e: Self-harm hard alert modal */
function showSelfHarmAlert(patientId, q10Score, onAcknowledge) {
  var user = getSessionUser();

  /* Log audit immediately */
  logAudit('EPDS_SELF_HARM_ENDORSED', 'postpartum', '', patientId, 'Q10 score: ' + q10Score);

  var alertBody =
    '<div style="text-align:center;">' +
      '<div style="font-size:48px;margin-bottom:12px;">&#9888;</div>' +
      '<p style="font-size:16px;font-weight:600;color:var(--danger);margin-bottom:16px;">Patient endorsed self-harm thoughts — initiate safety assessment.</p>' +
      '<p style="font-size:14px;color:var(--text-secondary);">EPDS Q10 score: ' + q10Score + '/3</p>' +
    '</div>';

  var alertFooter =
    '<div style="display:flex;gap:8px;justify-content:center;">' +
      '<button class="btn btn-danger" id="selfharm-ack-btn">I Acknowledge</button>' +
      '<button class="btn btn-warning" id="selfharm-consult-btn" style="color:#fff;">Order Psychiatry/SW Consult</button>' +
    '</div>';

  openModal({
    title: 'SAFETY ALERT — Self-Harm Endorsed',
    bodyHTML: alertBody,
    footerHTML: alertFooter
  });

  /* Style the modal header red */
  setTimeout(function() {
    var headers = document.querySelectorAll('.modal-header');
    if (headers.length > 0) {
      var lastHeader = headers[headers.length - 1];
      lastHeader.style.background = 'var(--danger)';
      lastHeader.style.color = '#fff';
    }
  }, 50);

  document.getElementById('selfharm-consult-btn').addEventListener('click', function() {
    /* Find an active encounter for this patient */
    var encounters = typeof getEncounters === 'function' ? getEncounters(patientId) : [];
    var activeEnc = encounters.length > 0 ? encounters[encounters.length - 1] : null;
    var encId = activeEnc ? activeEnc.id : 'pp-' + patientId;

    saveOrder({
      encounterId: encId,
      patientId: patientId,
      type: 'Consult',
      priority: 'STAT',
      status: 'Ordered',
      detail: { service: 'Psychiatry/Social Work', reason: 'EPDS Q10 positive — self-harm thoughts endorsed' },
      provider: user.id
    });
    logAudit('EPDS_PSYCH_CONSULT_ORDERED', 'order', '', patientId, 'Auto-ordered from EPDS Q10 alert');
    showToast('Psychiatry/SW consult ordered', 'success');
    this.disabled = true;
    this.textContent = 'Consult Ordered';
  });

  document.getElementById('selfharm-ack-btn').addEventListener('click', function() {
    logAudit('EPDS_SELF_HARM_ACKNOWLEDGED', 'postpartum', '', patientId, 'Provider acknowledged self-harm alert');
    closeModal();
    if (typeof onAcknowledge === 'function') onAcknowledge();
  });
}

/* ============================================================
   TAB: GYN (6i: Structured fields)
   ============================================================ */
function buildGynTab(card, patient) {
  card.innerHTML = '<h3 style="margin-bottom:12px">Gynecology</h3>';

  var gynTypes = [
    { key: 'papHpv', label: 'Pap/HPV' },
    { key: 'colposcopy', label: 'Colposcopy' },
    { key: 'contraceptive', label: 'Contraceptive Management' },
    { key: 'menstrual', label: 'Menstrual History' }
  ];

  gynTypes.forEach(function(gt) {
    var section = document.createElement('div');
    section.style.marginBottom = '16px';
    var header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;';
    header.innerHTML = '<h4>' + esc(gt.label) + '</h4>';
    var addBtn = makeBtn('+ Add', 'btn btn-xs btn-primary', function() { openGynModal(patient.id, gt.key, gt.label); });
    header.appendChild(addBtn);
    section.appendChild(header);

    var records = getGynRecords(patient.id).filter(function(r) { return r.type === gt.key; });
    if (records.length === 0) {
      section.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'No records.' }));
    } else {
      records.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
      records.forEach(function(r) {
        var item = document.createElement('div');
        item.className = 'specialty-record-card';

        var bodyHtml = '';
        if (gt.key === 'papHpv') {
          bodyHtml = '<p><strong>Bethesda:</strong> ' + esc(r.bethesdaResult || '—') + '</p>' +
            '<p><strong>HPV:</strong> ' + esc(r.hpvStatus || '—') + '</p>' +
            (r.followUpPlan ? '<p><strong>Follow-up:</strong> ' + esc(r.followUpPlan) + '</p>' : '');
        } else if (gt.key === 'colposcopy') {
          bodyHtml = '<p><strong>Indication:</strong> ' + esc(r.indication || '—') + '</p>' +
            '<p><strong>TZ Type:</strong> ' + esc(r.tzType || '—') + '</p>' +
            '<p><strong>Findings:</strong> ' + esc(r.findings || '—') + '</p>' +
            '<p><strong>Biopsy:</strong> ' + esc(r.biopsyTaken || '—') + '</p>' +
            (r.pathologyResult ? '<p><strong>Pathology:</strong> ' + esc(r.pathologyResult) + '</p>' : '');
        } else if (gt.key === 'contraceptive') {
          bodyHtml = '<p><strong>Method:</strong> ' + esc(r.method || '—') + '</p>' +
            (r.placementDate ? '<p><strong>Placed:</strong> ' + esc(r.placementDate) + '</p>' : '') +
            (r.expirationDate ? '<p><strong>Expires:</strong> ' + esc(r.expirationDate) + '</p>' : '') +
            '<p><strong>Counseling:</strong> ' + (r.counselingDone ? 'Yes' : 'No') + '</p>';
        } else if (gt.key === 'menstrual') {
          bodyHtml = '<p><strong>LMP:</strong> ' + esc(r.lmpDate || '—') + '</p>' +
            '<p><strong>Cycle:</strong> ' + esc(r.cycleLength ? r.cycleLength + ' days' : '—') + ' | <strong>Duration:</strong> ' + esc(r.flowDuration ? r.flowDuration + ' days' : '—') + '</p>' +
            '<p><strong>Flow:</strong> ' + esc(r.flowAmount || '—') + ' | <strong>Regularity:</strong> ' + esc(r.regularity || '—') + '</p>' +
            '<p><strong>Dysmenorrhea:</strong> ' + esc(r.dysmenorrhea || '—') + '</p>';
        } else {
          bodyHtml = '<p>' + esc(r.details || '') + '</p>';
        }

        item.innerHTML =
          '<div class="specialty-record-header"><span>' + esc(r.date || '') + '</span><span class="badge badge-info">' + esc(r.result || r.bethesdaResult || r.method || '') + '</span></div>' +
          '<div class="specialty-record-body">' + bodyHtml +
            (r.notes ? '<p class="text-muted">' + esc(r.notes) + '</p>' : '') +
          '</div>';
        section.appendChild(item);
      });
    }
    card.appendChild(section);
  });
}

/* 6i: Structured GYN modal */
function openGynModal(patientId, type, label) {
  var bodyHTML = '';

  if (type === 'papHpv') {
    bodyHTML =
      '<div class="form-group"><label>Date</label><input id="gyn-date" type="date" class="form-control" value="' + new Date().toISOString().slice(0, 10) + '" /></div>' +
      '<div class="form-group"><label>Bethesda Result</label><select id="gyn-bethesda" class="form-control">' +
        ['', 'NILM', 'ASCUS', 'LSIL', 'HSIL', 'ASC-H', 'AGC'].map(function(v) {
          return '<option value="' + v + '">' + (v || 'Select') + '</option>';
        }).join('') +
      '</select></div>' +
      '<div class="form-group"><label>HPV Status</label><select id="gyn-hpv" class="form-control">' +
        ['', 'Positive', 'Negative', 'Not Tested'].map(function(v) {
          return '<option value="' + v + '">' + (v || 'Select') + '</option>';
        }).join('') +
      '</select></div>' +
      '<div class="form-group"><label>Follow-up Plan</label><textarea id="gyn-followup" class="form-control" rows="2"></textarea></div>' +
      '<div class="form-group"><label>Notes</label><textarea id="gyn-notes" class="form-control" rows="2"></textarea></div>';

  } else if (type === 'colposcopy') {
    bodyHTML =
      '<div class="form-group"><label>Date</label><input id="gyn-date" type="date" class="form-control" value="' + new Date().toISOString().slice(0, 10) + '" /></div>' +
      '<div class="form-group"><label>Indication</label><input id="gyn-indication" class="form-control" /></div>' +
      '<div class="form-group"><label>TZ Type</label><select id="gyn-tz" class="form-control">' +
        ['', '1', '2', '3'].map(function(v) {
          return '<option value="' + v + '">' + (v || 'Select') + '</option>';
        }).join('') +
      '</select></div>' +
      '<div class="form-group"><label>Findings</label><textarea id="gyn-findings" class="form-control" rows="2"></textarea></div>' +
      '<div class="form-group"><label>Biopsy Taken</label><select id="gyn-biopsy" class="form-control"><option value="">Select</option><option>Yes</option><option>No</option></select></div>' +
      '<div class="form-group"><label>Pathology Result</label><textarea id="gyn-pathology" class="form-control" rows="2"></textarea></div>' +
      '<div class="form-group"><label>Notes</label><textarea id="gyn-notes" class="form-control" rows="2"></textarea></div>';

  } else if (type === 'contraceptive') {
    bodyHTML =
      '<div class="form-group"><label>Date</label><input id="gyn-date" type="date" class="form-control" value="' + new Date().toISOString().slice(0, 10) + '" /></div>' +
      '<div class="form-group"><label>Method</label><select id="gyn-method" class="form-control">' +
        ['', 'OCP', 'Patch', 'Ring', 'Depo-Provera', 'IUD-Copper', 'IUD-Hormonal', 'Implant', 'Barrier', 'Sterilization', 'None'].map(function(v) {
          return '<option value="' + v + '">' + (v || 'Select') + '</option>';
        }).join('') +
      '</select></div>' +
      '<div class="form-group"><label>Placement Date</label><input id="gyn-placement" type="date" class="form-control" /></div>' +
      '<div class="form-group"><label>Expiration Date</label><input id="gyn-expiration" type="date" class="form-control" /></div>' +
      '<label style="display:block;margin:8px 0;font-size:13px;"><input type="checkbox" id="gyn-counseling" /> Contraceptive counseling completed</label>' +
      '<div class="form-group"><label>Notes</label><textarea id="gyn-notes" class="form-control" rows="2"></textarea></div>';

  } else if (type === 'menstrual') {
    bodyHTML =
      '<div class="form-group"><label>Date (record date)</label><input id="gyn-date" type="date" class="form-control" value="' + new Date().toISOString().slice(0, 10) + '" /></div>' +
      '<div class="form-group"><label>LMP</label><input id="gyn-lmp" type="date" class="form-control" /></div>' +
      '<div class="form-row">' +
        '<div class="form-group"><label>Cycle Length (days)</label><input id="gyn-cycle-length" type="number" min="1" class="form-control" /></div>' +
        '<div class="form-group"><label>Duration (days)</label><input id="gyn-flow-duration" type="number" min="1" class="form-control" /></div>' +
      '</div>' +
      '<div class="form-row">' +
        '<div class="form-group"><label>Flow</label><select id="gyn-flow" class="form-control"><option value="">Select</option><option>Light</option><option>Moderate</option><option>Heavy</option></select></div>' +
        '<div class="form-group"><label>Regularity</label><select id="gyn-regularity" class="form-control"><option value="">Select</option><option>Regular</option><option>Irregular</option></select></div>' +
      '</div>' +
      '<div class="form-group"><label>Dysmenorrhea</label><select id="gyn-dysmenorrhea" class="form-control"><option value="">Select</option><option>None</option><option>Mild</option><option>Moderate</option><option>Severe</option></select></div>' +
      '<div class="form-group"><label>Notes</label><textarea id="gyn-notes" class="form-control" rows="2"></textarea></div>';

  } else {
    /* Fallback for any unknown type */
    bodyHTML =
      '<div class="form-group"><label>Date</label><input id="gyn-date" type="date" class="form-control" value="' + new Date().toISOString().slice(0, 10) + '" /></div>' +
      '<div class="form-group"><label>Details</label><textarea id="gyn-details" class="form-control" rows="3" placeholder="Enter details..."></textarea></div>' +
      '<div class="form-group"><label>Result</label><input id="gyn-result" class="form-control" placeholder="e.g., Normal, Abnormal..." /></div>' +
      '<div class="form-group"><label>Notes</label><textarea id="gyn-notes" class="form-control" rows="2"></textarea></div>';
  }

  openModal({
    title: 'New ' + label + ' Record',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-gyn-btn">Save</button>'
  });

  document.getElementById('save-gyn-btn').addEventListener('click', function() {
    var baseData = {
      patientId: patientId,
      type: type,
      date: document.getElementById('gyn-date').value,
      notes: (document.getElementById('gyn-notes') || {}).value || '',
      provider: getSessionUser().id
    };

    if (type === 'papHpv') {
      baseData.bethesdaResult = document.getElementById('gyn-bethesda').value;
      baseData.hpvStatus = document.getElementById('gyn-hpv').value;
      baseData.followUpPlan = document.getElementById('gyn-followup').value;
      baseData.result = baseData.bethesdaResult; // for backward compat display

    } else if (type === 'colposcopy') {
      baseData.indication = document.getElementById('gyn-indication').value;
      baseData.tzType = document.getElementById('gyn-tz').value;
      baseData.findings = document.getElementById('gyn-findings').value;
      baseData.biopsyTaken = document.getElementById('gyn-biopsy').value;
      baseData.pathologyResult = document.getElementById('gyn-pathology').value;
      baseData.result = 'Colposcopy'; // display label

    } else if (type === 'contraceptive') {
      baseData.method = document.getElementById('gyn-method').value;
      baseData.placementDate = document.getElementById('gyn-placement').value;
      baseData.expirationDate = document.getElementById('gyn-expiration').value;
      baseData.counselingDone = document.getElementById('gyn-counseling').checked;
      baseData.result = baseData.method; // display label

    } else if (type === 'menstrual') {
      baseData.lmpDate = document.getElementById('gyn-lmp').value;
      baseData.cycleLength = document.getElementById('gyn-cycle-length').value;
      baseData.flowDuration = document.getElementById('gyn-flow-duration').value;
      baseData.flowAmount = document.getElementById('gyn-flow').value;
      baseData.regularity = document.getElementById('gyn-regularity').value;
      baseData.dysmenorrhea = document.getElementById('gyn-dysmenorrhea').value;
      baseData.result = 'Menstrual Hx'; // display label

    } else {
      baseData.details = (document.getElementById('gyn-details') || {}).value || '';
      baseData.result = (document.getElementById('gyn-result') || {}).value || '';
    }

    saveGynRecord(baseData);
    closeModal();
    showToast(label + ' record saved', 'success');
    renderOBGYN(patientId);
  });
}

/* ---------- Chart Integration ---------- */
function buildOBGYNChartSection(patientId) {
  if (!hasOBGYNRelevance(patientId)) return null;
  var section = document.createElement('div');
  section.className = 'chart-section';
  section.id = 'section-obgyn';
  section.innerHTML =
    '<div class="chart-section-header">' +
      '<h3>OB/GYN</h3>' +
      '<button class="btn btn-xs btn-primary" onclick="navigate(\'#obgyn/' + patientId + '\')">Open OB/GYN Module</button>' +
    '</div>';

  var prenatal = getPrenatalRecords(patientId);
  if (prenatal.length > 0) {
    var rec = prenatal[prenatal.length - 1];
    var ega = rec.lmp ? calculateEGA(rec.lmp) : '';
    var edd = rec.edd ? new Date(rec.edd).toLocaleDateString() : '';
    var gtpal = formatGTPAL(rec);
    var highRiskBadge = rec.highRisk ? ' <span class="badge badge-danger" style="background:var(--danger);color:#fff;">HIGH RISK</span>' : '';
    section.innerHTML += '<p style="margin:8px 0;"><strong>Current Pregnancy:</strong> ' + esc(gtpal) + highRiskBadge +
      (ega ? ' | EGA: ' + ega : '') + (edd ? ' | EDD: ' + edd : '') + '</p>';
  }

  var gynRecs = getGynRecords(patientId);
  var lastPap = gynRecs.filter(function(r) { return r.type === 'pap' || r.type === 'papHpv'; }).sort(function(a, b) { return new Date(b.date) - new Date(a.date); })[0];
  if (lastPap) {
    section.innerHTML += '<p style="margin:4px 0;"><strong>Last Pap:</strong> ' + esc(lastPap.date) + ' — ' + esc(lastPap.result || lastPap.bethesdaResult || '') + '</p>';
  }

  return section;
}
