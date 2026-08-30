import{ProviderPayoutSettlementMethod,ProviderPayoutStatus}from'../../core/models/provider-payout.model';
export const payoutStatusLabel=(v:ProviderPayoutStatus)=>({DRAFT:'Draft',PROCESSING:'Processing',COMPLETED:'Completed',FAILED:'Failed',CANCELLED:'Cancelled'}as const)[v];
export const payoutStatusHelp=(v:ProviderPayoutStatus)=>({DRAFT:'Prepared for settlement.',PROCESSING:'Settlement is being processed.',COMPLETED:'Settlement has been recorded as completed.',FAILED:'Settlement was not completed.',CANCELLED:'Settlement was cancelled.'}as const)[v];
export const payoutMethodLabel=(v:ProviderPayoutSettlementMethod)=>v==='MANUAL_BANK_TRANSFER'?'Manual bank transfer':'Other manual settlement';
