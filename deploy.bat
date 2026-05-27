@echo off
"C:\Program Files\Git\bin\git.exe" -C veshchay add .
"C:\Program Files\Git\bin\git.exe" -C veshchay commit -m "deploy"
"C:\Program Files\Git\bin\git.exe" -C veshchay push origin HEAD:main --force
echo.
echo ГОТОВО! Vercel задеплоит через минуту.
pause
