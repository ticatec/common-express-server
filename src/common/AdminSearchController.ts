import {Request} from "express";
import AdminBaseController from "./AdminBaseController";
import BaseController from "./BaseController";

/**
 * 和租户无关的代查询的平台管理接口的基础类
 */
export default abstract class AdminSearchController<T> extends AdminBaseController<T> {

    search() {
        return (req:Request) => {
            let query = req.query;
            BaseController.debugEnabled && this.logger.debug(`path: ${req.path}, query by criteria:`, query);
            return this.invokeServiceInterface('search', [query]);
        }
    }
}
