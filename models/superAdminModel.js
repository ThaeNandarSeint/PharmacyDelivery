const mongoose = require('mongoose')

const superAdminSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
    }
})

module.exports = mongoose.model('SuperAdmins', superAdminSchema)