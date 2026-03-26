from typing import Type
from fastapi import Form
from pydantic import BaseModel
import inspect


def as_form(cls: Type[BaseModel]):
    new_params = []
    
    for field_name, field_info in cls.model_fields.items():
        field_type = field_info.annotation
        default = field_info.default if field_info.default is not None else ...
        
        new_params.append(
            inspect.Parameter(
                field_name,
                inspect.Parameter.KEYWORD_ONLY,
                default=Form(default) if default is not ... else Form(...),
                annotation=field_type,
            )
        )
    
    async def _as_form(**data):
        return cls(**data)
    
    sig = inspect.signature(_as_form)
    sig = sig.replace(parameters=new_params)
    _as_form.__signature__ = sig
    
    return _as_form

