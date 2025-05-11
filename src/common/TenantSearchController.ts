import {Request} from "express";
import TenantBaseController from "./TenantBaseController";
import BaseController from "./BaseController";

/**
 * 供租户使用带查询的接口
 */
export default abstract class TenantSearchController<T> extends TenantBaseController<T> {

    search() {
        return async (req:Request):Promise<any> => {
            let query:any = req.query;
            BaseController.debugEnabled && this.logger.debug(`path: ${req.path}, query by criteria:`, query);
            this.checkInterface('search');
            return await this.invokeServiceInterface('search', [this.getLoggedUser(req), query]);
        }
    }

}
