const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const CORS = require("../middleware/cors.js");
const Post = require("../models/postModels.js");
const authenticateToken = require("../middleware/authenticateToken.js");

const userRouter = express.Router();

// CORS middleware
userRouter.use(CORS);

userRouter.delete('/logout', authenticateToken, expressAsyncHandler(async(request, response)=>{
  response.status(200).clearCookie('token').send('cookies cleared');
}))

userRouter.get('/selectedProfile', authenticateToken,expressAsyncHandler(async(request, response)=>{
  const selectedProfile = request.query.selectedProfile;
  try{
    const selectedUser = await User.findOne({email:selectedProfile});
    const posts = selectedUser.posted;
    let selectedUserPosts = []
    for(const postID of posts){
      const post = await Post.findOne({_id:postID});
      if(post) selectedUserPosts.push(post);
    }

    response.status(200).send({selectedUserData:selectedUser, posts:selectedUserPosts});
  }catch(error){
    response.status(500).send({message:"Internal server error!"})
  }
}))

userRouter.put('/password', authenticateToken,expressAsyncHandler(async(request, response)=>{
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
  authenticateToken,
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
