import {Express, Router, Request, Response} from "express";
import CommonRouterHelper from "./CommonRouterHelper";
import log4js, {Logger} from "log4js";
import {NextFunction} from "express-serve-static-core";
import {UnauthenticatedError} from "@ticatec/express-exception";

/**
 * 当前用户检查
 */
export type UserChecker = (req: Request) => boolean;

/**
 * 自定义校验
 * @param checker
 */
const customCheck = (checker: UserChecker) => (req: Request, res: Response, next: NextFunction) => {
    if (checker(req)) {
        next();
    } else {
        throw new UnauthenticatedError()
    }
}

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
     * @param mergeParams Whether to merge params (default: false)
     * @protected
     */
    protected constructor(helper: T, checkUser: boolean | UserChecker = true, mergeParams: boolean = false) {
        this.router = Router({ mergeParams });
        this.helper = helper;
        this.logger = log4js.getLogger(this.constructor.name);
        if (typeof checkUser == "boolean") {
            if (checkUser) {
                this.logger.debug('Checking if user is logged in')
                this.router.use(helper.checkLoggedUser());
            }
        } else if (typeof checkUser == "function") {
            this.router.use(customCheck(checkUser))
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