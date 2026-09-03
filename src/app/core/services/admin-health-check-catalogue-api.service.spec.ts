import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { AdminHealthCheckCatalogueApiService } from './admin-health-check-catalogue-api.service';

describe('AdminHealthCheckCatalogueApiService', () => {
  let service: AdminHealthCheckCatalogueApiService;
  let http: HttpTestingController;
  const base = '/api/v1/admin/health-check-catalogue';
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: '/api/v1' } },
      ],
    });
    service = TestBed.inject(AdminHealthCheckCatalogueApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('uses the confirmed package catalogue endpoints and exact mutation bodies', () => {
    service.listPackages().subscribe();
    expect(http.expectOne(`${base}/packages`).request.method).toBe('GET');
    service.updatePackage('ESSENTIAL', { benefits: ['Benefit'] }).subscribe();
    const patch = http.expectOne(`${base}/packages/ESSENTIAL`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ benefits: ['Benefit'] });
    service.setPackageActive('ESSENTIAL', false).subscribe();
    expect(http.expectOne(`${base}/packages/ESSENTIAL/deactivate`).request.method).toBe('POST');
    service.addIncludedContent('ESSENTIAL', 'HC-CONTENT-1').subscribe();
    const included = http.expectOne(`${base}/packages/ESSENTIAL/included-contents`);
    expect(included.request.body).toEqual({ clinicalContentReference: 'HC-CONTENT-1' });
    service
      .reorderIncludedContents('ESSENTIAL', {
        items: [{ clinicalContentReference: 'HC-CONTENT-1', sortOrder: 0 }],
      })
      .subscribe();
    const reorder = http.expectOne(`${base}/packages/ESSENTIAL/included-contents/reorder`);
    expect(reorder.request.body.items).toHaveLength(1);
    service.addOptionalAddon('ESSENTIAL', 'HC-CONTENT-2').subscribe();
    const addon = http.expectOne(`${base}/packages/ESSENTIAL/optional-addons`);
    expect(addon.request.body).toEqual({ clinicalContentReference: 'HC-CONTENT-2' });
  });

  it('passes only the confirmed server-side clinical content filters', () => {
    service
      .listClinicalContents({
        isActive: false,
        category: 'SERVICE',
        resultType: 'NONE',
        search: 'consult',
        page: 2,
        limit: 25,
      })
      .subscribe();
    const request = http.expectOne((r) => r.url === `${base}/clinical-contents`);
    expect(request.request.params.get('isActive')).toBe('false');
    expect(request.request.params.get('category')).toBe('SERVICE');
    expect(request.request.params.get('resultType')).toBe('NONE');
    expect(request.request.params.get('search')).toBe('consult');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('limit')).toBe('25');
  });

  it('creates only the typed NONE/null contract and has no delete requests', () => {
    service
      .createClinicalContent({
        code: 'CLINICIAN_CONSULTATION',
        name: 'Clinician consultation',
        category: 'SERVICE',
        resultType: 'NONE',
        unit: null,
      })
      .subscribe();
    const request = http.expectOne(`${base}/clinical-contents`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.resultType).toBe('NONE');
    expect(request.request.body.unit).toBeNull();
    service.setClinicalContentActive('HC-CONTENT-1', false).subscribe();
    expect(http.expectOne(`${base}/clinical-contents/HC-CONTENT-1/deactivate`).request.method).toBe(
      'POST',
    );
  });
});
