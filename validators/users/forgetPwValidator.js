const joi = require("joi");

const validation = joi.object({
     email: joi.string().email().trim(true).required()
});

const forgetPwValidator = async (req, res, next) => {
	const payload = {
		email: req.body.email
	};

	const { error } = validation.validate(payload);
	if (error) {
		
		return res.status(406).json({ status: 406, msg: error.message });

	} else {		
		next();
	}
};

module.exports = forgetPwValidator;