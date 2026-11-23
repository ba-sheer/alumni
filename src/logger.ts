import pino from 'pino';
import {config} from './config/env.ts';

export const logger = pino({
    level: config.logLevel,
    redact: {
        paths: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]', 'email','*.email', 'token', '*.token','access_token','*.access_token','client_secret','*.client_secret','secret','*.secret','answers','*.answers'],censor:'[redacted]'},
});