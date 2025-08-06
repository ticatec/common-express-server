/**
 * Common user interface representing basic user information
 */
export interface CommonUser {
    /**
     * Account code
     */
    accountCode: string;
    /**
     * User name
     */
    name: string;

    /**
     * Additional properties
     */
    [key: string]: any;
    /**
     * Tenant information
     */
    tenant: {
        code: string,
        name: string,
    }
}

/**
 * Interface for currently logged in user
 */
export default interface LoggedUser extends CommonUser {

    /**
     * User being acted as (for user impersonation)
     */
    actAs?: CommonUser;
}