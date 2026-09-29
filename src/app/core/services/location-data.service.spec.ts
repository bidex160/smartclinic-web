import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { LocationDataService } from './location-data.service';

describe('LocationDataService supported markets', () => {
  it('exposes Nigeria and Rwanda with Rwanda provinces and cities from the bundled country data', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    const service = TestBed.inject(LocationDataService);

    expect(service.getCountries().map(country => country.isoCode)).toEqual(['NG', 'RW']);
    const provinces = service.getStates('RW');
    expect(provinces.length).toBeGreaterThan(0);
    const kigali = provinces.find(province => province.name.toLowerCase().includes('kigali'));
    expect(kigali).toBeTruthy();
    expect(service.getCities('RW', kigali!.isoCode).length).toBeGreaterThan(0);
  });
});
