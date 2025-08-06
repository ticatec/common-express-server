import {Express, Router} from "express";
import CommonRouterHelper from "./CommonRouterHelper";
import log4js, {Logger} from "log4js";

/**
 * Abstract base class for defining common routes
 * @template T The type of CommonRouterHelper this routes class uses
 */
export default abstract class CommonRoutes<T extends CommonRouterHelper> {

    /** Express router instance */
    readonly router: Router;
    /** Router helper instance */
    protected helper: T;
    /** Logger instance for this routes class */
    protected logger: Logger;
    /**
     * Constructor for common routes
     * @param helper Router helper instance
     * @param checkUser Whether to check user authentication (default: true)
     * @protected
     */
    protected constructor(helper: T, checkUser: boolean = true) {
        this.router = Router();
        this.helper = helper;
        this.logger = log4js.getLogger(this.constructor.name);
        if (checkUser) {
            this.logger.debug('Checking if user is logged in')
            this.router.use(helper.checkLoggedUser());
        }
    }

    /**
     * Binds this router to the Express application
     * @param app Express application instance
     * @param path The path prefix for this router
     */
    bindRouter(app: Express, path: string) {
        app.use(path, this.router);
    }
}