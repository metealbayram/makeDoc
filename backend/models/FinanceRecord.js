import mongoose from 'mongoose';

const FinanceRecordSchema = new mongoose.Schema(
  {
    lawyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer', required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    category: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('FinanceRecord', FinanceRecordSchema);