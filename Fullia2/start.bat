@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Запуск FulliaCraft Launcher...
call npm start
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Лаунчер завершился с кодом ошибки: %errorlevel%
    pause
)
