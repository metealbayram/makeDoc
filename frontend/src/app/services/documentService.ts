import api from './api';

export interface SharedUser {
  user: {
    _id: string;
    name: string;
    email: string;
  };
  role: "viewer" | "editor";
}

export interface DocumentData {
  _id?: string;
  title: string;
  content: string;
  name: string;
  status?: string;
  createdAt?: string;
  role?: "owner" | "editor" | "viewer" | null;
  sharedWith?: SharedUser[];
}

export const documentService = {
  createDocument: async (data: DocumentData) => {
    const response = await api.post('/documents/create', data);
    return response.data;
  },

  getDocuments: async (search?: string) => {
    const response = await api.get('/documents', {
      params: { search }
    });
    return response.data;
  },

  getDocumentById: async (id: string) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  updateDocument: async (id: string, data: DocumentData) => {
    const response = await api.put(`/documents/${id}`, data);
    return response.data;
  },

  deleteDocument: async (id: string) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },

  downloadDocument: async (id: string) => {
    const response = await api.get(`/documents/${id}/download`, {
      responseType: 'blob'
    });
    return response;
  },

  shareDocument: async (
    id: string,
    data: { email: string; role: "viewer" | "editor" }
  ) => {
    const response = await api.post(`/documents/${id}/share`, data);
    return response.data;
  },

  removeSharedUser: async (id: string, userId: string) => {
    const response = await api.delete(`/documents/${id}/shared/${userId}`);
    return response.data;
  }
};