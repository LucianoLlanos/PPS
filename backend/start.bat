@echo off
REM Ir al directorio de este script (carpeta backend)
cd /d "%~dp0"
echo Iniciando backend en puerto 3000...
node index.js