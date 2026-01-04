import { Router } from "express";
import authorize from "../middlewares/auth.middleware.js";
import { getUser, getUsers, updateProfileImage } from "../controller/user.controller.js";
import upload from "../middlewares/upload.middleware.js";

const userRouter = Router();

userRouter.get("/", authorize, getUsers);
userRouter.get("/:id", authorize, getUser);

userRouter.put("/profile/image", authorize, upload.single('profileImage'), updateProfileImage);

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
