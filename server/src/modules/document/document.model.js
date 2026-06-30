import mongoose from "mongoose";

const operationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["insert", "delete"],
      required: true,
    },

    position: {
      type: Number,
      required: true,
      min: 0,
    },

    text: {
      type: String,
      default: "",
    },

    length: {
      type: Number,
      default: 0,
    },

    version: {
      type: Number,
      required: true,
    },

    participantId: {
      type: String,
      required: true,
    },

    participantName: {
      type: String,
      default: "Unknown",
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      unique: true,
      index: true,
    },

    content: {
      type: String,
      default: "",
    },

    version: {
      type: Number,
      default: 0,
      min: 0,
    },

    operationLog: {
      type: [operationSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Cap the operation log at 100 entries to prevent unbounded growth
documentSchema.methods.trimOperationLog = function (keepCount = 100) {
  if (this.operationLog.length > keepCount) {
    this.operationLog = this.operationLog.slice(-keepCount);
  }
};

export default mongoose.model("Document", documentSchema);
