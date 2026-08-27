import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ReferralSummary } from '../../core/models/referral.model';
import { ReferralsApiService } from '../../core/services/referrals-api.service';
import { RewardWithdrawalsApiService } from '../../core/services/reward-withdrawals-api.service';
import { ReferralsPageComponent } from './referrals-page.component';

describe('ReferralsPageComponent', () => {
  it('renders the backend next level and authoritative requirements for a member with no level', async () => {
    const fixture = await setup(summary()); fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('No level achieved yet'); expect(text).toContain('Start your referral journey'); expect(text).toContain('Working toward Level 1'); expect(text).toContain('7 remaining');
  });

  it('renders generic mid-level progression and qualified counts', async () => {
    const value = summary({ currentLevel: { code:'LEVEL_2',name:'Level 2',ordinal:2 }, nextLevel:{code:'LEVEL_3',name:'Level 3',ordinal:3}, highestLevelAchieved:2, requirements:[{targetType:'PATIENT',qualified:22,required:30,remaining:8,completed:false},{targetType:'CLINIC',qualified:6,required:6,remaining:0,completed:true}], highestConfiguredLevelReached:false, qualifiedCounts:{PATIENT:22,CLINIC:6,LABORATORY:4,PHARMACY:3} });
    const fixture = await setup(value); fixture.detectChanges(); const text=fixture.nativeElement.textContent as string;
    expect(text).toContain('Level 2 achieved'); expect(text).toContain('Working toward Level 3'); expect(text).toContain('22 / 30'); expect(text).toContain('✓ Completed'); expect(text).toContain('Qualified direct referrals');
  });

  it('renders the highest configured level without another requirements card', async () => {
    const value = summary({ currentLevel:{code:'LEVEL_5',name:'Level 5',ordinal:5},nextLevel:null,highestLevelAchieved:5,requirements:[],highestConfiguredLevelReached:true,qualifiedCounts:{PATIENT:100,CLINIC:20,LABORATORY:20,PHARMACY:20} });
    const fixture=await setup(value);fixture.detectChanges();const text=fixture.nativeElement.textContent as string;
    expect(text).toContain('Level 5 achieved');expect(text).toContain('Highest referral level achieved');expect(text).not.toContain('Working toward');
  });

  it('preserves balances, withdrawal, and target-aware invite links', async () => {
    const writeText=vi.fn().mockResolvedValue(undefined);Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText}});const value=summary();const fixture=await setup(value);fixture.detectChanges();const text=fixture.nativeElement.textContent as string;expect(text).toContain('Reserved');expect(text).toContain('Request cash withdrawal');expect(text).toContain('Invite a Laboratory');await fixture.componentInstance.copyLink('LABORATORY');expect(writeText).toHaveBeenCalledWith(new URL(value.links.LABORATORY,window.location.origin).toString());
  });
});

function summary(levelProgress: ReferralSummary['levelProgress'] = { currentLevel:null,nextLevel:{code:'LEVEL_1',name:'Level 1',ordinal:1},highestLevelAchieved:0,requirements:[{targetType:'PATIENT',qualified:3,required:10,remaining:7,completed:false}],highestConfiguredLevelReached:false,qualifiedCounts:{PATIENT:3,CLINIC:1,LABORATORY:0,PHARMACY:0} }): ReferralSummary { return { referralCode:'SC-ABC123',links:{PATIENT:'/register?ref=SC-ABC123',CLINIC:'/provider/register?ref=SC-ABC123&type=CLINIC',LABORATORY:'/provider/register?ref=SC-ABC123&type=LABORATORY',PHARMACY:'/provider/register?ref=SC-ABC123&type=PHARMACY'},availablePoints:340,reservedPoints:60,lifetimeEarnedPoints:500,lifetimeRedeemedPoints:100,levelProgress,currentLevel:null,nextLevel:null,progress:{patients:{qualified:0,required:0},clinics:{qualified:0,required:0},laboratories:{qualified:0,required:0},pharmacies:{qualified:0,required:0}},completed:false,registeredDirectReferrals:10,qualifiedDirectReferrals:7 }; }
async function setup(value:ReferralSummary){await TestBed.configureTestingModule({imports:[ReferralsPageComponent],providers:[{provide:ReferralsApiService,useValue:{summary:()=>of(value),history:()=>of({items:[],page:1,limit:20,total:0,totalPages:0})}},{provide:RewardWithdrawalsApiService,useValue:{listMine:()=>of({items:[],page:1,limit:20,total:0,totalPages:0})}}]}).compileComponents();return TestBed.createComponent(ReferralsPageComponent);}
