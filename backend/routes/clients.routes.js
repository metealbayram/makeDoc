import { Router } from "express";
import authorize from "../middlewares/auth.middleware.js";
import { createClient, getClients, deleteClient } from "../controller/clients.controller.js";

const clientsRouter = Router();

clientsRouter.post("/", authorize, createClient);
clientsRouter.get("/", authorize, getClients);
clientsRouter.delete("/:id", authorize, deleteClient);

export default clientsRouter;
