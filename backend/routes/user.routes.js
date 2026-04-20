import { Router } from "express";
import authorize from "../middlewares/auth.middleware.js";
import { getCurrentUser, getUser, getUsers, updateProfile, updateProfileImage } from "../controller/user.controller.js";
import upload from "../middlewares/upload.middleware.js";

const userRouter = Router();

userRouter.get("/", authorize, getUsers);
userRouter.get("/me", authorize, getCurrentUser);
userRouter.put("/profile", authorize, updateProfile);
userRouter.put("/profile/image", authorize, upload.single('profileImage'), updateProfileImage);
userRouter.get("/:id", authorize, getUser);

userRouter.post("/", authorize, (req, res) => {
    res.send({ title: "Admin created a new user" });
});

userRouter.put("/:id", authorize, (req, res) => {
    res.send({ title: "User updated" });
});

userRouter.delete("/:id", authorize, (req, res) => {
    res.send({ title: "User deleted" });
});

export default userRouter;
