import mongoose from 'mongoose';

const FinanceCategorySchema = new mongoose.Schema(
  {
    lawyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer', required: true, index: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

FinanceCategorySchema.index({ lawyer: 1, name: 1 }, { unique: true });

export default mongoose.model('FinanceCategory', FinanceCategorySchema);