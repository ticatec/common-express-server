export interface CommonUser {
    /**
     *  编码
     */
    accountCode: string;
    /**
     * 姓名
     */
    name: string;

    /**
     * 其他的属性
     */
    [key: string]: any;
    /**
     * 租户
     */
    tenant: {
        code: string,
        name: string,
    }
}

/**
 * 当前登陆的用户
 */
export default interface LoggedUser extends CommonUser {

    /**
     * 扮演用户
     */
    actAs?: CommonUser;
}