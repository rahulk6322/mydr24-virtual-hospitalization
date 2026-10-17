/**
 * Demo formulary & order catalogue. Flags drive CPOE safety checks.
 * Real deployments must use a validated drug-knowledge base for allergy/interaction checks.
 */
export interface DrugItem {
  id: string;
  name: string;
  defaultDose: string;
  route: string;
  frequency: string;
  /** lowercase tags matched against patient allergy text */
  allergyTags: string[];
  highAlert?: boolean;
  /** cannot be delivered safely at home -> requires hospital admission (spec Annex C D-18) */
  homeIneligible?: boolean;
}

export const FORMULARY: DrugItem[] = [
  { id: 'd1', name: 'Paracetamol', defaultDose: '500 mg', route: 'PO', frequency: '1-1-1', allergyTags: [] },
  { id: 'd2', name: 'Ceftriaxone', defaultDose: '1 g', route: 'IV', frequency: '1-0-1', allergyTags: ['cephalosporin'] },
  { id: 'd3', name: 'Amoxicillin-clavulanate', defaultDose: '625 mg', route: 'PO', frequency: '1-0-1', allergyTags: ['penicillin', 'amoxicillin'] },
  { id: 'd4', name: 'Co-trimoxazole', defaultDose: '960 mg', route: 'PO', frequency: '1-0-1', allergyTags: ['sulfonamide', 'sulfa'] },
  { id: 'd5', name: 'Diclofenac', defaultDose: '50 mg', route: 'PO', frequency: '1-0-1', allergyTags: ['diclofenac', 'nsaid'] },
  { id: 'd6', name: 'Pantoprazole', defaultDose: '40 mg', route: 'IV', frequency: '1-0-0', allergyTags: [] },
  { id: 'd7', name: 'Ondansetron', defaultDose: '4 mg', route: 'IV', frequency: 'SOS', allergyTags: [] },
  { id: 'd8', name: 'Furosemide', defaultDose: '40 mg', route: 'IV', frequency: '1-0-0', allergyTags: ['sulfonamide'] },
  { id: 'd9', name: 'Enoxaparin (prophylaxis)', defaultDose: '40 mg', route: 'SC', frequency: '1-0-0', allergyTags: ['heparin'], highAlert: true },
  { id: 'd10', name: 'Insulin (sliding scale, SC)', defaultDose: 'per scale', route: 'SC', frequency: 'AC meals', allergyTags: [], highAlert: true },
  { id: 'd11', name: 'Morphine', defaultDose: '2 mg', route: 'IV', frequency: 'SOS', allergyTags: ['morphine', 'opioid'], highAlert: true },
  { id: 'd12', name: 'Noradrenaline infusion', defaultDose: 'titrate', route: 'IV infusion', frequency: 'continuous', allergyTags: [], highAlert: true, homeIneligible: true },
  { id: 'd13', name: 'Heparin infusion', defaultDose: 'per protocol', route: 'IV infusion', frequency: 'continuous', allergyTags: ['heparin'], highAlert: true, homeIneligible: true },
  { id: 'd14', name: 'Insulin infusion', defaultDose: 'per protocol', route: 'IV infusion', frequency: 'continuous', allergyTags: [], highAlert: true, homeIneligible: true },
  { id: 'd15', name: 'Packed red cells', defaultDose: '1 unit', route: 'IV', frequency: 'once', allergyTags: [], homeIneligible: true },
  { id: 'd16', name: 'Salbutamol nebulisation', defaultDose: '2.5 mg', route: 'Neb', frequency: 'Q6H', allergyTags: [] },
  { id: 'd17', name: 'Normal saline', defaultDose: '500 mL', route: 'IV', frequency: 'once', allergyTags: [] },
  { id: 'd18', name: 'Amlodipine', defaultDose: '5 mg', route: 'PO', frequency: '1-0-0', allergyTags: [] },
];

export const LABS = ['CBC', 'CRP', 'Procalcitonin', 'LFT', 'KFT / electrolytes', 'Blood culture', 'Urine culture', 'ABG / VBG (POC)', 'Lactate (POC)', 'HbA1c', 'Lipid profile', 'NT-proBNP'];
export const IMAGING = ['Chest X-ray (portable)', 'ECG 12-lead', 'POCUS – lung', 'POCUS – cardiac', 'Ultrasound abdomen (centre)', 'CT (requires transfer)'];
export const NURSING = ['Urgent field-nurse visit', 'Twice-daily nursing visits', 'Wound review', 'Fluid balance chart', 'Physiotherapy visit', 'Dietitian review'];

export function allergyConflict(drug: DrugItem, allergies: string[]): string | undefined {
  const a = allergies.join(' ').toLowerCase();
  return drug.allergyTags.find((t) => a.includes(t.replace(/s$/, '')) || a.includes(t));
}
