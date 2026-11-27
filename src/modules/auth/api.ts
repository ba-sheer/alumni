import { eq } from "drizzle-orm";
import type { Request, RequestHandler } from "express";
import { config } from "../../config/env.ts";
import { db } from "../../db/index.ts";
import { HttpError } from "../../lib/errors.ts";
import { members } from "../../db/schema.ts";
import { resolve } from "node:path";
import { rejects } from "node:assert";

export const attachUser: RequestHandler = async (req,_res,next)=>{
    req.user = null;
    const uid = req.session.uid;
    if(!uid)return next();
    const [m] = await db.select({
        id: members.id,
        name: members.name
    }).from(members).where(eq(members.id,uid));
    if(m){
        const admin = config.adminIds.includes(m.id);
        req.user={id:m.id,
            name:m.name,
            admin,
            staff:admin || config.reviewerIds.includes(m.id)
        };
    }
    next();
};

export const currentUser = (req:Request): NonNullable<Request['user']>=>{
    if(!req.user) throw new HttpError(401,'Sign in required.');
    return req.user;
};


export const requireUser: RequestHandler = (req,res,next)=>(req.user?next(): res.redirect('auth/login'));
export const requireStaff: RequestHandler = (req,res,next)=>{
    if(!req.user)return res.redirect('auth/login');
    return req.user.staff ? next(): void res.status(403).type('text').send('Staff only');
};
export const requireAdmin: RequestHandler = (req,res,next)=>{
    if(!req.user) return res.redirect('/auth/login');
    return req.user.admin ? next(): void res.status(403).type('text').send('Admins only.');
};

export const signIn = (req: Request,uid:string): Promise<void> => new Promise((resolve,reject)=>{
    req.session.regenerate(err=>{
        if(err) return reject(err);
        req.session.uid = uid;
        req.session.save(e=>(e? reject(e):resolve()));
    });
});

export const signOut = (req: Request): Promise<void> => new Promise((resolve,reject)=>{
    req.session.destroy(e=>(e? reject(e):resolve()));
});