/// <reference types="jest" />

import { LocationService } from '../locationService';
import * as Location from 'expo-location';

// Mock expo-location
jest.mock('expo-location');
const mockLocation = Location as jest.Mocked<typeof Location>;

describe('LocationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentLocation', () => {
    it('should return current location when permissions are granted', async () => {
      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted',
        expires: 'never',
        granted: true,
        canAskAgain: true,
      } as any);

      mockLocation.getCurrentPositionAsync.mockResolvedValue({
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });

      const result = await LocationService.getCurrentLocation();

      expect(result).toEqual({
        latitude: 37.7749,
        longitude: -122.4194,
      });
      expect(mockLocation.requestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(mockLocation.getCurrentPositionAsync).toHaveBeenCalled();
    });

    it('should throw error when permissions are denied', async () => {
      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'denied',
        expires: 'never',
        granted: false,
        canAskAgain: true,
      } as any);

      await expect(LocationService.getCurrentLocation()).rejects.toThrow(
        'Location permission denied'
      );
      
      expect(mockLocation.getCurrentPositionAsync).not.toHaveBeenCalled();
    });

    it('should throw error when location service fails', async () => {
      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted',
        expires: 'never',
        granted: true,
        canAskAgain: true,
      } as any);

      mockLocation.getCurrentPositionAsync.mockRejectedValue(
        new Error('Location service error')
      );

      await expect(LocationService.getCurrentLocation()).rejects.toThrow(
        'Failed to get current location'
      );
    });
  });

  describe('reverseGeocode', () => {
    it('should return formatted address', async () => {
      mockLocation.reverseGeocodeAsync.mockResolvedValue([
        {
          street: '123 Main St',
          city: 'San Francisco',
          region: 'CA',
          country: 'US',
          postalCode: '94102',
          name: null,
          district: null,
          streetNumber: '123',
          subregion: null,
          timezone: null,
          isoCountryCode: 'US',
          formattedAddress: '123 Main St, San Francisco, CA 94102, US',
        },
      ]);

      const result = await LocationService.reverseGeocode(37.7749, -122.4194);

      expect(result).toBe('123 Main St, San Francisco, CA, US');
      expect(mockLocation.reverseGeocodeAsync).toHaveBeenCalledWith({
        latitude: 37.7749,
        longitude: -122.4194,
      });
    });

    it('should return null when no results', async () => {
      mockLocation.reverseGeocodeAsync.mockResolvedValue([]);

      const result = await LocationService.reverseGeocode(37.7749, -122.4194);

      expect(result).toBeNull();
    });

    it('should return null when geocoding fails', async () => {
      mockLocation.reverseGeocodeAsync.mockRejectedValue(
        new Error('Geocoding failed')
      );

      const result = await LocationService.reverseGeocode(37.7749, -122.4194);

      expect(result).toBeNull();
    });

    it('should handle partial address information', async () => {
      mockLocation.reverseGeocodeAsync.mockResolvedValue([
        {
          street: null,
          city: 'San Francisco',
          region: 'CA',
          country: 'US',
          postalCode: null,
          name: null,
          district: null,
          streetNumber: null,
          subregion: null,
          timezone: null,
          isoCountryCode: 'US',
          formattedAddress: 'San Francisco, CA, US',
        },
      ]);

      const result = await LocationService.reverseGeocode(37.7749, -122.4194);

      expect(result).toBe('San Francisco, CA, US');
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // Distance between San Francisco and Los Angeles (approximately 559 km)
      const point1 = { latitude: 37.7749, longitude: -122.4194 }; // SF
      const point2 = { latitude: 34.0522, longitude: -118.2437 }; // LA

      const distance = LocationService.calculateDistance(point1, point2);

      // Should be approximately 559 km (allowing for some precision difference)
      expect(distance).toBeGreaterThan(550);
      expect(distance).toBeLessThan(570);
    });

    it('should return 0 for the same point', () => {
      const point = { latitude: 37.7749, longitude: -122.4194 };

      const distance = LocationService.calculateDistance(point, point);

      expect(distance).toBe(0);
    });

    it('should calculate small distances accurately', () => {
      const point1 = { latitude: 37.7749, longitude: -122.4194 };
      const point2 = { latitude: 37.7750, longitude: -122.4194 }; // Very close

      const distance = LocationService.calculateDistance(point1, point2);

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(1); // Should be less than 1 km
    });
  });

  describe('isValidCoordinate', () => {
    it('should return true for valid coordinates', () => {
      expect(LocationService.isValidCoordinate(37.7749, -122.4194)).toBe(true);
      expect(LocationService.isValidCoordinate(0, 0)).toBe(true);
      expect(LocationService.isValidCoordinate(-90, -180)).toBe(true);
      expect(LocationService.isValidCoordinate(90, 180)).toBe(true);
    });

    it('should return false for invalid coordinates', () => {
      expect(LocationService.isValidCoordinate(91, 0)).toBe(false); // Invalid latitude
      expect(LocationService.isValidCoordinate(-91, 0)).toBe(false); // Invalid latitude
      expect(LocationService.isValidCoordinate(0, 181)).toBe(false); // Invalid longitude
      expect(LocationService.isValidCoordinate(0, -181)).toBe(false); // Invalid longitude
      expect(LocationService.isValidCoordinate(NaN, 0)).toBe(false); // NaN latitude
      expect(LocationService.isValidCoordinate(0, NaN)).toBe(false); // NaN longitude
    });
  });
});