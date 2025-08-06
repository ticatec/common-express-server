
import log4js, {Logger} from "log4js";
import LoggedUser, {CommonUser} from "../LoggedUser";
import {Request} from "express";

/**
 * Abstract base controller class providing common functionality for all controllers
 * @template T The service type this controller depends on
 */
export default abstract class BaseController<T> {

    /** Flag to enable debug logging */
    static debugEnabled: boolean = false;
    /** The service instance this controller uses */
    protected readonly service: T;
    /** Logger instance for this controller */
    protected readonly logger: Logger;

    /**
     * Constructor for base controller
     * @param service The service instance to inject
     * @protected
     */
    protected constructor(service: T) {
        this.logger = log4js.getLogger(this.constructor.name);
        this.service = service;
    }

    /**
     * Gets the current logged user, if acting as another user, returns the acted user,
     * returns null for requests without user injection
     * @param req Express request object
     * @returns The current user or null if no user is logged in
     */
    protected getLoggedUser = (req: Request): CommonUser => {
        let user: LoggedUser = req['user'];
        return user?.actAs || user;
    }

}