const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';




class ApiService {
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
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
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
