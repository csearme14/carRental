const mongoose = require('mongoose');   //รับค่า Finish
const Schema   = mongoose.Schema;

const carSchema = new Schema({
    owner:{
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    make:{
        type: String
    },
    model:{
        type: String
    },
    year:{
        type: Number
    },
    type:{
        type: String
    },
    pricePerWeek:{
        type: Number
    },
    pricePerHour:{
        type: Number
    },
    carNo: {
        type: String
    },
    image: [
        {
            imageUrl:{
                type:String
            }
        }
    ],
    location: {
        type: String
    },
    date: {
        type: Date,
    },
    coords:{
        lat:{
            type: Number
        },
        lng:{
            type: Number
        }
    },
    picture:{
        type: String
    },
    canRent: {
        type: Boolean,
        default: true
    },
    adminApprove: {
        type: Boolean,
        default: false
    },
    rate: [
        {
            day: { type: Number },
            price: { type: Number }
        }
    ]
});
module.exports = mongoose.model('Car',carSchema);