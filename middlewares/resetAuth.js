const jwt = require('jsonwebtoken')
const ACTIVATION_TOKEN_SECRET = process.env.ACTIVATION_TOKEN_SECRET

const resetAuth = (req, res, next) => {
    try {
        const token = req.header('Authorization')

        if (!token) {
            const error = new Error("Invalid Token!");
            error.status = 400;
            return next(error)
        }
        
        jwt.verify(token, ACTIVATION_TOKEN_SECRET, (err, user) => {
            if (err) {
                const error = new Error("Invalid Token!");
                error.status = 400;
                return next(error)
            }
            req.user = user;
            next();
        })

    } catch (err) {
        next(err)
    }
}

module.exports = {
    resetAuth
}