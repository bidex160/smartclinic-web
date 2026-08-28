import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { FastTrackApiService } from '../../core/services/fasttrack-api.service';
import { FindCareApiService } from '../../core/services/find-care-api.service';
import { ExternalFastTrackPageComponent } from './external-fasttrack-page.component';

describe('ExternalFastTrackPageComponent', () => {
  it('shows only backend FastTrack offerings and submits references without a fee', async () => {
    const provider = {providerReference:'SCPR-ABCDEF0123456789',displayName:'Dynamic Clinic',providerType:'CLINIC',location:{city:'Ibadan',stateOrRegion:'Oyo',countryCode:'NG'},locations:[],services:[{code:'DENTAL',name:'Dental care',description:null,deliveryOptions:[{deliveryMode:'IN_PERSON',priceMinor:1000000,currency:'NGN'}],supportsAppointmentRequests:true,supportsFastTrack:true,fastTrackFeeMinor:5000,fastTrackCurrency:'NGN'},{code:'GENERAL',name:'General consultation',description:null,deliveryOptions:[{deliveryMode:'IN_PERSON',priceMinor:0,currency:'NGN'}],supportsAppointmentRequests:true,supportsFastTrack:false,fastTrackFeeMinor:null,fastTrackCurrency:null}]};
    const find={getProviders:vi.fn(()=>of({items:[provider],page:1,limit:50,total:1,totalPages:1}))};
    const fast={createExternal:vi.fn(()=>of({reference:'SC-FT-ABCDEF0123456789'}))};
    await TestBed.configureTestingModule({imports:[ExternalFastTrackPageComponent],providers:[provideRouter([]),{provide:FindCareApiService,useValue:find},{provide:FastTrackApiService,useValue:fast}]}).compileComponents();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture=TestBed.createComponent(ExternalFastTrackPageComponent);const c=fixture.componentInstance;c.form.patchValue({countryCode:'NG',stateOrRegion:'Oyo',city:'Ibadan'});c.loadProviders();c.form.patchValue({providerReference:provider.providerReference,serviceCode:'DENTAL',externalAppointmentReference:'APT-1',appointmentDate:'2026-09-01'});fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Dental care');expect(fixture.nativeElement.textContent).not.toContain('General consultation');c.submit();expect(fast.createExternal).toHaveBeenCalledWith(expect.objectContaining({providerReference:provider.providerReference,serviceCode:'DENTAL'}));expect(fast.createExternal).not.toHaveBeenCalledWith(expect.objectContaining({feeMinor:expect.anything()}));
  });
});
