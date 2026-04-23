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
     * Tenant information (optional, may not be present for platform admins)
     */
    tenant?: {
        code: string,
        name: string,
    }
}

/**
 * Interface for currently logged in user
 */
export default interface LoggedUser extends CommonUser {

    /**
     * Whether the user is a platform administrator
     */
    isPlatform?: boolean;

    /**
     * User being acted as (for user impersonation)
     */
    actAs?: CommonUser;
}