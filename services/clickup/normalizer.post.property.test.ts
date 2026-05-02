/**
 * Property-Based Tests for Post Normalization
 * 
 * Property 4: Post Normalization Completeness
 * 
 * For any ClickUp task object with custom fields, transforming it to a Post object SHALL:
 * - Extract all specified custom fields (Alcance, Engajamento, Impressões, Cliques, Status, Imagem)
 * - Map custom field IDs to human-readable property names
 * - Provide default values (0 for numbers, empty string for text, null for optional fields) for any missing custom fields
 * - Convert all date fields to ISO 8601 format
 * - Remove unnecessary ClickUp metadata fields
 * - Produce a valid Post object with all required fields present
 * 
 * Validates: Requirements 3.2, 3.3, 17.2, 17.3, 17.4, 17.5, 20.1
 */

import * as fc from 'fast-check'
import { DataNormalizer } from './normalizer'
import type { ClickUpTask, FieldMapping, CustomField, Attachment } from './types'
import type { Post, PostStatus } from '@/modules/performance/types/post.types'

describe('Property 4: Post Normalization Completeness', () => {
  const normalizer = new DataNormalizer()

  // Field mapping for performance module
  const fieldMap: FieldMapping['performance'] = {
    alcance: 'field-alcance',
    engajamento: 'field-engajamento',
    impressoes: 'field-impressoes',
    cliques: 'field-cliques',
    status: 'field-status',
    imagem: 'field-imagem',
  }

  // Arbitraries (generators) for property-based testing

  /**
   * Generates valid PostStatus values
   */
  const postStatusArbitrary = fc.constantFrom<PostStatus>(
    'Publicado',
    'Agendado',
    'Rascunho',
    'Arquivado'
  )

  /**
   * Generates arbitrary custom field values
   */
  const customFieldValueArbitrary = fc.oneof(
    fc.integer({ min: 0, max: 1000000 }), // Numbers for metrics
    fc.constant(null), // Missing values
    fc.constant(undefined), // Undefined values
    fc.string(), // String representations
    fc.double({ min: 0, max: 1000000, noNaN: true }) // Float numbers
  )

  /**
   * Generates a custom field for a specific metric
   */
  const metricCustomFieldArbitrary = (fieldId: string, fieldName: string) =>
    fc.record({
      id: fc.constant(fieldId),
      name: fc.constant(fieldName),
      type: fc.constantFrom('number', 'text'),
      value: customFieldValueArbitrary,
    }) as fc.Arbitrary<CustomField>

  /**
   * Generates a status custom field
   */
  const statusCustomFieldArbitrary = fc.oneof(
    // Valid status
    fc.record({
      id: fc.constant('field-status'),
      name: fc.constant('Status'),
      type: fc.constant('drop_down'),
      value: postStatusArbitrary,
    }) as fc.Arbitrary<CustomField>,
    // Invalid status (should default to Rascunho)
    fc.record({
      id: fc.constant('field-status'),
      name: fc.constant('Status'),
      type: fc.constant('drop_down'),
      value: fc.oneof(fc.string(), fc.constant(null), fc.constant(undefined)),
    }) as fc.Arbitrary<CustomField>,
    // Missing status field
    fc.record({
      id: fc.string(),
      name: fc.string(),
      type: fc.constant('text'),
      value: fc.constant(null),
    }) as fc.Arbitrary<CustomField>
  )

  /**
   * Generates an array of custom fields (may be complete or incomplete)
   */
  const customFieldsArbitrary = fc
    .tuple(
      fc.option(metricCustomFieldArbitrary('field-alcance', 'Alcance'), { nil: undefined }),
      fc.option(metricCustomFieldArbitrary('field-engajamento', 'Engajamento'), {
        nil: undefined,
      }),
      fc.option(metricCustomFieldArbitrary('field-impressoes', 'Impressões'), { nil: undefined }),
      fc.option(metricCustomFieldArbitrary('field-cliques', 'Cliques'), { nil: undefined }),
      fc.option(statusCustomFieldArbitrary, { nil: undefined })
    )
    .map((fields) => fields.filter((f): f is CustomField => f !== undefined))

  /**
   * Generates attachment array (may be empty)
   */
  const attachmentsArbitrary = fc.oneof(
    fc.constant([]), // No attachments
    fc.array(
      fc.record({
        id: fc.string(),
        url: fc.webUrl(),
        title: fc.string(),
        extension: fc.constantFrom('jpg', 'png', 'gif', 'webp'),
      }) as fc.Arbitrary<Attachment>,
      { minLength: 1, maxLength: 3 }
    )
  )

  /**
   * Generates arbitrary date values (valid and invalid)
   */
  const dateArbitrary = fc.oneof(
    fc.integer({ min: 0, max: Date.now() }).map(String), // Unix timestamp as string
    fc.date({ min: new Date('2020-01-01'), max: new Date() }).map((d) => d.toISOString()), // ISO string
    fc.constant('invalid-date'), // Invalid date
    fc.constant(''), // Empty string
    fc.constant(null) // Null
  )

  /**
   * Generates arbitrary ClickUp tasks
   */
  const clickUpTaskArbitrary: fc.Arbitrary<ClickUpTask> = fc.record({
    id: fc.string({ minLength: 1 }),
    name: fc.string({ minLength: 1 }),
    description: fc.string(),
    status: fc.record({
      status: fc.string(),
      color: fc.hexaString({ minLength: 6, maxLength: 6 }).map((s) => `#${s}`),
    }),
    date_created: dateArbitrary,
    date_updated: dateArbitrary,
    custom_fields: customFieldsArbitrary,
    attachments: attachmentsArbitrary,
    list: fc.record({
      id: fc.string(),
      name: fc.string(),
    }),
  })

  /**
   * Property 4.1: All required fields are present in normalized Post
   */
  it('should always produce a Post with all required fields present', () => {
    fc.assert(
      fc.property(clickUpTaskArbitrary, (task) => {
        const result = normalizer.normalizePost(task, fieldMap)

        // All required fields must be present
        expect(result).toHaveProperty('id')
        expect(result).toHaveProperty('title')
        expect(result).toHaveProperty('imageUrl')
        expect(result).toHaveProperty('status')
        expect(result).toHaveProperty('metrics')
        expect(result).toHaveProperty('createdAt')
        expect(result).toHaveProperty('publishedAt')
        expect(result).toHaveProperty('clientId')

        // Metrics object must have all required fields
        expect(result.metrics).toHaveProperty('alcance')
        expect(result.metrics).toHaveProperty('engajamento')
        expect(result.metrics).toHaveProperty('impressoes')
        expect(result.metrics).toHaveProperty('cliques')
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 4.2: Custom field IDs are mapped to human-readable property names
   */
  it('should map custom field IDs to human-readable property names', () => {
    fc.assert(
      fc.property(clickUpTaskArbitrary, (task) => {
        const result = normalizer.normalizePost(task, fieldMap)

        // Result should not contain ClickUp field IDs
        const resultString = JSON.stringify(result)
        expect(resultString).not.toContain('field-alcance')
        expect(resultString).not.toContain('field-engajamento')
        expect(resultString).not.toContain('field-impressoes')
        expect(resultString).not.toContain('field-cliques')
        expect(resultString).not.toContain('field-status')

        // Result should contain human-readable names
        expect(result.metrics).toHaveProperty('alcance')
        expect(result.metrics).toHaveProperty('engajamento')
        expect(result.metrics).toHaveProperty('impressoes')
        expect(result.metrics).toHaveProperty('cliques')
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 4.3: Missing numeric fields default to 0
   */
  it('should provide default value of 0 for missing numeric fields', () => {
    fc.assert(
      fc.property(clickUpTaskArbitrary, (task) => {
        const result = normalizer.normalizePost(task, fieldMap)

        // All metrics must be numbers
        expect(typeof result.metrics.alcance).toBe('number')
        expect(typeof result.metrics.engajamento).toBe('number')
        expect(typeof result.metrics.impressoes).toBe('number')
        expect(typeof result.metrics.cliques).toBe('number')

        // All metrics must be non-negative
        expect(result.metrics.alcance).toBeGreaterThanOrEqual(0)
        expect(result.metrics.engajamento).toBeGreaterThanOrEqual(0)
        expect(result.metrics.impressoes).toBeGreaterThanOrEqual(0)
        expect(result.metrics.cliques).toBeGreaterThanOrEqual(0)

        // Metrics must not be NaN
        expect(result.metrics.alcance).not.toBeNaN()
        expect(result.metrics.engajamento).not.toBeNaN()
        expect(result.metrics.impressoes).not.toBeNaN()
        expect(result.metrics.cliques).not.toBeNaN()
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 4.4: Missing optional fields default to null
   */
  it('should provide default value of null for missing optional fields', () => {
    fc.assert(
      fc.property(clickUpTaskArbitrary, (task) => {
        const result = normalizer.normalizePost(task, fieldMap)

        // imageUrl can be null or string
        expect(result.imageUrl === null || typeof result.imageUrl === 'string').toBe(true)

        // publishedAt can be null or string
        expect(result.publishedAt === null || typeof result.publishedAt === 'string').toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 4.5: All date fields are converted to ISO 8601 format
   */
  it('should convert all date fields to ISO 8601 format', () => {
    fc.assert(
      fc.property(clickUpTaskArbitrary, (task) => {
        const result = normalizer.normalizePost(task, fieldMap)

        // ISO 8601 regex pattern
        const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

        // createdAt must be valid ISO 8601
        expect(result.createdAt).toMatch(iso8601Pattern)
        expect(() => new Date(result.createdAt)).not.toThrow()
        expect(new Date(result.createdAt).toISOString()).toBe(result.createdAt)

        // publishedAt must be null or valid ISO 8601
        if (result.publishedAt !== null) {
          expect(result.publishedAt).toMatch(iso8601Pattern)
          expect(() => new Date(result.publishedAt)).not.toThrow()
          expect(new Date(result.publishedAt).toISOString()).toBe(result.publishedAt)
        }
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 4.6: Unnecessary ClickUp metadata is removed
   */
  it('should remove unnecessary ClickUp metadata fields', () => {
    fc.assert(
      fc.property(clickUpTaskArbitrary, (task) => {
        const result = normalizer.normalizePost(task, fieldMap)

        // Result should not contain ClickUp-specific metadata
        expect(result).not.toHaveProperty('description')
        expect(result).not.toHaveProperty('date_updated')
        expect(result).not.toHaveProperty('custom_fields')
        expect(result).not.toHaveProperty('attachments')
        expect(result).not.toHaveProperty('list')

        // Result should only have Post interface properties
        const allowedKeys = [
          'id',
          'title',
          'imageUrl',
          'status',
          'metrics',
          'createdAt',
          'publishedAt',
          'clientId',
        ]
        const resultKeys = Object.keys(result)
        resultKeys.forEach((key) => {
          expect(allowedKeys).toContain(key)
        })
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 4.7: Status is always a valid PostStatus
   */
  it('should always produce a valid PostStatus', () => {
    fc.assert(
      fc.property(clickUpTaskArbitrary, (task) => {
        const result = normalizer.normalizePost(task, fieldMap)

        const validStatuses: PostStatus[] = ['Publicado', 'Agendado', 'Rascunho', 'Arquivado']
        expect(validStatuses).toContain(result.status)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 4.8: ID and title are preserved from source task
   */
  it('should preserve id and title from source ClickUp task', () => {
    fc.assert(
      fc.property(clickUpTaskArbitrary, (task) => {
        const result = normalizer.normalizePost(task, fieldMap)

        expect(result.id).toBe(task.id)
        expect(result.title).toBe(task.name)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 4.9: Image URL is extracted from first attachment or null
   */
  it('should extract imageUrl from first attachment or set to null', () => {
    fc.assert(
      fc.property(clickUpTaskArbitrary, (task) => {
        const result = normalizer.normalizePost(task, fieldMap)

        if (task.attachments && task.attachments.length > 0) {
          expect(result.imageUrl).toBe(task.attachments[0].url)
        } else {
          expect(result.imageUrl).toBeNull()
        }
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 4.10: publishedAt is set only for Publicado status
   */
  it('should set publishedAt only when status is Publicado', () => {
    fc.assert(
      fc.property(clickUpTaskArbitrary, (task) => {
        const result = normalizer.normalizePost(task, fieldMap)

        if (result.status === 'Publicado') {
          expect(result.publishedAt).not.toBeNull()
          expect(typeof result.publishedAt).toBe('string')
        } else {
          expect(result.publishedAt).toBeNull()
        }
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 4.11: Normalization is idempotent for valid inputs
   */
  it('should produce consistent results for the same input', () => {
    fc.assert(
      fc.property(clickUpTaskArbitrary, (task) => {
        const result1 = normalizer.normalizePost(task, fieldMap)
        const result2 = normalizer.normalizePost(task, fieldMap)

        expect(result1).toEqual(result2)
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 4.12: Type safety - result conforms to Post interface
   */
  it('should produce a result that conforms to Post interface types', () => {
    fc.assert(
      fc.property(clickUpTaskArbitrary, (task) => {
        const result = normalizer.normalizePost(task, fieldMap)

        // Type checks
        expect(typeof result.id).toBe('string')
        expect(typeof result.title).toBe('string')
        expect(result.imageUrl === null || typeof result.imageUrl === 'string').toBe(true)
        expect(typeof result.status).toBe('string')
        expect(typeof result.metrics).toBe('object')
        expect(typeof result.createdAt).toBe('string')
        expect(result.publishedAt === null || typeof result.publishedAt === 'string').toBe(true)
        expect(typeof result.clientId).toBe('string')

        // Metrics type checks
        expect(typeof result.metrics.alcance).toBe('number')
        expect(typeof result.metrics.engajamento).toBe('number')
        expect(typeof result.metrics.impressoes).toBe('number')
        expect(typeof result.metrics.cliques).toBe('number')
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 4.13: Numeric string values are correctly converted to numbers
   */
  it('should convert numeric string values to actual numbers', () => {
    fc.assert(
      fc.property(
        fc.record({
          ...clickUpTaskArbitrary.value,
          custom_fields: fc.constant([
            {
              id: 'field-alcance',
              name: 'Alcance',
              type: 'text' as const,
              value: '1234',
            },
            {
              id: 'field-engajamento',
              name: 'Engajamento',
              type: 'text' as const,
              value: '567.89',
            },
          ]),
        }) as fc.Arbitrary<ClickUpTask>,
        (task) => {
          const result = normalizer.normalizePost(task, fieldMap)

          expect(result.metrics.alcance).toBe(1234)
          expect(result.metrics.engajamento).toBeCloseTo(567.89, 2)
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 4.14: Invalid numeric values default to 0
   */
  it('should default to 0 for invalid numeric values', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          description: fc.string(),
          status: fc.record({
            status: fc.string(),
            color: fc.string(),
          }),
          date_created: fc.constant('2024-01-01'),
          date_updated: fc.constant('2024-01-01'),
          custom_fields: fc.constant([
            {
              id: 'field-alcance',
              name: 'Alcance',
              type: 'text' as const,
              value: 'not-a-number',
            },
            {
              id: 'field-engajamento',
              name: 'Engajamento',
              type: 'text' as const,
              value: 'invalid',
            },
          ]),
          attachments: fc.constant([]),
          list: fc.record({
            id: fc.string(),
            name: fc.string(),
          }),
        }) as fc.Arbitrary<ClickUpTask>,
        (task) => {
          const result = normalizer.normalizePost(task, fieldMap)

          expect(result.metrics.alcance).toBe(0)
          expect(result.metrics.engajamento).toBe(0)
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property 4.15: clientId is initialized as empty string
   */
  it('should initialize clientId as empty string (to be set by BFF)', () => {
    fc.assert(
      fc.property(clickUpTaskArbitrary, (task) => {
        const result = normalizer.normalizePost(task, fieldMap)

        expect(result.clientId).toBe('')
      }),
      { numRuns: 100 }
    )
  })
})
