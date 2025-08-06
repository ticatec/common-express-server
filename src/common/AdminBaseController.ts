import {ValidationRules} from "@ticatec/bean-validator";
import CommonController from "./CommonController";
import {Request} from "express";

/**
 * Base class for platform admin interfaces that are tenant-independent
 * @template T The service type this controller depends on
 */
export default abstract class AdminBaseController<T> extends CommonController<T> {

    /**
     * Constructor for admin base controller
     * @param service The service instance to inject
     * @param rules Entity validation rules
     * @protected
     */
    protected constructor(service: T, rules: ValidationRules) {
        super(service, rules);
    }

    /**
     * Gets arguments for creating new entity
     * @param req Express request object
     * @returns Array containing request body as the only argument
     * @protected
     */
    protected getCreateNewArguments(req: Request):Array<any> {
        return [req.body]
    }

    /**
     * Gets arguments for updating entity
     * @param req Express request object
     * @returns Array containing request body as the only argument
     * @protected
     */
    protected getUpdateArguments(req: Request) {
        return [req.body]
    }
}
