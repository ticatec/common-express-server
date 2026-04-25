import express, {Express, NextFunction, Request, Response} from 'express';
import RouterHelper from "./RouterHelper";
import {handleError} from "@ticatec/express-exception";
import fs from 'fs';
import http from "http";
import {Logger} from "log4js";
import log4js from "log4js";
import CommonRoutes from "./CommonRoutes";


/**
 * Function signature for module loader
 */
export type moduleLoader = () => Promise<any>;

/**
 * Abstract base server class providing common functionality for Express servers
 */
export default abstract class BaseServer {

    /** Logger instance for this server */
    protected logger: Logger;
    /** Context root path for the server */
    protected contextRoot: string;
    protected app: Express;


    /**
     * Protected constructor for base server
     * @protected
     */
    protected constructor() {
        this.logger = log4js.getLogger(this.constructor.name);
    }

    /**
     * Loads configuration file
     * @returns Promise that resolves when configuration is loaded
     * @protected
     * @abstract
     */
    protected abstract loadConfigFile(): Promise<void>;

    /**
     * Writes the listening port to check.dat file
     * @param port The port number to write
     * @param fileName The file name to write to (default: './check.dat')
     * @protected
     */
    protected writeCheckFile(port: number, fileName: string = './check.dat') {
        try {
            this.logger.debug('Port', port);
            fs.writeFileSync(fileName, `${port}`);
        } catch (err) {
            this.logger.error('Error writing port file', err);
        }
    }


    /**
     * Starts up the server
     * @returns Promise that resolves when server startup is complete
     */
    async startup() {
        this.logger.info('Starting server...');
        await this.loadConfigFile();
        try {
            await this.beforeStart();
            let webConf = this.getWebConf();
            this.logger.debug('Web configuration loaded', { port: webConf.port, ip: webConf.ip, contextRoot: webConf.contextRoot });
            this.writeCheckFile(webConf.port);
            this.contextRoot = webConf.contextRoot;
            await this.startWebServer(webConf);
        } catch (err) {
            this.logger.error('Startup failed, reason:', err);
            throw err;
        }
    }

    /**
     * Interceptor function called after web server is created
     * @param server The HTTP server instance
     * @returns Promise that resolves when post-creation setup is complete
     * @protected
     */
    protected async postServerCreated(server: http.Server): Promise<void> {

    }

    /**
     * Gets web configuration
     * @returns Web configuration object
     * @protected
     * @abstract
     */
    protected abstract getWebConf(): any;

    /**
     * Interceptor function called before startup
     * @returns Promise that resolves when pre-startup setup is complete
     * @protected
     */
    protected async beforeStart(): Promise<void> {

    }

    /**
     * Gets the health check endpoint path
     * @returns The health check path
     * @protected
     */
    protected getHealthCheckPath(): string {
        return '/health-check';
    }

    /**
     * Adds health check endpoint to the Express app
     * @protected
     */
    protected addHealthCheck() {
        let path = this.getHealthCheckPath();
        this.logger.debug('Loading system health check', path)
        if (path) {
            this.app.get(path, (req: Request, res: Response) => {
                res.send('')
            });
        }
    }

    /**
     * Starts the web server with given configuration
     * @param webConf Web server configuration
     * @returns Promise that resolves to the HTTP server instance
     * @protected
     */
    protected async startWebServer(webConf: any): Promise<unknown> {
        let app = express();
        app.disable("x-powered-by");
        app.use(RouterHelper.setNoCache);
        this.app = app;
        this.addHealthCheck();
        this.setupExpress();
        await this.bindStaticSite();
        app.use(RouterHelper.retrieveUser());
        await this.setupRoutes();
        app.use(RouterHelper.actionNotFound());
        app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            this.logger.debug("application error: ", err);
            handleError(err, req, res, next);
        });

        return new Promise(resolve => {
            let server: http.Server = app.listen(webConf.port, webConf.ip, () => {
                this.logger.info(`Web service started successfully, listening on IP: ${webConf.ip}, port: ${webConf.port}`);
                this.postServerCreated(server);
                resolve(server);
            })
        })
    }

    /**
     * Binds static site resources
     * @returns Promise that resolves when static binding is complete
     * @protected
     */
    protected async bindStaticSite() {

    }

    /**
     * Initializes Express application
     * @protected
     */
    protected setupExpress(): void {

    }

    /**
     * Binds a route to the Express application
     * @param path The route path
     * @param loader Module loader function that returns the route class
     * @returns Promise that resolves when route binding is complete
     * @protected
     */
    protected async bindRoutes(path: string, loader: moduleLoader): Promise<void> {
        let clazz: any = (await loader()).default;
        let routes: CommonRoutes = new clazz();
        await routes.bind(this.app, `${this.contextRoot}${path}`);
    }

    /**
     * Sets up routes for the application
     * @returns Promise that resolves when all routes are set up
     * @protected
     * @abstract
     */
    protected abstract setupRoutes(): Promise<void>;

    /**
     * Static method to start a server instance
     * @param server The server instance to start
     */
    static startup(server: BaseServer) {
        server.startup().then(() => {

        }).catch(ex => {
            console.error('Server startup error', ex);
        })
    }
}
