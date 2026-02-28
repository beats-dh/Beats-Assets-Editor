const fs = require('fs');

const data = `
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
  'asset.edit.attr.writeOnce': { default: 'Write Once', 'pt-BR': 'Escrever Uma Vez (Write Once)', en: 'Write Once', es: 'Escribir una vez', ru: 'Написать один раз' },
  'asset.edit.attr.automap': { default: 'Automap', 'pt-BR': 'Minimapa (Automap)', en: 'Automap', es: 'Minimapa', ru: 'Автокарта' },
  'asset.edit.attr.hook': { default: 'Hook', 'pt-BR': 'Gancho (Hook)', en: 'Hook', es: 'Gancho', ru: 'Крюк' },
  'asset.edit.attr.lensHelp': { default: 'Lens Help', 'pt-BR': 'Ajuda de Lente (Lens Help)', en: 'Lens Help', es: 'Ayuda de lente', ru: 'Помощь линзы' },
  'asset.edit.attr.clothes': { default: 'Clothes', 'pt-BR': 'Roupas (Clothes)', en: 'Clothes', es: 'Ropa', ru: 'Одежда' },
  'asset.edit.attr.defaultAction': { default: 'Default Action', 'pt-BR': 'Ação Padrão', en: 'Default Action', es: 'Acción por defecto', ru: 'Действие по умолчанию' },
  'asset.edit.attr.weaponType': { default: 'Weapon Type', 'pt-BR': 'Tipo de Arma', en: 'Weapon Type', es: 'Tipo de arma', ru: 'Тип оружия' },
  'asset.edit.attr.market': { default: 'Market', 'pt-BR': 'Mercado (Market)', en: 'Market', es: 'Mercado', ru: 'Рынок' },
  'asset.edit.attr.changedToExpire': { default: 'Changed To Expire', 'pt-BR': 'Muda para Expirar', en: 'Changed To Expire', es: 'Cambiado para expirar', ru: 'Изменено для истечения срока' },
  'asset.edit.attr.cyclopedia': { default: 'Cyclopedia', 'pt-BR': 'Ciclopédia', en: 'Cyclopedia', es: 'Ciclopedia', ru: 'Циклопедия' },
  'asset.edit.attr.upgradeClass': { default: 'Upgrade Classification', 'pt-BR': 'Classificação de Upgrade', en: 'Upgrade Classification', es: 'Clasificación de mejora', ru: 'Классификация улучшения' },
  'asset.edit.attr.skillwheelGem': { default: 'Skillwheel Gem', 'pt-BR': 'Gema da Roleta de Skills', en: 'Skillwheel Gem', es: 'Gema de la rueda de habilidades', ru: 'Драгоценный камень колеса навыков' },
  'asset.edit.attr.imbueable': { default: 'Imbueable', 'pt-BR': 'Imbuível', en: 'Imbueable', es: 'Imbuible', ru: 'Зачаровываемый' },
  'asset.edit.attr.proficiency': { default: 'Proficiency', 'pt-BR': 'Proficiência', en: 'Proficiency', es: 'Competencia', ru: 'Мастерство' },
  'asset.edit.attr.requirements': { default: 'Requirements', 'pt-BR': 'Requisitos', en: 'Requirements', es: 'Requisitos', ru: 'Требования' },
  'asset.edit.attr.npcSaleData': { default: 'NPC Sale Data', 'pt-BR': 'Dados de Venda no NPC', en: 'NPC Sale Data', es: 'Datos de venta de NPC', ru: 'Данные о продаже NPC' },

  // Attributes Fields
  'asset.edit.field.brightness': { default: 'Brightness:', 'pt-BR': 'Brilho:', en: 'Brightness:', es: 'Brillo:', ru: 'Яркость:' },
  'asset.edit.field.color': { default: 'Color:', 'pt-BR': 'Cor:', en: 'Color:', es: 'Color:', ru: 'Цвет:' },
  'asset.edit.field.x': { default: 'X:', 'pt-BR': 'X:', en: 'X:', es: 'X:', ru: 'X:' },
  'asset.edit.field.y': { default: 'Y:', 'pt-BR': 'Y:', en: 'Y:', es: 'Y:', ru: 'Y:' },
  'asset.edit.field.elevation': { default: 'Elevation:', 'pt-BR': 'Elevação:', en: 'Elevation:', es: 'Elevación:', ru: 'Возвышение:' },
  'asset.edit.field.maxTextLen': { default: 'Max Text Length:', 'pt-BR': 'Comprimento Máx. Texto:', en: 'Max Text Length:', es: 'Longitud Máx. de Texto:', ru: 'Макс. длина текста:' },
  'asset.edit.field.maxTextLenOnce': { default: 'Max Text Length Once:', 'pt-BR': 'Comprimento Máx. Texto Único:', en: 'Max Text Length Once:', es: 'Longitud Máx. de Texto Única:', ru: 'Макс. длина текста один раз:' },
  'asset.edit.field.direction': { default: 'Direction:', 'pt-BR': 'Direção:', en: 'Direction:', es: 'Dirección:', ru: 'Направление:' },
  'asset.edit.field.id': { default: 'ID:', 'pt-BR': 'ID:', en: 'ID:', es: 'ID:', ru: 'ID:' },
  'asset.edit.field.slot': { default: 'Slot:', 'pt-BR': 'Slot:', en: 'Slot:', es: 'Ranura:', ru: 'Слот:' },
  'asset.edit.field.action': { default: 'Action:', 'pt-BR': 'Ação:', en: 'Action:', es: 'Acción:', ru: 'Действие:' },
  'asset.edit.field.type': { default: 'Type:', 'pt-BR': 'Tipo:', en: 'Type:', es: 'Tipo:', ru: 'Тип:' },
  'asset.edit.field.category': { default: 'Category:', 'pt-BR': 'Categoria:', en: 'Category:', es: 'Categoría:', ru: 'Категория:' },
  'asset.edit.field.tradeAsObjId': { default: 'Trade As Object ID:', 'pt-BR': 'Trade As Object ID:', en: 'Trade As Object ID:', es: 'Intercambiar como ID de objeto:', ru: 'Торговать как ID объекта:' },
  'asset.edit.field.showAsObjId': { default: 'Show As Object ID:', 'pt-BR': 'Show As Object ID:', en: 'Show As Object ID:', es: 'Mostrar como ID de objeto:', ru: 'Показывать как ID объекта:' },
  'asset.edit.field.formerObjId': { default: 'Former Object Type ID:', 'pt-BR': 'Former Object Type ID:', en: 'Former Object Type ID:', es: 'ID de tipo de objeto anterior:', ru: 'ID предыдущего типа объекта:' },
  'asset.edit.field.cyclopediaType': { default: 'Cyclopedia Type:', 'pt-BR': 'Tipo de Ciclopédia:', en: 'Cyclopedia Type:', es: 'Tipo de Ciclopedia:', ru: 'Тип циклопедии:' },
  'asset.edit.field.classification': { default: 'Classification:', 'pt-BR': 'Classificação:', en: 'Classification:', es: 'Clasificación:', ru: 'Классификация:' },
  'asset.edit.field.gemQualId': { default: 'Gem Quality ID:', 'pt-BR': 'ID de Qualidade da Gema:', en: 'Gem Quality ID:', es: 'ID de calidad de gema:', ru: 'ID качества камня:' },
  'asset.edit.field.vocId': { default: 'Vocation ID:', 'pt-BR': 'ID da Vocação:', en: 'Vocation ID:', es: 'ID de Vocación:', ru: 'ID призвания:' },
  'asset.edit.field.slotCount': { default: 'Slot Count:', 'pt-BR': 'Quant. de Slots:', en: 'Slot Count:', es: 'Cantidad de ranuras:', ru: 'Количество слотов:' },
  'asset.edit.field.profId': { default: 'Proficiency ID:', 'pt-BR': 'ID de Proficiência:', en: 'Proficiency ID:', es: 'ID de competencia:', ru: 'ID мастерства:' },
  'asset.edit.field.minLevel': { default: 'Minimum Level:', 'pt-BR': 'Nível Mínimo:', en: 'Minimum Level:', es: 'Nivel Mínimo:', ru: 'Минимальный уровень:' },
  'asset.edit.field.vocations': { default: 'Vocations:', 'pt-BR': 'Vocações:', en: 'Vocations:', es: 'Vocaciones:', ru: 'Призвания:' },
  'asset.edit.field.location': { default: 'Location:', 'pt-BR': 'Localização:', en: 'Location:', es: 'Ubicación:', ru: 'Местоположение:' },
  'asset.edit.field.salePrice': { default: 'Sale Price:', 'pt-BR': 'Preço de Venda:', en: 'Sale Price:', es: 'Precio de Venta:', ru: 'Цена продажи:' },
  'asset.edit.field.buyPrice': { default: 'Buy Price:', 'pt-BR': 'Preço de Compra:', en: 'Buy Price:', es: 'Precio de Compra:', ru: 'Цена покупки:' },
  'asset.edit.field.currencyObjId': { default: 'Currency Object ID:', 'pt-BR': 'Moeda (Object ID):', en: 'Currency Object ID:', es: 'Moneda (ID de objeto):', ru: 'Валюта (ID объекта):' },

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
  'asset.edit.opt.autowalkHi': { default: 'Autowalk Highlight', 'pt-BR': 'Destaque Autowalk', en: 'Autowalk Highlight', es: 'Destacar caminar automático', ru: 'Выделение автоходьбы' },

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
  'asset.edit.btn.addVoc': { default: '+ Add Vocation ID', 'pt-BR': '+ Adic. ID de Vocação', en: '+ Add Vocation ID', es: '+ Añadir ID de Vocación', ru: '+ Добавить ID призвания' },
  'asset.edit.btn.addNpc': { default: '+ Adicionar NPC Sale Data', 'pt-BR': '+ Adic. Dados NPC Sale', en: '+ Add NPC Sale Data', es: '+ Añadir Ventas de NPC', ru: '+ Добавить данные NPC' },
  'asset.edit.btn.remove': { default: 'Remover', 'pt-BR': 'Remover', en: 'Remove', es: 'Eliminar', ru: 'Удалить' },
  'asset.edit.lbl.npcNum': { default: 'NPC #{{num}}', 'pt-BR': 'NPC #{{num}}', en: 'NPC #{{num}}', es: 'NPC #{{num}}', ru: 'NPC #{{num}}' },
  'asset.edit.lbl.vocId': { default: 'Vocação ID {{id}}', 'pt-BR': 'Vocação ID {{id}}', en: 'Vocation ID {{id}}', es: 'Vocación ID {{id}}', ru: 'Призвание ID {{id}}' },
  'asset.edit.prompt.vocId': { default: 'Digite o ID da vocacao:', 'pt-BR': 'Digite o ID da vocação:', en: 'Enter the vocation ID:', es: 'Ingrese el ID de vocación:', ru: 'Введите ID призвания:' },
`;

fs.writeFileSync('c:/Users/danie/Documentos/tmp-i18n.ts', data);
console.log('done');
