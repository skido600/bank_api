import joi from "joi";

const signup = joi.object({
  phonenumber: joi.string().length(11).required(),
  full_name: joi.string().min(4).max(60).required(),

  email: joi
    .string()
    .min(6)
    .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
    .required(),
  password: joi
    .string()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{8,}$"))
    .required()
    .messages({
      "string.pattern.base":
        "Password must be at least 8 characters, include one uppercase, one lowercase, and one number.",
      "string.empty": "Password is required",
    }),
  address: joi.string().min(5).optional(),
});
const login = joi.object({
  email_phonenumber: joi.string().min(6).required().messages({
    "string.empty": "Email or phone number is required",
    "string.min": "Email or phone number must be at least 6 characters",
  }),
  password: joi
    .string()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{8,}$"))
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.pattern.base":
        "Password must be at least 8 characters long, include one uppercase letter, one lowercase letter, and one number",
    }),
});
export { signup, login };
