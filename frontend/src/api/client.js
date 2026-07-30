// ============================================================
// api/client.js
// ============================================================
// รวมทุกการเรียก API ไว้ที่เดียว เพื่อไม่ให้ต้องเขียน axios.get(...) กระจัดกระจาย
// ทุกหน้าจอ (page) แค่ import ฟังก์ชันจากไฟล์นี้ไปเรียกใช้
// ============================================================
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// "Interceptor" คือฟังก์ชันที่แอบแทรกตัวเองก่อน request ทุกอันจะถูกส่งออกไป
// ที่นี่เราใช้มันแนบ token (ที่เก็บไว้ตอน login) ติดไปกับทุก request อัตโนมัติ
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ถ้า token หมดอายุ (เซิร์ฟเวอร์ตอบ 401) ให้เตะกลับไปหน้า login อัตโนมัติ
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ---- Auth ----

// ---- Categories ----
export const getCategories = () => api.get('/categories').then((r) => r.data);
export const createCategory = (data) => api.post('/categories', data).then((r) => r.data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// ---- Transactions ----
export const getTransactions = (params) => api.get('/transactions', { params }).then((r) => r.data);
export const createTransaction = (data) => api.post('/transactions', data).then((r) => r.data);
export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data).then((r) => r.data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);

// ---- Budgets ----
export const getBudgets = (month) => api.get('/budgets', { params: { month } }).then((r) => r.data);
export const upsertBudget = (data) => api.post('/budgets', data).then((r) => r.data);
export const deleteBudget = (id) => api.delete(`/budgets/${id}`);

// ---- Subscriptions ----
export const getSubscriptions = () => api.get('/subscriptions').then((r) => r.data);
export const createSubscription = (data) => api.post('/subscriptions', data).then((r) => r.data);
export const updateSubscription = (id, data) => api.put(`/subscriptions/${id}`, data).then((r) => r.data);
export const deleteSubscription = (id) => api.delete(`/subscriptions/${id}`);

// ---- Recurring Bills ----
export const getBills = () => api.get('/bills').then((r) => r.data);
export const createBill = (data) => api.post('/bills', data).then((r) => r.data);
export const updateBill = (id, data) => api.put(`/bills/${id}`, data).then((r) => r.data);
export const deleteBill = (id) => api.delete(`/bills/${id}`);

// ---- Investments ----
export const getInvestments = () => api.get('/investments').then((r) => r.data);
export const createInvestment = (data) => api.post('/investments', data).then((r) => r.data);
export const updateInvestmentValue = (id, currentValue) =>
  api.patch(`/investments/${id}/value`, { currentValue }).then((r) => r.data);
export const deleteInvestment = (id) => api.delete(`/investments/${id}`);

// ---- Goals ----
export const getGoals = () => api.get('/goals').then((r) => r.data);
export const createGoal = (data) => api.post('/goals', data).then((r) => r.data);
export const contributeToGoal = (id, amount) =>
  api.patch(`/goals/${id}/contribute`, { amount }).then((r) => r.data);
export const deleteGoal = (id) => api.delete(`/goals/${id}`);

// ---- Analytics ----
export const getSummary = (month) => api.get('/analytics/summary', { params: { month } }).then((r) => r.data);
export const getSpendingByCategory = (month) =>
  api.get('/analytics/spending-by-category', { params: { month } }).then((r) => r.data);
export const getMonthlyTrend = (months) =>
  api.get('/analytics/monthly-trend', { params: { months } }).then((r) => r.data);
export const getUpcoming = () => api.get('/analytics/upcoming').then((r) => r.data);

export default api;
