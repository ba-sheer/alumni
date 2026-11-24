import type { RequestHandler } from "express";
import helmet from "helmet";
import { config } from "../config/env.ts";
import { originAllowed } from "./origin.ts"
const SAFE = new Set(['GET','HEAD','OPTIONS']);

export const csrfGuard: RequestHandler = (req,res,next)=>{
    if(SAFE.has(req.method))return next();
    if(originAllowed(req.get('origin'),req.get('referer'),config.allowedOrigins)) return next();
    res.status(403).type('text').send('Cross-site request blocked.');
};
const IMG =["'self'",'data:','https://avatars.slack-edge.com','https://secure.gravatar.com'];
