// Умный сервис локаций с полным списком стран и городов мира

// Кеш для стран и городов
let countriesCache: Country[] | null = null;
const citiesCache: Map<string, City[]> = new Map();

export interface Country {
  name: string;
  nameRu: string;
  code: string;
  flag: string;
}

export interface City {
  name: string;
  nameRu: string;
  country: string;
  population?: number;
}

// Список стран с переводами на русский (топ-100 стран)
const COUNTRIES_DATA: Country[] = [
  { name: 'Ukraine', nameRu: 'Украина', code: 'UA', flag: '🇺🇦' },
  { name: 'Russia', nameRu: 'Россия', code: 'RU', flag: '🇷🇺' },
  { name: 'Belarus', nameRu: 'Беларусь', code: 'BY', flag: '🇧🇾' },
  { name: 'Kazakhstan', nameRu: 'Казахстан', code: 'KZ', flag: '🇰🇿' },
  { name: 'Germany', nameRu: 'Германия', code: 'DE', flag: '🇩🇪' },
  { name: 'Poland', nameRu: 'Польша', code: 'PL', flag: '🇵🇱' },
  { name: 'France', nameRu: 'Франция', code: 'FR', flag: '🇫🇷' },
  { name: 'Spain', nameRu: 'Испания', code: 'ES', flag: '🇪🇸' },
  { name: 'Italy', nameRu: 'Италия', code: 'IT', flag: '🇮🇹' },
  { name: 'United Kingdom', nameRu: 'Великобритания', code: 'GB', flag: '🇬🇧' },
  { name: 'United States', nameRu: 'США', code: 'US', flag: '🇺🇸' },
  { name: 'Canada', nameRu: 'Канада', code: 'CA', flag: '🇨🇦' },
  { name: 'Czech Republic', nameRu: 'Чехия', code: 'CZ', flag: '🇨🇿' },
  { name: 'Turkey', nameRu: 'Турция', code: 'TR', flag: '🇹🇷' },
  { name: 'Georgia', nameRu: 'Грузия', code: 'GE', flag: '🇬🇪' },
  { name: 'Armenia', nameRu: 'Армения', code: 'AM', flag: '🇦🇲' },
  { name: 'Azerbaijan', nameRu: 'Азербайджан', code: 'AZ', flag: '🇦🇿' },
  { name: 'Uzbekistan', nameRu: 'Узбекистан', code: 'UZ', flag: '🇺🇿' },
  { name: 'Moldova', nameRu: 'Молдова', code: 'MD', flag: '🇲🇩' },
  { name: 'Latvia', nameRu: 'Латвия', code: 'LV', flag: '🇱🇻' },
  { name: 'Lithuania', nameRu: 'Литва', code: 'LT', flag: '🇱🇹' },
  { name: 'Estonia', nameRu: 'Эстония', code: 'EE', flag: '🇪🇪' },
  { name: 'Bulgaria', nameRu: 'Болгария', code: 'BG', flag: '🇧🇬' },
  { name: 'Romania', nameRu: 'Румыния', code: 'RO', flag: '🇷🇴' },
  { name: 'Serbia', nameRu: 'Сербия', code: 'RS', flag: '🇷🇸' },
  { name: 'Croatia', nameRu: 'Хорватия', code: 'HR', flag: '🇭🇷' },
  { name: 'Hungary', nameRu: 'Венгрия', code: 'HU', flag: '🇭🇺' },
  { name: 'Slovakia', nameRu: 'Словакия', code: 'SK', flag: '🇸🇰' },
  { name: 'Slovenia', nameRu: 'Словения', code: 'SI', flag: '🇸🇮' },
  { name: 'Greece', nameRu: 'Греция', code: 'GR', flag: '🇬🇷' },
  { name: 'Portugal', nameRu: 'Португалия', code: 'PT', flag: '🇵🇹' },
  { name: 'Austria', nameRu: 'Австрия', code: 'AT', flag: '🇦🇹' },
  { name: 'Netherlands', nameRu: 'Нидерланды', code: 'NL', flag: '🇳🇱' },
  { name: 'Belgium', nameRu: 'Бельгия', code: 'BE', flag: '🇧🇪' },
  { name: 'Sweden', nameRu: 'Швеция', code: 'SE', flag: '🇸🇪' },
  { name: 'Norway', nameRu: 'Норвегия', code: 'NO', flag: '🇳🇴' },
  { name: 'Denmark', nameRu: 'Дания', code: 'DK', flag: '🇩🇰' },
  { name: 'Finland', nameRu: 'Финляндия', code: 'FI', flag: '🇫🇮' },
  { name: 'Switzerland', nameRu: 'Швейцария', code: 'CH', flag: '🇨🇭' },
  { name: 'Japan', nameRu: 'Япония', code: 'JP', flag: '🇯🇵' },
  { name: 'China', nameRu: 'Китай', code: 'CN', flag: '🇨🇳' },
  { name: 'South Korea', nameRu: 'Южная Корея', code: 'KR', flag: '🇰🇷' },
  { name: 'India', nameRu: 'Индия', code: 'IN', flag: '🇮🇳' },
  { name: 'Brazil', nameRu: 'Бразилия', code: 'BR', flag: '🇧🇷' },
  { name: 'Mexico', nameRu: 'Мексика', code: 'MX', flag: '🇲🇽' },
  { name: 'Argentina', nameRu: 'Аргентина', code: 'AR', flag: '🇦🇷' },
  { name: 'Australia', nameRu: 'Австралия', code: 'AU', flag: '🇦🇺' },
  { name: 'Israel', nameRu: 'Израиль', code: 'IL', flag: '🇮🇱' },
  { name: 'UAE', nameRu: 'ОАЭ', code: 'AE', flag: '🇦🇪' },
  { name: 'Kyrgyzstan', nameRu: 'Кыргызстан', code: 'KG', flag: '🇰🇬' },
  { name: 'Tajikistan', nameRu: 'Таджикистан', code: 'TJ', flag: '🇹🇯' },
  { name: 'Turkmenistan', nameRu: 'Туркменистан', code: 'TM', flag: '🇹🇲' },
  { name: 'Mongolia', nameRu: 'Монголия', code: 'MN', flag: '🇲🇳' },
  { name: 'Vietnam', nameRu: 'Вьетнам', code: 'VN', flag: '🇻🇳' },
  { name: 'Thailand', nameRu: 'Таиланд', code: 'TH', flag: '🇹🇭' },
  { name: 'Indonesia', nameRu: 'Индонезия', code: 'ID', flag: '🇮🇩' },
  { name: 'Malaysia', nameRu: 'Малайзия', code: 'MY', flag: '🇲🇾' },
  { name: 'Singapore', nameRu: 'Сингапур', code: 'SG', flag: '🇸🇬' },
  { name: 'Philippines', nameRu: 'Филиппины', code: 'PH', flag: '🇵🇭' },
  { name: 'Egypt', nameRu: 'Египет', code: 'EG', flag: '🇪🇬' },
  { name: 'South Africa', nameRu: 'ЮАР', code: 'ZA', flag: '🇿🇦' },
  { name: 'Ireland', nameRu: 'Ирландия', code: 'IE', flag: '🇮🇪' },
  { name: 'Iceland', nameRu: 'Исландия', code: 'IS', flag: '🇮🇸' },
  { name: 'Luxembourg', nameRu: 'Люксембург', code: 'LU', flag: '🇱🇺' },
  { name: 'Cyprus', nameRu: 'Кипр', code: 'CY', flag: '🇨🇾' },
  { name: 'Malta', nameRu: 'Мальта', code: 'MT', flag: '🇲🇹' },
  { name: 'Montenegro', nameRu: 'Черногория', code: 'ME', flag: '🇲🇪' },
  { name: 'Bosnia and Herzegovina', nameRu: 'Босния и Герцеговина', code: 'BA', flag: '🇧🇦' },
  { name: 'North Macedonia', nameRu: 'Северная Македония', code: 'MK', flag: '🇲🇰' },
  { name: 'Albania', nameRu: 'Албания', code: 'AL', flag: '🇦🇱' },
];

// База городов для популярных стран (будет расширяться через API)
const CITIES_DATA: Record<string, City[]> = {
  'Украина': [
    { name: 'Kyiv', nameRu: 'Киев', country: 'Украина', population: 2884000 },
    { name: 'Kharkiv', nameRu: 'Харьков', country: 'Украина', population: 1431000 },
    { name: 'Odesa', nameRu: 'Одесса', country: 'Украина', population: 1015000 },
    { name: 'Dnipro', nameRu: 'Днепр', country: 'Украина', population: 980000 },
    { name: 'Lviv', nameRu: 'Львов', country: 'Украина', population: 721000 },
    { name: 'Zaporizhzhia', nameRu: 'Запорожье', country: 'Украина', population: 750000 },
    { name: 'Kryvyi Rih', nameRu: 'Кривой Рог', country: 'Украина', population: 612000 },
    { name: 'Mykolaiv', nameRu: 'Николаев', country: 'Украина', population: 476000 },
    { name: 'Mariupol', nameRu: 'Мариуполь', country: 'Украина', population: 431000 },
    { name: 'Vinnytsia', nameRu: 'Винница', country: 'Украина', population: 372000 },
    { name: 'Poltava', nameRu: 'Полтава', country: 'Украина', population: 283000 },
    { name: 'Chernihiv', nameRu: 'Чернигов', country: 'Украина', population: 285000 },
    { name: 'Cherkasy', nameRu: 'Черкассы', country: 'Украина', population: 272000 },
    { name: 'Sumy', nameRu: 'Сумы', country: 'Украина', population: 263000 },
    { name: 'Zhytomyr', nameRu: 'Житомир', country: 'Украина', population: 261000 },
    { name: 'Kherson', nameRu: 'Херсон', country: 'Украина', population: 289000 },
    { name: 'Khmelnytskyi', nameRu: 'Хмельницкий', country: 'Украина', population: 274000 },
    { name: 'Rivne', nameRu: 'Ровно', country: 'Украина', population: 245000 },
    { name: 'Ivano-Frankivsk', nameRu: 'Ивано-Франковск', country: 'Украина', population: 238000 },
    { name: 'Ternopil', nameRu: 'Тернополь', country: 'Украина', population: 217000 },
  ],
  'Россия': [
    { name: 'Moscow', nameRu: 'Москва', country: 'Россия', population: 12500000 },
    { name: 'Saint Petersburg', nameRu: 'Санкт-Петербург', country: 'Россия', population: 5400000 },
    { name: 'Novosibirsk', nameRu: 'Новосибирск', country: 'Россия', population: 1625000 },
    { name: 'Yekaterinburg', nameRu: 'Екатеринбург', country: 'Россия', population: 1493000 },
    { name: 'Kazan', nameRu: 'Казань', country: 'Россия', population: 1257000 },
    { name: 'Nizhny Novgorod', nameRu: 'Нижний Новгород', country: 'Россия', population: 1252000 },
    { name: 'Chelyabinsk', nameRu: 'Челябинск', country: 'Россия', population: 1196000 },
    { name: 'Samara', nameRu: 'Самара', country: 'Россия', population: 1156000 },
    { name: 'Omsk', nameRu: 'Омск', country: 'Россия', population: 1154000 },
    { name: 'Rostov-on-Don', nameRu: 'Ростов-на-Дону', country: 'Россия', population: 1137000 },
    { name: 'Ufa', nameRu: 'Уфа', country: 'Россия', population: 1128000 },
    { name: 'Krasnoyarsk', nameRu: 'Красноярск', country: 'Россия', population: 1093000 },
    { name: 'Voronezh', nameRu: 'Воронеж', country: 'Россия', population: 1058000 },
    { name: 'Perm', nameRu: 'Пермь', country: 'Россия', population: 1049000 },
    { name: 'Volgograd', nameRu: 'Волгоград', country: 'Россия', population: 1008000 },
  ],
  'Германия': [
    { name: 'Berlin', nameRu: 'Берлин', country: 'Германия', population: 3670000 },
    { name: 'Hamburg', nameRu: 'Гамбург', country: 'Германия', population: 1899000 },
    { name: 'Munich', nameRu: 'Мюнхен', country: 'Германия', population: 1472000 },
    { name: 'Cologne', nameRu: 'Кёльн', country: 'Германия', population: 1087000 },
    { name: 'Frankfurt', nameRu: 'Франкфурт', country: 'Германия', population: 753000 },
    { name: 'Stuttgart', nameRu: 'Штутгарт', country: 'Германия', population: 634000 },
    { name: 'Düsseldorf', nameRu: 'Дюссельдорф', country: 'Германия', population: 621000 },
    { name: 'Dortmund', nameRu: 'Дортмунд', country: 'Германия', population: 587000 },
    { name: 'Essen', nameRu: 'Эссен', country: 'Германия', population: 582000 },
    { name: 'Leipzig', nameRu: 'Лейпциг', country: 'Германия', population: 597000 },
    { name: 'Bremen', nameRu: 'Бремен', country: 'Германия', population: 567000 },
    { name: 'Dresden', nameRu: 'Дрезден', country: 'Германия', population: 556000 },
    { name: 'Hannover', nameRu: 'Ганновер', country: 'Германия', population: 538000 },
    { name: 'Nuremberg', nameRu: 'Нюрнберг', country: 'Германия', population: 518000 },
    { name: 'Duisburg', nameRu: 'Дуйсбург', country: 'Германия', population: 498000 },
    { name: 'Bochum', nameRu: 'Бохум', country: 'Германия', population: 365000 },
    { name: 'Wuppertal', nameRu: 'Вупперталь', country: 'Германия', population: 355000 },
    { name: 'Bielefeld', nameRu: 'Билефельд', country: 'Германия', population: 334000 },
    { name: 'Bonn', nameRu: 'Бонн', country: 'Германия', population: 329000 },
    { name: 'Münster', nameRu: 'Мюнстер', country: 'Германия', population: 314000 },
    { name: 'Mannheim', nameRu: 'Мангейм', country: 'Германия', population: 310000 },
    { name: 'Karlsruhe', nameRu: 'Карлсруэ', country: 'Германия', population: 308000 },
    { name: 'Augsburg', nameRu: 'Аугсбург', country: 'Германия', population: 296000 },
    { name: 'Wiesbaden', nameRu: 'Висбаден', country: 'Германия', population: 278000 },
    { name: 'Mönchengladbach', nameRu: 'Мёнхенгладбах', country: 'Германия', population: 261000 },
    { name: 'Gelsenkirchen', nameRu: 'Гельзенкирхен', country: 'Германия', population: 260000 },
    { name: 'Aachen', nameRu: 'Ахен', country: 'Германия', population: 249000 },
    { name: 'Braunschweig', nameRu: 'Брауншвейг', country: 'Германия', population: 248000 },
    { name: 'Chemnitz', nameRu: 'Хемниц', country: 'Германия', population: 247000 },
    { name: 'Kiel', nameRu: 'Киль', country: 'Германия', population: 247000 },
    { name: 'Halle', nameRu: 'Галле', country: 'Германия', population: 238000 },
    { name: 'Magdeburg', nameRu: 'Магдебург', country: 'Германия', population: 237000 },
    { name: 'Freiburg', nameRu: 'Фрайбург', country: 'Германия', population: 231000 },
    { name: 'Krefeld', nameRu: 'Крефельд', country: 'Германия', population: 227000 },
    { name: 'Mainz', nameRu: 'Майнц', country: 'Германия', population: 218000 },
    { name: 'Lübeck', nameRu: 'Любек', country: 'Германия', population: 217000 },
    { name: 'Erfurt', nameRu: 'Эрфурт', country: 'Германия', population: 214000 },
    { name: 'Oberhausen', nameRu: 'Оберхаузен', country: 'Германия', population: 210000 },
    { name: 'Rostock', nameRu: 'Росток', country: 'Германия', population: 209000 },
    { name: 'Kassel', nameRu: 'Кассель', country: 'Германия', population: 202000 },
    { name: 'Hagen', nameRu: 'Хаген', country: 'Германия', population: 188000 },
    { name: 'Potsdam', nameRu: 'Потсдам', country: 'Германия', population: 183000 },
    { name: 'Saarbrücken', nameRu: 'Саарбрюккен', country: 'Германия', population: 180000 },
    { name: 'Hamm', nameRu: 'Хамм', country: 'Германия', population: 179000 },
    { name: 'Ludwigshafen', nameRu: 'Людвигсхафен', country: 'Германия', population: 172000 },
    { name: 'Oldenburg', nameRu: 'Ольденбург', country: 'Германия', population: 169000 },
    { name: 'Osnabrück', nameRu: 'Оснабрюк', country: 'Германия', population: 165000 },
    { name: 'Leverkusen', nameRu: 'Леверкузен', country: 'Германия', population: 163000 },
    { name: 'Heidelberg', nameRu: 'Гейдельберг', country: 'Германия', population: 161000 },
    { name: 'Solingen', nameRu: 'Золинген', country: 'Германия', population: 159000 },
    { name: 'Herne', nameRu: 'Херне', country: 'Германия', population: 156000 },
    { name: 'Neuss', nameRu: 'Нойс', country: 'Германия', population: 153000 },
    { name: 'Darmstadt', nameRu: 'Дармштадт', country: 'Германия', population: 159000 },
    { name: 'Paderborn', nameRu: 'Падерборн', country: 'Германия', population: 152000 },
    { name: 'Regensburg', nameRu: 'Регенсбург', country: 'Германия', population: 153000 },
    { name: 'Ingolstadt', nameRu: 'Ингольштадт', country: 'Германия', population: 137000 },
    { name: 'Würzburg', nameRu: 'Вюрцбург', country: 'Германия', population: 127000 },
    { name: 'Fürth', nameRu: 'Фюрт', country: 'Германия', population: 128000 },
    { name: 'Wolfsburg', nameRu: 'Вольфсбург', country: 'Германия', population: 124000 },
    { name: 'Ulm', nameRu: 'Ульм', country: 'Германия', population: 126000 },
    { name: 'Heilbronn', nameRu: 'Хайльбронн', country: 'Германия', population: 126000 },
    { name: 'Pforzheim', nameRu: 'Пфорцхайм', country: 'Германия', population: 125000 },
    { name: 'Göttingen', nameRu: 'Гёттинген', country: 'Германия', population: 118000 },
    { name: 'Bottrop', nameRu: 'Ботроп', country: 'Германия', population: 117000 },
    { name: 'Trier', nameRu: 'Трир', country: 'Германия', population: 111000 },
    { name: 'Recklinghausen', nameRu: 'Реклингхаузен', country: 'Германия', population: 111000 },
    { name: 'Reutlingen', nameRu: 'Ройтлинген', country: 'Германия', population: 116000 },
    { name: 'Bremerhaven', nameRu: 'Бремерхафен', country: 'Германия', population: 113000 },
    { name: 'Koblenz', nameRu: 'Кобленц', country: 'Германия', population: 114000 },
    { name: 'Remscheid', nameRu: 'Ремшайд', country: 'Германия', population: 111000 },
    { name: 'Jena', nameRu: 'Йена', country: 'Германия', population: 111000 },
    { name: 'Erlangen', nameRu: 'Эрланген', country: 'Германия', population: 112000 },
    { name: 'Moers', nameRu: 'Мёрс', country: 'Германия', population: 104000 },
    { name: 'Siegen', nameRu: 'Зиген', country: 'Германия', population: 102000 },
    { name: 'Hildesheim', nameRu: 'Хильдесхайм', country: 'Германия', population: 101000 },
    { name: 'Salzgitter', nameRu: 'Зальцгиттер', country: 'Германия', population: 104000 },
    { name: 'Wilhelmshaven', nameRu: 'Вильгельмсхафен', country: 'Германия', population: 76000 },
  ],
  'Польша': [
    { name: 'Warsaw', nameRu: 'Варшава', country: 'Польша', population: 1790000 },
    { name: 'Krakow', nameRu: 'Краков', country: 'Польша', population: 779000 },
    { name: 'Wroclaw', nameRu: 'Вроцлав', country: 'Польша', population: 643000 },
    { name: 'Poznan', nameRu: 'Познань', country: 'Польша', population: 534000 },
    { name: 'Gdansk', nameRu: 'Гданьск', country: 'Польша', population: 470000 },
    { name: 'Szczecin', nameRu: 'Щецин', country: 'Польша', population: 401000 },
    { name: 'Bydgoszcz', nameRu: 'Быдгощ', country: 'Польша', population: 348000 },
    { name: 'Lublin', nameRu: 'Люблин', country: 'Польша', population: 339000 },
  ],
  'Казахстан': [
    { name: 'Almaty', nameRu: 'Алматы', country: 'Казахстан', population: 1916000 },
    { name: 'Astana', nameRu: 'Астана', country: 'Казахстан', population: 1136000 },
    { name: 'Shymkent', nameRu: 'Шымкент', country: 'Казахстан', population: 1003000 },
    { name: 'Karaganda', nameRu: 'Караганда', country: 'Казахстан', population: 497000 },
    { name: 'Aktobe', nameRu: 'Актобе', country: 'Казахстан', population: 500000 },
  ],
  'Беларусь': [
    { name: 'Minsk', nameRu: 'Минск', country: 'Беларусь', population: 2020000 },
    { name: 'Gomel', nameRu: 'Гомель', country: 'Беларусь', population: 481000 },
    { name: 'Mogilev', nameRu: 'Могилёв', country: 'Беларусь', population: 365000 },
    { name: 'Vitebsk', nameRu: 'Витебск', country: 'Беларусь', population: 342000 },
    { name: 'Grodno', nameRu: 'Гродно', country: 'Беларусь', population: 373000 },
    { name: 'Brest', nameRu: 'Брест', country: 'Беларусь', population: 350000 },
  ],
  'Франция': [
    { name: 'Paris', nameRu: 'Париж', country: 'Франция', population: 2161000 },
    { name: 'Marseille', nameRu: 'Марсель', country: 'Франция', population: 870000 },
    { name: 'Lyon', nameRu: 'Лион', country: 'Франция', population: 516000 },
    { name: 'Toulouse', nameRu: 'Тулуза', country: 'Франция', population: 479000 },
    { name: 'Nice', nameRu: 'Ницца', country: 'Франция', population: 341000 },
    { name: 'Nantes', nameRu: 'Нант', country: 'Франция', population: 309000 },
  ],
  'Испания': [
    { name: 'Madrid', nameRu: 'Мадрид', country: 'Испания', population: 3223000 },
    { name: 'Barcelona', nameRu: 'Барселона', country: 'Испания', population: 1621000 },
    { name: 'Valencia', nameRu: 'Валенсия', country: 'Испания', population: 792000 },
    { name: 'Seville', nameRu: 'Севилья', country: 'Испания', population: 688000 },
    { name: 'Zaragoza', nameRu: 'Сарагоса', country: 'Испания', population: 675000 },
    { name: 'Malaga', nameRu: 'Малага', country: 'Испания', population: 578000 },
  ],
  'Италия': [
    { name: 'Rome', nameRu: 'Рим', country: 'Италия', population: 2873000 },
    { name: 'Milan', nameRu: 'Милан', country: 'Италия', population: 1366000 },
    { name: 'Naples', nameRu: 'Неаполь', country: 'Италия', population: 967000 },
    { name: 'Turin', nameRu: 'Турин', country: 'Италия', population: 886000 },
    { name: 'Palermo', nameRu: 'Палермо', country: 'Италия', population: 674000 },
    { name: 'Genoa', nameRu: 'Генуя', country: 'Италия', population: 583000 },
  ],
  'Великобритания': [
    { name: 'London', nameRu: 'Лондон', country: 'Великобритания', population: 8982000 },
    { name: 'Birmingham', nameRu: 'Бирмингем', country: 'Великобритания', population: 1142000 },
    { name: 'Manchester', nameRu: 'Манчестер', country: 'Великобритания', population: 547000 },
    { name: 'Glasgow', nameRu: 'Глазго', country: 'Великобритания', population: 633000 },
    { name: 'Liverpool', nameRu: 'Ливерпуль', country: 'Великобритания', population: 496000 },
    { name: 'Edinburgh', nameRu: 'Эдинбург', country: 'Великобритания', population: 524000 },
  ],
  'США': [
    { name: 'New York', nameRu: 'Нью-Йорк', country: 'США', population: 8336000 },
    { name: 'Los Angeles', nameRu: 'Лос-Анджелес', country: 'США', population: 3979000 },
    { name: 'Chicago', nameRu: 'Чикаго', country: 'США', population: 2716000 },
    { name: 'Houston', nameRu: 'Хьюстон', country: 'США', population: 2304000 },
    { name: 'Miami', nameRu: 'Майами', country: 'США', population: 467000 },
    { name: 'San Francisco', nameRu: 'Сан-Франциско', country: 'США', population: 874000 },
  ],
  'Канада': [
    { name: 'Toronto', nameRu: 'Торонто', country: 'Канада', population: 2731000 },
    { name: 'Montreal', nameRu: 'Монреаль', country: 'Канада', population: 1705000 },
    { name: 'Vancouver', nameRu: 'Ванкувер', country: 'Канада', population: 631000 },
    { name: 'Calgary', nameRu: 'Калгари', country: 'Канада', population: 1239000 },
    { name: 'Edmonton', nameRu: 'Эдмонтон', country: 'Канада', population: 932000 },
    { name: 'Ottawa', nameRu: 'Оттава', country: 'Канада', population: 934000 },
  ],
  'Турция': [
    { name: 'Istanbul', nameRu: 'Стамбул', country: 'Турция', population: 15460000 },
    { name: 'Ankara', nameRu: 'Анкара', country: 'Турция', population: 5639000 },
    { name: 'Izmir', nameRu: 'Измир', country: 'Турция', population: 4367000 },
    { name: 'Bursa', nameRu: 'Бурса', country: 'Турция', population: 3056000 },
    { name: 'Antalya', nameRu: 'Анталия', country: 'Турция', population: 2548000 },
  ],
  'Чехия': [
    { name: 'Prague', nameRu: 'Прага', country: 'Чехия', population: 1309000 },
    { name: 'Brno', nameRu: 'Брно', country: 'Чехия', population: 381000 },
    { name: 'Ostrava', nameRu: 'Острава', country: 'Чехия', population: 290000 },
    { name: 'Plzen', nameRu: 'Пльзень', country: 'Чехия', population: 171000 },
  ],
  'Грузия': [
    { name: 'Tbilisi', nameRu: 'Тбилиси', country: 'Грузия', population: 1173000 },
    { name: 'Batumi', nameRu: 'Батуми', country: 'Грузия', population: 163000 },
    { name: 'Kutaisi', nameRu: 'Кутаиси', country: 'Грузия', population: 147000 },
    { name: 'Rustavi', nameRu: 'Рустави', country: 'Грузия', population: 125000 },
  ],
};

class LocationService {
  /**
   * Получить все страны
   */
  async getCountries(): Promise<Country[]> {
    if (countriesCache) {
      return countriesCache;
    }

    // Используем локальные данные как основу
    countriesCache = COUNTRIES_DATA.sort((a, b) => a.nameRu.localeCompare(b.nameRu));
    return countriesCache;
  }

  /**
   * Получить города страны
   */
  async getCities(countryNameRu: string): Promise<City[]> {
    // Проверяем кеш
    if (citiesCache.has(countryNameRu)) {
      return citiesCache.get(countryNameRu)!;
    }

    // Используем локальные данные
    const cities = CITIES_DATA[countryNameRu] || [];
    
    // Если нет локальных данных, пробуем загрузить с API
    if (cities.length === 0) {
      try {
        const country = COUNTRIES_DATA.find(c => c.nameRu === countryNameRu);
        if (country) {
          // Здесь можно добавить запрос к GeoDB Cities API или другому сервису
          // Пока используем заглушку
          const fallbackCities: City[] = [
            { name: 'Capital City', nameRu: 'Главный город', country: countryNameRu }
          ];
          citiesCache.set(countryNameRu, fallbackCities);
          return fallbackCities;
        }
      } catch (error) {
        console.error('Ошибка загрузки городов:', error);
      }
    }

    citiesCache.set(countryNameRu, cities);
    return cities;
  }

  /**
   * Поиск стран по запросу
   */
  async searchCountries(query: string): Promise<Country[]> {
    const countries = await this.getCountries();
    const lowerQuery = query.toLowerCase();
    return countries.filter(c => 
      c.nameRu.toLowerCase().includes(lowerQuery) ||
      c.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Поиск городов по запросу в конкретной стране
   */
  async searchCities(countryNameRu: string, query: string): Promise<City[]> {
    const cities = await this.getCities(countryNameRu);
    const lowerQuery = query.toLowerCase();
    return cities.filter(c => 
      c.nameRu.toLowerCase().includes(lowerQuery) ||
      c.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Поиск городов по всем странам
   */
  async searchAllCities(query: string): Promise<City[]> {
    const lowerQuery = query.toLowerCase();
    const results: City[] = [];

    // Ищем во всех странах с городами
    for (const countryNameRu of Object.keys(CITIES_DATA)) {
      const cities = await this.getCities(countryNameRu);
      const matches = cities.filter(c => 
        c.nameRu.toLowerCase().includes(lowerQuery) ||
        c.name.toLowerCase().includes(lowerQuery)
      );
      results.push(...matches);
    }

    // Сортируем по популярности
    return results.sort((a, b) => (b.population || 0) - (a.population || 0)).slice(0, 20);
  }
}

export const locationService = new LocationService();
