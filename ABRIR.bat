@echo off
cd /d "%~dp0"
echo ======================================
echo  PokerCoach AI - App completa
echo ======================================
echo.
echo PokerCoach se abrira con Syntex integrado en:
echo   http://localhost:5193
echo.
echo No abras Syntex aparte. Datos usa el motor integrado en PokerCoach.
echo No cierres esta ventana mientras uses la app.
echo.
set PORT=5193
start "" http://localhost:5193
call npm run dev
pause
