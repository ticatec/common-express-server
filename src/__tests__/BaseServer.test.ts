import pino from 'pino';
import { initialize, resetForTest } from '@ticatec/logger-wrapper';
import http from 'http';
import fs from 'fs';
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
        initialize(pino({ level: 'silent' }));
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
});
