import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_CONFIG } from '../config/api-config.token';
import {
  ClinicalRule,
  GovernanceAuthorization,
  GovernanceMetadata,
  GovernanceStatus,
  MessageKeys,
  Paged,
  QuestionnaireMetadata,
  RulesetDetail,
  RulesetSummary,
  SimulationAnswer,
  SimulationResult,
  ValidationResult,
} from '../models/guided-self-check-governance.model';
const query = (v: object) => {
  let p = new HttpParams();
  for (const [k, x] of Object.entries(v))
    if (x !== undefined && x !== null && x !== '') p = p.set(k, String(x));
  return p;
};
@Injectable({ providedIn: 'root' })
export class GuidedSelfCheckGovernanceApiService {
  private http = inject(HttpClient);
  private base = inject(API_CONFIG).baseUrl;
  authorizations(
    filters: { status?: 'AUTHORIZED' | 'DISABLED'; page?: number; limit?: number } = {},
  ) {
    return this.http.get<Paged<GovernanceAuthorization>>(
      `${this.base}/admin/guided-self-check-clinical-governance-authorizations`,
      { params: query(filters) },
    );
  }
  authorize(userEmail: string, reason?: string) {
    return this.http.post<GovernanceAuthorization>(
      `${this.base}/admin/guided-self-check-clinical-governance-authorizations/authorize`,
      { userEmail, ...(reason?.trim() && { reason: reason.trim() }) },
    );
  }
  disableAuthorization(reference: string, reason: string) {
    return this.http.post<GovernanceAuthorization>(
      `${this.base}/admin/guided-self-check-clinical-governance-authorizations/${encodeURIComponent(reference)}/disable`,
      { reason: reason.trim() },
    );
  }
  rulesets(
    filters: {
      status?: GovernanceStatus;
      questionnaireVersion?: number;
      isActive?: boolean;
      page?: number;
      limit?: number;
    } = {},
  ) {
    return this.http.get<Paged<RulesetSummary>>(`${this.base}/admin/guided-self-check-rulesets`, {
      params: query(filters),
    });
  }
  metadata() {
    return this.http.get<GovernanceMetadata>(
      `${this.base}/admin/guided-self-check-rulesets/metadata`,
    );
  }
  questionnaire(version: number) {
    return this.http.get<QuestionnaireMetadata>(
      `${this.base}/admin/guided-self-check-rulesets/questionnaires/${version}`,
    );
  }
  ruleset(reference: string) {
    return this.http.get<RulesetDetail>(
      `${this.base}/admin/guided-self-check-rulesets/${encodeURIComponent(reference)}`,
    );
  }
  create(payload: {
    questionnaireVersion: number;
    name: string;
    description?: string;
    rules: ClinicalRule[];
    patientMessageKeys: MessageKeys;
  }) {
    return this.http.post<RulesetDetail>(`${this.base}/admin/guided-self-check-rulesets`, payload);
  }
  update(
    reference: string,
    payload: {
      expectedContentHash?: string;
      name?: string;
      description?: string;
      rules?: ClinicalRule[];
      patientMessageKeys?: MessageKeys;
    },
  ) {
    return this.http.patch<RulesetSummary>(
      `${this.base}/admin/guided-self-check-rulesets/${encodeURIComponent(reference)}`,
      payload,
    );
  }
  validate(reference: string) {
    return this.http.post<ValidationResult>(
      `${this.base}/admin/guided-self-check-rulesets/${encodeURIComponent(reference)}/validate`,
      {},
    );
  }
  simulate(reference: string, answers: SimulationAnswer[]) {
    return this.http.post<SimulationResult>(
      `${this.base}/admin/guided-self-check-rulesets/${encodeURIComponent(reference)}/simulate`,
      { answers },
    );
  }
  transition(
    reference: string,
    action: 'submit-review' | 'approve' | 'mark-ready' | 'activate' | 'retire',
    note?: string,
  ) {
    return this.http.post<RulesetSummary>(
      `${this.base}/admin/guided-self-check-rulesets/${encodeURIComponent(reference)}/${action}`,
      note?.trim() ? { note: note.trim() } : {},
    );
  }
}
