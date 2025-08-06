import {Request} from "express";
import AdminBaseController from "./AdminBaseController";
import BaseController from "./BaseController";


/**
 * Base class for tenant-independent search interfaces for platform admin
 * @template T The service type this controller depends on
 */
export default abstract class AdminSearchController<T> extends AdminBaseController<T> {

    /**
     * Search method for querying entities
     * @returns Function that handles search requests
     */
    search() {
        return (req:Request) => {
            let query = req.query;
            BaseController.debugEnabled && this.logger.debug(`Path: ${req.path}, query by criteria:`, query);
            return this.invokeServiceInterface('search', [query]);
        }
    }
}
