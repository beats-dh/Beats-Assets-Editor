local internalNpcName = "Two Lips"
local npcType = Game.createNpcType(internalNpcName)
local npcConfig = {}

npcConfig.name = internalNpcName
npcConfig.description = internalNpcName

npcConfig.health = 100
npcConfig.maxHealth = npcConfig.health
npcConfig.walkInterval = 2500
npcConfig.walkRadius = 2

npcConfig.outfit = {
	lookType = 1762,
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

	if MsgContains(message, "stranger") then
		npcHandler:say("<You outsider. But you may {help}.>", npc, creature)
		npcHandler:setTopic(playerId, 1)
	elseif MsgContains(message, "help") and npcHandler:getTopic(playerId) == 1 then
		npcHandler:say("<My people desperate. Invaders came. {Invaders} destroy!>", npc, creature)
		npcHandler:setTopic(playerId, 2)
	elseif MsgContains(message, "invaders") and npcHandler:getTopic(playerId) == 2 then
		npcHandler:say("<You go down! Destroy {leader} of invaders!>", npc, creature)
		npcHandler:setTopic(playerId, 3)
	elseif MsgContains(message, "leader") and npcHandler:getTopic(playerId) == 3 then
		npcHandler:say("<Before you go, prove {worth}!>", npc, creature)
		npcHandler:setTopic(playerId, 4)
	elseif MsgContains(message, "worth") and npcHandler:getTopic(playerId) == 4 then
		npcHandler:say("<You Go! You destroy Crimson Death Blossom!>", npc, creature)
		npcHandler:setTopic(playerId, 5)
	end

	return true
end

npcHandler:setMessage(MESSAGE_GREET, "<greets {stranger}>")
npcHandler:setMessage(MESSAGE_WALKAWAY, "<good bye, stranger>")
npcHandler:setMessage(MESSAGE_FAREWELL, "<good bye, stranger>")
npcHandler:setCallback(CALLBACK_MESSAGE_DEFAULT, creatureSayCallback)
npcHandler:addModule(FocusModule:new(), npcConfig.name, true, true, true)

npcType:register(npcConfig)
