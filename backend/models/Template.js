import mongoose from "mongoose";

const templateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lawyer",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    contentHtml: {
      type: String,
      required: true,
      default: "",
    },
    sourceType: {
      type: String,
      enum: ["editor", "word"],
      default: "editor",
    },
    placeholders: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

const Template = mongoose.model("Template", templateSchema);

export default Template;
