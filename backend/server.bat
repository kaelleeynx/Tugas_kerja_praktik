@echo off
echo Starting Laravel backend with 4 parallel workers...
echo.

REM Start 4 PHP workers on different ports
start "Worker 1" php -S 127.0.0.1:8001 -t public public/index.php
start "Worker 2" php -S 127.0.0.1:8002 -t public public/index.php
start "Worker 3" php -S 127.0.0.1:8003 -t public public/index.php
start "Worker 4" php -S 127.0.0.1:8004 -t public public/index.php

echo 4 workers started on ports 8001-8004
echo Use nginx or update VITE_BACKEND_URL to point to a load balancer
echo.
echo For simple dev: just use php artisan serve --port=8000
echo The real fix is to use Laragon/XAMPP with Apache/Nginx
pause
