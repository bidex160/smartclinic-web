export type GovernanceStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'READY' | 'RETIRED';
export type RuleSeverity = 'AMBER' | 'RED';
export type RuleOperator =
  | 'STATE_EQUALS'
  | 'EQUALS'
  | 'INCLUDES'
  | 'LT'
  | 'LTE'
  | 'GT'
  | 'GTE'
  | 'BETWEEN'
  | 'UNANSWERED'
  | 'AND'
  | 'OR';
export type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTI_CHOICE'
  | 'BOOLEAN'
  | 'SHORT_TEXT'
  | 'LONG_TEXT'
  | 'NUMBER'
  | 'BLOOD_PRESSURE'
  | 'BLOOD_GLUCOSE';
export type AnswerState = 'KNOWN' | 'DONT_KNOW';
export interface RuleCondition {
  operator: RuleOperator;
  questionKey?: string;
  field?: 'systolic' | 'diastolic' | 'value';
  value?: unknown;
  min?: number;
  max?: number;
  state?: AnswerState;
  conditions?: RuleCondition[];
}
export interface ClinicalRule {
  code: string;
  severity: RuleSeverity;
  condition: RuleCondition;
}
export interface MessageKeys {
  green: string;
  amber: string;
  red: string;
}
export interface AllowedActions {
  edit: boolean;
  validate: boolean;
  simulate: boolean;
  submitForReview: boolean;
  approve: boolean;
  markReady: boolean;
  activate: boolean;
  retire: boolean;
}
export interface RulesetReadiness {
  statusReady: boolean;
  approvalHashMatches: boolean;
  contentHashValid: boolean;
  classificationReady: boolean;
}
export interface RulesetSummary {
  reference: string;
  version: number;
  name: string;
  description: string | null;
  questionnaireVersion: number;
  governanceStatus: GovernanceStatus;
  isActive: boolean;
  ruleCount: number;
  contentHash: string;
  approvedContentHash: string | null;
  approvalState: 'APPROVED' | 'UNAPPROVED';
  readiness: RulesetReadiness;
  approvedAt: string | null;
  activatedAt: string | null;
  retiredAt: string | null;
  createdAt: string;
  updatedAt: string;
  allowedActions: AllowedActions;
}
export interface RulesetAudit {
  event: string;
  fromStatus: string | null;
  toStatus: string | null;
  metadata: Record<string, unknown> | null;
  actor: { displayName: string | null };
  createdAt: string;
}
export interface RulesetDetail extends RulesetSummary {
  rules: ClinicalRule[];
  patientMessageKeys: MessageKeys;
  audit: RulesetAudit[];
}
export interface ValidationIssue {
  path: string;
  code: string;
  message: string;
}
export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  contentHash: string;
  ruleCount: number;
}
export interface SimulationAnswer {
  questionKey: string;
  state: AnswerState;
  value?: unknown;
}
export interface SimulationResult {
  rulesetReference: string;
  rulesetVersion: number;
  questionnaireVersion: number;
  matchedRules: string[];
  matchedReasonCodes: string[];
  classification: 'GREEN' | 'AMBER' | 'RED';
  patientMessageKey: string;
  requiresProfessionalReview: boolean;
  urgentAction: boolean;
  sideEffects: false;
}
export interface GovernanceMetadata {
  rulesetLifecycle: GovernanceStatus[];
  severities: RuleSeverity[];
  operators: RuleOperator[];
  answerStates: AnswerState[];
  questionTypes: QuestionType[];
  conditionVisibilityOperators: string[];
  measurementTargets: Partial<Record<QuestionType, string[]>>;
  operatorCompatibility: Record<RuleOperator, QuestionType[]>;
  patientMessages: { key: string; title: string; message: string }[];
  validationLimits: {
    maxRules: number;
    maxConditionDepth: number;
    maxGroupBranches: number;
    maxSimulationAnswers: number;
    ruleCodeMinLength: number;
    ruleCodeMaxLength: number;
    rulesetNameMaxLength: number;
    rulesetDescriptionMaxLength: number;
    governanceNoteMaxLength: number;
  };
  questionnaireVersions: {
    version: number;
    schemaVersion: string;
    isActive: boolean;
    createdAt: string;
  }[];
}
export interface QuestionnaireQuestion {
  key: string;
  text: string;
  helperText: string | null;
  type: QuestionType;
  required: boolean;
  allowsDontKnow: boolean;
  supportedAnswerStates: AnswerState[];
  options: string[];
  measurementTargets: string[];
  measurementMetadata: unknown;
  validationMetadata: unknown;
  sortOrder: number;
}
export interface QuestionnaireMetadata {
  version: number;
  schemaVersion: string;
  isActive: boolean;
  groups: {
    key: string;
    title: string;
    helperText: string | null;
    sortOrder: number;
    questions: QuestionnaireQuestion[];
  }[];
}
export interface GovernanceAuthorization {
  reference: string;
  user: { displayName: string; email: string };
  legacyProvider: { reference: string; displayName: string } | null;
  status: 'AUTHORIZED' | 'DISABLED';
  authorizedAt: string;
  disabledAt: string | null;
  createdAt: string;
}
export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
