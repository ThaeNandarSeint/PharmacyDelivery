const Users = require('../models/user.model')

const { findOrCreateRoom, getAccessToken } = require('../services/videoCall.service');

const createVideoCall = async (req, res, next) => {
    try {
        const { roomName } = req.body
        // const { name } = await Users.findById(req.user.id)

        findOrCreateRoom(roomName)

        const token = getAccessToken(roomName)

        return res.status(200).json({ statusCode: 200, payload: { token, roomName }, message: "" })

    } catch (err) {
        next(err)
    }
}

module.exports = {
    createVideoCall,
}