import FriendRequest from '../models/friendRequest.js';
import Lawyer from '../models/lawyer.js';
import mongoose from 'mongoose';
import { sendMail } from '../utils/sendMail.js';

const createFriendRequestEmail = ({ senderName, senderEmail, receiverName }) => {
    const safeSenderName = senderName || 'Bir MakeDoc kullanicisi';
    const safeReceiverName = receiverName || 'Merhaba';
    const subject = `${safeSenderName} size MakeDoc'ta arkadaslik istegi gonderdi`;

    return {
        subject,
        text: [
            `Merhaba ${safeReceiverName},`,
            '',
            `${safeSenderName} (${senderEmail}) size MakeDoc uzerinden bir arkadaslik istegi gonderdi.`,
            'Istekleri gormek ve yanitlamak icin hesabinizda Friends bolumunu acabilirsiniz.',
            '',
            'Bu islemi beklemiyorsaniz hesabiniza giris yaparak istegi reddedebilirsiniz.',
            '',
            'MakeDoc'
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
                              MakeDoc Network
                            </div>
                            <h1 style="margin:18px 0 10px;font-size:30px;line-height:1.2;color:#ffffff;">Yeni arkadaslik istegi</h1>
                            <p style="margin:0;font-size:15px;line-height:1.7;color:#d8e4ff;">
                              ${safeSenderName} size MakeDoc uzerinden baglanti istegi gonderdi.
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:36px 40px 28px;">
                            <p style="margin:0 0 14px;font-size:15px;line-height:1.8;color:#334a68;">
                              Merhaba <strong>${safeReceiverName}</strong>,
                            </p>
                            <p style="margin:0 0 18px;font-size:15px;line-height:1.8;color:#334a68;">
                              <strong>${safeSenderName}</strong> size arkadaslik istegi gonderdi. Friends bolumune giderek istegi kabul edebilir veya reddedebilirsiniz.
                            </p>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:22px;border:1px solid #d9e4f5;border-radius:20px;background-color:#f8fbff;">
                              <tr>
                                <td style="padding:18px 20px;">
                                  <div style="font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#5d7290;margin-bottom:8px;">
                                    Istegi gonderen
                                  </div>
                                  <div style="font-size:22px;font-weight:700;color:#10233f;">${safeSenderName}</div>
                                  <div style="margin-top:6px;font-size:14px;color:#51657f;">${senderEmail}</div>
                                </td>
                              </tr>
                            </table>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:18px;background-color:#eef4ff;border:1px solid #cfe0ff;">
                              <tr>
                                <td style="padding:16px 18px;font-size:14px;line-height:1.7;color:#285199;">
                                  Hesabiniza giris yaptiktan sonra Friends sayfasindan istegi yonetebilirsiniz.
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:0 40px 32px;font-size:13px;line-height:1.7;color:#7b8da8;">
                            Bu mesaj otomatik olarak olusturulmustur. Eger bu bildirimi almak istemiyorsaniz hesap bildirim ayarlarinizi daha sonra guncelleyebilirsiniz.
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

export const sendRequest = async (req, res, next) => {
    try {
        const senderId = req.lawyer._id;
        const sender = req.lawyer;
        const { receiverId, email } = req.body;
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        let resolvedReceiverId = receiverId;

        if (!receiverId && !normalizedEmail) {
            return res.status(400).json({
                success: false,
                message: "receiverId or email is required"
            });
        }

        if (!resolvedReceiverId && normalizedEmail) {
            const receiverByEmail = await Lawyer.findOne({ email: normalizedEmail }).select('_id');

            if (!receiverByEmail) {
                return res.status(404).json({
                    success: false,
                    message: "No user found with this email"
                });
            }

            resolvedReceiverId = receiverByEmail._id.toString();
        }

        if (!mongoose.Types.ObjectId.isValid(resolvedReceiverId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid receiverId"
            });
        }

        if (senderId.toString() === resolvedReceiverId.toString()) {
            return res.status(400).json({
                success: false,
                message: "Cannot send request to yourself"
            });
        }

        const receiver = await Lawyer.findById(resolvedReceiverId);
        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const alreadyFriends = (receiver.friends || []).some(
            (friendId) => friendId.toString() === senderId.toString()
        );

        if (alreadyFriends) {
            return res.status(400).json({
                success: false,
                message: "Already friends"
            });
        }

        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: senderId, receiver: resolvedReceiverId },
                { sender: resolvedReceiverId, receiver: senderId }
            ],
            status: { $in: ['pending', 'accepted'] }
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: "Friend request already exists or you are already friends"
            });
        }

        const newRequest = await FriendRequest.create({
            sender: senderId,
            receiver: resolvedReceiverId
        });

        try {
            const friendRequestEmail = createFriendRequestEmail({
                senderName: sender.name,
                senderEmail: sender.email,
                receiverName: receiver.name
            });

            await sendMail({
                to: receiver.email,
                subject: friendRequestEmail.subject,
                text: friendRequestEmail.text,
                html: friendRequestEmail.html
            });
        } catch (mailError) {
            console.error('friend request email error:', mailError);
        }

        res.status(201).json({
            success: true,
            data: newRequest,
            message: "Friend request sent"
        });
    } catch (error) {
        console.error("sendRequest error:", error);
        next(error);
    }
};

export const getRequests = async (req, res, next) => {
    try {
        const userId = req.lawyer._id;
        const requests = await FriendRequest.find({ receiver: userId, status: 'pending' }).populate('sender', 'name email profileImage');
        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        next(error);
    }
};

export const getSentRequests = async (req, res, next) => {
    try {
        const userId = req.lawyer._id;
        const requests = await FriendRequest.find({ sender: userId, status: 'pending' });
        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        next(error);
    }
};


export const acceptRequest = async (req, res, next) => {
    try {
        const { requestId } = req.body;
        const userId = req.lawyer._id;

        const request = await FriendRequest.findOne({ _id: requestId, receiver: userId, status: 'pending' });
        if (!request) {
            return res.status(404).json({ success: false, message: "Friend request not found" });
        }

        request.status = 'accepted';
        await request.save();

        // Add each other to friends array
        await Lawyer.findByIdAndUpdate(userId, { $addToSet: { friends: request.sender } });
        await Lawyer.findByIdAndUpdate(request.sender, { $addToSet: { friends: userId } });

        res.status(200).json({ success: true, message: "Friend request accepted" });
    } catch (error) {
        next(error);
    }
};

export const rejectRequest = async (req, res, next) => {
    try {
        const { requestId } = req.body;
        const userId = req.lawyer._id;

        const request = await FriendRequest.findOne({ _id: requestId, receiver: userId, status: 'pending' });
        if (!request) {
            return res.status(404).json({ success: false, message: "Friend request not found" });
        }

        request.status = 'rejected';
        await request.save();

        res.status(200).json({ success: true, message: "Friend request rejected" });
    } catch (error) {
        next(error);
    }
};

export const getFriends = async (req, res, next) => {
    try {
        const userId = req.lawyer._id;
        const user = await Lawyer.findById(userId).populate('friends', 'name email profileImage');
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, data: user.friends || [] });
    } catch (error) {
        next(error);
    }
};
