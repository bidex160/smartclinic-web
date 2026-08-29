import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../config/api-config.token';
import { AdminCareServicesApiService } from './admin-care-services-api.service';

describe('AdminCareServicesApiService', () => {
  it('uses the exact catalogue list, create, and update contracts', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_CONFIG, useValue: { baseUrl: 'http://api.test/api/v1' } }] });
    const api = TestBed.inject(AdminCareServicesApiService);
    const http = TestBed.inject(HttpTestingController);
    api.list().subscribe();
    const list = http.expectOne('http://api.test/api/v1/admin/care-service-definitions');
    expect(list.request.method).toBe('GET'); list.flush([]);
    const createBody = { code: 'GENERAL_CONSULTATION', name: 'General Consultation', description: 'General consultation' };
    api.create(createBody).subscribe();
    const create = http.expectOne('http://api.test/api/v1/admin/care-service-definitions');
    expect(create.request.method).toBe('POST'); expect(create.request.body).toEqual(createBody); create.flush(definition());
    api.update('definition/id', { isActive: false }).subscribe();
    const update = http.expectOne('http://api.test/api/v1/admin/care-service-definitions/definition%2Fid');
    expect(update.request.method).toBe('PATCH'); expect(update.request.body).toEqual({ isActive: false }); update.flush({ ...definition(), isActive: false });
    http.verify();
  });
});

function definition() { return { id: 'definition-id', code: 'GENERAL_CONSULTATION', name: 'General Consultation', description: 'General consultation', clinicalRecordType: null, isActive: true, createdAt: '2026-08-28T00:00:00Z', updatedAt: '2026-08-28T00:00:00Z' }; }
