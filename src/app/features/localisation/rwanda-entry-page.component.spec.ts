import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { RwandaEntryPageComponent } from './rwanda-entry-page.component';

describe('RwandaEntryPageComponent', () => {
  it('keeps Rwanda as an entry context for the same SmartClinic identity', async () => {
    await TestBed.configureTestingModule({
      imports: [RwandaEntryPageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ lang: 'rw' }) } } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(RwandaEntryPageComponent); fixture.detectChanges();

    expect(fixture.componentInstance.locale()).toBe('rw');
    expect(fixture.nativeElement.textContent).toContain('konti imwe ya SmartClinic');
    const links = [...fixture.nativeElement.querySelectorAll('a[href^="/login"],a[href^="/register"],a[href^="/provider/register"]')];
    expect(links.map((link: Element) => link.getAttribute('href'))).toEqual([
      '/login?market=RW&lang=rw', '/register?market=RW&lang=rw', '/provider/register?market=RW&lang=rw',
    ]);
  });
});
