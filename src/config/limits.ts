export const limits ={
    pageSize: 12,
    adminPageSize:25,
    maxPage:100_000,
    sessionTtlMs: 7*24*60*60*1000,
    facetsTtlMs:60_000,
    webhookMaxAgeMs:300_000,
    rate:{
        windowMs:60_000,
        web:300,
        auth:30,
        hooks:120
    }
}as const