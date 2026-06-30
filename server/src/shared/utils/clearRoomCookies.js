export const clearRoomCookies = (res) => {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };

  res.clearCookie("participantId", options);
  res.clearCookie("hostKey", options);
  res.clearCookie("roomCode", options);
};