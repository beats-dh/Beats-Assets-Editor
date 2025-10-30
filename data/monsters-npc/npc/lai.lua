local internalNpcName = "Lai"
local npcType = Game.createNpcType(internalNpcName)
local npcConfig = {}

npcConfig.name = internalNpcName
npcConfig.description = internalNpcName

npcConfig.health = 100
npcConfig.maxHealth = npcConfig.health
npcConfig.walkInterval = 2000
npcConfig.walkRadius = 2

npcConfig.outfit = {
	lookType = 1817,
	lookHead = 79,
	lookBody = 0,
	lookLegs = 60,
	lookFeet = 94,
	lookAddons = 2,
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

keywordHandler:addKeyword({ "job" }, StdModule.say, { npcHandler = npcHandler, text = { "I'm Lai, a {traveller} from far away." } })
keywordHandler:addKeyword({ "traveller" }, StdModule.say, { npcHandler = npcHandler, text = { "I came {here} on behalf of my {people}, to track down one of us, who has lost his {path}." } })
keywordHandler:addKeyword({ "here" }, StdModule.say, { npcHandler = npcHandler, text = { "From what I could learn, studying the surroundings, this place was once known as Azzilon, a {bastion} of the gods of light and good." } })
keywordHandler:addKeyword({ "bastion" }, StdModule.say, { npcHandler = npcHandler, text = { "It was inhabited, if not built, by a race of plant people, that were some of the gods champions back then.", "Before even fully manned, it came under siege by the forces of {evil} though." } })
keywordHandler:addKeyword({ "evil" }, StdModule.say, { npcHandler = npcHandler, text = { "Back then, aeons ago, the bulk of the forces of evil, consisted of a breed of demon-like beings, collectively known as inferniarchs." } })
keywordHandler:addKeyword({ "people" }, StdModule.say, { npcHandler = npcHandler, text = { "I am not allowed to talk about this topic.", "This amount of secrecy harrows me deeply but there are oaths and obligations that bind me.", "So all I can say is that I am deeply sorry, but that is something to be revealed on another day." } })
keywordHandler:addKeyword({ "path" }, StdModule.say, {
	npcHandler = npcHandler,
	text = {
		"This man was one of my people. Once one of our greatest minds, his answer to the problems we are facing has led him on a wrong and crooked path.",
		"... He had already done things that would have been unthinkable to him in the past.",
		"Yet only recently he went a step even further and allied himself with a despicable demon prince.",
		"... He lends the demons his power, special talents and {knowledge}.",
		"So equipped, with the gifts of an Enpa, there is no telling what darkness these demons will bring to this realm.",
	},
})
keywordHandler:addKeyword({ "prince" }, StdModule.say, { npcHandler = npcHandler, text = { "An ambitious demon prince, known as Arbaziloth has taken residence here, conducting his evil schemes." } })
keywordHandler:addKeyword({ "knowledge" }, StdModule.say, { npcHandler = npcHandler, text = { "He is able to manipulate certain energies, albeit in a twisted way that should be avoided at all {cost}." } })
keywordHandler:addKeyword({ "cost" }, StdModule.say, { npcHandler = npcHandler, text = { "By walking forbidden paths the renegade enabled the demons to extract the bound power of their ancient {ancestors}." } })
keywordHandler:addKeyword({ "demons" }, StdModule.say, { npcHandler = npcHandler, text = { "In ancient times, before the dawn of humanity, many races waged a war in the name of the so called gods of good.", "At this place was the last stand of one of those ancient races.", "... Eventually though they were overrun by what were the ancestors of the {demons} that you know." } })
keywordHandler:addKeyword({ "ancestors" }, StdModule.say, {
	npcHandler = npcHandler,
	text = {
		"The first demons, known as {inferniarchs}, were crude constructs of evil, merged and melted together with magic.",
		"Their magic was strong but bound to their bodies for all {eternity}.",
		"... You see, the modern demons, when they 'die', their bodies dissolve and the magic that held them together returns to the flows of magic that permeates this world.",
		"... Those ancient demons though were fused with their magic which is trapped in their dead bodies for all {eternity}.",
		"... That is until the renegade made his alliance with the demon {prince}.",
		"I don't know how the demons repaid his services but he used his powers to free the magic of the dead demons, so the demon prince could use it to strengthen himself and his legions.",
		"... Yet this tinkering had {unforeseen} effects.",
	},
})
keywordHandler:addKeyword(
	{ "unforeseen" },
	StdModule.say,
	{ npcHandler = npcHandler, text = { "In ancient times, before the dawn of humanity, many races waged a war in the name of the so called gods of good.", "At this place was the last stand of one of those ancient races.", "... The dead demon ancestors, bereft of their magic created a {disharmony} in their undecaying dead bodies and they have risen to a strange form of {unlife}." } }
)
keywordHandler:addKeyword({ "unlife" }, StdModule.say, { npcHandler = npcHandler, text = { "They are filled with a {hunger} that drives them, a hunger that can't be satiated, a hunger that turns them into mindless tools of destruction, controlled only by their eternal hunger." } })
keywordHandler:addKeyword({ "hunger" }, StdModule.say, { npcHandler = npcHandler, text = { "They hunger for something they lost. There is a great {disharmony} in their essence." } })
keywordHandler:addKeyword({ "disharmony" }, StdModule.say, { npcHandler = npcHandler, text = { "<sighs> There are things and concepts, I am not allowed to talk about. Those are topics for another day and another place." } })
keywordHandler:addKeyword({ "inferniarchs" }, StdModule.say, { npcHandler = npcHandler, text = { "They were the ancestors of the 'modern' demons. Corrupt creatures through and through, driven by blasphemic magic energy fused into their twisted forms." } })
keywordHandler:addKeyword(
	{ "energy" },
	StdModule.say,
	{ npcHandler = npcHandler, text = { "All the magic that gave them a resemblance of life, was fused into their forms for {eternity}. ...", "Unlike modern and evolved demons from back then, their {energy} would not diffuse back into the magic currents of the magic web, but be trapped into their forms for all eternity, be they alive or dead." } }
)
keywordHandler:addKeyword({ "eternity" }, StdModule.say, {
	npcHandler = npcHandler,
	text = {
		" So it seemed at least. Until recently that is. ...",
		" The fallen one, that I mentioned, used his {knowledge} in a twisted way to harvest said {energy} from the dead bodies that still littered this place of the epic siege aeons ago. ...",
		"In unspeakably twisting his powers, he managed to syphon the magical energies in a way, that made it possible for Arbaziloth's minions to refine and {weaponize} them. ...",
		"And even worse, his defilement of our tenets had unforeseen {consequences}.",
	},
})
keywordHandler:addKeyword(
	{ "weaponize" },
	StdModule.say,
	{ npcHandler = npcHandler, text = { "I am not entirely sure what the demons and Arbaziloth in particular are doing, but it's safe to assume that they have nothing good in mind. ...", "If humanity is lucky he might use the power to gain power amongst his own kin, yet that would be only some borrowed time until he sets his eyes on other goals." } }
)
keywordHandler:addKeyword({ "consequences" }, StdModule.say, {
	npcHandler = npcHandler,
	text = {
		"The dead, never decomposing corpses of the {inferniarchs}, bereft of the magic that once held them together, rose again. ...",
		"Yet, calling them simply undead would be imprecise in so many ways. There's an emptiness of unimaginable proportions within their bodies. ...",
		"It defies the rules of nature and harmony so much that it animates them in an echo of what they've once been. ...",
		"They are driven by an insatiable hunger for something they couldn't understand, even if they had some form of real conscience.",
	},
})
keywordHandler:addKeyword({ "talk" }, StdModule.say, { npcHandler = npcHandler, text = { "I came here on behalf of my {people} in the Blue Valley, to track down one of us, who has lost his {path}." } })

local function greetCallback(npc, creature)
	local player = Player(creature)
	local firstMission = player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission01)
	local secondMission = player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission02)
	local finalMission = player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission11)

	if firstMission == 1 and finalMission < 0 then
		npcHandler:setMessage(MESSAGE_GREET, "Ah, stranger. I can sense your importance for the harmony of this place. Let us {talk}")
		player:setStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission01, 2)
		return true
	elseif firstMission == 2 and finalMission < 0 then
		npcHandler:setMessage(MESSAGE_GREET, "Be greeted, seeker of knowledge! We should talk about your {mission}.")
		return true
	elseif finalMission == 2 then
		npcHandler:setMessage(MESSAGE_GREET, "Greetings, brave hero! Your courage and determination have freed this land from the vile prince's dark grasp. The balance is restored, thanks to your valor!")
		return true
	end
	return true
end

local function creatureSayCallback(npc, creature, type, message)
	local player = Player(creature)
	local playerId = player:getId()

	if not npcHandler:checkInteraction(npc, creature) then
		return false
	end

	-- Demonic Core Essence exchange
	if MsgContains(message, "demonic core essence") and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission02) == 1 then
		npcHandler:say({ "Do you have core essences to enhance my wards? {yes} or {no}" }, npc, creature)
		npcHandler:setTopic(playerId, 50)
	elseif MsgContains(message, "no") and npcHandler:getTopic(playerId) == 50 then
		npcHandler:say({ "That's understandable." }, npc, creature)
		npcHandler:setTopic(playerId, 0)
	elseif MsgContains(message, "yes") and npcHandler:getTopic(playerId) == 50 then
		npcHandler:say({ "How many core essences do you want to trade?" }, npc, creature)
		npcHandler:setTopic(playerId, 51) -- Topic 51 is exclusively for the delivery of Demonic Core Essences
	elseif tonumber(message) and npcHandler:getTopic(playerId) == 51 then
		local amount = tonumber(message)
		if amount and amount > 0 then
			if player:getItemCount(49909) >= amount then
				player:removeItem(49909, amount)
				player:setStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Access.DemonicCoreEssences, (player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Access.DemonicCoreEssences) or 0) + amount)
				player:setStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission03, player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Access.DemonicCoreEssences))
				if player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Access.DemonicCoreEssences) >= 1600 then
					player:setStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission02, 2)
					player:sendTextMessage(MESSAGE_EVENT_ADVANCE, "The mists in Azzilon have retreated!")
					-- unlock the 33837, 32349, 10 to be passed.
				end
				if player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Access.DemonicCoreEssences) >= 51200 then
					player:addAchievement("Tear the Toxic Veil")
				end
				player:getPosition():sendMagicEffect(CONST_ME_PURPLETELEPORT)
				npcHandler:say({ "We will make good use of this." }, npc, creature)
			else
				npcHandler:say({ "Sorry, you don't have that many core essences." }, npc, creature)
			end
		else
			npcHandler:say({ "Please provide the quantity as a numeric value." }, npc, creature)
		end
		npcHandler:setTopic(playerId, 0)
	-- Missions Transcriptions -- We should always check the storage before setting the value because players can talk to the NPC multiple times about the current mission
	elseif MsgContains(message, "mission") and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Access.DemonicCoreEssences) < 100 and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission01) == 2 then
		npcHandler:say({ "You have to gather the essences of the fallen demons. I might use it drive away the lethal mist and even provide you with some sort of protection from its lingering effects" }, npc, creature)
		if player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission02) == -1 then
			player:setStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission02, 1)
			player:setStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.QuestLine, 2)
		end
	elseif MsgContains(message, "mission") and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission02) >= 1 and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Access.DemonicCoreEssences) >= 100 and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission04) < 2 then
		npcHandler:say({
			"You have gathered the core essences. The more essences you gather, the more resilient against the demonic corruption you will become. ...",
			"You should be able to handle the essences on your own, without the need of delivering them to me. ...",
			"Anyway, you are now prepared to enter the depths of Azzilon. Yet you will have to activate the ancient crystals, in the towers of the fortifications. ...",
			"Start at the north-western tower and activate the others, before the north western crystal runs out of energy.",
		}, npc, creature, 3000)
		if player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission04) == -1 then
			player:setStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission04, 1)
			player:setStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.QuestLine, 4)
		end
	elseif MsgContains(message, "mission") and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission04) == 2 and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission05) < 2 then
		npcHandler:say(
			{ "You activated the warding crystals and the poisonous mists are retreating. ...", "While you were busy fighting the abominations that roam this place. I let my consciousness roam the depths. To my surprise I sensed an untainted soul, in great despair. ...", "Investigate the presence of someone in need, that i can sense in the first underground layer of Azzilon." },
			npc,
			creature,
			4000
		)
		if player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission05) == -1 then
			player:setStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission05, 1)
			player:setStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.QuestLine, 5)
		end
	elseif MsgContains(message, "mission") and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission06) == 2 and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission07) < 2 then
		npcHandler:say({ "You freed the prisioner, {Ortelio}. ...", "We already had a short talk but there is still much he can teach us about what he learned about his cruel captors. ..." }, npc, creature, 2000)
		if player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission07) == -1 then
			player:setStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission07, 1)
			player:setStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.QuestLine, 7)
		end
	elseif MsgContains(message, "ortelio") then
		npcHandler:say({ "I can sense that this man had suffered greatly and yet he didn't yield. This needed an impressive resolve. ...", "If this alone wouldn't make him a great ally already, the insights that he gained into the schemes of the demons in Azzilon are invaluable. Aside from that his unwavering determination to stop the demons is commendable too." }, npc, creature, 4000)
	elseif MsgContains(message, "vision") or MsgContains(message, "mission") and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission07) == 1 and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.QuestLine) == 7 then
		npcHandler:say({ "As i explained already, I am able to harmonize you with the essence of this place, to receive a vision of the past. Is that you want? {Yes} or {No}?" }, npc, creature)
		npcHandler:setTopic(playerId, 10) -- Topic to vision to the past teleport confirmation
	elseif MsgContains(message, "yes") and npcHandler:getTopic(playerId) == 10 then
		npcHandler:say({ "I will now harmonize you with the essence of this place. You will receive a vision of the past." }, npc, creature)
		player:teleportTo(Position(34063, 32374, 14))
		npcHandler:setTopic(playerId, 0)
	elseif MsgContains(message, "no") and npcHandler:getTopic(playerId) == 10 then
		npcHandler:say({ "Alright, perhaps another time then." }, npc, creature)
		npcHandler:setTopic(playerId, 0)
	elseif MsgContains(message, "mission") and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission07) == 2 and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission08) < 2 then
		npcHandler:say({ "You had a vision of what no longer is. I met the ancient presence too and share your knowledge. ...", "Please help Ortelio to free the troll slaves, so we can interrupt the demons operations on Azzilon." }, npc, creature, 2000)
		if player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission08) == -1 then
			player:setStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission08, 1)
			player:setStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.QuestLine, 8)
		end
	elseif MsgContains(message, "mission") and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission08) == 2 and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission09) < 2 then
		npcHandler:say({ "You freed enough of the trolls, to deal the demons a blow. Your next mission is to prevent Arbaziloth from gathering even more of the defiled energy. ...", "Meet Ortelio at the extraction chambers and interrupt their operation there too." }, npc, creature, 2000)
		if player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission09) == -1 then
			player:setStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission09, 1)
			player:setStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.QuestLine, 9)
		end
	elseif MsgContains(message, "mission") and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission09) == 2 and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission10) < 2 then
		npcHandler:say({ "You killed the imps. To get through Arbaziloth's final wards, you need to charge yourself with the stolen archaic energy. ...", "Please meet Ortelio and learn how to handle the energy that the demons are harvesting for their nefarious purposes." }, npc, creature, 2000)
		if player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission10) == -1 then
			player:setStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission10, 1)
			player:setStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.QuestLine, 10)
		end
	elseif MsgContains(message, "mission") and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission10) == 2 and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission11) < 2 then
		npcHandler:say({ "You fished the energy. You are now able to penetrate his wards. Now go down to Arbaziloth's lair and challenge the vile prince." }, npc, creature, 1000)
		if player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission11) == -1 then
			player:setStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission11, 1)
			player:setStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.QuestLine, 11)
		end
	elseif MsgContains(message, "mission") and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission11) == 2 and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.QuestLine) < 12 then
		npcHandler:say({ "You killed the prince. I have little to reward you, but take this set of armor that I found in the ruins as a token of my gratitude! May this outfit serve you well." }, npc, creature, 1000)
		if player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.QuestLine) < 12 then
			player:setStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.QuestLine, 12)
			player:addOutfitAddon(1808, 0) -- Fiend Slayer Female Outfit
			player:addOutfitAddon(1809, 0) -- Fiend Slayer Male Outfit
		end
	elseif MsgContains(message, "mission") and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission11) == 2 and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.QuestLine) == 12 then
		npcHandler:say({
			"Brave hero, you have done the unthinkable! The vile prince has been vanquished, and his dark grip over this land has been shattered. ...",
			"The ancient energies of this place, once twisted and corrupted, will now begin to flow freely once more, restoring balance and harmony. ...",
		}, npc, creature, 1000)
	end
	return true
end

-- Set to local function "greetCallback"
npcHandler:setCallback(CALLBACK_GREET, greetCallback)
-- Set to local function "creatureSayCallback"
npcHandler:setCallback(CALLBACK_MESSAGE_DEFAULT, creatureSayCallback)

npcHandler:setMessage(MESSAGE_FAREWELL, "Goodbye!")
npcHandler:setMessage(MESSAGE_WALKAWAY, "Bye then")

npcHandler:addModule(FocusModule:new(), npcConfig.name, true, true, true)

npcType:register(npcConfig)
