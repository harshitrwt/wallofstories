const rateLimitStore = new Map();

export function rateLimit(key: string, limit: number, windowMs: number){
    const now = Date.now();
    const entry = rateLimitStore.get(key) || { count: 0, last: now };
    if(now - entry.last > windowMs){
        entry.count = 1;
        entry.last = now;
    }else{
        entry.count += 1;
    }
    rateLimitStore.set(key, entry);
    return entry.count > limit;
}