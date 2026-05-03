// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",

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
      /**
       * PENTING UNTUK KAMERA
       * Default nuxt-security: camera=()
       * Jadi harus di-allow manual.
       */
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

        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],

        /**
         * Aman ditambahkan untuk API same-origin, ngrok, dan dev websocket.
         */
        "connect-src": ["'self'", "https:", "wss:", "ws:"],

        /**
         * Tambahan aman untuk media/camera preview jika browser butuh blob.
         */
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
