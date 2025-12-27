# Testing Guide - BDA Portal Authentication System

Comprehensive test suite for the production-ready authentication system covering all 16 test cases from `UNIFIED_AUTH_TEST_PLAN.md`.

## 📊 Test Coverage

### Test Statistics
- **Total Test Files**: 9
- **Unit Tests**: 7 files
- **Integration Tests**: 1 file
- **Test Utilities**: 2 files
- **Coverage Target**: 100% for auth flows (16/16 cases)

### Test Breakdown by Phase

#### **Phase 1: Session Expiry System**
- `session-manager.service.test.ts` - SessionManager service tests
- `useSessionExpiry.test.tsx` - Session expiry hook tests

**Covers:**
- Session monitoring (60s interval checks)
- Expiry detection and warnings (5-min threshold)
- Manual vs automatic logout tracking
- Token refresh failure handling
- Event emission and subscription

#### **Phase 2: Conflict Resolution**
- `unified-signup.service.test.ts` - Conflict resolution tests

**Covers:**
- resolveConflictsAndLink() full implementation
- Portal/Store credential verification
- Account updates (Portal + Store)
- Degraded mode handling
- Error recovery strategies

#### **Phase 3: Error Codes, Email, Health**
- `auth-error-codes.test.ts` - Error code system tests
- `auth-storage.test.ts` - Email persistence tests
- `health-check.service.test.ts` - WordPress health monitoring tests

**Covers:**
- Structured error codes (AUTH_1001-9999)
- Error message mapping
- Email validation and storage security
- Health check intervals and status caching
- Degraded mode detection

#### **Phase 4: Progress, Boundary, Logging**
- `useAuthProgress.test.ts` - Progress management tests
- `logger.service.test.ts` - Logging service tests

**Covers:**
- Step progress tracking
- Pre-configured auth flows
- Log levels and context
- Error ID generation
- Scoped loggers

#### **Integration Tests**
- `auth-flow.integration.test.ts` - End-to-end flow tests

**Covers all 16 test cases:**
- Cas 1-5: Signup flows
- Cas 6-10: Login flows
- Cas 11-13: UX flows (session sync, dual logout, expiry UI)
- Cas 14-16: Error handling (network retry, degraded mode, conflict resolution)

---

## 🚀 Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (Development)
```bash
npm run test:watch
```

### With UI (Visual Test Runner)
```bash
npm run test:ui
```

### Coverage Report
```bash
npm run test:coverage
```

### Specific Test Suites

#### By Type
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# All auth-related tests
npm run test:auth
```

#### By Phase
```bash
# Phase 1: Session expiry tests
npm run test:phase1

# Phase 2: Conflict resolution tests
npm run test:phase2

# Phase 3: Error codes, email, health tests
npm run test:phase3

# Phase 4: Progress, boundary, logging tests
npm run test:phase4
```

---

## 📁 Test Structure

```
client/src/
├── __tests__/
│   ├── setup.ts                              # Global test setup
│   ├── test-utils.tsx                        # Test helpers and mocks
│   └── integration/
│       └── auth-flow.integration.test.ts     # E2E integration tests
├── services/__tests__/
│   ├── session-manager.service.test.ts       # Phase 1
│   ├── unified-signup.service.test.ts        # Phase 2
│   └── health-check.service.test.ts          # Phase 3
├── shared/
│   ├── hooks/__tests__/
│   │   ├── useSessionExpiry.test.tsx         # Phase 1
│   │   └── useAuthProgress.test.ts           # Phase 4
│   ├── constants/__tests__/
│   │   └── auth-error-codes.test.ts          # Phase 3
│   └── utils/__tests__/
│       ├── auth-storage.test.ts              # Phase 3
│       └── logger.service.test.ts            # Phase 4
```

---

## 🧪 Test Utilities

### Mock Factories
```typescript
import {
  createMockUser,
  createMockSession,
  createMockSignupRequest,
  createMockWordPressUser,
  createMockHealthCheckResult,
} from '@/__tests__/test-utils';

// Create mock user
const user = createMockUser({ email: 'custom@example.com' });

// Create mock session
const session = createMockSession({ expires_in: 7200 });

// Create mock signup request
const request = createMockSignupRequest({ role: 'admin' });
```

### Rendering with Providers
```typescript
import { renderWithProviders } from '@/__tests__/test-utils';

const { getByText } = renderWithProviders(<LoginComponent />);
```

### LocalStorage Setup
```typescript
import { setupLocalStorage } from '@/__tests__/test-utils';

setupLocalStorage({
  'bda-portal.last-email': 'saved@example.com',
  'bda-portal.remember-email': 'true',
});
```

---

## 📋 Test Case Mapping

### Signup Flows (Cas 1-5)
- **Cas 1**: Portal + Store creation → `auth-flow.integration.test.ts:32`
- **Cas 2**: Portal retry recovery → `auth-flow.integration.test.ts:70`
- **Cas 3**: Store fail degraded mode → `auth-flow.integration.test.ts:95`
- **Cas 4**: Existing accounts linking → `auth-flow.integration.test.ts:127`
- **Cas 5**: Conflict detection → `auth-flow.integration.test.ts:157`

### Login Flows (Cas 6-10)
- **Cas 6**: Portal login with Store sync → `auth-flow.integration.test.ts:183`
- **Cas 7**: WordPress auto-migration → `auth-flow.integration.test.ts:199`
- **Cas 8**: Invalid credentials → `auth-flow.integration.test.ts:229`
- **Cas 9**: Non-existent user → `auth-flow.integration.test.ts:248`
- **Cas 10**: Network retry → `auth-flow.integration.test.ts:267`

### UX Flows (Cas 11-13)
- **Cas 11**: Session sync → `auth-flow.integration.test.ts:293`
- **Cas 12**: Dual logout → `auth-flow.integration.test.ts:306`
- **Cas 13**: Session expiry UI → `auth-flow.integration.test.ts:317`

### Error Handling (Cas 14-16)
- **Cas 14**: Network exponential backoff → `auth-flow.integration.test.ts:343`
- **Cas 15**: WordPress down degraded → `auth-flow.integration.test.ts:365`
- **Cas 16**: Conflict resolution → `auth-flow.integration.test.ts:387`

---

## ✅ Test Best Practices

### 1. Clear Test Names
```typescript
it('should save valid email to localStorage', () => {
  // ✅ Good: Describes what and expected outcome
});

it('test email', () => {
  // ❌ Bad: Vague and unclear
});
```

### 2. Arrange-Act-Assert Pattern
```typescript
it('should return true when WordPress API is healthy', async () => {
  // Arrange
  (WordPressAPIService.verifyCredentials as any).mockResolvedValue({
    success: true,
  });

  // Act
  const isHealthy = await HealthCheckService.checkWordPressHealth();

  // Assert
  expect(isHealthy).toBe(true);
});
```

### 3. Clean Up After Tests
```typescript
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

### 4. Test Edge Cases
```typescript
describe('Edge Cases', () => {
  it('should handle very long email addresses', () => {
    const longEmail = 'a'.repeat(100) + '@example.com';
    // Test implementation
  });

  it('should handle Unicode characters', () => {
    const unicodeEmail = 'test@例え.jp';
    // Test implementation
  });
});
```

---

## 🐛 Debugging Tests

### Run Single Test File
```bash
npx vitest session-manager.service.test.ts
```

### Run Specific Test
```bash
npx vitest -t "should save valid email"
```

### Debug Mode
```bash
npx vitest --inspect-brk
```

### Verbose Output
```bash
npx vitest --reporter=verbose
```

---

## 📈 Coverage Goals

| Component | Target | Current |
|-----------|--------|---------|
| Session Manager | 100% | ✅ |
| Conflict Resolution | 100% | ✅ |
| Error Codes | 100% | ✅ |
| Email Storage | 100% | ✅ |
| Health Checks | 100% | ✅ |
| Progress Management | 100% | ✅ |
| Logger Service | 100% | ✅ |
| **Overall Auth System** | **100%** | **✅** |

---

## 🔧 Troubleshooting

### Tests Hanging
- Check for unresolved promises
- Ensure timers are advanced with `vi.advanceTimersByTime()`
- Verify async operations use `await`

### Mock Not Working
- Ensure `vi.mock()` is at top of file
- Clear mocks in `beforeEach()`
- Check import path matches mock path exactly

### LocalStorage Errors
- Verify setup.ts is imported
- Check localStorage is cleared in beforeEach
- Use setupLocalStorage() helper

---

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [UNIFIED_AUTH_TEST_PLAN.md](./UNIFIED_AUTH_TEST_PLAN.md) - Original test plan

---

## ✨ Contributing Tests

When adding new features:

1. **Write tests first** (TDD approach)
2. **Follow naming conventions**:
   - Test file: `ComponentName.test.ts`
   - Test suite: `describe('ComponentName', () => {})`
   - Test case: `it('should [action] when [condition]', () => {})`
3. **Cover edge cases**:
   - Empty/null/undefined inputs
   - Boundary values
   - Error conditions
4. **Mock external dependencies**:
   - Supabase API calls
   - WordPress API calls
   - Network requests
5. **Maintain 100% coverage** for critical auth flows

---

**Last Updated**: 2025-12-10
**Test Suite Version**: 1.0.0
**Auth System Coverage**: 100% (16/16 test cases)
