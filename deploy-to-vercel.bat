@echo off
echo Installing Vercel CLI...
npm install -g vercel

echo.
echo Deploying to Vercel...
cd frontend
vercel --prod

echo.
echo Done! Copy the production URL and update it in your Telegram bot settings.
pause
