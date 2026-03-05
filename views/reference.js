/* ============================================================
   views/reference.js — Reference Materials page
   ============================================================ */

let _referenceTab = 'drugs';

function renderReference() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  setTopbar({ title: 'Reference Materials', meta: '', actions: '' });
  setActiveNav('reference');

  // Tab bar
  const tabs = document.createElement('div');
  tabs.className = 'inbox-tabs';

  const tabDefs = [
    { key: 'drugs',      label: 'Drug Reference' },
    { key: 'guidelines', label: 'Clinical Guidelines' },
  ];

  tabDefs.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'inbox-tab' + (_referenceTab === t.key ? ' active' : '');
    btn.textContent = t.label;
    btn.addEventListener('click', () => { _referenceTab = t.key; renderReference(); });
    tabs.appendChild(btn);
  });
  app.appendChild(tabs);

  const card = document.createElement('div');
  card.className = 'card';
  card.style.margin = '16px 20px';
  card.style.padding = '20px';

  if (_referenceTab === 'drugs') {
    buildDrugReference(card);
  } else {
    buildClinicalGuidelines(card);
  }

  app.appendChild(card);
}

function buildDrugReference(card) {
  const searchWrap = document.createElement('div');
  searchWrap.style.marginBottom = '16px';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'form-control';
  input.placeholder = 'Search medications by name, class, or indication...';
  input.id = 'ref-drug-search';
  searchWrap.appendChild(input);
  card.appendChild(searchWrap);

  const results = document.createElement('div');
  results.id = 'ref-drug-results';
  card.appendChild(results);

  function doSearch() {
    const q = input.value.trim().toLowerCase();
    results.innerHTML = '';

    if (!q || q.length < 2) {
      results.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">Type at least 2 characters to search.</p>';
      return;
    }

    const matches = (typeof MEDICATION_DB !== 'undefined' ? MEDICATION_DB : []).filter(med => {
      const fields = [
        med.generic,
        ...(med.brands || []),
        med.drugClass,
        ...(med.commonIndications || []),
        ...(med.allergyTags || []),
      ].map(s => (s || '').toLowerCase());
      return fields.some(f => f.includes(q));
    });

    if (matches.length === 0) {
      results.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">No medications found.</p>';
      return;
    }

    matches.slice(0, 30).forEach(med => {
      const item = document.createElement('div');
      item.style.cssText = 'border-bottom:1px solid var(--border);padding:10px 0;';

      const title = document.createElement('div');
      title.style.cssText = 'font-weight:600;font-size:14px;color:var(--text-primary);';
      title.textContent = med.generic;
      if (med.schedule) {
        const sched = document.createElement('span');
        sched.style.cssText = 'margin-left:8px;font-size:11px;font-weight:500;color:var(--warning);';
        sched.textContent = 'Schedule ' + med.schedule;
        title.appendChild(sched);
      }
      item.appendChild(title);

      const details = [];
      if (med.brands && med.brands.length) details.push('Brands: ' + med.brands.join(', '));
      if (med.drugClass) details.push('Class: ' + med.drugClass);
      if (med.doseForms && med.doseForms.length) {
        const forms = med.doseForms.map(d => d.dose + ' ' + d.unit + ' ' + d.route).join('; ');
        details.push('Forms: ' + forms);
      }
      if (med.commonIndications && med.commonIndications.length) details.push('Indications: ' + med.commonIndications.join(', '));
      if (med.allergyTags && med.allergyTags.length) details.push('Allergy tags: ' + med.allergyTags.join(', '));

      const meta = document.createElement('div');
      meta.style.cssText = 'font-size:12px;color:var(--text-muted);margin-top:4px;line-height:1.5;';
      meta.textContent = details.join(' | ');
      item.appendChild(meta);

      results.appendChild(item);
    });

    if (matches.length > 30) {
      const more = document.createElement('p');
      more.style.cssText = 'color:var(--text-muted);font-size:12px;margin-top:8px;';
      more.textContent = 'Showing 30 of ' + matches.length + ' results. Refine your search for more specific results.';
      results.appendChild(more);
    }
  }

  input.addEventListener('input', doSearch);
  doSearch();
}

function buildClinicalGuidelines(card) {
  const guidelines = [
    {
      title: 'Hypertension Management',
      summary: 'ACC/AHA 2017 Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults',
      details: [
        'Normal: <120/80 mmHg',
        'Elevated: 120-129/<80 mmHg — lifestyle modifications',
        'Stage 1 HTN: 130-139/80-89 mmHg — lifestyle + consider medication if 10-year ASCVD risk ≥10%',
        'Stage 2 HTN: ≥140/90 mmHg — lifestyle + two antihypertensives from different classes',
        'First-line agents: thiazide diuretics, ACE inhibitors, ARBs, CCBs',
        'Target: <130/80 mmHg for most adults',
      ],
    },
    {
      title: 'Type 2 Diabetes Management',
      summary: 'ADA Standards of Medical Care in Diabetes',
      details: [
        'A1C target: <7% for most adults; individualize for elderly/comorbid',
        'First-line: Metformin + lifestyle modifications',
        'If A1C above target on metformin: add GLP-1 RA or SGLT2i (especially if ASCVD/HF/CKD)',
        'SGLT2 inhibitors preferred with heart failure or CKD',
        'GLP-1 receptor agonists preferred with established ASCVD',
        'Annual comprehensive foot exam, dilated eye exam, and urine albumin screening',
      ],
    },
    {
      title: 'Sepsis Bundles',
      summary: 'Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock',
      details: [
        'Hour-1 Bundle: Measure lactate; obtain blood cultures before antibiotics',
        'Administer broad-spectrum antibiotics within 1 hour of recognition',
        'Begin rapid administration of 30 mL/kg crystalloid for hypotension or lactate ≥4 mmol/L',
        'Apply vasopressors if hypotensive during or after fluid resuscitation to maintain MAP ≥65 mmHg',
        'Re-measure lactate if initial lactate elevated (>2 mmol/L)',
        'qSOFA: ≥2 of altered mentation, RR ≥22, SBP ≤100',
      ],
    },
    {
      title: 'DVT Prophylaxis',
      summary: 'ACCP Guidelines for VTE Prophylaxis in Hospitalized Patients',
      details: [
        'Assess all hospitalized patients for VTE risk (Padua score for medical, Caprini for surgical)',
        'Low-risk surgical: early ambulation only',
        'Moderate/high-risk surgical: LMWH, low-dose UFH, or fondaparinux',
        'Medical patients with acute illness and reduced mobility: pharmacologic prophylaxis',
        'Mechanical prophylaxis (IPC) when pharmacologic is contraindicated',
        'Extended prophylaxis (up to 35 days) after major orthopedic surgery',
      ],
    },
    {
      title: 'Acute Coronary Syndrome',
      summary: 'ACC/AHA Guidelines for the Management of Patients with Acute Coronary Syndromes',
      details: [
        'STEMI: Door-to-balloon time <90 minutes; activate cath lab immediately',
        'NSTEMI/UA: Risk stratify using TIMI or GRACE score',
        'Dual antiplatelet therapy (DAPT): Aspirin + P2Y12 inhibitor (ticagrelor or clopidogrel)',
        'Anticoagulation: UFH, enoxaparin, or bivalirudin',
        'High-risk NSTEMI: early invasive strategy (within 24 hours)',
        'Post-ACS: statin, beta-blocker, ACEi/ARB, cardiac rehabilitation',
      ],
    },
    {
      title: 'Anticoagulation for Atrial Fibrillation',
      summary: 'ACC/AHA/HRS Guidelines for the Management of Patients with Atrial Fibrillation',
      details: [
        'Use CHA₂DS₂-VASc score to assess stroke risk',
        'Score ≥2 (men) or ≥3 (women): oral anticoagulation recommended',
        'DOACs (apixaban, rivarelbandagoaban, edoxaban) preferred over warfarin for non-valvular AF',
        'Warfarin for mechanical heart valves or moderate-severe mitral stenosis',
        'Assess bleeding risk with HAS-BLED score',
        'LAA occlusion (Watchman) may be considered if long-term anticoagulation contraindicated',
      ],
    },
  ];

  guidelines.forEach(g => {
    const section = document.createElement('div');
    section.style.cssText = 'border-bottom:1px solid var(--border);padding:14px 0;';

    const title = document.createElement('div');
    title.style.cssText = 'font-weight:600;font-size:14px;color:var(--text-primary);cursor:pointer;';
    title.textContent = g.title;

    const summary = document.createElement('div');
    summary.style.cssText = 'font-size:12px;color:var(--text-muted);margin-top:2px;';
    summary.textContent = g.summary;

    const detailsEl = document.createElement('ul');
    detailsEl.style.cssText = 'font-size:13px;color:var(--text-secondary);margin-top:8px;padding-left:20px;display:none;';
    g.details.forEach(d => {
      const li = document.createElement('li');
      li.style.marginBottom = '4px';
      li.textContent = d;
      detailsEl.appendChild(li);
    });

    title.addEventListener('click', () => {
      detailsEl.style.display = detailsEl.style.display === 'none' ? 'block' : 'none';
    });

    section.appendChild(title);
    section.appendChild(summary);
    section.appendChild(detailsEl);
    card.appendChild(section);
  });
}
