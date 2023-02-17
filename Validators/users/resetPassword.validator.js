const joi = require("joi");

const validation = joi.object({
     password: joi.string().min(8).trim(true).required()
});

const resetPwValidator = async (req, res, next) => {
	const payload = {
		password: req.body.password
	};

	const { error } = validation.validate(payload);
	if (error) {
		
		return res.status(406).json({ status: 406, msg: error.message });

	} else {		
		next();
	}
};

module.exports = resetPwValidator;