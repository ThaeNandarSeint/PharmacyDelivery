const jwt = require('jsonwebtoken')
const ACTIVATION_TOKEN_SECRET = process.env.ACTIVATION_TOKEN_SECRET

const resetAuth = (req, res, next) => {
    try{
        const token = req.header('Authorization')
        
        if(!token){
            return res.status(500).json({msg: "Invalid Token!"})
        }
        jwt.verify(token, ACTIVATION_TOKEN_SECRET, (err, user) => {
            if(err){
                return res.status(500).json({msg: "Invalid Token!"})
            }
            req.user = user;
            next();
        })

    }catch(err){
        console.log(err);
        return res.status(500).json({msg: err.message})
    }
}

module.exports = {
    resetAuth
}