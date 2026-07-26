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

/**
 * Registry interface for server-wide custom user model.
 * Applications can extend this interface via module augmentation:
 *
 * ```typescript
 * declare module '@ticatec/common-express-server' {
 *     interface CustomUserRegistry {
 *         user: MyCustomAppUser;
 *     }
 * }
 * ```
 */
export interface CustomUserRegistry {
    // Extensible by application via declaration merging
}

/**
 * Resolved server-wide logged in user type.
 * Automatically resolves to CustomUserRegistry['user'] if defined, otherwise falls back to LoggedUser.
 */
export type RegisteredUser = CustomUserRegistry extends { user: infer U }
    ? (U extends CommonUser ? U : LoggedUser)
    : LoggedUser;