import express from "express";
import ApiError from "../../shared/error/ApiError.js";
import ApiResponse from "../../shared/utils/ApiResponse.js";

const route = express.Router();

route.get("/", (req, res, next) => {
  let num = 17;
  if (num > 10) {
    return next(ApiError.notFound("Resource not found"));
  }

  return res.status(201).json(
    ApiResponse.created(
      { username: "praful", age: 12, sex: "male" },
      "User created successfully"
    )
  );
});

export default route;
