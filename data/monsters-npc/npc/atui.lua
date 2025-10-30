local internalNpcName = "Atui"
local npcType = Game.createNpcType(internalNpcName)
local npcConfig = {}

npcConfig.name = internalNpcName
npcConfig.description = internalNpcName

npcConfig.health = 100
npcConfig.maxHealth = npcConfig.health
npcConfig.walkInterval = 2500
npcConfig.walkRadius = 2

npcConfig.outfit = {
	lookType = 533,
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

	if MsgContains(message, "forsaken") then
		npcHandler:say("It's yet another place that has been tainted by the vile touch of Doctor {Marrow}!", npc, creature)
		npcHandler:setTopic(playerId, 1)
	elseif MsgContains(message, "marrow") and npcHandler:getTopic(playerId) == 1 then
		npcHandler:say("He somehow fused animals and humans into abominations like me! But I endured. I escaped! And I swore {revenge}!", npc, creature)
		npcHandler:setTopic(playerId, 2)
	elseif MsgContains(message, "revenge") and npcHandler:getTopic(playerId) == 2 then
		npcHandler:say("I managed to follow Marrow and his new Quara allies to this {thing} here.", npc, creature)
		npcHandler:setTopic(playerId, 3)
	elseif MsgContains(message, "thing") and npcHandler:getTopic(playerId) == 3 then
		npcHandler:say("It's a gigantic walking plant that Marrow somehow stumbled upon. While in hiding, I could even hear his nefarious {plans}!", npc, creature)
		npcHandler:setTopic(playerId, 4)
	elseif MsgContains(message, "plans") and npcHandler:getTopic(playerId) == 4 then
		npcHandler:say("You see, Marrow and his henchmen are here to {harvest} a precious resin from the plant. Only the gods know what he might need it for.", npc, creature)
		npcHandler:setTopic(playerId, 5)
	elseif MsgContains(message, "harvest") and npcHandler:getTopic(playerId) == 5 then
		npcHandler:say("Yes, they harvest the resin, which brought them in conflict with some native plant people. Yet while harvesting the resin, Marrow found out a horrible {detail}.", npc, creature)
		npcHandler:setTopic(playerId, 6)
	elseif MsgContains(message, "detail") and npcHandler:getTopic(playerId) == 6 then
		npcHandler:say("When they hurt certain plant veins, the giant plant reacts. Now he is misusing this fact, to make it walk towards the {mainland}.", npc, creature)
		npcHandler:setTopic(playerId, 7)
	elseif MsgContains(message, "mainland") and npcHandler:getTopic(playerId) == 7 then
		npcHandler:say("Marrow figured he'd not only harvest the plant for its resin, he would also use the monster to pay back the {society} that shunned him and his amoral ideas.", npc, creature)
		npcHandler:setTopic(playerId, 8)
	elseif MsgContains(message, "society") and npcHandler:getTopic(playerId) == 8 then
		npcHandler:say("He will use the plant monster as a weapon of mass destruction and to {devastate} whole cities!", npc, creature)
		npcHandler:setTopic(playerId, 9)
	elseif MsgContains(message, "devastate") and npcHandler:getTopic(playerId) == 9 then
		npcHandler:say({ "I have no clue what could stop the plant monster from the outside, BUT we can kill Marrow here and now. ...", "As soon as they stop harming the plant-thing it will probably get dormant again. So all we have to do, is to fight our way down to Marrow's lair {deep} down in the plant's stalk." }, npc, creature)
		npcHandler:setTopic(playerId, 10)
	elseif MsgContains(message, "deep") and npcHandler:getTopic(playerId) == 10 then
		npcHandler:say("We better go separate ways. I have my own, stealthy methods. You will somehow have to handle Marrow's minions and the {inhabitants} of the plant.", npc, creature)
		npcHandler:setTopic(playerId, 11)
	elseif MsgContains(message, "inhabitants") and npcHandler:getTopic(playerId) == 11 then
		npcHandler:say({ "There are some native species here. Some sentient plants and the usual giant insects, you know. ...", "The plant people are a strange lot, however. They revere the plant as their ancestor and its amber as sacred. I know because I {talked} to them!" }, npc, creature)
		npcHandler:setTopic(playerId, 12)
	elseif MsgContains(message, "talked") and npcHandler:getTopic(playerId) == 12 then
		npcHandler:say({ "Well they don't talk like we'd do! They somehow {communicate} directly from mind to mind. This only works for plantlife though, as far as I can tell. ...", "By chance, however, I found a way to communicate with them, so to speak." }, npc, creature)
		npcHandler:setTopic(playerId, 13)
	elseif MsgContains(message, "communicate") and npcHandler:getTopic(playerId) == 13 then
		npcHandler:say({ "Stranded here I was kind of desperate for food. I ate anything I could get. It gave me a bad stomach several times, I tell you.", "But the worst was the demon {root}, as I called it!" }, npc, creature)
		npcHandler:setTopic(playerId, 14)
	elseif MsgContains(message, "root") and npcHandler:getTopic(playerId) == 14 then
		npcHandler:say("As soon as you digest it, or rather try to, the thing will burrow its roots into your system! It will give you the {headache} of a lifetime!", npc, creature)
		npcHandler:setTopic(playerId, 15)
	elseif MsgContains(message, "headache") and npcHandler:getTopic(playerId) == 15 then
		npcHandler:say({ "Turned out, that's actually a good thing! That thing seems to be rather symbiotic. As the plant people told me, it will do me no harm.", "And after death I'd become the fertiliser for a neat little tree it seems! Not that I'd care when I'm dead. However the thing has a side {effect}." }, npc, creature)
		npcHandler:setTopic(playerId, 16)
	elseif MsgContains(message, "effect") and npcHandler:getTopic(playerId) == 16 then
		npcHandler:say("Remember those roots, that burrow into your brain? Well they allow the {priests} of the plant people to communicate with you. If they like to, that is.", npc, creature)
		npcHandler:setTopic(playerId, 17)
	elseif MsgContains(message, "priests") and npcHandler:getTopic(playerId) == 17 then
		npcHandler:say("Some of them are the only ones willing to interact with us! Without their {help} you probably won't make it to Marrow's lair.", npc, creature)
		npcHandler:setTopic(playerId, 18)
	elseif MsgContains(message, "help") and npcHandler:getTopic(playerId) == 18 then
		npcHandler:say({ "Yes, they might be of help, but first things first! You'll need a demon root and devour it. ...", "Luckily most plant creatures here might carry one around. They are rare but eventually you might loot one of them. Good luck." }, npc, creature)
		npcHandler:setTopic(playerId, 0)
	end
	return true
end

npcHandler:setMessage(MESSAGE_GREET, "Be greeted at this forsaken place!")
npcHandler:setMessage(MESSAGE_WALKAWAY, "Good bye, stranger!")
npcHandler:setMessage(MESSAGE_FAREWELL, "Good bye, stranger!")
npcHandler:setCallback(CALLBACK_MESSAGE_DEFAULT, creatureSayCallback)
npcHandler:addModule(FocusModule:new(), npcConfig.name, true, true, true)

npcType:register(npcConfig)
