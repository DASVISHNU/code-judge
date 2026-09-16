import type { Request,Response } from "express";

import bcrypt from "bcryptjs";

import jwt from "jsonwebtoken"

import { Prisma } from "../../../../packages/db/generated/prisma/client";

import {email, preprocess, z} from "zod";
import { password } from "bun";
import { prisma } from "db";
import { parse } from "dotenv";


const JWT_SECRET =process.env.JWT_SECRET as string;

const registerSchema=z.object({
    email:z.string().email(),
    password:z.string().min(8),
    name:z.string().optional(),
})

export const register= async (req:Request,res:Response)=>{
    const parsed=registerSchema.safeParse(req.body);
    if(!parsed.success)
    {
        return res.status(400).json({
            error:parsed.error
        })
    }

    const {email,password,name}=parsed.data;

    const existing=await prisma.user.findUnique({
        where:{email}
    });
    if(existing)
    {
        return res.status(409).json({
            error:"Email already exist"
        })
    }

    const passwordHash=await bcrypt.hash(password,10)
    const user=await prisma.user.create({
        data:{
            email,passwordHash,name
        }
    });

    const token=jwt.sign({userId:user.id},JWT_SECRET)

    res.status(201).json({token,user:{id:user.id,email:user.email}})

}

const loginSchema=z.object({
    email:z.string().email(),
    password:z.string().min(1),
});

export const login= async (req:Request,res:Response)=>{
    const parsed=loginSchema.safeParse(req.body);
    if(!parsed.success)
    {
        return res.status(400).json({
                error:parsed.error
        })

    }
    const {email,password}=parsed.data;
    const user=await prisma.user.findUnique({
        where:{email}
    });
    if(!user || !user.passwordHash)
    {
        return res.status(401).json({
            error:"Invalid error or password"
        })
    }

    const valid=await bcrypt.compare(password,user.passwordHash);
    if(!valid)
    {
        return res.status(401).json({error:"Invalid email or password"})
    }

    const token=jwt.sign({userId:user.id},JWT_SECRET)
    res.json({ token, user: { id: user.id, email: user.email } });

}
