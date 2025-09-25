// config/sendTransactionMessage.ts
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

interface MailParams {
  topic: string;
  accountName: string;
  type: "credited" | "debited";
  amount: number;
  otherParty?: string;
  reference: string;
  email: string;
}

async function sendMailtransaction({
  topic,
  accountName,
  type,
  amount,
  otherParty,
  reference,
  email,
}: MailParams): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Load template
  const htmlTemplatePath = path.join(
    process.cwd(),
    "src",
    "config",
    "transaction.html"
  );

  let htmlContent = fs.readFileSync(htmlTemplatePath, "utf-8");

  htmlContent = htmlContent
    .replace(/{{TITLE}}/g, topic)
    .replace(/{{NAME}}/g, accountName)
    .replace(/{{TYPE}}/g, type)
    .replace(/{{AMOUNT}}/g, amount.toLocaleString())
    .replace(/{{PARTY_LABEL}}/g, type === "credited" ? "From" : "To")
    .replace(/{{OTHER_PARTY}}/g, otherParty ?? "N/A")
    .replace(/{{REFERENCE}}/g, reference)
    .replace(/{{DATE}}/g, new Date().toLocaleString())
    .replace(/{{YEAR}}/g, new Date().getFullYear().toString());

  // Send mail
  await transporter.sendMail({
    from: `${topic} <${process.env.EMAIL_USER}>`,
    to: email,
    subject: topic,
    html: htmlContent,
  });
}

export default sendMailtransaction;
