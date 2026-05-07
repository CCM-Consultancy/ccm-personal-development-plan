const SUPA_URL = 'https://exqpnofliridwdrcyien.supabase.co';
const SUPA_KEY = process.env.SUPA_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4cXBub2ZsaXJpZHdkcmN5aWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MDYwODgsImV4cCI6MjA5MTk4MjA4OH0.xVkvptHGnTDAoQ288uQiAHSct2qpREMzY-2dRdGwt8M';eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4cXBub2ZsaXJpZHdkcmN5aWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MDYwODgsImV4cCI6MjA5MTk4MjA4OH0.xVkvp';

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = 'CCM Consultancy <onboarding@resend.dev>';
const APP_URL = 'https://personal-development-plan.netlify.app';

exports.handler = async function() {
  if (!RESEND_KEY) {
    return { statusCode: 500, body: 'RESEND_API_KEY not set' };
  }

  // Fetch all users from Supabase
  const res = await fetch(`${SUPA_URL}/rest/v1/pdp_users?select=email,name,start_date`, {
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

    if (daysDiff === 30) { subject = 'Your 30-Day PDP Check-In'; dayLabel = '30'; }
    else if (daysDiff === 60) { subject = 'Your 60-Day PDP Check-In'; dayLabel = '60'; }
    else if (daysDiff === 90) { subject = 'Your 90-Day PDP Check-In'; dayLabel = '90'; }

    if (!subject) continue;

    const firstName = (user.name || 'there').split(' ')[0];

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#D4231A;padding:20px 24px;">
          <p style="color:#fff;font-size:18px;font-weight:bold;margin:0;">CCM Consultancy</p>
        </div>
        <div style="padding:28px 24px;background:#ffffff;">
          <p style="font-size:16px;color:#1a1a1a;">Hi ${firstName},</p>
          <p style="color:#333;">It has been <strong>${dayLabel} days</strong> since you started your Personal Development Plan. This is your reminder to log in, track your habits, and reflect on your progress.</p>
          <p style="color:#333;">Consistent check-ins are one of the strongest predictors of success - well done for staying the course.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${APP_URL}" style="background:#D4231A;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:bold;">Open My PDP</a>
          </div>
          <p style="color:#888;font-size:13px;">If you have any questions, reach out to your CCM facilitator.</p>
        </div>
        <div style="background:#f5f3f0;padding:14px 24px;text-align:center;">
          <p style="color:#aaa;font-size:11px;margin:0;">CCM Consultancy - Personal Development Plan</p>
        </div>
      </div>`;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM,
        to: [user.email],
        subject: subject,
        html: html
      })
    });

    sent.push(`${user.email} (day ${dayLabel})`);
  }

  return {
    statusCode: 200,
    body: sent.length ? `Sent: ${sent.join(', ')}` : 'No reminders due today'
  };
};