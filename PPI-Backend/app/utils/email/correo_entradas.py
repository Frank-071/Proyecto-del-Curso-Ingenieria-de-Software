from PIL import Image, ImageDraw, ImageFont
import qrcode
import io
import base64
from datetime import datetime
from io import BytesIO
import uuid
from typing import Dict

def _format_date(dt):
    from datetime import timezone, timedelta
    meses = {
        1: "enero", 2: "febrero", 3: "marzo", 4: "abril", 5: "mayo", 6: "junio",
        7: "julio", 8: "agosto", 9: "septiembre", 10: "octubre", 11: "noviembre", 12: "diciembre"
    }
    
    if isinstance(dt, str):
        try:
            # Intentar parsear como ISO format
            if dt.endswith('Z'):
                dt = dt[:-1] + '+00:00'
            dt_obj = datetime.fromisoformat(dt)
            # Si no tiene timezone, asumir UTC
            if dt_obj.tzinfo is None:
                dt_obj = dt_obj.replace(tzinfo=timezone.utc)
        except Exception:
            return dt
    elif isinstance(dt, datetime):
        dt_obj = dt
        # Si no tiene timezone, asumir UTC
        if dt_obj.tzinfo is None:
            dt_obj = dt_obj.replace(tzinfo=timezone.utc)
    else:
        return str(dt)
    
    # Convertir a hora local de Perú (UTC-5)
    peru_offset = timedelta(hours=-5)
    peru_tz = timezone(peru_offset)
    dt_local = dt_obj.astimezone(peru_tz)
    
    # Formato: "08 de diciembre, 2025 - 06:30 PM"
    dia = dt_local.day
    mes_nombre = meses.get(dt_local.month, "enero")
    año = dt_local.year
    
    # Convertir hora a formato 12 horas con AM/PM
    hora_12 = dt_local.strftime("%I:%M %p").lower()
    hora_12 = hora_12.replace("am", "AM").replace("pm", "PM")
    
    return f"{dia} de {mes_nombre}, {año} - {hora_12}"

def create_ticket_image_bytes(entry: dict, qr_payload: str | None = None) -> bytes:

    # --- Medidas y colores ---
    W, H = 900, 500
    bg_color = (245, 245, 245)          # gris claro
    card_color = (255, 255, 255)        # tarjeta blanca
    accent = (11, 174, 52)              # verde PatasPepasSoft

    # Base general
    img = Image.new("RGB", (W, H), color=bg_color)
    draw = ImageDraw.Draw(img)

    # Tarjeta
    card = Image.new("RGB", (W - 40, H - 40), color=card_color)
    img.paste(card, (20, 20))

    # --- Fuentes mejoradas ---
    try:
        font_company = ImageFont.truetype("DejaVuSans-Bold.ttf", 48)
        font_subtitle = ImageFont.truetype("DejaVuSans-Bold.ttf", 28)
        font_normal = ImageFont.truetype("DejaVuSans.ttf", 24)
        font_small = ImageFont.truetype("DejaVuSans.ttf", 18)
    except:
        font_company = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()
        font_normal = ImageFont.load_default()
        font_small = ImageFont.load_default()

    # --- HEADER ---
    header_y = 35
    # Nombre de empresa más grande y centrado
    company_text = "PatasPepas"
    company_bbox = draw.textbbox((0, 0), company_text, font=font_company)
    company_width = company_bbox[2] - company_bbox[0]
    company_x = (W - company_width) // 2
    draw.text((company_x, header_y), company_text, font=font_company, fill=accent)

    # Línea separadora elegante
    draw.line((40, header_y + 60, W - 40, header_y + 60), fill=(220, 220, 220), width=2)

    # --- Contenido del ticket ---
    text_x = 50
    y = header_y + 90

    # Título del evento
    title = entry.get("eventName", "Evento")
    draw.text((text_x, y), title, font=font_subtitle, fill=(0, 0, 0))
    y += 45

    # Fecha (sin emoji, formato mejorado)
    date_str = _format_date(entry.get("eventDate", ""))
    draw.text((text_x, y), f"Fecha: {date_str}", font=font_normal, fill=(0, 0, 0))
    y += 35

    # Zona (sin emoji, formato más limpio)
    draw.text((text_x, y), f"Zona: {entry.get('zone', '')}", font=font_normal, fill=(0, 0, 0))
    y += 35

    # Precio (sin emoji, formato más limpio)
    price = entry.get("price", 0)
    draw.text((text_x, y), f"Precio: S/ {price:.2f}", font=font_normal, fill=(0, 0, 0))
    y += 35

    # --- QR code ---
    payload = qr_payload or str(entry.get("entradasCreadas"))
    qr_obj = qrcode.QRCode(
        version=3,
        box_size=10,
        border=2,
        error_correction=qrcode.constants.ERROR_CORRECT_H
    )
    qr_obj.add_data(payload)
    qr_obj.make(fit=True)

    qr_img = qr_obj.make_image(fill_color="black", back_color="white").convert("RGB")
    qr_size = 260
    qr_img = qr_img.resize((qr_size, qr_size), Image.NEAREST)

    # Centrado a la derecha
    qr_x = W - qr_size - 70
    qr_y = int((H - qr_size) / 2)
    img.paste(qr_img, (qr_x, qr_y))

    # --- Pie ---
    footer_text = "Presenta este codigo QR en la entrada del evento."
    draw.text((50, H - 60), footer_text, font=font_small, fill=(90, 90, 90))

    # Guardar a bytes
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.read()



def make_attachment_from_image_bytes(image_bytes: bytes, filename: str) -> Dict:
    b64 = base64.b64encode(image_bytes).decode()
    return {
        "filename": filename,
        "content": b64,
        "type": "image/png"
    }

def build_ticket_images(entradas: list) -> list[tuple[str, bytes]]:
    imagenes = []

    for entry in entradas:
        entrada_id = entry.get("id")
        codigo_qr = entry.get("codigo_qr")
        
        if not codigo_qr and entrada_id:
            codigo_qr = f"ENT-{entrada_id}"
        
        if not codigo_qr:
            codigo_qr = str(uuid.uuid4())
        
        png_bytes = create_ticket_image_bytes(entry, codigo_qr)
        filename = f"entrada_{entrada_id or uuid.uuid4()}.png"
        imagenes.append((filename, png_bytes))

    return imagenes
