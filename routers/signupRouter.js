const express = require('express')
const expressAsyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const CORS = require('../middleware/cors.js');

const signupRouter = express.Router()

// CORS middleware
signupRouter.use(CORS);

signupRouter.post('/', expressAsyncHandler(async(request, response)=>{
    const email = request.body.email;
    const password = await bcrypt.hash(request.body.password, 10);
    try{
        const existingUser = await User.findOne({email})
        if(existingUser) return response.status(400).json({ error: 'Email already exists', user: existingUser});
        const firstName=""
        const lastName = ""
        const mobile = ""
        const newUser = true
        const education = []
        const workExperience = []
        const connections = []
        const projects=[]
        const posts = []
        const interests = []
        const userType = "Student"
        
        const newConnectMeUser = new User({
            firstName, 
            lastName, 
            email, 
            password,
            mobile,
            newUser,
            education,
            workExperience,
            connections,
            projects,
            posts,
            liked:[],
            commented:[],
            posted:[],
            interests,
            userType
        })
        console.log(newConnectMeUser)
        const saved = await newConnectMeUser.save();
        // response.status(201)
        response.sendStatus(201)
    }catch(error){
        console.log(error)
        response.status(500).json({error:'Internal Error!'});
    }
}))

module.exports = signupRouter   