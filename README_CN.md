# @ticatec/common-express-server

[![npm version](https://badge.fury.io/js/@ticatec%2Fcommon-express-server.svg)](https://badge.fury.io/js/@ticatec%2Fcommon-express-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一个全面的 TypeScript 库，提供通用类、控制器和中间件，用于构建具有多租户支持的可扩展 Express.js 应用程序。

[English](./README.md) | 中文

## 特性

- 🚀 **Express.js 基础**: 基于 Express.js 5.x 构建，完全支持 TypeScript
- 🏢 **多租户架构**: 内置多租户应用程序支持
- 🔐 **认证与授权**: 用户认证和基于角色的访问控制
- 🎯 **控制器模式**: 预构建的基础控制器，支持常见的 CRUD 操作
- 📝 **数据验证**: 使用 bean-validator 集成数据验证
- 🔄 **错误处理**: 集中式错误处理和日志记录
- 🌐 **国际化**: 通过请求头内置语言支持
- 📊 **日志记录**: 与 log4js 集成的结构化日志
- 🎨 **TypeScript 优先**: 完整的 TypeScript 支持和全面的类型定义

## 安装

```bash
npm install @ticatec/common-express-server
```

### 对等依赖

```bash
npm install express@^5.1.0
```

## 快速开始

### 1. 创建基础服务器

```typescript
import { BaseServer, CommonRouterHelper } from '@ticatec/common-express-server';

class MyRouterHelper extends CommonRouterHelper {
    // 根据需要添加自定义中间件或重写方法
}

class MyServer extends BaseServer<MyRouterHelper> {
    protected getHelper(): MyRouterHelper {
        return new MyRouterHelper();
    }

    protected async loadConfigFile(): Promise<void> {
        // 在此处加载你的配置
        console.log('正在加载配置...');
    }

    protected getWebConf() {
        return {
            port: 3000,
            ip: '0.0.0.0',
            contextRoot: '/api'
        };
    }

    protected async setupRoutes(app: Express): Promise<void> {
        // 在此处设置你的路由
        await this.bindRoutes(app, '/users', () => import('./routes/UserRoutes'));
    }
}

// 启动服务器
const server = new MyServer();
BaseServer.startup(server);
```

### 2. 创建路由

```typescript
import { CommonRoutes, CommonRouterHelper } from '@ticatec/common-express-server';

class UserRoutes extends CommonRoutes<CommonRouterHelper> {
    constructor(helper: CommonRouterHelper) {
        super(helper); // 默认 checkUser = true
        this.setupRoutes();
    }

    private setupRoutes() {
        this.router.get('/profile', this.helper.invokeRestfulAction(this.getProfile));
        this.router.post('/update', this.helper.invokeRestfulAction(this.updateProfile));
    }

    private getProfile = async (req: Request) => {
        // 你的业务逻辑
        return { message: '用户资料' };
    };

    private updateProfile = async (req: Request) => {
        // 你的业务逻辑
        return { message: '资料已更新' };
    };
}

export default UserRoutes;
```

### 3. 创建控制器

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
            message: '无效的邮箱格式'
        }
    })
];

class UserController extends TenantBaseController<UserService> {
    constructor(userService: UserService) {
        super(userService, userValidationRules);
    }

    // CRUD 方法已继承并自动验证
    // createNew(), update(), del() 方法可用

    // 添加自定义方法
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

## 核心类

### BaseServer<T>

抽象基础服务器类，提供：
- Express 应用程序设置
- 配置加载
- 路由绑定
- 错误处理
- 健康检查端点
- 静态文件服务

### CommonRouterHelper

中间件工具，用于：
- JSON 响应格式化
- 缓存控制
- 用户认证
- 错误处理
- 请求日志记录

### CommonRoutes<T>

路由定义基类，具有：
- Express 路由器集成
- 用户认证检查
- 日志记录功能

### 控制器层次结构

- **BaseController<T>**: 具有日志记录和用户上下文的基础控制器
- **CommonController<T>**: 具有验证的 CRUD 操作
- **AdminBaseController<T>**: 管理员特定操作（与租户无关）
- **TenantBaseController<T>**: 租户特定操作
- **AdminSearchController<T>**: 管理员搜索操作
- **TenantSearchController<T>**: 租户搜索操作

## 配置

### 应用程序配置

```typescript
import { AppConf } from '@ticatec/common-express-server';

// 初始化配置
AppConf.init({
    database: {
        host: 'localhost',
        port: 5432
    },
    server: {
        port: 3000
    }
});

// 使用配置
const config = AppConf.getInstance();
const dbHost = config.get('database.host');
const serverPort = config.get('server.port');
```

### 网关架构

此应用程序设计为在 API 网关后工作。网关处理 JWT 令牌或基于会话的身份验证，并通过 HTTP 请求头将经过身份验证的用户信息转发给 Express 应用程序。

#### 架构流程

```
客户端请求 (JWT/Session) → API 网关 → Express 应用程序
                              ↓
                        用户信息请求头
```

#### 网关职责

API 网关应该：

1. **验证请求身份** 使用 JWT 令牌、会话 cookie 或其他身份验证机制
2. **提取用户信息** 从身份验证令牌/会话中
3. **转发用户数据** 作为 HTTP 请求头传递给 Express 应用程序
4. **处理授权** 和速率限制等需求

#### 用户认证请求头

库期望用户信息在请求头中：

```typescript
// 由网关转发的请求头
{
    'user': encodeURIComponent(JSON.stringify({
        accountCode: 'user123',
        name: 'John Doe',
        tenant: { code: 'tenant1', name: '租户一' }
    })),
    'x-language': 'zh'
}
```

#### 网关实现示例

以下是网关如何处理身份验证的示例：

```typescript
// 网关中间件 (伪代码)
async function processAuthentication(request) {
    // 1. 验证 JWT 令牌或会话
    const token = request.headers.authorization?.replace('Bearer ', '');
    const userInfo = await validateJWT(token);
    
    // 2. 提取用户信息
    const user = {
        accountCode: userInfo.sub,
        name: userInfo.name,
        tenant: {
            code: userInfo.tenant_code,
            name: userInfo.tenant_name
        }
    };
    
    // 3. 转发到 Express 应用程序并携带用户头信息
    request.headers['user'] = encodeURIComponent(JSON.stringify(user));
    request.headers['x-language'] = userInfo.preferred_language || 'zh';
    
    // 4. 代理请求到 Express 应用程序
    return proxyToExpressApp(request);
}
```

#### 安全考虑

- **无直接身份验证**: 此 Express 应用程序不处理 JWT 验证或会话管理
- **信任边界**: 应用程序信任网关已正确验证用户身份
- **请求头验证**: 用户头信息被解析和验证但不进行身份验证
- **网络安全**: 确保网关和 Express 应用程序之间的安全通信（内部网络/VPN）

### 用户扮演

库支持用户扮演功能，允许系统特权用户扮演成另外一个用户（包括跨租户操作）来实现错误跟踪和故障排除。

#### 工作原理

当特权用户需要扮演另一个用户时，网关应该在请求头中同时包含原始用户和目标用户信息：

```typescript
// 包含用户扮演的请求头
{
    'user': encodeURIComponent(JSON.stringify({
        // 原始特权用户
        accountCode: 'admin123',
        name: '系统管理员',
        tenant: { code: 'system', name: '系统租户' },
        
        // 被扮演的用户
        actAs: {
            accountCode: 'user456',
            name: '目标用户',
            tenant: { code: 'client-a', name: '客户 A' }
        }
    })),
    'x-language': 'zh'
}
```

#### 在控制器中的实现

`BaseController.getLoggedUser()` 方法自动处理用户扮演：

```typescript
class MyController extends TenantBaseController<MyService> {
    
    async getUserData(req: Request) {
        // 如果存在 actAs，将返回被扮演的用户，
        // 否则返回原始用户
        const currentUser = this.getLoggedUser(req);
        
        console.log('当前操作用户:', currentUser.name);
        console.log('租户上下文:', currentUser.tenant.code);
        
        // 所有操作将在被扮演用户的上下文中执行
        return await this.service.getUserData(currentUser);
    }
}
```


#### 使用场景

- **调试用户问题**: 支持人员可以通过扮演受影响的用户来重现问题
- **跨租户故障排除**: 系统管理员可以跨不同租户调试问题
- **测试用户权限**: 验证用户特定的访问控制是否正常工作
- **数据迁移**: 在系统迁移期间代表用户执行操作

#### Express 应用程序职责

Express 应用程序只需要：
- **信任网关**: 接受来自已认证网关请求的用户扮演信息
- **处理上下文**: 当存在 `actAs` 时，使用被扮演用户进行所有业务操作
- **无需验证**: 不验证扮演权限或限制

#### 网关对扮演功能的职责

所有扮演控制应由网关处理：
- **权限验证**: 验证用户是否有权限扮演其他用户
- **审计日志**: 记录所有扮演活动以供安全审计
- **时间限制**: 实施对扮演会话的基于时间的限制
- **会话管理**: 处理扮演会话的生命周期
- **跨租户控制**: 对跨租户扮演应用额外检查
- **通知机制**: 可选择在用户帐户被扮演时通知目标用户

## 多租户支持

库提供内置的多租户支持：

```typescript
// 租户特定控制器
class ProductController extends TenantBaseController<ProductService> {
    // 自动接收登录用户上下文
    // 所有操作都是租户范围的
}

// 管理员控制器（跨租户）
class SystemController extends AdminBaseController<SystemService> {
    // 跨所有租户的操作
}
```

## 数据验证

使用 `@ticatec/bean-validator` 进行内置验证：

```typescript
import { ValidationRules, StringValidator, NumberValidator } from '@ticatec/bean-validator';

const rules: ValidationRules = [
    new StringValidator('name', { required: true, minLen: 2, maxLen: 50 }),
    new StringValidator('email', {
        required: true,
        format: {
            regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: '无效的邮箱格式'
        }
    }),
    new NumberValidator('age', { required: false, minValue: 18, maxValue: 120 })
];

class UserController extends CommonController<UserService> {
    constructor(service: UserService) {
        super(service, rules); // 自动应用验证
    }
}
```

## 错误处理

使用 `@ticatec/express-exception` 进行集中式错误处理：

```typescript
import { 
    ActionNotFoundError, 
    UnauthenticatedError, 
    IllegalParameterError 
} from '@ticatec/express-exception';

// 错误会自动处理和格式化
throw new ActionNotFoundError('资源未找到');
throw new UnauthenticatedError('用户未认证');
throw new IllegalParameterError('输入数据无效');
```

## API 参考

### 类型

```typescript
// 函数签名
export type RestfulFunction = (req: Request) => any;
export type ControlFunction = (req: Request, res: Response) => any;
export type moduleLoader = () => Promise<any>;

// 验证类型（来自 @ticatec/bean-validator）
export type ValidationRules = Array<BaseValidator>;

// 用户接口
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
    actAs?: CommonUser; // 用于用户扮演
}
```

## 开发

### 构建

```bash
npm run build         # 构建项目
npm run dev           # 开发模式（监听）
```

## 系统要求

- Node.js >= 18.0.0
- Express.js ^5.1.0
- TypeScript ^5.0.0

## 依赖项

- `@ticatec/bean-validator`: 数据验证
- `@ticatec/express-exception`: 错误处理
- `@ticatec/node-common-library`: 通用工具
- `log4js`: 日志框架

## 贡献

1. Fork 仓库
2. 创建你的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

此项目使用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 支持

获取支持和提问：

- 📧 邮箱: henry@ticatec.com
- 🐛 问题: [GitHub Issues](https://github.com/ticatec/common-express-server/issues)
- 📚 文档: [GitHub 仓库](https://github.com/ticatec/common-express-server)

---

由 [TicaTec](https://github.com/ticatec) 用 ❤️ 制作