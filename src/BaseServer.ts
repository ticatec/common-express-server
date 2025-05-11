import express, {Express, Request, Response} from 'express';
import CommonRouterHelper from "./CommonRouterHelper";
import {handleError} from "@ticatec/express-exception";
import fs from 'fs';


import http from "http";
import {Logger} from "log4js";
import CommonRoutes from "./CommonRoutes";


export type moduleLoader = () => Promise<any>;

export default abstract class BaseServer {

    protected logger: Logger;
    protected helper: CommonRouterHelper;
    protected contextRoot: string;

    protected constructor() {

    }

    /**
     * 获取当前服务器的RouterHelper
     * @protected
     */
    protected abstract getHelper(): CommonRouterHelper;

    /**
     * 读取配置文件
     * @protected
     */
    protected abstract loadConfigFile(): Promise<void>;

    /**
     * 写入监听端口到check.dat文件中
     * @param port
     * @param fileName
     * @protected
     */
    protected writeCheckFile(port: number, fileName: string = './check.dat') {
        try {
            this.logger.debug('端口', port);
            fs.writeFileSync(fileName, `${port}`);
        } catch (err) {
            this.logger.error('写入端口发送错误', err);
        }
    }


    async startup() {
        await this.loadConfigFile();
        try {
            this.helper = this.getHelper();
            await this.beforeStart();
            let webConf = this.getWebConf();
            this.writeCheckFile(webConf.port);
            this.contextRoot = webConf.contextRoot;
            await this.startWebServer(webConf);
        } catch (err) {
            this.logger.error('启动失败，原因：', err);
        }
    }

    /**
     * web服务器创建后的拦截函数
     * @param server
     * @protected
     */
    protected async postServerCreated(server: http.Server): Promise<void> {

    }

    protected abstract getWebConf(): any;

    /**
     * 启动前的拦截函数
     * @protected
     */
    protected async beforeStart(): Promise<void> {

    }

    protected getHealthCheckPath(): string {
        return '/health-check';
    }

    /**
     *
     * @param app
     * @protected
     */
    protected addHealthCheck(app: Express) {
        let path = this.getHealthCheckPath();
        this.logger.debug('加载系统健康检测', path)
        if (path) {
            app.get(path, (req: Request, res: Response) => {res.send('')});
        }
    }

    protected async startWebServer(webConf: any): Promise<unknown> {
        let app = express();
        app.disable("x-powered-by");
        app.use(this.helper.setNoCache);
        this.addHealthCheck(app);
        this.setupExpress(app);
        await this.bindStaticSite(app);
        await this.setupRoutes(app);
        app.use(this.helper.actionNotFound());
        app.use((err:any, req:any, res:any, next:any) => {
            this.logger.debug("系统异常", err);
            handleError(err, req, res);
        });

        return new Promise(resolve => {
            let server: http.Server = app.listen(webConf.port, webConf.ip, () => {
                this.logger.info(`Web服务启动成功，监听IP:${webConf.ip},端口:${webConf.port}`);
                this.postServerCreated(server);
                resolve(server);
            })
        })
    }

    /**
     * 绑定静态站点
     * @protected
     */
    protected async bindStaticSite(app: Express) {

    }

    /**
     * 初始化express
     * @param app
     * @protected
     */
    protected setupExpress(app: Express):void {

    }
    /**
     * 绑定一个路由
     * @param app
     * @param path
     * @param loader
     * @protected
     */
    protected async bindRoutes(app: Express, path: string, loader: moduleLoader): Promise<void> {
        let clazz: any = (await loader()).default;
        let router: CommonRoutes = new clazz(this.helper);
        router.bindRouter(app, `${this.contextRoot}${path}`);
    }

    /**
     * 设定路由
     * @protected
     */
    protected abstract setupRoutes(app: Express): Promise<void>;

    /**
     * 启动服务器
     * @param server
     */
    static startup(server: BaseServer) {
        server.startup().then(() => {

        }).catch(ex => {
            console.error('服务器启动异常', ex);
        })
    }
}
