import requests

# Cambia el ID y el token por los que correspondan en tu entorno
LOCAL_ID = 1
TOKEN = "TU_TOKEN_AQUI"
URL = f"http://localhost:8000/local/{LOCAL_ID}"

headers = {
    "Authorization": f"Bearer {TOKEN}"
}

try:
    response = requests.get(URL, headers=headers)
    print("Status code:", response.status_code)
    print("Response:", response.json())
except Exception as e:
    print("Error al hacer la petición:", e)
