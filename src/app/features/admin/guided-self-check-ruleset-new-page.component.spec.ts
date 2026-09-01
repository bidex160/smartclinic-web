import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { GuidedSelfCheckGovernanceApiService } from '../../core/services/guided-self-check-governance-api.service';
import { GuidedSelfCheckRulesetNewPageComponent } from './guided-self-check-ruleset-new-page.component';

describe('GuidedSelfCheckRulesetNewPageComponent', () => {
  it('navigates to the registered ruleset-detail route after draft creation', () => {
    const api = {
      metadata: () =>
        of({
          questionnaireVersions: [{ version: 1, schemaVersion: 1, isActive: true }],
          patientMessages: [
            { key: 'SELF_CHECK_GREEN_COMPLETE', title: 'Green', message: 'Green' },
            { key: 'SELF_CHECK_AMBER_REVIEW', title: 'Amber', message: 'Amber' },
            { key: 'SELF_CHECK_RED_URGENT', title: 'Red', message: 'Red' },
          ],
          validationLimits: {
            rulesetNameMaxLength: 140,
            rulesetDescriptionMaxLength: 2000,
          },
        }),
      create: () => of({ reference: 'SC-GCRS-TEST' }),
    };
    TestBed.configureTestingModule({
      imports: [GuidedSelfCheckRulesetNewPageComponent],
      providers: [
        provideRouter([]),
        { provide: GuidedSelfCheckGovernanceApiService, useValue: api },
      ],
    });
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const component = TestBed.createComponent(GuidedSelfCheckRulesetNewPageComponent).componentInstance;
    component.name = 'TEST ONLY - Guided Self-Check E2E';
    component.create();
    expect(navigate).toHaveBeenCalledWith([
      '/admin/guided-self-check/governance',
      'SC-GCRS-TEST',
    ]);
  });
});
