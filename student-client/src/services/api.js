import axios from 'axios';
import { USER_SERVICE_URL, PRODUCT_SERVICE_URL, ORDER_SERVICE_URL } from '../config';

const userApi = axios.create({
  baseURL: USER_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' }
});

const productApi = axios.create({
  baseURL: PRODUCT_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' }
});

const orderApi = axios.create({
  baseURL: ORDER_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' }
});

const handleApiError = (error, serviceName) => {
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || error.response.data?.error;

    if (status === 503) {
      return message || `${serviceName} is unavailable (503).`;
    }
    if (status === 404) {
      return message || 'Resource not found (404).';
    }
    if (status === 400) {
      return message || 'Invalid request data (400).';
    }
    return message || `Error from ${serviceName} (${status}).`;
  }
  return `Unable to connect to ${serviceName}. Please verify the service is running.`;
};

// ================= USER SERVICE API (Port 3001) =================
export const getUsers = async () => {
  try {
    const response = await userApi.get('/users');
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'User Service');
  }
};

export const getUserById = async (id) => {
  try {
    const response = await userApi.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'User Service');
  }
};

export const createUser = async (userData) => {
  try {
    const response = await userApi.post('/users', userData);
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'User Service');
  }
};

export const updateUser = async (id, userData) => {
  try {
    const response = await userApi.put(`/users/${id}`, userData);
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'User Service');
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await userApi.delete(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'User Service');
  }
};

// Aliases for compatibility
export const getStudents = getUsers;
export const createStudent = createUser;
export const updateStudent = updateUser;
export const deleteStudent = deleteUser;

// ================= PRODUCT SERVICE API (Port 3002) =================
export const getProducts = async () => {
  try {
    const response = await productApi.get('/products');
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Product Service');
  }
};

export const getProductById = async (id) => {
  try {
    const response = await productApi.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Product Service');
  }
};

export const createProduct = async (productData) => {
  try {
    const response = await productApi.post('/products', productData);
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Product Service');
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const response = await productApi.put(`/products/${id}`, productData);
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Product Service');
  }
};

export const deleteProduct = async (id) => {
  try {
    const response = await productApi.delete(`/products/${id}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Product Service');
  }
};

// ================= ORDER SERVICE API (Port 3003) =================
export const getOrders = async () => {
  try {
    const response = await orderApi.get('/orders');
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Order Service');
  }
};

export const getOrderById = async (id) => {
  try {
    const response = await orderApi.get(`/orders/${id}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Order Service');
  }
};

export const createOrder = async (orderData) => {
  try {
    const response = await orderApi.post('/orders', orderData);
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Order Service');
  }
};
