
import CommonController from "./CommonController";
import {ValidationRules} from "@ticatec/bean-validator";
import {Request} from "express";

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
    protected constructor(service: any, rules: ValidationRules) {
        super(service, rules);
    }

    /**
     * Gets arguments for creating new entity, first parameter is logged user, second is request data
     * @param req Express request object
     * @returns Array containing logged user and request body
     * @protected
     */
    protected getCreateNewArguments(req: Request):Array<any> {
        return [this.getLoggedUser(req), req.body]
    }

    /**
     * Gets arguments for updating entity, first parameter is logged user, second is request data
     * @param req Express request object
     * @returns Array containing logged user and request body
     * @protected
     */
    protected getUpdateArguments(req: Request): any[] {
        return [this.getLoggedUser(req), req.body]
    }

}
