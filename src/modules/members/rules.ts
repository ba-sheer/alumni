import { string } from "zod/v4";

export type ProfileInput = { 
    bio: string;
    grad_year: string;
    currently: string;
    location: string;
    skills: string;
    github: string;
    socials: string;
    listed?: string;
    show_slack?: string;
    show_email?: string;
};
const httpUrl = (v:string): string | null =>{
    try{
        const u = new URL(v.trim());
        return /^https:$/.test(u.protocol)? u.href: null;
    }catch{
        return null;
    }
};
const clip =(v:string,n:number):string|null =>v.trim().slice(0,n)|| null;

export function normalizeProfile(i: ProfileInput){
    const g= i.github.trim().replace(/^@/,'');
    let github:string | null = null;
    if(/^[\w-]{1,39}$/.test(g)) github =`https://github.com/${g}`;
    else {const u = httpUrl(g);
        if(u&& new URL(u).hostname ==='github.com')
        github=u;
    }
    const links =  [...new Set(i.socials.split('\n').map(httpUrl).filter((u): u is string => u !== null))].slice(0,6);
    const year = parseInt(i.grad_year,10);
    const skills=[...new Set(i.skills.split(',').map(s=> s.trim().toLowerCase().slice(0,24)).filter(Boolean))].slice(0,8);
    const errors: ('grad_year'|'github')[]=[];
    if (i.grad_year.trim() && !(year >= 1990 && year <= 2100)) errors.push('grad_year');
    if (g && !github) errors.push('github');
    return { errors, bio: clip(i.bio, 600), github, socials: links.join('\n') || null, gradYear: year >= 1990 && year <= 2100 ? year : null,
        location: clip(i.location, 80), currently: clip(i.currently, 100), skills, listed: i.listed === 'on', showSlack: i.show_slack === 'on', showEmail: i.show_email === 'on' };
}