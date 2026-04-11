import api from './axios';

export const getSites = (params) => api.get('/sites', { params });
export const getSiteById = (id) => api.get(`/sites/${id}`);
export const createSite = (data) => api.post('/sites', data);
export const updateSite = (id, data) => api.put(`/sites/${id}`, data);
export const deleteSite = (id) => api.delete(`/sites/${id}`);
