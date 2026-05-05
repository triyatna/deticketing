// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",

  nitro: {
    experimental: {
      websocket: true,
    },
  },

  devtools: { enabled: true },

  modules: ["nuxt-security"],

  css: ["~/assets/css/main.scss"],

  app: {
    head: {
      title: "DeTicketing - Premium Ticketing System by TY Studio DEV",
      link: [
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap",
        },
      ],
    },
  },

  security: {
    headers: {
      permissionsPolicy: {
        camera: ["self"],
        microphone: [],
        geolocation: [],
        fullscreen: ["self"],
        "display-capture": [],
      },

      crossOriginEmbedderPolicy: "unsafe-none",

      xXSSProtection: "1; mode=block",

      contentSecurityPolicy: {
        "default-src": ["'self'"],

        "img-src": ["'self'", "data:", "https:", "blob:"],

        "style-src": [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
        ],

        "font-src": ["'self'", "https://fonts.gstatic.com"],

        "script-src": [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://static.cloudflareinsights.com",
        ],

        "connect-src": [
          "'self'",
          "https:",
          "wss:",
          "ws:",
          "https://cloudflareinsights.com",
        ],
        "media-src": ["'self'", "blob:", "data:"],
      },
    },

    rateLimiter: {
      tokensPerInterval: 1500,
      interval: 60000,
    },

    xssValidator: {},

    corsHandler: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    },
  },

  routeRules: {
    "/api/auth/login": {
      security: {
        rateLimiter: {
          tokensPerInterval: 5,
          interval: 300000,
        },
      },
    },
    "/api/auth/setup-owner": {
      security: {
        rateLimiter: {
          tokensPerInterval: 5,
          interval: 300000,
        },
      },
    },

    "/api/ticket/register": {
      security: {
        rateLimiter: {
          tokensPerInterval: 5,
          interval: 60000,
        },
      },
    },
    "/form/**": {
      headers: {
        "X-Robots-Tag":
          "noindex, nofollow, noarchive, nosnippet, noimageindex, noai, noimageai",
      },
    },
    "/p/**": {
      headers: {
        "X-Robots-Tag":
          "noindex, nofollow, noarchive, nosnippet, noimageindex, noai, noimageai",
      },
    },
  },
});
