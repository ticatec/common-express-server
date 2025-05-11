export interface CommonUser {
    /**
     *
     */
    id: string;
    /**
     *  编码
     */
    code: string;
    /**
     * 姓名
     */
    name: string;
    /**
     * 部门
     */
    dept: {
        id: string;
        name: string;
    },
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