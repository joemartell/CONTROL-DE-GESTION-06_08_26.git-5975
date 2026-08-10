@echo off
chcp 65001 >nul
title Registros SCG - Permitir acceso desde la red
echo Este archivo abre el puerto 4200 en el Firewall de Windows
echo para que los otros equipos puedan entrar a Registros SCG.
echo.
echo IMPORTANTE: ejecutalo con clic derecho ^> "Ejecutar como administrador".
echo.
pause

netsh advfirewall firewall delete rule name="Registros SCG 4200" >nul 2>&1
netsh advfirewall firewall add rule name="Registros SCG 4200" dir=in action=allow protocol=TCP localport=4200 profile=private,domain

if %errorlevel%==0 (
  echo.
  echo LISTO. El puerto 4200 quedo habilitado para la red local.
) else (
  echo.
  echo No se pudo crear la regla. Asegurate de ejecutarlo como administrador.
)
echo.
pause
