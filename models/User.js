const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: {type: String , required: true},
    email: {type: String , required: true, unique:true},
    password: {type: String, required: true}, // Fixed typo in 'required'
    role:{
        type:String ,
        enum : ["admin" , "godown_manager" , "pds_shop_owner" , "delivery_personnel" , "beneficiary"] , 
        required : true ,
    },
    contactnumber:{type: String , required:true} ,
    address:{type:String , required : true} ,

    assignedPDSShop: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "PDSShop",
        required: function() {
            return this.role === "pds_shop_owner";
        }
    },
    assignedGodown: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Godown",
        required: function() {
            return this.role === "godown_manager";
        }
    },
    assignedVehicle: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Vehicle",
        required: function() {
            return this.role === "delivery_personnel";
        }
    },
    createdAt: {type: Date , default:Date.now}, 

} , 
{timestamps:true}
);

module.exports=mongoose.model("User" , UserSchema);