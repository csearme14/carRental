const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const contactSchema = new Schema({
    name:{
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    message:{
        type: String
    },
    date: {
        type:Data,
        default: Date.now
    }
});

module.exports = mongoose.model('Contact',contactSchema);

//พึ่งเพิ่มมา