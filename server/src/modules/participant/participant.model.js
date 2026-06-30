import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    socketId: {
      type: String,
      default: null,
    },

    isHost: {
      type: Boolean,
      default: false,
    },

    hostKey: {
      type: String,
      default: null,
      select: false,
    },

    isOnline: {
      type: Boolean,
      default: true,
    },

    isRemoved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Participant", participantSchema);