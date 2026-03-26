from typing import Dict, List, Optional


def registration_email_html(validation_link: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verificación de Cuenta - PatasPepas</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #4b5563;
                background-color: #f9fafb;
                margin: 0;
                padding: 20px;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }}
            .header {{
                background: linear-gradient(135deg, #50bfa0 0%, #3a9d82 100%);
                padding: 40px 30px;
                text-align: center;
                color: white;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 800;
                letter-spacing: -0.5px;
            }}
            .header p {{
                margin: 8px 0 0 0;
                font-size: 16px;
                opacity: 0.9;
            }}
            .content {{
                padding: 40px 30px;
            }}
            .title {{
                font-size: 24px;
                font-weight: 700;
                color: #1f2937;
                text-align: center;
                margin: 0 0 16px 0;
            }}
            .description {{
                font-size: 16px;
                color: #4b5563;
                text-align: center;
                margin: 0 0 32px 0;
                line-height: 1.6;
            }}
            .button {{
                display: inline-block;
                background: linear-gradient(135deg, #50bfa0 0%, #3a9d82 100%);
                color: white !important;
                text-decoration: none !important;
                padding: 16px 32px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                text-align: center;
                margin: 0 auto 24px;
                display: block;
                width: fit-content;
                box-shadow: 0 4px 6px -1px rgba(80, 191, 160, 0.3);
                transition: all 0.2s;
                border: none;
            }}
            .button:hover {{
                transform: translateY(-1px);
                box-shadow: 0 6px 8px -1px rgba(80, 191, 160, 0.4);
                color: white !important;
            }}
            a {{
                color: white !important;
                text-decoration: none !important;
            }}
            a.button {{
                color: white !important;
                text-decoration: none !important;
            }}
            .warning {{
                background: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 8px;
                padding: 16px;
                margin: 24px 0;
            }}
            .warning-text {{
                color: #92400e;
                font-size: 14px;
                margin: 0;
                font-weight: 500;
            }}
            .footer {{
                background: #f9fafb;
                padding: 24px 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }}
            .footer p {{
                margin: 0;
                font-size: 14px;
                color: #6b7280;
            }}
            .logo {{
                font-size: 20px;
                font-weight: 800;
                color: white;
                margin-bottom: 8px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🎫 PatasPepas</div>
                <h1>¡Bienvenido!</h1>
                <p>Valida tu cuenta para comenzar</p>
            </div>
            
            <div class="content">
                <h2 class="title">Verifica tu cuenta</h2>
                <p class="description">
                    Gracias por registrarte en PatasPepas. Para completar tu registro y acceder a todos nuestros eventos, 
                    necesitas verificar tu cuenta haciendo clic en el botón de abajo.
                </p>
                
                <a href="{validation_link}" class="button">Verificar mi cuenta</a>
                
                <div class="warning">
                    <p class="warning-text">⚠️ Este enlace expira en 15 minutos por seguridad.</p>
                </div>
            </div>
            
            <div class="footer">
                <p>© 2025 PatasPepas. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    """

def password_reset_email_html(reset_link: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Restablecer Contraseña - PatasPepas</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #4b5563;
                background-color: #f9fafb;
                margin: 0;
                padding: 20px;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }}
            .header {{
                background: linear-gradient(135deg, #50bfa0 0%, #3a9d82 100%);
                padding: 40px 30px;
                text-align: center;
                color: white;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 800;
                letter-spacing: -0.5px;
            }}
            .header p {{
                margin: 8px 0 0 0;
                font-size: 16px;
                opacity: 0.9;
            }}
            .content {{
                padding: 40px 30px;
            }}
            .title {{
                font-size: 24px;
                font-weight: 700;
                color: #1f2937;
                text-align: center;
                margin: 0 0 16px 0;
            }}
            .description {{
                font-size: 16px;
                color: #4b5563;
                text-align: center;
                margin: 0 0 32px 0;
                line-height: 1.6;
            }}
            .button {{
                display: inline-block;
                background: linear-gradient(135deg, #50bfa0 0%, #3a9d82 100%);
                color: white !important;
                text-decoration: none !important;
                padding: 16px 32px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                text-align: center;
                margin: 0 auto 24px;
                display: block;
                width: fit-content;
                box-shadow: 0 4px 6px -1px rgba(80, 191, 160, 0.3);
                transition: all 0.2s;
                border: none;
            }}
            .button:hover {{
                transform: translateY(-1px);
                box-shadow: 0 6px 8px -1px rgba(80, 191, 160, 0.4);
                color: white !important;
            }}
            a {{
                color: white !important;
                text-decoration: none !important;
            }}
            a.button {{
                color: white !important;
                text-decoration: none !important;
            }}
            .warning {{
                background: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 8px;
                padding: 16px;
                margin: 24px 0;
            }}
            .warning-text {{
                color: #92400e;
                font-size: 14px;
                margin: 0;
                font-weight: 500;
            }}
            .footer {{
                background: #f9fafb;
                padding: 24px 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }}
            .footer p {{
                margin: 0;
                font-size: 14px;
                color: #6b7280;
            }}
            .logo {{
                font-size: 20px;
                font-weight: 800;
                color: white;
                margin-bottom: 8px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🎫 PatasPepas</div>
                <h1>Restablecer Contraseña</h1>
                <p>Recupera el acceso a tu cuenta</p>
            </div>
            
            <div class="content">
                <h2 class="title">¿Olvidaste tu contraseña?</h2>
                <p class="description">
                    No te preocupes, es normal. Hemos recibido una solicitud para restablecer la contraseña 
                    de tu cuenta en PatasPepas. Haz clic en el botón de abajo para crear una nueva contraseña.
                </p>
                
                <a href="{reset_link}" class="button">Restablecer contraseña</a>
                
                <div class="warning">
                    <p class="warning-text">⚠️ Este enlace expira en 15 minutos por seguridad.</p>
                </div>
            </div>
            
            <div class="footer">
                <p>© 2025 PatasPepas. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    """

def suspicious_device_alert_html(browser: str, os: str, device: str, device_model: str = None, location: str = None, timestamp_utc: str = None, timestamp_local: str = None, frontend_url: str = None) -> str:
    location_html = f'<div class="info-row"><span class="info-label">Ubicación:</span><span class="info-value">{location}</span></div>' if location else ''
    model_html = f'<div class="info-row"><span class="info-label">Modelo:</span><span class="info-value">{device_model}</span></div>' if device_model else ''
    timestamp_utc_html = f'<br><span style="font-size: 12px; color: #6b7280;">({timestamp_utc})</span>' if timestamp_local and timestamp_utc else ''
    
    return f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Alerta de Seguridad - PatasPepas</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #4b5563;
                background-color: #f9fafb;
                margin: 0;
                padding: 20px;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }}
            .header {{
                background: linear-gradient(135deg, #50bfa0 0%, #3a9d82 100%);
                padding: 40px 30px;
                text-align: center;
                color: white;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 800;
                letter-spacing: -0.5px;
            }}
            .header p {{
                margin: 8px 0 0 0;
                font-size: 16px;
                opacity: 0.9;
            }}
            .content {{
                padding: 40px 30px;
            }}
            .title {{
                font-size: 24px;
                font-weight: 700;
                color: #1f2937;
                text-align: center;
                margin: 0 0 16px 0;
            }}
            .description {{
                font-size: 16px;
                color: #4b5563;
                text-align: center;
                margin: 0 0 32px 0;
                line-height: 1.6;
            }}
            .alert-box {{
                background: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 8px;
                padding: 20px;
                margin: 24px 0;
            }}
            .alert-title {{
                color: #92400e;
                font-size: 18px;
                font-weight: 700;
                margin: 0 0 12px 0;
            }}
            .device-info {{
                background: white;
                border-radius: 6px;
                padding: 16px;
                margin: 16px 0;
            }}
            .info-row {{
                display: flex;
                flex-direction: column;
                padding: 12px 0;
                border-bottom: 1px solid #e5e7eb;
            }}
            .info-row:last-child {{
                border-bottom: none;
            }}
            .info-label {{
                font-weight: 600;
                color: #374151;
                margin-bottom: 4px;
                font-size: 14px;
            }}
            .info-value {{
                color: #1f2937;
                font-size: 15px;
                word-break: break-word;
            }}
            @media (min-width: 600px) {{
                .info-row {{
                    flex-direction: row;
                    justify-content: space-between;
                    align-items: center;
                }}
                .info-label {{
                    margin-bottom: 0;
                    margin-right: 16px;
                    min-width: 140px;
                }}
            }}
            .warning {{
                background: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 8px;
                padding: 16px;
                margin: 24px 0;
            }}
            .warning-text {{
                color: #92400e;
                font-size: 14px;
                margin: 0;
                font-weight: 500;
            }}
            .footer {{
                background: #f9fafb;
                padding: 24px 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }}
            .footer p {{
                margin: 0;
                font-size: 14px;
                color: #6b7280;
            }}
            .logo {{
                font-size: 20px;
                font-weight: 800;
                color: white;
                margin-bottom: 8px;
            }}
            .button {{
                display: inline-block;
                background: linear-gradient(135deg, #50bfa0 0%, #3a9d82 100%);
                color: white !important;
                text-decoration: none !important;
                padding: 16px 32px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                text-align: center;
                margin: 12px auto;
                display: block;
                width: 280px;
                max-width: 100%;
                box-shadow: 0 4px 6px -1px rgba(80, 191, 160, 0.3);
                transition: all 0.2s;
                border: none;
            }}
            .button:hover {{
                transform: translateY(-1px);
                box-shadow: 0 6px 8px -1px rgba(80, 191, 160, 0.4);
                color: white !important;
            }}
            .button-secondary {{
                background: linear-gradient(135deg, #50bfa0 0%, #3a9d82 100%);
                box-shadow: 0 4px 6px -1px rgba(80, 191, 160, 0.3);
            }}
            .button-secondary:hover {{
                transform: translateY(-1px);
                box-shadow: 0 6px 8px -1px rgba(80, 191, 160, 0.4);
            }}
            .buttons-container {{
                margin: 32px 0;
            }}
            a.button {{
                color: white !important;
                text-decoration: none !important;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🎫 PatasPepasSoft</div>
                <h1>⚠️ Alerta de Seguridad</h1>
                <p>Nuevo dispositivo detectado</p>
            </div>
            
            <div class="content">
                <h2 class="title">Nuevo inicio de sesión detectado</h2>
                <p class="description">
                    Se ha detectado un nuevo inicio de sesión en tu cuenta de PatasPepas desde un dispositivo 
                    que no reconocemos. Si fuiste tú, puedes ignorar este mensaje.
                </p>
                
                <div class="alert-box">
                    <p class="alert-title">📱 Detalles del dispositivo:</p>
                    <div class="device-info">
                        {location_html}
                        <div class="info-row">
                            <span class="info-label">Navegador:</span>
                            <span class="info-value">{browser}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Sistema operativo:</span>
                            <span class="info-value">{os}</span>
                        </div>
                        {model_html}
                        <div class="info-row">
                            <span class="info-label">Tipo de dispositivo:</span>
                            <span class="info-value">{device}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Fecha y hora:</span>
                            <span class="info-value">
                                {timestamp_local if timestamp_local else timestamp_utc}
                                {timestamp_utc_html}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="warning">
                    <p class="warning-text">
                        🔒 Si no fuiste tú quien inició sesión, sigue estos pasos para asegurar tu cuenta:
                    </p>
                </div>
                
                <div class="buttons-container">
                    <a href="{frontend_url}/perfil/micuenta?tab=contraseñas" class="button">
                        🔐 Paso 1: Cambiar mi contraseña
                    </a>
                    <a href="{frontend_url}/perfil" class="button button-secondary">
                        🚪 Paso 2: Cerrar todas las sesiones
                    </a>
                </div>
            </div>
            
            <div class="footer">
                <p>© 2025 PatasPepas. Todos los derechos reservados.</p>
                <p style="margin-top: 8px; font-size: 12px;">
                    Esta es una notificación automática de seguridad. Por favor, no respondas a este correo.
                </p>
            </div>
        </div>
    </body>
    </html>
    """


def evento_recordatorio_html(event_name: str, event_datetime: str, local_name: str = None, zona_nombre: str = None) -> str:
    return f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recordatorio de Evento - PatasPepas</title>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height:1.6; color:#4b5563; background-color:#f9fafb; margin:0; padding:20px; }}
            .container {{ max-width:600px; margin:0 auto; background:white; border-radius:12px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1); overflow:hidden; }}
            .header {{ background:linear-gradient(135deg,#50bfa0 0%,#3a9d82 100%); padding:30px; text-align:center; color:white; }}
            .header h1 {{ margin:0; font-size:24px; font-weight:800; }}
            .content {{ padding:30px; }}
            .title {{ font-size:20px; font-weight:700; color:#1f2937; margin:0 0 12px 0; text-align:center }}
            .info {{ background:#f3f4f6; padding:16px; border-radius:8px; margin-top:12px; }}
            .muted {{ color:#6b7280; font-size:14px }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div style="font-size:20px; font-weight:800">🎫 PatasPepas</div>
                <h1>Recordatorio de evento</h1>
            </div>
            <div class="content">
                <h2 class="title">{event_name}</h2>
                <p class="muted">{event_datetime}</p>
                {f'<p><strong>Lugar:</strong> {local_name}</p>' if local_name else ''}
                {f'<p><strong>Zona:</strong> {zona_nombre}</p>' if zona_nombre else ''}
                <div class="info">Te recordamos asistir con tu entrada impresa o digital.</div>
            </div>
        </div>
    </body>
    </html>
    """


def evento_agradecimiento_html(event_name: str, event_datetime: str, local_name: str = None) -> str:
    return f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Gracias por asistir - PatasPepas</title>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height:1.6; color:#4b5563; background-color:#f9fafb; margin:0; padding:20px; }}
            .container {{ max-width:600px; margin:0 auto; background:white; border-radius:12px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1); overflow:hidden; }}
            .header {{ background:linear-gradient(135deg,#50bfa0 0%,#3a9d82 100%); padding:30px; text-align:center; color:white; }}
            .header h1 {{ margin:0; font-size:24px; font-weight:800; }}
            .content {{ padding:30px; }}
            .title {{ font-size:20px; font-weight:700; color:#1f2937; margin:0 0 12px 0; text-align:center }}
            .muted {{ color:#6b7280; font-size:14px }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div style="font-size:20px; font-weight:800">🎫 PatasPepas</div>
                <h1>Gracias por asistir</h1>
            </div>
            <div class="content">
                <h2 class="title">{event_name}</h2>
                <p class="muted">{event_datetime}</p>
                {f'<p><strong>Lugar:</strong> {local_name}</p>' if local_name else ''}
                <p>Gracias por acompañarnos. Esperamos verte en próximos eventos.</p>
            </div>
        </div>
    </body>
    </html>
    """

def _format_date_for_email(dt_str: str) -> str:
    """Formatea una fecha ISO a formato día/mes/año hora AM/PM en español"""
    from datetime import datetime, timezone, timedelta
    
    if not dt_str:
        return ""
    
    try:
        # Parsear fecha ISO
        if dt_str.endswith('Z'):
            dt_str = dt_str[:-1] + '+00:00'
        dt_obj = datetime.fromisoformat(dt_str)
        
        # Si no tiene timezone, asumir UTC
        if dt_obj.tzinfo is None:
            dt_obj = dt_obj.replace(tzinfo=timezone.utc)
        
        # Convertir a hora local de Perú (UTC-5)
        peru_offset = timedelta(hours=-5)
        peru_tz = timezone(peru_offset)
        dt_local = dt_obj.astimezone(peru_tz)
        
        # Formato: día/mes/año hora:minutos AM/PM
        dia = dt_local.day
        mes = dt_local.month
        año = dt_local.year
        
        # Hora en formato 12 horas con AM/PM
        hora_12 = dt_local.strftime("%I:%M %p").lower()
        hora_12 = hora_12.replace("am", "AM").replace("pm", "PM")
        
        return f"{dia:02d}/{mes:02d}/{año} {hora_12}"
    except Exception:
        return dt_str

def entradas_email_html(cliente_id: int, entradas: list) -> str:
    items_html = ""

    for e in entradas:
        fecha_formateada = _format_date_for_email(e.get('eventDate', ''))
        items_html += f"""
            <tr>
                <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">
                    <strong>{e['eventName']}</strong><br>
                    <span style="font-size: 14px; color: #6b7280;">{fecha_formateada}</span>
                </td>
                <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">
                    {e['zone']}
                </td>
                <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">
                    {e['quantity']}
                </td>
                <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">
                    S/ {e['price']}
                </td>
            </tr>
        """

    return f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tus Entradas - PatasPepas</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background-color: #f9fafb;
                color: #4b5563;
                margin: 0;
                padding: 20px;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                overflow: hidden;
            }}
            .header {{
                background: linear-gradient(135deg, #50bfa0 0%, #3a9d82 100%);
                padding: 40px 30px;
                text-align: center;
                color: white;
            }}
            .logo {{
                font-size: 20px;
                font-weight: 800;
                margin-bottom: 6px;
            }}
            .title {{
                font-size: 24px;
                font-weight: 700;
                text-align: center;
                margin-bottom: 16px;
                color: #1f2937;
            }}
            .content {{
                padding: 32px 30px;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }}
            .footer {{
                background: #f9fafb;
                padding: 22px 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }}
            .footer p {{
                margin: 0;
                font-size: 14px;
                color: #6b7280;
            }}
            .note {{
                margin-top: 24px;
                background: #ecfdf5;
                border-left: 4px solid #10b981;
                padding: 16px;
                border-radius: 8px;
                font-size: 14px;
                color: #065f46;
            }}
        </style>
    </head>

    <body>
        <div class="container">

            <div class="header">
                <div class="logo">🎫 PatasPepas</div>
                <h1>¡Gracias por tu compra!</h1>
                <p>Tus entradas están listas</p>
            </div>

            <div class="content">

                <p style="font-size: 16px;">
                    Hemos adjuntado tus entradas con sus códigos QR listos para mostrar al ingresar al evento.
                </p>

                <h2 class="title">Resumen de tu compra</h2>

                <table>
                    <thead>
                        <tr>
                            <th style="text-align:left; padding-bottom: 12px;">Evento</th>
                            <th style="text-align:left; padding-bottom: 12px;">Zona</th>
                            <th style="text-align:left; padding-bottom: 12px;">Cant.</th>
                            <th style="text-align:left; padding-bottom: 12px;">Precio</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                </table>

                <div class="note">
                    📌 <strong>Recuerda:</strong> Presenta el código QR en la entrada.  
                    Puedes reenviar este correo si lo necesitas.
                </div>

            </div>

            <div class="footer">
                <p>© 2025 PatasPepas. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    """
def evento_actualizado_email_html(
    destinatario: str,
    evento_nombre: str,
    local_nombre: str,
    local_direccion: Optional[str],
    fecha_inicio: str,
    fecha_fin: str,
    cambios: List[Dict[str, str]],
    evento_url: str
) -> str:
    cambios_html = "".join(
        f"""
            <div class="change-row">
                <div class="change-label">{cambio['label']}</div>
                <div class="change-values">
                    <span class="change-old">{cambio['old']}</span>
                    <span class="change-arrow">→</span>
                    <span class="change-new">{cambio['new']}</span>
                </div>
            </div>
        """ for cambio in cambios
    )

    if not cambios_html:
        cambios_html = "<p>No registramos cambios adicionales.</p>"

    direccion_html = (
        f'<p class="meta secondary"><strong>Dirección:</strong> {local_direccion}</p>'
        if local_direccion
        else ""
    )

    return f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Actualización de evento - PatasPepas</title>
        <style>
            body {{ font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#f9fafb; margin:0; padding:20px; color:#374151; }}
            .container {{ max-width:640px; margin:0 auto; background:#fff; border-radius:16px; box-shadow:0 15px 35px rgba(15,23,42,.1); overflow:hidden; }}
            .header {{ background:linear-gradient(135deg,#50bfa0,#3a9d82); color:#fff; padding:32px 28px; }}
            .header h1 {{ margin:0; font-size:24px; font-weight:700; }}
            .content {{ padding:32px 28px; }}
            .greeting {{ font-size:16px; margin:0 0 16px 0; color:#1f2937; }}
            .meta {{ margin:4px 0; font-size:15px; }}
            .secondary {{ color:#6b7280; }}
            .change-card {{ margin-top:24px; border:1px solid #e5e7eb; border-radius:12px; padding:20px; background:#f9fafb; }}
            .change-row {{ border-bottom:1px solid #e5e7eb; padding:12px 0; }}
            .change-row:last-child {{ border-bottom:none; }}
            .change-label {{ font-weight:600; color:#111827; margin-bottom:6px; }}
            .change-values {{ display:flex; align-items:center; gap:10px; color:#374151; flex-wrap:wrap; }}
            .change-old {{ color:#9ca3af; text-decoration:line-through; }}
            .change-new {{ color:#047857; font-weight:600; }}
            .cta {{ display:inline-block; margin-top:28px; padding:14px 28px; background:linear-gradient(135deg,#50bfa0,#3a9d82); color:white!important; text-decoration:none; border-radius:10px; font-weight:600; }}
            .footer {{ padding:24px 28px; background:#f9fafb; text-align:center; font-size:13px; color:#6b7280; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Actualizamos tu evento</h1>
                <p style="margin:6px 0 0 0; opacity:.9;">{evento_nombre}</p>
            </div>
            <div class="content">
                <p class="greeting">Hola {destinatario},</p>
                <p>Realizamos ajustes en la información del evento. Revisa los detalles para organizar tu asistencia.</p>
                <div style="margin-top:18px;">
                    <p class="meta"><strong>Local:</strong> {local_nombre}</p>
                    {direccion_html}
                    <p class="meta"><strong>Inicio:</strong> {fecha_inicio}</p>
                    <p class="meta"><strong>Fin:</strong> {fecha_fin}</p>
                </div>
                <div class="change-card">
                    <p style="margin-top:0; margin-bottom:12px; font-weight:600; color:#111827;">Cambios destacados</p>
                    {cambios_html}
                </div>
                <a href="{evento_url}" class="cta">Ver evento</a>
                <p style="margin-top:24px; font-size:14px; color:#6b7280;">Si no solicitaste este cambio, contáctanos respondiendo este mensaje.</p>
            </div>
            <div class="footer">
                © 2025 PatasPepas · Gracias por confiar en nosotros
            </div>
        </div>
    </body>
    </html>
    """


def evento_cancelacion_html(
    evento_nombre: str,
    evento_fecha: str,
    local_nombre: str | None = None,
    tickets_url: str = "",
    evento_url: str = "",
) -> str:
    local_display = local_nombre or "Por confirmar"

    actions_html = f"""
            <div class="actions" style="text-align:center;">
                <a href="{tickets_url}" class="cta-button" target="_blank" rel="noopener" style="background:#ffffff; color:#047857; border:2px solid #34d399; margin:0 8px;">
                    Ir a Tickets
                </a>
                <a href="{evento_url}" class="cta-button secondary" target="_blank" rel="noopener" style="background:linear-gradient(135deg, #34d399 0%, #059669 100%); color:#ffffff; border:none; margin:0 8px;">
                    Ver detalles del evento
                </a>
            </div>
    """

    login_note_html = """
            <p class="login-note">
                Si la plataforma te solicita iniciar sesión, ingresa con tu cuenta y volverás automáticamente a la información del evento cancelado.
            </p>
    """
    return f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Evento Cancelado - PatasPepas</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #4b5563;
                background-color: #f9fafb;
                margin: 0;
                padding: 20px;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }}
            .header {{
                background: linear-gradient(135deg, #50bfa0 0%, #3a9d82 100%);
                padding: 40px 30px;
                text-align: center;
                color: white;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 800;
                letter-spacing: -0.5px;
            }}
            .header p {{
                margin: 8px 0 0 0;
                font-size: 16px;
                opacity: 0.9;
            }}
            .content {{
                padding: 40px 30px;
            }}
            .title {{
                font-size: 24px;
                font-weight: 700;
                color: #1f2937;
                text-align: center;
                margin: 0 0 16px 0;
            }}
            .info-box {{
                background: #ecfdf5;
                border-left: 4px solid #10b981;
                padding: 24px;
                border-radius: 12px;
                margin: 24px 0;
            }}
            .info-box h3 {{
                margin: 0 0 12px 0;
                color: #047857;
                font-size: 18px;
            }}
            .info-box p {{
                margin: 0 0 12px 0;
                color: #047857;
                font-size: 15px;
                line-height: 1.7;
            }}
            .actions {{
                margin: 32px 0 16px;
            }}
            .cta-button {{
                display: inline-block;
                padding: 14px 32px;
                border-radius: 9999px;
                font-weight: 600;
                text-decoration: none;
                border: none;
                color: #047857;
                background: #ffffff;
                border: 2px solid #34d399;
                transition: all 0.2s ease;
            }}
            .cta-button.secondary {{
                background: linear-gradient(135deg, #34d399 0%, #059669 100%);
                border: none;
                color: #ffffff;
            }}
            .cta-button:hover {{
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
            }}
            .login-note {{
                margin-top: 12px;
                font-size: 13px;
                color: #6b7280;
                text-align: center;
            }}
            .event-details {{
                background: #f3f4f6;
                padding: 20px;
                border-radius: 8px;
                margin: 24px 0;
            }}
            .event-details p {{
                margin: 8px 0;
                font-size: 15px;
            }}
            .footer {{
                background: #f9fafb;
                padding: 22px 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }}
            .footer p {{
                margin: 0;
                font-size: 14px;
                color: #6b7280;
            }}
        </style>
    </head>

    <body>
        <div class="container">
            <div class="header">
                <div style="font-size: 20px; font-weight: 800; margin-bottom: 8px;">🎫 PatasPepas</div>
                <h1>Evento Cancelado</h1>
                <p>Información importante sobre tu compra</p>
            </div>
            <div class="content">
                <p class=\"title\">{evento_nombre}</p>

                <div class="info-box">
                    <h3>Información importante</h3>
                    <p>Lamentamos informarte que el evento ha sido cancelado por el organizador.</p>
                    <p>
                        Ingresa a la sección <strong>Tickets</strong> para revisar el estado de tus entradas, la opción de
                        "Mayor información" y los detalles de reembolso asociados a este evento.
                    </p>
                    <p>
                        Además, allí encontrarás la confirmación del proceso de reembolso habilitado para tus entradas.
                    </p>
                    <p>
                        <strong>Detalles del evento:</strong><br/>
                        Fecha y hora: <strong>{evento_fecha}</strong><br/>
                        Lugar: <strong>{local_display}</strong>
                    </p>
                    <p>Desde esa sección también podrás contactar al organizador si necesitas coordinar devoluciones.</p>
                </div>

{actions_html}
{login_note_html}

            </div>
            <div class="footer">
                <p> 2025 PatasPepas. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    """
