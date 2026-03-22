import {clearInterval} from "node:timers";
import log4js from "log4js";

export enum ProcessStatus {
    Napping,
    Running = 1
}

export default abstract class CommonProcessor<T> {

    protected logger = log4js.getLogger(this.constructor.name);
    protected interval: number;
    protected processInterval: any;
    private nappingDuration!: number;
    private status: ProcessStatus;
    private readonly ants: number;

    /**
     * 构造函数
     * @param interval 检查间隔
     * @param ants 工蚁数量，可以同步执行的线程数量
     * @protected
     */
    protected constructor(interval: number, ants: number = 5) {
        this.interval = Math.max(Math.round(interval), 5);
        this.ants = ants;
        this.nappingDuration = 0;
    }

    /**
     * 启动
     */
    startup() {
        if (!this.processInterval) {
            this.logger.debug('启动处理器');
            this.nappingDuration = this.interval;
            this.status = ProcessStatus.Napping;
            this.processInterval = setInterval(this.checkNap(), 1000);
        }
    }

    /**
     * 停止
     */
    stop() {
        if (this.processInterval) {
            this.logger.debug('停止处理器');
            clearInterval(this.processInterval);
            this.processInterval = null;
        }
    }

    private checkNap() {
        return async () => {
            this.nappingDuration++;
            if (this.nappingDuration >= this.interval && this.status == ProcessStatus.Napping) {
                this.status = ProcessStatus.Running;
                try {
                    await this.startProcess();
                } finally {
                    this.status = ProcessStatus.Napping;
                }
            }
        }
    }


    /**
     * 开始处理数据
     * @protected
     */
    protected async startProcess(): Promise<void> {
        let arr = await this.loadToProcessData();
        if (arr.length > 0) {
            this.logger.debug('有待处理的数据，开始处理数据');
            const pool = new Set<Promise<void>>();
            for (const item of arr) {
                const task = this.processItem(item)
                    .catch((ex) => {
                        this.logger.error(`执行任务 [${item}] 发生错误：`, ex);
                    })
                    .finally(() => {
                        pool.delete(task);
                    });
                pool.add(task);
                if (pool.size >= this.ants) {
                    await Promise.race(pool);
                }
            }
            await Promise.all(pool);
        } else {
            this.nappingDuration = 0;
        }
    }

    /**
     * 读取待处理的数据
     * @protected
     */
    protected abstract loadToProcessData(): Promise<Array<T>>;


    /**
     * 立即执行
     */
    runImmediately() {
        this.logger.debug('立即执行');
        this.nappingDuration = this.interval;
    }

    /**
     * 处理单条数据
     * @protected
     * @param item
     */
    protected abstract processItem(item: T): Promise<void>;
}