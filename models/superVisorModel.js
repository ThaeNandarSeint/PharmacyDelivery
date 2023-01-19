const mongoose = require('mongoose')

const superVisorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
    }
})

module.exports = mongoose.model('SuperVisors', superVisorSchema)