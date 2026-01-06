import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            // Token expired or invalid - clear storage but don't reload
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Let the app handle the state change naturally
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    login: (email, password) => axios.post(`${API_URL}/auth/login`, { email, password }),
    register: (vendorData) => axios.post(`${API_URL}/vendors/register`, vendorData),
};

export const tenderAPI = {
    getAll: () => api.get('/tenders'),
    getById: (id) => api.get(`/tenders/${id}`),
    create: (data) => api.post('/tenders', data),
};

export const bidAPI = {
    create: (data) => api.post('/bids', data),
    getByTender: (tenderId) => api.get(`/bids/tender/${tenderId}`),
};

export const contractAPI = {
    award: (data) => api.post('/contracts/award', data),
    getAll: () => api.get('/contracts'),
};

export const blockchainAPI = {
    getChain: () => api.get('/blockchain'),
    validate: () => api.get('/blockchain/validate'),
};

export const vendorAPI = {
    getProfile: () => api.get('/vendors/profile'),
    updateProfile: (data) => api.put('/vendors/profile', data),
};

export const auditAPI = {
    validate: (tenderId, data) => api.post(`/audit/validate/${tenderId}`, data),
    getStatus: (tenderId) => api.get(`/audit/status/${tenderId}`),
    getPending: () => api.get('/audit/pending'),
    flagBid: (tenderId, bidId, flag) => api.post('/audit/flag-bid', { tenderId, bidId, flag }),
    submitReview: (tenderId, notes) => api.post(`/audit/submit/${tenderId}`, { notes }),
    getReview: (tenderId) => api.get(`/audit/review/${tenderId}`),
};

export const notificationAPI = {
    getNotifications: (vendorEmail) => api.get(`/notifications/${vendorEmail}`),
};

export default api;
