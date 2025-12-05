import type { DataProvider } from "ra-core";

// Supabase removed entirely. Provide a no-op data provider to avoid any Supabase calls.
const dataProvider: DataProvider = {
  getList: async () => ({ data: [], total: 0 }),
  getOne: async () => ({ data: {}, total: 0 }),
  getMany: async () => ({ data: [] }),
  getManyReference: async () => ({ data: [], total: 0 }),
  create: async () => ({ data: {} }),
  update: async () => ({ data: {} }),
  updateMany: async () => ({ data: [] }),
  delete: async () => ({ data: {} }),
  deleteMany: async () => ({ data: [] }),
};

export type CrmDataProvider = typeof dataProvider;
export { dataProvider };
