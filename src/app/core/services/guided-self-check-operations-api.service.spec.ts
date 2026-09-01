import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { GuidedSelfCheckOperationsApiService } from './guided-self-check-operations-api.service';
describe('GuidedSelfCheckOperationsApiService', () => {
  let api: GuidedSelfCheckOperationsApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: '/api/v1' } },
      ],
    });
    api = TestBed.inject(GuidedSelfCheckOperationsApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('uses exact professional directory and Admin mutation contracts', () => {
    api
      .professionals({
        status: 'ACTIVE',
        capability: 'URGENT_SELF_CHECK_REVIEW',
        search: 'Ada',
        page: 2,
      })
      .subscribe();
    let r = http.expectOne(
      (x) => x.url === '/api/v1/admin/guided-self-check-clinical-professionals',
    );
    expect(r.request.params.get('search')).toBe('Ada');
    r.flush({ items: [], total: 0, page: 2, limit: 25 });
    api
      .authorize({
        userEmail: 'clinician@smartclinic.example',
        displayName: 'Dr Ada',
        professionalType: 'DOCTOR',
        capabilities: ['URGENT_SELF_CHECK_REVIEW'],
      })
      .subscribe();
    r = http.expectOne('/api/v1/admin/guided-self-check-clinical-professionals/authorize');
    expect(r.request.body.userEmail).toBe('clinician@smartclinic.example');
    expect(JSON.stringify(r.request.body)).not.toContain('provider');
    r.flush({});
    api.capability('SC-ICP-1', 'SELF_CHECK_CLINICAL_REVIEW', true).subscribe();
    r = http.expectOne(
      '/api/v1/admin/guided-self-check-clinical-professionals/SC-ICP-1/capabilities/grant',
    );
    expect(r.request.body).toEqual({ capability: 'SELF_CHECK_CLINICAL_REVIEW' });
    r.flush({});
    api.disableProfessional('SC-ICP-1').subscribe();
    http
      .expectOne('/api/v1/admin/guided-self-check-clinical-professionals/SC-ICP-1/disable')
      .flush({});
  });
  it('uses professionalReference for RED assignment and exact lifecycle routes', () => {
    api.reviews({ priority: 'URGENT', assigned: false, page: 1 }).subscribe();
    let r = http.expectOne((x) => x.url === '/api/v1/admin/guided-self-check-reviews');
    expect(r.request.params.get('assigned')).toBe('false');
    r.flush({ items: [], total: 0, page: 1, limit: 20 });
    api.acknowledge('SC-GSCR-1').subscribe();
    http.expectOne('/api/v1/admin/guided-self-check-reviews/SC-GSCR-1/acknowledge').flush({});
    api.escalate('SC-GSCR-1', 'Operations note').subscribe();
    r = http.expectOne('/api/v1/admin/guided-self-check-reviews/SC-GSCR-1/escalate');
    expect(r.request.body).toEqual({ note: 'Operations note' });
    r.flush({});
    api.assign('SC-GSCR-1', 'SC-ICP-1').subscribe();
    r = http.expectOne('/api/v1/admin/guided-self-check-reviews/SC-GSCR-1/assign');
    expect(r.request.body).toEqual({ professionalReference: 'SC-ICP-1' });
    expect(JSON.stringify(r.request.body)).not.toContain('provider');
    r.flush({});
  });
  it('serializes the explicit INTERNAL_ROUTINE AMBER review contract', () => {
    api
      .reviews({
        reviewModel: 'INTERNAL_ROUTINE',
        classification: 'AMBER',
        priority: 'ROUTINE',
        status: 'PENDING',
        assigned: false,
        page: 2,
        limit: 20,
      })
      .subscribe();
    const r = http.expectOne((x) => x.url === '/api/v1/admin/guided-self-check-reviews');
    expect(r.request.params.get('reviewModel')).toBe('INTERNAL_ROUTINE');
    expect(r.request.params.get('classification')).toBe('AMBER');
    expect(r.request.params.get('priority')).toBe('ROUTINE');
    expect(r.request.params.get('status')).toBe('PENDING');
    expect(r.request.params.get('assigned')).toBe('false');
    r.flush({ items: [], total: 0, page: 2, limit: 20 });
  });
  it('uses internal detail/start/complete and preserves separate guidance and note', () => {
    api.listMyReviews({ status: 'IN_REVIEW', priority: 'URGENT', page: 2, limit: 20 }).subscribe();
    let list = http.expectOne((r) => r.url === '/api/v1/internal/guided-self-check-reviews');
    expect(list.request.params.get('status')).toBe('IN_REVIEW');
    expect(list.request.params.get('priority')).toBe('URGENT');
    expect(list.request.params.get('page')).toBe('2');
    expect(list.request.params.get('limit')).toBe('20');
    expect(list.request.params.has('professionalReference')).toBe(false);
    expect(list.request.params.has('userId')).toBe(false);
    expect(list.request.params.has('email')).toBe(false);
    list.flush({ items: [], total: 0, page: 2, limit: 20 });
    api.internalReview('SC-GSCR/1').subscribe();
    http.expectOne('/api/v1/internal/guided-self-check-reviews/SC-GSCR%2F1').flush({});
    api.startReview('SC-GSCR-1').subscribe();
    http.expectOne('/api/v1/internal/guided-self-check-reviews/SC-GSCR-1/start').flush({});
    api
      .completeReview('SC-GSCR-1', {
        decision: 'FOLLOW_UP_RECOMMENDED',
        nextActionType: 'FIND_CARE',
        patientGuidance: 'Patient safe',
        internalClinicalNote: 'Internal only',
      })
      .subscribe();
    const r = http.expectOne('/api/v1/internal/guided-self-check-reviews/SC-GSCR-1/complete');
    expect(r.request.body).toEqual({
      decision: 'FOLLOW_UP_RECOMMENDED',
      nextActionType: 'FIND_CARE',
      patientGuidance: 'Patient safe',
      internalClinicalNote: 'Internal only',
    });
    r.flush({});
  });
  it('maps analysis and bounded classification processing endpoints', () => {
    api.analyses('FAILED', 2, 10).subscribe();
    let r = http.expectOne((x) => x.url === '/api/v1/admin/guided-self-check-analyses');
    expect(r.request.params.get('status')).toBe('FAILED');
    r.flush({ items: [], total: 0, page: 2, limit: 10 });
    api.processAnalysis('SC-GSCA-1').subscribe();
    http.expectOne('/api/v1/admin/guided-self-check-analyses/SC-GSCA-1/process').flush({});
    api.processing({ status: 'FAILED', questionnaireVersion: 3, page: 1, limit: 20 }).subscribe();
    r = http.expectOne(
      (x) => x.url === '/api/v1/admin/guided-self-check-classification-processing',
    );
    expect(r.request.params.get('questionnaireVersion')).toBe('3');
    r.flush({ items: [], total: 0, page: 1, limit: 20 });
    api.reprocess('SC-GSC-1').subscribe();
    http
      .expectOne('/api/v1/admin/guided-self-check-classification-processing/SC-GSC-1/reprocess')
      .flush({});
    api.batch(3, 25).subscribe();
    r = http.expectOne('/api/v1/admin/guided-self-check-classification-processing/batch/reprocess');
    expect(r.request.body).toEqual({ questionnaireVersion: 3, limit: 25 });
    r.flush({});
  });
  it('uses exact Professional Contact routes, filters, and constrained mutation bodies', () => {
    api
      .contactWorkItems({ status: 'IN_PROGRESS', priority: 'ROUTINE', page: 2, limit: 10 })
      .subscribe();
    let r = http.expectOne((x) => x.url === '/api/v1/admin/guided-self-check-contact-work-items');
    expect(r.request.params.get('status')).toBe('IN_PROGRESS');
    expect(r.request.params.get('priority')).toBe('ROUTINE');
    expect(r.request.params.get('page')).toBe('2');
    expect(r.request.params.get('limit')).toBe('10');
    expect(r.request.params.has('providerReference')).toBe(false);
    r.flush({ items: [], total: 0, page: 2, limit: 10 });

    api.contactWorkItem('SC-GSCW/1').subscribe();
    http.expectOne('/api/v1/admin/guided-self-check-contact-work-items/SC-GSCW%2F1').flush({});
    api.acknowledgeContact('SC-GSCW-1').subscribe();
    http
      .expectOne('/api/v1/admin/guided-self-check-contact-work-items/SC-GSCW-1/acknowledge')
      .flush({});
    api.startContact('SC-GSCW-1').subscribe();
    http.expectOne('/api/v1/admin/guided-self-check-contact-work-items/SC-GSCW-1/start').flush({});
    api.completeContact('SC-GSCW-1', 'UNREACHABLE', '  No answer after attempt  ').subscribe();
    r = http.expectOne('/api/v1/admin/guided-self-check-contact-work-items/SC-GSCW-1/complete');
    expect(r.request.body).toEqual({ outcome: 'UNREACHABLE', note: 'No answer after attempt' });
    r.flush({});
    api.cancelContact('SC-GSCW-1', '  Action changed  ').subscribe();
    r = http.expectOne('/api/v1/admin/guided-self-check-contact-work-items/SC-GSCW-1/cancel');
    expect(r.request.body).toEqual({ reason: 'Action changed' });
    r.flush({});
  });
});
