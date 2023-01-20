const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
    roleType: {
        type: String,
        required: [true, "Please enter the type of role!"],
    },
    
    // permission
    // permissions: {
    //     type: Object
    // }
});

module.exports = mongoose.model("Roles", roleSchema);