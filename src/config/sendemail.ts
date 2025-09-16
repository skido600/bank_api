import nodemailer from "nodemailer";
async function sendMail(email: string, verificationCode: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  let info = await transporter.sendMail({
    from: `"wire"  <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your email",
    text: `Your verification code is ${verificationCode}. It expires in 10 minutes.`,
  });
  return info;
}

export default sendMail;
