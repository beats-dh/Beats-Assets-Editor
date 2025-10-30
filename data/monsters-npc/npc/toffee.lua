local internalNpcName = "Toffee"
local npcType = Game.createNpcType(internalNpcName)
local npcConfig = {}

npcConfig.name = internalNpcName
npcConfig.description = internalNpcName

npcConfig.health = 100
npcConfig.maxHealth = npcConfig.health
npcConfig.walkInterval = 2000
npcConfig.walkRadius = 2

npcConfig.outfit = {
	lookType = 1751,
}
npcConfig.flags = {
	floorchange = false,
}

npcConfig.voices = {
	interval = 5000,
	chance = 10,
	{ text = "Buy fresh fruit for candying here!", yell = false },
	{ text = "Wafer paper flowers? Lime tart? Brigadeiros? Just bring them here, I have a use for them!", yell = false },
	{ text = "Freshly baked cakes and cookies!", yell = false },
}

npcConfig.shop = {
	{ itemName = "banana", clientId = 3587, buy = 2 },
	{ itemName = "blueberry", clientId = 3588, buy = 1 },
	{ itemName = "cake", clientId = 6277, buy = 50 },
	{ itemName = "cherry", clientId = 3590, buy = 1 },
	{ itemName = "cookie", clientId = 3598, buy = 2 },
	{ itemName = "grapes", clientId = 3592, buy = 3 },
	{ itemName = "moon melon slice", clientId = 9999, buy = 0 }, -- Replace 9999 with the actual clientId
	{ itemName = "pear", clientId = 3584, buy = 4 },
	{ itemName = "plum", clientId = 8011, buy = 3 },
	{ itemName = "raspberry", clientId = 8012, buy = 1 },
	{ itemName = "red apple", clientId = 3585, buy = 3 },
	{ itemName = "strawberry", clientId = 3591, buy = 1 },
	{ itemName = "valentine's cake", clientId = 6392, buy = 30 },
	{ itemName = "beijinho", clientId = 48253, sell = 2780 },
	{ itemName = "brigadeiro", clientId = 48252, sell = 2640 },
	{ itemName = "churro heart", clientId = 48254, sell = 2680 },
	{ itemName = "lime tart", clientId = 48255, sell = 1870 },
	{ itemName = "pastry dragon", clientId = 48256, sell = 95000 },
	{ itemName = "taiyaki ice cream", clientId = 48273, sell = 6750 },
	-- { itemName = "wad of fairy floss", clientId = ????????????, sell = 0 },
	{ itemName = "wafer paper flower", clientId = 9990, sell = 2350 },
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

	return true
end

npcHandler:setMessage(MESSAGE_GREET, "**The globose cook greets you but you don't understand him. He makes a gesture as if to apply some lipstick. Then he is pointing to the east. But what does that mean?**")
npcHandler:setMessage(MESSAGE_FAREWELL, "Goodbye.")
npcHandler:setMessage(MESSAGE_WALKAWAY, "Goodbye.")

npcHandler:setCallback(CALLBACK_MESSAGE_DEFAULT, creatureSayCallback)
npcHandler:addModule(FocusModule:new(), npcConfig.name, true, true, true)

-- npcType registering the npcConfig table
npcType:register(npcConfig)
