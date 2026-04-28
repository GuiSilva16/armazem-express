@echo off
REM ============================================================
REM  Armazem Express - Arranque rapido (Windows)
REM  Abre 3 janelas: Backend, Frontend e Stripe webhook listener
REM ============================================================

echo.
echo  Armazem Express - A arrancar todos os servicos...
echo.

REM Backend
start "Armazem - Backend" cmd /k "cd /d %~dp0backend && pnpm start"

REM Frontend
start "Armazem - Frontend" cmd /k "cd /d %~dp0frontend && pnpm dev"

REM Stripe webhook listener (so arranca se o stripe CLI estiver no PATH)
where stripe >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    start "Armazem - Stripe Webhook" cmd /k "stripe listen --forward-to localhost:4000/api/billing/webhook"
) else (
    echo  [Aviso] Stripe CLI nao encontrado no PATH. Os pagamentos nao serao testaveis.
    echo          Instala em https://github.com/stripe/stripe-cli/releases
    echo.
)

echo.
echo  Tudo lancado! Abre http://localhost:5173 no browser.
echo  Para parar tudo, fecha as janelas dos terminais.
echo.
pause
