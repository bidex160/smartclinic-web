export type GuidedSelfCheckFundingStatus = 'UNPAID' | 'PAYMENT_PENDING' | 'PAID' | 'SATISFIED_FREE';
export type GuidedSelfCheckWorkflowStatus =
  'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
export type GuidedSelfCheckClassificationStatus =
  'PENDING' | 'CONFIGURATION_REQUIRED' | 'CLASSIFIED' | 'FAILED';
export type GuidedSelfCheckClassification = 'GREEN' | 'AMBER' | 'RED';
export type GuidedSelfCheckQuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTI_CHOICE'
  | 'BOOLEAN'
  | 'SHORT_TEXT'
  | 'LONG_TEXT'
  | 'NUMBER'
  | 'BLOOD_PRESSURE'
  | 'BLOOD_GLUCOSE';
export type GuidedSelfCheckAnswerState = 'KNOWN' | 'DONT_KNOW';
export type GuidedSelfCheckNextActionType =
  | 'CONTINUE_STAYING_WELL'
  | 'BOOK_ESSENTIAL_CHECK'
  | 'FIND_CARE'
  | 'REQUEST_PROFESSIONAL_CONTACT'
  | 'SEEK_URGENT_ASSESSMENT';
export type GuidedSelfCheckValue =
  | string
  | number
  | boolean
  | string[]
  | { systolic: number; diastolic: number; unit: 'mmHg' }
  | { value: number; unit: 'mmol/L' | 'mg/dL' }
  | null;

export interface GuidedSelfCheckProduct {
  name: string;
  currency: string;
  standardPriceMinor: number;
  effectivePriceMinor: number;
  promotionalPriceMinor: number | null;
  promotionActive: boolean;
  promotionEndsAt: string | null;
  available: boolean;
}
export interface GuidedSelfCheck {
  reference: string;
  currency: string;
  standardPriceMinor: number;
  promotionalPriceMinor: number | null;
  effectivePriceMinor: number;
  promotionApplied: boolean;
  fundingStatus: GuidedSelfCheckFundingStatus;
  workflowStatus: GuidedSelfCheckWorkflowStatus;
  paidAt: string | null;
  canBegin: boolean;
  canResume: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface GuidedSelfCheckFunding {
  reference: string;
  amountMinor: number;
  currency: string;
  fundingStatus: GuidedSelfCheckFundingStatus;
  paid: boolean;
  attemptStatus: string | null;
  checkoutUrl: string | null;
  accessCode: string | null;
}
export interface GuidedSelfCheckOption {
  value: string;
  label: string;
}
export interface GuidedSelfCheckQuestion {
  key: string;
  text: string;
  helperText: string | null;
  type: GuidedSelfCheckQuestionType;
  required: boolean;
  allowsDontKnow: boolean;
  options: readonly GuidedSelfCheckOption[] | null;
  condition: unknown;
  validation: Record<string, unknown> | null;
  measurement: Record<string, unknown> | null;
  visible: boolean;
  answer: null | {
    state: GuidedSelfCheckAnswerState;
    value: GuidedSelfCheckValue;
    provenance: string;
    updatedAt: string;
  };
}
export interface GuidedSelfCheckQuestionnaire {
  reference: string;
  workflowStatus: GuidedSelfCheckWorkflowStatus;
  questionnaireVersion: number;
  groups: readonly {
    key: string;
    title: string;
    helperText: string | null;
    sortOrder: number;
    questions: readonly GuidedSelfCheckQuestion[];
  }[];
  progress: {
    totalRelevantGroups: number;
    totalRelevantQuestions: number;
    answeredCount: number;
    requiredRelevantCount: number;
    completedRequiredCount: number;
    percentage: number;
  };
}
export interface GuidedSelfCheckNextAction {
  type: GuidedSelfCheckNextActionType;
  source: 'CLASSIFICATION' | 'AI_ANALYSIS' | 'PROFESSIONAL_REVIEW';
  titleKey: string;
  title: string;
  message: string;
  cta: {
    type:
      | 'NONE'
      | 'HEALTH_CHECK_PACKAGE'
      | 'PROFESSIONAL_REVIEW'
      | 'PROFESSIONAL_CONTACT'
      | 'FIND_CARE'
      | 'URGENT_ASSESSMENT';
    packageCode?: string;
    domain?: string;
  };
  selectedAt: string;
}
export interface GuidedSelfCheckPatientResult {
  classificationStatus: GuidedSelfCheckClassificationStatus;
  classification: null | {
    classification: GuidedSelfCheckClassification;
    requiresProfessionalReview: boolean;
    urgentAction: boolean;
    patientMessageKey: string;
    title: string;
    message: string;
    classifiedAt: string;
  };
  professionalReview: null | {
    required: boolean;
    status: string | null;
    completedAt: string | null;
    patientGuidance: string | null;
  };
  analysis: null | {
    required: boolean;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    humanReviewRecommended: boolean;
  };
  patientMessageKey?: string;
  title?: string;
  message?: string;
  nextAction: GuidedSelfCheckNextAction | null;
}
export type GuidedSelfCheckDetail = GuidedSelfCheck & GuidedSelfCheckPatientResult;
export interface GuidedSelfCheckList {
  items: readonly GuidedSelfCheck[];
}
