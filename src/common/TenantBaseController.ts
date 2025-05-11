
import CommonController from "./CommonController";
import {ValidationRules} from "@ticatec/bean-validator";

/**
 * 租户的基础接口
 */
export default abstract class TenantBaseController<T> extends CommonController<T> {

    protected constructor(service: any, rules: ValidationRules) {
        super(service, rules);
    }

    /**
     * 获取当前登录用户，如果有扮演，获取扮演用户
     * @param req
     */
    protected getLoggedUser = (req) => {
        let user = req.user;
        return user.actAs || user;
    }

    /**
     * 获取新增接口的参数，第一个参数为登录用户，第二个参数为请求数据
     * @param req
     * @protected
     */
    protected getCreateNewArguments(req: any):Array<any> {
        return [this.getLoggedUser(req), req.body]
    }

    /**
     * 获取更新接口的参数，第一个参数为登录用户，第二个参数为请求数据
     * @param req
     * @protected
     */
    protected getUpdateArguments(req: any) {
        return [this.getLoggedUser(req), req.body]
    }

}
