import {Request} from "express";
import TenantBaseController from "./TenantBaseController";
import BaseController from "./BaseController";

/**
 * Interface with search capabilities for tenant use
 * @template T The service type this controller depends on
 */
export default abstract class TenantSearchController<T> extends TenantBaseController<T> {

    /**
     * Search method for querying entities with tenant context
     * @returns Function that handles tenant-specific search requests
     */
    search() {
        return async (req:Request):Promise<any> => {
            let query:any = req.query;
            BaseController.debugEnabled && this.logger.debug(`Path: ${req.path}, query by criteria:`, query);
            this.checkInterface('search');
            return await this.invokeServiceInterface('search', [this.getLoggedUser(req), query]);
        }
    }

}
