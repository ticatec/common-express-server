
import {ActionNotFoundError, IllegalParameterError} from "@ticatec/node-exception";
import BaseController from "./BaseController.js";
import beanValidator, {ValidationRules} from "@ticatec/bean-validator";
import {RestfulFunction} from "../RouterHelper.js";
import {Request} from "express";
import Controller from "./Controller.js";

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
        if (!this.rules || !Array.isArray(this.rules) || this.rules.length === 0) {
            return;
        }
        const validator: any = (beanValidator as any).validate ? beanValidator : (beanValidator as any).default;
        const result = validator.validate(data, this.rules);
        if (!result.valid) {
            Controller.debugEnabled && this.logger.debug({ error: result.errorMessage }, 'Invalid entity data');
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
            throw new ActionNotFoundError();
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

    protected buildNewEntry(req: Request): any {
        return req.body;
    }

    protected buildUpdatedEntry(req: Request): any {
        return req.body;
    }

    /**
     * Creates a new entity
     * @param req Express request object
     * @returns Promise resolving to the created entity
     * @protected
     */
    protected _createNew(req: Request): Promise<any> {
        const data:any = this.buildNewEntry(req);
        Controller.debugEnabled && this.logger.debug({ data }, `${req.method} ${req.originalUrl} Request to create an entity`);
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
        const data:any = this.buildUpdatedEntry(req);
        Controller.debugEnabled && this.logger.debug({ data }, `${req.method} ${req.originalUrl} Request to update an entity`);
        this.checkInterface('update');
        this.validateEntity(data);
        return this.invokeServiceInterface('update', this.getUpdateArguments(req));
    }

    /**
     * Deletes an entity
     * @param _req Express request object
     * @returns Promise resolving when entity is deleted
     * @protected
     */
    protected _del(_req: Request): Promise<any> {
        // Please implement delete interface in subclass, otherwise system exception will be thrown
        this.logger.warn('Current service does not have delete interface');
        throw new ActionNotFoundError();
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