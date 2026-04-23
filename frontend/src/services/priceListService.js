/**
 * Price List Service — Uses centralized apiClient
 */
import apiClient from './apiClient';

const getPriceList = async () => {
  const response = await apiClient.get('/price-list');
  return response.data.data;
};

const updateItem = async (id, data) => {
  const response = await apiClient.put(`/price-list/${id}`, data);
  return response.data;
};

const saleItem = async (id, quantity) => {
  const response = await apiClient.post(`/price-list/${id}/sale`, { quantity });
  return response.data;
};

const restockItem = async (id, quantity) => {
  const response = await apiClient.post(`/price-list/${id}/restock`, { quantity });
  return response.data;
};

export default {
  getPriceList,
  updateItem,
  saleItem,
  restockItem,
};
