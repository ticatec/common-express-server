import log4js, {Logger} from "log4js";
import {Request} from "express";
import LoggedUser, {CommonUser} from "../LoggedUser";

export default abstract class Controller {


    /** Flag to enable debug logging */
    static debugEnabled: boolean = false;

    /** Logger instance for this controller */
    protected readonly logger: Logger;

    /**
     * Constructor for base controller
     * @protected
     */
    protected constructor() {
        this.logger = log4js.getLogger(this.constructor.name);
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