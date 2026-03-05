/* ============================================================
   views/smart-phrases.js — SmartPhrases / Dot-Phrase System
   ============================================================ */

/* ---------- Default System Phrases ---------- */
var SMART_PHRASES_DEFAULT = [
  {
    id: 'sp-sys-hpi', abbreviation: '.hpi', title: 'History of Present Illness',
    content: 'Patient presents with [chief complaint]. Symptoms began [duration] ago. The symptoms are described as [quality] and are [severity] in severity. Aggravating factors include [aggravating factors]. Relieving factors include [relieving factors]. Associated symptoms include [associated symptoms]. Patient denies [pertinent negatives].',
    category: 'HPI', createdBy: 'system', isSystem: true, autoExpand: false
  },
  {
    id: 'sp-sys-ros', abbreviation: '.ros', title: 'Review of Systems',
    content: 'Constitutional: No fever, chills, weight loss, or fatigue.\nHEENT: No headache, vision changes, hearing loss, sore throat.\nCardiovascular: No chest pain, palpitations, or edema.\nPulmonary: No shortness of breath, cough, or wheezing.\nGI: No nausea, vomiting, diarrhea, or abdominal pain.\nGU: No dysuria, frequency, or hematuria.\nMusculoskeletal: No joint pain, swelling, or stiffness.\nNeurological: No dizziness, weakness, numbness, or tingling.\nPsychiatric: No depression, anxiety, or sleep disturbance.\nSkin: No rashes, lesions, or pruritus.',
    category: 'ROS', createdBy: 'system', isSystem: true, autoExpand: false
  },
  {
    id: 'sp-sys-pe', abbreviation: '.pe', title: 'Physical Exam',
    content: 'General: Alert, oriented, no acute distress.\nHEENT: Normocephalic, atraumatic. PERRL. Oropharynx clear.\nNeck: Supple, no lymphadenopathy, no JVD.\nCardiovascular: Regular rate and rhythm, no murmurs, gallops, or rubs.\nPulmonary: Clear to auscultation bilaterally, no wheezes, rales, or rhonchi.\nAbdomen: Soft, non-tender, non-distended, normoactive bowel sounds.\nExtremities: No clubbing, cyanosis, or edema.\nNeurological: Alert and oriented x3, cranial nerves II-XII intact.\nSkin: Warm, dry, intact, no rashes.',
    category: 'PE', createdBy: 'system', isSystem: true, autoExpand: false
  },
  {
    id: 'sp-sys-ap', abbreviation: '.ap', title: 'Assessment & Plan',
    content: 'Assessment:\n1. [Diagnosis]\n\nPlan:\n1. [Treatment plan]\n2. [Medications/orders]\n3. Follow up in [timeframe]\n4. Return precautions discussed',
    category: 'A/P', createdBy: 'system', isSystem: true, autoExpand: false
  },
  {
    id: 'sp-sys-normal', abbreviation: '.normal', title: 'Normal / WNL',
    content: 'Within normal limits',
    category: 'General', createdBy: 'system', isSystem: true, autoExpand: false
  },
  {
    id: 'sp-sys-wnl', abbreviation: '.wnl', title: 'Within Normal Limits',
    content: 'Within normal limits',
    category: 'General', createdBy: 'system', isSystem: true, autoExpand: false
  },
  {
    id: 'sp-sys-nad', abbreviation: '.nad', title: 'No Acute Distress',
    content: 'No acute distress',
    category: 'General', createdBy: 'system', isSystem: true, autoExpand: false
  },
  {
    id: 'sp-sys-cardiovascular', abbreviation: '.cardiovascular', title: 'Cardiovascular Exam',
    content: 'Regular rate and rhythm, no murmurs/gallops/rubs, no peripheral edema',
    category: 'PE', createdBy: 'system', isSystem: true, autoExpand: false
  },
  {
    id: 'sp-sys-pulmonary', abbreviation: '.pulmonary', title: 'Pulmonary Exam',
    content: 'Clear to auscultation bilaterally, no wheezes/rales/rhonchi',
    category: 'PE', createdBy: 'system', isSystem: true, autoExpand: false
  },
  {
    id: 'sp-sys-abdomen', abbreviation: '.abdomen', title: 'Abdominal Exam',
    content: 'Soft, non-tender, non-distended, normoactive bowel sounds',
    category: 'PE', createdBy: 'system', isSystem: true, autoExpand: false
  },
  {
    id: 'sp-sys-neuro', abbreviation: '.neuro', title: 'Neurological Exam',
    content: 'Alert and oriented x3, cranial nerves II-XII intact, strength 5/5 all extremities',
    category: 'PE', createdBy: 'system', isSystem: true, autoExpand: false
  },
  {
    id: 'sp-sys-skin', abbreviation: '.skin', title: 'Skin Exam',
    content: 'Warm, dry, intact, no rashes or lesions',
    category: 'PE', createdBy: 'system', isSystem: true, autoExpand: false
  },
  {
    id: 'sp-sys-psych', abbreviation: '.psych', title: 'Psychiatric Exam',
    content: 'Normal mood and affect, normal judgment and insight',
    category: 'PE', createdBy: 'system', isSystem: true, autoExpand: false
  },
  {
    id: 'sp-sys-fuhpi', abbreviation: '.fuhpi', title: 'Follow Up Instructions',
    content: 'Follow up as needed. Return to clinic if symptoms worsen or new symptoms develop.',
    category: 'General', createdBy: 'system', isSystem: true, autoExpand: false
  },
  {
    id: 'sp-sys-discharge', abbreviation: '.discharge', title: 'Discharge Summary',
    content: 'Patient is stable for discharge. Follow-up appointment scheduled. Discharge instructions provided and patient verbalized understanding.',
    category: 'General', createdBy: 'system', isSystem: true, autoExpand: false
  },
  {
    id: 'sp-sys-medrec', abbreviation: '.medrec', title: 'Medication Reconciliation',
    content: 'Medication reconciliation performed. Home medications reviewed with patient.',
    category: 'General', createdBy: 'system', isSystem: true, autoExpand: false
  },
  {
    id: 'sp-sys-consent', abbreviation: '.consent', title: 'Informed Consent',
    content: 'Risks, benefits, and alternatives discussed with patient. Patient verbalized understanding and consented to proceed.',
    category: 'General', createdBy: 'system', isSystem: true, autoExpand: false
  },
  {
    id: 'sp-sys-avs', abbreviation: '.avs', title: 'After Visit Summary',
    content: 'After Visit Summary provided. Questions answered.',
    category: 'General', createdBy: 'system', isSystem: true, autoExpand: false
  },
  {
    id: 'sp-sys-vitals', abbreviation: '.vitals', title: 'Patient Vitals (Auto)',
    content: '[AUTO-EXPAND: inserts current patient vitals if available]',
    category: 'Auto', createdBy: 'system', isSystem: true, autoExpand: true
  },
  {
    id: 'sp-sys-allergies', abbreviation: '.allergies', title: 'Patient Allergies (Auto)',
    content: '[AUTO-EXPAND: inserts current patient allergies if available]',
    category: 'Auto', createdBy: 'system', isSystem: true, autoExpand: true
  },
  {
    id: 'sp-sys-meds', abbreviation: '.meds', title: 'Patient Medications (Auto)',
    content: '[AUTO-EXPAND: inserts current patient medication list]',
    category: 'Auto', createdBy: 'system', isSystem: true, autoExpand: true
  },
  {
    id: 'sp-sys-problems', abbreviation: '.problems', title: 'Patient Problems (Auto)',
    content: '[AUTO-EXPAND: inserts current patient problem list]',
    category: 'Auto', createdBy: 'system', isSystem: true, autoExpand: true
  }
];

/* ---------- CRUD ---------- */

function getSmartPhrases() {
  var userPhrases = loadAll(KEYS.smartPhrases);
  return SMART_PHRASES_DEFAULT.concat(userPhrases);
}

function saveSmartPhrase(phrase) {
  var all = loadAll(KEYS.smartPhrases, true);
  if (!phrase.id) phrase.id = generateId();
  phrase.createdBy = phrase.createdBy || getSessionUser().id;
  phrase.isSystem = false;
  var idx = all.findIndex(function(p) { return p.id === phrase.id; });
  if (idx >= 0) {
    all[idx] = Object.assign({}, all[idx], phrase);
  } else {
    all.push(phrase);
  }
  saveAll(KEYS.smartPhrases, all);
  return phrase;
}

function deleteSmartPhrase(id) {
  var phrase = SMART_PHRASES_DEFAULT.find(function(p) { return p.id === id; });
  if (phrase) return false; // cannot delete system phrases
  var all = loadAll(KEYS.smartPhrases, true);
  var filtered = all.filter(function(p) { return p.id !== id; });
  saveAll(KEYS.smartPhrases, filtered);
  return true;
}

function searchSmartPhrases(query) {
  if (!query) return getSmartPhrases();
  var q = query.toLowerCase();
  return getSmartPhrases().filter(function(p) {
    return p.abbreviation.toLowerCase().indexOf(q) >= 0 ||
           p.title.toLowerCase().indexOf(q) >= 0;
  });
}

function expandSmartPhrase(abbreviation, patientId) {
  var abbr = abbreviation.toLowerCase();
  var phrases = getSmartPhrases();
  var phrase = phrases.find(function(p) { return p.abbreviation.toLowerCase() === abbr; });
  if (!phrase) return null;

  if (!phrase.autoExpand) return phrase.content;

  // Dynamic auto-expand phrases
  var pid = patientId || (typeof _currentChartPatientId !== 'undefined' ? _currentChartPatientId : null);

  if (abbr === '.vitals') {
    return _expandVitals(pid);
  } else if (abbr === '.allergies') {
    return _expandAllergies(pid);
  } else if (abbr === '.meds') {
    return _expandMeds(pid);
  } else if (abbr === '.problems') {
    return _expandProblems(pid);
  }

  return phrase.content;
}

/* ---------- Auto-Expand Helpers ---------- */

function _expandVitals(patientId) {
  if (!patientId) return '(No patient context available)';
  var result = getLatestVitalsByPatient(patientId);
  if (!result || !result.vitals) return '(No vitals on file)';
  var v = result.vitals;
  var lines = ['Vitals:'];
  if (v.temperature) lines.push('  Temp: ' + v.temperature + ' F');
  if (v.heartRate) lines.push('  HR: ' + v.heartRate + ' bpm');
  if (v.systolic && v.diastolic) lines.push('  BP: ' + v.systolic + '/' + v.diastolic + ' mmHg');
  if (v.respiratoryRate) lines.push('  RR: ' + v.respiratoryRate + '/min');
  if (v.oxygenSaturation) lines.push('  SpO2: ' + v.oxygenSaturation + '%');
  if (v.weight) lines.push('  Weight: ' + v.weight + ' kg');
  if (v.height) lines.push('  Height: ' + v.height + ' cm');
  if (v.painLevel !== undefined && v.painLevel !== null && v.painLevel !== '') lines.push('  Pain: ' + v.painLevel + '/10');
  return lines.join('\n');
}

function _expandAllergies(patientId) {
  if (!patientId) return '(No patient context available)';
  var allergies = getPatientAllergies(patientId);
  if (!allergies || allergies.length === 0) return 'No known allergies (NKA)';
  var lines = ['Allergies:'];
  allergies.forEach(function(a) {
    var line = '  - ' + (a.allergen || a.name || 'Unknown');
    if (a.reaction) line += ' (' + a.reaction + ')';
    if (a.severity) line += ' [' + a.severity + ']';
    lines.push(line);
  });
  return lines.join('\n');
}

function _expandMeds(patientId) {
  if (!patientId) return '(No patient context available)';
  var meds = getPatientMedications(patientId);
  if (!meds || meds.length === 0) return 'No active medications';
  var lines = ['Active Medications:'];
  meds.forEach(function(m) {
    var line = '  - ' + (m.drug || m.name || 'Unknown');
    if (m.dose) line += ' ' + m.dose;
    if (m.unit) line += ' ' + m.unit;
    if (m.route) line += ', ' + m.route;
    if (m.frequency) line += ', ' + m.frequency;
    lines.push(line);
  });
  return lines.join('\n');
}

function _expandProblems(patientId) {
  if (!patientId) return '(No patient context available)';
  var problems = getActiveProblems(patientId);
  if (!problems || problems.length === 0) return 'No active problems';
  var lines = ['Active Problems:'];
  problems.forEach(function(p, i) {
    var line = '  ' + (i + 1) + '. ' + (p.name || p.diagnosis || p.description || 'Unknown');
    if (p.icdCode) line += ' (' + p.icdCode + ')';
    if (p.onsetDate) line += ' — onset ' + p.onsetDate;
    lines.push(line);
  });
  return lines.join('\n');
}

/* ============================================================
   Textarea Integration — Dot-Phrase Autocomplete
   ============================================================ */

var _spListeners = new WeakMap();

function initSmartPhraseListener(textarea) {
  if (!textarea || _spListeners.has(textarea)) return;

  var state = {
    dropdown: null,
    activeIndex: 0,
    matches: [],
    dotStart: -1
  };

  function getTextBeforeCursor() {
    var pos = textarea.selectionStart;
    return textarea.value.substring(0, pos);
  }

  function getDotQuery() {
    var text = getTextBeforeCursor();
    var match = text.match(/\.(\w*)$/);
    if (!match) return null;
    // Make sure the dot is at the start or preceded by whitespace/newline
    var idx = text.length - match[0].length;
    if (idx > 0 && !/\s/.test(text[idx - 1])) return null;
    return { query: match[0], dotIndex: idx, partial: match[1] };
  }

  function createDropdown() {
    removeDropdown();
    var div = document.createElement('div');
    div.className = 'sp-dropdown';
    document.body.appendChild(div);
    state.dropdown = div;
    return div;
  }

  function removeDropdown() {
    if (state.dropdown) {
      state.dropdown.remove();
      state.dropdown = null;
    }
    state.matches = [];
    state.activeIndex = 0;
    state.dotStart = -1;
  }

  function positionDropdown() {
    if (!state.dropdown) return;
    var rect = textarea.getBoundingClientRect();
    // Approximate cursor position — place below textarea cursor
    var textVal = textarea.value.substring(0, textarea.selectionStart);
    var lines = textVal.split('\n');
    var lineNum = lines.length - 1;
    var colNum = lines[lines.length - 1].length;

    // Get computed styles for font metrics
    var cs = window.getComputedStyle(textarea);
    var lineHeight = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
    var charWidth = parseFloat(cs.fontSize) * 0.6; // approximate monospace width

    var topOffset = rect.top + window.scrollY + (lineNum + 1) * lineHeight - textarea.scrollTop;
    var leftOffset = rect.left + window.scrollX + colNum * charWidth + parseFloat(cs.paddingLeft || 0);

    // Clamp to viewport
    var dropdownHeight = 200;
    var viewH = window.innerHeight;
    if (topOffset + dropdownHeight > viewH + window.scrollY) {
      topOffset = rect.top + window.scrollY + lineNum * lineHeight - textarea.scrollTop - dropdownHeight;
    }
    if (leftOffset + 280 > window.innerWidth) {
      leftOffset = window.innerWidth - 290;
    }

    state.dropdown.style.top = topOffset + 'px';
    state.dropdown.style.left = leftOffset + 'px';
  }

  function renderDropdown() {
    if (!state.dropdown || state.matches.length === 0) {
      removeDropdown();
      return;
    }
    var html = '';
    state.matches.forEach(function(phrase, i) {
      var cls = 'sp-dropdown-item' + (i === state.activeIndex ? ' active' : '');
      html += '<div class="' + cls + '" data-index="' + i + '">'
            + '<span class="sp-abbrev">' + esc(phrase.abbreviation) + '</span> '
            + '<span class="sp-title">' + esc(phrase.title) + '</span>'
            + '</div>';
    });
    state.dropdown.innerHTML = html;
    positionDropdown();

    // Scroll active item into view
    var activeEl = state.dropdown.querySelector('.sp-dropdown-item.active');
    if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });

    // Click handler on items
    state.dropdown.querySelectorAll('.sp-dropdown-item').forEach(function(el) {
      el.addEventListener('mousedown', function(e) {
        e.preventDefault();
        var idx = parseInt(el.dataset.index, 10);
        selectPhrase(idx);
      });
    });
  }

  function selectPhrase(index) {
    var phrase = state.matches[index];
    if (!phrase) return;

    var dq = getDotQuery();
    if (!dq) { removeDropdown(); return; }

    var expanded = expandSmartPhrase(phrase.abbreviation);
    if (expanded === null) expanded = phrase.content;

    var before = textarea.value.substring(0, dq.dotIndex);
    var after = textarea.value.substring(textarea.selectionStart);
    textarea.value = before + expanded + after;

    // Move cursor to end of inserted text
    var newPos = before.length + expanded.length;
    textarea.selectionStart = newPos;
    textarea.selectionEnd = newPos;

    removeDropdown();

    // Trigger input event so any listeners see the change
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function onInput() {
    var dq = getDotQuery();
    if (!dq) {
      removeDropdown();
      return;
    }

    state.dotStart = dq.dotIndex;
    var q = dq.query.toLowerCase();
    state.matches = getSmartPhrases().filter(function(p) {
      return p.abbreviation.toLowerCase().indexOf(q) === 0;
    }).slice(0, 15); // limit results

    if (state.matches.length === 0) {
      removeDropdown();
      return;
    }

    state.activeIndex = 0;
    if (!state.dropdown) createDropdown();
    renderDropdown();
  }

  function onKeydown(e) {
    if (!state.dropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      state.activeIndex = (state.activeIndex + 1) % state.matches.length;
      renderDropdown();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      state.activeIndex = (state.activeIndex - 1 + state.matches.length) % state.matches.length;
      renderDropdown();
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      selectPhrase(state.activeIndex);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      removeDropdown();
    }
  }

  function onBlur() {
    // Delay to allow click on dropdown items
    setTimeout(function() {
      removeDropdown();
    }, 150);
  }

  textarea.addEventListener('input', onInput);
  textarea.addEventListener('keydown', onKeydown);
  textarea.addEventListener('blur', onBlur);

  _spListeners.set(textarea, {
    input: onInput,
    keydown: onKeydown,
    blur: onBlur,
    removeDropdown: removeDropdown
  });
}

function destroySmartPhraseListener(textarea) {
  if (!textarea) return;
  var listeners = _spListeners.get(textarea);
  if (!listeners) return;
  textarea.removeEventListener('input', listeners.input);
  textarea.removeEventListener('keydown', listeners.keydown);
  textarea.removeEventListener('blur', listeners.blur);
  listeners.removeDropdown();
  _spListeners.delete(textarea);
}

/* ============================================================
   Management UI
   ============================================================ */

var _SP_CATEGORIES = ['HPI', 'ROS', 'PE', 'A/P', 'General', 'Auto'];

function openSmartPhraseManager() {
  var allPhrases = getSmartPhrases();
  var selectedCategory = 'All';
  var searchQuery = '';

  function filteredPhrases() {
    var list = allPhrases;
    if (selectedCategory !== 'All') {
      list = list.filter(function(p) { return p.category === selectedCategory; });
    }
    if (searchQuery) {
      var q = searchQuery.toLowerCase();
      list = list.filter(function(p) {
        return p.abbreviation.toLowerCase().indexOf(q) >= 0 ||
               p.title.toLowerCase().indexOf(q) >= 0;
      });
    }
    return list;
  }

  function buildBody() {
    var categories = ['All'].concat(_SP_CATEGORIES);
    var catItems = categories.map(function(c) {
      var cls = 'sp-cat-item' + (c === selectedCategory ? ' active' : '');
      return '<div class="' + cls + '" data-cat="' + esc(c) + '">' + esc(c) + '</div>';
    }).join('');

    var phrases = filteredPhrases();
    var phraseRows = '';
    if (phrases.length === 0) {
      phraseRows = '<div class="sp-empty">No phrases found</div>';
    } else {
      phraseRows = phrases.map(function(p) {
        var lockIcon = p.isSystem ? '<span class="sp-lock" title="System phrase (read-only)">&#128274;</span> ' : '';
        var preview = p.content.length > 80 ? p.content.substring(0, 80) + '...' : p.content;
        var actions = '';
        if (!p.isSystem) {
          actions = '<button class="btn btn-sm btn-outline sp-edit-btn" data-id="' + esc(p.id) + '">Edit</button> '
                  + '<button class="btn btn-sm btn-outline btn-danger sp-delete-btn" data-id="' + esc(p.id) + '">Delete</button>';
        } else {
          actions = '<span class="sp-readonly-label">System</span>';
        }
        return '<div class="sp-phrase-row" data-id="' + esc(p.id) + '">'
             + '<div class="sp-phrase-info">'
             + lockIcon
             + '<span class="sp-abbrev">' + esc(p.abbreviation) + '</span> '
             + '<span class="sp-phrase-title">' + esc(p.title) + '</span>'
             + '<div class="sp-phrase-preview">' + esc(preview) + '</div>'
             + '</div>'
             + '<div class="sp-phrase-actions">' + actions + '</div>'
             + '</div>';
      }).join('');
    }

    return '<div class="sp-manager">'
         + '<div class="sp-manager-toolbar">'
         + '<input type="text" id="sp-search" class="form-control" placeholder="Search phrases..." value="' + esc(searchQuery) + '" />'
         + '<button class="btn btn-sm btn-primary" id="sp-new-btn">+ New Phrase</button>'
         + '</div>'
         + '<div class="sp-manager-columns">'
         + '<div class="sp-cat-list">' + catItems + '</div>'
         + '<div class="sp-phrase-list">' + phraseRows + '</div>'
         + '</div>'
         + '</div>';
  }

  function wireEvents() {
    // Category clicks
    document.querySelectorAll('.sp-cat-item').forEach(function(el) {
      el.addEventListener('click', function() {
        selectedCategory = el.dataset.cat;
        refreshManager();
      });
    });

    // Search
    var searchEl = document.getElementById('sp-search');
    if (searchEl) {
      searchEl.addEventListener('input', function() {
        searchQuery = searchEl.value;
        refreshManager();
      });
    }

    // New phrase
    var newBtn = document.getElementById('sp-new-btn');
    if (newBtn) {
      newBtn.addEventListener('click', function() {
        openSmartPhraseEditor(null);
      });
    }

    // Edit buttons
    document.querySelectorAll('.sp-edit-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        openSmartPhraseEditor(btn.dataset.id);
      });
    });

    // Delete buttons
    document.querySelectorAll('.sp-delete-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (confirm('Delete this phrase?')) {
          deleteSmartPhrase(btn.dataset.id);
          allPhrases = getSmartPhrases();
          refreshManager();
          showToast('Phrase deleted', 'success');
        }
      });
    });
  }

  function refreshManager() {
    allPhrases = getSmartPhrases();
    var body = document.getElementById('modal-body');
    if (body) {
      body.innerHTML = buildBody();
      wireEvents();
    }
  }

  openModal({
    title: 'SmartPhrase Manager',
    bodyHTML: buildBody(),
    footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Close</button>',
    size: 'lg'
  });

  wireEvents();
}

function openSmartPhraseEditor(phraseId) {
  var existing = null;
  if (phraseId) {
    existing = getSmartPhrases().find(function(p) { return p.id === phraseId; });
    if (!existing) {
      showToast('Phrase not found', 'error');
      return;
    }
    if (existing.isSystem) {
      showToast('System phrases cannot be edited', 'error');
      return;
    }
  }

  var abbr = existing ? existing.abbreviation : '.';
  var title = existing ? existing.title : '';
  var category = existing ? existing.category : 'General';
  var content = existing ? existing.content : '';

  var catOptions = _SP_CATEGORIES.filter(function(c) { return c !== 'Auto'; }).map(function(c) {
    var sel = c === category ? ' selected' : '';
    return '<option value="' + esc(c) + '"' + sel + '>' + esc(c) + '</option>';
  }).join('');

  var bodyHTML = '<div class="sp-editor">'
    + '<div class="form-group">'
    + '<label>Abbreviation <small>(must start with ".")</small></label>'
    + '<input type="text" id="sp-ed-abbr" class="form-control" value="' + esc(abbr) + '" placeholder=".myPhrase" />'
    + '</div>'
    + '<div class="form-group">'
    + '<label>Title</label>'
    + '<input type="text" id="sp-ed-title" class="form-control" value="' + esc(title) + '" placeholder="Descriptive title" />'
    + '</div>'
    + '<div class="form-group">'
    + '<label>Category</label>'
    + '<select id="sp-ed-category" class="form-control">' + catOptions + '</select>'
    + '</div>'
    + '<div class="form-group">'
    + '<label>Content</label>'
    + '<textarea id="sp-ed-content" class="form-control sp-content-textarea" rows="10" placeholder="Type your phrase content here.\nUse [brackets] for fill-in fields.">' + esc(content) + '</textarea>'
    + '</div>'
    + '<div class="form-group">'
    + '<button class="btn btn-sm btn-outline" id="sp-ed-preview-btn">Preview</button>'
    + '<div id="sp-ed-preview" class="sp-preview hidden"></div>'
    + '</div>'
    + '</div>';

  var footerHTML = '<button class="btn btn-secondary" id="sp-ed-cancel">Cancel</button> '
    + '<button class="btn btn-success" id="sp-ed-save">Save</button>';

  openModal({
    title: existing ? 'Edit SmartPhrase' : 'New SmartPhrase',
    bodyHTML: bodyHTML,
    footerHTML: footerHTML
  });

  // Wire preview
  var previewBtn = document.getElementById('sp-ed-preview-btn');
  if (previewBtn) {
    previewBtn.addEventListener('click', function() {
      var previewDiv = document.getElementById('sp-ed-preview');
      var val = document.getElementById('sp-ed-content').value;
      previewDiv.classList.remove('hidden');
      previewDiv.textContent = val || '(empty)';
    });
  }

  // Wire cancel
  var cancelBtn = document.getElementById('sp-ed-cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() { closeModal(); });
  }

  // Wire save
  var saveBtn = document.getElementById('sp-ed-save');
  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      var newAbbr = (document.getElementById('sp-ed-abbr').value || '').trim();
      var newTitle = (document.getElementById('sp-ed-title').value || '').trim();
      var newCategory = document.getElementById('sp-ed-category').value;
      var newContent = document.getElementById('sp-ed-content').value || '';

      // Validation
      if (!newAbbr.startsWith('.')) {
        showToast('Abbreviation must start with "."', 'error');
        return;
      }
      if (newAbbr.length < 2) {
        showToast('Abbreviation too short', 'error');
        return;
      }
      if (!/^\.\w+$/.test(newAbbr)) {
        showToast('Abbreviation must contain only letters, numbers, and underscores after the dot', 'error');
        return;
      }
      if (!newTitle) {
        showToast('Title is required', 'error');
        return;
      }

      // Check uniqueness (excluding current phrase if editing)
      var allPhrases = getSmartPhrases();
      var conflict = allPhrases.find(function(p) {
        return p.abbreviation.toLowerCase() === newAbbr.toLowerCase() &&
               (!existing || p.id !== existing.id);
      });
      if (conflict) {
        showToast('Abbreviation "' + newAbbr + '" is already in use', 'error');
        return;
      }

      var phrase = {
        id: existing ? existing.id : null,
        abbreviation: newAbbr,
        title: newTitle,
        content: newContent,
        category: newCategory,
        autoExpand: false
      };

      saveSmartPhrase(phrase);
      showToast(existing ? 'Phrase updated' : 'Phrase created', 'success');
      closeModal();

      // Refresh manager if it's underneath
      if (_modalStack.length > 0) {
        // The manager modal is stacked; it will refresh when it comes back
      }
    });
  }
}

/* ============================================================
   CSS Injection — .sp-* styles
   ============================================================ */

(function _injectSmartPhraseStyles() {
  if (document.getElementById('sp-styles')) return;
  var style = document.createElement('style');
  style.id = 'sp-styles';
  style.textContent = ''
    /* Autocomplete dropdown */
    + '.sp-dropdown {'
    + '  position: absolute;'
    + '  z-index: 10000;'
    + '  background: #fff;'
    + '  border: 1px solid var(--border, #e2e8f0);'
    + '  border-radius: 6px;'
    + '  box-shadow: 0 4px 16px rgba(0,0,0,0.12);'
    + '  max-height: 200px;'
    + '  overflow-y: auto;'
    + '  min-width: 240px;'
    + '  max-width: 360px;'
    + '}'
    + '.sp-dropdown-item {'
    + '  padding: 6px 10px;'
    + '  cursor: pointer;'
    + '  display: flex;'
    + '  align-items: center;'
    + '  gap: 6px;'
    + '  border-bottom: 1px solid #f0f0f0;'
    + '}'
    + '.sp-dropdown-item:last-child { border-bottom: none; }'
    + '.sp-dropdown-item:hover { background: #f7fafc; }'
    + '.sp-dropdown-item.active {'
    + '  background: var(--accent-blue, #2b6cb0);'
    + '  color: #fff;'
    + '}'
    + '.sp-dropdown-item.active .sp-abbrev,'
    + '.sp-dropdown-item.active .sp-title { color: #fff; }'
    + '.sp-abbrev {'
    + '  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;'
    + '  font-weight: 700;'
    + '  font-size: 12px;'
    + '  color: var(--accent-blue, #2b6cb0);'
    + '  white-space: nowrap;'
    + '}'
    + '.sp-title {'
    + '  font-size: 13px;'
    + '  color: var(--text-secondary, #4a5568);'
    + '  white-space: nowrap;'
    + '  overflow: hidden;'
    + '  text-overflow: ellipsis;'
    + '}'

    /* Manager modal */
    + '.sp-manager { display: flex; flex-direction: column; gap: 12px; }'
    + '.sp-manager-toolbar { display: flex; gap: 8px; align-items: center; }'
    + '.sp-manager-toolbar input { flex: 1; }'
    + '.sp-manager-columns { display: flex; gap: 12px; min-height: 350px; }'
    + '.sp-cat-list {'
    + '  min-width: 110px;'
    + '  border-right: 1px solid var(--border, #e2e8f0);'
    + '  padding-right: 10px;'
    + '  display: flex;'
    + '  flex-direction: column;'
    + '  gap: 2px;'
    + '}'
    + '.sp-cat-item {'
    + '  padding: 6px 10px;'
    + '  border-radius: 4px;'
    + '  cursor: pointer;'
    + '  font-size: 13px;'
    + '  color: var(--text-secondary, #4a5568);'
    + '}'
    + '.sp-cat-item:hover { background: #f7fafc; }'
    + '.sp-cat-item.active {'
    + '  background: var(--accent-blue-light, #ebf4ff);'
    + '  color: var(--accent-blue, #2b6cb0);'
    + '  font-weight: 600;'
    + '}'
    + '.sp-phrase-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }'
    + '.sp-phrase-row {'
    + '  display: flex;'
    + '  justify-content: space-between;'
    + '  align-items: flex-start;'
    + '  padding: 8px 10px;'
    + '  border: 1px solid var(--border, #e2e8f0);'
    + '  border-radius: 4px;'
    + '  gap: 10px;'
    + '}'
    + '.sp-phrase-row:hover { background: #f7fafc; }'
    + '.sp-phrase-info { flex: 1; min-width: 0; }'
    + '.sp-phrase-title { font-size: 14px; font-weight: 500; color: var(--text-primary, #1a202c); }'
    + '.sp-phrase-preview {'
    + '  font-size: 12px;'
    + '  color: var(--text-muted, #718096);'
    + '  margin-top: 2px;'
    + '  white-space: nowrap;'
    + '  overflow: hidden;'
    + '  text-overflow: ellipsis;'
    + '}'
    + '.sp-phrase-actions { display: flex; gap: 4px; flex-shrink: 0; align-items: center; }'
    + '.sp-lock { font-size: 12px; }'
    + '.sp-readonly-label { font-size: 11px; color: var(--text-muted, #718096); text-transform: uppercase; letter-spacing: 0.5px; }'
    + '.sp-empty { padding: 40px 20px; text-align: center; color: var(--text-muted, #718096); font-size: 14px; }'

    /* Editor */
    + '.sp-editor .form-group { margin-bottom: 12px; }'
    + '.sp-editor label { display: block; font-weight: 600; font-size: 13px; margin-bottom: 4px; color: var(--text-primary, #1a202c); }'
    + '.sp-editor label small { font-weight: 400; color: var(--text-muted, #718096); }'
    + '.sp-content-textarea {'
    + '  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;'
    + '  font-size: 13px;'
    + '  line-height: 1.5;'
    + '  resize: vertical;'
    + '  min-height: 160px;'
    + '}'
    + '.sp-preview {'
    + '  margin-top: 8px;'
    + '  padding: 10px;'
    + '  background: #f7fafc;'
    + '  border: 1px solid var(--border, #e2e8f0);'
    + '  border-radius: 4px;'
    + '  font-size: 13px;'
    + '  white-space: pre-wrap;'
    + '  max-height: 200px;'
    + '  overflow-y: auto;'
    + '}';
  document.head.appendChild(style);
})();
