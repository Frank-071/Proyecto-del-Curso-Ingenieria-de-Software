from typing import List, Optional, Dict, TypeVar

T = TypeVar('T')

class ResponseHandler:
    
    @staticmethod
    def success_response(
        data: T = None, 
        message: str = "Operación exitosa",
        metadata: Optional[Dict] = None
    ) -> Dict:
        response = {
            "success": True,
            "message": message
        }
        
        if data is not None:
            response["data"] = data
            
        if metadata:
            response.update(metadata)
            
        return response
    
    @staticmethod
    def success_list(
        items: List[T], 
        message: str = "Registros obtenidos exitosamente",
        total: Optional[int] = None
    ) -> Dict:
        if total is None:
            total = len(items)
            
        return {
            "success": True,
            "message": message,
            "data": items,
            "total": total
        }
    
    @staticmethod
    def success_create(
        item: T, 
        message: str = "Registro creado exitosamente"
    ) -> Dict:
        return {
            "success": True,
            "message": message,
            "data": item
        }
    
    @staticmethod
    def success_update(
        item: T, 
        message: str = "Registro actualizado exitosamente"
    ) -> Dict:
        return {
            "success": True,
            "message": message,
            "data": item
        }
    
    @staticmethod
    def success_delete(message: str = "Registro eliminado exitosamente") -> Dict:
        return {
            "success": True,
            "message": message
        }

    @staticmethod
    def success(data: T = None, message: str = "Operación exitosa") -> Dict:
        """Alias cómodo usado por el código existente: devuelve una respuesta exitosa con 'data'"""
        return ResponseHandler.success_response(data, message)

    @staticmethod
    def error(detail: str, status_code: int = 400) -> Dict:
        """Formato estándar de error (el status_code se puede utilizar por el handler externo).
        Devuelve un dict con success=False para respuestas consistentes en la API.
        """
        return {"success": False, "message": detail, "status_code": status_code}