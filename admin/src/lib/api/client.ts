// Re-export the API client for convenience
// This allows importing as: import { apiClient } from '@/lib/api/client';

import api from '../api';

export const apiClient = api;

export default api;
