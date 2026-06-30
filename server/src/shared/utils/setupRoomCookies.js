export const setupRoomCookies = (res, { participantId, hostKey, roomCode }) => {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:30 * 24 * 60 * 60 * 1000,
  };

  res.cookie("participantId", participantId.toString(), options);
  res.cookie("hostKey", hostKey, options);
  res.cookie("roomCode", roomCode, options);
};