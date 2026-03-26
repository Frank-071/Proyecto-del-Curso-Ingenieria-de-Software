from typing import Dict, Optional

class AuthResponseHandler:
    
    @staticmethod
    def login_success(
        token: str,
        user_id: int,
        email: str,
        role: str,
        admin_type: str = None,
        expires_in: int = 3600,
        cliente_data: dict = None
    ) -> Dict:
        data = {
            "token": token,
            "user_id": user_id,
            "email": email,
            "role": role,
            "expires_in": expires_in
        }
        
        if role == "admin" and admin_type:
            data["admin_type"] = admin_type
        
        # Agregar datos del cliente si existen
        if cliente_data:
            data.update(cliente_data)
            
        return {
            "success": True,
            "message": "Login exitoso",
            "data": data
        }
    
    @staticmethod
    def login_failed(message: str = "Credenciales inválidas") -> Dict:
        return {
            "success": False,
            "message": message,
            "data": None
        }
    
    @staticmethod
    def registration_success(
        email: str,
        validation_link: Optional[str] = None
    ) -> Dict:
        data = {
            "email": email,
            "status": "pending_validation"
        }
        
        if validation_link:
            data["validation_link"] = validation_link
            
        return {
            "success": True,
            "message": "Usuario registrado correctamente. Revisa tu correo para validar.",
            "data": data
        }
    
    @staticmethod
    def validation_success(email: str) -> Dict:
        return {
            "success": True,
            "message": "Validación exitosa. Usuario creado correctamente.",
            "data": {
                "email": email,
                "status": "validated",
                "user_created": True
            }
        }
    
    @staticmethod
    def validation_success_with_token(
        email: str,
        token: str,
        user_id: int,
        expires_in: int = 3600
    ) -> Dict:
        return {
            "success": True,
            "message": "Cuenta validada exitosamente. Sesión iniciada.",
            "data": {
                "email": email,
                "token": token,
                "user_id": user_id,
                "expires_in": expires_in,
                "status": "authenticated"
            }
        }
    
    @staticmethod
    def account_already_exists() -> Dict:
        return {
            "success": True,
            "message": "Ya existe una cuenta con estos datos.",
            "data": {
                "status": "account_exists"
            }
        }
    
    @staticmethod
    def reset_email_sent() -> Dict:
        return {
            "success": True,
            "message": "Se ha enviado un correo con las instrucciones"
        }
    
    @staticmethod
    def password_updated() -> Dict:
        return {
            "success": True,
            "message": "Contraseña actualizada correctamente"
        }
    
    @staticmethod
    def sessions_invalidated() -> Dict:
        return {
            "success": True,
            "message": "Todas las sesiones han sido cerradas exitosamente",
            "data": {
                "status": "sessions_invalidated"
            }
        }
    
