import mongoose from 'mongoose';

const sharedUserSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lawyer',
      required: true
    },
    role: {
      type: String,
      enum: ['viewer', 'editor'],
      required: true
    }
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true,
      trim: true
    },
    content: { 
      type: String, 
      required: true,
      default: ''
    },
    name: { 
      type: String, 
      required: true,
      trim: true
    },
    path: { 
      type: String, 
      required: false 
    },

    // owner gibi kullanılacak alan
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Lawyer', 
      required: true 
    },

    status: { 
      type: String, 
      default: 'Draft', 
      enum: ['Draft', 'Approved'] 
    },

    // paylaşım listesi
    sharedWith: {
      type: [sharedUserSchema],
      default: []
    }
  },
  { timestamps: true }
);

const Document = mongoose.model('Document', documentSchema);

export default Document;