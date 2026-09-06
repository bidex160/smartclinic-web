import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DependantsApiService } from '../../core/services/dependants-api.service';
import { FamilyDependantsPageComponent } from './family-dependants-page.component';

describe('FamilyDependantsPageComponent', () => {
  const dependant = {
    patientReference: 'SCP-AB12-CD34',
    firstName: 'Aisha',
    lastName: 'Okafor',
    displayName: 'Aisha Okafor',
    dateOfBirth: '2015-06-12',
    countryCode: 'NG',
    stateOrRegion: 'Lagos',
    city: 'Ikeja',
    relationship: { type: 'MOTHER' as const, role: 'GUARDIAN', isPrimary: true },
  };
  it('renders dependant identity and guardian relationship semantics', async () => {
    await TestBed.configureTestingModule({
      imports: [FamilyDependantsPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: DependantsApiService,
          useValue: { getDependants: () => of({ items: [dependant] }) },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(FamilyDependantsPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Aisha Okafor');
    expect(fixture.nativeElement.textContent).toContain('You are their mother');
    expect(fixture.nativeElement.textContent).not.toContain('Aisha — Mother');
  });
  it('submits canonical geography and updates the list without contact fields', async () => {
    const createDependant = vi.fn((_payload: unknown) => of(dependant));
    await TestBed.configureTestingModule({
      imports: [FamilyDependantsPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: DependantsApiService,
          useValue: { getDependants: () => of({ items: [] }), createDependant },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(FamilyDependantsPageComponent),
      component = fixture.componentInstance;
    component.form.setValue({
      firstName: ' Aisha ',
      lastName: ' Okafor ',
      dateOfBirth: '2015-06-12',
      relationshipType: 'MOTHER',
      countryCode: 'NG',
      stateOrRegion: 'Lagos',
      city: 'Ikeja',
    });
    component.submit();
    expect(createDependant).toHaveBeenCalledWith({
      firstName: 'Aisha',
      lastName: 'Okafor',
      dateOfBirth: '2015-06-12',
      relationshipType: 'MOTHER',
      countryCode: 'NG',
      stateOrRegion: 'Lagos',
      city: 'Ikeja',
    });
    expect(JSON.stringify(createDependant.mock.calls[0][0])).not.toMatch(/email|phone|password/);
    expect(component.dependants()).toEqual([dependant]);
  });
  it('resets dependent geography and surfaces failures', async () => {
    await TestBed.configureTestingModule({
      imports: [FamilyDependantsPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: DependantsApiService,
          useValue: {
            getDependants: () => of({ items: [] }),
            createDependant: () => throwError(() => new Error('bad')),
          },
        },
      ],
    }).compileComponents();
    const component = TestBed.createComponent(FamilyDependantsPageComponent).componentInstance;
    component.form.patchValue({ countryCode: 'NG', stateOrRegion: 'Lagos', city: 'Ikeja' });
    component.countryChanged();
    expect(component.form.controls.stateOrRegion.value).toBe('');
    expect(component.form.controls.city.value).toBe('');
    component.form.patchValue({ stateOrRegion: 'Lagos', city: 'Ikeja' });
    component.stateChanged();
    expect(component.form.controls.city.value).toBe('');
    component.form.setValue({
      firstName: 'Aisha',
      lastName: 'Okafor',
      dateOfBirth: '2015-06-12',
      relationshipType: 'MOTHER',
      countryCode: 'NG',
      stateOrRegion: 'Lagos',
      city: 'Ikeja',
    });
    component.submit();
    expect(component.saveError()).toContain('could not be added');
  });
});
