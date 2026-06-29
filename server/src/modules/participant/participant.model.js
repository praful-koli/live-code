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

    isOnline: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Participant = mongoose.model("Participant", participantSchema);

export default Participant;