@echo off
echo ====================================
echo    INICIANDO BACKEND CON CORRECCIONES
echo ====================================
echo.
echo Directorio: %cd%
echo Puerto: 3000
echo.
REM Cambiar al directorio backend relativo a este script
cd /d "%~dp0backend"
echo Cambiado a directorio backend...
echo.
echo Iniciando servidor Node.js...
node index.js
echo.
echo ====================================
echo    SERVIDOR DETENIDO
echo ====================================
pause