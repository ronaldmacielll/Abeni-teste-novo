/**
 * Property-Based Tests for Parcelamento Parsing
 * 
 * Property 14: Parcelamento Parsing
 * 
 * For any valid parcelamento string in the format "X/Y" (where X and Y are positive integers),
 * parsing SHALL extract the current installment number X and total installments Y such that 1 ≤ X ≤ Y.
 * 
 * **Validates: Requirements 10.1**
 */

import * as fc from 'fast-check'
import { parseParcelamento } from './calculations'

describe('Property 14: Parcelamento Parsing', () => {
  // Arbitraries (generators) for property-based testing

  /**
   * Generates valid parcelamento strings in format "X/Y" where 1 ≤ X ≤ Y
   */
  const validParcelamentoArbitrary = fc
    .tuple(
      fc.integer({ min: 1, max: 100 }), // total installments
      fc.integer({ min: 1, max: 100 })  // current installment
    )
    .filter(([total, current]) => current <= total)
    .map(([total, current]) => `${current}/${total}`)

  /**
   * Generates invalid parcelamento strings (various invalid formats)
   */
  const invalidParcelamentoArbitrary = fc.oneof(
    fc.string().filter(s => !s.match(/^\d+\/\d+$/)), // Not matching X/Y pattern
    fc.constant('0/10'),                              // Current = 0
    fc.constant('10/0'),                              // Total = 0
    fc.constant('5/3'),                               // Current > Total
    fc.constant('abc/def'),                           // Non-numeric
    fc.constant('10'),                                // Missing slash
    fc.constant('/10'),                               // Missing current
    fc.constant('10/'),                               // Missing total
    fc.constant('10/10/10'),                          // Too many parts
    fc.constant('-5/10'),                             // Negative current
    fc.constant('5/-10'),                             // Negative total
  )

  /**
   * Property 14.1: Valid format extracts correct current and total values
   */
  it('should extract current and total installment numbers from valid format', () => {
    fc.assert(
      fc.property(validParcelamentoArbitrary, (parcelamentoStr) => {
        const result = parseParcelamento(parcelamentoStr)

        expect(result).not.toBeNull()

        const [currentStr, totalStr] = parcelamentoStr.split('/')
        const expectedCurrent = parseInt(currentStr, 10)
        const expectedTotal = parseInt(totalStr, 10)

        expect(result!.current).toBe(expectedCurrent)
        expect(result!.total).toBe(expectedTotal)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 14.2: Parsed values satisfy constraint 1 ≤ current ≤ total
   */
  it('should ensure parsed values satisfy 1 ≤ current ≤ total', () => {
    fc.assert(
      fc.property(validParcelamentoArbitrary, (parcelamentoStr) => {
        const result = parseParcelamento(parcelamentoStr)

        expect(result).not.toBeNull()
        expect(result!.current).toBeGreaterThanOrEqual(1)
        expect(result!.total).toBeGreaterThanOrEqual(1)
        expect(result!.current).toBeLessThanOrEqual(result!.total)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 14.3: Null input returns null
   */
  it('should return null for null input', () => {
    const result = parseParcelamento(null)
    expect(result).toBeNull()
  })

  /**
   * Property 14.4: Undefined input returns null
   */
  it('should return null for undefined input', () => {
    const result = parseParcelamento(undefined)
    expect(result).toBeNull()
  })

  /**
   * Property 14.5: Invalid format returns null
   */
  it('should return null for invalid format strings', () => {
    fc.assert(
      fc.property(invalidParcelamentoArbitrary, (parcelamentoStr) => {
        const result = parseParcelamento(parcelamentoStr)
        expect(result).toBeNull()
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 14.6: Empty string returns null
   */
  it('should return null for empty string', () => {
    const result = parseParcelamento('')
    expect(result).toBeNull()
  })

  /**
   * Property 14.7: Whitespace-only string returns null
   */
  it('should return null for whitespace-only strings', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(' ', '\t', '\n'), { minLength: 1, maxLength: 10 }),
        (whitespaceStr) => {
          const result = parseParcelamento(whitespaceStr)
          expect(result).toBeNull()
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 14.8: Current = 0 returns null (violates 1 ≤ current)
   */
  it('should return null when current installment is 0', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (total) => {
        const result = parseParcelamento(`0/${total}`)
        expect(result).toBeNull()
      }),
      { numRuns: 50 }
    )
  })

  /**
   * Property 14.9: Total = 0 returns null (violates 1 ≤ total)
   */
  it('should return null when total installments is 0', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (current) => {
        const result = parseParcelamento(`${current}/0`)
        expect(result).toBeNull()
      }),
      { numRuns: 50 }
    )
  })

  /**
   * Property 14.10: Current > Total returns null (violates current ≤ total)
   */
  it('should return null when current exceeds total', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 50 }),
        (current, offset) => {
          const total = current - offset // Ensure total < current
          if (total < 1) return // Skip invalid totals

          const result = parseParcelamento(`${current}/${total}`)
          expect(result).toBeNull()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 14.11: Negative current returns null
   */
  it('should return null for negative current installment', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: -1 }),
        fc.integer({ min: 1, max: 100 }),
        (current, total) => {
          const result = parseParcelamento(`${current}/${total}`)
          expect(result).toBeNull()
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 14.12: Negative total returns null
   */
  it('should return null for negative total installments', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: -100, max: -1 }),
        (current, total) => {
          const result = parseParcelamento(`${current}/${total}`)
          expect(result).toBeNull()
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 14.13: First installment (1/N) parses correctly
   */
  it('should correctly parse first installment (1/N)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (total) => {
        const result = parseParcelamento(`1/${total}`)

        expect(result).not.toBeNull()
        expect(result!.current).toBe(1)
        expect(result!.total).toBe(total)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 14.14: Last installment (N/N) parses correctly
   */
  it('should correctly parse last installment (N/N)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (total) => {
        const result = parseParcelamento(`${total}/${total}`)

        expect(result).not.toBeNull()
        expect(result!.current).toBe(total)
        expect(result!.total).toBe(total)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 14.15: Single installment (1/1) parses correctly
   */
  it('should correctly parse single installment (1/1)', () => {
    const result = parseParcelamento('1/1')

    expect(result).not.toBeNull()
    expect(result!.current).toBe(1)
    expect(result!.total).toBe(1)
  })

  /**
   * Property 14.16: Large installment numbers parse correctly
   */
  it('should handle large installment numbers', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        (total, current) => {
          if (current > total) return // Skip invalid combinations

          const result = parseParcelamento(`${current}/${total}`)

          expect(result).not.toBeNull()
          expect(result!.current).toBe(current)
          expect(result!.total).toBe(total)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 14.17: Parsing is idempotent (calling multiple times returns same result)
   */
  it('should return the same result when called multiple times with same input', () => {
    fc.assert(
      fc.property(validParcelamentoArbitrary, (parcelamentoStr) => {
        const result1 = parseParcelamento(parcelamentoStr)
        const result2 = parseParcelamento(parcelamentoStr)
        const result3 = parseParcelamento(parcelamentoStr)

        expect(result1).toEqual(result2)
        expect(result2).toEqual(result3)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 14.18: Extra whitespace in string returns null
   */
  it('should return null for strings with extra whitespace', () => {
    fc.assert(
      fc.property(validParcelamentoArbitrary, (parcelamentoStr) => {
        const withLeadingSpace = ` ${parcelamentoStr}`
        const withTrailingSpace = `${parcelamentoStr} `
        const withBothSpaces = ` ${parcelamentoStr} `

        expect(parseParcelamento(withLeadingSpace)).toBeNull()
        expect(parseParcelamento(withTrailingSpace)).toBeNull()
        expect(parseParcelamento(withBothSpaces)).toBeNull()
      }),
      { numRuns: 50 }
    )
  })

  /**
   * Property 14.19: Decimal numbers return null
   */
  it('should return null for decimal numbers', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1.1, max: 100.9, noNaN: true }),
        fc.double({ min: 1.1, max: 100.9, noNaN: true }),
        (current, total) => {
          const result = parseParcelamento(`${current}/${total}`)
          expect(result).toBeNull()
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 14.20: Leading zeros are handled correctly
   */
  it('should parse strings with leading zeros correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (total, current) => {
          if (current > total) return // Skip invalid combinations

          // Add leading zeros
          const currentStr = current.toString().padStart(3, '0')
          const totalStr = total.toString().padStart(3, '0')
          const result = parseParcelamento(`${currentStr}/${totalStr}`)

          expect(result).not.toBeNull()
          expect(result!.current).toBe(current)
          expect(result!.total).toBe(total)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 14.21: Result object has correct structure
   */
  it('should return object with correct structure for valid input', () => {
    fc.assert(
      fc.property(validParcelamentoArbitrary, (parcelamentoStr) => {
        const result = parseParcelamento(parcelamentoStr)

        expect(result).not.toBeNull()
        expect(typeof result).toBe('object')
        expect(result).toHaveProperty('current')
        expect(result).toHaveProperty('total')
        expect(typeof result!.current).toBe('number')
        expect(typeof result!.total).toBe('number')
        expect(Object.keys(result!)).toHaveLength(2)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 14.22: Non-string types return null (type safety)
   */
  it('should handle non-string types gracefully', () => {
    // TypeScript will catch these at compile time, but testing runtime behavior
    expect(parseParcelamento(null)).toBeNull()
    expect(parseParcelamento(undefined)).toBeNull()
  })

  /**
   * Property 14.23: Special characters in string return null
   */
  it('should return null for strings with special characters', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom('!', '@', '#', '$', '%', '^', '&', '*'), {
          minLength: 1,
          maxLength: 10,
        }),
        (specialChars) => {
          const result = parseParcelamento(specialChars)
          expect(result).toBeNull()
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 14.24: Multiple slashes return null
   */
  it('should return null for strings with multiple slashes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (a, b, c) => {
          const result = parseParcelamento(`${a}/${b}/${c}`)
          expect(result).toBeNull()
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 14.25: Very large numbers are handled correctly
   */
  it('should handle very large installment numbers', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        (total, current) => {
          if (current > total) return // Skip invalid combinations

          const result = parseParcelamento(`${current}/${total}`)

          expect(result).not.toBeNull()
          expect(result!.current).toBe(current)
          expect(result!.total).toBe(total)
        }
      ),
      { numRuns: 100 }
    )
  })
})
