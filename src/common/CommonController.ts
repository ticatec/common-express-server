
import {ActionNotFoundError, IllegalParameterError} from "@ticatec/express-exception";
import BaseController from "./BaseController";
import beanValidator, {ValidationRules} from "@ticatec/bean-validator";
import {RestfulFunction} from "../CommonRouterHelper";
import {Request} from "express";

/**
 * Controller class that implements Create/Read/Update/Delete operations
 * @template T The service type this controller depends on
 */
export default abstract class CommonController<T> extends BaseController<T> {

    /**
     * Entity validation rules
     * @protected
     */
    protected readonly rules: ValidationRules;

    /**
     * Constructor for common controller
     * @param service The service instance to inject
     * @param rules Validation rules for entities (optional)
     * @protected
     */
    protected constructor(service: T, rules: ValidationRules = null) {
        super(service);
        this.rules = rules;
    }

    /**
     * Validates entity data
     * @param data The data to validate
     * @protected
     */
    protected validateEntity(data: any) {
        let result = beanValidator.validate(data, this.rules);
        if (!result.valid) {
            BaseController.debugEnabled && this.logger.debug(`Invalid data: ${result.errorMessage}`);
            throw new IllegalParameterError(result.errorMessage);
        }
    }

    /**
     * Creates new entity endpoint
     * @returns RESTful function for creating new entities
     */
    createNew(): RestfulFunction {
        return async (req: Request): Promise<any> => {
            return this._createNew(req);
        }
    }

    /**
     * Updates entity endpoint
     * @returns RESTful function for updating entities
     */
    update(): RestfulFunction {
        return async (req: Request): Promise<any> => {
            return this._update(req);
        }
    }

    /**
     * Deletes entity endpoint
     * @returns RESTful function for deleting entities
     */
    del(): RestfulFunction {
        return async (req: Request): Promise<any> => {
            return this._del(req);
        }
    }

    /**
     * Checks if a service interface method exists
     * @param name The method name to check
     * @protected
     */
    protected checkInterface(name: string):void {
        if (this.service[name] == null) {
            this.logger.warn(`Current service does not have interface: ${name}`);
            throw new ActionNotFoundError(`Current service does not have interface: ${name}`);
        }
    }

    /**
     * Invokes service interface by name
     * @param name The method name to invoke
     * @param args Arguments to pass to the method
     * @returns Promise resolving to the method result
     * @protected
     */
    protected async invokeServiceInterface(name: string, args: Array<any> = []): Promise<any> {
        return await this.service[name](...args);
    }

    /**
     * Creates a new entity
     * @param req Express request object
     * @returns Promise resolving to the created entity
     * @protected
     */
    protected _createNew(req: Request): Promise<any> {
        let data:any = req.body;
        BaseController.debugEnabled && this.logger.debug(`${req.method} ${req.originalUrl} Request to create an entity`, data);
        this.checkInterface('createNew');
        this.validateEntity(data);
        return this.invokeServiceInterface('createNew', this.getCreateNewArguments(req));
    }

    /**
     * Updates an entity
     * @param req Express request object
     * @returns Promise resolving to the updated entity
     * @protected
     */
    protected _update(req: Request): Promise<any> {
        let data:any = req.body;
        BaseController.debugEnabled && this.logger.debug(`${req.method} ${req.originalUrl} Request to update an entity`, data);
        this.checkInterface('update');
        this.validateEntity(data);
        return this.invokeServiceInterface('update', this.getUpdateArguments(req));
    }

    /**
     * Deletes an entity
     * @param req Express request object
     * @returns Promise resolving when entity is deleted
     * @protected
     */
    protected _del(req: Request): Promise<any> {
        // Please implement delete interface in subclass, otherwise system exception will be thrown
        this.logger.warn('Current service does not have delete interface');
        throw new ActionNotFoundError('Current service does not have delete interface');
    }

    /**
     * Gets arguments for creating new entity
     * @param req Express request object
     * @returns Array of arguments to pass to service create method
     * @protected
     * @abstract
     */
    protected abstract getCreateNewArguments(req: Request):Array<any>;

    /**
     * Gets arguments for updating entity
     * @param req Express request object
     * @returns Array of arguments to pass to service update method
     * @protected
     * @abstract
     */
    protected abstract getUpdateArguments(req: Request):Array<any>;
}