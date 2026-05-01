import nodemailer from "nodemailer";
import prisma from "./prisma";

export const sendTicketEmail = async (
  to: string,
  registrantName: string,
  eventName: string,
  qrCodeDataUrl: string,
  baseUrl: string = "",
) => {
  // Fetch settings from DB
  // @ts-ignore: Prisma client needs regeneration
  const settingsDb = await prisma.setting.findMany();
  const settingsMap = settingsDb.reduce(
    (acc: Record<string, string>, s: any) => {
      acc[s.key] = s.value;
      return acc;
    },
    {} as Record<string, string>,
  );

  // Use STRICT DB settings
  const smtpHost = settingsMap["SMTP_HOST"];
  const smtpPort = settingsMap["SMTP_PORT"];
  const smtpUser = settingsMap["SMTP_USER"];
  const smtpPass = settingsMap["SMTP_PASS"];
  const smtpFromName = settingsMap["SMTP_FROM_NAME"];
  const smtpFromEmail = settingsMap["SMTP_FROM_EMAIL"];
  const appName = settingsMap["APP_NAME"] || "NexTicket";
  let appLogoUrl = settingsMap["APP_LOGO_URL"] || "";

  if (appLogoUrl && !/^https?:\/\//i.test(appLogoUrl) && baseUrl) {
    const prefix = appLogoUrl.startsWith("/") ? "" : "/";
    appLogoUrl = `${baseUrl.replace(/\/$/, "")}${prefix}${appLogoUrl}`;
  }

  if (
    !smtpHost ||
    !smtpPort ||
    !smtpUser ||
    !smtpPass ||
    !smtpFromName ||
    !smtpFromEmail
  ) {
    throw new Error(
      "Konfigurasi SMTP di Pengaturan Sistem belum lengkap. Harap lengkapi terlebih dahulu.",
    );
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort),
    secure: smtpPort === "465",
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #3b82f6; padding: 20px; color: white; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">E-Ticket: ${eventName}</h1>
      </div>
      <div style="padding: 30px; text-align: center;">
        <p style="font-size: 16px; color: #333;">Halo, kak <strong>${registrantName}</strong>!</p>
        <p style="font-size: 16px; color: #333;">Pembayaran tiket Anda telah dikonfirmasi. Berikut adalah QR Code untuk akses masuk Anda:</p>
        <div style="margin: 30px 0;">
          <img src="cid:qrcode" alt="QR Code" style="width: 250px; height: 250px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px;" />
        </div>
        <p style="font-size: 14px; color: #64748b;">Harap tunjukkan QR Code ini kepada panitia saat acara berlangsung.</p>
      </div>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
        ${appLogoUrl ? `<img src="${appLogoUrl}" alt="${appName}" style="max-height: 30px; margin: 0 auto 12px; display: block;" />` : ""}
        <p style="margin: 0; font-size: 13px; color: #475569; font-weight: 600;">${appName} by TY Studio DEV</p>
        <p style="margin: 6px 0 0; font-size: 12px; color: #64748b; line-height: 1.5;">
          Jln. Selang Ciwaringin, Kec. Lemahabang, Karawang, Jawa Barat 41383
        </p>
      </div>
    </div>
  `;

  const formattedFrom = `"${smtpFromName}" <${smtpFromEmail}>`;

  await transporter.sendMail({
    from: formattedFrom,
    to,
    subject: `E-Ticket Anda untuk ${eventName} - ${appName}`,
    html,
    attachments: [
      {
        filename: "qrcode.png",
        path: qrCodeDataUrl,
        cid: "qrcode", // same cid value as in the html img src
      },
    ],
  });
};
