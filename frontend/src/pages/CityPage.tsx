import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/CityPage.css';

// Населённые пункты по странам (города, пригороды, посёлки)
const citiesByCountry: Record<string, { top: string[]; all: string[] }> = {
  RU: {
    top: ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань'],
    all: ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Нижний Новгород', 'Челябинск', 'Самара', 'Омск', 'Ростов-на-Дону', 'Уфа', 'Красноярск', 'Воронеж', 'Пермь', 'Волгоград', 'Краснодар', 'Саратов', 'Тюмень', 'Тольятти', 'Ижевск', 'Барнаул', 'Ульяновск', 'Иркутск', 'Хабаровск', 'Ярославль', 'Владивосток', 'Махачкала', 'Томск', 'Оренбург', 'Кемерово', 'Новокузнецк', 'Рязань', 'Астрахань', 'Пенза', 'Киров', 'Липецк', 'Чебоксары', 'Калининград', 'Тула', 'Курск', 'Сочи', 'Ставрополь', 'Улан-Удэ', 'Магнитогорск', 'Брянск', 'Иваново', 'Белгород', 'Сургут', 'Владимир', 'Нижний Тагил', 'Архангельск', 'Калуга', 'Чита', 'Смоленск', 'Волжский', 'Курган', 'Орёл', 'Череповец', 'Вологда', 'Владикавказ', 'Мурманск', 'Саранск', 'Якутск', 'Тамбов', 'Грозный', 'Стерлитамак', 'Кострома', 'Петрозаводск', 'Нижневартовск', 'Йошкар-Ола', 'Новороссийск', 'Химки', 'Таганрог', 'Комсомольск-на-Амуре', 'Сыктывкар', 'Нижнекамск', 'Набережные Челны', 'Шахты', 'Дзержинск', 'Братск', 'Орск', 'Ангарск', 'Балашиха', 'Энгельс', 'Старый Оскол', 'Великий Новгород', 'Подольск', 'Королёв', 'Мытищи', 'Люберцы', 'Электросталь', 'Прокопьевск', 'Бийск', 'Армавир', 'Норильск', 'Новочеркасск', 'Петропавловск-Камчатский', 'Псков', 'Южно-Сахалинск', 'Каменск-Уральский', 'Щёлково', 'Одинцово', 'Красногорск', 'Домодедово', 'Раменское', 'Жуковский', 'Пушкино', 'Сергиев Посад', 'Ногинск', 'Коломна', 'Серпухов', 'Орехово-Зуево', 'Электрогорск', 'Павловский Посад', 'Ступино', 'Воскресенск', 'Дмитров', 'Истра', 'Клин', 'Можайск', 'Зеленоград', 'Троицк', 'Щербинка', 'Видное', 'Реутов', 'Ивантеевка', 'Фрязино', 'Лосино-Петровский', 'Звенигород', 'Краснознаменск', 'Голицыно', 'Кубинка', 'Наро-Фоминск', 'Апрелевка', 'Селятино', 'Внуково', 'Московский', 'Первомайское', 'Сосенское', 'Щапово', 'Колпино', 'Пушкин', 'Петергоф', 'Кронштадт', 'Сестрорецк', 'Зеленогорск', 'Павловск', 'Гатчина', 'Выборг', 'Кингисепп', 'Тосно', 'Волхов', 'Всеволожск', 'Кудрово', 'Мурино', 'Бугры', 'Парголово', 'Сертолово', 'Шушары', 'Металлострой']
  },
  UA: {
    top: ['Київ', 'Харків', 'Одеса', 'Дніпро', 'Львів'],
    all: ['Київ', 'Харків', 'Одеса', 'Дніпро', 'Львів', 'Запоріжжя', 'Кривий Ріг', 'Миколаїв', 'Маріуполь', 'Луганськ', 'Вінниця', 'Макіївка', 'Сімферополь', 'Херсон', 'Полтава', 'Чернігів', 'Черкаси', 'Суми', 'Житомир', 'Хмельницький', 'Чернівці', 'Рівне', 'Кропивницький', 'Івано-Франківськ', 'Кременчук', 'Тернопіль', 'Луцьк', 'Біла Церква', 'Краматорськ', 'Мелітополь', 'Ужгород', 'Бровари', 'Ірпінь', 'Буча', 'Бориспіль', 'Вишневе', 'Фастів', 'Васильків', 'Обухів', 'Переяслав', 'Яготин', 'Бориспільський район', 'Вишгород', 'Славутич', 'Прип\'ять', 'Дружківка', 'Слов\'янськ', 'Лисичанськ', 'Сєвєродонецьк', 'Алчевськ', 'Стаханов', 'Горлівка', 'Єнакієве', 'Донецьк', 'Костянтинівка', 'Торецьк', 'Бахмут', 'Покровськ', 'Мирноград', 'Авдіївка', 'Ясинувата', 'Волноваха', 'Нікополь', 'Павлоград', 'Кам\'янське', 'Жовті Води', 'Марганець', 'Новомосковськ', 'Перещепине', 'Кам\'янське водосховище', 'Ялта', 'Євпаторія', 'Феодосія', 'Керч', 'Алушта', 'Судак', 'Бахчисарай', 'Севастополь', 'Інкерман', 'Балаклава', 'Трускавець', 'Борислав', 'Дрогобич', 'Стрий', 'Самбір', 'Червоноград', 'Яремче', 'Моршин', 'Сколе', 'Коломия', 'Калуш', 'Долина', 'Надвірна']
  },
  BY: {
    top: ['Мінськ', 'Гомель', 'Могилёв', 'Витебск', 'Гродно'],
    all: ['Мінськ', 'Гомель', 'Могилёв', 'Витебск', 'Гродно', 'Брест', 'Бобруйск', 'Барановичи', 'Борисов', 'Пинск', 'Орша', 'Мозырь', 'Солигорск', 'Новополоцк', 'Лида', 'Полоцк', 'Жлобин', 'Светлогорск', 'Речица', 'Слуцк', 'Молодечно', 'Жодино', 'Дзержинск', 'Марьина Горка', 'Смолевичи', 'Заславль', 'Логойск', 'Минский район', 'Колодищи', 'Боровляны', 'Ждановичи', 'Лошица', 'Озеро', 'Сенница', 'Щомыслица', 'Новинки', 'Станьково', 'Фаниполь', 'Копыль', 'Несвиж', 'Клецк', 'Столбцы', 'Узда', 'Воложин', 'Вилейка', 'Мядель', 'Нарочь', 'Раков', 'Ивенец', 'Городея', 'Любань', 'Старые Дороги', 'Осиповичи', 'Кличев', 'Белыничи', 'Круглое', 'Шклов', 'Горки', 'Кричев', 'Чаусы', 'Чериков', 'Костюковичи', 'Славгород', 'Быхов', 'Новогрудок', 'Слоним', 'Волковыск', 'Мосты', 'Скидель', 'Берёзовка', 'Свислочь', 'Островец', 'Сморгонь', 'Ошмяны', 'Ивье', 'Лепель', 'Глубокое', 'Поставы', 'Браслав', 'Докшицы', 'Шарковщина', 'Верхнедвинск', 'Новолукомль', 'Дисна', 'Городок', 'Лиозно', 'Сенно']
  },
  KZ: {
    top: ['Алматы', 'Астана', 'Шымкент', 'Караганда', 'Актобе'],
    all: ['Алматы', 'Астана', 'Шымкент', 'Караганда', 'Актобе', 'Тараз', 'Павлодар', 'Усть-Каменогорск', 'Семей', 'Атырау', 'Костанай', 'Кызылорда', 'Уральск', 'Петропавловск', 'Актау', 'Темиртау', 'Туркестан', 'Кокшетау', 'Талдыкорган', 'Экибастуз', 'Рудный', 'Жезказган', 'Сатпаев', 'Балхаш', 'Каскелен', 'Талгар', 'Есик', 'Капчагай', 'Текели', 'Сарканд', 'Жаркент', 'Ушарал', 'Чунджа', 'Кеген', 'Байсерке', 'Отеген батыр', 'Алатау', 'Боралдай', 'Шамалган', 'Узынагаш', 'Бурундай', 'Аксай', 'Аксенгир', 'Абай', 'Сарыагаш', 'Кентау', 'Арысь', 'Ленгер', 'Достык', 'Жетысай', 'Байконур', 'Аральск', 'Казалинск', 'Шалкар', 'Приозерск', 'Жанаозен', 'Форт-Шевченко', 'Жанатас', 'Сарань', 'Шахтинск', 'Приозёрск', 'Абай', 'Каражал', 'Сатпаев', 'Аксу', 'Ерейментау', 'Степногорск', 'Есиль', 'Макинск', 'Державинск', 'Атбасар', 'Щучинск', 'Боровое', 'Степняк', 'Аркалык', 'Лисаковск', 'Житикара', 'Жезды']
  },
  DE: {
    top: ['Berlin', 'München', 'Hamburg', 'Frankfurt', 'Köln'],
    all: ['Berlin', 'München', 'Hamburg', 'Frankfurt', 'Köln', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig', 'Bremen', 'Dresden', 'Hannover', 'Nürnberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Bonn', 'Bielefeld', 'Mannheim', 'Karlsruhe', 'Münster', 'Wiesbaden', 'Augsburg', 'Aachen', 'Mönchengladbach', 'Gelsenkirchen', 'Braunschweig', 'Chemnitz', 'Kiel']
  },
  FR: {
    top: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice'],
    all: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Le Havre', 'Saint-Étienne', 'Toulon', 'Grenoble', 'Dijon', 'Angers', 'Nîmes', 'Villeurbanne', 'Saint-Denis', 'Le Mans', 'Aix-en-Provence', 'Clermont-Ferrand', 'Brest', 'Tours', 'Amiens', 'Limoges', 'Annecy', 'Perpignan']
  },
  ES: {
    top: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza'],
    all: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao', 'Alicante', 'Córdoba', 'Valladolid', 'Vigo', 'Gijón', 'Hospitalet', 'A Coruña', 'Granada', 'Vitoria', 'Elche', 'Oviedo', 'Santa Cruz', 'Badalona', 'Cartagena', 'Terrassa', 'Jerez', 'Sabadell', 'Móstoles', 'Alcalá', 'Pamplona']
  },
  PL: {
    top: ['Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań'],
    all: ['Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk', 'Szczecin', 'Bydgoszcz', 'Lublin', 'Katowice', 'Białystok', 'Gdynia', 'Częstochowa', 'Radom', 'Sosnowiec', 'Toruń', 'Kielce', 'Rzeszów', 'Gliwice', 'Zabrze', 'Olsztyn', 'Bielsko-Biała', 'Bytom', 'Zielona Góra', 'Rybnik', 'Ruda Śląska', 'Opole', 'Tychy', 'Gorzów', 'Elbląg']
  },
  US: {
    top: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
    all: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'San Francisco', 'Charlotte', 'Indianapolis', 'Seattle', 'Denver', 'Washington', 'Boston', 'El Paso', 'Detroit', 'Nashville', 'Portland', 'Las Vegas', 'Oklahoma City', 'Tucson', 'Albuquerque', 'Atlanta', 'Miami', 'Minneapolis', 'Cleveland', 'Tampa', 'Orlando']
  },
  GB: {
    top: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow'],
    all: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool', 'Newcastle', 'Sheffield', 'Bristol', 'Edinburgh', 'Leicester', 'Nottingham', 'Coventry', 'Bradford', 'Southampton', 'Brighton', 'Plymouth', 'Reading', 'Bolton', 'Cardiff', 'Sunderland', 'Swansea', 'Derby', 'Wolverhampton', 'Norwich', 'Aberdeen', 'Portsmouth', 'York', 'Cambridge', 'Oxford']
  },
  IT: {
    top: ['Roma', 'Milano', 'Napoli', 'Torino', 'Palermo'],
    all: ['Roma', 'Milano', 'Napoli', 'Torino', 'Palermo', 'Genova', 'Bologna', 'Firenze', 'Bari', 'Catania', 'Venezia', 'Verona', 'Messina', 'Padova', 'Trieste', 'Taranto', 'Brescia', 'Parma', 'Prato', 'Modena', 'Reggio Calabria', 'Reggio Emilia', 'Perugia', 'Livorno', 'Ravenna', 'Cagliari', 'Foggia', 'Rimini', 'Salerno', 'Ferrara']
  },
  TR: {
    top: ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya'],
    all: ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Gaziantep', 'Konya', 'Mersin', 'Diyarbakır', 'Kayseri', 'Eskişehir', 'Urfa', 'Samsun', 'Denizli', 'Adapazarı', 'Malatya', 'Kahramanmaraş', 'Erzurum', 'Van', 'Batman', 'Elâzığ', 'İzmit', 'Manisa', 'Sivas', 'Gebze', 'Balıkesir', 'Tarsus', 'Kütahya', 'Trabzon']
  },
  CN: {
    top: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu'],
    all: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Chongqing', 'Tianjin', 'Wuhan', 'Dongguan', 'Hangzhou', 'Foshan', 'Nanjing', 'Shenyang', 'Xi\'an', 'Qingdao', 'Zhengzhou', 'Harbin', 'Suzhou', 'Dalian', 'Changchun', 'Kunming', 'Taiyuan', 'Changsha', 'Jinan', 'Xiamen', 'Hefei', 'Ningbo', 'Fuzhou', 'Nanning', 'Guiyang']
  },
  JP: {
    top: ['Tokyo', 'Osaka', 'Yokohama', 'Nagoya', 'Sapporo'],
    all: ['Tokyo', 'Osaka', 'Yokohama', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe', 'Kyoto', 'Kawasaki', 'Saitama', 'Hiroshima', 'Sendai', 'Chiba', 'Kitakyushu', 'Sakai', 'Niigata', 'Hamamatsu', 'Kumamoto', 'Sagamihara', 'Shizuoka', 'Okayama', 'Kagoshima', 'Hachioji', 'Funabashi', 'Kawaguchi', 'Himeji', 'Suita', 'Utsunomiya', 'Matsuyama', 'Nara']
  }
};

export default function CityPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [countryCode, setCountryCode] = useState('RU');
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    // Получаем выбранную страну
    const savedCountry = localStorage.getItem('registrationCountry');
    if (savedCountry) {
      const country = JSON.parse(savedCountry);
      setCountryCode(country.code);
    }
  }, []);

  useEffect(() => {
    // Определяем какие города показывать
    const countryData = citiesByCountry[countryCode] || citiesByCountry['RU'];
    
    if (searchQuery) {
      // При поиске показываем все совпадения
      const filtered = countryData.all.filter((city) =>
        city.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setCities(filtered);
    } else {
      // Без поиска показываем только топ-5
      setCities(countryData.top);
    }
  }, [searchQuery, countryCode]);

  const filteredCities = cities;

  return (
    <div className="city-page">
      <div className="container">
        <h1 className="page-title">{t('registration.selectCity')}</h1>

        <input
          type="text"
          className="input search-input"
          placeholder={t('registration.searchCity')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

      <div className="city-list">
        {filteredCities.map((city) => (
          <button
            key={city}
            className={`city-item ${selectedCity === city ? 'selected' : ''}`}
            onClick={() => {
              setSelectedCity(city);
              setSearchQuery(city);
              if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
              }
              // Автоматический переход после выбора
              localStorage.setItem('registrationCity', city);
              setTimeout(() => {
                navigate('/radius');
              }, 300);
            }}
          >
            {city}
          </button>
        ))}
      </div>
      </div>
    </div>
  );
}
