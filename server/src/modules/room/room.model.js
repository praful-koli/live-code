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

    hostName: {
      type: String,
      required: true,
      trim: true,
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
  { timestamps: true }
);

const Room = mongoose.model("Room", roomSchema);

export default Room;