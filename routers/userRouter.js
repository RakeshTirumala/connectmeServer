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
      const connections = existingUser.Connections;
      const wholeUserOfConnections = await User.find({
        email:{$in:connections}
      }).select('firstName lastName email dp')

      response.status(200).json({ message: "Login successful!", users: wholeUserOfConnections});
    } catch (error) {
      console.log(error);
      response.status(500).json({ error: "Internal Error!" });
    }
  })
);

module.exports = userRouter;
