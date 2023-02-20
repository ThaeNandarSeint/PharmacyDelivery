const Users = require('../models/user.model')

const { findOrCreateRoom, getAccessToken } = require('../services/videoCall.service');

const createVideoCall = async (req, res, next) => {
    try{
        const { name } = await Users.findById(req.user.id)

        findOrCreateRoom(name)

        const token = getAccessToken(name)

        return res.status(200).json({ statusCode: 200, payload: { token, roomName: name }, message: "" })
        
    }catch(err){
        next(err)
    }
}

module.exports = {
    createVideoCall
}