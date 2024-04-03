const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const CORS = require("../middleware/cors.js");

const userRouter = express.Router();

// CORS middleware
userRouter.use(CORS);

userRouter.get(
  "/getUserConnections",
  expressAsyncHandler(async (request, response) => {
    const email = request.query.email;
    try {
      const existingUser = await User.findOne({ email });
      const user = {
        email: existingUser.email,
        connections: existingUser.Connections,
        requests: existingUser.Requests,
      };
      //RESPONSE

      response.status(200).json({ message: "Login successful!", user: user });
    } catch (error) {
      console.log(error);
      response.status(500).json({ error: "Internal Error!" });
    }
  })
);

module.exports = userRouter;
