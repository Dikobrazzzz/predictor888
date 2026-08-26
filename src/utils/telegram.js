// Мини-приложение получает данные пользователя из Telegram WebApp SDK.
// Вне Telegram (браузер, локальная разработка) объекта нет — возвращаем null,
// и вызывающий код решает, что делать.

export function webApp() {
  return typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined
}

export function telegramUserId() {
  const id = webApp()?.initDataUnsafe?.user?.id
  return id ? String(id) : null
}

// Сырая подписанная строка — бэкенд будет проверять её по HMAC,
// когда появится TELEGRAM_BOT_TOKEN (см. TODO.md, п. 1.2).
export function initData() {
  return webApp()?.initData || ''
}
