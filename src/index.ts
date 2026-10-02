interface Env {
  BACKEND_HEALTH_URL: string;
}

export default {
  async scheduled(_controller: unknown, env: Env): Promise<void> {
    if (!env.BACKEND_HEALTH_URL) {
      console.error("BACKEND_HEALTH_URL is not configured.");
      return;
    }

    try {
      const response = await fetch(env.BACKEND_HEALTH_URL, {
        method: "GET",
        headers: { "User-Agent": "ByteProwler-Backend-Keepalive/1.0" },
        signal: AbortSignal.timeout(60_000),
      });

      console.log(`Backend health HTTP status: ${response.status}`);
      if (!response.ok) {
        console.error("Backend health request returned a non-success status.");
      }
      await response.body?.cancel();
    } catch {
      // Error messages may contain the URL or other sensitive information.
      console.error("Backend health request failed or timed out.");
    }
  },

  fetch(): Response {
    return new Response("ByteProwler backend keepalive worker is online.");
  },
};
