local internalNpcName = "Ortelio"
local npcType = Game.createNpcType(internalNpcName)
local npcConfig = {}

npcConfig.name = internalNpcName
npcConfig.description = internalNpcName

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

local function greetCallback(npc, creature)
	local player = Player(creature)
	if player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission06) < 2 then
		player:setStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission05, 2)
		npcHandler:setMessage(MESSAGE_GREET, "Don't waste time. Get me {out}.")
	elseif player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission06) >= 2 and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission05) >= 2 then
		npcHandler:setMessage(MESSAGE_GREET, "Let's get out of here and leave!")
	end
	return true
end

local function creatureSayCallback(npc, creature, type, message)
	local player = Player(creature)
	local playerId = player:getId()

	if not npcHandler:checkInteraction(npc, creature) then
		return false
	end

	if MsgContains(message, "out") and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission05) == 2 and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.QuestLine) == 5 then
		npcHandler:say({ "Those demons imprisioned me and forced me to {work} for them. {Open} the door and let me out!" }, npc, creature)
		npcHandler:setTopic(playerId, 1)
	elseif MsgContains(message, "work") then
		npcHandler:say({ "They forced me to help them refine and {weaponize} the demonic essences, they are extracting here. ...", "I did my best to resist and gave them the bare minimum of assistance, which made me kind of 'expendable' and my execution seems imminent." }, npc, creature)
	elseif MsgContains(message, "weaponize") then
		npcHandler:say({ "This demon prince, {Arbaziloth} wants the bound energy of this {prehistoric} demons here to be at his disposal." }, npc, creature)
	elseif MsgContains(message, "prehistoric") then
		npcHandler:say({ "As far as I understand they were some of the first demons created, all their magic fused into their physical frames. ...", "Whereas in 'modern' demons the magic disperses into the world on their death, the magic of these proto-demons is bound to them {forever}." }, npc, creature)
	elseif MsgContains(message, "forever") then
		npcHandler:say({ "Well, at least the magic was bound, until someone taught {Arbaziloth} how to harness it. ...", "With the little side effect, that all the ancient demons came back to {unlife}." }, npc, creature)
	elseif MsgContains(message, "Arbaziloth") then
		npcHandler:say({
			"As far as I understand, he is a demon prince of some considerable power. Formerly he bade his time, slowly and carefully advancing his power. ...",
			"Some ominous rumours coursing amongst demonkind recently stirred him into activity though. ...",
			" It seems in a bid to seize an opportunity of which I have no knowledge, he agreed to some sort of unusual alliance. ...",
			" As far as I can tell this alliance granted him the knowledge or support to weaponize the residual energy of the slain ur-demons here. ...",
			"This power boost is supposed to alleviate his influence and rank amongst his kind.",
		}, npc, creature)
	elseif MsgContains(message, "unlife") then
		npcHandler:say({ "They are kind of {prehistoric}, undead demons now, driven by a hunger and madness, completely uncontrollable, hellbent on tearing apart anything in their path." }, npc, creature)
	elseif MsgContains(message, "open") and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.QuestLine) == 5 and npcHandler:getTopic(playerId) == 1 then
		npcHandler:say({ "The warden with the cells keys could be anywhere. ...", "However once he misplaced it and used a finger of one of those prehistoric demons to try to open. ...", "I suggest you get some of those fingers and try your luck too!" }, npc, creature, 3000)
		npcHandler:setTopic(playerId, 1)
		player:setStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission06, 1)
		player:setStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.QuestLine, 6)
	end
	return true
end

npcHandler:setCallback(CALLBACK_GREET, greetCallback)
npcHandler:setCallback(CALLBACK_MESSAGE_DEFAULT, creatureSayCallback)

npcHandler:setMessage(MESSAGE_FAREWELL, "Farewell.")
npcHandler:setMessage(MESSAGE_WALKAWAY, "Farewell.")

npcHandler:addModule(FocusModule:new(), npcConfig.name, true, true, true)

npcType:register(npcConfig)
