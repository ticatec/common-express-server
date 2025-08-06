# @ticatec/common-express-server

[![npm version](https://badge.fury.io/js/@ticatec%2Fcommon-express-server.svg)](https://badge.fury.io/js/@ticatec%2Fcommon-express-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive TypeScript library providing common classes, controllers, and middleware for building scalable Express.js applications with multi-tenant support.

## Features

- 🚀 **Express.js Foundation**: Built on Express.js 5.x with full TypeScript support
- 🏢 **Multi-tenant Architecture**: Built-in support for multi-tenant applications
- 🔐 **Authentication & Authorization**: User authentication and role-based access control
- 🎯 **Controller Patterns**: Pre-built base controllers for common CRUD operations
- 📝 **Validation**: Integrated data validation using bean-validator
- 🔄 **Error Handling**: Centralized error handling and logging
- 🌐 **Internationalization**: Built-in language support via headers
- 📊 **Logging**: Structured logging with log4js integration
- 🎨 **TypeScript First**: Full TypeScript support with comprehensive type definitions

## Installation

```bash
npm install @ticatec/common-express-server
```

### Peer Dependencies

```bash
npm install express@^5.1.0
```

## Quick Start

### 1. Create a Basic Server

```typescript
import { BaseServer, CommonRouterHelper } from '@ticatec/common-express-server';

class MyRouterHelper extends CommonRouterHelper {
    // Add custom middleware or override methods as needed
}

class MyServer extends BaseServer<MyRouterHelper> {
    protected getHelper(): MyRouterHelper {
        return new MyRouterHelper();
    }

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

    protected async setupRoutes(app: Express): Promise<void> {
        // Set up your routes here
        await this.bindRoutes(app, '/users', () => import('./routes/UserRoutes'));
    }
}

// Start the server
const server = new MyServer();
BaseServer.startup(server);
```

### 2. Create Routes

```typescript
import { CommonRoutes, CommonRouterHelper } from '@ticatec/common-express-server';

class UserRoutes extends CommonRoutes<CommonRouterHelper> {
    constructor(helper: CommonRouterHelper) {
        super(helper); // checkUser = true by default
        this.setupRoutes();
    }

    private setupRoutes() {
        this.router.get('/profile', this.helper.invokeRestfulAction(this.getProfile));
        this.router.post('/update', this.helper.invokeRestfulAction(this.updateProfile));
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

### BaseServer<T>

Abstract base server class that provides:
- Express application setup
- Configuration loading
- Route binding
- Error handling
- Health check endpoint
- Static file serving

### CommonRouterHelper

Middleware utilities for:
- JSON response formatting
- Cache control
- User authentication
- Error handling
- Request logging

### CommonRoutes<T>

Base class for route definitions with:
- Express router integration
- User authentication checks
- Logging capabilities

### Controllers Hierarchy

- **BaseController<T>**: Basic controller with logging and user context
- **CommonController<T>**: CRUD operations with validation
- **AdminBaseController<T>**: Admin-specific operations (tenant-independent)
- **TenantBaseController<T>**: Tenant-specific operations
- **AdminSearchController<T>**: Admin search operations
- **TenantSearchController<T>**: Tenant search operations

## Configuration

### Application Configuration

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

### Gateway Architecture

This application is designed to work behind an API Gateway. The gateway handles JWT tokens or session-based authentication and forwards the authenticated user information to the Express application via HTTP headers.

#### Architecture Flow

```
Client Request (JWT/Session) → API Gateway → Express Application
                                    ↓
                            User Info Headers
```

#### Gateway Responsibilities

The API Gateway should:

1. **Authenticate requests** using JWT tokens, session cookies, or other authentication mechanisms
2. **Extract user information** from the authentication token/session
3. **Forward user data** as HTTP headers to the Express application
4. **Handle authorization** and rate limiting as needed

#### User Authentication Headers

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

#### Gateway Implementation Example

Here's an example of how the gateway might process authentication:

```typescript
// Gateway middleware (pseudo-code)
async function processAuthentication(request) {
    // 1. Validate JWT token or session
    const token = request.headers.authorization?.replace('Bearer ', '');
    const userInfo = await validateJWT(token);
    
    // 2. Extract user information
    const user = {
        accountCode: userInfo.sub,
        name: userInfo.name,
        tenant: {
            code: userInfo.tenant_code,
            name: userInfo.tenant_name
        }
    };
    
    // 3. Forward to Express app with user header
    request.headers['user'] = encodeURIComponent(JSON.stringify(user));
    request.headers['x-language'] = userInfo.preferred_language || 'en';
    
    // 4. Proxy request to Express application
    return proxyToExpressApp(request);
}
```

#### Security Considerations

- **No direct authentication**: This Express application does NOT handle JWT validation or session management
- **Trust boundary**: The application trusts that the gateway has properly authenticated users
- **Header validation**: User headers are parsed and validated but not authenticated
- **Network security**: Ensure secure communication between gateway and Express app (internal network/VPN)

### User Impersonation

The library supports user impersonation, which allows privileged system users to act as another user (including cross-tenant operations) for debugging and troubleshooting purposes.

#### How It Works

When a privileged user needs to impersonate another user, the gateway should include both the original user and the target user in the headers:

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

#### Implementation in Controllers

The `BaseController.getLoggedUser()` method automatically handles impersonation:

```typescript
class MyController extends TenantBaseController<MyService> {
    
    async getUserData(req: Request) {
        // This will return the impersonated user if actAs is present,
        // otherwise returns the original user
        const currentUser = this.getLoggedUser(req);
        
        console.log('Operating as:', currentUser.name);
        console.log('Tenant context:', currentUser.tenant.code);
        
        // All operations will be performed in the context of the impersonated user
        return await this.service.getUserData(currentUser);
    }
}
```


#### Use Cases

- **Debug user issues**: Support staff can reproduce problems by acting as the affected user
- **Cross-tenant troubleshooting**: System administrators can debug issues across different tenants
- **Testing user permissions**: Verify that user-specific access controls work correctly
- **Data migration**: Perform operations on behalf of users during system migrations

#### Express Application Responsibilities

The Express application simply:
- **Trusts the gateway**: Accepts user impersonation information from authenticated gateway requests
- **Processes context**: Uses the `actAs` user for all business operations when present
- **No validation**: Does not validate impersonation privileges or restrictions

#### Gateway Responsibilities for Impersonation

All impersonation controls should be handled by the gateway:
- **Privilege validation**: Verify users have permission to impersonate others
- **Audit logging**: Record all impersonation activities for security auditing
- **Time limits**: Implement time-based restrictions on impersonation sessions
- **Session management**: Handle impersonation session lifecycle
- **Cross-tenant controls**: Apply additional checks for cross-tenant impersonation
- **Notification**: Optionally notify target users when their accounts are being impersonated

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

// Validation types (from @ticatec/bean-validator)
export type ValidationRules = Array<BaseValidator>;

// User interfaces
export interface CommonUser {
    accountCode: string;
    name: string;
    tenant: {
        code: string;
        name: string;
    };
    [key: string]: any;
}

export interface LoggedUser extends CommonUser {
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

- 📧 Email: henry@ticatec.com
- 🐛 Issues: [GitHub Issues](https://github.com/ticatec/common-express-server/issues)
- 📚 Documentation: [GitHub Repository](https://github.com/ticatec/common-express-server)

---

Made with ❤️ by [TicaTec](https://github.com/ticatec)