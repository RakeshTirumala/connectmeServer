const express = require('express')
const expressAsyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const CORS = require('../middleware/cors.js');


const profileRouter = express.Router();

profileRouter.use(CORS);

profileRouter.put('/', expressAsyncHandler(async(request, response)=>{
    const email = request.body.email;
    const fn = request.body.fn;
    const ln = request.body.ln;
    const mobile = request.body.mobile;
    const education = JSON.parse(request.body.education);
    const experience = JSON.parse(request.body.experience);
    const projects = JSON.parse(request.body.projects);
    const interests = JSON.parse(request.body.interests);
    const newUser = request.body.newUser;
    const userType = request.body.userType;
    const dp = request.body.dp;
    try{
        const updatedUser = await User.findOneAndUpdate(
            {email:email},
            {
                $set:{
                    firstName:fn,
                    lastName:ln,
                    mobile:mobile, 
                    Education:education,
                    WorkExperience:experience,
                    Projects:projects,
                    Interests:interests,
                    newUser:newUser,
                    userType:userType,
                    dp:dp
                }
            },
            {new:true}
        );
        response.status(200).json({ message: "User profile updated successfully", user:updatedUser})
    }catch(error){
        response.status(500).json({ message: "Internal server error", error: error.message });
    }
}))

module.exports = profileRouter;