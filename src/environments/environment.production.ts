// environment.production.ts
export const environment = {
  production: true,
  api: {
    baseUrl: 'https://staging-api.smartclinicnetwork.com/api/v1',
  },
  publicSite: { whatsappUrl: null },
} as const;
