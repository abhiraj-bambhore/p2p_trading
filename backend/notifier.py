import logging
import aiosmtplib
from email.message import EmailMessage
import config

log = logging.getLogger("notifier")

async def send_safety_alert(current_spend: float, limit: float):
    """Sends a Gmail alert when spending reaches the threshold."""
    if not config.SMTP_USER or not config.SMTP_PASS or not config.ALERT_EMAIL:
        log.warning("⚠️ Email alerts skipped: SMTP credentials or ALERT_EMAIL not configured in .env")
        return False

    percentage = (current_spend / limit) * 100
    
    msg = EmailMessage()
    msg["Subject"] = f"⚠️ CRITICAL: P2P Solar Safety Alert ({percentage:.1f}%)"
    msg["From"] = f"Flux-Agent Node <{config.SMTP_USER}>"
    msg["To"] = config.ALERT_EMAIL

    body = f"""
    <h3>🚨 Energy Orchestrator Safety Alert</h3>
    <p>Your P2P energy trading expenditure has reached a critical threshold.</p>
    <hr/>
    <ul>
        <li><b>Current Spending:</b> ₹{current_spend:.2f}</li>
        <li><b>Daily Limit:</b> ₹{limit:.2f}</li>
        <li><b>Usage:</b> {percentage:.1f}%</li>
    </ul>
    <p>Automated circuit breakers will engage if the limit is exceeded.</p>
    <p><i>Sent autonomously by Project Flux-Agent Core</i></p>
    """
    msg.add_alternative(body, subtype="html")

    try:
        await aiosmtplib.send(
            msg,
            hostname=config.SMTP_SERVER,
            port=config.SMTP_PORT,
            username=config.SMTP_USER,
            password=config.SMTP_PASS,
            use_tls=False,
            start_tls=True,
        )
        log.info(f"✅ Safety alert email sent to {config.ALERT_EMAIL}")
        return True
    except Exception as e:
        log.error(f"❌ Failed to send alert email: {e}")
        return False
