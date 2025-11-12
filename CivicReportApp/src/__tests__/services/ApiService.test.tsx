import ApiService, { ApiError } from '../../services/apiService';

// Mock global fetch
global.fetch = jest.fn();

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock
    (global.fetch as jest.Mock).mockClear();
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockResponse = {
        success: true,
        data: [{ id: '1', title: 'Test Report' }]
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await ApiService.get('/reports');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/reports'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle GET request with query parameters', async () => {
      const mockResponse = { success: true, data: [] };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await ApiService.get('/reports', { category: 'pothole', status: 'pending' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('category=pothole&status=pending'),
        expect.any(Object)
      );
    });

    it('should handle 404 errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'Resource not found' })
      });

      await expect(ApiService.get('/reports/999')).rejects.toThrow(ApiError);
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request', async () => {
      const requestData = {
        title: 'New Report',
        description: 'Test description',
        category: 'pothole'
      };

      const mockResponse = {
        success: true,
        data: { id: '1', ...requestData }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await ApiService.post('/reports', requestData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/reports'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(requestData)
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle validation errors', async () => {
      const requestData = { title: '' }; // Invalid data

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({
          success: false,
          error: 'Validation failed',
          details: ['Title is required']
        })
      });

      await expect(ApiService.post('/reports', requestData)).rejects.toThrow(ApiError);
    });
  });

  describe('PUT requests', () => {
    it('should make successful PUT request', async () => {
      const updateData = { status: 'resolved' };
      const mockResponse = {
        success: true,
        data: { id: '1', status: 'resolved' }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await ApiService.put('/reports/1', updateData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/reports/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData)
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(ApiService.get('/reports')).rejects.toThrow('Network error');
    });

    it('should handle server errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({
          success: false,
          error: 'Internal server error'
        })
      });

      const error = await ApiService.get('/reports').catch((e: Error) => e);
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.status).toBe(500);
      expect(error.message).toContain('Internal server error');
    });

    it('should handle malformed JSON responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      await expect(ApiService.get('/reports')).rejects.toThrow();
    });
  });

  describe('Request headers and configuration', () => {
    it('should include authorization header when token provided', async () => {
      const mockResponse = { success: true, data: [] };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      // Mock token storage
      const mockToken = 'test-auth-token';
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(mockToken);

      await ApiService.get('/reports');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`
          })
        })
      );
    });

    it('should handle requests without authorization', async () => {
      const mockResponse = { success: true, data: [] };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      // Mock no token
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

      await ApiService.get('/reports');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String)
          })
        })
      );
    });
  });

  describe('Response transformation', () => {
    it('should return data property for successful responses', async () => {
      const mockData = [{ id: '1', title: 'Test' }];
      const mockResponse = { success: true, data: mockData };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await ApiService.get('/reports');
      expect(result).toEqual(mockResponse);
    });

    it('should handle responses without data property', async () => {
      const mockResponse = { message: 'Success' };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await ApiService.get('/health');
      expect(result).toEqual(mockResponse);
    });
  });
});