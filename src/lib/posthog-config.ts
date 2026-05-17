const DEFAULT_HOST = "https://us.i.posthog.com";

export function getPostHogKey(): string | undefined {
  return process.env.NEXT_PUBLIC_POSTHOG_KEY || undefined;
}

export function getPostHogHost(): string {
  return process.env.NEXT_PUBLIC_POSTHOG_HOST || DEFAULT_HOST;
}

export function isPostHogEnabled(): boolean {
  return Boolean(getPostHogKey());
}
