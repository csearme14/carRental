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
    wherePlace:{ //ไปไหน
        type: String
    },
    meetArea:{ //เจอกันที่ไหน
        type: String
    },
    dateTime: {
        type: Date
    },
    price: {
        type: Number
    },
    returnDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['pending','approve', 'cancel', 'timeout'],
        default: 'pending'
    }
});
module.exports = mongoose.model('rentCar',rentCarSchema);