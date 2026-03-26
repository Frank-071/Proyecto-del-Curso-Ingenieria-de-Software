import httpx
import logging
from typing import List, Dict, Optional
import base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import aiosmtplib
from app.core.exceptions import BusinessError
from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_email_smtp(to_email: str, subject: str, body: str, plain_text_body: str = None, attachments: Optional[List[Dict]] = None):
    msg = MIMEMultipart('alternative')
    msg['From'] = settings.FROM_EMAIL
    msg['To'] = to_email
    msg['Subject'] = subject

    if plain_text_body:
        msg.attach(MIMEText(plain_text_body, 'plain', 'utf-8'))
    else:
        msg.attach(MIMEText("Revisa tu correo en formato HTML", 'plain', 'utf-8'))
    
    msg.attach(MIMEText(body, 'html', 'utf-8'))

    if attachments:
        for att in attachments:
            part = MIMEBase('application', 'octet-stream')
            decoded_content = base64.b64decode(att["content"])
            part.set_payload(decoded_content)
            encoders.encode_base64(part)
            part.add_header(
                'Content-Disposition',
                f'attachment; filename= {att.get("filename", "adjunto.png")}'
            )
            msg.attach(part)

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.GMAIL_SMTP_HOST,
            port=settings.GMAIL_SMTP_PORT,
            username=settings.GMAIL_SMTP_USER,
            password=settings.GMAIL_SMTP_PASS,
            use_tls=(settings.GMAIL_SMTP_PORT == 465),
            timeout=10.0
        )
        logger.info(f"Correo enviado por Gmail SMTP a {to_email}")
    except Exception as e:
        logger.error(f"Error enviando correo por Gmail SMTP a {to_email}: {str(e)}")
        raise


async def send_email(to_email: str, subject: str, body: str, plain_text_body: str = None, attachments: Optional[List[Dict]] = None):
    message = {
        "personalizations": [{"to": [{"email": to_email}]}],
        "from": {"email": settings.FROM_EMAIL},
        "subject": subject,
        "content": [
            {"type": "text/plain", "value": plain_text_body or "Revisa tu correo en formato HTML"},
            {"type": "text/html", "value": body}
        ]
    }

    if attachments:
        message["attachments"] = []
        for att in attachments:
            message["attachments"].append({
                "content": att["content"],
                "filename": att.get("filename", "adjunto.png"),
                "type": att.get("type", "image/png"),
                "disposition": "attachment"
            })
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.sendgrid.com/v3/mail/send",
                headers={
                    "Authorization": f"Bearer {settings.SMTP_PASS}",
                    "Content-Type": "application/json"
                },
                json=message,
                timeout=10.0
            )
            response.raise_for_status()
            logger.info(f"Correo enviado por SendGrid a {to_email} | Status: {response.status_code}")
    except (httpx.HTTPStatusError, httpx.TimeoutException, Exception) as e:
        error_msg = f"Error con SendGrid para {to_email}: {str(e)}"
        if isinstance(e, httpx.HTTPStatusError):
            error_text = e.response.text if hasattr(e.response, 'text') else str(e)
            logger.warning(f"{error_msg} - {e.response.status_code} - {error_text}, usando SMTP como fallback")
        else:
            logger.warning(f"{error_msg}, usando SMTP como fallback")
        
        try:
            await send_email_smtp(to_email, subject, body, plain_text_body, attachments)
        except Exception as smtp_error:
            logger.error(f"Fallback SMTP también falló para {to_email}: {str(smtp_error)}")
            raise BusinessError("Error enviando correo (SendGrid y SMTP fallaron)", 500)