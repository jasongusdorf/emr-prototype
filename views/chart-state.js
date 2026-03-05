/* ============================================================
   views/chart-state.js — Chart module state variables & constants
   ============================================================ */

/* ---------- Module-level state ---------- */
let _currentChartPatientId = null;
let _currentChartTab       = 'overview';
let _notesSortDir          = 'desc';   // 'desc' | 'asc' | 'provider'
let _notesView             = 'grouped'; // 'grouped' | 'timeline'
let _searchOpen            = false;
let _pendingScrollSection  = null;
let _currentOverviewSubTab = 'profile';
let _currentEncSubTab      = 'notes';  // 'profile' | 'notes'

/* ---------- Constants ---------- */
const VISIT_TYPES = {
  'Outpatient': ['Primary Care', 'Specialty', 'Urgent Care', 'Telehealth'],
  'Inpatient':  ['General Ward', 'ICU', 'Step-Down'],
  'Emergency':  [],
  'Other':      [],
};

const VITALS_FLAGS = {
  bpSystolic:  { low: 90,  high: 140, critLow: 70,  critHigh: 180 },
  bpDiastolic: { low: 60,  high: 90,  critLow: 40,  critHigh: 120 },
  heartRate:   { low: 60,  high: 100, critLow: 40,  critHigh: 150 },
  respRate:    { low: 12,  high: 20,  critLow: 8,   critHigh: 30  },
  tempF:       { low: 96,  high: 100.4, critLow: 94, critHigh: 104 },
  spo2:        { low: 95,  high: 100, critLow: 88,  critHigh: null },
};

const SCREENING_RULES = [
  { id:'bp',         label:'Blood Pressure Screening',   sex:null,     minAge:18, maxAge:null, intervalYears:2   },
  { id:'dm',         label:'Diabetes Screening',          sex:null,     minAge:35, maxAge:70,   intervalYears:3   },
  { id:'colorectal', label:'Colorectal Cancer Screening', sex:null,     minAge:45, maxAge:75,   intervalYears:10  },
  { id:'breast',     label:'Breast Cancer (Mammogram)',   sex:'Female', minAge:40, maxAge:null, intervalYears:2   },
  { id:'cervical',   label:'Cervical Cancer (Pap Smear)', sex:'Female', minAge:21, maxAge:65,   intervalYears:3   },
  { id:'osteo',      label:'Osteoporosis (DEXA Scan)',    sex:'Female', minAge:65, maxAge:null, intervalYears:10  },
  { id:'lung',       label:'Lung Cancer CT (Low-Dose)',   sex:null,     minAge:50, maxAge:80,   intervalYears:1   },
  { id:'aaa',        label:'AAA Ultrasound (one-time)',   sex:'Male',   minAge:65, maxAge:75,   intervalYears:null },
];

const DEGREE_ORDER = ['MD', 'DO', 'NP', 'PA', 'RN', 'LPN', 'MA', 'PharmD'];
const DEGREE_LABEL = {
  MD:     'MD — Physician Notes',
  DO:     'DO — Physician Notes',
  NP:     'NP — Advanced Practice Notes',
  PA:     'PA — Advanced Practice Notes',
  RN:     'RN — Nursing Notes',
  LPN:    'LPN — Nursing Notes',
  MA:     'MA — Medical Assistant Notes',
  PharmD: 'PharmD — Pharmacy Notes',
};

const OVERVIEW_SUBTABS = [
  { key: 'profile',       label: 'Profile',        color: 'profile' },
  { key: 'notes',         label: 'Notes',           color: 'notes' },
  { key: 'medications',   label: 'Medications',     color: 'medications' },
  { key: 'results',       label: 'Results',         color: 'results' },
  { key: 'orders',        label: 'Orders',          color: 'orders' },
  { key: 'communication', label: 'Communication',   color: 'notes' },
];

const PROFILE_SECTIONS = [
  { id: 'section-demographics',    label: 'Demographics' },
  { id: 'section-appointments',    label: 'Appointments' },
  { id: 'section-vitals-trend',    label: 'Vitals' },
  { id: 'section-social-history',  label: 'Social Hx' },
  { id: 'section-problems',        label: 'Problems' },
  { id: 'section-preventive-care', label: 'Preventive Care' },
  { id: 'section-allergies',       label: 'Allergies' },
  { id: 'section-pmh',             label: 'PMH' },
  { id: 'section-family-history',  label: 'Family Hx' },
  { id: 'section-surgeries',       label: 'Surgeries' },
  { id: 'section-immunizations',   label: 'Immunizations' },
  { id: 'section-encounters',      label: 'Encounters' },
];
