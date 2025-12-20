export const LANGUAGE_STORAGE_KEY = 'appLanguagePreference';
export const DEFAULT_LANGUAGE = 'default' as const;
export const SUPPORTED_LANGUAGES = ['default', 'pt-BR', 'en', 'es', 'ru'] as const;
export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LOCALES: Record<LanguageCode, string> = {
  default: 'en',
  'pt-BR': 'pt-BR',
  en: 'en',
  es: 'es',
  ru: 'ru'
};

const translationEntries = {
  'app.title': {
    default: 'Tibia Assets Editor',
    'pt-BR': 'Tibia Assets Editor',
    en: 'Tibia Assets Editor',
    es: 'Editor de Recursos de Tibia',
    ru: 'Редактор ресурсов Tibia'
  },
  'app.subtitle': {
    default: 'Professional Asset Management',
    'pt-BR': 'Gestão Profissional de Assets',
    en: 'Professional Asset Management',
    es: 'Gestión profesional de recursos',
    ru: 'Профессиональное управление ресурсами'
  },
  'loading.subtitle': {
    default: 'Professional Asset Management Tool',
    'pt-BR': 'Ferramenta profissional de gestão de assets',
    en: 'Professional Asset Management Tool',
    es: 'Herramienta profesional de gestión de recursos',
    ru: 'Профессиональный инструмент управления ресурсами'
  },
  'loading.text.initial': {
    default: 'Initializing...',
    'pt-BR': 'Inicializando...',
    en: 'Initializing...',
    es: 'Inicializando...',
    ru: 'Инициализация...'
  },
  'progress.step.initialize': {
    default: 'Inicializando aplicação...',
    'pt-BR': 'Inicializando aplicação...',
    en: 'Initializing application...',
    es: 'Inicializando la aplicación...',
    ru: 'Инициализация приложения...'
  },
  'progress.step.verify': {
    default: 'Verificando arquivos...',
    'pt-BR': 'Verificando arquivos...',
    en: 'Checking files...',
    es: 'Verificando archivos...',
    ru: 'Проверка файлов...'
  },
  'progress.step.loadSettings': {
    default: 'Carregando configurações...',
    'pt-BR': 'Carregando configurações...',
    en: 'Loading preferences...',
    es: 'Cargando preferencias...',
    ru: 'Загрузка настроек...'
  },
  'progress.step.prepare': {
    default: 'Preparando interface...',
    'pt-BR': 'Preparando interface...',
    en: 'Preparing interface...',
    es: 'Preparando la interfaz...',
    ru: 'Подготовка интерфейса...'
  },
  'progress.step.ready': {
    default: 'Pronto!',
    'pt-BR': 'Pronto!',
    en: 'Ready!',
    es: '¡Listo!',
    ru: 'Готово!'
  },
  'setup.heading': {
    default: '🎯 Setup Your Tibia Client',
    'pt-BR': '🎯 Configure seu cliente Tibia',
    en: '🎯 Set Up Your Tibia Client',
    es: '🎯 Configura tu cliente de Tibia',
    ru: '🎯 Настройте клиент Tibia'
  },
  'setup.tibiaPathPlaceholder': {
    default: 'C:\\Path\\To\\Tibia',
    'pt-BR': 'C:\\Caminho\\Para\\Tibia',
    en: 'C:\\Path\\To\\Tibia',
    es: 'C:\\Ruta\\A\\Tibia',
    ru: 'C:\\Путь\\К\\Tibia'
  },
  'setup.browseButton': {
    default: 'Selecionar diretório',
    'pt-BR': 'Selecionar diretório',
    en: 'Browse directory',
    es: 'Seleccionar directorio',
    ru: 'Выбрать папку'
  },
  'setup.loadButton': {
    default: 'Load Assets',
    'pt-BR': 'Carregar assets',
    en: 'Load assets',
    es: 'Cargar recursos',
    ru: 'Загрузить ресурсы'
  },
  'setup.returnToMenu': {
    default: 'Main menu',
    'pt-BR': 'Menu principal',
    en: 'Main menu',
    es: 'Menú principal',
    ru: 'Главное меню'
  },
  'select.placeholder': {
    default: 'Selecione',
    'pt-BR': 'Selecione',
    en: 'Select',
    es: 'Selecciona',
    ru: 'Выберите'
  },
  'header.settings.tooltip': {
    default: 'Configurações',
    'pt-BR': 'Configurações',
    en: 'Settings',
    es: 'Configuraciones',
    ru: 'Настройки'
  },
  'settings.language.title': {
    default: 'Linguagem',
    'pt-BR': 'Idioma',
    en: 'Language',
    es: 'Idioma',
    ru: 'Язык'
  },
  'settings.language.description': {
    default: 'Selecione o idioma da interface.',
    'pt-BR': 'Selecione o idioma da interface.',
    en: 'Choose the interface language.',
    es: 'Elige el idioma de la interfaz.',
    ru: 'Выберите язык интерфейса.'
  },
  'language.option.default': {
    default: 'Default (multilíngue)',
    'pt-BR': 'Padrão (multilíngue)',
    en: 'Default (multilingual)',
    es: 'Predeterminado (multilingüe)',
    ru: 'По умолчанию (мультиязычный)'
  },
  'language.option.pt': {
    default: 'Português',
    'pt-BR': 'Português',
    en: 'Portuguese',
    es: 'Portugués',
    ru: 'Португальский'
  },
  'language.option.en': {
    default: 'English',
    'pt-BR': 'Inglês',
    en: 'English',
    es: 'Inglés',
    ru: 'Английский'
  },
  'language.option.es': {
    default: 'Español',
    'pt-BR': 'Espanhol',
    en: 'Spanish',
    es: 'Español',
    ru: 'Испанский'
  },
  'language.option.ru': {
    default: 'Русский',
    'pt-BR': 'Russo',
    en: 'Russian',
    es: 'Ruso',
    ru: 'Русский'
  },
  'settings.theme.title': {
    default: 'Cores',
    'pt-BR': 'Cores',
    en: 'Colors',
    es: 'Colores',
    ru: 'Цвета'
  },
  'settings.theme.description': {
    default: 'Escolha um tema que combine com você.',
    'pt-BR': 'Escolha um tema que combine com você.',
    en: 'Choose a theme that suits you.',
    es: 'Elige un tema que te represente.',
    ru: 'Выберите тему по своему вкусу.'
  },
  'theme.default': {
    default: 'Padrão',
    'pt-BR': 'Padrão',
    en: 'Default',
    es: 'Predeterminado',
    ru: 'Стандартная'
  },
  'theme.ocean': {
    default: 'Oceanic',
    'pt-BR': 'Oceânica',
    en: 'Oceanic',
    es: 'Oceánica',
    ru: 'Океанская'
  },
  'theme.aurora': {
    default: 'Aurora',
    'pt-BR': 'Aurora',
    en: 'Aurora',
    es: 'Aurora',
    ru: 'Аврора'
  },
  'theme.ember': {
    default: 'Ember',
    'pt-BR': 'Brasa',
    en: 'Ember',
    es: 'Ascua',
    ru: 'Угли'
  },
  'theme.forest': {
    default: 'Floresta',
    'pt-BR': 'Floresta',
    en: 'Forest',
    es: 'Bosque',
    ru: 'Лес'
  },
  'theme.dusk': {
    default: 'Crepúsculo',
    'pt-BR': 'Crepúsculo',
    en: 'Dusk',
    es: 'Crepúsculo',
    ru: 'Сумерки'
  },
  'settings.preferences.title': {
    default: 'Preferências',
    'pt-BR': 'Preferências',
    en: 'Preferences',
    es: 'Preferencias',
    ru: 'Предпочтения'
  },
  'settings.preferences.autoAnimate': {
    default: 'Animação automática na grade',
    'pt-BR': 'Animação automática na grade',
    en: 'Automatic grid animation',
    es: 'Animación automática en la cuadrícula',
    ru: 'Автоматическая анимация сетки'
  },
  'settings.preferences.clearCache': {
    default: 'Limpar cache de sprites',
    'pt-BR': 'Limpar cache de sprites',
    en: 'Clear sprite cache',
    es: 'Limpiar caché de sprites',
    ru: 'Очистить кэш спрайтов'
  },
  'header.home.tooltip': {
    default: 'Tela inicial',
    'pt-BR': 'Tela inicial',
    en: 'Home',
    es: 'Inicio',
    ru: 'Главный экран'
  },
  'header.refresh.tooltip': {
    default: 'Refresh',
    'pt-BR': 'Atualizar',
    en: 'Refresh',
    es: 'Actualizar',
    ru: 'Обновить'
  },
  'category.objects': {
    default: 'Objects',
    'pt-BR': 'Objetos',
    en: 'Objects',
    es: 'Objetos',
    ru: 'Объекты'
  },
  'category.outfits': {
    default: 'Outfits',
    'pt-BR': 'Outfits',
    en: 'Outfits',
    es: ' Atuendos',
    ru: 'Наряды'
  },
  'category.effects': {
    default: 'Effects',
    'pt-BR': 'Efeitos',
    en: 'Effects',
    es: 'Efectos',
    ru: 'Эффекты'
  },
  'category.missiles': {
    default: 'Missiles',
    'pt-BR': 'Mísseis',
    en: 'Missiles',
    es: 'Misiles',
    ru: 'Снаряды'
  },
  'category.sounds': {
    default: 'Sounds',
    'pt-BR': 'Sons',
    en: 'Sounds',
    es: 'Sonidos',
    ru: 'Звуки'
  },
  'category.description.objects': {
    default: 'Items, decorações e objetos do jogo',
    'pt-BR': 'Items, decorações e objetos do jogo',
    en: 'Items, decorations, and game objects',
    es: 'Objetos, decoraciones y elementos del juego',
    ru: 'Предметы, декорации и игровые объекты'
  },
  'category.description.outfits': {
    default: 'Roupas e aparências de personagens',
    'pt-BR': 'Roupas e aparências de personagens',
    en: 'Character outfits and appearances',
    es: 'Apariencias y atuendos de personajes',
    ru: 'Наряды и внешности персонажей'
  },
  'category.description.effects': {
    default: 'Efeitos visuais e animações',
    'pt-BR': 'Efeitos visuais e animações',
    en: 'Visual effects and animations',
    es: 'Efectos visuales y animaciones',
    ru: 'Визуальные эффекты и анимации'
  },
  'category.description.missiles': {
    default: 'Projéteis e mísseis',
    'pt-BR': 'Projéteis e mísseis',
    en: 'Projectiles and missiles',
    es: 'Proyectiles y misiles',
    ru: 'Снаряды и ракеты'
  },
  'category.description.sounds': {
    default: 'Sons e efeitos sonoros',
    'pt-BR': 'Sons e efeitos sonoros',
    en: 'Sounds and audio effects',
    es: 'Sonidos y efectos de audio',
    ru: 'Звуки и звуковые эффекты'
  },
  'category.unknown': {
    default: 'Unknown',
    'pt-BR': 'Desconhecida',
    en: 'Unknown',
    es: 'Desconocida',
    ru: 'Неизвестная'
  },
  'general.unknown': {
    default: 'Desconhecido',
    'pt-BR': 'Desconhecido',
    en: 'Unknown',
    es: 'Desconocido',
    ru: 'Неизвестно'
  },
  'category.description.unknown': {
    default: 'Categoria desconhecida',
    'pt-BR': 'Categoria desconhecida',
    en: 'Unknown category',
    es: 'Categoría desconocida',
    ru: 'Неизвестная категория'
  },
  'count.items': {
    default: '{{count}} itens',
    'pt-BR': '{{count}} itens',
    en: '{{count}} items',
    es: '{{count}} elementos',
    ru: '{{count}} объектов'
  },
  'results.range': {
    default: '{{start}}-{{end}} de {{total}} itens',
    'pt-BR': '{{start}}-{{end}} de {{total}} itens',
    en: '{{start}}-{{end}} of {{total}} items',
    es: '{{start}}-{{end}} de {{total}} elementos',
    ru: '{{start}}-{{end}} из {{total}} объектов'
  },
  'subcategories.title': {
    default: 'Object Subcategories',
    'pt-BR': 'Subcategorias de objetos',
    en: 'Object subcategories',
    es: 'Subcategorías de objetos',
    ru: 'Подкатегории объектов'
  },
  'subcategory.armors': {
    default: 'Armors',
    'pt-BR': 'Armaduras',
    en: 'Armors',
    es: 'Armaduras',
    ru: 'Броня'
  },
  'subcategory.amulets': {
    default: 'Amulets',
    'pt-BR': 'Amuletos',
    en: 'Amulets',
    es: 'Amuletos',
    ru: 'Амулеты'
  },
  'subcategory.boots': {
    default: 'Boots',
    'pt-BR': 'Botas',
    en: 'Boots',
    es: 'Botas',
    ru: 'Сапоги'
  },
  'subcategory.containers': {
    default: 'Containers',
    'pt-BR': 'Contêineres',
    en: 'Containers',
    es: 'Contenedores',
    ru: 'Контейнеры'
  },
  'subcategory.decoration': {
    default: 'Decoration',
    'pt-BR': 'Decoração',
    en: 'Decoration',
    es: 'Decoración',
    ru: 'Декор'
  },
  'subcategory.food': {
    default: 'Food',
    'pt-BR': 'Comidas',
    en: 'Food',
    es: 'Comidas',
    ru: 'Еда'
  },
  'subcategory.helmetsHats': {
    default: 'Helmets & Hats',
    'pt-BR': 'Capacetes e chapéus',
    en: 'Helmets & hats',
    es: 'Cascos y sombreros',
    ru: 'Шлемы и шляпы'
  },
  'subcategory.legs': {
    default: 'Legs',
    'pt-BR': 'Pernas',
    en: 'Legs',
    es: 'Piernas',
    ru: 'Штаны'
  },
  'subcategory.potions': {
    default: 'Potions',
    'pt-BR': 'Poções',
    en: 'Potions',
    es: 'Pociones',
    ru: 'Зелья'
  },
  'subcategory.rings': {
    default: 'Rings',
    'pt-BR': 'Anéis',
    en: 'Rings',
    es: 'Anillos',
    ru: 'Кольца'
  },
  'subcategory.runes': {
    default: 'Runes',
    'pt-BR': 'Runas',
    en: 'Runes',
    es: 'Runas',
    ru: 'Руны'
  },
  'subcategory.shields': {
    default: 'Shields',
    'pt-BR': 'Escudos',
    en: 'Shields',
    es: 'Escudos',
    ru: 'Щиты'
  },
  'subcategory.tools': {
    default: 'Tools',
    'pt-BR': 'Ferramentas',
    en: 'Tools',
    es: 'Herramientas',
    ru: 'Инструменты'
  },
  'subcategory.valuables': {
    default: 'Valuables',
    'pt-BR': 'Valiosos',
    en: 'Valuables',
    es: 'Valiosos',
    ru: 'Ценности'
  },
  'subcategory.axes': {
    default: 'Axes',
    'pt-BR': 'Machados',
    en: 'Axes',
    es: 'Hachas',
    ru: 'Топоры'
  },
  'subcategory.clubs': {
    default: 'Clubs',
    'pt-BR': 'Clavas',
    en: 'Clubs',
    es: 'Mazas',
    ru: 'Дубины'
  },
  'subcategory.distance': {
    default: 'Distance',
    'pt-BR': 'Distância',
    en: 'Distance',
    es: 'Distancia',
    ru: 'Дистанционное'
  },
  'subcategory.swords': {
    default: 'Swords',
    'pt-BR': 'Espadas',
    en: 'Swords',
    es: 'Espadas',
    ru: 'Мечи'
  },
  'subcategory.wandsRods': {
    default: 'Wands & Rods',
    'pt-BR': 'Varinhas e cajados',
    en: 'Wands & rods',
    es: 'Varitas y bastones',
    ru: 'Жезлы и посохи'
  },
  'categoryView.back': {
    default: 'Back',
    'pt-BR': 'Voltar',
    en: 'Back',
    es: 'Volver',
    ru: 'Назад'
  },
  'search.placeholder': {
    default: 'Search assets...',
    'pt-BR': 'Pesquisar assets...',
    en: 'Search assets...',
    es: 'Buscar recursos...',
    ru: 'Поиск ресурсов...'
  },
  'pagination.aria': {
    default: 'Controle de paginação',
    'pt-BR': 'Controle de paginação',
    en: 'Pagination controls',
    es: 'Controles de paginación',
    ru: 'Управление страницами'
  },
  'pagination.previous': {
    default: 'Página anterior',
    'pt-BR': 'Página anterior',
    en: 'Previous page',
    es: 'Página anterior',
    ru: 'Предыдущая страница'
  },
  'pagination.next': {
    default: 'Próxima página',
    'pt-BR': 'Próxima página',
    en: 'Next page',
    es: 'Página siguiente',
    ru: 'Следующая страница'
  },
  'pagination.pageInfo': {
    default: '{{current}} de {{total}}',
    'pt-BR': '{{current}} de {{total}}',
    en: '{{current}} of {{total}}',
    es: '{{current}} de {{total}}',
    ru: '{{current}} из {{total}}'
  },
  'pageSize.aria': {
    default: 'Itens por página',
    'pt-BR': 'Itens por página',
    en: 'Items per page',
    es: 'Elementos por página',
    ru: 'Элементов на странице'
  },
  'subcategory.option.all': {
    default: 'All',
    'pt-BR': 'Todos',
    en: 'All',
    es: 'Todos',
    ru: 'Все'
  },
  'subcategory.option.allObjects': {
    default: 'Todas as subcategorias',
    'pt-BR': 'Todas as subcategorias',
    en: 'All subcategories',
    es: 'Todas las subcategorías',
    ru: 'Все подкатегории'
  },
  'subcategory.option.allSounds': {
    default: 'Todos os tipos',
    'pt-BR': 'Todos os tipos',
    en: 'All types',
    es: 'Todos los tipos',
    ru: 'Все типы'
  },
  'subcategory.ambienceStreams': {
    default: 'Ambience Streams',
    'pt-BR': 'Fluxos de ambientação',
    en: 'Ambience streams',
    es: 'Flujos de ambiente',
    ru: 'Потоки окружения'
  },
  'subcategory.ambienceObjectStreams': {
    default: 'Ambience Object Streams',
    'pt-BR': 'Fluxos de objetos ambiente',
    en: 'Ambience object streams',
    es: 'Flujos de objetos ambientales',
    ru: 'Потоки объектов окружения'
  },
  'subcategory.musicTemplates': {
    default: 'Music Templates',
    'pt-BR': 'Modelos de música',
    en: 'Music templates',
    es: 'Plantillas de música',
    ru: 'Музыкальные шаблоны'
  },
  'modal.detailsTab': {
    default: 'Asset Details',
    'pt-BR': 'Detalhes do asset',
    en: 'Asset details',
    es: 'Detalles del recurso',
    ru: 'Детали ресурса'
  },
  'modal.editTab': {
    default: 'Edit',
    'pt-BR': 'Editar',
    en: 'Edit',
    es: 'Editar',
    ru: 'Редактировать'
  },
  'modal.textureTab': {
    default: 'Texture',
    'pt-BR': 'Textura',
    en: 'Texture',
    es: 'Textura',
    ru: 'Текстура'
  },
  'modal.prevTooltip': {
    default: 'Previous asset',
    'pt-BR': 'Asset anterior',
    en: 'Previous asset',
    es: 'Recurso anterior',
    ru: 'Предыдущий ресурс'
  },
  'modal.nextTooltip': {
    default: 'Next asset',
    'pt-BR': 'Próximo asset',
    en: 'Next asset',
    es: 'Siguiente recurso',
    ru: 'Следующий ресурс'
  },
  'modal.nav.aria': {
    default: 'Navigate assets',
    'pt-BR': 'Navegar pelos assets',
    en: 'Navigate assets',
    es: 'Navegar por los recursos',
    ru: 'Навигация по ресурсам'
  },
  'files.availableTitle': {
    default: 'Available Appearance Files:',
    'pt-BR': 'Arquivos de aparências disponíveis:',
    en: 'Available appearance files:',
    es: 'Archivos de apariencias disponibles:',
    ru: 'Доступные файлы внешностей:'
  },
  'vocation.any': {
    default: 'Any',
    'pt-BR': 'Qualquer',
    en: 'Any',
    es: 'Cualquiera',
    ru: 'Любая'
  },
  'vocation.none': {
    default: 'None',
    'pt-BR': 'Nenhuma',
    en: 'None',
    es: 'Ninguna',
    ru: 'Нет'
  },
  'vocation.knight': {
    default: 'Knight',
    'pt-BR': 'Knight',
    en: 'Knight',
    es: 'Caballero',
    ru: 'Рыцарь'
  },
  'vocation.paladin': {
    default: 'Paladin',
    'pt-BR': 'Paladino',
    en: 'Paladin',
    es: 'Paladín',
    ru: 'Паладин'
  },
  'vocation.sorcerer': {
    default: 'Sorcerer',
    'pt-BR': 'Feiticeiro',
    en: 'Sorcerer',
    es: 'Hechicero',
    ru: 'Чародей'
  },
  'vocation.druid': {
    default: 'Druid',
    'pt-BR': 'Druida',
    en: 'Druid',
    es: 'Druida',
    ru: 'Друид'
  },
  'vocation.monk': {
    default: 'Monk',
    'pt-BR': 'Monge',
    en: 'Monk',
    es: 'Monje',
    ru: 'Монах'
  },
  'vocation.promoted': {
    default: 'Promoted',
    'pt-BR': 'Promovido',
    en: 'Promoted',
    es: 'Promocionado',
    ru: 'Продвинутый'
  },
  'status.enterPath': {
    default: 'Please enter the Tibia client path',
    'pt-BR': 'Informe o caminho do cliente Tibia',
    en: 'Please enter the Tibia client path',
    es: 'Ingresa la ruta del cliente de Tibia',
    ru: 'Укажите путь к клиенту Tibia'
  },
  'status.noFilesFound': {
    default: 'No appearance files found in the assets directory',
    'pt-BR': 'Nenhum arquivo de aparências encontrado no diretório de assets',
    en: 'No appearance files found in the assets directory',
    es: 'No se encontraron archivos de apariencias en el directorio de recursos',
    ru: 'В каталоге ресурсов не найдено файлов внешностей'
  },
  'status.loadError': {
    default: 'Error: {{message}}',
    'pt-BR': 'Erro: {{message}}',
    en: 'Error: {{message}}',
    es: 'Error: {{message}}',
    ru: 'Ошибка: {{message}}'
  },
  'status.directoryOpenFailed': {
    default: 'Failed to open directory selector',
    'pt-BR': 'Falha ao abrir o seletor de diretório',
    en: 'Failed to open directory selector',
    es: 'No se pudo abrir el selector de directorios',
    ru: 'Не удалось открыть выбор каталога'
  },
  'status.themeApplied': {
    default: 'Tema {{theme}} aplicado',
    'pt-BR': 'Tema {{theme}} aplicado',
    en: '{{theme}} theme applied',
    es: 'Tema {{theme}} aplicado',
    ru: 'Тема «{{theme}}» применена'
  },
  'status.languageUpdated': {
    default: 'Idioma atualizado para {{language}}',
    'pt-BR': 'Idioma atualizado para {{language}}',
    en: 'Language set to {{language}}',
    es: 'Idioma cambiado a {{language}}',
    ru: 'Язык переключен на {{language}}'
  },
  'status.cacheCleared': {
    default: 'Cache cleared successfully',
    'pt-BR': 'Cache limpo com sucesso',
    en: 'Cache cleared successfully',
    es: 'Caché borrado con éxito',
    ru: 'Кэш успешно очищен'
  },
  'status.assetsRefreshed': {
    default: 'Assets refreshed',
    'pt-BR': 'Assets atualizados',
    en: 'Assets refreshed',
    es: 'Recursos actualizados',
    ru: 'Ресурсы обновлены'
  },
  'status.autoAnimateEnabled': {
    default: 'Auto-animation enabled',
    'pt-BR': 'Animação automática ativada',
    en: 'Auto-animation enabled',
    es: 'Animación automática activada',
    ru: 'Автоматическая анимация включена'
  },
  'status.autoAnimateDisabled': {
    default: 'Auto-animation disabled',
    'pt-BR': 'Animação automática desativada',
    en: 'Auto-animation disabled',
    es: 'Animación automática desactivada',
    ru: 'Автоматическая анимация отключена'
  },
  'sounds.loading': {
    default: 'Loading sounds file...',
    'pt-BR': 'Carregando arquivo de sons...',
    en: 'Loading sounds file...',
    es: 'Cargando archivo de sonidos...',
    ru: 'Загрузка файла звуков...'
  },
  'sounds.loaded': {
    default: 'Loaded {{count}} sounds',
    'pt-BR': '{{count}} sons carregados',
    en: 'Loaded {{count}} sounds',
    es: '{{count}} sonidos cargados',
    ru: 'Загружено {{count}} звуков'
  },
  'sounds.loadFailed': {
    default: 'Failed to load sounds: {{message}}',
    'pt-BR': 'Falha ao carregar sons: {{message}}',
    en: 'Failed to load sounds: {{message}}',
    es: 'No se pudieron cargar los sonidos: {{message}}',
    ru: 'Не удалось загрузить звуки: {{message}}'
  },
  'status.invalidNumericId': {
    default: 'Please enter a valid numeric appearance ID.',
    'pt-BR': 'Informe um ID numérico válido para a aparência.',
    en: 'Please enter a valid numeric appearance ID.',
    es: 'Ingresa un ID numérico válido para la apariencia.',
    ru: 'Введите допустимый числовой идентификатор внешности.'
  },
  'status.appearanceNotFoundCurrentView': {
    default: 'Appearance {{id}} was not found in the current view.',
    'pt-BR': 'A aparência {{id}} não foi encontrada na visualização atual.',
    en: 'Appearance {{id}} was not found in the current view.',
    es: 'La apariencia {{id}} no se encontró en la vista actual.',
    ru: 'Внешность {{id}} не найдена в текущем представлении.'
  },
  'status.appearanceNotFound': {
    default: 'Unable to locate the requested appearance.',
    'pt-BR': 'Não foi possível localizar a aparência solicitada.',
    en: 'Unable to locate the requested appearance.',
    es: 'No se pudo localizar la apariencia solicitada.',
    ru: 'Не удалось найти указанную внешность.'
  },
  'status.selectAppearanceAction': {
    default: 'Selecione uma aparência para {{action}}.',
    'pt-BR': 'Selecione uma aparência para {{action}}.',
    en: 'Select an appearance to {{action}}.',
    es: 'Selecciona una apariencia para {{action}}.',
    ru: 'Выберите внешность, чтобы {{action}}.'
  },
  'status.selectMultipleAppearances': {
    default: 'Selecione pelo menos uma aparência para {{action}}.',
    'pt-BR': 'Selecione pelo menos uma aparência para {{action}}.',
    en: 'Select at least one appearance to {{action}}.',
    es: 'Selecciona al menos una apariencia para {{action}}.',
    ru: 'Выберите как минимум одну внешность, чтобы {{action}}.'
  },
  'status.appearanceExported': {
    default: 'Aparência #{{id}} exportada com sucesso',
    'pt-BR': 'Aparência #{{id}} exportada com sucesso',
    en: 'Appearance #{{id}} exported successfully',
    es: 'Apariencia #{{id}} exportada con éxito',
    ru: 'Внешность №{{id}} успешно экспортирована'
  },
  'status.appearanceExportFailed': {
    default: 'Falha ao exportar aparência',
    'pt-BR': 'Falha ao exportar aparência',
    en: 'Failed to export appearance',
    es: 'Error al exportar la apariencia',
    ru: 'Не удалось экспортировать внешность'
  },
  'prompt.importReplaceWarning': {
    default: 'A importação substituirá a aparência atual. Clique em Cancelar para importar como novo objeto.',
    'pt-BR': 'A importação substituirá a aparência atual. Clique em Cancelar para importar como novo objeto.',
    en: 'Import will replace the current appearance. Click Cancel to import as a new object.',
    es: 'La importación reemplazará la apariencia actual. Haz clic en Cancelar para importar como nuevo objeto.',
    ru: 'Импорт заменит текущую внешность. Нажмите «Отмена», чтобы импортировать как новый объект.'
  },
  'prompt.enterExportId': {
    default: 'Informe o ID da aparÇ¦ncia para exportar',
    'pt-BR': 'Informe o ID da aparÇ¦ncia para exportar',
    en: 'Enter the appearance ID to export',
    es: 'Introduce el ID de la apariencia para exportar',
    ru: "Ñ'ÑýÑæÑïÑ÷¥'Ñæ ID ÑýÑ«Ñæ¥^Ñ«Ñó¥?¥'¥O, ÑúÑøÑ¬ÑæÑ«Ñ÷¥'¥O ¥?Ñ§¥?Ñ¨Ñó¥?¥'Ñ÷¥?ÑóÑýÑø¥'¥O"
  },
  'prompt.enterImportStartId': {
    default: 'Informe o ID inicial para importar (deixe em branco para usar o ID do arquivo)',
    'pt-BR': 'Informe o ID inicial para importar (deixe em branco para usar o ID do arquivo)',
    en: 'Enter the start ID to import (leave blank to use the file ID)',
    es: 'Introduce el ID inicial para importar (dÇ¸jalo en blanco para usar el ID del archivo)',
    ru: "Ñ'ÑýÑæÑïÑ÷¥'Ñæ ÑýÑó¥?Ñû¥?Ñ¢ÑóÑýÑùÑý Ñ«ÑóÑý¥<Ñû ID ÑïÑ¯¥? Ñ÷Ñ¬Ñ¨Ñó¥?¥'Ñ÷¥?ÑóÑýÑø¥'¥O (Ñó¥?¥'ÑøÑý¥O¥'Ñæ Ñ¨¥Ÿ¥?¥'¥<Ñ¬ ÑïÑ¯¥? ÑøÑý¥'ÑóÑ¬Ñø¥'Ñ÷¥ÎÑæ¥?Ñ§ÑóÑüÑó Ñ«ÑøÑúÑ«Ñø¥ÎÑæÑ«Ñ÷¥?)"
  },
  'prompt.enterNewObjectId': {
    default: 'Insira um novo ID de objeto (deixe em branco para atribuição automática)',
    'pt-BR': 'Insira um novo ID de objeto (deixe em branco para atribuição automática)',
    en: 'Enter a new object ID (leave blank to auto assign)',
    es: 'Introduce un nuevo ID de objeto (déjalo en blanco para asignación automática)',
    ru: 'Введите новый ID объекта (оставьте пустым для автоматического назначения)'
  },
  'importStartIds.title': {
    default: 'Importar IDs iniciais',
    'pt-BR': 'Importar IDs iniciais',
    en: 'Import start IDs',
    es: 'Importar IDs iniciales',
    ru: 'Import start IDs'
  },
  'importStartIds.description': {
    default: 'Defina o ID inicial por categoria. Deixe em branco para usar o ID do arquivo.',
    'pt-BR': 'Defina o ID inicial por categoria. Deixe em branco para usar o ID do arquivo.',
    en: 'Set the start ID per category. Leave blank to use the file IDs.',
    es: 'Define el ID inicial por categoria. Deja en blanco para usar el ID del archivo.',
    ru: 'Set the start ID per category. Leave blank to use the file IDs.'
  },
  'importStartIds.header.category': {
    default: 'Categoria',
    'pt-BR': 'Categoria',
    en: 'Category',
    es: 'Categoria',
    ru: 'Category'
  },
  'importStartIds.header.latest': {
    default: 'Ultimo ID',
    'pt-BR': 'Ultimo ID',
    en: 'Latest ID',
    es: 'Ultimo ID',
    ru: 'Latest ID'
  },
  'importStartIds.header.start': {
    default: 'ID inicial',
    'pt-BR': 'ID inicial',
    en: 'Start ID',
    es: 'ID inicial',
    ru: 'Start ID'
  },
  'importStartIds.placeholder': {
    default: 'Use o ID do arquivo',
    'pt-BR': 'Use o ID do arquivo',
    en: 'Use file ID',
    es: 'Usar ID del archivo',
    ru: 'Use file ID'
  },
  'importStartIds.notInImport': {
    default: 'Nao esta no import',
    'pt-BR': 'Nao esta no import',
    en: 'Not in import',
    es: 'No esta en la importacion',
    ru: 'Not in import'
  },
  'importStartIds.notApplicable': {
    default: 'N/A',
    'pt-BR': 'N/A',
    en: 'N/A',
    es: 'N/D',
    ru: 'N/A'
  },
  'status.invalidIdAuto': {
    default: 'ID inválido fornecido. Usando atribuição automática.',
    'pt-BR': 'ID inválido fornecido. Usando atribuição automática.',
    en: 'Invalid ID provided. Using automatic assignment.',
    es: 'ID inválido. Se usará la asignación automática.',
    ru: 'Указан неверный ID. Используется автоматическое назначение.'
  },
  'status.invalidId': {
    default: 'ID invÇ­lido fornecido.',
    'pt-BR': 'ID invÇ­lido fornecido.',
    en: 'Invalid ID provided.',
    es: 'ID invÇ­lido.',
    ru: 'ÑœÑ§ÑøÑúÑøÑ« Ñ«ÑæÑýÑæ¥?Ñ«¥<Ñû ID.'
  },
  'status.appearanceImported': {
    default: 'Aparência importada como #{{id}}',
    'pt-BR': 'Aparência importada como #{{id}}',
    en: 'Appearance imported as #{{id}}',
    es: 'Apariencia importada como #{{id}}',
    ru: 'Внешность импортирована как №{{id}}'
  },
  'status.appearanceImportBatch': {
    default: 'AparÇ¦ncias importadas: {{count}}',
    'pt-BR': 'AparÇ¦ncias importadas: {{count}}',
    en: 'Imported appearances: {{count}}',
    es: 'Apariencias importadas: {{count}}',
    ru: "Ñ'Ñ«Ñæ¥^Ñ«Ñó¥?¥'¥O Ñ÷Ñ¬Ñ¨Ñó¥?¥'Ñ÷¥?ÑóÑýÑøÑ«¥'Ñø: {{count}}"
  },
  'status.appearanceImportSummary': {
    default: 'AparÇ¦ncias importadas: {{imported}} | Duplicadas ignoradas: {{skipped}}',
    'pt-BR': 'AparÇ¦ncias importadas: {{imported}} | Duplicadas ignoradas: {{skipped}}',
    en: 'Imported appearances: {{imported}} | Duplicates skipped: {{skipped}}',
    es: 'Apariencias importadas: {{imported}} | Duplicadas omitidas: {{skipped}}',
    ru: "Ñ'Ñ«Ñæ¥^Ñ«Ñó¥?¥'¥O Ñ÷Ñ¬Ñ¨Ñó¥?¥'Ñ÷¥?ÑóÑýÑøÑ«¥'Ñø: {{imported}} | Ñ|¥?Ñ«¥?Ñø¥?Ñõ¥?Ñ÷Ñ<Ñ<ÑçÑæÑ«¥'Ñø: {{skipped}}"
  },
  'status.appearanceImportFailed': {
    default: 'Falha ao importar aparência',
    'pt-BR': 'Falha ao importar aparência',
    en: 'Failed to import appearance',
    es: 'Error al importar la apariencia',
    ru: 'Не удалось импортировать внешность'
  },
  'prompt.enterDuplicateId': {
    default: 'Informe o novo ID para a aparência duplicada (deixe em branco para atribuição automática)',
    'pt-BR': 'Informe o novo ID para a aparência duplicada (deixe em branco para atribuição automática)',
    en: 'Enter the new ID for the duplicated appearance (leave blank to auto assign)',
    es: 'Introduce el nuevo ID para la apariencia duplicada (déjalo en blanco para asignación automática)',
    ru: 'Введите новый ID для дублированной внешности (оставьте пустым для автоматического назначения)'
  },
  'status.appearanceDuplicated': {
    default: 'Aparência duplicada como #{{id}}',
    'pt-BR': 'Aparência duplicada como #{{id}}',
    en: 'Appearance duplicated as #{{id}}',
    es: 'Apariencia duplicada como #{{id}}',
    ru: 'Внешность продублирована как №{{id}}'
  },
  'status.appearanceDuplicateFailed': {
    default: 'Falha ao duplicar aparência',
    'pt-BR': 'Falha ao duplicar aparência',
    en: 'Failed to duplicate appearance',
    es: 'Error al duplicar la apariencia',
    ru: 'Не удалось дублировать внешность'
  },
  'prompt.enterNewId': {
    default: 'Informe o ID da nova aparência (deixe em branco para atribuição automática)',
    'pt-BR': 'Informe o ID da nova aparência (deixe em branco para atribuição automática)',
    en: 'Enter the ID for the new appearance (leave blank to auto assign)',
    es: 'Introduce el ID para la nueva apariencia (déjalo en blanco para asignación automática)',
    ru: 'Введите ID новой внешности (оставьте пустым для автоматического назначения)'
  },
  'prompt.enterName': {
    default: 'Informe um nome para a nova aparência (opcional)',
    'pt-BR': 'Informe um nome para a nova aparência (opcional)',
    en: 'Enter a name for the new appearance (optional)',
    es: 'Introduce un nombre para la nueva apariencia (opcional)',
    ru: 'Введите имя для новой внешности (необязательно)'
  },
  'prompt.enterDescription': {
    default: 'Informe uma descrição para a nova aparência (opcional)',
    'pt-BR': 'Informe uma descrição para a nova aparência (opcional)',
    en: 'Enter a description for the new appearance (optional)',
    es: 'Introduce una descripción para la nueva apariencia (opcional)',
    ru: 'Введите описание новой внешности (необязательно)'
  },
  'status.appearanceCreated': {
    default: 'Nova aparência criada #{{id}}',
    'pt-BR': 'Nova aparência criada #{{id}}',
    en: 'Created new appearance #{{id}}',
    es: 'Nueva apariencia creada #{{id}}',
    ru: 'Создана новая внешность №{{id}}'
  },
  'status.appearanceCreateFailed': {
    default: 'Falha ao criar aparência',
    'pt-BR': 'Falha ao criar aparência',
    en: 'Failed to create appearance',
    es: 'Error al crear la apariencia',
    ru: 'Не удалось создать внешность'
  },
  'status.flagsCopied': {
    default: 'Flags copiadas de #{{id}}',
    'pt-BR': 'Flags copiadas de #{{id}}',
    en: 'Flags copied from #{{id}}',
    es: 'Banderas copiadas de #{{id}}',
    ru: 'Флаги скопированы из №{{id}}'
  },
  'status.flagsCopyFailed': {
    default: 'Falha ao copiar flags',
    'pt-BR': 'Falha ao copiar flags',
    en: 'Failed to copy flags',
    es: 'Error al copiar las banderas',
    ru: 'Не удалось скопировать флаги'
  },
  'status.flagsAppliedSingle': {
    default: 'Flags aplicadas em #{{id}}',
    'pt-BR': 'Flags aplicadas em #{{id}}',
    en: 'Flags applied to #{{id}}',
    es: 'Banderas aplicadas a #{{id}}',
    ru: 'Флаги применены к №{{id}}'
  },
  'status.flagsAppliedMultiple': {
    default: 'Flags aplicadas em {{count}} aparências',
    'pt-BR': 'Flags aplicadas em {{count}} aparências',
    en: 'Flags applied to {{count}} appearances',
    es: 'Banderas aplicadas a {{count}} apariencias',
    ru: 'Флаги применены к {{count}} внешностям'
  },
  'status.flagsPasteFailed': {
    default: 'Falha ao colar flags',
    'pt-BR': 'Falha ao colar flags',
    en: 'Failed to paste flags',
    es: 'Error al pegar las banderas',
    ru: 'Не удалось вставить флаги'
  },
  'confirm.deleteSingle': {
    default: 'Excluir aparência #{{id}}? Esta ação não pode ser desfeita.',
    'pt-BR': 'Excluir aparência #{{id}}? Esta ação não pode ser desfeita.',
    en: 'Delete appearance #{{id}}? This action cannot be undone.',
    es: '¿Eliminar la apariencia #{{id}}? Esta acción no se puede deshacer.',
    ru: 'Удалить внешность №{{id}}? Это действие нельзя отменить.'
  },
  'confirm.deleteMultiple': {
    default: 'Excluir {{count}} aparências ({{ids}})? Esta ação não pode ser desfeita.',
    'pt-BR': 'Excluir {{count}} aparências ({{ids}})? Esta ação não pode ser desfeita.',
    en: 'Delete {{count}} appearances ({{ids}})? This action cannot be undone.',
    es: '¿Eliminar {{count}} apariencias ({{ids}})? Esta acción no se puede deshacer.',
    ru: 'Удалить {{count}} внешностей ({{ids}})? Это действие нельзя отменить.'
  },
  'status.appearanceDeletedSingle': {
    default: 'Aparência #{{id}} excluída',
    'pt-BR': 'Aparência #{{id}} excluída',
    en: 'Appearance #{{id}} deleted',
    es: 'Apariencia #{{id}} eliminada',
    ru: 'Внешность №{{id}} удалена'
  },
  'status.appearanceDeletedMultiple': {
    default: '{{count}} aparências excluídas',
    'pt-BR': '{{count}} aparências excluídas',
    en: 'Deleted {{count}} appearances',
    es: 'Se eliminaron {{count}} apariencias',
    ru: 'Удалено внешностей: {{count}}'
  },
  'status.appearanceDeleteFailed': {
    default: 'Falha ao excluir aparência',
    'pt-BR': 'Falha ao excluir aparência',
    en: 'Failed to delete appearance',
    es: 'Error al eliminar la apariencia',
    ru: 'Не удалось удалить внешность'
  },
  'status.copyFlagsBeforePasting': {
    default: 'Copie as flags antes de colar.',
    'pt-BR': 'Copie as flags antes de colar.',
    en: 'Copy flags before pasting.',
    es: 'Copia las banderas antes de pegarlas.',
    ru: 'Скопируйте флаги перед вставкой.'
  },
  'status.textureSaved': {
    default: 'Configurações de textura salvas com sucesso.',
    'pt-BR': 'Configurações de textura salvas com sucesso.',
    en: 'Texture settings saved successfully.',
    es: 'Configuraciones de textura guardadas correctamente.',
    ru: 'Настройки текстуры успешно сохранены.'
  },
  'status.textureSaveFailed': {
    default: 'Falha ao salvar configurações de textura.',
    'pt-BR': 'Falha ao salvar configurações de textura.',
    en: 'Failed to save texture settings.',
    es: 'Error al guardar las configuraciones de textura.',
    ru: 'Не удалось сохранить настройки текстуры.'
  },
  'status.saving': {
    default: 'Salvando...',
    'pt-BR': 'Salvando...',
    en: 'Saving...',
    es: 'Guardando...',
    ru: 'Сохранение...'
  },
  'status.spriteReplaced': {
    default: 'Sprite atualizado na textura.',
    'pt-BR': 'Sprite atualizado na textura.',
    en: 'Sprite replaced on texture.',
    es: 'Sprite reemplazado en la textura.',
    ru: 'Спрайт заменен в текстуре.'
  },
  'status.spriteDropInvalid': {
    default: 'Nenhum sprite válido encontrado para soltar.',
    'pt-BR': 'Nenhum sprite válido encontrado para soltar.',
    en: 'No valid sprite found in the drop data.',
    es: 'No se encontró un sprite válido en el arrastre.',
    ru: 'Не удалось определить перетаскиваемый спрайт.'
  },
  'status.spriteDropOutOfRange': {
    default: 'Não há slots suficientes para aplicar esses sprites.',
    'pt-BR': 'Não há slots suficientes para aplicar esses sprites.',
    en: 'Not enough slots to apply these sprites.',
    es: 'No hay ranuras suficientes para aplicar estos sprites.',
    ru: 'Недостаточно слотов, чтобы применить эти спрайты.'
  },
  'status.spriteReplaceFailed': {
    default: 'Falha ao atualizar sprites da textura.',
    'pt-BR': 'Falha ao atualizar sprites da textura.',
    en: 'Failed to update texture sprites.',
    es: 'Error al actualizar los sprites de la textura.',
    ru: 'Не удалось обновить спрайты текстуры.'
  },
  'status.spriteRemoved': {
    default: 'Sprite removido da textura.',
    'pt-BR': 'Sprite removido da textura.',
    en: 'Sprite removed from texture.',
    es: 'Sprite eliminado de la textura.',
    ru: 'Спрайт удалён из текстуры.'
  },
  'status.spriteRemoveFailed': {
    default: 'Falha ao remover sprites da textura.',
    'pt-BR': 'Falha ao remover sprites da textura.',
    en: 'Failed to remove sprites from texture.',
    es: 'Error al eliminar sprites de la textura.',
    ru: 'Не удалось удалить спрайты из текстуры.'
  },
  'header.spriteLibrary': {
    default: 'Sprites',
    'pt-BR': 'Sprites',
    en: 'Sprites',
    es: 'Sprites',
    ru: 'Спрайты'
  },
  'status.spriteLibraryLoaded': {
    default: '{{count}} sprites carregados na biblioteca.',
    'pt-BR': '{{count}} sprites carregados na biblioteca.',
    en: '{{count}} sprites loaded into the library.',
    es: '{{count}} sprites cargados en la biblioteca.',
    ru: '{{count}} спрайтов загружено в библиотеку.'
  },
  'texture.drop.title': {
    default: 'Arraste sprites aqui',
    'pt-BR': 'Arraste sprites aqui',
    en: 'Drag sprites here',
    es: 'Arrastra sprites aquí',
    ru: 'Перетащите спрайты сюда'
  },
  'texture.drop.subtitle': {
    default: 'Solte para substituir. Use Ctrl para preencher quadros em sequência.',
    'pt-BR': 'Solte para substituir. Use Ctrl para preencher quadros em sequência.',
    en: 'Drop to replace. Hold Ctrl to fill subsequent frames.',
    es: 'Suelta para reemplazar. Usa Ctrl para llenar cuadros en secuencia.',
    ru: 'Отпустите, чтобы заменить. Удерживайте Ctrl, чтобы заполнить кадры по порядку.'
  },
  'texture.spriteList.title': {
    default: 'Lista de Sprites',
    'pt-BR': 'Lista de Sprites',
    en: 'Sprite List',
    es: 'Lista de sprites',
    ru: 'Список спрайтов'
  },
  'texture.spriteList.subtitle': {
    default: 'Arraste um sprite para a pré-visualização para trocá-lo rapidamente.',
    'pt-BR': 'Arraste um sprite para a pré-visualização para trocá-lo rapidamente.',
    en: 'Drag a sprite onto the preview to swap it quickly.',
    es: 'Arrastra un sprite a la vista previa para reemplazarlo rápidamente.',
    ru: 'Перетащите спрайт на превью, чтобы быстро заменить его.'
  },
  'texture.spriteList.slotLabel': {
    default: 'Slot {{value}}',
    'pt-BR': 'Slot {{value}}',
    en: 'Slot {{value}}',
    es: 'Ranura {{value}}',
    ru: 'Слот {{value}}'
  },
  'texture.spriteList.empty': {
    default: 'Nenhum sprite disponível para este grupo.',
    'pt-BR': 'Nenhum sprite disponível para este grupo.',
    en: 'No sprites available for this group.',
    es: 'No hay sprites disponibles para este grupo.',
    ru: 'Для этой группы нет спрайтов.'
  },
  'texture.spriteList.removeTooltip': {
    default: 'Remover sprite selecionado',
    'pt-BR': 'Remover sprite selecionado',
    en: 'Remove sprite from slot',
    es: 'Eliminar sprite del espacio',
    ru: 'Удалить спрайт из слота'
  },
  'texture.library.title': {
    default: 'Biblioteca de Sprites',
    'pt-BR': 'Biblioteca de Sprites',
    en: 'Sprite Library',
    es: 'Biblioteca de sprites',
    ru: 'Библиотека спрайтов'
  },
  'texture.library.searchPlaceholder': {
    default: 'IDs ou intervalos (ex: 100,120-130)',
    'pt-BR': 'IDs ou intervalos (ex: 100,120-130)',
    en: 'IDs or ranges (e.g. 100,120-130)',
    es: 'IDs o rangos (ej: 100,120-130)',
    ru: 'ID или диапазон (например 100,120-130)'
  },
  'texture.library.button.load': {
    default: 'Carregar',
    'pt-BR': 'Carregar',
    en: 'Load',
    es: 'Cargar',
    ru: 'Загрузить'
  },
  'texture.library.button.search': {
    default: 'Buscar IDs',
    'pt-BR': 'Buscar IDs',
    en: 'Search IDs',
    es: 'Buscar IDs',
    ru: 'Поиск ID'
  },
  'texture.library.button.open': {
    default: 'Abrir biblioteca de sprites',
    'pt-BR': 'Abrir biblioteca de sprites',
    en: 'Open sprite library',
    es: 'Abrir biblioteca de sprites',
    ru: 'Открыть библиотеку спрайтов'
  },
  'texture.library.button.close': {
    default: 'Fechar biblioteca',
    'pt-BR': 'Fechar biblioteca',
    en: 'Close library',
    es: 'Cerrar biblioteca',
    ru: 'Закрыть библиотеку'
  },
  'texture.library.hint': {
    default: 'Use vírgulas para múltiplos IDs ou intervalos com hífen (ex: 45, 80-90).',
    'pt-BR': 'Use vírgulas para múltiplos IDs ou intervalos com hífen (ex: 45, 80-90).',
    en: 'Use commas for multiple IDs or hyphenated ranges (e.g. 45, 80-90).',
    es: 'Usa comas para múltiples IDs o rangos con guión (ej: 45, 80-90).',
    ru: 'Используйте запятые для нескольких ID или диапазоны через дефис (например 45, 80-90).'
  },
  'texture.library.empty': {
    default: 'Nenhum sprite carregado ainda.',
    'pt-BR': 'Nenhum sprite carregado ainda.',
    en: 'No sprites loaded yet.',
    es: 'Aún no hay sprites cargados.',
    ru: 'Спрайты еще не загружены.'
  },
  'texture.library.start': {
    default: 'Início',
    'pt-BR': 'Início',
    en: 'Start',
    es: 'Inicio',
    ru: 'Начало'
  },
  'texture.library.pageSize': {
    default: 'Qtd',
    'pt-BR': 'Qtd',
    en: 'Count',
    es: 'Cant.',
    ru: 'Кол-во'
  },
  'texture.library.order': {
    default: 'Ordem',
    'pt-BR': 'Ordem',
    en: 'Order',
    es: 'Orden',
    ru: 'Порядок'
  },
  'texture.library.order.asc': {
    default: '1 → 9',
    'pt-BR': '1 → 9',
    en: '1 → 9',
    es: '1 → 9',
    ru: '1 → 9'
  },
  'texture.library.order.desc': {
    default: '9 → 1',
    'pt-BR': '9 → 1',
    en: '9 → 1',
    es: '9 → 1',
    ru: '9 → 1'
  },
  'texture.library.prev': {
    default: 'Página anterior',
    'pt-BR': 'Página anterior',
    en: 'Previous page',
    es: 'Página anterior',
    ru: 'Предыдущая страница'
  },
  'texture.library.next': {
    default: 'Próxima página',
    'pt-BR': 'Próxima página',
    en: 'Next page',
    es: 'Página siguiente',
    ru: 'Следующая страница'
  },
  'texture.animation.empty': {
    default: 'Nenhuma fase de animação definida.',
    'pt-BR': 'Nenhuma fase de animação definida.',
    en: 'No animation phases defined.',
    es: 'No hay fases de animación definidas.',
    ru: 'Фазы анимации не заданы.'
  },
  'texture.animation.phaseMax': {
    default: 'Máx',
    'pt-BR': 'Máx',
    en: 'Max',
    es: 'Máx',
    ru: 'Макс'
  },
  'texture.animation.phaseMin': {
    default: 'Fase {{index}} mín',
    'pt-BR': 'Fase {{index}} mín',
    en: 'Phase {{index}} min',
    es: 'Fase {{index}} mín',
    ru: 'Фаза {{index}} мин'
  },
  'texture.bounding.button.add': {
    default: 'Adicionar caixa delimitadora',
    'pt-BR': 'Adicionar caixa delimitadora',
    en: 'Add bounding box',
    es: 'Agregar caja delimitadora',
    ru: 'Добавить ограничивающую рамку'
  },
  'texture.bounding.empty': {
    default: 'Nenhuma caixa delimitadora definida.',
    'pt-BR': 'Nenhuma caixa delimitadora definida.',
    en: 'No bounding boxes defined.',
    es: 'No hay cajas delimitadoras definidas.',
    ru: 'Ограничивающие рамки не заданы.'
  },
  'texture.bounding.header.actions': {
    default: 'Ações',
    'pt-BR': 'Ações',
    en: 'Actions',
    es: 'Acciones',
    ru: 'Действия'
  },
  'texture.bounding.header.height': {
    default: 'Altura',
    'pt-BR': 'Altura',
    en: 'Height',
    es: 'Altura',
    ru: 'Высота'
  },
  'texture.bounding.header.index': {
    default: 'Nº',
    'pt-BR': 'Nº',
    en: '#',
    es: 'N.º',
    ru: '№'
  },
  'texture.bounding.header.width': {
    default: 'Largura',
    'pt-BR': 'Largura',
    en: 'Width',
    es: 'Ancho',
    ru: 'Ширина'
  },
  'texture.bounding.header.x': {
    default: 'X',
    'pt-BR': 'X',
    en: 'X',
    es: 'X',
    ru: 'X'
  },
  'texture.bounding.header.y': {
    default: 'Y',
    'pt-BR': 'Y',
    en: 'Y',
    es: 'Y',
    ru: 'Y'
  },
  'texture.emptyState.unsupported': {
    default: 'As ferramentas de textura estão disponíveis apenas para Objetos e Outfits.',
    'pt-BR': 'As ferramentas de textura estão disponíveis apenas para Objetos e Outfits.',
    en: 'Texture tools are only available for Objects and Outfits.',
    es: 'Las herramientas de textura solo están disponibles para Objetos y Outfits.',
    ru: 'Инструменты текстур доступны только для объектов и аутфитов.'
  },
  'texture.form.boundingSquare': {
    default: 'Quadrado delimitador',
    'pt-BR': 'Quadrado delimitador',
    en: 'Bounding square',
    es: 'Cuadrado delimitador',
    ru: 'Ограничивающий квадрат'
  },
  'texture.form.defaultStartPhase': {
    default: 'Fase inicial padrão',
    'pt-BR': 'Fase inicial padrão',
    en: 'Default start phase',
    es: 'Fase inicial predeterminada',
    ru: 'Начальная фаза по умолчанию'
  },
  'texture.form.frameCount': {
    default: 'Quantidade de quadros',
    'pt-BR': 'Quantidade de quadros',
    en: 'Frame count',
    es: 'Cantidad de fotogramas',
    ru: 'Количество кадров'
  },
  'texture.form.isAnimation': {
    default: 'Marcar como animação',
    'pt-BR': 'Marcar como animação',
    en: 'Mark as animation',
    es: 'Marcar como animación',
    ru: 'Пометить как анимацию'
  },
  'texture.form.isOpaque': {
    default: 'É opaco',
    'pt-BR': 'É opaco',
    en: 'Is opaque',
    es: 'Es opaco',
    ru: 'Непрозрачный'
  },
  'texture.form.layers': {
    default: 'Camadas',
    'pt-BR': 'Camadas',
    en: 'Layers',
    es: 'Capas',
    ru: 'Слои'
  },
  'texture.form.loopCount': {
    default: 'Número de loops',
    'pt-BR': 'Número de loops',
    en: 'Loop count',
    es: 'Número de bucles',
    ru: 'Число циклов'
  },
  'texture.form.loopType': {
    default: 'Tipo de loop',
    'pt-BR': 'Tipo de loop',
    en: 'Loop type',
    es: 'Tipo de bucle',
    ru: 'Тип цикла'
  },
  'texture.form.patternDepth': {
    default: 'Profundidade do padrão',
    'pt-BR': 'Profundidade do padrão',
    en: 'Pattern depth',
    es: 'Profundidad del patrón',
    ru: 'Глубина шаблона'
  },
  'texture.form.patternFrames': {
    default: 'Quadros do padrão',
    'pt-BR': 'Quadros do padrão',
    en: 'Pattern frames',
    es: 'Fotogramas del patrón',
    ru: 'Кадры шаблона'
  },
  'texture.form.patternHeight': {
    default: 'Altura do padrão',
    'pt-BR': 'Altura do padrão',
    en: 'Pattern height',
    es: 'Altura del patrón',
    ru: 'Высота шаблона'
  },
  'texture.form.patternWidth': {
    default: 'Largura do padrão',
    'pt-BR': 'Largura do padrão',
    en: 'Pattern width',
    es: 'Ancho del patrón',
    ru: 'Ширина шаблона'
  },
  'texture.form.randomStart': {
    default: 'Início aleatório',
    'pt-BR': 'Início aleatório',
    en: 'Random start phase',
    es: 'Fase inicial aleatoria',
    ru: 'Случайная начальная фаза'
  },
  'texture.form.synchronized': {
    default: 'Sincronizado',
    'pt-BR': 'Sincronizado',
    en: 'Synchronized',
    es: 'Sincronizado',
    ru: 'Синхронизировано'
  },
  'texture.preview.addon': {
    default: 'Addon',
    'pt-BR': 'Addon',
    en: 'Addon',
    es: 'Complemento',
    ru: 'Аддон'
  },
  'texture.preview.addonLabel': {
    default: 'Addon {{value}}',
    'pt-BR': 'Addon {{value}}',
    en: 'Addon {{value}}',
    es: 'Complemento {{value}}',
    ru: 'Аддон {{value}}'
  },
  'texture.preview.animatePreview': {
    default: 'Animar pré-visualização',
    'pt-BR': 'Animar pré-visualização',
    en: 'Animate preview',
    es: 'Animar vista previa',
    ru: 'Анимировать предпросмотр'
  },
  'texture.preview.background': {
    default: 'Fundo',
    'pt-BR': 'Fundo',
    en: 'Background',
    es: 'Fondo',
    ru: 'Фон'
  },
  'texture.preview.blendLayers': {
    default: 'Mesclar camadas',
    'pt-BR': 'Mesclar camadas',
    en: 'Blend layers',
    es: 'Mezclar capas',
    ru: 'Смешивать слои'
  },
  'texture.preview.colors.body': {
    default: 'Corpo',
    'pt-BR': 'Corpo',
    en: 'Body',
    es: 'Cuerpo',
    ru: 'Тело'
  },
  'texture.preview.colors.feet': {
    default: 'Pés',
    'pt-BR': 'Pés',
    en: 'Feet',
    es: 'Pies',
    ru: 'Ступни'
  },
  'texture.preview.colors.head': {
    default: 'Cabeça',
    'pt-BR': 'Cabeça',
    en: 'Head',
    es: 'Cabeza',
    ru: 'Голова'
  },
  'texture.preview.colors.legs': {
    default: 'Pernas',
    'pt-BR': 'Pernas',
    en: 'Legs',
    es: 'Piernas',
    ru: 'Ноги'
  },
  'texture.preview.direction.short.east': {
    default: 'L',
    'pt-BR': 'L',
    en: 'E',
    es: 'E',
    ru: 'В'
  },
  'texture.preview.direction.short.north': {
    default: 'N',
    'pt-BR': 'N',
    en: 'N',
    es: 'N',
    ru: 'С'
  },
  'texture.preview.direction.short.south': {
    default: 'S',
    'pt-BR': 'S',
    en: 'S',
    es: 'S',
    ru: 'Ю'
  },
  'texture.preview.direction.short.west': {
    default: 'O',
    'pt-BR': 'O',
    en: 'W',
    es: 'O',
    ru: 'З'
  },
  'texture.preview.frame': {
    default: 'Quadro',
    'pt-BR': 'Quadro',
    en: 'Frame',
    es: 'Fotograma',
    ru: 'Кадр'
  },
  'texture.preview.frameGroup': {
    default: 'Grupo de quadros',
    'pt-BR': 'Grupo de quadros',
    en: 'Frame group',
    es: 'Grupo de fotogramas',
    ru: 'Группа кадров'
  },
  'texture.preview.frameGroupOption': {
    default: 'Grupo {{index}}',
    'pt-BR': 'Grupo {{index}}',
    en: 'Group {{index}}',
    es: 'Grupo {{index}}',
    ru: 'Группа {{index}}'
  },
  'texture.preview.frameLabel': {
    default: 'Quadro {{value}}',
    'pt-BR': 'Quadro {{value}}',
    en: 'Frame {{value}}',
    es: 'Fotograma {{value}}',
    ru: 'Кадр {{value}}'
  },
  'texture.preview.layer': {
    default: 'Camada',
    'pt-BR': 'Camada',
    en: 'Layer',
    es: 'Capa',
    ru: 'Слой'
  },
  'texture.preview.mount': {
    default: 'Montaria',
    'pt-BR': 'Montaria',
    en: 'Mount',
    es: 'Montura',
    ru: 'Ездовое животное'
  },
  'texture.preview.patternX': {
    default: 'Padrão X',
    'pt-BR': 'Padrão X',
    en: 'Pattern X',
    es: 'Patrón X',
    ru: 'Шаблон X'
  },
  'texture.preview.patternY': {
    default: 'Padrão Y',
    'pt-BR': 'Padrão Y',
    en: 'Pattern Y',
    es: 'Patrón Y',
    ru: 'Шаблон Y'
  },
  'texture.preview.patternZ': {
    default: 'Padrão Z',
    'pt-BR': 'Padrão Z',
    en: 'Pattern Z',
    es: 'Patrón Z',
    ru: 'Шаблон Z'
  },
  'texture.preview.showBoundingBoxes': {
    default: 'Mostrar caixas delimitadoras',
    'pt-BR': 'Mostrar caixas delimitadoras',
    en: 'Show bounding boxes',
    es: 'Mostrar cajas delimitadoras',
    ru: 'Показывать ограничивающие рамки'
  },
  'texture.preview.showFullAddons': {
    default: 'Mostrar addons completos',
    'pt-BR': 'Mostrar addons completos',
    en: 'Show full addons',
    es: 'Mostrar complementos completos',
    ru: 'Показывать все аддоны'
  },
  'texture.section.animation': {
    default: 'Animação',
    'pt-BR': 'Animação',
    en: 'Animation',
    es: 'Animación',
    ru: 'Анимация'
  },
  'texture.section.boundingBoxes': {
    default: 'Caixas delimitadoras',
    'pt-BR': 'Caixas delimitadoras',
    en: 'Bounding boxes',
    es: 'Cajas delimitadoras',
    ru: 'Ограничивающие рамки'
  },
  'texture.section.spriteSettings': {
    default: 'Configurações de sprite',
    'pt-BR': 'Configurações de sprite',
    en: 'Sprite settings',
    es: 'Configuraciones de sprite',
    ru: 'Настройки спрайтов'
  },
  'texture.button.save': {
    default: 'Salvar textura',
    'pt-BR': 'Salvar textura',
    en: 'Save Texture',
    es: 'Guardar textura',
    ru: 'Сохранить текстуру'
  },
  'action.button.import': {
    default: 'Importar',
    'pt-BR': 'Importar',
    en: 'Import',
    es: 'Importar',
    ru: 'Импорт'
  },
  'action.button.cancel': {
    default: 'Cancelar',
    'pt-BR': 'Cancelar',
    en: 'Cancel',
    es: 'Cancelar',
    ru: 'Cancel'
  },
  'action.button.export': {
    default: 'Exportar',
    'pt-BR': 'Exportar',
    en: 'Export',
    es: 'Exportar',
    ru: 'Экспорт'
  },
  'action.button.duplicate': {
    default: 'Duplicar',
    'pt-BR': 'Duplicar',
    en: 'Duplicate',
    es: 'Duplicar',
    ru: 'Дублировать'
  },
  'action.button.copyFlags': {
    default: 'Copiar flags',
    'pt-BR': 'Copiar flags',
    en: 'Copy flags',
    es: 'Copiar banderas',
    ru: 'Копировать флаги'
  },
  'action.button.pasteFlags': {
    default: 'Colar flags',
    'pt-BR': 'Colar flags',
    en: 'Paste flags',
    es: 'Pegar banderas',
    ru: 'Вставить флаги'
  },
  'action.button.delete': {
    default: 'Excluir',
    'pt-BR': 'Excluir',
    en: 'Delete',
    es: 'Eliminar',
    ru: 'Удалить'
  },
  'action.button.new': {
    default: 'Novo',
    'pt-BR': 'Novo',
    en: 'New',
    es: 'Nuevo',
    ru: 'Новый'
  },
  'action.verb.import': {
    default: 'importar',
    'pt-BR': 'importar',
    en: 'import',
    es: 'importar',
    ru: 'импортировать'
  },
  'action.verb.export': {
    default: 'exportar',
    'pt-BR': 'exportar',
    en: 'export',
    es: 'exportar',
    ru: 'экспортировать'
  },
  'action.verb.duplicate': {
    default: 'duplicar',
    'pt-BR': 'duplicar',
    en: 'duplicate',
    es: 'duplicar',
    ru: 'дублировать'
  },
  'action.verb.copyFlagsFrom': {
    default: 'copiar flags de',
    'pt-BR': 'copiar flags de',
    en: 'copy flags from',
    es: 'copiar banderas de',
    ru: 'скопировать флаги из'
  },
  'action.verb.pasteFlagsInto': {
    default: 'colar flags em',
    'pt-BR': 'colar flags em',
    en: 'paste flags into',
    es: 'pegar banderas en',
    ru: 'вставить флаги в'
  },
  'action.verb.delete': {
    default: 'excluir',
    'pt-BR': 'excluir',
    en: 'delete',
    es: 'eliminar',
    ru: 'удалить'
  },
  'files.table.empty': {
    default: 'No data available',
    'pt-BR': 'Nenhum dado disponível',
    en: 'No data available',
    es: 'No hay datos disponibles',
    ru: 'Данные отсутствуют'
  }
} as const satisfies Record<string, Record<LanguageCode, string>>;

export type TranslationKey = keyof typeof translationEntries;

type ReplacementValues = Record<string, string | number>;

const translations: Record<LanguageCode, Record<TranslationKey, string>> = SUPPORTED_LANGUAGES.reduce(
  (tables, language) => {
    const languageTable = {} as Record<TranslationKey, string>;
    (Object.keys(translationEntries) as TranslationKey[]).forEach((key) => {
      languageTable[key] = translationEntries[key][language];
    });
    tables[language] = languageTable;
    return tables;
  },
  {} as Record<LanguageCode, Record<TranslationKey, string>>
);

function formatTemplate(template: string, replacements?: ReplacementValues): string {
  if (!replacements) {
    return template;
  }
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = replacements[key];
    return value !== undefined ? String(value) : '';
  });
}

let activeLanguage: LanguageCode = DEFAULT_LANGUAGE;

function resolveTemplate(language: LanguageCode, key: TranslationKey): string {
  const languageTable = translations[language] ?? translations[DEFAULT_LANGUAGE];
  return languageTable[key] ?? translations[DEFAULT_LANGUAGE][key];
}

export function translate(
  key: TranslationKey,
  replacements?: ReplacementValues,
  language: LanguageCode = activeLanguage
): string {
  const template = resolveTemplate(language, key);
  return formatTemplate(template, replacements);
}

export function setActiveLanguage(language: LanguageCode): void {
  activeLanguage = language;
}

export function getActiveLanguage(): LanguageCode {
  return activeLanguage;
}

function isTranslationKey(key: string | null | undefined): key is TranslationKey {
  return Boolean(key && key in translations[DEFAULT_LANGUAGE]);
}

const ATTRIBUTE_DATA_MAP: Record<string, string> = {
  'data-i18n-title': 'title',
  'data-i18n-placeholder': 'placeholder',
  'data-i18n-aria-label': 'aria-label',
  'data-i18n-aria-description': 'aria-description',
  'data-i18n-tooltip': 'title'
};

export function applyDocumentTranslations(language: LanguageCode): void {
  setActiveLanguage(language);

  document.title = translate('app.title', undefined, language);

  const elements = document.querySelectorAll<HTMLElement>('[data-i18n]');
  elements.forEach((element) => {
    const key = element.getAttribute('data-i18n');
    if (isTranslationKey(key)) {
      element.textContent = translate(key, undefined, language);
    }
  });

  Object.entries(ATTRIBUTE_DATA_MAP).forEach(([dataAttr, targetAttr]) => {
    document.querySelectorAll<HTMLElement>(`[${dataAttr}]`).forEach((element) => {
      const key = element.getAttribute(dataAttr);
      if (isTranslationKey(key)) {
        element.setAttribute(targetAttr, translate(key, undefined, language));
      }
    });
  });

  document.dispatchEvent(new CustomEvent('app-language-changed', {
    detail: { language }
  }));
}

export function getLanguageOptionLabel(language: LanguageCode, displayLanguage: LanguageCode = activeLanguage): string {
  return translate(`language.option.${language === 'pt-BR' ? 'pt' : language}` as TranslationKey, undefined, displayLanguage);
}

export function getThemeLabel(themeKey: 'default' | 'ocean' | 'aurora' | 'ember' | 'forest' | 'dusk', language: LanguageCode = activeLanguage): string {
  return translate(`theme.${themeKey}` as TranslationKey, undefined, language);
}




