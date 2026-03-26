import html
import re


def sanitize_text(text: str, max_length: int = 500) -> str:
    if not text:
        return text
    
    cleaned = html.escape(text)
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    return cleaned[:max_length].strip()


def sanitize_html_strict(text: str) -> str:
    if not text:
        return text
    
    cleaned = html.escape(text)
    cleaned = re.sub(r'<[^>]*>', '', cleaned)
    return cleaned.strip()

