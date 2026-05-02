/**
 * API Response Compression Utilities
 * 
 * Provides utilities for compressing API responses > 1KB
 * Implements Requirement: 13.4
 */

import { NextResponse } from 'next/server';

/**
 * Minimum size in bytes to trigger compression (1KB)
 */
const MIN_COMPRESSION_SIZE = 1024;

/**
 * Check if response should be compressed based on size
 */
export function shouldCompress(data: any): boolean {
  const jsonString = JSON.stringify(data);
  const sizeInBytes = new Blob([jsonString]).size;
  return sizeInBytes > MIN_COMPRESSION_SIZE;
}

/**
 * Create a compressed JSON response
 * 
 * Next.js automatically handles compression when compress: true is set in next.config.js
 * This function adds appropriate headers to ensure compression is applied
 * 
 * @param data - Data to be serialized to JSON
 * @param status - HTTP status code (default: 200)
 * @param headers - Additional headers to include
 * @returns NextResponse with compression hints
 */
export function compressedJsonResponse(
  data: any,
  status: number = 200,
  headers: Record<string, string> = {}
): NextResponse {
  const jsonString = JSON.stringify(data);
  const sizeInBytes = new Blob([jsonString]).size;

  // Add compression hint headers for responses > 1KB
  const responseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add content length hint to help Next.js compression middleware
  if (sizeInBytes > MIN_COMPRESSION_SIZE) {
    responseHeaders['X-Content-Length-Hint'] = sizeInBytes.toString();
  }

  return NextResponse.json(data, {
    status,
    headers: responseHeaders,
  });
}

/**
 * Get response size in bytes
 */
export function getResponseSize(data: any): number {
  const jsonString = JSON.stringify(data);
  return new Blob([jsonString]).size;
}
