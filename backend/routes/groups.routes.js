import { Router } from "express";
import authorize from "../middlewares/auth.middleware.js";
import { 
    createGroup, 
    getGroups, 
    getGroup, 
    addMember, 
    removeMember,
    deleteGroup
} from "../controller/groups.controller.js";

const groupsRouter = Router();

groupsRouter.post("/", authorize, createGroup);
groupsRouter.get("/", authorize, getGroups);
groupsRouter.get("/:id", authorize, getGroup);
groupsRouter.post("/:groupId/add-member", authorize, addMember);
groupsRouter.delete("/:groupId/remove-member/:memberId", authorize, removeMember);
groupsRouter.delete("/:id", authorize, deleteGroup);

export default groupsRouter;
