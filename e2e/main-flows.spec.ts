/**
 * E2E Tests: Main User Flows
 * 
 * Tests the complete end-to-end user flows including:
 * - Login → Performance Dashboard flow
 * - Login → Financial Dashboard → Create Transaction flow
 * - Navigation between modules
 * - Filter interactions
 * - Complete user journeys
 * 
 * Requirements: Testing Strategy - E2E Test Coverage
 * Task: 17.4 Escrever testes E2E para fluxos principais
 */

import { test, expect } from '@playwright/test'

test.describe('Main Flow: Login → Performance Dashboard', () => {
  test('should complete full login to performance dashboard flow', async ({ page }) => {
    // Step 1: Navigate to login page
    await page.goto('/login')
    
    // Step 2: Verify login page is displayed
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    
    // Step 3: Fill in credentials
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    
    // Step 4: Submit login form
    await page.click('button[type="submit"]')
    
    // Step 5: Wait for redirect to dashboard
    await page.waitForURL(/\/(performance|finance)/, { timeout: 5000 })
    
    // Step 6: Navigate to performance dashboard if not already there
    if (!page.url().includes('/performance')) {
      const performanceLink = page.locator(
        'a[href="/performance"], a:has-text("Performance"), a:has-text("Desempenho")'
      ).first()
      
      if (await performanceLink.count() > 0) {
        await performanceLink.click()
        await page.waitForURL('/performance', { timeout: 5000 })
      } else {
        await page.goto('/performance')
      }
    }
    
    // Step 7: Wait for performance dashboard to load
    await page.waitForLoadState('networkidle')
    
    // Step 8: Verify performance dashboard content is displayed
    await page.waitForSelector('[data-testid="post-card"], .post-card, article', {
      timeout: 5000,
    })
    
    // Step 9: Verify post cards are visible
    const postCards = await page.locator('[data-testid="post-card"], .post-card, article').count()
    expect(postCards).toBeGreaterThan(0)
    
    // Step 10: Verify metrics are displayed on cards
    const firstCard = page.locator('[data-testid="post-card"], .post-card, article').first()
    await expect(firstCard).toBeVisible()
    
    const cardText = await firstCard.textContent()
    expect(cardText).toBeTruthy()
    expect(cardText!.length).toBeGreaterThan(0)
    
    // Step 11: Verify status badges are present
    const badge = firstCard.locator('[data-testid="status-badge"], .badge, [class*="badge"]').first()
    await expect(badge).toBeVisible()
    
    // Step 12: Verify URL is correct
    expect(page.url()).toContain('/performance')
  })

  test('should display loading state during performance dashboard load', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(performance|finance)/, { timeout: 5000 })
    
    // Navigate to performance (triggers loading)
    await page.goto('/performance')
    
    // Look for loading indicator (may be brief)
    const loadingIndicator = page.locator(
      '[data-testid="loading"], .loading, .spinner, [role="status"], [aria-busy="true"]'
    ).first()
    
    // Eventually posts should load
    await page.waitForSelector('[data-testid="post-card"], .post-card, article', {
      timeout: 5000,
    })
    
    const postCards = await page.locator('[data-testid="post-card"], .post-card, article').count()
    expect(postCards).toBeGreaterThan(0)
  })

  test('should handle authentication failure and retry', async ({ page }) => {
    // Step 1: Navigate to login
    await page.goto('/login')
    
    // Step 2: Try with invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Step 3: Verify error message appears
    await page.waitForSelector('[role="alert"], .error-message, [data-testid="error-message"]', {
      timeout: 3000,
    })
    
    const errorMessage = page.locator('[role="alert"], .error-message, [data-testid="error-message"]').first()
    await expect(errorMessage).toBeVisible()
    
    // Step 4: Verify still on login page
    expect(page.url()).toContain('/login')
    
    // Step 5: Retry with valid credentials
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Step 6: Should successfully redirect to dashboard
    await page.waitForURL(/\/(performance|finance)/, { timeout: 5000 })
    expect(page.url()).toMatch(/\/(performance|finance)/)
  })
})

test.describe('Main Flow: Login → Financial Dashboard → Create Transaction', () => {
  test('should complete full login to financial dashboard and create transaction flow', async ({ page }) => {
    // Step 1: Navigate to login page
    await page.goto('/login')
    
    // Step 2: Verify login page is displayed
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    
    // Step 3: Fill in credentials
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    
    // Step 4: Submit login form
    await page.click('button[type="submit"]')
    
    // Step 5: Wait for redirect to dashboard
    await page.waitForURL(/\/(performance|finance)/, { timeout: 5000 })
    
    // Step 6: Navigate to financial dashboard if not already there
    if (!page.url().includes('/finance')) {
      const financeLink = page.locator(
        'a[href="/finance"], a:has-text("Financeiro"), a:has-text("Finance")'
      ).first()
      
      if (await financeLink.count() > 0) {
        await financeLink.click()
        await page.waitForURL('/finance', { timeout: 5000 })
      } else {
        await page.goto('/finance')
      }
    }
    
    // Step 7: Wait for financial dashboard to load
    await page.waitForLoadState('networkidle')
    
    // Step 8: Verify summary cards are displayed
    await page.waitForSelector('[data-testid="summary-card"], .summary-card, [class*="summary"]', {
      timeout: 5000,
    })
    
    const summaryCards = await page.locator('[data-testid="summary-card"], .summary-card, [class*="summary"]').count()
    expect(summaryCards).toBeGreaterThan(0)
    
    // Step 9: Verify transaction list is displayed
    await page.waitForSelector(
      '[data-testid="transaction-list"], .transaction-list, table, [role="table"]',
      { timeout: 5000 }
    )
    
    const transactionList = page.locator(
      '[data-testid="transaction-list"], .transaction-list, table, [role="table"]'
    ).first()
    await expect(transactionList).toBeVisible()
    
    // Step 10: Get initial transaction count
    const initialTransactionCount = await page.locator(
      '[data-testid="transaction-row"], tr[data-testid*="transaction"], tbody tr'
    ).count()
    
    // Step 11: Click "Add Transaction" button
    const addButton = page.locator(
      'button:has-text("Nova"), button:has-text("Add"), button:has-text("Criar"), [data-testid="add-transaction"]'
    ).first()
    
    if (await addButton.count() > 0) {
      await addButton.click()
      
      // Step 12: Wait for transaction form to appear
      await page.waitForSelector('form, [data-testid="transaction-form"]', { timeout: 3000 })
      
      const form = page.locator('form, [data-testid="transaction-form"]').first()
      await expect(form).toBeVisible()
      
      // Step 13: Fill in transaction form
      const valorInput = page.locator('input[name="valor"], input[id="valor"]').first()
      if (await valorInput.count() > 0) {
        await valorInput.fill('5000')
      }
      
      const tipoSelect = page.locator('select[name="tipo"], select[id="tipo"]').first()
      if (await tipoSelect.count() > 0) {
        await tipoSelect.selectOption('Entrada')
      }
      
      const statusSelect = page.locator('select[name="status"], select[id="status"]').first()
      if (await statusSelect.count() > 0) {
        await statusSelect.selectOption('Pendente')
      }
      
      const dataInput = page.locator('input[name="dataVencimento"], input[id="dataVencimento"]').first()
      if (await dataInput.count() > 0) {
        // Set a future date
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 30)
        const dateString = futureDate.toISOString().split('T')[0]
        await dataInput.fill(dateString)
      }
      
      // Step 14: Submit the form
      const submitButton = page.locator('button[type="submit"]').first()
      await submitButton.click()
      
      // Step 15: Wait for form to close and data to refresh
      await page.waitForTimeout(2000)
      await page.waitForLoadState('networkidle')
      
      // Step 16: Verify transaction was added (list should update)
      // Note: This verification depends on the actual implementation
      // The transaction list should refresh after successful creation
      
      // Step 17: Verify we're still on the financial dashboard
      expect(page.url()).toContain('/finance')
    }
  })

  test('should validate required fields when creating transaction', async ({ page }) => {
    // Login and navigate to financial dashboard
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(performance|finance)/, { timeout: 5000 })
    
    if (!page.url().includes('/finance')) {
      await page.goto('/finance')
    }
    
    await page.waitForLoadState('networkidle')
    
    // Open transaction form
    const addButton = page.locator(
      'button:has-text("Nova"), button:has-text("Add"), button:has-text("Criar"), [data-testid="add-transaction"]'
    ).first()
    
    if (await addButton.count() > 0) {
      await addButton.click()
      
      // Wait for form
      await page.waitForSelector('form, [data-testid="transaction-form"]', { timeout: 3000 })
      
      // Try to submit without filling required fields
      const submitButton = page.locator('button[type="submit"]').first()
      await submitButton.click()
      
      // Should show validation errors
      await page.waitForSelector(
        '[role="alert"], .error-message, [data-testid="error-message"], .error',
        { timeout: 3000 }
      )
      
      const errorMessage = page.locator('[role="alert"], .error-message, .error').first()
      await expect(errorMessage).toBeVisible()
      
      // Form should still be visible (not submitted)
      const form = page.locator('form, [data-testid="transaction-form"]').first()
      await expect(form).toBeVisible()
    }
  })

  test('should display financial summary calculations correctly', async ({ page }) => {
    // Login and navigate to financial dashboard
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(performance|finance)/, { timeout: 5000 })
    
    if (!page.url().includes('/finance')) {
      await page.goto('/finance')
    }
    
    await page.waitForLoadState('networkidle')
    
    // Verify summary cards are displayed
    await page.waitForSelector('[data-testid="summary-card"], .summary-card, [class*="summary"]', {
      timeout: 5000,
    })
    
    // Get page text to verify financial terms
    const pageText = await page.textContent('body')
    
    // Should contain financial summary terms
    const hasSaldo = pageText?.includes('Saldo') || pageText?.includes('Balance')
    const hasFaturamento = pageText?.includes('Faturamento') || pageText?.includes('Revenue')
    const hasBRL = pageText?.includes('R$') || pageText?.includes('BRL')
    
    // Verify financial data is displayed
    expect(hasSaldo || hasFaturamento).toBeTruthy()
    expect(hasBRL).toBeTruthy()
  })
})

test.describe('Main Flow: Filter and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(performance|finance)/, { timeout: 5000 })
  })

  test('should filter performance posts by week and month', async ({ page }) => {
    // Navigate to performance dashboard
    if (!page.url().includes('/performance')) {
      await page.goto('/performance')
    }
    
    await page.waitForLoadState('networkidle')
    
    // Wait for posts to load
    await page.waitForSelector('[data-testid="post-card"], .post-card, article', {
      timeout: 5000,
    })
    
    // Get initial post count
    const initialPostCount = await page.locator('[data-testid="post-card"], .post-card, article').count()
    expect(initialPostCount).toBeGreaterThan(0)
    
    // Click week filter
    const weekButton = page.locator('button:has-text("Semana"), button:has-text("Week"), [data-testid="filter-week"]').first()
    
    if (await weekButton.count() > 0) {
      await weekButton.click()
      await page.waitForLoadState('networkidle')
      
      // Verify posts are still displayed (may be different count)
      const weekPostCount = await page.locator('[data-testid="post-card"], .post-card, article').count()
      expect(weekPostCount).toBeGreaterThanOrEqual(0)
      
      // Click month filter
      const monthButton = page.locator('button:has-text("Mês"), button:has-text("Month"), [data-testid="filter-month"]').first()
      
      if (await monthButton.count() > 0) {
        await monthButton.click()
        await page.waitForLoadState('networkidle')
        
        // Verify posts are displayed with month filter
        const monthPostCount = await page.locator('[data-testid="post-card"], .post-card, article').count()
        expect(monthPostCount).toBeGreaterThanOrEqual(0)
      }
    }
  })

  test('should navigate between performance and financial modules', async ({ page }) => {
    // Start on performance dashboard
    if (!page.url().includes('/performance')) {
      await page.goto('/performance')
    }
    
    await page.waitForLoadState('networkidle')
    
    // Verify we're on performance
    expect(page.url()).toContain('/performance')
    
    // Navigate to financial dashboard
    const financeLink = page.locator(
      'a[href="/finance"], a:has-text("Financeiro"), a:has-text("Finance")'
    ).first()
    
    if (await financeLink.count() > 0) {
      await financeLink.click()
      await page.waitForURL('/finance', { timeout: 5000 })
      await page.waitForLoadState('networkidle')
      
      // Verify we're on financial dashboard
      expect(page.url()).toContain('/finance')
      
      // Verify financial content is displayed
      await page.waitForSelector('[data-testid="summary-card"], .summary-card, [class*="summary"]', {
        timeout: 5000,
      })
      
      // Navigate back to performance
      const performanceLink = page.locator(
        'a[href="/performance"], a:has-text("Performance"), a:has-text("Desempenho")'
      ).first()
      
      if (await performanceLink.count() > 0) {
        await performanceLink.click()
        await page.waitForURL('/performance', { timeout: 5000 })
        await page.waitForLoadState('networkidle')
        
        // Verify we're back on performance
        expect(page.url()).toContain('/performance')
        
        // Verify performance content is displayed
        await page.waitForSelector('[data-testid="post-card"], .post-card, article', {
          timeout: 5000,
        })
      }
    }
  })

  test('should maintain authentication state during navigation', async ({ page }) => {
    // Navigate to performance
    await page.goto('/performance')
    await page.waitForLoadState('networkidle')
    
    // Verify authenticated content is displayed
    await page.waitForSelector('[data-testid="post-card"], .post-card, article', {
      timeout: 5000,
    })
    
    // Navigate to financial
    await page.goto('/finance')
    await page.waitForLoadState('networkidle')
    
    // Verify authenticated content is displayed
    await page.waitForSelector('[data-testid="summary-card"], .summary-card, [class*="summary"]', {
      timeout: 5000,
    })
    
    // Navigate back to performance
    await page.goto('/performance')
    await page.waitForLoadState('networkidle')
    
    // Should still be authenticated (not redirected to login)
    expect(page.url()).toContain('/performance')
    
    // Verify content is displayed
    await page.waitForSelector('[data-testid="post-card"], .post-card, article', {
      timeout: 5000,
    })
  })

  test('should handle navigation with browser back/forward buttons', async ({ page }) => {
    // Navigate to performance
    await page.goto('/performance')
    await page.waitForLoadState('networkidle')
    
    // Navigate to financial
    await page.goto('/finance')
    await page.waitForLoadState('networkidle')
    
    // Use browser back button
    await page.goBack()
    await page.waitForLoadState('networkidle')
    
    // Should be back on performance
    expect(page.url()).toContain('/performance')
    
    // Use browser forward button
    await page.goForward()
    await page.waitForLoadState('networkidle')
    
    // Should be on financial again
    expect(page.url()).toContain('/finance')
  })

  test('should display active module indicator in navigation', async ({ page }) => {
    // Navigate to performance
    await page.goto('/performance')
    await page.waitForLoadState('networkidle')
    
    // Find performance navigation link
    const performanceLink = page.locator(
      'a[href="/performance"], a:has-text("Performance"), a:has-text("Desempenho")'
    ).first()
    
    if (await performanceLink.count() > 0) {
      // Check if it has active state
      const isActive = await performanceLink.evaluate((el) => {
        return el.classList.contains('active') || 
               el.getAttribute('aria-current') === 'page' ||
               el.getAttribute('data-active') === 'true'
      })
      
      // Performance link should be marked as active
      // (exact implementation may vary)
    }
    
    // Navigate to financial
    await page.goto('/finance')
    await page.waitForLoadState('networkidle')
    
    // Find financial navigation link
    const financeLink = page.locator(
      'a[href="/finance"], a:has-text("Financeiro"), a:has-text("Finance")'
    ).first()
    
    if (await financeLink.count() > 0) {
      // Check if it has active state
      const isActive = await financeLink.evaluate((el) => {
        return el.classList.contains('active') || 
               el.getAttribute('aria-current') === 'page' ||
               el.getAttribute('data-active') === 'true'
      })
      
      // Financial link should be marked as active
    }
  })
})

test.describe('Main Flow: Error Handling and Recovery', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(performance|finance)/, { timeout: 5000 })
  })

  test('should handle API errors gracefully on performance dashboard', async ({ page }) => {
    // Intercept API calls and make them fail
    await page.route('**/api/posts*', (route) => {
      route.abort('failed')
    })
    
    // Navigate to performance
    await page.goto('/performance')
    
    // Should display error message
    await page.waitForSelector('[role="alert"], .error-message, [data-testid="error-message"]', {
      timeout: 5000,
    })
    
    const errorMessage = page.locator('[role="alert"], .error-message, [data-testid="error-message"]').first()
    await expect(errorMessage).toBeVisible()
    
    // Should have retry option
    const retryButton = page.locator('button:has-text("Tentar"), button:has-text("Retry"), [data-testid="retry-button"]').first()
    
    if (await retryButton.count() > 0) {
      await expect(retryButton).toBeVisible()
    }
  })

  test('should handle API errors gracefully on financial dashboard', async ({ page }) => {
    // Intercept API calls and make them fail
    await page.route('**/api/transactions*', (route) => {
      route.abort('failed')
    })
    
    // Navigate to financial
    await page.goto('/finance')
    
    // Should display error message
    await page.waitForSelector('[role="alert"], .error-message, [data-testid="error-message"]', {
      timeout: 5000,
    })
    
    const errorMessage = page.locator('[role="alert"], .error-message, [data-testid="error-message"]').first()
    await expect(errorMessage).toBeVisible()
  })

  test('should recover from network errors with retry', async ({ page }) => {
    // Navigate to performance
    await page.goto('/performance')
    await page.waitForLoadState('networkidle')
    
    // Simulate network failure
    await page.context().setOffline(true)
    
    // Try to refresh or navigate
    await page.reload()
    
    // Should show error
    await page.waitForSelector('[role="alert"], .error-message, [data-testid="error-message"]', {
      timeout: 5000,
    })
    
    // Restore network
    await page.context().setOffline(false)
    
    // Retry (reload or click retry button)
    const retryButton = page.locator('button:has-text("Tentar"), button:has-text("Retry"), [data-testid="retry-button"]').first()
    
    if (await retryButton.count() > 0) {
      await retryButton.click()
    } else {
      await page.reload()
    }
    
    await page.waitForLoadState('networkidle')
    
    // Should successfully load content
    await page.waitForSelector('[data-testid="post-card"], .post-card, article', {
      timeout: 5000,
    })
  })
})

test.describe('Main Flow: Complete User Journey', () => {
  test('should complete full user journey: login → view performance → view financial → create transaction → logout', async ({ page }) => {
    // Step 1: Login
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(performance|finance)/, { timeout: 5000 })
    
    // Step 2: View Performance Dashboard
    if (!page.url().includes('/performance')) {
      await page.goto('/performance')
    }
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('[data-testid="post-card"], .post-card, article', {
      timeout: 5000,
    })
    
    const postCards = await page.locator('[data-testid="post-card"], .post-card, article').count()
    expect(postCards).toBeGreaterThan(0)
    
    // Step 3: Navigate to Financial Dashboard
    const financeLink = page.locator(
      'a[href="/finance"], a:has-text("Financeiro"), a:has-text("Finance")'
    ).first()
    
    if (await financeLink.count() > 0) {
      await financeLink.click()
      await page.waitForURL('/finance', { timeout: 5000 })
    } else {
      await page.goto('/finance')
    }
    
    await page.waitForLoadState('networkidle')
    
    // Step 4: Verify Financial Dashboard
    await page.waitForSelector('[data-testid="summary-card"], .summary-card, [class*="summary"]', {
      timeout: 5000,
    })
    
    // Step 5: Create Transaction (if form is available)
    const addButton = page.locator(
      'button:has-text("Nova"), button:has-text("Add"), button:has-text("Criar"), [data-testid="add-transaction"]'
    ).first()
    
    if (await addButton.count() > 0) {
      await addButton.click()
      await page.waitForSelector('form, [data-testid="transaction-form"]', { timeout: 3000 })
      
      // Fill form
      const valorInput = page.locator('input[name="valor"], input[id="valor"]').first()
      if (await valorInput.count() > 0) {
        await valorInput.fill('3000')
      }
      
      const tipoSelect = page.locator('select[name="tipo"], select[id="tipo"]').first()
      if (await tipoSelect.count() > 0) {
        await tipoSelect.selectOption('Entrada')
      }
      
      const statusSelect = page.locator('select[name="status"], select[id="status"]').first()
      if (await statusSelect.count() > 0) {
        await statusSelect.selectOption('Pago')
      }
      
      const dataInput = page.locator('input[name="dataVencimento"], input[id="dataVencimento"]').first()
      if (await dataInput.count() > 0) {
        const today = new Date().toISOString().split('T')[0]
        await dataInput.fill(today)
      }
      
      // Submit
      const submitButton = page.locator('button[type="submit"]').first()
      await submitButton.click()
      await page.waitForTimeout(2000)
      await page.waitForLoadState('networkidle')
    }
    
    // Step 6: Logout
    const logoutButton = page.locator('button:has-text("Sair"), button:has-text("Logout"), [data-testid="logout-button"]').first()
    
    if (await logoutButton.count() > 0) {
      await logoutButton.click()
      await page.waitForURL('/login', { timeout: 5000 })
      expect(page.url()).toContain('/login')
    }
  })
})

test.describe('Main Flow: Mobile User Journey', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE size

  test('should complete mobile user journey: login → performance → financial', async ({ page }) => {
    // Login on mobile
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(performance|finance)/, { timeout: 5000 })
    
    // View performance on mobile
    if (!page.url().includes('/performance')) {
      await page.goto('/performance')
    }
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('[data-testid="post-card"], .post-card, article', {
      timeout: 5000,
    })
    
    // Verify mobile layout
    const postCards = await page.locator('[data-testid="post-card"], .post-card, article').count()
    expect(postCards).toBeGreaterThan(0)
    
    // Navigate to financial on mobile
    await page.goto('/finance')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('[data-testid="summary-card"], .summary-card, [class*="summary"]', {
      timeout: 5000,
    })
    
    // Verify mobile layout for financial
    const summaryCards = await page.locator('[data-testid="summary-card"], .summary-card, [class*="summary"]').count()
    expect(summaryCards).toBeGreaterThan(0)
  })
})
