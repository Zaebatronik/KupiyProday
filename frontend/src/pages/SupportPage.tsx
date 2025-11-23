import { useTranslation } from 'react-i18next';

export default function SupportPage() {
  const { t } = useTranslation();
  return <div className="container"><h1>{t('support.title')}</h1><p>Support page - to be implemented</p></div>;
}
