import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lawyer",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ["friend_accept", "document_shared"],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    isRead: {
      type: Boolean,
      default: false
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lawyer",
      default: null
    },

    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      default: null
    },

    meta: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
);

export default mongoose.model("Notification", NotificationSchema);