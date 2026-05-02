# Authentication Integration Tests

## Overview

This document describes the integration tests for the authentication flow in the Portal de Performance + Gestão Financeira application.

**Test File:** `__tests__/auth-integration.test.tsx`

**Validates Requirements:** 1.1, 1.2, 1.4, 1.5

## Test Coverage

The integration tests validate the complete authentication flow, including interactions between:

1. **Login Page** (`app/login/page.tsx`)
2. **AuthService** (`services/auth/supabase.ts`)
3. **Authentication Middleware** (`middleware.ts`)
4. **useAuth Hook** (`modules/shared/hooks/useAuth.tsx`)

## Test Suites

### 1. Requirement 1.1: Login with Valid Credentials

Tests successful authentication with valid user credentials.

#### Test Cases:

- **Successfully authenticate user with valid credentials**
  - Fills in email and password
  - Submits the form
  - Verifies AuthService.signIn is called with correct credentials
  - Verifies redirection to `/performance` dashboard

- **Redirect to custom redirect URL after successful login**
  - Tests the `?redirect=` query parameter functionality
  - Verifies user is redirected to the specified URL after login

- **Store session in localStorage after successful login**
  - Verifies session data is persisted in localStorage
  - Checks that accessToken and user information are stored correctly

### 2. Requirement 1.2: Login with Invalid Credentials

Tests error handling for various authentication failure scenarios.

#### Test Cases:

- **Display error message for invalid credentials**
  - Submits wrong email/password combination
  - Verifies error message "Email ou senha inválidos" is displayed
  - Ensures no redirection occurs

- **Display error message for unconfirmed email**
  - Tests the "Email not confirmed" error scenario
  - Verifies appropriate error message is shown

- **Display generic error message for unknown errors**
  - Tests handling of unexpected errors (e.g., network errors)
  - Verifies generic error message is displayed

- **Validate empty email and password**
  - Tests form validation for empty fields
  - Verifies "Preencha todos os campos" error message
  - Ensures AuthService is not called

- **Validate email format**
  - Tests email format validation
  - Verifies "Insira um email válido" error message
  - Ensures AuthService is not called for invalid email format

### 3. Requirement 1.4: Token Refresh

Tests automatic token refresh functionality.

#### Test Cases:

- **Automatically refresh token before expiration**
  - Uses fake timers to simulate time passing
  - Sets up a session that expires in 10 minutes
  - Fast-forwards to 5 minutes before expiration
  - Verifies refreshToken is called automatically

- **Redirect to login if token refresh fails**
  - Tests handling of failed token refresh
  - Verifies user is redirected to `/login`
  - Ensures session is cleared from localStorage

- **Handle expired token on page load**
  - Tests scenario where user loads page with expired token
  - Verifies automatic refresh attempt
  - Checks that new token is obtained and stored

### 4. Requirement 1.5: Redirection After Authentication

Tests redirection behavior for authenticated users.

#### Test Cases:

- **Redirect authenticated users away from login page**
  - Tests that authenticated users accessing `/login` are redirected
  - Verifies redirection to `/performance` by default

- **Preserve redirect parameter when redirecting authenticated users**
  - Tests that `?redirect=` parameter is respected
  - Verifies authenticated users are sent to the specified redirect URL

- **Not redirect unauthenticated users**
  - Verifies unauthenticated users can access login page
  - Ensures no automatic redirection occurs

### 5. Integration: Complete Authentication Flow

Tests the end-to-end authentication flow.

#### Test Cases:

- **Complete full authentication flow from login to dashboard**
  - Step 1: User fills in credentials
  - Step 2: User submits form
  - Step 3: Verify loading state ("Entrando...")
  - Step 4: Verify AuthService.signIn is called
  - Step 5: Verify redirection to dashboard
  - Step 6: Verify session is stored in localStorage

- **Handle sign out and clear session**
  - Tests the sign-out functionality
  - Verifies AuthService.signOut is called
  - Checks that session is cleared from localStorage
  - Verifies redirection to `/login`

## Mocking Strategy

### Next.js Navigation

```typescript
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));
```

- Mocks `useRouter` to track navigation calls
- Mocks `useSearchParams` to control redirect parameter

### AuthService

```typescript
jest.mock('@/services/auth/supabase', () => ({
  authService: {
    signIn: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    refreshToken: jest.fn(),
  },
}));
```

- Mocks all AuthService methods
- Allows control over authentication responses
- Enables testing of error scenarios

### localStorage

```typescript
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
```

- Provides in-memory localStorage implementation
- Allows testing of session persistence
- Cleared between tests for isolation

## Running the Tests

### Run all integration tests:
```bash
npm test -- __tests__/auth-integration.test.tsx
```

### Run with coverage:
```bash
npm test -- __tests__/auth-integration.test.tsx --coverage
```

### Run in watch mode:
```bash
npm test -- __tests__/auth-integration.test.tsx --watch
```

### Run with verbose output:
```bash
npm test -- __tests__/auth-integration.test.tsx --verbose
```

## Test Data

### Mock User Data

```typescript
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  clientId: 'client-456',
  role: 'client' as const,
  metadata: {},
};
```

### Mock Session Data

```typescript
const mockSession = {
  accessToken: 'valid-token',
  refreshToken: 'refresh-token',
  expiresAt: Date.now() / 1000 + 3600, // 1 hour from now
  user: mockUser,
};
```

### Mock Auth Response

```typescript
const mockAuthResponse = {
  user: mockUser,
  session: mockSession,
  token: 'valid-token',
};
```

## Expected Behavior

### Successful Login Flow

1. User enters valid credentials
2. Form validation passes
3. AuthService.signIn is called
4. Session is stored in localStorage
5. Cookies are set for middleware
6. User is redirected to dashboard

### Failed Login Flow

1. User enters invalid credentials
2. Form validation passes
3. AuthService.signIn is called
4. AuthService throws error
5. Error message is displayed
6. No redirection occurs
7. No session is stored

### Token Refresh Flow

1. User has valid session with token expiring soon
2. Timer triggers 5 minutes before expiration
3. AuthService.refreshToken is called
4. New token is obtained
5. Session is updated in localStorage
6. User continues without interruption

### Sign Out Flow

1. User clicks sign out
2. AuthService.signOut is called
3. Session is cleared from localStorage
4. Cookies are cleared
5. User is redirected to login page

## Integration Points

### Login Page → AuthService
- Form submission triggers `authService.signIn(email, password)`
- Error handling for various authentication failures
- Success handling with session storage

### AuthService → useAuth Hook
- Hook manages session state
- Automatic token refresh logic
- Session persistence in localStorage

### useAuth Hook → Middleware
- Middleware reads cookies set by AuthService
- Validates JWT tokens
- Extracts client_id for multi-tenant access control

### Login Page → Navigation
- Redirects to dashboard after successful login
- Respects `?redirect=` query parameter
- Prevents authenticated users from accessing login page

## Maintenance Notes

### Adding New Test Cases

When adding new authentication-related test cases:

1. Follow the existing test structure
2. Use descriptive test names
3. Mock external dependencies
4. Clear mocks and localStorage in `beforeEach`
5. Test both success and failure scenarios
6. Verify side effects (navigation, storage, etc.)

### Updating Mocks

If the AuthService interface changes:

1. Update the mock in the test file
2. Update all test cases using the changed methods
3. Verify all tests still pass
4. Update this documentation

### Common Issues

**Issue:** Tests fail with "Cannot read property 'push' of undefined"
**Solution:** Ensure `useRouter` mock is properly set up in `beforeEach`

**Issue:** localStorage is not cleared between tests
**Solution:** Call `localStorageMock.clear()` in `beforeEach`

**Issue:** Timers don't advance in token refresh tests
**Solution:** Use `jest.useFakeTimers()` and `jest.advanceTimersByTime()`

## Related Files

- `app/login/page.tsx` - Login page component
- `services/auth/supabase.ts` - Authentication service
- `modules/shared/hooks/useAuth.tsx` - Authentication hook
- `middleware.ts` - Authentication middleware
- `.kiro/specs/portal-performance-gestao-financeira/requirements.md` - Requirements document
- `.kiro/specs/portal-performance-gestao-financeira/design.md` - Design document

## Requirements Traceability

| Requirement | Test Suite | Test Cases |
|-------------|------------|------------|
| 1.1 - Valid credentials | Login with Valid Credentials | 3 test cases |
| 1.2 - Invalid credentials | Login with Invalid Credentials | 5 test cases |
| 1.4 - Token expiration | Token Refresh | 3 test cases |
| 1.5 - Redirection | Redirection After Authentication | 3 test cases |

## Success Criteria

All tests must pass with:
- ✅ No TypeScript errors
- ✅ No runtime errors
- ✅ All assertions passing
- ✅ Proper cleanup between tests
- ✅ Mocks properly isolated

## Future Enhancements

Potential improvements for the test suite:

1. **Add E2E tests** using Playwright for real browser testing
2. **Test concurrent login attempts** to verify race condition handling
3. **Test session persistence across page reloads** with real browser storage
4. **Add performance tests** to ensure login completes within 2 seconds (Requirement 13.1)
5. **Test accessibility** of login form and error messages
6. **Add visual regression tests** for error states
7. **Test with real Supabase instance** in staging environment
