import {ValidationRules} from "@ticatec/bean-validator";
import CommonController from "./CommonController";

/**
 * 和租户无关的平台管理接口的基础类
 */
export default abstract class AdminBaseController<T> extends CommonController<T> {

    /**
     * 构造方法
     * @param service
     * @param rules 实体检验规则
     * @protected
     */
    protected constructor(service: T, rules: ValidationRules) {
        super(service, rules);
    }

    /**
     * 新增的参数
     * @param req
     * @protected
     */
    protected getCreateNewArguments(req: any):Array<any> {
        return [req.body]
    }

    /**
     * 更新方法的参数
     * @param req
     * @protected
     */
    protected getUpdateArguments(req: any) {
        return [req.body]
    }
}
