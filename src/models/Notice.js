import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    noticeId: {
      type: Number,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    contents: {
      type: String,
      required: true,
    },
    readCount: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    showOnTop: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Notice = mongoose.model("Notice", schema, "notice");

export default Notice;
