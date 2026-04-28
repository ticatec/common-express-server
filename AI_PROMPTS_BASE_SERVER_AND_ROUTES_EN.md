# AI Programming Prompts: BaseServer and CommonRoutes

This document provides detailed prompts for AI-assisted programming to help developers understand and use the BaseServer and CommonRoutes classes from the `@ticatec/common-express-server` framework.

---

## Prompt 1: Create Custom Server Class

```
Please help me create a custom server class that extends BaseServer. Requirements:

1. Implement loadConfigFile() to load configuration from './config/app.json' and initialize with AppConf.init()
2. Implement getWebConf() to return:
   - port: read from config, default 3000
   - ip: '0.0.0.0'
   - contextRoot: read from config, default '/api'
3. Implement setupRoutes() to bind:
   - '/api/users' -> UserRoutes
   - '/api/products' -> ProductRoutes
   - '/api/admin' -> AdminRoutes
4. Initialize database connection in beforeStart()
5. Configure CORS in setupExpress() to allow all origins

Ensure:
- Use async/await for asynchronous operations
- Use AppConf.getInstance().get() to read configuration
- Use await this.bindRoutes(path, loader) to bind routes
- Add appropriate error handling and logging
```

---

## Prompt 2: Create Authenticated Route Class

```
Please help me create a route class that extends CommonRoutes for user management. Requirements:

1. Class name: UserRoutes, constructor takes no parameters
2. Implement userCheck() to verify user is logged in and account status is 'active'
3. Implement bindRoutes() to define:
   - GET /profile - Get current user profile
   - PUT /profile - Update user profile
   - POST /change-password - Change password
   - GET /settings - Get user settings
4. Use routerHelper.invokeRestfulAction() to wrap all route handlers
5. Define all handlers as arrow function class properties
6. Add appropriate logging

Ensure:
- Get user information from req['user']
- Handle user impersonation (actAs) scenarios
- Return standard RESTful responses
- Use this.logger for operation logging
```

---

## Prompt 3: Create Admin Route with User Hook

```
Please help me create an admin route class that extends CommonRoutes. Requirements:

1. Class name: AdminRoutes
2. Implement getUserHook() to load admin permissions before validation:
   - Load admin roles from database
   - Check if admin has necessary permissions
   - Add permissions to user.permissions
3. Implement userCheck() to verify user is platform admin (user.isPlatform === true)
4. Implement getGlobalHandler() to add global middleware checking 'x-admin-token' header
5. Implement bindRoutes() to define admin routes:
   - GET /users - Get all users list
   - POST /users - Create new user
   - PUT /users/:id - Update user
   - DELETE /users/:id - Delete user
   - GET /stats - Get platform statistics
6. Use mergeParams: true in constructor

Ensure:
- Use async operations in getUserHook to load permissions
- Check both original user and actAs user in userCheck
- Throw appropriate errors in getGlobalHandler (e.g., IllegalParameterError)
- Wrap all routes with routerHelper.invokeRestfulAction
```

---

## Prompt 4: Create Tenant Route Class

```
Please help me create a tenant-specific route class that extends CommonRoutes. Requirements:

1. Class name: TenantRoutes
2. Implement getUserHook() to load tenant-specific data:
   - Load tenant configuration
   - Load tenant feature flags
   - Verify tenant is valid
   - Add tenant data to user.tenantData
3. Implement userCheck() to verify:
   - User is logged in
   - User is associated with a valid tenant
   - Tenant status is 'active'
4. Implement bindRoutes() to define tenant routes:
   - GET /info - Get tenant information
   - GET /members - Get tenant members list
   - POST /members - Invite member
   - PUT /members/:id - Update member role
   - DELETE /members/:id - Remove member
5. Each route handler should:
   - Use this.getLoggedUser(req) to get current user
   - Get tenant info from user.tenantData
   - Return appropriate data or errors

Ensure:
- Catch and handle errors when loading tenant data in getUserHook
- Check user.tenant exists and is valid in userCheck
- Wrap all database operations with try-catch
- Use this.logger.debug for debug logging
```

---

## Prompt 5: Complete Application Setup

```
Please help me create a complete Express application using @ticatec/common-express-server framework. Requirements:

Project structure:
```
src/
├── server/
│   ├── MyServer.ts          # Main server class
│   └── routes/
│       ├── UserRoutes.ts    # User routes
│       ├── ProductRoutes.ts # Product routes
│       └── AdminRoutes.ts   # Admin routes
├── services/
│   ├── UserService.ts       # User service
│   └── ProductService.ts    # Product service
├── config/
│   └── app.json             # App configuration
└── index.ts                 # Entry file
```

Requirements:
1. MyServer extends BaseServer
   - Load configuration from config/app.json
   - Initialize database connection
   - Configure CORS
   - Bind all routes
   - Start server

2. UserRoutes extends CommonRoutes
   - Implement user verification check
   - Provide user profile management routes
   - Provide password change route

3. ProductRoutes extends CommonRoutes
   - Implement tenant verification
   - Provide product CRUD routes
   - Use TenantBaseController and TenantSearchController

4. AdminRoutes extends CommonRoutes
   - Implement admin verification
   - Provide user management routes
   - Provide system statistics routes

5. Service layer implements all business logic

6. index.ts starts the server

Please generate complete code with error handling, logging, and type definitions.
```

---

## Usage Tips

These prompts can be directly copied to AI assistants (like Claude, ChatGPT, etc.) to help them generate code that follows `@ticatec/common-express-server` framework conventions.

Usage tips:
1. Modify the details in prompts according to your specific needs
2. Combine requirements from multiple prompts
3. If generated code has issues, point out specific problems and ask for regeneration
4. Add your business logic requirements to the prompts

---

## Key Concepts Quick Reference

### BaseServer Methods to Implement:
- `loadConfigFile(): Promise<void>` - Load configuration
- `getWebConf(): any` - Return server configuration
- `setupRoutes(): Promise<void>` - Setup routes

### BaseServer Optional Methods to Override:
- `beforeStart(): Promise<void>` - Pre-startup logic
- `setupExpress(): void` - Express configuration
- `bindStaticSite(): Promise<void>` - Static resources binding
- `postServerCreated(server): Promise<void>` - After server creation
- `getHealthCheckPath(): string` - Health check path

### CommonRoutes Methods to Override:
- `getUserHook(): ((user: any) => any) | null` - User data processing hook
- `userCheck(user: CommonUser): boolean | Promise<boolean>` - User validation
- `getGlobalHandler(): RequestHandler | null` - Global middleware
- `bindRoutes(): void` - Route definitions

### Middleware Execution Order:
1. getUserHook (if defined)
2. userCheck
3. getGlobalHandler (if defined)
4. Route handlers in bindRoutes

---

For more information, see: [README.md](./README.md)