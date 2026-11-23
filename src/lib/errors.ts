import { log } from 'console';
import type {ErrorRequestHandler} from 'express';
export class HttpError extends Error {
    readonly status:number;
    constructor(status:number,message:string){
        super(message);
        this.status = status;
    }
}
const pgCode = (e:unknown):string|undefined => {
    for(let i = 0; i<4 && typeof e === 'object' && e !== null; i++){
        const{ code,cause } = e as {code?:string,cause?:unknown};
        if(typeof code === 'string' && /^[0-9A-Z]{5}/.test(code))return code;
        e = cause;
    }
    return undefined;
};

export const classify = (e:unknown):{status: number; message: string; expected: boolean } =>{
    if(e instanceof HttpError)return {status:e.status,message:e.message,expected:true};
    if(e instanceof Error &&  e.name === 'ZodError')return {status:400,message: 'Bad request.',
        expected:true
    };
    const code = pgCode(e);
    if(code == '23514')return {status:409,message: 'That change is not allowed at current state.',expected:true};
    if(code == '23505')return {status:409,message: 'That already exists.',expected:true};
    return {status:500,message: 'Something broke on our side blame shad .Try again in a minute.',expected:false};
};
type ErrorLogger =(fields: Record<string,unknown>,msg: string)=>void;

export const errorHandler = (logger:ErrorLogger,isProd:boolean,newRef:()=>string):ErrorRequestHandler => (err:unknown,req,res,next)=>{
    if(res.headersSent)return next(err);
    const {status,message,expected} = classify(err);
    if (expected) return void res.status(status).type('text').send(message);
    const ref = newRef();
    log({ ref, path: req.path, msg: err instanceof Error ? err.message : 'non-error thrown', stack: isProd ? undefined : err instanceof Error ? err.stack : undefined }, 'unhandled');
    res.status(status).type('text').send(`${message} Reference: ${ref}`);
};