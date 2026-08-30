import nodemailer from "nodemailer";

function mailConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const configuredPassword = process.env.SMTP_PASSWORD;
  if (!host || !user || !configuredPassword)
    throw new Error(
      "Email delivery is not configured. Add SMTP_HOST, SMTP_USER, and SMTP_PASSWORD.",
    );
  // Google displays app passwords in groups of four. Those spaces are not
  // part of the SMTP credential.
  const pass = /(^|\.)gmail\.com$/i.test(host)
    ? configuredPassword.replace(/\s+/g, "")
    : configuredPassword;
  return {
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  };
}

export async function sendVerificationEmail(email: string, code: string) {
  const transporter = nodemailer.createTransport(mailConfig());
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Your SecurePath Bank verification code",
    text: `Your SecurePath Bank verification code is ${code}. It expires in 10 minutes. If you did not request this code, ignore this email.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;color:#0a1728"><div style="font-size:13px;font-weight:700;letter-spacing:3px;color:#0a1728">SECUREPATH BANK</div><h1 style="font-size:28px;margin:28px 0 10px">Verify your email</h1><p style="color:#66736b;line-height:1.7">Use this verification code to finish creating your SecurePath Bank account:</p><div style="margin:26px 0;padding:20px;text-align:center;background:#f1f4f9;border-radius:8px;font-size:32px;font-weight:700;letter-spacing:10px;color:#0a1728">${code}</div><p style="color:#66736b;font-size:13px;line-height:1.7">This code expires in 10 minutes. Never share it with anyone.</p></div>`,
  });
}

export async function sendAccountReadyEmail(email: string) {
  const transporter = nodemailer.createTransport(mailConfig());
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Your SecurePath Bank account is ready",
    text: "Your email is verified and your secure banking account is ready. You can now sign in to SecurePath Bank.",
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;color:#0a1728"><div style="font-size:13px;font-weight:700;letter-spacing:3px;color:#0a1728">SECUREPATH BANK</div><h1 style="font-size:28px;margin:28px 0 10px">Your email is verified</h1><p style="color:#66736b;line-height:1.7">Your secure banking account is ready. You can now sign in and manage your SecurePath Bank account.</p><a href="${process.env.APP_URL || "http://localhost:3000"}/login" style="display:inline-block;margin:22px 0;padding:14px 22px;border-radius:6px;background:#0a1728;color:white;text-decoration:none;font-weight:700">Sign in to SecurePath Bank</a></div>`,
  });
}

export async function sendKycApprovalEmail(email: string, firstName?: string) {
  const loginUrl = `${process.env.APP_URL || "http://localhost:3000"}/login`;
  const greeting = firstName ? `Hello ${firstName},` : "Hello,";
  const transporter = nodemailer.createTransport(mailConfig());
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Your SecurePath Bank identity verification was successful",
    text: `${greeting}\n\nYour submitted government ID verification has been successful. Log in to start transacting: ${loginUrl}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;color:#0a1728"><div style="font-size:13px;font-weight:700;letter-spacing:3px;color:#0a1728">SECUREPATH BANK</div><h1 style="font-size:28px;margin:28px 0 10px">Identity verification successful</h1><p style="color:#66736b;line-height:1.7">${greeting}</p><p style="color:#66736b;line-height:1.7">Your submitted government ID verification has been successful. Log in to start transacting.</p><a href="${loginUrl}" style="display:inline-block;margin:22px 0;padding:14px 22px;border-radius:6px;background:#0a1728;color:white;text-decoration:none;font-weight:700">Log in to SecurePath Bank</a></div>`,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${process.env.APP_URL || "http://localhost:3000"}/reset-password?token=${encodeURIComponent(token)}`;
  const transporter = nodemailer.createTransport(mailConfig());
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Reset your SecurePath Bank password",
    text: `Reset your SecurePath Bank password: ${url}. This link expires in 30 minutes.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;color:#0a1728"><div style="font-size:13px;font-weight:700;letter-spacing:3px;color:#0a1728">SECUREPATH BANK</div><h1 style="font-size:28px;margin:28px 0 10px">Reset your password</h1><p style="color:#66736b;line-height:1.7">Use the secure button below to choose a new password. This link expires in 30 minutes.</p><a href="${url}" style="display:inline-block;margin:22px 0;padding:14px 22px;border-radius:6px;background:#0a1728;color:white;text-decoration:none;font-weight:700">Reset password</a><p style="color:#66736b;font-size:13px">If you did not request this, you can safely ignore this email.</p></div>`,
  });
}

export async function sendTransactionHistoryEmail({
  email,
  customerName,
  pdf,
  from,
  to,
}: {
  email: string;
  customerName: string;
  pdf: Buffer;
  from: string;
  to: string;
}) {
  const transporter = nodemailer.createTransport(mailConfig());
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Your SecurePath Bank transaction history is ready",
    text: `Hello ${customerName}, your transaction history for ${from} to ${to} is ready. Download the attached PDF for your records.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;color:#0a1728"><div style="font-size:13px;font-weight:700;letter-spacing:3px;color:#0a1728">SECUREPATH BANK</div><h1 style="font-size:26px;margin:28px 0 10px">Transaction history ready</h1><p style="color:#66736b;line-height:1.7">Hello ${customerName}, your transaction history for ${from} to ${to} has been generated. Download the attached PDF and keep it for your records.</p></div>`,
    attachments: [
      {
        filename: `securepathbank-transaction-history-${from}-to-${to}.pdf`,
        content: pdf,
        contentType: "application/pdf",
      },
    ],
  });
}

export async function sendCampaignEmail({
  email,
  firstName,
  title,
  message,
  actionUrl,
}: {
  email: string;
  firstName: string;
  title: string;
  message: string;
  actionUrl?: string;
}) {
  const transporter = nodemailer.createTransport(mailConfig());
  const destination = actionUrl
    ? `${process.env.APP_URL || "http://localhost:3000"}${actionUrl}`
    : `${process.env.APP_URL || "http://localhost:3000"}/dashboard`;
  const safeTitle = escapeEmailHtml(title);
  const safeMessage = escapeEmailHtml(message).replace(/\n/g, "<br>");
  const safeName = escapeEmailHtml(firstName || "Customer");
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: title,
    text: `Hello ${firstName || "Customer"},\n\n${message}\n\nOpen SecurePath Bank: ${destination}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:540px;margin:auto;padding:32px;color:#0a1728"><div style="font-size:13px;font-weight:700;letter-spacing:3px;color:#0a1728">SECUREPATH BANK</div><h1 style="font-size:27px;margin:28px 0 12px">${safeTitle}</h1><p style="color:#66736b;line-height:1.7">Hello ${safeName},</p><p style="color:#66736b;line-height:1.7">${safeMessage}</p><a href="${destination}" style="display:inline-block;margin:22px 0;padding:14px 22px;border-radius:6px;background:#0a1728;color:white;text-decoration:none;font-weight:700">Open SecurePath Bank</a></div>`,
  });
}

function escapeEmailHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ] || character,
  );
}

export async function sendTransferVerificationEmail({
  email,
  reference,
  stage,
  event,
}: {
  email: string;
  reference: string;
  stage: "compliance" | "tax" | "cot" | "transfer";
  event: "required" | "verified" | "pending";
}) {
  const labels = {
    compliance: "Compliance code",
    tax: "Tax code",
    cot: "COT code",
    transfer: "Transfer",
  } as const;
  const label = labels[stage];
  const supportUrl = `${process.env.APP_URL || "http://localhost:3000"}/dashboard/support`;
  const subject =
    event === "required"
      ? `${label} required for transfer ${reference}`
      : event === "verified"
        ? `${label} entered successfully`
        : `Transfer ${reference} is pending`;
  const message =
    event === "required"
      ? `A ${label.toLowerCase()} is required to continue transfer ${reference}. Contact customer support to obtain assistance.`
      : event === "verified"
        ? `The ${label.toLowerCase()} for transfer ${reference} was entered successfully.`
        : `Transfer pending. Please contact our customer support for further assistance. Reference: ${reference}.`;
  const transporter = nodemailer.createTransport(mailConfig());
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject,
    text: `${message} Customer support: ${supportUrl}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:540px;margin:auto;padding:32px;color:#0a1728"><div style="font-size:13px;font-weight:700;letter-spacing:3px;color:#0a1728">SECUREPATH BANK</div><h1 style="font-size:27px;margin:28px 0 12px">${subject}</h1><p style="color:#66736b;line-height:1.7">${message}</p><a href="${supportUrl}" style="display:inline-block;margin:22px 0;padding:14px 22px;border-radius:6px;background:#0a1728;color:white;text-decoration:none;font-weight:700">Contact customer support</a></div>`,
  });
}

export async function sendCreditNotificationEmail({
  email,
  amount,
  currency,
  reference,
  channel,
  balanceAfter,
  reason,
}: {
  email: string;
  amount: string;
  currency: string;
  reference: string;
  channel: string;
  balanceAfter?: string;
  reason?: string;
}) {
  const transporter = nodemailer.createTransport(mailConfig());
  const subject = `${amount} ${currency} credited to your SecurePath Bank account`;
  const processedAt = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "long",
    timeZone: process.env.APP_TIMEZONE || "Africa/Lagos",
  }).format(new Date());
  const message = `${amount} ${currency} was credited to your ${channel}.`;
  const balanceLine = balanceAfter
    ? ` Balance after credit: ${balanceAfter} ${currency}.`
    : "";
  const reasonLine = reason ? ` Description: ${reason}.` : "";
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject,
    text: `SECUREPATH BANK TRANSACTION RECEIPT\n\nStatus: Successful\nType: Credit\nAmount: ${amount} ${currency}\nDestination: ${channel}\nReference: ${reference}\nProcessed: ${processedAt}${balanceLine}${reasonLine}\n\nIf you do not recognize this transaction, contact SecurePath Bank customer support immediately.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:580px;margin:auto;padding:32px;color:#0a1728;position:relative;overflow:hidden"><div style="position:absolute;inset:170px 0 auto;text-align:center;font-size:64px;font-weight:800;letter-spacing:8px;color:#0a1728;opacity:.045;transform:rotate(-28deg)">SECUREPATH BANK</div><div style="font-size:13px;font-weight:700;letter-spacing:3px;color:#0a1728">SECUREPATH BANK</div><h1 style="font-size:28px;margin:28px 0 8px">Transaction receipt</h1><p style="margin:0;color:#66736b;line-height:1.7">${message}</p><div style="margin:24px 0;padding:22px;background:#f1f4f9;border-radius:10px"><div style="font-size:28px;font-weight:700;color:#0a1728">${amount} ${currency}</div><div style="margin-top:8px;font-size:13px;font-weight:700;color:#0a1728">SUCCESSFUL</div></div><table style="width:100%;border-collapse:collapse;font-size:14px"><tr><td style="padding:11px 0;color:#66736b;border-bottom:1px solid #e5e9e6">Transaction type</td><td style="padding:11px 0;text-align:right;font-weight:700;border-bottom:1px solid #e5e9e6">Credit</td></tr><tr><td style="padding:11px 0;color:#66736b;border-bottom:1px solid #e5e9e6">Destination</td><td style="padding:11px 0;text-align:right;font-weight:700;border-bottom:1px solid #e5e9e6">${channel}</td></tr><tr><td style="padding:11px 0;color:#66736b;border-bottom:1px solid #e5e9e6">Reference</td><td style="padding:11px 0;text-align:right;font-weight:700;border-bottom:1px solid #e5e9e6">${reference}</td></tr><tr><td style="padding:11px 0;color:#66736b;border-bottom:1px solid #e5e9e6">Processed</td><td style="padding:11px 0;text-align:right;font-weight:700;border-bottom:1px solid #e5e9e6">${processedAt}</td></tr>${balanceAfter ? `<tr><td style="padding:11px 0;color:#66736b;border-bottom:1px solid #e5e9e6">Balance after credit</td><td style="padding:11px 0;text-align:right;font-weight:700;border-bottom:1px solid #e5e9e6">${balanceAfter} ${currency}</td></tr>` : ""}${reason ? `<tr><td style="padding:11px 0;color:#66736b">Description</td><td style="padding:11px 0;text-align:right;font-weight:700">${reason}</td></tr>` : ""}</table><p style="margin-top:26px;color:#66736b;font-size:13px;line-height:1.7">If you do not recognize this transaction, contact SecurePath Bank customer support immediately.</p></div>`,
  });
}
