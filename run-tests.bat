@echo off
echo ==========================================
echo     TESTS AUTOMATISES PROSPECTION
echo ==========================================
echo.

echo [INFO] Verification des serveurs...

REM Test du backend
echo [TEST] Backend API...
curl -s -o nul -w "Backend Status: %%{http_code}\n" http://localhost:4000/api/export/domains?limit=1

REM Test du frontend  
echo [TEST] Frontend...
curl -s -o nul -w "Frontend Status: %%{http_code}\n" http://localhost:3000/

echo.
echo [INFO] Lancement de la suite de tests Node.js...
echo.

node test-suite.js

echo.
echo ==========================================
echo          TESTS TERMINES
echo ==========================================
pause
