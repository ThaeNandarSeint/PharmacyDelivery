const { createActivationToken } = require("../helpers/createTokens");
const { createDeliveryPerson } = require("../services/deliveryPerson.service");

// 
const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body
        // unique validation
        const userEmail = await Users.findOne({ email })
        if (userEmail) {
            const error = new Error("This email already exists!");
            error.status = 400;
            return next(error)
        }

        // create user model
        const passwordHash = await bcrypt.hash(password, 12)

        const isTesting = email.includes("test")

        if (!isTesting) {
            // create email activation token & send email
            const activation_token = createActivationToken({
                name,
                email,
                password: passwordHash
            })

            const url = `${CLIENT_URL}/user/activate/${activation_token}`
            const text = "Verify your email address"

            const html = activateEmailHtml(url, text)

            sendMail(email, html)

            return res.status(200).json({ statusCode: 200, payload: {}, message: "Register Success! Please activate your email to start!" })
        }
        // create custom id
        const id = await createCustomId(Users, "U")

        // create user model & save in mongodb
        if (id) {
            const newUser = new Users({
                id,
                name,
                email,
                password: passwordHash,
                pictureUrls: ["https://res.cloudinary.com/dm5vsvaq3/image/upload/v1673412749/PharmacyDelivery/Users/default-profile-picture_nop9jb.webp"],
                picPublicIds: ["PharmacyDelivery/Users/default-profile-picture_nop9jb.webp"],
                roleType: 'Customer'
            })

            const savedUser = await newUser.save()

            // const savedUser = createDeliveryPerson(
            //     {
            //         id,
            //         name,
            //         email,
            //         password: passwordHash,
            //         pictureUrls: ["https://res.cloudinary.com/dm5vsvaq3/image/upload/v1673412749/PharmacyDelivery/Users/default-profile-picture_nop9jb.webp"],
            //         picPublicIds: ["PharmacyDelivery/Users/default-profile-picture_nop9jb.webp"],
            //         roleType: 'Customer'
            //     }
            // )

            // create token
            const accessToken = createAccessToken({ id: savedUser._id })

            return res.status(201).json({ statusCode: 201, payload: { user: savedUser, accessToken, roleType: savedUser.roleType }, message: "Account has been created!" })
        }

    } catch (err) {
        next(err);
    }
}