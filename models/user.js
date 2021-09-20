const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    facebook:{
        type: String
    },
    google:{
        type: String
    },
    firstname:{
        type: String
    },
    lastname:{
        type:String
    },
    Image:{
        type:String,
        default: '/image/user.png'
    },
    email: {
        type: String
    },
    password:{
        type: String
    },
    date:{
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User',userSchema);