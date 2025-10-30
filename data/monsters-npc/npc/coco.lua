local internalNpcName = "Coco"
local npcType = Game.createNpcType(internalNpcName)
local npcConfig = {}

npcConfig.name = internalNpcName
npcConfig.description = internalNpcName

npcConfig.health = 150
npcConfig.maxHealth = npcConfig.health
npcConfig.walkInterval = 2000
npcConfig.walkRadius = 2

npcConfig.outfit = {
	lookType = 1747,
	lookHead = 15,
	lookBody = 6,
	lookLegs = 53,
	lookFeet = 93,
	lookAddons = 0,
}

npcConfig.flags = {
	floorchange = false,
}

npcConfig.currency = 48250

local itemsTable = {
	["milk chocolate coins"] = {
		{ clientId = 48450, itemName = "candy bed (headboard)", buy = 1500 },
		{ clientId = 48449, itemName = "candy bed (footboard)", buy = 1500 },
		{ clientId = 48453, itemName = "candy cane chair", buy = 1500 },
		{ clientId = 48433, itemName = "candy cushion", buy = 1500 },
		{ clientId = 45644, itemName = "candy-coated quiver", buy = 8000 },
		{ clientId = 48430, itemName = "chocolate table", buy = 1500 },
		{ clientId = 45640, itemName = "creamy grimoire", buy = 8000 },
		{ clientId = 49166, itemName = "small gingerbread house", buy = 3000 },
	},
	["dark chocolate coins"] = {
		{ clientId = 45643, itemName = "biscuit barrier", buy = 8000 },
		{ clientId = 48435, itemName = "blue ice cream Lamp", buy = 1125 },
		{ clientId = 48431, itemName = "chocolate fountain", buy = 1500 },
		{ clientId = 45639, itemName = "cocoa grimoire", buy = 8000 },
		{ clientId = 48439, itemName = "green ice cream lamp", buy = 1125 },
		{ clientId = 48437, itemName = "pink ice cream lamp", buy = 1125 },
		{ clientId = 48434, itemName = "pop tart painting", buy = 1500 },
		{ clientId = 45642, itemName = "ring of temptation", buy = 250 },
	},
}

npcConfig.shop = {}
for _, categoryTable in pairs(itemsTable) do
	for _, itemTable in ipairs(categoryTable) do
		table.insert(npcConfig.shop, itemTable)
	end
end

-- On buy npc shop message
npcType.onBuyItem = function(npc, player, itemId, subType, amount, ignore, inBackpacks, totalCost)
	npc:sellItem(player, itemId, amount, subType, 0, ignore, inBackpacks)
end
-- On sell npc shop message
npcType.onSellItem = function(npc, player, itemId, subtype, amount, ignore, name, totalCost)
	local currencyType = npc:getCurrency() == 48250 and "dark chocolate coins" or "milk chocolate coins"
	player:sendTextMessage(MESSAGE_TRADE, string.format("Sold %ix %s for %i %s.", amount, name, totalCost, currencyType))
end
-- On check npc shop message (look item)
npcType.onCheckItem = function(npc, player, clientId, subType) end

npcConfig.voices = {
	interval = 15000,
	chance = 50,
	{ text = "Trading milk chocolate coins or dark chocolate coins for sweet items!" },
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

local function creatureSayCallback(npc, creature, type, message)
	local player = Player(creature)
	local playerId = player:getId()

	if not npcHandler:checkInteraction(npc, creature) then
		return false
	end

	if not player or not playerId then
		return false
	end

	local categoryTable = itemsTable[message:lower()]

	if categoryTable then
		if message:lower() == "dark chocolate coin" then
			npc:setCurrency(48250)
		elseif message:lower() == "milk chocolate coin" then
			npc:setCurrency(48249)
		end

		npcHandler:say("Of course, just browse through my wares..", npc, player)
		npc:openShopWindowTable(player, categoryTable)
	end
	return true
end

npcHandler:setMessage(MESSAGE_GREET, "Hello, Adventurer! How may I be of service? Do you wish to trade some {milk chocolate coins}, or perhaps you want to trade {dark chocolate coins}? ")
npcHandler:setCallback(CALLBACK_MESSAGE_DEFAULT, creatureSayCallback)
npcHandler:addModule(FocusModule:new(), npcConfig.name, true, true, true)

-- npcType registering the npcConfig table
npcType:register(npcConfig)
