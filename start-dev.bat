@echo off
REM ============================================================
REM  Armazem Express - Modo desenvolvimento (sem Stripe)
REM  Abre 2 janelas: Backend e Frontend
REM  Usa pnpm dev no backend (com nodemon - recarga automatica)
REM ============================================================

echo.
echo  Armazem Express - Modo desenvolvimento (sem Stripe)...
echo.

start "Armazem - Backend (dev)" cmd /k "cd /d %~dp0backend && pnpm dev"
start "Armazem - Frontend" cmd /k "cd /d %~dp0frontend && pnpm dev"

echo.
echo  Tudo lancado! Abre http://localhost:5173 no browser.
echo.
pause
