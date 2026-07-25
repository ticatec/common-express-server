import {Request} from "express";
import AdminBaseController from "./AdminBaseController.js";
import Controller from "./Controller.js";

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
        return (req: Request) => {
            const query = req.query;
            Controller.debugEnabled && this.logger.debug({ query }, `Path: ${req.path}, query by criteria`);
            this.checkInterface('search');
            return this.invokeServiceInterface('search', [query]);
        };
    }
}
