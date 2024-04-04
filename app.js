const express = require('express')
const mongoose = require('mongoose')
const loginRouter = require('./routers/loginRouter')
const app = express()
app.use(express.json())
require('dotenv').config();
const cors = require('cors');
const signupRouter = require('./routers/signupRouter')
const ws = require('ws')
const PORT = 1111
const jwt = require('jsonwebtoken');
const Chat = require('./models/chatModel')
const chatRouter = require('./routers/chatRouter')
const profileRouter = require('./routers/profileRouter')
const userRouter = require("./routers/userRouter");
const networkRouter = require('./routers/networkRouter')

mongoose.connect(process.env.MONGODB_CLUSTER);

app.use(cors());

app.get("/", (req,res)=>{
    console.log("Connectme...");
})
 
app.use("/api/signup", signupRouter);
app.use("/api/user", userRouter);

app.use("/api/login", loginRouter);

app.use("/api/chats", chatRouter);

app.use("/api/profile", profileRouter)

app.use("/api/network", networkRouter)

const server = app.listen(process.env.PORT || PORT);

const wss = new ws.WebSocketServer({ server });

wss.on("connection", (connection, request) => {
  console.log("WebSocket connection established");

  const token = request.url.split("?")[1].split("=")[1].split("&")[0];
  const email = request.url.split("?")[1].split("=")[2];
  // console.log("token", token)

  console.log(token);
  console.log(email);

  jwt.verify(token, process.env.JWT_SECRET_KEY, {}, (err, userData) => {
    if (err) throw err;
    console.log(userData);
    connection.id = userData.email;
    connection.token = token;
  });

  let clients = [...wss.clients];
  // console.log("No. of clients", [...wss.clients].map(c=>c.id))
  // console.log("Clients",[...wss.clients].map(c=>c.token))

  clients.forEach((client) => {
    client.send(
      JSON.stringify({
        online: [...wss.clients].map((c) => ({ id: c.id })),
      })
    );
  });

  connection.on("message", async (message) => {
    let messageData = JSON.parse(message.toString());
    console.log(messageData);
    const { senderId, receiverId, text } = messageData;
    if (senderId && receiverId && text) {
      const newChatMsg = new Chat({
        senderId: senderId,
        receiverId: receiverId,
        text: text,
      });
      await newChatMsg.save();
    }
    if (senderId && receiverId && text) {
      [...wss.clients]
        .filter((c) => c.id === receiverId)
        .forEach((c) => c.send(JSON.stringify({ senderId, receiverId, text })));
    }
  });

  connection.on("close", () => {
    console.log("WebSocket connection closed");
  });

  connection.on("error", (error) => {
    console.error("WebSocket connection error:", error);
  });
});
