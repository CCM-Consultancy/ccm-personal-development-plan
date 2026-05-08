const SUPA_URL = 'https://exqpnofliridwdrcyien.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4cXBub2ZsaXJpZHdkcmN5aWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MDYwODgsImV4cCI6MjA5MTk4MjA4OH0.xVkvptHGnTDAoQ288uQiAHSct2qpREMzY-2dRdGwt8M';
const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = 'CCM Consultancy <onboarding@resend.dev>';
const APP_URL = 'https://personal-development-plan.netlify.app';

exports.handler = async function() {
  if (!RESEND_KEY) {
    return { statusCode: 500, body: 'RESEND_API_KEY not set' };
  }

  const res = await fetch(`${SUPA_URL}/rest/v1/pdp_users?select=email,name,start_date,workshop`, {
    headers: {
      'apikey': SUPA_KEY,
      'Authorization': `Bearer ${SUPA_KEY}`
    }
  });
  const users = await res.json();
  if (!Array.isArray(users)) {
    return { statusCode: 500, body: 'Failed to fetch users' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sent = [];

  for (const user of users) {
    if (!user.email || !user.start_date) continue;
    const start = new Date(user.start_date);
    start.setHours(0, 0, 0, 0);
    const daysDiff = Math.round((today - start) / (1000 * 60 * 60 * 24));

    let subject = null;
    let dayLabel = null;
    let bodyText = null;

    if (daysDiff === 30) {
      subject = 'Your 30-Day PDP Check-In';
      dayLabel = '30';
      bodyText = 'It has now been 30 days since you started your Personal Development Plan - an important milestone. This is a gentle reminder to log in, update your habit tracking, and reflect on your progress so far. Consistent check-ins are a strong predictor of long-term success, and your continued commitment is key to maintaining momentum.';
    } else if (daysDiff === 60) {
      subject = 'Your 60-Day PDP Check-In';
      dayLabel = '60';
      bodyText = 'It has now been 60 days since you started your Personal Development Plan - well done for building momentum. This is a gentle reminder to log in, review your habits, and reflect on the progress you have made so far. Staying consistent with small daily actions is one of the best ways to keep moving forward.';
    } else if (daysDiff === 90) {
      subject = 'Your 90-Day PDP Check-In';
      dayLabel = '90';
      bodyText = 'It has now been 90 days since you started your Personal Development Plan - an important point in your journey. This is a friendly reminder to log in, review your habit tracking, and reflect on how far you have come. Sustaining progress takes consistency, and your commitment over the past 90 days is something to be proud of. As you review your progress, take a moment to plan your next steps and consider what you would like to focus on next.';
    }

    if (!subject) continue;

    const firstName = (user.name || 'there').split(' ')[0];
    const workshopName = user.workshop || 'Personal Development Plan';

    const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f3f0;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3f0;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:#ffffff;padding:24px 32px;border-bottom:3px solid #D4231A;">
            <p style="margin:0;font-size:13px;font-weight:700;color:#D4231A;text-transform:uppercase;letter-spacing:1px;">${workshopName}</p>
            <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#1a1a1a;">Personal Development Plan Check-In</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 32px 24px;">
            <p style="margin:0 0 20px;font-size:16px;color:#1a1a1a;">Hi ${firstName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#333;line-height:1.6;">${bodyText}</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:8px 0 28px;">
                  <a href="${APP_URL}" style="background:#D4231A;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:6px;font-size:15px;font-weight:bold;display:inline-block;mso-padding-alt:0;line-height:normal;"><!--[if mso]><i style="letter-spacing:34px;mso-font-width:-100%;mso-text-raise:30pt">&nbsp;</i><![endif]-->Check In<!--[if mso]><i style="letter-spacing:34px;mso-font-width:-100%">&nbsp;</i><![endif]--></a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:14px;color:#555;">Warm regards,</p>
            <p style="margin:4px 0 0;font-size:14px;font-weight:bold;color:#1a1a1a;">CCM Consultancy</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f5f3f0;padding:16px 32px;text-align:center;border-top:1px solid #e8e5e2;">
            <p style="margin:0;font-size:11px;color:#aaa;">CCM Consultancy - Personal Development Plan</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from: FROM, to: [user.email], subject: subject, html: html })
    });
    sent.push(`${user.email} (day ${dayLabel})`);
  }

  return { statusCode: 200, body: sent.length ? `Sent: ${sent.join(', ')}` : 'No reminders due today' };
};
