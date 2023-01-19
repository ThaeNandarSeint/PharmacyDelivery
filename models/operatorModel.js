const mongoose = require('mongoose')

const operatorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
    }
})

module.exports = mongoose.model('Operators', operatorSchema)