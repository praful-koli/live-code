import Participant from "./participant.model.js";

export const createParticipantRepo = (data) => {
  return Participant.create(data);
};

export const findParticipantByIdRepo = (participantId) => {
  return Participant.findById(participantId);
};

export const getParticipantsByRoomRepo = (roomId) => {
  return Participant.find({ roomId }).select("-__v");
};

export const updateParticipantRepo = (participantId, data) => {
  return Participant.findByIdAndUpdate(participantId, data, { new: true });
};