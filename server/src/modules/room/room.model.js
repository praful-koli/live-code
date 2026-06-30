import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    roomName: {
      type: String,
      default: "Untitled Room",
      trim: true,
    },

    hostNmae: {
      type: String,
    },

    hostParticipantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Participant",
      default: null,
    },

    isClosed: {
      type: Boolean,
      default: false,
    },

    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Room", roomSchema);
