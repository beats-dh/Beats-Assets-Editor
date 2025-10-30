local internalNpcName = "Lorek"
local npcType = Game.createNpcType(internalNpcName)
local npcConfig = {}

npcConfig.name = internalNpcName
npcConfig.description = internalNpcName

npcConfig.health = 100
npcConfig.maxHealth = npcConfig.health
npcConfig.walkInterval = 2000
npcConfig.walkRadius = 2

npcConfig.outfit = {
	lookType = 132,
	lookHead = 19,
	lookBody = 10,
	lookLegs = 38,
	lookFeet = 95,
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

-- Travel
local function addTravelKeyword(keyword, text, cost, destination, condition)
	local parameters = {
		npcHandler = npcHandler,
		premium = false,
		cost = cost,
		destination = destination,
		text = "Do you seek a passage to " .. (text or keyword:titleCase()) .. " for |TRAVELCOST|?",
	}

	local travelKeyword = keywordHandler:addKeyword({ keyword }, function(npc, player, message, keywords, parameters)
		if condition and (not player.getPawAndFurRank or player:getPawAndFurRank() < 3) then
			npcHandler:say("I'm sorry, but only members of 'Paw and Fur' may travel there.", npc, player)
			return true
		end

		return StdModule.say(npc, player, message, keywords, parameters)
	end, parameters)

	travelKeyword:addChildKeyword({ "yes" }, StdModule.travel, {
		npcHandler = npcHandler,
		premium = false,
		cost = cost,
		destination = destination,
	})

	travelKeyword:addChildKeyword({ "no" }, StdModule.say, {
		npcHandler = npcHandler,
		text = "Maybe another time.",
		reset = true,
	})
end

addTravelKeyword("west", "the west end of Port Hope", 7, Position(32558, 32780, 7))
addTravelKeyword("centre", "the centre of Port Hope", 7, Position(32628, 32771, 7))
addTravelKeyword("darama", nil, 30, Position(32987, 32729, 7))
addTravelKeyword("center", "the centre of Port Hope", 0, Position(32628, 32771, 7))
addTravelKeyword("chor", nil, 30, Position(32968, 32799, 7), true)
addTravelKeyword("banuta", nil, 30, Position(32826, 32631, 7), true)
addTravelKeyword("mountain", nil, 30, Position(32987, 32729, 7), true)
addTravelKeyword("mountain pass", nil, 30, Position(32987, 32729, 7), true)
-- Basic
keywordHandler:addKeyword({ "ferumbras" }, StdModule.say, { npcHandler = npcHandler, text = "I heard he is some scary magician or so." })
keywordHandler:addKeyword({ "passage" }, function(npc, player)
	if player.getPawAndFurRank and player:getPawAndFurRank() >= 3 then
		npcHandler:say("Ahh, you are a member of 'Paw and Fur'. I can bring you either to the centre of Port Hope, to the west end of the town, to Banuta, to Chor or to the mountain pass to Darama. Where would you like to go?", npc, player)
	else
		npcHandler:say("I can bring you either to the centre of Port Hope or to the west end of the town, where would you like to go?", npc, player)
	end
	return true
end)

npcHandler:addModule(FocusModule:new(), npcConfig.name, true, true, true)

-- npcType registering the npcConfig table
npcType:register(npcConfig)
