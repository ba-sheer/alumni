export const paginate = (total: number,requested: number,per: number)=>{
    const pages = Math.max(1,Math.ceil(total/per)),
    page = Math.min(Math.max(1,requested),pages);
    return { page,pages,offset:(page-1)*per};
};