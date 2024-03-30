const express = require('express');
const expressAsyncHandler = require('express-async-handler')
const Chat = require('../models/chatModel');
const authenticateToken = require('../middleware/authenticateToken');
const CORS = require('../middleware/cors');

const chatRouter = express.Router();


// CORS middleware
chatRouter.use(CORS);


chatRouter.get('/byuserId', async(request, response)=>{
    try{
        const id = request.query.id
        const conversation = await Chat.find({
            $or:[
                {senderId:{$in:id}},
                {receiverId:{$in:id}}
            ]
        })
        response.send({id:conversation})
    }catch(error){
        console.error(error);
        response.status(500).send('Internal Server Error');
    }
})


chatRouter.get('/', async(request, response)=>{
    try {
        const connections = JSON.parse(request.query.connections);
        console.log("connections:",connections)
        const connectionIds = connections.map(connection => connection.id); 

        const chats = await Chat.find({
            $or: [
                { senderId: { $in: connectionIds } },
                { receiverId: { $in: connectionIds } }
            ]
        });

        const chatsMap = {};
        connectionIds.forEach(connectionId => {
            chatsMap[connectionId] = chats.filter(chat =>
                chat.senderId === connectionId || chat.receiverId === connectionId
            );
        });
        
        response.send({data:chatsMap});
    } catch (error) {
        console.error(error);
        response.status(500).send('Internal Server Error');
    }

})


module.exports = chatRouter;

