const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
    postedBy : {type:String, required:true},
    likes: [],
    comments: [],
    postData:{type:String, required:true},
},{
    timestamps:true,
}
)

const Post = mongoose.model('Post', postSchema)

module.exports = Post;