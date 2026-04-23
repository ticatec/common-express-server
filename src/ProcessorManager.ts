import CommonProcessor from "./CommonProcessor";
import log4js from "log4js";

export default class ProcessorManager {

    private static instance: ProcessorManager = new ProcessorManager();
    private map: Map<string, CommonProcessor<any>>;
    private logger = log4js.getLogger("ProcessorManager");

    private constructor() {
        this.map = new Map<string, CommonProcessor<any>>();
    }

    static getInstance() {
        return ProcessorManager.instance;
    }

    get(name: string): CommonProcessor<any> {
        return this.map.get(name);
    }

    /**
     * 组成一个处理器
     * @param Constructor
     * @param args
     */
    register(Constructor: new (name: string) => CommonProcessor<any>, args?: any): CommonProcessor<any> {
        let constructorName = Constructor.name;
        this.logger.info(`Registering processor ${constructorName}`);
        let processor = this.map.get(constructorName);
        if (!processor) {
            processor = new Constructor(args)
            this.map.set(constructorName, processor);
        }
        return processor;
    }

}