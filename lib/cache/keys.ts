export const CACHE_KEYS = {
  updates: 'rbe:updates',
  clientPropertiesAvailable: 'rbe:client:properties:available',
  clientAdvisorsActive: 'rbe:client:advisors:active',
  adminOverview: 'rbe:admin:overview',
  clientPropertyById: (id: string) => `rbe:client:property:${id}`,
};
