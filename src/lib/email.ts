import { Resend } from "resend";

import "server-only";
import { env } from "@/lib/env";
import { MagicLinkEmail } from "@/emails/magic-link";

export const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const from = env.EMAIL_FROM ?? "noreply@example.com";

export async function sendMagicLinkEmail({ to, url }: { to: string; url: string }) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set. Magic link:", url);
    return;
  }
  const { error } = await resend.emails.send({
    from,
    to,
    subject: "サインインリンク",
    react: MagicLinkEmail({ url }),
  });
  if (error) {
    throw new Error(`Failed to send magic link: ${error.message}`);
  }
}

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
}) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set. Skipping send.");
    return;
  }
  const { error } = await resend.emails.send({ from, to, subject, react });
  if (error) throw new Error(error.message);
}
