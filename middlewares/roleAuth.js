// models
const Users = require('../models/user.model')

const roleAuth = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id
            
            if (!userId) {
                const error = new Error("You need to first login!");
                error.status = 401;
                return next(error)
            }

            const rolesArray = [...allowedRoles];

            // check type
            const { roleType } = await Users.findById(userId)

            if (!rolesArray.includes(roleType)) {
                const error = new Error("You are not authorized for this action!");
                error.status = 403;
                return next(error)
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