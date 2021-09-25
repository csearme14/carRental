const mongoose = require('mongoose');
const Schema = mongoose.Schema;
//บันทึกข้อมูลลงใน MongoDB
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
    image:{
        type:String,
        default: '/image/user.png'
    },
    email: {
        type: String
    },
    password:{
        type: String
    },
    
    Id_card:{
        type: String
    },
    gender:{
        type: String
    },
    age:{
        typy: String
    },
    phone:{
        type: String
    },
    date:{
        type: Date,
        default: Date.now
    },
    online:{
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('User',userSchema);