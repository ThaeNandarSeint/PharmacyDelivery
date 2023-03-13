const mongoose = require('mongoose');

const checkObjectId = ({ _id }) => {    
    return mongoose.Types.ObjectId.isValid(_id)
}

module.exports = {
    checkObjectId
}