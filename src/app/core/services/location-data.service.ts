import { inject, Injectable } from '@angular/core';
import { Country, ICountry, IState, ICity } from 'country-state-city';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

type NigeriaLocationCache = { states: Array<{ name: string; cities: string[] }> };

const FCT_COMMON_AREAS = ['Asokoro', 'Dawaki', 'Jabi', 'Karsana', 'Life Camp', 'Wuye'];

@Injectable({ providedIn: 'root' })
export class LocationDataService {
  private readonly http = inject(HttpClient);
  private readonly cacheKey = 'nigeria_states_cities';
  private readonly cacheTimeKey = 'nigeria_states_cities_time';
  private readonly cacheTtlMs = 24 * 60 * 60 * 1000;
  private loading: Promise<NigeriaLocationCache> | null = null;

  getCountries(): ICountry[] {
    return Country.getAllCountries().filter((country) => country.isoCode === 'NG');
  }

  async getStatesApi(): Promise<NigeriaLocationCache[]> {
    const data = await this.ensureNigeriaLocations();
    return [data];
  }

  async ready(): Promise<void> {
    await this.ensureNigeriaLocations();
  }

  getStates(countryCode: string): IState[] {
    if (countryCode !== 'NG') return [];
    return this.readCache().states.map((state) => ({
      name: state.name,
      isoCode: state.name,
      countryCode: 'NG',
    }));
  }

  getCities(countryCode: string, stateCode: string): ICity[] {
    if (countryCode !== 'NG' || !stateCode) return [];
    const state = this.readCache().states.find((item) => item.name === stateCode);
    return (state?.cities ?? []).map((name) => ({
      name,
      stateCode,
      countryCode: 'NG',
    }));
  }

  private ensureNigeriaLocations(): Promise<NigeriaLocationCache> {
    const cached = this.readFreshCache();
    if (cached) return Promise.resolve(cached);
    if (this.loading) return this.loading;

    this.loading = lastValueFrom(
      this.http.get<any[]>('https://temikeezy.github.io/nigeria-geojson-data/data/full.json'),
    )
      .then((data) => {
        const formatted: NigeriaLocationCache = {
          states: data.map((state) => ({
            name: state.state,
            cities: [
              ...new Set<string>(
                state.lgas.flatMap((lga: any) => [
                  lga.name,
                  ...(lga.wards ?? []).map((ward: any) => ward.name),
                ]),
              ),
            ].sort(),
          })),
        };
        const augmented = this.withFctCommonAreas(formatted);
        this.writeCache(augmented);
        return augmented;
      })
      .finally(() => {
        this.loading = null;
      });

    return this.loading;
  }

  private readFreshCache(): NigeriaLocationCache | null {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      const cachedTime = localStorage.getItem(this.cacheTimeKey);
      if (!cached || !cachedTime) return null;
      if (Date.now() - Number(cachedTime) > this.cacheTtlMs) return null;
      return this.parseCache(cached);
    } catch {
      return null;
    }
  }

  private readCache(): NigeriaLocationCache {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      return cached ? this.parseCache(cached) : { states: [] };
    } catch {
      return { states: [] };
    }
  }

  private parseCache(value: string): NigeriaLocationCache {
    try {
      const parsed = JSON.parse(value);
      const states = parsed?.states ?? parsed?.[0]?.states;
      return Array.isArray(states) ? this.withFctCommonAreas({ states }) : { states: [] };
    } catch {
      return { states: [] };
    }
  }

  private withFctCommonAreas(value: NigeriaLocationCache): NigeriaLocationCache {
    return {
      states: value.states.map((state) => {
        const normalized = state.name.trim().toUpperCase();
        if (normalized !== 'FCT' && normalized !== 'FEDERAL CAPITAL TERRITORY') return state;
        return { ...state, cities: [...new Set([...state.cities, ...FCT_COMMON_AREAS])].sort() };
      }),
    };
  }

  private writeCache(value: NigeriaLocationCache): void {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify([value]));
      localStorage.setItem(this.cacheTimeKey, Date.now().toString());
    } catch {
      // Location data still remains available to the awaiting caller for this session.
    }
  }
}
