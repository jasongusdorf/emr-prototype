/* ============================================================
   views/obgyn.js — OB/GYN Module
   Prenatal care, L&D, postpartum, GYN tracking
   ============================================================ */

const PRENATAL_LAB_KEYS = [
  { key: 'bloodType',  label: 'Blood Type/Rh' },
  { key: 'rubella',    label: 'Rubella Immunity' },
  { key: 'hepatitisB', label: 'Hepatitis B (HBsAg)' },
  { key: 'hiv',        label: 'HIV' },
  { key: 'gbs',        label: 'GBS (35-37 wks)' },
  { key: 'glucoseTol', label: 'Glucose Tolerance' },
  { key: 'cbc',        label: 'CBC' },
  { key: 'urinalysis', label: 'Urinalysis' },
  { key: 'chlamydia',  label: 'Chlamydia/Gonorrhea' },
  { key: 'syphilis',   label: 'Syphilis (RPR)' }
];

const VISIT_SCHEDULE = [
  { weeks: '4-28',  frequency: 'Every 4 weeks',  visits: [4,8,12,16,20,24,28] },
  { weeks: '28-36', frequency: 'Every 2 weeks',  visits: [30,32,34,36] },
  { weeks: '36-40', frequency: 'Every week',      visits: [37,38,39,40] }
];

const DELIVERY_TYPES = ['SVD (Spontaneous Vaginal)', 'C-Section (Primary)', 'C-Section (Repeat)', 'Assisted (Vacuum)', 'Assisted (Forceps)', 'VBAC'];

const EDINBURGH_QUESTIONS = [
  'I have been able to laugh and see the funny side of things',
  'I have looked forward with enjoyment to things',
  'I have blamed myself unnecessarily when things went wrong',
  'I have been anxious or worried for no good reason',
  'I have felt scared or panicky for no very good reason',
  'Things have been getting on top of me',
  'I have been so unhappy that I have had difficulty sleeping',
  'I have felt sad or miserable',
  'I have been so unhappy that I have been crying',
  'The thought of harming myself has occurred to me'
];

let _obgynTab = 'prenatal';

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

    section.innerHTML =
      '<div class="specialty-record-header">' +
        '<strong>G' + (rec.gravida || 0) + 'P' + (rec.para || 0) + '</strong>' +
        '<span class="badge badge-info">EDD: ' + edd + ' | EGA: ' + ega + '</span>' +
      '</div>' +
      '<div class="specialty-record-body">' +
        '<p><strong>LMP:</strong> ' + esc(rec.lmp || '—') + ' | <strong>EDD Source:</strong> ' + esc(rec.eddSource || 'LMP') + '</p>' +
      '</div>';

    // Visits table
    var visits = rec.visits || [];
    if (visits.length > 0) {
      var vTable = '<table class="data-table data-table-compact"><thead><tr><th>Date</th><th>EGA</th><th>Fundal Ht</th><th>FHR</th><th>Weight</th><th>BP</th><th>Urine Protein</th><th>Glucose</th></tr></thead><tbody>';
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

function openPrenatalModal(patientId, existing) {
  var r = existing || {};
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
    '<div class="form-row">' +
      '<div class="form-group"><label>Gravida</label><input id="pn-gravida" type="number" class="form-control" value="' + (r.gravida || 0) + '" /></div>' +
      '<div class="form-group"><label>Para</label><input id="pn-para" type="number" class="form-control" value="' + (r.para || 0) + '" /></div>' +
    '</div>';

  openModal({
    title: (existing ? 'Edit' : 'New') + ' Prenatal Record',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-pn-btn">Save</button>'
  });

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
    savePrenatalRecord({
      id: existing ? existing.id : undefined,
      patientId: patientId,
      lmp: lmp,
      edd: edd,
      eddSource: document.getElementById('pn-edd-source').value,
      gravida: parseInt(document.getElementById('pn-gravida').value) || 0,
      para: parseInt(document.getElementById('pn-para').value) || 0,
      visits: existing ? existing.visits : []
    });
    closeModal();
    showToast('Prenatal record saved', 'success');
    renderOBGYN(patientId);
  });
}

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
    '</div>';

  openModal({
    title: 'Add Prenatal Visit',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-pv-btn">Save</button>'
  });

  document.getElementById('save-pv-btn').addEventListener('click', function() {
    var visits = record.visits || [];
    visits.push({
      date: document.getElementById('pv-date').value,
      ega: document.getElementById('pv-ega').value,
      fundalHeight: document.getElementById('pv-fundal').value,
      fhr: document.getElementById('pv-fhr').value,
      weight: document.getElementById('pv-weight').value,
      bp: document.getElementById('pv-bp').value,
      urineProtein: document.getElementById('pv-protein').value,
      glucose: document.getElementById('pv-glucose').value
    });
    savePrenatalRecord({ id: record.id, visits: visits });
    closeModal();
    showToast('Prenatal visit added', 'success');
    renderOBGYN(patientId);
  });
}

/* ============================================================
   TAB: Prenatal Labs
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

  var table = '<table class="data-table"><thead><tr><th>Test</th><th>Status</th><th>Result</th><th>Date</th><th>Action</th></tr></thead><tbody>';
  PRENATAL_LAB_KEYS.forEach(function(lk) {
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
  card.appendChild(tableDiv);

  // Bind record buttons
  tableDiv.querySelectorAll('[data-lab-key]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var key = this.getAttribute('data-lab-key');
      var label = PRENATAL_LAB_KEYS.find(function(l) { return l.key === key; }).label;
      openPrenatalLabModal(patient.id, rec, key, label);
    });
  });
}

function openPrenatalLabModal(patientId, record, labKey, labLabel) {
  var existing = (record.labs || {})[labKey] || {};
  var bodyHTML =
    '<div class="form-group"><label>Result</label><input id="pl-result" class="form-control" value="' + esc(existing.result || '') + '" /></div>' +
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
   TAB: Labor & Delivery
   ============================================================ */
function buildLaborDeliveryTab(card, patient) {
  card.innerHTML = '<h3 style="margin-bottom:12px">Labor & Delivery Summary</h3>';
  var deliveries = getLaborDeliveries(patient.id);
  var addBtn = makeBtn('+ New L&D Record', 'btn btn-sm btn-primary', function() { openLDModal(patient.id); });
  addBtn.style.marginBottom = '12px';
  card.appendChild(addBtn);

  if (deliveries.length === 0) {
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'No labor & delivery records.' }));
    return;
  }

  deliveries.forEach(function(d) {
    var ldCard = document.createElement('div');
    ldCard.className = 'specialty-record-card';
    ldCard.innerHTML =
      '<div class="specialty-record-header"><strong>' + esc(d.deliveryType || 'Delivery') + '</strong><span class="badge badge-info">' + esc(d.deliveryDate || '—') + '</span></div>' +
      '<div class="specialty-record-body">' +
        '<div class="form-row">' +
          '<div><strong>Date/Time:</strong> ' + esc(d.deliveryDate || '') + ' ' + esc(d.deliveryTime || '') + '</div>' +
          '<div><strong>Birth Weight:</strong> ' + esc(d.birthWeight || '—') + '</div>' +
        '</div>' +
        '<div class="form-row" style="margin-top:6px">' +
          '<div><strong>APGAR 1 min:</strong> ' + esc(d.apgar1 || '—') + '</div>' +
          '<div><strong>APGAR 5 min:</strong> ' + esc(d.apgar5 || '—') + '</div>' +
        '</div>' +
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
    '<div class="form-row">' +
      '<div class="form-group"><label>APGAR 1 min</label><input id="ld-apgar1" type="number" min="0" max="10" class="form-control" value="' + esc(d.apgar1 || '') + '" /></div>' +
      '<div class="form-group"><label>APGAR 5 min</label><input id="ld-apgar5" type="number" min="0" max="10" class="form-control" value="' + esc(d.apgar5 || '') + '" /></div>' +
    '</div>' +
    '<div class="form-group"><label>Birth Weight</label><input id="ld-weight" class="form-control" placeholder="e.g., 7 lbs 8 oz" value="' + esc(d.birthWeight || '') + '" /></div>' +
    '<div class="form-group"><label>Complications</label><textarea id="ld-complications" class="form-control" rows="2">' + esc(d.complications || '') + '</textarea></div>' +
    '<div class="form-group"><label>Notes</label><textarea id="ld-notes" class="form-control" rows="2">' + esc(d.notes || '') + '</textarea></div>';

  openModal({
    title: (existing ? 'Edit' : 'New') + ' Labor & Delivery Record',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-ld-btn">Save</button>',
    size: 'lg'
  });

  document.getElementById('save-ld-btn').addEventListener('click', function() {
    saveLaborDelivery({
      id: existing ? existing.id : undefined,
      patientId: patientId,
      deliveryDate: document.getElementById('ld-date').value,
      deliveryTime: document.getElementById('ld-time').value,
      deliveryType: document.getElementById('ld-type').value,
      apgar1: document.getElementById('ld-apgar1').value,
      apgar5: document.getElementById('ld-apgar5').value,
      birthWeight: document.getElementById('ld-weight').value,
      complications: document.getElementById('ld-complications').value,
      notes: document.getElementById('ld-notes').value
    });
    closeModal();
    showToast('L&D record saved', 'success');
    renderOBGYN(patientId);
  });
}

/* ============================================================
   TAB: Postpartum
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

  assessments.forEach(function(a) {
    var ppCard = document.createElement('div');
    ppCard.className = 'specialty-record-card';
    var edinburghSeverity = a.edinburghScore >= 13 ? 'badge-danger' : a.edinburghScore >= 10 ? 'badge-warning' : 'badge-success';
    ppCard.innerHTML =
      '<div class="specialty-record-header"><strong>' + esc(a.assessmentDate || '') + '</strong><span class="badge ' + edinburghSeverity + '">Edinburgh: ' + a.edinburghScore + '/30</span></div>' +
      '<div class="specialty-record-body">' +
        '<p><strong>Recovery:</strong> ' + esc(a.recovery || '—') + '</p>' +
        '<p><strong>Breastfeeding:</strong> ' + esc(a.breastfeeding || '—') + '</p>' +
        '<p><strong>Mood:</strong> ' + esc(a.mood || '—') + '</p>' +
        (a.notes ? '<p><strong>Notes:</strong> ' + esc(a.notes) + '</p>' : '') +
      '</div>';
    card.appendChild(ppCard);
  });
}

function openPostpartumModal(patientId, existing) {
  var a = existing || {};
  var bodyHTML =
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
    '<fieldset style="margin:12px 0;padding:12px;border:1px solid var(--border);border-radius:6px;">' +
      '<legend style="font-weight:600;font-size:13px;">Edinburgh Postnatal Depression Scale</legend>' +
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

  // Build Edinburgh questions
  var qContainer = document.getElementById('edinburgh-questions');
  var responses = a.edinburghResponses || [];
  EDINBURGH_QUESTIONS.forEach(function(q, i) {
    var div = document.createElement('div');
    div.style.cssText = 'margin-bottom:8px;';
    div.innerHTML = '<label style="font-size:12px;">' + (i + 1) + '. ' + esc(q) + '</label>' +
      '<select class="form-control edinburgh-q" data-qi="' + i + '">' +
        '<option value="0"' + (responses[i] === 0 ? ' selected' : '') + '>0</option>' +
        '<option value="1"' + (responses[i] === 1 ? ' selected' : '') + '>1</option>' +
        '<option value="2"' + (responses[i] === 2 ? ' selected' : '') + '>2</option>' +
        '<option value="3"' + (responses[i] === 3 ? ' selected' : '') + '>3</option>' +
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
  });
}

/* ============================================================
   TAB: GYN
   ============================================================ */
function buildGynTab(card, patient) {
  card.innerHTML = '<h3 style="margin-bottom:12px">Gynecology</h3>';

  var gynTypes = [
    { key: 'pap', label: 'Pap Smear' },
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
        item.innerHTML =
          '<div class="specialty-record-header"><span>' + esc(r.date || '') + '</span><span class="badge badge-info">' + esc(r.result || '') + '</span></div>' +
          '<div class="specialty-record-body"><p>' + esc(r.details || '') + '</p>' +
            (r.notes ? '<p class="text-muted">' + esc(r.notes) + '</p>' : '') +
          '</div>';
        section.appendChild(item);
      });
    }
    card.appendChild(section);
  });
}

function openGynModal(patientId, type, label) {
  var bodyHTML =
    '<div class="form-group"><label>Date</label><input id="gyn-date" type="date" class="form-control" value="' + new Date().toISOString().slice(0, 10) + '" /></div>' +
    '<div class="form-group"><label>Details</label><textarea id="gyn-details" class="form-control" rows="3" placeholder="Enter details..."></textarea></div>' +
    '<div class="form-group"><label>Result</label><input id="gyn-result" class="form-control" placeholder="e.g., Normal, Abnormal, ASCUS..." /></div>' +
    '<div class="form-group"><label>Notes</label><textarea id="gyn-notes" class="form-control" rows="2"></textarea></div>';

  openModal({
    title: 'New ' + label + ' Record',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-gyn-btn">Save</button>'
  });

  document.getElementById('save-gyn-btn').addEventListener('click', function() {
    saveGynRecord({
      patientId: patientId,
      type: type,
      date: document.getElementById('gyn-date').value,
      details: document.getElementById('gyn-details').value,
      result: document.getElementById('gyn-result').value,
      notes: document.getElementById('gyn-notes').value,
      provider: getSessionUser().id
    });
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
    section.innerHTML += '<p style="margin:8px 0;"><strong>Current Pregnancy:</strong> G' + rec.gravida + 'P' + rec.para +
      (ega ? ' | EGA: ' + ega : '') + (edd ? ' | EDD: ' + edd : '') + '</p>';
  }

  var gynRecs = getGynRecords(patientId);
  var lastPap = gynRecs.filter(function(r) { return r.type === 'pap'; }).sort(function(a, b) { return new Date(b.date) - new Date(a.date); })[0];
  if (lastPap) {
    section.innerHTML += '<p style="margin:4px 0;"><strong>Last Pap:</strong> ' + esc(lastPap.date) + ' — ' + esc(lastPap.result || '') + '</p>';
  }

  return section;
}
