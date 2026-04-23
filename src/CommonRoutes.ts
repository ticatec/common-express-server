import {Express, Router, Request, Response} from "express";
import CommonRouterHelper from "./CommonRouterHelper";
import log4js, {Logger} from "log4js";
import {NextFunction, RequestHandler} from "express-serve-static-core";
import {UnauthenticatedError} from "@ticatec/express-exception";

/**
 * Custom checker function type for route authentication
 * @param req Express request object
 * @returns true if request should be allowed, false otherwise
 */
export type CustomChecker = (req: Request) => boolean;

/**
 * Creates middleware for custom authentication checking
 * @param checker Custom checker function to validate requests
 * @returns Express middleware function
 */
const customCheck = (checker: CustomChecker) => (req: Request, res: Response, next: NextFunction) => {
    if (checker(req)) {
        next();
    } else {
        throw new UnauthenticatedError();
    }
}

/**
 * Abstract base class for defining common routes
 * @template T The type of CommonRouterHelper this routes class uses
 */
export default class CommonRouter<T extends CommonRouterHelper> {

    /** Express router instance */
    private readonly router: Router;
    /** Router helper instance */
    protected helper: T;
    /** Logger instance for this routes class */
    protected logger: Logger = log4js.getLogger(this.constructor.name);
    /**
     * Constructor for common routes
     * @param mergeParams Whether to merge params (default: false)
     * @protected
     */
    constructor(mergeParams: boolean = false) {
        this.router = Router({ mergeParams });
    }

    /**
     * Binds this router to the Express application with the given helper and path
     * @param app Express application instance
     * @param helper Router helper instance to use for this router
     * @param path The route path to bind this router to
     */
    bind(app: Express, helper: T, path: string): void {
        this.logger.debug(`Binding router to path: ${path}`);
        this.helper = helper;
        let globalHandler = this.getGlobalHandler();
        if (typeof globalHandler == "boolean") {
            if (globalHandler) {
                this.logger.debug('Adding default user authentication check');
                this.router.use(this.helper.checkLoggedUser());
            }
        } else if (typeof globalHandler == "function") {
            this.logger.debug('Adding custom authentication check');
            this.router.use(customCheck(globalHandler));
        }
        this.bindRoutes();
        app.use(path, this.router);
        this.logger.info(`Router bound successfully to path: ${path}`);
    }

    /**
     * Abstract method for binding routes. Override this method to define routes.
     * @protected
     */
    protected bindRoutes() {

    }

    /**
     * Gets the global handler for route authentication
     * @returns Either a boolean to enable/disable default auth, or a custom checker function
     * @protected
     */
    protected getGlobalHandler(): boolean | CustomChecker {
        return false;
    }

    /**
     * Registers a GET route
     * @param path Route path
     * @param handler Request handler function
     */
    get(path: string, handler: RequestHandler) {
        this.router.get(path, handler);
        this.logger.debug(`Registered GET route: ${path}`);
    }

    /**
     * Registers a POST route
     * @param path Route path
     * @param handler Request handler function
     */
    post(path: string, handler: RequestHandler) {
        this.router.post(path, handler);
        this.logger.debug(`Registered POST route: ${path}`);
    }

    /**
     * Registers a PUT route
     * @param path Route path
     * @param handler Request handler function
     */
    put(path: string, handler: RequestHandler) {
        this.router.put(path, handler);
        this.logger.debug(`Registered PUT route: ${path}`);
    }

    /**
     * Registers a DELETE route
     * @param path Route path
     * @param handler Request handler function
     */
    delete(path: string, handler: RequestHandler) {
        this.router.delete(path, handler);
        this.logger.debug(`Registered DELETE route: ${path}`);
    }


}