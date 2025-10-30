local internalNpcName = "A Vision of the Past"
local npcType = Game.createNpcType(internalNpcName)
local npcConfig = {}

npcConfig.name = internalNpcName
npcConfig.description = internalNpcName

npcConfig.health = 100
npcConfig.maxHealth = npcConfig.health
npcConfig.walkInterval = 2000
npcConfig.walkRadius = 2

npcConfig.outfit = {
	lookType = 1767,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
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

local function greetCallback(npc, creature)
	local player = Player(creature)
	if player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission07) == 1 then
		player:setStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission07, 2)
	end
	npcHandler:setMessage(MESSAGE_GREET, "Greetings {visitor}.")
	return true
end

local function creatureSayCallback(npc, creature, type, message)
	local player = Player(creature)
	local playerId = player:getId()

	if not npcHandler:checkInteraction(npc, creature) then
		return false
	end

	if MsgContains(message, "visitor") and npcHandler:getTopic(playerId) == 0 then
		npcHandler:say({ "The place you are visiting, is nothing but an {echo} of the past." }, npc, creature)
		npcHandler:setTopic(playerId, 1)
	elseif MsgContains(message, "echo") and npcHandler:getTopic(playerId) == 1 then
		npcHandler:say({ "This place and I are just {visions} of a long gone area." }, npc, creature)
		npcHandler:setTopic(playerId, 2)
	elseif MsgContains(message, "visions") and npcHandler:getTopic(playerId) == 2 then
		npcHandler:say({ "I am what is no longer alive. A mere {memory} stored in the walls of our fallen fortress." }, npc, creature)
		npcHandler:setTopic(playerId, 3)
	elseif MsgContains(message, "memory") and npcHandler:getTopic(playerId) == 3 then
		npcHandler:say({ "The last memory of a once proud {race}, wiped out in their war against the demons." }, npc, creature)
		npcHandler:setTopic(playerId, 4)
	elseif MsgContains(message, "race") and npcHandler:getTopic(playerId) == 4 then
		npcHandler:say({ "Once we were numerous. We seeded the world, that the gods entrusted us to protect. We became their champions and wardens in their {war}s against evil." }, npc, creature)
		npcHandler:setTopic(playerId, 5)
	elseif MsgContains(message, "war") and npcHandler:getTopic(playerId) == 5 then
		npcHandler:say({ "We fought in the name of the gods. We fought valiantly. We fought gloriously. Yet ultimately we {failed}." }, npc, creature)
		npcHandler:setTopic(playerId, 6)
	elseif MsgContains(message, "failed") and npcHandler:getTopic(playerId) == 6 then
		npcHandler:say({ "We were great soldiers, but not prepared for the fury of the inferniarchs. Even then, we were not {prepared} for Rotrender." }, npc, creature)
		npcHandler:setTopic(playerId, 7)
	elseif MsgContains(message, "prepared") and npcHandler:getTopic(playerId) == 7 then
		npcHandler:say({
			"We prepared for the great war to come. We planted the seeds for our future armies all over the world. A legion to behold would have risen, with the passing of the seasons. ...",
			"But before the seeds could {flourish}, the sheer number of demons and their ferocity overwhelmed us.",
		}, npc, creature, 3000)
		npcHandler:setTopic(playerId, 8)
	elseif MsgContains(message, "flourish") and npcHandler:getTopic(playerId) == 8 then
		npcHandler:say({
			"The legions were prepared to bloom, but without us to teach the next generation, our once proud race will fall into barbarism and {disarray}. ...",
			"Or already has, as we are only a faint memory without substance or identity now.",
		}, npc, creature, 3000)
		npcHandler:setTopic(playerId, 9)
	elseif MsgContains(message, "disarray") and npcHandler:getTopic(playerId) == 9 then
		npcHandler:say({
			"The fortress of Azzilon has fallen. Our race has perished. All our preparations were for naught. Even our {ultimate} weapon wasn't prepared to save us.",
		}, npc, creature)
		npcHandler:setTopic(playerId, 10)
	elseif MsgContains(message, "ultimate") and npcHandler:getTopic(playerId) == 10 then
		npcHandler:say({
			"We planted the seed for the ultimate weapon, safely hidden in the deepest depths of the high seas. If it had grown, it would have turned the tide of battle. But we underestimated {time}.",
		}, npc, creature)
		npcHandler:setTopic(playerId, 11)
	elseif MsgContains(message, "time") and npcHandler:getTopic(playerId) == 11 then
		npcHandler:say({
			"We thought in the dimensions of trees, time meant little to us. It was an ally at best. But time turned out to become our worst {enemy}.",
		}, npc, creature)
		npcHandler:setTopic(playerId, 12)
	elseif MsgContains(message, "enemy") and npcHandler:getTopic(playerId) == 12 then
		npcHandler:say({
			"Time had run out for us. We lost the next generations that we planted, and our folly {doomed} our civilization. Our best weapon was not even blossoming when the demons came. This doomed us all.",
		}, npc, creature)
		npcHandler:setTopic(playerId, 13)
	elseif MsgContains(message, "doomed") and npcHandler:getTopic(playerId) == 13 then
		npcHandler:say({
			"This echo is our last legacy, the legacy of a lost race. Let our fate be a reminder for others not to underestimate time. The things you seem to have in abundance may turn on you at some point. ...",
			"Never forget, that time is precious, even when you seem to have it in abundance.",
		}, npc, creature, 3000)
		npcHandler:setTopic(playerId, 0)
	elseif MsgContains(message, "rotrender") then
		npcHandler:say({
			"He was a massive inferniarch, the wildest and most despicable of them all. Where he walked, the ground was defiled and rot nested. His touch withered our bark and caused us to crumble. ...",
			"He became the scourge of Azzilon. Our doom. In the end, we lured him into a cave where some of our finest had merged with stone and earth. ...",
			"Their roots collapsed the cave over the fiend, crushing his poisonous body under masses of rock, ending its existence. ...",
			"But the damage had been done, our defences breached. The hordes of the inferniarchs were everywhere. We did not go out without a glorious battle, taking inferniarchs with us in droves. ...",
			"In the end they brought us down though. One by one the defenders fell and at some point even the victorious cackling of the remaining inferniarchs ceased and silence fell over Azzilon, to be forgotten by the world we fought for.",
		}, npc, creature, 3000)
		npcHandler:setTopic(playerId, 0)
	end
	return true
end

npcHandler:setCallback(CALLBACK_GREET, greetCallback)
-- Set to local function "creatureSayCallback"
npcHandler:setCallback(CALLBACK_MESSAGE_DEFAULT, creatureSayCallback)

npcHandler:setMessage(MESSAGE_FAREWELL, "Good bye, |PLAYERNAME|.")
npcHandler:setMessage(MESSAGE_WALKAWAY, "Good bye.")

npcHandler:addModule(FocusModule:new(), npcConfig.name, true, true, true)

npcType:register(npcConfig)
