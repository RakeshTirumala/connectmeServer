const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const CORS = require("../middleware/cors.js");

const userRouter = express.Router();

// CORS middleware
userRouter.use(CORS);

userRouter.get('/selectedProfile', expressAsyncHandler(async(request, response)=>{
  const selectedProfile = request.query.selectedProfile;
  try{
    const selectedUser = await User.findOne({email:selectedProfile});
    response.status(200).send({selectedUserData:selectedUser});
  }catch(error){
    response.status(500).send({message:"Internal server error!"})
  }
}))

userRouter.put('/password', expressAsyncHandler(async(request, response)=>{
  const newPassword = request.body.newPassword;
  const currentUser = request.body.currentUser;
  const encryptedPassword = await bcrypt.hash(newPassword, 10);
  try{
    await User.findOneAndUpdate(
      {email:currentUser},
      {$set:{password:encryptedPassword}}
    )
    response.status(200).send({message:"Success!!!"});
  }catch(error){
    response.status(500).send({message:"Internal error!!!"});
  }
}))
 
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
