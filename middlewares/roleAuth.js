// models
const Users = require('../models/user.model')

const roleAuth = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id
            if (!userId) {
                return res.status(400).json({ status: 400, msg: "You need to first login!" })
            }
            
            const rolesArray = [...allowedRoles];
            // check type
            const { roleType } = await Users.findById(userId)
            if(!rolesArray.includes(roleType)){
                return res.status(403).json({ status: false, msg: "You are not authorized for this action!" })                
            }

            next()
    
        } catch (err) {
            next(err)
        }
    }
}

module.exports = {
    roleAuth
}