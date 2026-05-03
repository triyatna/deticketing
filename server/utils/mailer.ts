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
  let settingsMap: Record<string, string> = {};
  try {
    const settingsDb = await prisma.setting.findMany();
    settingsMap = settingsDb.reduce((acc: Record<string, string>, s: any) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string>);
  } catch (error) {
    console.error("Gagal mengambil pengaturan dari database (Mailer):", error);
    // Return empty map to use fallbacks/check logic below
  }

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

const buildEmailTemplate = (
  title: string,
  contentHtml: string,
  appName: string,
  appFooterLogoUrl: string,
  headerColor: string = "#3b82f6",
  contentAlign: string = "center"
) => {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: ${headerColor}; padding: 20px; color: white; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">${title}</h1>
      </div>
      <div style="padding: 30px; text-align: ${contentAlign};">
        ${contentHtml}
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

  const contentHtml = `
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
  `;

  const html = buildEmailTemplate(`E-Ticket: ${eventName}`, contentHtml, appName, appFooterLogoUrl, "#3b82f6", "center");

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

export const sendStaffNotificationEmail = async (
  toEmails: string[],
  eventName: string,
  eventId: string,
  ticketId: string,
  registrantName: string,
  registrantEmail: string,
  requestBaseUrl: string = "",
  paymentProof?: { data: Buffer; filename: string; mimeType: string }
) => {
  if (!toEmails || toEmails.length === 0) return;

  const settingsMap = await getMailSettings();

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
    console.warn("SMTP config missing, cannot send staff notification");
    return;
  }

  const transporter = getTransporter(smtpHost, smtpPort, smtpUser, smtpPass);

  const attachments: any[] = [];
  if (paymentProof) {
    attachments.push({
      filename: paymentProof.filename,
      content: paymentProof.data,
      contentType: paymentProof.mimeType,
    });
  }

  const contentHtml = `
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          Terdapat pendaftaran baru pada event <strong>${eventName}</strong>.
        </p>
        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <p style="margin: 0 0 10px; font-size: 15px; color: #333;"><strong>Nama:</strong> ${registrantName}</p>
          <p style="margin: 0; font-size: 15px; color: #333;"><strong>Email:</strong> ${registrantEmail}</p>
        </div>
        ${paymentProof ? `<p style="margin-top: 15px; font-size: 14px; color: #16a34a; font-weight: bold;">✓ Bukti pembayaran terlampir pada email ini.</p>` : ""}
        <div style="margin-top: 30px; text-align: center;">
          <a href="${requestBaseUrl}/admin/events/${eventId}/ticket/${ticketId}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Lihat Detail Pendaftar</a>
        </div>
  `;

  const html = buildEmailTemplate(`Pendaftar Baru: ${eventName}`, contentHtml, appName, appFooterLogoUrl, "#3b82f6", "left");

  const formattedFrom = `"${smtpFromName}" <${smtpFromEmail}>`;

  await transporter.sendMail({
    from: formattedFrom,
    to: toEmails.join(","),
    subject: `[Notification] Pendaftar Baru: ${eventName}`,
    html,
    attachments,
  });
};

