@echo off
chcp 65001 >nul
title Registros SCG - Servidor de red
cd /d "%~dp0"

echo ============================================================
echo   REGISTROS SCG - Iniciando servidor de red
echo ============================================================
echo.

if not exist ".env" (
  if exist ".env.example" (
    echo [1/4] Creando archivo .env ...
    copy /y ".env.example" ".env" >nul
  )
)

if not exist "node_modules" (
  echo [2/4] Instalando dependencias, esto tarda unos minutos...
  call bun install || goto :error
) else (
  echo [2/4] Dependencias listas.
)

echo [3/4] Preparando la base de datos...
call bun run db:push || goto :error

echo [4/4] Compilando y arrancando el servidor...
echo.
call bun run servidor
goto :fin

:error
echo.
echo *** Ocurrio un error. Revisa el mensaje de arriba. ***
:fin
echo.
pause
