local internalNpcName = "Ortelio Imp"
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
			"In this complex the demons transfer the energy they stole to a refinement apparatus. As Arbaziloth isn't a considerate master, he uses the most easy and dirty way to transfers the energy. ...",
			"He first pumps it into one of his hapless imp minions and then lets them walk up to the extractor which will absorb the energy and annihilate the imp carrier. ...",
			"The way we will interrupt this process is as efficient as it is brutal: kill any charged imp that show up, before it manages to reach the extractor. Be careful though, those little nasties probably have some kind of protection. ...",
			"If the {processor} isn't fed enough energy over a period of time, it's exhaust vents will become blocked and without someone of my skill, it will take the demons weeks, if not months to repair them. ...",
			"Killing about 25 charged imps, in the time you're given, should do the trick.",
		}, npc, creature, 2000)
	elseif MsgContains(message, "processor") then
		npcHandler:say({
			"*Sighs* Admittedly they forced me to build this machine. I really tried to resist but in the end I caved in. ..",
			"But not without implementing some backdoor to sabotage them. That the exhaust vents get blocked at all is by my design. By helping you I try my best to redeem myself further in my own conscience. ",
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
