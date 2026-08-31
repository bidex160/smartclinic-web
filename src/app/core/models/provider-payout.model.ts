import { ProviderEarningSourceType } from './provider-earning.model';
export type ProviderPayoutStatus='DRAFT'|'PROCESSING'|'COMPLETED'|'FAILED'|'CANCELLED';
export type ProviderPayoutSettlementMethod='MANUAL_BANK_TRANSFER'|'MANUAL_OTHER';
export interface ProviderPayoutDestination{readonly payoutAccountReference:string;readonly type:'BANK_ACCOUNT';readonly countryCode:string;readonly currency:string;readonly bankCode:string;readonly bankName:string;readonly maskedAccountNumber:string;readonly accountName:string;}
export interface ProviderPayout{readonly reference:string;readonly currency:string;readonly totalAmountMinor:number;readonly earningCount:number;readonly status:ProviderPayoutStatus;readonly settlementMethod:ProviderPayoutSettlementMethod;readonly destination:ProviderPayoutDestination|null;readonly externalReference:string|null;readonly note:string|null;readonly createdAt:string;readonly processingAt:string|null;readonly completedAt:string|null;readonly failedAt:string|null;readonly cancelledAt:string|null;readonly updatedAt:string;}
export interface AdminProviderPayout extends ProviderPayout{readonly provider:{readonly reference:string;readonly displayName:string};}
export interface ProviderPayoutEarning{readonly reference:string;readonly sourceType:ProviderEarningSourceType;readonly sourceReference:string;readonly providerShareMinor:number;readonly currency:string;readonly payableAt:string|null;readonly settledAt:string|null;}
export interface ProviderPayoutHistory{readonly fromStatus:ProviderPayoutStatus|null;readonly toStatus:ProviderPayoutStatus;readonly reasonCode:string;readonly reasonNote:string|null;readonly createdAt:string;}
export interface ProviderPayoutDetail extends ProviderPayout{readonly earnings:readonly ProviderPayoutEarning[];readonly history:readonly ProviderPayoutHistory[];}
export interface AdminProviderPayoutDetail extends AdminProviderPayout{readonly earnings:readonly ProviderPayoutEarning[];readonly history:readonly ProviderPayoutHistory[];}
export interface ProviderPayoutPage<T=ProviderPayout>{readonly items:readonly T[];readonly page:number;readonly limit:number;readonly total:number;readonly totalPages:number;}
export interface ProviderPayoutFilters{readonly status?:ProviderPayoutStatus;readonly currency?:string;readonly page?:number;readonly limit?:number;}
export interface AdminProviderPayoutFilters extends ProviderPayoutFilters{readonly providerReference?:string;}
export interface EligibleProviderEarning{readonly reference:string;readonly sourceType:ProviderEarningSourceType;readonly sourceReference:string;readonly providerShareMinor:number;readonly currency:string;readonly payableAt:string|null;readonly createdAt:string;}
export interface EligibleProviderEarningFilters{readonly providerReference:string;readonly currency:string;readonly page?:number;readonly limit?:number;}
export interface CreateProviderPayoutRequest{readonly providerReference:string;readonly currency:string;readonly earningReferences:readonly string[];readonly settlementMethod:ProviderPayoutSettlementMethod;readonly payoutAccountReference?:string;readonly note?:string;}
export interface CompleteProviderPayoutRequest{readonly externalReference:string;readonly note?:string;}
export interface ProviderPayoutReasonRequest{readonly reason:string;}
