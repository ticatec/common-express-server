import CommonController from "./CommonController.js";
import {ValidationRules} from "@ticatec/bean-validator";
import {Request} from "express";
import { RegisteredUser } from "../LoggedUser.js";

/**
 * Base class for tenant-specific interfaces
 * @template T The service type this controller depends on
 */
export default abstract class TenantBaseController<T> extends CommonController<T> {

    /**
     * Constructor for tenant base controller
     * @param service The service instance to inject
     * @param rules Entity validation rules
     * @protected
     */
    protected constructor(service: T, rules: ValidationRules) {
        super(service, rules);
    }

    /**
     * Gets arguments for creating new entity, first parameter is logged user typed as RegisteredUser, second is request data
     * @param req Express request object
     * @returns Array containing logged user typed as RegisteredUser and request body
     * @protected
     */
    protected getCreateNewArguments(req: Request): [RegisteredUser, any] {
        return [this.getLoggedUser(req), req.body];
    }

    /**
     * Gets arguments for updating entity, first parameter is logged user typed as RegisteredUser, second is request data
     * @param req Express request object
     * @returns Array containing logged user typed as RegisteredUser and request body
     * @protected
     */
    protected getUpdateArguments(req: Request): [RegisteredUser, any] {
        return [this.getLoggedUser(req), req.body];
    }
}
