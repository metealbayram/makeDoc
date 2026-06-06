import FinanceRecord from "../models/FinanceRecord.js";
import FinanceCategory from "../models/FinanceCategory.js";
import Client from "../models/client.js";
import Invoice from "../models/Invoice.js";
import puppeteer from "puppeteer";

const getLawyerId = (req) => req.lawyer?._id || req.user?._id;

const buildDateFilter = ({ month, year, startDate, endDate }) => {
  if (startDate || endDate) {
    if (!startDate || !endDate) {
      return { error: "Baslangic ve bitis tarihi birlikte girilmelidir." };
    }

    const rangeStart = new Date(`${startDate}T00:00:00.000Z`);
    const rangeEnd = new Date(`${endDate}T00:00:00.000Z`);

    if (
      Number.isNaN(rangeStart.getTime()) ||
      Number.isNaN(rangeEnd.getTime())
    ) {
      return { error: "Gecersiz tarih araligi." };
    }

    if (rangeStart > rangeEnd) {
      return { error: "Baslangic tarihi bitis tarihinden sonra olamaz." };
    }

    const exclusiveEnd = new Date(rangeEnd);
    exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);

    return {
      date: { $gte: rangeStart, $lt: exclusiveEnd },
      fileLabel: `${startDate}_${endDate}`,
    };
  }

  if (month && year) {
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 1);

    return {
      date: { $gte: start, $lt: end },
      fileLabel: `${year}-${String(month).padStart(2, "0")}`,
    };
  }

  return {
    date: null,
    fileLabel: "all",
  };
};

const formatCsvDate = (value) => new Date(value).toISOString().slice(0, 10);

const formatMoney = (value) =>
  Number(value || 0).toFixed(2).replace(".", ",");

const escapeCsvCell = (value) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;

const invoiceStatuses = ["draft", "issued", "paid", "overdue"];

const generateInvoiceNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);

  return `INV-${year}${month}-${random}`;
};

const formatInvoiceDisplayDate = (value) =>
  new Date(value).toLocaleDateString("tr-TR");

const getInvoiceStatusLabel = (status) => {
  if (status === "draft") return "Taslak";
  if (status === "paid") return "Odendi";
  if (status === "overdue") return "Gecikmis";
  return "Kesildi";
};

const buildInvoicePdfHtml = (invoice) => `
  <!DOCTYPE html>
  <html lang="tr">
    <head>
      <meta charset="UTF-8" />
      <title>${invoice.invoiceNumber}</title>
      <style>
        body {
          margin: 0;
          font-family: Arial, sans-serif;
          background: #f4f7fb;
          color: #15243b;
        }
        .page {
          padding: 32px;
        }
        .sheet {
          background: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 18px 45px rgba(21, 36, 59, 0.12);
        }
        .hero {
          background: linear-gradient(135deg, #10233f 0%, #1f4b99 100%);
          color: white;
          padding: 36px 40px;
        }
        .hero h1 {
          margin: 16px 0 0;
          font-size: 32px;
          line-height: 1.2;
        }
        .hero p {
          margin: 10px 0 0;
          color: #d8e4ff;
          font-size: 14px;
        }
        .badge {
          display: inline-block;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.14);
          letter-spacing: 1px;
          font-size: 11px;
          text-transform: uppercase;
        }
        .content {
          padding: 32px 40px 36px;
        }
        .grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 20px;
          margin-bottom: 24px;
        }
        .card {
          border: 1px solid #d9e4f5;
          border-radius: 18px;
          padding: 18px 20px;
          background: #f8fbff;
        }
        .label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #5d7290;
          margin-bottom: 8px;
        }
        .value {
          font-size: 22px;
          font-weight: 700;
          color: #10233f;
        }
        .muted {
          font-size: 13px;
          color: #51657f;
          margin-top: 6px;
        }
        .meta {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .meta td {
          padding: 12px 0;
          border-bottom: 1px solid #ebf0f7;
          vertical-align: top;
        }
        .meta td:first-child {
          color: #5d7290;
          font-weight: 700;
          width: 34%;
        }
        .summary {
          border-radius: 18px;
          background: #eef4ff;
          border: 1px solid #cfe0ff;
          padding: 20px;
          margin-top: 24px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #d7e4fb;
        }
        .summary-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .summary-row span:first-child {
          color: #496381;
          font-weight: 700;
        }
        .summary-row strong {
          color: #10233f;
          font-size: 16px;
        }
        .footer-note {
          margin-top: 24px;
          padding: 18px 20px;
          border-radius: 18px;
          background: #fff8e8;
          border: 1px solid #f1ddb0;
          color: #7a5a17;
          font-size: 13px;
          line-height: 1.7;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="sheet">
          <div class="hero">
            <div class="badge">MakeDoc Invoice</div>
            <h1>Hizmet Faturasi</h1>
            <p>${invoice.invoiceNumber} numarali fatura dokumu</p>
          </div>
          <div class="content">
            <div class="grid">
              <div class="card">
                <div class="label">Muvekkil</div>
                <div class="value">${invoice.clientName}</div>
                <div class="muted">${invoice.clientEmail || "E-posta bilgisi yok"}</div>
              </div>
              <div class="card">
                <div class="label">Fatura Tutari</div>
                <div class="value">${new Intl.NumberFormat("tr-TR", {
                  style: "currency",
                  currency: "TRY",
                }).format(invoice.amount || 0)}</div>
                <div class="muted">Durum: ${getInvoiceStatusLabel(invoice.status)}</div>
              </div>
            </div>

            <table class="meta">
              <tr>
                <td>Baslik</td>
                <td>${invoice.title}</td>
              </tr>
              <tr>
                <td>Aciklama</td>
                <td>${invoice.description || "-"}</td>
              </tr>
              <tr>
                <td>Fatura Tarihi</td>
                <td>${formatInvoiceDisplayDate(invoice.invoiceDate)}</td>
              </tr>
              <tr>
                <td>Vade Tarihi</td>
                <td>${formatInvoiceDisplayDate(invoice.dueDate)}</td>
              </tr>
              <tr>
                <td>Muvekkil Telefon</td>
                <td>${invoice.client?.phone || "-"}</td>
              </tr>
              <tr>
                <td>Muvekkil TC No</td>
                <td>${invoice.client?.tcNo || "-"}</td>
              </tr>
              <tr>
                <td>Notlar</td>
                <td>${invoice.notes || "-"}</td>
              </tr>
            </table>

            <div class="summary">
              <div class="summary-row">
                <span>Hizmet Bedeli</span>
                <strong>${new Intl.NumberFormat("tr-TR", {
                  style: "currency",
                  currency: "TRY",
                }).format(invoice.amount || 0)}</strong>
              </div>
              <div class="summary-row">
                <span>Fatura Durumu</span>
                <strong>${getInvoiceStatusLabel(invoice.status)}</strong>
              </div>
            </div>

            <div class="footer-note">
              Bu belge MakeDoc tarafindan olusturulmustur. Tahsilat ve dosya takibi icin
              finans panelinden fatura durumunu guncelleyebilirsiniz.
            </div>
          </div>
        </div>
      </div>
    </body>
  </html>
`;

export const createFinanceRecord = async (req, res) => {
  try {
    const lawyerId = getLawyerId(req);
    const { title, amount, date, type, category } = req.body;

    if (!title || amount === undefined || !date || !type || !category) {
      return res.status(400).json({ message: "Tum alanlar zorunludur." });
    }

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({ message: "Gecersiz gelir/gider tipi." });
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
      { upsert: true },
    );

    return res.status(201).json(record);
  } catch (error) {
    console.error("createFinanceRecord error:", error);
    return res
      .status(500)
      .json({ message: "Gelir/gider kaydi olusturulamadi." });
  }
};

export const getFinanceRecords = async (req, res) => {
  try {
    const lawyerId = getLawyerId(req);
    const { month, year, type, category, startDate, endDate } = req.query;

    const filter = { lawyer: lawyerId };

    if (type && ["income", "expense"].includes(type)) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    const dateFilter = buildDateFilter({ month, year, startDate, endDate });
    if (dateFilter.error) {
      return res.status(400).json({ message: dateFilter.error });
    }

    if (dateFilter.date) {
      filter.date = dateFilter.date;
    }

    const records = await FinanceRecord.find(filter).sort({
      date: -1,
      createdAt: -1,
    });

    return res.json(records);
  } catch (error) {
    console.error("getFinanceRecords error:", error);
    return res
      .status(500)
      .json({ message: "Gelir/gider kayitlari alinamadi." });
  }
};

export const updateFinanceRecord = async (req, res) => {
  try {
    const lawyerId = getLawyerId(req);
    const { id } = req.params;
    const { title, amount, date, type, category } = req.body;

    if (type && !["income", "expense"].includes(type)) {
      return res.status(400).json({ message: "Gecersiz gelir/gider tipi." });
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
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ message: "Kayit bulunamadi." });
    }

    if (category) {
      await FinanceCategory.updateOne(
        { lawyer: lawyerId, name: category.trim() },
        { $setOnInsert: { lawyer: lawyerId, name: category.trim() } },
        { upsert: true },
      );
    }

    return res.json(updated);
  } catch (error) {
    console.error("updateFinanceRecord error:", error);
    return res
      .status(500)
      .json({ message: "Gelir/gider kaydi guncellenemedi." });
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
      return res.status(404).json({ message: "Kayit bulunamadi." });
    }

    return res.json({ message: "Kayit silindi." });
  } catch (error) {
    console.error("deleteFinanceRecord error:", error);
    return res
      .status(500)
      .json({ message: "Gelir/gider kaydi silinemedi." });
  }
};

export const getFinanceSummary = async (req, res) => {
  try {
    const lawyerId = getLawyerId(req);
    const { month, year, startDate, endDate } = req.query;

    if (!startDate && !endDate && (!month || !year)) {
      return res
        .status(400)
        .json({ message: "Ay-yil veya tarih araligi zorunludur." });
    }

    const dateFilter = buildDateFilter({ month, year, startDate, endDate });
    if (dateFilter.error) {
      return res.status(400).json({ message: dateFilter.error });
    }

    const records = await FinanceRecord.find({
      lawyer: lawyerId,
      ...(dateFilter.date ? { date: dateFilter.date } : {}),
    });

    const totalIncome = records
      .filter((record) => record.type === "income")
      .reduce((sum, record) => sum + record.amount, 0);

    const totalExpense = records
      .filter((record) => record.type === "expense")
      .reduce((sum, record) => sum + record.amount, 0);

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
    return res.status(500).json({ message: "Finans ozeti alinamadi." });
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
    return res.status(500).json({ message: "Kategoriler alinamadi." });
  }
};

export const createFinanceCategory = async (req, res) => {
  try {
    const lawyerId = getLawyerId(req);
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Kategori adi zorunludur." });
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
    return res.status(500).json({ message: "Kategori olusturulamadi." });
  }
};

export const createInvoice = async (req, res) => {
  try {
    const lawyerId = getLawyerId(req);
    const {
      clientId,
      title,
      description,
      amount,
      invoiceDate,
      dueDate,
      status,
      notes,
    } = req.body;

    if (!clientId || !title || amount === undefined || !invoiceDate || !dueDate) {
      return res.status(400).json({
        message: "Muvekkil, baslik, tutar, fatura tarihi ve vade tarihi zorunludur.",
      });
    }

    if (status && !invoiceStatuses.includes(status)) {
      return res.status(400).json({ message: "Gecersiz fatura durumu." });
    }

    const client = await Client.findOne({ _id: clientId, lawyer: lawyerId });
    if (!client) {
      return res.status(404).json({ message: "Muvekkil bulunamadi." });
    }

    const createdInvoice = await Invoice.create({
      lawyer: lawyerId,
      client: client._id,
      invoiceNumber: generateInvoiceNumber(),
      title,
      description,
      amount: Number(amount),
      invoiceDate,
      dueDate,
      status: status || "issued",
      clientName: client.name,
      clientEmail: client.email || "",
      notes,
    });

    const invoice = await Invoice.findById(createdInvoice._id).populate(
      "client",
      "name email phone tcNo",
    );

    return res.status(201).json(invoice);
  } catch (error) {
    console.error("createInvoice error:", error);
    return res.status(500).json({ message: "Fatura olusturulamadi." });
  }
};

export const getInvoices = async (req, res) => {
  try {
    const lawyerId = getLawyerId(req);

    const invoices = await Invoice.find({ lawyer: lawyerId })
      .populate("client", "name email phone tcNo")
      .sort({ invoiceDate: -1, createdAt: -1 });

    return res.json(invoices);
  } catch (error) {
    console.error("getInvoices error:", error);
    return res.status(500).json({ message: "Faturalar alinamadi." });
  }
};

export const updateInvoiceStatus = async (req, res) => {
  try {
    const lawyerId = getLawyerId(req);
    const { id } = req.params;
    const { status } = req.body;

    if (!invoiceStatuses.includes(status)) {
      return res.status(400).json({ message: "Gecersiz fatura durumu." });
    }

    const invoice = await Invoice.findOneAndUpdate(
      { _id: id, lawyer: lawyerId },
      { status },
      { new: true },
    ).populate("client", "name email phone tcNo");

    if (!invoice) {
      return res.status(404).json({ message: "Fatura bulunamadi." });
    }

    return res.json(invoice);
  } catch (error) {
    console.error("updateInvoiceStatus error:", error);
    return res.status(500).json({ message: "Fatura durumu guncellenemedi." });
  }
};

export const downloadInvoicePdf = async (req, res) => {
  try {
    const lawyerId = getLawyerId(req);
    const { id } = req.params;

    const invoice = await Invoice.findOne({ _id: id, lawyer: lawyerId }).populate(
      "client",
      "name email phone tcNo",
    );

    if (!invoice) {
      return res.status(404).json({ message: "Fatura bulunamadi." });
    }

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(buildInvoicePdfHtml(invoice), {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      const pdfBytes = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "14mm",
          right: "14mm",
          bottom: "14mm",
          left: "14mm",
        },
      });
      const pdfBuffer = Buffer.from(pdfBytes);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${invoice.invoiceNumber}.pdf`,
      );
      res.setHeader("Content-Length", pdfBuffer.length);

      return res.end(pdfBuffer);
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error("downloadInvoicePdf error:", error);
    return res.status(500).json({ message: "Fatura PDF olusturulamadi." });
  }
};

export const exportFinanceRecordsCsv = async (req, res) => {
  try {
    const lawyerId = getLawyerId(req);
    const { month, year, startDate, endDate } = req.query;

    const filter = { lawyer: lawyerId };
    const dateFilter = buildDateFilter({ month, year, startDate, endDate });

    if (dateFilter.error) {
      return res.status(400).json({ message: dateFilter.error });
    }

    if (dateFilter.date) {
      filter.date = dateFilter.date;
    }

    const records = await FinanceRecord.find(filter).sort({ date: -1 });
    const totalIncome = records
      .filter((record) => record.type === "income")
      .reduce((sum, record) => sum + record.amount, 0);

    const totalExpense = records
      .filter((record) => record.type === "expense")
      .reduce((sum, record) => sum + record.amount, 0);

    const netBalance = totalIncome - totalExpense;
    const periodLabel =
      startDate && endDate
        ? `${startDate} - ${endDate}`
        : month && year
          ? `${year}-${String(month).padStart(2, "0")}`
          : "Tum Kayitlar";

    const summaryRows = [
      ["MakeDoc Finans Raporu", ""],
      ["Olusturulma Tarihi", formatCsvDate(new Date().toISOString())],
      ["Rapor Donemi", periodLabel],
      ["Toplam Gelir", `${formatMoney(totalIncome)} TL`],
      ["Toplam Gider", `${formatMoney(totalExpense)} TL`],
      ["Net Durum", `${formatMoney(netBalance)} TL`],
      ["Toplam Kayit", records.length],
      ["", ""],
      [
        "Sira No",
        "Tarih",
        "Islem Tipi",
        "Baslik",
        "Kategori",
        "Gelir (TRY)",
        "Gider (TRY)",
        "Net Etki (TRY)",
      ],
    ];

    const detailRows = records.map((record, index) => {
      const isIncome = record.type === "income";
      const incomeValue = isIncome ? formatMoney(record.amount) : "";
      const expenseValue = isIncome ? "" : formatMoney(record.amount);
      const netValue = isIncome
        ? formatMoney(record.amount)
        : `-${formatMoney(record.amount)}`;

      return [
        index + 1,
        formatCsvDate(record.date),
        isIncome ? "Gelir" : "Gider",
        record.title,
        record.category,
        incomeValue,
        expenseValue,
        netValue,
      ];
    });

    const csvRows = [...summaryRows, ...detailRows]
      .map((row) => row.map((cell) => escapeCsvCell(cell)).join(";"))
      .join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=finance-records-${dateFilter.fileLabel}.csv`,
    );

    return res.send("\uFEFF" + csvRows);
  } catch (error) {
    console.error("exportFinanceRecordsCsv error:", error);
    return res.status(500).json({ message: "Disa aktarma basarisiz." });
  }
};
