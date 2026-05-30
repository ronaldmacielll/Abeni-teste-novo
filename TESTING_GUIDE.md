# Testing Guide - Instagram Business Integration

## Overview

This guide explains how to run tests and generate coverage reports for the Instagram Business Integration feature. The project uses Jest for unit and integration tests, Playwright for E2E tests, and fast-check for property-based testing.

## Test Coverage Requirements

The Instagram Business Integration feature has specific coverage requirements:

- **Services** (`lib/services/**/*.ts`, `lib/jobs/**/*.ts`): **80% minimum**
- **Components** (`modules/**/*.tsx`, `app/**/*.tsx`): **70% minimum**
- **Global**: **70% minimum**

## Quick Start

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Generate Coverage Report

```bash
npm run test:coverage
```

### View Coverage Report in Browser

```bash
npm run test:coverage:report
```

## Coverage Commands

### Full Coverage Report

```bash
npm run test:coverage
```

Generates coverage for all code and creates:
- `coverage/index.html` - Interactive HTML report
- `coverage/lcov.info` - LCOV format for CI/CD
- `coverage/coverage-summary.json` - JSON summary

### Service Coverage Only

```bash
npm run test:coverage:services
```

Generates coverage report for services and jobs only:
- `lib/services/**/*.ts`
- `lib/jobs/**/*.ts`

### Component Coverage Only

```bash
npm run test:coverage:components
```

Generates coverage report for components only:
- `modules/**/*.tsx`
- `app/**/*.tsx`

### Check Coverage Without Failing

```bash
npm run test:coverage:check
```

Runs coverage check without failing the build if thresholds are not met. Useful for local development.

## Understanding Coverage Reports

### HTML Report

The HTML report (`coverage/index.html`) shows:

1. **Summary**: Overall coverage percentages
2. **File List**: Coverage for each file with color coding:
   - 🟢 Green: 80-100% coverage
   - 🟡 Yellow: 70-79% coverage
   - 🔴 Red: <70% coverage
3. **Line Coverage**: Source code with covered/uncovered lines highlighted
4. **Branch Coverage**: Conditional branches and their coverage

### JSON Summary

The JSON summary (`coverage/coverage-summary.json`) contains:

```json
{
  "total": {
    "lines": { "total": 1000, "covered": 850, "skipped": 0, "pct": 85 },
    "statements": { "total": 1000, "covered": 850, "skipped": 0, "pct": 85 },
    "functions": { "total": 100, "covered": 85, "skipped": 0, "pct": 85 },
    "branches": { "total": 200, "covered": 170, "skipped": 0, "pct": 85 }
  }
}
```

## Test Structure

### Unit Tests

Located in the same directory as source files with `.test.ts` or `.test.tsx` suffix.

```typescript
// lib/services/instagram.service.test.ts
describe('InstagramService', () => {
  it('should validate credentials', async () => {
    // Test implementation
  })
})
```

### Integration Tests

Located in the same directory with `.integration.test.ts` suffix.

```typescript
// lib/jobs/instagram-sync.job.integration.test.ts
describe('InstagramSyncJob Integration', () => {
  it('should complete sync cycle', async () => {
    // Test implementation
  })
})
```

### Property-Based Tests

Located in the same directory with `.property.test.ts` suffix.

```typescript
// lib/utils/instagram-normalizer.property.test.ts
import fc from 'fast-check'

describe('InstagramNormalizer Properties', () => {
  it('should ensure metrics consistency', () => {
    fc.assert(
      fc.property(
        fc.record({ /* generators */ }),
        (data) => {
          // Property assertion
        }
      )
    )
  })
})
```

### E2E Tests

Located in `e2e/` directory with `.spec.ts` suffix.

```typescript
// e2e/instagram-integration.spec.ts
import { test, expect } from '@playwright/test'

test('should configure Instagram account', async ({ page }) => {
  // E2E test implementation
})
```

## Writing Tests

### Best Practices

1. **Test Behavior, Not Implementation**
   ```typescript
   // ✅ Good: Tests what the function does
   it('should return encrypted token', () => {
     const encrypted = encryptToken('secret')
     expect(encrypted).not.toBe('secret')
   })

   // ❌ Bad: Tests implementation details
   it('should use AES-256-GCM cipher', () => {
     // Tests internal implementation
   })
   ```

2. **Use Descriptive Test Names**
   ```typescript
   // ✅ Good
   it('should throw error when credentials are invalid')

   // ❌ Bad
   it('should throw')
   ```

3. **Test Edge Cases**
   ```typescript
   it('should handle empty metrics', () => {
     const result = validateMetrics({})
     expect(result).toBe(false)
   })

   it('should handle negative values', () => {
     const result = validateMetrics({ likes: -1 })
     expect(result).toBe(false)
   })
   ```

4. **Use Property-Based Testing for Complex Logic**
   ```typescript
   it('should maintain metrics consistency', () => {
     fc.assert(
       fc.property(
         fc.record({
           likes: fc.nat(),
           comments: fc.nat(),
           engagement: fc.nat(),
         }),
         (metrics) => {
           const fixed = ensureConsistency(metrics)
           return fixed.likes + fixed.comments <= fixed.engagement
         }
       )
     )
   })
   ```

5. **Mock External Dependencies**
   ```typescript
   jest.mock('axios')
   const mockAxios = axios as jest.Mocked<typeof axios>

   it('should call Instagram API', async () => {
     mockAxios.get.mockResolvedValue({ data: { /* ... */ } })
     // Test implementation
   })
   ```

## Improving Coverage

### 1. Identify Uncovered Code

```bash
npm run test:coverage
# Open coverage/index.html
# Look for red lines (uncovered code)
```

### 2. Add Tests for Uncovered Code

```typescript
// Find uncovered function
function calculateEngagement(likes, comments) {
  return likes + comments
}

// Add test
it('should calculate engagement correctly', () => {
  expect(calculateEngagement(10, 5)).toBe(15)
})
```

### 3. Test All Branches

```typescript
// Function with branches
function validateMetrics(metrics) {
  if (!metrics) return false        // Branch 1
  if (metrics.likes < 0) return false // Branch 2
  return true                        // Branch 3
}

// Test all branches
it('should return false for null metrics', () => {
  expect(validateMetrics(null)).toBe(false)
})

it('should return false for negative likes', () => {
  expect(validateMetrics({ likes: -1 })).toBe(false)
})

it('should return true for valid metrics', () => {
  expect(validateMetrics({ likes: 10 })).toBe(true)
})
```

### 4. Use Coverage Reports to Guide Testing

```bash
# Generate coverage report
npm run test:coverage

# Review coverage/index.html
# - Red lines = uncovered code
# - Yellow lines = partially covered code
# - Green lines = fully covered code

# Add tests for red/yellow lines
```

## Continuous Integration

### GitHub Actions

Coverage is automatically checked on:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

The workflow:
1. Installs dependencies
2. Runs tests with coverage
3. Checks coverage thresholds
4. Uploads to Codecov
5. Comments on PR with coverage report

### Pre-commit Hook

Coverage is checked before committing:

```bash
git commit -m "Add feature"
# Runs: npm run test:coverage:check
# If coverage is below threshold, commit is blocked
```

To bypass (not recommended):

```bash
git commit --no-verify
```

## Troubleshooting

### Coverage Threshold Not Met

**Problem**: Tests fail with "Coverage threshold not met"

**Solution**:
1. Run `npm run test:coverage` to see which files are below threshold
2. Add tests for uncovered code
3. Check for dead code that should be removed
4. Review if threshold is realistic

### Coverage Report Not Generated

**Problem**: `coverage/` directory is empty

**Solution**:
1. Ensure Jest is installed: `npm install --save-dev jest`
2. Check `jest.config.js` exists in project root
3. Run with verbose output: `npm run test:coverage -- --verbose`
4. Check for test errors: `npm test`

### Slow Coverage Generation

**Problem**: Coverage generation takes too long

**Solution**:
1. Run coverage for specific files: `npm run test:coverage:services`
2. Use `--testPathPattern` to run specific tests
3. Exclude unnecessary files in `collectCoverageFrom`

### Tests Failing in CI but Passing Locally

**Problem**: Tests pass locally but fail in GitHub Actions

**Solution**:
1. Check Node.js version matches: `node --version`
2. Clear cache: `npm ci` (instead of `npm install`)
3. Check environment variables are set
4. Run tests in same environment: `npm test -- --runInBand`

## Coverage Metrics Explained

### Lines
Percentage of lines of code executed by tests.

```typescript
function add(a, b) {
  return a + b  // Line 1
}

// Test covers line 1
it('should add numbers', () => {
  expect(add(1, 2)).toBe(3)
})
```

### Statements
Percentage of statements executed. Similar to lines but counts statements.

```typescript
function process(data) {
  if (data) {           // Statement 1
    console.log(data)   // Statement 2
  }
  return data           // Statement 3
}
```

### Functions
Percentage of functions called by tests.

```typescript
function add(a, b) { return a + b }
function subtract(a, b) { return a - b }

// Only tests add(), not subtract()
// Function coverage: 50%
```

### Branches
Percentage of conditional branches taken.

```typescript
function validate(value) {
  if (value > 0) {      // Branch 1: true
    return true
  } else {              // Branch 2: false
    return false
  }
}

// Test only covers value > 0
// Branch coverage: 50%
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library Documentation](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [fast-check Documentation](https://github.com/dubzzz/fast-check)
- [Coverage Configuration](./COVERAGE_CONFIG.md)

## Support

For questions or issues with testing:

1. Check the [Jest Documentation](https://jestjs.io/)
2. Review existing tests in the codebase
3. Check GitHub Issues for similar problems
4. Ask in team Slack channel
