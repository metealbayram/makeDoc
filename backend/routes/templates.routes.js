import { Router } from "express";
import multer from "multer";
import authorize from "../middlewares/auth.middleware.js";
import {
  convertWordToTemplateHtml,
  createTemplate,
  deleteTemplate,
  getTemplateById,
  getTemplates,
  updateTemplate,
} from "../controller/templates.controller.js";

const templateRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

templateRouter.use(authorize);

templateRouter.get("/", getTemplates);
templateRouter.post(
  "/convert-word",
  upload.single("file"),
  convertWordToTemplateHtml,
);
templateRouter.get("/:id", getTemplateById);
templateRouter.post("/", createTemplate);
templateRouter.put("/:id", updateTemplate);
templateRouter.delete("/:id", deleteTemplate);

export default templateRouter;
