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
    
    Id_card:{   //new
        type: String
    },
    gender:{       //new sex
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
    }
});

module.exports = mongoose.model('User',userSchema);