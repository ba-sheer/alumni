import {z} from "zod";
const list = z.string().default('').transform(s=>s.split(',').map(x=> x.trim()).filter(Boolean));
const trustProxy = z.string().min(1)
  .refine(v => /^\d+$/.test(v) || v.split(',').every(p => /^[0-9a-fA-F:.]+(\/\d{1,3})?$/.test(p.trim())), 'must be a hop count or a list of IPs/CIDRs')
  .transform(v => (/^\d+$/.test(v) ? Number(v) : v.split(',').map(p => p.trim())));

const Env = z.object({
    NODE_ENV: z.enum(['development','test','production']).default('development'),
    PORT:z.coerce.number().int().min(1).max(65535).default(3000),
    BASE_URL:z.string().url(),TRUST_PROXY:trustProxy,
    SESSION_SECRET:z.string().min(32),DATABASE_URL:z.string().url(),
    HCA_CLIENT_ID:z.string().min(1),HCA_CLIENT_SECRET:z.string().min(1),
    FILLOUT_FORM_URL:z.string().url(),FILLOUT_WEBHOOK_SECRET:z.string().min(16),
    ADMIN_IDS: list,REVIEWER_IDS: list,
    SMTP_URL: z.string().optional(),MAIL_FROM:z.string().default('Hack Club Alumni <no-reply@hackclub.com>'),
    SLACK_BOT_TOKEN: z.string().optional(),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

const parsed = Env.safeParse(process.env);
if(!parsed.success){
  console.error(`Invalid environment: ${parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(';')}`);
  process.exit(1);
}
const e = parsed.data;
if(e.NODE_ENV === "production" && [e.SESSION_SECRET, e.FILLOUT_WEBHOOK_SECRET, e.DATABASE_URL].some(v => /change-me/i.test(v))){
  console.error('Invalid environment: replace the change-me placeholders in .env');
  process.exit(1);
}

export const config ={
  isProd: e.NODE_ENV === 'production',port: e.PORT,baseUrl:e.BASE_URL.replace(/\/$/,''),
  allowedOrigins: [new URL(e.BASE_URL).origin],
  trustProxy: e.TRUST_PROXY,sessionSecret:e.SESSION_SECRET,databaseUrl:e.DATABASE_URL,
  hca: {clientId:e.HCA_CLIENT_ID,clientSecret:e.HCA_CLIENT_SECRET,issuer:'https://auth.hackclub.com'},
  fillout: {formUrl:e.FILLOUT_FORM_URL,secret:e.FILLOUT_WEBHOOK_SECRET},
  adminIds: e.ADMIN_IDS,reviewerIds:e.REVIEWER_IDS,
  smtpUrl: e.SMTP_URL||undefined,mailFrom:e.MAIL_FROM,slackToken:e.SLACK_BOT_TOKEN||undefined,logLevel:e.LOG_LEVEL,viteDevUrl:'http://localhost:5173',}as const;
