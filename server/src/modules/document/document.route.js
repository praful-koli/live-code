import express from "express";
import documentController from "./document.controller.js";
import asyncHandler from "../../shared/utils/asyncHandler.js";

const router = express.Router();

router.get(
  "/:roomCode/document",
  asyncHandler(documentController.getDocument.bind(documentController))
);

export default router;
