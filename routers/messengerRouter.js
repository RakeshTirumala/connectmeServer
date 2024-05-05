const express = require('express')
const expressAsyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const CORS = require('../middleware/cors.js');
const Chat = require('../models/chatModel');
const authenticateToken = require('../middleware/authenticateToken.js');

const messengerRouter = express.Router();

messengerRouter.use(CORS)

//PAST CONVERSATIONS
messengerRouter.get('/pastConversations', authenticateToken, expressAsyncHandler(async(request, response)=>{
    const currentUser = request.query.email;
    let uniqueUsersAndChatMap = new Map();
    try{
        const chats = await Chat.find({
            $or: [
                { senderId: currentUser },
                { receiverId: currentUser}
            ]
        });

        // MAP USERS WITH LATEST MESSAGE
        for(let i=0; i<chats.length;i++){
            let communicatedUser = "";
            const element = chats[i];
            if(element.senderId!==currentUser){
                communicatedUser = element.senderId;
            }else{
                communicatedUser = element.receiverId;
            }

            if(uniqueUsersAndChatMap.has(communicatedUser)){
                const ele = uniqueUsersAndChatMap.get(communicatedUser);
                if(new Date(ele.createdAt)>new Date(element.createdAt)) uniqueUsersAndChatMap.set(communicatedUser, ele);
                else uniqueUsersAndChatMap.set(communicatedUser, element);
            }else{
                uniqueUsersAndChatMap.set(communicatedUser, element);
            }
        }

        // generate returning data

        const data = Array.from(uniqueUsersAndChatMap.keys())
        let userData = [];
        for (const email of data) {
          let user = await User.findOne({ email }).select("firstName lastName email dp");
          user = { ...user.toObject(), chat: uniqueUsersAndChatMap.get(email) };
          userData.push(user);
        }

        const sortedData = userData.sort((a, b) => {
            const dateA = new Date(a.chat.createdAt);
            const dateB = new Date(b.chat.createdAt);
            return dateB - dateA;
          });

        response.status(200).send({prevConv:sortedData});
        
    } catch(error) {
        response.status(500).send({message:"Internal Error!"})
    }
}));


// CONNECTIONS
messengerRouter.get('/connections', authenticateToken,expressAsyncHandler(async(request, response)=>{
    const currentUserEmail = request.query.email;
    try{
        const user = await User.findOne({email:currentUserEmail});
        const connections = user.Connections;
        const users = await User.find({ email: { $in: connections} }, 'firstName lastName email dp');

        response.status(200).send({connections: users});
    }catch(error){
        response.status(500).send({message:"Internal server error!"});
    }
}))


module.exports = messengerRouter;