export interface PatientWalletView {
  readonly currency: string;
  readonly balanceMinor: number;
  readonly recent: readonly {
    readonly direction: 'CREDIT' | 'DEBIT';
    readonly type: 'TOP_UP' | 'HOSPITAL_PAYMENT' | 'REFUND' | 'ADJUSTMENT';
    readonly amountMinor: number;
    readonly balanceAfterMinor: number;
    readonly sourceReference: string | null;
    readonly createdAt: string;
  }[];
}
