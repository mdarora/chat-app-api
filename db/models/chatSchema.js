const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    member1: {
        name:{
            type: String,
            required: true
        },
        id:{
            type: String,
            required: true
        }
    },
    member2: {
        name:{
            type: String,
            required: true
        },
        id:{
            type: String,
            required: true
        }
    },
    lastMessage: {
        message: String,
        messageTime: {
            type: Date,
            default: Date.now()
        }
    },
    dateCreated: {
        type: Date,
        default: Date.now()
    }
});

const Chat = new mongoose.model('Chat', chatSchema);

module.exports = Chat;