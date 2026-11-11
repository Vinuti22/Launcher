@echo off
chcp 65001 >nul
echo Установка зависимостей...
call npm install || goto :err
echo Сборка exe...
call npm run dist || goto :err
echo.
echo Готово! Файлы лежат в папке dist\
pause
exit /b 0
:err
echo Ошибка сборки.
pause
exit /b 1
