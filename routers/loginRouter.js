const express = require('express')
const expressAsyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const CORS = require('../middleware/cors.js');
const Post = require('../models/postModels.js');


const loginRouter = express.Router();

// CORS middleware
loginRouter.use(CORS);

loginRouter.post('/', expressAsyncHandler(async(request, response)=>{
    const email = request.body.email;
    const password = request.body.password;
    try{
    
        //VALIDATING EMAIL AND PASSWORD
        console.log("VALIDATING EMAIL AND PASSWORD")
        const existingUser = await User.findOne({email:email});
        console.log("CHECK COMPLETE")
        if(!existingUser) return response.status(401).json({error:"Invalid email or password!"});
        console.log("FOUND USER")
        const passwordMatch = await bcrypt.compare(password, existingUser.password);
    
        if(!passwordMatch) return response.status(401).json({error:"Invalid email or password!"});
        console.log("PASSWORDS MATCHED!")
        //GENERATE TOKEN 
        console.log("GENERATE TOKEN")
        const token = jwt.sign({ email: email}, process.env.JWT_SECRET_KEY);

        // PROCESSING USER LIKED POSTS 
        console.log("PROCESSING USER LIKED POSTS ")
        let liked = []
        for(const likedPost of existingUser.liked){
            const post = await Post.findOne({_id:likedPost});
            liked = [...liked, post];
        }
        liked.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // PROCESSING USER COMMENTED POSTS
        console.log("PROCESSING USER COMMENTED POSTS")
        let commented = []
        for(const commentedPost of existingUser.commented){
            const post = await Post.findOne({_id:commentedPost});
            commented = [...commented, post];
        }
        commented.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        // PROCESSING USER POSTS
        console.log("PROCESSING USER POSTS")
        let posts = []
        for(const userPost of existingUser.posted){
            const post = await Post.findOne({_id:userPost});
            posts = [...posts, post];
        }
        posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const user = {
            email:existingUser.email,
            firstName:existingUser.firstName,
            lastName:existingUser.lastName,
            mobile:existingUser.mobile,
            newUser:existingUser.newUser,
            education:existingUser.Education,
            workExperience:existingUser.WorkExperience,
            connections:existingUser.Connections,
            interests:existingUser.Interests,
            userType:existingUser.userType,
            projects:existingUser.Projects,
            dp:existingUser.dp,
            liked:liked,
            commented:commented,
            posts:posts
        }
        //RESPONSE
        response
        .cookie('token', token,
        {httpOnly:true,
        sameSite:'strict',
        secure:true})

        console.log("the user we are sending", user, new Date())
        
        response.status(200).json({ message: 'Login successful!', token:token, user:user});
        
    }catch(error){
        console.log(error)
        response
        .status(500).json({error:'Internal Error!'});
    }
}))


module.exports = loginRouter