/* ============================================================
   views/pediatrics.js — Pediatrics Module
   Growth charts, developmental milestones, vaccine schedule,
   well-child visits, school/sports physicals
   ============================================================ */

/* ---------- Simplified CDC/WHO Percentile Reference Data ---------- */
/* Weight-for-age (kg) at key percentiles, boys ages 0-60 months */
const GROWTH_REF_WEIGHT_BOYS = {
  0:  { p3: 2.5, p10: 2.9, p25: 3.2, p50: 3.5, p75: 3.9, p90: 4.2, p97: 4.6 },
  3:  { p3: 5.0, p10: 5.5, p25: 5.9, p50: 6.4, p75: 6.9, p90: 7.5, p97: 8.0 },
  6:  { p3: 6.4, p10: 7.0, p25: 7.5, p50: 7.9, p75: 8.5, p90: 9.0, p97: 9.7 },
  12: { p3: 7.8, p10: 8.5, p25: 9.2, p50: 9.6, p75: 10.4, p90: 11.0, p97: 11.8 },
  18: { p3: 8.8, p10: 9.6, p25: 10.2, p50: 10.9, p75: 11.6, p90: 12.4, p97: 13.2 },
  24: { p3: 9.7, p10: 10.5, p25: 11.3, p50: 12.2, p75: 13.0, p90: 13.9, p97: 14.8 },
  36: { p3: 11.3, p10: 12.2, p25: 13.1, p50: 14.3, p75: 15.3, p90: 16.4, p97: 17.4 },
  48: { p3: 12.7, p10: 13.8, p25: 14.9, p50: 16.3, p75: 17.7, p90: 19.1, p97: 20.4 },
  60: { p3: 14.1, p10: 15.5, p25: 16.8, p50: 18.4, p75: 20.2, p90: 22.0, p97: 23.7 }
};

const GROWTH_REF_WEIGHT_GIRLS = {
  0:  { p3: 2.4, p10: 2.7, p25: 3.0, p50: 3.3, p75: 3.7, p90: 4.0, p97: 4.4 },
  3:  { p3: 4.6, p10: 5.0, p25: 5.4, p50: 5.8, p75: 6.3, p90: 6.8, p97: 7.3 },
  6:  { p3: 5.8, p10: 6.3, p25: 6.8, p50: 7.3, p75: 7.8, p90: 8.4, p97: 9.0 },
  12: { p3: 7.0, p10: 7.7, p25: 8.4, p50: 8.9, p75: 9.6, p90: 10.3, p97: 11.0 },
  18: { p3: 8.1, p10: 8.8, p25: 9.5, p50: 10.2, p75: 11.0, p90: 11.8, p97: 12.6 },
  24: { p3: 9.0, p10: 9.8, p25: 10.6, p50: 11.5, p75: 12.4, p90: 13.3, p97: 14.2 },
  36: { p3: 10.6, p10: 11.5, p25: 12.4, p50: 13.9, p75: 15.0, p90: 16.1, p97: 17.2 },
  48: { p3: 12.2, p10: 13.3, p25: 14.3, p50: 15.9, p75: 17.4, p90: 18.9, p97: 20.3 },
  60: { p3: 13.7, p10: 15.0, p25: 16.3, p50: 18.2, p75: 20.1, p90: 22.0, p97: 23.8 }
};

/* Height-for-age (cm) */
const GROWTH_REF_HEIGHT_BOYS = {
  0:  { p3: 46.3, p10: 47.5, p25: 48.6, p50: 49.9, p75: 51.1, p90: 52.3, p97: 53.4 },
  3:  { p3: 57.6, p10: 58.8, p25: 60.0, p50: 61.4, p75: 62.8, p90: 64.0, p97: 65.2 },
  6:  { p3: 63.6, p10: 64.9, p25: 66.2, p50: 67.6, p75: 69.1, p90: 70.4, p97: 71.6 },
  12: { p3: 71.0, p10: 72.3, p25: 73.8, p50: 75.7, p75: 77.2, p90: 78.8, p97: 80.2 },
  18: { p3: 76.9, p10: 78.4, p25: 80.0, p50: 82.3, p75: 84.1, p90: 85.7, p97: 87.3 },
  24: { p3: 81.7, p10: 83.5, p25: 85.3, p50: 87.8, p75: 89.8, p90: 91.6, p97: 93.4 },
  36: { p3: 88.7, p10: 90.8, p25: 93.0, p50: 96.1, p75: 98.5, p90: 100.7, p97: 102.9 },
  48: { p3: 94.9, p10: 97.4, p25: 99.9, p50: 103.3, p75: 106.2, p90: 108.7, p97: 111.0 },
  60: { p3: 100.7, p10: 103.5, p25: 106.3, p50: 110.0, p75: 113.2, p90: 115.9, p97: 118.4 }
};

const GROWTH_REF_HEIGHT_GIRLS = {
  0:  { p3: 45.6, p10: 46.8, p25: 47.9, p50: 49.1, p75: 50.3, p90: 51.5, p97: 52.7 },
  3:  { p3: 56.2, p10: 57.4, p25: 58.7, p50: 59.8, p75: 61.1, p90: 62.3, p97: 63.5 },
  6:  { p3: 61.8, p10: 63.1, p25: 64.5, p50: 65.7, p75: 67.1, p90: 68.5, p97: 69.8 },
  12: { p3: 69.2, p10: 70.5, p25: 72.0, p50: 74.0, p75: 75.7, p90: 77.3, p97: 78.9 },
  18: { p3: 74.8, p10: 76.5, p25: 78.2, p50: 80.7, p75: 82.7, p90: 84.4, p97: 86.1 },
  24: { p3: 80.0, p10: 81.8, p25: 83.8, p50: 86.4, p75: 88.6, p90: 90.6, p97: 92.5 },
  36: { p3: 87.2, p10: 89.4, p25: 91.6, p50: 95.1, p75: 97.6, p90: 100.0, p97: 102.2 },
  48: { p3: 93.5, p10: 96.1, p25: 98.7, p50: 102.7, p75: 105.7, p90: 108.3, p97: 110.7 },
  60: { p3: 99.5, p10: 102.3, p25: 105.2, p50: 109.4, p75: 112.7, p90: 115.6, p97: 118.2 }
};

/* ---------- Head Circumference (cm) 0-36 months ---------- */
const GROWTH_REF_HC_BOYS = {
  0:  { p3: 32.1, p10: 33.0, p25: 33.8, p50: 34.5, p75: 35.3, p90: 36.1, p97: 36.9 },
  3:  { p3: 38.0, p10: 38.8, p25: 39.5, p50: 40.5, p75: 41.3, p90: 42.1, p97: 42.9 },
  6:  { p3: 40.9, p10: 41.7, p25: 42.5, p50: 43.3, p75: 44.2, p90: 45.0, p97: 45.8 },
  12: { p3: 43.6, p10: 44.4, p25: 45.3, p50: 46.1, p75: 47.0, p90: 47.8, p97: 48.6 },
  18: { p3: 44.8, p10: 45.6, p25: 46.5, p50: 47.4, p75: 48.3, p90: 49.1, p97: 50.0 },
  24: { p3: 45.6, p10: 46.5, p25: 47.3, p50: 48.3, p75: 49.2, p90: 50.0, p97: 50.9 },
  36: { p3: 46.6, p10: 47.5, p25: 48.4, p50: 49.5, p75: 50.4, p90: 51.3, p97: 52.2 }
};

const GROWTH_REF_HC_GIRLS = {
  0:  { p3: 31.7, p10: 32.4, p25: 33.1, p50: 33.9, p75: 34.6, p90: 35.3, p97: 36.1 },
  3:  { p3: 37.3, p10: 38.0, p25: 38.7, p50: 39.5, p75: 40.3, p90: 41.0, p97: 41.8 },
  6:  { p3: 39.7, p10: 40.5, p25: 41.2, p50: 42.0, p75: 42.8, p90: 43.6, p97: 44.4 },
  12: { p3: 42.3, p10: 43.1, p25: 43.9, p50: 44.7, p75: 45.6, p90: 46.4, p97: 47.2 },
  18: { p3: 43.5, p10: 44.3, p25: 45.1, p50: 46.0, p75: 46.9, p90: 47.7, p97: 48.5 },
  24: { p3: 44.3, p10: 45.2, p25: 46.0, p50: 47.0, p75: 48.0, p90: 48.8, p97: 49.7 },
  36: { p3: 45.3, p10: 46.2, p25: 47.1, p50: 48.1, p75: 49.0, p90: 49.9, p97: 50.8 }
};

/* ---------- Developmental Milestones ---------- */
const DEV_MILESTONES = {
  '0-2mo': {
    'Gross Motor': ['Lifts head when prone', 'Moves arms and legs'],
    'Fine Motor': ['Hands mostly closed', 'Brief grasp of rattle'],
    'Language': ['Coos', 'Turns to sound'],
    'Social/Cognitive': ['Social smile', 'Follows face past midline']
  },
  '2-4mo': {
    'Gross Motor': ['Holds head steady', 'Pushes up on forearms'],
    'Fine Motor': ['Reaches for objects', 'Brings hands to midline'],
    'Language': ['Laughs', 'Vowel sounds (ah, eh, oh)'],
    'Social/Cognitive': ['Smiles spontaneously', 'Enjoys play']
  },
  '4-6mo': {
    'Gross Motor': ['Rolls over both ways', 'Sits with support'],
    'Fine Motor': ['Transfers objects hand to hand', 'Raking grasp'],
    'Language': ['Babbles (ba-ba, da-da)', 'Responds to name'],
    'Social/Cognitive': ['Recognizes familiar faces', 'Reaches for toys']
  },
  '6-9mo': {
    'Gross Motor': ['Sits without support', 'Crawling'],
    'Fine Motor': ['Pincer grasp developing', 'Bangs objects together'],
    'Language': ['Says mama/dada nonspecific', 'Understands "no"'],
    'Social/Cognitive': ['Stranger anxiety', 'Plays peek-a-boo']
  },
  '9-12mo': {
    'Gross Motor': ['Pulls to stand', 'Cruises furniture'],
    'Fine Motor': ['Pincer grasp refined', 'Points with index finger'],
    'Language': ['1-2 words', 'Follows simple commands'],
    'Social/Cognitive': ['Waves bye-bye', 'Imitates activities']
  },
  '12-18mo': {
    'Gross Motor': ['Walks independently', 'Stoops and recovers'],
    'Fine Motor': ['Stacks 2-3 blocks', 'Scribbles'],
    'Language': ['3-6 words', 'Points to wants'],
    'Social/Cognitive': ['Pretend play begins', 'Shows objects to others']
  },
  '18-24mo': {
    'Gross Motor': ['Runs', 'Kicks ball'],
    'Fine Motor': ['Stacks 6+ blocks', 'Turns pages'],
    'Language': ['50+ words, 2-word phrases', 'Names pictures'],
    'Social/Cognitive': ['Parallel play', 'Uses spoon/fork']
  },
  '2-3yr': {
    'Gross Motor': ['Jumps with both feet', 'Climbs stairs alternating feet'],
    'Fine Motor': ['Draws circles', 'Cuts with scissors'],
    'Language': ['3-word sentences', '250+ words'],
    'Social/Cognitive': ['Takes turns', 'Knows name, age, gender']
  },
  '3-5yr': {
    'Gross Motor': ['Hops on one foot', 'Catches bounced ball'],
    'Fine Motor': ['Draws a person (3+ parts)', 'Buttons/unbuttons'],
    'Language': ['Tells stories', 'Speaks clearly to strangers'],
    'Social/Cognitive': ['Cooperative play', 'Understands rules']
  }
};

const MILESTONE_STATUSES = ['Met', 'Emerging', 'Concern', 'Not Yet'];

/* ---------- CDC Vaccine Schedule ---------- */
const VACCINE_SCHEDULE = [
  { vaccine: 'Hepatitis B (HepB)', doses: 3, schedule: [
    { dose: 1, ageMonths: 0, label: 'Birth' },
    { dose: 2, ageMonths: 1, label: '1 month' },
    { dose: 3, ageMonths: 6, label: '6 months' }
  ]},
  { vaccine: 'Rotavirus (RV)', doses: 3, schedule: [
    { dose: 1, ageMonths: 2, label: '2 months' },
    { dose: 2, ageMonths: 4, label: '4 months' },
    { dose: 3, ageMonths: 6, label: '6 months' }
  ]},
  { vaccine: 'DTaP', doses: 5, schedule: [
    { dose: 1, ageMonths: 2, label: '2 months' },
    { dose: 2, ageMonths: 4, label: '4 months' },
    { dose: 3, ageMonths: 6, label: '6 months' },
    { dose: 4, ageMonths: 15, label: '15-18 months' },
    { dose: 5, ageMonths: 48, label: '4-6 years' }
  ]},
  { vaccine: 'Hib', doses: 4, schedule: [
    { dose: 1, ageMonths: 2, label: '2 months' },
    { dose: 2, ageMonths: 4, label: '4 months' },
    { dose: 3, ageMonths: 6, label: '6 months' },
    { dose: 4, ageMonths: 12, label: '12-15 months' }
  ]},
  { vaccine: 'PCV13 (Pneumococcal)', doses: 4, schedule: [
    { dose: 1, ageMonths: 2, label: '2 months' },
    { dose: 2, ageMonths: 4, label: '4 months' },
    { dose: 3, ageMonths: 6, label: '6 months' },
    { dose: 4, ageMonths: 12, label: '12-15 months' }
  ]},
  { vaccine: 'IPV (Polio)', doses: 4, schedule: [
    { dose: 1, ageMonths: 2, label: '2 months' },
    { dose: 2, ageMonths: 4, label: '4 months' },
    { dose: 3, ageMonths: 6, label: '6-18 months' },
    { dose: 4, ageMonths: 48, label: '4-6 years' }
  ]},
  { vaccine: 'Influenza (IIV)', doses: 0, schedule: [
    { dose: 1, ageMonths: 6, label: 'Annually from 6 months' }
  ]},
  { vaccine: 'MMR', doses: 2, schedule: [
    { dose: 1, ageMonths: 12, label: '12-15 months' },
    { dose: 2, ageMonths: 48, label: '4-6 years' }
  ]},
  { vaccine: 'Varicella', doses: 2, schedule: [
    { dose: 1, ageMonths: 12, label: '12-15 months' },
    { dose: 2, ageMonths: 48, label: '4-6 years' }
  ]},
  { vaccine: 'Hepatitis A (HepA)', doses: 2, schedule: [
    { dose: 1, ageMonths: 12, label: '12-23 months' },
    { dose: 2, ageMonths: 18, label: '6 months after dose 1' }
  ]},
  { vaccine: 'Tdap', doses: 1, schedule: [
    { dose: 1, ageMonths: 132, label: '11-12 years' }
  ]},
  { vaccine: 'HPV', doses: 2, schedule: [
    { dose: 1, ageMonths: 132, label: '11-12 years' },
    { dose: 2, ageMonths: 138, label: '6-12 months after dose 1' }
  ]},
  { vaccine: 'Meningococcal (MenACWY)', doses: 2, schedule: [
    { dose: 1, ageMonths: 132, label: '11-12 years' },
    { dose: 2, ageMonths: 192, label: '16 years' }
  ]}
];

/* ---------- Well-child Visit Ages ---------- */
const WELL_CHILD_AGES = [
  'Newborn', '1 month', '2 months', '4 months', '6 months', '9 months',
  '12 months', '15 months', '18 months', '24 months', '30 months',
  '3 years', '4 years', '5 years', '6 years', '7 years', '8 years',
  '9 years', '10 years', '11 years', '12 years', 'Annual (13-18)'
];

let _pedsTab = 'growth';

/* ============================================================
   MAIN RENDER
   ============================================================ */
function renderPediatrics(patientId) {
  var app = document.getElementById('app');
  app.innerHTML = '';

  var patient = patientId ? getPatient(patientId) : null;
  if (patientId && !patient) { app.textContent = 'Patient not found.'; return; }

  setTopbar({
    title: patient ? 'Pediatrics — ' + esc(patient.firstName + ' ' + patient.lastName) : 'Pediatrics',
    meta: patient ? esc(patient.mrn) + (patient.dob ? ' | DOB: ' + patient.dob : '') : '',
    actions: ''
  });
  setActiveNav('pediatrics');

  var tabs = document.createElement('div');
  tabs.className = 'inbox-tabs';
  var tabDefs = [
    { key: 'growth', label: 'Growth Charts' },
    { key: 'milestones', label: 'Milestones' },
    { key: 'vaccines', label: 'Vaccines' },
    { key: 'wellchild', label: 'Well-Child Visits' },
    { key: 'physical', label: 'School/Sports Physical' }
  ];

  tabDefs.forEach(function(t) {
    var btn = document.createElement('button');
    btn.className = 'inbox-tab' + (_pedsTab === t.key ? ' active' : '');
    btn.textContent = t.label;
    btn.addEventListener('click', function() { _pedsTab = t.key; renderPediatrics(patientId); });
    tabs.appendChild(btn);
  });
  app.appendChild(tabs);

  if (!patient) { renderPedsPatientList(app); return; }

  var card = document.createElement('div');
  card.className = 'card';
  card.style.cssText = 'margin:16px 20px;padding:20px;';

  switch (_pedsTab) {
    case 'growth': buildGrowthChartsTab(card, patient); break;
    case 'milestones': buildMilestonesTab(card, patient); break;
    case 'vaccines': buildVaccineTab(card, patient); break;
    case 'wellchild': buildWellChildTab(card, patient); break;
    case 'physical': buildPhysicalTab(card, patient); break;
  }
  app.appendChild(card);
}

function renderPedsPatientList(app) {
  var card = document.createElement('div');
  card.className = 'card';
  card.style.cssText = 'margin:16px 20px;padding:20px;';
  card.innerHTML = '<h3 style="margin-bottom:12px">Pediatric Patients</h3>';

  var patients = getPatients().filter(function(p) { return isPediatric(p); });
  if (patients.length === 0) {
    card.innerHTML += '<p class="text-muted">No pediatric patients (age &lt; 18). Pediatrics tools appear for patients under 18.</p>';
  } else {
    var table = '<table class="data-table"><thead><tr><th>Patient</th><th>MRN</th><th>DOB</th><th>Age</th></tr></thead><tbody>';
    patients.forEach(function(p) {
      var age = getAgeString(p.dob);
      table += '<tr style="cursor:pointer" onclick="navigate(\'#pediatrics/' + p.id + '\')">' +
        '<td>' + esc(p.firstName + ' ' + p.lastName) + '</td><td>' + esc(p.mrn) + '</td><td>' + esc(p.dob || '—') + '</td><td>' + esc(age) + '</td></tr>';
    });
    table += '</tbody></table>';
    card.innerHTML += table;
  }
  app.appendChild(card);
}

function isPediatric(patient) {
  if (!patient || !patient.dob) return false;
  var age = getAgeYears(patient.dob);
  return age < 18;
}

function getAgeYears(dob) {
  if (!dob) return 999;
  var birth = new Date(dob);
  var now = new Date();
  var age = now.getFullYear() - birth.getFullYear();
  var m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function getAgeMonths(dob) {
  if (!dob) return 0;
  var birth = new Date(dob);
  var now = new Date();
  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
}

function getAgeString(dob) {
  if (!dob) return '—';
  var months = getAgeMonths(dob);
  if (months < 1) return 'Newborn';
  if (months < 24) return months + ' months';
  var years = Math.floor(months / 12);
  var rem = months % 12;
  return years + 'y' + (rem > 0 ? ' ' + rem + 'm' : '');
}

/* ============================================================
   TAB: Growth Charts
   ============================================================ */
function buildGrowthChartsTab(card, patient) {
  card.innerHTML = '<h3 style="margin-bottom:12px">Growth Charts</h3>';

  var addBtn = makeBtn('+ Record Measurement', 'btn btn-sm btn-primary', function() { openGrowthModal(patient.id, patient); });
  addBtn.style.marginBottom = '12px';
  card.appendChild(addBtn);

  var measurements = getGrowthMeasurements(patient.id).sort(function(a, b) { return a.ageMonths - b.ageMonths; });

  if (measurements.length === 0) {
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'No growth measurements recorded. Add measurements to see growth charts.' }));
    return;
  }

  var isBoy = (patient.sex || '').toLowerCase() !== 'female';
  var chartTypes = [
    { key: 'weight', label: 'Weight-for-Age', unit: 'kg', ref: isBoy ? GROWTH_REF_WEIGHT_BOYS : GROWTH_REF_WEIGHT_GIRLS, field: 'weightKg' },
    { key: 'height', label: 'Height-for-Age', unit: 'cm', ref: isBoy ? GROWTH_REF_HEIGHT_BOYS : GROWTH_REF_HEIGHT_GIRLS, field: 'heightCm' },
  ];

  var ageMonths = getAgeMonths(patient.dob);
  if (ageMonths <= 36) {
    chartTypes.push({ key: 'hc', label: 'Head Circumference', unit: 'cm', ref: isBoy ? GROWTH_REF_HC_BOYS : GROWTH_REF_HC_GIRLS, field: 'headCircCm' });
  }

  chartTypes.forEach(function(ct) {
    var chartSection = document.createElement('div');
    chartSection.style.marginBottom = '24px';
    chartSection.innerHTML = '<h4 style="margin-bottom:8px">' + ct.label + ' (' + ct.unit + ')</h4>';

    // Simple text-based chart with percentile lines
    var chartData = buildGrowthChartTable(measurements, ct);
    chartSection.appendChild(chartData);
    card.appendChild(chartSection);
  });

  // Measurements data table
  var mTable = '<h4 style="margin:16px 0 8px">All Measurements</h4><table class="data-table data-table-compact"><thead><tr><th>Date</th><th>Age</th><th>Weight (kg)</th><th>Height (cm)</th><th>HC (cm)</th><th>BMI</th></tr></thead><tbody>';
  measurements.forEach(function(m) {
    mTable += '<tr><td>' + esc(m.date) + '</td><td>' + m.ageMonths + ' mo</td><td>' + (m.weightKg || '—') + '</td><td>' + (m.heightCm || '—') + '</td><td>' + (m.headCircCm || '—') + '</td><td>' + (m.bmi ? m.bmi.toFixed(1) : '—') + '</td></tr>';
  });
  mTable += '</tbody></table>';
  card.innerHTML += mTable;
}

function buildGrowthChartTable(measurements, chartType) {
  var div = document.createElement('div');
  var refAges = Object.keys(chartType.ref).map(Number).sort(function(a, b) { return a - b; });
  var table = '<table class="data-table data-table-compact growth-chart-table"><thead><tr><th>Age (mo)</th><th>P3</th><th>P10</th><th>P25</th><th>P50</th><th>P75</th><th>P90</th><th>P97</th><th>Patient</th><th>%ile</th></tr></thead><tbody>';

  refAges.forEach(function(age) {
    var ref = chartType.ref[age];
    var pm = measurements.find(function(m) { return Math.abs(m.ageMonths - age) <= 2; });
    var val = pm ? pm[chartType.field] : null;
    var pctile = val ? estimatePercentile(val, ref) : '';

    var pctClass = '';
    if (pctile) {
      var pctNum = parseInt(pctile);
      if (pctNum < 3 || pctNum > 97) pctClass = 'growth-outlier';
      else if (pctNum < 10 || pctNum > 90) pctClass = 'growth-borderline';
    }

    table += '<tr>' +
      '<td>' + age + '</td>' +
      '<td>' + ref.p3 + '</td><td>' + ref.p10 + '</td><td>' + ref.p25 + '</td>' +
      '<td><strong>' + ref.p50 + '</strong></td>' +
      '<td>' + ref.p75 + '</td><td>' + ref.p90 + '</td><td>' + ref.p97 + '</td>' +
      '<td class="' + pctClass + '">' + (val || '—') + '</td>' +
      '<td class="' + pctClass + '">' + (pctile || '—') + '</td>' +
      '</tr>';
  });
  table += '</tbody></table>';
  div.innerHTML = table;
  return div;
}

function estimatePercentile(value, ref) {
  if (value <= ref.p3) return '<3rd';
  if (value <= ref.p10) return '3-10th';
  if (value <= ref.p25) return '10-25th';
  if (value <= ref.p50) return '25-50th';
  if (value <= ref.p75) return '50-75th';
  if (value <= ref.p90) return '75-90th';
  if (value <= ref.p97) return '90-97th';
  return '>97th';
}

function openGrowthModal(patientId, patient) {
  var ageMonths = getAgeMonths(patient.dob);
  var bodyHTML =
    '<div class="form-group"><label>Date</label><input id="gm-date" type="date" class="form-control" value="' + new Date().toISOString().slice(0, 10) + '" /></div>' +
    '<div class="form-group"><label>Age (months)</label><input id="gm-age" type="number" class="form-control" value="' + ageMonths + '" /></div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Weight (kg)</label><input id="gm-weight" type="number" step="0.1" class="form-control" /></div>' +
      '<div class="form-group"><label>Height (cm)</label><input id="gm-height" type="number" step="0.1" class="form-control" /></div>' +
    '</div>' +
    '<div class="form-group"><label>Head Circumference (cm)</label><input id="gm-hc" type="number" step="0.1" class="form-control" /></div>' +
    '<div id="gm-bmi" class="text-muted" style="margin-top:4px;"></div>';

  openModal({
    title: 'Record Growth Measurement',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-gm-btn">Save</button>'
  });

  function updateBMI() {
    var w = parseFloat(document.getElementById('gm-weight').value);
    var h = parseFloat(document.getElementById('gm-height').value);
    if (w > 0 && h > 0) {
      var bmi = (w / ((h / 100) * (h / 100))).toFixed(1);
      document.getElementById('gm-bmi').textContent = 'Calculated BMI: ' + bmi;
    }
  }
  document.getElementById('gm-weight').addEventListener('input', updateBMI);
  document.getElementById('gm-height').addEventListener('input', updateBMI);

  document.getElementById('save-gm-btn').addEventListener('click', function() {
    var w = parseFloat(document.getElementById('gm-weight').value) || 0;
    var h = parseFloat(document.getElementById('gm-height').value) || 0;
    var bmi = (w > 0 && h > 0) ? w / ((h / 100) * (h / 100)) : 0;
    saveGrowthMeasurement({
      patientId: patientId,
      date: document.getElementById('gm-date').value,
      ageMonths: parseInt(document.getElementById('gm-age').value) || 0,
      weightKg: w,
      heightCm: h,
      headCircCm: parseFloat(document.getElementById('gm-hc').value) || 0,
      bmi: Math.round(bmi * 10) / 10,
      recordedBy: getSessionUser().id
    });
    closeModal();
    showToast('Growth measurement saved', 'success');
    renderPediatrics(patientId);
  });
}

/* ============================================================
   TAB: Developmental Milestones
   ============================================================ */
function buildMilestonesTab(card, patient) {
  card.innerHTML = '<h3 style="margin-bottom:12px">Developmental Milestones</h3>';

  var milestones = getDevMilestones(patient.id);
  var ageMonths = getAgeMonths(patient.dob);

  Object.keys(DEV_MILESTONES).forEach(function(ageRange) {
    var section = document.createElement('div');
    section.className = 'specialty-record-card';
    section.innerHTML = '<div class="specialty-record-header"><strong>' + esc(ageRange) + '</strong></div>';

    var body = document.createElement('div');
    body.className = 'specialty-record-body';

    Object.keys(DEV_MILESTONES[ageRange]).forEach(function(category) {
      var catDiv = document.createElement('div');
      catDiv.style.marginBottom = '8px';
      catDiv.innerHTML = '<strong style="font-size:12px;text-transform:uppercase;color:var(--text-muted);">' + esc(category) + '</strong>';

      DEV_MILESTONES[ageRange][category].forEach(function(milestone) {
        var existing = milestones.find(function(m) { return m.ageRange === ageRange && m.category === category && m.milestone === milestone; });
        var status = existing ? existing.status : 'Not Yet';

        var row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;margin:4px 0;padding:4px 0;';
        row.innerHTML = '<span style="flex:1;font-size:13px;">' + esc(milestone) + '</span>';

        var sel = document.createElement('select');
        sel.className = 'form-control';
        sel.style.cssText = 'width:120px;font-size:12px;padding:2px 4px;';
        MILESTONE_STATUSES.forEach(function(s) {
          var opt = document.createElement('option');
          opt.value = s;
          opt.textContent = s;
          if (s === status) opt.selected = true;
          sel.appendChild(opt);
        });

        sel.addEventListener('change', (function(ar, cat, ms) {
          return function() {
            var val = this.value;
            var existingMs = milestones.find(function(m) { return m.ageRange === ar && m.category === cat && m.milestone === ms; });
            saveDevMilestone({
              id: existingMs ? existingMs.id : undefined,
              patientId: patient.id,
              ageRange: ar,
              category: cat,
              milestone: ms,
              status: val,
              assessedDate: new Date().toISOString().slice(0, 10),
              assessedBy: getSessionUser().id
            });
            milestones = getDevMilestones(patient.id);
            showToast('Milestone updated', 'success');
          };
        })(ageRange, category, milestone));

        row.appendChild(sel);
        catDiv.appendChild(row);
      });
      body.appendChild(catDiv);
    });
    section.appendChild(body);
    card.appendChild(section);
  });
}

/* ============================================================
   TAB: Vaccine Schedule
   ============================================================ */
function buildVaccineTab(card, patient) {
  card.innerHTML = '<h3 style="margin-bottom:12px">Immunization Schedule</h3>';

  var records = getVaccineRecords(patient.id);
  var immunizations = loadAll(KEYS.immunizations).filter(function(i) { return i.patientId === patient.id; });
  var ageMonths = getAgeMonths(patient.dob);

  var addBtn = makeBtn('+ Record Vaccination', 'btn btn-sm btn-primary', function() { openVaccineModal(patient.id); });
  addBtn.style.marginBottom = '12px';
  card.appendChild(addBtn);

  var table = '<table class="data-table"><thead><tr><th>Vaccine</th><th>Dose</th><th>Due</th><th>Status</th><th>Date Given</th></tr></thead><tbody>';

  VACCINE_SCHEDULE.forEach(function(vs) {
    vs.schedule.forEach(function(dose) {
      // Check if given
      var given = records.find(function(r) {
        return r.vaccine === vs.vaccine && r.doseNumber === dose.dose;
      });
      // Also check immunizations table
      if (!given) {
        given = immunizations.find(function(i) {
          return (i.vaccine || '').indexOf(vs.vaccine.split(' ')[0]) >= 0;
        });
      }

      var isDue = ageMonths >= dose.ageMonths;
      var isOverdue = isDue && !given && ageMonths > dose.ageMonths + 2;
      var status, statusClass;

      if (given) {
        status = 'Given';
        statusClass = 'badge-success';
      } else if (isOverdue) {
        status = 'Overdue';
        statusClass = 'badge-danger';
      } else if (isDue) {
        status = 'Due Now';
        statusClass = 'badge-warning';
      } else {
        status = 'Upcoming';
        statusClass = 'badge-muted';
      }

      table += '<tr><td>' + esc(vs.vaccine) + '</td><td>Dose ' + dose.dose + '</td>' +
        '<td>' + esc(dose.label) + '</td>' +
        '<td><span class="badge ' + statusClass + '">' + status + '</span></td>' +
        '<td>' + (given ? esc(given.dateGiven || given.date || '') : '—') + '</td></tr>';
    });
  });
  table += '</tbody></table>';
  card.innerHTML += table;
}

function openVaccineModal(patientId) {
  var vaccineOpts = VACCINE_SCHEDULE.map(function(vs) {
    return '<option value="' + esc(vs.vaccine) + '">' + esc(vs.vaccine) + '</option>';
  }).join('');

  var bodyHTML =
    '<div class="form-group"><label>Vaccine</label><select id="vr-vaccine" class="form-control">' + vaccineOpts + '</select></div>' +
    '<div class="form-group"><label>Dose Number</label><input id="vr-dose" type="number" class="form-control" value="1" min="1" /></div>' +
    '<div class="form-group"><label>Date Given</label><input id="vr-date" type="date" class="form-control" value="' + new Date().toISOString().slice(0, 10) + '" /></div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Lot Number</label><input id="vr-lot" class="form-control" /></div>' +
      '<div class="form-group"><label>Manufacturer</label><input id="vr-mfg" class="form-control" /></div>' +
    '</div>' +
    '<div class="form-group"><label>Site</label><select id="vr-site" class="form-control"><option>L deltoid</option><option>R deltoid</option><option>L thigh</option><option>R thigh</option><option>Oral</option></select></div>';

  openModal({
    title: 'Record Vaccination',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-vr-btn">Save</button>'
  });

  document.getElementById('save-vr-btn').addEventListener('click', function() {
    saveVaccineRecord({
      patientId: patientId,
      vaccine: document.getElementById('vr-vaccine').value,
      doseNumber: parseInt(document.getElementById('vr-dose').value) || 1,
      dateGiven: document.getElementById('vr-date').value,
      lot: document.getElementById('vr-lot').value,
      manufacturer: document.getElementById('vr-mfg').value,
      site: document.getElementById('vr-site').value,
      givenBy: getSessionUser().id,
      status: 'Given'
    });
    closeModal();
    showToast('Vaccination recorded', 'success');
    renderPediatrics(patientId);
  });
}

/* ============================================================
   TAB: Well-Child Visits
   ============================================================ */
function buildWellChildTab(card, patient) {
  card.innerHTML = '<h3 style="margin-bottom:12px">Well-Child Visits</h3>';

  var visits = getWellChildVisits(patient.id).sort(function(a, b) { return new Date(b.visitDate) - new Date(a.visitDate); });
  var addBtn = makeBtn('+ New Well-Child Visit', 'btn btn-sm btn-primary', function() { openWellChildModal(patient.id); });
  addBtn.style.marginBottom = '12px';
  card.appendChild(addBtn);

  // Template checklist
  var templates = document.createElement('div');
  templates.style.cssText = 'margin-bottom:16px;padding:12px;background:var(--bg-base);border-radius:6px;';
  templates.innerHTML = '<strong>Recommended Visit Ages:</strong><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">' +
    WELL_CHILD_AGES.map(function(age) {
      var done = visits.some(function(v) { return v.visitAge === age; });
      return '<span class="badge ' + (done ? 'badge-success' : 'badge-muted') + '">' + esc(age) + '</span>';
    }).join('') + '</div>';
  card.appendChild(templates);

  if (visits.length === 0) {
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'No well-child visits recorded.' }));
    return;
  }

  visits.forEach(function(v) {
    var vCard = document.createElement('div');
    vCard.className = 'specialty-record-card';
    vCard.innerHTML =
      '<div class="specialty-record-header"><strong>' + esc(v.visitAge) + ' Visit</strong><span class="text-muted">' + esc(v.visitDate) + '</span></div>' +
      '<div class="specialty-record-body">' +
        (v.findings ? '<p><strong>Findings:</strong> ' + esc(v.findings) + '</p>' : '') +
        (v.anticipatoryGuidance ? '<p><strong>Anticipatory Guidance:</strong> ' + esc(v.anticipatoryGuidance) + '</p>' : '') +
        (v.referrals ? '<p><strong>Referrals:</strong> ' + esc(v.referrals) + '</p>' : '') +
      '</div>';
    card.appendChild(vCard);
  });
}

function openWellChildModal(patientId) {
  var ageOpts = WELL_CHILD_AGES.map(function(a) { return '<option>' + a + '</option>'; }).join('');
  var bodyHTML =
    '<div class="form-row">' +
      '<div class="form-group"><label>Visit Age</label><select id="wc-age" class="form-control">' + ageOpts + '</select></div>' +
      '<div class="form-group"><label>Visit Date</label><input id="wc-date" type="date" class="form-control" value="' + new Date().toISOString().slice(0, 10) + '" /></div>' +
    '</div>' +
    '<div class="form-group"><label>Findings</label><textarea id="wc-findings" class="form-control" rows="4" placeholder="Physical exam findings, growth status, developmental assessment..."></textarea></div>' +
    '<div class="form-group"><label>Anticipatory Guidance</label><textarea id="wc-guidance" class="form-control" rows="3" placeholder="Safety, nutrition, development, sleep..."></textarea></div>' +
    '<div class="form-group"><label>Referrals</label><textarea id="wc-referrals" class="form-control" rows="2" placeholder="If any"></textarea></div>';

  openModal({
    title: 'New Well-Child Visit',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-wc-btn">Save</button>',
    size: 'lg'
  });

  document.getElementById('save-wc-btn').addEventListener('click', function() {
    saveWellChildVisit({
      patientId: patientId,
      visitAge: document.getElementById('wc-age').value,
      visitDate: document.getElementById('wc-date').value,
      findings: document.getElementById('wc-findings').value,
      anticipatoryGuidance: document.getElementById('wc-guidance').value,
      referrals: document.getElementById('wc-referrals').value,
      provider: getSessionUser().id
    });
    closeModal();
    showToast('Well-child visit saved', 'success');
    renderPediatrics(patientId);
  });
}

/* ============================================================
   TAB: School/Sports Physical
   ============================================================ */
function buildPhysicalTab(card, patient) {
  card.innerHTML = '<h3 style="margin-bottom:12px">School / Sports Physical</h3>';

  var physicals = getSchoolPhysicals(patient.id).sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
  var addBtn = makeBtn('+ New Physical', 'btn btn-sm btn-primary', function() { openPhysicalModal(patient.id); });
  addBtn.style.marginBottom = '12px';
  card.appendChild(addBtn);

  if (physicals.length === 0) {
    card.appendChild(Object.assign(document.createElement('p'), { className: 'text-muted', textContent: 'No school/sports physicals recorded.' }));
    return;
  }

  physicals.forEach(function(p) {
    var pCard = document.createElement('div');
    pCard.className = 'specialty-record-card';
    var clearedClass = p.cleared ? 'badge-success' : 'badge-danger';
    pCard.innerHTML =
      '<div class="specialty-record-header">' +
        '<strong>' + esc(p.type) + ' Physical</strong>' +
        '<span class="badge ' + clearedClass + '">' + (p.cleared ? 'Cleared' : 'Not Cleared') + '</span>' +
      '</div>' +
      '<div class="specialty-record-body">' +
        '<p><strong>Date:</strong> ' + esc(p.date) + '</p>' +
        '<div class="form-row">' +
          '<div><strong>Vision:</strong> ' + esc(p.vision || '—') + '</div>' +
          '<div><strong>Hearing:</strong> ' + esc(p.hearing || '—') + '</div>' +
        '</div>' +
        '<div class="form-row" style="margin-top:4px;">' +
          '<div><strong>Cardiovascular:</strong> ' + esc(p.cardiovascular || '—') + '</div>' +
          '<div><strong>Musculoskeletal:</strong> ' + esc(p.musculoskeletal || '—') + '</div>' +
        '</div>' +
        (p.restrictions ? '<p style="margin-top:4px;"><strong>Restrictions:</strong> ' + esc(p.restrictions) + '</p>' : '') +
      '</div>';
    card.appendChild(pCard);
  });
}

function openPhysicalModal(patientId) {
  var bodyHTML =
    '<div class="form-row">' +
      '<div class="form-group"><label>Type</label><select id="sp-type" class="form-control"><option>School</option><option>Sports</option><option>Camp</option></select></div>' +
      '<div class="form-group"><label>Date</label><input id="sp-date" type="date" class="form-control" value="' + new Date().toISOString().slice(0, 10) + '" /></div>' +
    '</div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Vision</label><select id="sp-vision" class="form-control"><option>Normal</option><option>Corrected</option><option>Abnormal — refer</option></select></div>' +
      '<div class="form-group"><label>Hearing</label><select id="sp-hearing" class="form-control"><option>Normal</option><option>Abnormal — refer</option></select></div>' +
    '</div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Cardiovascular</label><select id="sp-cv" class="form-control"><option>Normal</option><option>Murmur — benign</option><option>Abnormal — refer</option></select></div>' +
      '<div class="form-group"><label>Musculoskeletal</label><select id="sp-msk" class="form-control"><option>Normal</option><option>Scoliosis screen positive</option><option>Abnormal — refer</option></select></div>' +
    '</div>' +
    '<div class="form-group"><label>Cleared for Participation</label><select id="sp-cleared" class="form-control"><option value="true">Yes — Cleared</option><option value="false">No — Not Cleared</option><option value="conditional">Cleared with restrictions</option></select></div>' +
    '<div class="form-group"><label>Restrictions / Notes</label><textarea id="sp-restrictions" class="form-control" rows="3"></textarea></div>';

  openModal({
    title: 'School / Sports Physical',
    bodyHTML: bodyHTML,
    footerHTML: '<button class="btn btn-success" id="save-sp-btn">Save</button>',
    size: 'lg'
  });

  document.getElementById('save-sp-btn').addEventListener('click', function() {
    saveSchoolPhysical({
      patientId: patientId,
      date: document.getElementById('sp-date').value,
      type: document.getElementById('sp-type').value,
      vision: document.getElementById('sp-vision').value,
      hearing: document.getElementById('sp-hearing').value,
      cardiovascular: document.getElementById('sp-cv').value,
      musculoskeletal: document.getElementById('sp-msk').value,
      cleared: document.getElementById('sp-cleared').value !== 'false',
      restrictions: document.getElementById('sp-restrictions').value,
      provider: getSessionUser().id
    });
    closeModal();
    showToast('Physical saved', 'success');
    renderPediatrics(patientId);
  });
}

/* ---------- Chart Integration ---------- */
function buildPedsChartSection(patientId) {
  var patient = getPatient(patientId);
  if (!patient || !isPediatric(patient)) return null;

  var section = document.createElement('div');
  section.className = 'chart-section';
  section.id = 'section-pediatrics';
  section.innerHTML =
    '<div class="chart-section-header">' +
      '<h3>Pediatrics</h3>' +
      '<button class="btn btn-xs btn-primary" onclick="navigate(\'#pediatrics/' + patientId + '\')">Open Pediatrics Module</button>' +
    '</div>';

  var age = getAgeString(patient.dob);
  section.innerHTML += '<p style="margin:8px 0;"><strong>Age:</strong> ' + esc(age) + '</p>';

  // Latest growth
  var measurements = getGrowthMeasurements(patientId);
  if (measurements.length > 0) {
    var latest = measurements.sort(function(a, b) { return b.ageMonths - a.ageMonths; })[0];
    section.innerHTML += '<p><strong>Last growth:</strong> Wt ' + (latest.weightKg || '—') + ' kg, Ht ' + (latest.heightCm || '—') + ' cm</p>';
  }

  // Vaccine status
  var records = getVaccineRecords(patientId);
  var ageMonths = getAgeMonths(patient.dob);
  var overdue = 0;
  VACCINE_SCHEDULE.forEach(function(vs) {
    vs.schedule.forEach(function(dose) {
      if (ageMonths > dose.ageMonths + 2) {
        var given = records.find(function(r) { return r.vaccine === vs.vaccine && r.doseNumber === dose.dose; });
        if (!given) overdue++;
      }
    });
  });
  if (overdue > 0) {
    section.innerHTML += '<p><span class="badge badge-danger">' + overdue + ' overdue vaccine(s)</span></p>';
  }

  return section;
}
