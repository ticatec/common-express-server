
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
}