local internalNpcName = "Online Coins Trader"
local npcType = Game.createNpcType(internalNpcName)
local npcConfig = {}

npcConfig.name = internalNpcName
npcConfig.description = internalNpcName

npcConfig.health = 100
npcConfig.maxHealth = npcConfig.health
npcConfig.walkInterval = 2000
npcConfig.walkRadius = 2

npcConfig.outfit = {
	lookType = 957,
	lookHead = 115,
	lookBody = 39,
	lookLegs = 96,
	lookFeet = 118,
	lookAddons = 3
}

npcConfig.flags = {
	floorchange = false
}

npcConfig.currency = 37317

npcConfig.voices = {
	interval = 6000,
	chance = 50,
	{text = 'Exchange your Online Coins for Items!'},
	{text = 'Online for a lot of time? Come here to get precious rewards!'},
}

npcConfig.shop = { -- Sellable items
	{ itemName = "moon mirror", clientId = 25975, buy = 400 },
	{ itemName = "starlight vial", clientId = 25976, buy = 400 },
	{ itemName = "sun catcher", clientId = 25977, buy = 400 },
    { itemName = "magical torch", clientId = 9042, buy = 300 },
    { itemName = "lit torch", clientId = 34016, buy = 600 },
    { itemName = "bone fiddle", clientId = 28493, buy = 600 },
    { itemName = "scarab ocarina", clientId = 43740, buy = 350 },
	{ itemName = "conch shell horn", clientId = 43863, buy = 350 },
    { itemName = "blossom bag", clientId = 25780, buy = 250 },
    { itemName = "blessed wooden stake", clientId = 5942, buy = 250 },
    { itemName = "obsidian knife", clientId = 5908, buy = 250 },
    { itemName = "zaoan chess box", clientId = 18339, buy = 600 },
	{ itemName = "galthen's satchel", clientId = 36813, buy = 600 },
    { itemName = "blood herb", clientId = 3734, buy = 200 },
    { itemName = "blessed wooden stake", clientId = 5942, buy = 250 },
    { itemName = "demonic candy ball", clientId = 11587, buy = 150 },
    { itemName = "swan feather cloak", clientId = 25779, buy = 1800 },
    { itemName = "tiara of power", clientId = 23474, buy = 150 }
}


-- On buy npc shop message
npcType.onBuyItem = function(npc, player, itemId, subType, amount, ignore, inBackpacks, totalCost)
	npc:sellItem(player, itemId, amount, subType, 0, ignore, inBackpacks)
end
-- On sell npc shop message
npcType.onSellItem = function(npc, player, itemId, subtype, amount, ignore, name, totalCost)
	player:sendTextMessage(MESSAGE_TRADE, string.format("Sold %ix %s for %i online coins.", amount, name, totalCost))
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
