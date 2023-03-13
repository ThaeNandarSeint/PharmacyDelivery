const roleAuth = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            const user = req.user
            
            if (!user) {
                const error = new Error("You need to first login!");
                error.status = 401;
                return next(error)
            }

            const rolesArray = [...allowedRoles];

            // check type
            if (!rolesArray.includes(user.roleType)) {
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