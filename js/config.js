/* ============================================================
   SB NOTES PORTAL — config.js
   ONLY external config lives here. NEVER put passwords,
   Sheet IDs or admin secrets in frontend code.
   ============================================================ */

const CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbzfl-XVjShKDvQ1EahQDhc2DpwMfJA-LJKBq8UbI_MZ8uohUtyBmB1QCcreHQBqwf4pKw/exec",
  APP_NAME: "SB Notes Portal",
  APP_TAGLINE: "Your Academic Notes & Learning Hub",
  VERSION: "8.0.0",
  HEARTBEAT_INTERVAL: 45000,   // ms (30-60s)
  SESSION_KEY: "sbn_token",
  ADMIN_SESSION_KEY: "sbn_admin_token",
  THEME_KEY: "sbn_theme",
  USER_KEY: "sbn_user",
  ADMIN_KEY: "sbn_admin"
};

// Expose for non-module scripts.
window.CONFIG = CONFIG;
