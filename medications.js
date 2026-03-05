/* ============================================================
   Medication Database, Pharmacy Database & Autocomplete Engine
   ============================================================ */

const MEDICATION_DB = [
  // ── Cardiovascular: ACE Inhibitors ──
  { generic:'Lisinopril', brands:['Prinivil','Zestril'], drugClass:'ACE Inhibitor', schedule:null,
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'40',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Hypertension','Heart Failure'], allergyTags:['lisinopril','ace inhibitor'] },
  { generic:'Enalapril', brands:['Vasotec'], drugClass:'ACE Inhibitor', schedule:null,
    doseForms:[{dose:'2.5',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'5',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Hypertension','Heart Failure'], allergyTags:['enalapril','ace inhibitor'] },
  { generic:'Ramipril', brands:['Altace'], drugClass:'ACE Inhibitor', schedule:null,
    doseForms:[{dose:'1.25',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'2.5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Hypertension','Heart Failure'], allergyTags:['ramipril','ace inhibitor'] },
  { generic:'Benazepril', brands:['Lotensin'], drugClass:'ACE Inhibitor', schedule:null,
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'40',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Hypertension'], allergyTags:['benazepril','ace inhibitor'] },

  // ── Cardiovascular: ARBs ──
  { generic:'Losartan', brands:['Cozaar'], drugClass:'ARB', schedule:null,
    doseForms:[{dose:'25',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'100',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Hypertension','Diabetic Nephropathy'], allergyTags:['losartan','arb'] },
  { generic:'Valsartan', brands:['Diovan'], drugClass:'ARB', schedule:null,
    doseForms:[{dose:'40',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'80',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'160',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'320',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Hypertension','Heart Failure'], allergyTags:['valsartan','arb'] },
  { generic:'Irbesartan', brands:['Avapro'], drugClass:'ARB', schedule:null,
    doseForms:[{dose:'75',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'150',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'300',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Hypertension','Diabetic Nephropathy'], allergyTags:['irbesartan','arb'] },
  { generic:'Olmesartan', brands:['Benicar'], drugClass:'ARB', schedule:null,
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'40',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Hypertension'], allergyTags:['olmesartan','arb'] },
  { generic:'Telmisartan', brands:['Micardis'], drugClass:'ARB', schedule:null,
    doseForms:[{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'40',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'80',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Hypertension'], allergyTags:['telmisartan','arb'] },

  // ── Cardiovascular: Beta-Blockers ──
  { generic:'Metoprolol Tartrate', brands:['Lopressor'], drugClass:'Beta-Blocker', schedule:null,
    doseForms:[{dose:'12.5',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'25',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'100',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Hypertension','Angina','Heart Failure'], allergyTags:['metoprolol','beta blocker'] },
  { generic:'Metoprolol Succinate', brands:['Toprol-XL'], drugClass:'Beta-Blocker', schedule:null,
    doseForms:[{dose:'25',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'100',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'200',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Hypertension','Heart Failure'], allergyTags:['metoprolol','beta blocker'] },
  { generic:'Atenolol', brands:['Tenormin'], drugClass:'Beta-Blocker', schedule:null,
    doseForms:[{dose:'25',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'100',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Hypertension','Angina'], allergyTags:['atenolol','beta blocker'] },
  { generic:'Carvedilol', brands:['Coreg'], drugClass:'Beta-Blocker', schedule:null,
    doseForms:[{dose:'3.125',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'6.25',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'12.5',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'25',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Heart Failure','Hypertension'], allergyTags:['carvedilol','beta blocker'] },
  { generic:'Propranolol', brands:['Inderal'], drugClass:'Beta-Blocker', schedule:null,
    doseForms:[{dose:'10',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'40',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'80',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Hypertension','Migraine Prophylaxis','Tremor'], allergyTags:['propranolol','beta blocker'] },
  { generic:'Bisoprolol', brands:['Zebeta'], drugClass:'Beta-Blocker', schedule:null,
    doseForms:[{dose:'2.5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Hypertension','Heart Failure'], allergyTags:['bisoprolol','beta blocker'] },

  // ── Cardiovascular: CCBs ──
  { generic:'Amlodipine', brands:['Norvasc'], drugClass:'Calcium Channel Blocker', schedule:null,
    doseForms:[{dose:'2.5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Hypertension','Angina'], allergyTags:['amlodipine','calcium channel blocker'] },
  { generic:'Diltiazem', brands:['Cardizem','Tiazac'], drugClass:'Calcium Channel Blocker', schedule:null,
    doseForms:[{dose:'30',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'60',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'120',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'180',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'240',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:2, commonIndications:['Hypertension','Angina','Atrial Fibrillation'], allergyTags:['diltiazem','calcium channel blocker'] },
  { generic:'Nifedipine', brands:['Procardia','Adalat'], drugClass:'Calcium Channel Blocker', schedule:null,
    doseForms:[{dose:'30',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'60',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'90',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Hypertension','Angina'], allergyTags:['nifedipine','calcium channel blocker'] },
  { generic:'Verapamil', brands:['Calan','Verelan'], drugClass:'Calcium Channel Blocker', schedule:null,
    doseForms:[{dose:'80',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'120',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'180',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'240',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Hypertension','Angina','SVT'], allergyTags:['verapamil','calcium channel blocker'] },

  // ── Cardiovascular: Statins ──
  { generic:'Atorvastatin', brands:['Lipitor'], drugClass:'Statin', schedule:null,
    doseForms:[{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'40',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'80',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Hyperlipidemia','ASCVD Prevention'], allergyTags:['atorvastatin','statin'] },
  { generic:'Rosuvastatin', brands:['Crestor'], drugClass:'Statin', schedule:null,
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'40',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Hyperlipidemia','ASCVD Prevention'], allergyTags:['rosuvastatin','statin'] },
  { generic:'Simvastatin', brands:['Zocor'], drugClass:'Statin', schedule:null,
    doseForms:[{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'40',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Hyperlipidemia'], allergyTags:['simvastatin','statin'] },
  { generic:'Pravastatin', brands:['Pravachol'], drugClass:'Statin', schedule:null,
    doseForms:[{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'40',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'80',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Hyperlipidemia'], allergyTags:['pravastatin','statin'] },

  // ── Cardiovascular: Diuretics ──
  { generic:'Hydrochlorothiazide', brands:['Microzide'], drugClass:'Thiazide Diuretic', schedule:null,
    doseForms:[{dose:'12.5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'25',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Hypertension','Edema'], allergyTags:['hydrochlorothiazide','hctz','thiazide','sulfonamide'] },
  { generic:'Chlorthalidone', brands:['Thalitone'], drugClass:'Thiazide Diuretic', schedule:null,
    doseForms:[{dose:'12.5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'25',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Hypertension'], allergyTags:['chlorthalidone','thiazide','sulfonamide'] },
  { generic:'Furosemide', brands:['Lasix'], drugClass:'Loop Diuretic', schedule:null,
    doseForms:[{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'40',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'80',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'40',unit:'mg',route:'IV',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Edema','Heart Failure'], allergyTags:['furosemide','loop diuretic','sulfonamide'] },
  { generic:'Bumetanide', brands:['Bumex'], drugClass:'Loop Diuretic', schedule:null,
    doseForms:[{dose:'0.5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'1',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'2',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Edema','Heart Failure'], allergyTags:['bumetanide','loop diuretic','sulfonamide'] },
  { generic:'Spironolactone', brands:['Aldactone'], drugClass:'Potassium-Sparing Diuretic', schedule:null,
    doseForms:[{dose:'25',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'100',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Heart Failure','Ascites','Hypertension'], allergyTags:['spironolactone'] },

  // ── Cardiovascular: Anticoagulants / Antiplatelets ──
  { generic:'Warfarin', brands:['Coumadin'], drugClass:'Anticoagulant', schedule:null,
    doseForms:[{dose:'1',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'2',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'2.5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'7.5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:3, commonIndications:['Atrial Fibrillation','DVT','PE'], allergyTags:['warfarin'] },
  { generic:'Apixaban', brands:['Eliquis'], drugClass:'DOAC', schedule:null,
    doseForms:[{dose:'2.5',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'5',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Atrial Fibrillation','DVT','PE'], allergyTags:['apixaban','doac'] },
  { generic:'Rivaroxaban', brands:['Xarelto'], drugClass:'DOAC', schedule:null,
    doseForms:[{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'15',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:2, commonIndications:['Atrial Fibrillation','DVT','PE'], allergyTags:['rivaroxaban','doac'] },
  { generic:'Heparin', brands:[], drugClass:'Anticoagulant', schedule:null,
    doseForms:[{dose:'5000',unit:'units',route:'SQ',defaultFreq:'Q8h'},{dose:'5000',unit:'units',route:'SQ',defaultFreq:'Q12h'}],
    defaultDoseIndex:0, commonIndications:['DVT Prophylaxis','VTE Treatment'], allergyTags:['heparin'] },
  { generic:'Enoxaparin', brands:['Lovenox'], drugClass:'LMWH', schedule:null,
    doseForms:[{dose:'30',unit:'mg',route:'SQ',defaultFreq:'Q12h'},{dose:'40',unit:'mg',route:'SQ',defaultFreq:'QDay'},{dose:'1',unit:'mg',route:'SQ',defaultFreq:'Q12h'}],
    defaultDoseIndex:1, commonIndications:['DVT Prophylaxis','VTE Treatment'], allergyTags:['enoxaparin','lmwh','heparin'] },
  { generic:'Aspirin', brands:['Bayer','Ecotrin'], drugClass:'Antiplatelet', schedule:null,
    doseForms:[{dose:'81',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'325',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['ASCVD Prevention','ACS'], allergyTags:['aspirin','nsaid','salicylate'] },
  { generic:'Clopidogrel', brands:['Plavix'], drugClass:'Antiplatelet', schedule:null,
    doseForms:[{dose:'75',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['ACS','Stent Placement','Stroke Prevention'], allergyTags:['clopidogrel'] },

  // ── Cardiovascular: Other ──
  { generic:'Digoxin', brands:['Lanoxin'], drugClass:'Cardiac Glycoside', schedule:null,
    doseForms:[{dose:'0.125',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'0.25',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Heart Failure','Atrial Fibrillation'], allergyTags:['digoxin'] },
  { generic:'Amiodarone', brands:['Cordarone','Pacerone'], drugClass:'Antiarrhythmic', schedule:null,
    doseForms:[{dose:'100',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'200',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'400',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Atrial Fibrillation','Ventricular Tachycardia'], allergyTags:['amiodarone'] },
  { generic:'Hydralazine', brands:['Apresoline'], drugClass:'Vasodilator', schedule:null,
    doseForms:[{dose:'10',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'25',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'TID'}],
    defaultDoseIndex:1, commonIndications:['Hypertension','Heart Failure'], allergyTags:['hydralazine'] },
  { generic:'Isosorbide Mononitrate', brands:['Imdur'], drugClass:'Nitrate', schedule:null,
    doseForms:[{dose:'30',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'60',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'120',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Angina'], allergyTags:['isosorbide','nitrate'] },
  { generic:'Nitroglycerin', brands:['Nitrostat'], drugClass:'Nitrate', schedule:null,
    doseForms:[{dose:'0.4',unit:'mg',route:'SL',defaultFreq:'PRN'}],
    defaultDoseIndex:0, commonIndications:['Angina','Chest Pain'], allergyTags:['nitroglycerin','nitrate'] },

  // ── Endocrine ──
  { generic:'Metformin', brands:['Glucophage'], drugClass:'Biguanide', schedule:null,
    doseForms:[{dose:'500',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'850',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'1000',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Type 2 Diabetes'], allergyTags:['metformin'] },
  { generic:'Glipizide', brands:['Glucotrol'], drugClass:'Sulfonylurea', schedule:null,
    doseForms:[{dose:'2.5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Type 2 Diabetes'], allergyTags:['glipizide','sulfonylurea','sulfonamide'] },
  { generic:'Glyburide', brands:['DiaBeta','Micronase'], drugClass:'Sulfonylurea', schedule:null,
    doseForms:[{dose:'1.25',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'2.5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Type 2 Diabetes'], allergyTags:['glyburide','sulfonylurea','sulfonamide'] },
  { generic:'Sitagliptin', brands:['Januvia'], drugClass:'DPP-4 Inhibitor', schedule:null,
    doseForms:[{dose:'25',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'100',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:2, commonIndications:['Type 2 Diabetes'], allergyTags:['sitagliptin'] },
  { generic:'Empagliflozin', brands:['Jardiance'], drugClass:'SGLT2 Inhibitor', schedule:null,
    doseForms:[{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'25',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Type 2 Diabetes','Heart Failure'], allergyTags:['empagliflozin','sglt2 inhibitor'] },
  { generic:'Dapagliflozin', brands:['Farxiga'], drugClass:'SGLT2 Inhibitor', schedule:null,
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Type 2 Diabetes','Heart Failure'], allergyTags:['dapagliflozin','sglt2 inhibitor'] },
  { generic:'Semaglutide', brands:['Ozempic','Wegovy'], drugClass:'GLP-1 Agonist', schedule:null,
    doseForms:[{dose:'0.25',unit:'mg',route:'SQ',defaultFreq:'QWeek'},{dose:'0.5',unit:'mg',route:'SQ',defaultFreq:'QWeek'},{dose:'1',unit:'mg',route:'SQ',defaultFreq:'QWeek'},{dose:'2',unit:'mg',route:'SQ',defaultFreq:'QWeek'}],
    defaultDoseIndex:1, commonIndications:['Type 2 Diabetes','Obesity'], allergyTags:['semaglutide','glp-1 agonist'] },
  { generic:'Liraglutide', brands:['Victoza','Saxenda'], drugClass:'GLP-1 Agonist', schedule:null,
    doseForms:[{dose:'0.6',unit:'mg',route:'SQ',defaultFreq:'QDay'},{dose:'1.2',unit:'mg',route:'SQ',defaultFreq:'QDay'},{dose:'1.8',unit:'mg',route:'SQ',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Type 2 Diabetes','Obesity'], allergyTags:['liraglutide','glp-1 agonist'] },
  { generic:'Insulin Glargine', brands:['Lantus','Basaglar'], drugClass:'Long-Acting Insulin', schedule:null,
    doseForms:[{dose:'10',unit:'units',route:'SQ',defaultFreq:'QDay'},{dose:'20',unit:'units',route:'SQ',defaultFreq:'QDay'},{dose:'30',unit:'units',route:'SQ',defaultFreq:'QDay'},{dose:'40',unit:'units',route:'SQ',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Type 1 Diabetes','Type 2 Diabetes'], allergyTags:['insulin glargine','insulin'] },
  { generic:'Insulin Lispro', brands:['Humalog'], drugClass:'Rapid-Acting Insulin', schedule:null,
    doseForms:[{dose:'5',unit:'units',route:'SQ',defaultFreq:'TID'},{dose:'10',unit:'units',route:'SQ',defaultFreq:'TID'}],
    defaultDoseIndex:0, commonIndications:['Type 1 Diabetes','Type 2 Diabetes'], allergyTags:['insulin lispro','insulin'] },
  { generic:'Insulin Aspart', brands:['NovoLog'], drugClass:'Rapid-Acting Insulin', schedule:null,
    doseForms:[{dose:'5',unit:'units',route:'SQ',defaultFreq:'TID'},{dose:'10',unit:'units',route:'SQ',defaultFreq:'TID'}],
    defaultDoseIndex:0, commonIndications:['Type 1 Diabetes','Type 2 Diabetes'], allergyTags:['insulin aspart','insulin'] },
  { generic:'Levothyroxine', brands:['Synthroid','Levoxyl'], drugClass:'Thyroid Hormone', schedule:null,
    doseForms:[{dose:'25',unit:'mcg',route:'PO',defaultFreq:'QDay'},{dose:'50',unit:'mcg',route:'PO',defaultFreq:'QDay'},{dose:'75',unit:'mcg',route:'PO',defaultFreq:'QDay'},{dose:'88',unit:'mcg',route:'PO',defaultFreq:'QDay'},{dose:'100',unit:'mcg',route:'PO',defaultFreq:'QDay'},{dose:'112',unit:'mcg',route:'PO',defaultFreq:'QDay'},{dose:'125',unit:'mcg',route:'PO',defaultFreq:'QDay'},{dose:'150',unit:'mcg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:2, commonIndications:['Hypothyroidism'], allergyTags:['levothyroxine'] },
  { generic:'Methimazole', brands:['Tapazole'], drugClass:'Antithyroid', schedule:null,
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Hyperthyroidism'], allergyTags:['methimazole'] },
  { generic:'Prednisone', brands:['Deltasone'], drugClass:'Corticosteroid', schedule:null,
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'40',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'60',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Inflammation','Asthma Exacerbation','Autoimmune'], allergyTags:['prednisone','corticosteroid'] },
  { generic:'Dexamethasone', brands:['Decadron'], drugClass:'Corticosteroid', schedule:null,
    doseForms:[{dose:'2',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'4',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'6',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'4',unit:'mg',route:'IV',defaultFreq:'Q6h'}],
    defaultDoseIndex:1, commonIndications:['Inflammation','Cerebral Edema','Nausea'], allergyTags:['dexamethasone','corticosteroid'] },
  { generic:'Methylprednisolone', brands:['Medrol'], drugClass:'Corticosteroid', schedule:null,
    doseForms:[{dose:'4',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'8',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'16',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'125',unit:'mg',route:'IV',defaultFreq:'Q6h'}],
    defaultDoseIndex:0, commonIndications:['Inflammation','Asthma','MS Exacerbation'], allergyTags:['methylprednisolone','corticosteroid'] },
  { generic:'Pioglitazone', brands:['Actos'], drugClass:'Thiazolidinedione', schedule:null,
    doseForms:[{dose:'15',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'30',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'45',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Type 2 Diabetes'], allergyTags:['pioglitazone'] },

  // ── Infectious Disease: Penicillins ──
  { generic:'Amoxicillin', brands:['Amoxil'], drugClass:'Penicillin', schedule:null,
    doseForms:[{dose:'250',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'500',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'875',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Bacterial Infection','Otitis Media','Sinusitis'], allergyTags:['amoxicillin','penicillin','beta-lactam'] },
  { generic:'Amoxicillin/Clavulanate', brands:['Augmentin'], drugClass:'Penicillin', schedule:null,
    doseForms:[{dose:'500/125',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'875/125',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Bacterial Infection','Sinusitis','Bite Wounds'], allergyTags:['amoxicillin','clavulanate','penicillin','beta-lactam'] },
  { generic:'Ampicillin', brands:[], drugClass:'Penicillin', schedule:null,
    doseForms:[{dose:'250',unit:'mg',route:'PO',defaultFreq:'QID'},{dose:'500',unit:'mg',route:'PO',defaultFreq:'QID'},{dose:'1',unit:'g',route:'IV',defaultFreq:'Q6h'},{dose:'2',unit:'g',route:'IV',defaultFreq:'Q4h'}],
    defaultDoseIndex:1, commonIndications:['Bacterial Infection','Endocarditis'], allergyTags:['ampicillin','penicillin','beta-lactam'] },
  { generic:'Penicillin VK', brands:['Veetids'], drugClass:'Penicillin', schedule:null,
    doseForms:[{dose:'250',unit:'mg',route:'PO',defaultFreq:'QID'},{dose:'500',unit:'mg',route:'PO',defaultFreq:'QID'}],
    defaultDoseIndex:1, commonIndications:['Strep Pharyngitis','Rheumatic Fever Prevention'], allergyTags:['penicillin','beta-lactam'] },

  // ── Infectious Disease: Cephalosporins ──
  { generic:'Cephalexin', brands:['Keflex'], drugClass:'Cephalosporin', schedule:null,
    doseForms:[{dose:'250',unit:'mg',route:'PO',defaultFreq:'QID'},{dose:'500',unit:'mg',route:'PO',defaultFreq:'QID'}],
    defaultDoseIndex:1, commonIndications:['Skin Infection','UTI'], allergyTags:['cephalexin','cephalosporin','beta-lactam'] },
  { generic:'Cefazolin', brands:['Ancef'], drugClass:'Cephalosporin', schedule:null,
    doseForms:[{dose:'1',unit:'g',route:'IV',defaultFreq:'Q8h'},{dose:'2',unit:'g',route:'IV',defaultFreq:'Q8h'}],
    defaultDoseIndex:0, commonIndications:['Surgical Prophylaxis','Skin Infection'], allergyTags:['cefazolin','cephalosporin','beta-lactam'] },
  { generic:'Ceftriaxone', brands:['Rocephin'], drugClass:'Cephalosporin', schedule:null,
    doseForms:[{dose:'250',unit:'mg',route:'IM',defaultFreq:'Once'},{dose:'1',unit:'g',route:'IV',defaultFreq:'QDay'},{dose:'2',unit:'g',route:'IV',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Pneumonia','Meningitis','Gonorrhea'], allergyTags:['ceftriaxone','cephalosporin','beta-lactam'] },
  { generic:'Cefdinir', brands:['Omnicef'], drugClass:'Cephalosporin', schedule:null,
    doseForms:[{dose:'300',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'600',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Sinusitis','Otitis Media','Bronchitis'], allergyTags:['cefdinir','cephalosporin','beta-lactam'] },

  // ── Infectious Disease: Fluoroquinolones ──
  { generic:'Ciprofloxacin', brands:['Cipro'], drugClass:'Fluoroquinolone', schedule:null,
    doseForms:[{dose:'250',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'500',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'750',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['UTI','Bacterial Infection'], allergyTags:['ciprofloxacin','fluoroquinolone'] },
  { generic:'Levofloxacin', brands:['Levaquin'], drugClass:'Fluoroquinolone', schedule:null,
    doseForms:[{dose:'250',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'500',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'750',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Pneumonia','UTI','Sinusitis'], allergyTags:['levofloxacin','fluoroquinolone'] },
  { generic:'Moxifloxacin', brands:['Avelox'], drugClass:'Fluoroquinolone', schedule:null,
    doseForms:[{dose:'400',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Pneumonia','Sinusitis'], allergyTags:['moxifloxacin','fluoroquinolone'] },

  // ── Infectious Disease: Macrolides ──
  { generic:'Azithromycin', brands:['Zithromax','Z-Pack'], drugClass:'Macrolide', schedule:null,
    doseForms:[{dose:'250',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'500',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Pneumonia','Sinusitis','Bronchitis'], allergyTags:['azithromycin','macrolide'] },
  { generic:'Clarithromycin', brands:['Biaxin'], drugClass:'Macrolide', schedule:null,
    doseForms:[{dose:'250',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'500',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Pneumonia','H. pylori','Sinusitis'], allergyTags:['clarithromycin','macrolide'] },
  { generic:'Erythromycin', brands:['E-Mycin','Ery-Tab'], drugClass:'Macrolide', schedule:null,
    doseForms:[{dose:'250',unit:'mg',route:'PO',defaultFreq:'QID'},{dose:'500',unit:'mg',route:'PO',defaultFreq:'QID'}],
    defaultDoseIndex:0, commonIndications:['Bacterial Infection','Acne'], allergyTags:['erythromycin','macrolide'] },

  // ── Infectious Disease: Other ──
  { generic:'Doxycycline', brands:['Vibramycin'], drugClass:'Tetracycline', schedule:null,
    doseForms:[{dose:'50',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'100',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Bacterial Infection','Acne','Lyme Disease'], allergyTags:['doxycycline','tetracycline'] },
  { generic:'Metronidazole', brands:['Flagyl'], drugClass:'Nitroimidazole', schedule:null,
    doseForms:[{dose:'250',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'500',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'500',unit:'mg',route:'IV',defaultFreq:'Q8h'}],
    defaultDoseIndex:1, commonIndications:['C. diff','Anaerobic Infection','BV'], allergyTags:['metronidazole'] },
  { generic:'Trimethoprim/Sulfamethoxazole', brands:['Bactrim','Septra'], drugClass:'Sulfonamide', schedule:null,
    doseForms:[{dose:'80/400',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'160/800',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['UTI','MRSA Skin Infection','PCP Prophylaxis'], allergyTags:['trimethoprim','sulfamethoxazole','sulfonamide','sulfa'] },
  { generic:'Nitrofurantoin', brands:['Macrobid','Macrodantin'], drugClass:'Urinary Antiseptic', schedule:null,
    doseForms:[{dose:'100',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['UTI'], allergyTags:['nitrofurantoin'] },
  { generic:'Clindamycin', brands:['Cleocin'], drugClass:'Lincosamide', schedule:null,
    doseForms:[{dose:'150',unit:'mg',route:'PO',defaultFreq:'QID'},{dose:'300',unit:'mg',route:'PO',defaultFreq:'QID'},{dose:'600',unit:'mg',route:'IV',defaultFreq:'Q8h'},{dose:'900',unit:'mg',route:'IV',defaultFreq:'Q8h'}],
    defaultDoseIndex:1, commonIndications:['Skin Infection','MRSA','Dental Infection'], allergyTags:['clindamycin'] },
  { generic:'Vancomycin', brands:['Vancocin'], drugClass:'Glycopeptide', schedule:null,
    doseForms:[{dose:'125',unit:'mg',route:'PO',defaultFreq:'QID'},{dose:'250',unit:'mg',route:'PO',defaultFreq:'QID'},{dose:'1',unit:'g',route:'IV',defaultFreq:'Q12h'},{dose:'1.5',unit:'g',route:'IV',defaultFreq:'Q12h'}],
    defaultDoseIndex:2, commonIndications:['MRSA','C. diff (PO)','Endocarditis'], allergyTags:['vancomycin'] },
  { generic:'Fluconazole', brands:['Diflucan'], drugClass:'Antifungal', schedule:null,
    doseForms:[{dose:'100',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'150',unit:'mg',route:'PO',defaultFreq:'Once'},{dose:'200',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Candidiasis','Fungal Infection'], allergyTags:['fluconazole','azole antifungal'] },
  { generic:'Nystatin', brands:['Mycostatin'], drugClass:'Antifungal', schedule:null,
    doseForms:[{dose:'100000',unit:'units',route:'PO',defaultFreq:'QID'}],
    defaultDoseIndex:0, commonIndications:['Oral Thrush','Candidiasis'], allergyTags:['nystatin'] },
  { generic:'Acyclovir', brands:['Zovirax'], drugClass:'Antiviral', schedule:null,
    doseForms:[{dose:'200',unit:'mg',route:'PO',defaultFreq:'Q4h'},{dose:'400',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'800',unit:'mg',route:'PO',defaultFreq:'Q4h'}],
    defaultDoseIndex:1, commonIndications:['Herpes Simplex','Varicella','Herpes Zoster'], allergyTags:['acyclovir'] },
  { generic:'Valacyclovir', brands:['Valtrex'], drugClass:'Antiviral', schedule:null,
    doseForms:[{dose:'500',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'1',unit:'g',route:'PO',defaultFreq:'TID'}],
    defaultDoseIndex:0, commonIndications:['Herpes Simplex','Herpes Zoster'], allergyTags:['valacyclovir','acyclovir'] },
  { generic:'Oseltamivir', brands:['Tamiflu'], drugClass:'Antiviral', schedule:null,
    doseForms:[{dose:'75',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Influenza'], allergyTags:['oseltamivir'] },

  // ── Neuro/Psych: SSRIs ──
  { generic:'Sertraline', brands:['Zoloft'], drugClass:'SSRI', schedule:null,
    doseForms:[{dose:'25',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'100',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'150',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'200',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Depression','Anxiety','OCD','PTSD'], allergyTags:['sertraline','ssri'] },
  { generic:'Fluoxetine', brands:['Prozac'], drugClass:'SSRI', schedule:null,
    doseForms:[{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'40',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'60',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Depression','Anxiety','OCD'], allergyTags:['fluoxetine','ssri'] },
  { generic:'Escitalopram', brands:['Lexapro'], drugClass:'SSRI', schedule:null,
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Depression','GAD'], allergyTags:['escitalopram','ssri'] },
  { generic:'Citalopram', brands:['Celexa'], drugClass:'SSRI', schedule:null,
    doseForms:[{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'40',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Depression'], allergyTags:['citalopram','ssri'] },
  { generic:'Paroxetine', brands:['Paxil'], drugClass:'SSRI', schedule:null,
    doseForms:[{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'30',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'40',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Depression','Anxiety','PTSD'], allergyTags:['paroxetine','ssri'] },

  // ── Neuro/Psych: SNRIs ──
  { generic:'Venlafaxine', brands:['Effexor'], drugClass:'SNRI', schedule:null,
    doseForms:[{dose:'37.5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'75',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'150',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'225',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Depression','GAD','Neuropathic Pain'], allergyTags:['venlafaxine','snri'] },
  { generic:'Duloxetine', brands:['Cymbalta'], drugClass:'SNRI', schedule:null,
    doseForms:[{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'30',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'60',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:2, commonIndications:['Depression','Neuropathic Pain','Fibromyalgia'], allergyTags:['duloxetine','snri'] },

  // ── Neuro/Psych: Other Antidepressants ──
  { generic:'Bupropion', brands:['Wellbutrin','Zyban'], drugClass:'NDRI', schedule:null,
    doseForms:[{dose:'75',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'100',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'150',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'300',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:2, commonIndications:['Depression','Smoking Cessation'], allergyTags:['bupropion'] },
  { generic:'Trazodone', brands:['Desyrel'], drugClass:'SARI', schedule:null,
    doseForms:[{dose:'25',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'100',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'150',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Insomnia','Depression'], allergyTags:['trazodone'] },
  { generic:'Mirtazapine', brands:['Remeron'], drugClass:'Tetracyclic Antidepressant', schedule:null,
    doseForms:[{dose:'7.5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'15',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'30',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'45',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Depression','Insomnia','Appetite Stimulation'], allergyTags:['mirtazapine'] },
  { generic:'Amitriptyline', brands:['Elavil'], drugClass:'TCA', schedule:null,
    doseForms:[{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'25',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'75',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Depression','Neuropathic Pain','Migraine Prophylaxis'], allergyTags:['amitriptyline','tca','tricyclic'] },
  { generic:'Nortriptyline', brands:['Pamelor'], drugClass:'TCA', schedule:null,
    doseForms:[{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'25',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'75',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Depression','Neuropathic Pain'], allergyTags:['nortriptyline','tca','tricyclic'] },

  // ── Neuro/Psych: Antipsychotics ──
  { generic:'Quetiapine', brands:['Seroquel'], drugClass:'Atypical Antipsychotic', schedule:null,
    doseForms:[{dose:'25',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'100',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'200',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'300',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Bipolar Disorder','Schizophrenia','Insomnia'], allergyTags:['quetiapine','antipsychotic'] },
  { generic:'Risperidone', brands:['Risperdal'], drugClass:'Atypical Antipsychotic', schedule:null,
    doseForms:[{dose:'0.5',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'1',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'2',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Schizophrenia','Bipolar Disorder'], allergyTags:['risperidone','antipsychotic'] },
  { generic:'Olanzapine', brands:['Zyprexa'], drugClass:'Atypical Antipsychotic', schedule:null,
    doseForms:[{dose:'2.5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'15',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:2, commonIndications:['Schizophrenia','Bipolar Disorder'], allergyTags:['olanzapine','antipsychotic'] },
  { generic:'Aripiprazole', brands:['Abilify'], drugClass:'Atypical Antipsychotic', schedule:null,
    doseForms:[{dose:'2',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'15',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'30',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:2, commonIndications:['Schizophrenia','Bipolar Disorder','Adjunctive Depression'], allergyTags:['aripiprazole','antipsychotic'] },
  { generic:'Haloperidol', brands:['Haldol'], drugClass:'Typical Antipsychotic', schedule:null,
    doseForms:[{dose:'0.5',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'1',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'2',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'5',unit:'mg',route:'IM',defaultFreq:'PRN'}],
    defaultDoseIndex:1, commonIndications:['Psychosis','Agitation','Delirium'], allergyTags:['haloperidol','antipsychotic'] },

  // ── Neuro/Psych: Anticonvulsants ──
  { generic:'Gabapentin', brands:['Neurontin'], drugClass:'Anticonvulsant', schedule:null,
    doseForms:[{dose:'100',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'300',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'400',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'600',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'800',unit:'mg',route:'PO',defaultFreq:'TID'}],
    defaultDoseIndex:1, commonIndications:['Neuropathic Pain','Seizures'], allergyTags:['gabapentin'] },
  { generic:'Pregabalin', brands:['Lyrica'], drugClass:'Anticonvulsant', schedule:'V',
    doseForms:[{dose:'25',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'75',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'100',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'150',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Neuropathic Pain','Fibromyalgia','Seizures'], allergyTags:['pregabalin'] },
  { generic:'Lamotrigine', brands:['Lamictal'], drugClass:'Anticonvulsant', schedule:null,
    doseForms:[{dose:'25',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'100',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'200',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:2, commonIndications:['Seizures','Bipolar Disorder'], allergyTags:['lamotrigine'] },
  { generic:'Levetiracetam', brands:['Keppra'], drugClass:'Anticonvulsant', schedule:null,
    doseForms:[{dose:'250',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'500',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'750',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'1000',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Seizures'], allergyTags:['levetiracetam'] },
  { generic:'Valproic Acid', brands:['Depakote','Depakene'], drugClass:'Anticonvulsant', schedule:null,
    doseForms:[{dose:'250',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'500',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'750',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Seizures','Bipolar Disorder','Migraine Prophylaxis'], allergyTags:['valproic acid','valproate'] },
  { generic:'Carbamazepine', brands:['Tegretol'], drugClass:'Anticonvulsant', schedule:null,
    doseForms:[{dose:'100',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'200',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'400',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Seizures','Trigeminal Neuralgia'], allergyTags:['carbamazepine'] },
  { generic:'Topiramate', brands:['Topamax'], drugClass:'Anticonvulsant', schedule:null,
    doseForms:[{dose:'25',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'100',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Seizures','Migraine Prophylaxis'], allergyTags:['topiramate'] },
  { generic:'Phenytoin', brands:['Dilantin'], drugClass:'Anticonvulsant', schedule:null,
    doseForms:[{dose:'100',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'200',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'300',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:2, commonIndications:['Seizures'], allergyTags:['phenytoin'] },

  // ── Neuro/Psych: Anxiolytics / Sedatives ──
  { generic:'Lorazepam', brands:['Ativan'], drugClass:'Benzodiazepine', schedule:'IV',
    doseForms:[{dose:'0.5',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'1',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'2',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'1',unit:'mg',route:'IV',defaultFreq:'PRN'}],
    defaultDoseIndex:0, commonIndications:['Anxiety','Insomnia','Seizures','Agitation'], allergyTags:['lorazepam','benzodiazepine'] },
  { generic:'Alprazolam', brands:['Xanax'], drugClass:'Benzodiazepine', schedule:'IV',
    doseForms:[{dose:'0.25',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'0.5',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'1',unit:'mg',route:'PO',defaultFreq:'TID'}],
    defaultDoseIndex:0, commonIndications:['Anxiety','Panic Disorder'], allergyTags:['alprazolam','benzodiazepine'] },
  { generic:'Diazepam', brands:['Valium'], drugClass:'Benzodiazepine', schedule:'IV',
    doseForms:[{dose:'2',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'5',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Anxiety','Muscle Spasm','Seizures'], allergyTags:['diazepam','benzodiazepine'] },
  { generic:'Clonazepam', brands:['Klonopin'], drugClass:'Benzodiazepine', schedule:'IV',
    doseForms:[{dose:'0.25',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'0.5',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'1',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Anxiety','Seizures','Panic Disorder'], allergyTags:['clonazepam','benzodiazepine'] },
  { generic:'Buspirone', brands:['BuSpar'], drugClass:'Anxiolytic', schedule:null,
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'15',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['GAD'], allergyTags:['buspirone'] },
  { generic:'Hydroxyzine', brands:['Atarax','Vistaril'], drugClass:'Antihistamine', schedule:null,
    doseForms:[{dose:'10',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'25',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'TID'}],
    defaultDoseIndex:1, commonIndications:['Anxiety','Pruritus','Insomnia'], allergyTags:['hydroxyzine'] },

  // ── Neuro/Psych: Stimulants / ADHD ──
  { generic:'Methylphenidate', brands:['Ritalin','Concerta'], drugClass:'Stimulant', schedule:'II',
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'18',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'36',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'54',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['ADHD'], allergyTags:['methylphenidate','stimulant'] },
  { generic:'Amphetamine/Dextroamphetamine', brands:['Adderall'], drugClass:'Stimulant', schedule:'II',
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'15',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'30',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['ADHD'], allergyTags:['amphetamine','stimulant'] },
  { generic:'Lisdexamfetamine', brands:['Vyvanse'], drugClass:'Stimulant', schedule:'II',
    doseForms:[{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'30',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'40',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'60',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'70',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['ADHD'], allergyTags:['lisdexamfetamine','amphetamine','stimulant'] },
  { generic:'Atomoxetine', brands:['Strattera'], drugClass:'NRI', schedule:null,
    doseForms:[{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'18',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'25',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'40',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'60',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'80',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:2, commonIndications:['ADHD'], allergyTags:['atomoxetine'] },

  // ── Neuro/Psych: Mood Stabilizers / Other ──
  { generic:'Lithium', brands:['Lithobid','Eskalith'], drugClass:'Mood Stabilizer', schedule:null,
    doseForms:[{dose:'150',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'300',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'450',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'600',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Bipolar Disorder'], allergyTags:['lithium'] },

  // ── Pain / MSK ──
  { generic:'Ibuprofen', brands:['Advil','Motrin'], drugClass:'NSAID', schedule:null,
    doseForms:[{dose:'200',unit:'mg',route:'PO',defaultFreq:'Q6h'},{dose:'400',unit:'mg',route:'PO',defaultFreq:'Q6h'},{dose:'600',unit:'mg',route:'PO',defaultFreq:'Q8h'},{dose:'800',unit:'mg',route:'PO',defaultFreq:'Q8h'}],
    defaultDoseIndex:1, commonIndications:['Pain','Inflammation','Fever'], allergyTags:['ibuprofen','nsaid'] },
  { generic:'Naproxen', brands:['Aleve','Naprosyn'], drugClass:'NSAID', schedule:null,
    doseForms:[{dose:'220',unit:'mg',route:'PO',defaultFreq:'Q12h'},{dose:'250',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'375',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'500',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Pain','Inflammation'], allergyTags:['naproxen','nsaid'] },
  { generic:'Meloxicam', brands:['Mobic'], drugClass:'NSAID', schedule:null,
    doseForms:[{dose:'7.5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'15',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Osteoarthritis','Rheumatoid Arthritis'], allergyTags:['meloxicam','nsaid'] },
  { generic:'Diclofenac', brands:['Voltaren'], drugClass:'NSAID', schedule:null,
    doseForms:[{dose:'25',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'75',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Pain','Inflammation','Osteoarthritis'], allergyTags:['diclofenac','nsaid'] },
  { generic:'Celecoxib', brands:['Celebrex'], drugClass:'COX-2 Inhibitor', schedule:null,
    doseForms:[{dose:'100',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'200',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Osteoarthritis','Rheumatoid Arthritis'], allergyTags:['celecoxib','nsaid','sulfonamide'] },
  { generic:'Acetaminophen', brands:['Tylenol'], drugClass:'Analgesic', schedule:null,
    doseForms:[{dose:'325',unit:'mg',route:'PO',defaultFreq:'Q6h'},{dose:'500',unit:'mg',route:'PO',defaultFreq:'Q6h'},{dose:'650',unit:'mg',route:'PO',defaultFreq:'Q6h'},{dose:'1000',unit:'mg',route:'PO',defaultFreq:'Q6h'}],
    defaultDoseIndex:1, commonIndications:['Pain','Fever'], allergyTags:['acetaminophen'] },
  { generic:'Tramadol', brands:['Ultram'], drugClass:'Opioid Analgesic', schedule:'IV',
    doseForms:[{dose:'50',unit:'mg',route:'PO',defaultFreq:'Q6h'},{dose:'100',unit:'mg',route:'PO',defaultFreq:'Q6h'}],
    defaultDoseIndex:0, commonIndications:['Moderate Pain'], allergyTags:['tramadol','opioid'] },
  { generic:'Oxycodone', brands:['OxyContin','Roxicodone'], drugClass:'Opioid Analgesic', schedule:'II',
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'Q6h'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'Q6h'},{dose:'15',unit:'mg',route:'PO',defaultFreq:'Q6h'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'Q12h'}],
    defaultDoseIndex:0, commonIndications:['Moderate-Severe Pain'], allergyTags:['oxycodone','opioid'] },
  { generic:'Hydrocodone/Acetaminophen', brands:['Vicodin','Norco'], drugClass:'Opioid Analgesic', schedule:'II',
    doseForms:[{dose:'5/325',unit:'mg',route:'PO',defaultFreq:'Q6h'},{dose:'7.5/325',unit:'mg',route:'PO',defaultFreq:'Q6h'},{dose:'10/325',unit:'mg',route:'PO',defaultFreq:'Q6h'}],
    defaultDoseIndex:0, commonIndications:['Moderate-Severe Pain'], allergyTags:['hydrocodone','opioid','acetaminophen'] },
  { generic:'Morphine', brands:['MS Contin'], drugClass:'Opioid Analgesic', schedule:'II',
    doseForms:[{dose:'2',unit:'mg',route:'IV',defaultFreq:'Q4h'},{dose:'4',unit:'mg',route:'IV',defaultFreq:'Q4h'},{dose:'15',unit:'mg',route:'PO',defaultFreq:'Q4h'},{dose:'30',unit:'mg',route:'PO',defaultFreq:'Q4h'}],
    defaultDoseIndex:0, commonIndications:['Severe Pain'], allergyTags:['morphine','opioid'] },
  { generic:'Fentanyl', brands:['Duragesic','Sublimaze'], drugClass:'Opioid Analgesic', schedule:'II',
    doseForms:[{dose:'12',unit:'mcg/hr',route:'Topical',defaultFreq:'Q72h'},{dose:'25',unit:'mcg/hr',route:'Topical',defaultFreq:'Q72h'},{dose:'50',unit:'mcg',route:'IV',defaultFreq:'PRN'}],
    defaultDoseIndex:0, commonIndications:['Chronic Pain','Severe Pain'], allergyTags:['fentanyl','opioid'] },
  { generic:'Naloxone', brands:['Narcan'], drugClass:'Opioid Antagonist', schedule:null,
    doseForms:[{dose:'0.4',unit:'mg',route:'IV',defaultFreq:'PRN'},{dose:'4',unit:'mg',route:'Inhaled',defaultFreq:'PRN'}],
    defaultDoseIndex:0, commonIndications:['Opioid Overdose'], allergyTags:['naloxone'] },
  { generic:'Cyclobenzaprine', brands:['Flexeril'], drugClass:'Muscle Relaxant', schedule:null,
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'TID'}],
    defaultDoseIndex:0, commonIndications:['Muscle Spasm'], allergyTags:['cyclobenzaprine'] },
  { generic:'Methocarbamol', brands:['Robaxin'], drugClass:'Muscle Relaxant', schedule:null,
    doseForms:[{dose:'500',unit:'mg',route:'PO',defaultFreq:'QID'},{dose:'750',unit:'mg',route:'PO',defaultFreq:'QID'}],
    defaultDoseIndex:1, commonIndications:['Muscle Spasm'], allergyTags:['methocarbamol'] },
  { generic:'Baclofen', brands:['Lioresal'], drugClass:'Muscle Relaxant', schedule:null,
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'TID'}],
    defaultDoseIndex:1, commonIndications:['Muscle Spasticity'], allergyTags:['baclofen'] },
  { generic:'Tizanidine', brands:['Zanaflex'], drugClass:'Muscle Relaxant', schedule:null,
    doseForms:[{dose:'2',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'4',unit:'mg',route:'PO',defaultFreq:'TID'}],
    defaultDoseIndex:0, commonIndications:['Muscle Spasticity'], allergyTags:['tizanidine'] },
  { generic:'Allopurinol', brands:['Zyloprim'], drugClass:'Xanthine Oxidase Inhibitor', schedule:null,
    doseForms:[{dose:'100',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'200',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'300',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:2, commonIndications:['Gout','Hyperuricemia'], allergyTags:['allopurinol'] },
  { generic:'Colchicine', brands:['Colcrys'], drugClass:'Anti-Gout', schedule:null,
    doseForms:[{dose:'0.6',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'0.6',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Gout Flare','Gout Prophylaxis'], allergyTags:['colchicine'] },

  // ── Respiratory ──
  { generic:'Albuterol', brands:['ProAir','Ventolin','Proventil'], drugClass:'SABA', schedule:null,
    doseForms:[{dose:'90',unit:'mcg',route:'Inhaled',defaultFreq:'PRN'},{dose:'2.5',unit:'mg',route:'Inhaled',defaultFreq:'Q4h'}],
    defaultDoseIndex:0, commonIndications:['Asthma','COPD','Bronchospasm'], allergyTags:['albuterol'] },
  { generic:'Ipratropium', brands:['Atrovent'], drugClass:'Anticholinergic', schedule:null,
    doseForms:[{dose:'17',unit:'mcg',route:'Inhaled',defaultFreq:'QID'},{dose:'0.5',unit:'mg',route:'Inhaled',defaultFreq:'Q6h'}],
    defaultDoseIndex:0, commonIndications:['COPD','Bronchospasm'], allergyTags:['ipratropium'] },
  { generic:'Fluticasone', brands:['Flovent','Flonase'], drugClass:'Inhaled Corticosteroid', schedule:null,
    doseForms:[{dose:'44',unit:'mcg',route:'Inhaled',defaultFreq:'BID'},{dose:'110',unit:'mcg',route:'Inhaled',defaultFreq:'BID'},{dose:'220',unit:'mcg',route:'Inhaled',defaultFreq:'BID'},{dose:'50',unit:'mcg',route:'Inhaled',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Asthma','Allergic Rhinitis'], allergyTags:['fluticasone','corticosteroid'] },
  { generic:'Budesonide', brands:['Pulmicort','Rhinocort'], drugClass:'Inhaled Corticosteroid', schedule:null,
    doseForms:[{dose:'0.25',unit:'mg',route:'Inhaled',defaultFreq:'BID'},{dose:'0.5',unit:'mg',route:'Inhaled',defaultFreq:'BID'},{dose:'1',unit:'mg',route:'Inhaled',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Asthma','Croup'], allergyTags:['budesonide','corticosteroid'] },
  { generic:'Fluticasone/Salmeterol', brands:['Advair'], drugClass:'ICS/LABA', schedule:null,
    doseForms:[{dose:'100/50',unit:'mcg',route:'Inhaled',defaultFreq:'BID'},{dose:'250/50',unit:'mcg',route:'Inhaled',defaultFreq:'BID'},{dose:'500/50',unit:'mcg',route:'Inhaled',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Asthma','COPD'], allergyTags:['fluticasone','salmeterol','corticosteroid'] },
  { generic:'Budesonide/Formoterol', brands:['Symbicort'], drugClass:'ICS/LABA', schedule:null,
    doseForms:[{dose:'80/4.5',unit:'mcg',route:'Inhaled',defaultFreq:'BID'},{dose:'160/4.5',unit:'mcg',route:'Inhaled',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Asthma','COPD'], allergyTags:['budesonide','formoterol','corticosteroid'] },
  { generic:'Tiotropium', brands:['Spiriva'], drugClass:'LAMA', schedule:null,
    doseForms:[{dose:'1.25',unit:'mcg',route:'Inhaled',defaultFreq:'QDay'},{dose:'18',unit:'mcg',route:'Inhaled',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['COPD','Asthma'], allergyTags:['tiotropium'] },
  { generic:'Montelukast', brands:['Singulair'], drugClass:'Leukotriene Modifier', schedule:null,
    doseForms:[{dose:'4',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:2, commonIndications:['Asthma','Allergic Rhinitis'], allergyTags:['montelukast'] },
  { generic:'Guaifenesin', brands:['Mucinex'], drugClass:'Expectorant', schedule:null,
    doseForms:[{dose:'200',unit:'mg',route:'PO',defaultFreq:'Q4h'},{dose:'400',unit:'mg',route:'PO',defaultFreq:'Q4h'},{dose:'600',unit:'mg',route:'PO',defaultFreq:'Q12h'},{dose:'1200',unit:'mg',route:'PO',defaultFreq:'Q12h'}],
    defaultDoseIndex:2, commonIndications:['Cough','Congestion'], allergyTags:['guaifenesin'] },
  { generic:'Benzonatate', brands:['Tessalon'], drugClass:'Antitussive', schedule:null,
    doseForms:[{dose:'100',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'200',unit:'mg',route:'PO',defaultFreq:'TID'}],
    defaultDoseIndex:0, commonIndications:['Cough'], allergyTags:['benzonatate'] },

  // ── GI ──
  { generic:'Omeprazole', brands:['Prilosec'], drugClass:'PPI', schedule:null,
    doseForms:[{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'40',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['GERD','Peptic Ulcer','Gastritis'], allergyTags:['omeprazole','ppi'] },
  { generic:'Pantoprazole', brands:['Protonix'], drugClass:'PPI', schedule:null,
    doseForms:[{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'40',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'40',unit:'mg',route:'IV',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['GERD','Peptic Ulcer'], allergyTags:['pantoprazole','ppi'] },
  { generic:'Esomeprazole', brands:['Nexium'], drugClass:'PPI', schedule:null,
    doseForms:[{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'40',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['GERD','Erosive Esophagitis'], allergyTags:['esomeprazole','ppi'] },
  { generic:'Lansoprazole', brands:['Prevacid'], drugClass:'PPI', schedule:null,
    doseForms:[{dose:'15',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'30',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['GERD','Peptic Ulcer'], allergyTags:['lansoprazole','ppi'] },
  { generic:'Famotidine', brands:['Pepcid'], drugClass:'H2 Blocker', schedule:null,
    doseForms:[{dose:'10',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'40',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'20',unit:'mg',route:'IV',defaultFreq:'Q12h'}],
    defaultDoseIndex:1, commonIndications:['GERD','Peptic Ulcer','Heartburn'], allergyTags:['famotidine'] },
  // Ranitidine (Zantac) removed — FDA-withdrawn April 2020 due to NDMA contamination
  { generic:'Ondansetron', brands:['Zofran'], drugClass:'Antiemetic', schedule:null,
    doseForms:[{dose:'4',unit:'mg',route:'PO',defaultFreq:'Q8h'},{dose:'8',unit:'mg',route:'PO',defaultFreq:'Q8h'},{dose:'4',unit:'mg',route:'IV',defaultFreq:'Q8h'}],
    defaultDoseIndex:0, commonIndications:['Nausea','Vomiting'], allergyTags:['ondansetron'] },
  { generic:'Promethazine', brands:['Phenergan'], drugClass:'Antiemetic', schedule:null,
    doseForms:[{dose:'12.5',unit:'mg',route:'PO',defaultFreq:'Q6h'},{dose:'25',unit:'mg',route:'PO',defaultFreq:'Q6h'},{dose:'25',unit:'mg',route:'PR',defaultFreq:'Q6h'}],
    defaultDoseIndex:1, commonIndications:['Nausea','Vomiting','Allergic Reaction'], allergyTags:['promethazine'] },
  { generic:'Metoclopramide', brands:['Reglan'], drugClass:'Prokinetic', schedule:null,
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'10',unit:'mg',route:'IV',defaultFreq:'TID'}],
    defaultDoseIndex:1, commonIndications:['Gastroparesis','Nausea'], allergyTags:['metoclopramide'] },
  { generic:'Docusate', brands:['Colace'], drugClass:'Stool Softener', schedule:null,
    doseForms:[{dose:'100',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'250',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Constipation'], allergyTags:['docusate'] },
  { generic:'Polyethylene Glycol', brands:['MiraLAX'], drugClass:'Osmotic Laxative', schedule:null,
    doseForms:[{dose:'17',unit:'g',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Constipation'], allergyTags:['polyethylene glycol'] },
  { generic:'Bisacodyl', brands:['Dulcolax'], drugClass:'Stimulant Laxative', schedule:null,
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'10',unit:'mg',route:'PR',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Constipation'], allergyTags:['bisacodyl'] },
  { generic:'Loperamide', brands:['Imodium'], drugClass:'Antidiarrheal', schedule:null,
    doseForms:[{dose:'2',unit:'mg',route:'PO',defaultFreq:'PRN'}],
    defaultDoseIndex:0, commonIndications:['Diarrhea'], allergyTags:['loperamide'] },
  { generic:'Sucralfate', brands:['Carafate'], drugClass:'Mucosal Protectant', schedule:null,
    doseForms:[{dose:'1',unit:'g',route:'PO',defaultFreq:'QID'}],
    defaultDoseIndex:0, commonIndications:['Peptic Ulcer','GI Protection'], allergyTags:['sucralfate'] },

  // ── GU ──
  { generic:'Tamsulosin', brands:['Flomax'], drugClass:'Alpha Blocker', schedule:null,
    doseForms:[{dose:'0.4',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'0.8',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['BPH','Kidney Stones'], allergyTags:['tamsulosin'] },
  { generic:'Finasteride', brands:['Proscar','Propecia'], drugClass:'5-Alpha Reductase Inhibitor', schedule:null,
    doseForms:[{dose:'1',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['BPH','Male Pattern Baldness'], allergyTags:['finasteride'] },
  { generic:'Oxybutynin', brands:['Ditropan'], drugClass:'Anticholinergic', schedule:null,
    doseForms:[{dose:'2.5',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'5',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'5',unit:'mg',route:'PO',defaultFreq:'TID'}],
    defaultDoseIndex:1, commonIndications:['Overactive Bladder','Urinary Incontinence'], allergyTags:['oxybutynin'] },
  { generic:'Tolterodine', brands:['Detrol'], drugClass:'Anticholinergic', schedule:null,
    doseForms:[{dose:'1',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'2',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'4',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Overactive Bladder'], allergyTags:['tolterodine'] },
  { generic:'Sildenafil', brands:['Viagra','Revatio'], drugClass:'PDE5 Inhibitor', schedule:null,
    doseForms:[{dose:'20',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'25',unit:'mg',route:'PO',defaultFreq:'PRN'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'PRN'},{dose:'100',unit:'mg',route:'PO',defaultFreq:'PRN'}],
    defaultDoseIndex:2, commonIndications:['Erectile Dysfunction','Pulmonary Hypertension'], allergyTags:['sildenafil','pde5 inhibitor'] },
  { generic:'Tadalafil', brands:['Cialis','Adcirca'], drugClass:'PDE5 Inhibitor', schedule:null,
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'PRN'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'PRN'}],
    defaultDoseIndex:0, commonIndications:['Erectile Dysfunction','BPH','Pulmonary Hypertension'], allergyTags:['tadalafil','pde5 inhibitor'] },
  { generic:'Phenazopyridine', brands:['Pyridium'], drugClass:'Urinary Analgesic', schedule:null,
    doseForms:[{dose:'100',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'200',unit:'mg',route:'PO',defaultFreq:'TID'}],
    defaultDoseIndex:1, commonIndications:['UTI Symptom Relief'], allergyTags:['phenazopyridine'] },
  { generic:'Potassium Citrate', brands:['Urocit-K'], drugClass:'Urinary Alkalinizer', schedule:null,
    doseForms:[{dose:'10',unit:'mEq',route:'PO',defaultFreq:'TID'},{dose:'15',unit:'mEq',route:'PO',defaultFreq:'TID'}],
    defaultDoseIndex:0, commonIndications:['Kidney Stones','RTA'], allergyTags:['potassium citrate'] },

  // ── Misc: Antihistamines ──
  { generic:'Cetirizine', brands:['Zyrtec'], drugClass:'Antihistamine', schedule:null,
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Allergies','Urticaria'], allergyTags:['cetirizine'] },
  { generic:'Loratadine', brands:['Claritin'], drugClass:'Antihistamine', schedule:null,
    doseForms:[{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Allergies'], allergyTags:['loratadine'] },
  { generic:'Fexofenadine', brands:['Allegra'], drugClass:'Antihistamine', schedule:null,
    doseForms:[{dose:'60',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'180',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Allergies'], allergyTags:['fexofenadine'] },
  { generic:'Diphenhydramine', brands:['Benadryl'], drugClass:'Antihistamine', schedule:null,
    doseForms:[{dose:'25',unit:'mg',route:'PO',defaultFreq:'Q6h'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'Q6h'},{dose:'25',unit:'mg',route:'IV',defaultFreq:'Q6h'}],
    defaultDoseIndex:0, commonIndications:['Allergies','Insomnia','Anaphylaxis'], allergyTags:['diphenhydramine'] },

  // ── Misc: Supplements / Vitamins ──
  { generic:'Vitamin D3', brands:['Cholecalciferol'], drugClass:'Vitamin', schedule:null,
    doseForms:[{dose:'1000',unit:'units',route:'PO',defaultFreq:'QDay'},{dose:'2000',unit:'units',route:'PO',defaultFreq:'QDay'},{dose:'5000',unit:'units',route:'PO',defaultFreq:'QDay'},{dose:'50000',unit:'units',route:'PO',defaultFreq:'QWeek'}],
    defaultDoseIndex:1, commonIndications:['Vitamin D Deficiency'], allergyTags:['vitamin d'] },
  { generic:'Ferrous Sulfate', brands:['Feosol'], drugClass:'Iron Supplement', schedule:null,
    doseForms:[{dose:'325',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'325',unit:'mg',route:'PO',defaultFreq:'TID'}],
    defaultDoseIndex:0, commonIndications:['Iron Deficiency Anemia'], allergyTags:['ferrous sulfate','iron'] },
  { generic:'Calcium Carbonate', brands:['Tums','Os-Cal'], drugClass:'Calcium Supplement', schedule:null,
    doseForms:[{dose:'500',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'600',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'1250',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Calcium Supplementation','Osteoporosis'], allergyTags:['calcium carbonate'] },
  { generic:'Potassium Chloride', brands:['Klor-Con','K-Dur'], drugClass:'Electrolyte', schedule:null,
    doseForms:[{dose:'10',unit:'mEq',route:'PO',defaultFreq:'QDay'},{dose:'20',unit:'mEq',route:'PO',defaultFreq:'QDay'},{dose:'40',unit:'mEq',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Hypokalemia'], allergyTags:['potassium chloride'] },
  { generic:'Folic Acid', brands:[], drugClass:'Vitamin', schedule:null,
    doseForms:[{dose:'0.4',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'1',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Folate Deficiency','Pregnancy'], allergyTags:['folic acid'] },
  { generic:'Cyanocobalamin', brands:['Vitamin B12'], drugClass:'Vitamin', schedule:null,
    doseForms:[{dose:'100',unit:'mcg',route:'PO',defaultFreq:'QDay'},{dose:'1000',unit:'mcg',route:'PO',defaultFreq:'QDay'},{dose:'1000',unit:'mcg',route:'IM',defaultFreq:'QWeek'}],
    defaultDoseIndex:1, commonIndications:['B12 Deficiency','Pernicious Anemia'], allergyTags:['cyanocobalamin','vitamin b12'] },
  { generic:'Magnesium Oxide', brands:['Mag-Ox'], drugClass:'Mineral Supplement', schedule:null,
    doseForms:[{dose:'400',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'800',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Hypomagnesemia','Constipation'], allergyTags:['magnesium oxide'] },

  // ── Misc: Topicals ──
  { generic:'Mupirocin', brands:['Bactroban'], drugClass:'Topical Antibiotic', schedule:null,
    doseForms:[{dose:'2',unit:'%',route:'Topical',defaultFreq:'TID'}],
    defaultDoseIndex:0, commonIndications:['Skin Infection','Impetigo'], allergyTags:['mupirocin'] },
  { generic:'Triamcinolone Acetonide', brands:['Kenalog'], drugClass:'Topical Corticosteroid', schedule:null,
    doseForms:[{dose:'0.025',unit:'%',route:'Topical',defaultFreq:'BID'},{dose:'0.1',unit:'%',route:'Topical',defaultFreq:'BID'},{dose:'0.5',unit:'%',route:'Topical',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Eczema','Dermatitis','Rash'], allergyTags:['triamcinolone','corticosteroid'] },
  { generic:'Hydrocortisone', brands:['Cortaid'], drugClass:'Topical Corticosteroid', schedule:null,
    doseForms:[{dose:'1',unit:'%',route:'Topical',defaultFreq:'BID'},{dose:'2.5',unit:'%',route:'Topical',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Dermatitis','Itch','Rash'], allergyTags:['hydrocortisone','corticosteroid'] },
  { generic:'Clotrimazole', brands:['Lotrimin'], drugClass:'Topical Antifungal', schedule:null,
    doseForms:[{dose:'1',unit:'%',route:'Topical',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Fungal Skin Infection','Athletes Foot'], allergyTags:['clotrimazole'] },
  { generic:'Permethrin', brands:['Nix','Elimite'], drugClass:'Topical Antiparasitic', schedule:null,
    doseForms:[{dose:'5',unit:'%',route:'Topical',defaultFreq:'Once'}],
    defaultDoseIndex:0, commonIndications:['Scabies','Lice'], allergyTags:['permethrin'] },

  // ── Misc: Ophthalmic ──
  { generic:'Timolol', brands:['Timoptic'], drugClass:'Ophthalmic Beta-Blocker', schedule:null,
    doseForms:[{dose:'0.25',unit:'%',route:'Topical',defaultFreq:'BID'},{dose:'0.5',unit:'%',route:'Topical',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Glaucoma'], allergyTags:['timolol','beta blocker'] },
  { generic:'Latanoprost', brands:['Xalatan'], drugClass:'Prostaglandin Analog', schedule:null,
    doseForms:[{dose:'0.005',unit:'%',route:'Topical',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Glaucoma'], allergyTags:['latanoprost'] },
  { generic:'Erythromycin Ophthalmic', brands:['Ilotycin'], drugClass:'Ophthalmic Antibiotic', schedule:null,
    doseForms:[{dose:'0.5',unit:'%',route:'Topical',defaultFreq:'QID'}],
    defaultDoseIndex:0, commonIndications:['Bacterial Conjunctivitis'], allergyTags:['erythromycin','macrolide'] },

  // ── Misc: Sleep ──
  { generic:'Zolpidem', brands:['Ambien'], drugClass:'Sedative-Hypnotic', schedule:'IV',
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Insomnia'], allergyTags:['zolpidem'] },
  { generic:'Melatonin', brands:[], drugClass:'Supplement', schedule:null,
    doseForms:[{dose:'1',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'3',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Insomnia','Sleep Aid'], allergyTags:['melatonin'] },
  { generic:'Suvorexant', brands:['Belsomra'], drugClass:'Orexin Antagonist', schedule:'IV',
    doseForms:[{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'15',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Insomnia'], allergyTags:['suvorexant'] },

  // ── Misc: Other ──
  { generic:'Epinephrine', brands:['EpiPen','Adrenalin'], drugClass:'Sympathomimetic', schedule:null,
    doseForms:[{dose:'0.3',unit:'mg',route:'IM',defaultFreq:'PRN'},{dose:'0.15',unit:'mg',route:'IM',defaultFreq:'PRN'},{dose:'1',unit:'mg',route:'IV',defaultFreq:'PRN'}],
    defaultDoseIndex:0, commonIndications:['Anaphylaxis','Cardiac Arrest'], allergyTags:['epinephrine'] },
  { generic:'Lidocaine', brands:['Xylocaine'], drugClass:'Local Anesthetic', schedule:null,
    doseForms:[{dose:'1',unit:'%',route:'Topical',defaultFreq:'PRN'},{dose:'2',unit:'%',route:'Topical',defaultFreq:'PRN'}],
    defaultDoseIndex:0, commonIndications:['Local Anesthesia','Pain'], allergyTags:['lidocaine','amide anesthetic'] },
  { generic:'Methotrexate', brands:['Trexall','Rheumatrex'], drugClass:'DMARD', schedule:null,
    doseForms:[{dose:'7.5',unit:'mg',route:'PO',defaultFreq:'QWeek'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'QWeek'},{dose:'15',unit:'mg',route:'PO',defaultFreq:'QWeek'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'QWeek'},{dose:'25',unit:'mg',route:'SQ',defaultFreq:'QWeek'}],
    defaultDoseIndex:1, commonIndications:['Rheumatoid Arthritis','Psoriasis'], allergyTags:['methotrexate'] },
  { generic:'Alendronate', brands:['Fosamax'], drugClass:'Bisphosphonate', schedule:null,
    doseForms:[{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'35',unit:'mg',route:'PO',defaultFreq:'QWeek'},{dose:'70',unit:'mg',route:'PO',defaultFreq:'QWeek'}],
    defaultDoseIndex:2, commonIndications:['Osteoporosis'], allergyTags:['alendronate','bisphosphonate'] },
  { generic:'Clonidine', brands:['Catapres'], drugClass:'Alpha-2 Agonist', schedule:null,
    doseForms:[{dose:'0.1',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'0.2',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'0.3',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Hypertension','ADHD','Withdrawal'], allergyTags:['clonidine'] },
  { generic:'Desmopressin', brands:['DDAVP'], drugClass:'ADH Analog', schedule:null,
    doseForms:[{dose:'0.1',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'0.2',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'10',unit:'mcg',route:'Inhaled',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Diabetes Insipidus','Nocturnal Enuresis'], allergyTags:['desmopressin'] },

  // ── Neurology: Triptans / Migraine ──
  { generic:'Sumatriptan', brands:['Imitrex'], drugClass:'Triptan', schedule:null,
    doseForms:[{dose:'25',unit:'mg',route:'PO',defaultFreq:'PRN'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'PRN'},{dose:'100',unit:'mg',route:'PO',defaultFreq:'PRN'},{dose:'6',unit:'mg',route:'SQ',defaultFreq:'PRN'}],
    defaultDoseIndex:1, commonIndications:['Migraine','Cluster Headache'], allergyTags:['sumatriptan','triptan'] },
  { generic:'Rizatriptan', brands:['Maxalt'], drugClass:'Triptan', schedule:null,
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'PRN'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'PRN'}],
    defaultDoseIndex:1, commonIndications:['Migraine'], allergyTags:['rizatriptan','triptan'] },
  { generic:'Zolmitriptan', brands:['Zomig'], drugClass:'Triptan', schedule:null,
    doseForms:[{dose:'2.5',unit:'mg',route:'PO',defaultFreq:'PRN'},{dose:'5',unit:'mg',route:'PO',defaultFreq:'PRN'}],
    defaultDoseIndex:0, commonIndications:['Migraine'], allergyTags:['zolmitriptan','triptan'] },
  { generic:'Eletriptan', brands:['Relpax'], drugClass:'Triptan', schedule:null,
    doseForms:[{dose:'20',unit:'mg',route:'PO',defaultFreq:'PRN'},{dose:'40',unit:'mg',route:'PO',defaultFreq:'PRN'}],
    defaultDoseIndex:1, commonIndications:['Migraine'], allergyTags:['eletriptan','triptan'] },
  { generic:'Naratriptan', brands:['Amerge'], drugClass:'Triptan', schedule:null,
    doseForms:[{dose:'1',unit:'mg',route:'PO',defaultFreq:'PRN'},{dose:'2.5',unit:'mg',route:'PO',defaultFreq:'PRN'}],
    defaultDoseIndex:1, commonIndications:['Migraine'], allergyTags:['naratriptan','triptan'] },
  { generic:'Frovatriptan', brands:['Frova'], drugClass:'Triptan', schedule:null,
    doseForms:[{dose:'2.5',unit:'mg',route:'PO',defaultFreq:'PRN'}],
    defaultDoseIndex:0, commonIndications:['Migraine','Menstrual Migraine'], allergyTags:['frovatriptan','triptan'] },
  { generic:'Erenumab', brands:['Aimovig'], drugClass:'CGRP Antagonist', schedule:null,
    doseForms:[{dose:'70',unit:'mg',route:'SQ',defaultFreq:'QMonth'},{dose:'140',unit:'mg',route:'SQ',defaultFreq:'QMonth'}],
    defaultDoseIndex:0, commonIndications:['Migraine Prophylaxis'], allergyTags:['erenumab','cgrp antagonist'] },
  { generic:'Fremanezumab', brands:['Ajovy'], drugClass:'CGRP Antagonist', schedule:null,
    doseForms:[{dose:'225',unit:'mg',route:'SQ',defaultFreq:'QMonth'},{dose:'675',unit:'mg',route:'SQ',defaultFreq:'Q3months'}],
    defaultDoseIndex:0, commonIndications:['Migraine Prophylaxis'], allergyTags:['fremanezumab','cgrp antagonist'] },

  // ── Neurology: Parkinson's Disease ──
  { generic:'Carbidopa/Levodopa', brands:['Sinemet'], drugClass:'Dopamine Precursor', schedule:null,
    doseForms:[{dose:'10/100',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'25/100',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'25/250',unit:'mg',route:'PO',defaultFreq:'TID'}],
    defaultDoseIndex:1, commonIndications:['Parkinson\'s Disease'], allergyTags:['carbidopa','levodopa'] },
  { generic:'Pramipexole', brands:['Mirapex'], drugClass:'Dopamine Agonist', schedule:null,
    doseForms:[{dose:'0.125',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'0.25',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'0.5',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'1',unit:'mg',route:'PO',defaultFreq:'TID'}],
    defaultDoseIndex:0, commonIndications:['Parkinson\'s Disease','Restless Legs Syndrome'], allergyTags:['pramipexole'] },
  { generic:'Ropinirole', brands:['Requip'], drugClass:'Dopamine Agonist', schedule:null,
    doseForms:[{dose:'0.25',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'0.5',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'1',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'2',unit:'mg',route:'PO',defaultFreq:'TID'}],
    defaultDoseIndex:0, commonIndications:['Parkinson\'s Disease','Restless Legs Syndrome'], allergyTags:['ropinirole'] },
  { generic:'Selegiline', brands:['Eldepryl','Emsam'], drugClass:'MAO-B Inhibitor', schedule:null,
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Parkinson\'s Disease'], allergyTags:['selegiline','mao inhibitor'] },
  { generic:'Rasagiline', brands:['Azilect'], drugClass:'MAO-B Inhibitor', schedule:null,
    doseForms:[{dose:'0.5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'1',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Parkinson\'s Disease'], allergyTags:['rasagiline','mao inhibitor'] },
  { generic:'Entacapone', brands:['Comtan'], drugClass:'COMT Inhibitor', schedule:null,
    doseForms:[{dose:'200',unit:'mg',route:'PO',defaultFreq:'TID'}],
    defaultDoseIndex:0, commonIndications:['Parkinson\'s Disease'], allergyTags:['entacapone'] },
  { generic:'Amantadine', brands:['Symmetrel'], drugClass:'Antiviral/Dopaminergic', schedule:null,
    doseForms:[{dose:'100',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Parkinson\'s Disease','Influenza A','Dyskinesia'], allergyTags:['amantadine'] },
  { generic:'Benztropine', brands:['Cogentin'], drugClass:'Anticholinergic', schedule:null,
    doseForms:[{dose:'0.5',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'1',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'2',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Parkinson\'s Disease','EPS','Dystonia'], allergyTags:['benztropine'] },
  { generic:'Trihexyphenidyl', brands:['Artane'], drugClass:'Anticholinergic', schedule:null,
    doseForms:[{dose:'2',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'5',unit:'mg',route:'PO',defaultFreq:'TID'}],
    defaultDoseIndex:0, commonIndications:['Parkinson\'s Disease','EPS'], allergyTags:['trihexyphenidyl'] },

  // ── Neurology: Dementia ──
  { generic:'Donepezil', brands:['Aricept'], drugClass:'Cholinesterase Inhibitor', schedule:null,
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'23',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Alzheimer\'s Disease','Dementia'], allergyTags:['donepezil'] },
  { generic:'Rivastigmine', brands:['Exelon'], drugClass:'Cholinesterase Inhibitor', schedule:null,
    doseForms:[{dose:'1.5',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'3',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'4.5',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'6',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'4.6',unit:'mg',route:'Topical',defaultFreq:'QDay'},{dose:'9.5',unit:'mg',route:'Topical',defaultFreq:'QDay'},{dose:'13.3',unit:'mg',route:'Topical',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Alzheimer\'s Disease','Parkinson\'s Dementia'], allergyTags:['rivastigmine'] },
  { generic:'Galantamine', brands:['Razadyne'], drugClass:'Cholinesterase Inhibitor', schedule:null,
    doseForms:[{dose:'4',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'8',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'12',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Alzheimer\'s Disease'], allergyTags:['galantamine'] },
  { generic:'Memantine', brands:['Namenda'], drugClass:'NMDA Antagonist', schedule:null,
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Alzheimer\'s Disease'], allergyTags:['memantine'] },

  // ── Neurology: MS ──
  { generic:'Dimethyl Fumarate', brands:['Tecfidera'], drugClass:'Immunomodulator', schedule:null,
    doseForms:[{dose:'120',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'240',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Multiple Sclerosis'], allergyTags:['dimethyl fumarate'] },
  { generic:'Fingolimod', brands:['Gilenya'], drugClass:'S1P Modulator', schedule:null,
    doseForms:[{dose:'0.5',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Multiple Sclerosis'], allergyTags:['fingolimod'] },
  { generic:'Glatiramer', brands:['Copaxone'], drugClass:'Immunomodulator', schedule:null,
    doseForms:[{dose:'20',unit:'mg',route:'SQ',defaultFreq:'QDay'},{dose:'40',unit:'mg',route:'SQ',defaultFreq:'QWeek'}],
    defaultDoseIndex:0, commonIndications:['Multiple Sclerosis'], allergyTags:['glatiramer'] },

  // ── OB/GYN: Contraceptives & Hormones ──
  { generic:'Ethinyl Estradiol/Norethindrone', brands:['Loestrin','Junel'], drugClass:'Oral Contraceptive', schedule:null,
    doseForms:[{dose:'1/20',unit:'mg/mcg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Contraception','Menstrual Regulation'], allergyTags:['ethinyl estradiol','norethindrone','estrogen'] },
  { generic:'Ethinyl Estradiol/Levonorgestrel', brands:['Alesse','Seasonale'], drugClass:'Oral Contraceptive', schedule:null,
    doseForms:[{dose:'0.03/0.15',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Contraception'], allergyTags:['ethinyl estradiol','levonorgestrel','estrogen'] },
  { generic:'Ethinyl Estradiol/Drospirenone', brands:['Yaz','Yasmin'], drugClass:'Oral Contraceptive', schedule:null,
    doseForms:[{dose:'0.02/3',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'0.03/3',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Contraception','PMDD','Acne'], allergyTags:['ethinyl estradiol','drospirenone','estrogen'] },
  { generic:'Norethindrone', brands:['Micronor','Camila'], drugClass:'Progestin-Only Pill', schedule:null,
    doseForms:[{dose:'0.35',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Contraception'], allergyTags:['norethindrone','progestin'] },
  { generic:'Medroxyprogesterone', brands:['Provera','Depo-Provera'], drugClass:'Progestin', schedule:null,
    doseForms:[{dose:'2.5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'150',unit:'mg',route:'IM',defaultFreq:'Q3months'}],
    defaultDoseIndex:1, commonIndications:['Abnormal Uterine Bleeding','Contraception','Amenorrhea'], allergyTags:['medroxyprogesterone','progestin'] },
  { generic:'Etonogestrel/Ethinyl Estradiol', brands:['NuvaRing'], drugClass:'Vaginal Contraceptive', schedule:null,
    doseForms:[{dose:'0.12/0.015',unit:'mg/day',route:'Other',defaultFreq:'QWeek'}],
    defaultDoseIndex:0, commonIndications:['Contraception'], allergyTags:['etonogestrel','ethinyl estradiol','estrogen'] },
  { generic:'Levonorgestrel IUD', brands:['Mirena','Kyleena'], drugClass:'IUD', schedule:null,
    doseForms:[{dose:'52',unit:'mg',route:'Other',defaultFreq:'Once'},{dose:'19.5',unit:'mg',route:'Other',defaultFreq:'Once'}],
    defaultDoseIndex:0, commonIndications:['Contraception','Menorrhagia'], allergyTags:['levonorgestrel'] },
  { generic:'Conjugated Estrogens', brands:['Premarin'], drugClass:'Estrogen', schedule:null,
    doseForms:[{dose:'0.3',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'0.45',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'0.625',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'1.25',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:2, commonIndications:['Menopause','Osteoporosis','Vaginal Atrophy'], allergyTags:['conjugated estrogens','estrogen'] },
  { generic:'Estradiol', brands:['Estrace','Vivelle-Dot'], drugClass:'Estrogen', schedule:null,
    doseForms:[{dose:'0.5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'1',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'2',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'0.05',unit:'mg/day',route:'Topical',defaultFreq:'QWeek'},{dose:'0.1',unit:'mg/day',route:'Topical',defaultFreq:'QWeek'}],
    defaultDoseIndex:1, commonIndications:['Menopause','Osteoporosis'], allergyTags:['estradiol','estrogen'] },
  { generic:'Progesterone', brands:['Prometrium'], drugClass:'Progestin', schedule:null,
    doseForms:[{dose:'100',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'200',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Menopause','Luteal Support','Amenorrhea'], allergyTags:['progesterone','progestin'] },
  { generic:'Clomiphene', brands:['Clomid','Serophene'], drugClass:'Ovulation Stimulant', schedule:null,
    doseForms:[{dose:'50',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'100',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Infertility','Anovulation'], allergyTags:['clomiphene'] },
  { generic:'Misoprostol', brands:['Cytotec'], drugClass:'Prostaglandin E1 Analog', schedule:null,
    doseForms:[{dose:'100',unit:'mcg',route:'PO',defaultFreq:'QID'},{dose:'200',unit:'mcg',route:'PO',defaultFreq:'QID'}],
    defaultDoseIndex:1, commonIndications:['NSAID Gastroprotection','Cervical Ripening'], allergyTags:['misoprostol'] },
  { generic:'Terbutaline', brands:['Brethine'], drugClass:'Beta-2 Agonist', schedule:null,
    doseForms:[{dose:'2.5',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'5',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'0.25',unit:'mg',route:'SQ',defaultFreq:'PRN'}],
    defaultDoseIndex:0, commonIndications:['Tocolysis','Bronchospasm'], allergyTags:['terbutaline'] },

  // ── Infectious Disease: Aminoglycosides ──
  { generic:'Gentamicin', brands:['Garamycin'], drugClass:'Aminoglycoside', schedule:null,
    doseForms:[{dose:'80',unit:'mg',route:'IV',defaultFreq:'Q8h'},{dose:'5',unit:'mg',route:'IV',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Gram-Negative Infection','Endocarditis'], allergyTags:['gentamicin','aminoglycoside'] },
  { generic:'Tobramycin', brands:['Nebcin','TOBI'], drugClass:'Aminoglycoside', schedule:null,
    doseForms:[{dose:'80',unit:'mg',route:'IV',defaultFreq:'Q8h'},{dose:'300',unit:'mg',route:'Inhaled',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Gram-Negative Infection','CF Pulmonary'], allergyTags:['tobramycin','aminoglycoside'] },
  { generic:'Amikacin', brands:['Amikin'], drugClass:'Aminoglycoside', schedule:null,
    doseForms:[{dose:'15',unit:'mg/kg',route:'IV',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Gram-Negative Infection','Mycobacterial'], allergyTags:['amikacin','aminoglycoside'], weightBased:true },

  // ── Infectious Disease: Carbapenems ──
  { generic:'Meropenem', brands:['Merrem'], drugClass:'Carbapenem', schedule:null,
    doseForms:[{dose:'500',unit:'mg',route:'IV',defaultFreq:'Q8h'},{dose:'1',unit:'g',route:'IV',defaultFreq:'Q8h'},{dose:'2',unit:'g',route:'IV',defaultFreq:'Q8h'}],
    defaultDoseIndex:1, commonIndications:['Serious Infection','Meningitis','Intra-abdominal Infection'], allergyTags:['meropenem','carbapenem','beta-lactam'] },
  { generic:'Ertapenem', brands:['Invanz'], drugClass:'Carbapenem', schedule:null,
    doseForms:[{dose:'1',unit:'g',route:'IV',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Intra-abdominal Infection','Pneumonia','UTI'], allergyTags:['ertapenem','carbapenem','beta-lactam'] },
  { generic:'Imipenem/Cilastatin', brands:['Primaxin'], drugClass:'Carbapenem', schedule:null,
    doseForms:[{dose:'250',unit:'mg',route:'IV',defaultFreq:'Q6h'},{dose:'500',unit:'mg',route:'IV',defaultFreq:'Q6h'},{dose:'1',unit:'g',route:'IV',defaultFreq:'Q8h'}],
    defaultDoseIndex:1, commonIndications:['Serious Infection','Polymicrobial Infection'], allergyTags:['imipenem','cilastatin','carbapenem','beta-lactam'] },

  // ── Infectious Disease: More Cephalosporins ──
  { generic:'Cefuroxime', brands:['Ceftin','Zinacef'], drugClass:'Cephalosporin', schedule:null,
    doseForms:[{dose:'250',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'500',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'750',unit:'mg',route:'IV',defaultFreq:'Q8h'},{dose:'1.5',unit:'g',route:'IV',defaultFreq:'Q8h'}],
    defaultDoseIndex:1, commonIndications:['Pneumonia','Sinusitis','UTI'], allergyTags:['cefuroxime','cephalosporin','beta-lactam'] },
  { generic:'Cefpodoxime', brands:['Vantin'], drugClass:'Cephalosporin', schedule:null,
    doseForms:[{dose:'100',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'200',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Pneumonia','UTI','Pharyngitis'], allergyTags:['cefpodoxime','cephalosporin','beta-lactam'] },
  { generic:'Ceftazidime', brands:['Fortaz','Tazicef'], drugClass:'Cephalosporin', schedule:null,
    doseForms:[{dose:'1',unit:'g',route:'IV',defaultFreq:'Q8h'},{dose:'2',unit:'g',route:'IV',defaultFreq:'Q8h'}],
    defaultDoseIndex:0, commonIndications:['Pseudomonas Infection','Nosocomial Pneumonia'], allergyTags:['ceftazidime','cephalosporin','beta-lactam'] },
  { generic:'Cefepime', brands:['Maxipime'], drugClass:'Cephalosporin', schedule:null,
    doseForms:[{dose:'1',unit:'g',route:'IV',defaultFreq:'Q12h'},{dose:'2',unit:'g',route:'IV',defaultFreq:'Q8h'}],
    defaultDoseIndex:0, commonIndications:['Febrile Neutropenia','Nosocomial Pneumonia','UTI'], allergyTags:['cefepime','cephalosporin','beta-lactam'] },

  // ── Infectious Disease: More Antibiotics ──
  { generic:'Linezolid', brands:['Zyvox'], drugClass:'Oxazolidinone', schedule:null,
    doseForms:[{dose:'600',unit:'mg',route:'PO',defaultFreq:'Q12h'},{dose:'600',unit:'mg',route:'IV',defaultFreq:'Q12h'}],
    defaultDoseIndex:0, commonIndications:['MRSA','VRE','Nosocomial Pneumonia'], allergyTags:['linezolid'] },
  { generic:'Daptomycin', brands:['Cubicin'], drugClass:'Lipopeptide', schedule:null,
    doseForms:[{dose:'4',unit:'mg/kg',route:'IV',defaultFreq:'QDay'},{dose:'6',unit:'mg/kg',route:'IV',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['MRSA Bacteremia','Endocarditis','Skin Infection'], allergyTags:['daptomycin'], weightBased:true },
  { generic:'Piperacillin/Tazobactam', brands:['Zosyn'], drugClass:'Penicillin/BLI', schedule:null,
    doseForms:[{dose:'3.375',unit:'g',route:'IV',defaultFreq:'Q6h'},{dose:'4.5',unit:'g',route:'IV',defaultFreq:'Q6h'}],
    defaultDoseIndex:1, commonIndications:['Intra-abdominal Infection','Nosocomial Pneumonia','Sepsis'], allergyTags:['piperacillin','tazobactam','penicillin','beta-lactam'] },
  { generic:'Ampicillin/Sulbactam', brands:['Unasyn'], drugClass:'Penicillin/BLI', schedule:null,
    doseForms:[{dose:'1.5',unit:'g',route:'IV',defaultFreq:'Q6h'},{dose:'3',unit:'g',route:'IV',defaultFreq:'Q6h'}],
    defaultDoseIndex:1, commonIndications:['Intra-abdominal Infection','Skin Infection','Aspiration PNA'], allergyTags:['ampicillin','sulbactam','penicillin','beta-lactam'] },
  { generic:'Ceftaroline', brands:['Teflaro'], drugClass:'Cephalosporin', schedule:null,
    doseForms:[{dose:'600',unit:'mg',route:'IV',defaultFreq:'Q12h'}],
    defaultDoseIndex:0, commonIndications:['MRSA Skin Infection','Community-Acquired Pneumonia'], allergyTags:['ceftaroline','cephalosporin','beta-lactam'] },
  { generic:'Tedizolid', brands:['Sivextro'], drugClass:'Oxazolidinone', schedule:null,
    doseForms:[{dose:'200',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'200',unit:'mg',route:'IV',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['ABSSSI','MRSA Skin Infection'], allergyTags:['tedizolid'] },
  { generic:'Tigecycline', brands:['Tygacil'], drugClass:'Glycylcycline', schedule:null,
    doseForms:[{dose:'50',unit:'mg',route:'IV',defaultFreq:'Q12h'}],
    defaultDoseIndex:0, commonIndications:['Intra-abdominal Infection','Skin Infection'], allergyTags:['tigecycline','tetracycline'] },
  { generic:'Fosfomycin', brands:['Monurol'], drugClass:'Phosphonic Acid', schedule:null,
    doseForms:[{dose:'3',unit:'g',route:'PO',defaultFreq:'Once'}],
    defaultDoseIndex:0, commonIndications:['Uncomplicated UTI'], allergyTags:['fosfomycin'] },

  // ── Infectious Disease: Antifungals ──
  { generic:'Itraconazole', brands:['Sporanox'], drugClass:'Antifungal', schedule:null,
    doseForms:[{dose:'100',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'200',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Fungal Infection','Onychomycosis','Blastomycosis'], allergyTags:['itraconazole','azole antifungal'] },
  { generic:'Voriconazole', brands:['Vfend'], drugClass:'Antifungal', schedule:null,
    doseForms:[{dose:'200',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'4',unit:'mg',route:'IV',defaultFreq:'Q12h'}],
    defaultDoseIndex:0, commonIndications:['Aspergillosis','Candidiasis'], allergyTags:['voriconazole','azole antifungal'] },
  { generic:'Posaconazole', brands:['Noxafil'], drugClass:'Antifungal', schedule:null,
    doseForms:[{dose:'100',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'300',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'300',unit:'mg',route:'IV',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Fungal Prophylaxis','Aspergillosis'], allergyTags:['posaconazole','azole antifungal'] },
  { generic:'Micafungin', brands:['Mycamine'], drugClass:'Echinocandin', schedule:null,
    doseForms:[{dose:'50',unit:'mg',route:'IV',defaultFreq:'QDay'},{dose:'100',unit:'mg',route:'IV',defaultFreq:'QDay'},{dose:'150',unit:'mg',route:'IV',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Candidemia','Candidiasis','Fungal Prophylaxis'], allergyTags:['micafungin','echinocandin'] },
  { generic:'Caspofungin', brands:['Cancidas'], drugClass:'Echinocandin', schedule:null,
    doseForms:[{dose:'50',unit:'mg',route:'IV',defaultFreq:'QDay'},{dose:'70',unit:'mg',route:'IV',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Candidemia','Aspergillosis','Candidiasis'], allergyTags:['caspofungin','echinocandin'] },
  { generic:'Terbinafine', brands:['Lamisil'], drugClass:'Antifungal', schedule:null,
    doseForms:[{dose:'250',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Onychomycosis','Tinea'], allergyTags:['terbinafine'] },
  { generic:'Amphotericin B', brands:['Abelcet','AmBisome'], drugClass:'Antifungal', schedule:null,
    doseForms:[{dose:'3',unit:'mg/kg',route:'IV',defaultFreq:'QDay'},{dose:'5',unit:'mg/kg',route:'IV',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Systemic Fungal Infection','Cryptococcal Meningitis'], allergyTags:['amphotericin','amphotericin b'], weightBased:true },
  { generic:'Ketoconazole', brands:['Nizoral'], drugClass:'Antifungal', schedule:null,
    doseForms:[{dose:'200',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'2',unit:'%',route:'Topical',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Fungal Infection','Seborrheic Dermatitis'], allergyTags:['ketoconazole','azole antifungal'] },

  // ── Infectious Disease: Antivirals ──
  { generic:'Tenofovir Disoproxil', brands:['Viread'], drugClass:'NRTI', schedule:null,
    doseForms:[{dose:'300',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['HIV','Hepatitis B'], allergyTags:['tenofovir'] },
  { generic:'Emtricitabine/Tenofovir', brands:['Truvada','Descovy'], drugClass:'NRTI Combo', schedule:null,
    doseForms:[{dose:'200/300',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'200/25',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['HIV','PrEP'], allergyTags:['emtricitabine','tenofovir'] },
  { generic:'Sofosbuvir/Velpatasvir', brands:['Epclusa'], drugClass:'HCV Antiviral', schedule:null,
    doseForms:[{dose:'400/100',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Hepatitis C'], allergyTags:['sofosbuvir','velpatasvir'] },
  { generic:'Ledipasvir/Sofosbuvir', brands:['Harvoni'], drugClass:'HCV Antiviral', schedule:null,
    doseForms:[{dose:'90/400',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Hepatitis C'], allergyTags:['ledipasvir','sofosbuvir'] },
  { generic:'Entecavir', brands:['Baraclude'], drugClass:'Antiviral', schedule:null,
    doseForms:[{dose:'0.5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'1',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Hepatitis B'], allergyTags:['entecavir'] },
  { generic:'Ribavirin', brands:['Copegus','Rebetol'], drugClass:'Antiviral', schedule:null,
    doseForms:[{dose:'200',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'400',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'600',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Hepatitis C','RSV'], allergyTags:['ribavirin'] },
  { generic:'Nirmatrelvir/Ritonavir', brands:['Paxlovid'], drugClass:'Protease Inhibitor', schedule:null,
    doseForms:[{dose:'300/100',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['COVID-19'], allergyTags:['nirmatrelvir','ritonavir'] },

  // ── Infectious Disease: Antiparasitics ──
  { generic:'Ivermectin', brands:['Stromectol'], drugClass:'Antiparasitic', schedule:null,
    doseForms:[{dose:'3',unit:'mg',route:'PO',defaultFreq:'Once'},{dose:'6',unit:'mg',route:'PO',defaultFreq:'Once'},{dose:'12',unit:'mg',route:'PO',defaultFreq:'Once'}],
    defaultDoseIndex:0, commonIndications:['Strongyloides','Onchocerciasis','Scabies'], allergyTags:['ivermectin'] },
  { generic:'Albendazole', brands:['Albenza'], drugClass:'Anthelmintic', schedule:null,
    doseForms:[{dose:'200',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'400',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Helminth Infection','Neurocysticercosis'], allergyTags:['albendazole'] },
  { generic:'Hydroxychloroquine', brands:['Plaquenil'], drugClass:'Antimalarial', schedule:null,
    doseForms:[{dose:'200',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'200',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'400',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['RA','SLE','Malaria'], allergyTags:['hydroxychloroquine'] },
  { generic:'Atovaquone/Proguanil', brands:['Malarone'], drugClass:'Antimalarial', schedule:null,
    doseForms:[{dose:'250/100',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Malaria Prophylaxis','Malaria Treatment'], allergyTags:['atovaquone','proguanil'] },
  { generic:'Atovaquone', brands:['Mepron'], drugClass:'Antiprotozoal', schedule:null,
    doseForms:[{dose:'750',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['PCP Treatment','PCP Prophylaxis'], allergyTags:['atovaquone'] },

  // ── Rheumatology / Immunology ──
  { generic:'Sulfasalazine', brands:['Azulfidine'], drugClass:'DMARD', schedule:null,
    doseForms:[{dose:'500',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'1000',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Rheumatoid Arthritis','Ulcerative Colitis'], allergyTags:['sulfasalazine','sulfonamide','sulfa'] },
  { generic:'Leflunomide', brands:['Arava'], drugClass:'DMARD', schedule:null,
    doseForms:[{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Rheumatoid Arthritis'], allergyTags:['leflunomide'] },
  { generic:'Adalimumab', brands:['Humira'], drugClass:'TNF Inhibitor', schedule:null,
    doseForms:[{dose:'40',unit:'mg',route:'SQ',defaultFreq:'Q2weeks'}],
    defaultDoseIndex:0, commonIndications:['RA','Psoriasis','Crohn\'s Disease','UC'], allergyTags:['adalimumab','tnf inhibitor'] },
  { generic:'Etanercept', brands:['Enbrel'], drugClass:'TNF Inhibitor', schedule:null,
    doseForms:[{dose:'25',unit:'mg',route:'SQ',defaultFreq:'BID'},{dose:'50',unit:'mg',route:'SQ',defaultFreq:'QWeek'}],
    defaultDoseIndex:1, commonIndications:['RA','Psoriasis','Ankylosing Spondylitis'], allergyTags:['etanercept','tnf inhibitor'] },
  { generic:'Infliximab', brands:['Remicade'], drugClass:'TNF Inhibitor', schedule:null,
    doseForms:[{dose:'5',unit:'mg/kg',route:'IV',defaultFreq:'Q8weeks'}],
    defaultDoseIndex:0, commonIndications:['RA','Crohn\'s Disease','UC','Psoriasis'], allergyTags:['infliximab','tnf inhibitor'], weightBased:true },
  { generic:'Tocilizumab', brands:['Actemra'], drugClass:'IL-6 Inhibitor', schedule:null,
    doseForms:[{dose:'162',unit:'mg',route:'SQ',defaultFreq:'QWeek'},{dose:'4',unit:'mg/kg',route:'IV',defaultFreq:'Q4weeks'}],
    defaultDoseIndex:0, commonIndications:['RA','Giant Cell Arteritis','Cytokine Storm'], allergyTags:['tocilizumab'] },
  { generic:'Tofacitinib', brands:['Xeljanz'], drugClass:'JAK Inhibitor', schedule:null,
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'11',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['RA','UC','Psoriatic Arthritis'], allergyTags:['tofacitinib','jak inhibitor'] },
  { generic:'Upadacitinib', brands:['Rinvoq'], drugClass:'JAK Inhibitor', schedule:null,
    doseForms:[{dose:'15',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'30',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['RA','Atopic Dermatitis','UC'], allergyTags:['upadacitinib','jak inhibitor'] },
  { generic:'Baricitinib', brands:['Olumiant'], drugClass:'JAK Inhibitor', schedule:null,
    doseForms:[{dose:'1',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'2',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'4',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['RA','Atopic Dermatitis'], allergyTags:['baricitinib','jak inhibitor'] },
  { generic:'Apremilast', brands:['Otezla'], drugClass:'PDE4 Inhibitor', schedule:null,
    doseForms:[{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'30',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:2, commonIndications:['Psoriatic Arthritis','Psoriasis'], allergyTags:['apremilast'] },

  // ── Immunosuppressants ──
  { generic:'Mycophenolate Mofetil', brands:['CellCept'], drugClass:'Immunosuppressant', schedule:null,
    doseForms:[{dose:'250',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'500',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'1000',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Transplant Rejection','Lupus Nephritis'], allergyTags:['mycophenolate'] },
  { generic:'Tacrolimus', brands:['Prograf'], drugClass:'Calcineurin Inhibitor', schedule:null,
    doseForms:[{dose:'0.5',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'1',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'2',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'5',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Transplant Rejection'], allergyTags:['tacrolimus'] },
  { generic:'Cyclosporine', brands:['Neoral','Sandimmune'], drugClass:'Calcineurin Inhibitor', schedule:null,
    doseForms:[{dose:'25',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'100',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Transplant Rejection','Psoriasis','RA'], allergyTags:['cyclosporine'] },
  { generic:'Azathioprine', brands:['Imuran'], drugClass:'Immunosuppressant', schedule:null,
    doseForms:[{dose:'25',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'75',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'100',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Transplant Rejection','RA','IBD'], allergyTags:['azathioprine'] },
  { generic:'Sirolimus', brands:['Rapamune'], drugClass:'mTOR Inhibitor', schedule:null,
    doseForms:[{dose:'1',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'2',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Transplant Rejection'], allergyTags:['sirolimus'] },

  // ── Oncology: Common Oral Agents ──
  { generic:'Tamoxifen', brands:['Nolvadex'], drugClass:'SERM', schedule:null,
    doseForms:[{dose:'10',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Breast Cancer','Breast Cancer Prevention'], allergyTags:['tamoxifen'] },
  { generic:'Letrozole', brands:['Femara'], drugClass:'Aromatase Inhibitor', schedule:null,
    doseForms:[{dose:'2.5',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Breast Cancer','Infertility'], allergyTags:['letrozole','aromatase inhibitor'] },
  { generic:'Anastrozole', brands:['Arimidex'], drugClass:'Aromatase Inhibitor', schedule:null,
    doseForms:[{dose:'1',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Breast Cancer'], allergyTags:['anastrozole','aromatase inhibitor'] },
  { generic:'Capecitabine', brands:['Xeloda'], drugClass:'Antimetabolite', schedule:null,
    doseForms:[{dose:'150',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'500',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Breast Cancer','Colon Cancer'], allergyTags:['capecitabine','5-fu'] },
  { generic:'Imatinib', brands:['Gleevec'], drugClass:'Tyrosine Kinase Inhibitor', schedule:null,
    doseForms:[{dose:'100',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'400',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['CML','GIST'], allergyTags:['imatinib'] },
  { generic:'Erlotinib', brands:['Tarceva'], drugClass:'EGFR Inhibitor', schedule:null,
    doseForms:[{dose:'100',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'150',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['NSCLC','Pancreatic Cancer'], allergyTags:['erlotinib'] },
  { generic:'Lenalidomide', brands:['Revlimid'], drugClass:'Immunomodulator', schedule:null,
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'15',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'25',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:2, commonIndications:['Multiple Myeloma','MDS'], allergyTags:['lenalidomide'] },
  { generic:'Hydroxyurea', brands:['Hydrea','Droxia'], drugClass:'Antimetabolite', schedule:null,
    doseForms:[{dose:'500',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'1000',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['CML','Sickle Cell Disease','Polycythemia Vera'], allergyTags:['hydroxyurea'] },
  { generic:'Enzalutamide', brands:['Xtandi'], drugClass:'Androgen Receptor Inhibitor', schedule:null,
    doseForms:[{dose:'40',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'80',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'160',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:2, commonIndications:['Prostate Cancer'], allergyTags:['enzalutamide'] },
  { generic:'Abiraterone', brands:['Zytiga'], drugClass:'CYP17 Inhibitor', schedule:null,
    doseForms:[{dose:'250',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'500',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Prostate Cancer'], allergyTags:['abiraterone'] },

  // ── Hematology ──
  { generic:'Epoetin Alfa', brands:['Epogen','Procrit'], drugClass:'Erythropoietin', schedule:null,
    doseForms:[{dose:'2000',unit:'units',route:'SQ',defaultFreq:'QWeek'},{dose:'4000',unit:'units',route:'SQ',defaultFreq:'QWeek'},{dose:'10000',unit:'units',route:'SQ',defaultFreq:'QWeek'}],
    defaultDoseIndex:1, commonIndications:['Anemia of CKD','Chemotherapy-Induced Anemia'], allergyTags:['epoetin alfa'] },
  { generic:'Darbepoetin Alfa', brands:['Aranesp'], drugClass:'Erythropoietin', schedule:null,
    doseForms:[{dose:'25',unit:'mcg',route:'SQ',defaultFreq:'QWeek'},{dose:'40',unit:'mcg',route:'SQ',defaultFreq:'QWeek'},{dose:'60',unit:'mcg',route:'SQ',defaultFreq:'QWeek'}],
    defaultDoseIndex:0, commonIndications:['Anemia of CKD','Chemotherapy-Induced Anemia'], allergyTags:['darbepoetin alfa'] },
  { generic:'Filgrastim', brands:['Neupogen'], drugClass:'G-CSF', schedule:null,
    doseForms:[{dose:'300',unit:'mcg',route:'SQ',defaultFreq:'QDay'},{dose:'480',unit:'mcg',route:'SQ',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Neutropenia','Stem Cell Mobilization'], allergyTags:['filgrastim'] },
  { generic:'Pegfilgrastim', brands:['Neulasta'], drugClass:'G-CSF', schedule:null,
    doseForms:[{dose:'6',unit:'mg',route:'SQ',defaultFreq:'Once'}],
    defaultDoseIndex:0, commonIndications:['Chemotherapy-Induced Neutropenia'], allergyTags:['pegfilgrastim'] },
  { generic:'Dabigatran', brands:['Pradaxa'], drugClass:'Direct Thrombin Inhibitor', schedule:null,
    doseForms:[{dose:'75',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'110',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'150',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:2, commonIndications:['Atrial Fibrillation','DVT','PE'], allergyTags:['dabigatran','doac'] },
  { generic:'Edoxaban', brands:['Savaysa'], drugClass:'DOAC', schedule:null,
    doseForms:[{dose:'30',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'60',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Atrial Fibrillation','DVT','PE'], allergyTags:['edoxaban','doac'] },
  { generic:'Tranexamic Acid', brands:['Lysteda','Cyklokapron'], drugClass:'Antifibrinolytic', schedule:null,
    doseForms:[{dose:'650',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'1000',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'1',unit:'g',route:'IV',defaultFreq:'Q8h'}],
    defaultDoseIndex:0, commonIndications:['Heavy Menstrual Bleeding','Hemorrhage'], allergyTags:['tranexamic acid'] },
  { generic:'Phytonadione', brands:['Mephyton','AquaMEPHYTON'], drugClass:'Vitamin K', schedule:null,
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'10',unit:'mg',route:'IV',defaultFreq:'Once'}],
    defaultDoseIndex:0, commonIndications:['Warfarin Reversal','Vitamin K Deficiency'], allergyTags:['phytonadione','vitamin k'] },

  // ── Dermatology ──
  { generic:'Isotretinoin', brands:['Accutane','Absorica'], drugClass:'Retinoid', schedule:null,
    doseForms:[{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'30',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'40',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Severe Acne'], allergyTags:['isotretinoin','retinoid'] },
  { generic:'Tretinoin', brands:['Retin-A'], drugClass:'Topical Retinoid', schedule:null,
    doseForms:[{dose:'0.025',unit:'%',route:'Topical',defaultFreq:'QDay'},{dose:'0.05',unit:'%',route:'Topical',defaultFreq:'QDay'},{dose:'0.1',unit:'%',route:'Topical',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Acne','Photoaging'], allergyTags:['tretinoin','retinoid'] },
  { generic:'Adapalene', brands:['Differin'], drugClass:'Topical Retinoid', schedule:null,
    doseForms:[{dose:'0.1',unit:'%',route:'Topical',defaultFreq:'QDay'},{dose:'0.3',unit:'%',route:'Topical',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Acne'], allergyTags:['adapalene','retinoid'] },
  { generic:'Benzoyl Peroxide', brands:['Benzac','PanOxyl'], drugClass:'Keratolytic', schedule:null,
    doseForms:[{dose:'2.5',unit:'%',route:'Topical',defaultFreq:'QDay'},{dose:'5',unit:'%',route:'Topical',defaultFreq:'QDay'},{dose:'10',unit:'%',route:'Topical',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Acne'], allergyTags:['benzoyl peroxide'] },
  { generic:'Clobetasol', brands:['Temovate','Clobex'], drugClass:'Topical Corticosteroid', schedule:null,
    doseForms:[{dose:'0.05',unit:'%',route:'Topical',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Psoriasis','Eczema','Dermatitis'], allergyTags:['clobetasol','corticosteroid'] },
  { generic:'Betamethasone Dipropionate', brands:['Diprolene'], drugClass:'Topical Corticosteroid', schedule:null,
    doseForms:[{dose:'0.05',unit:'%',route:'Topical',defaultFreq:'BID'},{dose:'0.1',unit:'%',route:'Topical',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Dermatitis','Eczema','Psoriasis'], allergyTags:['betamethasone','corticosteroid'] },
  { generic:'Mometasone', brands:['Elocon'], drugClass:'Topical Corticosteroid', schedule:null,
    doseForms:[{dose:'0.1',unit:'%',route:'Topical',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Dermatitis','Eczema','Psoriasis'], allergyTags:['mometasone','corticosteroid'] },
  { generic:'Tacrolimus Topical', brands:['Protopic'], drugClass:'Topical Calcineurin Inhibitor', schedule:null,
    doseForms:[{dose:'0.03',unit:'%',route:'Topical',defaultFreq:'BID'},{dose:'0.1',unit:'%',route:'Topical',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Atopic Dermatitis','Eczema'], allergyTags:['tacrolimus'] },
  { generic:'Pimecrolimus', brands:['Elidel'], drugClass:'Topical Calcineurin Inhibitor', schedule:null,
    doseForms:[{dose:'1',unit:'%',route:'Topical',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Atopic Dermatitis'], allergyTags:['pimecrolimus'] },
  { generic:'Dupilumab', brands:['Dupixent'], drugClass:'IL-4/IL-13 Inhibitor', schedule:null,
    doseForms:[{dose:'200',unit:'mg',route:'SQ',defaultFreq:'QWeek'},{dose:'300',unit:'mg',route:'SQ',defaultFreq:'QWeek'}],
    defaultDoseIndex:1, commonIndications:['Atopic Dermatitis','Asthma','Nasal Polyps'], allergyTags:['dupilumab'] },
  { generic:'Dapsone', brands:['Aczone'], drugClass:'Topical Antibacterial', schedule:null,
    doseForms:[{dose:'5',unit:'%',route:'Topical',defaultFreq:'BID'},{dose:'7.5',unit:'%',route:'Topical',defaultFreq:'QDay'},{dose:'25',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'100',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Acne','Dermatitis Herpetiformis','Leprosy'], allergyTags:['dapsone','sulfonamide'] },
  { generic:'Calcipotriene', brands:['Dovonex'], drugClass:'Vitamin D Analog', schedule:null,
    doseForms:[{dose:'0.005',unit:'%',route:'Topical',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Psoriasis'], allergyTags:['calcipotriene'] },

  // ── ENT / Nasal ──
  { generic:'Mometasone Nasal', brands:['Nasonex'], drugClass:'Intranasal Corticosteroid', schedule:null,
    doseForms:[{dose:'50',unit:'mcg',route:'Inhaled',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Allergic Rhinitis','Nasal Polyps'], allergyTags:['mometasone','corticosteroid'] },
  { generic:'Fluticasone Nasal', brands:['Flonase'], drugClass:'Intranasal Corticosteroid', schedule:null,
    doseForms:[{dose:'50',unit:'mcg',route:'Inhaled',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Allergic Rhinitis'], allergyTags:['fluticasone','corticosteroid'] },
  { generic:'Triamcinolone Nasal', brands:['Nasacort'], drugClass:'Intranasal Corticosteroid', schedule:null,
    doseForms:[{dose:'55',unit:'mcg',route:'Inhaled',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Allergic Rhinitis'], allergyTags:['triamcinolone','corticosteroid'] },
  { generic:'Azelastine', brands:['Astelin','Astepro'], drugClass:'Intranasal Antihistamine', schedule:null,
    doseForms:[{dose:'137',unit:'mcg',route:'Inhaled',defaultFreq:'BID'},{dose:'205.5',unit:'mcg',route:'Inhaled',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Allergic Rhinitis','Vasomotor Rhinitis'], allergyTags:['azelastine'] },
  { generic:'Ofloxacin Otic', brands:['Floxin Otic'], drugClass:'Otic Antibiotic', schedule:null,
    doseForms:[{dose:'0.3',unit:'%',route:'Other',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Otitis Externa','Otitis Media'], allergyTags:['ofloxacin','fluoroquinolone'] },
  { generic:'Ciprofloxacin/Dexamethasone Otic', brands:['Ciprodex'], drugClass:'Otic Antibiotic/Steroid', schedule:null,
    doseForms:[{dose:'0.3/0.1',unit:'%',route:'Other',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Otitis Externa','Otitis Media with Tubes'], allergyTags:['ciprofloxacin','dexamethasone','fluoroquinolone'] },

  // ── GI: IBD & More ──
  { generic:'Mesalamine', brands:['Asacol','Pentasa','Lialda'], drugClass:'5-ASA', schedule:null,
    doseForms:[{dose:'400',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'800',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'1.2',unit:'g',route:'PO',defaultFreq:'QDay'},{dose:'500',unit:'mg',route:'PR',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Ulcerative Colitis','Crohn\'s Disease'], allergyTags:['mesalamine','5-asa'] },
  { generic:'Budesonide Oral', brands:['Entocort EC','Uceris'], drugClass:'Corticosteroid', schedule:null,
    doseForms:[{dose:'3',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'9',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Crohn\'s Disease','Ulcerative Colitis'], allergyTags:['budesonide','corticosteroid'] },
  { generic:'Ursodiol', brands:['Actigall','Urso'], drugClass:'Bile Acid', schedule:null,
    doseForms:[{dose:'250',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'300',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'500',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Gallstone Dissolution','PBC','Cholestasis'], allergyTags:['ursodiol'] },
  { generic:'Lactulose', brands:['Kristalose','Enulose'], drugClass:'Osmotic Laxative', schedule:null,
    doseForms:[{dose:'15',unit:'mL',route:'PO',defaultFreq:'QDay'},{dose:'30',unit:'mL',route:'PO',defaultFreq:'QDay'},{dose:'30',unit:'mL',route:'PO',defaultFreq:'Q2h'}],
    defaultDoseIndex:0, commonIndications:['Constipation','Hepatic Encephalopathy'], allergyTags:['lactulose'] },
  { generic:'Rifaximin', brands:['Xifaxan'], drugClass:'GI Antibiotic', schedule:null,
    doseForms:[{dose:'200',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'550',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Hepatic Encephalopathy','IBS-D','Traveler\'s Diarrhea'], allergyTags:['rifaximin'] },
  { generic:'Pancrelipase', brands:['Creon','Zenpep'], drugClass:'Pancreatic Enzyme', schedule:null,
    doseForms:[{dose:'3000',unit:'units',route:'PO',defaultFreq:'TID'},{dose:'6000',unit:'units',route:'PO',defaultFreq:'TID'},{dose:'12000',unit:'units',route:'PO',defaultFreq:'TID'},{dose:'24000',unit:'units',route:'PO',defaultFreq:'TID'},{dose:'36000',unit:'units',route:'PO',defaultFreq:'TID'}],
    defaultDoseIndex:2, commonIndications:['Pancreatic Insufficiency','CF','Chronic Pancreatitis'], allergyTags:['pancrelipase'] },
  { generic:'Dicyclomine', brands:['Bentyl'], drugClass:'Antispasmodic', schedule:null,
    doseForms:[{dose:'10',unit:'mg',route:'PO',defaultFreq:'QID'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'QID'}],
    defaultDoseIndex:1, commonIndications:['IBS','Abdominal Cramping'], allergyTags:['dicyclomine'] },
  { generic:'Hyoscyamine', brands:['Levsin'], drugClass:'Antispasmodic', schedule:null,
    doseForms:[{dose:'0.125',unit:'mg',route:'SL',defaultFreq:'QID'},{dose:'0.375',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['IBS','GI Spasm','Colic'], allergyTags:['hyoscyamine'] },

  // ── Addiction Medicine ──
  { generic:'Buprenorphine/Naloxone', brands:['Suboxone','Zubsolv'], drugClass:'Opioid Partial Agonist', schedule:'III',
    doseForms:[{dose:'2/0.5',unit:'mg',route:'SL',defaultFreq:'QDay'},{dose:'4/1',unit:'mg',route:'SL',defaultFreq:'QDay'},{dose:'8/2',unit:'mg',route:'SL',defaultFreq:'QDay'},{dose:'12/3',unit:'mg',route:'SL',defaultFreq:'QDay'}],
    defaultDoseIndex:2, commonIndications:['Opioid Use Disorder'], allergyTags:['buprenorphine','naloxone','opioid'] },
  { generic:'Naltrexone', brands:['ReVia','Vivitrol'], drugClass:'Opioid Antagonist', schedule:null,
    doseForms:[{dose:'50',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'380',unit:'mg',route:'IM',defaultFreq:'QWeek'}],
    defaultDoseIndex:0, commonIndications:['Opioid Use Disorder','Alcohol Use Disorder'], allergyTags:['naltrexone'] },
  { generic:'Acamprosate', brands:['Campral'], drugClass:'GABA Analog', schedule:null,
    doseForms:[{dose:'333',unit:'mg',route:'PO',defaultFreq:'TID'}],
    defaultDoseIndex:0, commonIndications:['Alcohol Use Disorder'], allergyTags:['acamprosate'] },
  { generic:'Disulfiram', brands:['Antabuse'], drugClass:'Aldehyde Dehydrogenase Inhibitor', schedule:null,
    doseForms:[{dose:'250',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'500',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Alcohol Use Disorder'], allergyTags:['disulfiram'] },
  { generic:'Varenicline', brands:['Chantix'], drugClass:'Nicotinic Receptor Agonist', schedule:null,
    doseForms:[{dose:'0.5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'0.5',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'1',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:2, commonIndications:['Smoking Cessation'], allergyTags:['varenicline'] },
  { generic:'Nicotine Patch', brands:['NicoDerm CQ','Habitrol'], drugClass:'Nicotine Replacement', schedule:null,
    doseForms:[{dose:'7',unit:'mg/day',route:'Topical',defaultFreq:'QDay'},{dose:'14',unit:'mg/day',route:'Topical',defaultFreq:'QDay'},{dose:'21',unit:'mg/day',route:'Topical',defaultFreq:'QDay'}],
    defaultDoseIndex:2, commonIndications:['Smoking Cessation'], allergyTags:['nicotine'] },

  // ── Emergency / ICU / Anesthesia ──
  { generic:'Norepinephrine', brands:['Levophed'], drugClass:'Vasopressor', schedule:null,
    doseForms:[{dose:'4',unit:'mg',route:'IV',defaultFreq:'PRN'},{dose:'8',unit:'mg',route:'IV',defaultFreq:'PRN'}],
    defaultDoseIndex:0, commonIndications:['Septic Shock','Hypotension'], allergyTags:['norepinephrine'] },
  { generic:'Vasopressin', brands:['Vasostrict'], drugClass:'Vasopressor', schedule:null,
    doseForms:[{dose:'20',unit:'units',route:'IV',defaultFreq:'PRN'}],
    defaultDoseIndex:0, commonIndications:['Septic Shock','Vasodilatory Shock','Diabetes Insipidus'], allergyTags:['vasopressin'] },
  { generic:'Dobutamine', brands:['Dobutrex'], drugClass:'Inotrope', schedule:null,
    doseForms:[{dose:'250',unit:'mg',route:'IV',defaultFreq:'PRN'}],
    defaultDoseIndex:0, commonIndications:['Cardiogenic Shock','Heart Failure'], allergyTags:['dobutamine'] },
  { generic:'Dopamine', brands:['Intropin'], drugClass:'Vasopressor/Inotrope', schedule:null,
    doseForms:[{dose:'400',unit:'mg',route:'IV',defaultFreq:'PRN'},{dose:'800',unit:'mg',route:'IV',defaultFreq:'PRN'}],
    defaultDoseIndex:0, commonIndications:['Shock','Hypotension','Bradycardia'], allergyTags:['dopamine'] },
  { generic:'Phenylephrine', brands:['Neo-Synephrine'], drugClass:'Alpha-1 Agonist', schedule:null,
    doseForms:[{dose:'10',unit:'mg',route:'IV',defaultFreq:'PRN'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'Q4h'}],
    defaultDoseIndex:0, commonIndications:['Hypotension','Nasal Congestion'], allergyTags:['phenylephrine'] },
  { generic:'Propofol', brands:['Diprivan'], drugClass:'General Anesthetic', schedule:null,
    doseForms:[{dose:'10',unit:'mg/mL',route:'IV',defaultFreq:'PRN'}],
    defaultDoseIndex:0, commonIndications:['Sedation','General Anesthesia'], allergyTags:['propofol'] },
  { generic:'Ketamine', brands:['Ketalar'], drugClass:'Dissociative Anesthetic', schedule:'III',
    doseForms:[{dose:'10',unit:'mg/mL',route:'IV',defaultFreq:'PRN'},{dose:'50',unit:'mg/mL',route:'IV',defaultFreq:'PRN'},{dose:'100',unit:'mg/mL',route:'IV',defaultFreq:'PRN'}],
    defaultDoseIndex:0, commonIndications:['Procedural Sedation','Pain','Anesthesia'], allergyTags:['ketamine'] },
  { generic:'Midazolam', brands:['Versed'], drugClass:'Benzodiazepine', schedule:'IV',
    doseForms:[{dose:'1',unit:'mg',route:'IV',defaultFreq:'PRN'},{dose:'2',unit:'mg',route:'IV',defaultFreq:'PRN'},{dose:'5',unit:'mg',route:'IV',defaultFreq:'PRN'},{dose:'2',unit:'mg',route:'IM',defaultFreq:'PRN'}],
    defaultDoseIndex:0, commonIndications:['Procedural Sedation','Anxiety','Seizures'], allergyTags:['midazolam','benzodiazepine'] },
  { generic:'Dexmedetomidine', brands:['Precedex'], drugClass:'Alpha-2 Agonist', schedule:null,
    doseForms:[{dose:'200',unit:'mcg',route:'IV',defaultFreq:'PRN'}],
    defaultDoseIndex:0, commonIndications:['ICU Sedation','Procedural Sedation'], allergyTags:['dexmedetomidine'] },
  { generic:'Succinylcholine', brands:['Anectine'], drugClass:'Depolarizing NMB', schedule:null,
    doseForms:[{dose:'20',unit:'mg/mL',route:'IV',defaultFreq:'Once'}],
    defaultDoseIndex:0, commonIndications:['Rapid Sequence Intubation'], allergyTags:['succinylcholine'] },
  { generic:'Rocuronium', brands:['Zemuron'], drugClass:'Non-Depolarizing NMB', schedule:null,
    doseForms:[{dose:'10',unit:'mg/mL',route:'IV',defaultFreq:'PRN'}],
    defaultDoseIndex:0, commonIndications:['Intubation','Neuromuscular Blockade'], allergyTags:['rocuronium'] },
  { generic:'Sugammadex', brands:['Bridion'], drugClass:'NMB Reversal', schedule:null,
    doseForms:[{dose:'200',unit:'mg',route:'IV',defaultFreq:'Once'},{dose:'400',unit:'mg',route:'IV',defaultFreq:'Once'}],
    defaultDoseIndex:0, commonIndications:['NMB Reversal'], allergyTags:['sugammadex'] },
  { generic:'Neostigmine', brands:['Bloxiverz'], drugClass:'Cholinesterase Inhibitor', schedule:null,
    doseForms:[{dose:'0.5',unit:'mg',route:'IV',defaultFreq:'Once'},{dose:'1',unit:'mg',route:'IV',defaultFreq:'Once'},{dose:'2.5',unit:'mg',route:'IV',defaultFreq:'Once'}],
    defaultDoseIndex:0, commonIndications:['NMB Reversal','Myasthenia Gravis'], allergyTags:['neostigmine'] },
  { generic:'Glycopyrrolate', brands:['Robinul'], drugClass:'Anticholinergic', schedule:null,
    doseForms:[{dose:'0.2',unit:'mg',route:'IV',defaultFreq:'PRN'},{dose:'1',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'2',unit:'mg',route:'PO',defaultFreq:'TID'}],
    defaultDoseIndex:0, commonIndications:['Bradycardia','Secretion Reduction','Peptic Ulcer'], allergyTags:['glycopyrrolate'] },
  { generic:'Atropine', brands:['AtroPen'], drugClass:'Anticholinergic', schedule:null,
    doseForms:[{dose:'0.5',unit:'mg',route:'IV',defaultFreq:'PRN'},{dose:'1',unit:'mg',route:'IV',defaultFreq:'PRN'}],
    defaultDoseIndex:0, commonIndications:['Bradycardia','Organophosphate Poisoning'], allergyTags:['atropine'] },
  { generic:'Adenosine', brands:['Adenocard'], drugClass:'Antiarrhythmic', schedule:null,
    doseForms:[{dose:'6',unit:'mg',route:'IV',defaultFreq:'Once'},{dose:'12',unit:'mg',route:'IV',defaultFreq:'Once'}],
    defaultDoseIndex:0, commonIndications:['SVT','Diagnostic'], allergyTags:['adenosine'] },
  { generic:'Calcium Gluconate', brands:[], drugClass:'Electrolyte', schedule:null,
    doseForms:[{dose:'1',unit:'g',route:'IV',defaultFreq:'PRN'},{dose:'2',unit:'g',route:'IV',defaultFreq:'PRN'}],
    defaultDoseIndex:0, commonIndications:['Hyperkalemia','Hypocalcemia','Calcium Channel Blocker OD'], allergyTags:['calcium gluconate'] },
  { generic:'Sodium Bicarbonate', brands:[], drugClass:'Alkalinizer', schedule:null,
    doseForms:[{dose:'50',unit:'mEq',route:'IV',defaultFreq:'PRN'},{dose:'650',unit:'mg',route:'PO',defaultFreq:'TID'}],
    defaultDoseIndex:0, commonIndications:['Metabolic Acidosis','Hyperkalemia','TCA Overdose'], allergyTags:['sodium bicarbonate'] },
  { generic:'Mannitol', brands:['Osmitrol'], drugClass:'Osmotic Diuretic', schedule:null,
    doseForms:[{dose:'20',unit:'%',route:'IV',defaultFreq:'Q6h'}],
    defaultDoseIndex:0, commonIndications:['Cerebral Edema','Elevated ICP','Acute Glaucoma'], allergyTags:['mannitol'] },
  { generic:'Alteplase', brands:['Activase'], drugClass:'Thrombolytic', schedule:null,
    doseForms:[{dose:'50',unit:'mg',route:'IV',defaultFreq:'Once'},{dose:'100',unit:'mg',route:'IV',defaultFreq:'Once'}],
    defaultDoseIndex:1, commonIndications:['STEMI','Acute Ischemic Stroke','Massive PE'], allergyTags:['alteplase','tpa'] },
  { generic:'Tenecteplase', brands:['TNKase'], drugClass:'Thrombolytic', schedule:null,
    doseForms:[{dose:'30',unit:'mg',route:'IV',defaultFreq:'Once'},{dose:'40',unit:'mg',route:'IV',defaultFreq:'Once'},{dose:'50',unit:'mg',route:'IV',defaultFreq:'Once'}],
    defaultDoseIndex:1, commonIndications:['STEMI'], allergyTags:['tenecteplase','tpa'] },
  { generic:'N-Acetylcysteine', brands:['Mucomyst','Acetadote'], drugClass:'Antidote', schedule:null,
    doseForms:[{dose:'600',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'150',unit:'mg',route:'IV',defaultFreq:'Once'}],
    defaultDoseIndex:0, commonIndications:['Acetaminophen Overdose','Mucolytic'], allergyTags:['n-acetylcysteine','nac'] },
  { generic:'Flumazenil', brands:['Romazicon'], drugClass:'Benzodiazepine Antagonist', schedule:null,
    doseForms:[{dose:'0.2',unit:'mg',route:'IV',defaultFreq:'PRN'}],
    defaultDoseIndex:0, commonIndications:['Benzodiazepine Overdose','Reversal'], allergyTags:['flumazenil'] },
  { generic:'Activated Charcoal', brands:['Actidose'], drugClass:'Adsorbent', schedule:null,
    doseForms:[{dose:'25',unit:'g',route:'PO',defaultFreq:'Once'},{dose:'50',unit:'g',route:'PO',defaultFreq:'Once'}],
    defaultDoseIndex:1, commonIndications:['Poisoning','Drug Overdose'], allergyTags:['activated charcoal'] },

  // ── Cardiovascular: Additional ──
  { generic:'Ranolazine', brands:['Ranexa'], drugClass:'Antianginal', schedule:null,
    doseForms:[{dose:'500',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'1000',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Chronic Angina'], allergyTags:['ranolazine'] },
  { generic:'Ivabradine', brands:['Corlanor'], drugClass:'HCN Channel Blocker', schedule:null,
    doseForms:[{dose:'2.5',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'5',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'7.5',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Heart Failure'], allergyTags:['ivabradine'] },
  { generic:'Sacubitril/Valsartan', brands:['Entresto'], drugClass:'ARNI', schedule:null,
    doseForms:[{dose:'24/26',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'49/51',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'97/103',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Heart Failure with Reduced EF'], allergyTags:['sacubitril','valsartan','arni','arb'] },
  { generic:'Eplerenone', brands:['Inspra'], drugClass:'Mineralocorticoid Antagonist', schedule:null,
    doseForms:[{dose:'25',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Heart Failure','Hypertension'], allergyTags:['eplerenone'] },
  { generic:'Torsemide', brands:['Demadex'], drugClass:'Loop Diuretic', schedule:null,
    doseForms:[{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'20',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'40',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'100',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Edema','Heart Failure'], allergyTags:['torsemide','loop diuretic'] },
  { generic:'Metolazone', brands:['Zaroxolyn'], drugClass:'Thiazide-Like Diuretic', schedule:null,
    doseForms:[{dose:'2.5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Edema','Diuretic Resistance'], allergyTags:['metolazone','thiazide','sulfonamide'] },
  { generic:'Doxazosin', brands:['Cardura'], drugClass:'Alpha-1 Blocker', schedule:null,
    doseForms:[{dose:'1',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'2',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'4',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'8',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Hypertension','BPH'], allergyTags:['doxazosin','alpha blocker'] },
  { generic:'Prazosin', brands:['Minipress'], drugClass:'Alpha-1 Blocker', schedule:null,
    doseForms:[{dose:'1',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'2',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'5',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Hypertension','PTSD Nightmares','BPH'], allergyTags:['prazosin','alpha blocker'] },
  { generic:'Minoxidil', brands:['Loniten'], drugClass:'Vasodilator', schedule:null,
    doseForms:[{dose:'2.5',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'5',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Resistant Hypertension'], allergyTags:['minoxidil'] },
  { generic:'Sotalol', brands:['Betapace'], drugClass:'Antiarrhythmic/Beta-Blocker', schedule:null,
    doseForms:[{dose:'80',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'120',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'160',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Atrial Fibrillation','Ventricular Tachycardia'], allergyTags:['sotalol','beta blocker'] },
  { generic:'Flecainide', brands:['Tambocor'], drugClass:'Antiarrhythmic', schedule:null,
    doseForms:[{dose:'50',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'100',unit:'mg',route:'PO',defaultFreq:'BID'},{dose:'150',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Atrial Fibrillation','SVT'], allergyTags:['flecainide'] },
  { generic:'Dronedarone', brands:['Multaq'], drugClass:'Antiarrhythmic', schedule:null,
    doseForms:[{dose:'400',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Atrial Fibrillation','Atrial Flutter'], allergyTags:['dronedarone'] },
  { generic:'Fenofibrate', brands:['Tricor','Fenoglide'], drugClass:'Fibrate', schedule:null,
    doseForms:[{dose:'48',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'145',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Hypertriglyceridemia','Mixed Dyslipidemia'], allergyTags:['fenofibrate','fibrate'] },
  { generic:'Gemfibrozil', brands:['Lopid'], drugClass:'Fibrate', schedule:null,
    doseForms:[{dose:'600',unit:'mg',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Hypertriglyceridemia'], allergyTags:['gemfibrozil','fibrate'] },
  { generic:'Ezetimibe', brands:['Zetia'], drugClass:'Cholesterol Absorption Inhibitor', schedule:null,
    doseForms:[{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Hyperlipidemia'], allergyTags:['ezetimibe'] },
  { generic:'Icosapent Ethyl', brands:['Vascepa'], drugClass:'Omega-3 Fatty Acid', schedule:null,
    doseForms:[{dose:'1',unit:'g',route:'PO',defaultFreq:'BID'},{dose:'2',unit:'g',route:'PO',defaultFreq:'BID'}],
    defaultDoseIndex:1, commonIndications:['Hypertriglyceridemia','ASCVD Risk Reduction'], allergyTags:['icosapent ethyl','fish oil'] },
  { generic:'Alirocumab', brands:['Praluent'], drugClass:'PCSK9 Inhibitor', schedule:null,
    doseForms:[{dose:'75',unit:'mg',route:'SQ',defaultFreq:'QWeek'},{dose:'150',unit:'mg',route:'SQ',defaultFreq:'QWeek'}],
    defaultDoseIndex:0, commonIndications:['Hyperlipidemia','ASCVD'], allergyTags:['alirocumab','pcsk9 inhibitor'] },
  { generic:'Evolocumab', brands:['Repatha'], drugClass:'PCSK9 Inhibitor', schedule:null,
    doseForms:[{dose:'140',unit:'mg',route:'SQ',defaultFreq:'QWeek'},{dose:'420',unit:'mg',route:'SQ',defaultFreq:'QWeek'}],
    defaultDoseIndex:0, commonIndications:['Hyperlipidemia','ASCVD'], allergyTags:['evolocumab','pcsk9 inhibitor'] },

  // ── Endocrine: Additional ──
  { generic:'Canagliflozin', brands:['Invokana'], drugClass:'SGLT2 Inhibitor', schedule:null,
    doseForms:[{dose:'100',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'300',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Type 2 Diabetes','Heart Failure'], allergyTags:['canagliflozin','sglt2 inhibitor'] },
  { generic:'Dulaglutide', brands:['Trulicity'], drugClass:'GLP-1 Agonist', schedule:null,
    doseForms:[{dose:'0.75',unit:'mg',route:'SQ',defaultFreq:'QWeek'},{dose:'1.5',unit:'mg',route:'SQ',defaultFreq:'QWeek'},{dose:'3',unit:'mg',route:'SQ',defaultFreq:'QWeek'},{dose:'4.5',unit:'mg',route:'SQ',defaultFreq:'QWeek'}],
    defaultDoseIndex:1, commonIndications:['Type 2 Diabetes'], allergyTags:['dulaglutide','glp-1 agonist'] },
  { generic:'Tirzepatide', brands:['Mounjaro','Zepbound'], drugClass:'GIP/GLP-1 Agonist', schedule:null,
    doseForms:[{dose:'2.5',unit:'mg',route:'SQ',defaultFreq:'QWeek'},{dose:'5',unit:'mg',route:'SQ',defaultFreq:'QWeek'},{dose:'7.5',unit:'mg',route:'SQ',defaultFreq:'QWeek'},{dose:'10',unit:'mg',route:'SQ',defaultFreq:'QWeek'},{dose:'12.5',unit:'mg',route:'SQ',defaultFreq:'QWeek'},{dose:'15',unit:'mg',route:'SQ',defaultFreq:'QWeek'}],
    defaultDoseIndex:0, commonIndications:['Type 2 Diabetes','Obesity'], allergyTags:['tirzepatide','glp-1 agonist'] },
  { generic:'Insulin NPH', brands:['Humulin N','Novolin N'], drugClass:'Intermediate-Acting Insulin', schedule:null,
    doseForms:[{dose:'10',unit:'units',route:'SQ',defaultFreq:'BID'},{dose:'20',unit:'units',route:'SQ',defaultFreq:'BID'},{dose:'30',unit:'units',route:'SQ',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Type 1 Diabetes','Type 2 Diabetes'], allergyTags:['insulin nph','insulin'] },
  { generic:'Insulin Regular', brands:['Humulin R','Novolin R'], drugClass:'Short-Acting Insulin', schedule:null,
    doseForms:[{dose:'5',unit:'units',route:'SQ',defaultFreq:'TID'},{dose:'10',unit:'units',route:'SQ',defaultFreq:'TID'},{dose:'100',unit:'units/mL',route:'IV',defaultFreq:'PRN'}],
    defaultDoseIndex:0, commonIndications:['Type 1 Diabetes','Type 2 Diabetes','DKA'], allergyTags:['insulin regular','insulin'] },
  { generic:'Insulin Degludec', brands:['Tresiba'], drugClass:'Ultra-Long-Acting Insulin', schedule:null,
    doseForms:[{dose:'10',unit:'units',route:'SQ',defaultFreq:'QDay'},{dose:'20',unit:'units',route:'SQ',defaultFreq:'QDay'},{dose:'40',unit:'units',route:'SQ',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Type 1 Diabetes','Type 2 Diabetes'], allergyTags:['insulin degludec','insulin'] },
  { generic:'Glimepiride', brands:['Amaryl'], drugClass:'Sulfonylurea', schedule:null,
    doseForms:[{dose:'1',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'2',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'4',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Type 2 Diabetes'], allergyTags:['glimepiride','sulfonylurea','sulfonamide'] },
  { generic:'Linagliptin', brands:['Tradjenta'], drugClass:'DPP-4 Inhibitor', schedule:null,
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Type 2 Diabetes'], allergyTags:['linagliptin'] },
  { generic:'Testosterone Cypionate', brands:['Depo-Testosterone'], drugClass:'Androgen', schedule:'III',
    doseForms:[{dose:'100',unit:'mg',route:'IM',defaultFreq:'QWeek'},{dose:'200',unit:'mg',route:'IM',defaultFreq:'QWeek'}],
    defaultDoseIndex:1, commonIndications:['Hypogonadism','Testosterone Deficiency'], allergyTags:['testosterone'] },
  { generic:'Testosterone Gel', brands:['AndroGel','Testim'], drugClass:'Androgen', schedule:'III',
    doseForms:[{dose:'25',unit:'mg',route:'Topical',defaultFreq:'QDay'},{dose:'50',unit:'mg',route:'Topical',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Hypogonadism','Testosterone Deficiency'], allergyTags:['testosterone'] },
  { generic:'Fludrocortisone', brands:['Florinef'], drugClass:'Mineralocorticoid', schedule:null,
    doseForms:[{dose:'0.1',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Adrenal Insufficiency','Orthostatic Hypotension'], allergyTags:['fludrocortisone','corticosteroid'] },

  // ── GU / Nephrology: Additional ──
  { generic:'Alfuzosin', brands:['Uroxatral'], drugClass:'Alpha Blocker', schedule:null,
    doseForms:[{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['BPH'], allergyTags:['alfuzosin','alpha blocker'] },
  { generic:'Dutasteride', brands:['Avodart'], drugClass:'5-Alpha Reductase Inhibitor', schedule:null,
    doseForms:[{dose:'0.5',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['BPH'], allergyTags:['dutasteride'] },
  { generic:'Solifenacin', brands:['Vesicare'], drugClass:'Anticholinergic', schedule:null,
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'10',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Overactive Bladder'], allergyTags:['solifenacin'] },
  { generic:'Mirabegron', brands:['Myrbetriq'], drugClass:'Beta-3 Agonist', schedule:null,
    doseForms:[{dose:'25',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Overactive Bladder'], allergyTags:['mirabegron'] },
  { generic:'Sevelamer', brands:['Renvela','Renagel'], drugClass:'Phosphate Binder', schedule:null,
    doseForms:[{dose:'400',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'800',unit:'mg',route:'PO',defaultFreq:'TID'}],
    defaultDoseIndex:1, commonIndications:['Hyperphosphatemia in CKD'], allergyTags:['sevelamer'] },
  { generic:'Sodium Polystyrene Sulfonate', brands:['Kayexalate'], drugClass:'Cation Exchange Resin', schedule:null,
    doseForms:[{dose:'15',unit:'g',route:'PO',defaultFreq:'QDay'},{dose:'30',unit:'g',route:'PO',defaultFreq:'QDay'},{dose:'30',unit:'g',route:'PR',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Hyperkalemia'], allergyTags:['sodium polystyrene sulfonate'] },
  { generic:'Patiromer', brands:['Veltassa'], drugClass:'Potassium Binder', schedule:null,
    doseForms:[{dose:'8.4',unit:'g',route:'PO',defaultFreq:'QDay'},{dose:'16.8',unit:'g',route:'PO',defaultFreq:'QDay'},{dose:'25.2',unit:'g',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Hyperkalemia'], allergyTags:['patiromer'] },
  { generic:'Calcitriol', brands:['Rocaltrol'], drugClass:'Vitamin D Analog', schedule:null,
    doseForms:[{dose:'0.25',unit:'mcg',route:'PO',defaultFreq:'QDay'},{dose:'0.5',unit:'mcg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Hypoparathyroidism','CKD-Related Hypocalcemia','Osteoporosis'], allergyTags:['calcitriol','vitamin d'] },

  // ── Misc: Additional ──
  { generic:'Meclizine', brands:['Antivert','Bonine'], drugClass:'Antihistamine/Antiemetic', schedule:null,
    doseForms:[{dose:'12.5',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'25',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Vertigo','Motion Sickness'], allergyTags:['meclizine'] },
  { generic:'Scopolamine', brands:['Transderm Scop'], drugClass:'Anticholinergic', schedule:null,
    doseForms:[{dose:'1.5',unit:'mg',route:'Topical',defaultFreq:'Q72h'}],
    defaultDoseIndex:0, commonIndications:['Motion Sickness','Nausea','Secretion Reduction'], allergyTags:['scopolamine'] },
  { generic:'Modafinil', brands:['Provigil'], drugClass:'Wakefulness Agent', schedule:'IV',
    doseForms:[{dose:'100',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'200',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Narcolepsy','Shift Work Sleep Disorder','OSA'], allergyTags:['modafinil'] },
  { generic:'Armodafinil', brands:['Nuvigil'], drugClass:'Wakefulness Agent', schedule:'IV',
    doseForms:[{dose:'150',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'250',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Narcolepsy','Shift Work Sleep Disorder'], allergyTags:['armodafinil','modafinil'] },
  { generic:'Phentermine', brands:['Adipex-P'], drugClass:'Anorexiant', schedule:'IV',
    doseForms:[{dose:'15',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'37.5',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:1, commonIndications:['Obesity'], allergyTags:['phentermine','amphetamine'] },
  { generic:'Orlistat', brands:['Xenical','Alli'], drugClass:'Lipase Inhibitor', schedule:null,
    doseForms:[{dose:'60',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'120',unit:'mg',route:'PO',defaultFreq:'TID'}],
    defaultDoseIndex:1, commonIndications:['Obesity'], allergyTags:['orlistat'] },
  { generic:'Risedronate', brands:['Actonel'], drugClass:'Bisphosphonate', schedule:null,
    doseForms:[{dose:'5',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'35',unit:'mg',route:'PO',defaultFreq:'QWeek'},{dose:'150',unit:'mg',route:'PO',defaultFreq:'QWeek'}],
    defaultDoseIndex:1, commonIndications:['Osteoporosis'], allergyTags:['risedronate','bisphosphonate'] },
  { generic:'Zoledronic Acid', brands:['Reclast','Zometa'], drugClass:'Bisphosphonate', schedule:null,
    doseForms:[{dose:'4',unit:'mg',route:'IV',defaultFreq:'QWeek'},{dose:'5',unit:'mg',route:'IV',defaultFreq:'QWeek'}],
    defaultDoseIndex:1, commonIndications:['Osteoporosis','Bone Metastases','Hypercalcemia'], allergyTags:['zoledronic acid','bisphosphonate'] },
  { generic:'Denosumab', brands:['Prolia','Xgeva'], drugClass:'RANKL Inhibitor', schedule:null,
    doseForms:[{dose:'60',unit:'mg',route:'SQ',defaultFreq:'QWeek'},{dose:'120',unit:'mg',route:'SQ',defaultFreq:'QWeek'}],
    defaultDoseIndex:0, commonIndications:['Osteoporosis','Bone Metastases'], allergyTags:['denosumab'] },
  { generic:'Raloxifene', brands:['Evista'], drugClass:'SERM', schedule:null,
    doseForms:[{dose:'60',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Osteoporosis Prevention','Breast Cancer Prevention'], allergyTags:['raloxifene'] },
  { generic:'Teriparatide', brands:['Forteo'], drugClass:'PTH Analog', schedule:null,
    doseForms:[{dose:'20',unit:'mcg',route:'SQ',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Severe Osteoporosis'], allergyTags:['teriparatide'] },
  { generic:'Dantrolene', brands:['Dantrium'], drugClass:'Muscle Relaxant', schedule:null,
    doseForms:[{dose:'25',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'50',unit:'mg',route:'PO',defaultFreq:'TID'},{dose:'20',unit:'mg',route:'IV',defaultFreq:'PRN'}],
    defaultDoseIndex:0, commonIndications:['Malignant Hyperthermia','Spasticity','NMS'], allergyTags:['dantrolene'] },
  { generic:'Chlorhexidine', brands:['Peridex','Hibiclens'], drugClass:'Antiseptic', schedule:null,
    doseForms:[{dose:'0.12',unit:'%',route:'Other',defaultFreq:'BID'},{dose:'4',unit:'%',route:'Topical',defaultFreq:'PRN'}],
    defaultDoseIndex:0, commonIndications:['Gingivitis','Skin Antisepsis','Surgical Prep'], allergyTags:['chlorhexidine'] },
  { generic:'Silver Sulfadiazine', brands:['Silvadene'], drugClass:'Topical Antimicrobial', schedule:null,
    doseForms:[{dose:'1',unit:'%',route:'Topical',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Burns','Wound Infection Prevention'], allergyTags:['silver sulfadiazine','sulfonamide','sulfa'] },
  { generic:'Fluorouracil Topical', brands:['Efudex','Carac'], drugClass:'Topical Antineoplastic', schedule:null,
    doseForms:[{dose:'0.5',unit:'%',route:'Topical',defaultFreq:'QDay'},{dose:'5',unit:'%',route:'Topical',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Actinic Keratosis','Basal Cell Carcinoma'], allergyTags:['fluorouracil','5-fu'] },
  { generic:'Imiquimod', brands:['Aldara','Zyclara'], drugClass:'Immune Response Modifier', schedule:null,
    doseForms:[{dose:'5',unit:'%',route:'Topical',defaultFreq:'QDay'},{dose:'3.75',unit:'%',route:'Topical',defaultFreq:'QDay'}],
    defaultDoseIndex:0, commonIndications:['Actinic Keratosis','Genital Warts','Basal Cell Carcinoma'], allergyTags:['imiquimod'] },

  // ── Ophthalmology: Additional ──
  { generic:'Brimonidine', brands:['Alphagan'], drugClass:'Ophthalmic Alpha Agonist', schedule:null,
    doseForms:[{dose:'0.1',unit:'%',route:'Topical',defaultFreq:'TID'},{dose:'0.15',unit:'%',route:'Topical',defaultFreq:'TID'},{dose:'0.2',unit:'%',route:'Topical',defaultFreq:'TID'}],
    defaultDoseIndex:1, commonIndications:['Glaucoma','Ocular Hypertension'], allergyTags:['brimonidine'] },
  { generic:'Dorzolamide', brands:['Trusopt'], drugClass:'Ophthalmic CAI', schedule:null,
    doseForms:[{dose:'2',unit:'%',route:'Topical',defaultFreq:'TID'}],
    defaultDoseIndex:0, commonIndications:['Glaucoma','Ocular Hypertension'], allergyTags:['dorzolamide','sulfonamide'] },
  { generic:'Dorzolamide/Timolol', brands:['Cosopt'], drugClass:'Ophthalmic CAI/Beta-Blocker', schedule:null,
    doseForms:[{dose:'2/0.5',unit:'%',route:'Topical',defaultFreq:'BID'}],
    defaultDoseIndex:0, commonIndications:['Glaucoma'], allergyTags:['dorzolamide','timolol','sulfonamide','beta blocker'] },
  { generic:'Prednisolone Ophthalmic', brands:['Pred Forte'], drugClass:'Ophthalmic Corticosteroid', schedule:null,
    doseForms:[{dose:'1',unit:'%',route:'Topical',defaultFreq:'QID'}],
    defaultDoseIndex:0, commonIndications:['Ocular Inflammation','Uveitis','Post-Op'], allergyTags:['prednisolone','corticosteroid'] },
  { generic:'Moxifloxacin Ophthalmic', brands:['Vigamox'], drugClass:'Ophthalmic Antibiotic', schedule:null,
    doseForms:[{dose:'0.5',unit:'%',route:'Topical',defaultFreq:'TID'}],
    defaultDoseIndex:0, commonIndications:['Bacterial Conjunctivitis'], allergyTags:['moxifloxacin','fluoroquinolone'] },
  { generic:'Ofloxacin Ophthalmic', brands:['Ocuflox'], drugClass:'Ophthalmic Antibiotic', schedule:null,
    doseForms:[{dose:'0.3',unit:'%',route:'Topical',defaultFreq:'QID'}],
    defaultDoseIndex:0, commonIndications:['Bacterial Conjunctivitis','Corneal Ulcer'], allergyTags:['ofloxacin','fluoroquinolone'] },
  { generic:'Ketorolac Ophthalmic', brands:['Acular'], drugClass:'Ophthalmic NSAID', schedule:null,
    doseForms:[{dose:'0.5',unit:'%',route:'Topical',defaultFreq:'QID'}],
    defaultDoseIndex:0, commonIndications:['Ocular Pain','Post-Op Inflammation'], allergyTags:['ketorolac','nsaid'] },
  { generic:'Cyclopentolate', brands:['Cyclogyl'], drugClass:'Mydriatic', schedule:null,
    doseForms:[{dose:'0.5',unit:'%',route:'Topical',defaultFreq:'PRN'},{dose:'1',unit:'%',route:'Topical',defaultFreq:'PRN'}],
    defaultDoseIndex:1, commonIndications:['Cycloplegia','Mydriasis','Eye Exam'], allergyTags:['cyclopentolate'] },
  { generic:'Artificial Tears', brands:['Refresh','Systane'], drugClass:'Ophthalmic Lubricant', schedule:null,
    doseForms:[{dose:'0.5',unit:'%',route:'Topical',defaultFreq:'PRN'}],
    defaultDoseIndex:0, commonIndications:['Dry Eye'], allergyTags:[] },

  // ── Emergency / Critical Care Medications ──
  { generic:'Naloxone', brands:['Narcan'], drugClass:'Opioid Antagonist', schedule:null,
    doseForms:[{dose:'0.4',unit:'mg',route:'IV',defaultFreq:'Q2-3min PRN'},{dose:'2',unit:'mg',route:'IV',defaultFreq:'Q2-3min PRN'},{dose:'4',unit:'mg',route:'Intranasal',defaultFreq:'PRN'},{dose:'0.4',unit:'mg',route:'IM',defaultFreq:'Q2-3min PRN'}],
    defaultDoseIndex:0, commonIndications:['Opioid Overdose','Opioid-Induced Respiratory Depression'], allergyTags:['naloxone'] },
  { generic:'Calcium Gluconate', brands:[], drugClass:'Electrolyte Supplement', schedule:null,
    doseForms:[{dose:'1',unit:'g',route:'IV',defaultFreq:'Once'},{dose:'2',unit:'g',route:'IV',defaultFreq:'Once'},{dose:'3',unit:'g',route:'IV',defaultFreq:'Once'}],
    defaultDoseIndex:0, commonIndications:['Hyperkalemia','Hypocalcemia','Calcium Channel Blocker Overdose','Magnesium Toxicity'], allergyTags:['calcium gluconate'] },
  { generic:'Calcium Chloride', brands:[], drugClass:'Electrolyte Supplement', schedule:null,
    doseForms:[{dose:'1',unit:'g',route:'IV',defaultFreq:'Once'}],
    defaultDoseIndex:0, commonIndications:['Cardiac Arrest','Hyperkalemia','Calcium Channel Blocker Overdose'], allergyTags:['calcium chloride'] },
  { generic:'Dextrose 50%', brands:['D50'], drugClass:'Glucose', schedule:null,
    doseForms:[{dose:'25',unit:'g',route:'IV',defaultFreq:'Once'},{dose:'50',unit:'mL',route:'IV',defaultFreq:'Once'}],
    defaultDoseIndex:0, commonIndications:['Hypoglycemia','Altered Mental Status','Insulin Overdose'], allergyTags:['dextrose'] },
  { generic:'Sodium Bicarbonate', brands:[], drugClass:'Alkalinizing Agent', schedule:null,
    doseForms:[{dose:'50',unit:'mEq',route:'IV',defaultFreq:'Once'},{dose:'1',unit:'mEq/kg',route:'IV',defaultFreq:'Once'}],
    defaultDoseIndex:0, commonIndications:['Metabolic Acidosis','TCA Overdose','Hyperkalemia','Cardiac Arrest'], allergyTags:['sodium bicarbonate'], weightBased:true },
  { generic:'Thiamine', brands:['Vitamin B1'], drugClass:'Vitamin', schedule:null,
    doseForms:[{dose:'100',unit:'mg',route:'IV',defaultFreq:'QDay'},{dose:'100',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'500',unit:'mg',route:'IV',defaultFreq:'TID'}],
    defaultDoseIndex:0, commonIndications:['Wernicke Encephalopathy','Alcohol Withdrawal','Nutritional Deficiency'], allergyTags:['thiamine'] },
  { generic:'N-Acetylcysteine', brands:['Mucomyst','Acetadote'], drugClass:'Antidote', schedule:null,
    doseForms:[{dose:'150',unit:'mg/kg',route:'IV',defaultFreq:'Once (loading)'},{dose:'70',unit:'mg/kg',route:'PO',defaultFreq:'Q4h x17 doses'}],
    defaultDoseIndex:0, commonIndications:['Acetaminophen Overdose','Hepatoprotection'], allergyTags:['n-acetylcysteine','nac'], weightBased:true },
  { generic:'Oxytocin', brands:['Pitocin'], drugClass:'Uterotonic', schedule:null,
    doseForms:[{dose:'10',unit:'units',route:'IV',defaultFreq:'Per protocol'},{dose:'20',unit:'units',route:'IV',defaultFreq:'Per protocol'}],
    defaultDoseIndex:0, commonIndications:['Labor Induction','Postpartum Hemorrhage','Labor Augmentation'], allergyTags:['oxytocin'] },
  { generic:'Magnesium Sulfate', brands:[], drugClass:'Electrolyte/Tocolytic', schedule:null,
    doseForms:[{dose:'2',unit:'g',route:'IV',defaultFreq:'Once (loading)'},{dose:'4',unit:'g',route:'IV',defaultFreq:'Once (loading)'},{dose:'6',unit:'g',route:'IV',defaultFreq:'Once (loading)'},{dose:'1',unit:'g/hr',route:'IV',defaultFreq:'Continuous'}],
    defaultDoseIndex:1, commonIndications:['Eclampsia','Pre-eclampsia','Torsades de Pointes','Hypomagnesemia','Tocolysis'], allergyTags:['magnesium sulfate'] },
  { generic:'Tirzepatide', brands:['Mounjaro','Zepbound'], drugClass:'GLP-1/GIP Agonist', schedule:null,
    doseForms:[{dose:'2.5',unit:'mg',route:'SQ',defaultFreq:'QWeek'},{dose:'5',unit:'mg',route:'SQ',defaultFreq:'QWeek'},{dose:'7.5',unit:'mg',route:'SQ',defaultFreq:'QWeek'},{dose:'10',unit:'mg',route:'SQ',defaultFreq:'QWeek'},{dose:'12.5',unit:'mg',route:'SQ',defaultFreq:'QWeek'},{dose:'15',unit:'mg',route:'SQ',defaultFreq:'QWeek'}],
    defaultDoseIndex:0, commonIndications:['Type 2 Diabetes','Obesity','Weight Management'], allergyTags:['tirzepatide','glp-1 agonist'] },
  { generic:'Epinephrine', brands:['EpiPen','Adrenalin'], drugClass:'Vasopressor', schedule:null,
    doseForms:[{dose:'0.3',unit:'mg',route:'IM',defaultFreq:'Q5-15min PRN'},{dose:'0.5',unit:'mg',route:'IM',defaultFreq:'Q5-15min PRN'},{dose:'1',unit:'mg',route:'IV',defaultFreq:'Q3-5min (ACLS)'},{dose:'0.01',unit:'mg/kg',route:'IV',defaultFreq:'Continuous'}],
    defaultDoseIndex:0, commonIndications:['Anaphylaxis','Cardiac Arrest','Severe Asthma','Vasopressor Support'], allergyTags:['epinephrine'] },
  { generic:'Atropine', brands:[], drugClass:'Anticholinergic', schedule:null,
    doseForms:[{dose:'0.5',unit:'mg',route:'IV',defaultFreq:'Q3-5min PRN'},{dose:'1',unit:'mg',route:'IV',defaultFreq:'Q3-5min PRN'}],
    defaultDoseIndex:0, commonIndications:['Symptomatic Bradycardia','Organophosphate Poisoning','Pre-intubation'], allergyTags:['atropine'] },
  { generic:'Amiodarone', brands:['Cordarone','Pacerone'], drugClass:'Antiarrhythmic', schedule:null,
    doseForms:[{dose:'150',unit:'mg',route:'IV',defaultFreq:'Once (loading)'},{dose:'300',unit:'mg',route:'IV',defaultFreq:'Once (cardiac arrest)'},{dose:'200',unit:'mg',route:'PO',defaultFreq:'QDay'},{dose:'400',unit:'mg',route:'PO',defaultFreq:'QDay'}],
    defaultDoseIndex:2, commonIndications:['Atrial Fibrillation','Ventricular Tachycardia','VF/Pulseless VT (ACLS)'], allergyTags:['amiodarone','antiarrhythmic'] },
];

/* ============================================================
   Pharmacy Database (~60 entries)
   ============================================================ */
const PHARMACY_DB = [
  // CVS — Springfield IL area (627xx)
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #4521',address:'100 Main Street',city:'Springfield',state:'IL',zip:'62704',phone:'(555) 300-1001',fax:'(555) 300-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #4522',address:'2350 W Monroe St',city:'Springfield',state:'IL',zip:'62704',phone:'(555) 300-1003',fax:'(555) 300-1004',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #4523',address:'1800 Wabash Ave',city:'Springfield',state:'IL',zip:'62704',phone:'(555) 300-1005',fax:'(555) 300-1006',hours:'Mon-Fri 8am-10pm, Sat 9am-8pm, Sun 10am-6pm',is24hr:false},
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #4530',address:'401 N Grand Ave E',city:'Springfield',state:'IL',zip:'62702',phone:'(555) 300-1007',fax:'(555) 300-1008',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #4535',address:'3120 S 6th St',city:'Springfield',state:'IL',zip:'62703',phone:'(555) 300-1009',fax:'(555) 300-1010',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #4540',address:'525 S MacArthur Blvd',city:'Springfield',state:'IL',zip:'62704',phone:'(555) 300-1011',fax:'(555) 300-1012',hours:'24 Hours',is24hr:true},
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #7801',address:'900 W Jefferson St',city:'Jacksonville',state:'IL',zip:'62650',phone:'(555) 300-2001',fax:'(555) 300-2002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun Closed',is24hr:false},
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #7810',address:'120 E Sangamon Ave',city:'Lincoln',state:'IL',zip:'62656',phone:'(555) 300-2003',fax:'(555) 300-2004',hours:'Mon-Fri 9am-8pm, Sat 9am-5pm, Sun Closed',is24hr:false},

  // Walgreens — Springfield IL area
  {chain:'Walgreens',name:'Walgreens #5901',address:'205 S 5th St',city:'Springfield',state:'IL',zip:'62701',phone:'(555) 310-1001',fax:'(555) 310-1002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #5902',address:'1550 W Iles Ave',city:'Springfield',state:'IL',zip:'62704',phone:'(555) 310-1003',fax:'(555) 310-1004',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #5903',address:'2801 S MacArthur Blvd',city:'Springfield',state:'IL',zip:'62704',phone:'(555) 310-1005',fax:'(555) 310-1006',hours:'24 Hours',is24hr:true},
  {chain:'Walgreens',name:'Walgreens #5904',address:'900 N Grand Ave W',city:'Springfield',state:'IL',zip:'62702',phone:'(555) 310-1007',fax:'(555) 310-1008',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #5905',address:'3101 Clearlake Ave',city:'Springfield',state:'IL',zip:'62703',phone:'(555) 310-1009',fax:'(555) 310-1010',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #5910',address:'1600 W Jefferson St',city:'Springfield',state:'IL',zip:'62702',phone:'(555) 310-1011',fax:'(555) 310-1012',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #5920',address:'2219 S Dirksen Pkwy',city:'Springfield',state:'IL',zip:'62703',phone:'(555) 310-1013',fax:'(555) 310-1014',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #6301',address:'415 E Morton Ave',city:'Jacksonville',state:'IL',zip:'62650',phone:'(555) 310-2001',fax:'(555) 310-2002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun Closed',is24hr:false},

  // Walmart Pharmacy — Springfield area
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #1247',address:'2760 N Dirksen Pkwy',city:'Springfield',state:'IL',zip:'62702',phone:'(555) 320-1001',fax:'(555) 320-1002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #1248',address:'1100 Lejune Dr',city:'Springfield',state:'IL',zip:'62703',phone:'(555) 320-1003',fax:'(555) 320-1004',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #1249',address:'3401 Freedom Dr',city:'Springfield',state:'IL',zip:'62704',phone:'(555) 320-1005',fax:'(555) 320-1006',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #3520',address:'1903 W Morton Ave',city:'Jacksonville',state:'IL',zip:'62650',phone:'(555) 320-2001',fax:'(555) 320-2002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #3525',address:'825 Woodlawn Rd',city:'Lincoln',state:'IL',zip:'62656',phone:'(555) 320-2003',fax:'(555) 320-2004',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},

  // Rite Aid — Springfield area
  {chain:'Rite Aid',name:'Rite Aid #2601',address:'1321 S MacArthur Blvd',city:'Springfield',state:'IL',zip:'62704',phone:'(555) 330-1001',fax:'(555) 330-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Rite Aid',name:'Rite Aid #2602',address:'701 E Sangamon Ave',city:'Springfield',state:'IL',zip:'62702',phone:'(555) 330-1003',fax:'(555) 330-1004',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Rite Aid',name:'Rite Aid #2603',address:'1908 S 11th St',city:'Springfield',state:'IL',zip:'62703',phone:'(555) 330-1005',fax:'(555) 330-1006',hours:'Mon-Fri 9am-8pm, Sat 9am-5pm, Sun Closed',is24hr:false},
  {chain:'Rite Aid',name:'Rite Aid #2604',address:'3219 Lake Plaza Dr',city:'Springfield',state:'IL',zip:'62703',phone:'(555) 330-1007',fax:'(555) 330-1008',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Rite Aid',name:'Rite Aid #2610',address:'505 S Main St',city:'Jacksonville',state:'IL',zip:'62650',phone:'(555) 330-2001',fax:'(555) 330-2002',hours:'Mon-Fri 9am-8pm, Sat 9am-5pm, Sun Closed',is24hr:false},

  // Kroger Pharmacy — Springfield area
  {chain:'Kroger Pharmacy',name:'Kroger Pharmacy #521',address:'2625 W Wabash Ave',city:'Springfield',state:'IL',zip:'62704',phone:'(555) 340-1001',fax:'(555) 340-1002',hours:'Mon-Fri 9am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Kroger Pharmacy',name:'Kroger Pharmacy #522',address:'1535 N Dirksen Pkwy',city:'Springfield',state:'IL',zip:'62702',phone:'(555) 340-1003',fax:'(555) 340-1004',hours:'Mon-Fri 9am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Kroger Pharmacy',name:'Kroger Pharmacy #523',address:'2901 Stolp Ave',city:'Springfield',state:'IL',zip:'62702',phone:'(555) 340-1005',fax:'(555) 340-1006',hours:'Mon-Fri 9am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Kroger Pharmacy',name:'Kroger Pharmacy #530',address:'800 E Elm St',city:'Jacksonville',state:'IL',zip:'62650',phone:'(555) 340-2001',fax:'(555) 340-2002',hours:'Mon-Fri 9am-8pm, Sat 9am-5pm, Sun Closed',is24hr:false},

  // Costco Pharmacy
  {chain:'Costco Pharmacy',name:'Costco Pharmacy #1201',address:'4600 Wabash Ave',city:'Springfield',state:'IL',zip:'62711',phone:'(555) 350-1001',fax:'(555) 350-1002',hours:'Mon-Fri 10am-8:30pm, Sat 9:30am-6pm, Sun Closed',is24hr:false},

  // Publix (for wider zip coverage)
  {chain:'Publix Pharmacy',name:'Publix Pharmacy #0810',address:'3200 Peach Tree Blvd',city:'Decatur',state:'IL',zip:'62521',phone:'(555) 360-1001',fax:'(555) 360-1002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 11am-6pm',is24hr:false},
  {chain:'Publix Pharmacy',name:'Publix Pharmacy #0811',address:'1500 E Eldorado St',city:'Decatur',state:'IL',zip:'62521',phone:'(555) 360-1003',fax:'(555) 360-1004',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 11am-6pm',is24hr:false},

  // More Springfield pharmacies (independent & specialty)
  {chain:'Springfield Specialty Pharmacy',name:'Springfield Specialty Pharmacy',address:'747 N Rutledge St',city:'Springfield',state:'IL',zip:'62702',phone:'(555) 370-1001',fax:'(555) 370-1002',hours:'Mon-Fri 8am-6pm, Sat 9am-1pm, Sun Closed',is24hr:false},
  {chain:'Capitol City Pharmacy',name:'Capitol City Pharmacy',address:'300 E Capitol Ave',city:'Springfield',state:'IL',zip:'62701',phone:'(555) 370-2001',fax:'(555) 370-2002',hours:'Mon-Fri 8:30am-6pm, Sat 9am-2pm, Sun Closed',is24hr:false},
  {chain:'Lincoln Land Pharmacy',name:'Lincoln Land Pharmacy',address:'120 N 7th St',city:'Springfield',state:'IL',zip:'62701',phone:'(555) 370-3001',fax:'(555) 370-3002',hours:'Mon-Fri 9am-5:30pm, Sat Closed, Sun Closed',is24hr:false},
  {chain:'Memorial Medical Pharmacy',name:'Memorial Medical Pharmacy',address:'701 N 1st St',city:'Springfield',state:'IL',zip:'62781',phone:'(555) 370-4001',fax:'(555) 370-4002',hours:'Mon-Fri 7am-7pm, Sat 8am-4pm, Sun 8am-4pm',is24hr:false},
  {chain:'HSHS Outpatient Pharmacy',name:'HSHS Outpatient Pharmacy',address:'800 E Carpenter St',city:'Springfield',state:'IL',zip:'62769',phone:'(555) 370-5001',fax:'(555) 370-5002',hours:'Mon-Fri 7:30am-6pm, Sat 8am-2pm, Sun Closed',is24hr:false},

  // Additional zip coverage — Champaign IL (618xx)
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #6101',address:'601 S Neil St',city:'Champaign',state:'IL',zip:'61820',phone:'(555) 380-1001',fax:'(555) 380-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #6701',address:'1301 W University Ave',city:'Urbana',state:'IL',zip:'61801',phone:'(555) 380-2001',fax:'(555) 380-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #6702',address:'2001 N Prospect Ave',city:'Champaign',state:'IL',zip:'61822',phone:'(555) 380-2003',fax:'(555) 380-2004',hours:'24 Hours',is24hr:true},

  // Peoria IL (616xx)
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #6401',address:'4400 N Sterling Ave',city:'Peoria',state:'IL',zip:'61615',phone:'(555) 390-1001',fax:'(555) 390-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #7001',address:'3310 N University St',city:'Peoria',state:'IL',zip:'61604',phone:'(555) 390-2001',fax:'(555) 390-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #5501',address:'5200 W War Memorial Dr',city:'Peoria',state:'IL',zip:'61615',phone:'(555) 390-3001',fax:'(555) 390-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},

  // Bloomington-Normal IL (617xx)
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #6201',address:'1401 N Veterans Pkwy',city:'Bloomington',state:'IL',zip:'61704',phone:'(555) 385-1001',fax:'(555) 385-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #6801',address:'200 N Main St',city:'Normal',state:'IL',zip:'61761',phone:'(555) 385-2001',fax:'(555) 385-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},

  // Chicago area (606xx)
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #8001',address:'155 N State St',city:'Chicago',state:'IL',zip:'60601',phone:'(555) 400-1001',fax:'(555) 400-1002',hours:'Mon-Fri 7am-10pm, Sat 8am-9pm, Sun 9am-7pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #9001',address:'2 N State St',city:'Chicago',state:'IL',zip:'60602',phone:'(555) 400-2001',fax:'(555) 400-2002',hours:'24 Hours',is24hr:true},
  {chain:'Walgreens',name:'Walgreens #9002',address:'757 N Michigan Ave',city:'Chicago',state:'IL',zip:'60611',phone:'(555) 400-2003',fax:'(555) 400-2004',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 9am-8pm',is24hr:false},

  // St. Louis MO area (631xx)
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #8501',address:'501 Olive St',city:'St. Louis',state:'MO',zip:'63101',phone:'(555) 410-1001',fax:'(555) 410-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #9501',address:'200 N Broadway',city:'St. Louis',state:'MO',zip:'63102',phone:'(555) 410-2001',fax:'(555) 410-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},

  // More Springfield area for density
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #4550',address:'4200 Conestoga Dr',city:'Springfield',state:'IL',zip:'62711',phone:'(555) 300-1013',fax:'(555) 300-1014',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #5930',address:'2945 Lindbergh Blvd',city:'Springfield',state:'IL',zip:'62704',phone:'(555) 310-1015',fax:'(555) 310-1016',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Rite Aid',name:'Rite Aid #2605',address:'1010 Clock Tower Dr',city:'Springfield',state:'IL',zip:'62704',phone:'(555) 330-1009',fax:'(555) 330-1010',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Kroger Pharmacy',name:'Kroger Pharmacy #524',address:'3901 W Iles Ave',city:'Springfield',state:'IL',zip:'62711',phone:'(555) 340-1007',fax:'(555) 340-1008',hours:'Mon-Fri 9am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #1250',address:'3401 S Veterans Pkwy',city:'Springfield',state:'IL',zip:'62704',phone:'(555) 320-1007',fax:'(555) 320-1008',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},

  // ── Alabama (AL) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1001',address:'2801 Eastern Blvd',city:'Montgomery',state:'AL',zip:'36116',phone:'(555) 501-1001',fax:'(555) 501-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3001',address:'3500 Memorial Pkwy SW',city:'Huntsville',state:'AL',zip:'35801',phone:'(555) 501-2001',fax:'(555) 501-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2001',address:'5555 McClellan Blvd',city:'Anniston',state:'AL',zip:'36206',phone:'(555) 501-3001',fax:'(555) 501-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1002',address:'1650 Montclair Rd',city:'Birmingham',state:'AL',zip:'35210',phone:'(555) 501-1003',fax:'(555) 501-1004',hours:'24 Hours',is24hr:true},

  // ── Alaska (AK) ──
  {chain:'Walgreens',name:'Walgreens #3010',address:'1260 N Muldoon Rd',city:'Anchorage',state:'AK',zip:'99504',phone:'(555) 502-2001',fax:'(555) 502-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 9am-7pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2010',address:'3101 A St',city:'Anchorage',state:'AK',zip:'99503',phone:'(555) 502-3001',fax:'(555) 502-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},
  {chain:'Safeway Pharmacy',name:'Safeway Pharmacy #1750',address:'3901 Old Seward Hwy',city:'Anchorage',state:'AK',zip:'99503',phone:'(555) 502-4001',fax:'(555) 502-4002',hours:'Mon-Fri 9am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},

  // ── Arizona (AZ) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1010',address:'3402 N Central Ave',city:'Phoenix',state:'AZ',zip:'85012',phone:'(555) 503-1001',fax:'(555) 503-1002',hours:'24 Hours',is24hr:true},
  {chain:'Walgreens',name:'Walgreens #3020',address:'7110 E McDowell Rd',city:'Scottsdale',state:'AZ',zip:'85257',phone:'(555) 503-2001',fax:'(555) 503-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2020',address:'1050 S Gilbert Rd',city:'Gilbert',state:'AZ',zip:'85296',phone:'(555) 503-3001',fax:'(555) 503-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},
  {chain:'Safeway Pharmacy',name:'Safeway Pharmacy #1760',address:'4700 E Speedway Blvd',city:'Tucson',state:'AZ',zip:'85712',phone:'(555) 503-4001',fax:'(555) 503-4002',hours:'Mon-Fri 9am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Costco Pharmacy',name:'Costco Pharmacy #1210',address:'15055 N Northsight Blvd',city:'Scottsdale',state:'AZ',zip:'85260',phone:'(555) 503-5001',fax:'(555) 503-5002',hours:'Mon-Fri 10am-8:30pm, Sat 9:30am-6pm, Sun Closed',is24hr:false},

  // ── Arkansas (AR) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1015',address:'9600 N Rodney Parham Rd',city:'Little Rock',state:'AR',zip:'72227',phone:'(555) 504-1001',fax:'(555) 504-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3025',address:'1620 S Caraway Rd',city:'Jonesboro',state:'AR',zip:'72401',phone:'(555) 504-2001',fax:'(555) 504-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2025',address:'5701 Rogers Ave',city:'Fort Smith',state:'AR',zip:'72903',phone:'(555) 504-3001',fax:'(555) 504-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},
  {chain:'Kroger Pharmacy',name:'Kroger Pharmacy #540',address:'2801 Lakewood Village Dr',city:'North Little Rock',state:'AR',zip:'72116',phone:'(555) 504-4001',fax:'(555) 504-4002',hours:'Mon-Fri 9am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},

  // ── California (CA) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1020',address:'8490 Beverly Blvd',city:'Los Angeles',state:'CA',zip:'90048',phone:'(555) 505-1001',fax:'(555) 505-1002',hours:'24 Hours',is24hr:true},
  {chain:'Walgreens',name:'Walgreens #3030',address:'135 Powell St',city:'San Francisco',state:'CA',zip:'94102',phone:'(555) 505-2001',fax:'(555) 505-2002',hours:'24 Hours',is24hr:true},
  {chain:'Rite Aid',name:'Rite Aid #2700',address:'2801 Marconi Ave',city:'Sacramento',state:'CA',zip:'95821',phone:'(555) 505-3001',fax:'(555) 505-3002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Safeway Pharmacy',name:'Safeway Pharmacy #1770',address:'1450 Howard St',city:'San Francisco',state:'CA',zip:'94103',phone:'(555) 505-4001',fax:'(555) 505-4002',hours:'Mon-Fri 9am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Costco Pharmacy',name:'Costco Pharmacy #1220',address:'2700 Park Blvd',city:'San Diego',state:'CA',zip:'92103',phone:'(555) 505-5001',fax:'(555) 505-5002',hours:'Mon-Fri 10am-8:30pm, Sat 9:30am-6pm, Sun Closed',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2030',address:'3250 Dale Rd',city:'Modesto',state:'CA',zip:'95356',phone:'(555) 505-6001',fax:'(555) 505-6002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},

  // ── Colorado (CO) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1025',address:'2005 S University Blvd',city:'Denver',state:'CO',zip:'80210',phone:'(555) 506-1001',fax:'(555) 506-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3035',address:'500 E 8th Ave',city:'Denver',state:'CO',zip:'80203',phone:'(555) 506-2001',fax:'(555) 506-2002',hours:'24 Hours',is24hr:true},
  {chain:'Safeway Pharmacy',name:'Safeway Pharmacy #1780',address:'2160 S Colorado Blvd',city:'Denver',state:'CO',zip:'80222',phone:'(555) 506-4001',fax:'(555) 506-4002',hours:'Mon-Fri 9am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2035',address:'7455 W Colfax Ave',city:'Lakewood',state:'CO',zip:'80214',phone:'(555) 506-3001',fax:'(555) 506-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},

  // ── Connecticut (CT) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1030',address:'1099 Whalley Ave',city:'New Haven',state:'CT',zip:'06515',phone:'(555) 507-1001',fax:'(555) 507-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3040',address:'505 Farmington Ave',city:'Hartford',state:'CT',zip:'06105',phone:'(555) 507-2001',fax:'(555) 507-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Rite Aid',name:'Rite Aid #2710',address:'1500 Boston Post Rd',city:'Milford',state:'CT',zip:'06460',phone:'(555) 507-3001',fax:'(555) 507-3002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Costco Pharmacy',name:'Costco Pharmacy #1230',address:'1 Costco Dr',city:'Norwalk',state:'CT',zip:'06851',phone:'(555) 507-5001',fax:'(555) 507-5002',hours:'Mon-Fri 10am-8:30pm, Sat 9:30am-6pm, Sun Closed',is24hr:false},

  // ── Delaware (DE) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1035',address:'4001 Concord Pike',city:'Wilmington',state:'DE',zip:'19803',phone:'(555) 508-1001',fax:'(555) 508-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3045',address:'250 S State St',city:'Dover',state:'DE',zip:'19901',phone:'(555) 508-2001',fax:'(555) 508-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Rite Aid',name:'Rite Aid #2720',address:'1515 N DuPont Hwy',city:'Dover',state:'DE',zip:'19901',phone:'(555) 508-3001',fax:'(555) 508-3002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},

  // ── Florida (FL) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1040',address:'3000 Biscayne Blvd',city:'Miami',state:'FL',zip:'33137',phone:'(555) 509-1001',fax:'(555) 509-1002',hours:'24 Hours',is24hr:true},
  {chain:'Walgreens',name:'Walgreens #3050',address:'100 N Orange Ave',city:'Orlando',state:'FL',zip:'32801',phone:'(555) 509-2001',fax:'(555) 509-2002',hours:'24 Hours',is24hr:true},
  {chain:'Publix Pharmacy',name:'Publix Pharmacy #0820',address:'3601 W Kennedy Blvd',city:'Tampa',state:'FL',zip:'33609',phone:'(555) 509-4001',fax:'(555) 509-4002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 11am-6pm',is24hr:false},
  {chain:'Publix Pharmacy',name:'Publix Pharmacy #0821',address:'5225 A1A S',city:'St. Augustine',state:'FL',zip:'32080',phone:'(555) 509-4003',fax:'(555) 509-4004',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 11am-6pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2040',address:'4600 W Newberry Rd',city:'Gainesville',state:'FL',zip:'32607',phone:'(555) 509-3001',fax:'(555) 509-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},

  // ── Georgia (GA) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1045',address:'200 Peachtree St NE',city:'Atlanta',state:'GA',zip:'30303',phone:'(555) 510-1001',fax:'(555) 510-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3055',address:'725 Ponce De Leon Ave NE',city:'Atlanta',state:'GA',zip:'30306',phone:'(555) 510-2001',fax:'(555) 510-2002',hours:'24 Hours',is24hr:true},
  {chain:'Publix Pharmacy',name:'Publix Pharmacy #0830',address:'3535 Peachtree Rd NE',city:'Atlanta',state:'GA',zip:'30326',phone:'(555) 510-4001',fax:'(555) 510-4002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 11am-6pm',is24hr:false},
  {chain:'Kroger Pharmacy',name:'Kroger Pharmacy #545',address:'1311 Johnson Ferry Rd',city:'Marietta',state:'GA',zip:'30068',phone:'(555) 510-5001',fax:'(555) 510-5002',hours:'Mon-Fri 9am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2045',address:'6149 Old National Hwy',city:'College Park',state:'GA',zip:'30349',phone:'(555) 510-3001',fax:'(555) 510-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},

  // ── Hawaii (HI) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1050',address:'1030 Ala Moana Blvd',city:'Honolulu',state:'HI',zip:'96814',phone:'(555) 511-1001',fax:'(555) 511-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3060',address:'2155 Kalakaua Ave',city:'Honolulu',state:'HI',zip:'96815',phone:'(555) 511-2001',fax:'(555) 511-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2050',address:'700 Keeaumoku St',city:'Honolulu',state:'HI',zip:'96814',phone:'(555) 511-3001',fax:'(555) 511-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},

  // ── Idaho (ID) ──
  {chain:'Walgreens',name:'Walgreens #3065',address:'1219 N Milwaukee St',city:'Boise',state:'ID',zip:'83704',phone:'(555) 512-2001',fax:'(555) 512-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2055',address:'8300 W Overland Rd',city:'Boise',state:'ID',zip:'83709',phone:'(555) 512-3001',fax:'(555) 512-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},
  {chain:'Safeway Pharmacy',name:'Safeway Pharmacy #1790',address:'1650 S 25th E',city:'Idaho Falls',state:'ID',zip:'83404',phone:'(555) 512-4001',fax:'(555) 512-4002',hours:'Mon-Fri 9am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},

  // ── Indiana (IN) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1060',address:'155 E Market St',city:'Indianapolis',state:'IN',zip:'46204',phone:'(555) 513-1001',fax:'(555) 513-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3070',address:'3902 N Meridian St',city:'Indianapolis',state:'IN',zip:'46208',phone:'(555) 513-2001',fax:'(555) 513-2002',hours:'24 Hours',is24hr:true},
  {chain:'Kroger Pharmacy',name:'Kroger Pharmacy #550',address:'1217 S Rangeline Rd',city:'Carmel',state:'IN',zip:'46032',phone:'(555) 513-5001',fax:'(555) 513-5002',hours:'Mon-Fri 9am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2060',address:'4650 W 86th St',city:'Indianapolis',state:'IN',zip:'46268',phone:'(555) 513-3001',fax:'(555) 513-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},

  // ── Iowa (IA) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1065',address:'2545 Hubbell Ave',city:'Des Moines',state:'IA',zip:'50317',phone:'(555) 514-1001',fax:'(555) 514-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3075',address:'1015 2nd Ave SE',city:'Cedar Rapids',state:'IA',zip:'52403',phone:'(555) 514-2001',fax:'(555) 514-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2065',address:'4218 Elmore Ave',city:'Davenport',state:'IA',zip:'52807',phone:'(555) 514-3001',fax:'(555) 514-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},

  // ── Kansas (KS) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1070',address:'1133 SW Topeka Blvd',city:'Topeka',state:'KS',zip:'66612',phone:'(555) 515-1001',fax:'(555) 515-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3080',address:'550 N Rock Rd',city:'Wichita',state:'KS',zip:'67206',phone:'(555) 515-2001',fax:'(555) 515-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2070',address:'3030 Iowa St',city:'Lawrence',state:'KS',zip:'66046',phone:'(555) 515-3001',fax:'(555) 515-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},

  // ── Kentucky (KY) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1075',address:'525 W Broadway',city:'Louisville',state:'KY',zip:'40202',phone:'(555) 516-1001',fax:'(555) 516-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3085',address:'901 Beaumont Centre Ln',city:'Lexington',state:'KY',zip:'40513',phone:'(555) 516-2001',fax:'(555) 516-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Kroger Pharmacy',name:'Kroger Pharmacy #555',address:'2710 Lexington Rd',city:'Louisville',state:'KY',zip:'40206',phone:'(555) 516-5001',fax:'(555) 516-5002',hours:'Mon-Fri 9am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2075',address:'3600 US 60',city:'Owensboro',state:'KY',zip:'42301',phone:'(555) 516-3001',fax:'(555) 516-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},

  // ── Louisiana (LA) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1080',address:'900 Canal St',city:'New Orleans',state:'LA',zip:'70112',phone:'(555) 517-1001',fax:'(555) 517-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3090',address:'3001 Highland Rd',city:'Baton Rouge',state:'LA',zip:'70802',phone:'(555) 517-2001',fax:'(555) 517-2002',hours:'24 Hours',is24hr:true},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2080',address:'1353 E Bert Kouns Industrial Loop',city:'Shreveport',state:'LA',zip:'71105',phone:'(555) 517-3001',fax:'(555) 517-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},

  // ── Maine (ME) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1085',address:'510 Congress St',city:'Portland',state:'ME',zip:'04101',phone:'(555) 518-1001',fax:'(555) 518-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3095',address:'440 Western Ave',city:'Augusta',state:'ME',zip:'04330',phone:'(555) 518-2001',fax:'(555) 518-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Rite Aid',name:'Rite Aid #2730',address:'623 Stillwater Ave',city:'Bangor',state:'ME',zip:'04401',phone:'(555) 518-3001',fax:'(555) 518-3002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},

  // ── Maryland (MD) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1090',address:'201 E Pratt St',city:'Baltimore',state:'MD',zip:'21202',phone:'(555) 519-1001',fax:'(555) 519-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3100',address:'8501 Colesville Rd',city:'Silver Spring',state:'MD',zip:'20910',phone:'(555) 519-2001',fax:'(555) 519-2002',hours:'24 Hours',is24hr:true},
  {chain:'Rite Aid',name:'Rite Aid #2740',address:'5200 Wisconsin Ave',city:'Bethesda',state:'MD',zip:'20815',phone:'(555) 519-3001',fax:'(555) 519-3002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2085',address:'3231 Solomons Island Rd',city:'Edgewater',state:'MD',zip:'21037',phone:'(555) 519-4001',fax:'(555) 519-4002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},

  // ── Massachusetts (MA) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1095',address:'210 Border St',city:'Boston',state:'MA',zip:'02128',phone:'(555) 520-1001',fax:'(555) 520-1002',hours:'24 Hours',is24hr:true},
  {chain:'Walgreens',name:'Walgreens #3105',address:'841 Boylston St',city:'Boston',state:'MA',zip:'02116',phone:'(555) 520-2001',fax:'(555) 520-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Rite Aid',name:'Rite Aid #2750',address:'358 Main St',city:'Worcester',state:'MA',zip:'01608',phone:'(555) 520-3001',fax:'(555) 520-3002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Costco Pharmacy',name:'Costco Pharmacy #1240',address:'71 2nd Ave',city:'Waltham',state:'MA',zip:'02451',phone:'(555) 520-5001',fax:'(555) 520-5002',hours:'Mon-Fri 10am-8:30pm, Sat 9:30am-6pm, Sun Closed',is24hr:false},

  // ── Michigan (MI) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1100',address:'1250 Woodward Ave',city:'Detroit',state:'MI',zip:'48226',phone:'(555) 521-1001',fax:'(555) 521-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3110',address:'2975 28th St SE',city:'Grand Rapids',state:'MI',zip:'49512',phone:'(555) 521-2001',fax:'(555) 521-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Rite Aid',name:'Rite Aid #2760',address:'401 S Saginaw St',city:'Flint',state:'MI',zip:'48502',phone:'(555) 521-3001',fax:'(555) 521-3002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Kroger Pharmacy',name:'Kroger Pharmacy #560',address:'3145 Washtenaw Ave',city:'Ann Arbor',state:'MI',zip:'48104',phone:'(555) 521-5001',fax:'(555) 521-5002',hours:'Mon-Fri 9am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2090',address:'29555 Plymouth Rd',city:'Livonia',state:'MI',zip:'48150',phone:'(555) 521-4001',fax:'(555) 521-4002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},

  // ── Minnesota (MN) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1105',address:'700 Nicollet Mall',city:'Minneapolis',state:'MN',zip:'55402',phone:'(555) 522-1001',fax:'(555) 522-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3115',address:'1585 University Ave W',city:'St. Paul',state:'MN',zip:'55104',phone:'(555) 522-2001',fax:'(555) 522-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2095',address:'13505 Ridgedale Dr',city:'Minnetonka',state:'MN',zip:'55305',phone:'(555) 522-3001',fax:'(555) 522-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},
  {chain:'Costco Pharmacy',name:'Costco Pharmacy #1250',address:'8400 Springbrook Dr NW',city:'Coon Rapids',state:'MN',zip:'55433',phone:'(555) 522-5001',fax:'(555) 522-5002',hours:'Mon-Fri 10am-8:30pm, Sat 9:30am-6pm, Sun Closed',is24hr:false},

  // ── Mississippi (MS) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1110',address:'4500 I-55 N',city:'Jackson',state:'MS',zip:'39211',phone:'(555) 523-1001',fax:'(555) 523-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3120',address:'3100 Hardy St',city:'Hattiesburg',state:'MS',zip:'39401',phone:'(555) 523-2001',fax:'(555) 523-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2100',address:'2711 N Gloster St',city:'Tupelo',state:'MS',zip:'38801',phone:'(555) 523-3001',fax:'(555) 523-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},

  // ── Montana (MT) ──
  {chain:'Walgreens',name:'Walgreens #3130',address:'501 S Higgins Ave',city:'Missoula',state:'MT',zip:'59801',phone:'(555) 525-2001',fax:'(555) 525-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2110',address:'2525 King Ave W',city:'Billings',state:'MT',zip:'59102',phone:'(555) 525-3001',fax:'(555) 525-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},
  {chain:'Safeway Pharmacy',name:'Safeway Pharmacy #1800',address:'1003 Helena Ave',city:'Helena',state:'MT',zip:'59601',phone:'(555) 525-4001',fax:'(555) 525-4002',hours:'Mon-Fri 9am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},

  // ── Nebraska (NE) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1120',address:'7020 Dodge St',city:'Omaha',state:'NE',zip:'68132',phone:'(555) 526-1001',fax:'(555) 526-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3135',address:'2550 S 48th St',city:'Lincoln',state:'NE',zip:'68506',phone:'(555) 526-2001',fax:'(555) 526-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2115',address:'1606 S Locust St',city:'Grand Island',state:'NE',zip:'68801',phone:'(555) 526-3001',fax:'(555) 526-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},

  // ── Nevada (NV) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1125',address:'3758 Las Vegas Blvd S',city:'Las Vegas',state:'NV',zip:'89109',phone:'(555) 527-1001',fax:'(555) 527-1002',hours:'24 Hours',is24hr:true},
  {chain:'Walgreens',name:'Walgreens #3140',address:'5005 S Eastern Ave',city:'Las Vegas',state:'NV',zip:'89119',phone:'(555) 527-2001',fax:'(555) 527-2002',hours:'24 Hours',is24hr:true},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2120',address:'300 E 2nd St',city:'Reno',state:'NV',zip:'89501',phone:'(555) 527-3001',fax:'(555) 527-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},
  {chain:'Safeway Pharmacy',name:'Safeway Pharmacy #1810',address:'4900 S McCarran Blvd',city:'Reno',state:'NV',zip:'89502',phone:'(555) 527-4001',fax:'(555) 527-4002',hours:'Mon-Fri 9am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},

  // ── New Hampshire (NH) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1130',address:'80 S Main St',city:'Concord',state:'NH',zip:'03301',phone:'(555) 528-1001',fax:'(555) 528-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3145',address:'200 Elm St',city:'Manchester',state:'NH',zip:'03101',phone:'(555) 528-2001',fax:'(555) 528-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Rite Aid',name:'Rite Aid #2770',address:'1275 Elm St',city:'Manchester',state:'NH',zip:'03101',phone:'(555) 528-3001',fax:'(555) 528-3002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},

  // ── New Jersey (NJ) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1135',address:'510 Broad St',city:'Newark',state:'NJ',zip:'07102',phone:'(555) 529-1001',fax:'(555) 529-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3150',address:'2100 Route 38',city:'Cherry Hill',state:'NJ',zip:'08002',phone:'(555) 529-2001',fax:'(555) 529-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Rite Aid',name:'Rite Aid #2780',address:'1 Journal Sq',city:'Jersey City',state:'NJ',zip:'07306',phone:'(555) 529-3001',fax:'(555) 529-3002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2125',address:'3575 US 1',city:'Princeton',state:'NJ',zip:'08540',phone:'(555) 529-4001',fax:'(555) 529-4002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},

  // ── New Mexico (NM) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1140',address:'6100 Coors Blvd NW',city:'Albuquerque',state:'NM',zip:'87120',phone:'(555) 530-1001',fax:'(555) 530-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3155',address:'3401 Cerrillos Rd',city:'Santa Fe',state:'NM',zip:'87507',phone:'(555) 530-2001',fax:'(555) 530-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2130',address:'1550 S Valley Dr',city:'Las Cruces',state:'NM',zip:'88005',phone:'(555) 530-3001',fax:'(555) 530-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},

  // ── New York (NY) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1145',address:'200 W 57th St',city:'New York',state:'NY',zip:'10019',phone:'(555) 531-1001',fax:'(555) 531-1002',hours:'24 Hours',is24hr:true},
  {chain:'Walgreens',name:'Walgreens #3160',address:'350 5th Ave',city:'New York',state:'NY',zip:'10118',phone:'(555) 531-2001',fax:'(555) 531-2002',hours:'24 Hours',is24hr:true},
  {chain:'Rite Aid',name:'Rite Aid #2790',address:'408 Grand Concourse',city:'Bronx',state:'NY',zip:'10451',phone:'(555) 531-3001',fax:'(555) 531-3002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2135',address:'4975 Transit Rd',city:'Depew',state:'NY',zip:'14043',phone:'(555) 531-4001',fax:'(555) 531-4002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},
  {chain:'Costco Pharmacy',name:'Costco Pharmacy #1260',address:'976 3rd Ave',city:'New York',state:'NY',zip:'10022',phone:'(555) 531-5001',fax:'(555) 531-5002',hours:'Mon-Fri 10am-8:30pm, Sat 9:30am-6pm, Sun Closed',is24hr:false},

  // ── North Carolina (NC) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1150',address:'310 S Elm St',city:'Greensboro',state:'NC',zip:'27401',phone:'(555) 532-1001',fax:'(555) 532-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3165',address:'200 S Tryon St',city:'Charlotte',state:'NC',zip:'28202',phone:'(555) 532-2001',fax:'(555) 532-2002',hours:'24 Hours',is24hr:true},
  {chain:'Publix Pharmacy',name:'Publix Pharmacy #0840',address:'4540 Yadkin Rd',city:'Fayetteville',state:'NC',zip:'28303',phone:'(555) 532-4001',fax:'(555) 532-4002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 11am-6pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2140',address:'4500 New Bern Ave',city:'Raleigh',state:'NC',zip:'27610',phone:'(555) 532-3001',fax:'(555) 532-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},

  // ── North Dakota (ND) ──
  {chain:'Walgreens',name:'Walgreens #3170',address:'1301 S University Dr',city:'Fargo',state:'ND',zip:'58103',phone:'(555) 533-2001',fax:'(555) 533-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2145',address:'2717 State St',city:'Bismarck',state:'ND',zip:'58503',phone:'(555) 533-3001',fax:'(555) 533-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1155',address:'3100 32nd Ave S',city:'Grand Forks',state:'ND',zip:'58201',phone:'(555) 533-1001',fax:'(555) 533-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},

  // ── Ohio (OH) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1160',address:'1375 E 9th St',city:'Cleveland',state:'OH',zip:'44114',phone:'(555) 534-1001',fax:'(555) 534-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3175',address:'220 E Broad St',city:'Columbus',state:'OH',zip:'43215',phone:'(555) 534-2001',fax:'(555) 534-2002',hours:'24 Hours',is24hr:true},
  {chain:'Rite Aid',name:'Rite Aid #2800',address:'4102 W 3rd St',city:'Dayton',state:'OH',zip:'45417',phone:'(555) 534-3001',fax:'(555) 534-3002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Kroger Pharmacy',name:'Kroger Pharmacy #565',address:'1350 W Lane Ave',city:'Columbus',state:'OH',zip:'43221',phone:'(555) 534-5001',fax:'(555) 534-5002',hours:'Mon-Fri 9am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2150',address:'2801 N Reynolds Rd',city:'Toledo',state:'OH',zip:'43615',phone:'(555) 534-4001',fax:'(555) 534-4002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},

  // ── Oklahoma (OK) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1165',address:'3030 NW Expressway',city:'Oklahoma City',state:'OK',zip:'73112',phone:'(555) 535-1001',fax:'(555) 535-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3180',address:'1830 S Harvard Ave',city:'Tulsa',state:'OK',zip:'74112',phone:'(555) 535-2001',fax:'(555) 535-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2155',address:'501 N 9th St',city:'Broken Arrow',state:'OK',zip:'74012',phone:'(555) 535-3001',fax:'(555) 535-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},

  // ── Oregon (OR) ──
  {chain:'Walgreens',name:'Walgreens #3185',address:'940 SW 6th Ave',city:'Portland',state:'OR',zip:'97204',phone:'(555) 536-2001',fax:'(555) 536-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Safeway Pharmacy',name:'Safeway Pharmacy #1820',address:'1030 NW Couch St',city:'Portland',state:'OR',zip:'97209',phone:'(555) 536-4001',fax:'(555) 536-4002',hours:'Mon-Fri 9am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2160',address:'1330 Goldfish Farm Rd',city:'Eugene',state:'OR',zip:'97404',phone:'(555) 536-3001',fax:'(555) 536-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},
  {chain:'Costco Pharmacy',name:'Costco Pharmacy #1270',address:'4849 NE 138th Ave',city:'Portland',state:'OR',zip:'97230',phone:'(555) 536-5001',fax:'(555) 536-5002',hours:'Mon-Fri 10am-8:30pm, Sat 9:30am-6pm, Sun Closed',is24hr:false},

  // ── Pennsylvania (PA) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1170',address:'1826 Chestnut St',city:'Philadelphia',state:'PA',zip:'19103',phone:'(555) 537-1001',fax:'(555) 537-1002',hours:'24 Hours',is24hr:true},
  {chain:'Walgreens',name:'Walgreens #3190',address:'200 Forbes Ave',city:'Pittsburgh',state:'PA',zip:'15222',phone:'(555) 537-2001',fax:'(555) 537-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Rite Aid',name:'Rite Aid #2810',address:'3420 Simpson Ferry Rd',city:'Camp Hill',state:'PA',zip:'17011',phone:'(555) 537-3001',fax:'(555) 537-3002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2165',address:'1091 Millcreek Mall',city:'Erie',state:'PA',zip:'16509',phone:'(555) 537-4001',fax:'(555) 537-4002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},
  {chain:'Costco Pharmacy',name:'Costco Pharmacy #1275',address:'500 W Germantown Pike',city:'Plymouth Meeting',state:'PA',zip:'19462',phone:'(555) 537-5001',fax:'(555) 537-5002',hours:'Mon-Fri 10am-8:30pm, Sat 9:30am-6pm, Sun Closed',is24hr:false},

  // ── Rhode Island (RI) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1175',address:'1 CVS Dr',city:'Woonsocket',state:'RI',zip:'02895',phone:'(555) 538-1001',fax:'(555) 538-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3195',address:'250 Main St',city:'Pawtucket',state:'RI',zip:'02860',phone:'(555) 538-2001',fax:'(555) 538-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2170',address:'650 Bald Hill Rd',city:'Warwick',state:'RI',zip:'02886',phone:'(555) 538-3001',fax:'(555) 538-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},

  // ── South Carolina (SC) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1180',address:'1200 Main St',city:'Columbia',state:'SC',zip:'29201',phone:'(555) 539-1001',fax:'(555) 539-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3200',address:'1760 Sam Rittenberg Blvd',city:'Charleston',state:'SC',zip:'29407',phone:'(555) 539-2001',fax:'(555) 539-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Publix Pharmacy',name:'Publix Pharmacy #0850',address:'3620 Pelham Rd',city:'Greenville',state:'SC',zip:'29615',phone:'(555) 539-4001',fax:'(555) 539-4002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 11am-6pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2175',address:'10060 Two Notch Rd',city:'Columbia',state:'SC',zip:'29223',phone:'(555) 539-3001',fax:'(555) 539-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},

  // ── South Dakota (SD) ──
  {chain:'Walgreens',name:'Walgreens #3205',address:'3300 S Minnesota Ave',city:'Sioux Falls',state:'SD',zip:'57105',phone:'(555) 540-2001',fax:'(555) 540-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2180',address:'1200 N Lacrosse St',city:'Rapid City',state:'SD',zip:'57701',phone:'(555) 540-3001',fax:'(555) 540-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1185',address:'2101 W 41st St',city:'Sioux Falls',state:'SD',zip:'57105',phone:'(555) 540-1001',fax:'(555) 540-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},

  // ── Tennessee (TN) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1190',address:'1501 Broadway',city:'Nashville',state:'TN',zip:'37203',phone:'(555) 541-1001',fax:'(555) 541-1002',hours:'24 Hours',is24hr:true},
  {chain:'Walgreens',name:'Walgreens #3210',address:'1863 Union Ave',city:'Memphis',state:'TN',zip:'38104',phone:'(555) 541-2001',fax:'(555) 541-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Kroger Pharmacy',name:'Kroger Pharmacy #570',address:'4100 Hillsboro Pike',city:'Nashville',state:'TN',zip:'37215',phone:'(555) 541-5001',fax:'(555) 541-5002',hours:'Mon-Fri 9am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2185',address:'5764 Brainerd Rd',city:'Chattanooga',state:'TN',zip:'37411',phone:'(555) 541-3001',fax:'(555) 541-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},

  // ── Texas (TX) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1195',address:'5959 Richmond Ave',city:'Houston',state:'TX',zip:'77057',phone:'(555) 542-1001',fax:'(555) 542-1002',hours:'24 Hours',is24hr:true},
  {chain:'Walgreens',name:'Walgreens #3215',address:'100 S Akard St',city:'Dallas',state:'TX',zip:'75202',phone:'(555) 542-2001',fax:'(555) 542-2002',hours:'24 Hours',is24hr:true},
  {chain:'HEB Pharmacy',name:'HEB Pharmacy #301',address:'300 W Olmos Dr',city:'San Antonio',state:'TX',zip:'78212',phone:'(555) 542-6001',fax:'(555) 542-6002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'HEB Pharmacy',name:'HEB Pharmacy #302',address:'1601 S Congress Ave',city:'Austin',state:'TX',zip:'78704',phone:'(555) 542-6003',fax:'(555) 542-6004',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2190',address:'2700 W Pioneer Pkwy',city:'Arlington',state:'TX',zip:'76013',phone:'(555) 542-3001',fax:'(555) 542-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},
  {chain:'Costco Pharmacy',name:'Costco Pharmacy #1280',address:'1001 W Arbrook Blvd',city:'Arlington',state:'TX',zip:'76015',phone:'(555) 542-5001',fax:'(555) 542-5002',hours:'Mon-Fri 10am-8:30pm, Sat 9:30am-6pm, Sun Closed',is24hr:false},

  // ── Utah (UT) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1200',address:'424 S 300 E',city:'Salt Lake City',state:'UT',zip:'84111',phone:'(555) 543-1001',fax:'(555) 543-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3220',address:'3320 S State St',city:'Salt Lake City',state:'UT',zip:'84115',phone:'(555) 543-2001',fax:'(555) 543-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2195',address:'1142 N Main St',city:'Logan',state:'UT',zip:'84341',phone:'(555) 543-3001',fax:'(555) 543-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},
  {chain:'Costco Pharmacy',name:'Costco Pharmacy #1285',address:'1818 S 300 W',city:'Salt Lake City',state:'UT',zip:'84115',phone:'(555) 543-5001',fax:'(555) 543-5002',hours:'Mon-Fri 10am-8:30pm, Sat 9:30am-6pm, Sun Closed',is24hr:false},

  // ── Vermont (VT) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1205',address:'208 College St',city:'Burlington',state:'VT',zip:'05401',phone:'(555) 544-1001',fax:'(555) 544-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3225',address:'364 Dorset St',city:'South Burlington',state:'VT',zip:'05403',phone:'(555) 544-2001',fax:'(555) 544-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Rite Aid',name:'Rite Aid #2820',address:'1 Scale Ave',city:'Rutland',state:'VT',zip:'05701',phone:'(555) 544-3001',fax:'(555) 544-3002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},

  // ── Virginia (VA) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1210',address:'1001 E Broad St',city:'Richmond',state:'VA',zip:'23219',phone:'(555) 545-1001',fax:'(555) 545-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3230',address:'4815 Seminary Rd',city:'Alexandria',state:'VA',zip:'22311',phone:'(555) 545-2001',fax:'(555) 545-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Rite Aid',name:'Rite Aid #2830',address:'19620 Williamsburg Rd',city:'Williamsburg',state:'VA',zip:'23185',phone:'(555) 545-3001',fax:'(555) 545-3002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Kroger Pharmacy',name:'Kroger Pharmacy #575',address:'3536 Ferncliff Ave NW',city:'Roanoke',state:'VA',zip:'24017',phone:'(555) 545-5001',fax:'(555) 545-5002',hours:'Mon-Fri 9am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2200',address:'1400 Reservoir St',city:'Harrisonburg',state:'VA',zip:'22801',phone:'(555) 545-4001',fax:'(555) 545-4002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},

  // ── Washington (WA) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1215',address:'1501 4th Ave',city:'Seattle',state:'WA',zip:'98101',phone:'(555) 546-1001',fax:'(555) 546-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3235',address:'601 Union St',city:'Seattle',state:'WA',zip:'98101',phone:'(555) 546-2001',fax:'(555) 546-2002',hours:'24 Hours',is24hr:true},
  {chain:'Safeway Pharmacy',name:'Safeway Pharmacy #1830',address:'3500 S Othello St',city:'Seattle',state:'WA',zip:'98118',phone:'(555) 546-4001',fax:'(555) 546-4002',hours:'Mon-Fri 9am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Costco Pharmacy',name:'Costco Pharmacy #1290',address:'4401 4th Ave S',city:'Seattle',state:'WA',zip:'98134',phone:'(555) 546-5001',fax:'(555) 546-5002',hours:'Mon-Fri 10am-8:30pm, Sat 9:30am-6pm, Sun Closed',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2205',address:'5727 Littlerock Rd SW',city:'Tumwater',state:'WA',zip:'98512',phone:'(555) 546-3001',fax:'(555) 546-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},

  // ── West Virginia (WV) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1220',address:'903 Quarrier St',city:'Charleston',state:'WV',zip:'25301',phone:'(555) 547-1001',fax:'(555) 547-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3240',address:'20 RHL Blvd',city:'Morgantown',state:'WV',zip:'26508',phone:'(555) 547-2001',fax:'(555) 547-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Rite Aid',name:'Rite Aid #2840',address:'200 Stafford Dr',city:'Huntington',state:'WV',zip:'25705',phone:'(555) 547-3001',fax:'(555) 547-3002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},

  // ── Wisconsin (WI) ──
  {chain:'CVS Pharmacy',name:'CVS Pharmacy #1225',address:'210 W Wisconsin Ave',city:'Milwaukee',state:'WI',zip:'53203',phone:'(555) 548-1001',fax:'(555) 548-1002',hours:'Mon-Fri 8am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
  {chain:'Walgreens',name:'Walgreens #3245',address:'30 E Mifflin St',city:'Madison',state:'WI',zip:'53703',phone:'(555) 548-2001',fax:'(555) 548-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2210',address:'4198 Calumet Ave',city:'Manitowoc',state:'WI',zip:'54220',phone:'(555) 548-3001',fax:'(555) 548-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},
  {chain:'Costco Pharmacy',name:'Costco Pharmacy #1295',address:'13130 W Silver Spring Dr',city:'Butler',state:'WI',zip:'53007',phone:'(555) 548-5001',fax:'(555) 548-5002',hours:'Mon-Fri 10am-8:30pm, Sat 9:30am-6pm, Sun Closed',is24hr:false},

  // ── Wyoming (WY) ──
  {chain:'Walgreens',name:'Walgreens #3250',address:'1900 Dell Range Blvd',city:'Cheyenne',state:'WY',zip:'82009',phone:'(555) 549-2001',fax:'(555) 549-2002',hours:'Mon-Fri 7am-10pm, Sat 8am-10pm, Sun 8am-9pm',is24hr:false},
  {chain:'Walmart Pharmacy',name:'Walmart Pharmacy #2215',address:'4400 Foothill Blvd',city:'Rock Springs',state:'WY',zip:'82901',phone:'(555) 549-3001',fax:'(555) 549-3002',hours:'Mon-Fri 9am-9pm, Sat 9am-7pm, Sun 10am-6pm',is24hr:false},
  {chain:'Safeway Pharmacy',name:'Safeway Pharmacy #1840',address:'951 E Main St',city:'Riverton',state:'WY',zip:'82501',phone:'(555) 549-4001',fax:'(555) 549-4002',hours:'Mon-Fri 9am-9pm, Sat 9am-6pm, Sun 10am-5pm',is24hr:false},
];

/* ============================================================
   Search Functions
   ============================================================ */

/* ============================================================
   Max Daily Dose Database (safety limits)
   Key = lowercase generic name, value = { maxSingleDose, maxDailyDose, unit }
   ============================================================ */
var MAX_DOSE_LIMITS = {
  'acetaminophen':      { maxSingleDose: 1000, maxDailyDose: 4000, unit: 'mg' },
  'ibuprofen':          { maxSingleDose: 800,  maxDailyDose: 3200, unit: 'mg' },
  'naproxen':           { maxSingleDose: 500,  maxDailyDose: 1500, unit: 'mg' },
  'metformin':          { maxSingleDose: 1000, maxDailyDose: 2550, unit: 'mg' },
  'lisinopril':         { maxSingleDose: 80,   maxDailyDose: 80,   unit: 'mg' },
  'losartan':           { maxSingleDose: 100,  maxDailyDose: 100,  unit: 'mg' },
  'amlodipine':         { maxSingleDose: 10,   maxDailyDose: 10,   unit: 'mg' },
  'atorvastatin':       { maxSingleDose: 80,   maxDailyDose: 80,   unit: 'mg' },
  'simvastatin':        { maxSingleDose: 40,   maxDailyDose: 40,   unit: 'mg' },
  'metoprolol tartrate': { maxSingleDose: 200, maxDailyDose: 400,  unit: 'mg' },
  'metoprolol succinate': { maxSingleDose: 400, maxDailyDose: 400, unit: 'mg' },
  'furosemide':         { maxSingleDose: 200,  maxDailyDose: 600,  unit: 'mg' },
  'hydrochlorothiazide': { maxSingleDose: 50,  maxDailyDose: 50,   unit: 'mg' },
  'gabapentin':         { maxSingleDose: 1200, maxDailyDose: 3600, unit: 'mg' },
  'pregabalin':         { maxSingleDose: 300,  maxDailyDose: 600,  unit: 'mg' },
  'sertraline':         { maxSingleDose: 200,  maxDailyDose: 200,  unit: 'mg' },
  'fluoxetine':         { maxSingleDose: 80,   maxDailyDose: 80,   unit: 'mg' },
  'escitalopram':       { maxSingleDose: 20,   maxDailyDose: 20,   unit: 'mg' },
  'citalopram':         { maxSingleDose: 40,   maxDailyDose: 40,   unit: 'mg' },
  'venlafaxine':        { maxSingleDose: 225,  maxDailyDose: 375,  unit: 'mg' },
  'duloxetine':         { maxSingleDose: 60,   maxDailyDose: 120,  unit: 'mg' },
  'prednisone':         { maxSingleDose: 80,   maxDailyDose: 80,   unit: 'mg' },
  'warfarin':           { maxSingleDose: 15,   maxDailyDose: 15,   unit: 'mg' },
  'oxycodone':          { maxSingleDose: 40,   maxDailyDose: 160,  unit: 'mg' },
  'hydrocodone':        { maxSingleDose: 10,   maxDailyDose: 60,   unit: 'mg' },
  'morphine':           { maxSingleDose: 30,   maxDailyDose: 200,  unit: 'mg' },
  'tramadol':           { maxSingleDose: 100,  maxDailyDose: 400,  unit: 'mg' },
  'alprazolam':         { maxSingleDose: 2,    maxDailyDose: 10,   unit: 'mg' },
  'lorazepam':          { maxSingleDose: 4,    maxDailyDose: 10,   unit: 'mg' },
  'diazepam':           { maxSingleDose: 10,   maxDailyDose: 40,   unit: 'mg' },
  'omeprazole':         { maxSingleDose: 40,   maxDailyDose: 40,   unit: 'mg' },
  'pantoprazole':       { maxSingleDose: 40,   maxDailyDose: 80,   unit: 'mg' },
  'levothyroxine':      { maxSingleDose: 300,  maxDailyDose: 300,  unit: 'mcg' },
  'carvedilol':         { maxSingleDose: 25,   maxDailyDose: 50,   unit: 'mg' },
  'digoxin':            { maxSingleDose: 0.5,  maxDailyDose: 0.5,  unit: 'mg' },
  'amoxicillin':        { maxSingleDose: 1000, maxDailyDose: 3000, unit: 'mg' },
  'ciprofloxacin':      { maxSingleDose: 750,  maxDailyDose: 1500, unit: 'mg' },
  'azithromycin':       { maxSingleDose: 500,  maxDailyDose: 500,  unit: 'mg' },
  'potassium chloride':  { maxSingleDose: 40,  maxDailyDose: 100,  unit: 'mEq' },
};

/**
 * Check if a dose exceeds safety limits.
 * @param {string} drugName
 * @param {number} dose
 * @param {string} unit
 * @returns {{exceeded:boolean, limit:object, type:string}|null}
 */
function checkDoseLimit(drugName, dose, unit) {
  if (!drugName || !dose || isNaN(dose)) return null;
  var key = drugName.toLowerCase();
  var limits = MAX_DOSE_LIMITS[key];
  if (!limits) return null;
  // Only check if units match
  if (unit && unit.toLowerCase() !== limits.unit.toLowerCase()) return null;
  var numDose = parseFloat(dose);
  if (numDose > limits.maxSingleDose) {
    return { exceeded: true, limit: limits, type: 'single' };
  }
  return null;
}

/**
 * Check for duplicate medication orders or active medications.
 * @param {string} drugName
 * @param {string} patientId
 * @returns {Array<{source:string, name:string}>}
 */
function checkDuplicateOrders(drugName, patientId) {
  if (!drugName || !patientId) return [];
  var lower = drugName.toLowerCase();
  var results = [];

  // Check active medications
  var activeMeds = (typeof getPatientMedications === 'function') ? getPatientMedications(patientId) : [];
  activeMeds.forEach(function(m) {
    if (m.status === 'Current' && (m.name || '').toLowerCase() === lower) {
      results.push({ source: 'Active Medication', name: m.name + ' ' + (m.dose || '') + ' ' + (m.unit || '') });
    }
  });

  // Check pending/active orders in last 24 hours
  var orders = (typeof getOrdersByPatient === 'function') ? getOrdersByPatient(patientId) : [];
  var oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  orders.forEach(function(o) {
    if (o.type !== 'Medication') return;
    if (o.status !== 'Pending' && o.status !== 'Active') return;
    var d = o.detail || {};
    if ((d.drug || '').toLowerCase() === lower && o.dateTime > oneDayAgo) {
      results.push({ source: 'Pending Order', name: d.drug + ' ' + (d.dose || '') + ' ' + (d.unit || '') });
    }
  });

  return results;
}

/**
 * Check for duplicate lab/imaging orders.
 */
function checkDuplicateLabImaging(type, studyName, patientId) {
  if (!studyName || !patientId) return [];
  var lower = studyName.toLowerCase();
  var results = [];
  var orders = (typeof getOrdersByPatient === 'function') ? getOrdersByPatient(patientId) : [];
  var timeWindow = type === 'Lab' ? 24 * 60 * 60 * 1000 : 72 * 60 * 60 * 1000;
  var cutoff = new Date(Date.now() - timeWindow).toISOString();

  orders.forEach(function(o) {
    if (o.type !== type) return;
    if (o.status !== 'Pending' && o.status !== 'Active') return;
    if (o.dateTime < cutoff) return;
    var d = o.detail || {};
    var orderName = (d.labTest || d.studyName || d.panel || '').toLowerCase();
    if (orderName === lower) {
      results.push({ source: 'Pending ' + type + ' Order', name: orderName, date: o.dateTime });
    }
  });
  return results;
}

/* ============================================================
   Drug-Drug Interaction Database
   Each entry: [classOrDrug1, classOrDrug2, severity, effect]
   severity: 'major' (hard warning), 'moderate' (soft warning)
   Matching: checks both generic name and drugClass (case-insensitive)
   ============================================================ */
var DRUG_INTERACTIONS = [
  // ── Major — potentially fatal ──
  ['MAOI','SSRI','major','Serotonin syndrome — potentially fatal. Contraindicated combination.'],
  ['MAOI','SNRI','major','Serotonin syndrome — potentially fatal. Contraindicated combination.'],
  ['MAOI','Meperidine','major','Serotonin syndrome and hypertensive crisis. Contraindicated.'],
  ['MAOI','Tramadol','major','Serotonin syndrome risk. Contraindicated.'],
  ['Warfarin','NSAID','major','Increased bleeding risk. GI hemorrhage. Avoid combination if possible.'],
  ['Warfarin','Aspirin','major','Increased bleeding risk. Use only if clearly indicated (e.g., mechanical valve + CAD).'],
  ['Warfarin','Metronidazole','major','Warfarin metabolism inhibited — risk of supratherapeutic INR and bleeding.'],
  ['Warfarin','Fluconazole','major','Fluconazole inhibits CYP2C9 — markedly increased INR and bleeding risk.'],
  ['Warfarin','TMP/SMX','major','Increased INR and bleeding risk. Monitor closely or avoid.'],
  ['Methotrexate','TMP/SMX','major','Pancytopenia and bone marrow suppression. Potentially fatal.'],
  ['Methotrexate','NSAID','major','Decreased methotrexate clearance — increased toxicity risk.'],
  ['Opioid Analgesic','Benzodiazepine','major','FDA Black Box Warning: respiratory depression and death. Avoid combination when possible.'],
  ['Opioid Analgesic','Barbiturate','major','Additive CNS and respiratory depression. Risk of death.'],
  ['Simvastatin','Clarithromycin','major','Rhabdomyolysis risk. CYP3A4 inhibition increases statin levels.'],
  ['Simvastatin','Itraconazole','major','Rhabdomyolysis risk. Contraindicated combination.'],
  ['Simvastatin','Ketoconazole','major','Rhabdomyolysis risk. Contraindicated combination.'],
  ['Lovastatin','Clarithromycin','major','Rhabdomyolysis risk. Contraindicated.'],
  ['Lovastatin','Itraconazole','major','Rhabdomyolysis risk. Contraindicated.'],
  ['Cisapride','Macrolide','major','QT prolongation — torsades de pointes risk.'],
  ['Linezolid','SSRI','major','Serotonin syndrome — linezolid is a weak MAOI.'],
  ['Linezolid','SNRI','major','Serotonin syndrome — linezolid is a weak MAOI.'],
  ['Potassium Chloride','ACE Inhibitor','major','Hyperkalemia risk. Monitor potassium closely.'],
  ['Potassium Chloride','ARB','major','Hyperkalemia risk. Monitor potassium closely.'],
  ['Potassium Chloride','Potassium-Sparing Diuretic','major','Hyperkalemia risk — potentially fatal. Avoid combination.'],
  ['ACE Inhibitor','Potassium-Sparing Diuretic','major','Hyperkalemia risk. Monitor potassium closely.'],
  ['ARB','Potassium-Sparing Diuretic','major','Hyperkalemia risk. Monitor potassium closely.'],
  ['Lithium','NSAID','major','Increased lithium levels — toxicity risk. Monitor lithium levels.'],
  ['Lithium','ACE Inhibitor','major','Increased lithium levels — toxicity risk. Monitor lithium levels.'],
  ['Lithium','Thiazide Diuretic','major','Increased lithium levels — toxicity risk. Monitor lithium levels.'],
  ['Digoxin','Amiodarone','major','Amiodarone increases digoxin levels 70-100%. Reduce digoxin dose by 50%.'],
  ['Digoxin','Verapamil','major','Verapamil increases digoxin levels. Reduce digoxin dose.'],
  ['Clopidogrel','Omeprazole','major','Omeprazole inhibits CYP2C19, reducing clopidogrel activation. Use pantoprazole instead.'],
  ['Clopidogrel','Esomeprazole','major','Esomeprazole inhibits CYP2C19, reducing clopidogrel activation.'],
  ['QTc-Prolonging Agent','QTc-Prolonging Agent','major','Additive QTc prolongation — risk of torsades de pointes.'],

  // ── Moderate — clinically significant ──
  ['SSRI','Triptan','moderate','Theoretical serotonin syndrome risk. Monitor for symptoms.'],
  ['SSRI','NSAID','moderate','Increased bleeding risk (SSRIs impair platelet function).'],
  ['SNRI','NSAID','moderate','Increased bleeding risk.'],
  ['ACE Inhibitor','ARB','moderate','Dual RAAS blockade — hyperkalemia and renal impairment. Generally avoid.'],
  ['Beta Blocker','Calcium Channel Blocker','moderate','Additive bradycardia and hypotension risk. Monitor heart rate.'],
  ['Beta Blocker','Digoxin','moderate','Additive bradycardia. Monitor heart rate.'],
  ['Calcium Channel Blocker','Digoxin','moderate','Increased digoxin levels and additive AV conduction delay.'],
  ['Fluoroquinolone','Corticosteroid','moderate','Increased tendon rupture risk, especially in elderly.'],
  ['Fluoroquinolone','NSAID','moderate','Increased seizure risk.'],
  ['Fluoroquinolone','Antacid','moderate','Reduced fluoroquinolone absorption — separate by 2+ hours.'],
  ['Levothyroxine','Calcium Channel Blocker','moderate','Reduced levothyroxine absorption. Separate dosing.'],
  ['Levothyroxine','Iron Supplement','moderate','Reduced levothyroxine absorption. Separate by 4+ hours.'],
  ['Metformin','Contrast Dye','moderate','Risk of lactic acidosis. Hold metformin 48 hours after contrast.'],
  ['Warfarin','Acetaminophen','moderate','Chronic acetaminophen use may increase INR. Monitor if >2g/day for >3 days.'],
  ['Warfarin','Macrolide','moderate','Increased INR — macrolides inhibit warfarin metabolism.'],
  ['Carbamazepine','Oral Contraceptive','moderate','Carbamazepine induces metabolism of oral contraceptives — reduced efficacy.'],
  ['Phenytoin','Oral Contraceptive','moderate','Phenytoin induces metabolism of oral contraceptives — reduced efficacy.'],
  ['Theophylline','Fluoroquinolone','moderate','Increased theophylline levels — ciprofloxacin is the main offender.'],
  ['Allopurinol','Azathioprine','moderate','Allopurinol inhibits xanthine oxidase — greatly increased azathioprine toxicity. Reduce azathioprine dose 75%.'],
  ['Sulfonylurea','Fluoroquinolone','moderate','Hypoglycemia risk. Monitor blood glucose.'],
  ['Sulfonylurea','Beta Blocker','moderate','Beta-blockers may mask hypoglycemia symptoms.'],
];

// QTc-prolonging drug classes/names for cross-checking
var QTC_PROLONGING_DRUGS = [
  'Ondansetron','Haloperidol','Droperidol','Amiodarone','Sotalol','Dofetilide',
  'Erythromycin','Clarithromycin','Azithromycin','Fluoroquinolone','Ciprofloxacin',
  'Levofloxacin','Moxifloxacin','Methadone','Chlorpromazine','Thioridazine',
  'Ziprasidone','Quetiapine','Citalopram','Escitalopram',
];

/**
 * Check drug-drug interactions for a new medication against a patient's active medications.
 * @param {string} drugName - generic name of the new drug
 * @param {object|null} medEntry - MEDICATION_DB entry if selected from autocomplete
 * @param {string} patientId - patient ID to look up active medications
 * @returns {Array<{drug1:string, drug2:string, severity:string, effect:string}>}
 */
function checkDrugInteractions(drugName, medEntry, patientId) {
  if (!drugName || !patientId) return [];

  var activeMeds = (typeof getPatientMedications === 'function') ? getPatientMedications(patientId) : [];
  // Also check pending/active medication orders for this patient
  var activeOrders = (typeof getOrdersByPatient === 'function') ? getOrdersByPatient(patientId) : [];
  var medOrders = activeOrders.filter(function(o) {
    return o.type === 'Medication' && (o.status === 'Pending' || o.status === 'Active');
  });

  var newDrugName = drugName.toLowerCase();
  var newDrugClass = medEntry ? medEntry.drugClass.toLowerCase() : '';
  var results = [];

  // Build list of existing drugs to check against
  var existingDrugs = [];
  activeMeds.forEach(function(m) {
    existingDrugs.push({ name: (m.name || '').toLowerCase(), drugClass: '' });
    // Try to find the drug class from MEDICATION_DB
    var found = MEDICATION_DB.find(function(db) { return db.generic.toLowerCase() === (m.name || '').toLowerCase(); });
    if (found) existingDrugs[existingDrugs.length - 1].drugClass = found.drugClass.toLowerCase();
  });
  medOrders.forEach(function(o) {
    var d = o.detail || {};
    existingDrugs.push({ name: (d.drug || '').toLowerCase(), drugClass: '' });
    var found = MEDICATION_DB.find(function(db) { return db.generic.toLowerCase() === (d.drug || '').toLowerCase(); });
    if (found) existingDrugs[existingDrugs.length - 1].drugClass = found.drugClass.toLowerCase();
  });

  // Check each interaction rule
  function matchesDrug(ruleKey, name, drugClass) {
    var key = ruleKey.toLowerCase();
    return name.indexOf(key) >= 0 || key.indexOf(name) >= 0 || drugClass === key || drugClass.indexOf(key) >= 0;
  }

  for (var i = 0; i < DRUG_INTERACTIONS.length; i++) {
    var rule = DRUG_INTERACTIONS[i];
    var key1 = rule[0], key2 = rule[1], severity = rule[2], effect = rule[3];

    // Check if new drug matches one side and any existing drug matches the other
    var newMatchesSide1 = matchesDrug(key1, newDrugName, newDrugClass);
    var newMatchesSide2 = matchesDrug(key2, newDrugName, newDrugClass);

    for (var j = 0; j < existingDrugs.length; j++) {
      var existing = existingDrugs[j];
      if (newMatchesSide1 && matchesDrug(key2, existing.name, existing.drugClass)) {
        results.push({ drug1: drugName, drug2: existing.name, severity: severity, effect: effect });
      } else if (newMatchesSide2 && matchesDrug(key1, existing.name, existing.drugClass)) {
        results.push({ drug1: drugName, drug2: existing.name, severity: severity, effect: effect });
      }
    }
  }

  // QTc prolongation cross-check
  var newIsQTc = QTC_PROLONGING_DRUGS.some(function(d) {
    return newDrugName.indexOf(d.toLowerCase()) >= 0 || newDrugClass.indexOf(d.toLowerCase()) >= 0;
  });
  if (newIsQTc) {
    existingDrugs.forEach(function(existing) {
      var existingIsQTc = QTC_PROLONGING_DRUGS.some(function(d) {
        return existing.name.indexOf(d.toLowerCase()) >= 0 || existing.drugClass.indexOf(d.toLowerCase()) >= 0;
      });
      if (existingIsQTc) {
        // Check not already caught by general DDI rules
        var already = results.some(function(r) { return r.drug2 === existing.name && r.effect.indexOf('QTc') >= 0; });
        if (!already) {
          results.push({ drug1: drugName, drug2: existing.name, severity: 'major', effect: 'Both drugs prolong QTc interval — additive risk of torsades de pointes.' });
        }
      }
    });
  }

  // Deduplicate
  var seen = {};
  return results.filter(function(r) {
    var key = r.drug1 + '|' + r.drug2 + '|' + r.effect;
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

/**
 * Search medications by generic or brand name.
 * Prefix matches sort first, then substring matches. Limit 10 results.
 */
function searchMedications(query) {
  if (!query || query.length < 2) return [];
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);

  const scored = [];
  for (const med of MEDICATION_DB) {
    const gLower = med.generic.toLowerCase();
    const bLower = med.brands.map(b => b.toLowerCase());
    const searchText = gLower + ' ' + bLower.join(' ');

    // All words must be present
    if (!words.every(w => searchText.includes(w))) continue;

    let score = 0;
    const q = words[0];
    if (gLower.startsWith(q)) score = 3;
    else if (bLower.some(b => b.startsWith(q))) score = 2;
    else if (gLower.includes(q)) score = 1;
    else score = 1;

    scored.push({ med, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 10).map(s => s.med);
}

/**
 * Search pharmacies by 3-digit zip prefix + optional name query.
 */
function searchPharmacies(zip, query) {
  let results = PHARMACY_DB;

  if (zip && zip.length >= 3) {
    const prefix = zip.slice(0, 3);
    results = results.filter(p => p.zip.startsWith(prefix));
  }

  if (query && query.trim().length > 0) {
    const q = query.toLowerCase();
    results = results.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.chain.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q)
    );
  }

  return results;
}

/* ============================================================
   Autocomplete Engine
   ============================================================ */

/**
 * Attach medication autocomplete to an input element.
 * @param {HTMLInputElement} inputEl
 * @param {{ onSelect: function, patientId?: string }} opts
 */
function attachMedAutocomplete(inputEl, opts) {
  const onSelect = opts.onSelect || (() => {});

  // Create dropdown
  const dropdown = document.createElement('div');
  dropdown.className = 'med-autocomplete-dropdown';
  dropdown.hidden = true;

  // Wrap input if not already wrapped
  let container = inputEl.parentElement;
  if (!container.classList.contains('med-autocomplete-container')) {
    container = document.createElement('div');
    container.className = 'med-autocomplete-container';
    inputEl.parentNode.insertBefore(container, inputEl);
    container.appendChild(inputEl);
  }
  container.appendChild(dropdown);

  let highlighted = -1;
  let currentResults = [];
  let debounceTimer = null;

  function renderDropdown(results) {
    currentResults = results;
    highlighted = -1;
    dropdown.innerHTML = '';

    if (results.length === 0) {
      dropdown.hidden = true;
      return;
    }

    results.forEach((med, i) => {
      const item = document.createElement('div');
      item.className = 'med-autocomplete-item';
      item.dataset.index = i;

      const brandStr = med.brands.length > 0 ? ' (' + med.brands.join(', ') + ')' : '';
      item.innerHTML =
        '<span class="med-autocomplete-drug">' + esc(med.generic) + '</span>' +
        '<span class="med-autocomplete-brand">' + esc(brandStr) + '</span>' +
        ' <span class="med-autocomplete-class">' + esc(med.drugClass) + '</span>';

      item.addEventListener('mousedown', e => {
        e.preventDefault();
        selectItem(i);
      });

      item.addEventListener('mouseenter', () => {
        setHighlight(i);
      });

      dropdown.appendChild(item);
    });

    dropdown.hidden = false;
  }

  function setHighlight(idx) {
    const items = dropdown.querySelectorAll('.med-autocomplete-item');
    items.forEach((el, i) => {
      el.classList.toggle('highlighted', i === idx);
    });
    highlighted = idx;
    // Scroll highlighted into view
    if (items[idx]) items[idx].scrollIntoView({ block: 'nearest' });
  }

  function selectItem(idx) {
    const med = currentResults[idx];
    if (!med) return;

    const defaultForm = med.doseForms[med.defaultDoseIndex] || med.doseForms[0];
    inputEl.value = med.generic;
    dropdown.hidden = true;
    currentResults = [];
    onSelect(med, defaultForm);
  }

  // Debounced input handler
  inputEl.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const q = inputEl.value.trim();
      if (q.length < 2) {
        dropdown.hidden = true;
        currentResults = [];
        return;
      }
      const results = searchMedications(q);
      renderDropdown(results);
    }, 150);
  });

  // Keyboard navigation
  inputEl.addEventListener('keydown', e => {
    if (dropdown.hidden || currentResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight(Math.min(highlighted + 1, currentResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight(Math.max(highlighted - 1, 0));
    } else if (e.key === 'Enter') {
      if (highlighted >= 0) {
        e.preventDefault();
        selectItem(highlighted);
      }
    } else if (e.key === 'Escape') {
      dropdown.hidden = true;
      currentResults = [];
    }
  });

  // Close on blur
  inputEl.addEventListener('blur', () => {
    setTimeout(() => { dropdown.hidden = true; }, 200);
  });

  // Re-open on focus if input has content
  inputEl.addEventListener('focus', () => {
    const q = inputEl.value.trim();
    if (q.length >= 2 && currentResults.length > 0) {
      dropdown.hidden = false;
    }
  });

  return { dropdown, destroy: () => { clearTimeout(debounceTimer); dropdown.remove(); } };
}

/* ============================================================
   Pharmacy Lookup UI
   ============================================================ */

/**
 * Render pharmacy lookup UI into a container.
 * @param {HTMLElement} containerEl
 * @param {{ zip: string, onSelect: function }} opts
 */
function renderPharmacyLookup(containerEl, opts) {
  const zip = opts.zip || '';
  const onSelect = opts.onSelect || (() => {});

  containerEl.innerHTML = `
    <div class="pharmacy-lookup">
      <div class="form-row" style="margin-bottom:8px">
        <div class="form-group" style="flex:0 0 120px">
          <label class="form-label" style="font-size:11px">ZIP Code</label>
          <input class="form-control" id="pharm-zip" value="${esc(zip)}" placeholder="e.g. 62704" maxlength="10" style="font-size:13px" />
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label" style="font-size:11px">Search</label>
          <input class="form-control" id="pharm-query" placeholder="Pharmacy name or address…" style="font-size:13px" />
        </div>
        <div class="form-group" style="flex:0 0 auto;display:flex;align-items:flex-end">
          <button class="btn btn-secondary" id="pharm-search-btn" style="font-size:12px;padding:6px 14px">Search</button>
        </div>
      </div>
      <div id="pharm-results"></div>
    </div>
  `;

  const zipInput = containerEl.querySelector('#pharm-zip');
  const queryInput = containerEl.querySelector('#pharm-query');
  const searchBtn = containerEl.querySelector('#pharm-search-btn');
  const resultsDiv = containerEl.querySelector('#pharm-results');

  function doSearch() {
    const z = zipInput.value.trim();
    const q = queryInput.value.trim();
    const results = searchPharmacies(z, q);
    renderResults(results);
  }

  function renderResults(results) {
    if (results.length === 0) {
      resultsDiv.innerHTML = '<div style="padding:12px;color:var(--text-muted);font-size:12px;text-align:center">No pharmacies found. Try a different ZIP code or search term.</div>';
      return;
    }

    resultsDiv.innerHTML = results.map(p => `
      <div class="pharmacy-item" data-name="${esc(p.name)}" data-phone="${esc(p.phone)}" data-fax="${esc(p.fax)}">
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:13px;color:var(--text-primary)">${esc(p.name)}</div>
          <div style="font-size:12px;color:var(--text-secondary)">${esc(p.address)}, ${esc(p.city)}, ${esc(p.state)} ${esc(p.zip)}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${esc(p.phone)} · ${p.is24hr ? '<strong>24 Hours</strong>' : esc(p.hours)}</div>
        </div>
        <button class="btn btn-secondary pharm-select-btn" style="font-size:11px;padding:4px 12px;align-self:center">Select</button>
      </div>
    `).join('');

    resultsDiv.querySelectorAll('.pharm-select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.pharmacy-item');
        onSelect({
          name: item.dataset.name,
          phone: item.dataset.phone,
          fax: item.dataset.fax,
        });
      });
    });
  }

  searchBtn.addEventListener('click', doSearch);
  queryInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
  zipInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

  // Initial search
  if (zip) doSearch();

  return { doSearch };
}

/* Helper: escape HTML (reuse global esc if available, else define) */
if (typeof esc === 'undefined') {
  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }
}
