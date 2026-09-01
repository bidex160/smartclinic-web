import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_CONFIG } from '../config/api-config.token';
import {
  AuthorizeProfessionalRequest,
  BatchReprocessResult,
  ClassificationProcessingRow,
  CompleteReviewRequest,
  ContactWorkItemDetail,
  ContactWorkItemFilters,
  ContactWorkItemOutcome,
  ContactWorkItemRow,
  InternalClinicalCapability,
  InternalClinicalProfessional,
  InternalReviewDetail,
  MyReviewFilters,
  MyReviewRow,
  Paged,
  ProfessionalFilters,
  ReprocessResult,
  ReviewFilters,
  SelfCheckAnalysis,
  SelfCheckAnalysisStatus,
  SelfCheckReviewDetail,
  SelfCheckReviewRow,
} from '../models/guided-self-check-operations.model';

function params(value: object) {
  let p = new HttpParams();
  for (const [k, v] of Object.entries(value))
    if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
  return p;
}
@Injectable({ providedIn: 'root' })
export class GuidedSelfCheckOperationsApiService {
  private http = inject(HttpClient);
  private base = inject(API_CONFIG).baseUrl;
  professionals(filters: ProfessionalFilters = {}) {
    return this.http.get<Paged<InternalClinicalProfessional>>(
      `${this.base}/admin/guided-self-check-clinical-professionals`,
      { params: params(filters) },
    );
  }
  authorize(payload: AuthorizeProfessionalRequest) {
    return this.http.post<InternalClinicalProfessional>(
      `${this.base}/admin/guided-self-check-clinical-professionals/authorize`,
      payload,
    );
  }
  disableProfessional(reference: string) {
    return this.http.post<InternalClinicalProfessional>(
      `${this.base}/admin/guided-self-check-clinical-professionals/${encodeURIComponent(reference)}/disable`,
      {},
    );
  }
  capability(reference: string, capability: InternalClinicalCapability, grant: boolean) {
    return this.http.post<InternalClinicalProfessional>(
      `${this.base}/admin/guided-self-check-clinical-professionals/${encodeURIComponent(reference)}/capabilities/${grant ? 'grant' : 'revoke'}`,
      { capability },
    );
  }
  reviews(filters: ReviewFilters = {}) {
    return this.http.get<Paged<SelfCheckReviewRow>>(
      `${this.base}/admin/guided-self-check-reviews`,
      { params: params(filters) },
    );
  }
  review(reference: string) {
    return this.http.get<SelfCheckReviewDetail>(
      `${this.base}/admin/guided-self-check-reviews/${encodeURIComponent(reference)}`,
    );
  }
  acknowledge(reference: string) {
    return this.http.post<SelfCheckReviewDetail>(
      `${this.base}/admin/guided-self-check-reviews/${encodeURIComponent(reference)}/acknowledge`,
      {},
    );
  }
  escalate(reference: string, note?: string) {
    return this.http.post<SelfCheckReviewDetail>(
      `${this.base}/admin/guided-self-check-reviews/${encodeURIComponent(reference)}/escalate`,
      note ? { note } : {},
    );
  }
  assign(reference: string, professionalReference: string) {
    return this.http.post<SelfCheckReviewDetail>(
      `${this.base}/admin/guided-self-check-reviews/${encodeURIComponent(reference)}/assign`,
      { professionalReference },
    );
  }
  cancel(reference: string, reason?: string) {
    return this.http.post<SelfCheckReviewDetail>(
      `${this.base}/admin/guided-self-check-reviews/${encodeURIComponent(reference)}/cancel`,
      reason ? { reason } : {},
    );
  }
  internalReview(reference: string) {
    return this.http.get<InternalReviewDetail>(
      `${this.base}/internal/guided-self-check-reviews/${encodeURIComponent(reference)}`,
    );
  }
  listMyReviews(filters: MyReviewFilters = {}) {
    return this.http.get<Paged<MyReviewRow>>(`${this.base}/internal/guided-self-check-reviews`, {
      params: params(filters),
    });
  }
  startReview(reference: string) {
    return this.http.post<SelfCheckReviewDetail>(
      `${this.base}/internal/guided-self-check-reviews/${encodeURIComponent(reference)}/start`,
      {},
    );
  }
  completeReview(reference: string, payload: CompleteReviewRequest) {
    return this.http.post<SelfCheckReviewDetail>(
      `${this.base}/internal/guided-self-check-reviews/${encodeURIComponent(reference)}/complete`,
      payload,
    );
  }
  contactWorkItems(filters: ContactWorkItemFilters = {}) {
    return this.http.get<Paged<ContactWorkItemRow>>(
      `${this.base}/admin/guided-self-check-contact-work-items`,
      { params: params(filters) },
    );
  }
  contactWorkItem(reference: string) {
    return this.http.get<ContactWorkItemDetail>(
      `${this.base}/admin/guided-self-check-contact-work-items/${encodeURIComponent(reference)}`,
    );
  }
  acknowledgeContact(reference: string) {
    return this.http.post<ContactWorkItemRow>(
      `${this.base}/admin/guided-self-check-contact-work-items/${encodeURIComponent(reference)}/acknowledge`,
      {},
    );
  }
  startContact(reference: string) {
    return this.http.post<ContactWorkItemRow>(
      `${this.base}/admin/guided-self-check-contact-work-items/${encodeURIComponent(reference)}/start`,
      {},
    );
  }
  completeContact(reference: string, outcome: ContactWorkItemOutcome, note?: string) {
    return this.http.post<ContactWorkItemRow>(
      `${this.base}/admin/guided-self-check-contact-work-items/${encodeURIComponent(reference)}/complete`,
      { outcome, ...(note?.trim() && { note: note.trim() }) },
    );
  }
  cancelContact(reference: string, reason?: string) {
    return this.http.post<ContactWorkItemRow>(
      `${this.base}/admin/guided-self-check-contact-work-items/${encodeURIComponent(reference)}/cancel`,
      reason?.trim() ? { reason: reason.trim() } : {},
    );
  }
  analyses(status?: SelfCheckAnalysisStatus, page = 1, limit = 25) {
    return this.http.get<Paged<SelfCheckAnalysis>>(
      `${this.base}/admin/guided-self-check-analyses`,
      { params: params({ status, page, limit }) },
    );
  }
  analysis(reference: string) {
    return this.http.get<SelfCheckAnalysis>(
      `${this.base}/admin/guided-self-check-analyses/${encodeURIComponent(reference)}`,
    );
  }
  processAnalysis(reference: string) {
    return this.http.post<SelfCheckAnalysis>(
      `${this.base}/admin/guided-self-check-analyses/${encodeURIComponent(reference)}/process`,
      {},
    );
  }
  processing(
    filters: { status?: string; questionnaireVersion?: number; page?: number; limit?: number } = {},
  ) {
    return this.http.get<Paged<ClassificationProcessingRow>>(
      `${this.base}/admin/guided-self-check-classification-processing`,
      { params: params(filters) },
    );
  }
  reprocess(reference: string) {
    return this.http.post<ReprocessResult>(
      `${this.base}/admin/guided-self-check-classification-processing/${encodeURIComponent(reference)}/reprocess`,
      {},
    );
  }
  batch(questionnaireVersion: number, limit = 25) {
    return this.http.post<BatchReprocessResult>(
      `${this.base}/admin/guided-self-check-classification-processing/batch/reprocess`,
      { questionnaireVersion, limit },
    );
  }
}
