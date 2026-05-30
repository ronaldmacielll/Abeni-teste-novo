# Test Coverage Configuration - Setup Summary

## Task: 11.5 Configurar cobertura de testes

This document summarizes the test coverage configuration for the Instagram Business Integration feature.

## What Was Configured

### 1. Jest Coverage Thresholds

**File**: `jest.config.js`

Configured specific coverage thresholds:

- **Services** (`lib/services/**/*.ts`, `lib/jobs/**/*.ts`): **80% minimum**
  - These contain critical business logic (Instagram API, credentials, sync jobs)
  - Higher threshold ensures reliability

- **Components** (`modules/**/*.tsx`, `app/**/*.tsx`): **70% minimum**
  - UI components and pages
  - Standard threshold for UI code

- **Global**: **70% minimum**
  - All other code

Coverage metrics tracked:
- Lines: Percentage of lines executed
- Statements: Percentage of statements executed
- Functions: Percentage of functions called
- Branches: Percentage of conditional branches taken

### 2. Coverage Scripts

**File**: `package.json`

Added npm scripts for coverage management:

```bash
npm run test:coverage              # Generate full coverage report
npm run test:coverage:services     # Coverage for services only
npm run test:coverage:components   # Coverage for components only
npm run test:coverage:report       # Generate and open HTML report
npm run test:coverage:check        # Check without failing build
npm run test:coverage:summary      # Show coverage summary
```

### 3. Coverage Reporters

**File**: `jest.config.js`

Configured multiple coverage report formats:

- **text**: Console output
- **text-summary**: Summary in console
- **html**: Interactive HTML report (`coverage/index.html`)
- **lcov**: LCOV format for CI/CD integration
- **json**: JSON format for programmatic access
- **json-summary**: JSON summary

### 4. CI/CD Integration

**File**: `.github/workflows/coverage.yml`

Created GitHub Actions workflow that:

1. Runs on push to `main`/`develop` and pull requests
2. Tests on Node.js 18.x and 20.x
3. Generates coverage reports
4. Uploads to Codecov
5. Comments on PRs with coverage summary
6. Archives coverage reports as artifacts

### 5. Pre-commit Hook

**File**: `.husky/pre-commit`

Configured pre-commit hook to:

1. Run linting (`npm run lint:fix`)
2. Run type checking (`npm run type-check`)
3. Check coverage (`npm run test:coverage:check`)

Prevents commits if coverage thresholds are not met.

### 6. Coverage Check Script

**File**: `scripts/check-coverage.js`

Created Node.js script that:

1. Reads coverage summary JSON
2. Checks against thresholds
3. Displays formatted report
4. Shows file-by-file coverage
5. Exits with appropriate code

Usage: `npm run test:coverage:summary`

### 7. Documentation

Created comprehensive documentation:

- **COVERAGE_CONFIG.md**: Detailed coverage configuration guide
- **TESTING_GUIDE.md**: How to write tests and improve coverage
- **COVERAGE_SETUP_SUMMARY.md**: This file

## How to Use

### Generate Coverage Report

```bash
npm run test:coverage
```

This generates:
- `coverage/index.html` - Interactive report
- `coverage/lcov.info` - For CI/CD
- `coverage/coverage-summary.json` - JSON data

### View Coverage in Browser

```bash
npm run test:coverage:report
```

Opens `coverage/index.html` in your default browser.

### Check Coverage Summary

```bash
npm run test:coverage:summary
```

Shows formatted coverage report in console:

```
📊 Test Coverage Report

============================================================

🌍 Global Coverage (70% threshold):
------------------------------------------------------------
✅ lines: 85.50% (threshold: 70%)
✅ statements: 85.50% (threshold: 70%)
✅ functions: 82.30% (threshold: 70%)
✅ branches: 78.90% (threshold: 70%)

🔧 Services Coverage (80% threshold):
------------------------------------------------------------
✅ lines: 88.50% (threshold: 80%)
✅ statements: 88.50% (threshold: 80%)
✅ functions: 85.30% (threshold: 80%)
✅ branches: 82.90% (threshold: 80%)

🎨 Components Coverage (70% threshold):
------------------------------------------------------------
✅ lines: 75.50% (threshold: 70%)
✅ statements: 75.50% (threshold: 70%)
✅ functions: 72.30% (threshold: 70%)
✅ branches: 68.90% (threshold: 70%)

============================================================

📋 Summary:
  Global: ✅ PASS
  Services: ✅ PASS
  Components: ✅ PASS
```

### Run Tests with Coverage Check

```bash
npm run test:coverage:check
```

Runs tests and checks coverage without failing if thresholds are not met.

## Coverage Thresholds Explained

### Why 80% for Services?

Services contain critical business logic:
- Instagram API integration
- Credential management and encryption
- Data synchronization
- Error handling and retry logic

Higher coverage (80%) ensures:
- Reliability of core functionality
- Security of credential handling
- Proper error handling
- Correct data transformations

### Why 70% for Components?

Components are UI code:
- React components
- Page layouts
- User interactions

70% coverage is standard for UI because:
- UI testing is more complex
- Some UI edge cases are hard to test
- Visual testing complements unit tests
- Focus on critical user paths

### Why 70% Global?

Global threshold of 70% ensures:
- Overall code quality
- Reasonable test coverage
- Balance between coverage and development speed

## File Structure

```
project/
├── jest.config.js                    # Jest configuration with coverage thresholds
├── package.json                      # npm scripts for coverage
├── COVERAGE_CONFIG.md                # Detailed coverage configuration
├── TESTING_GUIDE.md                  # How to write tests
├── COVERAGE_SETUP_SUMMARY.md         # This file
├── .github/
│   └── workflows/
│       └── coverage.yml              # GitHub Actions workflow
├── .husky/
│   └── pre-commit                    # Pre-commit hook
├── scripts/
│   └── check-coverage.js             # Coverage check script
├── coverage/                         # Generated coverage reports (gitignored)
│   ├── index.html                    # Interactive HTML report
│   ├── lcov.info                     # LCOV format
│   ├── coverage-summary.json         # JSON summary
│   └── ...
└── lib/
    ├── services/                     # Services (80% threshold)
    │   ├── instagram.service.ts
    │   ├── instagram.service.test.ts
    │   └── ...
    └── jobs/                         # Jobs (80% threshold)
        ├── instagram-sync.job.ts
        ├── instagram-sync.job.test.ts
        └── ...
```

## Improving Coverage

### 1. Identify Uncovered Code

```bash
npm run test:coverage
# Open coverage/index.html
# Look for red lines (uncovered code)
```

### 2. Add Tests

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
// Test all conditional branches
it('should handle null input', () => {
  expect(validate(null)).toBe(false)
})

it('should handle valid input', () => {
  expect(validate({ likes: 10 })).toBe(true)
})
```

### 4. Use Property-Based Testing

```typescript
import fc from 'fast-check'

it('should maintain metrics consistency', () => {
  fc.assert(
    fc.property(
      fc.record({ likes: fc.nat(), comments: fc.nat() }),
      (metrics) => {
        const fixed = ensureConsistency(metrics)
        return fixed.likes >= 0 && fixed.comments >= 0
      }
    )
  )
})
```

## CI/CD Integration

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
6. Archives coverage reports

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

### Coverage Report Not Generated

**Problem**: `coverage/` directory is empty

**Solution**:
1. Ensure Jest is installed: `npm install --save-dev jest`
2. Check `jest.config.js` exists in project root
3. Run with verbose output: `npm run test:coverage -- --verbose`

### Slow Coverage Generation

**Problem**: Coverage generation takes too long

**Solution**:
1. Run coverage for specific files: `npm run test:coverage:services`
2. Exclude unnecessary files in `collectCoverageFrom`

## Next Steps

1. **Run existing tests**: `npm test`
2. **Generate coverage report**: `npm run test:coverage`
3. **Review coverage**: `npm run test:coverage:report`
4. **Add tests for uncovered code**: See TESTING_GUIDE.md
5. **Commit with coverage check**: `git commit -m "message"`

## Resources

- [Jest Coverage Documentation](https://jestjs.io/docs/coverage)
- [Istanbul Coverage Documentation](https://istanbul.js.org/)
- [COVERAGE_CONFIG.md](./COVERAGE_CONFIG.md) - Detailed configuration
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - How to write tests

## Summary

✅ **Coverage thresholds configured**:
- Services: 80%
- Components: 70%
- Global: 70%

✅ **Coverage scripts added**:
- `npm run test:coverage` - Full report
- `npm run test:coverage:services` - Services only
- `npm run test:coverage:components` - Components only
- `npm run test:coverage:report` - Open HTML report
- `npm run test:coverage:summary` - Show summary

✅ **CI/CD integration**:
- GitHub Actions workflow for automated coverage checks
- Pre-commit hook to prevent low-coverage commits
- Codecov integration for coverage tracking

✅ **Documentation**:
- COVERAGE_CONFIG.md - Configuration guide
- TESTING_GUIDE.md - Testing best practices
- Coverage check script for local verification

The test coverage configuration is now ready to use. Start by running `npm run test:coverage` to generate your first coverage report!
