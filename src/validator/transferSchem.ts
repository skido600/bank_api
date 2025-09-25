import Joi from "joi";

export const transferSchema = Joi.object({
  receiverAcc: Joi.string().length(10).required().messages({
    "string.base": "Receiver account number must be a string",
    "string.length": "Receiver account number must be exactly 10 digits",
    "any.required": "Receiver account number is required",
    "any.invalid":
      "Receiver account number cannot be the same as sender account number",
  }),

  amount: Joi.number().positive().min(1).required().messages({
    "number.base": "Amount must be a number",
    "number.positive": "Amount must be greater than 0",
    "number.min": "Amount must be at least 1",
    "any.required": "Amount is required",
  }),
});

export const receiver = Joi.object({
  amount: Joi.number().positive().min(1).required().messages({
    "number.base": "Amount must be a number",
    "number.positive": "Amount must be greater than 0",
    "number.min": "Amount must be at least 1",
    "any.required": "Amount is required",
  }),
});
