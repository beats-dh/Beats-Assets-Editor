local internalNpcName = "Ortelio Fishing"
local npcType = Game.createNpcType(internalNpcName)
local npcConfig = {}

npcConfig.name = "Ortelio"
npcConfig.description = "Ortelio"

npcConfig.health = 100
npcConfig.maxHealth = npcConfig.health
npcConfig.walkInterval = 2000
npcConfig.walkRadius = 1

npcConfig.outfit = {
	lookType = 133,
	lookHead = 0,
	lookBody = 9,
	lookLegs = 0,
	lookFeet = 114,
	lookAddons = 0,
}

npcConfig.flags = {
	floorchange = false,
}

npcConfig.voices = {
	interval = 4000,
	chance = 50,
	{
		text = "<grumbles>",
	},
	{
		text = "I hope we'll be done with this soon.",
	},
	{
		text = "Hmmm...",
	},
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

	if MsgContains(message, "mission") then
		npcHandler:say({
			"We are now close to the cooling vats. Here the demons cool down spheres of their condensed stolen energy. ...",
			"As only demons can survive the energies ravaging the containment chambers, this place is one of the few where we can interfere with their tinkering. ...",
			"From here Arbaziloth himself is supplied with more and more energy. To breach the wards of his inner sanctum you have to infuse yourself with residual energy. ...",
			"You will need a fishing rod to get them out of the basins and charge yourself. Of course the imps working there won't be thrilled and attack you in the meantime. ...",
			"Any fished up sphere will immediately disperse and charge all of you with its energy. If you gained 25 charges you should be fine.",
		}, npc, creature, 2000)
	end
	return true
end

npcHandler:setCallback(CALLBACK_MESSAGE_DEFAULT, creatureSayCallback)

npcHandler:setMessage(MESSAGE_GREET, "Let's not waste time with chit chat, but continue with the {mission}!")
npcHandler:setMessage(MESSAGE_FAREWELL, "Farewell.")
npcHandler:setMessage(MESSAGE_WALKAWAY, "Bye then.")

npcHandler:addModule(FocusModule:new(), npcConfig.name, true, true, true)

npcType:register(npcConfig)
