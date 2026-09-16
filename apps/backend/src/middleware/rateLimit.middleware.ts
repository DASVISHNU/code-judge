import rateLimit from "express-rate-limit";
import type { AuthRequest } from "./auth.middleware";

export const reviewRateLimit=rateLimit({
    windowMs:60*1000,//miliseconds me hain,this is one minute
    max:5,
    keyGenerator:(req)=>(req as AuthRequest).userId ?? req.ip ?? "unknown",
    message:{error:"Too many review requests.please wait a miniute and try again."},

})