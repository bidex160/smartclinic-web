export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];
export const GENOTYPES = ['AA', 'AS', 'AC', 'SS', 'SC', 'CC'] as const;
export type Genotype = (typeof GENOTYPES)[number];

/** Patient-reported basics shown on the patient's own SmartClinic card. Not clinically verified. */
export interface PatientHealthBasics {
  readonly bloodGroup: BloodGroup | null;
  readonly genotype: Genotype | null;
  readonly allergies: string | null;
  readonly conditions: string | null;
  readonly emergencyContactName: string | null;
  readonly emergencyContactPhone: string | null;
  readonly emergencyContactRelationship: string | null;
  readonly source: 'SELF_REPORTED';
  readonly updatedAt: string | null;
}

export type UpdatePatientHealthBasicsRequest = Partial<Omit<PatientHealthBasics, 'source' | 'updatedAt'>>;
