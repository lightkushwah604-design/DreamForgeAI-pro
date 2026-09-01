/* DreamForge AI V6 configuration.
   For local Termux use: http://localhost:8000
   For production, set this to your HTTPS backend URL.
*/
window.DREAMFORGE_API = window.DREAMFORGE_API || "http://localhost:8000";

/* Optional Google AdSense. Keep empty until you have your own approved publisher/slot IDs. */
window.DREAMFORGE_ADS = {
  enabled: false,
  client: "ca-pub-REPLACE_WITH_YOUR_PUBLISHER_ID",
  slots: {
    top: "REPLACE_WITH_TOP_SLOT_ID",
    chat: "REPLACE_WITH_CHAT_SLOT_ID"
  }
};
