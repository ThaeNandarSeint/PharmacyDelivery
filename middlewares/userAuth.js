const jwt = require('jsonwebtoken')
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET

const userAuth = async (req, res, next) => {
    try{
        const accessToken = req.header('Authorization')

        if (!accessToken) {
            return res.status(401).json({ statusCode: 401, payload: {  }, message: "Token expires or Token was not found! Please Login now!" })
        }

        jwt.verify(accessToken, ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) {
                return res.status(401).json({ statusCode: 401, payload: {  }, message: "Token expires or Incorrect token!" })
            }

            req.user = user;
            next();

        })
    }catch(err){
        next(err);
    }
}

module.exports = {
    userAuth
}