import { inject, Injectable } from '@angular/core';
import {
  Country,
  State,
  City,
  ICountry,
  IState,
  ICity,
} from 'country-state-city';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LocationDataService {
    private readonly http = inject(HttpClient);
  getCountries(): ICountry[] {
    return Country.getAllCountries().filter((country) => country.isoCode === 'NG');
  }

async getStatesApi() {
  const CACHE_KEY = 'nigeria_states_cities';
  const CACHE_TIME_KEY = 'nigeria_states_cities_time';
  const TWENTY_FOUR_HRS = 24 * 60 * 60 * 1000;

  const cached = localStorage.getItem(CACHE_KEY);
  const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

  if (cached && cachedTime) {
    const isExpired = Date.now() - Number(cachedTime) > TWENTY_FOUR_HRS;
    if (!isExpired) {
      return JSON.parse(cached);
    }
  }

  const data: any[] = await lastValueFrom(
    this.http.get<any[]>('https://temikeezy.github.io/nigeria-geojson-data/data/full.json')
  );

  // 1. FORMAT first
  const formatted = [
    {
      states: data.map(s => ({
        name: s.state,
        cities: [...new Set(
  s.lgas.flatMap((lga: any) => [
    lga.name,
    ...lga.wards.map((w: any) => w.name)
  ])
)].sort()
      }))
    }
  ];

  // 2. THEN CACHE the formatted result
  localStorage.setItem(CACHE_KEY, JSON.stringify(formatted));
  localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());

  return formatted;
}
getStates(countryCode: string): IState[] {
  if (!countryCode || countryCode!== 'NG') {
    return [];
  }

  const CACHE_KEY = 'nigeria_states_cities';
  const cached = localStorage.getItem(CACHE_KEY);

  if (!cached) {
    return State.getStatesOfCountry(countryCode).map((state) => ({
      ...state,
      isoCode: state.name,
    }));
  }

  const parsed = JSON.parse(cached);
  // handle both formats: { states: [...] } or [{ states: [...] }]
  const statesArray = parsed.states || parsed[0]?.states || [];

  return statesArray.map((state: any) => ({
    name: state.name,
    isoCode: state.name,
    countryCode: 'NG',
  }));
}
 getCities(countryCode: string, stateCode: string): ICity[] {
  if (!countryCode ||!stateCode) {
    return [];
  }

  const CACHE_KEY = 'nigeria_states_cities';
  const cached = localStorage.getItem(CACHE_KEY);

  if (!cached) {
    const state = State.getStatesOfCountry(countryCode).find(
      (item) => item.name === stateCode || item.isoCode === stateCode,
    );
    if (!state) {
      return [];
    }
    return City.getCitiesOfState(countryCode, state.isoCode).map((city) => ({
      ...city,
      stateCode: state.name,
    }));
  }

  const parsed = JSON.parse(cached);
  const statesArray = parsed.states || parsed[0]?.states || [];

  const state = statesArray.find((s: any) => s.name === stateCode);

  return state?.cities.map((city: any) => ({
    name: typeof city === 'string'? city : city.name,
    stateCode: stateCode,
    countryCode: countryCode,
  }))?? [];
}
}