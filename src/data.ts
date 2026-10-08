import type { Account, Cost, IntegrationInfo, Issue, Source, Stats, Video } from './types'

function sourcesFor(topic: string): Source[] {
  return [
    {
      title: 'Памятка редакции Nutrilora',
      note: 'Учебный конспект редакции. Внешний архив на этом этапе не подключён.',
    },
    {
      title: `Карточка темы: ${topic}`,
      note: 'Демонстрационный источник. В боевом режиме здесь будет материал из базы.',
    },
  ]
}

function cost(voice: number, avatar: number, assembly: number): Cost {
  return { voice, avatar, assembly }
}

function stats(views: number, likes: number, comments: number, shares: number): Stats {
  return { views, likes, comments, shares }
}

function issue(title: string, detail: string): Issue {
  return { title, detail, dismissed: false }
}

function video(input: Omit<Video, 'sources'> & { topic: string }): Video {
  const { topic, ...rest } = input
  return { ...rest, sources: sourcesFor(topic) }
}

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'kz',
    name: 'Nutrilora',
    handle: '@nutrilora.kz',
    niche: 'Рациональное питание',
    language: 'ru',
    perDay: 2,
  },
  {
    id: 'qz',
    name: 'Nutrilora Qazaq',
    handle: '@nutrilora.qazaq',
    niche: 'Дұрыс тамақтану',
    language: 'kk',
    perDay: 1,
  },
  {
    id: 'mama',
    name: 'Nutrilora Мама',
    handle: '@nutrilora.mama',
    niche: 'Питание для мам',
    language: 'ru',
    perDay: 1,
  },
  {
    id: 'sport',
    name: 'Nutrilora Спорт',
    handle: '@nutrilora.sport',
    niche: 'Спорт и восстановление',
    language: 'ru',
    perDay: 2,
  },
]

const DISCLAIMER = 'Это общий информационный ролик, не персональная рекомендация врача.'

export const INITIAL_VIDEOS: Video[] = [
  video({
    id: 'v-fiber',
    title: 'Клетчатка, которая уже дома',
    accountId: 'kz',
    language: 'ru',
    stage: 'ready',
    topic: 'клетчатка',
    duration: '0:26',
    scheduledAt: '2026-10-02',
    published: true,
    gloss: null,
    cost: cost(320, 2100, 480),
    stats: stats(8640, 410, 18, 36),
    issue: null,
    notes: [],
    script: `Клетчатка уже есть дома: капуста, морковь, яблоко, фасоль, цельная крупа.
Добавляйте овощи к привычной тарелке, а не отдельным «очищением».
Если овощей стало заметно больше, добавьте и воды в течение дня.
${DISCLAIMER}`,
  }),
  video({
    id: 'v-sleep',
    title: 'Сон важнее коктейля',
    accountId: 'sport',
    language: 'ru',
    stage: 'ready',
    topic: 'восстановление и сон',
    duration: '0:24',
    scheduledAt: '2026-10-03',
    published: true,
    gloss: null,
    cost: cost(350, 2200, 450),
    stats: stats(9800, 455, 22, 40),
    issue: null,
    notes: [],
    script: `Восстановление начинается со сна, а не с банки.
Короткую ночь добавка не догоняет.
Оставьте вечерний приём еды спокойным и без обещаний «ночного жиросжигания».
${DISCLAIMER}`,
  }),
  video({
    id: 'v-salt',
    title: 'Где прячется соль',
    accountId: 'mama',
    language: 'ru',
    stage: 'ready',
    topic: 'соль',
    duration: '0:27',
    scheduledAt: '2026-10-04',
    published: true,
    gloss: null,
    cost: cost(320, 2300, 480),
    stats: stats(13440, 690, 27, 51),
    issue: null,
    notes: [],
    script: `Соль прячется в хлебе, соусах и готовых полуфабрикатах.
Один солёный приём — обычная еда, а не провал дня.
Смотрите на весь день, а не на одну щепотку в супе.
${DISCLAIMER}`,
  }),
  video({
    id: 'v-creatine',
    title: 'Креатин и обычная еда',
    accountId: 'sport',
    language: 'ru',
    stage: 'ready',
    topic: 'креатин и рацион',
    duration: '0:29',
    scheduledAt: '2026-10-05',
    published: true,
    gloss: null,
    cost: cost(380, 2400, 520),
    stats: stats(24680, 1320, 64, 110),
    issue: null,
    notes: [],
    script: `Креатин не заменяет еду.
В дни тренировок оставьте обычный рацион: белок, углеводы и вода.
Ролик про тарелку. Банку и дозу здесь не назначаем.
${DISCLAIMER}`,
  }),
  video({
    id: 'v-breakfast',
    title: 'Завтрак за 10 минут',
    accountId: 'kz',
    language: 'ru',
    stage: 'ready',
    topic: 'быстрый завтрак',
    duration: '0:28',
    scheduledAt: '2026-10-06',
    published: true,
    gloss: null,
    cost: cost(340, 2100, 460),
    stats: stats(18420, 980, 41, 88),
    issue: null,
    notes: [],
    script: `Завтрак можно собрать за 10 минут, без идеальной тарелки.
Основа: овсянка или творог, фрукт и горсть орехов.
Если утром нет голода — начните с воды и перенесите приём на час.
${DISCLAIMER}`,
  }),
  video({
    id: 'v-protein',
    title: 'Белок без куриной грудки',
    accountId: 'kz',
    language: 'ru',
    stage: 'ready',
    topic: 'белок',
    duration: '0:31',
    scheduledAt: '2026-10-07',
    published: true,
    gloss: null,
    cost: cost(360, 2250, 490),
    stats: stats(12110, 640, 29, 47),
    issue: null,
    notes: [],
    script: `Белок — это не только куриная грудка.
Яйца, творог, фасоль, чечевица и рыба закрывают ту же задачу.
Смотрите на тарелку целиком: белок, овощи и сытная основа.
${DISCLAIMER}`,
  }),
  video({
    id: 'v-post',
    title: 'Что поесть после тренировки',
    accountId: 'sport',
    language: 'ru',
    stage: 'ready',
    topic: 'еда после тренировки',
    duration: '0:30',
    scheduledAt: '2026-10-08',
    published: false,
    gloss: null,
    cost: cost(360, 2200, 480),
    stats: null,
    issue: issue(
      'Слот не подтверждён',
      'Учебная ошибка: слот 8 октября не ушёл в публикацию. Кабинет TikTok на этом этапе не подключён.',
    ),
    notes: [],
    script: `После тренировки достаточно обычной еды в ближайшие пару часов.
Соберите тарелку: источник белка, рис, картофель или хлеб и овощи.
Отдельный коктейль не обязателен, если обычный приём пищи доступен.
${DISCLAIMER}`,
  }),
  video({
    id: 'v-ferment',
    title: 'Ашытылған сусындар',
    accountId: 'qz',
    language: 'kk',
    stage: 'ready',
    topic: 'ашытылған сусындар',
    duration: '0:27',
    scheduledAt: null,
    published: false,
    gloss: `Кисломолочный напиток — не универсальное лекарство.
Не заменяйте еду кымызом, айраном или комбучей.
Если животу некомфортно, уменьшите порцию.
Это общая информация, не личный совет врача.`,
    cost: cost(400, 2300, 500),
    stats: null,
    issue: null,
    notes: [],
    script: `Ашытылған сусын — әмбебап ем емес.
Қымыз, айран немесе комбучаны тамақтың орнына қоймаңыз.
Егер іш ыңғайсыз болса, үлесті азайтыңыз.
Бұл жалпы ақпарат, дәрігердің жеке кеңесі емес.`,
  }),
  video({
    id: 'v-drink',
    title: 'Вода, чай или кофе утром',
    accountId: 'kz',
    language: 'ru',
    stage: 'review',
    topic: 'утренние напитки',
    duration: '0:25',
    scheduledAt: null,
    published: false,
    gloss: null,
    cost: cost(340, 2000, 460),
    stats: null,
    issue: null,
    notes: [],
    script: `Утром подойдёт вода. Чай и кофе — по самочувствию, не вместо еды.
Если кофе натощак вызывает дискомфорт, сначала позавтракайте.
У напитка нет задачи «разогнать метаболизм».
${DISCLAIMER}`,
  }),
  video({
    id: 'v-tan',
    title: 'Таңғы ас 10 минутта',
    accountId: 'qz',
    language: 'kk',
    stage: 'review',
    topic: 'таңғы ас',
    duration: '0:26',
    scheduledAt: null,
    published: false,
    gloss: `Завтрак готовится за 10 минут.
Овсянка, айран и горсть ягод — простой вариант.
Сладкое возьмите из фиников, сахарный сироп не добавляйте.
Это общая информация, не личный совет врача.`,
    cost: cost(420, 2300, 480),
    stats: null,
    issue: null,
    notes: [],
    script: `Таңғы ас 10 минутта дайындалады.
Сұлы, айран және бір уыс жидек — қарапайым нұсқа.
Тәттіні құрмадан алыңыз, қантты шәрбат қоспаңыз.
Бұл жалпы ақпарат, дәрігердің жеке кеңесі емес.`,
  }),
  video({
    id: 'v-bars',
    title: 'Сахар в «полезных» батончиках',
    accountId: 'mama',
    language: 'ru',
    stage: 'review',
    topic: 'батончики',
    duration: '0:29',
    scheduledAt: null,
    published: false,
    gloss: null,
    cost: cost(340, 2100, 460),
    stats: null,
    issue: null,
    notes: [],
    script: `Надпись «фитнес» на обёртке ещё не значит мало сахара.
Переверните батончик и смотрите сахар на порцию, а не только на 100 граммов.
Если состав длинный и сладкий — назовите это десертом.
${DISCLAIMER}`,
  }),
  video({
    id: 'v-office',
    title: 'Перекус, который доедет до офиса',
    accountId: 'kz',
    language: 'ru',
    stage: 'generation',
    topic: 'офисный перекус',
    duration: '0:24',
    scheduledAt: null,
    published: false,
    gloss: null,
    cost: cost(340, 0, 0),
    stats: null,
    issue: issue(
      'Генерация остановилась',
      'Учебная ошибка: HeyGen не ответил. Запрос не отправлялся — сервис на этом этапе не подключён.',
    ),
    notes: [],
    script: `Офисный перекус не должен развалиться в сумке.
Подойдут йогурт, яблоко, горсть миндаля или хлебец с творогом.
Держите его рядом, чтобы голод не закрывался случайной выпечкой.
${DISCLAIMER}`,
  }),
  video({
    id: 'v-evening',
    title: 'Вечерний голод',
    accountId: 'kz',
    language: 'ru',
    stage: 'generation',
    topic: 'вечерний голод',
    duration: '0:28',
    scheduledAt: null,
    published: false,
    gloss: null,
    cost: cost(350, 1800, 0),
    stats: null,
    issue: null,
    notes: [],
    script: `Вечерний голод часто оказывается усталостью.
Сначала вода и нормальный ужин: белок, овощи и тёплая сытная часть.
Запрет «после шести есть нельзя» в ролик не ставим.
${DISCLAIMER}`,
  }),
  video({
    id: 'v-nursing',
    title: 'Перекус для кормящих',
    accountId: 'mama',
    language: 'ru',
    stage: 'generation',
    topic: 'перекус для кормящих',
    duration: '0:30',
    scheduledAt: null,
    published: false,
    gloss: null,
    cost: cost(360, 0, 0),
    stats: null,
    issue: issue(
      'Пустой шаблон сборки',
      'Учебная ошибка: не заполнена переменная субтитров Creatomate. Сборка не запускалась.',
    ),
    notes: [],
    script: `Кормящей маме нужен понятный перекус, а не совет из чата.
Подойдут творог, фрукт, бутерброд с сыром или тёплый суп, если есть время.
Ролик не оценивает лактацию и не назначает диету.
${DISCLAIMER}`,
  }),
  video({
    id: 'v-detox',
    title: 'Миф о детокс-соках',
    accountId: 'mama',
    language: 'ru',
    stage: 'script',
    topic: 'детокс-соки',
    duration: '0:32',
    scheduledAt: null,
    published: false,
    gloss: null,
    cost: null,
    stats: null,
    issue: null,
    notes: [
      'Убрать обещание «очистит печень за три дня». Оставить спокойное объяснение мифа.',
    ],
    script: `Детокс-сок не чистит печень за три дня. Печень и так занимается этой работой.
Сок без мякоти — в основном сахар фрукта и мало сытости.
Спокойная замена: цельный фрукт, овощи и обычная вода в течение дня.
${DISCLAIMER}`,
  }),
  video({
    id: 'v-dates',
    title: 'Құрма мен жаңғақ',
    accountId: 'qz',
    language: 'kk',
    stage: 'script',
    topic: 'құрма мен жаңғақ',
    duration: '0:22',
    scheduledAt: null,
    published: false,
    gloss: `Сладкое можно собрать из фиников и орехов.
Это не конфета: держите порцию в одной горсти.
Орех и финик вместе насыщают дольше.
Это общая информация, не личный совет врача.`,
    cost: null,
    stats: null,
    issue: null,
    notes: [],
    script: `Тәттіні құрма мен жаңғақтан жинауға болады.
Бұл кәмпит емес: порцияны бір уыспен шектеңіз.
Жаңғақ пен құрма бірге ұзағырақ тойдырады.
Бұл жалпы ақпарат, дәрігердің жеке кеңесі емес.`,
  }),
  video({
    id: 'v-gym',
    title: 'Завтрак до тренировки',
    accountId: 'sport',
    language: 'ru',
    stage: 'script',
    topic: 'завтрак до тренировки',
    duration: '0:25',
    scheduledAt: null,
    published: false,
    gloss: null,
    cost: null,
    stats: null,
    issue: null,
    notes: [],
    script: `Перед залом не нужен сложный ритуал.
За час–полтора: творог или яйца, хлеб или банан и вода.
Если тренировка рано утром, хватит небольшого перекуса, который не тяжелит.
${DISCLAIMER}`,
  }),
  video({
    id: 'v-iron',
    title: 'Железо на обычной тарелке',
    accountId: 'mama',
    language: 'ru',
    stage: 'topic',
    topic: 'железо',
    duration: '0:30',
    scheduledAt: null,
    published: false,
    gloss: null,
    cost: null,
    stats: null,
    issue: null,
    notes: [],
    script: `Заготовка темы: железо в обычных продуктах — мясо, бобовые, гречка.
Ролик не ставит диагноз и не обещает поднять ферритин.
Дальше нужен сценарий с ясной оговоркой: анализы смотрит врач.`,
  }),
  video({
    id: 'v-palm',
    title: 'Тарелка по правилу ладони',
    accountId: 'kz',
    language: 'ru',
    stage: 'topic',
    topic: 'порция и ладонь',
    duration: '0:27',
    scheduledAt: null,
    published: false,
    gloss: null,
    cost: null,
    stats: null,
    issue: null,
    notes: [],
    script: `Заготовка темы: ладонь как простой ориентир порции, без подсчёта калорий.
Нужно прямо сказать, что это не точная норма для каждого.
Сценарий на русском для @nutrilora.kz.`,
  }),
  video({
    id: 'v-dinner',
    title: 'Ужин без второго захода',
    accountId: 'mama',
    language: 'ru',
    stage: 'topic',
    topic: 'сытный ужин',
    duration: '0:28',
    scheduledAt: null,
    published: false,
    gloss: null,
    cost: null,
    stats: null,
    issue: null,
    notes: [],
    script: `Заготовка темы: ужин, после которого меньше тянет на второй заход.
Идея тарелки: белок, овощи и тёплая сытная часть.
Без запрета продуктов и без обещания «ешьте это и похудеете».`,
  }),
]

export const INTEGRATIONS: IntegrationInfo[] = [
  {
    id: 'supabase',
    name: 'Supabase',
    purpose: 'Аккаунты, сценарии, статусы линии и календарь публикаций.',
    fields: ['URL проекта', 'Ключ API'],
    status: 'disconnected',
  },
  {
    id: 'n8n',
    name: 'n8n',
    purpose: 'Порядок шагов: тема, сценарий, генерация, проверка, публикация.',
    fields: ['URL сценария', 'Секрет вебхука'],
    status: 'disconnected',
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    purpose: 'Озвучка роликов на русском и казахском.',
    fields: ['Ключ API', 'Голос, русский', 'Голос, казахский'],
    status: 'disconnected',
  },
  {
    id: 'heygen',
    name: 'HeyGen',
    purpose: 'Говорящий аватар и сборка видеоряда.',
    fields: ['Ключ API', 'Идентификатор аватара'],
    status: 'disconnected',
  },
  {
    id: 'creatomate',
    name: 'Creatomate',
    purpose: 'Субтитры, плашки Nutrilora и вертикальная сборка ролика.',
    fields: ['Ключ API', 'Идентификатор шаблона'],
    status: 'disconnected',
  },
]

export const FLOW_STEPS = ['Supabase', 'n8n', 'ElevenLabs', 'HeyGen', 'Creatomate', 'Публикация']
