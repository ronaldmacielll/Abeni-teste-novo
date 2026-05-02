# fast-check Generators

This directory contains custom generators (arbitraries) for property-based testing using fast-check.

## Overview

Property-based testing validates universal properties that should hold true across all valid inputs. These generators create random but valid test data to verify system behavior across a wide range of scenarios.

## Configuration

All property tests in this project are configured to run with:
- **100 iterations per test** (as specified in the Testing Strategy)
- **Seed-based reproducibility** for failed test cases
- **Shrinking** to find minimal failing examples

## Available Generators

### ClickUp Generators (`clickup.generators.ts`)

Generators for ClickUp API types:

- `customFieldValueArbitrary(type)` - Generates values based on custom field type
- `customFieldArbitrary(name?, type?)` - Generates CustomField objects
- `attachmentArbitrary` - Generates Attachment objects
- `clickUpTaskPerformanceArbitrary(clientId?)` - Generates ClickUp tasks for Performance Module
- `clickUpTaskFinancialArbitrary(clientId?)` - Generates ClickUp tasks for Financial Module
- `performanceFieldMappingArbitrary` - Generates field mappings for Performance Module
- `financialFieldMappingArbitrary` - Generates field mappings for Financial Module
- `fieldMappingArbitrary` - Generates complete FieldMapping objects

### Transaction Generators (`transaction.generators.ts`)

Generators for financial transaction types:

**Basic Generators:**
- `transactionTypeArbitrary` - Generates 'Entrada' or 'Saída'
- `transactionStatusArbitrary` - Generates 'Pago', 'Pendente', or 'Atrasado'
- `monetaryValueArbitrary` - Generates monetary values (0 to 1,000,000 BRL)
- `taxValueArbitrary` - Generates tax/fee values (0 to 50,000 BRL)
- `dateArbitrary` - Generates ISO 8601 date strings (2020-2030)
- `pastDateArbitrary` - Generates past dates (before today)
- `futureDateArbitrary` - Generates future dates (after today)
- `installmentArbitrary` - Generates Installment objects
- `parcelamentoStringArbitrary` - Generates parcelamento strings ("X/Y")

**Transaction Generators:**
- `transactionArbitrary(overrides?)` - Generates arbitrary Transaction objects
- `transactionsArrayArbitrary(minLength?, maxLength?)` - Generates transaction arrays
- `entradaTransactionArbitrary` - Generates income transactions
- `saidaTransactionArbitrary` - Generates expense transactions
- `pagoTransactionArbitrary` - Generates paid transactions
- `pendenteTransactionArbitrary` - Generates pending transactions
- `atrasadoTransactionArbitrary` - Generates overdue transactions
- `futureTransactionArbitrary` - Generates transactions with future due dates
- `pastTransactionArbitrary` - Generates transactions with past due dates
- `installmentTransactionArbitrary` - Generates transactions with installments

**Period Filters:**
- `periodFilterArbitrary` - Generates period filters with startDate and endDate
- `periodFilterStartOnlyArbitrary` - Generates period filters with only startDate
- `periodFilterEndOnlyArbitrary` - Generates period filters with only endDate

**Specialized Generators:**
- `positiveNetRevenueTransactionsArbitrary` - Generates transactions with positive net revenue
- `negativeNetRevenueTransactionsArbitrary` - Generates transactions with negative net revenue
- `mixedTransactionsArbitrary` - Generates mixed income and expense transactions

### JWT Generators (`jwt.generators.ts`)

Generators for JWT tokens and claims:

**Claims Generators:**
- `userIdArbitrary` - Generates user IDs (UUIDs)
- `emailArbitrary` - Generates email addresses
- `clientIdArbitrary` - Generates client IDs
- `roleArbitrary` - Generates user roles ('client' or 'internal')
- `jwtClaimsArbitrary` - Generates arbitrary JWT claims
- `jwtClaimsWithClientIdArbitrary(clientId)` - Generates claims with specific client_id
- `jwtClaimsWithRoleArbitrary(role)` - Generates claims with specific role
- `expiredJwtClaimsArbitrary` - Generates expired JWT claims
- `validJwtClaimsArbitrary` - Generates valid (non-expired) JWT claims
- `jwtClaimsMissingClientIdArbitrary` - Generates claims without client_id
- `jwtClaimsInvalidClientIdArbitrary` - Generates claims with invalid client_id

**Token Generators:**
- `jwtTokenArbitrary` - Generates signed JWT tokens (async)
- `jwtTokenWithClientIdArbitrary(clientId)` - Generates tokens with specific client_id
- `jwtTokenWithRoleArbitrary(role)` - Generates tokens with specific role
- `expiredJwtTokenArbitrary` - Generates expired tokens
- `validJwtTokenArbitrary` - Generates valid tokens
- `malformedJwtTokenArbitrary` - Generates malformed/invalid tokens

**Pair Generators:**
- `differentClientIdPairArbitrary` - Generates two claims with different client_ids
- `sameClientIdPairArbitrary` - Generates two claims with the same client_id

**Utilities:**
- `generateJWT(claims)` - Helper function to sign JWT tokens
- `TEST_JWT_SECRET_KEY` - Test secret key for JWT signing

## Usage Examples

### Basic Property Test

```typescript
import fc from 'fast-check'
import { transactionArbitrary, transactionsArrayArbitrary } from '@/__tests__/generators'
import { calculateGrossRevenue } from '@/modules/finance/utils/calculations'

describe('Property: Gross Revenue Calculation', () => {
  it('should equal sum of all Entrada transaction values', () => {
    fc.assert(
      fc.property(transactionsArrayArbitrary(), (transactions) => {
        const result = calculateGrossRevenue(transactions)
        const expected = transactions
          .filter(t => t.tipo === 'Entrada')
          .reduce((sum, t) => sum + t.valor, 0)
        
        expect(result).toBeCloseTo(expected, 10)
      }),
      { numRuns: 100 }
    )
  })
})
```

### Using Specialized Generators

```typescript
import fc from 'fast-check'
import { entradaTransactionArbitrary, saidaTransactionArbitrary } from '@/__tests__/generators'

describe('Property: Transaction Type Filtering', () => {
  it('should only include Entrada transactions in income calculation', () => {
    fc.assert(
      fc.property(
        fc.array(entradaTransactionArbitrary, { maxLength: 20 }),
        fc.array(saidaTransactionArbitrary, { maxLength: 20 }),
        (entradas, saidas) => {
          const allTransactions = [...entradas, ...saidas]
          const result = calculateIncome(allTransactions)
          
          // Result should only include Entrada transactions
          const expected = entradas.reduce((sum, t) => sum + t.valor, 0)
          expect(result).toBeCloseTo(expected, 10)
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Async Property Tests with JWT

```typescript
import fc from 'fast-check'
import { jwtClaimsArbitrary, generateJWT } from '@/__tests__/generators'
import { extractClientIdFromToken } from '@/services/auth/jwt'

describe('Property: JWT Client ID Extraction', () => {
  it('should extract client_id from valid JWT', async () => {
    await fc.assert(
      fc.asyncProperty(jwtClaimsArbitrary, async (claims) => {
        const token = await generateJWT(claims)
        const extractedClientId = await extractClientIdFromToken(token)
        
        expect(extractedClientId).toBe(claims.client_id)
      }),
      { numRuns: 100 }
    )
  })
})
```

### Using Overrides

```typescript
import fc from 'fast-check'
import { transactionArbitrary } from '@/__tests__/generators'

describe('Property: Paid Transaction Balance', () => {
  it('should only include paid transactions in balance', () => {
    fc.assert(
      fc.property(
        fc.array(transactionArbitrary({ status: 'Pago' }), { maxLength: 30 }),
        (transactions) => {
          const result = calculateBalance(transactions)
          
          // All transactions are paid, so balance should include all
          const expected = transactions
            .filter(t => t.tipo === 'Entrada')
            .reduce((sum, t) => sum + t.valor, 0) -
            transactions
            .filter(t => t.tipo === 'Saída')
            .reduce((sum, t) => sum + t.valor, 0)
          
          expect(result).toBeCloseTo(expected, 10)
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

## Best Practices

1. **Use Appropriate Generators**: Choose the most specific generator for your test case
2. **Configure Iterations**: Always specify `{ numRuns: 100 }` for consistency
3. **Handle Floating Point**: Use `toBeCloseTo()` for monetary calculations
4. **Filter When Needed**: Use `.filter()` to constrain generated values
5. **Shrinking**: Let fast-check shrink failing examples to minimal cases
6. **Reproducibility**: Use seeds to reproduce failing tests

## Adding New Generators

When adding new generators:

1. Create them in the appropriate file (`clickup`, `transaction`, or `jwt`)
2. Export them from the file
3. Add them to `index.ts`
4. Document them in this README
5. Include usage examples
6. Ensure they generate valid data according to the domain model

## Testing the Generators

Generators themselves should be tested to ensure they produce valid data:

```typescript
import fc from 'fast-check'
import { transactionArbitrary } from '@/__tests__/generators'

describe('Transaction Generator', () => {
  it('should generate valid transactions', () => {
    fc.assert(
      fc.property(transactionArbitrary(), (transaction) => {
        expect(transaction.id).toBeTruthy()
        expect(transaction.valor).toBeGreaterThanOrEqual(0)
        expect(['Entrada', 'Saída']).toContain(transaction.tipo)
        expect(['Pago', 'Pendente', 'Atrasado']).toContain(transaction.status)
      }),
      { numRuns: 100 }
    )
  })
})
```

## References

- [fast-check Documentation](https://fast-check.dev/)
- [Property-Based Testing Guide](https://fast-check.dev/docs/introduction/getting-started/)
- [Design Document - Testing Strategy](../../.kiro/specs/portal-performance-gestao-financeira/design.md#testing-strategy)
