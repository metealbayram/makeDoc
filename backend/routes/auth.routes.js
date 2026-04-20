import { Router } from "express";
import {
  signUp,
  signIn,
  signOut,
  verifyLoginCode,
  resendLoginCode
} from '../controller/auth.controller.js';
import upload from '../middlewares/upload.middleware.js';
import { signInLimiter, verifyCodeLimiter } from '../middlewares/rateLimit.middleware.js';
const authRouter = Router();
authRouter.post("/sign-up", upload.single('profileImage'), signUp);
authRouter.post("/sign-in", signInLimiter, signIn);
authRouter.post("/verify-login-code", verifyCodeLimiter, verifyLoginCode);
authRouter.post("/resend-login-code", signInLimiter, resendLoginCode);
authRouter.post("/sign-out", signOut);

export default authRouter;