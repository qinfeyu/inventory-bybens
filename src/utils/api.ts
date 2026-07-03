import { Product, Sale, Expense, ExchangeRates, CapitalAllocation, CapitalPoolOverride, Customer, PreOrder, User } from '../types';

const API_BASE = '/api';

// Override global fetch inside this module to automatically attach the Authorization token
const originalFetch = window.fetch;
const fetchWrapper = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const token = localStorage.getItem('poty_auth_token');
  const headers = {
    ...init?.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  return originalFetch(input, { ...init, headers });
};
const fetch = fetchWrapper;

// Helper to handle fetch responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP error! Status: ${response.status}`);
  }
  return response.json();
};

export const api = {
  // 1. Products API
  getProducts: (): Promise<Product[]> => 
    fetch(`${API_BASE}/products`).then(handleResponse),

  createProduct: (product: Product): Promise<Product> => 
    fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    }).then(handleResponse),

  createProductsBulk: (products: Product[]): Promise<Product[]> => 
    fetch(`${API_BASE}/products/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(products)
    }).then(handleResponse),

  updateProduct: (product: Product): Promise<Product> => 
    fetch(`${API_BASE}/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    }).then(handleResponse),

  deleteProduct: (id: string): Promise<{ success: boolean }> => 
    fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE'
    }).then(handleResponse),

  // 2. Customers API
  getCustomers: (): Promise<Customer[]> => 
    fetch(`${API_BASE}/customers`).then(handleResponse),

  createCustomer: (customer: Customer): Promise<Customer> => 
    fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer)
    }).then(handleResponse),

  updateCustomer: (customer: Customer): Promise<Customer> => 
    fetch(`${API_BASE}/customers/${customer.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer)
    }).then(handleResponse),

  deleteCustomer: (id: string): Promise<{ success: boolean }> => 
    fetch(`${API_BASE}/customers/${id}`, {
      method: 'DELETE'
    }).then(handleResponse),

  // 3. Sales API
  getSales: (): Promise<Sale[]> => 
    fetch(`${API_BASE}/sales`).then(handleResponse),

  createSale: (sale: Sale): Promise<Sale> => 
    fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sale)
    }).then(handleResponse),

  deleteSale: (id: string): Promise<{ success: boolean }> => 
    fetch(`${API_BASE}/sales/${id}`, {
      method: 'DELETE'
    }).then(handleResponse),

  // 4. Pre-Orders API
  getPreOrders: (): Promise<PreOrder[]> => 
    fetch(`${API_BASE}/preorders`).then(handleResponse),

  createPreOrder: (preOrder: PreOrder): Promise<PreOrder> => 
    fetch(`${API_BASE}/preorders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preOrder)
    }).then(handleResponse),

  updatePreOrder: (preOrder: PreOrder): Promise<PreOrder> => 
    fetch(`${API_BASE}/preorders/${preOrder.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preOrder)
    }).then(handleResponse),

  deletePreOrder: (id: string): Promise<{ success: boolean }> => 
    fetch(`${API_BASE}/preorders/${id}`, {
      method: 'DELETE'
    }).then(handleResponse),

  // 5. Expenses API
  getExpenses: (): Promise<Expense[]> => 
    fetch(`${API_BASE}/expenses`).then(handleResponse),

  createExpense: (expense: Expense): Promise<Expense> => 
    fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense)
    }).then(handleResponse),

  deleteExpense: (id: string): Promise<{ success: boolean }> => 
    fetch(`${API_BASE}/expenses/${id}`, {
      method: 'DELETE'
    }).then(handleResponse),

  // 6. Settings API
  getSettings: (): Promise<{ exchangeRates: ExchangeRates; capitalAllocation: CapitalAllocation; capitalPoolOverride?: CapitalPoolOverride }> => 
    fetch(`${API_BASE}/settings`).then(handleResponse),

  updateSettings: (key: 'exchangeRates' | 'capitalAllocation' | 'capitalPoolOverride', value: any): Promise<{ success: boolean }> => 
    fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    }).then(handleResponse),

  // 7. Maintenance API
  resetDatabase: (): Promise<{ success: boolean }> => 
    fetch(`${API_BASE}/maintenance/reset`, { method: 'POST' }).then(handleResponse),

  clearDatabase: (): Promise<{ success: boolean }> => 
    fetch(`${API_BASE}/maintenance/clear`, { method: 'POST' }).then(handleResponse),

  importDatabase: (data: any): Promise<{ success: boolean }> => 
    fetch(`${API_BASE}/maintenance/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),

  // 8. Auth & User Management API
  login: (usernameOrEmail: string, password: string): Promise<{ token: string; user: User }> =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, password })
    }).then(handleResponse),

  getCurrentUser: (): Promise<User> =>
    fetch(`${API_BASE}/auth/me`).then(handleResponse),

  getUsers: (): Promise<User[]> =>
    fetch(`${API_BASE}/users`).then(handleResponse),

  createUser: (user: Omit<User, 'id'> & { password?: string }): Promise<{ success: boolean; user: User }> =>
    fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    }).then(handleResponse),

  deleteUser: (id: string): Promise<{ success: boolean }> =>
    fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE'
    }).then(handleResponse)
};
