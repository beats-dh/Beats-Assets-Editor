local npcType = Game.createNpcType("Bloodshade Rotten")
local npcConfig = {}

local npcName = "A Bloodshade"
npcConfig.name = npcName
npcConfig.description = npcName

npcConfig.health = 100
npcConfig.maxHealth = npcConfig.health
npcConfig.walkInterval = 0
npcConfig.walkRadius = 0

npcConfig.outfit = {
	lookType = 1414,
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

local function creatureSayCallback(npc, creature, type, message)
	local player = Player(creature)
	local playerId = player:getId()

	if not npcHandler:checkInteraction(npc, creature) then
		return false
	end

	local access = player:getStorageValue(Storage.Quest.U13_20.RottenBlood.RealmsAccess)
	local taint = player:kv():scoped("rotten-blood-quest"):get("taints") or 0

	message = message:lower()
	if MsgContains(message, "quest") then
		if access == 5 then
			npcHandler:say("What do you want? You already have started this quest. Otherwise.. I can smell the vileness on your soul, want to {reset} that?", npc, creature)
			npcHandler:setTopic(playerId, 0)
			return true
		end
		npcHandler:say({
			"First you must fight the two pairs of evil twins that lurk in the realm beyond here. ...",
			"Only when you are victorious over all four of them, your path to the source of vileness, the path to Bakragore will be opened. ...",
			"And even this victory will only be the beginning.",
		}, npc, creature)
		player:setStorageValue(Storage.Quest.U13_20.RottenBlood.RealmsAccess, 5)
	end
	if MsgContains(message, "blood god") then
		npcHandler:say({
			"The blood god's power has been corrupted and the spawn that festers in his former realms are a mockery of its grandeur. ...",
			"It has to be exterminated and the realm must be cleansed from the {festering} presence that came to dwell here!",
		}, npc, creature)
		npcHandler:setTopic(playerId, 1)
	end
	if MsgContains(message, "festering") and npcHandler:getTopic(playerId) >= 1 then
		npcHandler:say({
			"After the fall of the {blood god} unclean things arose from his carcass. They festered on his remaining {essence} and devoured it. Claimed to be his descendants, claimed to carry his legacy. ...",
			"But to me it soon became obvious these abominable spawns were just parasites, maggots that desecrated the legacy of a true {god}. They have to be stopped once and for all. ...",
			"Their rampant growth and spread is an anathema to the {blood god}. They are not his descendants, they are just rot that feeds upon divine {essence}.",
		}, npc, creature)
		npcHandler:setTopic(playerId, 2)
	end
	if MsgContains(message, "god") and npcHandler:getTopic(playerId) >= 2 then
		npcHandler:say("You are not worthy to learn of the blood gods teaching, neither to receive his {blessings}.", npc, creature)
		npcHandler:setTopic(playerId, 3)
	end
	if MsgContains(message, "blessings") and npcHandler:getTopic(playerId) >= 3 then
		npcHandler:say("Your body and your mind are not prepared to receive the blessings of the {blood god}.", npc, creature)
		npcHandler:setTopic(playerId, 4)
	end
	if MsgContains(message, "essence") and npcHandler:getTopic(playerId) >= 2 then
		npcHandler:say({
			"We all could constantly feel the presence of our god in our very own blood. Then, all of a sudden, his presence ceased to be, the connection was lost. ...",
			"For sure our lord has been slain by envious gods! But blood and slaughter are eternal. There is no end that can't be overcome by universal principle. He who has been slain will rise in slaughter once the time has come! ...",
			"However, first the cleansing of this place has to occur!",
		}, npc, creature)
		npcHandler:setTopic(playerId, 0)
	end
	if MsgContains(message, "reset") then
		npcHandler:say("You want to reset your {regular} taints or the {powerful} taint?", npc, creature)
		npcHandler:setTopic(playerId, 1)
	end
	if MsgContains(message, "regular") and npcHandler:getTopic(playerId) == 1 then
		if taint == 0 or taint == 5 then
			npcHandler:say("You are not suffering from any regular taint, mortal!", npc, creature)
			npcHandler:setTopic(playerId, 0)
			return true
		elseif taint > 0 and taint <= 4 then -- If only have the regular taints
			local iconValue = RottenBlood.taintIconMap[taint] or taint
			player:setBakragoreTaint(0, true)
			player:removeIcon("rotten-blood-taint-level")
		elseif taint > 5 and taint <= 9 then -- if have the powerful taint and regular taints
			if taint ~= 5 then
				local iconValue = RottenBlood.taintIconMap[taint] or taint
				player:setIcon("rotten-blood-taint-level", CreatureIconCategory_Quests, 22, iconValue)
			end
			player:setBakragoreTaint(5, true)
			player:removeIcon("rotten-blood-taint-level")
		end
		npcHandler:setTopic(playerId, 0)
		npcHandler:say("So be it! You have removed the taint of the two pair of evil twins from your soul.", npc, creature)
		return true
	end

	if MsgContains(message, "powerful") and npcHandler:getTopic(playerId) == 1 then
		if taint < 5 then -- If do not have the powerful taint
			npcHandler:say("You are not suffering from the Bakragore taint, mortal!", npc, creature)
			npcHandler:setTopic(playerId, 0)
			return true
		end

		local iconValue = RottenBlood.taintIconMap[taint] or taint

		-- Should remove the powerful taint icon, but keep the regular taint
		if taint == 5 then
			player:setBakragoreTaint(0, true)
			player:removeIcon("rotten-blood-taint-level")
		elseif taint == 6 then
			player:setBakragoreTaint(1, true)
			player:setIcon("rotten-blood-taint-level", CreatureIconCategory_Quests, 22, iconValue)
		elseif taint == 7 then
			player:setBakragoreTaint(2, true)
			player:setIcon("rotten-blood-taint-level", CreatureIconCategory_Quests, 22, iconValue)
		elseif taint == 8 then
			player:setBakragoreTaint(3, true)
			player:setIcon("rotten-blood-taint-level", CreatureIconCategory_Quests, 22, iconValue)
		elseif taint == 9 then
			player:setBakragoreTaint(4, true)
			player:setIcon("rotten-blood-taint-level", CreatureIconCategory_Quests, 22, iconValue)
		end
		npcHandler:say("So be it, you have removed the Bakragore taint from your soul.", npc, creature)
		npcHandler:setTopic(playerId, 0)
		return true
	end

	return true
end

npcHandler:setMessage(MESSAGE_GREET, "Mortal! If you are on a {quest} to serve the blood god, my master - be greeted!")
npcHandler:setMessage(MESSAGE_WALKAWAY, "Bye.")
npcHandler:setMessage(MESSAGE_FAREWELL, "Bye, |PLAYERNAME|.")

npcHandler:setCallback(CALLBACK_MESSAGE_DEFAULT, creatureSayCallback)
npcHandler:addModule(FocusModule:new(), npcConfig.name, true, true, true)

npcType:register(npcConfig)
