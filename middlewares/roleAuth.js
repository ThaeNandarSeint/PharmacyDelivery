const Users = require('../models/userModel')

const isSuperAdmin = async (req, res, next) => {
    try{
        
        const userId = req.user.id
        const { isSuperAdmin } = await Users.findById(userId)
        if(!isSuperAdmin){
            return res.status(403).json({ status: false, msg: "You are not authorized for this action!" })
        }
        next();

    }catch(err){
        next(err);
        return res.status(500).json({msg: err.message})
    }
}

const isPharmacyTeam = async (req, res, next) => {
    try{
        
        const userId = req.user.id
        const { isPharmacyTeam } = await Users.findById(userId)
        if(!isPharmacyTeam){
            return res.status(403).json({ status: false, msg: "You are not authorized for this action!" })
        }
        next();

    }catch(err){
        next(err);
        return res.status(500).json({msg: err.message})
    }
}

module.exports = {
    isSuperAdmin,
    isPharmacyTeam
}