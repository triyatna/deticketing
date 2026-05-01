import nodemailer from "nodemailer";
import prisma from "./prisma";

const MAIL_SETTINGS_CACHE_TTL_MS = 30 * 1000;
let mailSettingsCache: {
  value: Record<string, string>;
  expiresAt: number;
} | null = null;
let transporterCache: {
  key: string;
  transporter: nodemailer.Transporter;
} | null = null;

const getMailSettings = async () => {
  const now = Date.now();
  if (mailSettingsCache && mailSettingsCache.expiresAt > now) {
    return mailSettingsCache.value;
  }

  // @ts-ignore: Prisma client needs regeneration
  const settingsDb = await prisma.setting.findMany();
  const settingsMap = settingsDb.reduce(
    (acc: Record<string, string>, s: any) => {
      acc[s.key] = s.value;
      return acc;
    },
    {} as Record<string, string>,
  );

  mailSettingsCache = {
    value: settingsMap,
    expiresAt: now + MAIL_SETTINGS_CACHE_TTL_MS,
  };

  return settingsMap;
};

const getTransporter = (
  smtpHost: string,
  smtpPort: string,
  smtpUser: string,
  smtpPass: string,
) => {
  const cacheKey = `${smtpHost}|${smtpPort}|${smtpUser}|${smtpPass}`;
  if (transporterCache && transporterCache.key === cacheKey) {
    return transporterCache.transporter;
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

  transporterCache = {
    key: cacheKey,
    transporter,
  };

  return transporter;
};

export const sendTicketEmail = async (
  to: string,
  registrantName: string,
  eventName: string,
  qrCodeDataUrl: string,
  requestBaseUrl: string = "",
) => {
  const settingsMap = await getMailSettings();

  // Use STRICT DB settings
  const smtpHost = settingsMap["SMTP_HOST"];
  const smtpPort = settingsMap["SMTP_PORT"];
  const smtpUser = settingsMap["SMTP_USER"];
  const smtpPass = settingsMap["SMTP_PASS"];
  const smtpFromName = settingsMap["SMTP_FROM_NAME"];
  const smtpFromEmail = settingsMap["SMTP_FROM_EMAIL"];
  const appName = settingsMap["APP_NAME"] || "DeTicketing";
  let appFooterLogoUrl =
    settingsMap["APP_FAVICON_URL"] || settingsMap["APP_LOGO_URL"] || "";

  if (
    appFooterLogoUrl &&
    !/^https?:\/\//i.test(appFooterLogoUrl) &&
    requestBaseUrl
  ) {
    const prefix = appFooterLogoUrl.startsWith("/") ? "" : "/";
    appFooterLogoUrl = `${requestBaseUrl.replace(/\/$/, "")}${prefix}${appFooterLogoUrl}`;
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

  const transporter = getTransporter(smtpHost, smtpPort, smtpUser, smtpPass);

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #3b82f6; padding: 20px; color: white; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">E-Ticket: ${eventName}</h1>
      </div>
      <div style="padding: 30px; text-align: center;">
        <p style="font-size: 16px; color: #333;">Halo Kak <strong>${registrantName}</strong>!</p>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          Terima kasih sudah mendaftar di <strong>${eventName}</strong>. Pembayaran Anda sudah kami konfirmasi.
        </p>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          Berikut QR Code e-ticket Anda. Silakan simpan email ini dan tunjukkan QR Code saat proses check-in.
        </p>
        <div style="margin: 30px 0;">
          <img src="cid:qrcode" alt="QR Code" style="width: 250px; height: 250px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px;" />
        </div>
        <p style="font-size: 14px; color: #64748b; line-height: 1.6;">
          Jika ada kendala saat masuk acara, silakan hubungi panitia di lokasi.
        </p>
      </div>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
        ${appFooterLogoUrl ? `<img src="${appFooterLogoUrl}" alt="${appName}" style="max-height: 30px; margin: 0 auto 12px; display: block;" />` : ""}
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
