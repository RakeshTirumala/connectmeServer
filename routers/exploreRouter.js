const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const CORS = require("../middleware/cors.js");
const Post = require("../models/postModels.js");

const exploreRouter = express.Router();

exploreRouter.use(CORS);


//  UPDATING LIKES ARRAY OF THE POST
exploreRouter.put('/postActivity', expressAsyncHandler(async(request, response)=>{
    const {currentUser, postId, shouldIAddUserLike} = request.body;
    let updated = null;
    try{
        if(shouldIAddUserLike){
            updated = await Post.findOneAndUpdate(
                {_id:postId},
                {$push:{likes:currentUser}},
                {new:true}
            )
        }else{
            updated = await Post.findOneAndUpdate(
                {_id:postId},
                {$pull:{likes:currentUser}},
                {new:true}
            )
        }
        if(updated) response.status(200).send({message:"Success!!!"})
    }catch(error){
        response.status(500).send({message:"Internal error!!!"})
    }
}))

// INSERTING A POST TO THE POST SCHEMA
exploreRouter.post('/', expressAsyncHandler(async (request, response) => {
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
exploreRouter.get('/', expressAsyncHandler(async(request, response)=>{
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
            feedPostIds.push(connection.liked[connection.liked.length-1]);
            // ADDING THE LATEST POSTED COMMENTED BY THE CONNECTION
            feedPostIds.push(connection.commented[connection.commented.length-1]);
            // ADDING THE LATEST POST BY THE CONNECTION
            feedPostIds.push(connection.posted[connection.posted.length-1]);
        }
        console.log("done with //FETCHING THE ACTIVITY OF CURRENT USER'S CONNECTIONS")

        // FETCHING THE LATEST POST LIKED, COMMENTED, POSTED BY THE CURRENT USER

        feedPostIds.push(user.liked[user.liked.length-1])
        feedPostIds.push(user.commented[user.commented.length-1])
        feedPostIds.push(user.posted[user.posted.length-1])

        feedPostIds = [...new Set(feedPostIds)];

        let feed = [];
        for(const feedId of feedPostIds){
            // FETCHING THE POST BY ID
            const post = await Post.findOne({_id:feedId});
            // FETCH THE USER WHO CREATED THE POST
            if(post){
                const postUser = await User.findOne({email:post.postedBy})
                // ARRANGING / FORMATTING THE POSTDATA
                // console.log(post.likes, user)
                const currentUserLiked = post.likes.includes(currentUser);
                const connectionsLiked = connectionsOfCurrentUser.filter(value=>post.likes.includes(value)); 
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
                    connectionsLiked:connectionsLiked.length
                }
                feed.push(postData);
            } 
        }
        feed.sort((a, b) => new Date(b.timeOfCreation) - new Date(a.timeOfCreation));
        console.log("done with // ARRANGING / FORMATTING THE POSTDATA")
        response.status(200).send({feed:feed});
    }catch(error){
        response.status(500).send({message:"Internal Error", error});
    }
}))

module.exports = exploreRouter;
