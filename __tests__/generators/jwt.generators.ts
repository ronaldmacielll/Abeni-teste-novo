/**
 * fast-check Generators for JWT Tokens
 * 
 * These generators create arbitrary JWT tokens for property-based testing
 * of authentication and authorization logic.
 * 
 * Configuration: 100 iterations per property test (as per Testing Strategy)
 */

import * as fc from 'fast-check'
import { SignJWT } from 'jose'

/**
 * JWT Claims structure
 */
export interface JWTClaims {
  sub: string          // Subject (user ID)
  email: string        // User email
  client_id: string    // Client identifier for multi-tenancy
  role: 'client' | 'internal'
  iat?: number         // Issued at
  exp?: number         // Expiration time
  [key: string]: any   // Additional claims
}

/**
 * Generates arbitrary user IDs (UUIDs)
 */
export const userIdArbitrary: fc.Arbitrary<string> = fc.uuid()

/**
 * Generates arbitrary email addresses
 */
export const emailArbitrary: fc.Arbitrary<string> = fc.emailAddress()

/**
 * Generates arbitrary client IDs
 */
export const clientIdArbitrary: fc.Arbitrary<string> = fc.string({ minLength: 8, maxLength: 32 })

/**
 * Generates arbitrary user roles
 */
export const roleArbitrary: fc.Arbitrary<'client' | 'internal'> = fc.constantFrom('client', 'internal')

/**
 * Generates arbitrary JWT claims
 */
export const jwtClaimsArbitrary: fc.Arbitrary<JWTClaims> = fc.record({
  sub: userIdArbitrary,
  email: emailArbitrary,
  client_id: clientIdArbitrary,
  role: roleArbitrary,
  iat: fc.option(fc.integer({ min: 1577836800, max: 1893456000 }), { nil: undefined }), // 2020-2030
  exp: fc.option(fc.integer({ min: 1577836800, max: 1893456000 }), { nil: undefined }),
})

/**
 * Generates JWT claims with a specific client_id
 */
export const jwtClaimsWithClientIdArbitrary = (clientId: string): fc.Arbitrary<JWTClaims> => {
  return fc.record({
    sub: userIdArbitrary,
    email: emailArbitrary,
    client_id: fc.constant(clientId),
    role: roleArbitrary,
    iat: fc.option(fc.integer({ min: 1577836800, max: 1893456000 }), { nil: undefined }),
    exp: fc.option(fc.integer({ min: 1577836800, max: 1893456000 }), { nil: undefined }),
  })
}

/**
 * Generates JWT claims with a specific role
 */
export const jwtClaimsWithRoleArbitrary = (role: 'client' | 'internal'): fc.Arbitrary<JWTClaims> => {
  return fc.record({
    sub: userIdArbitrary,
    email: emailArbitrary,
    client_id: clientIdArbitrary,
    role: fc.constant(role),
    iat: fc.option(fc.integer({ min: 1577836800, max: 1893456000 }), { nil: undefined }),
    exp: fc.option(fc.integer({ min: 1577836800, max: 1893456000 }), { nil: undefined }),
  })
}

/**
 * Generates expired JWT claims (exp in the past)
 */
export const expiredJwtClaimsArbitrary: fc.Arbitrary<JWTClaims> = fc.record({
  sub: userIdArbitrary,
  email: emailArbitrary,
  client_id: clientIdArbitrary,
  role: roleArbitrary,
  iat: fc.integer({ min: 1577836800, max: 1609459200 }), // 2020-2021
  exp: fc.integer({ min: 1577836800, max: 1609459200 }), // Expired (2020-2021)
})

/**
 * Generates valid (non-expired) JWT claims
 */
export const validJwtClaimsArbitrary: fc.Arbitrary<JWTClaims> = fc.record({
  sub: userIdArbitrary,
  email: emailArbitrary,
  client_id: clientIdArbitrary,
  role: roleArbitrary,
  iat: fc.constant(Math.floor(Date.now() / 1000)),
  exp: fc.constant(Math.floor(Date.now() / 1000) + 3600), // Expires in 1 hour
})

/**
 * Secret key for JWT signing (test purposes only)
 */
const TEST_JWT_SECRET = new TextEncoder().encode('test-secret-key-for-property-based-testing-do-not-use-in-production')

/**
 * Generates a signed JWT token from claims
 * 
 * @param claims - JWT claims to encode
 * @returns Promise<string> - Signed JWT token
 */
export const generateJWT = async (claims: JWTClaims): Promise<string> => {
  const jwt = new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(claims.iat || Math.floor(Date.now() / 1000))
    .setExpirationTime(claims.exp || Math.floor(Date.now() / 1000) + 3600)
    .setSubject(claims.sub)

  return await jwt.sign(TEST_JWT_SECRET)
}

/**
 * Generates arbitrary signed JWT tokens
 * 
 * Note: This is an async arbitrary, use with fc.asyncProperty
 */
export const jwtTokenArbitrary: fc.Arbitrary<Promise<string>> = jwtClaimsArbitrary.map(generateJWT)

/**
 * Generates arbitrary signed JWT tokens with a specific client_id
 */
export const jwtTokenWithClientIdArbitrary = (clientId: string): fc.Arbitrary<Promise<string>> => {
  return jwtClaimsWithClientIdArbitrary(clientId).map(generateJWT)
}

/**
 * Generates arbitrary signed JWT tokens with a specific role
 */
export const jwtTokenWithRoleArbitrary = (role: 'client' | 'internal'): fc.Arbitrary<Promise<string>> => {
  return jwtClaimsWithRoleArbitrary(role).map(generateJWT)
}

/**
 * Generates arbitrary expired JWT tokens
 */
export const expiredJwtTokenArbitrary: fc.Arbitrary<Promise<string>> = expiredJwtClaimsArbitrary.map(generateJWT)

/**
 * Generates arbitrary valid (non-expired) JWT tokens
 */
export const validJwtTokenArbitrary: fc.Arbitrary<Promise<string>> = validJwtClaimsArbitrary.map(generateJWT)

/**
 * Generates arbitrary malformed JWT tokens (invalid format)
 */
export const malformedJwtTokenArbitrary: fc.Arbitrary<string> = fc.oneof(
  fc.string({ minLength: 10, maxLength: 50 }), // Random string
  fc.constant(''), // Empty string
  fc.constant('invalid.jwt'), // Missing parts
  fc.constant('header.payload'), // Missing signature
  fc.constant('not-a-jwt-at-all'), // Completely invalid
  fc.base64String().map(s => `${s}.${s}`), // Only 2 parts
)

/**
 * Generates JWT claims missing the client_id field
 */
export const jwtClaimsMissingClientIdArbitrary: fc.Arbitrary<Omit<JWTClaims, 'client_id'>> = fc.record({
  sub: userIdArbitrary,
  email: emailArbitrary,
  role: roleArbitrary,
  iat: fc.option(fc.integer({ min: 1577836800, max: 1893456000 }), { nil: undefined }),
  exp: fc.option(fc.integer({ min: 1577836800, max: 1893456000 }), { nil: undefined }),
})

/**
 * Generates JWT claims with invalid client_id (empty or whitespace)
 */
export const jwtClaimsInvalidClientIdArbitrary: fc.Arbitrary<JWTClaims> = fc.record({
  sub: userIdArbitrary,
  email: emailArbitrary,
  client_id: fc.constantFrom('', ' ', '  ', '\t', '\n'),
  role: roleArbitrary,
  iat: fc.option(fc.integer({ min: 1577836800, max: 1893456000 }), { nil: undefined }),
  exp: fc.option(fc.integer({ min: 1577836800, max: 1893456000 }), { nil: undefined }),
})

/**
 * Generates a pair of JWT claims with different client_ids
 * Useful for testing authorization failures
 */
export const differentClientIdPairArbitrary: fc.Arbitrary<[JWTClaims, JWTClaims]> = fc
  .tuple(clientIdArbitrary, clientIdArbitrary)
  .filter(([id1, id2]) => id1 !== id2)
  .chain(([clientId1, clientId2]) =>
    fc.tuple(
      jwtClaimsWithClientIdArbitrary(clientId1),
      jwtClaimsWithClientIdArbitrary(clientId2)
    )
  )

/**
 * Generates a pair of JWT claims with the same client_id
 * Useful for testing authorization success
 */
export const sameClientIdPairArbitrary: fc.Arbitrary<[JWTClaims, JWTClaims]> = clientIdArbitrary.chain(
  (clientId) =>
    fc.tuple(
      jwtClaimsWithClientIdArbitrary(clientId),
      jwtClaimsWithClientIdArbitrary(clientId)
    )
)

/**
 * Export the test secret for use in tests
 */
export const TEST_JWT_SECRET_KEY = TEST_JWT_SECRET
