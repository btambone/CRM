import { Resend } from "resend";

let client: Resend | null = null;

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

function getClient(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error(
      "Email isn't set up yet. Add RESEND_API_KEY and EMAIL_FROM to server/.env, then restart the server."
    );
  }
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.EMAIL_FROM) {
    throw new Error(
      "Email isn't set up yet. Add RESEND_API_KEY and EMAIL_FROM to server/.env, then restart the server."
    );
  }
  const resend = getClient();
  const fromName = process.env.EMAIL_FROM_NAME || "Inflate AI";
  const { error } = await resend.emails.send({
    from: `${fromName} <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  });
  if (error) throw new Error(error.message || "Failed to send email");
}

export interface MergeContact {
  first_name: string;
  last_name: string;
  email: string | null;
  company_name?: string | null;
}

export function mergeTemplate(template: string, contact: MergeContact): string {
  return template
    .replace(/\{\{\s*first_name\s*\}\}/gi, contact.first_name || "")
    .replace(/\{\{\s*last_name\s*\}\}/gi, contact.last_name || "")
    .replace(/\{\{\s*full_name\s*\}\}/gi, `${contact.first_name || ""} ${contact.last_name || ""}`.trim())
    .replace(/\{\{\s*email\s*\}\}/gi, contact.email || "")
    .replace(/\{\{\s*company_name\s*\}\}/gi, contact.company_name || "");
}
