import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://backend-r97d6bk5x-anantsinghal2134-gmailcoms-projects.vercel.app/api';

export class ApiError extends AppError {
  public status: number;
  
  constructor(message: string, status: number = 500, statusCode?: string) {
    super(message, statusCode || 'API_ERROR');
    this.name = 'ApiError';
    this.status = status;
  }
}




export class ApiService {
  static async upload(endpoint: string, formData: FormData, headers?: HeadersInit) {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        ...headers, // don’t force 'Content-Type': fetch will set it automatically for FormData
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API upload failed for ${endpoint}:`, error);
    throw error;
  }
}

  static async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      logger.info('Making API request', {
        method: options.method || 'GET',
        url,
        headers: config.headers,
      });

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || `HTTP error! status: ${response.status}`;
        logger.error('API request failed', undefined, {
          method: options.method || 'GET',
          url,
          status: response.status,
          errorMessage,
        });
        throw new ApiError(errorMessage, response.status);
      }

      logger.info('API request successful', {
        method: options.method || 'GET',
        url,
        status: response.status,
      });

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('API request error', error instanceof Error ? error : new Error(errorMessage), {
        method: options.method || 'GET',
        url,
      });
      throw new ApiError(errorMessage, 0, 'NETWORK_ERROR');
    }
  }

  static async get(endpoint: string, headers?: HeadersInit) {
    return this.request(endpoint, { method: 'GET', headers });
  }

  static async post(endpoint: string, data?: any, headers?: HeadersInit) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers,
    });
  }

  static async put(endpoint: string, data?: any, headers?: HeadersInit) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      headers,
    });
  }

  static async delete(endpoint: string, headers?: HeadersInit) {
    return this.request(endpoint, { method: 'DELETE', headers });
  }
}

export default ApiService;
