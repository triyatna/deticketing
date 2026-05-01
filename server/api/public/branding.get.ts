const DEFAULT_BRANDING = {
  APP_NAME: "DeTicketing",
  APP_TAGLINE: "Premium Ticketing System by TY Studio DEV",
  APP_LOGO_URL: "/logo.png",
  APP_FAVICON_URL: "/favicon.png",
};

export default defineEventHandler(async () => {
  return {
    success: true,
    branding: DEFAULT_BRANDING,
  };
});
