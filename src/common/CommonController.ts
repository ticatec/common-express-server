
import {ActionNotFoundError, AppError, IllegalParameterError} from "@ticatec/express-exception";
import BaseController from "./BaseController";
import beanValidator, {ValidationRules} from "@ticatec/bean-validator";
import {RestfulFunction} from "../CommonRouterHelper";

/**
 * 实现了增/删/改的控制类
 */
export default abstract class CommonController<T> extends BaseController<T> {

    /**
     * 实体检验规则
     * @protected
     */
    protected readonly rules: ValidationRules;

    protected constructor(service: T, rules: ValidationRules = null) {
        super(service);
        this.rules = rules;
    }

    /**
     * 验证实体
     * @param data
     * @protected
     */
    protected validateEntity(data: any) {
        let result = beanValidator.validate(data, this.rules);
        if (!result.valid) {
            BaseController.debugEnabled && this.logger.debug(`invalid data: ${result.errorMessage}`);
            throw new IllegalParameterError(result.errorMessage);
        }
    }

    /**
     * 新增实体接口
     */
    createNew(): RestfulFunction {
        return async (req: any): Promise<any> => {
            return this._createNew(req);
        }
    }

    /**
     * 更新实体接口
     */
    update(): RestfulFunction {
        return async (req: any): Promise<any> => {
            return this._update(req);
        }
    }

    /**
     * 删除实体接口
     */
    del(): RestfulFunction {
        return async (req: any): Promise<any> => {
            return this._del(req);
        }
    }

    protected checkInterface(name: string):void {
        if (this.service[name] == null) {
            this.logger.warn(`当前服务没有新增接口:${name}`);
            throw new ActionNotFoundError(`当前服务没有新增接口:${name}`);
        }
    }

    /**
     * 根据名称调用服务接口
     * @param name
     * @param args
     * @protected
     */
    protected async invokeServiceInterface(name: string, args: Array<any> = []): Promise<any> {
        return await this.service[name](...args);
    }

    /**
     * 新建实体
     * @param req
     * @protected
     */
    protected _createNew(req: any): Promise<any> {
        let data:any = req.body;
        BaseController.debugEnabled && this.logger.debug(`${req.method} ${req.originalUrl} 申请创建一个实体`, data);
        this.checkInterface('createNew');
        this.validateEntity(data);
        return this.invokeServiceInterface('createNew', this.getCreateNewArguments(req));
    }

    /**
     * 更新实体
     * @param req
     * @protected
     */
    protected _update(req: any): Promise<any> {
        let data:any = req.body;
        BaseController.debugEnabled && this.logger.debug(`${req.method} ${req.originalUrl} 申请更新一个实体,`, data);
        this.checkInterface('update');
        this.validateEntity(data);
        return this.invokeServiceInterface('update', this.getUpdateArguments(req));
    }

    /**
     * 删除实体
     * @param req
     * @protected
     */
    protected _del(req: any): Promise<any> {
        //请在子类实现删除接口，否则会抛出系统异常
        this.logger.warn('当前服务没有删除接口');
        throw new ActionNotFoundError('当前服务没有删除接口');
    }

    /**
     * 新增实体的参数
     * @param req
     * @protected
     */
    protected abstract getCreateNewArguments(req: any):Array<any>;

    /**
     * 更新实体的参数
     * @param req
     * @protected
     */
    protected abstract getUpdateArguments(req: any):Array<any>;
}