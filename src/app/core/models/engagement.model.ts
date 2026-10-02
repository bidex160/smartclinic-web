/** Wellness points, levels, badges and the daily quiz. Points reward healthy habits; they are not money. */
export interface EngagementBadge {
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly earned: boolean;
  readonly progress?: { readonly current: number; readonly target: number };
}
export interface PassportItem {
  readonly key: string;
  readonly label: string;
  readonly done: boolean;
  readonly route: string;
}
export interface DailyQuiz {
  readonly localDate: string;
  readonly questionId: string;
  readonly topic: string;
  readonly question: string;
  readonly options: readonly string[];
  readonly answered: {
    readonly choiceIndex: number;
    readonly correct: boolean;
    readonly correctIndex: number;
    readonly explanation: string;
    readonly source: string;
  } | null;
  readonly bankSize: number;
}
export interface EngagementSummary {
  readonly points: number;
  readonly level: { readonly number: number; readonly name: string; readonly min: number; readonly nextName: string | null; readonly nextAt: number | null };
  readonly streak: { readonly current: number; readonly best: number };
  readonly badges: readonly EngagementBadge[];
  readonly passport: {
    readonly percent: number;
    readonly done: number;
    readonly total: number;
    readonly items: readonly PassportItem[];
    readonly nextStep: PassportItem | null;
  };
  readonly quiz: DailyQuiz;
}
export interface EngagementOverview extends EngagementSummary {
  readonly pointsRules: Readonly<Record<string, number>>;
}
export interface QuizAnswerResult extends EngagementSummary {
  readonly pointsEarned: number;
}
