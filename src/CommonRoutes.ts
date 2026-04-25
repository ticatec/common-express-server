import {Express, Request, Response, Router} from "express";
import RouterHelper from "./RouterHelper";
import log4js, {Logger} from "log4js";
import {RequestHandler, NextFunction} from "express-serve-static-core";

/**
 * Abstract base class for defining common routes
 *
 * Provides a structured way to define routes with support for:
 * - User authentication checks
 * - Custom user processing hooks
 * - Global middleware handlers
 *
 * The middleware execution order is:
 * 1. Authentication check (if `doUserCheck()` returns true)
 * 2. User hook processing (if `getUserHook()` returns a function)
 * 3. Global middleware (if `getGlobalHandler()` returns a handler)
 * 4. Route handlers (defined in `bindRoutes()`)
 *
 * @example
 * ```typescript
 * class UserRoutes extends CommonRoutes {
 *   // Enable default user authentication
 *   protected doUserCheck(): boolean {
 *     return true;
 *   }
 *
 *   // Load additional user data
 *   protected getUserHook(): ((user: any) => any) | null {
 *     return async (user) => {
 *       // Load user preferences
 *       user.preferences = await loadPreferences(user.accountCode);
 *       return user;
 *     };
 *   }
 *
 *   // Define routes
 *   protected bindRoutes() {
 *     this.get('/profile', RouterHelper.invokeRestfulAction(this.getProfile));
 *   }
 *
 *   private getProfile = async (req: Request) => {
 *     return req['user'];
 *   };
 * }
 * ```
 */
export default class CommonRoutes {

    /** Express router instance */
    private readonly router: Router;
    /** Logger instance for this routes class */
    protected logger: Logger = log4js.getLogger(this.constructor.name);

    /**
     * Constructor for common routes
     * @param mergeParams Whether to merge params from parent router (default: false)
     */
    constructor(mergeParams: boolean = false) {
        this.router = Router({mergeParams});
    }

    /**
     * Binds this router to the Express application with the given path
     *
     * The binding process follows this order:
     * 1. If `doUserCheck()` returns true, adds default authentication middleware
     * 2. If `getUserHook()` returns a function, adds user hook middleware (with error handling)
     * 3. If `getGlobalHandler()` returns a handler, adds global middleware
     * 4. Calls `bindRoutes()` to register route definitions
     * 5. Mounts the router to the Express app at the specified path
     *
     * @param app Express application instance
     * @param path The route path to bind this router to
     */
    async bind(app: Express, path: string): Promise<void> {
        this.logger.debug(`Binding router to path: ${path}`);
        if (this.doUserCheck()) {
            this.logger.debug('Adding default user authentication check');
            this.router.use(RouterHelper.checkLoggedUser());
        }
        let userHook = this.getUserHook();
        if (userHook) {
            this.router.use(async (req: Request, _res: Response, next: NextFunction) => {
                try {
                    if (req['user']) {
                        req['user'] = await userHook(req['user']);
                    }
                    next();
                } catch (error) {
                    next(error);
                }
            });
        }
        let globalHandler = this.getGlobalHandler();
        if (globalHandler) {
            this.logger.info('Setting global handler middleware');
            this.router.use(globalHandler as RequestHandler);
        }
        this.bindRoutes();
        app.use(path, this.router);
        this.logger.info(`Router bound successfully to path: ${path}`);
    }

    /**
     * Determines whether to perform default user authentication check
     *
     * Override this method to enable/disable default user authentication.
     * When returning true, the default `checkLoggedUser()` middleware will be added,
     * which verifies that a user is present in the request (after global user parsing).
     *
     * @returns true to enable default user authentication, false otherwise
     * @protected
     *
     * @example
     * ```typescript
     * // Require authentication for all routes
     * protected doUserCheck(): boolean {
     *   return true;
     * }
     *
     * // No authentication required (public routes)
     * protected doUserCheck(): boolean {
     *   return false;
     * }
     * ```
     */
    protected doUserCheck(): boolean {
        return false;
    }

    /**
     * Abstract method for binding routes
     *
     * Override this method to define your routes using:
     * - `get(path, handler)` - Register a GET route
     * - `post(path, handler)` - Register a POST route
     * - `put(path, handler)` - Register a PUT route
     * - `delete(path, handler)` - Register a DELETE route
     *
     * @protected
     *
     * @example
     * ```typescript
     * protected bindRoutes() {
     *   // Simple route
     *   this.get('/users', async (req, res) => {
     *     res.json({ users: [] });
     *   });
     *
     *   // Using RouterHelper for automatic error handling
     *   this.post('/users', RouterHelper.invokeRestfulAction(async (req) => {
     *     return await createNewUser(req.body);
     *   }));
     *
     *   // Route with parameters
     *   this.get('/users/:id', async (req, res) => {
     *     res.json({ id: req.params.id });
     *   });
     * }
     * ```
     */
    protected bindRoutes() {

    }

    /**
     * Gets the global handler middleware for this router
     *
     * Override this method to add custom middleware that applies to all routes in this router.
     * This middleware is executed after the user hook (if any) and before route handlers.
     *
     * This can be used for:
     * - Additional logging
     * - Request validation
     * - Permissions checking
     * - Rate limiting
     * - Custom headers
     *
     * @returns Express middleware handler or null if no global handler is needed
     * @protected
     *
     * @example
     * ```typescript
     * protected getGlobalHandler(): RequestHandler | null {
     *   return async (req, res, next) => {
     *     // Log all requests
     *     console.log(`Processing ${req.method} ${req.path}`);
     *     next();
     *   };
     * }
     * ```
     *
     * @example
     * ```typescript
     * protected getGlobalHandler(): RequestHandler | null {
     *   return async (req, res, next) => {
     *     // Check API version
     *     const version = req.headers['api-version'];
     *     if (!version) {
     *       throw new IllegalParameterError('API version is required');
     *     }
     *     next();
     *   };
     * }
     * ```
     */
    protected getGlobalHandler(): RequestHandler | null {
        return null;
    }

    /**
     * Registers a GET route
     * @param path Route path (can include parameters like `/users/:id`)
     * @param handler Request handler function
     *
     * @example
     * ```typescript
     * // Simple handler
     * this.get('/users', (req, res) => {
     *   res.json({ users: [] });
     * });
     *
     * // With RouterHelper for automatic error handling
     * this.get('/users/:id', RouterHelper.invokeRestfulAction(async (req) => {
     *   const user = await getUserById(req.params.id);
     *   return user;
     * }));
     * ```
     */
    get(path: string, handler: RequestHandler) {
        this.router.get(path, handler);
        this.logger.debug(`Registered GET route: ${path}`);
    }

    /**
     * Registers a POST route
     * @param path Route path
     * @param handler Request handler function
     *
     * @example
     * ```typescript
     * // Simple handler
     * this.post('/users', (req, res) => {
     *   const user = createUser(req.body);
     *   res.status(201).json(user);
     * });
     *
     * // With RouterHelper
     * this.post('/users', RouterHelper.invokeRestfulAction(async (req) => {
     *   return await createUser(req.body);
     * }));
     * ```
     */
    post(path: string, handler: RequestHandler) {
        this.router.post(path, handler);
        this.logger.debug(`Registered POST route: ${path}`);
    }

    /**
     * Registers a PUT route
     * @param path Route path (can include parameters like `/users/:id`)
     * @param handler Request handler function
     *
     * @example
     * ```typescript
     * this.put('/users/:id', RouterHelper.invokeRestfulAction(async (req) => {
     *   return await updateUser(req.params.id, req.body);
     * }));
     * ```
     */
    put(path: string, handler: RequestHandler) {
        this.router.put(path, handler);
        this.logger.debug(`Registered PUT route: ${path}`);
    }

    /**
     * Registers a DELETE route
     * @param path Route path (can include parameters like `/users/:id`)
     * @param handler Request handler function
     *
     * @example
     * ```typescript
     * this.delete('/users/:id', RouterHelper.invokeRestfulAction(async (req) => {
     *   await deleteUser(req.params.id);
     *   res.status(204).send();
     * }));
     * ```
     */
    delete(path: string, handler: RequestHandler) {
        this.router.delete(path, handler);
        this.logger.debug(`Registered DELETE route: ${path}`);
    }

    /**
     * Gets the custom user hook function
     *
     * Override this method to provide custom user processing logic.
     * The hook function receives the user object (from `req['user']`) and returns a
     * processed user object. The returned value will replace `req['user']`.
     *
     * This hook is executed after authentication check (if enabled) and is wrapped
     * with automatic error handling - any errors thrown will be passed to Express's
     * error handling middleware.
     *
     * This is useful for:
     * - Loading additional user-specific data from database
     * - Adding user permissions or roles
     * - Enriching user profile information
     * - Setting request context based on user
     * - Custom logging based on user information
     *
     * @returns A function that processes the user object, or null if no hook is needed
     * @protected
     *
     * @example
     * ```typescript
     * protected getUserHook(): ((user: any) => any) | null {
     *   return async (user) => {
     *     if (user) {
     *       // Load additional user data
     *       user.preferences = await loadUserPreferences(user.accountCode);
     *       user.permissions = await loadUserPermissions(user.accountCode);
     *       user.profile = await loadUserProfile(user.accountCode);
     *     }
     *     return user;
     *   };
     * }
     * ```
     *
     * @example
     * ```typescript
     * // Conditional processing
     * protected getUserHook(): ((user: any) => any) | null {
     *   return async (user) => {
     *     if (user && user.tenant) {
     *       // Load tenant-specific settings
     *       user.tenantSettings = await loadTenantSettings(user.tenant.code);
     *     }
     *     return user;
     *   };
     * }
     * ```
     */
    protected getUserHook(): ((user: any) => any) | null {
        return null;
    }
}