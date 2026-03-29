import { settingsState } from './stores/settingsState.svelte';

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
    default: 'Canary Studio',
    'pt-BR': 'Canary Studio',
    en: 'Canary Studio',
    es: 'Canary Studio',
    ru: 'Canary Studio'
  },
  'launcher.hero.title': {
    default: 'Canary Studio',
    'pt-BR': 'Canary Studio',
    en: 'Canary Studio',
    es: 'Canary Studio',
    ru: 'Canary Studio'
  },
  'launcher.hero.subtitle': {
    default: 'Choose an editor to get started or adjust your preferences before diving in.',
    'pt-BR': 'Escolha um editor para começar ou ajuste suas preferências antes de mergulhar.',
    en: 'Choose an editor to get started or adjust your preferences before diving in.',
    es: 'Elige un editor para empezar o ajusta tus preferencias antes de sumergirte.',
    ru: 'Выберите редактор для начала или настройте свои предпочтения перед погружением.'
  },
  'launcher.tibia.title': {
    default: 'Tibia Client Configuration',
    'pt-BR': 'Configuração do Cliente Tibia',
    en: 'Tibia Client Configuration',
    es: 'Configuración del cliente de Tibia',
    ru: 'Конфигурация клиента Tibia'
  },
  'launcher.tibia.subtitle': {
    default: 'Select your Tibia client directory to enable the editors below.',
    'pt-BR': 'Selecione o diretório do seu cliente Tibia para habilitar os editores abaixo.',
    en: 'Select your Tibia client directory to enable the editors below.',
    es: 'Selecciona el directorio de tu cliente de Tibia para habilitar los editores a continuación.',
    ru: 'Выберите каталог клиента Tibia, чтобы включить редакторы ниже.'
  },
  'launcher.tibia.label': {
    default: 'Client Path',
    'pt-BR': 'Caminho do Cliente',
    en: 'Client Path',
    es: 'Ruta del cliente',
    ru: 'Путь к клиенту'
  },
  'launcher.tibia.browse': {
    default: 'Browse',
    'pt-BR': 'Procurar',
    en: 'Browse',
    es: 'Buscar',
    ru: 'Обзор'
  },
  'launcher.assets.title': {
    default: 'Assets editor',
    'pt-BR': 'Editor de Assets',
    en: 'Assets editor',
    es: 'Editor de recursos',
    ru: 'Редактор ресурсов'
  },
  'launcher.assets.desc': {
    default: 'Browse, edit and export appearance assets with the modern workflow.',
    'pt-BR': 'Navegue, edite e exporte assets de aparências com um fluxo de trabalho moderno.',
    en: 'Browse, edit and export appearance assets with the modern workflow.',
    es: 'Navega, edita y exporta recursos de apariencia con un flujo de trabajo moderno.',
    ru: 'Просматривайте, редактируйте и экспортируйте ресурсы внешности в современном рабочем процессе.'
  },
  'launcher.monster.title': {
    default: 'Monster editor',
    'pt-BR': 'Editor de Monstros',
    en: 'Monster editor',
    es: 'Editor de monstruos',
    ru: 'Редактор монстров'
  },
  'launcher.monster.desc': {
    default: 'Select a monster scripts folder to load encounter data just like assets.',
    'pt-BR': 'Selecione uma pasta de scripts de monstros para carregar dados de encontros da mesma forma que os assets.',
    en: 'Select a monster scripts folder to load encounter data just like assets.',
    es: 'Selecciona una carpeta de scripts de monstruos para cargar datos de encuentros al igual que los recursos.',
    ru: 'Выберите папку скриптов монстров, чтобы загрузить данные столкновений так же, как и ресурсы.'
  },
  'launcher.npc.title': {
    default: 'NPC editor',
    'pt-BR': 'Editor de NPCs',
    en: 'NPC editor',
    es: 'Editor de NPCs',
    ru: 'Редактор NPC'
  },
  'launcher.npc.desc': {
    default: 'Choose an NPC scripts directory and prepare dialogue for editing.',
    'pt-BR': 'Escolha um diretório de scripts de NPC e prepare os diálogos para edição.',
    en: 'Choose an NPC scripts directory and prepare dialogue for editing.',
    es: 'Elige un directorio de scripts de NPC y prepara los diálogos para su edición.',
    ru: 'Выберите каталог скриптов NPC и подготовьте диалоги для редактирования.'
  },
  'launcher.map.title': {
    default: 'Map editor',
    'pt-BR': 'Editor de Mapa',
    en: 'Map editor',
    es: 'Editor de mapas',
    ru: 'Редактор карт'
  },
  'launcher.map.desc': {
    default: 'Plan zones and biomes with procedural tools (coming soon).',
    'pt-BR': 'Planeje zonas e biomas com ferramentas procedurais (em breve).',
    en: 'Plan zones and biomes with procedural tools (coming soon).',
    es: 'Planifica zonas y biomas con herramientas procedimentales (próximamente).',
    ru: 'Планируйте зоны и биомы с помощью процедурных инструментов (скоро).'
  },
  'launcher.status.current': {
    default: 'Current',
    'pt-BR': 'Atual',
    en: 'Current',
    es: 'Actual',
    ru: 'Текущий'
  },
  'launcher.status.loading': {
    default: 'Loading...',
    'pt-BR': 'Carregando...',
    en: 'Loading...',
    es: 'Cargando...',
    ru: 'Загрузка...'
  },
  'launcher.status.ready': {
    default: 'Ready',
    'pt-BR': 'Pronto',
    en: 'Ready',
    es: 'Listo',
    ru: 'Готово'
  },
  'launcher.status.upcoming': {
    default: 'Coming up',
    'pt-BR': 'Em breve',
    en: 'Coming up',
    es: 'Próximamente',
    ru: 'Скоро'
  },
  'launcher.config.theme': {
    default: 'Interface colour',
    'pt-BR': 'Cor da interface',
    en: 'Interface colour',
    es: 'Color de la interfaz',
    ru: 'Цвет интерфейса'
  },
  'launcher.config.language': {
    default: 'Language',
    'pt-BR': 'Idioma',
    en: 'Language',
    es: 'Idioma',
    ru: 'Язык'
  },
  'launcher.config.language.auto': {
    default: 'Auto (multilingual)',
    'pt-BR': 'Auto (multilíngue)',
    en: 'Auto (multilingual)',
    es: 'Auto (multilingüe)',
    ru: 'Авто (мультиязычный)'
  },
  'launcher.assets.tooltip.noPath': {
    default: 'Please select a Tibia client path first',
    'pt-BR': 'Por favor, selecione o caminho do cliente Tibia primeiro',
    en: 'Please select a Tibia client path first',
    es: 'Por favor, selecciona primero la ruta del cliente de Tibia',
    ru: 'Сначала выберите путь к клиенту Tibia'
  },
  'launcher.monster.tooltip.force': {
    default: 'Hold Shift or Alt to select a new folder',
    'pt-BR': 'Segure Shift ou Alt para selecionar uma nova pasta',
    en: 'Hold Shift or Alt to select a new folder',
    es: 'Mantén presionado Shift o Alt para seleccionar una nueva carpeta',
    ru: 'Удерживайте Shift или Alt, чтобы выбрать новую папку'
  },
  'launcher.error.monsterPath': {
    default: 'Failed to select monster scripts folder',
    'pt-BR': 'Falha ao selecionar pasta de scripts de monstros',
    en: 'Failed to select monster scripts folder',
    es: 'Error al seleccionar la carpeta de scripts de monstruos',
    ru: 'Не удалось выбрать папку скриптов монстров'
  },
  'launcher.error.npcPath': {
    default: 'Failed to select NPC scripts folder',
    'pt-BR': 'Falha ao selecionar pasta de scripts de NPCs',
    en: 'Failed to select NPC scripts folder',
    es: 'Error al seleccionar la carpeta de scripts de NPCs',
    ru: 'Не удалось выбрать папку скриптов NPC'
  },
  'launcher.config.maintenance': {
    default: 'Maintenance',
    'pt-BR': 'Manutenção',
    en: 'Maintenance',
    es: 'Mantenimiento',
    ru: 'Обслуживание'
  },
  'launcher.config.refresh': {
    default: 'Refresh application',
    'pt-BR': 'Atualizar aplicação',
    en: 'Refresh application',
    es: 'Actualizar aplicación',
    ru: 'Обновить приложение'
  },
  'browser.static.back': {
    default: 'Voltar', 'pt-BR': 'Voltar', en: 'Back', es: 'Atrás', ru: 'Назад'
  },
  'browser.static.search': {
    default: 'Buscar itens...', 'pt-BR': 'Buscar itens...', en: 'Search items...', es: 'Buscar ítems...', ru: 'Поиск элементов...'
  },
  'browser.static.new': {
    default: '➕ Novo Item', 'pt-BR': '➕ Novo Item', en: '➕ New Item', es: '➕ Nuevo Elemento', ru: '➕ Новый элемент'
  },
  'browser.static.save': {
    default: '💾 Salvar .dat', 'pt-BR': '💾 Salvar .dat', en: '💾 Save .dat', es: '💾 Guardar .dat', ru: '💾 Сохранить .dat'
  },
  'browser.static.saving': {
    default: '⏳ Salvando...', 'pt-BR': '⏳ Salvando...', en: '⏳ Saving...', es: '⏳ Guardando...', ru: '⏳ Сохранение...'
  },
  'browser.static.local': {
    default: 'itens locais', 'pt-BR': 'itens locais', en: 'local items', es: 'elementos locales', ru: 'локальные элементы'
  },
  'browser.static.loading': {
    default: 'Carregando banco de dados da memória...', 'pt-BR': 'Carregando banco de dados da memória...', en: 'Loading database from memory...', es: 'Cargando base de datos desde memoria...', ru: 'Загрузка базы данных из памяти...'
  },
  'browser.static.unnamed': {
    default: 'Sem nome', 'pt-BR': 'Sem nome', en: 'Unnamed', es: 'Sin nombre', ru: 'Без названия'
  },
  'browser.static.mapLayout': {
    default: 'Layout do Mapa', 'pt-BR': 'Layout do Mapa', en: 'Map Layout', es: 'Diseño del mapa', ru: 'Макет карты'
  },
  'modal.static.c.creatures': {
    default: 'Nova Criatura', 'pt-BR': 'Nova Criatura', en: 'New Creature', es: 'Nueva criatura', ru: 'Новое существо'
  },
  'modal.static.c.bosses': {
    default: 'Novo Boss', 'pt-BR': 'Novo Boss', en: 'New Boss', es: 'Nuevo jefe', ru: 'Новый босс'
  },
  'modal.static.c.quests': {
    default: 'Nova Quest Tracker', 'pt-BR': 'Nova Quest Tracker', en: 'New Quest Tracker', es: 'Nuevo Quest Tracker', ru: 'Новый квест-трекер'
  },
  'modal.static.c.titles': {
    default: 'Novo Título', 'pt-BR': 'Novo Título', en: 'New Title', es: 'Nuevo título', ru: 'Новый титул'
  },
  'modal.static.c.default': {
    default: 'Novo Item', 'pt-BR': 'Novo Item', en: 'New Item', es: 'Nuevo elemento', ru: 'Новый элемент'
  },
  'modal.static.lbl.palette': {
    default: 'Paleta (HSL)', 'pt-BR': 'Paleta (HSL)', en: 'Palette (HSL)', es: 'Paleta (HSL)', ru: 'Палитра (HSL)'
  },
  'modal.static.lbl.idNum': {
    default: 'ID Numérico *', 'pt-BR': 'ID Numérico *', en: 'Numeric ID *', es: 'ID Numérico *', ru: 'Числовой ID *'
  },
  'modal.static.lbl.name': {
    default: 'Nome *', 'pt-BR': 'Nome *', en: 'Name *', es: 'Nombre *', ru: 'Имя *'
  },
  'modal.static.lbl.difficulty': {
    default: 'Dificuldade (0-5)', 'pt-BR': 'Dificuldade (0-5)', en: 'Difficulty (0-5)', es: 'Dificultad (0-5)', ru: 'Сложность (0-5)'
  },
  'modal.static.lbl.occurrence': {
    default: 'Ocorrência (0-5)', 'pt-BR': 'Ocorrência (0-5)', en: 'Occurrence (0-5)', es: 'Aparición (0-5)', ru: 'Встречаемость (0-5)'
  },
  'modal.static.lbl.isNpc': {
    default: 'Específico de NPC?', 'pt-BR': 'Específico de NPC?', en: 'NPC specific?', es: '¿Específico de NPC?', ru: 'Специфично для NPC?'
  },
  'modal.static.lbl.isHostile': {
    default: 'É Hostil? (Agressivo)', 'pt-BR': 'É Hostil? (Agressivo)', en: 'Is Hostile? (Aggressive)', es: '¿Es Hostil? (Agresivo)', ru: 'Враждебный? (Агрессивный)'
  },
  'modal.static.lbl.isArchfoe': {
    default: 'Contará como Archfoe na Bosstiary?', 'pt-BR': 'Contará como Archfoe na Bosstiary?', en: 'Count as Archfoe in Bosstiary?', es: '¿Contará como Archfoe en Bestiario?', ru: 'Считается Archfoe в Bosstiary?'
  },
  'modal.static.lbl.looktype': {
    default: 'LookType (ID Sprite)', 'pt-BR': 'LookType (ID Sprite)', en: 'LookType (Sprite ID)', es: 'LookType (ID Sprite)', ru: 'LookType (ID Спрайта)'
  },
  'modal.static.lbl.equip': {
    default: 'Equipamento / ID Base', 'pt-BR': 'Equipamento / ID Base', en: 'Equipment / Base ID', es: 'Equipamiento / ID Base', ru: 'Экипировка / Базовый ID'
  },
  'modal.static.lbl.addons': {
    default: 'Addons (0-3)', 'pt-BR': 'Addons (0-3)', en: 'Addons (0-3)', es: 'Addons (0-3)', ru: 'Аддоны (0-3)'
  },
  'modal.static.lbl.mount': {
    default: 'Tipo de Montaria', 'pt-BR': 'Tipo de Montaria', en: 'Mount Type', es: 'Tipo de montura', ru: 'Тип скакуна'
  },
  'modal.static.lbl.desc': {
    default: 'Descrição no Sistema', 'pt-BR': 'Descrição no Sistema', en: 'System Description', es: 'Descripción en Sistema', ru: 'Описание в системе'
  },
  'modal.static.lbl.descHint': {
    default: 'Mensagem do título...', 'pt-BR': 'Mensagem do título...', en: 'Title message...', es: 'Mensaje de título...', ru: 'Сообщение титула...'
  },
  'modal.static.lbl.grade': {
    default: 'Grade Num (se possuir)', 'pt-BR': 'Grade Num (se possuir)', en: 'Grade Num', es: 'Grade Num', ru: 'Номер ранга'
  },
  'modal.nav.prev': {
    default: 'Aparência anterior', 'pt-BR': 'Aparência anterior', en: 'Previous asset', es: 'Recurso anterior', ru: 'Предыдущий объект'
  },
  'modal.nav.next': {
    default: 'Próxima aparência', 'pt-BR': 'Próxima aparência', en: 'Next asset', es: 'Siguiente recurso', ru: 'Следующий объект'
  },
  'rcc.status.loading': {
    default: 'Carregando RCC...', 'pt-BR': 'Carregando RCC...', en: 'Loading RCC...', es: 'Cargando RCC...', ru: 'Загрузка RCC...'
  },
  'rcc.status.loaded': {
    default: 'Carregado {{count}} arquivos ({{size}})', 'pt-BR': 'Carregado {{count}} arquivos ({{size}})', en: 'Loaded {{count}} files ({{size}})', es: 'Cargado {{count}} archivos ({{size}})', ru: 'Загружено {{count}} файлов ({{size}})'
  },
  'rcc.status.error': {
    default: 'Erro: {{err}}', 'pt-BR': 'Erro: {{err}}', en: 'Error: {{err}}', es: 'Error: {{err}}', ru: 'Ошибка: {{err}}'
  },
  'rcc.status.replaced': {
    default: 'Substituído {{name}} ({{size}})', 'pt-BR': 'Substituído {{name}} ({{size}})', en: 'Replaced {{name}} ({{size}})', es: 'Reemplazado {{name}} ({{size}})', ru: 'Заменено {{name}} ({{size}})'
  },
  'rcc.status.deleted': {
    default: 'Excluído {{name}}', 'pt-BR': 'Excluído {{name}}', en: 'Deleted {{name}}', es: 'Eliminado {{name}}', ru: 'Удалено {{name}}'
  },
  'rcc.status.added': {
    default: '✅ Adicionado {{count}} recurso(s)', 'pt-BR': '✅ Adicionado {{count}} recurso(s)', en: '✅ Added {{count}} resource(s)', es: '✅ Agregado {{count}} recurso(s)', ru: '✅ Добавлено {{count}} ресурсов'
  },
  'rcc.status.extracting': {
    default: 'Extraindo...', 'pt-BR': 'Extraindo...', en: 'Extracting...', es: 'Extrayendo...', ru: 'Извлечение...'
  },
  'rcc.status.extractedCount': {
    default: 'Extraído {{count}} arquivos', 'pt-BR': 'Extraído {{count}} arquivos', en: 'Extracted {{count}} files', es: 'Extraído {{count}} archivos', ru: 'Извлечено {{count}} файлов'
  },
  'rcc.status.saved': {
    default: 'Salvo em {{path}}', 'pt-BR': 'Salvo em {{path}}', en: 'Saved to {{path}}', es: 'Guardado en {{path}}', ru: 'Сохранено в {{path}}'
  },
  'rcc.status.warningDim': {
    default: '⚠️ Aviso: imagem é {{width}}×{{height}} (esperado {{expWidth}}×{{expHeight}})', 'pt-BR': '⚠️ Aviso: imagem é {{width}}×{{height}} (esperado {{expWidth}}×{{expHeight}})', en: '⚠️ Warning: image is {{width}}×{{height}} (expected {{expWidth}}×{{expHeight}})', es: '⚠️ Aviso: la imagen es {{width}}×{{height}} (esperado {{expWidth}}×{{expHeight}})', ru: '⚠️ Предупреждение: размер изображения {{width}}×{{height}} (ожидается {{expWidth}}×{{expHeight}})'
  },
  'browser.static.type.creatures': {
    default: 'Creatures', 'pt-BR': 'Criaturas', en: 'Creatures', es: 'Criaturas', ru: 'Существа'
  },
  'browser.static.type.bosses': {
    default: 'Bosses', 'pt-BR': 'Bosses', en: 'Bosses', es: 'Jefes', ru: 'Боссы'
  },
  'browser.static.type.quests': {
    default: 'Quests', 'pt-BR': 'Quests', en: 'Quests', es: 'Misiones', ru: 'Квесты'
  },
  'browser.static.type.titles': {
    default: 'Titles', 'pt-BR': 'Títulos', en: 'Titles', es: 'Títulos', ru: 'Титулы'
  },
  'browser.static.type.houses': {
    default: 'Houses', 'pt-BR': 'Casas', en: 'Houses', es: 'Casas', ru: 'Дома'
  },
  'browser.static.type.mapHouses': {
    default: 'Map Houses', 'pt-BR': 'Layouts de Mapa', en: 'Map Layouts', es: 'Diseños de mapa', ru: 'Макеты карты'
  },
  'static.fallback.unnamed': {
    default: 'Item sem nome #{{id}}', 'pt-BR': 'Item sem nome #{{id}}', en: 'Unnamed Item #{{id}}', es: 'Elemento sin nombre #{{id}}', ru: 'Безымянный элемент #{{id}}'
  },
  'static.fallback.mapLayout': {
    default: 'Layout do Mapa #{{id}}', 'pt-BR': 'Layout do Mapa #{{id}}', en: 'Map Layout #{{id}}', es: 'Diseño del mapa #{{id}}', ru: 'Макет карты #{{id}}'
  },
  'modal.static.error.required': {
    default: 'ID e Nome são obrigatórios.', 'pt-BR': 'ID e Nome são obrigatórios.', en: 'ID and Name are required.', es: 'ID y Nombre son requeridos.', ru: 'ID и имя обязательны.'
  },
  'modal.static.btn.closeHint': {
    default: 'Fechar (Esc)', 'pt-BR': 'Fechar (Esc)', en: 'Close (Esc)', es: 'Cerrar (Esc)', ru: 'Закрыть (Esc)'
  },
  'npc.form.saved': {
    default: 'NPC salvo com sucesso!', 'pt-BR': 'NPC salvo com sucesso!', en: 'NPC saved successfully!', es: '¡NPC guardado con éxito!', ru: 'NPC успешно сохранен!'
  },
  'npc.form.error.save': {
    default: 'Falha ao salvar NPC: {{err}}', 'pt-BR': 'Falha ao salvar NPC: {{err}}', en: 'Failed to save NPC: {{err}}', es: 'Error al guardar NPC: {{err}}', ru: 'Ошибка сохранения NPC: {{err}}'
  },
  'npc.form.empty': {
    default: 'Selecione um NPC na barra lateral para começar a editar', 'pt-BR': 'Selecione um NPC na barra lateral para começar a editar', en: 'Select an NPC from the sidebar to start editing', es: 'Selecciona un NPC de la barra lateral para empezar a editar', ru: 'Выберите NPC на боковой панели, чтобы начать редактирование'
  },
  'npc.form.saveBtn': {
    default: 'Salvar NPC', 'pt-BR': 'Salvar NPC', en: 'Save NPC', es: 'Guardar NPC', ru: 'Сохранить NPC'
  },
  'npc.sidebar.search': {
    default: 'Buscar NPCs...', 'pt-BR': 'Buscar NPCs...', en: 'Search NPCs...', es: 'Buscar NPCs...', ru: 'Поиск NPC...'
  },
  'npc.sidebar.loading': {
    default: 'Carregando NPCs...', 'pt-BR': 'Carregando NPCs...', en: 'Loading NPCs...', es: 'Cargando NPCs...', ru: 'Загрузка NPC...'
  },
  'npc.sidebar.emptyDir': {
    default: 'Diretório de NPCs não configurado.', 'pt-BR': 'Diretório de NPCs não configurado.', en: 'NPC directory not configured.', es: 'Directorio de NPCs no configurado.', ru: 'Каталог NPC не настроен.'
  },
  'npc.sidebar.noNpcs': {
    default: 'Nenhum NPC encontrado.', 'pt-BR': 'Nenhum NPC encontrado.', en: 'No NPCs found.', es: 'No se encontraron NPCs.', ru: 'NPC не найдены.'
  },
  'npc.sidebar.newNpc': { default: 'Novo NPC', 'pt-BR': 'Novo NPC', en: 'New NPC', es: 'Nuevo NPC', ru: 'Новый NPC' },
  'npc.sidebar.sync': { default: 'Sincronizar Lojas', 'pt-BR': 'Sincronizar Lojas', en: 'Sync Shops', es: 'Sincronizar tiendas', ru: 'Синхронизация магазинов' },
  'npc.list.noSelection': { default: 'Selecione um NPC para editar', 'pt-BR': 'Selecione um NPC para editar', en: 'Select an NPC to edit', es: 'Selecciona un NPC para editar', ru: 'Выберите NPC для редактирования' },
  'npc.list.error.load': { default: 'Falha ao carregar NPC: {{err}}', 'pt-BR': 'Falha ao carregar NPC: {{err}}', en: 'Failed to load NPC: {{err}}', es: 'Error ao carregar NPC: {{err}}', ru: 'Ошибка загрузки NPC: {{err}}' },

  // NPC Voices Card
  'npc.card.voices.title': { default: '💬 Voices', 'pt-BR': '💬 Vozes', en: '💬 Voices', es: '💬 Voces', ru: '💬 Голоса' },
  'npc.card.voices.empty': { default: 'No voices configured.', 'pt-BR': 'Nenhuma voz configurada.', en: 'No voices configured.', es: 'No hay voces configuradas.', ru: 'Голоса не настроены.' },
  'npc.card.voices.addSetup': { default: 'Add Voice Setup', 'pt-BR': 'Adicionar Config. de Voz', en: 'Add Voice Setup', es: 'Agregar setup de voz', ru: 'Добавить настройки голоса' },
  'npc.card.voices.interval': { default: 'Interval (ms)', 'pt-BR': 'Intervalo (ms)', en: 'Interval (ms)', es: 'Intervalo (ms)', ru: 'Интервал (мс)' },
  'npc.card.voices.chance': { default: 'Chance (%)', 'pt-BR': 'Chance (%)', en: 'Chance (%)', es: 'Probabilidad (%)', ru: 'Шанс (%)' },
  'npc.card.voices.addQuote': { default: '+ Add Quote', 'pt-BR': '+ Add Frase', en: '+ Add Quote', es: '+ Agregar frase', ru: '+ Добавить фразу' },
  'npc.card.voices.placeholder': { default: 'NPC Quote...', 'pt-BR': 'Frase do NPC...', en: 'NPC Quote...', es: 'Frase del NPC...', ru: 'Фраза NPC...' },
  'npc.card.voices.yell': { default: 'Yell', 'pt-BR': 'Gritar', en: 'Yell', es: 'Gritar', ru: 'Крик' },
  'npc.card.voices.remove': { default: 'Remove Voice', 'pt-BR': 'Remover Voz', en: 'Remove Voice', es: 'Eliminar voz', ru: 'Удалить голос' },

  // NPC Shop Card
  'npc.card.shop.title': { default: '🛍️ Shop Inventory', 'pt-BR': '🛍️ Inventário da Loja', en: '🛍️ Shop Inventory', es: '🛍️ Inventario de tienda', ru: '🛍️ Инвентарь магазина' },
  'npc.card.shop.empty': { default: 'No items sold.', 'pt-BR': 'Nenhum item vendido.', en: 'No items sold.', es: 'No hay artículos vendidos.', ru: 'Товары не продаются.' },
  'npc.card.shop.addFirst': { default: 'Add First Item', 'pt-BR': 'Adicionar Primeiro Item', en: 'Add First Item', es: 'Agregar primer artículo', ru: 'Добавить primeiro товар' },
  'npc.card.shop.addItem': { default: '+ Add Item', 'pt-BR': '+ Adicionar Item', en: '+ Add Item', es: '+ Agregar artículo', ru: '+ Добавить товар' },
  'npc.card.shop.itemName': { default: 'Item Name', 'pt-BR': 'Nome do Item', en: 'Item Name', es: 'Nombre del artículo', ru: 'Название товара' },
  'npc.card.shop.clientId': { default: 'Client ID', 'pt-BR': 'Client ID', en: 'Client ID', es: 'Client ID', ru: 'Client ID' },
  'npc.card.shop.buyPrice': { default: 'Buy Price', 'pt-BR': 'Preço de Compra', en: 'Buy Price', es: 'Precio de compra', ru: 'Цена покупки' },
  'npc.card.shop.sellPrice': { default: 'Sell Price', 'pt-BR': 'Preço de Venda', en: 'Sell Price', es: 'Precio de venta', ru: 'Цена продажи' },

  // NPC Dialogues Card
  'npc.card.dialogues.title': { default: '💬 Diálogos e Palavras-chave', 'pt-BR': '💬 Diálogos e Palavras-chave', en: '💬 Dialogues & Keywords', es: '💬 Diálogos y palabras clave', ru: '💬 Диалоги и ключевые слова' },
  'npc.card.dialogues.enableLib': { default: 'Habilitar NpcLib', 'pt-BR': 'Habilitar NpcLib', en: 'Enable NpcLib', es: 'Habilitar NpcLib', ru: 'Включить NpcLib' },
  'npc.card.dialogues.greet': { default: 'Mensagem de Saudações (GREET)', 'pt-BR': 'Mensagem de Saudações (GREET)', en: 'Greeting Message (GREET)', es: 'Mensaje de saludo (GREET)', ru: 'Приветствие (GREET)' },
  'npc.card.dialogues.farewell': { default: 'Mensagem de Despedida (FAREWELL)', 'pt-BR': 'Mensagem de Despedida (FAREWELL)', en: 'Farewell Message (FAREWELL)', es: 'Mensaje de despedida (FAREWELL)', ru: 'Прощание (FAREWELL)' },
  'npc.card.dialogues.walkaway': { default: 'Mensagem ao Ignorar (WALKAWAY)', 'pt-BR': 'Mensagem ao Ignorar (WALKAWAY)', en: 'Walkaway Message (WALKAWAY)', es: 'Mensaje al alejarse (WALKAWAY)', ru: 'Сообщение при уходе (WALKAWAY)' },
  'npc.card.dialogues.keywords': { default: 'Respostas Diretas (Keywords)', 'pt-BR': 'Respostas Diretas (Keywords)', en: 'Direct Responses (Keywords)', es: 'Respuestas directas (Keywords)', ru: 'Прямые ответы (Ключевые слова)' },
  'npc.card.dialogues.newRule': { default: '+ Nova Regra', 'pt-BR': '+ Nova Regra', en: '+ New Rule', es: '+ Nueva regla', ru: '+ Новое правило' },
  'npc.card.dialogues.empty': { default: 'Nenhuma resposta direta configurada.', 'pt-BR': 'Nenhuma resposta direta configurada.', en: 'No direct responses configured.', es: 'No hay respuestas directas configuradas.', ru: 'Прямые ответы не настроены.' },
  'npc.card.dialogues.triggers': { default: 'Gatilhos', 'pt-BR': 'Gatilhos', en: 'Triggers', es: 'Disparadores', ru: 'Триггеры' },
  'npc.card.dialogues.triggersHint': { default: '(comma separated)', 'pt-BR': '(vírgula para múltiplos)', en: '(comma separated)', es: '(separados por coma)', ru: '(через запятую)' },
  'npc.card.dialogues.greetPl': { default: 'Ex: Greetings, |PLAYERNAME|.', 'pt-BR': 'Ex: Saudações, |PLAYERNAME|.', en: 'Ex: Greetings, |PLAYERNAME|.', es: 'Ej: Saludos, |PLAYERNAME|.', ru: 'Пример: Приветствую, |PLAYERNAME|.' },
  'npc.card.dialogues.farewellPl': { default: 'Ex: Farewell, |PLAYERNAME|.', 'pt-BR': 'Ex: Adeus, |PLAYERNAME|.', en: 'Ex: Farewell, |PLAYERNAME|.', es: 'Ej: Adiós, |PLAYERNAME|.', ru: 'Пример: Прощайте, |PLAYERNAME|.' },
  'npc.card.dialogues.walkawayPl': { default: 'Ex: Good bye.', 'pt-BR': 'Ex: Tchau.', en: 'Ex: Good bye.', es: 'Ej: Adiós.', ru: 'Пример: До свидания.' },
  'npc.card.dialogues.triggersPl': { default: 'Ex: hi, hello', 'pt-BR': 'Ex: oi, olá', en: 'Ex: hi, hello', es: 'Ej: hola, que tal', ru: 'Пример: привет, хай' },
  'npc.card.dialogues.responsePl': { default: 'Ex: Hello mortal!', 'pt-BR': 'Ex: Olá mortal!', en: 'Ex: Hello mortal!', es: 'Ej: ¡Hola mortal!', ru: 'Пример: Привет, смертный!' },
  'npc.card.dialogues.response': { default: 'Resposta do NPC', 'pt-BR': 'Resposta do NPC', en: 'NPC Response', es: 'Respuesta del NPC', ru: 'Ответ NPC' },
  'npc.card.dialogues.removeKw': { default: 'Remover Keyword', 'pt-BR': 'Remover Palavra-chave', en: 'Remove Keyword', es: 'Eliminar palabra clave', ru: 'Удалить ключевое слово' },
  'npc.card.dialogues.hint': { default: 'Habilite esta opção para adicionar lógicas conversacionais a este NPC.', 'pt-BR': 'Habilite esta opção para adicionar lógicas conversacionais a este NPC.', en: 'Enable this option to add conversational logic to this NPC.', es: 'Habilita esta opción para agregar lógica conversacional a este NPC.', ru: 'Включите эту опцию, чтобы добавить логику диалога этому NPC.' },

  // NPC Sync Modal
  'npc.modal.sync.title': { default: 'Sync NPC Shops', 'pt-BR': 'Sincronizar Lojas de NPCs', en: 'Sync NPC Shops', es: 'Sincronizar tiendas de NPCs', ru: 'Синхронизация магазинов NPC' },
  'npc.modal.sync.desc': { default: 'Updates NPC shop inventories from Proto or Fandom source.', 'pt-BR': 'Atualiza os inventários das lojas de NPCs a partir do Proto ou Fandom.', en: 'Updates NPC shop inventories from Proto or Fandom source.', es: 'Actualiza los inventarios de las tiendas de NPCs desde Proto o Fandom.', ru: 'Обновление инвентаря магазинов NPC из Proto или Fandom.' },
  'npc.modal.sync.source': { default: 'Source', 'pt-BR': 'Origem', en: 'Source', es: 'Fuente', ru: 'Источник' },
  'npc.modal.sync.source.proto': { default: 'Proto (loaded appearances)', 'pt-BR': 'Proto (aparências carregadas)', en: 'Proto (loaded appearances)', es: 'Proto (apariencias cargadas)', ru: 'Proto (загруженные внешности)' },
  'npc.modal.sync.source.fandom': { default: 'Fandom (Category:NPCs)', 'pt-BR': 'Fandom (Category:NPCs)', en: 'Fandom (Category:NPCs)', es: 'Fandom (Categoría:NPCs)', ru: 'Fandom (Категория:NPCs)' },
  'npc.modal.sync.itemsXml': { default: 'items.xml path', 'pt-BR': 'Caminho do items.xml', en: 'items.xml path', es: 'Ruta de items.xml', ru: 'Путь к items.xml' },
  'npc.modal.sync.ignoreIds': { default: 'Ignore Item IDs (comma-separated)', 'pt-BR': 'Ignorar IDs de Itens (separados por vírgula)', en: 'Ignore Item IDs (comma-separated)', es: 'Ignorar IDs de artículos (separados por coma)', ru: 'Игнорировать ID предметов (через запятую)' },
  'npc.modal.sync.ignoreNames': { default: 'Ignore Item Names (comma-separated)', 'pt-BR': 'Ignorar Nomes de Itens (separados por vírgula)', en: 'Ignore Item Names (comma-separated)', es: 'Ignorar nombres de artículos (separados por coma)', ru: 'Игнорировать названия предметов (через запятую)' },
  'npc.modal.sync.keepCustom': { default: 'Keep custom items (items not in source)', 'pt-BR': 'Manter itens personalizados (itens não na origem)', en: 'Keep custom items (items not in source)', es: 'Mantener artículos personalizados', ru: 'Сохранять кастомные предметы' },
  'npc.modal.sync.btn.syncing': { default: 'Syncing...', 'pt-BR': 'Sincronizando...', en: 'Syncing...', es: 'Sincronizando...', ru: 'Синхронизация...' },
  'npc.modal.sync.btn.syncAll': { default: 'Sync All NPCs', 'pt-BR': 'Sincronizar Todos NPCs', en: 'Sync All NPCs', es: 'Sincronizar todos los NPCs', ru: 'Синхронизировать всех NPC' },
  'npc.modal.sync.result.scanned': { default: 'NPCs scanned:', 'pt-BR': 'NPCs verificados:', en: 'NPCs scanned:', es: 'NPCs escaneados:', ru: 'NPC проверено:' },
  'npc.modal.sync.result.updated': { default: 'NPCs updated:', 'pt-BR': 'NPCs atualizados:', en: 'NPCs updated:', es: 'NPCs actualizados:', ru: 'NPC обновлено:' },
  'npc.modal.sync.result.skipped': { default: 'NPCs skipped:', 'pt-BR': 'NPCs ignorados:', en: 'NPCs skipped:', es: 'NPCs omitidos:', ru: 'NPC пропущено:' },
  'npc.modal.sync.result.added': { default: 'Items added:', 'pt-BR': 'Itens adicionados:', en: 'Items added:', es: 'Artículos agregados:', ru: 'Предметов добавлено:' },
  'npc.modal.sync.result.removed': { default: 'Items removed:', 'pt-BR': 'Itens removidos:', en: 'Items removed:', es: 'Artículos eliminados:', ru: 'Предметов удалено:' },

  // NPC Scripting Card
  'npc.card.scripting.title': { default: '⚡ Scripting & Custom Logic', 'pt-BR': '⚡ Scripting e Lógica Personalizada', en: '⚡ Scripting & Custom Logic', es: '⚡ Scripting y lógica personalizada', ru: '⚡ Скрипты и кастомная логика' },
  'npc.card.scripting.viewEditor': { default: 'View Code Editor', 'pt-BR': 'Ver Editor de Código', en: 'View Code Editor', es: 'Ver editor de código', ru: 'Открыть редактор кода' },
  'npc.card.scripting.hint': { default: 'Code entered here will NEVER be overwritten by the editor. Use it for creatureSayCallback, custom modules, or complex quest logic.', 'pt-BR': 'O código inserido aqui NUNCA será sobrescrito pelo editor. Use-o para creatureSayCallback, módulos personalizados ou lógica de quest complexa.', en: 'Code entered here will NEVER be overwritten by the editor. Use it for creatureSayCallback, custom modules, or complex quest logic.', es: 'El código ingresado aquí NUNCA será sobrescrito por el editor.', ru: 'Код, введенный здесь, никогда не будет перезаписан редактором.' },
  'npc.card.scripting.placeholder': { default: 'Enter Lua code here...', 'pt-BR': 'Insira o código Lua aqui...', en: 'Enter Lua code here...', es: 'Ingrese el código Lua aquí...', ru: 'Введите код Lua здесь...' },
  'npc.card.scripting.titleAttr': { default: 'Lua Script Editor', 'pt-BR': 'Editor de Script Lua', en: 'Lua Script Editor', es: 'Editor de script Lua', ru: 'Редактор скриптов Lua' },
  'npc.card.scripting.footerTitle': { default: 'TIP:', 'pt-BR': 'DICA:', en: 'TIP:', es: 'CONSEJO:', ru: 'СОВЕТ:' },
  'npc.card.scripting.footerHint': { default: 'Variables like <code>npc</code> and <code>creature</code> are globally available.', 'pt-BR': 'Variáveis como <code>npc</code> e <code>creature</code> estão disponíveis globalmente.', en: 'Variables like <code>npc</code> and <code>creature</code> are globally available.', es: 'Las variables como <code>npc</code> y <code>creature</code> estão disponibles globalmente.', ru: 'Переменные, такие как <code>npc</code> и <code>creature</code>, доступны глобально.' },

  // NPC Basic Info Card
  'npc.card.basic.title': { default: '📋 Informação Básica', 'pt-BR': '📋 Informação Básica', en: '📋 Basic Information', es: '📋 Información básica', ru: '📋 Основная информация' },
  'npc.card.basic.name': { default: 'Nome', 'pt-BR': 'Nome', en: 'Name', es: 'Nombre', ru: 'Имя' },
  'npc.card.basic.description': { default: 'Descrição', 'pt-BR': 'Descrição', en: 'Description', es: 'Descripción', ru: 'Descrição' },
  'npc.card.basic.health': { default: 'Vida Atual', 'pt-BR': 'Vida Atual', en: 'Current Health', es: 'Vida actual', ru: 'Текущее здоровье' },
  'npc.card.basic.maxHealth': { default: 'Vida Máxima', 'pt-BR': 'Vida Máxima', en: 'Max Health', es: 'Vida máxima', ru: 'Максимальное здоровье' },
  'npc.card.basic.walkInterval': { default: 'Intervalo Caminhada (ms)', 'pt-BR': 'Intervalo Caminhada (ms)', en: 'Walk Interval (ms)', es: 'Intervalo de caminata (ms)', ru: 'Инterval ходьбы (мс)' },
  'npc.card.basic.walkRadius': { default: 'Raio Máx. Caminhada', 'pt-BR': 'Raio Máx. Caminhada', en: 'Max Walk Radius', es: 'Radio máx. de caminata', ru: 'Макс. радиус ходьбы' },
  'npc.card.basic.respawnType': { default: 'Tipo de Respawn', 'pt-BR': 'Tipo de Respawn', en: 'Respawn Type', es: 'Tipo de respawn', ru: 'Тип респауна' },

  // Asset Setup & Header
  'modal.static.head': {
    default: 'Cabeça', 'pt-BR': 'Cabeça', en: 'Head', es: 'Cabeza', ru: 'Голова'
  },
  'modal.static.body': {
    default: 'Corpo', 'pt-BR': 'Corpo', en: 'Body', es: 'Cuerpo', ru: 'Тело'
  },
  'modal.static.legs': {
    default: 'Pernas', 'pt-BR': 'Pernas', en: 'Legs', es: 'Piernas', ru: 'Ноги'
  },
  'modal.static.feet': {
    default: 'Pés', 'pt-BR': 'Pés', en: 'Feet', es: 'Pies', ru: 'Ступни'
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
  'category.worldData': {
    default: 'World Data',
    'pt-BR': 'Dados Mundiais',
    en: 'World Data',
    es: 'Datos mundiales',
    ru: 'Мировые данные'
  },
  'category.rccEditor': {
    default: 'RCC Editor',
    'pt-BR': 'Editor RCC',
    en: 'RCC Editor',
    es: 'Editor RCC',
    ru: 'Редактор RCC'
  },
  'category.itemsCount': {
    default: '{{count}} items',
    'pt-BR': '{{count}} itens',
    en: '{{count}} items',
    es: '{{count}} elementos',
    ru: '{{count}} объектов'
  },
  'category.creaturesCount': {
    default: '{{count}} creatures',
    'pt-BR': '{{count}} criaturas',
    en: '{{count}} creatures',
    es: '{{count}} criaturas',
    ru: '{{count}} существ'
  },
  'category.bossesCount': {
    default: '{{count}} bosses',
    'pt-BR': '{{count}} bosses',
    en: '{{count}} bosses',
    es: '{{count}} jefes',
    ru: '{{count}} боссов'
  },
  'category.questsCount': {
    default: '{{count}} quests',
    'pt-BR': '{{count}} quests',
    en: '{{count}} quests',
    es: '{{count}} misiones',
    ru: '{{count}} квестов'
  },
  'category.titlesCount': {
    default: '{{count}} titles',
    'pt-BR': '{{count}} títulos',
    en: '{{count}} titles',
    es: '{{count}} títulos',
    ru: '{{count}} титулов'
  },
  'category.housesCount': {
    default: '{{count}} houses',
    'pt-BR': '{{count}} casas',
    en: '{{count}} houses',
    es: '{{count}} casas',
    ru: '{{count}} домов'
  },
  'category.mapHousesCount': {
    default: '{{count}} map layouts',
    'pt-BR': '{{count}} layouts de mapa',
    en: '{{count}} map layouts',
    es: '{{count}} diseños de mapa',
    ru: '{{count}} макетов карт'
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
  'category.tools': { default: 'Tools', 'pt-BR': 'Ferramentas', en: 'Tools', es: 'Herramientas', ru: 'Инструменты' },
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
  'modal.confirmDelete': {
    default: 'Are you sure you want to delete this sprite?',
    'pt-BR': 'Tem certeza que deseja excluir este sprite?',
    en: 'Are you sure you want to delete this sprite?',
    es: '¿Estás seguro de que deseas eliminar este sprite?',
    ru: 'Вы уверены, что хотите удалить этот спрайт?'
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
  'button.create': {
    default: 'Create',
    'pt-BR': 'Criar',
    en: 'Create',
    es: 'Crear',
    ru: 'Создать'
  },
  'button.selectAll': {
    default: 'Select All',
    'pt-BR': 'Selecionar Tudo',
    en: 'Select All',
    es: 'Seleccionar Todo',
    ru: 'Выбрать все'
  },
  'button.deselectAll': {
    default: 'Deselect All',
    'pt-BR': 'Deselecionar Tudo',
    en: 'Deselect All',
    es: 'Deseleccionar Todo',
    ru: 'Снять выделение'
  },
  'button.deleteSelected': {
    default: 'Delete Selected',
    'pt-BR': 'Excluir Selecionados',
    en: 'Delete Selected',
    es: 'Eliminar Seleccionados',
    ru: 'Удалить выбранные'
  },
  'button.delete': {
    default: 'Delete',
    'pt-BR': 'Excluir',
    en: 'Delete',
    es: 'Eliminar',
    ru: 'Удалить'
  },
  'button.cancel': {
    default: 'Cancel',
    'pt-BR': 'Cancelar',
    en: 'Cancel',
    es: 'Cancelar',
    ru: 'Отмена'
  },
  'action.toggle.autoAnimate': {
    default: 'Auto Animate',
    'pt-BR': 'Animar',
    en: 'Auto Animate',
    es: 'Animar',
    ru: 'Анимация'
  },
  'action.toggle.showNames': {
    default: 'Show Names',
    'pt-BR': 'Nomes',
    en: 'Show Names',
    es: 'Nombres',
    ru: 'Имена'
  },
  'files.table.empty': {
    default: 'No data available',
    'pt-BR': 'Nenhum dado disponível',
    en: 'No data available',
    es: 'No hay datos disponibles',
    ru: 'Данные отсутствуют'
  },


  // SettingsMenu

  // SettingsMenu
  'status.perfReset': { default: 'Configurações de performance resetadas', 'pt-BR': 'Configurações de performance resetadas', en: 'Performance settings reset', es: 'Ajustes de rendimiento restablecidos', ru: 'Настройки производительности сброшены' },
  'settings.perf.title': { default: '⚡ Performance', 'pt-BR': '⚡ Performance', en: '⚡ Performance', es: '⚡ Rendimiento', ru: '⚡ Производительность' },
  'settings.perf.description': { default: 'Ajuste de cache, renderização e timing', 'pt-BR': 'Ajuste de cache, renderização e timing', en: 'Adjust cache, rendering and timing', es: 'Ajustar caché, renderizado y tiempo', ru: 'Настройка кэша, рендеринга и таймингов' },
  'settings.perf.group.cache': { default: 'Cache', 'pt-BR': 'Cache', en: 'Cache', es: 'Caché', ru: 'Кэш' },
  'settings.perf.group.rendering': { default: 'Renderização', 'pt-BR': 'Renderização', en: 'Rendering', es: 'Renderizado', ru: 'Рендеринг' },
  'settings.perf.group.timing': { default: 'Timing', 'pt-BR': 'Timing', en: 'Timing', es: 'Tiempo', ru: 'Тайминги' },
  'settings.perf.resetBtn': { default: '🔄 Resetar Padrões', 'pt-BR': '🔄 Resetar Padrões', en: '🔄 Reset Defaults', es: '🔄 Restablecer valores predeterminados', ru: '🔄 Сбросить по умолчанию' },
  'settings.perf.default': { default: 'Padrão', 'pt-BR': 'Padrão', en: 'Default', es: 'Predeterminado', ru: 'По умолчанию' },

  // RccBrowser
  'rcc.title': { default: '🗂️ RCC Resource Editor', 'pt-BR': '🗂️ Editor de Recursos RCC', en: '🗂️ RCC Resource Editor', es: '🗂️ Editor de Recursos RCC', ru: '🗂️ Редактор Ресурсов RCC' },
  'rcc.back': { default: 'Back', 'pt-BR': 'Voltar', en: 'Back', es: 'Atrás', ru: 'Назад' },
  'rcc.btn.open': { default: '📂 Open RCC', 'pt-BR': '📂 Abrir RCC', en: '📂 Open RCC', es: '📂 Abrir RCC', ru: '📂 Открыть RCC' },
  'rcc.btn.extractAll': { default: '📤 Extract All', 'pt-BR': '📤 Extrair Tudo', en: '📤 Extract All', es: '📤 Extraer Todo', ru: '📤 Извлечь Все' },
  'rcc.btn.add': { default: '➕ Add', 'pt-BR': '➕ Adicionar', en: '➕ Add', es: '➕ Añadir', ru: '➕ Добавить' },
  'rcc.btn.save': { default: '💾 Save RCC', 'pt-BR': '💾 Salvar RCC', en: '💾 Save RCC', es: '💾 Guardar RCC', ru: '💾 Сохранить RCC' },
  'rcc.btn.replace': { default: '🔄 Replace', 'pt-BR': '🔄 Substituir', en: '🔄 Replace', es: '🔄 Reemplazar', ru: '🔄 Заменить' },
  'rcc.btn.export': { default: '📥 Export', 'pt-BR': '📥 Exportar', en: '📥 Export', es: '📥 Exportar', ru: '📥 Экспорт' },
  'rcc.btn.delete': { default: '🗑️ Delete', 'pt-BR': '🗑️ Deletar', en: '🗑️ Delete', es: '🗑️ Eliminar', ru: '🗑️ Удалить' },
  'rcc.stats.files': { default: 'files', 'pt-BR': 'arquivos', en: 'files', es: 'archivos', ru: 'файлов' },
  'rcc.search.placeholder': { default: 'Search resources...', 'pt-BR': 'Buscar recursos...', en: 'Search resources...', es: 'Buscar recursos...', ru: 'Поиск ресурсов...' },
  'rcc.search.results': { default: 'results', 'pt-BR': 'resultados', en: 'results', es: 'resultados', ru: 'результатов' },
  'rcc.preview.path': { default: 'Path', 'pt-BR': 'Caminho', en: 'Path', es: 'Ruta', ru: 'Путь' },
  'rcc.preview.size': { default: 'Size', 'pt-BR': 'Tamanho', en: 'Size', es: 'Tamaño', ru: 'Размер' },
  'rcc.preview.compressed': { default: 'Compressed', 'pt-BR': 'Comprimido', en: 'Compressed', es: 'Comprimido', ru: 'Сжатый' },
  'rcc.preview.loading': { default: 'Loading preview...', 'pt-BR': 'Carregando pré-visualização...', en: 'Loading preview...', es: 'Cargando vista previa...', ru: 'Загрузка...' },
  'rcc.preview.none': { default: 'No preview available for .{{ext}} files', 'pt-BR': 'Sem pré-visualização para arquivos .{{ext}}', en: 'No preview available for .{{ext}} files', es: 'No hay vista previa para archivos .{{ext}}', ru: 'Нет предпросмотра для файлов .{{ext}}' },
  'rcc.preview.select': { default: 'Select a resource to preview', 'pt-BR': 'Selecione um recurso para visualizar', en: 'Select a resource to preview', es: 'Selecciona un recurso', ru: 'Выберите файл для предпросмотра' },
  'rcc.empty.title': { default: 'No RCC File Loaded', 'pt-BR': 'Nenhum Arquivo RCC Carregado', en: 'No RCC File Loaded', es: 'No hay archivo RCC cargado', ru: 'Файл RCC не загружен' },
  'rcc.empty.desc': { default: 'Open an .rcc file to browse and edit Qt compiled resources', 'pt-BR': 'Abra um arquivo .rcc para navegar e editar recursos compilados do Qt', en: 'Open an .rcc file to browse and edit Qt compiled resources', es: 'Abre un archivo .rcc para explorar y editar recursos de Qt', ru: 'Откройте файл .rcc для просмотра и редактирования ресурсов Qt' },
  'rcc.empty.btn': { default: '📂 Open RCC File', 'pt-BR': '📂 Abrir Arquivo RCC', en: '📂 Open RCC File', es: '📂 Abrir archivo RCC', ru: '📂 Открыть файл RCC' },
  'rcc.dialog.openTitle': { default: 'Open RCC File', 'pt-BR': 'Abrir Arquivo RCC', en: 'Open RCC File', es: 'Abrir archivo RCC', ru: 'Открыть файл RCC' },
  'rcc.dialog.replaceTitle': { default: 'Replace {{name}}', 'pt-BR': 'Substituir {{name}}', en: 'Replace {{name}}', es: 'Reemplazar {{name}}', ru: 'Заменить {{name}}' },
  'rcc.dialog.deleteTitle': { default: '🗑️ Delete Resource', 'pt-BR': '🗑️ Deletar Recurso', en: '🗑️ Delete Resource', es: '🗑️ Eliminar recurso', ru: '🗑️ Удалить ресурс' },
  'rcc.dialog.deleteMsg': { default: '<p>Are you sure you want to delete <span class="confirm-filename">{{name}}</span>?</p>', 'pt-BR': '<p>Tem certeza de que deseja deletar <span class="confirm-filename">{{name}}</span>?</p>', en: '<p>Are you sure you want to delete <span class="confirm-filename">{{name}}</span>?</p>', es: '<p>¿Estás seguro de que deseas eliminar <span class="confirm-filename">{{name}}</span>?</p>', ru: '<p>Вы уверены, что хотите удалить <span class="confirm-filename">{{name}}</span>?</p>' },
  'rcc.dialog.deleteWarning': { default: '⚠ This action cannot be undone', 'pt-BR': '⚠ Esta ação não pode ser desfeita', en: '⚠ This action cannot be undone', es: '⚠ Esta acción no se puede deshacer', ru: '⚠ Это действие нельзя отменить' },
  'rcc.dialog.addTitle': { default: 'Add New Resource', 'pt-BR': 'Adicionar Novo Recurso', en: 'Add New Resource', es: 'Añadir nuevo recurso', ru: 'Добавить новый ресурс' },
  'rcc.dialog.extractAllTitle': { default: 'Extract All Resources To', 'pt-BR': 'Extrair Todos os Recursos Para', en: 'Extract All Resources To', es: 'Extraer todos los recursos a', ru: 'Извлечь все ресурсы в' },
  'rcc.dialog.saveTitle': { default: 'Save Modified RCC', 'pt-BR': 'Salvar RCC Modificado', en: 'Save Modified RCC', es: 'Guardar RCC modificado', ru: 'Сохранить измененный RCC' },
  'rcc.dialog.saveFile': { default: 'Save {{name}}', 'pt-BR': 'Salvar {{name}}', en: 'Save {{name}}', es: 'Guardar {{name}}', ru: 'Сохранить {{name}}' },
  'rcc.prompt.rccPath': { default: 'Enter the RCC path for the resource(s):\n(e.g. minimap/images/myfile.png)\n\nLeave empty to auto-detect from filename.', 'pt-BR': 'Insira o caminho RCC para os recurso(s):\n(ex: minimap/images/myfile.png)\n\nDeixe em branco para auto-detectar pelo nome do arquivo.', en: 'Enter the RCC path for the resource(s):\n(e.g. minimap/images/myfile.png)\n\nLeave empty to auto-detect from filename.', es: 'Introduce la ruta RCC:\n(ej. minimap/images/myfile.png)\n\nDéjalo vacío para autodetectar.', ru: 'Введите путь RCC для ресурсов:\n(напр. minimap/images/myfile.png)\n\nОставьте пустым для автоопределения.' },

  // Asset Details & Modals
  'status.saveSuccess': { default: 'Salvo com sucesso!', 'pt-BR': 'Salvo com sucesso!', en: 'Saved successfully!', es: '¡Guardado con éxito!', ru: 'Успешно сохранено!' },
  'status.saveError': { default: 'Erro ao salvar: {{err}}', 'pt-BR': 'Erro ao salvar: {{err}}', en: 'Error saving: {{err}}', es: 'Error al guardar: {{err}}', ru: 'Ошибка сохранения: {{err}}' },
  'action.button.saveChanges': { default: 'Salvar Alterações', 'pt-BR': 'Salvar Alterações', en: 'Save Changes', es: 'Guardar Cambios', ru: 'Сохранить изменения' },
  'asset.notApplicableSounds': { default: 'Not applicable for sounds.', 'pt-BR': 'Não aplicável para sons.', en: 'Not applicable for sounds.', es: 'No aplicable para sonidos.', ru: 'Неприменимо к звукам.' },

  // Asset Details - Basic Info
  'asset.info.title': { default: 'Basic Information', 'pt-BR': 'Informações Básicas', en: 'Basic Information', es: 'Información Básica', ru: 'Основная информация' },
  'asset.info.id': { default: 'ID:', 'pt-BR': 'ID:', en: 'ID:', es: 'ID:', ru: 'ID:' },
  'asset.info.name': { default: 'Name:', 'pt-BR': 'Nome:', en: 'Name:', es: 'Nombre:', ru: 'Имя:' },
  'asset.info.desc': { default: 'Description:', 'pt-BR': 'Descrição:', en: 'Description:', es: 'Descripción:', ru: 'Описание:' },
  'asset.info.category': { default: 'Category:', 'pt-BR': 'Categoria:', en: 'Category:', es: 'Categoría:', ru: 'Категория:' },
  'asset.info.minLevel': { default: 'Minimum Level:', 'pt-BR': 'Level Mínimo:', en: 'Minimum Level:', es: 'Nivel Mínimo:', ru: 'Мин. уровень:' },

  // Asset Details - Sprite Preview
  'asset.preview.title': { default: 'Sprite Preview', 'pt-BR': 'Visualização de Sprites', en: 'Sprite Preview', es: 'Vista previa de Sprites', ru: 'Предпросмотр спрайтов' },
  'asset.preview.loading': { default: '🔄 Loading sprites...', 'pt-BR': '🔄 Carregando sprites...', en: '🔄 Loading sprites...', es: '🔄 Cargando sprites...', ru: '🔄 Загрузка спрайтов...' },

  // Asset Details - Frame Groups
  'asset.fg.title': { default: 'Frame Groups ({{count}})', 'pt-BR': 'Grupos de Frame ({{count}})', en: 'Frame Groups ({{count}})', es: 'Grupos de Frames ({{count}})', ru: 'Группы кадров ({{count}})' },
  'asset.fg.group': { default: 'Group {{index}}', 'pt-BR': 'Grupo {{index}}', en: 'Group {{index}}', es: 'Grupo {{index}}', ru: 'Группа {{index}}' },
  'asset.fg.fixed': { default: 'Fixed Frame Group:', 'pt-BR': 'Grupo Fixo:', en: 'Fixed Frame Group:', es: 'Grupo Fijo:', ru: 'Резервная группа:' },
  'asset.fg.unknown': { default: 'Unknown', 'pt-BR': 'Desconhecido', en: 'Unknown', es: 'Desconocido', ru: 'Неизвестно' },
  'asset.fg.outfitIdle': { default: 'Outfit Idle', 'pt-BR': 'Traje Parado', en: 'Outfit Idle', es: 'Traje Inactivo', ru: 'Наряд бездействует' },
  'asset.fg.outfitMoving': { default: 'Outfit Moving', 'pt-BR': 'Traje Movendo', en: 'Outfit Moving', es: 'Traje en Movimiento', ru: 'Наряд в движении' },
  'asset.fg.objectInitial': { default: 'Object Initial', 'pt-BR': 'Objeto Inicial', en: 'Object Initial', es: 'Objeto Inicial', ru: 'Начальный объект' },
  'asset.fg.id': { default: 'Group ID:', 'pt-BR': 'ID do Grupo:', en: 'Group ID:', es: 'ID del Grupo:', ru: 'ID группы:' },
  'asset.fg.width': { default: 'Pattern Width:', 'pt-BR': 'Largura Padrão:', en: 'Pattern Width:', es: 'Ancho de Patrón:', ru: 'Ширина узора:' },
  'asset.fg.height': { default: 'Pattern Height:', 'pt-BR': 'Altura Padrão:', en: 'Pattern Height:', es: 'Altura de Patrón:', ru: 'Высота узора:' },
  'asset.fg.depth': { default: 'Pattern Depth:', 'pt-BR': 'Profundidade Padrão:', en: 'Pattern Depth:', es: 'Profundidad de Patrón:', ru: 'Глубина узора:' },
  'asset.fg.layers': { default: 'Layers:', 'pt-BR': 'Camadas:', en: 'Layers:', es: 'Capas:', ru: 'Слои:' },
  'asset.fg.box': { default: 'Bounding Square:', 'pt-BR': 'Quadrado Delimitador:', en: 'Bounding Square:', es: 'Cuadrado Delimitador:', ru: 'Ограничивающий квадрат:' },
  'asset.fg.opaque': { default: 'Is Opaque:', 'pt-BR': 'É Opaco:', en: 'Is Opaque:', es: 'Es Opaco:', ru: 'Непрозрачный:' },
  'asset.fg.yes': { default: 'Yes', 'pt-BR': 'Sim', en: 'Yes', es: 'Sí', ru: 'Да' },
  'asset.fg.no': { default: 'No', 'pt-BR': 'Não', en: 'No', es: 'No', ru: 'Нет' },
  'asset.fg.sprites': { default: 'Sprite IDs ({{count}} total):', 'pt-BR': 'IDs dos Sprites ({{count}} total):', en: 'Sprite IDs ({{count}} total):', es: 'IDs de Sprites ({{count}} total):', ru: 'ID спрайтов ({{count}} всего):' },
  'asset.fg.showAll': { default: 'Show All {{count}} IDs', 'pt-BR': 'Mostrar todos os {{count}} IDs', en: 'Show All {{count}} IDs', es: 'Mostrar los {{count}} IDs', ru: 'Показать все {{count}} ID' },
  'asset.fg.boxesTitle': { default: 'Bounding Boxes per Direction:', 'pt-BR': 'Caixas Delimitadoras por Direção:', en: 'Bounding Boxes per Direction:', es: 'Cajas Delimitadoras por Dirección:', ru: 'Ограничивающие рамки по направлению:' },
  'asset.fg.dir': { default: 'Direction', 'pt-BR': 'Direção', en: 'Direction', es: 'Dirección', ru: 'Направление' },
  'asset.fg.x': { default: 'X', 'pt-BR': 'X', en: 'X', es: 'X', ru: 'X' },
  'asset.fg.y': { default: 'Y', 'pt-BR': 'Y', en: 'Y', es: 'Y', ru: 'Y' },
  'asset.fg.w': { default: 'Width', 'pt-BR': 'Largura', en: 'Width', es: 'Ancho', ru: 'Ширина' },
  'asset.fg.h': { default: 'Height', 'pt-BR': 'Altura', en: 'Height', es: 'Alto', ru: 'Высота' },
  'asset.fg.animTitle': { default: 'Animation Details:', 'pt-BR': 'Detalhes de Animação:', en: 'Animation Details:', es: 'Detalles de Animación:', ru: 'Детали анимации:' },
  'asset.fg.phases': { default: 'Phases: {{count}}', 'pt-BR': 'Fases: {{count}}', en: 'Phases: {{count}}', es: 'Fases: {{count}}', ru: 'Фазы: {{count}}' },
  'asset.fg.sync': { default: 'Synchronized:', 'pt-BR': 'Sincronizado:', en: 'Synchronized:', es: 'Sincronizado:', ru: 'Синхронизировано:' },
  'asset.fg.loopType': { default: 'Loop Type:', 'pt-BR': 'Tipo de Loop:', en: 'Loop Type:', es: 'Tipo de Bucle:', ru: 'Тип цикла:' },
  'asset.fg.loopTypes.pingpong': { default: 'Pingpong', 'pt-BR': 'Vai e Vem', en: 'Pingpong', es: 'Ping pong', ru: 'Pingpong' },
  'asset.fg.loopTypes.infinite': { default: 'Infinite', 'pt-BR': 'Infinito', en: 'Infinite', es: 'Infinito', ru: 'Бесконечно' },
  'asset.fg.loopTypes.counted': { default: 'Counted', 'pt-BR': 'Contado', en: 'Counted', es: 'Contado', ru: 'Счетчик' },
  'asset.fg.loopCount': { default: 'Loop Count:', 'pt-BR': 'Qtd. de Loops:', en: 'Loop Count:', es: 'Cant. de Bucles:', ru: 'Количество циклов:' },
  'asset.fg.phaseN': { default: 'Phase #{{n}}', 'pt-BR': 'Fase #{{n}}', en: 'Phase #{{n}}', es: 'Fase #{{n}}', ru: 'Фаза #{{n}}' },

  // StaticDataModal
  'modal.static.confirmDelete': { default: 'Tem certeza que deseja excluir esse item?', 'pt-BR': 'Tem certeza que deseja excluir esse item?', en: 'Are you sure you want to delete this item?', es: '¿Estás seguro de que deseas eliminar este elemento?', ru: 'Вы уверены, что хотите удалить этот элемент?' },
  'modal.static.btn.delete': { default: '🗑️ Excluir', 'pt-BR': '🗑️ Excluir', en: '🗑️ Delete', es: '🗑️ Eliminar', ru: '🗑️ Удалить' },
  'modal.static.btn.close': { default: 'Fechar (Esc)', 'pt-BR': 'Fechar (Esc)', en: 'Close (Esc)', es: 'Cerrar (Esc)', ru: 'Закрыть (Esc)' },

  'modal.static.info.general': { default: 'General Info', 'pt-BR': 'Informações Gerais', en: 'General Info', es: 'Info General', ru: 'Общая информация' },
  'modal.static.info.id': { default: 'ID', 'pt-BR': 'ID', en: 'ID', es: 'ID', ru: 'ID' },
  'modal.static.info.difficulty': { default: 'Difficulty', 'pt-BR': 'Dificuldade', en: 'Difficulty', es: 'Dificultad', ru: 'Сложность' },
  'modal.static.info.occurrence': { default: 'Occurrence', 'pt-BR': 'Ocorrência', en: 'Occurrence', es: 'Ocurrencia', ru: 'Появление' },
  'modal.static.info.type': { default: 'Type', 'pt-BR': 'Tipo', en: 'Type', es: 'Tipo', ru: 'Тип' },
  'modal.static.info.npcHostile': { default: 'NPC (Hostile)', 'pt-BR': 'NPC (Hostil)', en: 'NPC (Hostile)', es: 'NPC (Hostil)', ru: 'NPC (Враждебный)' },
  'modal.static.info.npcFriendly': { default: 'NPC (Friendly)', 'pt-BR': 'NPC (Amigável)', en: 'NPC (Friendly)', es: 'NPC (Amistoso)', ru: 'NPC (Дружелюбный)' },
  'modal.static.info.monsterHostile': { default: 'Monster (Hostile)', 'pt-BR': 'Monstro (Hostil)', en: 'Monster (Hostile)', es: 'Monstruo (Hostil)', ru: 'Монстр (Враждебный)' },
  'modal.static.info.monsterPassive': { default: 'Monster (Passive)', 'pt-BR': 'Monstro (Passivo)', en: 'Monster (Passive)', es: 'Monstruo (Pasivo)', ru: 'Монстр (Пассивный)' },

  'modal.static.info.targetTier': { default: 'Target Tier', 'pt-BR': 'Nível do Alvo', en: 'Target Tier', es: 'Nivel del Objetivo', ru: 'Уровень цели' },
  'modal.static.info.archfoe': { default: 'Archfoe ⚔️', 'pt-BR': 'Archfoe ⚔️', en: 'Archfoe ⚔️', es: 'Archienemigo ⚔️', ru: 'Архивраг ⚔️' },
  'modal.static.info.standard': { default: 'Standard 🛡️', 'pt-BR': 'Padrão 🛡️', en: 'Standard 🛡️', es: 'Estándar 🛡️', ru: 'Стандартный 🛡️' },

  'modal.static.info.outfitDetails': { default: 'Outfit Details', 'pt-BR': 'Detalhes do Outfit', en: 'Outfit Details', es: 'Detalles del Atuendo', ru: 'Детали наряда' },
  'modal.static.info.lookType': { default: 'LookType', 'pt-BR': 'LookType', en: 'LookType', es: 'LookType', ru: 'LookType' },
  'modal.static.info.addons': { default: 'Addons', 'pt-BR': 'Addons', en: 'Addons', es: 'Addons', ru: 'Аддоны' },
  'modal.static.info.mountId': { default: 'Mount ID', 'pt-BR': 'ID da Montaria', en: 'Mount ID', es: 'ID de Montura', ru: 'ID маунта' },
  'modal.static.info.colors': { default: 'Colors', 'pt-BR': 'Cores', en: 'Colors', es: 'Colores', ru: 'Цвета' },
  'modal.static.info.head': { default: 'Head', 'pt-BR': 'Cabeça', en: 'Head', es: 'Cabeza', ru: 'Голова' },
  'modal.static.info.body': { default: 'Body', 'pt-BR': 'Corpo', en: 'Body', es: 'Cuerpo', ru: 'Тело' },
  'modal.static.info.legs': { default: 'Legs', 'pt-BR': 'Pernas', en: 'Legs', es: 'Piernas', ru: 'Ноги' },
  'modal.static.info.feet': { default: 'Feet', 'pt-BR': 'Pés', en: 'Feet', es: 'Pies', ru: 'Ступни' },
  'modal.static.info.missing': { default: 'Missing', 'pt-BR': 'Ausente', en: 'Missing', es: 'Falta', ru: 'Отсутствует' },
  'modal.static.info.none': { default: 'None', 'pt-BR': 'Nenhum', en: 'None', es: 'Ninguno', ru: 'Нет' },
  'modal.static.info.noOutfit': { default: 'No outfit assigned', 'pt-BR': 'Nenhum outfit atribuído', en: 'No outfit assigned', es: 'Sin atuendo asignado', ru: 'Наряд не назначен' },

  'modal.static.info.titleProfile': { default: 'Title Profile', 'pt-BR': 'Perfil do Título', en: 'Title Profile', es: 'Perfil del Título', ru: 'Профиль титула' },
  'modal.static.info.gradeRank': { default: 'Grade Rank', 'pt-BR': 'Rank', en: 'Grade Rank', es: 'Rango', ru: 'Ранг' },
  'modal.static.info.unlockDesc': { default: 'Unlock Description', 'pt-BR': 'Descrição de Desbloqueio', en: 'Unlock Description', es: 'Descripción de Desbloqueo', ru: 'Описание разблокировки' },
  'modal.static.info.noDesc': { default: 'No description provided.', 'pt-BR': 'Nenhuma descrição fornecida.', en: 'No description provided.', es: 'No se proporciona descripción.', ru: 'Описание не предоставлено.' },

  'modal.static.info.questEntity': { default: 'Quest Tracker Entity', 'pt-BR': 'Entidade do Rastreador de Quest', en: 'Quest Tracker Entity', es: 'Entidad de Tracker de Misión', ru: 'Сущность квеста' },
  'modal.static.info.questId': { default: 'Quest ID', 'pt-BR': 'ID da Quest', en: 'Quest ID', es: 'ID de Misión', ru: 'ID квеста' },
  'modal.static.info.systemName': { default: 'System Name', 'pt-BR': 'Nome do Sistema', en: 'System Name', es: 'Nombre del Sistema', ru: 'Системное имя' },

  'modal.static.info.localityInfo': { default: 'Locality Info', 'pt-BR': 'Informações de Localidade', en: 'Locality Info', es: 'Info de Localidad', ru: 'Информация о locality' },
  'modal.static.info.town': { default: 'Town', 'pt-BR': 'Cidade', en: 'Town', es: 'Ciudad', ru: 'Город' },
  'modal.static.info.unknown': { default: 'Unknown', 'pt-BR': 'Desconhecido', en: 'Unknown', es: 'Desconocido', ru: 'Неизвестно' },
  'modal.static.info.building': { default: 'Building', 'pt-BR': 'Prédio', en: 'Building', es: 'Edificio', ru: 'Здание' },
  'modal.static.info.guildhall': { default: 'Guildhall', 'pt-BR': 'Guildhall', en: 'Guildhall', es: 'Sede de Gremio', ru: 'Guildhall' },
  'modal.static.info.house': { default: 'House', 'pt-BR': 'Casa', en: 'House', es: 'Casa', ru: 'Дом' },
  'modal.static.info.premium': { default: 'Premium?', 'pt-BR': 'Premium?', en: 'Premium?', es: '¿Premium?', ru: 'Премиум?' },
  'modal.static.info.yes': { default: 'Yes ✅', 'pt-BR': 'Sim ✅', en: 'Yes ✅', es: 'Sí ✅', ru: 'Да ✅' },
  'modal.static.info.no': { default: 'No ❌', 'pt-BR': 'Não ❌', en: 'No ❌', es: 'No ❌', ru: 'Нет ❌' },

  'modal.static.info.estateSpecs': { default: 'Estate Specs', 'pt-BR': 'Especificações da Propriedade', en: 'Estate Specs', es: 'Especificaciones de la Propiedad', ru: 'Характеристики недвижимости' },
  'modal.static.info.location': { default: 'Location (World)', 'pt-BR': 'Localização (Mundo)', en: 'Location (World)', es: 'Ubicación (Mundo)', ru: 'Местоположение (Мир)' },
  'modal.static.info.unmapped': { default: 'Unmapped', 'pt-BR': 'Não Mapeado', en: 'Unmapped', es: 'No mapeado', ru: 'Не на карте' },
  'modal.static.info.size': { default: 'Size', 'pt-BR': 'Tamanho', en: 'Size', es: 'Tamaño', ru: 'Размер' },
  'modal.static.info.sqm': { default: 'SQM', 'pt-BR': 'SQM', en: 'SQM', es: 'SQM', ru: 'SQM' },
  'modal.static.info.rent': { default: 'Rent Cost', 'pt-BR': 'Custo de Aluguel', en: 'Rent Cost', es: 'Costo de Renta', ru: 'Стоимость аренды' },
  'modal.static.info.goldMo': { default: 'Gold/mo', 'pt-BR': 'Ouro/mês', en: 'Gold/mo', es: 'Oro/mes', ru: 'Золото/мес' },
  'modal.static.info.beds': { default: 'Beds', 'pt-BR': 'Camas', en: 'Beds', es: 'Camas', ru: 'Кровати' },
  'modal.static.info.slots': { default: 'slot(s)', 'pt-BR': 'slot(s)', en: 'slot(s)', es: 'espacio(s)', ru: 'мест(о)' },

  'modal.static.info.houseAdv': { default: 'House Advertisement', 'pt-BR': 'Anúncio da Casa', en: 'House Advertisement', es: 'Anuncio de la Casa', ru: 'Объявление о доме' },
  'modal.static.info.noDescFound': { default: 'No description found.', 'pt-BR': 'Nenhuma descrição encontrada.', en: 'No description found.', es: 'No se encontró descripción.', ru: 'Описание не найдено.' },

  'modal.static.info.topologyArray': { default: 'Topology Array', 'pt-BR': 'Array de Topologia', en: 'Topology Array', es: 'Array de Topología', ru: 'Массив топологии' },
  'modal.static.info.houseIdBound': { default: 'House ID Bound', 'pt-BR': 'ID da Casa', en: 'House ID Bound', es: 'ID de Casa', ru: 'ID дома' },
  'modal.static.info.startCoord': { default: 'Start Coordinate', 'pt-BR': 'Coordenada Inicial', en: 'Start Coordinate', es: 'Coordenada Inicial', ru: 'Начальная координата' },
  'modal.static.info.floorLevels': { default: 'Floor Levels', 'pt-BR': 'Níveis dos Andares', en: 'Floor Levels', es: 'Niveles de Piso', ru: 'Уровни этажей' },
  'modal.static.info.dimensions': { default: 'Dimensions', 'pt-BR': 'Dimensões', en: 'Dimensions', es: 'Dimensiones', ru: 'Размеры' },
  'modal.static.info.tiles': { default: 'tiles', 'pt-BR': 'tiles', en: 'tiles', es: 'baldosas', ru: 'тайлов' },
  'modal.static.info.floormapChunk': { default: 'Floormap Chunk Data', 'pt-BR': 'Dados de Mapa (Chunks)', en: 'Floormap Chunk Data', es: 'Datos de Mapa (Chunks)', ru: 'Данные сегментов карты' },
  'modal.static.info.mapRowsExtracted': { default: 'Compiled Map Rows Extracted', 'pt-BR': 'Linhas do Mapa Compilado', en: 'Compiled Map Rows Extracted', es: 'Filas de Mapa Compilado Extraídas', ru: 'Извлеченные строки карты' },
  'modal.static.info.tilesDeserialized': { default: 'Tiles successfully deserialized!', 'pt-BR': 'Tiles desserializados com sucesso!', en: 'Tiles successfully deserialized!', es: '¡Baldosas deserializadas con éxito!', ru: 'Тайлы успешно десериализованы!' },
  'modal.static.info.noLayoutStructure': { default: 'This layout bundle has no structure.', 'pt-BR': 'Este layout não possui estrutura.', en: 'This layout bundle has no structure.', es: 'Este diseño no tiene estructura.', ru: 'Этот набор не имеет структуры.' },

  // Asset Editing Form
  'asset.edit.title': { default: 'Editar Item', 'pt-BR': 'Editar Item', en: 'Edit Item', es: 'Editar Elemento', ru: 'Редактировать элемент' },
  'asset.edit.name': { default: 'Nome:', 'pt-BR': 'Nome:', en: 'Name:', es: 'Nombre:', ru: 'Имя:' },
  'asset.edit.desc': { default: 'Descrição:', 'pt-BR': 'Descrição:', en: 'Description:', es: 'Descripción:', ru: 'Описание:' },
  'asset.edit.placeholderName': { default: 'Digite o nome', 'pt-BR': 'Digite o nome', en: 'Enter name', es: 'Ingrese el nombre', ru: 'Введите имя' },
  'asset.edit.placeholderDesc': { default: 'Digite a descrição', 'pt-BR': 'Digite a descrição', en: 'Enter description', es: 'Ingrese la descripción', ru: 'Введите описание' },
  'asset.edit.flagsTitle': { default: 'Flags Booleanas', 'pt-BR': 'Flags Booleanas', en: 'Boolean Flags', es: 'Flags Booleanos', ru: 'Логические флаги' },

  // Attributes Categories
  'asset.edit.attr.light': { default: 'Light', 'pt-BR': 'Luz (Light)', en: 'Light', es: 'Luz', ru: 'Свет' },
  'asset.edit.attr.shift': { default: 'Shift', 'pt-BR': 'Deslocamento (Shift)', en: 'Shift', es: 'Desplazamiento', ru: 'Смещение' },
  'asset.edit.attr.height': { default: 'Height', 'pt-BR': 'Altura (Height)', en: 'Height', es: 'Altura', ru: 'Высота' },
  'asset.edit.attr.write': { default: 'Write', 'pt-BR': 'Escrever (Write)', en: 'Write', es: 'Escribir', ru: 'Написать' },
  'asset.edit.attr.writeOnce': { default: 'Write Once', 'pt-BR': 'Esc. Uma Vez (Write Once)', en: 'Write Once', es: 'Escribir una vez', ru: 'Написать один раз' },
  'asset.edit.attr.automap': { default: 'Automap', 'pt-BR': 'Minimapa (Automap)', en: 'Automap', es: 'Minimapa', ru: 'Автокарта' },
  'asset.edit.attr.hook': { default: 'Hook', 'pt-BR': 'Gancho (Hook)', en: 'Hook', es: 'Gancho', ru: 'Крюк' },
  'asset.edit.attr.lensHelp': { default: 'Lens Help', 'pt-BR': 'Ajuda Lente (Lens Help)', en: 'Lens Help', es: 'Ayuda de lente', ru: 'Помощь линзы' },
  'asset.edit.attr.clothes': { default: 'Clothes', 'pt-BR': 'Roupas (Clothes)', en: 'Clothes', es: 'Ropa', ru: 'Одежда' },
  'asset.edit.attr.defaultAction': { default: 'Default Action', 'pt-BR': 'Ação Padrão', en: 'Default Action', es: 'Acción por defecto', ru: 'Действие по умолчанию' },
  'asset.edit.attr.weaponType': { default: 'Weapon Type', 'pt-BR': 'Tipo de Arma', en: 'Weapon Type', es: 'Tipo de arma', ru: 'Тип оружия' },
  'asset.edit.attr.market': { default: 'Market', 'pt-BR': 'Mercado (Market)', en: 'Market', es: 'Mercado', ru: 'Рынок' },
  'asset.edit.attr.changedToExpire': { default: 'Changed To Expire', 'pt-BR': 'Muda para Expirar', en: 'Changed To Expire', es: 'Cambiado para expirar', ru: 'Изменено для истечения срока' },
  'asset.edit.attr.cyclopedia': { default: 'Cyclopedia', 'pt-BR': 'Ciclopédia', en: 'Cyclopedia', es: 'Ciclopedia', ru: 'Циклопедия' },
  'asset.edit.attr.upgradeClass': { default: 'Upgrade Classification', 'pt-BR': 'Classificação Upgrade', en: 'Upgrade Classification', es: 'Clasificación de mejora', ru: 'Классификация улучшения' },
  'asset.edit.attr.skillwheelGem': { default: 'Skillwheel Gem', 'pt-BR': 'Gema Roleta de Skills', en: 'Skillwheel Gem', es: 'Gema de la rueda', ru: 'Драгоценный камень' },
  'asset.edit.attr.imbueable': { default: 'Imbueable', 'pt-BR': 'Imbuível', en: 'Imbueable', es: 'Imbuible', ru: 'Зачаровываемый' },
  'asset.edit.attr.proficiency': { default: 'Proficiency', 'pt-BR': 'Proficiência', en: 'Proficiency', es: 'Competencia', ru: 'Мастерство' },
  'asset.edit.attr.requirements': { default: 'Requirements', 'pt-BR': 'Requisitos', en: 'Requirements', es: 'Requisitos', ru: 'Требования' },
  'asset.edit.attr.npcSaleData': { default: 'NPC Sale Data', 'pt-BR': 'Dados Venda NPC', en: 'NPC Sale Data', es: 'Datos venta NPC', ru: 'Данные о продаже NPC' },

  // Attributes Fields
  'asset.edit.field.id': { default: 'ID:', 'pt-BR': 'ID:', en: 'ID:', es: 'ID:', ru: 'ID:' },
  'asset.edit.field.type': { default: 'Type:', 'pt-BR': 'Tipo:', en: 'Type:', es: 'Tipo:', ru: 'Тип:' },
  'asset.edit.field.brightness': { default: 'Brightness:', 'pt-BR': 'Brilho:', en: 'Brightness:', es: 'Brillo:', ru: 'Яркость:' },
  'asset.edit.field.color': { default: 'Color:', 'pt-BR': 'Cor:', en: 'Color:', es: 'Color:', ru: 'Цвет:' },
  'asset.edit.field.x': { default: 'X:', 'pt-BR': 'X:', en: 'X:', es: 'X:', ru: 'X:' },
  'asset.edit.field.y': { default: 'Y:', 'pt-BR': 'Y:', en: 'Y:', es: 'Y:', ru: 'Y:' },
  'asset.edit.field.elevation': { default: 'Elevation:', 'pt-BR': 'Elevação:', en: 'Elevation:', es: 'Elevación:', ru: 'Возвышение:' },
  'asset.edit.field.maxTextLen': { default: 'Max Text Length:', 'pt-BR': 'Comprim. Máx. Texto:', en: 'Max Text Length:', es: 'Largo Máx. Texto:', ru: 'Макс. длина текста:' },
  'asset.edit.field.maxTextLenOnce': { default: 'Max Text Length Once:', 'pt-BR': 'Compr. Texto Único:', en: 'Max Text Length Once:', es: 'Largo Texto Única:', ru: 'Макс. длина один раз:' },
  'asset.edit.field.direction': { default: 'Direction:', 'pt-BR': 'Direção:', en: 'Direction:', es: 'Dirección:', ru: 'Направление:' },
  'asset.edit.field.slot': { default: 'Slot:', 'pt-BR': 'Slot:', en: 'Slot:', es: 'Ranura:', ru: 'Слот:' },
  'asset.edit.field.action': { default: 'Action:', 'pt-BR': 'Ação:', en: 'Action:', es: 'Acción:', ru: 'Действие:' },
  'asset.edit.field.category': { default: 'Category:', 'pt-BR': 'Categoria:', en: 'Category:', es: 'Categoría:', ru: 'Категория:' },
  'asset.edit.field.tradeAsObjId': { default: 'Trade As Object ID:', 'pt-BR': 'Trade As Object ID:', en: 'Trade As Object ID:', es: 'Intercambiar ID:', ru: 'Торговать как ID:' },
  'asset.edit.field.showAsObjId': { default: 'Show As Object ID:', 'pt-BR': 'Show As Object ID:', en: 'Show As Object ID:', es: 'Mostrar ID:', ru: 'Показывать как ID:' },
  'asset.edit.field.formerObjId': { default: 'Former Object Type ID:', 'pt-BR': 'Former Object Type ID:', en: 'Former Object Type ID:', es: 'ID objeto anterior:', ru: 'ID пред. типа:' },
  'asset.edit.field.cyclopediaType': { default: 'Cyclopedia Type:', 'pt-BR': 'Tipo de Ciclopédia:', en: 'Cyclopedia Type:', es: 'Tipo de Ciclopedia:', ru: 'Тип циклопедии:' },
  'asset.edit.field.classification': { default: 'Classification:', 'pt-BR': 'Classificação:', en: 'Classification:', es: 'Clasificación:', ru: 'Классификация:' },
  'asset.edit.field.gemQualId': { default: 'Gem Quality ID:', 'pt-BR': 'ID Qualidade Gema:', en: 'Gem Quality ID:', es: 'ID calidad gema:', ru: 'ID качества камня:' },
  'asset.edit.field.vocId': { default: 'Vocation ID:', 'pt-BR': 'ID Vocação:', en: 'Vocation ID:', es: 'ID Vocación:', ru: 'ID призвания:' },
  'asset.edit.field.slotCount': { default: 'Slot Count:', 'pt-BR': 'Quant. Slots:', en: 'Slot Count:', es: 'Cantidad ranuras:', ru: 'Количество слотов:' },
  'asset.edit.field.profId': { default: 'Proficiency ID:', 'pt-BR': 'ID Proficiência:', en: 'Proficiency ID:', es: 'ID competencia:', ru: 'ID мастерства:' },
  'asset.edit.field.minLevel': { default: 'Minimum Level:', 'pt-BR': 'Nível Mínimo:', en: 'Minimum Level:', es: 'Nivel Mínimo:', ru: 'Минимальный уровень:' },
  'asset.edit.field.vocations': { default: 'Vocations:', 'pt-BR': 'Vocações:', en: 'Vocations:', es: 'Vocaciones:', ru: 'Призвания:' },
  'asset.edit.field.location': { default: 'Location:', 'pt-BR': 'Localização:', en: 'Location:', es: 'Ubicación:', ru: 'Местоположение:' },
  'asset.edit.field.salePrice': { default: 'Sale Price:', 'pt-BR': 'Preço Venda:', en: 'Sale Price:', es: 'Precio Venta:', ru: 'Цена продажи:' },
  'asset.edit.field.buyPrice': { default: 'Buy Price:', 'pt-BR': 'Preço Compra:', en: 'Buy Price:', es: 'Precio Compra:', ru: 'Цена покупки:' },
  'asset.edit.field.currencyObjId': { default: 'Currency Object ID:', 'pt-BR': 'Moeda (Object ID):', en: 'Currency Object ID:', es: 'Moneda (ID objeto):', ru: 'Валюта (ID объекта):' },

  // Select Options (Clothes)
  'asset.edit.opt.none': { default: 'None', 'pt-BR': 'Nenhum', en: 'None', es: 'Ninguno', ru: 'Нет' },
  'asset.edit.opt.helmet': { default: 'Helmet', 'pt-BR': 'Capacete', en: 'Helmet', es: 'Casco', ru: 'Шлем' },
  'asset.edit.opt.amulet': { default: 'Amulet', 'pt-BR': 'Amuleto', en: 'Amulet', es: 'Amuleto', ru: 'Амулет' },
  'asset.edit.opt.backpack': { default: 'Backpack', 'pt-BR': 'Mochila', en: 'Backpack', es: 'Mochila', ru: 'Рюкзак' },
  'asset.edit.opt.armor': { default: 'Armor', 'pt-BR': 'Armadura', en: 'Armor', es: 'Armadura', ru: 'Броня' },
  'asset.edit.opt.shield': { default: 'Shield', 'pt-BR': 'Escudo', en: 'Shield', es: 'Escudo', ru: 'Щит' },
  'asset.edit.opt.weapon': { default: 'Weapon', 'pt-BR': 'Arma', en: 'Weapon', es: 'Arma', ru: 'Оружие' },
  'asset.edit.opt.legs': { default: 'Legs', 'pt-BR': 'Calças', en: 'Legs', es: 'Pantalones', ru: 'Ноги' },
  'asset.edit.opt.boots': { default: 'Boots', 'pt-BR': 'Botas', en: 'Boots', es: 'Botas', ru: 'Ботинки' },
  'asset.edit.opt.ring': { default: 'Ring', 'pt-BR': 'Anel', en: 'Ring', es: 'Anillo', ru: 'Кольцо' },
  'asset.edit.opt.arrowQuiver': { default: 'Arrow / Quiver', 'pt-BR': 'Flecha / Aljava', en: 'Arrow / Quiver', es: 'Flecha / Carcaj', ru: 'Стрела / Колчан' },

  // Select Options (Default Action)
  'asset.edit.opt.look': { default: 'Look', 'pt-BR': 'Olhar', en: 'Look', es: 'Mirar', ru: 'Смотреть' },
  'asset.edit.opt.use': { default: 'Use', 'pt-BR': 'Usar', en: 'Use', es: 'Usar', ru: 'Использовать' },
  'asset.edit.opt.open': { default: 'Open', 'pt-BR': 'Abrir', en: 'Open', es: 'Abrir', ru: 'Открыть' },
  'asset.edit.opt.autowalkHi': { default: 'Autowalk Highlight', 'pt-BR': 'Destaque Autowalk', en: 'Autowalk Highlight', es: 'Destacar caminar', ru: 'Выделение автоходьбы' },

  // Select Options (Weapon Type)
  'asset.edit.opt.noWeapon': { default: 'No Weapon', 'pt-BR': 'Sem Arma', en: 'No Weapon', es: 'Sin Arma', ru: 'Без оружия' },
  'asset.edit.opt.sword': { default: 'Sword', 'pt-BR': 'Espada', en: 'Sword', es: 'Espada', ru: 'Меч' },
  'asset.edit.opt.axe': { default: 'Axe', 'pt-BR': 'Machado', en: 'Axe', es: 'Hacha', ru: 'Топор' },
  'asset.edit.opt.club': { default: 'Club', 'pt-BR': 'Clava', en: 'Club', es: 'Maza', ru: 'Дубина' },
  'asset.edit.opt.fist': { default: 'Fist', 'pt-BR': 'Punho', en: 'Fist', es: 'Puño', ru: 'Кулак' },
  'asset.edit.opt.bow': { default: 'Bow', 'pt-BR': 'Arco', en: 'Bow', es: 'Arco', ru: 'Лук' },
  'asset.edit.opt.crossbow': { default: 'Crossbow', 'pt-BR': 'Besta', en: 'Crossbow', es: 'Ballesta', ru: 'Арбалет' },
  'asset.edit.opt.wandRod': { default: 'Wand / Rod', 'pt-BR': 'Varinha', en: 'Wand / Rod', es: 'Varita / Cetro', ru: 'Жезл / Посох' },
  'asset.edit.opt.throw': { default: 'Throw', 'pt-BR': 'Arremesso', en: 'Throw', es: 'Arrojar', ru: 'Бросать' },

  // Buttons & Details
  'asset.edit.btn.addVoc': { default: '+ Add Vocation ID', 'pt-BR': '+ Adic. ID de Voc.', en: '+ Add Voc ID', es: '+ Añadir ID de Voc.', ru: '+ Доб. ID призвания' },
  'asset.edit.btn.addNpc': { default: '+ Add NPC Sale Data', 'pt-BR': '+ Dados NPC Sale', en: '+ Add NPC Sale', es: '+ Añadir Ventas', ru: '+ Доб. данные NPC' },
  'asset.edit.btn.remove': { default: 'Remover', 'pt-BR': 'Remover', en: 'Remove', es: 'Eliminar', ru: 'Удалить' },
  'asset.edit.lbl.npcNum': { default: 'NPC #{{num}}', 'pt-BR': 'NPC #{{num}}', en: 'NPC #{{num}}', es: 'NPC #{{num}}', ru: 'NPC #{{num}}' },
  'asset.edit.lbl.vocId': { default: 'Vocação ID {{id}}', 'pt-BR': 'Vocação ID {{id}}', en: 'Voc ID {{id}}', es: 'Vocación ID {{id}}', ru: 'Призвание ID {{id}}' },
  'asset.edit.prompt.vocId': { default: 'Digite o ID da vocacao:', 'pt-BR': 'Digite o ID da vocação:', en: 'Enter Voc ID:', es: 'Ingrese el ID:', ru: 'Введите ID призвания:' },
  'asset.edit.south': { default: 'Sul (1)', 'pt-BR': 'Sul (1)', en: 'South (1)', es: 'Sur (1)', ru: 'Юг (1)' },
  'asset.edit.east': { default: 'Leste (2)', 'pt-BR': 'Leste (2)', en: 'East (2)', es: 'Este (2)', ru: 'Восток (2)' },
  'asset.edit.opt.south': { default: 'South (1)', 'pt-BR': 'Sul (1)', en: 'South (1)', es: 'Sur (1)', ru: 'Юг (1)' },

  // Asset Editing Info
  'asset.sound.info.title': { default: 'Information', 'pt-BR': 'Informação', en: 'Information', es: 'Información', ru: 'Информация' },

  // Audio Player
  'asset.audio.fail': { default: 'Failed to load audio', 'pt-BR': 'Falha ao carregar áudio', en: 'Failed to load audio', es: 'Error al cargar audio', ru: 'Ошибка загрузки аудио' },
  'asset.audio.noSupport': { default: 'Audio format not supported', 'pt-BR': 'Formato de áudio não suportado', en: 'Audio format not supported', es: 'Formato de audio no compatible', ru: 'Формат аудио не поддерживается' },
  'asset.audio.loading': { default: 'Loading audio...', 'pt-BR': 'Carregando áudio...', en: 'Loading audio...', es: 'Cargando audio...', ru: 'Загрузка аудио...' },

  // Sound Details
  'asset.sound.errorLoad': { default: 'Error loading sound details: {{err}}', 'pt-BR': 'Erro ao carregar detalhes do som: {{err}}', en: 'Error loading sound details: {{err}}', es: 'Error al cargar detalles: {{err}}', ru: 'Ошибка загрузки: {{err}}' },
  'asset.sound.desc.ambienceStream': { default: 'Ambience Stream', 'pt-BR': 'Ambiente (Stream)', en: 'Ambience Stream', es: 'Ambiente (Stream)', ru: 'Поток окружения' },
  'asset.sound.desc.ambienceObject': { default: 'Ambience Object', 'pt-BR': 'Objeto de Ambiente', en: 'Ambience Object', es: 'Objeto de ambiente', ru: 'Объект окружения' },
  'asset.sound.desc.musicTemplate': { default: 'Music Template', 'pt-BR': 'Template de Música', en: 'Music Template', es: 'Plantilla de música', ru: 'Шаблон музыки' },
  'asset.sound.delayedEffectsTitle': { default: 'Delayed Effects', 'pt-BR': 'Efeitos Atrasados', en: 'Delayed Effects', es: 'Efectos retardados', ru: 'Задержанные эффекты' },
  'asset.sound.effectId': { default: 'Effect ID', 'pt-BR': 'ID do Efeito', en: 'Effect ID', es: 'ID del efecto', ru: 'ID эффекта' },
  'asset.sound.delaySecs': { default: 'Delay (s)', 'pt-BR': 'Atraso (s)', en: 'Delay (s)', es: 'Retraso (s)', ru: 'Задержка (с)' },
  'asset.sound.countedTypesTitle': { default: 'Counted Types', 'pt-BR': 'Tipos Contados', en: 'Counted Types', es: 'Tipos contados', ru: 'Подсчитанные типы' },
  'asset.sound.effectsByCount': { default: 'Effects by Count', 'pt-BR': 'Efeitos por Contagem', en: 'Effects by Count', es: 'Efectos por cantidad', ru: 'Эффекты по количеству' },
  'asset.sound.count': { default: 'Count', 'pt-BR': 'Contagem', en: 'Count', es: 'Cantidad', ru: 'Количество' },
  'asset.sound.loopingId': { default: 'Looping ID', 'pt-BR': 'ID de Loop', en: 'Looping ID', es: 'ID de bucle', ru: 'ID цикла' },
  'asset.sound.audioPreview': { default: 'Audio Preview', 'pt-BR': 'Prévia de Áudio', en: 'Audio Preview', es: 'Vista previa de audio', ru: 'Предпрослушивание' },
  'asset.sound.type': { default: 'Type', 'pt-BR': 'Tipo', en: 'Type', es: 'Tipo', ru: 'Тип' },
  'asset.sound.soundId': { default: 'Sound ID', 'pt-BR': 'ID do Som', en: 'Sound ID', es: 'ID de sonido', ru: 'ID звука' },
  'asset.sound.musicType': { default: 'Music Type', 'pt-BR': 'Tipo de Música', en: 'Music Type', es: 'Tipo de música', ru: 'Тип музыки' },
  'asset.sound.maxDist': { default: 'Max Distance', 'pt-BR': 'Distância Máxima', en: 'Max Distance', es: 'Distancia máxima', ru: 'Макс. дистанция' },

  // Sound Edit Form
  'asset.sound.edit.soundIdSimple': { default: 'Sound ID', 'pt-BR': 'ID do Som', en: 'Sound ID', es: 'ID de sonido', ru: 'ID звука' },
  'asset.sound.edit.optRandom': { default: 'Random...', 'pt-BR': 'Aleatório...', en: 'Random...', es: 'Aleatorio...', ru: 'Случайный...' },
  'asset.sound.edit.randomIds': { default: 'Random IDs', 'pt-BR': 'IDs Aleatórios', en: 'Random IDs', es: 'IDs aleatorios', ru: 'Случайные ID' },
  'asset.sound.edit.randomPl': { default: 'e.g. 1,2,3', 'pt-BR': 'ex: 1,2,3', en: 'e.g. 1,2,3', es: 'ej: 1,2,3', ru: 'напр. 1,2,3' },
  'asset.sound.edit.pitchMin': { default: 'Pitch Min', 'pt-BR': 'Pitch Mín.', en: 'Pitch Min', es: 'Tono mín.', ru: 'Тон мин.' },
  'asset.sound.edit.pitchMax': { default: 'Pitch Max', 'pt-BR': 'Pitch Máx.', en: 'Pitch Max', es: 'Tono máx.', ru: 'Тон макс.' },
  'asset.sound.edit.volMin': { default: 'Volume Min', 'pt-BR': 'Vol. Mín.', en: 'Volume Min', es: 'Vol. mín.', ru: 'Громк. мин.' },
  'asset.sound.edit.volMax': { default: 'Volume Max', 'pt-BR': 'Vol. Máx.', en: 'Volume Max', es: 'Vol. máx.', ru: 'Громк. макс.' },
  'asset.sound.edit.deleteSound': { default: 'Delete Sound', 'pt-BR': 'Deletar Som', en: 'Delete Sound', es: 'Eliminar sonido', ru: 'Удалить звук' },
  'asset.sound.edit.save': { default: 'Save', 'pt-BR': 'Salvar', en: 'Save', es: 'Guardar', ru: 'Сохранить' },
  'asset.sound.edit.saved': { default: 'Sound saved successfully!', 'pt-BR': 'Som salvo com sucesso!', en: 'Sound saved successfully!', es: '¡Sonido guardado!', ru: 'Звук сохранен!' },
  'asset.sound.edit.addEffect': { default: '+ Add Effect', 'pt-BR': '+ Adicionar Efeito', en: '+ Add Effect', es: '+ Agregar efecto', ru: '+ Добавить эффект' },
  'asset.sound.edit.remove': { default: 'Remove', 'pt-BR': 'Remover', en: 'Remove', es: 'Eliminar', ru: 'Удалить' },
  'asset.sound.edit.countedTypesComma': { default: 'Appearance types (comma-separated)', 'pt-BR': 'Tipos de aparência (vírgula)', en: 'Appearance types (comma-separated)', es: 'Tipos (separados por coma)', ru: 'Типы (через запятую)' },
  'asset.sound.edit.confirmDeleteTitle': { default: 'Delete Sound?', 'pt-BR': 'Deletar Som?', en: 'Delete Sound?', es: '¿Eliminar sonido?', ru: 'Удалить звук?' },
  'asset.sound.edit.confirmDelete': { default: 'Are you sure you want to delete this sound?', 'pt-BR': 'Tem certeza que deseja deletar este som?', en: 'Are you sure you want to delete this sound?', es: '¿Estás seguro de eliminar este sonido?', ru: 'Вы уверены, что хотите удалить этот звук?' },
  'asset.sound.edit.title': { default: 'Editar {{type}}', 'pt-BR': 'Editar {{type}}', en: 'Edit {{type}}', es: 'Editar {{type}}', ru: 'Редактировать {{type}}' },
  'asset.sound.edit.saveFail': { default: 'Falha ao salvar som: {{err}}', 'pt-BR': 'Falha ao salvar som: {{err}}', en: 'Failed to save sound: {{err}}', es: 'Error al guardar sonido: {{err}}', ru: 'Ошибка сохранения звука: {{err}}' },
  'asset.sound.edit.deleteFail': { default: 'Falha ao deletar som: {{err}}', 'pt-BR': 'Falha ao deletar som: {{err}}', en: 'Failed to delete sound: {{err}}', es: 'Error al eliminar sonido: {{err}}', ru: 'Ошибка al eliminar sonido: {{err}}' },

  // Sound Types
  'asset.sound.type.spellAttack': { default: 'Spell Attack', 'pt-BR': 'Ataque de Magia', en: 'Spell Attack', es: 'Ataque de hechizo', ru: 'Магическая атака' },
  'asset.sound.type.spellHealing': { default: 'Spell Healing', 'pt-BR': 'Cura de Magia', en: 'Spell Healing', es: 'Curación de hechizo', ru: 'Магическое лечение' },
  'asset.sound.type.spellSupport': { default: 'Spell Support', 'pt-BR': 'Suporte de Magia', en: 'Spell Support', es: 'Soporte de hechizo', ru: 'Магическая поддержка' },
  'asset.sound.type.weaponAttack': { default: 'Weapon Attack', 'pt-BR': 'Ataque de Arma', en: 'Weapon Attack', es: 'Ataque de arma', ru: 'Атака оружием' },
  'asset.sound.type.creatureNoise': { default: 'Creature Noise', 'pt-BR': 'Ruído de Criatura', en: 'Creature Noise', es: 'Ruido de criatura', ru: 'Шум существа' },
  'asset.sound.type.creatureDeath': { default: 'Creature Death', 'pt-BR': 'Morte de Criatura', en: 'Creature Death', es: 'Muerte de criatura', ru: 'Смерть существа' },
  'asset.sound.type.creatureAttack': { default: 'Creature Attack', 'pt-BR': 'Ataque de Criatura', en: 'Creature Attack', es: 'Ataque de criatura', ru: 'Атака существа' },
  'asset.sound.type.ambienceStream': { default: 'Ambience Stream', 'pt-BR': 'Ambiente em Stream', en: 'Ambience Stream', es: 'Ambiente en stream', ru: 'Поток окружения' },
  'asset.sound.type.foodDrink': { default: 'Food and Drink', 'pt-BR': 'Comida e Bebida', en: 'Food and Drink', es: 'Comida e bebida', ru: 'Еда и питье' },
  'asset.sound.type.itemMovement': { default: 'Item Movement', 'pt-BR': 'Movimento de Item', en: 'Item Movement', es: 'Movimiento de artículo', ru: 'Движение предмета' },
  'asset.sound.type.event': { default: 'Event', 'pt-BR': 'Evento', en: 'Event', es: 'Evento', ru: 'Событие' },
  'asset.sound.type.ui': { default: 'UI', 'pt-BR': 'Interface', en: 'UI', es: 'Interfaz', ru: 'Интерфейс' },
  'asset.sound.type.whisper': { default: 'Whisper', 'pt-BR': 'Sussurro', en: 'Whisper', es: 'Susurro', ru: 'Шепот' },
  'asset.sound.type.chatMessage': { default: 'Chat Message', 'pt-BR': 'Mensagem de Chat', en: 'Chat Message', es: 'Mensaje de chat', ru: 'Сообщение в чате' },
  'asset.sound.type.party': { default: 'Party', 'pt-BR': 'Party', en: 'Party', es: 'Party', ru: 'Группа' },
  'asset.sound.type.vipList': { default: 'VIP List', 'pt-BR': 'Lista VIP', en: 'VIP List', es: 'Lista VIP', ru: 'Список VIP' },
  'asset.sound.type.raidAnnouncement': { default: 'Raid Announcement', 'pt-BR': 'Anúncio de Raid', en: 'Raid Announcement', es: 'Anuncio de raid', ru: 'Объявление о рейде' },
  'asset.sound.type.serverMessage': { default: 'Server Message', 'pt-BR': 'Mensagem de Servidor', en: 'Server Message', es: 'Mensaje del servidor', ru: 'Сообщение сервера' },
  'asset.sound.type.spellGeneric': { default: 'Spell Generic', 'pt-BR': 'Magia Genérica', en: 'Spell Generic', es: 'Hechizo genérico', ru: 'Общее заклинание' },

  // Asset Editing Flags
  'asset.flags.clip': { default: 'Clip', 'pt-BR': 'Clip', en: 'Clip', es: 'Recortar', ru: 'Обрезать' },
  'asset.flags.bottom': { default: 'Bottom', 'pt-BR': 'Fundo', en: 'Bottom', es: 'Fondo', ru: 'Низ' },
  'asset.flags.top': { default: 'Top', 'pt-BR': 'Topo', en: 'Top', es: 'Arriba', ru: 'Верх' },
  'asset.flags.container': { default: 'Container', 'pt-BR': 'Container', en: 'Container', es: 'Contenedor', ru: 'Контейнер' },
  'asset.flags.cumulative': { default: 'Cumulative', 'pt-BR': 'Cumulativo', en: 'Cumulative', es: 'Acumulativo', ru: 'Накопительный' },
  'asset.flags.usable': { default: 'Usable', 'pt-BR': 'Usável', en: 'Usable', es: 'Utilizable', ru: 'Используемый' },
  'asset.flags.forceuse': { default: 'Forceuse', 'pt-BR': 'Força uso', en: 'Forceuse', es: 'Uso forzado', ru: 'Принудительное' },
  'asset.flags.multiuse': { default: 'Multiuse', 'pt-BR': 'Multiuso', en: 'Multiuse', es: 'Multiuso', ru: 'Многоразовый' },
  'asset.flags.liquidpool': { default: 'Liquidpool', 'pt-BR': 'Poça líq.', en: 'Liquidpool', es: 'Charco', ru: 'Лужа' },
  'asset.flags.liquidcontainer': { default: 'Liquid Container', 'pt-BR': 'Cont. de líquido', en: 'Liquid Container', es: 'Contenedor líq.', ru: 'Резервуар' },
  'asset.flags.unpass': { default: 'Unpass', 'pt-BR': 'Bloq. pass.', en: 'Unpass', es: 'Bloquea paso', ru: 'Непроходимый' },
  'asset.flags.unmove': { default: 'Unmove', 'pt-BR': 'Fixado', en: 'Unmove', es: 'Fijo', ru: 'Неподвижный' },
  'asset.flags.unsight': { default: 'Unsight', 'pt-BR': 'Bloq. vista', en: 'Unsight', es: 'Bloquea vista', ru: 'Непросматриваемый' },
  'asset.flags.avoid': { default: 'Avoid', 'pt-BR': 'Evitar', en: 'Avoid', es: 'Evitar', ru: 'Избегать' },
  'asset.flags.no_movement_animation': { default: 'No Move Animation', 'pt-BR': 'Sem anim. mov.', en: 'No Move Animation', es: 'Sin anim. mov.', ru: 'Без анимации' },
  'asset.flags.take': { default: 'Take', 'pt-BR': 'Pegável', en: 'Take', es: 'Tomable', ru: 'Можно взять' },
  'asset.flags.hang': { default: 'Hang', 'pt-BR': 'Pendurável', en: 'Hang', es: 'Colgable', ru: 'Можно повесить' },
  'asset.flags.rotate': { default: 'Rotate', 'pt-BR': 'Rotacionável', en: 'Rotate', es: 'Rotable', ru: 'Вращающийся' },
  'asset.flags.dont_hide': { default: 'Dont Hide', 'pt-BR': 'Não oculta', en: 'Dont Hide', es: 'No ocultar', ru: 'Не скрывать' },
  'asset.flags.translucent': { default: 'Translucent', 'pt-BR': 'Translúcido', en: 'Translucent', es: 'Translúcido', ru: 'Полупрозрачный' },
  'asset.flags.lying_object': { default: 'Lying Object', 'pt-BR': 'Corpo', en: 'Lying Object', es: 'Objeto acostado', ru: 'Лежащий объект' },
  'asset.flags.animate_always': { default: 'Animate Always', 'pt-BR': 'Anim. contínua', en: 'Animate Always', es: 'Anim. continua', ru: 'Всегда анимирован' },
  'asset.flags.fullbank': { default: 'Fullbank', 'pt-BR': 'Fullbank', en: 'Fullbank', es: 'Fullbank', ru: 'Полный' },
  'asset.flags.ignore_look': { default: 'Ignore Look', 'pt-BR': 'Ignorar Look', en: 'Ignore Look', es: 'Ignorar Look', ru: 'Игнорировать взгляд' },
  'asset.flags.wrap': { default: 'Wrap', 'pt-BR': 'Empac.', en: 'Wrap', es: 'Envolver', ru: 'Упаковать' },
  'asset.flags.unwrap': { default: 'Unwrap', 'pt-BR': 'Desempac.', en: 'Unwrap', es: 'Desenvolver', ru: 'Распаковать' },
  'asset.flags.topeffect': { default: 'Topeffect', 'pt-BR': 'Efeito topo', en: 'Topeffect', es: 'Efecto superior', ru: 'Верхний эффект' },
  'asset.flags.corpse': { default: 'Corpse', 'pt-BR': 'Cadáver', en: 'Corpse', es: 'Cadáver', ru: 'Труп' },
  'asset.flags.player_corpse': { default: 'Player Corpse', 'pt-BR': 'Cadáver Player', en: 'Player Corpse', es: 'Cadáver Jugador', ru: 'Труп игрока' },
  'asset.flags.ammo': { default: 'Ammo', 'pt-BR': 'Munição', en: 'Ammo', es: 'Munición', ru: 'Боеприпасы' },
  'asset.flags.show_off_socket': { default: 'Show Off Socket', 'pt-BR': 'Show off socket', en: 'Show Off Socket', es: 'Mostrar hueco', ru: 'Показать слот' },
  'asset.flags.reportable': { default: 'Reportable', 'pt-BR': 'Reportável', en: 'Reportable', es: 'Reportable', ru: 'Можно сообщить' },
  'asset.flags.reverse_addons_east': { default: 'Reverse addon east', 'pt-BR': 'Rev. addon east', en: 'Reverse addon east', es: 'Rev. addon este', ru: 'Обратный аддон восток' },
  'asset.flags.reverse_addons_west': { default: 'Reverse addon west', 'pt-BR': 'Rev. addon west', en: 'Reverse addon west', es: 'Rev. addon oeste', ru: 'Обратный аддон запад' },
  'asset.flags.reverse_addons_south': { default: 'Reverse addon south', 'pt-BR': 'Rev. addon south', en: 'Reverse addon south', es: 'Rev. addon sur', ru: 'Обратный аддон юг' },
  'asset.flags.reverse_addons_north': { default: 'Reverse addon north', 'pt-BR': 'Rev. addon north', en: 'Reverse addon north', es: 'Rev. addon norte', ru: 'Обратный аддон север' },
  'asset.flags.wearout': { default: 'Wearout', 'pt-BR': 'Desgaste', en: 'Wearout', es: 'Desgaste', ru: 'Износ' },
  'asset.flags.clockexpire': { default: 'Clockexpire', 'pt-BR': 'Expira no t.', en: 'Clockexpire', es: 'Expira reloj', ru: 'Истечение часов' },
  'asset.flags.expire': { default: 'Expire', 'pt-BR': 'Expira', en: 'Expire', es: 'Expira', ru: 'Истекает' },
  'asset.flags.expirestop': { default: 'Expirestop', 'pt-BR': 'Parar exp.', en: 'Expirestop', es: 'Parar exp.', ru: 'Остановить износ' },
  'asset.flags.deco_item_kit': { default: 'Deco Item Kit', 'pt-BR': 'Kit Deco', en: 'Deco Item Kit', es: 'Kit Deco', ru: 'Набор декораций' },
  'asset.flags.dual_wielding': { default: 'Dual Wielding', 'pt-BR': 'Dual Wield', en: 'Dual Wielding', es: 'Empuñadura doble', ru: 'Парное оружие' },

  // Asset Flags - Active Title
  'asset.flags.activeTitle': { default: 'Flags Ativas', 'pt-BR': 'Flags Ativas', en: 'Active Flags', es: 'Flags Activas', ru: 'Активные флаги' },

  // Asset Flags - Groups
  'asset.flags.group.groundStack': { default: 'Ordem de Solo & Empilhamento', 'pt-BR': 'Ordem de Solo & Empilhamento', en: 'Ground & Stack Order', es: 'Suelo y Apilamiento', ru: 'Порядок на земле и стека' },
  'asset.flags.group.containerStack': { default: 'Container & Empilhamento', 'pt-BR': 'Container & Empilhamento', en: 'Container & Stacking', es: 'Contenedor y Apilamiento', ru: 'Контейнер и стек' },
  'asset.flags.group.usage': { default: 'Uso', 'pt-BR': 'Uso', en: 'Usage', es: 'Uso', ru: 'Использование' },
  'asset.flags.group.movement': { default: 'Movimento & Pathfinding', 'pt-BR': 'Movimento & Pathfinding', en: 'Movement & Pathfinding', es: 'Movimiento y Navegación', ru: 'Движение и навигация' },
  'asset.flags.group.placement': { default: 'Posicionamento', 'pt-BR': 'Posicionamento', en: 'Placement', es: 'Colocación', ru: 'Размещение' },
  'asset.flags.group.visual': { default: 'Visual', 'pt-BR': 'Visual', en: 'Visual', es: 'Visual', ru: 'Визуальный' },
  'asset.flags.group.wrapping': { default: 'Embrulho', 'pt-BR': 'Embrulho', en: 'Wrapping', es: 'Empaquetado', ru: 'Упаковка' },
  'asset.flags.group.specialTypes': { default: 'Tipos Especiais', 'pt-BR': 'Tipos Especiais', en: 'Special Types', es: 'Tipos Especiales', ru: 'Специальные типы' },
  'asset.flags.group.reportable': { default: 'Reportável', 'pt-BR': 'Reportável', en: 'Reportable', es: 'Reportable', ru: 'Можно сообщить' },
  'asset.flags.group.reverseAddons': { default: 'Addons Invertidos', 'pt-BR': 'Addons Invertidos', en: 'Reverse Addons', es: 'Addons Invertidos', ru: 'Обратные аддоны' },
  'asset.flags.group.expiration': { default: 'Expiração', 'pt-BR': 'Expiração', en: 'Expiration', es: 'Expiración', ru: 'Истечение срока' },
  'asset.flags.group.special': { default: 'Especial', 'pt-BR': 'Especial', en: 'Special', es: 'Especial', ru: 'Специальный' },

  // Asset Flags - Sections
  'asset.flags.section.groundBank': { default: 'Solo / Ground Bank', 'pt-BR': 'Solo / Bank', en: 'Ground / Bank', es: 'Suelo / Bank', ru: 'Земля / Банк' },
  'asset.flags.section.writableProps': { default: 'Propriedades de Texto', 'pt-BR': 'Propriedades de Texto', en: 'Writable Properties', es: 'Propiedades de Escritura', ru: 'Свойства записи' },
  'asset.flags.section.hookProps': { default: 'Propriedades de Gancho', 'pt-BR': 'Propriedades de Gancho', en: 'Hook Properties', es: 'Propiedades del Gancho', ru: 'Свойства крюка' },
  'asset.flags.section.lightProps': { default: 'Propriedades de Luz', 'pt-BR': 'Propriedades de Luz', en: 'Light Properties', es: 'Propiedades de Luz', ru: 'Свойства освещения' },
  'asset.flags.section.shiftDisp': { default: 'Shift / Deslocamento', 'pt-BR': 'Shift / Deslocamento', en: 'Shift / Displacement', es: 'Turno / Desplazamiento', ru: 'Смещение' },
  'asset.flags.section.heightElev': { default: 'Altura / Elevação', 'pt-BR': 'Altura / Elevação', en: 'Height / Elevation', es: 'Altura / Elevación', ru: 'Высота / возвышение' },
  'asset.flags.section.automap': { default: 'Minimapa / Automap', 'pt-BR': 'Minimapa / Automap', en: 'Minimap / Automap', es: 'Minimapa', ru: 'Мини-карта' },
  'asset.flags.section.lensHelp': { default: 'Lens Help', 'pt-BR': 'Ajuda Lente', en: 'Lens Help', es: 'Ayuda de lente', ru: 'Помощь линзы' },
  'asset.flags.section.clothesEquip': { default: 'Roupas / Equipamento', 'pt-BR': 'Roupas / Equipamento', en: 'Clothes / Equipment', es: 'Ropa / Equipamiento', ru: 'Одежда / Снаряжение' },
  'asset.flags.section.defaultAction': { default: 'Ação Padrão', 'pt-BR': 'Ação Padrão', en: 'Default Action', es: 'Acción por defecto', ru: 'Действие по умолчанию' },
  'asset.flags.section.weaponType': { default: 'Tipo de Arma', 'pt-BR': 'Tipo de Arma', en: 'Weapon Type', es: 'Tipo de Arma', ru: 'Тип оружия' },
  'asset.flags.section.marketInfo': { default: 'Informações de Mercado', 'pt-BR': 'Informações de Mercado', en: 'Market Information', es: 'Información de Mercado', ru: 'Информация о рынке' },
  'asset.flags.section.vocationRestr': { default: 'Restrições de Vocação', 'pt-BR': 'Restrições de Vocação', en: 'Vocation Restrictions', es: 'Restricciones de Vocación', ru: 'Ограничения по призванию' },
  'asset.flags.section.levelReq': { default: 'Requisito de Level', 'pt-BR': 'Requisito de Level', en: 'Level Requirement', es: 'Requisito de Nivel', ru: 'Требование уровня' },
  'asset.flags.section.npcSaleData': { default: 'Dados de Venda NPC', 'pt-BR': 'Dados de Venda NPC', en: 'NPC Sale Data', es: 'Datos de Venta NPC', ru: 'Данные продаж NPC' },
  'asset.flags.section.changedToExpire': { default: 'Muda ao Expirar', 'pt-BR': 'Muda ao Expirar', en: 'Changed To Expire', es: 'Cambia al Expirar', ru: 'Изменяется при истечении срока' },
  'asset.flags.section.cyclopedia': { default: 'Ciclopédia', 'pt-BR': 'Ciclopédia', en: 'Cyclopedia', es: 'Ciclopedia', ru: 'Циклопедия' },
  'asset.flags.section.upgradeClass': { default: 'Classificação de Upgrade', 'pt-BR': 'Classificação de Upgrade', en: 'Upgrade Classification', es: 'Clasificación de Mejora', ru: 'Классификация улучшения' },
  'asset.flags.section.skillwheelGem': { default: 'Gema da Roleta de Skills', 'pt-BR': 'Gema da Roleta de Skills', en: 'Skillwheel Gem', es: 'Gema de la Rueda', ru: 'Камень колеса навыков' },
  'asset.flags.section.imbueable': { default: 'Imbuível', 'pt-BR': 'Imbuível', en: 'Imbueable', es: 'Imbuible', ru: 'Зачаровываемый' },
  'asset.flags.section.proficiency': { default: 'Proficiência', 'pt-BR': 'Proficiência', en: 'Proficiency', es: 'Competencia', ru: 'Мастерство' },

  // Asset Flags - Fields
  'asset.flags.field.waypointsSpeed': { default: 'Waypoints / Velocidade:', 'pt-BR': 'Waypoints / Velocidade:', en: 'Waypoints / Speed:', es: 'Waypoints / Velocidad:', ru: 'Вейпоинты / Скорость:' },
  'asset.flags.field.hookDirection': { default: 'Direção do Gancho:', 'pt-BR': 'Direção do Gancho:', en: 'Hook Direction:', es: 'Dirección del Gancho:', ru: 'Направление крюка:' },
  'asset.flags.field.shiftX': { default: 'Shift X:', 'pt-BR': 'Shift X:', en: 'Shift X:', es: 'Despl. X:', ru: 'Смещение X:' },
  'asset.flags.field.shiftY': { default: 'Shift Y:', 'pt-BR': 'Shift Y:', en: 'Shift Y:', es: 'Despl. Y:', ru: 'Смещение Y:' },
  'asset.flags.field.minimapColor': { default: 'Cor do Minimapa:', 'pt-BR': 'Cor do Minimapa:', en: 'Minimap Color:', es: 'Color del Minimapa:', ru: 'Цвет миникарты:' },
  'asset.flags.field.helpId': { default: 'Help ID:', 'pt-BR': 'Help ID:', en: 'Help ID:', es: 'ID de Ayuda:', ru: 'ID справки:' },
  'asset.flags.field.restrictTo': { default: 'Restringir a:', 'pt-BR': 'Restringir a:', en: 'Restrict To:', es: 'Restringir a:', ru: 'Ограничить до:' },
  'asset.flags.field.npcNum': { default: 'NPC #{{num}}', 'pt-BR': 'NPC #{{num}}', en: 'NPC #{{num}}', es: 'NPC #{{num}}', ru: 'NPC #{{num}}' },
  'asset.flags.field.currencyQuestFlag': { default: 'Moeda Quest Flag:', 'pt-BR': 'Moeda Quest Flag:', en: 'Currency Quest Flag:', es: 'Flag de Moneda Quest:', ru: 'Флаг валюты квеста:' },

  // RCC - missing key
  'rcc.status.saving': { default: 'Salvando...', 'pt-BR': 'Salvando...', en: 'Saving...', es: 'Guardando...', ru: 'Сохранение...' },

  // ==========================================
  // Monster Editor Root & Layout
  // ==========================================
  'monster.editor.title': { default: 'Monster Editor', 'pt-BR': 'Editor de Monstros', en: 'Monster Editor', es: 'Editor de Monstruos', ru: 'Редактор Монстров' },
  'monster.editor.back': { default: 'Back to Home', 'pt-BR': 'Voltar à Home', en: 'Back to Home', es: 'Volver a Inicio', ru: 'Вернуться на главную' },
  'monster.editor.reload': { default: 'Reload', 'pt-BR': 'Recarregar', en: 'Reload', es: 'Recargar', ru: 'Перезагрузить' },
  'monster.editor.reloadTitle': { default: 'Recarregar diretório atual', 'pt-BR': 'Recarregar diretório atual', en: 'Reload current directory', es: 'Recargar directorio actual', ru: 'Перезагрузить текущий каталог' },
  'monster.editor.changeDir': { default: 'Mudar pasta', 'pt-BR': 'Mudar pasta', en: 'Change folder', es: 'Cambiar carpeta', ru: 'Изменить папку' },
  'monster.editor.changeDirTitle': { default: 'Escolher um novo diretório de monstros', 'pt-BR': 'Escolher um novo diretório de monstros', en: 'Choose a new monsters directory', es: 'Elegir un nuevo directorio de monstruos', ru: 'Выберите новый каталог монстров' },
  'monster.editor.error.selectDir': { default: 'Não foi possível selecionar a nova pasta de monstros.', 'pt-BR': 'Não foi possível selecionar a nova pasta de monstros.', en: 'Could not select the new monsters folder.', es: 'No se pudo seleccionar la nueva carpeta de monstruos.', ru: 'Не удалось выбрать новую папку с монстрами.' },

  'monster.sidebar.search': { default: 'Search monsters...', 'pt-BR': 'Procurar monstros...', en: 'Search monsters...', es: 'Buscar monstruos...', ru: 'Поиск монстров...' },
  'monster.sidebar.loading': { default: 'Loading monsters...', 'pt-BR': 'Carregando monstros...', en: 'Loading monsters...', es: 'Cargando monstruos...', ru: 'Загрузка монстров...' },
  'monster.sidebar.emptyDir': { default: 'Please select a monster directory', 'pt-BR': 'Por favor selecione um diretório de monstros', en: 'Please select a monster directory', es: 'Por favor seleccione un directorio de monstruos', ru: 'Пожалуйста, выберите каталог монстров' },
  'monster.sidebar.noMonsters': { default: 'No monsters found', 'pt-BR': 'Nenhum monstro encontrado', en: 'No monsters found', es: 'No se encontraron monstruos', ru: 'Монстры не найдены' },

  'monster.list.error.load': { default: 'Failed to load monster: {{err}}', 'pt-BR': 'Falha ao carregar monstro: {{err}}', en: 'Failed to load monster: {{err}}', es: 'Error al cargar el monstruo: {{err}}', ru: 'Не удалось загрузить монстра: {{err}}' },

  'monster.form.saved': { default: 'Monster saved successfully!', 'pt-BR': 'Monstro salvo com sucesso!', en: 'Monster saved successfully!', es: '¡Monstruo guardado exitosamente!', ru: 'Монстр успешно сохранен!' },
  'monster.form.error.save': { default: 'Failed to save: {{err}}', 'pt-BR': 'Falha ao salvar: {{err}}', en: 'Failed to save: {{err}}', es: 'Error al guardar: {{err}}', ru: 'Не удалось сохранить: {{err}}' },
  'monster.form.empty': { default: 'Select a monster to edit', 'pt-BR': 'Selecione um monstro para editar', en: 'Select a monster to edit', es: 'Selecciona un monstruo para editar', ru: 'Выберите монстра для редактирования' },
  'monster.form.saveBtn': { default: 'Save Monster', 'pt-BR': 'Salvar Monstro', en: 'Save Monster', es: 'Guardar Monstruo', ru: 'Сохранить монстра' },

  // ==========================================
  // Monster Editor Cards
  // ==========================================
  // Basic Info
  'monster.card.basic.title': { default: '📋 Basic Information', 'pt-BR': '📋 Info. Básica', en: '📋 Basic Info', es: '📋 Info. Básica', ru: '📋 Основная инфо.' },
  'monster.card.basic.name': { default: 'Name', 'pt-BR': 'Nome', en: 'Name', es: 'Nombre', ru: 'Имя' },
  'monster.card.basic.description': { default: 'Description', 'pt-BR': 'Descrição', en: 'Description', es: 'Descripción', ru: 'Описание' },
  'monster.card.basic.experience': { default: 'Experience', 'pt-BR': 'Experiência (XP)', en: 'Experience', es: 'Experiencia', ru: 'Опыт' },
  'monster.card.basic.health': { default: 'Health', 'pt-BR': 'Vida (HP)', en: 'Health', es: 'Salud', ru: 'Здоровье' },
  'monster.card.basic.maxHealth': { default: 'Max Health', 'pt-BR': 'Vida Máxima', en: 'Max Health', es: 'Salud Máx.', ru: 'Макс. здоровье' },
  'monster.card.basic.speed': { default: 'Speed', 'pt-BR': 'Velocidade', en: 'Speed', es: 'Velocidad', ru: 'Скорость' },
  'monster.card.basic.manaCost': { default: 'Mana Cost', 'pt-BR': 'Custo de Mana', en: 'Mana Cost', es: 'Costo Maná', ru: 'Затраты маны' },
  'monster.card.basic.race': { default: 'Race', 'pt-BR': 'Raça', en: 'Race', es: 'Raza', ru: 'Раса' },
  'monster.card.basic.corpseId': { default: 'Corpse ID', 'pt-BR': 'ID Cadáver', en: 'Corpse ID', es: 'ID Cadáver', ru: 'ID трупа' },

  // Advanced Settings
  'monster.card.advanced.title': { default: '🔧 Advanced Settings', 'pt-BR': '🔧 Configurações Avançadas', en: '🔧 Advanced Settings', es: '🔧 Ajustes Avanzados', ru: '🔧 Доп. настройки' },
  'monster.card.advanced.light': { default: 'Light', 'pt-BR': 'Luz', en: 'Light', es: 'Luz', ru: 'Свет' },
  'monster.card.advanced.level': { default: 'Level', 'pt-BR': 'Nível', en: 'Level', es: 'Nivel', ru: 'Уровень' },
  'monster.card.advanced.color': { default: 'Color', 'pt-BR': 'Cor', en: 'Color', es: 'Color', ru: 'Цвет' },
  'monster.card.advanced.changeTarget': { default: 'Change Target', 'pt-BR': 'Mudar Alvo', en: 'Change Target', es: 'Cambiar Objetivo', ru: 'Сменить цель' },
  'monster.card.advanced.interval': { default: 'Interval', 'pt-BR': 'Intervalo', en: 'Interval', es: 'Intervalo', ru: 'Интервал' },
  'monster.card.advanced.chance': { default: 'Chance', 'pt-BR': 'Chance', en: 'Chance', es: 'Probabilidad', ru: 'Шанс' },
  'monster.card.advanced.targetStrategies': { default: 'Target Strategies', 'pt-BR': 'Estratégias de Alvo', en: 'Target Strategies', es: 'Estrategias', ru: 'Стратегии' },
  'monster.card.advanced.nearest': { default: 'Nearest', 'pt-BR': 'Mais Perto', en: 'Nearest', es: 'Más Cercano', ru: 'Ближайший' },
  'monster.card.advanced.healthStrategy': { default: 'Health', 'pt-BR': 'Menos Vida', en: 'Health', es: 'Salud', ru: 'Здоровье' },
  'monster.card.advanced.damage': { default: 'Damage', 'pt-BR': 'Mais Dano', en: 'Damage', es: 'Daño', ru: 'Урон' },
  'monster.card.advanced.random': { default: 'Random', 'pt-BR': 'Aleatório', en: 'Random', es: 'Aleatorio', ru: 'Случайный' },

  // Classification & Lore
  'monster.card.class.title': { default: '📂 Lore & Classification', 'pt-BR': '📂 Lore & Classificação', en: '📂 Lore & Classification', es: '📂 Historia', ru: '📂 Знания' },
  'monster.card.class.raceId': { default: 'Race ID', 'pt-BR': 'ID da Raça', en: 'Race ID', es: 'ID Raza', ru: 'ID Расы' },
  'monster.card.class.bestiary': { default: 'Bestiary', 'pt-BR': 'Bestiário', en: 'Bestiary', es: 'Bestiario', ru: 'Бестиарий' },
  'monster.card.class.enabled': { default: 'Enabled', 'pt-BR': 'Ativado', en: 'Enabled', es: 'Activado', ru: 'Включено' },
  'monster.card.class.disabled': { default: 'Disabled', 'pt-BR': 'Desativado', en: 'Disabled', es: 'Desactivado', ru: 'Отключено' },
  'monster.card.class.bestiaryDesc': { default: 'Controls monster.Bestiary table: lore, stars, unlock thresholds and locations.', 'pt-BR': 'Controla a tabela monster.Bestiary: lore, estrelas, condições de desbloqueio...', en: 'Controls monster.Bestiary table', es: 'Controla el Bestiario', ru: 'Управляет таблицей бестиария' },
  'monster.card.class.initBestiary': { default: 'Initialize Bestiary', 'pt-BR': 'Inicializar Bestiário', en: 'Initialize Bestiary', es: 'Iniciar Bestiario', ru: 'Иниц. бестиарий' },
  'monster.card.class.class': { default: 'Class', 'pt-BR': 'Classe', en: 'Class', es: 'Clase', ru: 'Класс' },
  'monster.card.class.stars': { default: 'Stars', 'pt-BR': 'Estrelas', en: 'Stars', es: 'Estrellas', ru: 'Звезды' },
  'monster.card.class.occurrence': { default: 'Occurrence', 'pt-BR': 'Ocorrência', en: 'Occurrence', es: 'Ocurrencia', ru: 'Появление' },
  'monster.card.class.toKill': { default: 'To Kill', 'pt-BR': 'Para Matar', en: 'To Kill', es: 'Matar', ru: 'Убить' },
  'monster.card.class.firstUnlock': { default: 'First Unlock', 'pt-BR': '1º Desbloqueio', en: 'First Unlock', es: 'Primer Desbloqueo', ru: 'Первое откр.' },
  'monster.card.class.secondUnlock': { default: 'Second Unlock', 'pt-BR': '2º Desbloqueio', en: 'Second Unlock', es: 'Segundo Desbloqueo', ru: 'Второе откр.' },
  'monster.card.class.charmsPoints': { default: 'Charms Points', 'pt-BR': 'Pontos de Charms', en: 'Charms Points', es: 'Puntos Charms', ru: 'Очки шармов' },
  'monster.card.class.locations': { default: 'Locations', 'pt-BR': 'Localizações', en: 'Locations', es: 'Ubicaciones', ru: 'Локации' },
  'monster.card.class.bosstiary': { default: 'Bosstiary', 'pt-BR': 'Bosstiário', en: 'Bosstiary', es: 'Bosstiario', ru: 'Босстиарий' },
  'monster.card.class.bosstiaryDesc': { default: 'Boss rarity information exported in monster.bosstiary.', 'pt-BR': 'Informações de raridade exportadas em monster.bosstiary', en: 'Boss rarity information exported', es: 'Info. de rareza del jefe', ru: 'Информация о редкости босса' },
  'monster.card.class.bossRaceId': { default: 'Boss Race ID', 'pt-BR': 'ID Raça Boss', en: 'Boss Race ID', es: 'ID Raza Jefe', ru: 'ID расы босса' },
  'monster.card.class.bossRaceConst': { default: 'Boss Race Constant', 'pt-BR': 'Constante da Raça', en: 'Boss Race Constant', es: 'Constante Jefe', ru: 'Константа расы босса' },
  'monster.card.class.bossDisabled': { default: 'Disabled for this monster.', 'pt-BR': 'Desativado para este monstro.', en: 'Disabled for this monster.', es: 'Desactivado para este monstruo.', ru: 'Отключено для этого монстра.' },

  // Combat Stats
  'monster.card.combat.title': { default: '🛡️ Combat Stats', 'pt-BR': '🛡️ Status de Combate', en: '🛡️ Combat Stats', es: '🛡️ Stats Combate', ru: '🛡️ Боевая стат.' },
  'monster.card.combat.defense': { default: 'Defense', 'pt-BR': 'Defesa', en: 'Defense', es: 'Defensa', ru: 'Защита' },
  'monster.card.combat.armor': { default: 'Armor', 'pt-BR': 'Armadura', en: 'Armor', es: 'Armadura', ru: 'Броня' },
  'monster.card.combat.mitigation': { default: 'Mitigation', 'pt-BR': 'Mitigação', en: 'Mitigation', es: 'Mitigación', ru: 'Смягчение' },

  // Elements
  'monster.card.elements.title': { default: '🧪 Elements & Immunities', 'pt-BR': '🧪 Elementos e Imunidades', en: '🧪 Elements & Immunities', es: '🧪 Elementos', ru: '🧪 Элементы и иммунитеты' },
  'monster.card.elements.edit': { default: 'Editar', 'pt-BR': 'Editar', en: 'Edit', es: 'Editar', ru: 'Редактировать' },
  'monster.card.elements.elements': { default: 'Elements', 'pt-BR': 'Elementos', en: 'Elements', es: 'Elementos', ru: 'Элементы' },
  'monster.card.elements.immunities': { default: 'Immunities', 'pt-BR': 'Imunidades', en: 'Immunities', es: 'Inmunidades', ru: 'Иммунитеты' },
  'monster.card.elements.yes': { default: 'Yes', 'pt-BR': 'Sim', en: 'Yes', es: 'Sí', ru: 'Да' },
  'monster.card.elements.no': { default: 'No', 'pt-BR': 'Não', en: 'No', es: 'No', ru: 'Нет' },
  'monster.card.elements.empty': { default: 'No elements or immunities configured', 'pt-BR': 'Nenhum elemento ou imunidade configurado', en: 'No elements or immunities configured', es: 'Sin elementos configurados', ru: 'Нет элементов или иммунитетов' },

  // Events
  'monster.card.events.title': { default: '📅 Monster Events', 'pt-BR': '📅 Eventos do Monstro', en: '📅 Monster Events', es: '📅 Eventos del Monstruo', ru: '📅 События монстра' },
  'monster.card.events.edit': { default: 'Editar', 'pt-BR': 'Editar', en: 'Edit', es: 'Editar', ru: 'Редактировать' },
  'monster.card.events.empty': { default: 'No Lua events linked to this monster.', 'pt-BR': 'Nenhum evento Lua vinculado a este monstro.', en: 'No Lua events linked to this monster.', es: 'No hay eventos Lua.', ru: 'Нет событий Lua.' },
  'monster.card.events.addBtn': { default: 'Adicionar Evento', 'pt-BR': 'Adicionar Evento', en: 'Add Event', es: 'Añadir Evento', ru: 'Добавить событие' },

  // Flags
  'monster.card.flags.title': { default: '⚙️ Flags', 'pt-BR': '⚙️ Flags', en: '⚙️ Flags', es: '⚙️ Flags', ru: '⚙️ Флаги' },
  'monster.card.flags.summonable': { default: 'Summonable', 'pt-BR': 'Invocável', en: 'Summonable', es: 'Invocable', ru: 'Призываемый' },
  'monster.card.flags.attackable': { default: 'Attackable', 'pt-BR': 'Atacável', en: 'Attackable', es: 'Atacable', ru: 'Атакуемый' },
  'monster.card.flags.hostile': { default: 'Hostile', 'pt-BR': 'Hostil', en: 'Hostile', es: 'Hostil', ru: 'Враждебный' },
  'monster.card.flags.convinceable': { default: 'Convinceable', 'pt-BR': 'Convencível', en: 'Convinceable', es: 'Convencible', ru: 'Убеждаемый' },
  'monster.card.flags.pushable': { default: 'Pushable', 'pt-BR': 'Empurrável', en: 'Pushable', es: 'Empujable', ru: 'Двигаемый' },
  'monster.card.flags.rewardBoss': { default: 'Reward Boss', 'pt-BR': 'Reward Boss', en: 'Reward Boss', es: 'Jefe con Recompensa', ru: 'Босс с наградой' },
  'monster.card.flags.illusionable': { default: 'Illusionable', 'pt-BR': 'Ilusionável', en: 'Illusionable', es: 'Ilusionable', ru: 'Иллюзорный' },
  'monster.card.flags.canPushItems': { default: 'Can Push Items', 'pt-BR': 'Empurra Itens', en: 'Can Push Items', es: 'Empuja Objetos', ru: 'Двигает предметы' },
  'monster.card.flags.canPushCreatures': { default: 'Can Push Creatures', 'pt-BR': 'Empurra Criaturas', en: 'Can Push Creatures', es: 'Empuja Criaturas', ru: 'Двигает существ' },
  'monster.card.flags.healthHidden': { default: 'Health Hidden', 'pt-BR': 'Vida Oculta', en: 'Health Hidden', es: 'Salud Oculta', ru: 'Скрытое здоровье' },
  'monster.card.flags.isBlockable': { default: 'Is Blockable', 'pt-BR': 'É Bloqueável', en: 'Is Blockable', es: 'Es Bloqueable', ru: 'Блокируемый' },
  'monster.card.flags.walkOnEnergy': { default: 'Walk on Energy', 'pt-BR': 'Anda na Energia', en: 'Walk on Energy', es: 'Camina sobre Energía', ru: 'Ходит по энергии' },
  'monster.card.flags.walkOnFire': { default: 'Walk on Fire', 'pt-BR': 'Anda no Fogo', en: 'Walk on Fire', es: 'Camina sobre Fuego', ru: 'Ходит по огню' },
  'monster.card.flags.walkOnPoison': { default: 'Walk on Poison', 'pt-BR': 'Anda no Veneno', en: 'Walk on Poison', es: 'Camina sobre Veneno', ru: 'Ходит по яду' },
  'monster.card.flags.staticAttackChance': { default: 'Static Attack Chance', 'pt-BR': 'Chance Ataque Estático', en: 'Static Attack Chance', es: 'Prob. Ataque Estático', ru: 'Статический шанс атаки' },
  'monster.card.flags.targetDistance': { default: 'Target Distance', 'pt-BR': 'Distância do Alvo', en: 'Target Distance', es: 'Distancia Objetivo', ru: 'Дистанция до цели' },
  'monster.card.flags.runHealth': { default: 'Run Health', 'pt-BR': 'Vida para Fugir', en: 'Run Health', es: 'Salud para Huir', ru: 'Здоровье для бегства' },

  // Loot
  'monster.card.loot.title': { default: '💰 Loot', 'pt-BR': '💰 Loot', en: '💰 Loot', es: '💰 Botín', ru: '💰 Добыча' },
  'monster.card.loot.edit': { default: 'Editar', 'pt-BR': 'Editar', en: 'Edit', es: 'Editar', ru: 'Редактировать' },
  'monster.card.loot.empty': { default: 'No loot items found for this monster', 'pt-BR': 'Nenhum item de loot encontrado', en: 'No loot items found', es: 'No hay botín', ru: 'Нет добычи для этого монстра' },
  'monster.card.loot.unknown': { default: 'Unknown Item', 'pt-BR': 'Item Desconhecido', en: 'Unknown Item', es: 'Objeto Desconocido', ru: 'Неизвестный предмет' },

  // Outfit
  'monster.card.outfit.title': { default: '👔 Outfit', 'pt-BR': '👔 Roupa (Outfit)', en: '👔 Outfit', es: '👔 Traje', ru: '👔 Наряд' },
  'monster.card.outfit.lookType': { default: 'Look Type', 'pt-BR': 'Tipo de Look', en: 'Look Type', es: 'Tipo de Apariencia', ru: 'Тип внешности' },
  'monster.card.outfit.lookTypeEx': { default: 'Look Type Ex', 'pt-BR': 'Tipo de Look Ex', en: 'Look Type Ex', es: 'Tipo de Apariencia Ex', ru: 'Доп. тип внешности' },
  'monster.card.outfit.lookTypeExTitle': { default: 'Not implemented in Rust struct yet', 'pt-BR': 'Ainda não implementado em Rust', en: 'Not implemented in Rust struct yet', es: 'No implementado en Rust aún', ru: 'Еще не реализовано на Rust' },
  'monster.card.outfit.mount': { default: 'Mount', 'pt-BR': 'Montaria', en: 'Mount', es: 'Montura', ru: 'Ездовое животное' },
  'monster.card.outfit.head': { default: 'Head', 'pt-BR': 'Cabeca', en: 'Head', es: 'Cabeza', ru: 'Голова' },
  'monster.card.outfit.body': { default: 'Body', 'pt-BR': 'Corpo', en: 'Body', es: 'Cuerpo', ru: 'Тело' },
  'monster.card.outfit.legs': { default: 'Legs', 'pt-BR': 'Pernas', en: 'Legs', es: 'Piernas', ru: 'Ноги' },
  'monster.card.outfit.feet': { default: 'Feet', 'pt-BR': 'Pés', en: 'Feet', es: 'Pies', ru: 'Ступни' },
  'monster.card.outfit.addons': { default: 'Addons', 'pt-BR': 'Addons', en: 'Addons', es: 'Complementos', ru: 'Дополнения' },
  'monster.card.outfit.corpse': { default: 'Corpse', 'pt-BR': 'Cadáver', en: 'Corpse', es: 'Cadáver', ru: 'Труп' },
  'monster.card.outfit.type': { default: 'Type', 'pt-BR': 'Tipo', en: 'Type', es: 'Tipo', ru: 'Тип' },
  'monster.card.outfit.rotate': { default: 'Rotate sprite', 'pt-BR': 'Rotacionar sprite', en: 'Rotate sprite', es: 'Rotar sprite', ru: 'Повернуть спрайт' },

  // Summons
  'monster.card.summons.title': { default: '📣 Summons', 'pt-BR': '📣 Summons', en: '📣 Summons', es: '📣 Invocaciones', ru: '📣 Призывы' },
  'monster.card.summons.edit': { default: 'Editar', 'pt-BR': 'Editar', en: 'Edit', es: 'Editar', ru: 'Редактировать' },
  'monster.card.summons.disabled': { default: 'Summons disabled.', 'pt-BR': 'Summons desativados.', en: 'Summons disabled.', es: 'Invocaciones desactivadas.', ru: 'Призывы отключены.' },
  'monster.card.summons.enableBtn': { default: 'Enable Summons', 'pt-BR': 'Ativar Summons', en: 'Enable Summons', es: 'Activar Invocaciones', ru: 'Включить призывы' },
  'monster.card.summons.max': { default: 'Max Summons', 'pt-BR': 'Máx. Summons', en: 'Max Summons', es: 'Máx. Invocaciones', ru: 'Макс. призывов' },
  'monster.card.summons.empty': { default: 'No summons configured.', 'pt-BR': 'Nenhum summon configurado.', en: 'No summons configured.', es: 'No hay invocaciones configuradas.', ru: 'Нет настроенных призывов.' },
  'monster.card.summons.count': { default: 'Count', 'pt-BR': 'Qtde', en: 'Count', es: 'Cant.', ru: 'Кол-во' },
  'monster.card.summons.chance': { default: 'Chance', 'pt-BR': 'Chance', en: 'Chance', es: 'Probabilidad', ru: 'Шанс' },
  'monster.card.summons.interval': { default: 'Interval', 'pt-BR': 'Intervalo', en: 'Interval', es: 'Intervalo', ru: 'Интервал' },

  // Voices
  'monster.card.voices.title': { default: '🗣️ Voices', 'pt-BR': '🗣️ Falas', en: '🗣️ Voices', es: '🗣️ Voces', ru: '🗣️ Голоса' },
  'monster.card.voices.edit': { default: 'Editar', 'pt-BR': 'Editar', en: 'Edit', es: 'Editar', ru: 'Редактировать' },
  'monster.card.voices.disabled': { default: 'Voices disabled.', 'pt-BR': 'Falas desativadas.', en: 'Voices disabled.', es: 'Voces desactivadas.', ru: 'Голоса отключены.' },
  'monster.card.voices.enableBtn': { default: 'Enable Voices', 'pt-BR': 'Ativar Falas', en: 'Enable Voices', es: 'Activar Voces', ru: 'Включить голоса' },
  'monster.card.voices.interval': { default: 'Interval', 'pt-BR': 'Intervalo', en: 'Interval', es: 'Intervalo', ru: 'Интервал' },
  'monster.card.voices.chance': { default: 'Chance', 'pt-BR': 'Chance', en: 'Chance', es: 'Probabilidad', ru: 'Шанс' },
  'monster.card.voices.empty': { default: 'No voices configured.', 'pt-BR': 'Nenhuma fala configurada.', en: 'No voices configured.', es: 'No hay voces configuradas.', ru: 'Нет настроенных голосов.' },
  'monster.card.voices.yell': { default: 'yell', 'pt-BR': 'grito', en: 'yell', es: 'grito', ru: 'крик' },
  'monster.card.voices.say': { default: 'say', 'pt-BR': 'fala', en: 'say', es: 'habla', ru: 'речь' },

  // Shared Modal Actions
  'monster.modal.shared.cancel': { default: 'Cancelar', 'pt-BR': 'Cancelar', en: 'Cancel', es: 'Cancelar', ru: 'Отмена' },
  'monster.modal.shared.save': { default: 'Salvar', 'pt-BR': 'Salvar', en: 'Save', es: 'Guardar', ru: 'Сохранить' },

  // ElementsModal
  'monster.modal.elements.title': { default: 'Editar Elementos & Imunidades', 'pt-BR': 'Editar Elementos & Imunidades', en: 'Edit Elements & Immunities', es: 'Editar Elementos e Inmunidades', ru: 'Редактировать элементы и иммунитеты' },
  'monster.modal.elements.elementsTab': { default: 'Elementos', 'pt-BR': 'Elementos', en: 'Elements', es: 'Elementos', ru: 'Элементы' },
  'monster.modal.elements.empty': { default: 'Nenhum registro.', 'pt-BR': 'Nenhum registro.', en: 'No records.', es: 'Sin registros.', ru: 'Нет записей.' },
  'monster.modal.elements.elementName': { default: 'Elemento', 'pt-BR': 'Elemento', en: 'Element', es: 'Elemento', ru: 'Элемент' },
  'monster.modal.elements.type': { default: 'Tipo', 'pt-BR': 'Tipo', en: 'Type', es: 'Tipo', ru: 'Тип' },
  'monster.modal.elements.percent': { default: '%', 'pt-BR': '%', en: '%', es: '%', ru: '%' },
  'monster.modal.elements.addBtn': { default: 'Adicionar Elemento', 'pt-BR': 'Adicionar Elemento', en: 'Add Element', es: 'Agregar Elemento', ru: 'Добавить элемент' },
  'monster.modal.elements.immunitiesTab': { default: 'Imunidades', 'pt-BR': 'Imunidades', en: 'Immunities', es: 'Inmunidades', ru: 'Иммунитеты' },
  'monster.modal.elements.immunityName': { default: 'Imunidade', 'pt-BR': 'Imunidade', en: 'Immunity', es: 'Inmunidad', ru: 'Иммунитет' },
  'monster.modal.elements.immuneCondition': { default: 'Immune', 'pt-BR': 'Imune', en: 'Immune', es: 'Inmune', ru: 'Иммунитет' },
  'monster.modal.elements.addImmunityBtn': { default: 'Adicionar Imunidade', 'pt-BR': 'Adicionar Imunidade', en: 'Add Immunity', es: 'Agregar Inmunidad', ru: 'Добавить иммунитет' },

  // EventsModal
  'monster.modal.events.title': { default: 'Editar Eventos', 'pt-BR': 'Editar Eventos', en: 'Edit Events', es: 'Editar Eventos', ru: 'Редактировать события' },
  'monster.modal.events.tabTitle': { default: 'Eventos Registrados', 'pt-BR': 'Eventos Registrados', en: 'Registered Events', es: 'Eventos Registrados', ru: 'Зарегистрированные события' },
  'monster.modal.events.empty': { default: 'Nenhum evento vinculado.', 'pt-BR': 'Nenhum evento vinculado.', en: 'No event linked.', es: 'Ningún evento vinculado.', ru: 'Нет связанных событий.' },
  'monster.modal.events.eventNamePrefix': { default: 'Evento', 'pt-BR': 'Evento', en: 'Event', es: 'Evento', ru: 'Событие' },
  'monster.modal.events.nameLabel': { default: 'Nome do Evento', 'pt-BR': 'Nome do Evento', en: 'Event Name', es: 'Nombre del Evento', ru: 'Название события' },
  'monster.modal.events.namePlaceholder': { default: 'Ex.: RottenBloodBakragoreDeath', 'pt-BR': 'Ex.: RottenBloodBakragoreDeath', en: 'Ex.: RottenBloodBakragoreDeath', es: 'Ej.: RottenBloodBakragoreDeath', ru: 'Напр.: RottenBloodBakragoreDeath' },
  'monster.modal.events.addBtn': { default: 'Adicionar Evento', 'pt-BR': 'Adicionar Evento', en: 'Add Event', es: 'Agregar Evento', ru: 'Добавить событие' },

  // LootModal
  'monster.modal.loot.title': { default: 'Editar Loot', 'pt-BR': 'Editar Loot', en: 'Edit Loot', es: 'Editar Botín', ru: 'Редактировать добычу' },
  'monster.modal.loot.tabTitle': { default: 'Itens de Loot', 'pt-BR': 'Itens de Loot', en: 'Loot Items', es: 'Objetos de Botín', ru: 'Предметы добычи' },
  'monster.modal.loot.empty': { default: 'Nenhum item configurado.', 'pt-BR': 'Nenhum item configurado.', en: 'No items configured.', es: 'Ningún objeto configurado.', ru: 'Нет настроенных предметов.' },
  'monster.modal.loot.itemPrefix': { default: 'Item', 'pt-BR': 'Item', en: 'Item', es: 'Objeto', ru: 'Предмет' },
  'monster.modal.loot.nameLabel': { default: 'Nome', 'pt-BR': 'Nome', en: 'Name', es: 'Nombre', ru: 'Название' },
  'monster.modal.loot.namePlaceholder': { default: 'Nome do item', 'pt-BR': 'Nome do item', en: 'Item name', es: 'Nombre del objeto', ru: 'Название предмета' },
  'monster.modal.loot.idLabel': { default: 'ID', 'pt-BR': 'ID', en: 'ID', es: 'ID', ru: 'ID' },
  'monster.modal.loot.idPlaceholder': { default: 'ID (opcional)', 'pt-BR': 'ID (opcional)', en: 'ID (optional)', es: 'ID (opcional)', ru: 'ID (необязательно)' },
  'monster.modal.loot.chanceLabel': { default: 'Chance (0-100000)', 'pt-BR': 'Chance (0-100000)', en: 'Chance (0-100000)', es: 'Probabilidad (0-100000)', ru: 'Шанс (0-100000)' },
  'monster.modal.loot.minLabel': { default: 'Qtd. Minima', 'pt-BR': 'Qtd. Mínima', en: 'Min Count', es: 'Cant. Mínima', ru: 'Мин. кол-во' },
  'monster.modal.loot.maxLabel': { default: 'Qtd. Maxima', 'pt-BR': 'Qtd. Máxima', en: 'Max Count', es: 'Cant. Máxima', ru: 'Макс. кол-во' },
  'monster.modal.loot.addBtn': { default: 'Adicionar Item', 'pt-BR': 'Adicionar Item', en: 'Add Item', es: 'Agregar Objeto', ru: 'Добавить предмет' },

  // SpellsModal
  'monster.modal.spells.title': { default: 'Editar Ataques & Defesas', 'pt-BR': 'Editar Ataques & Defesas', en: 'Edit Attacks & Defenses', es: 'Editar Ataques y Defensas', ru: 'Редактировать атаки и защиты' },
  'monster.modal.spells.attacksTab': { default: 'Ataques', 'pt-BR': 'Ataques', en: 'Attacks', es: 'Ataques', ru: 'Атаки' },
  'monster.modal.spells.attackPrefix': { default: 'Ataque', 'pt-BR': 'Ataque', en: 'Attack', es: 'Ataque', ru: 'Атака' },
  'monster.modal.spells.nameLabel': { default: 'Nome', 'pt-BR': 'Nome', en: 'Name', es: 'Nombre', ru: 'Название' },
  'monster.modal.spells.intervalLabel': { default: 'Intervalo (ms)', 'pt-BR': 'Intervalo (ms)', en: 'Interval (ms)', es: 'Intervalo (ms)', ru: 'Интервал (мс)' },
  'monster.modal.spells.chanceLabel': { default: 'Chance (%)', 'pt-BR': 'Chance (%)', en: 'Chance (%)', es: 'Probabilidad (%)', ru: 'Шанс (%)' },
  'monster.modal.spells.minDamageLabel': { default: 'Dano Min', 'pt-BR': 'Dano Mín', en: 'Min Damage', es: 'Daño Mínimo', ru: 'Мин. урон' },
  'monster.modal.spells.maxDamageLabel': { default: 'Dano Max', 'pt-BR': 'Dano Máx', en: 'Max Damage', es: 'Daño Máximo', ru: 'Макс. урон' },
  'monster.modal.spells.typeLabel': { default: 'Tipo', 'pt-BR': 'Tipo', en: 'Type', es: 'Tipo', ru: 'Тип' },
  'monster.modal.spells.needTargetLabel': { default: 'Precisa Alvo', 'pt-BR': 'Precisa Alvo', en: 'Needs Target', es: 'Necesita Objetivo', ru: 'Нужна цель' },
  'monster.modal.spells.effectLabel': { default: 'Efeito', 'pt-BR': 'Efeito', en: 'Effect', es: 'Efecto', ru: 'Эффект' },
  'monster.modal.spells.rangeLabel': { default: 'Alcance', 'pt-BR': 'Alcance', en: 'Range', es: 'Alcance', ru: 'Дальность' },
  'monster.modal.spells.radiusLabel': { default: 'Raio', 'pt-BR': 'Raio', en: 'Radius', es: 'Radio', ru: 'Радиус' },
  'monster.modal.spells.lengthLabel': { default: 'Comprimento', 'pt-BR': 'Comprimento', en: 'Length', es: 'Longitud', ru: 'Длина' },
  'monster.modal.spells.spreadLabel': { default: 'Abertura', 'pt-BR': 'Abertura', en: 'Spread', es: 'Apertura', ru: 'Разброс' },
  'monster.modal.spells.shootEffectLabel': { default: 'Efeito Projetil', 'pt-BR': 'Efeito Projétil', en: 'Shoot Effect', es: 'Efecto del Proyectil', ru: 'Эффект снаряда' },
  'monster.modal.spells.conditionTitle': { default: 'Condição', 'pt-BR': 'Condição', en: 'Condition', es: 'Condición', ru: 'Состояние' },
  'monster.modal.spells.propKeyPlaceholder': { default: 'Chave', 'pt-BR': 'Chave', en: 'Key', es: 'Clave', ru: 'Ключ' },
  'monster.modal.spells.propValuePlaceholder': { default: 'Valor', 'pt-BR': 'Valor', en: 'Value', es: 'Valor', ru: 'Значение' },
  'monster.modal.spells.addPropBtn': { default: 'Adicionar propriedade', 'pt-BR': 'Adicionar propriedade', en: 'Add Property', es: 'Agregar propiedad', ru: 'Добавить свойство' },
  'monster.modal.spells.addAttackBtn': { default: 'Adicionar Ataque', 'pt-BR': 'Adicionar Ataque', en: 'Add Attack', es: 'Agregar Ataque', ru: 'Добавить атаку' },
  'monster.modal.spells.defensesTab': { default: 'Defesas', 'pt-BR': 'Defesas', en: 'Defenses', es: 'Defensas', ru: 'Защиты' },
  'monster.modal.spells.defensePrefix': { default: 'Defesa', 'pt-BR': 'Defesa', en: 'Defense', es: 'Defensa', ru: 'Защита' },
  'monster.modal.spells.addDefenseBtn': { default: 'Adicionar Defesa', 'pt-BR': 'Adicionar Defesa', en: 'Add Defense', es: 'Agregar Defensa', ru: 'Добавить защиту' },

  // SummonsModal
  'monster.modal.summons.title': { default: 'Editar Summons', 'pt-BR': 'Editar Summons', en: 'Edit Summons', es: 'Editar Invocaciones', ru: 'Редактировать призывы' },
  'monster.modal.summons.configTab': { default: 'Configurações', 'pt-BR': 'Configurações', en: 'Settings', es: 'Ajustes', ru: 'Настройки' },
  'monster.modal.summons.enableLabel': { default: 'Ativar Summons', 'pt-BR': 'Ativar Summons', en: 'Enable Summons', es: 'Activar Invocaciones', ru: 'Включить призывы' },
  'monster.modal.summons.maxLabel': { default: 'Max Summons', 'pt-BR': 'Máx. Summons', en: 'Max Summons', es: 'Máx. Invocaciones', ru: 'Макс. призывов' },
  'monster.modal.summons.creaturesTab': { default: 'Criaturas', 'pt-BR': 'Criaturas', en: 'Creatures', es: 'Criaturas', ru: 'Существа' },
  'monster.modal.summons.disabledEmpty': { default: 'Summons desativados.', 'pt-BR': 'Summons desativados.', en: 'Summons disabled.', es: 'Invocaciones desactivadas.', ru: 'Призывы отключены.' },
  'monster.modal.summons.empty': { default: 'Nenhum summon configurado.', 'pt-BR': 'Nenhum summon configurado.', en: 'No summons configured.', es: 'Ninguna invocación configurada.', ru: 'Нет настроенных призывов.' },
  'monster.modal.summons.summonPrefix': { default: 'Summon', 'pt-BR': 'Summon', en: 'Summon', es: 'Invocación', ru: 'Призыв' },
  'monster.modal.summons.nameLabel': { default: 'Name', 'pt-BR': 'Nome', en: 'Name', es: 'Nombre', ru: 'Имя' },
  'monster.modal.summons.chanceLabel': { default: 'Chance (%)', 'pt-BR': 'Chance (%)', en: 'Chance (%)', es: 'Probabilidad (%)', ru: 'Шанс (%)' },
  'monster.modal.summons.intervalLabel': { default: 'Interval (ms)', 'pt-BR': 'Intervalo (ms)', en: 'Interval (ms)', es: 'Intervalo (ms)', ru: 'Интервал (мс)' },
  'monster.modal.summons.countLabel': { default: 'Count', 'pt-BR': 'Qtde', en: 'Count', es: 'Cantidad', ru: 'Кол-во' },
  'monster.modal.summons.addBtn': { default: 'Adicionar Summon', 'pt-BR': 'Adicionar Summon', en: 'Add Summon', es: 'Agregar Invocación', ru: 'Добавить призыв' },

  // VoicesModal
  'monster.modal.voices.title': { default: 'Editar Falas', 'pt-BR': 'Editar Falas', en: 'Edit Voices', es: 'Editar Voces', ru: 'Редактировать голоса' },
  'monster.modal.voices.configTab': { default: 'Configurações', 'pt-BR': 'Configurações', en: 'Settings', es: 'Ajustes', ru: 'Настройки' },
  'monster.modal.voices.enableLabel': { default: 'Ativar Falas', 'pt-BR': 'Ativar Falas', en: 'Enable Voices', es: 'Activar Voces', ru: 'Включить голоса' },
  'monster.modal.voices.intervalLabel': { default: 'Intervalo (ms)', 'pt-BR': 'Intervalo (ms)', en: 'Interval (ms)', es: 'Intervalo (ms)', ru: 'Интервал (мс)' },
  'monster.modal.voices.chanceLabel': { default: 'Chance (%)', 'pt-BR': 'Chance (%)', en: 'Chance (%)', es: 'Probabilidad (%)', ru: 'Шанс (%)' },
  'monster.modal.voices.voicesTab': { default: 'Falas', 'pt-BR': 'Falas', en: 'Voices', es: 'Voces', ru: 'Голоса' },
  'monster.modal.voices.disabledEmpty': { default: 'Falas desativadas.', 'pt-BR': 'Falas desativadas.', en: 'Voices disabled.', es: 'Voces desactivadas.', ru: 'Голоса отключены.' },
  'monster.modal.voices.empty': { default: 'Nenhuma fala cadastrada.', 'pt-BR': 'Nenhuma fala cadastrada.', en: 'No voices registered.', es: 'No hay voces registradas.', ru: 'Нет зарегистрированных голосов.' },
  'monster.modal.voices.voicePrefix': { default: 'Fala', 'pt-BR': 'Fala', en: 'Voice', es: 'Voz', ru: 'Голос' },
  'monster.modal.voices.textLabel': { default: 'Texto', 'pt-BR': 'Texto', en: 'Text', es: 'Texto', ru: 'Текст' },
  'monster.modal.voices.yellLabel': { default: 'Gritar', 'pt-BR': 'Gritar', en: 'Yell', es: 'Gritar', ru: 'Кричать' },
  'monster.modal.voices.addBtn': { default: 'Adicionar fala', 'pt-BR': 'Adicionar fala', en: 'Add voice', es: 'Agregar voz', ru: 'Добавить голос' },

  // Spells
  'monster.card.spells.title': { default: '⚔️ Attacks & Defenses', 'pt-BR': '⚔️ Ataques e Defesas', en: '⚔️ Attacks & Defenses', es: '⚔️ Ataques y Defensas', ru: '⚔️ Атаки и защиты' },
  'monster.card.spells.edit': { default: 'Editar', 'pt-BR': 'Editar', en: 'Edit', es: 'Editar', ru: 'Редактировать' },
  'monster.card.spells.empty': { default: 'No attacks or defenses configured', 'pt-BR': 'Nenhum ataque ou defesa configurado', en: 'No attacks or defenses', es: 'No hay ataques ni defensas', ru: 'Нет атак и защит' },
  'monster.card.spells.offensive': { default: 'Offensive Spells', 'pt-BR': 'Magias Ofensivas', en: 'Offensive Spells', es: 'Hechizos Ofensivos', ru: 'Атакующие заклинания' },
  'monster.card.spells.defensive': { default: 'Defensive Spells', 'pt-BR': 'Magias Defensivas', en: 'Defensive Spells', es: 'Hechizos Defensivos', ru: 'Защитные заклинания' },
  'monster.card.spells.unnamed': { default: '(Unnamed)', 'pt-BR': '(Sem Nome)', en: '(Unnamed)', es: '(Sin Nombre)', ru: '(Без имени)' },
  'monster.card.spells.attack': { default: 'Attack', 'pt-BR': 'Ataque', en: 'Attack', es: 'Ataque', ru: 'Атака' },
  'monster.card.spells.defense': { default: 'Defense', 'pt-BR': 'Defesa', en: 'Defense', es: 'Defensa', ru: 'Защита' },
  'monster.card.spells.interval': { default: 'Interval', 'pt-BR': 'Intervalo', en: 'Interval', es: 'Intervalo', ru: 'Интервал' },
  'monster.card.spells.chance': { default: 'Chance', 'pt-BR': 'Chance', en: 'Chance', es: 'Probabilidad', ru: 'Шанс' },
  'monster.card.spells.damage': { default: 'Damage', 'pt-BR': 'Dano', en: 'Damage', es: 'Daño', ru: 'Урон' },
  'monster.card.spells.to': { default: 'to', 'pt-BR': 'a', en: 'to', es: 'a', ru: 'до' },
  'monster.card.spells.ms': { default: 'ms', 'pt-BR': 'ms', en: 'ms', es: 'ms', ru: 'мс' },

  // Sound Modal
  'modal.sound.add': { default: 'Add Sound Effect', 'pt-BR': 'Adicionar Efeito de Som', en: 'Add Sound Effect', es: 'Agregar efecto de sonido', ru: 'Добавить звуковой эффект' },
  'modal.sound.mode.simple': { default: 'Simple Sound', 'pt-BR': 'Som Simples', en: 'Simple Sound', es: 'Sonido simple', ru: 'Простой звук' },
  'modal.sound.mode.random': { default: 'Randomized Sound', 'pt-BR': 'Som Aleatório', en: 'Randomized Sound', es: 'Sonido aleatorio', ru: 'Случайный звук' },
  'modal.sound.type': { default: 'Sound Type', 'pt-BR': 'Tipo de Som', en: 'Sound Type', es: 'Tipo de sonido', ru: 'Тип звука' },
  'modal.sound.id': { default: 'Sound ID', 'pt-BR': 'ID do Som', en: 'Sound ID', es: 'ID del sonido', ru: 'ID звука' },
  'modal.sound.randomIds': { default: 'List of Sound IDs', 'pt-BR': 'Lista de IDs de Som', en: 'List of Sound IDs', es: 'Lista de IDs de sonido', ru: 'Список ID звуков' },
  'modal.sound.randomIdsPl': { default: 'e.g. 100, 101, 105', 'pt-BR': 'ex: 100, 101, 105', en: 'e.g. 100, 101, 105', es: 'ej: 100, 101, 105', ru: 'например, 100, 101, 105' },
  'modal.sound.pitchMin': { default: 'Pitch Min', 'pt-BR': 'Pitch Mínimo', en: 'Pitch Min', es: 'Tono mín.', ru: 'Мин. высота' },
  'modal.sound.pitchMax': { default: 'Pitch Max', 'pt-BR': 'Pitch Máximo', en: 'Pitch Max', es: 'Tono máx.', ru: 'Макс. высота' },
  'modal.sound.volumeMin': { default: 'Volume Min', 'pt-BR': 'Volume Mínimo', en: 'Volume Min', es: 'Volumen mín.', ru: 'Мин. громкость' },
  'modal.sound.volumeMax': { default: 'Volume Max', 'pt-BR': 'Volume Máximo', en: 'Volume Max', es: 'Volumen máx.', ru: 'Макс. громкость' },
  'modal.sound.loading': { default: 'Loading sounds...', 'pt-BR': 'Carregando sons...', en: 'Loading sounds...', es: 'Cargando sonidos...', ru: 'Загрузка звуков...' },
  'modal.sound.search': { default: 'Search sounds...', 'pt-BR': 'Buscar sons...', en: 'Search sounds...', es: 'Buscar sonidos...', ru: 'Поиск звуков...' },
  'modal.sound.search.play': { default: 'Play Selected', 'pt-BR': 'Tocar Selecionado', en: 'Play Selected', es: 'Reproducir selecc.', ru: 'Играть выбранное' },
  'modal.sound.search.pause': { default: 'Stop Playback', 'pt-BR': 'Parar Reprodução', en: 'Stop Playback', es: 'Detener reprod.', ru: 'Остановить' },
  'modal.sound.search.clr': { default: 'Clear Selection', 'pt-BR': 'Limpar Seleção', en: 'Clear Selection', es: 'Limpiar selección', ru: 'Очистить выбор' },

  // Audio Import
  'modal.sound.import.title': { default: 'Import New OGG File', 'pt-BR': 'Importar Novo Arquivo OGG', en: 'Import New OGG File', es: 'Importar nuevo archivo OGG', ru: 'Импорт нового OGG файла' },
  'modal.sound.import.btn': { default: 'Select File', 'pt-BR': 'Selecionar Arquivo', en: 'Select File', es: 'Seleccionar archivo', ru: 'Выбрать файл' },
  'modal.sound.import.noFile': { default: 'No file selected', 'pt-BR': 'Nenhum arquivo selecionado', en: 'No file selected', es: 'Ningún archivo seleccionado', ru: 'Файл не выбран' },
  'modal.sound.import.strm': { default: 'Is Stream?', 'pt-BR': 'É Stream?', en: 'Is Stream?', es: '¿Es flujo?', ru: 'Это поток?' },
  'modal.sound.import.id': { default: 'Target ID (optional)', 'pt-BR': 'ID de Destino (opcional)', en: 'Target ID (optional)', es: 'ID de destino (opcional)', ru: 'ID цели (опц.)' },
  'modal.sound.import.act': { default: 'Import & Add', 'pt-BR': 'Importar e Adicionar', en: 'Import & Add', es: 'Importar y añadir', ru: 'Импорт и добавление' },
  'modal.sound.import.actLoad': { default: 'Uploading...', 'pt-BR': 'Enviando...', en: 'Uploading...', es: 'Subiendo...', ru: 'Загрузка...' },

  // Audio ARIA & Buttons
  'modal.audio.aria.remove': { default: 'Remove sound {{id}}', 'pt-BR': 'Remover som {{id}}', en: 'Remove sound {{id}}', es: 'Eliminar sonido {{id}}', ru: 'Удалить звук {{id}}' },
  'modal.audio.aria.list': { default: 'Available sounds list', 'pt-BR': 'Lista de sons disponíveis', en: 'Available sounds list', es: 'Lista de sonidos disponibles', ru: 'Список доступных звуков' },
  'modal.audio.aria.play': { default: 'Preview sound {{id}}', 'pt-BR': 'Pré-ouvir som {{id}}', en: 'Preview sound {{id}}', es: 'Escuchar sonido {{id}}', ru: 'Прослушать звук {{id}}' },
  'modal.audio.btn.add': { default: 'Add to Random List', 'pt-BR': 'Adicionar à Lista Aleatória', en: 'Add to Random List', es: 'Añadir a lista aleatoria', ru: 'Добавить в список' },
  'modal.audio.btn.select': { default: 'Select this Sound', 'pt-BR': 'Selecionar este Som', en: 'Select this Sound', es: 'Seleccionar este sonido', ru: 'Выбрать этот звук' },
  'modal.btn.save': { default: 'Save Changes', 'pt-BR': 'Salvar Alterações', en: 'Save Changes', es: 'Guardar cambios', ru: 'Сохранить изменения' },
  'modal.btn.cancel': { default: 'Cancel', 'pt-BR': 'Cancelar', en: 'Cancel', es: 'Cancelar', ru: 'Отмена' },

  // Audio Errors
  'modal.audio.error.format': { default: 'Only .ogg files are supported.', 'pt-BR': 'Apenas arquivos .ogg são suportados.', en: 'Only .ogg files are supported.', es: 'Solo archivos .ogg permitidos.', ru: 'Поддерживаются только .ogg файлы.' },
  'modal.audio.error.select': { default: 'Please select an OGG file first.', 'pt-BR': 'Por favor, selecione um arquivo OGG primeiro.', en: 'Please select an OGG file first.', es: 'Selecciona un archivo OGG primero.', ru: 'Сначала выберите OGG файл.' },
  'modal.audio.error.import': { default: 'Error importing sound: {{err}}', 'pt-BR': 'Erro ao importar som: {{err}}', en: 'Error importing sound: {{err}}', es: 'Error al importar: {{err}}', ru: 'Ошибка импорта звука: {{err}}' },
  'modal.audio.error.add': { default: 'Failed to create sound effect. Check console.', 'pt-BR': 'Falha ao criar o efeito de som. Verifique o console.', en: 'Failed to create sound effect. Check console.', es: 'Error al crear el efecto. Revisa la consola.', ru: 'Не удалось создать эффект. Проверьте консоль.' },

  // Modal Common Buttons & Aria
  'modal.aria.close': { default: 'Close', 'pt-BR': 'Fechar', en: 'Close', es: 'Cerrar', ru: 'Закрыть' },
  'modal.btn.close': { default: 'Close', 'pt-BR': 'Fechar', en: 'Close', es: 'Cerrar', ru: 'Закрыть' },
  'modal.btn.confirm': { default: 'Confirm', 'pt-BR': 'Confirmar', en: 'Confirm', es: 'Confirmar', ru: 'Подтвердить' },
  'modal.btn.createClose': { default: 'Create & Close', 'pt-BR': 'Criar e Fechar', en: 'Create & Close', es: 'Crear y cerrar', ru: 'Создать и закрыть' },
  'modal.btn.remove': { default: 'Remove', 'pt-BR': 'Remover', en: 'Remove', es: 'Eliminar', ru: 'Удалить' },

  // Static Data Modal - Outfit Color Labels
  'modal.static.lbl.head': { default: 'Head', 'pt-BR': 'Cabeça', en: 'Head', es: 'Cabeza', ru: 'Голова' },
  'modal.static.lbl.body': { default: 'Body', 'pt-BR': 'Corpo', en: 'Body', es: 'Cuerpo', ru: 'Тело' },
  'modal.static.lbl.legs': { default: 'Legs', 'pt-BR': 'Pernas', en: 'Legs', es: 'Piernas', ru: 'Ноги' },
  'modal.static.lbl.feet': { default: 'Feet', 'pt-BR': 'Pés', en: 'Feet', es: 'Pies', ru: 'Ноги (ступни)' },

  // Category View
  'categoryView.back': { default: 'Back', 'pt-BR': 'Voltar', en: 'Back', es: 'Volver', ru: 'Назад' },
  'categoryView.loading': { default: 'Loading...', 'pt-BR': 'Carregando...', en: 'Loading...', es: 'Cargando...', ru: 'Загрузка...' },
  'categoryView.noAssets': { default: 'No assets found', 'pt-BR': 'Nenhum asset encontrado', en: 'No assets found', es: 'No se encontraron recursos', ru: 'Ресурсы не найдены' },
  'categoryView.noAssetsCriteria': { default: 'Try adjusting your search criteria.', 'pt-BR': 'Tente ajustar os critérios de busca.', en: 'Try adjusting your search criteria.', es: 'Intenta ajustar tus criterios de búsqueda.', ru: 'Попробуйте изменить критерии поиска.' },
  'categoryView.of': { default: 'of', 'pt-BR': 'de', en: 'of', es: 'de', ru: 'из' },
  'categoryView.pagination.of': { default: 'of', 'pt-BR': 'de', en: 'of', es: 'de', ru: 'из' },
  'categoryView.flag.title': { default: 'Has active flags', 'pt-BR': 'Possui flags ativas', en: 'Has active flags', es: 'Tiene flags activas', ru: 'Есть активные флаги' },
  'categoryView.aria.selectAsset': { default: 'Select asset {{id}}', 'pt-BR': 'Selecionar asset {{id}}', en: 'Select asset {{id}}', es: 'Seleccionar recurso {{id}}', ru: 'Выбрать ресурс {{id}}' },

  // Search
  'search.clear': { default: 'Clear search', 'pt-BR': 'Limpar busca', en: 'Clear search', es: 'Limpiar búsqueda', ru: 'Очистить поиск' },

  // NPC Cards - Flags
  'npc.card.flags.title': { default: '🚩 Flags', 'pt-BR': '🚩 Flags', en: '🚩 Flags', es: '🚩 Flags', ru: '🚩 Флаги' },
  'npc.card.flags.floorChange': { default: 'Floor Change', 'pt-BR': 'Floor Change', en: 'Floor Change', es: 'Cambio de piso', ru: 'Смена этажа' },

  // NPC Cards - Outfit
  'npc.card.outfit.title': { default: '👗 Outfit', 'pt-BR': '👗 Aparência', en: '👗 Outfit', es: '👗 Apariencia', ru: '👗 Облик' },
  'npc.card.outfit.lookType': { default: 'Look Type', 'pt-BR': 'Tipo de Look', en: 'Look Type', es: 'Tipo de apariencia', ru: 'Тип облика' },
  'npc.card.outfit.lookMount': { default: 'Mount', 'pt-BR': 'Montaria', en: 'Mount', es: 'Montura', ru: 'Маунт' },
  'npc.card.outfit.lookAddons': { default: 'Addons', 'pt-BR': 'Addons', en: 'Addons', es: 'Addons', ru: 'Аддоны' },

  // QM Translation Editor
  'category.qmEditor': { default: '🌐 QM Translation Editor', 'pt-BR': '🌐 Editor de Traduções QM', en: '🌐 QM Translation Editor', es: '🌐 Editor de Traducción QM', ru: '🌐 Редактор переводов QM' },
  'qm.title': { default: 'QM Translation Editor', 'pt-BR': 'Editor de Traduções QM', en: 'QM Translation Editor', es: 'Editor de traducción QM', ru: 'Редактор переводов QM' },
  'qm.btn.back': { default: 'Back', 'pt-BR': 'Voltar', en: 'Back', es: 'Volver', ru: 'Назад' },
  'qm.btn.open': { default: 'Open QM', 'pt-BR': 'Abrir QM', en: 'Open QM', es: 'Abrir QM', ru: 'Открыть QM' },
  'qm.btn.save': { default: 'Save', 'pt-BR': 'Salvar', en: 'Save', es: 'Guardar', ru: 'Сохранить' },
  'qm.btn.saveAs': { default: 'Save As', 'pt-BR': 'Salvar Como', en: 'Save As', es: 'Guardar como', ru: 'Сохранить как' },
  'qm.btn.exportCsv': { default: 'Export CSV', 'pt-BR': 'Exportar CSV', en: 'Export CSV', es: 'Exportar CSV', ru: 'Экспорт CSV' },
  'qm.btn.importCsv': { default: 'Import CSV', 'pt-BR': 'Importar CSV', en: 'Import CSV', es: 'Importar CSV', ru: 'Импорт CSV' },
  'qm.col.context': { default: 'Context', 'pt-BR': 'Contexto', en: 'Context', es: 'Contexto', ru: 'Контекст' },
  'qm.col.source': { default: 'Source Text', 'pt-BR': 'Texto Original', en: 'Source Text', es: 'Texto fuente', ru: 'Исходный текст' },
  'qm.col.translation': { default: 'Translation', 'pt-BR': 'Tradução', en: 'Translation', es: 'Traducción', ru: 'Перевод' },
  'qm.col.hash': { default: 'Hash', 'pt-BR': 'Hash', en: 'Hash', es: 'Hash', ru: 'Хеш' },
  'qm.info.entries': { default: 'entries', 'pt-BR': 'entradas', en: 'entries', es: 'entradas', ru: 'записей' },
  'qm.info.unsaved': { default: 'unsaved', 'pt-BR': 'não salvo', en: 'unsaved', es: 'sin guardar', ru: 'не сохранено' },
  'qm.search.placeholder': { default: 'Search translations...', 'pt-BR': 'Buscar traduções...', en: 'Search translations...', es: 'Buscar traducciones...', ru: 'Поиск переводов...' },
  'qm.hint.dblclick': { default: 'Double-click to edit', 'pt-BR': 'Duplo clique para editar', en: 'Double-click to edit', es: 'Doble clic para editar', ru: 'Двойной клик для редактирования' },
  'qm.empty.title': { default: 'No QM file loaded', 'pt-BR': 'Nenhum arquivo QM carregado', en: 'No QM file loaded', es: 'No hay archivo QM cargado', ru: 'Файл QM не загружен' },
  'qm.empty.desc': { default: 'Open a .qm file to browse and edit translations.', 'pt-BR': 'Abra um arquivo .qm para ver e editar traduções.', en: 'Open a .qm file to browse and edit translations.', es: 'Abre un archivo .qm para ver y editar traducciones.', ru: 'Откройте файл .qm для просмотра и редактирования переводов.' },
  'qm.empty.translation': { default: '(no translation)', 'pt-BR': '(sem tradução)', en: '(no translation)', es: '(sin traducción)', ru: '(нет перевода)' },
  'qm.warn.noSourceText': { default: 'Source text not stored in this QM file', 'pt-BR': 'Texto original não armazenado neste QM', en: 'Source text not stored in this QM file', es: 'Texto fuente no almacenado en este QM', ru: 'Исходный текст не хранится в этом QM' },
  'qm.status.loading': { default: 'Loading QM file...', 'pt-BR': 'Carregando QM...', en: 'Loading QM file...', es: 'Cargando archivo QM...', ru: 'Загрузка QM...' },
  'qm.status.loaded': { default: 'Loaded {{count}} entries', 'pt-BR': '{{count}} entradas carregadas', en: 'Loaded {{count}} entries', es: '{{count}} entradas cargadas', ru: 'Загружено {{count}} записей' },
  'qm.status.saving': { default: 'Saving...', 'pt-BR': 'Salvando...', en: 'Saving...', es: 'Guardando...', ru: 'Сохранение...' },
  'qm.status.saved': { default: 'Saved to {{path}}', 'pt-BR': 'Salvo em {{path}}', en: 'Saved to {{path}}', es: 'Guardado en {{path}}', ru: 'Сохранено в {{path}}' },
  'qm.status.error': { default: 'Error: {{err}}', 'pt-BR': 'Erro: {{err}}', en: 'Error: {{err}}', es: 'Error: {{err}}', ru: 'Ошибка: {{err}}' },
  'qm.status.noFile': { default: 'No file loaded', 'pt-BR': 'Nenhum arquivo carregado', en: 'No file loaded', es: 'No hay archivo cargado', ru: 'Файл не загружен' },
  'qm.status.exported': { default: 'Exported {{count}} entries to CSV', 'pt-BR': '{{count}} entradas exportadas', en: 'Exported {{count}} entries to CSV', es: '{{count}} entradas exportadas a CSV', ru: 'Экспортировано {{count}} записей' },
  'qm.status.imported': { default: 'Imported {{count}} translations', 'pt-BR': '{{count}} traduções importadas', en: 'Imported {{count}} translations', es: '{{count}} traducciones importadas', ru: 'Импортировано {{count}} переводов' },
  'qm.dialog.openTitle': { default: 'Open QM Translation File', 'pt-BR': 'Abrir Arquivo de Tradução QM', en: 'Open QM Translation File', es: 'Abrir archivo de traducción QM', ru: 'Открыть файл перевода QM' },
  'qm.dialog.saveTitle': { default: 'Save QM Translation File', 'pt-BR': 'Salvar Arquivo de Tradução QM', en: 'Save QM Translation File', es: 'Guardar archivo de traducción QM', ru: 'Сохранить файл перевода QM' },
  'qm.dialog.exportTitle': { default: 'Export Translations as CSV', 'pt-BR': 'Exportar Traduções como CSV', en: 'Export Translations as CSV', es: 'Exportar traducciones como CSV', ru: 'Экспорт переводов в CSV' },
  'qm.dialog.importTitle': { default: 'Import Translations from CSV', 'pt-BR': 'Importar Traduções de CSV', en: 'Import Translations from CSV', es: 'Importar traducciones de CSV', ru: 'Импорт переводов из CSV' },

  // Settings - Performance
  'settings.perf.appearanceCacheMax': { default: 'Appearance Cache Max', 'pt-BR': 'Cache Máx. de Aparências', en: 'Appearance Cache Max', es: 'Caché máx. de apariencias', ru: 'Макс. кеш внешностей' },
  'settings.perf.chunkSize': { default: 'Chunk Size', 'pt-BR': 'Tamanho do Chunk', en: 'Chunk Size', es: 'Tamaño de chunk', ru: 'Размер чанка' },
  'settings.perf.maxPreviewCacheSize': { default: 'Preview Cache Max', 'pt-BR': 'Cache Máx. de Preview', en: 'Preview Cache Max', es: 'Caché máx. de vista previa', ru: 'Макс. кеш предпросмотра' },
  'settings.perf.initialSpriteRenderCount': { default: 'Initial Sprite Render Count', 'pt-BR': 'Qtd. Inicial de Sprites', en: 'Initial Sprite Render Count', es: 'Sprites iniciales a renderizar', ru: 'Нач. кол-во спрайтов' },
  'settings.perf.spriteRenderChunk': { default: 'Sprite Render Chunk', 'pt-BR': 'Chunk de Sprites', en: 'Sprite Render Chunk', es: 'Chunk de sprites', ru: 'Чанк спрайтов' },
  'settings.perf.animationBatchSize': { default: 'Animation Batch Size', 'pt-BR': 'Lote de Animações', en: 'Animation Batch Size', es: 'Tamaño de lote de animación', ru: 'Размер пакета анимаций' },
  'settings.perf.maxAutoAnimations': { default: 'Max Auto Animations', 'pt-BR': 'Máx. Animações Auto', en: 'Max Auto Animations', es: 'Animaciones auto máx.', ru: 'Макс. авто-анимаций' },
  'settings.perf.defaultPageSize': { default: 'Default Page Size', 'pt-BR': 'Tamanho de Página Padrão', en: 'Default Page Size', es: 'Tamaño de página predeterminado', ru: 'Размер страницы по умолч.' },
  'settings.perf.searchDebounceMs': { default: 'Search Debounce (ms)', 'pt-BR': 'Debounce de Busca (ms)', en: 'Search Debounce (ms)', es: 'Debounce de búsqueda (ms)', ru: 'Задержка поиска (мс)' },
  'settings.perf.idleCallbackTimeout': { default: 'Idle Callback Timeout', 'pt-BR': 'Timeout de Idle Callback', en: 'Idle Callback Timeout', es: 'Timeout de idle callback', ru: 'Таймаут idle callback' },
  'settings.perf.historyLimit': { default: 'History Limit', 'pt-BR': 'Limite do Histórico', en: 'History Limit', es: 'Límite de historial', ru: 'Лимит истории' },

  // ==========================================
  // Proficiency Editor
  // ==========================================
  'proficiency.title': { default: 'Weapon Proficiency', 'pt-BR': 'Proficiência de Arma', en: 'Weapon Proficiency', es: 'Competencia de Arma', ru: 'Мастерство оружия' },
  'proficiency.noSelection': { default: 'Select a weapon on the left.', 'pt-BR': 'Selecione uma arma à esquerda.', en: 'Select a weapon on the left.', es: 'Selecciona un arma a la izquierda.', ru: 'Выберите оружие слева.' },
  'proficiency.unknownItem': { default: 'Unknown Item', 'pt-BR': 'Item desconhecido', en: 'Unknown Item', es: 'Objeto desconocido', ru: 'Неизвестный предмет' },

  // Proficiency - Buttons
  'proficiency.btn.loadData': { default: 'Load Data', 'pt-BR': 'Carregar', en: 'Load Data', es: 'Cargar', ru: 'Загрузить' },
  'proficiency.btn.new': { default: 'New', 'pt-BR': 'Novo', en: 'New', es: 'Nuevo', ru: 'Новый' },
  'proficiency.btn.syncXml': { default: 'Sync XML', 'pt-BR': 'Sync XML', en: 'Sync XML', es: 'Sync XML', ru: 'Синхр. XML' },
  'proficiency.btn.saveAs': { default: 'Save As', 'pt-BR': 'Salvar Como', en: 'Save As', es: 'Guardar Como', ru: 'Сохранить как' },
  'proficiency.btn.ok': { default: 'Ok', 'pt-BR': 'Ok', en: 'Ok', es: 'Ok', ru: 'Ок' },
  'proficiency.btn.apply': { default: 'Apply', 'pt-BR': 'Aplicar', en: 'Apply', es: 'Aplicar', ru: 'Применить' },
  'proficiency.btn.reset': { default: 'Reset', 'pt-BR': 'Reset', en: 'Reset', es: 'Restablecer', ru: 'Сброс' },
  'proficiency.btn.close': { default: 'Close', 'pt-BR': 'Fechar', en: 'Close', es: 'Cerrar', ru: 'Закрыть' },
  'proficiency.btn.delete': { default: 'Delete', 'pt-BR': 'Deletar', en: 'Delete', es: 'Eliminar', ru: 'Удалить' },
  'proficiency.btn.unlink': { default: 'Unlink', 'pt-BR': 'Desvincular', en: 'Unlink', es: 'Desvincular', ru: 'Отвязать' },
  'proficiency.btn.remove': { default: 'Remove', 'pt-BR': 'Remover', en: 'Remove', es: 'Eliminar', ru: 'Удалить' },
  'proficiency.btn.fixDat': { default: 'Fix DAT', 'pt-BR': 'Fix DAT', en: 'Fix DAT', es: 'Fix DAT', ru: 'Fix DAT' },
  'proficiency.btn.fixXml': { default: 'Fix XML', 'pt-BR': 'Fix XML', en: 'Fix XML', es: 'Fix XML', ru: 'Fix XML' },
  'proficiency.btn.refresh': { default: 'Refresh', 'pt-BR': 'Atualizar', en: 'Refresh', es: 'Actualizar', ru: 'Обновить' },

  // Proficiency - Filters
  'proficiency.filter.vocation': { default: 'Voc.', 'pt-BR': 'Voc.', en: 'Voc.', es: 'Voc.', ru: 'Класс' },
  'proficiency.filter.weaponsAll': { default: 'Weapons: All', 'pt-BR': 'Armas: Todas', en: 'Weapons: All', es: 'Armas: Todas', ru: 'Оружие: Все' },
  'proficiency.filter.search': { default: 'Type to search', 'pt-BR': 'Digite para buscar', en: 'Type to search', es: 'Escriba para buscar', ru: 'Введите для поиска' },
  'proficiency.filter.clearSearch': { default: 'Clear Search', 'pt-BR': 'Limpar busca', en: 'Clear Search', es: 'Limpiar búsqueda', ru: 'Очистить поиск' },

  // Proficiency - Config Panel
  'proficiency.config.title': { default: 'Proficiency Config', 'pt-BR': 'Config. Proficiency', en: 'Proficiency Config', es: 'Config. Competencia', ru: 'Настройки мастерства' },
  'proficiency.config.linkedItem': { default: 'Linked Item', 'pt-BR': 'Item Vinculado', en: 'Linked Item', es: 'Objeto Vinculado', ru: 'Привязанный предмет' },
  'proficiency.config.searchItem': { default: 'Search item by name or ID...', 'pt-BR': 'Buscar item por nome ou ID...', en: 'Search item by name or ID...', es: 'Buscar objeto por nombre o ID...', ru: 'Поиск предмета по имени или ID...' },
  'proficiency.config.deleteConfirm': { default: 'Delete "{{name}}" (ID {{id}})?', 'pt-BR': 'Deletar "{{name}}" (ID {{id}})?', en: 'Delete "{{name}}" (ID {{id}})?', es: '¿Eliminar "{{name}}" (ID {{id}})?', ru: 'Удалить "{{name}}" (ID {{id}})?' },

  // Proficiency - Perk Config
  'proficiency.perk.title': { default: 'Perk Config', 'pt-BR': 'Config. Perk', en: 'Perk Config', es: 'Config. Perk', ru: 'Настройки перка' },

  // Proficiency - Status Messages
  'proficiency.status.loadError': { default: 'Error loading format', 'pt-BR': 'Erro ao carregar formato', en: 'Error loading format', es: 'Error al cargar formato', ru: 'Ошибка загрузки формата' },
  'proficiency.status.saved': { default: 'Saved successfully!', 'pt-BR': 'Salvo com sucesso!', en: 'Saved successfully!', es: '¡Guardado con éxito!', ru: 'Успешно сохранено!' },
  'proficiency.status.saveError': { default: 'Error: {{err}}', 'pt-BR': 'Erro: {{err}}', en: 'Error: {{err}}', es: 'Error: {{err}}', ru: 'Ошибка: {{err}}' },
  'proficiency.status.linked': { default: 'Item linked!', 'pt-BR': 'Item vinculado!', en: 'Item linked!', es: '¡Objeto vinculado!', ru: 'Предмет привязан!' },
  'proficiency.status.linkError': { default: 'Error linking: {{err}}', 'pt-BR': 'Erro ao vincular: {{err}}', en: 'Error linking: {{err}}', es: 'Error al vincular: {{err}}', ru: 'Ошибка привязки: {{err}}' },
  'proficiency.status.xmlReadError': { default: 'Error reading XML: {{err}}', 'pt-BR': 'Erro ao ler XML: {{err}}', en: 'Error reading XML: {{err}}', es: 'Error al leer XML: {{err}}', ru: 'Ошибка чтения XML: {{err}}' },

  // Proficiency - XML Sync Panel
  'proficiency.sync.title': { default: '3-Way Sync', 'pt-BR': '3-Way Sync', en: '3-Way Sync', es: '3-Way Sync', ru: '3-Way Sync' },
  'proficiency.sync.ok': { default: 'OK', 'pt-BR': 'OK', en: 'OK', es: 'OK', ru: 'OK' },
  'proficiency.sync.datWrong': { default: 'DAT wrong', 'pt-BR': 'DAT errado', en: 'DAT wrong', es: 'DAT incorrecto', ru: 'DAT неверно' },
  'proficiency.sync.xmlWrong': { default: 'XML wrong', 'pt-BR': 'XML errado', en: 'XML wrong', es: 'XML incorrecto', ru: 'XML неверно' },
  'proficiency.sync.missingXml': { default: 'missing XML', 'pt-BR': 'falta XML', en: 'missing XML', es: 'falta XML', ru: 'нет в XML' },
  'proficiency.sync.missingJson': { default: 'missing JSON', 'pt-BR': 'falta JSON', en: 'missing JSON', es: 'falta JSON', ru: 'нет в JSON' },
  'proficiency.sync.datIncorrectTitle': { default: 'DAT Incorrect (JSON+XML agree)', 'pt-BR': 'DAT Incorreto (JSON+XML concordam)', en: 'DAT Incorrect (JSON+XML agree)', es: 'DAT Incorrecto (JSON+XML coinciden)', ru: 'DAT неверно (JSON+XML совпадают)' },
  'proficiency.sync.datWarning': { default: 'Fix DAT only works if the item exists in the loaded appearances.dat. Missing items need to be created first.', 'pt-BR': 'Fix DAT só funciona se o item existir no appearances.dat carregado. Items ausentes precisam ser criados primeiro.', en: 'Fix DAT only works if the item exists in the loaded appearances.dat. Missing items need to be created first.', es: 'Fix DAT solo funciona si el objeto existe en el appearances.dat cargado. Los objetos ausentes deben crearse primero.', ru: 'Fix DAT работает только если предмет есть в загруженном appearances.dat. Отсутствующие предметы нужно создать сначала.' },
  'proficiency.sync.xmlIncorrectTitle': { default: 'XML Incorrect (JSON+DAT agree)', 'pt-BR': 'XML Incorreto (JSON+DAT concordam)', en: 'XML Incorrect (JSON+DAT agree)', es: 'XML Incorrecto (JSON+DAT coinciden)', ru: 'XML неверно (JSON+DAT совпадают)' },
  'proficiency.sync.missingXmlTitle': { default: 'Missing in XML', 'pt-BR': 'Faltando no XML', en: 'Missing in XML', es: 'Falta en XML', ru: 'Отсутствует в XML' },
  'proficiency.sync.xmlWarning': { default: 'Items that exist in DAT but have no proficiency in items.xml. Fix XML only works if the item exists in the XML.', 'pt-BR': 'Items que existem no DAT mas não tem proficiency no items.xml. Fix XML só funciona se o item existir no XML.', en: 'Items that exist in DAT but have no proficiency in items.xml. Fix XML only works if the item exists in the XML.', es: 'Objetos que existen en DAT pero no tienen competencia en items.xml. Fix XML solo funciona si el objeto existe en el XML.', ru: 'Предметы, которые есть в DAT, но не имеют proficiency в items.xml. Fix XML работает только если предмет есть в XML.' },
  'proficiency.sync.missingJsonTitle': { default: 'ProficiencyId missing in JSON', 'pt-BR': 'ProficiencyId ausente no JSON', en: 'ProficiencyId missing in JSON', es: 'ProficiencyId ausente en JSON', ru: 'ProficiencyId отсутствует в JSON' },
  'proficiency.sync.itemsOk': { default: '{{count}} items OK', 'pt-BR': '{{count}} items OK', en: '{{count}} items OK', es: '{{count}} items OK', ru: '{{count}} items OK' },
  'proficiency.sync.absent': { default: 'absent', 'pt-BR': 'ausente', en: 'absent', es: 'ausente', ru: 'отсутствует' },

  // Proficiency - Fix Results
  'proficiency.fix.xmlNothingToFix': { default: 'XML: nothing to fix!', 'pt-BR': 'XML: nada para corrigir!', en: 'XML: nothing to fix!', es: 'XML: ¡nada que corregir!', ru: 'XML: нечего исправлять!' },
  'proficiency.fix.xmlResult': { default: 'XML: {{updated}} updated, {{added}} added', 'pt-BR': 'XML: {{updated}} atualizados, {{added}} adicionados', en: 'XML: {{updated}} updated, {{added}} added', es: 'XML: {{updated}} actualizados, {{added}} añadidos', ru: 'XML: {{updated}} обновлено, {{added}} добавлено' },
  'proficiency.fix.xmlNotFound': { default: '{{count}} items not found in XML (IDs: {{ids}})', 'pt-BR': '{{count}} items não existem no XML (IDs: {{ids}})', en: '{{count}} items not found in XML (IDs: {{ids}})', es: '{{count}} objetos no existen en XML (IDs: {{ids}})', ru: '{{count}} предметов не найдено в XML (IDs: {{ids}})' },
  'proficiency.fix.datNothingToFix': { default: 'DAT: nothing to fix!', 'pt-BR': 'DAT: nada para corrigir!', en: 'DAT: nothing to fix!', es: 'DAT: ¡nada que corregir!', ru: 'DAT: нечего исправлять!' },
  'proficiency.fix.datSaved': { default: 'DAT: {{count}} items fixed and saved', 'pt-BR': 'DAT: {{count}} items corrigidos e salvos', en: 'DAT: {{count}} items fixed and saved', es: 'DAT: {{count}} objetos corregidos y guardados', ru: 'DAT: {{count}} предметов исправлено и сохранено' },
  'proficiency.fix.datSaveError': { default: 'DAT: {{count}} in memory, failed to save: {{err}}', 'pt-BR': 'DAT: {{count}} na memória, falha ao salvar: {{err}}', en: 'DAT: {{count}} in memory, failed to save: {{err}}', es: 'DAT: {{count}} en memoria, error al guardar: {{err}}', ru: 'DAT: {{count}} в памяти, ошибка сохранения: {{err}}' },
  'proficiency.fix.datErrors': { default: 'DAT: {{ok}} OK, {{errors}} errors (items not found in .dat)', 'pt-BR': 'DAT: {{ok}} OK, {{errors}} erros (items não encontrados no .dat)', en: 'DAT: {{ok}} OK, {{errors}} errors (items not found in .dat)', es: 'DAT: {{ok}} OK, {{errors}} errores (objetos no encontrados en .dat)', ru: 'DAT: {{ok}} OK, {{errors}} ошибок (предметы не найдены в .dat)' },
  'proficiency.fix.xmlSyncError': { default: 'Error syncing XML: {{err}}', 'pt-BR': 'Erro ao sync XML: {{err}}', en: 'Error syncing XML: {{err}}', es: 'Error al sincronizar XML: {{err}}', ru: 'Ошибка синхронизации XML: {{err}}' }
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

function resolveTemplate(language: LanguageCode, key: TranslationKey): string {
  const languageTable = translations[language] ?? translations[DEFAULT_LANGUAGE];
  return languageTable[key] ?? translations[DEFAULT_LANGUAGE][key] ?? key;
}

/**
 * Memoized translator factory using closures.
 * Caches translations per language to avoid repeated lookups.
 * The cache is automatically invalidated when the language changes.
 */
function createMemoizedTranslator() {
  let cachedLanguage: LanguageCode | null = null;
  const cache = new Map<string, string>();

  return (
    key: TranslationKey,
    replacements?: ReplacementValues,
    language: LanguageCode = getActiveLanguage()
  ): string => {
    // Invalidate cache when language changes
    if (language !== cachedLanguage) {
      cache.clear();
      cachedLanguage = language;
    }

    // Only cache when there are no dynamic replacements
    if (!replacements) {
      const cached = cache.get(key);
      if (cached !== undefined) return cached;

      const result = formatTemplate(resolveTemplate(language, key));
      cache.set(key, result);
      return result;
    }

    // Dynamic replacements — always compute fresh
    return formatTemplate(resolveTemplate(language, key), replacements);
  };
}

export const translate = createMemoizedTranslator();

export function setActiveLanguage(language: LanguageCode): void {
  settingsState.language = language;
}

export function getActiveLanguage(): LanguageCode {
  return (settingsState.language as LanguageCode) || DEFAULT_LANGUAGE;
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

export function getLanguageOptionLabel(language: LanguageCode, displayLanguage: LanguageCode = getActiveLanguage()): string {
  return translate(`language.option.${language === 'pt-BR' ? 'pt' : language}` as TranslationKey, undefined, displayLanguage);
}

export function getThemeLabel(themeKey: 'default' | 'ocean' | 'aurora' | 'ember' | 'forest' | 'dusk', language: LanguageCode = getActiveLanguage()): string {
  return translate(`theme.${themeKey}` as TranslationKey, undefined, language);
}




