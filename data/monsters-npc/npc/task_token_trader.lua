local internalNpcName = "Task Token Trader"
local npcType = Game.createNpcType(internalNpcName)
local npcConfig = {}

npcConfig.name = internalNpcName
npcConfig.description = internalNpcName

npcConfig.health = 100
npcConfig.maxHealth = npcConfig.health
npcConfig.walkInterval = 3000
npcConfig.walkRadius = 2

npcConfig.outfit = {
	lookType = 745,
	lookHead = 114,
	lookBody = 116,
	lookLegs = 79,
	lookFeet = 79,
	lookAddons = 2,
}

npcConfig.flags = {
	floorchange = false,
}

npcConfig.currency = 60006

npcConfig.voices = {
	interval = 2500,
	chance = 100,
	{ text = "Exchange your Task Coins for precious items!" },
	{ text = "Have you completed a lot of tasks? Trade your Task Coins with me!" },
	{ text = "Looking for dolls, decorations and cool stuff? Exchange your Tasks Coins with me!" },
	{ text = "I also change Task Coins for Roulette Coins. It's a good deal!" },
	{ text = "Tired of killing powerful creatures? Exchange your Task Coins for cool items with me!" },
}

npcConfig.shop = { -- Sellable items
	{ itemName = "roulette coin", clientId = 60004, buy = 10 },
	{ itemName = "panda teddy", clientId = 5080, buy = 30 },
	{ itemName = "stuffed dragon", clientId = 5791, buy = 30 },
	{ itemName = "baby seal doll", clientId = 7183, buy = 30 },
	{ itemName = "small ladybug", clientId = 30322, buy = 40 },
	{ itemName = "vexclaw doll", clientId = 32943, buy = 40 },
	{ itemName = "draken doll", clientId = 12043, buy = 40 },
	{ itemName = "retching horror doll", clientId = 32945, buy = 40 },
	{ itemName = "demon doll", clientId = 32918, buy = 50 },
	{ itemName = "dread doll", clientId = 12904, buy = 50 },
	{ itemName = "nightmare doll", clientId = 10227, buy = 50 },
	{ itemName = "bard doll", clientId = 33331, buy = 60 },
	{ itemName = "black knight doll", clientId = 21435, buy = 60 },
	{ itemName = "midnight panther doll", clientId = 21948, buy = 60 },
	{ itemName = "little adventurer doll", clientId = 22121, buy = 60 },
	{ itemName = "imortus", clientId = 12812, buy = 80 },
	{ itemName = "loremaster doll", clientId = 25634, buy = 80 },
	{ itemName = "omniscient owl", clientId = 31675, buy = 80 },
	{ itemName = "cateroide's doll", clientId = 22151, buy = 80 },
	{ itemName = "assassin doll", clientId = 21962, buy = 80 },
	{ itemName = "draptor doll", clientId = 37743, buy = 80 },
	{ itemName = "citizen doll", clientId = 27846, buy = 80 },
	{ itemName = "Bella Bonecrusher's doll", clientId = 37054, buy = 80 },
	{ itemName = "doll of Durin The Almigthy", clientId = 23679, buy = 80 },
	{ itemName = "Ferumbras' teddy", clientId = 22775, buy = 80 },
	{ itemName = "Ferumbras doll", clientId = 10798, buy = 120 },
	{ itemName = "banor doll", clientId = 36478, buy = 120 },
	{ itemName = "war backpack", clientId = 21445, buy = 120 },
}

-- On buy npc shop message
npcType.onBuyItem = function(npc, player, itemId, subType, amount, ignore, inBackpacks, totalCost)
	npc:sellItem(player, itemId, amount, subType, 0, ignore, inBackpacks)
end
-- On sell npc shop message
npcType.onSellItem = function(npc, player, itemId, subtype, amount, ignore, name, totalCost)
	player:sendTextMessage(MESSAGE_TRADE, string.format("Sold %ix %s for %i task coins.", amount, name, totalCost))
end
-- On check npc shop message (look item)
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

npcHandler:addModule(FocusModule:new(), npcConfig.name, true, true, true)

npcType:register(npcConfig)
