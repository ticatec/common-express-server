import {NextFunction, Request, Response} from "express";
import {ActionNotFoundError, handleError, UnauthenticatedError} from '@ticatec/express-exception';
import log4js from "log4js";
import LoggedUser from "./LoggedUser";


/**
 * Function signature for RESTful API handlers
 */
export type RestfulFunction = (req: Request) => any;

/**
 * Function signature for control handlers
 */
export type ControlFunction = (req: Request, res: Response) => any;

/**
 * Common router helper class providing middleware and utilities for Express routing
 */
export default class CommonRouterHelper {

    /** Logger instance for this router helper */
    protected readonly logger = log4js.getLogger(this.constructor.name);

    /**
     * Sets HTTP response header to JSON format
     * @param req Express request object
     * @param res Express response object
     * @param next Express next function
     */
    setJsonHeader(req: Request, res: Response, next: NextFunction): void {
        res.header('Content-Type', 'application/json');
        next();
    }


    /**
     * Sets response headers to disable caching
     * @param req Express request object
     * @param res Express response object
     * @param next Express next function
     */
    setNoCache(req: Request, res: Response, next: NextFunction): void {
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
        next();
    }

    /**
     * Invokes a RESTful operation and wraps the result in JSON format for the client
     * @param func The RESTful function to execute
     * @returns Express middleware function
     */
    invokeRestfulAction(func: RestfulFunction): any {
        return async (req: Request, res: Response): Promise<void> => {
            try {
                let result = await func(req);
                if (result != null) {
                    res.json(result);
                } else {
                    res.status(204).send();
                }
            } catch (ex) {
                handleError(ex, req, res);
            }
        }
    }

    /**
     * Invokes an asynchronous controller function with error handling
     * @param func The controller function to execute
     * @returns Express middleware function
     */
    invokeController(func: ControlFunction) {
        return async (req: Request, res: Response): Promise<void> => {
            try {
                await func(req, res);
            } catch (ex) {
                handleError(ex, req, res);
            }
        }
    }


    /**
     * Handles invalid request paths by throwing ActionNotFoundError
     * @returns Express middleware function for handling 404 errors
     */
    actionNotFound() {
        return (req: Request, res: Response, next: NextFunction) => {
            handleError(new ActionNotFoundError(), req, res);
        }
    }

    /**
     * Retrieves user information from request headers
     * @param req Express request object
     * @protected
     */
    protected async retrieveUserFormHeader(req: Request): Promise<void> {
        let userStr: string = req.headers['user'] as string;
        if (userStr != null) {
            try {
                const user = JSON.parse(decodeURIComponent(userStr));
                let language = req.headers['x-language'];
                if (language) {
                    if (user.actAs) {
                        user.actAs['language'] = language
                    }
                    user['language'] = language
                }
                req['user'] = await this.handleLoggedUser(user);
                this.logger.debug(`User retrieved from header: ${user.accountCode}`);
            } catch (ex) {
                this.logger.warn('Invalid user header format', { error: ex.message, path: req.path });
            }
        }
    }

    /**
     * Hook method for subclasses to extend and process logged user information
     * This method is called after retrieving user from headers and before setting it to request
     * Subclasses can override this method to add custom processing such as:
     * - Loading additional user data from database
     * - Validating user permissions
     * - Enriching user information
     * - Custom logging
     * @param user The logged user object retrieved from headers
     * @returns Promise resolving to the processed user object
     * @protected
     */
    protected async handleLoggedUser(user: LoggedUser): Promise<LoggedUser> {
        return user;
    }

    /**
     * Middleware to retrieve user information from headers
     * @returns Express middleware function
     */
    retrieveUser() {
        return async (req: Request, res: Response, next: any) => {
            await this.retrieveUserFormHeader(req);
            next();
        }
    }


    /**
     * Middleware to check if user is authenticated
     * @returns Express middleware function that validates user authentication
     */
    checkLoggedUser() {
        return (req: Request, res: Response, next: any) => {
            this.retrieveUserFormHeader(req);
            if (req['user'] == null) {
                this.logger.warn('Unauthenticated request', { path: req.path, method: req.method });
                handleError(new UnauthenticatedError(), req, res);
            } else {
                this.logger.debug(`User authenticated: ${req['user'].accountCode}`);
                next();
            }
        }
    }

}