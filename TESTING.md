# Testing Framework

This document outlines our comprehensive testing strategy for the Nivaran CivicReportApp project.

## Overview

Our testing framework covers:
- **Unit Tests**: Individual components, utilities, and services
- **Integration Tests**: API endpoints and service interactions  
- **Component Tests**: React Native UI components with user interactions
- **Error Handling**: Error boundaries and exception scenarios

## Test Structure

```
CivicReportApp/src/__tests__/
├── components/           # React Native component tests
├── services/            # API service and utility tests
├── utils/              # Helper function tests
└── setup.ts            # Test configuration and mocks

backend/src/__tests__/
├── integration/        # API endpoint tests
├── unit/              # Service and utility tests
└── setup.js           # Backend test configuration
```

## Running Tests

### Frontend (React Native)
```bash
cd CivicReportApp
npm test                    # Run all tests
npm test -- --watch       # Watch mode
npm test -- --coverage    # With coverage report
npm test -- ErrorBoundary # Run specific tests
```

### Backend (Node.js)
```bash
cd backend
npm test                    # Run all tests
npm test -- --watch       # Watch mode
npm test -- --coverage    # With coverage report
npm run test:integration   # Run integration tests only
```

### AI Service (Python)
```bash
cd ai-service
pytest                     # Run all tests
pytest --cov              # With coverage
pytest tests/test_api.py   # Specific test file
```

## Test Categories

### 1. Component Tests
Tests React Native components with:
- Rendering validation
- User interaction simulation
- Props and state management
- Navigation behavior
- API integration

**Example**: `ReportScreen.test.tsx`
- Form validation
- Image picker integration
- Location services
- API submission

### 2. Service Tests
Tests API services and utilities:
- HTTP request/response handling
- Error scenarios
- Data transformation
- Authentication flows

**Example**: `ApiService.test.tsx`
- GET/POST/PUT requests
- Error handling (4xx, 5xx)
- Query parameter handling
- Authorization headers

### 3. Integration Tests
Tests API endpoints end-to-end:
- Request validation
- Database operations
- Response formatting
- Error handling

**Example**: `reports.test.js`
- CRUD operations
- Input validation
- Database error scenarios
- Authorization checks

### 4. Utility Tests
Tests helper functions:
- Data formatting
- Validation logic
- Error handling utilities
- Logging functionality

**Example**: `logger.test.ts`
- Log level filtering
- Error formatting
- File output validation

## Mocking Strategy

### Frontend Mocks
- **Expo modules**: Location, ImagePicker, Camera
- **React Native**: Alert, AsyncStorage, Navigation
- **API calls**: Fetch requests and responses
- **External services**: Supabase client

### Backend Mocks
- **Database**: Supabase client operations
- **External APIs**: AI service calls
- **File system**: Upload and storage operations
- **Environment**: Configuration variables

### Test Data
Consistent test data across all test suites:
- Sample reports with valid/invalid data
- User authentication scenarios
- Location coordinates
- Image upload payloads

## Coverage Requirements

| Component Type | Minimum Coverage |
|----------------|------------------|
| Services       | 90%              |
| Components     | 85%              |
| Utilities      | 95%              |
| API Routes     | 90%              |

## Testing Best Practices

### 1. Test Naming
```javascript
describe('ComponentName', () => {
  describe('when condition', () => {
    it('should expected behavior', () => {
      // Test implementation
    });
  });
});
```

### 2. Mock Management
```javascript
beforeEach(() => {
  jest.clearAllMocks();
  // Reset specific mocks
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

### 3. Async Testing
```javascript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  
  await waitFor(() => {
    expect(mockFunction).toHaveBeenCalled();
  });
  
  expect(result).toBeDefined();
});
```

### 4. Error Testing
```javascript
it('should handle errors gracefully', async () => {
  mockFunction.mockRejectedValue(new Error('Test error'));
  
  await expect(functionUnderTest()).rejects.toThrow('Test error');
  
  expect(errorHandler).toHaveBeenCalled();
});
```

## Continuous Integration

Tests are automatically run on:
- **Pre-commit**: Unit tests for changed files
- **Pull Request**: Full test suite
- **Main branch**: Full suite + coverage report
- **Release**: All tests + integration tests

## Test Data Management

### Static Test Data
Located in `__tests__/fixtures/`:
- Sample reports
- User profiles
- Location data
- API responses

### Dynamic Test Data
Generated during tests:
- Random IDs
- Timestamps
- Coordinates
- File uploads

## Performance Testing

### Load Testing
- API endpoint response times
- Database query performance
- Image upload handling
- Concurrent user scenarios

### Memory Testing
- Component mount/unmount cycles
- Memory leak detection
- Resource cleanup validation

## Security Testing

### Input Validation
- SQL injection prevention
- XSS protection
- File upload security
- API rate limiting

### Authentication
- Token validation
- Session management
- Permission checks
- Unauthorized access prevention

## Debugging Tests

### Common Issues
1. **Mock not working**: Check import paths and hoisting
2. **Async test failing**: Use proper await/waitFor patterns
3. **React Native warnings**: Mock native modules properly
4. **Database errors**: Ensure proper test isolation

### Debug Tools
```bash
# Verbose test output
npm test -- --verbose

# Debug specific test
npm test -- --testNamePattern="specific test"

# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Future Enhancements

1. **E2E Testing**: Detox for full app testing
2. **Visual Testing**: Screenshot comparison
3. **Performance Monitoring**: Bundle size and load time tracking
4. **Accessibility Testing**: Screen reader and accessibility compliance
5. **Cross-platform Testing**: iOS and Android specific scenarios