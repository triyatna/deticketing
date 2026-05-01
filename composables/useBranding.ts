import { computed } from "vue";

const DEFAULT_BRANDING = {
  APP_NAME: "DeTicketing",
  APP_TAGLINE: "Premium Ticketing System by TY Studio DEV",
  APP_LOGO_URL: "/logo.png",
  APP_FAVICON_URL: "/favicon.png",
};

export const useBranding = () => {
  const branding = useState("app-branding", () => ({ ...DEFAULT_BRANDING }));
  const loaded = useState("app-branding-loaded", () => false);

  const loadBranding = async () => {
    if (loaded.value) return branding.value;

    try {
      const res = await $fetch("/api/public/branding", {
        timeout: 5000,
        retry: 0,
      });

      if (res?.success && res.branding) {
        branding.value = { ...branding.value, ...res.branding };
      }
    } catch {
      // keep defaults
    } finally {
      loaded.value = true;
    }

    return branding.value;
  };

  const appName = computed(() => branding.value.APP_NAME || DEFAULT_BRANDING.APP_NAME);
  const appTagline = computed(
    () => branding.value.APP_TAGLINE || DEFAULT_BRANDING.APP_TAGLINE,
  );
  const appLogoUrl = computed(() => branding.value.APP_LOGO_URL || "");
  const appFaviconUrl = computed(() => branding.value.APP_FAVICON_URL || "");

  return {
    branding,
    loadBranding,
    appName,
    appTagline,
    appLogoUrl,
    appFaviconUrl,
  };
};
