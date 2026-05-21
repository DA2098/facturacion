# Seguridad del repositorio

Si has comprometido credenciales (por ejemplo `server/.env`), sigue estos pasos inmediatamente:

1. Rota las credenciales expuestas (Render, bases de datos, API keys).
2. Elimina los archivos que contienen secretos del historial de Git (BFG o git-filter-repo).
3. No vuelvas a subir archivos `.env` al repositorio. Usa variables de entorno en el servicio.

Este repositorio ahora ignora `server/.env` mediante `.gitignore`.
