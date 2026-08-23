@echo off
title مدرسة موهوبين نينوى - منصة التواصل
cd /d "C:\Users\user\OneDrive\Desktop\gifted students school"
echo ============================================
echo  مدرسة موهوبين نينوى - منصة التواصل
echo ============================================
echo.
echo جاري بدء الخادم...
start "" "C:\Program Files\nodejs\node.exe" "C:\Users\user\OneDrive\Desktop\gifted students school\server.js"
timeout /t 2 /nobreak >nul
start http://localhost:3000
echo.
echo تم بدء الخادم وفتح المتصفح!
echo اضغط أي مفتاح لإغلاق هذه النافذة (الخادم سيستمر بالعمل)
pause >nul