local internalNpcName = "Boss Token Trader"
local npcType = Game.createNpcType(internalNpcName)
local npcConfig = {}

npcConfig.name = "Boss Token Trader"
npcConfig.description = internalNpcName

npcConfig.health = 100
npcConfig.maxHealth = npcConfig.health
npcConfig.walkInterval = 3000
npcConfig.walkRadius = 2

npcConfig.outfit = {
	lookType = 2001,
	lookHead = 114,
	lookBody = 114,
	lookLegs = 114,
	lookFeet = 114,
	lookAddons = 3,
	lookMount = 2000,
}

npcConfig.flags = {
	floorchange = false,
}

npcConfig.currency = 60080

npcConfig.voices = {
	interval = 2500,
	chance = 25,
	{ text = "Ask me about Guardian. I will inform you everything!" },
}

npcConfig.shop = {
	{ itemName = "roulette coin", clientId = 60004, buy = 150 },
	{ itemName = "task boost", clientId = 60003, buy = 200 },
	{ itemName = "dust refiller", clientId = 60046, buy = 150 },
	{ itemName = "stamina extension", clientId = 36725, buy = 500 },
	{ itemName = "bestiary betterment", clientId = 36728, buy = 500 },
	{ itemName = "lasting exercise box", clientId = 60062, buy = 300 },
	{ itemName = "prey cards", clientId = 60005, buy = 1000 },
	{ itemName = "training speed potion", clientId = 60075, buy = 400 },
	{ itemName = "greater gems box", clientId = 60078, buy = 500 },
	{ itemName = "random soulcore box", clientId = 60077, buy = 500 },
	{ itemName = "guardian chair", clientId = 60071, buy = 2000 },
	{ itemName = "guardian mailbox", clientId = 60068, buy = 2000 },
	{ itemName = "guardian imbuing shrine", clientId = 60066, buy = 2000 },
	{ itemName = "guardian backpack", clientId = 60063, buy = 3500 },
	{ itemName = "guardian dummy", clientId = 60064, buy = 5000 },
	{ itemName = "guardian outfit bag", clientId = 60094, buy = 10000 },
	{ itemName = "guardian mount bag", clientId = 60095, buy = 10000 },
}

npcType.onBuyItem = function(npc, player, itemId, subType, amount, ignore, inBackpacks, totalCost)
	npc:sellItem(player, itemId, amount, subType, 0, ignore, inBackpacks)
end

npcType.onSellItem = function(npc, player, itemId, subtype, amount, ignore, name, totalCost)
	player:sendTextMessage(MESSAGE_TRADE, string.format("Sold %ix %s for %i task coins.", amount, name, totalCost))
end

npcType.onCheckItem = function(npc, player, clientId, subType) end

local keywordHandler = KeywordHandler:new()
local npcHandler = NpcHandler:new(keywordHandler)

npcType.onThink = function(npc, interval)
	npcHandler:onThink(npc, interval)
end

npcType.onAppear = function(npc, creature)
	npcHandler:onAppear(npc, creature)
end

npcType.onDisappear = function(npc, creature)
	npcHandler:onDisappear(npc, creature)
end

npcType.onMove = function(npc, creature, fromPosition, toPosition)
	npcHandler:onMove(npc, creature, fromPosition, toPosition)
end

npcType.onSay = function(npc, creature, type, message)
	npcHandler:onSay(npc, creature, type, message)
end

npcType.onCloseChannel = function(npc, creature)
	npcHandler:onCloseChannel(npc, creature)
end

-- Resposta ao "hi"
keywordHandler:addKeyword({"guardian"}, StdModule.say, {
	npcHandler = npcHandler,
	text = "If you are wondering about the cosmetics, like guardian dummy, outfit and mount, they are just cosmetics. Since our Outfit Bonus system applies the bonuses even if you don't have the outfit equiped, it is a good way to be fashion and also enjoy your bonuses"
})

npcHandler:addModule(FocusModule:new(), npcConfig.name, true, true, true)

npcType:register(npcConfig)
