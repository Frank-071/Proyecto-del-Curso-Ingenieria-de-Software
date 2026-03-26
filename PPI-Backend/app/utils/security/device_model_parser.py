import re
from typing import Optional, Dict

IPHONE_MODELS = {
    "iPhone1,1": "iPhone",
    "iPhone1,2": "iPhone 3G",
    "iPhone2,1": "iPhone 3GS",
    "iPhone3,1": "iPhone 4",
    "iPhone3,2": "iPhone 4",
    "iPhone3,3": "iPhone 4",
    "iPhone4,1": "iPhone 4S",
    "iPhone5,1": "iPhone 5",
    "iPhone5,2": "iPhone 5",
    "iPhone5,3": "iPhone 5c",
    "iPhone5,4": "iPhone 5c",
    "iPhone6,1": "iPhone 5s",
    "iPhone6,2": "iPhone 5s",
    "iPhone7,1": "iPhone 6 Plus",
    "iPhone7,2": "iPhone 6",
    "iPhone8,1": "iPhone 6s",
    "iPhone8,2": "iPhone 6s Plus",
    "iPhone8,4": "iPhone SE",
    "iPhone9,1": "iPhone 7",
    "iPhone9,2": "iPhone 7 Plus",
    "iPhone9,3": "iPhone 7",
    "iPhone9,4": "iPhone 7 Plus",
    "iPhone10,1": "iPhone 8",
    "iPhone10,2": "iPhone 8 Plus",
    "iPhone10,3": "iPhone X",
    "iPhone10,4": "iPhone 8",
    "iPhone10,5": "iPhone 8 Plus",
    "iPhone10,6": "iPhone X",
    "iPhone11,2": "iPhone XS",
    "iPhone11,4": "iPhone XS Max",
    "iPhone11,6": "iPhone XS Max",
    "iPhone11,8": "iPhone XR",
    "iPhone12,1": "iPhone 11",
    "iPhone12,3": "iPhone 11 Pro",
    "iPhone12,5": "iPhone 11 Pro Max",
    "iPhone12,8": "iPhone SE (2da gen)",
    "iPhone13,1": "iPhone 12 mini",
    "iPhone13,2": "iPhone 12",
    "iPhone13,3": "iPhone 12 Pro",
    "iPhone13,4": "iPhone 12 Pro Max",
    "iPhone14,2": "iPhone 13 Pro",
    "iPhone14,3": "iPhone 13 Pro Max",
    "iPhone14,4": "iPhone 13 mini",
    "iPhone14,5": "iPhone 13",
    "iPhone14,6": "iPhone SE (3ra gen)",
    "iPhone14,7": "iPhone 13",
    "iPhone14,8": "iPhone 13 Pro",
    "iPhone15,2": "iPhone 14 Pro",
    "iPhone15,3": "iPhone 14 Pro Max",
    "iPhone15,4": "iPhone 14",
    "iPhone15,5": "iPhone 14 Plus",
    "iPhone16,1": "iPhone 15",
    "iPhone16,2": "iPhone 15 Plus",
    "iPhone17,1": "iPhone 15 Pro",
    "iPhone17,2": "iPhone 15 Pro Max",
}

IPAD_MODELS = {
    "iPad1,1": "iPad",
    "iPad2,1": "iPad 2",
    "iPad2,2": "iPad 2",
    "iPad2,3": "iPad 2",
    "iPad2,4": "iPad 2",
    "iPad3,1": "iPad (3ra gen)",
    "iPad3,2": "iPad (3ra gen)",
    "iPad3,3": "iPad (3ra gen)",
    "iPad3,4": "iPad (4ta gen)",
    "iPad3,5": "iPad (4ta gen)",
    "iPad3,6": "iPad (4ta gen)",
    "iPad4,1": "iPad Air",
    "iPad4,2": "iPad Air",
    "iPad4,3": "iPad Air",
    "iPad5,1": "iPad mini 2",
    "iPad5,2": "iPad mini 2",
    "iPad5,3": "iPad mini 2",
    "iPad5,4": "iPad mini 2",
    "iPad6,1": "iPad Air 2",
    "iPad6,2": "iPad Air 2",
    "iPad6,3": "iPad Air 2",
    "iPad6,4": "iPad Air 2",
    "iPad7,1": "iPad Pro 12.9\"",
    "iPad7,2": "iPad Pro 12.9\"",
    "iPad7,3": "iPad Pro 10.5\"",
    "iPad7,4": "iPad Pro 10.5\"",
    "iPad8,1": "iPad Pro 11\"",
    "iPad8,2": "iPad Pro 11\"",
    "iPad8,3": "iPad Pro 11\"",
    "iPad8,4": "iPad Pro 11\"",
    "iPad8,5": "iPad Pro 12.9\" (3ra gen)",
    "iPad8,6": "iPad Pro 12.9\" (3ra gen)",
    "iPad8,7": "iPad Pro 12.9\" (3ra gen)",
    "iPad8,8": "iPad Pro 12.9\" (3ra gen)",
    "iPad11,1": "iPad mini (5ta gen)",
    "iPad11,2": "iPad mini (5ta gen)",
    "iPad11,3": "iPad Air (3ra gen)",
    "iPad11,4": "iPad Air (3ra gen)",
    "iPad13,1": "iPad Air (4ta gen)",
    "iPad13,2": "iPad Air (4ta gen)",
    "iPad13,16": "iPad Air (5ta gen)",
    "iPad13,17": "iPad Air (5ta gen)",
    "iPad14,1": "iPad mini (6ta gen)",
    "iPad14,2": "iPad mini (6ta gen)",
}

def parse_device_model(user_agent: str) -> Optional[str]:
    if not user_agent:
        return None
    
    iphone_match = re.search(r'iPhone(\d+,\d+)', user_agent)
    if iphone_match:
        model_id = f"iPhone{iphone_match.group(1)}"
        return IPHONE_MODELS.get(model_id, f"iPhone {iphone_match.group(1)}")
    
    ipad_match = re.search(r'iPad(\d+,\d+)', user_agent)
    if ipad_match:
        model_id = f"iPad{ipad_match.group(1)}"
        return IPAD_MODELS.get(model_id, f"iPad {ipad_match.group(1)}")
    
    android_match = re.search(r'Android.*?;\s*([A-Z][A-Z0-9-]+)\s*\)', user_agent)
    if android_match:
        model_code = android_match.group(1)
        model_name = parse_android_model(model_code)
        return model_name if model_name else model_code
    
    return None

def parse_android_model(model_code: str) -> Optional[str]:
    samsung_models = {
        "SM-G991": "Samsung Galaxy S21",
        "SM-G996": "Samsung Galaxy S21+",
        "SM-G998": "Samsung Galaxy S21 Ultra",
        "SM-G973": "Samsung Galaxy S10",
        "SM-G975": "Samsung Galaxy S10+",
        "SM-G977": "Samsung Galaxy S10 5G",
        "SM-G981": "Samsung Galaxy S20",
        "SM-G986": "Samsung Galaxy S20+",
        "SM-G988": "Samsung Galaxy S20 Ultra",
        "SM-G991": "Samsung Galaxy S21",
        "SM-G996": "Samsung Galaxy S21+",
        "SM-G998": "Samsung Galaxy S21 Ultra",
        "SM-S911": "Samsung Galaxy S23",
        "SM-S916": "Samsung Galaxy S23+",
        "SM-S918": "Samsung Galaxy S23 Ultra",
        "SM-A515": "Samsung Galaxy A51",
        "SM-A525": "Samsung Galaxy A52",
        "SM-A536": "Samsung Galaxy A53",
        "SM-N986": "Samsung Galaxy Note 20 Ultra",
        "SM-N981": "Samsung Galaxy Note 20",
    }
    
    for prefix, model_name in samsung_models.items():
        if model_code.startswith(prefix):
            return model_name
    
    if model_code.startswith("SM-"):
        return f"Samsung {model_code}"
    
    pixel_models = {
        "Pixel 7": "Google Pixel 7",
        "Pixel 7 Pro": "Google Pixel 7 Pro",
        "Pixel 6": "Google Pixel 6",
        "Pixel 6 Pro": "Google Pixel 6 Pro",
        "Pixel 5": "Google Pixel 5",
        "Pixel 4": "Google Pixel 4",
    }
    
    for pixel_name, full_name in pixel_models.items():
        if pixel_name in model_code:
            return full_name
    
    xiaomi_models = {
        "Mi 11": "Xiaomi Mi 11",
        "Mi 10": "Xiaomi Mi 10",
        "Redmi Note": "Xiaomi Redmi Note",
        "POCO": "Xiaomi POCO",
    }
    
    for xiaomi_name, full_name in xiaomi_models.items():
        if xiaomi_name in model_code:
            return full_name
    
    return None

