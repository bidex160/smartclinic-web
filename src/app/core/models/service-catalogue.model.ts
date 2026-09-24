export type SmartClinicCatalogueCategory = 'LAB_TEST' | 'MEDICATION';
export interface SmartClinicServiceCatalogueItem {
  readonly code: string;
  readonly category: SmartClinicCatalogueCategory;
  readonly name: string;
  readonly description: string | null;
  readonly unitLabel: string | null;
  readonly averageCostMinor: number;
  readonly markupBps: number;
  readonly standardPriceMinor: number;
  readonly currency: string;
  readonly requiresPrescription: boolean;
  readonly patientVisible: boolean;
  readonly isActive: boolean;
  readonly sortOrder: number;
}
