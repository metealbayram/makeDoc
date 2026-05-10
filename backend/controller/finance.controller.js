import FinanceRecord from "../models/FinanceRecord.js";
import FinanceCategory from "../models/FinanceCategory.js";

const getLawyerId = (req) => req.lawyer?._id || req.user?._id;

export const createFinanceRecord = async (req, res) => {
  try {
    const lawyerId = getLawyerId(req);
    const { title, amount, date, type, category } = req.body;

    if (!title || amount === undefined || !date || !type || !category) {
      return res.status(400).json({ message: "Tüm alanlar zorunludur." });
    }

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({ message: "Geçersiz gelir/gider tipi." });
    }

    const record = await FinanceRecord.create({
      lawyer: lawyerId,
      title,
      amount: Number(amount),
      date,
      type,
      category,
    });

    await FinanceCategory.updateOne(
      { lawyer: lawyerId, name: category.trim() },
      { $setOnInsert: { lawyer: lawyerId, name: category.trim() } },
      { upsert: true }
    );

    return res.status(201).json(record);
  } catch (error) {
    console.error("createFinanceRecord error:", error);
    return res.status(500).json({ message: "Gelir/gider kaydı oluşturulamadı." });
  }
};

export const getFinanceRecords = async (req, res) => {
  try {
    const lawyerId = getLawyerId(req);
    const { month, year, type, category } = req.query;

    const filter = { lawyer: lawyerId };

    if (type && ["income", "expense"].includes(type)) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 1);
      filter.date = { $gte: start, $lt: end };
    }

    const records = await FinanceRecord.find(filter).sort({ date: -1, createdAt: -1 });

    return res.json(records);
  } catch (error) {
    console.error("getFinanceRecords error:", error);
    return res.status(500).json({ message: "Gelir/gider kayıtları alınamadı." });
  }
};

export const updateFinanceRecord = async (req, res) => {
  try {
    const lawyerId = getLawyerId(req);
    const { id } = req.params;
    const { title, amount, date, type, category } = req.body;

    if (type && !["income", "expense"].includes(type)) {
      return res.status(400).json({ message: "Geçersiz gelir/gider tipi." });
    }

    const updated = await FinanceRecord.findOneAndUpdate(
      { _id: id, lawyer: lawyerId },
      {
        ...(title !== undefined && { title }),
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(date !== undefined && { date }),
        ...(type !== undefined && { type }),
        ...(category !== undefined && { category }),
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Kayıt bulunamadı." });
    }

    if (category) {
      await FinanceCategory.updateOne(
        { lawyer: lawyerId, name: category.trim() },
        { $setOnInsert: { lawyer: lawyerId, name: category.trim() } },
        { upsert: true }
      );
    }

    return res.json(updated);
  } catch (error) {
    console.error("updateFinanceRecord error:", error);
    return res.status(500).json({ message: "Gelir/gider kaydı güncellenemedi." });
  }
};

export const deleteFinanceRecord = async (req, res) => {
  try {
    const lawyerId = getLawyerId(req);
    const { id } = req.params;

    const deleted = await FinanceRecord.findOneAndDelete({
      _id: id,
      lawyer: lawyerId,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Kayıt bulunamadı." });
    }

    return res.json({ message: "Kayıt silindi." });
  } catch (error) {
    console.error("deleteFinanceRecord error:", error);
    return res.status(500).json({ message: "Gelir/gider kaydı silinemedi." });
  }
};

export const getFinanceSummary = async (req, res) => {
  try {
    const lawyerId = getLawyerId(req);
    const month = Number(req.query.month);
    const year = Number(req.query.year);

    if (!month || !year) {
      return res.status(400).json({ message: "Ay ve yıl zorunludur." });
    }

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const records = await FinanceRecord.find({
      lawyer: lawyerId,
      date: { $gte: start, $lt: end },
    });

    const totalIncome = records
      .filter((r) => r.type === "income")
      .reduce((sum, r) => sum + r.amount, 0);

    const totalExpense = records
      .filter((r) => r.type === "expense")
      .reduce((sum, r) => sum + r.amount, 0);

    const categorySummary = {};

    for (const record of records) {
      if (!categorySummary[record.category]) {
        categorySummary[record.category] = {
          category: record.category,
          income: 0,
          expense: 0,
          balance: 0,
        };
      }

      if (record.type === "income") {
        categorySummary[record.category].income += record.amount;
      } else {
        categorySummary[record.category].expense += record.amount;
      }

      categorySummary[record.category].balance =
        categorySummary[record.category].income -
        categorySummary[record.category].expense;
    }

    return res.json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      comparison: Object.values(categorySummary),
    });
  } catch (error) {
    console.error("getFinanceSummary error:", error);
    return res.status(500).json({ message: "Aylık özet alınamadı." });
  }
};

export const getFinanceCategories = async (req, res) => {
  try {
    const lawyerId = getLawyerId(req);

    const categories = await FinanceCategory.find({ lawyer: lawyerId }).sort({
      name: 1,
    });

    return res.json(categories);
  } catch (error) {
    console.error("getFinanceCategories error:", error);
    return res.status(500).json({ message: "Kategoriler alınamadı." });
  }
};

export const createFinanceCategory = async (req, res) => {
  try {
    const lawyerId = getLawyerId(req);
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Kategori adı zorunludur." });
    }

    const category = await FinanceCategory.create({
      lawyer: lawyerId,
      name: name.trim(),
    });

    return res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Bu kategori zaten var." });
    }

    console.error("createFinanceCategory error:", error);
    return res.status(500).json({ message: "Kategori oluşturulamadı." });
  }
};

export const exportFinanceRecordsCsv = async (req, res) => {
  try {
    const lawyerId = getLawyerId(req);
    const { month, year } = req.query;

    const filter = { lawyer: lawyerId };

    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 1);
      filter.date = { $gte: start, $lt: end };
    }

    const records = await FinanceRecord.find(filter).sort({ date: -1 });

    const header = "Baslik,Tutar,Tarih,Tip,Kategori\n";

    const rows = records
      .map((r) => {
        const title = `"${String(r.title).replaceAll('"', '""')}"`;
        const amount = r.amount;
        const date = new Date(r.date).toISOString().slice(0, 10);
        const type = r.type === "income" ? "Gelir" : "Gider";
        const category = `"${String(r.category).replaceAll('"', '""')}"`;

        return `${title},${amount},${date},${type},${category}`;
      })
      .join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=finance-records-${year || "all"}-${month || "all"}.csv`
    );

    return res.send("\uFEFF" + header + rows);
  } catch (error) {
    console.error("exportFinanceRecordsCsv error:", error);
    return res.status(500).json({ message: "Dışa aktarma başarısız." });
  }
};