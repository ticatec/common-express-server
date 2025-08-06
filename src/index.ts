
// Main entry point for @ticatec/common-express-server

// Core classes
import BaseServer from './BaseServer';

export {default as CommonRouterHelper} from './CommonRouterHelper';
export {default as CommonRoutes} from './CommonRoutes';
export {default as AppConf} from './AppConf';

// User interfaces
export { default as LoggedUser, CommonUser } from './LoggedUser';

// Controllers
export { default as BaseController } from './common/BaseController';
export { default as CommonController } from './common/CommonController';
export { default as AdminBaseController } from './common/AdminBaseController';
export { default as TenantBaseController } from './common/TenantBaseController';
export { default as AdminSearchController } from './common/AdminSearchController';
export { default as TenantSearchController } from './common/TenantSearchController';

// Types
export type { RestfulFunction, ControlFunction } from './CommonRouterHelper';
export type { moduleLoader } from './BaseServer';

export default BaseServer;