import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import lawyer from '../models/lawyer.js';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/env.js';
import { sendMail } from '../utils/sendMail.js';

const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const createVerificationEmail = ({ code, isResend = false }) => {
    const subject = isResend
        ? 'MakeDoc yeni giris dogrulama kodunuz'
        : 'MakeDoc giris dogrulama kodunuz';
    const title = isResend ? 'Yeni giris kodunuz hazir' : 'Giris kodunuz hazir';
    const intro = isResend
        ? 'Yeni bir dogrulama kodu talep ettiniz. Asagidaki kod ile giris isleminizi guvenle tamamlayabilirsiniz.'
        : 'Hesabiniza guvenli bir sekilde giris yapmak icin asagidaki dogrulama kodunu kullanin.';

    return {
        subject,
        text: [
            'MakeDoc Giris Dogrulama',
            '',
            intro,
            '',
            `Dogrulama kodunuz: ${code}`,
            'Bu kod 5 dakika boyunca gecerlidir.',
            'Bu islemi siz baslatmadiysaniz bu e-postayi dikkate almayin.'
        ].join('\n'),
        html: `
            <!DOCTYPE html>
            <html lang="tr">
              <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>${subject}</title>
              </head>
              <body style="margin:0;padding:0;background-color:#f3f6fb;font-family:Arial,sans-serif;color:#10233f;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f6fb;margin:0;padding:24px 0;">
                  <tr>
                    <td align="center">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 55px rgba(16,35,63,0.12);">
                        <tr>
                          <td style="background:linear-gradient(135deg,#10233f 0%,#1f4b99 100%);padding:32px 40px;">
                            <div style="display:inline-block;padding:8px 14px;border-radius:999px;background-color:rgba(255,255,255,0.14);font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:#e8f0ff;">
                              MakeDoc Secure Access
                            </div>
                            <h1 style="margin:18px 0 10px;font-size:30px;line-height:1.2;color:#ffffff;">${title}</h1>
                            <p style="margin:0;font-size:15px;line-height:1.7;color:#d8e4ff;">
                              ${intro}
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:36px 40px 28px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #d9e4f5;border-radius:20px;background-color:#f8fbff;">
                              <tr>
                                <td style="padding:16px 20px 8px;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#5d7290;">
                                  Dogrulama kodunuz
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:0 20px 20px;">
                                  <div style="padding:18px 20px;border-radius:16px;background-color:#ffffff;border:1px solid #c8d8ee;text-align:center;font-size:34px;line-height:1;letter-spacing:12px;font-weight:700;color:#10233f;">
                                    ${code}
                                  </div>
                                </td>
                              </tr>
                            </table>
                            <p style="margin:0 0 14px;font-size:15px;line-height:1.8;color:#334a68;">
                              Bu kod <strong>5 dakika</strong> boyunca gecerlidir ve tek kullanimliktir.
                            </p>
                            <p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:#334a68;">
                              Eger bu giris istegi size ait degilse hesabinizi korumak icin bu e-postayi yok sayabilirsiniz.
                            </p>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:18px;background-color:#fff8e8;border:1px solid #f1ddb0;">
                              <tr>
                                <td style="padding:16px 18px;font-size:14px;line-height:1.7;color:#7a5a17;">
                                  Guvenlik notu: MakeDoc ekibi sizden e-posta veya telefon ile bu kodu paylasmanizi istemez.
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:0 40px 32px;font-size:13px;line-height:1.7;color:#7b8da8;">
                            Bu mesaj otomatik olarak olusturulmustur. Yardima ihtiyaciniz olursa MakeDoc destek ekibiyle iletisime gecebilirsiniz.
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
        `
    };
};

export const signUp = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { name, email, password, job } = req.body;
        const existingUser = await lawyer.findOne({ email });
        if (existingUser) {
            const error = new Error('User already exists');
            error.statusCode = 409;
            throw error;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const profileImage = req.file ? `/uploads/profile/${req.file.filename}` : null;

        const newUser = await lawyer.create([{
            name,
            email,
            password: hashedPassword,
            profileImage,
            job: job || 'Lawyer'
        }], { session });

        const token = jwt.sign(
            { userId: newUser[0]._id },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: { token, user: newUser[0] }
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

export const signIn = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await lawyer.findOne({ email });
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            const error = new Error('Invalid password');
            error.statusCode = 401;
            throw error;
        }

        const code = generateCode();
        const hashedCode = await bcrypt.hash(code, 10);

        user.loginVerificationCode = hashedCode;
        user.loginVerificationExpire = new Date(Date.now() + 5 * 60 * 1000);
        user.loginVerificationAttempts = 0;
        await user.save();

        const verificationEmail = createVerificationEmail({ code });

        await sendMail({
            to: user.email,
            subject: verificationEmail.subject,
            text: verificationEmail.text,
            html: verificationEmail.html
        });

        res.status(200).json({
            success: true,
            message: 'Verification code sent to email',
            data: {
                email: user.email
            }
        });
    } catch (error) {
        next(error);
    }
};

export const verifyLoginCode = async (req, res, next) => {
    try {
        const { email, code } = req.body;

        const user = await lawyer.findOne({ email });
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        if (!user.loginVerificationCode || !user.loginVerificationExpire) {
            const error = new Error('Verification code not found');
            error.statusCode = 400;
            throw error;
        }

        if (user.loginVerificationExpire < new Date()) {
            user.loginVerificationCode = null;
            user.loginVerificationExpire = null;
            user.loginVerificationAttempts = 0;
            await user.save();

            const error = new Error('Verification code expired');
            error.statusCode = 400;
            throw error;
        }

        if (user.loginVerificationAttempts >= 5) {
            const error = new Error('Too many incorrect attempts. Please request a new code.');
            error.statusCode = 429;
            throw error;
        }

        const isCodeValid = await bcrypt.compare(code, user.loginVerificationCode);

        if (!isCodeValid) {
            user.loginVerificationAttempts += 1;
            await user.save();

            const error = new Error('Invalid verification code');
            error.statusCode = 400;
            throw error;
        }

        user.loginVerificationCode = null;
        user.loginVerificationExpire = null;
        user.loginVerificationAttempts = 0;
        await user.save();

        const token = jwt.sign(
            { userId: user._id },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(200).json({
            success: true,
            message: 'User signed in successfully',
            data: { token, user }
        });
    } catch (error) {
        next(error);
    }
};

export const resendLoginCode = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await lawyer.findOne({ email });
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        const code = generateCode();
        const hashedCode = await bcrypt.hash(code, 10);

        user.loginVerificationCode = hashedCode;
        user.loginVerificationExpire = new Date(Date.now() + 5 * 60 * 1000);
        user.loginVerificationAttempts = 0;
        await user.save();

        const verificationEmail = createVerificationEmail({ code, isResend: true });

        await sendMail({
            to: user.email,
            subject: verificationEmail.subject,
            text: verificationEmail.text,
            html: verificationEmail.html
        });

        res.status(200).json({
            success: true,
            message: 'New verification code sent',
            data: { email: user.email }
        });
    } catch (error) {
        next(error);
    }
};

export const signOut = async (req, res) => {
    res.status(200).json({ success: true, message: 'User signed out' });
};
