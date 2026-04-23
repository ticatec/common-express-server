# Controller Guide

[中文](./CONTROLLER_CN.md) | English

This guide explains how to use the various controller classes provided by `@ticatec/common-express-server` to build your API endpoints.

## Table of Contents

- [Controller Hierarchy](#controller-hierarchy)
- [BaseController](#basecontroller)
- [CommonController](#commoncontroller)
- [AdminBaseController](#adminbasecontroller)
- [TenantBaseController](#tenantbasecontroller)
- [AdminSearchController](#adminsearchcontroller)
- [TenantSearchController](#tenantsearchcontroller)
- [Complete Examples](#complete-examples)

## Controller Hierarchy

```
BaseController<T>
    ↓
CommonController<T>
    ↓
    ├─→ AdminBaseController<T>  (For platform admin, tenant-independent)
    └─→ TenantBaseController<T> (For tenant-specific operations)
        ↓
        ├─→ AdminSearchController<T> (Admin search operations)
        └─→ TenantSearchController<T> (Tenant search operations)
```

## BaseController

The foundation of all controllers. Provides basic functionality including logging and user context management.

### Features

- **Logging**: Automatic logger instance with `log4js`
- **User Context**: Access to the currently logged user
- **User Impersonation**: Automatic support for `actAs` user impersonation

### Basic Usage

```typescript
import BaseController from '@ticatec/common-express-server/common/BaseController';

interface UserService {
    someMethod(user: any): Promise<any>;
}

class MyController extends BaseController<UserService> {
    constructor(service: UserService) {
        super(service);
    }

    async myEndpoint(req: Request) {
        // Get current logged user (handles actAs automatically)
        const user = this.getLoggedUser(req);

        // Access the injected service
        return await this.service.someMethod(user);
    }
}
```

### Key Methods

#### `getLoggedUser(req: Request): CommonUser`

Returns the current logged user. If user impersonation is active (`actAs`), returns the impersonated user.

```typescript
const user = this.getLoggedUser(req);
console.log(user.accountCode);  // User's account code
console.log(user.name);         // User's name
console.log(user.tenant);       // Tenant info (if applicable)
```

## CommonController

Extends `BaseController` with CRUD operations and validation support.

### Features

- **Automatic Validation**: Built-in validation using `@ticatec/bean-validator`
- **CRUD Operations**: `createNew()`, `update()`, `del()` methods
- **Service Interface Check**: Validates service methods before invocation
- **Request Data Building**: Customizable data extraction from requests

### Usage

```typescript
import CommonController from '@ticatec/common-express-server/common/CommonController';
import { ValidationRules, StringValidator } from '@ticatec/bean-validator';

interface UserService {
    createNew(data: any): Promise<any>;
    update(data: any): Promise<any>;
}

const userValidationRules: ValidationRules = [
    new StringValidator('name', { required: true, minLen: 2, maxLen: 50 }),
    new StringValidator('email', {
        required: true,
        format: {
            regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Invalid email format'
        }
    })
];

class UserController extends CommonController<UserService> {
    constructor(service: UserService) {
        super(service, userValidationRules);
    }

    // Implement abstract methods
    protected getCreateNewArguments(req: Request): Array<any> {
        return [req.body];  // Pass request body to service
    }

    protected getUpdateArguments(req: Request): Array<any> {
        return [req.body];  // Pass request body to service
    }
}

// In your routes
const userController = new UserController(userService);

// POST /users - Create new user
router.post('/users', userController.createNew());

// PUT /users - Update user
router.put('/users/:id', userController.update());

// DELETE /users/:id - Delete user
router.delete('/users/:id', userController.del());
```

### Customizing Data Building

Override `buildNewEntry()` and `buildUpdatedEntry()` to customize data extraction:

```typescript
class UserController extends CommonController<UserService> {
    protected buildNewEntry(req: Request): any {
        // Add createdAt timestamp
        return {
            ...req.body,
            createdAt: new Date().toISOString()
        };
    }

    protected buildUpdatedEntry(req: Request): any {
        // Add updatedAt timestamp
        return {
            ...req.body,
            updatedAt: new Date().toISOString()
        };
    }
}
```

### Protected Methods

#### `validateEntity(data: any)`

Validates entity data against the configured rules. Throws `IllegalParameterError` if validation fails.

#### `checkInterface(name: string)`

Checks if the service has a specific method. Throws `ActionNotFoundError` if not found.

#### `invokeServiceInterface(name: string, args: Array<any>)`

Invokes a service method by name with the provided arguments.

## AdminBaseController

For platform admin operations that are **tenant-independent**. Used by system administrators to manage resources across all tenants.

### Characteristics

- ✅ No user parameter in service calls
- ✅ No tenant filtering
- ✅ Direct data manipulation
- ✅ Requires validation rules

### Usage

```typescript
import AdminBaseController from '@ticatec/common-express-server/common/AdminBaseController';

interface SystemConfigService {
    createNew(config: any): Promise<any>;
    update(config: any): Promise<any>;
}

class SystemConfigController extends AdminBaseController<SystemConfigService> {
    constructor(service: SystemConfigService) {
        super(service, validationRules);
    }
}

// Service method signature: createNew(config: any)
// Arguments passed: [req.body]
```

### When to Use

- System-wide configuration management
- Platform-level features
- Cross-tenant reporting
- Administrative tools

## TenantBaseController

For **tenant-specific** operations. All operations are scoped to the current user's tenant.

### Characteristics

- ✅ First parameter is always the logged user
- ✅ Automatic tenant scoping
- ✅ Supports user impersonation
- ✅ Requires validation rules

### Usage

```typescript
import TenantBaseController from '@ticatec/common-express-server/common/TenantBaseController';

interface ProductService {
    createNew(user: any, data: any): Promise<any>;
    update(user: any, data: any): Promise<any>;
}

class ProductController extends TenantBaseController<ProductService> {
    constructor(service: ProductService) {
        super(service, validationRules);
    }
}

// Service method signature: createNew(user: any, data: any)
// Arguments passed: [loggedUser, req.body]
```

### When to Use

- Tenant data management
- User-specific resources
- Multi-tenant applications
- Business operations

### Example with Routes

```typescript
import { CommonRouter } from '@ticatec/common-express-server';

class ProductRoutes extends CommonRouter {
    private productController = new ProductController(productService);

    protected bindRoutes() {
        // Create product - tenant-scoped
        this.post('/products', this.helper.invokeRestfulAction(
            this.productController.createNew()
        ));

        // Update product - tenant-scoped
        this.put('/products/:id', this.helper.invokeRestfulAction(
            this.productController.update()
        ));

        // Delete product - tenant-scoped
        this.delete('/products/:id', this.helper.invokeRestfulAction(
            this.productController.del()
        ));
    }
}
```

## AdminSearchController

For admin-level search and pagination operations (tenant-independent).

### Characteristics

- ✅ Designed for search/list operations
- ✅ No user parameter
- ✅ Cross-tenant data access
- ✅ Supports pagination

### Usage

```typescript
import AdminSearchController from '@ticatec/common-express-server/common/AdminSearchController';

interface UserAdminService {
    search(query: any, pagination: any): Promise<any>;
}

class UserAdminSearchController extends AdminSearchController<UserAdminService> {
    constructor(service: UserAdminService) {
        super(service);
    }

    buildQuery() {
        return async (req: Request) => {
            this.checkInterface('search');

            const query = this.buildSearchQuery(req);
            const pagination = this.buildPagination(req);

            return await this.invokeServiceInterface('search', [query, pagination]);
        };
    }
}

// Usage in routes
const searchController = new UserAdminSearchController(userAdminService);
router.get('/admin/users', searchController.buildQuery());
```

### When to Use

- Admin user management
- System-wide search
- Cross-tenant reporting
- Audit logs

## TenantSearchController

For tenant-scoped search and pagination operations.

### Characteristics

- ✅ Designed for search/list operations
- ✅ First parameter is logged user
- ✅ Tenant-scoped results
- ✅ Supports pagination

### Usage

```typescript
import TenantSearchController from '@ticatec/common-express-server/common/TenantSearchController';

interface OrderService {
    search(user: any, query: any, pagination: any): Promise<any>;
}

class OrderSearchController extends TenantSearchController<OrderService> {
    constructor(service: OrderService) {
        super(service);
    }

    buildQuery() {
        return async (req: Request) => {
            this.checkInterface('search');

            const user = this.getLoggedUser(req);
            const query = this.buildSearchQuery(req);
            const pagination = this.buildPagination(req);

            return await this.invokeServiceInterface('search', [user, query, pagination]);
        };
    }
}

// Usage in routes
const searchController = new OrderSearchController(orderService);
router.get('/orders', searchController.buildQuery());
```

### When to Use

- User order history
- Tenant data search
- Customer-specific listings
- Personalized content

## Complete Examples

### Example 1: E-commerce Platform (Multi-tenant)

```typescript
// Services
interface ProductService {
    createNew(user: any, data: any): Promise<any>;
    update(user: any, data: any): Promise<any>;
    search(user: any, query: any, pagination: any): Promise<any>;
}

interface OrderService {
    createNew(user: any, data: any): Promise<any>;
    search(user: any, query: any, pagination: any): Promise<any>;
}

// Controllers
import TenantBaseController from '@ticatec/common-express-server/common/TenantBaseController';
import TenantSearchController from '@ticatec/common-express-server/common/TenantSearchController';

class ProductController extends TenantBaseController<ProductService> {
    constructor(service: ProductService) {
        super(service, productValidationRules);
    }
}

class ProductSearchController extends TenantSearchController<ProductService> {
    constructor(service: ProductService) {
        super(service);
    }

    buildQuery() {
        return async (req: Request) => {
            this.checkInterface('search');
            const user = this.getLoggedUser(req);
            const query = this.buildSearchQuery(req);
            const pagination = this.buildPagination(req);
            return await this.invokeServiceInterface('search', [user, query, pagination]);
        };
    }
}

// Routes
import { CommonRouter } from '@ticatec/common-express-server';

class ProductRoutes extends CommonRouter {
    private productController = new ProductController(productService);
    private searchController = new ProductSearchController(productService);

    protected bindRoutes() {
        // CRUD operations
        this.post('/products', this.helper.invokeRestfulAction(
            this.productController.createNew()
        ));

        this.put('/products/:id', this.helper.invokeRestfulAction(
            this.productController.update()
        ));

        // Search
        this.get('/products', this.helper.invokeRestfulAction(
            this.searchController.buildQuery()
        ));
    }
}
```

### Example 2: Platform Admin Panel

```typescript
// Service
interface SystemUserService {
    createNew(data: any): Promise<any>;
    update(data: any): Promise<any>;
    search(query: any, pagination: any): Promise<any>;
}

// Controllers
import AdminBaseController from '@ticatec/common-express-server/common/AdminBaseController';
import AdminSearchController from '@ticatec/common-express-server/common/AdminSearchController';

class SystemUserController extends AdminBaseController<SystemUserService> {
    constructor(service: SystemUserService) {
        super(service, userValidationRules);
    }
}

class SystemUserSearchController extends AdminSearchController<SystemUserService> {
    constructor(service: SystemUserService) {
        super(service);
    }

    buildQuery() {
        return async (req: Request) => {
            this.checkInterface('search');
            const query = this.buildSearchQuery(req);
            const pagination = this.buildPagination(req);
            return await this.invokeServiceInterface('search', [query, pagination]);
        };
    }
}

// Routes (no authentication required, handled by gateway/admin checks)
class AdminUserRoutes extends CommonRouter {
    private userController = new SystemUserController(systemUserService);
    private searchController = new SystemUserSearchController(systemUserService);

    protected getGlobalHandler(): boolean | CustomChecker {
        // Custom admin check
        return (req) => req['user']?.isPlatform === true;
    }

    protected bindRoutes() {
        this.post('/admin/users', this.helper.invokeRestfulAction(
            this.userController.createNew()
        ));

        this.get('/admin/users', this.helper.invokeRestfulAction(
            this.searchController.buildQuery()
        ));
    }
}
```

## Best Practices

### 1. Choose the Right Controller

| Scenario | Use Controller |
|----------|---------------|
| Platform admin operations | `AdminBaseController` |
| Tenant-specific operations | `TenantBaseController` |
| Admin search across all data | `AdminSearchController` |
| Tenant-scoped search | `TenantSearchController` |

### 2. Validation Rules

Always define validation rules for controllers that handle data modification:

```typescript
const validationRules: ValidationRules = [
    new StringValidator('name', { required: true, minLen: 2, maxLen: 100 }),
    new NumberValidator('price', { required: true, minValue: 0 }),
    new StringValidator('email', {
        required: true,
        format: { regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
    })
];
```

### 3. Error Handling

Controllers automatically handle common errors:
- `IllegalParameterError` - Validation failures
- `ActionNotFoundError` - Missing service methods
- `UnauthenticatedError` - User not logged in

### 4. Service Interface Requirements

Ensure your service implements the required methods:

**For AdminBaseController:**
```typescript
interface MyService {
    createNew(data: any): Promise<any>;
    update(data: any): Promise<any>;
}
```

**For TenantBaseController:**
```typescript
interface MyService {
    createNew(user: any, data: any): Promise<any>;
    update(user: any, data: any): Promise<any>;
}
```

**For Search Controllers:**
```typescript
interface MyService {
    search(query: any, pagination: any): Promise<any>;  // Admin
    search(user: any, query: any, pagination: any): Promise<any>;  // Tenant
}
```

## Debug Mode

Enable debug logging for controllers:

```typescript
import BaseController from '@ticatec/common-express-server/common/BaseController';

BaseController.debugEnabled = true;
```

This will log detailed information about request processing.

## Summary

- **BaseController**: Foundation with logging and user context
- **CommonController**: CRUD operations with validation
- **AdminBaseController**: Platform admin, no tenant context
- **TenantBaseController**: Tenant-specific operations with user context
- **AdminSearchController**: Cross-tenant search operations
- **TenantSearchController**: Tenant-scoped search operations

Choose the appropriate controller based on your operational scope and tenant requirements.

---

For more information, see the [main README](./README.md).