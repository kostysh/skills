// From plugin-multi-tenant
export const multiTenantPlugin =
  (pluginOptions) =>
  (config) => ({
    ...config,
    collections: (config.collections || []).map((collection) => {
      if (!pluginOptions.collections.includes(collection.slug)) {
        return collection
      }

      return {
        ...collection,
        access: {
          ...collection.access,
          read: ({ req }) => {
            // Inject tenant filter
            return {
              and: [
                collection.access?.read ? collection.access.read({ req }) : {},
                { tenant: { equals: req.user?.tenant } },
              ],
            }
          },
        },
      }
    }),
  })
