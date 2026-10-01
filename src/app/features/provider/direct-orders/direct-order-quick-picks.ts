/**
 * Common choices to speed up entry. They are suggestions only: clinicians can
 * type anything, and pharmacies and labs confirm what they can provide.
 */
export const COMMON_LAB_TESTS = [
  'Full blood count (FBC)',
  'Malaria parasite (MP)',
  'Widal test',
  'Fasting blood sugar (FBS)',
  'HbA1c',
  'Lipid profile',
  'Liver function test (LFT)',
  'Electrolytes, urea & creatinine (E/U/Cr)',
  'Urinalysis',
  'Urine microscopy, culture & sensitivity',
  'Stool microscopy, culture & sensitivity',
  'Haemoglobin genotype',
  'Blood group',
  'HIV 1 & 2 screening',
  'Hepatitis B surface antigen (HBsAg)',
  'Hepatitis C antibody',
  'Pregnancy test (hCG)',
  'Prostate-specific antigen (PSA)',
  'Thyroid function test (TFT)',
  'H. pylori',
] as const;

export const COMMON_IMAGING = [
  'Chest X-ray',
  'Abdominal ultrasound',
  'Pelvic ultrasound',
  'Obstetric ultrasound',
  'Breast ultrasound',
  'Thyroid ultrasound',
  'Echocardiogram',
  'Mammogram',
  'CT scan — head',
  'MRI — lumbar spine',
] as const;

export const COMMON_MEDICINES = [
  'Artemether/Lumefantrine',
  'Paracetamol',
  'Ibuprofen',
  'Amoxicillin',
  'Amoxicillin/Clavulanic acid',
  'Azithromycin',
  'Cefuroxime',
  'Ciprofloxacin',
  'Metronidazole',
  'Omeprazole',
  'Loratadine',
  'Salbutamol inhaler',
  'Oral rehydration salts (ORS)',
  'Zinc sulphate',
  'Folic acid',
  'Ferrous sulphate',
  'Vitamin C',
  'Amlodipine',
  'Lisinopril',
  'Losartan',
  'Metformin',
  'Glibenclamide',
] as const;

export const COMMON_FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'At night', 'When needed'] as const;
export const COMMON_DURATIONS = ['3 days', '5 days', '7 days', '14 days', '1 month', '3 months'] as const;

/** Accepts "scp-abcd-1234", "ABCD1234" or "SCP ABCD 1234" and returns SCP-ABCD-1234, or null. */
export function normaliseSmartClinicId(value: string): string | null {
  let compact = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (compact.startsWith('SCP')) compact = compact.slice(3);
  return /^[A-Z0-9]{8}$/.test(compact) ? `SCP-${compact.slice(0, 4)}-${compact.slice(4)}` : null;
}
