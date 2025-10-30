local internalNpcName = "Backpack Seller"
local npcType = Game.createNpcType(internalNpcName)
local npcConfig = {}

npcConfig.name = internalNpcName
npcConfig.description = internalNpcName

npcConfig.health = 100
npcConfig.maxHealth = 100
npcConfig.walkInterval = 4000
npcConfig.walkRadius = 1

npcConfig.outfit = {
	lookType = 1292,
	lookHead = 115,
	lookBody = 39,
	lookLegs = 96,
	lookFeet = 118,
	lookAddons = 3,
}

npcConfig.flags = {
	floorchange = false,
}

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

npcConfig.shop = {
	{ itemName = "backpack", clientId = 2854, buy = 1000 },
	{ itemName = "green backpack", clientId = 2865, buy = 1000 },
	{ itemName = "yellow backpack", clientId = 2866, buy = 1000 },
	{ itemName = "red backpack", clientId = 2867, buy = 1000 },
	{ itemName = "purple backpack", clientId = 2868, buy = 1000 },
	{ itemName = "blue backpack", clientId = 2869, buy = 1000 },
	{ itemName = "grey backpack", clientId = 2870, buy = 1000 },
	{ itemName = "golden backpack", clientId = 2871, buy = 1000 },
	{ itemName = "camouflage backpack", clientId = 2872, buy = 1000 },
	{ itemName = "pirate backpack", clientId = 5926, buy = 1000 },
	{ itemName = "beach backpack", clientId = 5949, buy = 1000 },
	{ itemName = "fur backpack", clientId = 7342, buy = 1000 },
	{ itemName = "brocade backpack", clientId = 8860, buy = 1000 },
	{ itemName = "demon backpack", clientId = 9601, buy = 10000 },
	{ itemName = "orange backpack", clientId = 9602, buy = 1000 },
	{ itemName = "crown backpack", clientId = 9605, buy = 5000 },
	{ itemName = "expedition backpack", clientId = 10324, buy = 1000 },
	{ itemName = "dragon backpack", clientId = 10326, buy = 5000 },
	{ itemName = "minotaur backpack", clientId = 10327, buy = 5000 },
	{ itemName = "mushroom backpack", clientId = 16099, buy = 10000 },
	{ itemName = "glooth Backpack", clientId = 21295, buy = 10000 },
}
-- On buy npc shop message
npcType.onBuyItem = function(npc, player, itemId, subType, amount, ignore, inBackpacks, totalCost)
	npc:sellItem(player, itemId, amount, subType, 0, ignore, inBackpacks)
end
-- On sell npc shop message
npcType.onSellItem = function(npc, player, itemId, subtype, amount, ignore, name, totalCost)
	player:sendTextMessage(MESSAGE_LOOK, string.format("Sold %ix %s for %i gold.", amount, name, totalCost))
end
-- On check npc shop message (look item)
npcType.onCheckItem = function(npc, player, clientId, subType) end

npcHandler:setMessage(MESSAGE_GREET, "Hello, |PLAYERNAME|! I'm offering a wide selection of quality backpacks for all your adventuring needs. Just say {trade} if you'd like to see my collection.")

npcType:register(npcConfig)
