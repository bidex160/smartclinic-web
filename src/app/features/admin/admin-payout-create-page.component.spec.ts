import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { CreateProviderPayoutRequest } from '../../core/models/provider-payout.model';
import { ProviderPayoutAccountsApiService } from '../../core/services/provider-payout-accounts-api.service';
import { ProviderPayoutsApiService } from '../../core/services/provider-payouts-api.service';
import { AdminPayoutCreatePageComponent } from './admin-payout-create-page.component';
@Component({template:''}) class EmptyPage {}

describe('AdminPayoutCreatePageComponent destination',()=>{
 const earning={reference:'SC-EARN-1',sourceType:'GENERAL_CARE' as const,sourceReference:'SC-CARE-1',providerShareMinor:9000,currency:'NGN',payableAt:'2026-08-30T10:00:00Z',createdAt:'2026-08-29T10:00:00Z'};
 const account={reference:'SC-PACCT-ONE',provider:{reference:'SCPR-ONE',displayName:'Prime'},type:'BANK_ACCOUNT' as const,countryCode:'NG',currency:'NGN',bankCode:'058',bankName:'Example Bank',maskedAccountNumber:'****6789',accountName:'Prime Clinic',status:'VERIFIED' as const,isDefault:true,verifiedAt:'2026-08-30',disabledAt:null,createdAt:'2026-08-30',updatedAt:'2026-08-30'};
 function setup(create:(body:CreateProviderPayoutRequest)=>Observable<unknown>=()=>of({reference:'SC-PAYOUT-1'})){
   const payouts={getEligibleEarnings:vi.fn(()=>of({items:[earning],page:1,limit:25,total:1,totalPages:1})),createPayout:vi.fn(create)};
   const accounts={adminList:vi.fn(()=>of({items:[account],page:1,limit:100,total:1,totalPages:1}))};
   TestBed.configureTestingModule({imports:[AdminPayoutCreatePageComponent],providers:[provideRouter([{path:'admin/provider-payouts/:reference',component:EmptyPage}]),{provide:ProviderPayoutsApiService,useValue:payouts},{provide:ProviderPayoutAccountsApiService,useValue:accounts}]});
   return{fixture:TestBed.createComponent(AdminPayoutCreatePageComponent),payouts,accounts};
 }
 it('loads verified accounts by public Provider reference and currency without auto-selecting default',()=>{const{fixture,accounts}=setup();const c=fixture.componentInstance;c.form.patchValue({providerReference:'SCPR-ONE',currency:'NGN'});expect(accounts.adminList).toHaveBeenCalledWith(expect.objectContaining({providerReference:'SCPR-ONE',status:'VERIFIED',currency:'NGN'}));expect(c.form.controls.payoutAccountReference.value).toBe('');fixture.detectChanges();expect(fixture.nativeElement.textContent).toContain('Default')});
 it('sends only the selected account reference and omits it when absent',()=>{const{fixture,payouts}=setup();const c=fixture.componentInstance;vi.spyOn(globalThis,'confirm').mockReturnValue(true);c.form.patchValue({providerReference:'SCPR-ONE'});c.loadEligible(1,true);c.toggle(earning);c.form.controls.payoutAccountReference.setValue('SC-PACCT-ONE');c.create();let body=payouts.createPayout.mock.calls[0]![0];expect(body.payoutAccountReference).toBe('SC-PACCT-ONE');expect(body).not.toHaveProperty('destination');expect(body).not.toHaveProperty('accountId');payouts.createPayout.mockClear();c.form.controls.payoutAccountReference.setValue('');c.create();body=payouts.createPayout.mock.calls[0]![0];expect(body.payoutAccountReference).toBeUndefined();expect(body).not.toHaveProperty('totalAmountMinor')});
 it('clears destination for Provider/currency changes and hides it for MANUAL_OTHER',()=>{const{fixture}=setup();const c=fixture.componentInstance;c.form.patchValue({providerReference:'SCPR-ONE'});c.form.controls.payoutAccountReference.setValue('SC-PACCT-ONE');c.form.controls.currency.setValue('USD');expect(c.form.controls.payoutAccountReference.value).toBe('');c.form.controls.settlementMethod.setValue('MANUAL_OTHER');fixture.detectChanges();expect(fixture.nativeElement.textContent).not.toContain('Payout destination (optional)')});
 it('reloads options and clears a stale destination conflict',()=>{const{fixture,accounts}=setup(()=>throwError(()=>({status:409})));const c=fixture.componentInstance;vi.spyOn(globalThis,'confirm').mockReturnValue(true);c.form.patchValue({providerReference:'SCPR-ONE'});c.loadEligible(1,true);c.toggle(earning);c.form.controls.payoutAccountReference.setValue('SC-PACCT-ONE');const before=accounts.adminList.mock.calls.length;c.create();expect(c.createError()).toContain('no longer available');expect(c.form.controls.payoutAccountReference.value).toBe('');expect(accounts.adminList.mock.calls.length).toBeGreaterThan(before)});
});
