export interface ProviderDashboardSummary {
  readonly offers: { readonly new: number };
  readonly appointments: { readonly today: number; readonly upcoming: number };
  readonly healthChecks: { readonly inProgress: number; readonly completed: number };
  readonly referrals: { readonly availablePoints: number; readonly currentLevel: { readonly code: string; readonly name: string } | null; readonly nextLevel: { readonly code: string; readonly name: string } | null; readonly qualifiedPatients: number; readonly qualifiedClinics: number; readonly qualifiedLaboratories: number; readonly qualifiedPharmacies: number };
}

export interface AdminDashboardSummary {
  readonly bookings: {
    readonly awaitingFunding: number;
    readonly pendingProviderMatch: number;
    readonly scheduled: number;
    readonly inProgress: number;
    readonly completed: number;
    readonly needsAttention: number;
  };
  readonly matching: { readonly activeOffers: number };
  readonly providers: { readonly pendingReview: number; readonly active: number };
  readonly referrals: { readonly registered: number; readonly qualified: number; readonly level1Achieved: number; readonly pointsIssued: number };
}
