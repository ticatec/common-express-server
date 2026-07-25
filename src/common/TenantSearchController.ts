import {Request} from "express";
import TenantBaseController from "./TenantBaseController.js";
import Controller from "./Controller.js";


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
            const query:any = req.query;
            Controller.debugEnabled && this.logger.debug({ query }, `Path: ${req.path}, query by criteria`);
            this.checkInterface('search');
            return await this.invokeServiceInterface('search', [this.getLoggedUser(req), query]);
        }
    }

}
