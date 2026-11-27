import { createHmac,timingSafeEqual } from "node:crypto";
import { limits } from "../config/limits.ts";


type WebhookCheck = 'ok'|'stale'|'bad_signature';
export function verifyWebhook(o:{
    secret:string;
    timestamp:string;
    signature: string;
    raw:Buffer;
    nowMs?:number;
    maxAgeMs?:number;
}):WebhookCheck{
    const ts = Number(o.timestamp);
    if(!Number.isInteger(ts))return 'bad_signature';
    const expected = createHmac('sha256',o.secret).update(`${o.timestamp}.`).update(o.raw).digest();
    const given = Buffer.from(o.signature,'hex');
    if(given.length !== expected.length|| !timingSafeEqual(given,expected))return 'bad_signature';
    return Math.abs((o.nowMs ?? Date.now())-ts *1000)>(o.maxAgeMs?? limits.webhookMaxAgeMs)?'stale':'ok';
}