local internalNpcName = "Fernlor"
local npcType = Game.createNpcType(internalNpcName)
local npcConfig = {}

npcConfig.name = internalNpcName
npcConfig.description = internalNpcName

npcConfig.health = 100
npcConfig.maxHealth = npcConfig.health
npcConfig.walkInterval = 2000
npcConfig.walkRadius = 2

npcConfig.outfit = {
	lookType = 1642,
	lookHead = 38,
	lookBody = 94,
	lookLegs = 79,
	lookFeet = 105,
	lookAddons = 0,
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

local function creatureSayCallback(npc, creature, type, message)
	local player = Player(creature)
	local playerId = player:getId()

	if not npcHandler:checkInteraction(npc, creature) then
		return false
	end
	if MsgContains(message, "help") then
		npcHandler:say("As the High Scryer of the Arcane Academy, my arcane devices allow me to continuously {monitor} the magical aether for traces of disturbances.", npc, creature)
		npcHandler:setTopic(playerId, 1)
	elseif MsgContains(message, "monitor") and npcHandler:getTopic(playerId) == 1 then
		npcHandler:say({
			"I constantly scan the magical aether for any trace of {anomalies}. ...",
			"Usually, my findings are just of academic importance, but recently I stumbled over spikes far beyond the normal and usual scale.",
		}, npc, creature, 1500)
		npcHandler:setTopic(playerId, 2)
	elseif MsgContains(message, "anomalies") and npcHandler:getTopic(playerId) == 2 then
		npcHandler:say({
			"I found a recent disturbance at some remote, uncharted isle far away in the east. This disturbance has to be investigated! ...",
			"Uhm, yet I am no way an adventurer and hold my prestigious position in the academy not for taking risky chances. This is where you enter the {picture}.",
		}, npc, creature, 1500)
		npcHandler:setTopic(playerId, 3)
	elseif MsgContains(message, "picture") and npcHandler:getTopic(playerId) == 3 then
		npcHandler:say({
			"As far as the people here are concerned you are some kind of hero. And even better, you often work for free! Which, I must say, really helps, given the limited resources allocated to my operation. ...",
			"I need someone with your skill set to find out what's going on there. Are you up to it? {yes} or {no}?",
		}, npc, creature, 1500)
		npcHandler:setTopic(playerId, 4)
	elseif MsgContains(message, "no") and npcHandler:getTopic(playerId) == 4 then
		npcHandler:say("Very well, perhaps another time. I have much research to conduct regarding these anomalies.", npc, creature, 1500)
		npcHandler:setTopic(playerId, 0)
	elseif MsgContains(message, "yes") and npcHandler:getTopic(playerId) == 4 then
		npcHandler:say({
			"Excellent! My first probes suggest you probably won't die by environmental hazards on arrival. ...",
			"To summarize things: I found a recent disturbance at some remote, uncharted isle in the east. I established a teleport connection to that place. ...",
			"I am a researcher, not an explorer though so it needs someone with your unique and proven talent to find out what's going on there. Take the teleporter over there!",
		}, npc, creature, 1500)
		npcHandler:setTopic(playerId, 0)
		player:setStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.QuestLine, 1)
		player:setStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission01, 1)
	elseif MsgContains(message, "mission") then
		if player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission01) < 2 then
			npcHandler:say("Well it seems you aren't any wiser about what is causing these disturbances.", npc, creature)
			npcHandler:setTopic(playerId, 0)
			return true
		elseif player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission01) == 2 then
			npcHandler:say({
				"Your reports are disturbing, to say the least. Whatever is going on there is way above my pay-grade. Uh, I am confident though, with you this issue is in trusty hands.",
			}, npc, creature, 1500)
			npcHandler:setTopic(playerId, 0)
		end
	end
	return true
end

local function greetCallback(npc, creature)
	local player = Player(creature)
	local missionStorage = player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission01)

	if missionStorage ~= -1 then
		npcHandler:setMessage(MESSAGE_GREET, "Ah, yes, you are on a {mission} for me.")
	else
		npcHandler:setMessage(MESSAGE_GREET, " I am the High Scryer of the Arcane Academy. I need your {help} on a mission to investigate an anomaly that I discovered.")
	end

	return true
end

npcHandler:setCallback(CALLBACK_GREET, greetCallback)

npcHandler:setCallback(CALLBACK_MESSAGE_DEFAULT, creatureSayCallback)

npcHandler:addModule(FocusModule:new(), npcConfig.name, true, true, true)

-- npcType registering the npcConfig table
npcType:register(npcConfig)
