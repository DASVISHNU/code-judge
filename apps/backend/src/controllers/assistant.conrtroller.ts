import type {Response} from "express";
import { Prisma } from "../../../../packages/db/generated/prisma/client";
import { generateReview } from "../lib/generateReview";
import type { AuthRequest } from "../middleware/auth.middleware";
import { prisma } from "db";

export async function reviewSubmission(req:AuthRequest,res:Response) {

    const submission =await prisma.submission.findUnique({
        where :{id:req.params.id as string},


    });

    if(!submission)
    {
        return res.status(404).json({error:"submission not found"});

    }
    if(submission.userId!==req.userId)
    {
        return res.status(403).json({error:"Not your submission"});
    }
    const review=await generateReview(submission.code,submission.language,submission.output);

    await prisma.submission.update({
        where:{id:submission.id},
        data:{aiReview:review},
    });

    res.json({review})

}