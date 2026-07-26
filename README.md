# @ticatec/common-express-server

[![npm version](https://badge.fury.io/js/@ticatec%2Fcommon-express-server.svg)](https://badge.fury.io/js/@ticatec%2Fcommon-express-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive TypeScript library providing common classes, controllers, and middleware for building scalable Express.js applications with multi-tenant support.

[中文](./README_CN.md) ｜ English

## Features

- 🚀 **Express.js Foundation**: Built on Express.js 5.x with full TypeScript support
- 🏢 **Multi-tenant Architecture**: Built-in support for multi-tenant applications
- 🔐 **Authentication & Authorization**: User authentication and role-based access control
- 🎯 **Controller Patterns**: Pre-built base controllers for common CRUD operations
- 📝 **Validation**: Integrated data validation using bean-validator
- 🔄 **Error Handling**: Centralized error handling and logging
- 🌐 **Internationalization**: Built-in language support via headers
- 📊 **Logging**: Structured logging integrated with `@ticatec/logger-wrapper` and Pino
- 📦 **Dual Module Support**: Full CommonJS and ESM compatibility out of the box

## Documentation

- **[Controller Guide](./CONTROLLER.md)** - Comprehensive guide on using controllers for CRUD and search operations

## Installation

```bash
npm install @ticatec/common-express-server @ticatec/node-common-library @ticatec/logger-wrapper pino
```

### Peer Dependencies

```bash
npm install express@^5.0.0 @ticatec/node-common-library@^3.1.0 @ticatec/logger-wrapper@^0.1.0 pino@>=8.0.0
```

## Quick Start

### 1. Create a Basic Server

```typescript
import { BaseServer } from '@ticatec/common-express-server';

class MyServer extends BaseServer {
    protected async loadConfigFile(): Promise<void> {
        // Load your configuration here
        console.log('Loading configuration...');
    }

    protected getWebConf() {
        return {
            port: 3000,
            ip: '0.0.0.0',
            contextRoot: '/api'
        };
    }

    protected async setupRoutes(): Promise<void> {
        // Set up your routes here
        await this.bindRoutes('/users', () => import('./routes/UserRoutes'));
    }
}

// Start the server
const server = new MyServer();
BaseServer.startup(server);
```

### 2. Create Routes

```typescript
import { CommonRoutes, routerHelper } from '@ticatec/common-express-server';

class UserRoutes extends CommonRoutes {

    // Load additional user data
    protected getUserHook(): ((user: any) => any) | null {
        return async (user) => {
            // Load user preferences
            user.preferences = await loadPreferences(user.accountCode);
            return user;
        };
    }

    protected bindRoutes() {
        this.get('/profile', routerHelper.invokeRestfulAction(this.getProfile));
        this.post('/update', routerHelper.invokeRestfulAction(this.updateProfile));
    }

    private getProfile = async (req: Request) => {
        // Your logic here
        return { message: 'User profile' };
    };

    private updateProfile = async (req: Request) => {
        // Your logic here
        return { message: 'Profile updated' };
    };
}

export default UserRoutes;
```

#### Custom User Hook

The `getUserHook()` method allows you to process and enrich user data after authentication:

```typescript
import { CommonRoutes } from '@ticatec/common-express-server';

class AdminRoutes extends CommonRoutes {

    // Process and enrich user data
    protected getUserHook(): ((user: any) => any) | null {
        return async (user) => {
            if (user) {
                // Load admin-specific data
                user.adminData = await loadAdminData(user.accountCode);
                user.permissions = await loadPermissions(user.accountCode);
                user.settings = await loadSettings(user.accountCode);
            }
            return user;
        };
    }

    protected bindRoutes() {
        this.get('/dashboard', routerHelper.invokeRestfulAction(this.getDashboard));
    }

    private getDashboard = async (req: Request) => {
        // User data is already enriched here
        return {
            dashboard: req['user'].adminData,
            permissions: req['user'].permissions
        };
    };
}
```

#### Authenticated Routes (AuthenticatedRoutes)

Extending `AuthenticatedRoutes` enforces that requests must contain a valid logged-in user (`user != null`). Unauthenticated requests automatically trigger a `401 UnauthenticatedError`:

```typescript
import { AuthenticatedRoutes, routerHelper } from '@ticatec/common-express-server';

class ProtectedUserRoutes extends AuthenticatedRoutes {
    protected bindRoutes() {
        this.get('/profile', routerHelper.invokeRestfulAction(this.getProfile));
    }

    private getProfile = async (req: Request) => {
        // req['user'] is guaranteed to be non-null
        return req['user'];
    };
}
```

#### Server-Wide Custom User Model (CustomUserRegistry)

For applications with extended user attributes (e.g., `userId`, `roles`, `permissions`), you can bind a server-wide user model via TypeScript module augmentation (Declaration Merging):

```typescript
// types/user-registry.d.ts
import { LoggedUser } from '@ticatec/common-express-server';

export interface AppUser extends LoggedUser {
    userId: string;
    roles: string[];
    permissions: string[];
}

declare module '@ticatec/common-express-server' {
    interface CustomUserRegistry {
        user: AppUser;
    }
}
```

Once registered, `this.getLoggedUser(req)` across all controllers, `TenantBaseController` arguments, and route user hooks will **automatically infer as `AppUser`**, avoiding generic boilerplate on every controller!

#### Custom User Validation

The `isValidUser()` method allows you to implement custom validation logic beyond authentication:

```typescript
import { CommonRoutes } from '@ticatec/common-express-server';

class VerifiedUserRoutes extends CommonRoutes {

    // Validate user account status
    protected async isValidUser(user: any): Promise<boolean> {
        if (!user) {
            return false;
        }
        // Check if user account is active
        const account = await database.getAccount(user.accountCode);
        return account && account.status === 'active';
    }

    protected bindRoutes() {
        this.get('/profile', routerHelper.invokeRestfulAction(this.getProfile));
    }

    private getProfile = async (req: Request) => {
        return req['user'];
    };
}
```

**More examples:**

```typescript
// Check user roles
class AdminRoutes extends CommonRoutes {
    protected isValidUser(user: any): boolean {
        return user && user.roles && user.roles.includes('admin');
    }
}

// Tenant validation
class TenantRoutes extends CommonRoutes {
    protected async isValidUser(user: any): Promise<boolean> {
        if (!user || !user.tenant) {
            return false;
        }
        const tenant = await database.getTenant(user.tenant.code);
        return tenant && tenant.isActive;
    }
}
```

#### Custom Authentication Middleware

Use `getGlobalHandler()` to add custom middleware:

```typescript
import { CommonRoutes, routerHelper } from '@ticatec/common-express-server';

class ApiRoutes extends CommonRoutes {

    // Add custom global middleware
    protected getGlobalHandler(): RequestHandler | null {
        return async (req, res, next) => {
            // Check API version
            const version = req.headers['api-version'];
            if (!version) {
                throw new Error('API version is required');
            }
            next();
        };
    }

    protected bindRoutes() {
        this.get('/data', routerHelper.invokeRestfulAction(this.getData));
    }

    private getData = async (req: Request) => {
        return { data: [] };
    };
}
```

#### Public Routes (No Authentication)

```typescript
import { CommonRoutes, routerHelper } from '@ticatec/common-express-server';

class PublicRoutes extends CommonRoutes {

    // Override isValidUser to allow public access (no authentication required)
    protected isValidUser(user: any): boolean {
        return true; // Allow access without authentication
    }

    protected bindRoutes() {
        this.get('/info', routerHelper.invokeRestfulAction(this.getInfo));
    }

    private getInfo = async (req: Request) => {
        return { message: 'Public information' };
    };
}
```

### 3. Create Controllers

```typescript
import { TenantBaseController } from '@ticatec/common-express-server';
import { ValidationRules, StringValidator } from '@ticatec/bean-validator';

interface UserService {
    createNew(user: any, data: any): Promise<any>;
    update(user: any, data: any): Promise<any>;
    search(user: any, query: any): Promise<any>;
}

const userValidationRules: ValidationRules = [
    new StringValidator('name', { required: true, minLen: 2 }),
    new StringValidator('email', {
        required: true,
        format: {
            regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Invalid email format'
        }
    })
];

class UserController extends TenantBaseController<UserService> {
    constructor(userService: UserService) {
        super(userService, userValidationRules);
    }

    // CRUD methods are inherited and automatically validated
    // createNew(), update(), del() are available

    // Add custom methods
    search() {
        return async (req: Request): Promise<any> => {
            const query = req.query;
            this.checkInterface('search');
            return await this.invokeServiceInterface('search', [
                this.getLoggedUser(req),
                query
            ]);
        };
    }
}
```

## Core Classes

### BaseServer

Abstract base server class that provides:
- Express application setup
- Configuration loading
- Route binding
- Error handling
- Health check endpoint
- Static file serving
- **Global user parsing** (non-invasive, for all requests)


**Global Middleware Order:**
```
1. SetNoCache              - Disable caching
2. HealthCheck             - /health-check endpoint
3. RetrieveUser (Global)   - Parse user from headers (non-invasive)
4. Routes                  - All route definitions
5. ActionNotFound          - 404 handler
6. Error Handler           - Error handling
```

### RouterHelper (Singleton)

Middleware utilities for:
- JSON response formatting
- Cache control
- User authentication
- Error handling
- Request logging

**Usage:**
```typescript
import { routerHelper } from '@ticatec/common-express-server';

// Use middleware
routerHelper.setNoCache           // Disable caching
routerHelper.checkLoggedUser()    // Require authentication
routerHelper.retrieveUser()       // Parse user (non-invasive)
routerHelper.actionNotFound()     // 404 handler
routerHelper.invokeRestfulAction() // Wrap async handlers
routerHelper.invokeController()    // Wrap controller handlers
```

### CommonRoutes

Base class for route definitions with:
- Express router integration
- Flexible authentication control
- Custom user validation checks
- User hook support
- Global middleware support
- Logging capabilities
- Built-in HTTP method helpers

**Middleware Order:**
```
1. getUserHook()           - Process and enrich user data
2. isValidUser()             - Custom user validation
3. getGlobalHandler()      - Custom middleware
4. bindRoutes()            - Route definitions
```

**Key Methods:**
- `getUserHook(): ((user: any) => any) | null` - Process user data
- `isValidUser(user: any): boolean | Promise<boolean>` - Custom user validation
- `getGlobalHandler(): RequestHandler | null` - Custom middleware
- `bindRoutes()` - Define your routes

### Controllers Hierarchy

- **BaseController<T>**: Basic controller with logging and user context
- **CommonController<T>**: CRUD operations with validation
- **AdminBaseController<T>**: Admin-specific operations (tenant-independent)
- **TenantBaseController<T>**: Tenant-specific operations
- **AdminSearchController<T>**: Admin search operations
- **TenantSearchController<T>**: Tenant search operations

📚 **[Complete Controller Guide →](./CONTROLLER.md)**

## Architecture Overview

### Request Processing Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    BaseServer Middleware                    │
├─────────────────────────────────────────────────────────────┤
│ 1. SetNoCache              - Disable caching                │
│ 2. HealthCheck             - /health-check endpoint         │
│ 3. RetrieveUser (Global)   - Parse user from headers        │
│ 4. Routes                  - All route definitions          │
│ 5. ActionNotFound          - 404 handler                    │
│ 6. Error Handler           - Error handling                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              CommonRoutes Middleware Order                   │
├─────────────────────────────────────────────────────────────┤
│ 1. getUserHook()           - Process user data             │
│ 2. isValidUser()             - Custom user validation         │
│ 3. getGlobalHandler()      - Custom middleware              │
│ 4. bindRoutes()            - Route definitions              │
└─────────────────────────────────────────────────────────────┘
```

### Configuration

#### Application Configuration

```typescript
import { AppConf } from '@ticatec/common-express-server';

// Initialize configuration
AppConf.init({
    database: {
        host: 'localhost',
        port: 5432
    },
    server: {
        port: 3000
    }
});

// Use configuration
const config = AppConf.getInstance();
const dbHost = config.get('database.host');
const serverPort = config.get('server.port');
```

#### Gateway Architecture

This application is designed to work behind an API Gateway. The gateway handles JWT tokens or session-based authentication and forwards the authenticated user information to the Express application via HTTP headers.

##### Architecture Flow

```
Client Request (JWT/Session) → API Gateway → Express Application
                                    ↓
                            User Info Headers
```

##### Gateway Responsibilities

The API Gateway should:

1. **Authenticate requests** using JWT tokens, session cookies, or other authentication mechanisms
2. **Extract user information** from the authentication token/session
3. **Forward user data** as HTTP headers to the Express application
4. **Handle authorization** and rate limiting as needed

##### User Authentication Headers

The library expects user information in the request headers:

```typescript
// Headers forwarded by the gateway
{
    'user': encodeURIComponent(JSON.stringify({
        accountCode: 'user123',
        name: 'John Doe',
        tenant: { code: 'tenant1', name: 'Tenant One' }
    })),
    'x-language': 'en'
}
```

#### User Impersonation

The library supports user impersonation for debugging and troubleshooting:

```typescript
// Headers with user impersonation
{
    'user': encodeURIComponent(JSON.stringify({
        // Original privileged user
        accountCode: 'admin123',
        name: 'System Admin',
        tenant: { code: 'system', name: 'System Tenant' },

        // User being impersonated
        actAs: {
            accountCode: 'user456',
            name: 'Target User',
            tenant: { code: 'client-a', name: 'Client A' }
        }
    })),
    'x-language': 'en'
}
```

## Multi-tenant Support

The library provides built-in multi-tenant support:

```typescript
// Tenant-specific controller
class ProductController extends TenantBaseController<ProductService> {
    // Automatically receives logged user context
    // All operations are tenant-scoped
}

// Admin controller (cross-tenant)
class SystemController extends AdminBaseController<SystemService> {
    // Operations across all tenants
}
```

## Validation

Built-in validation using `@ticatec/bean-validator`:

```typescript
import { ValidationRules, StringValidator, NumberValidator } from '@ticatec/bean-validator';

const rules: ValidationRules = [
    new StringValidator('name', { required: true, minLen: 2, maxLen: 50 }),
    new StringValidator('email', {
        required: true,
        format: {
            regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Invalid email format'
        }
    }),
    new NumberValidator('age', { required: false, minValue: 18, maxValue: 120 })
];

class UserController extends CommonController<UserService> {
    constructor(service: UserService) {
        super(service, rules); // Validation applied automatically
    }
}
```

## Error Handling

Centralized error handling with `@ticatec/express-exception`:

```typescript
import {
    ActionNotFoundError,
    UnauthenticatedError,
    IllegalParameterError
} from '@ticatec/express-exception';

// Errors are automatically handled and formatted
throw new ActionNotFoundError('Resource not found');
throw new UnauthenticatedError('User not authenticated');
throw new IllegalParameterError('Invalid input data');
```

## API Reference

### Types

```typescript
// Function signatures
export type RestfulFunction = (req: Request) => any;
export type ControlFunction = (req: Request, res: Response) => any;
export type moduleLoader = () => Promise<any>;

// User interfaces
export interface CommonUser {
    accountCode: string;
    name: string;
    tenant?: { // Optional, may not be present for platform admins
        code: string;
        name: string;
    };
    [key: string]: any;
}

export interface LoggedUser extends CommonUser {
    isPlatform?: boolean; // Platform admin flag
    actAs?: CommonUser; // For user impersonation
}
```

## Development

### Build

```bash
npm run build         # Build the project
npm run dev           # Development mode with watch
```

## Requirements

- Node.js >= 18.0.0
- Express.js ^5.1.0
- TypeScript ^5.0.0

## Dependencies

- `@ticatec/bean-validator`: Data validation
- `@ticatec/express-exception`: Error handling
- `@ticatec/node-common-library`: Common utilities
- `log4js`: Logging framework

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:

- 📧 Email: huili.f@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/ticatec/common-express-server/issues)
- 📚 Documentation: [GitHub Repository](https://github.com/ticatec/common-express-server)

---

Made with ❤️ by [TicaTec](https://github.com/ticatec)