import express from "express";
import {
  createFinanceRecord,
  getFinanceRecords,
  updateFinanceRecord,
  deleteFinanceRecord,
  getFinanceSummary,
  getFinanceCategories,
  createFinanceCategory,
  exportFinanceRecordsCsv,
} from "../controller/finance.controller.js";

import authorize from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authorize);

router.get("/records", getFinanceRecords);
router.post("/records", createFinanceRecord);
router.put("/records/:id", updateFinanceRecord);
router.delete("/records/:id", deleteFinanceRecord);

router.get("/summary", getFinanceSummary);

router.get("/categories", getFinanceCategories);
router.post("/categories", createFinanceCategory);

router.get("/export", exportFinanceRecordsCsv);

export default router;