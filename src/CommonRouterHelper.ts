import {Request, Response} from "express";
import {ActionNotFoundError, handleError, UnauthenticatedError} from '@ticatec/express-exception';
import log4js from "log4js";


export type RestfulFunction = (req: any) => any;
export type ControlFunction = (req: any, res: any) => any;

export default class CommonRouterHelper {

    protected readonly logger = log4js.getLogger("CommonRouterHelper");

    /**
     * 设置Http Response的header为JSON格式
     * @param req
     * @param res
     * @param next
     */
    setJsonHeader(req: Request, res: Response, next:any): void {
        res.header('Content-Type', 'application/json');
        next();
    }


    /**
     * 设置response不使用cache
     * @param req
     * @param res
     * @param next
     * @returns {Promise<void>}
     */
    setNoCache(req: Request, res: Response, next:any): void {
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
        next();
    }

    /**
     * 调用一个restful的操作，将结果封装成json格式返回请求端
     * @param func
     */
    invokeRestfulAction(func: RestfulFunction): any {
        return async (req: Request, res: Response): Promise<void> => {
            try {
                let result = await func(req);
                if (result != null) {
                    res.json(result);
                } else {
                    res.status(204).send();
                }
            } catch (ex) {
                handleError(ex, req, res);
            }
        }
    }

    /**
     * 调用异步函数并处理返回的错误
     * @param func
     */
    invokeController(func: ControlFunction) {
        return async (req: Request, res: Response): Promise<void> => {
            try {
                await func(req, res);
            } catch (ex) {
                handleError(ex, req, res);
            }
        }
    }

    /**
     *
     */

    /**
     * 处理无效的请求路径
     */
    actionNotFound() {
        return (req:Request, res:Response, next:any) => {
            handleError(new ActionNotFoundError(), req, res);
        }
    }

    protected retrieveUserFormHeader(req: Request) {
        let userStr: string = req.headers['user'] as string;
        if (userStr != null) {
            try {
                req['user'] = JSON.parse(decodeURIComponent(userStr));
            } catch (ex) {
                this.logger.debug('无效的user头', userStr);
            }
        }
    }
    retrieveUser() {
        return (req: Request, res: Response, next:any) => {
            this.retrieveUserFormHeader(req);
            next();
        }
    }


    checkLoggedUser() {
        return (req: Request, res: Response, next:any) => {
            this.retrieveUserFormHeader(req);
            if (req['user'] == null) {
                handleError(new UnauthenticatedError(), req, res);
            } else {
                next();
            }
        }
    }

}