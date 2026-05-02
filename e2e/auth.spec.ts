/**
 * E2E Tests: Authentication Flow
 * 
 * Tests the complete authentication flow including:
 * - Login with valid credentials
 * - Login with invalid credentials
 * - Session persistence
 * - Logout functionality
 * - Protected route access
 * 
 * Requirements: 1.1, 1.2, 1.4, 1.5, 2.4, 2.5
 */

import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the login page
    await page.goto('/login')
  })

  test('should display login page with email and password fields', async ({ page }) => {
    // Verify login page elements
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should login with valid credentials and redirect to dashboard', async ({ page }) => {
    // Fill in login form with valid credentials
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    
    // Submit the form
    await page.click('button[type="submit"]')
    
    // Wait for navigation to complete
    await page.waitForURL(/\/(performance|finance)/, { timeout: 5000 })
    
    // Verify we're on a dashboard page
    const url = page.url()
    expect(url).toMatch(/\/(performance|finance)/)
  })

  test('should show error message with invalid credentials', async ({ page }) => {
    // Fill in login form with invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    
    // Submit the form
    await page.click('button[type="submit"]')
    
    // Wait for error message to appear
    await page.waitForSelector('[role="alert"], .error-message, [data-testid="error-message"]', {
      timeout: 3000,
    })
    
    // Verify error message is displayed
    const errorMessage = await page.locator('[role="alert"], .error-message, [data-testid="error-message"]').first()
    await expect(errorMessage).toBeVisible()
    
    // Verify we're still on the login page
    expect(page.url()).toContain('/login')
  })

  test('should show validation error for empty email', async ({ page }) => {
    // Leave email empty and fill password
    await page.fill('input[name="password"]', 'password123')
    
    // Try to submit
    await page.click('button[type="submit"]')
    
    // Check for HTML5 validation or custom error
    const emailInput = page.locator('input[name="email"]')
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage)
    
    // Either HTML5 validation or custom error should be present
    expect(validationMessage || await page.locator('[role="alert"]').count() > 0).toBeTruthy()
  })

  test('should show validation error for empty password', async ({ page }) => {
    // Fill email but leave password empty
    await page.fill('input[name="email"]', 'test@example.com')
    
    // Try to submit
    await page.click('button[type="submit"]')
    
    // Check for HTML5 validation or custom error
    const passwordInput = page.locator('input[name="password"]')
    const validationMessage = await passwordInput.evaluate((el: HTMLInputElement) => el.validationMessage)
    
    // Either HTML5 validation or custom error should be present
    expect(validationMessage || await page.locator('[role="alert"]').count() > 0).toBeTruthy()
  })

  test('should redirect to login when accessing protected route without authentication', async ({ page }) => {
    // Try to access performance dashboard without logging in
    await page.goto('/performance')
    
    // Should be redirected to login
    await page.waitForURL('/login', { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })

  test('should logout and redirect to login page', async ({ page }) => {
    // First, login
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Wait for dashboard to load
    await page.waitForURL(/\/(performance|finance)/, { timeout: 5000 })
    
    // Find and click logout button
    const logoutButton = page.locator('button:has-text("Sair"), button:has-text("Logout"), [data-testid="logout-button"]').first()
    await logoutButton.click()
    
    // Should be redirected to login
    await page.waitForURL('/login', { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })

  test('should persist session after page reload', async ({ page }) => {
    // Login
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Wait for dashboard
    await page.waitForURL(/\/(performance|finance)/, { timeout: 5000 })
    const dashboardUrl = page.url()
    
    // Reload the page
    await page.reload()
    
    // Should still be on the dashboard (not redirected to login)
    await page.waitForLoadState('networkidle')
    expect(page.url()).toBe(dashboardUrl)
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true)
    
    // Try to login
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should show network error message
    await page.waitForSelector('[role="alert"], .error-message, [data-testid="error-message"]', {
      timeout: 3000,
    })
    
    const errorMessage = await page.locator('[role="alert"], .error-message, [data-testid="error-message"]').first()
    await expect(errorMessage).toBeVisible()
    
    // Re-enable network
    await page.context().setOffline(false)
  })
})

test.describe('Authentication Flow - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE size

  test('should login successfully on mobile viewport', async ({ page }) => {
    await page.goto('/login')
    
    // Verify form is visible and usable on mobile
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    
    // Login
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await page.waitForURL(/\/(performance|finance)/, { timeout: 5000 })
    expect(page.url()).toMatch(/\/(performance|finance)/)
  })
})
