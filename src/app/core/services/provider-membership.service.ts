import { computed, inject, Injectable, signal } from '@angular/core';

import { ProviderMemberRole, ProviderMembership } from '../models/provider-team.model';
import { ProviderTeamApiService } from './provider-team-api.service';

/**
 * The signed-in person's place at their facility: owner, or a staff member
 * with a role. Loaded once per provider session; before it loads (or if it
 * fails) everyone is treated as the owner so nothing disappears.
 */
@Injectable({ providedIn: 'root' })
export class ProviderMembershipService {
  private readonly api = inject(ProviderTeamApiService);
  readonly membership = signal<ProviderMembership | null>(null);

  readonly role = computed<ProviderMemberRole | null>(() => this.membership()?.role ?? null);
  readonly isStaff = computed(() => this.membership()?.isOwner === false);
  readonly canSendRequests = computed(() => this.membership()?.canSendRequests ?? true);
  readonly awaitingApproval = computed(() => this.membership()?.awaitingApproval === true);
  readonly canManageTeam = computed(() => this.membership()?.canManageTeam ?? true);
  /** Payments and payouts belong to the facility owner. */
  readonly seesMoney = computed(() => !this.isStaff());
  /** Consultations, appointments and patient requests: everyone except pharmacy and lab staff. */
  readonly seesCareWork = computed(() => this.role() !== 'PHARMACIST' && this.role() !== 'LAB_SCIENTIST');
  /** Staff who work the pharmacy or lab queue, even inside a hospital. */
  readonly worksOrders = computed(() => this.role() === 'PHARMACIST' || this.role() === 'LAB_SCIENTIST');

  load(): void {
    this.api.me().subscribe({ next: (value) => this.membership.set(value), error: () => this.membership.set(null) });
  }

  set(value: ProviderMembership | null): void {
    this.membership.set(value);
  }
}
