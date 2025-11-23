import { useTranslation } from 'react-i18next';

export default function ListingDetailPage() {
  const { t } = useTranslation();
  return <div className="container"><h1>{t('listing.details')}</h1><p>Listing detail page - to be implemented</p></div>;
}
