import 'express-session'

declare module 'express-session' { interface SessionData {uid?: string;state?:string}}
declare global { namespace Express {interface Request {user:{id:string;name:string;admin:boolean; staff:boolean
}|null}}}
export {};