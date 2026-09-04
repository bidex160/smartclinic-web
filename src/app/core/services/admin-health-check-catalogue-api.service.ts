import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_CONFIG } from '../config/api-config.token';
import {
  AdminClinicalContent,
  AdminClinicalContentDetail,
  AdminClinicalContentFilters,
  AdminClinicalContentPage,
  AdminHealthCheckPackageDetail,
  AdminHealthCheckPackageSummary,
  CreateAdminHealthCheckPackageRequest,
  CreateAdminClinicalContentRequest,
  ReorderAdminPackageContentsRequest,
  UpdateAdminClinicalContentRequest,
  UpdateAdminHealthCheckPackageRequest,
} from '../models/admin-health-check-catalogue.model';

@Injectable({ providedIn: 'root' })
export class AdminHealthCheckCatalogueApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_CONFIG).baseUrl}/admin/health-check-catalogue`;

  listPackages() {
    return this.http.get<AdminHealthCheckPackageSummary[]>(`${this.base}/packages`);
  }
  createPackage(request: CreateAdminHealthCheckPackageRequest) {
    return this.http.post<AdminHealthCheckPackageDetail>(`${this.base}/packages`, request);
  }
  packageDetail(code: string) {
    return this.http.get<AdminHealthCheckPackageDetail>(`${this.base}/packages/${code}`);
  }
  updatePackage(code: string, request: UpdateAdminHealthCheckPackageRequest) {
    return this.http.patch<AdminHealthCheckPackageDetail>(`${this.base}/packages/${code}`, request);
  }
  setPackageActive(code: string, active: boolean) {
    return this.http.post<AdminHealthCheckPackageDetail>(
      `${this.base}/packages/${code}/${active ? 'activate' : 'deactivate'}`,
      {},
    );
  }
  listClinicalContents(filters: AdminClinicalContentFilters = {}) {
    let params = new HttpParams();
    for (const key of ['isActive', 'category', 'resultType', 'search', 'page', 'limit'] as const) {
      const value = filters[key];
      if (value !== undefined && value !== '') params = params.set(key, String(value));
    }
    return this.http.get<AdminClinicalContentPage>(`${this.base}/clinical-contents`, { params });
  }
  createClinicalContent(request: CreateAdminClinicalContentRequest) {
    return this.http.post<AdminClinicalContent>(`${this.base}/clinical-contents`, request);
  }
  clinicalContentDetail(reference: string) {
    return this.http.get<AdminClinicalContentDetail>(`${this.base}/clinical-contents/${reference}`);
  }
  updateClinicalContent(reference: string, request: UpdateAdminClinicalContentRequest) {
    return this.http.patch<AdminClinicalContent>(
      `${this.base}/clinical-contents/${reference}`,
      request,
    );
  }
  setClinicalContentActive(reference: string, active: boolean) {
    return this.http.post<AdminClinicalContent>(
      `${this.base}/clinical-contents/${reference}/${active ? 'activate' : 'deactivate'}`,
      {},
    );
  }
  addIncludedContent(code: string, clinicalContentReference: string, sortOrder?: number) {
    return this.http.post<AdminHealthCheckPackageDetail>(
      `${this.base}/packages/${code}/included-contents`,
      { clinicalContentReference, ...(sortOrder === undefined ? {} : { sortOrder }) },
    );
  }
  setIncludedContentActive(code: string, reference: string, active: boolean) {
    return this.http.post<AdminHealthCheckPackageDetail>(
      `${this.base}/packages/${code}/included-contents/${reference}/${active ? 'activate' : 'deactivate'}`,
      {},
    );
  }
  reorderIncludedContents(code: string, request: ReorderAdminPackageContentsRequest) {
    return this.http.post<AdminHealthCheckPackageDetail>(
      `${this.base}/packages/${code}/included-contents/reorder`,
      request,
    );
  }
  addOptionalAddon(code: string, clinicalContentReference: string) {
    return this.http.post<AdminHealthCheckPackageDetail>(
      `${this.base}/packages/${code}/optional-addons`,
      { clinicalContentReference },
    );
  }
  setOptionalAddonActive(code: string, reference: string, active: boolean) {
    return this.http.post<AdminHealthCheckPackageDetail>(
      `${this.base}/packages/${code}/optional-addons/${reference}/${active ? 'activate' : 'deactivate'}`,
      {},
    );
  }
}
