const joi = require("joi");

const validation = joi.object({
    orderCount: joi.number().greater(0).required()
});

const orderValidator = async (req, res, next) => {

  const payload = { orderCount: req.body.orderCount }

  const { error } = validation.validate(payload);

  if (error) {

    return res.status(406).json({ status: 406, msg: `Error in User Data : ${error.message}` })

  } else {

    next();

  }
};

module.exports = {
  orderValidator
};