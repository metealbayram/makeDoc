import { Router } from "express";
import { signUp, signIn, signOut } from '../controller/auth.controller.js';
const authRouter = Router();

import upload from '../middlewares/upload.middleware.js';

authRouter.post("/sign-up", upload.single('profileImage'), signUp);
authRouter.post("/sign-in", signIn);
authRouter.post("/sign-out", signOut);


export default authRouter;