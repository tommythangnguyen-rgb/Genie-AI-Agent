#!/usr/bin/env node
/**
 * Manually triggers a regulation update fetch.
 * Run with: npm run regulations:refresh
 * The dev server must be running (npm run dev).
 */

const secret = process.env.CRON_SECRET ?? "";
const port = process.env.PORT ?? "3000";
const url = `http://localhost:${port}/api/cron/refresh-regulations`;

console.log(`Triggering regulation refresh at ${url} …`);

fetch(url, {
  method: "POST",
  headers: secret ? { Authorization: `Bearer ${secret}` } : {},
})
  .then(async (res) => {
    const body = await res.json();
    if (res.ok) {
      console.log("✓ Success:", JSON.stringify(body, null, 2));
    } else {
      console.error("✗ Failed:", res.status, JSON.stringify(body, null, 2));
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error("✗ Request error:", err.message);
    console.error("  Is the dev server running? (npm run dev)");
    process.exit(1);
  });
