/* ============================================================
   views/nursing-assess.js — Nursing Assessments
   Head-to-toe, Braden Scale, Morse Fall Risk
   ============================================================ */

function _injectNursingCSS() {
  if (document.getElementById('na-styles')) return;
  var s = document.createElement('style');
  s.id = 'na-styles';
  s.textContent = [
    '.na-wrap { padding:24px; max-width:1000px; margin:0 auto; }',
    '.na-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }',
    '.na-tabs { display:flex; gap:0; border-bottom:2px solid var(--border,#ddd); margin-bottom:20px; }',
    '.na-tab { padding:10px 20px; cursor:pointer; font-weight:500; border-bottom:2px solid transparent; margin-bottom:-2px; color:var(--text-secondary,#666); }',
    '.na-tab.active { color:var(--primary,#2563eb); border-bottom-color:var(--primary,#2563eb); }',
    '.na-system { background:var(--bg-card,#fff); border:1px solid var(--border,#ddd); border-radius:var(--radius,8px); padding:16px; margin-bottom:12px; }',
    '.na-system h4 { margin:0 0 10px 0; color:var(--primary,#2563eb); }',
    '.na-row { display:flex; gap:16px; flex-wrap:wrap; margin-bottom:8px; }',
    '.na-radio-group { display:flex; gap:12px; align-items:center; }',
    '.na-radio-group label { display:flex; align-items:center; gap:4px; font-size:13px; cursor:pointer; }',
    '.na-abnormal-notes { width:100%; margin-top:6px; padding:6px 8px; border:1px solid var(--border,#ddd); border-radius:4px; font-size:13px; display:none; }',
    '.na-score-card { background:var(--bg-card,#fff); border:1px solid var(--border,#ddd); border-radius:var(--radius,8px); padding:16px; margin-bottom:12px; }',
    '.na-score-row { display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border,#eee); }',
    '.na-score-total { font-size:20px; font-weight:700; padding:12px; text-align:center; border-radius:var(--radius,8px); margin-top:12px; }',
    '.na-risk-low { background:var(--badge-success-bg); color:var(--badge-success-text); }',
    '.na-risk-mod { background:var(--badge-warning-bg); color:var(--badge-warning-text); }',
    '.na-risk-high { background:var(--badge-danger-bg); color:var(--badge-danger-text); }',
    '.na-history { margin-top:20px; }',
    '.na-history-item { background:var(--bg-card,#fff); border:1px solid var(--border,#ddd); border-radius:var(--radius,8px); padding:12px; margin-bottom:8px; }',
    '.na-pain-section { background:var(--bg-card,#fff); border:2px solid var(--primary,#2563eb); border-radius:var(--radius,8px); padding:16px; margin-bottom:12px; }',
    '.na-pain-section h4 { margin:0 0 12px 0; color:var(--primary,#2563eb); }',
    '.na-pain-row { display:flex; gap:16px; flex-wrap:wrap; margin-bottom:10px; align-items:flex-start; }',
    '.na-pain-row label { font-size:13px; font-weight:500; }',
    '.na-pain-quality-group { display:flex; flex-wrap:wrap; gap:10px; margin-top:4px; }',
    '.na-pain-quality-group label { display:flex; align-items:center; gap:4px; font-weight:400; cursor:pointer; }',
    '.na-gcs-section { background:var(--badge-info-bg); border:1px solid var(--primary,#2563eb); border-radius:var(--radius,8px); padding:12px; margin-top:8px; }',
    '.na-gcs-section h5 { margin:0 0 8px 0; color:var(--primary,#2563eb); }',
    '.na-gcs-row { display:flex; gap:16px; flex-wrap:wrap; margin-bottom:8px; }',
    '.na-gcs-total { font-weight:700; font-size:16px; margin-top:8px; padding:6px 12px; background:var(--badge-info-bg); border-radius:4px; display:inline-block; }',
    '.na-pupil-row { display:flex; gap:24px; flex-wrap:wrap; margin-top:10px; }',
    '.na-pupil-group { flex:1; min-width:200px; }',
    '.na-pupil-group h6 { margin:0 0 6px 0; font-size:13px; }'
  ].join('\n');
  document.head.appendChild(s);
}

var NA_SYSTEMS = [
  { key: 'neuro', label: 'Neurological', normals: ['Alert & oriented x4','Pupils equal/reactive','Sensation intact','Motor strength 5/5'], abnormals: ['Confused','Lethargic','Unresponsive','Pupil asymmetry','Weakness','Numbness/tingling'] },
  { key: 'cardio', label: 'Cardiovascular', normals: ['Regular rate/rhythm','Pulses strong/equal','No edema','Cap refill <3s'], abnormals: ['Irregular rhythm','Weak pulses','Edema','Chest pain','JVD'] },
  { key: 'resp', label: 'Respiratory', normals: ['Clear bilateral','Regular unlabored','SpO2 >94%'], abnormals: ['Wheezes','Crackles','Rhonchi','Diminished','Labored','Supplemental O2'] },
  { key: 'gi', label: 'Gastrointestinal', normals: ['Soft/non-tender','Bowel sounds active','Tolerating diet'], abnormals: ['Distended','Tender','Absent bowel sounds','Nausea/vomiting','NPO','Swallow/oral intake difficulty'] },
  { key: 'gu', label: 'Genitourinary', normals: ['Voiding without difficulty','Clear yellow urine'], abnormals: ['Foley catheter','Hematuria','Oliguria','Anuria','Retention'] },
  { key: 'msk', label: 'Musculoskeletal', normals: ['ROM intact','Ambulates independently','Steady gait'], abnormals: ['Limited ROM','Assistive device','Immobile','Contractures','Weakness'] },
  { key: 'skin', label: 'Skin/Wound', normals: ['Warm/dry/intact','No redness or breakdown'], abnormals: ['Pressure injury','Surgical wound','Rash','Bruising','Diaphoretic','Cyanotic'] },
  { key: 'psycho', label: 'Psychosocial', normals: ['Appropriate affect','Cooperative','Support system present'], abnormals: ['Anxious','Depressed','Agitated','Flat affect','Suicidal ideation'] }
];

var NA_PAIN_LOCATIONS = ['Head','Neck','Chest','Abdomen','Back','Upper Extremity','Lower Extremity','Other'];
var NA_PAIN_QUALITIES = ['Sharp','Dull','Burning','Aching','Throbbing','Stabbing'];

var BRADEN_ITEMS = [
  { key: 'sensory', label: 'Sensory Perception', opts: [{v:1,l:'Completely Limited'},{v:2,l:'Very Limited'},{v:3,l:'Slightly Limited'},{v:4,l:'No Impairment'}] },
  { key: 'moisture', label: 'Moisture', opts: [{v:1,l:'Constantly Moist'},{v:2,l:'Very Moist'},{v:3,l:'Occasionally Moist'},{v:4,l:'Rarely Moist'}] },
  { key: 'activity', label: 'Activity', opts: [{v:1,l:'Bedfast'},{v:2,l:'Chairfast'},{v:3,l:'Walks Occasionally'},{v:4,l:'Walks Frequently'}] },
  { key: 'mobility', label: 'Mobility', opts: [{v:1,l:'Completely Immobile'},{v:2,l:'Very Limited'},{v:3,l:'Slightly Limited'},{v:4,l:'No Limitations'}] },
  { key: 'nutrition', label: 'Nutrition', opts: [{v:1,l:'Very Poor'},{v:2,l:'Probably Inadequate'},{v:3,l:'Adequate'},{v:4,l:'Excellent'}] },
  { key: 'friction', label: 'Friction & Shear', opts: [{v:1,l:'Problem'},{v:2,l:'Potential Problem'},{v:3,l:'No Apparent Problem'}] }
];

var MORSE_ITEMS = [
  { key: 'fallHx', label: 'History of Falling (last 3 months)', opts: [{v:0,l:'No'},{v:25,l:'Yes'}] },
  { key: 'secondaryDx', label: 'Secondary Diagnosis', opts: [{v:0,l:'No'},{v:15,l:'Yes'}] },
  { key: 'ambulatoryAid', label: 'Ambulatory Aid', opts: [{v:0,l:'None/Bed Rest/Nurse Assist'},{v:15,l:'Crutches/Cane/Walker'},{v:30,l:'Furniture'}] },
  { key: 'ivAccess', label: 'IV/Heparin Lock', opts: [{v:0,l:'No'},{v:20,l:'Yes'}] },
  { key: 'gait', label: 'Gait', opts: [{v:0,l:'Normal/Bed Rest/Immobile'},{v:10,l:'Weak'},{v:20,l:'Impaired'}] },
  { key: 'mentalStatus', label: 'Mental Status', opts: [{v:0,l:'Oriented to Own Ability'},{v:15,l:'Overestimates/Forgets Limitations'}] }
];

function renderNursingAssess() {
  _injectNursingCSS();
  var app = document.getElementById('app');
  var patients = getPatients();
  var selPid = patients[0] ? patients[0].id : null;
  var activeTab = 'assessment';

  function build(pid) {
    var html = '<div class="na-wrap">';
    html += '<div class="na-header"><h2>Nursing Assessment</h2>';
    html += '<select class="mar-patient-select" id="na-pt-sel">';
    patients.forEach(function(p) {
      html += '<option value="' + p.id + '"' + (p.id === pid ? ' selected' : '') + '>' + esc(p.lastName + ', ' + p.firstName) + '</option>';
    });
    html += '</select></div>';

    html += '<div class="na-tabs">';
    ['assessment','braden','morse','ivaccess','wounds','history'].forEach(function(t) {
      var label = t.charAt(0).toUpperCase() + t.slice(1);
      if (t === 'morse') label = 'Fall Risk';
      if (t === 'ivaccess') label = 'IV Access';
      if (t === 'wounds') label = 'Wounds';
      html += '<div class="na-tab' + (activeTab === t ? ' active' : '') + '" data-tab="' + t + '">' + label + '</div>';
    });
    html += '</div>';

    if (activeTab === 'assessment') {
      // Render non-pain systems
      NA_SYSTEMS.forEach(function(sys) {
        html += '<div class="na-system"><h4>' + sys.label + '</h4>';
        html += '<div class="na-radio-group"><label><input type="radio" name="na-' + sys.key + '" value="normal" checked> Normal</label>';
        html += '<label><input type="radio" name="na-' + sys.key + '" value="abnormal"> Abnormal</label></div>';
        html += '<div class="na-row" style="margin-top:6px;font-size:13px;color:var(--text-secondary,#666)">Normal: ' + sys.normals.join(', ') + '</div>';
        html += '<textarea class="na-abnormal-notes" data-sys="' + sys.key + '" placeholder="Document abnormal findings: ' + sys.abnormals.join(', ') + '"></textarea>';

        // 3h: GCS + pupil documentation for neurological system
        if (sys.key === 'neuro') {
          html += '<div class="na-gcs-section" data-neuro-extra style="display:none">';
          html += '<h5>Glasgow Coma Scale</h5>';
          html += '<div class="na-gcs-row">';
          html += '<label>Eye (1-4):<select class="form-control gcs-sel" id="na-gcs-eye" style="max-width:140px">';
          html += '<option value="4">4 - Spontaneous</option><option value="3">3 - To Voice</option><option value="2">2 - To Pain</option><option value="1">1 - None</option>';
          html += '</select></label>';
          html += '<label>Verbal (1-5):<select class="form-control gcs-sel" id="na-gcs-verbal" style="max-width:160px">';
          html += '<option value="5">5 - Oriented</option><option value="4">4 - Confused</option><option value="3">3 - Inappropriate</option><option value="2">2 - Incomprehensible</option><option value="1">1 - None</option>';
          html += '</select></label>';
          html += '<label>Motor (1-6):<select class="form-control gcs-sel" id="na-gcs-motor" style="max-width:170px">';
          html += '<option value="6">6 - Obeys Commands</option><option value="5">5 - Localizes Pain</option><option value="4">4 - Withdrawal</option><option value="3">3 - Abnormal Flexion</option><option value="2">2 - Extension</option><option value="1">1 - None</option>';
          html += '</select></label>';
          html += '</div>';
          html += '<div class="na-gcs-total" id="na-gcs-total">GCS Total: 15</div>';

          html += '<div class="na-pupil-row">';
          html += '<div class="na-pupil-group"><h6>Left Pupil</h6>';
          html += '<label>Size (mm):<select class="form-control" id="na-pupil-left-size" style="max-width:100px">';
          for (var lp = 1; lp <= 9; lp++) html += '<option value="' + lp + '"' + (lp === 3 ? ' selected' : '') + '>' + lp + ' mm</option>';
          html += '</select></label>';
          html += '<label style="margin-left:8px">Reactivity:<select class="form-control" id="na-pupil-left-react" style="max-width:130px">';
          html += '<option value="Brisk">Brisk</option><option value="Sluggish">Sluggish</option><option value="Fixed">Fixed</option>';
          html += '</select></label>';
          html += '</div>';
          html += '<div class="na-pupil-group"><h6>Right Pupil</h6>';
          html += '<label>Size (mm):<select class="form-control" id="na-pupil-right-size" style="max-width:100px">';
          for (var rp = 1; rp <= 9; rp++) html += '<option value="' + rp + '"' + (rp === 3 ? ' selected' : '') + '>' + rp + ' mm</option>';
          html += '</select></label>';
          html += '<label style="margin-left:8px">Reactivity:<select class="form-control" id="na-pupil-right-react" style="max-width:130px">';
          html += '<option value="Brisk">Brisk</option><option value="Sluggish">Sluggish</option><option value="Fixed">Fixed</option>';
          html += '</select></label>';
          html += '</div>';
          html += '</div>';

          html += '</div>'; // close na-gcs-section
        }

        html += '</div>'; // close na-system
      });

      // 3g: Structured pain section (replaces old Pain entry in NA_SYSTEMS)
      html += '<div class="na-pain-section"><h4>Pain Assessment</h4>';
      html += '<div class="na-pain-row">';
      html += '<label>Score (0-10):<select class="form-control" id="na-pain-score" style="max-width:80px">';
      for (var ps = 0; ps <= 10; ps++) html += '<option value="' + ps + '">' + ps + '</option>';
      html += '</select></label>';
      html += '<label>Location:<select class="form-control" id="na-pain-location" style="max-width:180px">';
      html += '<option value="">-- Select --</option>';
      NA_PAIN_LOCATIONS.forEach(function(loc) { html += '<option value="' + loc + '">' + esc(loc) + '</option>'; });
      html += '</select></label>';
      html += '</div>';

      html += '<div class="na-pain-row"><div><label>Quality:</label>';
      html += '<div class="na-pain-quality-group">';
      NA_PAIN_QUALITIES.forEach(function(q) {
        html += '<label><input type="checkbox" class="na-pain-quality-cb" value="' + q + '"> ' + q + '</label>';
      });
      html += '</div></div></div>';

      html += '<div class="na-pain-row">';
      html += '<div><label>Timing:</label><div class="na-radio-group" style="margin-top:4px">';
      html += '<label><input type="radio" name="na-pain-timing" value="Constant"> Constant</label>';
      html += '<label><input type="radio" name="na-pain-timing" value="Intermittent" checked> Intermittent</label>';
      html += '</div></div>';
      html += '</div>';

      html += '<div class="na-pain-row">';
      html += '<label>Reassessment Due:<input type="datetime-local" class="form-control" id="na-pain-reassess" style="max-width:240px"></label>';
      html += '</div>';

      html += '</div>'; // close na-pain-section

      html += '<button class="btn btn-primary" id="na-save-assess" style="margin-top:12px">Save Assessment</button>';
    } else if (activeTab === 'braden') {
      html += '<div class="na-score-card"><h3>Braden Scale \u2014 Pressure Injury Risk</h3>';
      BRADEN_ITEMS.forEach(function(item) {
        html += '<div class="na-score-row"><strong>' + item.label + '</strong><select class="form-control braden-sel" data-key="' + item.key + '" style="max-width:250px">';
        item.opts.forEach(function(o) { html += '<option value="' + o.v + '">' + o.l + ' (' + o.v + ')</option>'; });
        html += '</select></div>';
      });
      html += '<div class="na-score-total" id="braden-total">Score: 6 \u2014 High Risk</div>';
      html += '<button class="btn btn-primary" id="na-save-braden" style="margin-top:12px">Save Braden Score</button></div>';
    } else if (activeTab === 'morse') {
      html += '<div class="na-score-card"><h3>Morse Fall Scale</h3>';
      MORSE_ITEMS.forEach(function(item) {
        html += '<div class="na-score-row"><strong>' + item.label + '</strong><select class="form-control morse-sel" data-key="' + item.key + '" style="max-width:280px">';
        item.opts.forEach(function(o) { html += '<option value="' + o.v + '">' + o.l + ' (' + o.v + ')</option>'; });
        html += '</select></div>';
      });
      html += '<div class="na-score-total" id="morse-total">Score: 0 \u2014 Low Risk</div>';
      html += '<button class="btn btn-primary" id="na-save-morse" style="margin-top:12px">Save Fall Risk Score</button></div>';
    } else if (activeTab === 'ivaccess') {
      // 8k: IV/Vascular Access Documentation
      html += '<div class="na-score-card"><h3>IV / Vascular Access Documentation</h3>';
      html += '<div class="na-row" style="gap:12px">';
      html += '<div class="form-group" style="flex:1;min-width:160px"><label class="form-label">Access Type</label>';
      html += '<select class="form-control" id="iv-type"><option value="">-- Select --</option>';
      ['PIV','PICC','Central','Arterial','Midline','Foley'].forEach(function(t) { html += '<option value="' + t + '">' + t + '</option>'; });
      html += '</select></div>';
      html += '<div class="form-group" style="flex:1;min-width:160px"><label class="form-label">Insertion Date</label>';
      html += '<input type="date" class="form-control" id="iv-insert-date"></div>';
      html += '<div class="form-group" style="flex:1;min-width:160px"><label class="form-label">Site</label>';
      html += '<input type="text" class="form-control" id="iv-site" placeholder="e.g., Right AC, Left SC"></div>';
      html += '</div>';
      html += '<div class="na-row" style="gap:12px">';
      html += '<div class="form-group" style="flex:1;min-width:160px"><label class="form-label">Gauge (PIV only)</label>';
      html += '<select class="form-control" id="iv-gauge"><option value="">N/A</option>';
      ['14G','16G','18G','20G','22G','24G'].forEach(function(g) { html += '<option value="' + g + '">' + g + '</option>'; });
      html += '</select></div>';
      html += '<div class="form-group" style="flex:1;min-width:160px"><label class="form-label">Patency</label>';
      html += '<select class="form-control" id="iv-patency"><option value="Patent">Patent</option><option value="Occluded">Occluded</option></select></div>';
      html += '<div class="form-group" style="flex:1;min-width:160px"><label class="form-label">Site Appearance</label>';
      html += '<select class="form-control" id="iv-appearance"><option value="Clean">Clean</option><option value="Redness">Redness</option><option value="Swelling">Swelling</option><option value="Drainage">Drainage</option></select></div>';
      html += '</div>';
      html += '<div class="na-row" style="gap:12px">';
      html += '<div class="form-group" style="flex:1;min-width:200px"><label class="form-label">Dressing</label>';
      html += '<select class="form-control" id="iv-dressing"><option value="Clean/Dry/Intact">Clean/Dry/Intact</option><option value="Soiled">Soiled</option><option value="Due for change">Due for change</option></select></div>';
      html += '</div>';
      html += '<button class="btn btn-primary" id="iv-save" style="margin-top:12px">Save IV Access Doc</button>';
      html += '</div>';

      // IV Access History
      var ivDocs = typeof getIVAccessDocs === 'function' ? getIVAccessDocs(pid).sort(function(a,b) { return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); }) : [];
      if (ivDocs.length > 0) {
        html += '<div class="na-history" style="margin-top:16px"><h3>IV Access History</h3>';
        ivDocs.forEach(function(doc) {
          var insertDate = doc.insertionDate ? new Date(doc.insertionDate) : null;
          var daysIn = insertDate ? Math.floor((new Date() - insertDate) / 86400000) : 0;
          var rotationWarning = '';
          if (doc.accessType === 'PIV' && daysIn > 3) {
            rotationWarning = daysIn > 4
              ? '<span style="color:var(--badge-danger-text);font-weight:700;margin-left:8px">CRITICAL: >' + daysIn + ' days — rotate immediately</span>'
              : '<span style="color:var(--badge-warning-text);font-weight:700;margin-left:8px">REMINDER: >' + daysIn + ' days — consider rotation</span>';
          }
          html += '<div class="na-history-item">';
          html += '<strong>' + esc(doc.accessType || '') + '</strong> — ' + esc(doc.site || '') + (doc.gauge ? ' (' + esc(doc.gauge) + ')' : '');
          html += rotationWarning;
          html += '<div style="font-size:12px;color:var(--text-secondary,#666);margin-top:4px">';
          html += 'Inserted: ' + (doc.insertionDate || '—') + ' | Patency: ' + esc(doc.patency || '') + ' | Appearance: ' + esc(doc.siteAppearance || '') + ' | Dressing: ' + esc(doc.dressing || '');
          html += '<br>Documented: ' + formatDateTime(doc.createdAt);
          html += '</div></div>';
        });
        html += '</div>';
      }

    } else if (activeTab === 'wounds') {
      // 8l: Wound Assessment Module
      html += '<div class="na-score-card"><h3>Wound Assessment</h3>';
      html += '<div class="na-row" style="gap:12px">';
      html += '<div class="form-group" style="flex:1;min-width:180px"><label class="form-label">Wound Type</label>';
      html += '<select class="form-control" id="wound-type"><option value="">-- Select --</option>';
      ['Pressure Injury','Surgical','Traumatic','Diabetic','Venous','Arterial'].forEach(function(t) { html += '<option value="' + t + '">' + t + '</option>'; });
      html += '</select></div>';
      html += '<div class="form-group" style="flex:1;min-width:180px"><label class="form-label">Location</label>';
      html += '<input type="text" class="form-control" id="wound-location" placeholder="e.g., Sacrum, Left heel"></div>';
      html += '</div>';

      html += '<div class="na-row" style="gap:12px">';
      html += '<div class="form-group" style="flex:1"><label class="form-label">Length (cm)</label><input type="number" step="0.1" class="form-control" id="wound-length" placeholder="cm"></div>';
      html += '<div class="form-group" style="flex:1"><label class="form-label">Width (cm)</label><input type="number" step="0.1" class="form-control" id="wound-width" placeholder="cm"></div>';
      html += '<div class="form-group" style="flex:1"><label class="form-label">Depth (cm)</label><input type="number" step="0.1" class="form-control" id="wound-depth" placeholder="cm"></div>';
      html += '</div>';

      html += '<div class="na-row" style="gap:12px">';
      html += '<div class="form-group" style="flex:1"><label class="form-label">Granulation %</label><input type="number" class="form-control" id="wound-granulation" min="0" max="100" placeholder="%"></div>';
      html += '<div class="form-group" style="flex:1"><label class="form-label">Slough %</label><input type="number" class="form-control" id="wound-slough" min="0" max="100" placeholder="%"></div>';
      html += '<div class="form-group" style="flex:1"><label class="form-label">Eschar %</label><input type="number" class="form-control" id="wound-eschar" min="0" max="100" placeholder="%"></div>';
      html += '</div>';

      html += '<div class="na-row" style="gap:12px">';
      html += '<div class="form-group" style="flex:1;min-width:180px"><label class="form-label">Drainage Type</label>';
      html += '<select class="form-control" id="wound-drainage-type"><option value="Serous">Serous</option><option value="Sanguineous">Sanguineous</option><option value="Serosanguineous">Serosanguineous</option><option value="Purulent">Purulent</option></select></div>';
      html += '<div class="form-group" style="flex:1;min-width:180px"><label class="form-label">Drainage Amount</label>';
      html += '<select class="form-control" id="wound-drainage-amt"><option value="None">None</option><option value="Scant">Scant</option><option value="Small">Small</option><option value="Moderate">Moderate</option><option value="Large">Large</option></select></div>';
      html += '</div>';

      html += '<div class="na-row" style="gap:12px">';
      html += '<div class="form-group" style="flex:1;min-width:200px"><label class="form-label">Surrounding Skin</label>';
      html += '<select class="form-control" id="wound-surr-skin"><option value="Intact">Intact</option><option value="Macerated">Macerated</option><option value="Erythematous">Erythematous</option><option value="Indurated">Indurated</option></select></div>';
      html += '</div>';

      html += '<div class="form-group"><label class="form-label">Treatment Applied</label>';
      html += '<textarea class="form-control" id="wound-treatment" rows="2" placeholder="Describe wound care performed..."></textarea></div>';

      html += '<div class="form-group"><label class="form-label">Photo Note</label>';
      html += '<input type="text" class="form-control" id="wound-photo-note" placeholder="Photo reference/documentation note"></div>';

      html += '<button class="btn btn-primary" id="wound-save" style="margin-top:8px">Save Wound Assessment</button>';
      html += '</div>';

      // Wound History with measurement tracking
      var wounds = typeof getWoundAssessments === 'function' ? getWoundAssessments(pid).sort(function(a,b) { return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); }) : [];
      if (wounds.length > 0) {
        // Group by location for tracking
        var byLocation = {};
        wounds.forEach(function(w) {
          var loc = (w.woundType || '') + ' — ' + (w.location || 'Unknown');
          if (!byLocation[loc]) byLocation[loc] = [];
          byLocation[loc].push(w);
        });
        html += '<div class="na-history" style="margin-top:16px"><h3>Wound History</h3>';
        Object.keys(byLocation).forEach(function(loc) {
          html += '<div class="na-history-item"><strong>' + esc(loc) + '</strong>';
          html += '<div style="margin-top:8px;font-size:12px">';
          html += '<table class="table" style="font-size:12px"><thead><tr><th>Date</th><th>L x W x D (cm)</th><th>Gran %</th><th>Drainage</th><th>Skin</th></tr></thead><tbody>';
          byLocation[loc].forEach(function(w) {
            html += '<tr>';
            html += '<td>' + formatDateTime(w.createdAt) + '</td>';
            html += '<td>' + (w.length || '—') + ' x ' + (w.width || '—') + ' x ' + (w.depth || '—') + '</td>';
            html += '<td>' + (w.granulation || '—') + '</td>';
            html += '<td>' + esc(w.drainageType || '') + ' / ' + esc(w.drainageAmount || '') + '</td>';
            html += '<td>' + esc(w.surroundingSkin || '') + '</td>';
            html += '</tr>';
          });
          html += '</tbody></table></div></div>';
        });
        html += '</div>';
      }

    } else if (activeTab === 'history') {
      var assessments = getNursingAssessments(pid).sort(function(a,b) { return b.createdAt > a.createdAt ? 1 : -1; });
      html += '<div class="na-history"><h3>Assessment History</h3>';
      if (!assessments.length) html += '<p style="color:var(--text-secondary,#666)">No assessments recorded</p>';
      assessments.forEach(function(a) {
        html += '<div class="na-history-item"><strong>' + esc(a.type || 'Assessment') + '</strong> \u2014 ' + formatDateTime(a.createdAt);
        if (a.score !== undefined) html += ' \u2014 Score: ' + a.score;
        if (a.notes) html += '<div style="margin-top:4px;font-size:13px;color:var(--text-secondary,#666)">' + esc(a.notes) + '</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    html += '</div>';
    app.innerHTML = html;

    // Wire events
    document.getElementById('na-pt-sel').addEventListener('change', function() { selPid = this.value; build(this.value); });
    app.querySelectorAll('.na-tab').forEach(function(tab) {
      tab.addEventListener('click', function() { activeTab = this.getAttribute('data-tab'); build(pid); });
    });

    // Show/hide abnormal notes + 3h neuro extra fields
    app.querySelectorAll('input[type="radio"]').forEach(function(r) {
      r.addEventListener('change', function() {
        var sys = this.name.replace('na-', '');
        var notes = app.querySelector('.na-abnormal-notes[data-sys="' + sys + '"]');
        if (notes) notes.style.display = this.value === 'abnormal' ? 'block' : 'none';
        // 3h: Show/hide GCS + pupil section for neuro
        if (sys === 'neuro') {
          var neuroExtra = app.querySelector('[data-neuro-extra]');
          if (neuroExtra) neuroExtra.style.display = this.value === 'abnormal' ? 'block' : 'none';
        }
      });
    });

    // 3h: GCS auto-calculation
    app.querySelectorAll('.gcs-sel').forEach(function(sel) {
      sel.addEventListener('change', function() {
        var eye = parseInt(document.getElementById('na-gcs-eye').value) || 0;
        var verbal = parseInt(document.getElementById('na-gcs-verbal').value) || 0;
        var motor = parseInt(document.getElementById('na-gcs-motor').value) || 0;
        var total = eye + verbal + motor;
        var el = document.getElementById('na-gcs-total');
        if (el) el.textContent = 'GCS Total: ' + total;
      });
    });

    // Braden calculation
    app.querySelectorAll('.braden-sel').forEach(function(sel) {
      sel.addEventListener('change', function() {
        var total = 0;
        app.querySelectorAll('.braden-sel').forEach(function(s) { total += parseInt(s.value); });
        var risk = total <= 9 ? 'High Risk' : total <= 12 ? 'Moderate Risk' : total <= 14 ? 'Mild Risk' : 'Low Risk';
        var cls = total <= 12 ? 'na-risk-high' : total <= 14 ? 'na-risk-mod' : 'na-risk-low';
        var el = document.getElementById('braden-total');
        el.textContent = 'Score: ' + total + ' \u2014 ' + risk;
        el.className = 'na-score-total ' + cls;
      });
    });

    // Morse calculation
    app.querySelectorAll('.morse-sel').forEach(function(sel) {
      sel.addEventListener('change', function() {
        var total = 0;
        app.querySelectorAll('.morse-sel').forEach(function(s) { total += parseInt(s.value); });
        var risk = total >= 45 ? 'High Risk' : total >= 25 ? 'Moderate Risk' : 'Low Risk';
        var cls = total >= 45 ? 'na-risk-high' : total >= 25 ? 'na-risk-mod' : 'na-risk-low';
        var el = document.getElementById('morse-total');
        el.textContent = 'Score: ' + total + ' \u2014 ' + risk;
        el.className = 'na-score-total ' + cls;
      });
    });

    // Save buttons
    var saveAssess = document.getElementById('na-save-assess');
    if (saveAssess) saveAssess.addEventListener('click', function() {
      var findings = {};
      NA_SYSTEMS.forEach(function(sys) {
        var val = app.querySelector('input[name="na-' + sys.key + '"]:checked');
        var status = val ? val.value : 'normal';
        // 3f: Persist normal findings
        if (status === 'normal') {
          findings[sys.key] = { status: 'normal', normals: sys.normals, notes: '' };
        } else {
          var ta = app.querySelector('.na-abnormal-notes[data-sys="' + sys.key + '"]');
          findings[sys.key] = { status: 'abnormal', notes: ta ? ta.value : '' };
        }
        // 3h: If neuro is abnormal, capture GCS + pupil data
        if (sys.key === 'neuro' && status === 'abnormal') {
          var gcsEye = document.getElementById('na-gcs-eye');
          var gcsVerbal = document.getElementById('na-gcs-verbal');
          var gcsMotor = document.getElementById('na-gcs-motor');
          if (gcsEye && gcsVerbal && gcsMotor) {
            var eye = parseInt(gcsEye.value) || 0;
            var verbal = parseInt(gcsVerbal.value) || 0;
            var motor = parseInt(gcsMotor.value) || 0;
            findings.neuro.gcs = { eye: eye, verbal: verbal, motor: motor, total: eye + verbal + motor };
          }
          var plSize = document.getElementById('na-pupil-left-size');
          var plReact = document.getElementById('na-pupil-left-react');
          var prSize = document.getElementById('na-pupil-right-size');
          var prReact = document.getElementById('na-pupil-right-react');
          if (plSize && plReact && prSize && prReact) {
            findings.neuro.pupils = {
              left: { size: parseInt(plSize.value), reactivity: plReact.value },
              right: { size: parseInt(prSize.value), reactivity: prReact.value }
            };
          }
        }
      });

      // 3g: Capture structured pain data
      var painScore = parseInt(document.getElementById('na-pain-score').value) || 0;
      var painLocation = document.getElementById('na-pain-location').value;
      var painQualities = [];
      app.querySelectorAll('.na-pain-quality-cb:checked').forEach(function(cb) { painQualities.push(cb.value); });
      var painTimingEl = app.querySelector('input[name="na-pain-timing"]:checked');
      var painTiming = painTimingEl ? painTimingEl.value : 'Intermittent';
      var painReassess = document.getElementById('na-pain-reassess').value || '';

      findings.pain = {
        status: painScore > 0 ? 'abnormal' : 'normal',
        score: painScore,
        location: painLocation,
        quality: painQualities,
        timing: painTiming,
        reassessmentDue: painReassess,
        notes: ''
      };

      saveNursingAssessment({ patientId: pid, type: 'Head-to-Toe', findings: findings, nurse: getSessionUser().id });
      showToast('Assessment saved', 'success');

      // WS8f: SLP consult suggestion if GI abnormal with swallow difficulty
      if (findings.gi && findings.gi.status === 'abnormal') {
        var giNotes = (findings.gi.notes || '').toLowerCase();
        if (giNotes.indexOf('swallow') !== -1 || giNotes.indexOf('dysphagia') !== -1 || giNotes.indexOf('oral intake') !== -1 || giNotes.indexOf('difficulty') !== -1 || giNotes.indexOf('aspiration') !== -1) {
          var slpSuggBanner = document.createElement('div');
          slpSuggBanner.id = 'ws8f-slp-suggest';
          slpSuggBanner.style.cssText = 'background:var(--badge-warning-bg);border:1px solid var(--badge-warning-border);border-radius:var(--radius,8px);padding:10px 16px;margin:12px 0;display:flex;justify-content:space-between;align-items:center;font-size:13px';
          slpSuggBanner.innerHTML = '<span style="color:var(--badge-warning-text);font-weight:600">Consider SLP consult for dysphagia evaluation</span>';
          var slpOrderBtn = document.createElement('button');
          slpOrderBtn.className = 'btn btn-primary btn-sm';
          slpOrderBtn.textContent = 'Order SLP Consult';
          slpOrderBtn.addEventListener('click', function() {
            var latestEnc = getEncounters().filter(function(e) { return e.patientId === pid; }).sort(function(a, b) { return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); })[0];
            saveOrder({ patientId: pid, encounterId: latestEnc ? latestEnc.id : '', type: 'Consult', detail: { service: 'Speech-Language Pathology', reason: 'GI assessment - swallow/oral intake difficulty noted' }, priority: 'Routine', orderedBy: getSessionUser().id });
            showToast('SLP Consult ordered', 'success');
            slpSuggBanner.remove();
          });
          slpSuggBanner.appendChild(slpOrderBtn);
          var assessSection = app.querySelector('.na-pain-section');
          if (assessSection) assessSection.parentNode.insertBefore(slpSuggBanner, assessSection.nextSibling);
        }
      }

      activeTab = 'history'; build(pid);
    });

    var saveBraden = document.getElementById('na-save-braden');
    if (saveBraden) saveBraden.addEventListener('click', function() {
      var total = 0;
      var details = {};
      app.querySelectorAll('.braden-sel').forEach(function(s) {
        total += parseInt(s.value);
        details[s.getAttribute('data-key')] = parseInt(s.value);
      });
      saveNursingAssessment({ patientId: pid, type: 'Braden Scale', score: total, details: details, nurse: getSessionUser().id });
      // 3i: Store risk-summary for downstream integration
      saveNursingAssessment({ patientId: pid, type: 'risk-summary', latestBraden: total, bradenTimestamp: new Date().toISOString(), nurse: getSessionUser().id });
      showToast('Braden score saved', 'success');
      activeTab = 'history'; build(pid);
    });

    var saveMorse = document.getElementById('na-save-morse');
    if (saveMorse) saveMorse.addEventListener('click', function() {
      var total = 0;
      var details = {};
      app.querySelectorAll('.morse-sel').forEach(function(s) {
        total += parseInt(s.value);
        details[s.getAttribute('data-key')] = parseInt(s.value);
      });
      saveNursingAssessment({ patientId: pid, type: 'Morse Fall Risk', score: total, details: details, nurse: getSessionUser().id });
      // 3i: Store risk-summary for downstream integration
      saveNursingAssessment({ patientId: pid, type: 'risk-summary', latestMorse: total, morseTimestamp: new Date().toISOString(), nurse: getSessionUser().id });
      showToast('Fall risk score saved', 'success');

      // WS8f: PT consult suggestion if Morse >= 25
      if (total >= 25) {
        var hasPTConsult = false;
        try {
          var ptOrders = (typeof getOrdersByPatient === 'function' ? getOrdersByPatient(pid) : getOrders().filter(function(o) { return o.patientId === pid; }));
          hasPTConsult = ptOrders.some(function(o) { return o.type === 'Consult' && o.detail && o.detail.service === 'Physical Therapy' && o.status !== 'Cancelled' && o.status !== 'Completed'; });
        } catch(e) { /* no-op */ }
        if (!hasPTConsult) {
          var suggBanner = document.createElement('div');
          suggBanner.id = 'ws8f-pt-suggest';
          suggBanner.style.cssText = 'background:var(--badge-warning-bg);border:1px solid var(--badge-warning-border);border-radius:var(--radius,8px);padding:10px 16px;margin:12px 0;display:flex;justify-content:space-between;align-items:center;font-size:13px';
          suggBanner.innerHTML = '<span style="color:var(--badge-warning-text);font-weight:600">Fall Risk \u226525 \u2014 Consider PT consult for fall prevention</span>';
          var orderBtn = document.createElement('button');
          orderBtn.className = 'btn btn-primary btn-sm';
          orderBtn.textContent = 'Order PT Consult';
          orderBtn.addEventListener('click', function() {
            var latestEnc = getEncounters().filter(function(e) { return e.patientId === pid; }).sort(function(a, b) { return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); })[0];
            saveOrder({ patientId: pid, encounterId: latestEnc ? latestEnc.id : '', type: 'Consult', detail: { service: 'Physical Therapy', reason: 'Fall risk assessment - Morse score ' + total }, priority: 'Routine', orderedBy: getSessionUser().id });
            showToast('PT Consult ordered', 'success');
            suggBanner.remove();
          });
          suggBanner.appendChild(orderBtn);
          var morseCard = app.querySelector('.na-score-card');
          if (morseCard) morseCard.parentNode.insertBefore(suggBanner, morseCard.nextSibling);
        }
      }

      activeTab = 'history'; build(pid);
    });

    // 8k: IV Access save
    var saveIV = document.getElementById('iv-save');
    if (saveIV) saveIV.addEventListener('click', function() {
      var accessType = document.getElementById('iv-type').value;
      if (!accessType) { showToast('Select an access type.', 'error'); return; }
      saveIVAccessDoc({
        patientId: pid,
        accessType: accessType,
        insertionDate: document.getElementById('iv-insert-date').value || '',
        site: document.getElementById('iv-site').value || '',
        gauge: document.getElementById('iv-gauge').value || '',
        patency: document.getElementById('iv-patency').value || 'Patent',
        siteAppearance: document.getElementById('iv-appearance').value || 'Clean',
        dressing: document.getElementById('iv-dressing').value || 'Clean/Dry/Intact',
        nurse: getSessionUser().id,
      });
      showToast('IV access documentation saved.', 'success');
      activeTab = 'ivaccess'; build(pid);
    });

    // 8l: Wound Assessment save
    var saveWound = document.getElementById('wound-save');
    if (saveWound) saveWound.addEventListener('click', function() {
      var woundType = document.getElementById('wound-type').value;
      if (!woundType) { showToast('Select a wound type.', 'error'); return; }
      saveWoundAssessment({
        patientId: pid,
        woundType: woundType,
        location: document.getElementById('wound-location').value || '',
        length: parseFloat(document.getElementById('wound-length').value) || null,
        width: parseFloat(document.getElementById('wound-width').value) || null,
        depth: parseFloat(document.getElementById('wound-depth').value) || null,
        granulation: parseInt(document.getElementById('wound-granulation').value) || null,
        slough: parseInt(document.getElementById('wound-slough').value) || null,
        eschar: parseInt(document.getElementById('wound-eschar').value) || null,
        drainageType: document.getElementById('wound-drainage-type').value || '',
        drainageAmount: document.getElementById('wound-drainage-amt').value || '',
        surroundingSkin: document.getElementById('wound-surr-skin').value || '',
        treatment: document.getElementById('wound-treatment').value || '',
        photoNote: document.getElementById('wound-photo-note').value || '',
        nurse: getSessionUser().id,
      });
      showToast('Wound assessment saved.', 'success');
      activeTab = 'wounds'; build(pid);
    });
  }

  if (selPid) build(selPid);
  else app.innerHTML = '<div style="padding:40px;text-align:center"><h2>No patients found</h2></div>';
}
