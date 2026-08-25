export interface ProviderDashboardSummary {
  readonly offers: { readonly new: number };
  readonly appointments: { readonly today: number; readonly upcoming: number };
  readonly healthChecks: { readonly inProgress: number; readonly completed: number };
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
}
