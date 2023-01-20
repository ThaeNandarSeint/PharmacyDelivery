// models
const Users = require('../models/userModel')
const Roles = require('../models/roleModel')

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

// const roleAuth = async (req, res, next) => {
//     try {
//         const routeName = req.header('routeName')
//         const userType = req.header('userType')

//         const userId = req.user.id
//         if (!userId) {
//             return res.status(400).json({ status: false, msg: "You need to first login!" })
//         }
        
//         // check type
//         const { roleType } = await Users.findById(userId)
//         if(roleType !== userType){
//              return console.log('not access');
//         }

//         // check permission
//         const { permissions } = await Roles.findOne({ roleType })
//         const readAccess = permissions.Read
//         if(readAccess.includes(routeName)){
//             console.log('ok');
//         }

//         // console.log('ok');
//         // next()

//     } catch (err) {
//         next(err)
//     }
// }

module.exports = {
    roleAuth
}