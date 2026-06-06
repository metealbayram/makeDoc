import mongoose from "mongoose";

const InvoiceSchema = new mongoose.Schema(
  {
    lawyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lawyer",
      required: true,
      index: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: false,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    invoiceDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "issued", "paid", "overdue"],
      default: "issued",
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    clientEmail: {
      type: String,
      required: false,
      trim: true,
    },
    notes: {
      type: String,
      required: false,
      trim: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Invoice", InvoiceSchema);
