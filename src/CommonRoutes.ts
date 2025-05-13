import {Express, Router} from "express";
import CommonRouterHelper from "./CommonRouterHelper";
import log4js, {Logger} from "log4js";

export default abstract class CommonRoutes {

    readonly router: Router;
    protected helper: CommonRouterHelper;
    protected logger: Logger;
    protected constructor(helper: CommonRouterHelper, checkUser: boolean = true) {
        this.router = Router();
        this.helper = helper;
        this.logger = log4js.getLogger(this.constructor.name);
        if (checkUser) {
            this.logger.debug('检查用户是否登录')
            this.router.use(helper.checkLoggedUser());
        }
    }

    bindRouter(app: Express, path: string) {
        app.use(path, this.router);
    }
}