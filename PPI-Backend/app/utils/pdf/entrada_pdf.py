import io
import qrcode
from datetime import datetime
from typing import Optional
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib.colors import HexColor
import httpx
from PIL import Image, ImageOps, ImageEnhance

Image.MAX_IMAGE_PIXELS = None

def _format_date_spanish(dt: Optional[datetime]) -> str:
    if not dt:
        return "Fecha no disponible"
    meses = {
        1: "enero", 2: "febrero", 3: "marzo", 4: "abril", 5: "mayo", 6: "junio",
        7: "julio", 8: "agosto", 9: "septiembre", 10: "octubre", 11: "noviembre", 12: "diciembre"
    }
    return f"{dt.day} de {meses.get(dt.month, '')}, {dt.year}"

def _get_month_abbr(dt: Optional[datetime]) -> str:
    if not dt: return "NOV"
    meses_abbr = {
        1: "ENE", 2: "FEB", 3: "MAR", 4: "ABR", 5: "MAY", 6: "JUN",
        7: "JUL", 8: "AGO", 9: "SEP", 10: "OCT", 11: "NOV", 12: "DIC"
    }
    return meses_abbr.get(dt.month, "ENE")

def _format_time_ampm(dt: Optional[datetime]) -> str:
    if not dt:
        return "Hora no disponible"
    return dt.strftime("%I:%M %p").lower()

def _download_image_bytes(url: str) -> Optional[bytes]:
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(url)
            response.raise_for_status()
            return response.content
    except Exception as e:
        print(f"Error descargando imagen: {e}")
        return None

def _process_image_fit_from_bytes(img_bytes: bytes, target_width_pts: float, target_height_pts: float, dpi: int = 40) -> Optional[io.BytesIO]:
    try:
        img = Image.open(io.BytesIO(img_bytes))
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')

        target_width_px = int(target_width_pts / 72 * dpi) if target_width_pts > 0 else img.width
        target_height_px = int(target_height_pts / 72 * dpi) if target_height_pts > 0 else img.height

        img_fitted = ImageOps.fit(
            img,
            (target_width_px, target_height_px),
            method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.5)
        )

        img_buffer = io.BytesIO()
        img_fitted.save(img_buffer, format='PNG', optimize=True)
        img_buffer.seek(0)
        return img_buffer
    except Exception as e:
        print(f"Error procesando imagen fit: {e}")
        return None

def _process_image_thumbnail_from_bytes(img_bytes: bytes, max_size_pts: float) -> Optional[io.BytesIO]:
    try:
        img = Image.open(io.BytesIO(img_bytes))
        if img.mode != 'RGB':
            img = img.convert('RGB')

        max_size_px = int(max_size_pts / 72 * 140)
        img.thumbnail((max_size_px, max_size_px), Image.Resampling.LANCZOS)

        img_buffer = io.BytesIO()
        img.save(img_buffer, format='JPEG', quality=85, optimize=True)
        img_buffer.seek(0)
        return img_buffer
    except Exception as e:
        print(f"Error procesando imagen thumbnail: {e}")
        return None

def _create_watermark(img_buffer: io.BytesIO, opacity: float = 0.15) -> Optional[io.BytesIO]:
    try:
        img_buffer.seek(0)
        img = Image.open(img_buffer).convert("RGBA")
        
        alpha = img.split()[3]
        alpha = ImageEnhance.Brightness(alpha).enhance(opacity)
        img.putalpha(alpha)
        
        wm_buffer = io.BytesIO()
        img.save(wm_buffer, format='PNG', optimize=True)
        wm_buffer.seek(0)
        return wm_buffer
    except Exception as e:
        print(f"Error watermark: {e}")
        return None

def _get_dominant_color(img_buffer: io.BytesIO, default_hex: str = '#50bfa0') -> HexColor:
    try:
        img_buffer.seek(0)
        img = Image.open(img_buffer)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        img_tiny = img.resize((1, 1), resample=Image.Resampling.BICUBIC)
        color = img_tiny.getpixel((0, 0))
        hex_val = '#{:02x}{:02x}{:02x}'.format(*color)
        return HexColor(hex_val)
    except Exception:
        return HexColor(default_hex)

def generate_entrada_pdf(
    entrada_id: int,
    codigo_qr: str,
    evento_nombre: str,
    evento_fecha: Optional[datetime],
    evento_icono_url: Optional[str],
    local_nombre: str,
    zona_nombre: str,
    zona_precio: float,
    cliente_nombres: Optional[str],
    cliente_apellidos: Optional[str],
    nominado_nombres: Optional[str] = None,
    nominado_apellidos: Optional[str] = None
) -> bytes:
    width, height = 10 * inch, 4 * inch
    
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=(width, height), pageCompression=1)

    default_accent = '#50bfa0'
    text_color = HexColor('#1f2937')
    white = HexColor('#FFFFFF')
    bg_color = HexColor('#f3f4f6') 
    
    c.setFillColor(bg_color)
    c.rect(0, 0, width, height, fill=1, stroke=0)

    margin = 0.2 * inch
    card_width = width - (2 * margin)
    card_height = height - (2 * margin)
    card_x = margin
    card_y = margin
    
    stub_ratio = 0.28 
    stub_width = card_width * stub_ratio
    main_width = card_width - stub_width
    stub_x = card_x + main_width

    img_buffer = None
    wm_buffer = None
    primary_color = HexColor(default_accent)
    
    if evento_icono_url:
        raw_bytes = _download_image_bytes(evento_icono_url)
        
        if raw_bytes:
            thumb_size_pts = 2.4 * inch
            img_buffer = _process_image_thumbnail_from_bytes(raw_bytes, thumb_size_pts)
            
            if img_buffer:
                primary_color = _get_dominant_color(img_buffer, default_accent)
                raw_bg_buffer = _process_image_fit_from_bytes(raw_bytes, card_width, card_height, dpi=40)
                if raw_bg_buffer:
                    wm_buffer = _create_watermark(raw_bg_buffer, opacity=0.18) 

    c.setFillColor(HexColor('#d1d5db'))
    c.roundRect(card_x + 4, card_y - 4, card_width, card_height, 8, fill=1, stroke=0)

    path = c.beginPath()
    path.roundRect(card_x, card_y, card_width, card_height, 8)
    c.clipPath(path, stroke=0, fill=0)

    c.setFillColor(white)
    c.rect(card_x, card_y, card_width, card_height, fill=1, stroke=0)

    if wm_buffer:
        wm_reader = ImageReader(wm_buffer)
        c.drawImage(wm_reader, card_x, card_y, width=card_width, height=card_height, mask='auto', preserveAspectRatio=False)

    pad = 0.3 * inch
    content_x = card_x + pad
    content_top = card_y + card_height - pad

    bar_width = 0.15 * inch
    c.setFillColor(primary_color)
    c.rect(card_x, card_y, bar_width, card_height, fill=1, stroke=0)
    
    main_content_x = content_x + bar_width 

    thumb_size = 2.4 * inch
    thumb_y = card_y + (card_height - thumb_size) / 2
    
    if img_buffer:
        img_reader = ImageReader(img_buffer)
        c.drawImage(img_reader, main_content_x, thumb_y, width=thumb_size, height=thumb_size, mask='auto', preserveAspectRatio=True, anchor='c')

    text_x = main_content_x + thumb_size + 0.3 * inch
    text_width_avail = main_width - (thumb_size + bar_width + 0.6*inch)
    cursor_y = content_top - 0.2*inch

    c.setFillColor(primary_color)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(text_x, cursor_y, "EVENTO EXCLUSIVO")
    
    cursor_y -= 0.45 * inch

    c.setFillColor(text_color)
    c.setFont("Helvetica-Bold", 28)
    
    title = evento_nombre
    if c.stringWidth(title, "Helvetica-Bold", 28) > text_width_avail:
        c.setFont("Helvetica-Bold", 22)
    
    words = title.split()
    line1 = ""
    line2 = ""
    for w in words:
        if c.stringWidth(line1 + " " + w, "Helvetica-Bold", 22) < text_width_avail:
            line1 += " " + w
        else:
            line2 += " " + w
            
    c.drawString(text_x, cursor_y, line1.strip())
    if line2:
        cursor_y -= 0.35 * inch
        c.drawString(text_x, cursor_y, line2.strip())

    cursor_y -= 0.6 * inch
    
    cal_box_size = 0.5 * inch
    c.setFillColor(primary_color)
    c.roundRect(text_x, cursor_y, cal_box_size, cal_box_size, 4, fill=1, stroke=0)
    
    if evento_fecha:
        mes_abbr = _get_month_abbr(evento_fecha) 
        fecha_completa = _format_date_spanish(evento_fecha)
        dia_str = str(evento_fecha.day)
        hora_str = _format_time_ampm(evento_fecha)
    else:
        mes_abbr = "NOV"
        fecha_completa = "Fecha pendiente"
        dia_str = "01"
        hora_str = "--:--"

    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(text_x + cal_box_size/2, cursor_y + cal_box_size - 10, mes_abbr)
    
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(text_x + cal_box_size/2, cursor_y + 8, dia_str)

    c.setFillColor(text_color)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(text_x + cal_box_size + 0.15*inch, cursor_y + 0.25*inch, fecha_completa)
    
    c.setFont("Helvetica-Bold", 12) 
    c.setFillColor(text_color)
    c.drawString(text_x + cal_box_size + 0.15*inch, cursor_y + 0.05*inch, hora_str)

    cursor_y -= 0.45 * inch
    c.setFillColor(text_color)
    c.setFont("Helvetica-Bold", 12)
    
    if c.stringWidth(local_nombre, "Helvetica-Bold", 12) < text_width_avail:
        c.drawString(text_x, cursor_y, local_nombre)
    else:
        l_words = local_nombre.split()
        l_line1 = ""
        l_line2 = ""
        for w in l_words:
            if c.stringWidth(l_line1 + " " + w, "Helvetica-Bold", 12) < text_width_avail:
                l_line1 += " " + w
            else:
                l_line2 += " " + w
        
        c.drawString(text_x, cursor_y, l_line1.strip())
        if l_line2:
             c.drawString(text_x, cursor_y - 0.2*inch, l_line2.strip())

    bottom_y = thumb_y 
    
    price_x_offset = 2.5 * inch
    price_pos_x = text_x + price_x_offset
    
    c.setFillColor(text_color)
    c.setFont("Helvetica", 10)
    c.drawString(text_x, bottom_y + 0.2*inch, "ZONA:")
    
    c.setFont("Helvetica-Bold", 14)
    
    max_zone_width = price_x_offset - 0.2 * inch
    
    if c.stringWidth(zona_nombre, "Helvetica-Bold", 14) < max_zone_width:
        c.drawString(text_x, bottom_y, zona_nombre)
    else:
        words = zona_nombre.split()
        z_line1 = ""
        z_line2 = ""
        for w in words:
            if c.stringWidth(z_line1 + " " + w, "Helvetica-Bold", 14) < max_zone_width:
                z_line1 += " " + w
            else:
                z_line2 += " " + w
        
        c.drawString(text_x, bottom_y, z_line1.strip())
        if z_line2:
            c.drawString(text_x, bottom_y - 0.2*inch, z_line2.strip())

    c.setFont("Helvetica", 10)
    c.setFillColor(text_color)
    c.drawString(price_pos_x, bottom_y + 0.2*inch, "PRECIO:")
    
    c.setFillColor(text_color)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(price_pos_x, bottom_y, f"S/ {zona_precio:.2f}")

    stub_center_x = stub_x + (stub_width / 2)
    
    c.saveState()
    c.translate(stub_x + 0.25*inch, card_y + card_height/2)
    c.rotate(90)
    c.setFillColor(HexColor('#9ca3af'))
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(0, 0, "TICKET DE ACCESO")
    c.restoreState()

    qr_size = 1.7 * inch 
    qr_y = card_y + (card_height - qr_size) / 2 + 0.3*inch
    
    qr_obj = qrcode.QRCode(border=0)
    qr_obj.add_data(codigo_qr)
    qr_obj.make(fit=True)
    qr_img = qr_obj.make_image(fill_color="black", back_color="white")
    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format='PNG', optimize=True)
    qr_buffer.seek(0)
    
    c.drawImage(ImageReader(qr_buffer), stub_center_x - qr_size/2, qr_y, width=qr_size, height=qr_size)

    c.setFillColor(text_color)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(stub_center_x, qr_y - 0.25*inch, "ESCANEAR")
    
    if (cliente_nombres or nominado_nombres):
        name = f"{nominado_nombres} {nominado_apellidos}" if nominado_nombres else f"{cliente_nombres} {cliente_apellidos}"
        c.setFont("Helvetica", 9)
        if len(name) > 20:
            parts = name.split()
            c.drawCentredString(stub_center_x, qr_y - 0.5*inch, " ".join(parts[:2]))
            c.drawCentredString(stub_center_x, qr_y - 0.65*inch, " ".join(parts[2:]))
        else:
            c.drawCentredString(stub_center_x, qr_y - 0.5*inch, name)

    c.setStrokeColor(HexColor('#9ca3af')) 
    c.setLineWidth(2.5) 
    c.setDash([6, 5])
    c.line(stub_x, card_y, stub_x, card_y + card_height)
    c.setDash([]) 

    notch_radius = 0.22 * inch 
    
    c.setFillColor(bg_color) 
    c.setStrokeColor(HexColor('#d1d5db')) 
    
    c.circle(stub_x, card_y + card_height, notch_radius, fill=1, stroke=0)
    c.circle(stub_x, card_y, notch_radius, fill=1, stroke=0)

    c.save()
    buffer.seek(0)
    return buffer.read()