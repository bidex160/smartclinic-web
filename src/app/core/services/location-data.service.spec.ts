import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LocationDataService } from './location-data.service';

describe('LocationDataService supported markets', () => {
  it('exposes Nigeria and Rwanda with Rwanda provinces and cities from the bundled country data', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    const service = TestBed.inject(LocationDataService);

    expect(service.getCountries().map(country => country.isoCode)).toEqual(['GH', 'NG', 'RW']);
    const provinces = service.getStates('RW');
    expect(provinces.length).toBeGreaterThan(0);
    const kigali = provinces.find(province => province.name.toLowerCase().includes('kigali'));
    expect(kigali).toBeTruthy();
    expect(service.getCities('RW', kigali!.isoCode).length).toBeGreaterThan(0);
  });
});

describe('LocationDataService Ghana', () => {
  it('lists Ghana’s 16 regions with their capitals first', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(LocationDataService);
    const regions = service.getStates('GH');
    expect(regions).toHaveLength(16);
    expect(service.getCities('GH', 'Greater Accra')[0].name).toBe('Accra');
    expect(service.getCities('GH', 'Ashanti')[0].name).toBe('Kumasi');
    expect(service.getCities('GH', 'Northern')[0].name).toBe('Tamale');
  });
});
