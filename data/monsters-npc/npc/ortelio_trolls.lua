local internalNpcName = "Ortelio Trolls"
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
			"In this remote part of the complex, the demons house their enslaved trolls, that serve as the bulk of their workforce. ...",
			"We have to disrupt the demon's operations through freeing their {troll} slaves. Without their workers the demons would have to rely on themselves, severely hampering their operations and control here.",
		}, npc, creature, 2000)
	elseif MsgContains(message, "troll") then
		npcHandler:say({
			"The trolls are broken in body and spirit, lacking even the willpower to flee on their own. ...",
			"Yet if we could entice enough of them to flee, the horde mentality of the trolls will probably cause a mass breakout. ...",
			"Here we can turn the demons strategy against them! The demons feed the trolls with only the bare minimum, to keep them under control and break their {will}.",
		}, npc, creature, 2000)
	elseif MsgContains(message, "will") then
		npcHandler:say({
			"They don't think about escaping while hungry. If you feed them though, they will regain some spirit for a while and run for safety. ...",
			"Sure, trolls being trolls, once hungry again, they will probably trod back into captivity, so you will have to keep them fed until they make it to the entrance. ...",
			"There should be some kind of food dispenser in the slave dorm that the trolls are conditioned to be afraid of, so they won't use it on their own. ...",
			"You though can use the dispenser and supply them with the food they covet. Make enough of them flee and get out before a sizeable troop of wardens shows up. ...",
			"I estimate that the escape of around 20 trolls should cause sufficient disruption, potentially even leading to a mass rout. ...",
			"Just feed the trolls and don't forget you are on a time budget. Every second wasted brings the demons closer to finding out what we are up to.",
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
