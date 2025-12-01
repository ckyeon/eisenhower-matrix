import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't retried yet, and it's not a login request
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login')) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');

            if (refreshToken) {
                try {
                    // Call refresh endpoint
                    // Use axios directly to avoid interceptor loop
                    const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
                    const { token } = response.data;

                    // Update token
                    localStorage.setItem('token', token);

                    // Update header for original request
                    originalRequest.headers['Authorization'] = `Bearer ${token}`;

                    // Retry original request
                    return api(originalRequest);
                } catch (refreshError) {
                    // Refresh failed - logout user
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    window.location.href = '/';
                }
            } else {
                // No refresh token - logout
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
            }
        }

        return Promise.reject(error);
    }
);

export default api;
