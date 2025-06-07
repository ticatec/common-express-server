export default class AppConf {

    private readonly conf: any;
    static instance: AppConf = null;

    private constructor(conf: any) {
        this.conf = conf;
    }

    static getInstance(): AppConf {
        return AppConf.instance;
    }

    /**
     * 初始化配置表
     */
    static init(config: any): AppConf {
        console.debug('初始化配置中心', config);
        if (AppConf.instance == null) {
            AppConf.instance = new AppConf(config);
        }
        return AppConf.instance;
    }

    /**
     * 获取配置值
     * @param key
     */
    get(key: string): any {
        if (!key) return undefined;

        const keys = key.split('.');
        let result = this.conf;

        for (const k of keys) {
            if (result && typeof result === 'object' && k in result) {
                result = result[k];
            } else {
                return undefined;
            }
        }

        return result;
    }
}

