import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { GuidedSelfCheckGovernanceApiService } from './guided-self-check-governance-api.service';
describe('GuidedSelfCheckGovernanceApiService', () => {
  let api: GuidedSelfCheckGovernanceApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: '/api/v1' } },
      ],
    });
    api = TestBed.inject(GuidedSelfCheckGovernanceApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('uses exact authorization contracts without Provider identity', () => {
    api.authorizations({ status: 'AUTHORIZED', page: 2, limit: 20 }).subscribe();
    let r = http.expectOne(
      (x) => x.url === '/api/v1/admin/guided-self-check-clinical-governance-authorizations',
    );
    expect(r.request.params.get('status')).toBe('AUTHORIZED');
    r.flush({ items: [], total: 0, page: 2, limit: 20 });
    api.authorize('clinician@smartclinic.example', 'Governance duty').subscribe();
    r = http.expectOne(
      '/api/v1/admin/guided-self-check-clinical-governance-authorizations/authorize',
    );
    expect(r.request.body).toEqual({
      userEmail: 'clinician@smartclinic.example',
      reason: 'Governance duty',
    });
    expect(r.request.body.providerReference).toBeUndefined();
    r.flush({});
    api.disableAuthorization('SC-GCGA-1', 'Role changed').subscribe();
    r = http.expectOne(
      '/api/v1/admin/guided-self-check-clinical-governance-authorizations/SC-GCGA-1/disable',
    );
    expect(r.request.body).toEqual({ reason: 'Role changed' });
    r.flush({});
  });
  it('uses exact list, metadata, questionnaire and detail routes', () => {
    api
      .rulesets({ status: 'DRAFT', questionnaireVersion: 1, isActive: false, page: 1, limit: 20 })
      .subscribe();
    let r = http.expectOne((x) => x.url === '/api/v1/admin/guided-self-check-rulesets');
    expect(r.request.params.get('questionnaireVersion')).toBe('1');
    expect(r.request.params.get('isActive')).toBe('false');
    r.flush({ items: [], total: 0, page: 1, limit: 20 });
    api.metadata().subscribe();
    http.expectOne('/api/v1/admin/guided-self-check-rulesets/metadata').flush({});
    api.questionnaire(3).subscribe();
    http.expectOne('/api/v1/admin/guided-self-check-rulesets/questionnaires/3').flush({});
    api.ruleset('SC-GCRS/1').subscribe();
    http.expectOne('/api/v1/admin/guided-self-check-rulesets/SC-GCRS%2F1').flush({});
  });
  it('serializes Draft create and hash-preconditioned patch without lifecycle fields', () => {
    const keys = { green: 'G', amber: 'A', red: 'R' };
    api
      .create({ questionnaireVersion: 1, name: 'Rules', rules: [], patientMessageKeys: keys })
      .subscribe();
    let r = http.expectOne('/api/v1/admin/guided-self-check-rulesets');
    expect(r.request.body).toEqual({
      questionnaireVersion: 1,
      name: 'Rules',
      rules: [],
      patientMessageKeys: keys,
    });
    expect(r.request.body.isActive).toBeUndefined();
    expect(r.request.body.governanceStatus).toBeUndefined();
    r.flush({});
    api.update('SC-GCRS-1', { expectedContentHash: 'a'.repeat(64), rules: [] }).subscribe();
    r = http.expectOne('/api/v1/admin/guided-self-check-rulesets/SC-GCRS-1');
    expect(r.request.method).toBe('PATCH');
    expect(r.request.body.expectedContentHash).toBe('a'.repeat(64));
    r.flush({});
  });
  it('uses exact validation, simulation and lifecycle endpoints', () => {
    api.validate('SC-GCRS-1').subscribe();
    http.expectOne('/api/v1/admin/guided-self-check-rulesets/SC-GCRS-1/validate').flush({});
    api.simulate('SC-GCRS-1', [{ questionKey: 'q', state: 'KNOWN', value: true }]).subscribe();
    let r = http.expectOne('/api/v1/admin/guided-self-check-rulesets/SC-GCRS-1/simulate');
    expect(r.request.body).toEqual({
      answers: [{ questionKey: 'q', state: 'KNOWN', value: true }],
    });
    r.flush({});
    for (const action of [
      'submit-review',
      'approve',
      'mark-ready',
      'activate',
      'retire',
    ] as const) {
      api.transition('SC-GCRS-1', action, ' Governance note ').subscribe();
      r = http.expectOne(`/api/v1/admin/guided-self-check-rulesets/SC-GCRS-1/${action}`);
      expect(r.request.body).toEqual({ note: 'Governance note' });
      r.flush({});
    }
  });
});
