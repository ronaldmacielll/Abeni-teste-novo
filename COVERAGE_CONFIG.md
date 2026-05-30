# Test Coverage Configuration

## Overview

This document describes the test coverage configuration for the Instagram Business Integration feature. The configuration ensures:

- **Services (lib/services, lib/jobs)**: Minimum 80% coverage
- **Components (modules, app)**: Minimum 70% coverage
- **Global**: Minimum 70% coverage

## Coverage Thresholds

### Services (80% Coverage)

Services include:
- `lib/services/**/*.ts` - Business logic services (InstagramService, CredentialManager, etc.)
- `lib/jobs/**/*.ts` - Background jobs (InstagramSyncJob)

These require 80% coverage because they contain critical business logic:
- Instagram API integration
- Credential management and encryption
- Data synchronization
- Error handling and retry logic

### Components (70% Coverage)

Components include:
- `modules/**/*.tsx` - React components (InstagramAccountForm, InstagramAccountList, etc.)
- `app/**/*.tsx` - Page components and layouts

These require 70% coverage for UI logic and integration.

### Global (70% Coverage)

All other code must maintain at least 70% coverage.

## Coverage Metrics

Jest tracks four coverage metrics:

1. **Lines**: Percentage of lines executed
2. **Statements**: Percentage of statements executed
3. **Functions**: Percentage of functions called
4. **Branches**: Percentage of conditional branches taken

All metrics must meet the threshold for a test run to pass.

## Running Coverage Reports

### Generate Full Coverage Report

```bash
npm run test:coverage
```

This generates a coverage report in the `coverage/` directory with:
- `coverage/index.html` - Interactive HTML report
- `coverage/lcov.info` - LCOV format for CI/CD integration
- `coverage/coverage-summary.json` - JSON summary

### Generate Service Coverage Report

```bash
npm run test:coverage:services
```

Generates coverage report for services only (lib/services, lib/jobs).

### Generate Component Coverage Report

```bash
npm run test:coverage:components
```

Generates coverage report for components only (modules, app).

### View Coverage Report

```bash
npm run test:coverage:report
```

Generates coverage and opens the HTML report in your default browser.

### Check Coverage Without Failing

```bash
npm run test:coverage:check
```

Runs coverage check without failing the build if thresholds are not met.

## Coverage Report Structure

The HTML coverage report includes:

- **Summary**: Overall coverage percentages
- **File List**: Coverage for each file
- **Line Coverage**: Highlighted source code showing covered/uncovered lines
- **Branch Coverage**: Conditional branches and their coverage status

## Interpreting Coverage Reports

### Green (Good Coverage)
- Lines: 80-100%
- Statements: 80-100%
- Functions: 80-100%
- Branches: 80-100%

### Yellow (Acceptable Coverage)
- Lines: 70-79%
- Statements: 70-79%
- Functions: 70-79%
- Branches: 70-79%

### Red (Below Threshold)
- Lines: <70%
- Statements: <70%
- Functions: <70%
- Branches: <70%

## Improving Coverage

### 1. Identify Uncovered Code

Look for red lines in the HTML report indicating uncovered code.

### 2. Write Tests for Uncovered Code

Add unit tests or integration tests for uncovered functions and branches.

### 3. Test Edge Cases

Ensure tests cover:
- Happy path (normal operation)
- Error cases (exceptions, invalid input)
- Edge cases (boundary values, empty inputs)
- Conditional branches (if/else, switch statements)

### 4. Use Property-Based Testing

For complex logic, use fast-check to generate test cases:

```typescript
import fc from 'fast-check'

it('should validate metrics consistency', () => {
  fc.assert(
    fc.property(
      fc.record({
        likes: fc.nat(),
        comments: fc.nat(),
        engagement: fc.nat(),
      }),
      (metrics) => {
        const result = validateMetrics(metrics)
        return result.likes + result.comments <= result.engagement
      }
    )
  )
})
```

## CI/CD Integration

### GitHub Actions

Add to `.github/workflows/ci.yml`:

```yaml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
    flags: unittests
    name: codecov-umbrella
```

### Pre-commit Hook

Add to `.husky/pre-commit`:

```bash
npm run test:coverage:check
```

## Coverage Exclusions

The following files are excluded from coverage:

- `**/*.d.ts` - TypeScript declaration files
- `**/node_modules/**` - Dependencies
- `**/.next/**` - Next.js build output
- `**/coverage/**` - Coverage reports
- `**/jest.config.js` - Jest configuration

## Monitoring Coverage Over Time

### Track Coverage Trends

1. Store coverage reports in version control
2. Compare coverage percentages across commits
3. Set up alerts for coverage regressions

### Coverage Badges

Add to README.md:

```markdown
![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen)
```

## Best Practices

1. **Write tests first**: Use TDD to ensure coverage
2. **Test behavior, not implementation**: Focus on what code does, not how
3. **Avoid mocking everything**: Test real interactions when possible
4. **Use meaningful assertions**: Each test should verify specific behavior
5. **Keep tests maintainable**: Refactor tests as code evolves
6. **Review coverage regularly**: Check coverage reports before merging PRs

## Troubleshooting

### Coverage Threshold Not Met

1. Run `npm run test:coverage` to see which files are below threshold
2. Add tests for uncovered code
3. Check for dead code that should be removed
4. Consider if threshold is realistic for the code

### Coverage Report Not Generated

1. Ensure Jest is installed: `npm install --save-dev jest`
2. Check jest.config.js is in project root
3. Run `npm run test:coverage` with verbose output: `npm run test:coverage -- --verbose`

### Slow Coverage Generation

1. Exclude unnecessary files in collectCoverageFrom
2. Use `--testPathPattern` to run specific tests
3. Consider running coverage only on changed files in CI/CD

## References

- [Jest Coverage Documentation](https://jestjs.io/docs/coverage)
- [Istanbul Coverage Documentation](https://istanbul.js.org/)
- [Testing Best Practices](https://jestjs.io/docs/getting-started)
