local internalNpcName = "Petaloid"
local npcType = Game.createNpcType(internalNpcName)
local npcConfig = {}

npcConfig.name = internalNpcName
npcConfig.description = internalNpcName

npcConfig.health = 100
npcConfig.maxHealth = npcConfig.health
npcConfig.walkInterval = 2500
npcConfig.walkRadius = 2

npcConfig.outfit = {
	lookType = 1760,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 1,
}

npcConfig.flags = {
	floorchange = false,
}

npcConfig.voices = {}

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

	if MsgContains(message, "leaves") then
		npcHandler:say("<Blue leaves, bottom of the sea. Exquisity! Interest?>", npc, creature)
		npcHandler:setTopic(playerId, 1)
	elseif MsgContains(message, "yes") and npcHandler:getTopic(playerId) == 1 then
		npcHandler:say("<Leaves with you? Made room for reward?>", npc, creature)
		npcHandler:setTopic(playerId, 2)
	elseif MsgContains(message, "yes") and npcHandler:getTopic(playerId) == 2 then
		if player:getItemCount(48419) >= 20 then
			player:removeItem(48419, 20)
			if math.random(100) <= 5 then -- 5% chance to get the petrified leaf
				player:addItem(48515, 1)
				npcHandler:say(" <~Superordinary!~ Petrified leaf among leaves - impressed! Stranger better use! Tea, good wish and special reward - take care!>", npc, creature)
			else
				player:addItem(48419, 1)
				npcHandler:say("<~Exquisite!~ Petaloid reward - gratefulness! Tea and good wish, gather more - return!>", npc, creature)
			end
		else
			npcHandler:say("<Not enough leaves! Gather 20 and return!>", npc, creature)
		end
		npcHandler:setTopic(playerId, 0)
	end
	return true
end

npcHandler:setMessage(MESSAGE_GREET, "<Greeting, requiring help! Take advice? Have blue {leaves}? Ask!>")
npcHandler:setMessage(MESSAGE_WALKAWAY, "<Good bye, stranger!>")
npcHandler:setMessage(MESSAGE_FAREWELL, "<Good bye, stranger!>")
npcHandler:setCallback(CALLBACK_MESSAGE_DEFAULT, creatureSayCallback)
npcHandler:addModule(FocusModule:new(), npcConfig.name, true, true, true)

npcType:register(npcConfig)
