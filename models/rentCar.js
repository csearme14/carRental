const mongoose = require('mongoose');   //รับค่า Finish
const Schema   = mongoose.Schema;

const rentCarSchema = new Schema({
    user:{
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    car:{
        type: Schema.Types.ObjectId,
        ref: 'Car'
    },
    amountDay:{
        type: String
    },
    wherePlace:{
        type: String
    },
    meetArea:{
        type: String
    },
    dateTime: {
        type: Date
    },
    price: {
        type: Number
    }
});
module.exports = mongoose.model('rentCar',rentCarSchema);