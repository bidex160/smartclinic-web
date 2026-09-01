import {
  GuidedSelfCheckClassification,
  GuidedSelfCheckNextAction,
  GuidedSelfCheckNextActionType,
} from './guided-self-check.model';

export type InternalClinicalProfessionalType = 'DOCTOR' | 'NURSE' | 'OTHER_CLINICAL_PROFESSIONAL';
export type InternalClinicalProfessionalStatus = 'ACTIVE' | 'DISABLED';
export type InternalClinicalCapability = 'SELF_CHECK_CLINICAL_REVIEW' | 'URGENT_SELF_CHECK_REVIEW';
export interface InternalClinicalProfessional {
  reference: string;
  displayName: string;
  professionalType: InternalClinicalProfessionalType;
  status: InternalClinicalProfessionalStatus;
  capabilities: readonly InternalClinicalCapability[];
  authorizedAt: string;
  disabledAt: string | null;
  createdAt: string;
}
export interface Paged<T> {
  items: readonly T[];
  total: number;
  page: number;
  limit: number;
}
export interface ProfessionalFilters {
  status?: InternalClinicalProfessionalStatus;
  capability?: InternalClinicalCapability;
  search?: string;
  page?: number;
  limit?: number;
}
export interface AuthorizeProfessionalRequest {
  userEmail: string;
  displayName: string;
  professionalType: InternalClinicalProfessionalType;
  capabilities: InternalClinicalCapability[];
}

export type SelfCheckReviewStatus =
  'PENDING' | 'ACKNOWLEDGED' | 'ASSIGNED' | 'IN_REVIEW' | 'ESCALATED' | 'COMPLETED' | 'CANCELLED';
export type SelfCheckReviewPriority = 'ROUTINE' | 'URGENT';
export type SelfCheckReviewModel = 'INTERNAL_URGENT' | 'INTERNAL_ROUTINE';
export type SelfCheckReviewDecision =
  | 'NO_FURTHER_REVIEW_REQUIRED'
  | 'FOLLOW_UP_RECOMMENDED'
  | 'PATIENT_CONTACT_REQUIRED'
  | 'URGENT_ESCALATION_CONFIRMED';
export interface ReviewFilters {
  status?: SelfCheckReviewStatus;
  priority?: SelfCheckReviewPriority;
  classification?: GuidedSelfCheckClassification;
  reviewModel?: SelfCheckReviewModel;
  assigned?: boolean;
  page?: number;
  limit?: number;
}
export type MyReviewStatus = 'ASSIGNED' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';
export interface MyReviewFilters {
  status?: MyReviewStatus;
  priority?: SelfCheckReviewPriority;
  reviewModel?: SelfCheckReviewModel;
  classification?: GuidedSelfCheckClassification;
  page?: number;
  limit?: number;
}
export interface MyReviewRow {
  reference: string;
  selfCheckReference: string;
  classification: GuidedSelfCheckClassification;
  priority: SelfCheckReviewPriority;
  status: MyReviewStatus;
  assignedAt: string;
  startedAt: string | null;
  createdAt: string;
}
export interface SelfCheckReviewRow {
  reference: string;
  selfCheckReference: string;
  reviewModel: SelfCheckReviewModel;
  classification: GuidedSelfCheckClassification;
  priority: SelfCheckReviewPriority;
  status: SelfCheckReviewStatus;
  questionnaireCompletedAt: string | null;
  acknowledgedAt: string | null;
  assignedProfessional: {
    reference: string;
    displayName: string;
    professionalType: InternalClinicalProfessionalType;
  } | null;
  assignedAt: string | null;
  createdAt: string;
}
export interface SelfCheckReviewDetail extends SelfCheckReviewRow {
  origin: 'CLASSIFICATION_REQUIRED' | 'QA_SAMPLE';
  patientMessageKey: string | null;
  matchedReasonCodes: readonly string[];
  urgentAction: boolean;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  decision: SelfCheckReviewDecision | null;
  patientGuidance: string | null;
  internalClinicalNote: string | null;
  contactRequired: boolean;
  contactStatus: 'NOT_REQUIRED' | 'REQUIRED' | 'CONTACTED';
  contactedAt: string | null;
  history: readonly {
    event: string;
    fromStatus: SelfCheckReviewStatus | null;
    toStatus: SelfCheckReviewStatus | null;
    actor: { displayName: string } | null;
    metadata: Record<string, unknown>;
    createdAt: string;
  }[];
}
export interface InternalReviewDetail extends SelfCheckReviewDetail {
  analysis: null | {
    status: SelfCheckAnalysisStatus;
    humanReviewRecommended: boolean;
    output: SelfCheckAnalysisOutput | null;
  };
  nextAction: GuidedSelfCheckNextAction | null;
  allowedNextActionsByDecision: Record<
    SelfCheckReviewDecision,
    readonly GuidedSelfCheckNextActionType[]
  >;
  questionnaire: {
    version: number;
    groups: readonly {
      key: string;
      title: string;
      sortOrder: number;
      questions: readonly {
        key: string;
        text: string;
        type: string;
        sortOrder: number;
        answer: { state: string; value: unknown; provenance: string; updatedAt: string } | null;
      }[];
    }[];
  };
}
export interface CompleteReviewRequest {
  decision: SelfCheckReviewDecision;
  nextActionType: GuidedSelfCheckNextActionType;
  patientGuidance?: string;
  internalClinicalNote?: string;
  contactRequired?: boolean;
}

export type ContactWorkItemStatus =
  'PENDING' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ContactWorkItemOutcome =
  'CONTACTED' | 'UNREACHABLE' | 'PATIENT_DECLINED' | 'REFERRED_TO_CLINICAL_REVIEW';
export interface ContactWorkItemFilters {
  status?: ContactWorkItemStatus;
  priority?: SelfCheckReviewPriority;
  page?: number;
  limit?: number;
}
export interface ContactWorkItemRow {
  reference: string;
  selfCheckReference: string;
  priority: SelfCheckReviewPriority;
  status: ContactWorkItemStatus;
  createdAt: string;
  acknowledgedAt: string | null;
  startedAt: string | null;
}
export interface ContactWorkItemDetail extends ContactWorkItemRow {
  patient: { reference: string; displayName: string; phone: string | null; email: string };
  outcome: ContactWorkItemOutcome | null;
  operationalNote: string | null;
  completedAt: string | null;
}

export type SelfCheckAnalysisStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export interface SelfCheckAnalysisOutput {
  conciseSummary: string;
  notableResponses: readonly string[];
  inconsistencies: readonly string[];
  informationGaps: readonly string[];
  suggestedOperationalPriority: 'ROUTINE' | 'ELEVATED';
  humanReviewSuggested: boolean;
  safeReasonCodes: readonly string[];
  recommendedAction: 'BOOK_ESSENTIAL_CHECK' | 'FIND_CARE' | 'REQUEST_PROFESSIONAL_CONTACT' | null;
  escalationSuggested: boolean;
}
export interface SelfCheckAnalysis {
  reference: string;
  selfCheckReference: string;
  classification: 'AMBER';
  status: SelfCheckAnalysisStatus;
  output: SelfCheckAnalysisOutput | null;
  providerKey: string | null;
  modelKey: string | null;
  failureCode: 'PROVIDER_UNAVAILABLE' | 'TIMEOUT' | 'INVALID_OUTPUT' | 'PROCESSING_ERROR' | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ClassificationProcessingRow {
  reference: string;
  questionnaireVersion: number | null;
  completedAt: string | null;
  classificationStatus: 'PENDING' | 'CONFIGURATION_REQUIRED' | 'FAILED';
  lastProcessingAttemptAt: string | null;
  failureCode:
    | 'NO_USABLE_RULESET'
    | 'RULESET_CHANGED'
    | 'INVALID_FROZEN_ANSWERS'
    | 'CLASSIFICATION_PROCESSING_ERROR'
    | null;
  attemptCount: number;
  usableRuleset: { reference: string; version: number } | null;
}
export type ReprocessOutcome =
  'CLASSIFIED' | 'STILL_CONFIGURATION_REQUIRED' | 'ALREADY_CLASSIFIED' | 'NOT_ELIGIBLE' | 'FAILED';
export interface ReprocessResult {
  reference: string;
  outcome: ReprocessOutcome;
  classificationStatus: string;
  classification?: GuidedSelfCheckClassification;
  failureCode?: string;
  ruleset?: { reference: string; version: number };
}
export interface BatchReprocessResult {
  questionnaireVersion: number;
  ruleset: { reference: string; version: number };
  requestedLimit: number;
  processed: number;
  classified: number;
  failed: number;
  results: readonly ReprocessResult[];
}
