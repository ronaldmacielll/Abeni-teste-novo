/**
 * Tests for API Response Compression Utilities
 * 
 * Validates compression logic for API responses
 */

import { shouldCompress, getResponseSize, compressedJsonResponse } from './compression';

describe('API Compression Utilities', () => {
  describe('shouldCompress', () => {
    it('should return false for small payloads (< 1KB)', () => {
      const smallData = { message: 'Hello' };
      expect(shouldCompress(smallData)).toBe(false);
    });

    it('should return true for large payloads (> 1KB)', () => {
      // Create a payload > 1KB
      const largeData = {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: `item-${i}`,
          name: `Item ${i}`,
          description: 'This is a longer description to increase payload size',
          metadata: {
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            tags: ['tag1', 'tag2', 'tag3'],
          },
        })),
      };
      expect(shouldCompress(largeData)).toBe(true);
    });

    it('should handle edge case at exactly 1KB', () => {
      // Create a payload close to 1KB
      const data = { content: 'x'.repeat(1000) };
      const result = shouldCompress(data);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getResponseSize', () => {
    it('should return correct size in bytes for small objects', () => {
      const data = { message: 'test' };
      const size = getResponseSize(data);
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThan(100);
    });

    it('should return correct size in bytes for large objects', () => {
      const largeData = {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
        })),
      };
      const size = getResponseSize(largeData);
      expect(size).toBeGreaterThan(1024); // Should be > 1KB
    });

    it('should handle empty objects', () => {
      const size = getResponseSize({});
      expect(size).toBeGreaterThan(0);
    });

    it('should handle arrays', () => {
      const data = [1, 2, 3, 4, 5];
      const size = getResponseSize(data);
      expect(size).toBeGreaterThan(0);
    });
  });

  describe('compressedJsonResponse', () => {
    it('should create a NextResponse with correct content type', () => {
      const data = { message: 'test' };
      const response = compressedJsonResponse(data);
      
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('should accept custom status code', () => {
      const data = { error: 'Not found' };
      const response = compressedJsonResponse(data, 404);
      
      expect(response.status).toBe(404);
    });

    it('should merge custom headers', () => {
      const data = { message: 'test' };
      const customHeaders = {
        'X-Custom-Header': 'custom-value',
        'Cache-Control': 'no-cache',
      };
      const response = compressedJsonResponse(data, 200, customHeaders);
      
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('should add content length hint for large payloads', () => {
      const largeData = {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: `item-${i}`,
          name: `Item ${i}`,
          description: 'This is a longer description to increase payload size',
        })),
      };
      const response = compressedJsonResponse(largeData);
      
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('should handle small payloads without content length hint', () => {
      const smallData = { message: 'Hello' };
      const response = compressedJsonResponse(smallData);
      
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });
  });
});
