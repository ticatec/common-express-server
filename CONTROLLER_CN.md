# Controller 使用指南

[English](./CONTROLLER.md) | 中文

本指南解释如何使用 `@ticatec/common-express-server` 提供的各种控制器类来构建你的 API 端点。

## 目录

- [控制器层次结构](#控制器层次结构)
- [BaseController](#basecontroller)
- [CommonController](#commoncontroller)
- [AdminBaseController](#adminbasecontroller)
- [TenantBaseController](#tenantbasecontroller)
- [AdminSearchController](#adminsearchcontroller)
- [TenantSearchController](#tenantsearchcontroller)
- [完整示例](#完整示例)

## 控制器层次结构

```
BaseController<T>
    ↓
CommonController<T>
    ↓
    ├─→ AdminBaseController<T>  (平台管理员使用，与租户无关)
    └─→ TenantBaseController<T> (租户特定操作)
        ↓
        ├─→ AdminSearchController<T> (管理员搜索操作)
        └─→ TenantSearchController<T> (租户搜索操作)
```

## BaseController

所有控制器的基础类。提供基础功能，包括日志记录和用户上下文管理。

### 特性

- **日志记录**: 自动创建使用 `log4js` 的日志记录器实例
- **用户上下文**: 访问当前登录用户
- **用户扮演**: 自动支持 `actAs` 用户扮演功能

### 基本用法

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
        // 获取当前登录用户（自动处理 actAs）
        const user = this.getLoggedUser(req);

        // 访问注入的服务
        return await this.service.someMethod(user);
    }
}
```

### 关键方法

#### `getLoggedUser(req: Request): CommonUser`

返回当前登录用户。如果激活了用户扮演（`actAs`），返回被扮演的用户。

```typescript
const user = this.getLoggedUser(req);
console.log(user.accountCode);  // 用户账号代码
console.log(user.name);         // 用户姓名
console.log(user.tenant);       // 租户信息（如果适用）
```

## CommonController

扩展 `BaseController`，提供 CRUD 操作和验证支持。

### 特性

- **自动验证**: 使用 `@ticatec/bean-validator` 进行内置验证
- **CRUD 操作**: `createNew()`、`update()`、`del()` 方法
- **服务接口检查**: 在调用前验证服务方法
- **请求数据构建**: 可自定义从请求中提取数据

### 用法

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
            message: '无效的邮箱格式'
        }
    })
];

class UserController extends CommonController<UserService> {
    constructor(service: UserService) {
        super(service, userValidationRules);
    }

    // 实现抽象方法
    protected getCreateNewArguments(req: Request): Array<any> {
        return [req.body];  // 将请求体传递给服务
    }

    protected getUpdateArguments(req: Request): Array<any> {
        return [req.body];  // 将请求体传递给服务
    }
}

// 在你的路由中
const userController = new UserController(userService);

// POST /users - 创建新用户
router.post('/users', userController.createNew());

// PUT /users - 更新用户
router.put('/users/:id', userController.update());

// DELETE /users/:id - 删除用户
router.delete('/users/:id', userController.del());
```

### 自定义数据构建

重写 `buildNewEntry()` 和 `buildUpdatedEntry()` 来自定义数据提取：

```typescript
class UserController extends CommonController<UserService> {
    protected buildNewEntry(req: Request): any {
        // 添加创建时间戳
        return {
            ...req.body,
            createdAt: new Date().toISOString()
        };
    }

    protected buildUpdatedEntry(req: Request): any {
        // 添加更新时间戳
        return {
            ...req.body,
            updatedAt: new Date().toISOString()
        };
    }
}
```

### 受保护的方法

#### `validateEntity(data: any)`

根据配置的规则验证实体数据。如果验证失败，抛出 `IllegalParameterError`。

#### `checkInterface(name: string)`

检查服务是否有特定方法。如果没有找到，抛出 `ActionNotFoundError`。

#### `invokeServiceInterface(name: string, args: Array<any>)`

通过名称调用服务方法并传递提供的参数。

## AdminBaseController

用于**与租户无关的**平台管理员操作。由系统管理员用于管理跨所有租户的资源。

### 特性

- ✅ 服务调用中不包含用户参数
- ✅ 无租户过滤
- ✅ 直接数据操作
- ✅ 需要验证规则

### 用法

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

// 服务方法签名: createNew(config: any)
// 传递的参数: [req.body]
```

### 使用场景

- 系统级配置管理
- 平台级功能
- 跨租户报告
- 管理员工具

## TenantBaseController

用于**租户特定**的操作。所有操作都限定在当前用户的租户范围内。

### 特性

- ✅ 第一个参数始终是登录用户
- ✅ 自动租户范围限定
- ✅ 支持用户扮演
- ✅ 需要验证规则

### 用法

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

// 服务方法签名: createNew(user: any, data: any)
// 传递的参数: [loggedUser, req.body]
```

### 使用场景

- 租户数据管理
- 用户特定资源
- 多租户应用程序
- 业务操作

### 路由使用示例

```typescript
import { CommonRouter } from '@ticatec/common-express-server';

class ProductRoutes extends CommonRouter {
    private productController = new ProductController(productService);

    protected bindRoutes() {
        // 创建产品 - 租户范围
        this.post('/products', this.helper.invokeRestfulAction(
            this.productController.createNew()
        ));

        // 更新产品 - 租户范围
        this.put('/products/:id', this.helper.invokeRestfulAction(
            this.productController.update()
        ));

        // 删除产品 - 租户范围
        this.delete('/products/:id', this.helper.invokeRestfulAction(
            this.productController.del()
        ));
    }
}
```

## AdminSearchController

用于管理员级别的搜索和分页操作（与租户无关）。

### 特性

- ✅ 专为搜索/列表操作设计
- ✅ 无用户参数
- ✅ 跨租户数据访问
- ✅ 支持分页

### 用法

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

// 在路由中使用
const searchController = new UserAdminSearchController(userAdminService);
router.get('/admin/users', searchController.buildQuery());
```

### 使用场景

- 管理员用户管理
- 系统级搜索
- 跨租户报告
- 审计日志

## TenantSearchController

用于租户范围的搜索和分页操作。

### 特性

- ✅ 专为搜索/列表操作设计
- ✅ 第一个参数是登录用户
- ✅ 租户范围结果
- ✅ 支持分页

### 用法

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

// 在路由中使用
const searchController = new OrderSearchController(orderService);
router.get('/orders', searchController.buildQuery());
```

### 使用场景

- 用户订单历史
- 租户数据搜索
- 客户特定列表
- 个性化内容

## 完整示例

### 示例 1: 电商平台（多租户）

```typescript
// 服务
interface ProductService {
    createNew(user: any, data: any): Promise<any>;
    update(user: any, data: any): Promise<any>;
    search(user: any, query: any, pagination: any): Promise<any>;
}

interface OrderService {
    createNew(user: any, data: any): Promise<any>;
    search(user: any, query: any, pagination: any): Promise<any>;
}

// 控制器
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

// 路由
import { CommonRouter } from '@ticatec/common-express-server';

class ProductRoutes extends CommonRouter {
    private productController = new ProductController(productService);
    private searchController = new ProductSearchController(productService);

    protected bindRoutes() {
        // CRUD 操作
        this.post('/products', this.helper.invokeRestfulAction(
            this.productController.createNew()
        ));

        this.put('/products/:id', this.helper.invokeRestfulAction(
            this.productController.update()
        ));

        // 搜索
        this.get('/products', this.helper.invokeRestfulAction(
            this.searchController.buildQuery()
        ));
    }
}
```

### 示例 2: 平台管理面板

```typescript
// 服务
interface SystemUserService {
    createNew(data: any): Promise<any>;
    update(data: any): Promise<any>;
    search(query: any, pagination: any): Promise<any>;
}

// 控制器
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

// 路由（无需认证，由网关/管理员检查处理）
class AdminUserRoutes extends CommonRouter {
    private userController = new SystemUserController(systemUserService);
    private searchController = new SystemUserSearchController(systemUserService);

    protected getGlobalHandler(): boolean | CustomChecker {
        // 自定义管理员检查
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

## 最佳实践

### 1. 选择正确的控制器

| 场景 | 使用控制器 |
|------|-----------|
| 平台管理员操作 | `AdminBaseController` |
| 租户特定操作 | `TenantBaseController` |
| 管理员跨所有数据搜索 | `AdminSearchController` |
| 租户范围搜索 | `TenantSearchController` |

### 2. 验证规则

始终为处理数据修改的控制器定义验证规则：

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

### 3. 错误处理

控制器自动处理常见错误：
- `IllegalParameterError` - 验证失败
- `ActionNotFoundError` - 缺少服务方法
- `UnauthenticatedError` - 用户未登录

### 4. 服务接口要求

确保你的服务实现所需的方法：

**对于 AdminBaseController:**
```typescript
interface MyService {
    createNew(data: any): Promise<any>;
    update(data: any): Promise<any>;
}
```

**对于 TenantBaseController:**
```typescript
interface MyService {
    createNew(user: any, data: any): Promise<any>;
    update(user: any, data: any): Promise<any>;
}
```

**对于搜索控制器:**
```typescript
interface MyService {
    search(query: any, pagination: any): Promise<any>;  // 管理员
    search(user: any, query: any, pagination: any): Promise<any>;  // 租户
}
```

## 调试模式

为控制器启用调试日志：

```typescript
import BaseController from '@ticatec/common-express-server/common/BaseController';

BaseController.debugEnabled = true;
```

这将记录有关请求处理的详细信息。

## 总结

- **BaseController**: 具有日志和用户上下文的基础
- **CommonController**: 带有验证的 CRUD 操作
- **AdminBaseController**: 平台管理员，无租户上下文
- **TenantBaseController**: 具有用户上下文的租户特定操作
- **AdminSearchController**: 跨租户搜索操作
- **TenantSearchController**: 租户范围搜索操作

根据你的操作范围和租户要求选择合适的控制器。

---

更多信息，请参阅[主 README](./README_CN.md)。