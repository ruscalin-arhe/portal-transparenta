/** Detectie boti / crawlers pe User-Agent (si optional pe path). */

const BOT_UA =
  /bot|crawl|spider|slurp|facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegram|discordbot|preview|embedly|quora|pinterest|redditbot|applebot|semrush|ahrefs|mj12bot|dotbot|rogerbot|bytespider|gptbot|claudebot|anthropic|chatgpt|perplexity|bingpreview|yandex|baidu|duckduck|ia_archiver|wget|curl\/|python-requests|go-http-client|java\/|scrapy|headless|phantom|selenium|puppeteer|playwright/i;

const BOT_PATH =
  /^\/(api\/analytics|.well-known|favicon\.ico|robots\.txt|sitemap)/i;

export function isBotUserAgent(ua: string | null | undefined): boolean {
  if (!ua || !ua.trim()) return false;
  return BOT_UA.test(ua);
}

export function isNoisePath(path: string): boolean {
  return BOT_PATH.test(path);
}

/** true = nu inregistra PageView */
export function shouldSkipTracking(opts: {
  userAgent: string | null;
  path: string;
}): boolean {
  if (isNoisePath(opts.path)) return true;
  if (isBotUserAgent(opts.userAgent)) return true;
  return false;
}
