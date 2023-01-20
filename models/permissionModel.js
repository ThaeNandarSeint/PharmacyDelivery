const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema({
    permissionId: {
        type: String,
        required: [true, "Permission Id is required!"],
    },
    permissionType: {
        type: String,
        required: [true, "Please enter the type of permission!"],
    }
});

module.exports = mongoose.model("Permissions", permissionSchema);