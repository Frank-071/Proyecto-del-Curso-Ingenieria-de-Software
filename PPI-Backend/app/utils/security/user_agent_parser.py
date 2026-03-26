import re
from typing import Dict, Optional
from .device_model_parser import parse_device_model

def parse_user_agent(user_agent: str) -> Dict[str, str]:
    if not user_agent or user_agent == "Desconocido":
        return {
            "browser": "Desconocido",
            "os": "Desconocido",
            "device": "Desconocido"
        }
    
    user_agent_lower = user_agent.lower()
    
    browser = "Desconocido"
    os_name = "Desconocido"
    device_type = "Desktop"
    device_model = None
    
    if "edg/" in user_agent_lower or "edg/" in user_agent:
        browser_match = re.search(r'Edg/(\d+)', user_agent, re.IGNORECASE)
        if browser_match:
            browser = f"Microsoft Edge {browser_match.group(1)}"
        else:
            browser = "Microsoft Edge"
    elif "chrome/" in user_agent_lower and "edg/" not in user_agent_lower:
        browser_match = re.search(r'Chrome/(\d+)', user_agent, re.IGNORECASE)
        if browser_match:
            browser = f"Google Chrome {browser_match.group(1)}"
        else:
            browser = "Google Chrome"
    elif "firefox/" in user_agent_lower:
        browser_match = re.search(r'Firefox/(\d+)', user_agent, re.IGNORECASE)
        if browser_match:
            browser = f"Mozilla Firefox {browser_match.group(1)}"
        else:
            browser = "Mozilla Firefox"
    elif "safari/" in user_agent_lower and "chrome/" not in user_agent_lower:
        browser_match = re.search(r'Version/(\d+)', user_agent, re.IGNORECASE)
        if browser_match:
            browser = f"Safari {browser_match.group(1)}"
        else:
            browser = "Safari"
    elif "opr/" in user_agent_lower or "opera/" in user_agent_lower:
        browser_match = re.search(r'(?:OPR|Opera)/(\d+)', user_agent, re.IGNORECASE)
        if browser_match:
            browser = f"Opera {browser_match.group(1)}"
        else:
            browser = "Opera"
    
    if "windows nt" in user_agent_lower:
        os_match = re.search(r'Windows NT (\d+\.\d+)', user_agent, re.IGNORECASE)
        if os_match:
            version = os_match.group(1)
            if version == "10.0":
                if "Windows 11" in user_agent or "Win11" in user_agent:
                    os_name = "Windows 11"
                elif "Windows 10" in user_agent or "Win10" in user_agent:
                    os_name = "Windows 10"
                else:
                    if "Edg/" in user_agent:
                        os_name = "Windows 11"
                    else:
                        os_name = "Windows 10/11"
            elif version == "6.3":
                os_name = "Windows 8.1"
            elif version == "6.2":
                os_name = "Windows 8"
            elif version == "6.1":
                os_name = "Windows 7"
            else:
                os_name = f"Windows {version}"
        else:
            os_name = "Windows"
    elif "mac os x" in user_agent_lower or "macintosh" in user_agent_lower:
        os_match = re.search(r'Mac OS X (\d+[._]\d+)', user_agent, re.IGNORECASE)
        if os_match:
            version = os_match.group(1).replace("_", ".")
            os_name = f"macOS {version}"
        else:
            os_name = "macOS"
    elif "linux" in user_agent_lower:
        os_name = "Linux"
    elif "android" in user_agent_lower:
        os_match = re.search(r'Android (\d+[.\d]*)', user_agent, re.IGNORECASE)
        if os_match:
            os_name = f"Android {os_match.group(1)}"
        else:
            os_name = "Android"
        device_type = "Móvil"
    elif "iphone" in user_agent_lower:
        os_match = re.search(r'OS (\d+[._]\d+)', user_agent, re.IGNORECASE)
        if os_match:
            version = os_match.group(1).replace("_", ".")
            os_name = f"iOS {version}"
        else:
            os_name = "iOS"
        device_type = "Móvil"
    elif "ipad" in user_agent_lower:
        os_match = re.search(r'OS (\d+[._]\d+)', user_agent, re.IGNORECASE)
        if os_match:
            version = os_match.group(1).replace("_", ".")
            os_name = f"iOS {version}"
        else:
            os_name = "iOS"
        device_type = "Tablet"
    
    device_model = parse_device_model(user_agent)
    
    return {
        "browser": browser,
        "os": os_name,
        "device": device_type,
        "device_model": device_model
    }

