import prisma from "../../utils/prisma";

const DEFAULT_BRANDING = {
  APP_NAME: "NexTicket",
  APP_TAGLINE: "Premium Ticketing System",
  APP_LOGO_URL: "",
  APP_FAVICON_URL: "",
};

type BrandingCacheEntry = {
  value: {
    APP_NAME: string;
    APP_TAGLINE: string;
    APP_LOGO_URL: string;
    APP_FAVICON_URL: string;
  };
  expiresAt: number;
};

const BRANDING_CACHE_TTL_MS = 30 * 1000;
let brandingCache: BrandingCacheEntry | null = null;

export default defineEventHandler(async () => {
  try {
    const now = Date.now();
    if (brandingCache && brandingCache.expiresAt > now) {
      return {
        success: true,
        branding: brandingCache.value,
      };
    }

    // @ts-ignore: Prisma client needs regeneration
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            "APP_NAME",
            "APP_TAGLINE",
            "APP_LOGO_URL",
            "APP_FAVICON_URL",
          ],
        },
      },
    });

    const settingsMap = settings.reduce(
      (acc: Record<string, string>, item: any) => {
        acc[item.key] = item.value;
        return acc;
      },
      {} as Record<string, string>,
    );

    const branding = {
      APP_NAME: settingsMap.APP_NAME || DEFAULT_BRANDING.APP_NAME,
      APP_TAGLINE: settingsMap.APP_TAGLINE || DEFAULT_BRANDING.APP_TAGLINE,
      APP_LOGO_URL: settingsMap.APP_LOGO_URL || DEFAULT_BRANDING.APP_LOGO_URL,
      APP_FAVICON_URL:
        settingsMap.APP_FAVICON_URL || DEFAULT_BRANDING.APP_FAVICON_URL,
    };

    brandingCache = {
      value: branding,
      expiresAt: now + BRANDING_CACHE_TTL_MS,
    };

    return {
      success: true,
      branding,
    };
  } catch {
    return {
      success: true,
      branding: DEFAULT_BRANDING,
    };
  }
});
