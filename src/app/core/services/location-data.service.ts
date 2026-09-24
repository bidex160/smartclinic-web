import { inject, Injectable } from '@angular/core';
import { Country, ICountry, IState, ICity } from 'country-state-city';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

type NigeriaState = { name: string; cities: string[] };
type NigeriaLocationCache = { states: NigeriaState[] };

@Injectable({ providedIn: 'root' })
export class LocationDataService {
  private readonly http = inject(HttpClient);
  private readonly sourceUrl = 'data/state-cities.json'; // 'data/state-cities.json' if using public/

  private data: NigeriaLocationCache = { states: [] };
  private loading: Promise<NigeriaLocationCache> | null = null;

  constructor() {
    // Clear the old cache so it stops eating storage on low-space phones
    try {
      localStorage.removeItem('nigeria_states_cities');
      localStorage.removeItem('nigeria_states_cities_time');
    } catch {}
  }

  getCountries(): ICountry[] {
    return Country.getAllCountries().filter((country) => country.isoCode === 'NG');
  }

  async getStatesApi(): Promise<NigeriaLocationCache[]> {
    return [await this.ensureNigeriaLocations()];
  }

  async ready(): Promise<void> {
    await this.ensureNigeriaLocations();
  }

  getStates(countryCode: string): IState[] {
    if (countryCode !== 'NG' || !this.data) return [];
    return this.data.states?.map((state) => ({
      name: state.name,
      isoCode: state.name,
      countryCode: 'NG',
    }));
  }

  getCities(countryCode: string, stateCode: string): ICity[] {
    if (countryCode !== 'NG' || !stateCode) return [];
    const state = this.data.states.find((item) => item.name === stateCode);
    return (state?.cities ?? []).map((name) => ({
      name,
      stateCode,
      countryCode: 'NG',
    }));
  }

  private ensureNigeriaLocations(): Promise<NigeriaLocationCache> {
    if (this.data.states.length) return Promise.resolve(this.data);
    if (this.loading) return this.loading;

    this.loading = lastValueFrom(this.http.get<NigeriaState[]>(this.sourceUrl))
      .then((data) => {
         const formatted: NigeriaLocationCache = {
          states: data.map((state: any) => ({
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
         this.data = formatted;
        return this.data;
      })
      .finally(() => {
        this.loading = null;
      });

    return this.loading;
  }
}