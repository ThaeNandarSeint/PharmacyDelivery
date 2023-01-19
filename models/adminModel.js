const mongoose = require('mongoose')

const adminSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
    }
})

module.exports = mongoose.model('Admins', adminSchema)