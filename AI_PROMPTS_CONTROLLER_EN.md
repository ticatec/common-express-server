# AI Programming Prompts: Controller Usage Guide

This document provides detailed prompts for AI-assisted programming to help developers understand and use the Controller class hierarchy from the `@ticatec/common-express-server` framework.

---

## Prompt 1: Create Basic Controller with Controller (No Service Injection)

```
Please help me create a controller class that extends Controller. This controller does not need service injection. Requirements:

1. Class name: HealthController
2. This controller is for health checks and system status queries, no service layer needed
3. Controller should implement these methods:
   - checkHealth() - Health check, return system status
   - getVersion() - Get application version info
   - getSystemInfo() - Get basic system information
4. Each method should:
   - Use this.getLoggedUser(req) to get current user (if available)
   - Use this.logger for operation logging
   - Return RestfulFunction type function
   - Include appropriate error handling
5. Add type definitions and JSDoc comments

Please generate complete controller code, note:
- No constructor parameters needed (no service injection)
- Can directly access this.logger and this.getLoggedUser()
- Return simple data objects or status information
```

---

## Prompt 2: Create Basic Controller with BaseController (With Service Injection)

```
Please help me create a controller class that extends BaseController. Requirements:

1. Class name: NotificationController
2. Service interface:
```typescript
interface NotificationService {
    sendNotification(user: any, message: string, type: string): Promise<any>;
    getNotifications(user: any, unreadOnly: boolean): Promise<any[]>;
    markAsRead(user: any, notificationId: string): Promise<void>;
}
```
3. Controller should implement these methods:
   - send() - Send notification
   - getNotifications() - Get notification list
   - markAsRead() - Mark notification as read
4. Each method should:
   - Use this.getLoggedUser(req) to get current user
   - Call corresponding service method
   - Return RestfulFunction type function
   - Include appropriate error handling and logging
5. Add type definitions and JSDoc comments

Please generate complete controller code including service interface definition.
```

---

## Prompt 3: Implement CRUD Operations with CommonController

```
Please help me create a controller class that extends CommonController for product management. Requirements:

1. Class name: ProductController
2. Service interface:
```typescript
interface ProductService {
    createNew(user: any, data: ProductCreateRequest): Promise<Product>;
    update(user: any, data: ProductUpdateRequest): Promise<Product>;
}
```
3. Request data types:
```typescript
interface ProductCreateRequest {
    name: string;
    description: string;
    price: number;
    category: string;
    stock: number;
}

interface ProductUpdateRequest {
    id: string;
    name?: string;
    description?: string;
    price?: number;
    category?: string;
    stock?: number;
}
```
4. Validation rules:
   - name: required, string, 2-100 chars
   - price: required, number, >= 0
   - category: required, string
   - stock: required, integer, >= 0
   - description: optional, string, max 500 chars
5. Implement abstract methods:
   - getCreateNewArguments() - return [loggedUser, req.body]
   - getUpdateArguments() - return [loggedUser, req.body]
6. Override buildNewEntry() and buildUpdatedEntry():
   - Add createdAt or updatedAt timestamp
   - Add createdBy or updatedBy user info
7. Add custom methods:
   - getCategories() - Get product categories list
   - updateStock() - Update stock (requires new validation rules)

Please generate complete controller code.
```

---

## Prompt 4: Create Tenant Controller with TenantBaseController

```
Please help me create a controller class that extends TenantBaseController for order management. Requirements:

1. Class name: OrderController
2. Service interface:
```typescript
interface OrderService {
    createNew(user: CommonUser, data: OrderCreateRequest): Promise<Order>;
    update(user: CommonUser, data: OrderUpdateRequest): Promise<Order>;
    cancel(user: CommonUser, orderId: string, reason: string): Promise<Order>;
    getHistory(user: CommonUser, params: any): Promise<Order[]>;
}
```
3. Data types:
```typescript
interface OrderCreateRequest {
    items: OrderItem[];
    shippingAddress: Address;
    paymentMethod: string;
}

interface OrderUpdateRequest {
    id: string;
    items?: OrderItem[];
    shippingAddress?: Address;
    status?: string;
}

interface OrderItem {
    productId: string;
    quantity: number;
    price: number;
}
```
4. Validation rules:
   - items: required, array, min 1 element
   - shippingAddress: required, object
   - paymentMethod: required, enum ['credit_card', 'paypal', 'bank_transfer']
   - items[].productId: required, string
   - items[].quantity: required, integer, > 0
   - items[].price: required, number, > 0
5. Implement abstract methods:
   - getCreateNewArguments() - return [loggedUser, validatedData]
   - getUpdateArguments() - return [loggedUser, validatedData]
6. Override buildNewEntry():
   - Add tenant ID: user.tenant.code
   - Add order number: auto-generate
   - Add order status: 'pending'
   - Add creation timestamp
7. Add custom endpoint methods:
   - cancel() - Cancel order
   - getHistory() - Get order history
   - Each method uses this.checkInterface() to verify service
   - Each method uses this.invokeServiceInterface() to call service

Please generate complete controller code with type definitions.
```

---

## Prompt 5: Create Admin Controller with AdminBaseController

```
Please help me create a controller class that extends AdminBaseController for system user management. Requirements:

1. Class name: SystemUserController
2. Service interface:
```typescript
interface SystemUserService {
    createNew(data: UserCreateRequest): Promise<SystemUser>;
    update(data: UserUpdateRequest): Promise<SystemUser>;
    delete(userId: string): Promise<void>;
    assignRole(userId: string, roleId: string): Promise<void>;
    resetPassword(userId: string, newPassword: string): Promise<void>;
}
```
3. Data types:
```typescript
interface UserCreateRequest {
    email: string;
    name: string;
    role: string;
    isActive: boolean;
}

interface UserUpdateRequest {
    id: string;
    email?: string;
    name?: string;
    role?: string;
    isActive?: boolean;
}
```
4. Validation rules:
   - email: required, valid email format
   - name: required, string, 2-100 chars
   - role: required, string, enum values
   - isActive: optional, boolean
5. Implement abstract methods:
   - getCreateNewArguments() - return [req.body] (no user parameter needed)
   - getUpdateArguments() - return [req.body]
6. Override buildNewEntry():
   - Add password hash (if password provided)
   - Add creation timestamp
   - Set default isActive to true
7. Add custom methods:
   - delete() - Delete user (override _del method)
   - assignRole() - Assign role
   - resetPassword() - Reset password

Notes:
- AdminBaseController service methods don't need user parameter
- All operations are cross-tenant
- Admin permission verification should be added at route level

Please generate complete controller code.
```

---

## Prompt 6: Create Search Controller with TenantSearchController

```
Please help me create a controller class that extends TenantSearchController for product search. Requirements:

1. Class name: ProductSearchController
2. Service interface:
```typescript
interface ProductSearchService {
    search(user: CommonUser, query: ProductQuery, pagination: Pagination): Promise<SearchResult<Product>>;
    getCategories(user: CommonUser): Promise<string[]>;
    getFeaturedProducts(user: CommonUser, limit: number): Promise<Product[]>;
}
```
3. Query types:
```typescript
interface ProductQuery {
    keyword?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sortBy?: 'name' | 'price' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
}

interface Pagination {
    page: number;
    pageSize: number;
}

interface SearchResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}
```
4. Implement methods:
   - search() - Main search method
     - Use buildSearchQuery(req) to build query from req.query
     - Use buildPagination(req) to build pagination from req.query
     - Call service interface: [user, query, pagination]
   - buildSearchQuery() - Helper method to build query from request
     - Parse keyword, category, price range, stock params
     - Validate parameter validity
   - buildPagination() - Helper method to build pagination from request
     - Default page: 1, pageSize: 20
     - Limit max pageSize to 100
5. Add additional search endpoints:
   - byCategory() - Search by category
   - byPriceRange() - Search by price range
   - getFeatured() - Get featured products

Please generate complete controller code with helper methods and type definitions.
```

---

## Prompt 7: Integrate Controllers into Routes

```
Please help me create a complete route class that uses various controllers. Requirements:

1. Create ProductRoutes class extending CommonRoutes
2. Import and instantiate these controllers:
   - ProductController (TenantBaseController)
   - ProductSearchController (TenantSearchController)
3. Implement isValidUser():
   - Verify user is logged in
   - Verify user is associated with valid tenant
4. Implement bindRoutes():
   - POST /products - Create product (use productController.createNew())
   - PUT /products/:id - Update product (use productController.update())
   - DELETE /products/:id - Delete product (use productController.del())
   - GET /products - Search products (use searchController.buildQuery())
   - GET /products/categories - Get categories (use productController.getCategories())
   - GET /products/featured - Get featured products (use searchController.getFeatured())
5. Wrap all routes with routerHelper.invokeRestfulAction()
6. Add appropriate logging

Please generate complete route class code.
```

---

## Prompt 8: Create Complete Controller and Route Example

```
Please help me create a complete controller and route structure for a blog system. Requirements:

System requirements:
1. Article management (tenant level)
2. Comment management (tenant level)
3. User management (admin level)
4. Tag management (global, admin level)

Need to create:

1. ArticleController (extends TenantBaseController)
   - Service interface: ArticleService
   - Methods: createNew, update, delete, publish, unpublish
   - Validation rules: title, content, tags

2. ArticleSearchController (extends TenantSearchController)
   - Service interface: ArticleSearchService
   - Methods: search, byTag, byAuthor, byDateRange
   - Support pagination and sorting

3. CommentController (extends TenantBaseController)
   - Service interface: CommentService
   - Methods: createNew, update, delete
   - Validation rules: articleId, content

4. UserController (extends AdminBaseController)
   - Service interface: UserAdminService
   - Methods: createNew, update, delete, activate, deactivate
   - Validation rules: email, name, role

5. TagController (extends AdminBaseController)
   - Service interface: TagService
   - Methods: createNew, update, delete, merge
   - Validation rules: name, color

6. Route classes:
   - ArticleRoutes - Integrate ArticleController and ArticleSearchController
   - CommentRoutes - Integrate CommentController
   - AdminUserRoutes - Integrate UserController
   - AdminTagRoutes - Integrate TagController

Please generate complete code for all controllers and route classes, including:
- Service interface definitions
- Data type definitions
- Validation rules
- Implementation details
- JSDoc comments
```

---

## Usage Tips

1. **Choose appropriate controller base class**:
   - Simple operations without service layer → Controller
   - General business logic → BaseController
   - Need CRUD operations → CommonController
   - Tenant-level operations → TenantBaseController/TenantSearchController
   - Admin-level operations → AdminBaseController/AdminSearchController

2. **Validation rules**:
   - Always define validation rules for data modification operations
   - Use validators from @ticatec/bean-validator
   - Override buildNewEntry/buildUpdatedEntry to add extra data

3. **Service interface**:
   - Ensure service method signatures match controller expectations
   - AdminBaseController doesn't need user parameter
   - TenantBaseController first parameter is user

4. **Debugging**:
   - Set `BaseController.debugEnabled = true` to enable debug logging
   - Use this.logger to log important operations

---

## Controller Hierarchy Quick Reference

```
Controller (Base Functionality)
├── BaseController<T> (Service Injection)
    └── CommonController<T> (CRUD + Validation)
        ├── AdminBaseController<T> (Admin, No Tenant)
        │   └── AdminSearchController<T> (Admin Search)
        └── TenantBaseController<T> (Tenant-Specific)
            └── TenantSearchController<T> (Tenant Search)
```

### Service Method Signatures by Controller:

**AdminBaseController:**
```typescript
service.createNew(data: any): Promise<any>
service.update(data: any): Promise<any>
```

**TenantBaseController:**
```typescript
service.createNew(user: any, data: any): Promise<any>
service.update(user: any, data: any): Promise<any>
```

**AdminSearchController:**
```typescript
service.search(query: any, pagination: any): Promise<any>
```

**TenantSearchController:**
```typescript
service.search(user: any, query: any, pagination: any): Promise<any>
```

---

For more information, see: [CONTROLLER.md](./CONTROLLER.md)