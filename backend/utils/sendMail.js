import nodemailer from 'nodemailer';
import {
  MAIL_HOST,
  MAIL_PORT,
  MAIL_SECURE,
  MAIL_USER,
  MAIL_PASS,
  MAIL_FROM
} from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: MAIL_HOST,
  port: Number(MAIL_PORT),
  secure: MAIL_SECURE === 'true',
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS
  }
});

export const sendMail = async ({ to, subject, text, html }) => {
  await transporter.sendMail({
    from: MAIL_FROM || MAIL_USER,
    to,
    subject,
    text,
    html
  });
};