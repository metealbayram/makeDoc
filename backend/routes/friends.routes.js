import { Router } from "express";
import authorize from "../middlewares/auth.middleware.js";
import { 
    sendRequest, 
    getRequests, 
    getSentRequests,
    acceptRequest, 
    rejectRequest, 
    getFriends 
} from "../controller/friends.controller.js";

const friendsRouter = Router();

friendsRouter.post("/request", authorize, sendRequest);
friendsRouter.get("/requests", authorize, getRequests);
friendsRouter.get("/requests/sent", authorize, getSentRequests);
friendsRouter.post("/accept", authorize, acceptRequest);
friendsRouter.post("/reject", authorize, rejectRequest);
friendsRouter.get("/", authorize, getFriends);

export default friendsRouter;
