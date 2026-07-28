import { initialize, resetForTest } from '@ticatec/logger-wrapper';
import http from 'http';
import fs from 'fs';

const SILENT_LOGGER_CONFIG = {
    appenders: [{ name: 'console', type: 'console' as const, level: 'silent' }],
    loggers: { root: { level: 'silent', appenders: ['console'] } }
};
import AppConf from '../AppConf.js';
import ProcessorManager from '../ProcessorManager.js';
import CommonProcessor from '../CommonProcessor.js';
import routerHelper from '../RouterHelper.js';
import AdminBaseController from '../common/AdminBaseController.js';
import AdminSearchController from '../common/AdminSearchController.js';
import TenantBaseController from '../common/TenantBaseController.js';
import TenantSearchController from '../common/TenantSearchController.js';
import CommonRoutes, { AuthenticatedRoutes } from '../CommonRoutes.js';
import BaseServer from '../BaseServer.js';
import { HealthCheckRegistry } from '../health/HealthCheckRegistry.js';
import { createSystemHealthIndicator } from '../health/BuiltinHealthIndicators.js';
import { HealthRoutes } from '../health/HealthRoutes.js';

class MockProcessor extends CommonProcessor<string> {
    public processedItems: string[] = [];
    public inFlightDelayMs: number = 0;

    constructor() {
        super(1, 2);
    }

    protected async loadToProcessData(): Promise<string[]> {
        return ['item1'];
    }

    protected async processItem(item: string): Promise<void> {
        if (this.inFlightDelayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, this.inFlightDelayMs));
        }
        this.processedItems.push(item);
    }
}

class MockService {
    async createNew(userOrData: any, dataOrNil?: any) {
        return { id: 1, userOrData, dataOrNil };
    }
    async update(userOrData: any, dataOrNil?: any) {
        return { updated: true, userOrData, dataOrNil };
    }
    async search(userOrQuery: any, queryOrNil?: any) {
        return [{ id: 1, userOrQuery, queryOrNil }];
    }
}

class TestAdminController extends AdminBaseController<MockService> {
    constructor(service: MockService) {
        super(service, null);
    }
}

class TestAdminSearchController extends AdminSearchController<MockService> {
    constructor(service: MockService) {
        super(service, null);
    }
}

class TestEmptyAdminSearchController extends AdminSearchController<any> {
    constructor() {
        super({}, null);
    }
}

class TestTenantController extends TenantBaseController<MockService> {
    constructor(service: MockService) {
        super(service, null);
    }
}

class TestTenantSearchController extends TenantSearchController<MockService> {
    constructor(service: MockService) {
        super(service, null);
    }
}

class PublicRoutes extends CommonRoutes {
    protected bindRoutes() {
        this.get('/test', async (_req) => ({ ok: true }));
    }
}

class ProtectedRoutes extends AuthenticatedRoutes {
    protected bindRoutes() {
        this.get('/test', async (_req) => ({ ok: true }));
    }
}

class TestServer extends BaseServer {
    public listenPort: number = 0;
    public failPostCreate: boolean = false;

    constructor() {
        super();
    }

    protected async loadConfigFile(): Promise<void> {}
    protected getWebConf() {
        return { port: this.listenPort, ip: '127.0.0.1', contextRoot: '/api' };
    }
    protected async postServerCreated(_server: http.Server): Promise<void> {
        if (this.failPostCreate) {
            throw new Error('Post server creation failed intentionally');
        }
    }
    protected async setupRoutes(): Promise<void> {
        await this.bindRoutes('/pub', async () => ({ default: PublicRoutes }));
        await this.bindRoutes('/priv', async () => ({ default: ProtectedRoutes }));
    }
}

describe('common-express-server comprehensive test suite', () => {
    beforeAll(() => {
        resetForTest();
        initialize(SILENT_LOGGER_CONFIG);
    });

    afterEach(() => {
        if (fs.existsSync('./check.dat')) {
            try {
                fs.unlinkSync('./check.dat');
            } catch {
                // Ignore cleanup error
            }
        }
    });

    test('should initialize AppConf singleton and fetch nested properties', () => {
        const conf = AppConf.init({ server: { port: 8080, db: { host: 'localhost' } } });
        expect(conf).toBeDefined();
        expect(AppConf.getInstance()).toBe(conf);

        expect(conf.get('server.port')).toBe(8080);
        expect(conf.get('server.db.host')).toBe('localhost');
        expect(conf.get('invalid.key')).toBeUndefined();
        expect(conf.get('')).toBeUndefined();
    });

    test('should register, start, and await in-flight tasks when stopping processors', async () => {
        const manager = ProcessorManager.getInstance();
        const processor = manager.register(MockProcessor as any) as MockProcessor;
        processor.inFlightDelayMs = 10;

        expect(processor).toBeDefined();
        expect(processor.isRunning).toBe(false);
        expect(manager.get('MockProcessor')).toBe(processor);

        processor.runImmediately();
        await (processor as any).checkNap();

        await manager.stopAll();
        expect(processor.isRunning).toBe(false);
        expect(processor.processedItems).toContain('item1');
    });

    test('should invoke routerHelper middlewares without throwing', async () => {
        const req: any = { headers: { user: encodeURIComponent(JSON.stringify({ accountCode: 'U100', name: 'Alice' })) } };
        const res: any = { header: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn(), send: jest.fn() };
        const next = jest.fn();

        routerHelper.setJsonHeader(req, res, next);
        expect(res.header).toHaveBeenCalledWith('Content-Type', 'application/json');

        routerHelper.setNoCache(req, res, next);
        expect(res.header).toHaveBeenCalledWith('Pragma', 'no-cache');

        await routerHelper.retrieveUser()(req, res, next);
        expect(req.user).toBeDefined();
        expect(req.user.accountCode).toBe('U100');
    });

    test('should execute Admin & Tenant controller methods correctly', async () => {
        const service = new MockService();
        const adminCtrl = new TestAdminController(service);
        const adminSearchCtrl = new TestAdminSearchController(service);
        const tenantCtrl = new TestTenantController(service);
        const tenantSearchCtrl = new TestTenantSearchController(service);

        const mockReq: any = {
            method: 'POST',
            originalUrl: '/test',
            body: { title: 'New Item' },
            query: { name: 'filter' },
            user: { accountCode: 'U1' }
        };

        const createdAdmin = await adminCtrl.createNew()(mockReq);
        expect(createdAdmin).toEqual({ id: 1, userOrData: { title: 'New Item' }, dataOrNil: undefined });

        const searchedAdmin = await adminSearchCtrl.search()(mockReq);
        expect(searchedAdmin).toEqual([{ id: 1, userOrQuery: { name: 'filter' }, queryOrNil: undefined }]);

        const createdTenant = await tenantCtrl.createNew()(mockReq);
        expect(createdTenant).toEqual({ id: 1, userOrData: { accountCode: 'U1' }, dataOrNil: { title: 'New Item' } });

        const searchedTenant = await tenantSearchCtrl.search()(mockReq);
        expect(searchedTenant).toEqual([{ id: 1, userOrQuery: { accountCode: 'U1' }, queryOrNil: { name: 'filter' } }]);
    });

    test('should throw ActionNotFoundError when service lacks search interface', () => {
        const emptyAdminSearch = new TestEmptyAdminSearchController();
        const mockReq: any = { query: {} };
        expect(() => emptyAdminSearch.search()(mockReq)).toThrow();
    });

    test('should verify public vs authenticated route authorization rules', async () => {
        const publicRoutes = new PublicRoutes();
        const protectedRoutes = new ProtectedRoutes();

        // Public route allows requests without user
        expect(await (publicRoutes as any).isValidUser(null)).toBe(true);

        // Protected route rejects requests without user and allows authenticated user
        expect(await (protectedRoutes as any).isValidUser(null)).toBe(false);
        expect(await (protectedRoutes as any).isValidUser({ accountCode: 'U1', name: 'Bob' })).toBe(true);
    });

    test('should reject unauthenticated request in checkLoggedUser middleware', async () => {
        const req: any = {
            headers: {},
            path: '/priv/test',
            method: 'GET',
            get: jest.fn().mockReturnValue(null),
            accepts: jest.fn().mockReturnValue('json')
        };
        const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn(), setHeader: jest.fn() };
        const next = jest.fn();

        await routerHelper.checkLoggedUser()(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should start, write check.dat with actual port, and shutdown server gracefully', async () => {
        const server = new TestServer();
        server.listenPort = 0; // Dynamic port

        await server.startup();

        expect(fs.existsSync('./check.dat')).toBe(true);
        const writtenPort = parseInt(fs.readFileSync('./check.dat', 'utf-8'), 10);
        expect(writtenPort).toBeGreaterThan(0);

        await server.shutdown();
        expect(fs.existsSync('./check.dat')).toBe(false);
    });

    test('should reject startup if postServerCreated fails', async () => {
        const server = new TestServer();
        server.listenPort = 0;
        server.failPostCreate = true;

        await expect(server.startup()).rejects.toThrow('Post server creation failed intentionally');
        expect(fs.existsSync('./check.dat')).toBe(false);
    });

    test('should reject startup if port is invalid or occupied', async () => {
        const server = new TestServer();
        server.listenPort = -1; // Invalid port

        await expect(server.startup()).rejects.toThrow();
    });

    test('should set process.exitCode = 1 on BaseServer.startup static failure', async () => {
        const server = new TestServer();
        server.listenPort = -1;

        process.exitCode = 0;
        await expect(BaseServer.startup(server)).rejects.toThrow();
        expect(process.exitCode).toBe(1);
        process.exitCode = 0; // Reset
    });

    test('should resolve RegisteredUser type from Controller.getLoggedUser without generic boilerplate', () => {
        class RegistryTenantController extends TenantBaseController<MockService> {
            constructor(service: MockService) {
                super(service, null);
            }
            public getUser(req: any) {
                return this.getLoggedUser(req);
            }
        }

        const service = new MockService();
        const ctrl = new RegistryTenantController(service);
        const mockReq: any = {
            user: { accountCode: 'U999', name: 'ServerUser', roles: ['admin'] }
        };
        const user = ctrl.getUser(mockReq);
        expect(user.accountCode).toBe('U999');
        expect(user.name).toBe('ServerUser');
    });

    describe('Health Check Subsystem', () => {
        test('should execute checkLiveness and checkReadiness on HealthCheckRegistry', async () => {
            const registry = new HealthCheckRegistry();
            registry.register('system', createSystemHealthIndicator());

            const liveness = registry.checkLiveness();
            expect(liveness.status).toBe('UP');
            expect(liveness.details.uptime).toBeGreaterThanOrEqual(0);

            const readiness = await registry.checkReadiness();
            expect(readiness.status).toBe('UP');
            expect(readiness.checks.system.status).toBe('UP');
        });

        test('should execute checks concurrently and handle timeout protection for slow/hung probes', async () => {
            const registry = new HealthCheckRegistry();

            // Fast check
            registry.register('fast', async () => ({ status: 'UP' }), true, 1000);

            // Hung check (never resolves)
            registry.register('hung', () => new Promise(() => {}), true, 50);

            const startTime = Date.now();
            const readiness = await registry.checkReadiness();
            const elapsedTime = Date.now() - startTime;

            expect(elapsedTime).toBeLessThan(300); // Should resolve around 50ms without hanging
            expect(readiness.status).toBe('DOWN');
            expect(readiness.checks.fast.status).toBe('UP');
            expect(readiness.checks.hung.status).toBe('DOWN');
            expect(readiness.checks.hung.error).toContain('timed out after 50ms');
        });

        test('should return DOWN and overall status DOWN when a critical check fails', async () => {
            const registry = new HealthCheckRegistry();
            registry.register('db', async () => ({
                status: 'DOWN',
                error: 'DB Connection Error'
            }), true);

            const readiness = await registry.checkReadiness();
            expect(readiness.status).toBe('DOWN');
            expect(readiness.checks.db.status).toBe('DOWN');
            expect(readiness.checks.db.error).toBe('DB Connection Error');
        });

        test('should return DEGRADED when non-critical check is DOWN or DEGRADED', async () => {
            const registry = new HealthCheckRegistry();
            registry.register('cache', async () => ({
                status: 'DOWN',
                error: 'Cache connection dropped'
            }), false); // non-critical

            const readiness = await registry.checkReadiness();
            // Overall status MUST be DEGRADED (not UP and not DOWN)
            expect(readiness.status).toBe('DEGRADED');
            expect(readiness.checks.cache.status).toBe('DOWN');

            // Verify HTTP handler returns 200 for DEGRADED
            const routes = new HealthRoutes(registry);
            const mockRes: any = {
                statusCode: 200,
                status: function(code: number) { this.statusCode = code; return this; },
                json: function(data: any) { this.body = data; return this; }
            };
            await (routes as any).getReadinessCustomHandler({}, mockRes);
            expect(mockRes.statusCode).toBe(200);
            expect(mockRes.body.status).toBe('DEGRADED');
        });

        test('should validate timeoutMs parameter and throw on invalid values', () => {
            const registry = new HealthCheckRegistry();
            const dummyIndicator = async () => ({ status: 'UP' as const });

            expect(() => registry.register('t1', dummyIndicator, true, 0)).toThrow("Invalid timeoutMs '0': Must be a positive finite number.");
            expect(() => registry.register('t2', dummyIndicator, true, -500)).toThrow("Invalid timeoutMs '-500': Must be a positive finite number.");
            expect(() => registry.register('t3', dummyIndicator, true, NaN)).toThrow("Invalid timeoutMs 'NaN': Must be a positive finite number.");
            expect(() => registry.register('t4', dummyIndicator, true, Infinity)).toThrow("Invalid timeoutMs 'Infinity': Must be a positive finite number.");
        });

        test('should omit details and sanitize error strings in production mode', async () => {
            const oldEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            const registry = new HealthCheckRegistry();
            registry.register('redis', async () => ({
                status: 'DOWN',
                error: 'Secret stack trace with Authorization: Bearer abc123secret and dsn=redis://user:pass@127.0.0.1:6379',
                details: {
                    host: '127.0.0.1',
                    password: 'secretpass',
                    token: 'bearer-token'
                }
            }));

            const readiness = await registry.checkReadiness();
            expect(readiness.status).toBe('DOWN');
            expect(readiness.checks.redis.error).toBe('Health check failed');
            expect(readiness.checks.redis.details).toBeUndefined();

            process.env.NODE_ENV = oldEnv;
        });

        test('should register custom health check on BaseServer and expose HealthRoutes', async () => {
            const server = new TestServer();
            ((server as any).healthRegistry as HealthCheckRegistry).register('custom', async () => ({ status: 'UP' }));

            const registry = (server as any).healthRegistry as HealthCheckRegistry;
            expect(registry.getRegisteredNames()).toContain('system');
            expect(registry.getRegisteredNames()).toContain('custom');

            const routes = new HealthRoutes(registry);
            const mockReq: any = {};
            const mockRes: any = {
                statusCode: 200,
                status: function(code: number) { this.statusCode = code; return this; },
                json: function(data: any) { this.body = data; return this; }
            };

            await (routes as any).getReadinessCustomHandler(mockReq, mockRes);
            expect(mockRes.statusCode).toBe(200);
            expect(mockRes.body.status).toBe('UP');
            expect(mockRes.body.checks.custom.status).toBe('UP');
        });
    });
});
