# AI 编程提示词：Controller 使用指南

本文档提供了用于AI辅助编程的详细提示词，帮助开发者理解和使用 `@ticatec/common-express-server` 框架中的 Controller 类体系。

---

## Prompt 1: 使用 Controller 创建最基础的控制器（无需服务注入）

```
请帮我创建一个继承自 Controller 的基础控制器类。这个控制器不需要服务注入。要求如下：

1. 类名为 HealthController
2. 这个控制器用于健康检查和系统状态查询，不需要服务层
3. 控制器需要实现以下方法：
   - checkHealth() - 健康检查，返回系统状态
   - getVersion() - 获取应用版本信息
   - getSystemInfo() - 获取系统基本信息
4. 每个方法应该：
   - 使用 this.getLoggedUser(req) 获取当前用户（如果有）
   - 使用 this.logger 记录操作日志
   - 返回 RestfulFunction 类型的函数
   - 包含适当的错误处理
5. 添加类型定义和 JSDoc 注释

请生成完整的控制器代码，注意：
- 不需要构造函数参数（因为没有服务注入）
- 可以直接访问 this.logger 和 this.getLoggedUser()
- 返回简单的数据对象或状态信息
```

---

## Prompt 2: 使用 BaseController 创建基础控制器（带服务注入）

```
请帮我创建一个继承自 BaseController 的控制器类。要求如下：

1. 类名为 NotificationController
2. 服务接口定义：
```typescript
interface NotificationService {
    sendNotification(user: any, message: string, type: string): Promise<any>;
    getNotifications(user: any, unreadOnly: boolean): Promise<any[]>;
    markAsRead(user: any, notificationId: string): Promise<void>;
}
```
3. 控制器需要实现以下方法：
   - send() - 发送通知
   - getNotifications() - 获取通知列表
   - markAsRead() - 标记通知为已读
4. 每个方法应该：
   - 使用 this.getLoggedUser(req) 获取当前用户
   - 调用对应的 service 方法
   - 返回 RestfulFunction 类型的函数
   - 包含适当的错误处理和日志记录
5. 添加类型定义和 JSDoc 注释

请生成完整的控制器代码，包括服务接口定义。
```

---

## Prompt 3: 使用 CommonController 实现 CRUD 操作

```
请帮我创建一个继承自 CommonController 的控制器类，用于产品管理。要求如下：

1. 类名为 ProductController
2. 服务接口定义：
```typescript
interface ProductService {
    createNew(user: any, data: ProductCreateRequest): Promise<Product>;
    update(user: any, data: ProductUpdateRequest): Promise<Product>;
}
```
3. 请求数据类型：
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
4. 验证规则：
   - name: 必填，字符串，2-100字符
   - price: 必填，数字，>= 0
   - category: 必填，字符串
   - stock: 必填，整数，>= 0
   - description: 可选，字符串，最多500字符
5. 实现抽象方法：
   - getCreateNewArguments() - 返回 [loggedUser, req.body]
   - getUpdateArguments() - 返回 [loggedUser, req.body]
6. 重写 buildNewEntry() 和 buildUpdatedEntry()：
   - 添加 createdAt 或 updatedAt 时间戳
   - 添加 createdBy 或 updatedBy 用户信息
7. 添加自定义方法：
   - getCategories() - 获取产品分类列表
   - updateStock() - 更新库存（需要新的验证规则）

请生成完整的控制器代码。
```

---

## Prompt 4: 使用 TenantBaseController 创建租户控制器

```
请帮我创建一个继承自 TenantBaseController 的控制器类，用于订单管理。要求如下：

1. 类名为 OrderController
2. 服务接口定义：
```typescript
interface OrderService {
    createNew(user: CommonUser, data: OrderCreateRequest): Promise<Order>;
    update(user: CommonUser, data: OrderUpdateRequest): Promise<Order>;
    cancel(user: CommonUser, orderId: string, reason: string): Promise<Order>;
    getHistory(user: CommonUser, params: any): Promise<Order[]>;
}
```
3. 数据类型：
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
4. 验证规则：
   - items: 必填，数组，至少1个元素
   - shippingAddress: 必填，对象
   - paymentMethod: 必填，枚举 ['credit_card', 'paypal', 'bank_transfer']
   - items[].productId: 必填，字符串
   - items[].quantity: 必填，整数，> 0
   - items[].price: 必填，数字，> 0
5. 实现抽象方法：
   - getCreateNewArguments() - 返回 [loggedUser, validatedData]
   - getUpdateArguments() - 返回 [loggedUser, validatedData]
6. 重写 buildNewEntry()：
   - 添加租户ID：user.tenant.code
   - 添加订单号：自动生成
   - 添加订单状态：'pending'
   - 添加创建时间戳
7. 添加自定义端点方法：
   - cancel() - 取消订单
   - getHistory() - 获取订单历史
   - 每个方法使用 this.checkInterface() 验证服务接口
   - 每个方法使用 this.invokeServiceInterface() 调用服务

请生成完整的控制器代码，包含类型定义。
```

---

## Prompt 5: 使用 AdminBaseController 创建管理员控制器

```
请帮我创建一个继承自 AdminBaseController 的控制器类，用于系统用户管理。要求如下：

1. 类名：SystemUserController
2. 服务接口：
```typescript
interface SystemUserService {
    createNew(data: UserCreateRequest): Promise<SystemUser>;
    update(data: UserUpdateRequest): Promise<SystemUser>;
    delete(userId: string): Promise<void>;
    assignRole(userId: string, roleId: string): Promise<void>;
    resetPassword(userId: string, newPassword: string): Promise<void>;
}
```
3. 数据类型：
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
4. 验证规则：
   - email: 必填，有效的邮箱格式
   - name: 必填，字符串，2-100字符
   - role: 必填，字符串，枚举值
   - isActive: 可选，布尔值
5. 实现抽象方法：
   - getCreateNewArguments() - 返回 [req.body]（不需要用户参数）
   - getUpdateArguments() - 返回 [req.body]
6. 重写 buildNewEntry()：
   - 添加密码哈希（如果提供了密码）
   - 添加创建时间
   - 设置默认 isActive 为 true
7. 添加自定义方法：
   - delete() - 删除用户（重写 _del 方法）
   - assignRole() - 分配角色
   - resetPassword() - 重置密码

注意事项：
- AdminBaseController 的服务方法不需要 user 参数
- 所有操作都是跨租户的
- 需要在路由层面添加管理员权限验证

请生成完整的控制器代码。
```

---

## Prompt 6: 使用 TenantSearchController 创建搜索控制器

```
请帮我创建一个继承自 TenantSearchController 的控制器类，用于产品搜索。要求如下：

1. 类名：ProductSearchController
2. 服务接口：
```typescript
interface ProductSearchService {
    search(user: CommonUser, query: ProductQuery, pagination: Pagination): Promise<SearchResult<Product>>;
    getCategories(user: CommonUser): Promise<string[]>;
    getFeaturedProducts(user: CommonUser, limit: number): Promise<Product[]>;
}
```
3. 查询类型：
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
4. 实现以下方法：
   - search() - 主要搜索方法
     - 使用 buildSearchQuery(req) 从 req.query 构建查询对象
     - 使用 buildPagination(req) 从 req.query 构建分页对象
     - 调用服务接口：[user, query, pagination]
   - buildSearchQuery() - 辅助方法，从请求构建查询对象
     - 解析 keyword, category, price range, stock 等参数
     - 验证参数有效性
   - buildPagination() - 辅助方法，从请求构建分页对象
     - 默认 page: 1, pageSize: 20
     - 限制最大 pageSize 为 100
5. 添加额外的搜索端点：
   - byCategory() - 按分类搜索
   - byPriceRange() - 按价格范围搜索
   - getFeatured() - 获取特色产品

请生成完整的控制器代码，包含辅助方法和类型定义。
```

---

## Prompt 7: 将控制器集成到路由中

```
请帮我创建一个完整的路由类，使用之前生成的各种控制器。要求如下：

1. 创建 ProductRoutes 类继承 CommonRoutes
2. 导入和实例化以下控制器：
   - ProductController (TenantBaseController)
   - ProductSearchController (TenantSearchController)
3. 实现 isValidUser()：
   - 验证用户已登录
   - 验证用户关联到有效租户
4. 实现 bindRoutes()：
   - POST /products - 创建产品（使用 productController.createNew()）
   - PUT /products/:id - 更新产品（使用 productController.update()）
   - DELETE /products/:id - 删除产品（使用 productController.del()）
   - GET /products - 搜索产品（使用 searchController.buildQuery()）
   - GET /products/categories - 获取分类（使用 productController.getCategories()）
   - GET /products/featured - 获取特色产品（使用 searchController.getFeatured()）
5. 所有路由使用 routerHelper.invokeRestfulAction() 包装
6. 添加适当的日志记录

请生成完整的路由类代码。
```

---

## Prompt 8: 创建完整的控制器和路由示例

```
请帮我为一个博客系统创建完整的控制器和路由结构。要求：

系统需求：
1. 文章管理（租户级别）
2. 评论管理（租户级别）
3. 用户管理（管理员级别）
4. 标签管理（全局，管理员级别）

需要创建：

1. ArticleController (继承 TenantBaseController)
   - 服务接口：ArticleService
   - 方法：createNew, update, delete, publish, unpublish
   - 验证规则：title, content, tags

2. ArticleSearchController (继承 TenantSearchController)
   - 服务接口：ArticleSearchService
   - 方法：search, byTag, byAuthor, byDateRange
   - 支持分页和排序

3. CommentController (继承 TenantBaseController)
   - 服务接口：CommentService
   - 方法：createNew, update, delete
   - 验证规则：articleId, content

4. UserController (继承 AdminBaseController)
   - 服务接口：UserAdminService
   - 方法：createNew, update, delete, activate, deactivate
   - 验证规则：email, name, role

5. TagController (继承 AdminBaseController)
   - 服务接口：TagService
   - 方法：createNew, update, delete, merge
   - 验证规则：name, color

6. 路由类：
   - ArticleRoutes - 集成 ArticleController 和 ArticleSearchController
   - CommentRoutes - 集成 CommentController
   - AdminUserRoutes - 集成 UserController
   - AdminTagRoutes - 集成 TagController

请生成所有控制器和路由类的完整代码，包括：
- 服务接口定义
- 数据类型定义
- 验证规则
- 实现细节
- JSDoc 注释
```

---

## 使用建议

1. **选择合适的控制器基类**：
   - 无需服务层的简单操作 → Controller
   - 需要服务注入的业务逻辑 → BaseController
   - 需要 CRUD 操作 → CommonController
   - 租户级别操作 → TenantBaseController/TenantSearchController
   - 管理员级别操作 → AdminBaseController/AdminSearchController

2. **验证规则**：
   - 始终为数据修改操作定义验证规则
   - 使用 @ticatec/bean-validator 提供的验证器
   - 可以重写 buildNewEntry/buildUpdatedEntry 添加额外数据

3. **服务接口**：
   - 确保服务方法签名与控制器期望的匹配
   - AdminBaseController 不需要 user 参数
   - TenantBaseController 第一个参数是 user

4. **调试**：
   - 设置 `BaseController.debugEnabled = true` 启用调试日志
   - 使用 this.logger 记录重要操作

---

## Controller 层次结构快速参考

```
Controller (基础功能)
├── BaseController<T> (服务注入)
    └── CommonController<T> (CRUD + 验证)
        ├── AdminBaseController<T> (管理员，无租户)
        │   └── AdminSearchController<T> (管理员搜索)
        └── TenantBaseController<T> (租户特定)
            └── TenantSearchController<T> (租户搜索)
```

### 各控制器的服务方法签名：

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

更多信息请参考：[CONTROLLER_CN.md](./CONTROLLER_CN.md)