
import log4js, {Logger} from "log4js";

export default abstract class BaseController<T> {

    static debugEnabled: boolean = false;
    protected readonly service: T;
    protected readonly logger: Logger;

    /**
     * 构造方法
     * @param service
     * @protected
     */
    protected constructor(service: T) {
        this.logger = log4js.getLogger(this.constructor.name);
        this.service = service;
    }

    /**
     * 获取当前登录用户，如果有扮演，获取扮演用户，对于没有注入用户的请求，将返回null
     * @param req
     */
    protected getLoggedUser = (req) => {
        let user = req.user;
        return user?.actAs || user;
    }

}