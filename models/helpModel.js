const mongoose = require('mongoose')

const helpSchema = mongoose.Schema({
    from:{type:String},
    subject:{type:String},
    content:{type:String}
})

const Help = mongoose.model("Help", helpSchema);
module.exports = Help;