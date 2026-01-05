
import api from './api';

export interface DocumentData {
    _id?: string;
    title: string;
    content: string;
    name: string;
    status?: string;
    createdAt?: string;
}

export const documentService = {
  createDocument: async (data: DocumentData) => {
    const response = await api.post('/api/documents/create', data);
    return response.data;
  },

  getDocuments: async (search?: string) => {
    const response = await api.get('/api/documents', {
        params: { search }
    });
    return response.data;
  },

  getDocumentById: async (id: string) => {
    const response = await api.get(`/api/documents/${id}`);
    return response.data;
  },

  updateDocument: async (id: string, data: DocumentData) => {
    const response = await api.put(`/api/documents/${id}`, data);
    return response.data;
  },

  deleteDocument: async (id: string) => {
    const response = await api.delete(`/api/documents/${id}`);
    return response.data;
  },
  
  downloadDocument: async (id: string) => {
      // For download, usually we redirect or fetch blob.
      // API returns a file stream.
      const response = await api.get(`/api/documents/${id}/download`, {
          responseType: 'blob'
      });
      return response;
  }
};
