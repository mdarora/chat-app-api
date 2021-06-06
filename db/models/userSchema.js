const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    email : {
        type : String,
        unique : true,
        required : true
    },
    password : {
        type : String,
        required : true
    },
    dateJoined : {
        type : String,
        default : Date.now
    },
});

const User = new mongoose.model('User', userSchema);

module.exports = User;