export function welcomeEmail({ name }: { name: string }): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome!</title>
</head>
<body style="margin:0;padding:0;background:#F6F4EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F6F4EE;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#FFFFFF;border-radius:16px;border:1px solid #E2E0DA;overflow:hidden;">
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #E2E0DA;">
              <span style="font-size:16px;font-weight:500;color:#111211;letter-spacing:-0.015em;">YourApp</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <div style="width:48px;height:48px;border-radius:999px;background:#EEF2EB;display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px;font-size:22px;">👋</div>
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:500;color:#111211;letter-spacing:-0.02em;">Welcome aboard!</h1>
              <p style="margin:0 0 8px;font-size:15px;color:#6B6E67;line-height:1.6;">Hi ${name},</p>
              <p style="margin:0 0 32px;font-size:15px;color:#6B6E67;line-height:1.6;">
                Your account is ready. We&apos;re glad you&apos;re here. Jump in and start exploring.
              </p>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/home"
                style="display:inline-block;background:#111211;color:#F6F4EE;padding:14px 28px;border-radius:999px;font-size:15px;font-weight:500;text-decoration:none;letter-spacing:-0.01em;">
                Get started
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #E2E0DA;">
              <p style="margin:0;font-size:12px;color:#9B9E97;">You received this because you created an account. If this wasn&apos;t you, you can safely ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function passwordChangedEmail({ name }: { name: string }): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password changed</title>
</head>
<body style="margin:0;padding:0;background:#F6F4EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F6F4EE;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#FFFFFF;border-radius:16px;border:1px solid #E2E0DA;overflow:hidden;">
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #E2E0DA;">
              <span style="font-size:16px;font-weight:500;color:#111211;letter-spacing:-0.015em;">YourApp</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <div style="width:48px;height:48px;border-radius:999px;background:#EEF2EB;display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px;font-size:22px;">🔒</div>
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:500;color:#111211;letter-spacing:-0.02em;">Password changed</h1>
              <p style="margin:0 0 8px;font-size:15px;color:#6B6E67;line-height:1.6;">Hi ${name},</p>
              <p style="margin:0 0 32px;font-size:15px;color:#6B6E67;line-height:1.6;">
                Your account password was successfully changed. If you made this change, no action is needed.
                If you <strong style="color:#111211;">didn&apos;t</strong> make this change, reset your password immediately.
              </p>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/forgotpassword"
                style="display:inline-block;background:#111211;color:#F6F4EE;padding:14px 28px;border-radius:999px;font-size:15px;font-weight:500;text-decoration:none;letter-spacing:-0.01em;">
                Reset password
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #E2E0DA;">
              <p style="margin:0;font-size:12px;color:#9B9E97;">This is a security notification for your account.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function resetPasswordEmail({
    name,
    resetUrl,
}: {
    name: string
    resetUrl: string
}): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background:#F6F4EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F6F4EE;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#FFFFFF;border-radius:16px;border:1px solid #E2E0DA;overflow:hidden;">
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #E2E0DA;">
              <span style="font-size:16px;font-weight:500;color:#111211;letter-spacing:-0.015em;">YourApp</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:500;color:#111211;letter-spacing:-0.02em;">Reset your password</h1>
              <p style="margin:0 0 8px;font-size:15px;color:#6B6E67;line-height:1.6;">Hi ${name},</p>
              <p style="margin:0 0 32px;font-size:15px;color:#6B6E67;line-height:1.6;">
                Click the button below to reset your password. This link expires in <strong style="color:#111211;">1 hour</strong>.
                If you didn&apos;t request this, you can safely ignore this email.
              </p>
              <a href="${resetUrl}" style="display:inline-block;background:#111211;color:#F6F4EE;padding:14px 28px;border-radius:999px;font-size:15px;font-weight:500;text-decoration:none;letter-spacing:-0.01em;">
                Reset Password
              </a>
              <p style="margin:32px 0 0;font-size:13px;color:#9B9E97;line-height:1.6;">
                Or copy this link:<br />
                <a href="${resetUrl}" style="color:#6A7E5F;word-break:break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #E2E0DA;">
              <p style="margin:0;font-size:12px;color:#9B9E97;">You received this email because a password reset was requested for your account.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function verifyEmailTemplate({
    name,
    verifyUrl,
}: {
    name: string
    verifyUrl: string
}): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your email</title>
</head>
<body style="margin:0;padding:0;background:#F6F4EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F6F4EE;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#FFFFFF;border-radius:16px;border:1px solid #E2E0DA;overflow:hidden;">
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #E2E0DA;">
              <span style="font-size:16px;font-weight:500;color:#111211;letter-spacing:-0.015em;">YourApp</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <div style="width:48px;height:48px;border-radius:999px;background:#EEF2EB;display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px;">
                <span style="font-size:22px;">✉️</span>
              </div>
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:500;color:#111211;letter-spacing:-0.02em;">Verify your email</h1>
              <p style="margin:0 0 8px;font-size:15px;color:#6B6E67;line-height:1.6;">Hi ${name},</p>
              <p style="margin:0 0 32px;font-size:15px;color:#6B6E67;line-height:1.6;">
                Click the button below to verify your email address and activate your account.
                This link expires in <strong style="color:#111211;">24 hours</strong>.
              </p>
              <a href="${verifyUrl}" style="display:inline-block;background:#111211;color:#F6F4EE;padding:14px 28px;border-radius:999px;font-size:15px;font-weight:500;text-decoration:none;letter-spacing:-0.01em;">
                Verify Email
              </a>
              <p style="margin:32px 0 0;font-size:13px;color:#9B9E97;line-height:1.6;">
                Or copy this link:<br />
                <a href="${verifyUrl}" style="color:#6A7E5F;word-break:break-all;">${verifyUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #E2E0DA;">
              <p style="margin:0;font-size:12px;color:#9B9E97;">If you didn&apos;t create an account, you can safely ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
