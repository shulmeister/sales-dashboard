import { fetchUtils } from 'react-admin';

const apiUrl = import.meta.env.VITE_API_URL || '/api';

const httpClient = (url, options = {}) => {
  if (!options.headers) {
    options.headers = new Headers({ Accept: 'application/json' });
  }
  options.credentials = 'include'; // Important for session cookies
  return fetchUtils.fetchJson(url, options);
};

// Map React Admin requests to your FastAPI backend
const dataProvider = {
  getList: async (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;
    const query = {
      ...fetchUtils.flattenObject(params.filter),
      _sort: field,
      _order: order,
      _start: (page - 1) * perPage,
      _end: page * perPage,
    };

    // Map resource names to API endpoints
    const resourceMap = {
      deals: 'pipeline/leads',
      contacts: 'contacts',
      companies: 'pipeline/referral-sources',
      tasks: 'pipeline/tasks',
    };

    const endpoint = resourceMap[resource] || resource;
    const url = `${apiUrl}/${endpoint}?${new URLSearchParams(query)}`;

    const { json } = await httpClient(url);
    
    return {
      data: json.map(item => ({ ...item, id: item.id })),
      total: json.length, // Your API should return total count
    };
  },

  getOne: async (resource, params) => {
    const resourceMap = {
      deals: 'pipeline/leads',
      contacts: 'contacts',
      companies: 'pipeline/referral-sources',
      tasks: 'pipeline/tasks',
    };
    
    const endpoint = resourceMap[resource] || resource;
    const url = `${apiUrl}/${endpoint}/${params.id}`;
    const { json } = await httpClient(url);
    
    return { data: json };
  },

  getMany: async (resource, params) => {
    const resourceMap = {
      deals: 'pipeline/leads',
      contacts: 'contacts',
      companies: 'pipeline/referral-sources',
      tasks: 'pipeline/tasks',
    };
    
    const endpoint = resourceMap[resource] || resource;
    const query = {
      ids: JSON.stringify(params.ids),
    };
    const url = `${apiUrl}/${endpoint}?${new URLSearchParams(query)}`;
    const { json } = await httpClient(url);
    
    return { data: json };
  },

  getManyReference: async (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;
    const query = {
      ...fetchUtils.flattenObject(params.filter),
      [params.target]: params.id,
      _sort: field,
      _order: order,
      _start: (page - 1) * perPage,
      _end: page * perPage,
    };

    const resourceMap = {
      deals: 'pipeline/leads',
      contacts: 'contacts',
      companies: 'pipeline/referral-sources',
      tasks: 'pipeline/tasks',
    };
    
    const endpoint = resourceMap[resource] || resource;
    const url = `${apiUrl}/${endpoint}?${new URLSearchParams(query)}`;
    const { json } = await httpClient(url);

    return {
      data: json,
      total: json.length,
    };
  },

  create: async (resource, params) => {
    const resourceMap = {
      deals: 'pipeline/leads',
      contacts: 'contacts',
      companies: 'pipeline/referral-sources',
      tasks: 'pipeline/tasks',
    };
    
    const endpoint = resourceMap[resource] || resource;
    const { json } = await httpClient(`${apiUrl}/${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(params.data),
    });
    
    return { data: { ...params.data, id: json.id || json.lead?.id } };
  },

  update: async (resource, params) => {
    const resourceMap = {
      deals: 'pipeline/leads',
      contacts: 'contacts',
      companies: 'pipeline/referral-sources',
      tasks: 'pipeline/tasks',
    };
    
    const endpoint = resourceMap[resource] || resource;
    const { json } = await httpClient(`${apiUrl}/${endpoint}/${params.id}`, {
      method: 'PUT',
      body: JSON.stringify(params.data),
    });
    
    return { data: json };
  },

  updateMany: async (resource, params) => {
    const results = await Promise.all(
      params.ids.map(id =>
        httpClient(`${apiUrl}/${resource}/${id}`, {
          method: 'PUT',
          body: JSON.stringify(params.data),
        })
      )
    );
    return { data: params.ids };
  },

  delete: async (resource, params) => {
    const resourceMap = {
      deals: 'pipeline/leads',
      contacts: 'contacts',
      companies: 'pipeline/referral-sources',
      tasks: 'pipeline/tasks',
    };
    
    const endpoint = resourceMap[resource] || resource;
    await httpClient(`${apiUrl}/${endpoint}/${params.id}`, {
      method: 'DELETE',
    });
    
    return { data: params.previousData };
  },

  deleteMany: async (resource, params) => {
    await Promise.all(
      params.ids.map(id =>
        httpClient(`${apiUrl}/${resource}/${id}`, {
          method: 'DELETE',
        })
      )
    );
    return { data: params.ids };
  },
};

export default dataProvider;

