@echo off
title Compilar Instalador PremiumBus a .exe
echo ============================================
echo   PremiumBus - Compilador de Instalador
echo ============================================
echo.

:: Buscar Python REAL (primero rutas conocidas, luego PATH)
set "PYTHON_EXE="

:: Buscar en AppData del usuario (instalacion tipica)
for %%V in (313 312 311 310 39) do (
    if exist "C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python%%V\python.exe" (
        set "PYTHON_EXE=C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python%%V\python.exe"
        goto :found
    )
)
:: Buscar en C:\Python
for %%V in (313 312 311 310) do (
    if exist "C:\Python%%V\python.exe" (
        set "PYTHON_EXE=C:\Python%%V\python.exe"
        goto :found
    )
)

echo [ERROR] Python no encontrado en rutas conocidas.
echo         Instale Python desde https://python.org
echo         Marque "Add to PATH" durante la instalacion.
pause
exit /b

:found
echo [OK] Python encontrado: %PYTHON_EXE%
"%PYTHON_EXE%" --version
echo.

:: Instalar PyInstaller
echo [1/3] Instalando/verificando PyInstaller...
"%PYTHON_EXE%" -m pip install pyinstaller --quiet
echo       [OK] PyInstaller listo.
echo.

:: Compilar
echo [2/3] Compilando instalador.py a .exe...
echo       Esto puede tardar 1-2 minutos...
echo.

"%PYTHON_EXE%" -m PyInstaller --onefile --windowed --name "Instalador_PremiumBus_v5" --clean --noconfirm instalador.py

echo.
echo [3/3] Verificando resultado...

if exist "dist\Instalador_PremiumBus_v5.exe" (
    echo.
    echo ============================================
    echo   COMPILACION EXITOSA
    echo ============================================
    echo.
    echo   Archivo generado:
    echo   dist\Instalador_PremiumBus_v5.exe
    echo.
) else (
    echo [ERROR] No se genero el .exe.
    echo         Revise los errores de arriba.
)

:: Limpiar temporales
rmdir /s /q build 2>nul
del /q Instalador_PremiumBus_v5.spec 2>nul

pause
