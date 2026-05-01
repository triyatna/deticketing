import fs from "node:fs/promises";
import path from "node:path";
import { verifyToken } from "../../../utils/jwt";

const ALLOWED_MIME_BY_TYPE: Record<string, string[]> = {
  logo: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
  favicon: ["image/png", "image/x-icon", "image/vnd.microsoft.icon", "image/svg+xml"],
};

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
};

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB

export default defineEventHandler(async (event) => {
  const token = getCookie(event, "auth_token");
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const decoded: any = verifyToken(token);
  if (!decoded || decoded.role !== "ADMIN") {
    throw createError({ statusCode: 403, statusMessage: "Akses ditolak." });
  }

  const parts = await readMultipartFormData(event);
  if (!parts) {
    throw createError({ statusCode: 400, statusMessage: "Form upload tidak valid." });
  }

  let uploadType = "logo";
  let filePart: any = null;

  for (const part of parts) {
    if (part.name === "type") uploadType = part.data?.toString?.() || "logo";
    if (part.name === "file" && part.filename) filePart = part;
  }

  if (!["logo", "favicon"].includes(uploadType)) {
    throw createError({ statusCode: 400, statusMessage: "Tipe upload tidak valid." });
  }

  if (!filePart?.data?.length) {
    throw createError({ statusCode: 400, statusMessage: "File tidak ditemukan." });
  }

  if (filePart.data.length > MAX_UPLOAD_BYTES) {
    throw createError({ statusCode: 400, statusMessage: "Ukuran file maksimal 2 MB." });
  }

  const mimeType = String(filePart.type || "").toLowerCase();
  const allowedMimes = ALLOWED_MIME_BY_TYPE[uploadType] || [];
  if (!allowedMimes.includes(mimeType)) {
    throw createError({
      statusCode: 400,
      statusMessage:
        uploadType === "favicon"
          ? "Favicon harus berformat PNG, ICO, atau SVG."
          : "Logo harus berformat PNG, JPG, WEBP, atau SVG.",
    });
  }

  const extension = EXT_BY_MIME[mimeType] || "bin";
  const safeName = `${uploadType}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const brandingDir = path.resolve(process.cwd(), "public", "uploads", "branding");
  await fs.mkdir(brandingDir, { recursive: true });

  const absoluteFilePath = path.join(brandingDir, safeName);
  await fs.writeFile(absoluteFilePath, filePart.data);

  return {
    success: true,
    url: `/uploads/branding/${safeName}`,
    key: uploadType === "logo" ? "APP_LOGO_URL" : "APP_FAVICON_URL",
  };
});
