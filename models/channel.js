const mongoose = require("mongoose")

const channelSchema = new mongoose.Schema({

    id:{
        type:String,
        required: true,
        trim: true,
    },

    name:{
        type:String,
        required: true,
        trim: true
    },

    password:{
        type:String,
        required:true,
        trim:true
    },

    email:{
        type:String,
        required:true,
        trim: true
    },

    userType:{
        type:String,
        require: true,
        trim: true,
    }
});

const ChannelModel = mongoose.model("teachers",channelSchema)

module.exports = ChannelModel