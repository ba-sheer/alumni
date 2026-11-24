export const originAllowed =(origin:string|undefined,referer:string|undefined,allowed:readonly string[]): boolean =>{
    if(!origin && referer)return false;
    if(origin && !allowed.includes(origin))return false;
    if(referer){
        let o:string;
        try {
            o= new URL(referer).origin;
        }catch{
            return false;
        }
        if(!allowed.includes(o))return false;
    }
    return true;
};