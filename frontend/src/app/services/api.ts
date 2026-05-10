import axios from 'axios';
const api = axios.create({
  baseURL: 'http://localhost:5000',
});

api.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem('token');
    if (token === "undefined") {
      localStorage.removeItem('token');
      token = null;
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
export type FinanceType = "income" | "expense";

export interface FinanceRecord {
  _id: string;
  title: string;
  amount: number;
  date: string;
  type: FinanceType;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinanceCategory {
  _id: string;
  name: string;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  comparison: {
    category: string;
    income: number;
    expense: number;
    balance: number;
  }[];
}

export const financeAPI = {
  getRecords: (month: number, year: number) =>
    api.get<FinanceRecord[]>(`/finance/records?month=${month}&year=${year}`),

  createRecord: (data: {
    title: string;
    amount: number;
    date: string;
    type: FinanceType;
    category: string;
  }) => api.post<FinanceRecord>("/finance/records", data),

  updateRecord: (
    id: string,
    data: {
      title?: string;
      amount?: number;
      date?: string;
      type?: FinanceType;
      category?: string;
    }
  ) => api.put<FinanceRecord>(`/finance/records/${id}`, data),

  deleteRecord: (id: string) => api.delete(`/finance/records/${id}`),

  getSummary: (month: number, year: number) =>
    api.get<FinanceSummary>(`/finance/summary?month=${month}&year=${year}`),

  getCategories: () => api.get<FinanceCategory[]>("/finance/categories"),

  createCategory: (name: string) =>
    api.post<FinanceCategory>("/finance/categories", { name }),

  exportCsv: (month: number, year: number) =>
    api.get(`/finance/export?month=${month}&year=${year}`, {
      responseType: "blob",
    }),
};
export default api;
