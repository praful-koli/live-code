import participantRepository from "../modules/participant/participant.repository.js";
import ApiError from "../shared/error/ApiError.js";
export const checkHost = async (req, res, next) => {
  try {
    const participantId = req.headers["x-participant-id"] || req.cookies.participantId || req.body.participantId || req.query.participantId;
    const hostKey = req.headers["x-host-key"] || req.cookies.hostKey || req.body.hostKey || req.query.hostKey;

    if (!participantId || !hostKey) {
      return res.status(401).json({
        success: false,
        message: "Host authentication required",
      });
    }

    const participant =
      await participantRepository.findByIdWithHostKey(participantId);

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Participant not found",
      });
    }

    if (!participant.isHost) {
      return res.status(403).json({
        success: false,
        message: "Only host can perform this action",
      });
    }

    if (participant.hostKey !== hostKey) {
      return res.status(403).json({
        success: false,
        message: "Invalid host key",
      });
    }

    req.hostParticipant   = participant;
    next();
  } catch (error) {
    next(error);
  }
};
