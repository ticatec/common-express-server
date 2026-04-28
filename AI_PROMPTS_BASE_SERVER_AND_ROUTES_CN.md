# AI 编程提示词：BaseServer 和 CommonRoutes

本文档提供了用于AI辅助编程的详细提示词，帮助开发者理解和使用 `@ticatec/common-express-server` 框架中的 BaseServer 和 CommonRoutes 类。

---

## Prompt 1: 创建自定义服务器类

```
请帮我创建一个继承自 BaseServer 的自定义服务器类。要求如下：

1. 实现 loadConfigFile() 方法，从 './config/app.json' 加载配置，并使用 AppConf.init() 初始化
2. 实现 getWebConf() 方法，返回以下配置：
   - port: 从配置中读取，默认 3000
   - ip: '0.0.0.0'
   - contextRoot: 从配置中读取，默认 '/api'
3. 实现 setupRoutes() 方法，绑定以下路由：
   - '/api/users' -> UserRoutes
   - '/api/products' -> ProductRoutes
   - '/api/admin' -> AdminRoutes
4. 在 beforeStart() 中初始化数据库连接
5. 在 setupExpress() 中配置 CORS，允许所有来源

请确保：
- 使用 async/await 处理异步操作
- 正确使用 AppConf.getInstance().get() 读取配置
- 使用 await this.bindRoutes(path, loader) 绑定路由
- 添加适当的错误处理和日志记录
```

---

## Prompt 2: 创建带认证的路由类

```
请帮我创建一个继承自 CommonRoutes 的路由类，用于用户管理。要求如下：

1. 类名为 UserRoutes，构造函数不需要参数
2. 实现 userCheck() 方法，验证用户是否已登录且账户状态为 'active'
3. 实现 bindRoutes() 方法，定义以下路由：
   - GET /profile - 获取当前用户资料
   - PUT /profile - 更新用户资料
   - POST /change-password - 修改密码
   - GET /settings - 获取用户设置
4. 使用 routerHelper.invokeRestfulAction() 包装所有路由处理器
5. 所有处理器使用箭头函数定义为类属性
6. 添加适当的日志记录

请确保：
- 从 req['user'] 获取用户信息
- 处理用户模拟（actAs）场景
- 返回标准的 RESTful 响应
- 使用 this.logger 记录操作日志
```

---

## Prompt 3: 创建带用户钩子的管理员路由

```
请帮我创建一个管理员路由类继承自 CommonRoutes。要求如下：

1. 类名为 AdminRoutes
2. 实现 getUserHook() 方法，在用户验证前加载管理员权限：
   - 从数据库加载管理员角色
   - 检查管理员是否拥有必要的权限
   - 将权限信息添加到 user.permissions
3. 实现 userCheck() 方法，验证用户是否为平台管理员（user.isPlatform === true）
4. 实现 getGlobalHandler() 方法，添加全局中间件检查请求头 'x-admin-token'
5. 实现 bindRoutes() 方法，定义管理员路由：
   - GET /users - 获取所有用户列表
   - POST /users - 创建新用户
   - PUT /users/:id - 更新用户
   - DELETE /users/:id - 删除用户
   - GET /stats - 获取平台统计信息
6. 使用 mergeParams: true 构造选项

请确保：
- 在 getUserHook 中使用异步操作加载权限
- 在 userCheck 中同时检查原始用户和 actAs 用户
- 在 getGlobalHandler 中抛出适当的错误（如 IllegalParameterError）
- 所有路由使用 routerHelper.invokeRestfulAction 包装
```

---

## Prompt 4: 创建租户路由类

```
请帮我创建一个租户特定的路由类继承自 CommonRoutes。要求如下：

1. 类名为 TenantRoutes
2. 实现 getUserHook() 方法，加载租户特定数据：
   - 加载租户配置信息
   - 加载租户的功能开关
   - 验证租户是否有效
   - 将租户数据添加到 user.tenantData
3. 实现 userCheck() 方法，验证：
   - 用户已登录
   - 用户关联到有效的租户
   - 租户状态为 'active'
4. 实现 bindRoutes() 方法，定义租户路由：
   - GET /info - 获取租户信息
   - GET /members - 获取租户成员列表
   - POST /members - 邀请成员
   - PUT /members/:id - 更新成员角色
   - DELETE /members/:id - 移除成员
5. 每个路由处理器应该：
   - 使用 this.getLoggedUser(req) 获取当前用户
   - 从 user.tenantData 获取租户信息
   - 返回适当的数据或错误

请确保：
- 在 getUserHook 中捕获并处理加载租户数据时的错误
- 在 userCheck 中检查 user.tenant 是否存在且有效
- 所有数据库操作使用 try-catch 包装
- 使用 this.logger.debug 记录调试信息
```

---

## Prompt 5: 完整的应用程序设置

```
请帮我创建一个完整的 Express 应用程序，使用 @ticatec/common-express-server 框架。要求如下：

项目结构：
```
src/
├── server/
│   ├── MyServer.ts          # 主服务器类
│   └── routes/
│       ├── UserRoutes.ts    # 用户路由
│       ├── ProductRoutes.ts # 产品路由
│       └── AdminRoutes.ts   # 管理员路由
├── services/
│   ├── UserService.ts       # 用户服务
│   └── ProductService.ts    # 产品服务
├── config/
│   └── app.json             # 应用配置
└── index.ts                 # 入口文件
```

要求：
1. MyServer 继承 BaseServer
   - 从 config/app.json 加载配置
   - 初始化数据库连接
   - 配置 CORS
   - 绑定所有路由
   - 启动服务器

2. UserRoutes 继承 CommonRoutes
   - 实现用户验证检查
   - 提供用户资料管理路由
   - 提供密码修改路由

3. ProductRoutes 继承 CommonRoutes
   - 实现租户验证
   - 提供产品 CRUD 路由
   - 使用 TenantBaseController 和 TenantSearchController

4. AdminRoutes 继承 CommonRoutes
   - 实现管理员验证
   - 提供用户管理路由
   - 提供系统统计路由

5. 服务层实现所有业务逻辑

6. index.ts 启动服务器

请生成完整的代码，包含错误处理、日志记录和类型定义。
```

---

## 使用建议

这些 prompts 可以直接复制给 AI 助手（如 Claude、ChatGPT 等），让它们帮你生成符合 `@ticatec/common-express-server` 框架规范的代码。

使用技巧：
1. 根据你的具体需求修改 prompt 中的细节
2. 可以组合多个 prompts 的要求
3. 如果生成的代码有问题，可以指出具体问题并要求重新生成
4. 添加你的业务逻辑要求到 prompt 中

---

## 关键概念快速参考

### BaseServer 必须实现的方法：
- `loadConfigFile(): Promise<void>` - 加载配置
- `getWebConf(): any` - 返回服务器配置
- `setupRoutes(): Promise<void>` - 设置路由

### BaseServer 可选重写的方法：
- `beforeStart(): Promise<void>` - 启动前逻辑
- `setupExpress(): void` - Express 配置
- `bindStaticSite(): Promise<void>` - 静态资源绑定
- `postServerCreated(server): Promise<void>` - 服务器创建后
- `getHealthCheckPath(): string` - 健康检查路径

### CommonRoutes 可重写的方法：
- `getUserHook(): ((user: any) => any) | null` - 用户数据处理钩子
- `userCheck(user: CommonUser): boolean | Promise<boolean>` - 用户验证
- `getGlobalHandler(): RequestHandler | null` - 全局中间件
- `bindRoutes(): void` - 路由定义

### 中间件执行顺序：
1. getUserHook (如果定义)
2. userCheck
3. getGlobalHandler (如果定义)
4. bindRoutes 中的路由处理器

---

更多信息请参考：[README_CN.md](./README_CN.md)