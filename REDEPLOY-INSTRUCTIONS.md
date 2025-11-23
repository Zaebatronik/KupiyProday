# ИНСТРУКЦИЯ ПО РУЧНОМУ REDEPLOY НА VERCEL

## Способ 1: Через веб-интерфейс Vercel (РЕКОМЕНДУЕТСЯ)

1. Откройте https://vercel.com/
2. Войдите в аккаунт (используйте GitHub аккаунт Zaebatronik)
3. Найдите проект "kupiy-proday" или "KupiyProday"
4. Нажмите на проект
5. Перейдите на вкладку "Deployments"
6. Нажмите кнопку "Redeploy" или "..." возле последнего деплоя → "Redeploy"
7. Подтвердите redeploy

Это запустит новую сборку с актуальными файлами из GitHub.

## Способ 2: Через настройки Git Integration

1. Зайдите в проект на Vercel
2. Settings → Git
3. Убедитесь что подключен репозиторий GitHub: Zaebatronik/KupiyProday
4. Production Branch: main
5. Если webhook не настроен, нажмите "Reconnect" или "Configure"

## Способ 3: Push пустой коммит в GitHub

Если у вас есть доступ к командной строке Git:
```bash
cd C:\Users\User\Desktop\fgh\KupyProdai
git add .
git commit -m "Trigger rebuild" --allow-empty
git push origin main
```

## Проверка деплоя

После запуска redeploy:
- Ждите 3-5 минут
- Откройте https://kupiy-proday-jwpo.vercel.app/
- Страница должна загрузиться с новым кодом
- Проверьте в консоли браузера (F12) нет ли ошибок

## Текущие файлы на GitHub

Проверено: на GitHub загружено 50+ файлов, включая:
✅ package.json
✅ vite.config.ts  
✅ tsconfig.json
✅ index.html
✅ src/main.tsx
✅ src/App.tsx
✅ src/pages/GoodbyePage.tsx
✅ src/styles/GoodbyePage.css
✅ Все остальные компоненты и стили

Все файлы на месте, нужен только redeploy на Vercel.
