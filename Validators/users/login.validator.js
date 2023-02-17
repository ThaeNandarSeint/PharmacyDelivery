const joi = require("joi");

const validation = joi.object({
     email: joi.string().email().trim(true).required(),
     password: joi.string().min(8).trim(true).required()
});

const loginValidator = async (req, res, next) => {
	const { email, password } = req.body;
	const payload = { email, password }

	const { error } = validation.validate(payload);
	if (error) {
		
		return res.status(406).json({ status: 406, msg: error.message });

	} else {		
		next();
	}
};

module.exports = loginValidator;