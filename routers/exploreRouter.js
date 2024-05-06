const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const CORS = require("../middleware/cors.js");
const Post = require("../models/postModels.js");
const authenticateToken = require("../middleware/authenticateToken.js");

const exploreRouter = express.Router();

// exploreRouter.use(CORS);

// FETCHING LIKES OF A POST
exploreRouter.get('/postActivity/likes', authenticateToken,expressAsyncHandler(async(request, response)=>{
    const postId = request.query.postId;
    try{
        const post = await Post.findOne({_id:postId})
        const likes = post.likes;
        let likedUsers = [];
        for(const id of likes){
            const user = await User.findOne({email:id}).select("firstName lastName dp email");
            likedUsers.push(user);
        }
        response.status(200).send({likedUsers:likedUsers});
    }catch(error){
        response.status(500).send({message:"Internal Error!!!"});
    }
}))

// FETCHING COMMENTS OF A POST
exploreRouter.get('/postActivity/comments', authenticateToken,expressAsyncHandler(async(request, response)=>{
    const postId = request.query.postId;
    console.log(postId)
    try{
        const post = await Post.findOne({_id:postId})
        // console.log(post)
        const comments = post.comments;
        let commentedUsers = [];
        for(const commentData of comments){
            const user = await User.findOne({email:commentData.userId}).select("firstName lastName dp email");
            // console.log(user.firstName)
            const data = {
                firstName:user.firstName,
                lastName:user.lastName,
                dp:user.dp,
                email:user.email,
                data:commentData.data
            }
            commentedUsers.push(data);
        }
        response.status(200).send({commentedUsers:commentedUsers});
    }catch(error){
        response.status(500).send({message:"Internal Error!!!"});
    }
}))

// UPDATING COMMENTS ARRAY OF THE POST 
exploreRouter.put('/postActivityComments', authenticateToken,expressAsyncHandler(async(request, response)=>{
    const {currentUser, postId, commentData} = request.body;
    let updated = null;
    try{
        updated = await Post.findOneAndUpdate(
            {_id:postId},
            {$push:{comments:commentData}},
            {new:true}
        )
        if(updated){
            updated = await User.findOneAndUpdate(
                {email:currentUser},
                {$push:{commented:postId}},
                {new:true}
            )
        }
        if(updated) response.status(200).send({message:"Success!!!"});
    }catch(error){
        response.status(500).send({message:"Internal Error!"})
    }
}))

//  UPDATING LIKES ARRAY OF THE POST AS WELL AS THE LIKED ARRAY OF THE USER
exploreRouter.put('/postActivity', authenticateToken,expressAsyncHandler(async(request, response)=>{
    const {currentUser, postId, shouldIAddUserLike} = request.body;
    let updated = null;
    try{
        if(shouldIAddUserLike){
            updated = await Post.findOneAndUpdate(
                {_id:postId},
                {$push:{likes:currentUser}},
                {new:true}
            )
            if(updated){
                await User.findOneAndUpdate(
                    {email:currentUser},
                    {$push:{liked:postId}},
                    {new:true}
                )
            }
        }else{
            updated = await Post.findOneAndUpdate(
                {_id:postId},
                {$pull:{likes:currentUser}},
                {new:true}
            )
            if(updated){
                await User.findOneAndUpdate(
                    {email:currentUser},
                    {$pull:{liked:updated}},
                    {new: true}
                )
            }
        }
        if(updated) response.status(200).send({message:"Success!!!"})
    }catch(error){
        response.status(500).send({message:"Internal error!!!"})
    }
}))

// INSERTING A POST TO THE POST SCHEMA
exploreRouter.post('/', authenticateToken,expressAsyncHandler(async (request, response) => {
    try {
        const currentUser = request.body.currentUser;
        const post = request.body.post; 

        const newPost = new Post({postedBy: currentUser, likes: [], comments: [], postData: post});
        const saved = await newPost.save();

        if(saved){
            const updatedUser = await User.findOneAndUpdate(
                { email: currentUser},
                { $push: { posted: saved._id } },
                { new: true }
            );            
        }
        response.status(200).send({ message: "Post created successfully!" });
    } catch (error) {
        console.error("Internal error:", error);
        response.status(500).send({ message: "Internal error!" });
    }
}));


// FEED GENERATION
exploreRouter.get('/', authenticateToken, expressAsyncHandler(async(request, response)=>{
    const currentUser = request.query.currentUser;
    try{
        //FETCHING THE CONNECTIONS OF THE CURRENT USER
        const user = await User.findOne({email:currentUser});
        
        const connectionsOfCurrentUser = user.Connections;
        console.log("done with //FETCHING THE CONNECTIONS OF THE CURRENT USER")

        //FETCHING THE ACTIVITY OF CURRENT USER'S CONNECTIONS
        let feedPostIds = [];
        for (const connectionEmail of connectionsOfCurrentUser) {
            const connection = await User.findOne({ email: connectionEmail });
            // ADDING THE LATEST POST LIKED BY THE CONNECTION 
            feedPostIds = [...feedPostIds, connection.liked[connection.liked.length-1]]
            // ADDING THE LATEST POSTED COMMENTED BY THE CONNECTION
            feedPostIds = [...feedPostIds, connection.commented[connection.commented.length-1]]
            // ADDING THE LATEST POST BY THE CONNECTION
            feedPostIds.push(connection.posted[connection.posted.length-1]);
        }
        console.log("done with //FETCHING THE ACTIVITY OF CURRENT USER'S CONNECTIONS")

        // FETCHING THE LATEST POST LIKED, COMMENTED, POSTED BY THE CURRENT USER
        feedPostIds = [...feedPostIds, ...user.liked]
        feedPostIds = [...feedPostIds, ...user.commented]
        feedPostIds.push(user.posted[user.posted.length-1])
        // console.log(feedPostIds)
        feedPostIds = feedPostIds.filter(val=>val!==undefined)
        const uniqueFeedPostIds = [...new Set(feedPostIds.map(id => id.toString()))];
        console.log("GENERATING FEED")
        let feed = [];
        for(const feedId of uniqueFeedPostIds){
            // FETCHING THE POST BY ID
            const post = await Post.findOne({_id:feedId});
            // FETCH THE USER WHO CREATED THE POST
            if(post){
                const postUser = await User.findOne({email:post.postedBy})
                // ARRANGING / FORMATTING THE POSTDATA
                // console.log(post.likes, user)
                const currentUserLiked = post.likes.includes(currentUser);
                const connectionsLiked = connectionsOfCurrentUser.filter(value=>post.likes.includes(value)); 
                const listOfCommenters = post.comments.map(obj=>obj.userId);
                // console.log(listOfCommenters)
                const connectionsCommented = connectionsOfCurrentUser.filter(value=>listOfCommenters.includes(value));
                // console.log(post.postData,connectionsCommented, connectionsCommented.length)
                const postData = {
                    id:post._id,
                    postData:post.postData,
                    likes:post.likes.length,
                    comments:post.comments.length,
                    fullNameOfPoster: `${postUser.firstName} ${postUser.lastName}`,
                    email:postUser.email,
                    dp:postUser.dp,
                    timeOfCreation:post.createdAt,
                    currentUserLiked:currentUserLiked,
                    connectionsLiked:connectionsLiked.length,
                    connectionsCommented:connectionsCommented.length
                }
                // console.log(postData)
                feed.push(postData);
            } 
        }
        feed.sort((a, b) => new Date(b.timeOfCreation) - new Date(a.timeOfCreation));
        console.log("done with // ARRANGING / FORMATTING THE POSTDATA")
        response.status(200).send({feed:feed, feedPostIds:uniqueFeedPostIds});
    }catch(error){
        response.status(500).send({message:"Internal Error", error});
    }
}))

module.exports = exploreRouter;
