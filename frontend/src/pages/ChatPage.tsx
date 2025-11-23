import { useTranslation } from 'react-i18next';

export default function ChatPage() {
  const { t } = useTranslation();
  return <div className="container"><h1>{t('chat.title')}</h1><p>Chat page - to be implemented</p></div>;
}
