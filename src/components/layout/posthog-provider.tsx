"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as Provider } from "posthog-js/react";

import { getPostHogHost, getPostHogKey, isPostHogEnabled } from "@/lib/posthog-config";

const posthogKey = getPostHogKey();
if (typeof window !== "undefined" && posthogKey && !posthog.__loaded) {
  posthog.init(posthogKey, {
    api_host: getPostHogHost(),
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
  });
}

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || !isPostHogEnabled()) return;
    const url = new URL(pathname, window.origin);
    searchParams?.forEach((value, key) => {
      url.searchParams.append(key, value);
    });
    posthog.capture("$pageview", { $current_url: url.toString() });
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  if (!isPostHogEnabled()) {
    return <>{children}</>;
  }
  return (
    <Provider client={posthog}>
      <PageviewTracker />
      {children}
    </Provider>
  );
}
