/* ============================================================
   views/pacs-viewer.js — Simulated PACS Viewer
   Radiology image viewer with study list, simulated images,
   window/level, zoom, measurement tools.
   ============================================================ */

/* ---------- Data helpers ---------- */

function getPACSStudies() {
  return loadAll(KEYS.pacsStudies);
}

function getPACSStudy(id) {
  return getPACSStudies().find(function(s) { return s.id === id; }) || null;
}

function savePACSStudy(data) {
  var all = loadAll(KEYS.pacsStudies, true);
  var idx = all.findIndex(function(s) { return s.id === data.id; });
  if (idx >= 0) {
    all[idx] = Object.assign({}, all[idx], data);
  } else {
    if (!data.id) data.id = generateId();
    all.push(data);
  }
  saveAll(KEYS.pacsStudies, all);
  return data;
}

function seedPACSStudies() {
  if (loadAll(KEYS.pacsStudies).length > 0) return;
  var patients = getPatients();
  var p1 = patients[0], p2 = patients[1], p3 = patients[2];

  var studies = [
    {
      id: generateId(),
      patientId: p1 ? p1.id : 'pat1',
      patientName: p1 ? p1.lastName + ', ' + p1.firstName : 'Johnson, Alice',
      modality: 'XR', bodyPart: 'Chest',
      studyDescription: 'Chest X-Ray PA/Lateral',
      studyDate: '2025-11-15T10:30:00',
      status: 'Dictated',
      accessionNumber: 'ACC-2025-001',
      referringPhysician: 'Dr. Sarah Chen',
      radiologist: 'Dr. James Radiology',
      seriesCount: 2,
      imageCount: 4,
      report: 'CLINICAL HISTORY: Cough, rule out pneumonia.\n\nFINDINGS:\nHeart: Normal size and contour.\nLungs: Clear bilaterally. No infiltrates, effusions, or masses.\nMediastinum: Normal width. No lymphadenopathy.\nBones: No acute fractures.\n\nIMPRESSION: Normal chest radiograph.',
      series: [
        { id: 'ser1', name: 'PA View', imageCount: 2, modality: 'XR', pattern: 'chest-pa' },
        { id: 'ser2', name: 'Lateral View', imageCount: 2, modality: 'XR', pattern: 'chest-lat' },
      ],
    },
    {
      id: generateId(),
      patientId: p2 ? p2.id : 'pat2',
      patientName: p2 ? p2.lastName + ', ' + p2.firstName : 'Kim, Robert',
      modality: 'CT', bodyPart: 'Head',
      studyDescription: 'CT Head Without Contrast',
      studyDate: '2025-12-01T14:00:00',
      status: 'Completed',
      accessionNumber: 'ACC-2025-002',
      referringPhysician: 'Dr. Sarah Chen',
      radiologist: 'Dr. James Radiology',
      seriesCount: 1,
      imageCount: 24,
      report: 'CLINICAL HISTORY: Headache, rule out intracranial pathology.\n\nFINDINGS:\nBrain parenchyma: No acute infarct, hemorrhage, or mass effect.\nVentricles: Normal size and configuration.\nExtra-axial spaces: No subdural or epidural collections.\nBones: Calvarium intact. No fractures.\nSinuses: Clear.\n\nIMPRESSION: Normal non-contrast CT head.',
      series: [
        { id: 'ser3', name: 'Axial', imageCount: 24, modality: 'CT', pattern: 'ct-head' },
      ],
    },
    {
      id: generateId(),
      patientId: p1 ? p1.id : 'pat1',
      patientName: p1 ? p1.lastName + ', ' + p1.firstName : 'Johnson, Alice',
      modality: 'MR', bodyPart: 'Brain',
      studyDescription: 'MRI Brain With/Without Contrast',
      studyDate: '2025-11-20T09:00:00',
      status: 'Dictated',
      accessionNumber: 'ACC-2025-003',
      referringPhysician: 'Dr. Sarah Chen',
      radiologist: 'Dr. James Radiology',
      seriesCount: 3,
      imageCount: 72,
      report: 'CLINICAL HISTORY: Recurrent migraines with aura.\n\nFINDINGS:\nBrain parenchyma: No signal abnormality. No mass lesion. No restricted diffusion.\nVentricular system: Normal.\nWhite matter: A few punctate T2/FLAIR hyperintensities in the periventricular white matter, nonspecific, possibly related to migrainous changes.\nEnhancement: No abnormal enhancement.\n\nIMPRESSION:\n1. No acute intracranial pathology.\n2. Scattered nonspecific white matter changes, possibly migrainous.',
      series: [
        { id: 'ser4', name: 'T1 Axial', imageCount: 24, modality: 'MR', pattern: 'mri-t1' },
        { id: 'ser5', name: 'T2 FLAIR', imageCount: 24, modality: 'MR', pattern: 'mri-t2' },
        { id: 'ser6', name: 'Post-Contrast', imageCount: 24, modality: 'MR', pattern: 'mri-post' },
      ],
    },
    {
      id: generateId(),
      patientId: p3 ? p3.id : 'pat3',
      patientName: p3 ? p3.lastName + ', ' + p3.firstName : 'Garcia, Maria',
      modality: 'US', bodyPart: 'Abdomen',
      studyDescription: 'Ultrasound Abdomen Complete',
      studyDate: '2025-12-05T11:00:00',
      status: 'In Progress',
      accessionNumber: 'ACC-2025-004',
      referringPhysician: 'Dr. Marcus Webb',
      radiologist: '',
      seriesCount: 1,
      imageCount: 12,
      report: '',
      series: [
        { id: 'ser7', name: 'Abdomen', imageCount: 12, modality: 'US', pattern: 'us-abd' },
      ],
    },
    {
      id: generateId(),
      patientId: p2 ? p2.id : 'pat2',
      patientName: p2 ? p2.lastName + ', ' + p2.firstName : 'Kim, Robert',
      modality: 'XR', bodyPart: 'Knee',
      studyDescription: 'X-Ray Left Knee 3 Views',
      studyDate: '2025-12-08T08:30:00',
      status: 'Ordered',
      accessionNumber: 'ACC-2025-005',
      referringPhysician: 'Dr. Sarah Chen',
      radiologist: '',
      seriesCount: 0,
      imageCount: 0,
      report: '',
      series: [],
    },
  ];

  studies.forEach(function(s) { savePACSStudy(s); });
}

/* ---------- Simulated image patterns ---------- */

function getImagePattern(pattern, sliceIndex, totalSlices) {
  var brightness = 15 + (sliceIndex / totalSlices) * 10;
  var variation = Math.sin(sliceIndex * 0.5) * 5;

  var patterns = {
    'chest-pa': 'radial-gradient(ellipse 40% 55% at 50% 50%, rgba(180,180,180,' + (0.3 + variation * 0.01) + ') 0%, rgba(40,40,40,0.9) 70%), linear-gradient(180deg, #0a0a0a ' + brightness + '%, #1a1a1a 50%, #0a0a0a 90%)',
    'chest-lat': 'radial-gradient(ellipse 50% 55% at 45% 50%, rgba(160,160,160,' + (0.25 + variation * 0.01) + ') 0%, rgba(30,30,30,0.9) 65%), linear-gradient(90deg, #0a0a0a ' + brightness + '%, #1a1a1a 50%, #0a0a0a 90%)',
    'ct-head': 'radial-gradient(circle at 50% 50%, rgba(200,200,200,' + (0.4 - sliceIndex * 0.01) + ') 0%, rgba(120,120,120,0.3) 30%, rgba(40,40,40,0.8) 50%, #000 70%)',
    'mri-t1': 'radial-gradient(circle at 50% 50%, rgba(220,220,220,' + (0.5 - sliceIndex * 0.01) + ') 0%, rgba(150,150,150,0.4) 25%, rgba(60,60,60,0.6) 45%, #111 65%)',
    'mri-t2': 'radial-gradient(circle at 50% 50%, rgba(255,255,255,' + (0.6 - sliceIndex * 0.01) + ') 0%, rgba(200,200,200,0.5) 25%, rgba(80,80,80,0.5) 45%, #111 65%)',
    'mri-post': 'radial-gradient(circle at 50% 50%, rgba(240,240,240,' + (0.55 - sliceIndex * 0.01) + ') 0%, rgba(180,180,180,0.45) 25%, rgba(70,70,70,0.55) 45%, #111 65%)',
    'us-abd': 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(200,200,180,' + (0.3 + variation * 0.02) + ') 0%, rgba(100,100,80,0.4) 40%, rgba(20,20,15,0.9) 70%)',
  };

  return patterns[pattern] || patterns['chest-pa'];
}

/* ---------- Main render ---------- */

function renderPACSViewer(studyIdParam) {
  seedPACSStudies();
  var app = document.getElementById('app');

  setTopbar({ title: 'PACS Viewer', meta: 'Radiology Imaging' });
  setActiveNav('pacs-viewer');

  var studies = getPACSStudies();
  var statusFilter = 'all';
  var modalityFilter = 'all';

  if (studyIdParam) {
    openStudyViewer(studyIdParam);
    return;
  }

  function render() {
    app.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.style.cssText = 'padding:24px;max-width:1200px;margin:0 auto;';

    wrap.innerHTML = '<h3 style="margin:0 0 16px;">Study Worklist</h3>';

    // Filters
    var filterBar = document.createElement('div');
    filterBar.className = 'pacs-filter-bar';

    var statusSel = document.createElement('select');
    statusSel.className = 'form-control';
    statusSel.innerHTML = '<option value="all">All Statuses</option><option value="Ordered">Ordered</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option><option value="Dictated">Dictated</option>';
    statusSel.value = statusFilter;
    statusSel.addEventListener('change', function() { statusFilter = statusSel.value; render(); });

    var modSel = document.createElement('select');
    modSel.className = 'form-control';
    modSel.innerHTML = '<option value="all">All Modalities</option><option value="XR">X-Ray</option><option value="CT">CT</option><option value="MR">MRI</option><option value="US">Ultrasound</option>';
    modSel.value = modalityFilter;
    modSel.addEventListener('change', function() { modalityFilter = modSel.value; render(); });

    filterBar.appendChild(statusSel);
    filterBar.appendChild(modSel);
    wrap.appendChild(filterBar);

    var filtered = studies.filter(function(s) {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (modalityFilter !== 'all' && s.modality !== modalityFilter) return false;
      return true;
    }).sort(function(a, b) { return new Date(b.studyDate) - new Date(a.studyDate); });

    if (filtered.length === 0) {
      wrap.innerHTML += '<div class="pacs-empty">No studies match the current filters.</div>';
      app.appendChild(wrap);
      return;
    }

    var table = document.createElement('table');
    table.className = 'pacs-table';
    table.innerHTML = '<thead><tr><th>Date</th><th>Patient</th><th>Modality</th><th>Study</th><th>Status</th><th>Accession</th><th>Actions</th></tr></thead>';
    var tbody = document.createElement('tbody');

    filtered.forEach(function(s) {
      var tr = document.createElement('tr');
      var d = new Date(s.studyDate);
      var statusClass = 'pacs-status-' + s.status.toLowerCase().replace(/\s+/g, '-');

      tr.innerHTML =
        '<td>' + d.toLocaleDateString() + '</td>' +
        '<td>' + esc(s.patientName) + '</td>' +
        '<td><span class="pacs-modality-badge pacs-mod-' + s.modality.toLowerCase() + '">' + esc(s.modality) + '</span></td>' +
        '<td>' + esc(s.studyDescription) + '</td>' +
        '<td><span class="pacs-status-badge ' + statusClass + '">' + esc(s.status) + '</span></td>' +
        '<td style="font-size:12px;color:var(--text-muted);">' + esc(s.accessionNumber) + '</td>' +
        '<td class="pacs-actions-cell"></td>';

      var actionsCell = tr.querySelector('.pacs-actions-cell');

      if (s.status === 'Completed' || s.status === 'Dictated') {
        var viewBtn = document.createElement('button');
        viewBtn.className = 'btn btn-primary btn-sm';
        viewBtn.textContent = 'View';
        viewBtn.addEventListener('click', function() { openStudyViewer(s.id); });
        actionsCell.appendChild(viewBtn);
      }

      if (s.report) {
        var reportBtn = document.createElement('button');
        reportBtn.className = 'btn btn-secondary btn-sm';
        reportBtn.textContent = 'Report';
        reportBtn.addEventListener('click', function() {
          openModal({
            title: 'Radiology Report — ' + esc(s.studyDescription),
            bodyHTML: '<div class="pacs-report-viewer"><pre class="pacs-report-text">' + esc(s.report) + '</pre></div>',
            footerHTML: '<button class="btn btn-secondary" onclick="closeModal()">Close</button>',
            size: 'lg',
          });
        });
        actionsCell.appendChild(reportBtn);
      }

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrap.appendChild(table);
    app.appendChild(wrap);
  }

  function openStudyViewer(studyId) {
    var study = getPACSStudy(studyId);
    if (!study || study.series.length === 0) {
      showToast('No images available for this study', 'warning');
      render();
      return;
    }

    app.innerHTML = '';
    var viewer = document.createElement('div');
    viewer.className = 'pacs-viewer';

    // State
    var currentSeriesIdx = 0;
    var currentSlice = 0;
    var windowLevel = 50;
    var windowWidth = 80;
    var zoom = 100;
    var panX = 0, panY = 0;
    var activeTool = 'pointer';
    var measurements = [];
    var measureStart = null;

    // Header
    var header = document.createElement('div');
    header.className = 'pacs-viewer-header';
    header.innerHTML =
      '<div class="pacs-viewer-patient">' +
      '<strong>' + esc(study.patientName) + '</strong> &middot; ' + esc(study.studyDescription) + ' &middot; ' + new Date(study.studyDate).toLocaleDateString() +
      '</div>';

    var backBtn = document.createElement('button');
    backBtn.className = 'btn btn-secondary btn-sm';
    backBtn.textContent = 'Back to Worklist';
    backBtn.addEventListener('click', function() { cleanupViewer(); render(); });
    header.appendChild(backBtn);
    viewer.appendChild(header);

    // Main area
    var mainArea = document.createElement('div');
    mainArea.className = 'pacs-viewer-main';

    // Left panel: series navigator
    var seriesPanel = document.createElement('div');
    seriesPanel.className = 'pacs-series-panel';
    seriesPanel.innerHTML = '<h4 style="margin:0 0 8px;font-size:13px;color:#aaa;">Series</h4>';

    study.series.forEach(function(ser, idx) {
      var serBtn = document.createElement('div');
      serBtn.className = 'pacs-series-thumb' + (idx === currentSeriesIdx ? ' active' : '');
      serBtn.innerHTML = '<div class="pacs-series-thumb-img" style="background:' + getImagePattern(ser.pattern, 0, ser.imageCount) + ';"></div>' +
        '<div class="pacs-series-label">' + esc(ser.name) + '<br><span style="font-size:10px;">' + ser.imageCount + ' images</span></div>';
      serBtn.addEventListener('click', function() {
        currentSeriesIdx = idx;
        currentSlice = 0;
        measurements = [];
        renderViewer();
      });
      seriesPanel.appendChild(serBtn);
    });
    mainArea.appendChild(seriesPanel);

    // Image viewport
    var viewport = document.createElement('div');
    viewport.className = 'pacs-viewport';
    var canvas = document.createElement('div');
    canvas.className = 'pacs-canvas';
    viewport.appendChild(canvas);

    // Overlay info
    var overlayTL = document.createElement('div');
    overlayTL.className = 'pacs-overlay pacs-overlay-tl';
    viewport.appendChild(overlayTL);

    var overlayTR = document.createElement('div');
    overlayTR.className = 'pacs-overlay pacs-overlay-tr';
    viewport.appendChild(overlayTR);

    var overlayBL = document.createElement('div');
    overlayBL.className = 'pacs-overlay pacs-overlay-bl';
    viewport.appendChild(overlayBL);

    var overlayBR = document.createElement('div');
    overlayBR.className = 'pacs-overlay pacs-overlay-br';
    viewport.appendChild(overlayBR);

    // SVG for measurements
    var measureSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    measureSvg.setAttribute('class', 'pacs-measure-svg');
    measureSvg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;';
    viewport.appendChild(measureSvg);

    mainArea.appendChild(viewport);

    // Right panel: report
    var reportPanel = document.createElement('div');
    reportPanel.className = 'pacs-report-panel';
    reportPanel.innerHTML = '<h4 style="margin:0 0 8px;font-size:13px;color:#aaa;">Report</h4>';
    if (study.report) {
      reportPanel.innerHTML += '<pre class="pacs-report-text-inline">' + esc(study.report) + '</pre>';
    } else {
      reportPanel.innerHTML += '<div style="color:#666;font-size:13px;">No report available.</div>';
    }
    mainArea.appendChild(reportPanel);

    viewer.appendChild(mainArea);

    // Toolbar
    var toolbar = document.createElement('div');
    toolbar.className = 'pacs-toolbar';

    var tools = [
      { key: 'pointer', label: 'Pointer', icon: 'Ptr' },
      { key: 'wl', label: 'Window/Level', icon: 'W/L' },
      { key: 'zoom', label: 'Zoom', icon: 'Zm' },
      { key: 'pan', label: 'Pan', icon: 'Pan' },
      { key: 'measure', label: 'Measure', icon: 'Ruler' },
      { key: 'angle', label: 'Angle', icon: 'Ang' },
    ];

    tools.forEach(function(tool) {
      var btn = document.createElement('button');
      btn.className = 'pacs-tool-btn' + (tool.key === activeTool ? ' active' : '');
      btn.textContent = tool.icon;
      btn.title = tool.label;
      btn.addEventListener('click', function() {
        activeTool = tool.key;
        toolbar.querySelectorAll('.pacs-tool-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
      });
      toolbar.appendChild(btn);
    });

    // W/L slider
    var wlLabel = document.createElement('span');
    wlLabel.className = 'pacs-slider-label';
    wlLabel.textContent = 'W/L';
    toolbar.appendChild(wlLabel);

    var wlSlider = document.createElement('input');
    wlSlider.type = 'range';
    wlSlider.min = '0';
    wlSlider.max = '100';
    wlSlider.value = String(windowLevel);
    wlSlider.className = 'pacs-slider';
    wlSlider.addEventListener('input', function() {
      windowLevel = parseInt(wlSlider.value, 10);
      renderViewer();
    });
    toolbar.appendChild(wlSlider);

    // Zoom slider
    var zmLabel = document.createElement('span');
    zmLabel.className = 'pacs-slider-label';
    zmLabel.textContent = 'Zoom';
    toolbar.appendChild(zmLabel);

    var zmSlider = document.createElement('input');
    zmSlider.type = 'range';
    zmSlider.min = '50';
    zmSlider.max = '300';
    zmSlider.value = String(zoom);
    zmSlider.className = 'pacs-slider';
    zmSlider.addEventListener('input', function() {
      zoom = parseInt(zmSlider.value, 10);
      renderViewer();
    });
    toolbar.appendChild(zmSlider);

    // Slice navigator
    var sliceLabel = document.createElement('span');
    sliceLabel.className = 'pacs-slider-label';
    sliceLabel.textContent = 'Slice';
    toolbar.appendChild(sliceLabel);

    var sliceSlider = document.createElement('input');
    sliceSlider.type = 'range';
    sliceSlider.min = '0';
    sliceSlider.className = 'pacs-slider';
    toolbar.appendChild(sliceSlider);

    var resetBtn = document.createElement('button');
    resetBtn.className = 'pacs-tool-btn';
    resetBtn.textContent = 'Reset';
    resetBtn.title = 'Reset View';
    resetBtn.addEventListener('click', function() {
      windowLevel = 50; windowWidth = 80; zoom = 100; panX = 0; panY = 0;
      wlSlider.value = '50'; zmSlider.value = '100';
      measurements = [];
      renderViewer();
    });
    toolbar.appendChild(resetBtn);

    viewer.appendChild(toolbar);
    app.appendChild(viewer);

    // Mouse interactions on viewport
    var isDragging = false;
    var dragStartX = 0, dragStartY = 0;

    canvas.addEventListener('mousedown', function(e) {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;

      if (activeTool === 'measure' || activeTool === 'angle') {
        var rect = canvas.getBoundingClientRect();
        measureStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      }
    });

    canvas.addEventListener('mousemove', function(e) {
      if (!isDragging) return;
      var dx = e.clientX - dragStartX;
      var dy = e.clientY - dragStartY;

      if (activeTool === 'wl') {
        windowLevel = Math.max(0, Math.min(100, windowLevel + dy * 0.5));
        windowWidth = Math.max(10, Math.min(100, windowWidth + dx * 0.5));
        wlSlider.value = String(Math.round(windowLevel));
        renderViewer();
      } else if (activeTool === 'zoom') {
        zoom = Math.max(50, Math.min(300, zoom - dy));
        zmSlider.value = String(Math.round(zoom));
        renderViewer();
      } else if (activeTool === 'pan') {
        panX += dx;
        panY += dy;
        renderViewer();
      }

      dragStartX = e.clientX;
      dragStartY = e.clientY;
    });

    canvas.addEventListener('mouseup', function(e) {
      if (isDragging && measureStart && (activeTool === 'measure' || activeTool === 'angle')) {
        var rect = canvas.getBoundingClientRect();
        var endX = e.clientX - rect.left;
        var endY = e.clientY - rect.top;
        var dist = Math.sqrt(Math.pow(endX - measureStart.x, 2) + Math.pow(endY - measureStart.y, 2));
        if (dist > 10) {
          measurements.push({
            type: activeTool,
            x1: measureStart.x, y1: measureStart.y,
            x2: endX, y2: endY,
            value: activeTool === 'measure' ? (dist * 0.26).toFixed(1) + ' mm' : Math.round(Math.atan2(Math.abs(endY - measureStart.y), Math.abs(endX - measureStart.x)) * 180 / Math.PI) + '\u00B0',
          });
          renderMeasurements();
        }
        measureStart = null;
      }
      isDragging = false;
    });

    // Scroll through slices
    viewport.addEventListener('wheel', function(e) {
      e.preventDefault();
      var ser = study.series[currentSeriesIdx];
      if (!ser) return;
      if (e.deltaY > 0) currentSlice = Math.min(currentSlice + 1, ser.imageCount - 1);
      else currentSlice = Math.max(currentSlice - 1, 0);
      sliceSlider.value = String(currentSlice);
      renderViewer();
    });

    sliceSlider.addEventListener('input', function() {
      currentSlice = parseInt(sliceSlider.value, 10);
      renderViewer();
    });

    // Cleanup
    var _cleanupTimer = null;
    function cleanupViewer() {
      if (_cleanupTimer) clearInterval(_cleanupTimer);
    }

    function renderMeasurements() {
      while (measureSvg.firstChild) measureSvg.removeChild(measureSvg.firstChild);
      measurements.forEach(function(m) {
        var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', m.x1);
        line.setAttribute('y1', m.y1);
        line.setAttribute('x2', m.x2);
        line.setAttribute('y2', m.y2);
        line.setAttribute('stroke', '#00ff00');
        line.setAttribute('stroke-width', '2');
        measureSvg.appendChild(line);

        var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', (m.x1 + m.x2) / 2);
        text.setAttribute('y', (m.y1 + m.y2) / 2 - 8);
        text.setAttribute('fill', '#00ff00');
        text.setAttribute('font-size', '12');
        text.setAttribute('text-anchor', 'middle');
        text.textContent = m.value;
        measureSvg.appendChild(text);
      });
    }

    function renderViewer() {
      var ser = study.series[currentSeriesIdx];
      if (!ser) return;

      sliceSlider.max = String(Math.max(0, ser.imageCount - 1));
      sliceSlider.value = String(currentSlice);

      var brightness = 0.5 + (windowLevel - 50) * 0.015;
      var contrast = 0.5 + (windowWidth - 50) * 0.02;

      canvas.style.background = getImagePattern(ser.pattern, currentSlice, ser.imageCount);
      canvas.style.filter = 'brightness(' + brightness.toFixed(2) + ') contrast(' + contrast.toFixed(2) + ')';
      canvas.style.transform = 'scale(' + (zoom / 100) + ') translate(' + panX + 'px, ' + panY + 'px)';

      // Overlays
      overlayTL.innerHTML = '<div>' + esc(study.patientName) + '</div><div>' + esc(study.studyDescription) + '</div>';
      overlayTR.innerHTML = '<div>' + esc(ser.name) + '</div><div>Image: ' + (currentSlice + 1) + ' / ' + ser.imageCount + '</div>';
      overlayBL.innerHTML = '<div>W: ' + windowWidth + ' L: ' + windowLevel + '</div><div>Zoom: ' + zoom + '%</div>';
      overlayBR.innerHTML = '<div>' + new Date(study.studyDate).toLocaleDateString() + '</div><div>' + esc(study.accessionNumber) + '</div>';

      renderMeasurements();
    }

    renderViewer();
    registerCleanup(cleanupViewer);
  }

  render();
}
