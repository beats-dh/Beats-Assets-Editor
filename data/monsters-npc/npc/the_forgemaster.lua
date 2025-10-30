local internalNpcName = "The Forgemaster"
local npcType = Game.createNpcType(internalNpcName)
local npcConfig = {}

npcConfig.name = internalNpcName
npcConfig.description = internalNpcName

npcConfig.health = 100
npcConfig.maxHealth = npcConfig.health
npcConfig.walkInterval = 2000
npcConfig.walkRadius = 2

npcConfig.outfit = {
	lookType = 247,
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

npcHandler:addModule(FocusModule:new(), npcConfig.name, true, true, true)

local weaponCraft = {
	melee = {
		axe = {
			onehanded = {
				name = "Inferniarch Battleaxe",
				baseId = 49523,
				versions = {
					["critical"] = 49864,
					["life leech"] = 49865,
					["mana leech"] = 49866,
				},
			},
			twohanded = {
				name = "Inferniarch Greataxe",
				baseId = 49524,
				versions = {
					["critical"] = 49867,
					["life leech"] = 49868,
					["mana leech"] = 49869,
				},
			},
		},
		sword = {
			onehanded = {
				name = "Inferniarch Blade",
				baseId = 49527,
				versions = {
					["critical"] = 49876,
					["life leech"] = 49877,
					["mana leech"] = 49878,
				},
			},
			twohanded = {
				name = "Inferniarch Slayer",
				baseId = 49530,
				versions = {
					["critical"] = 49880,
					["life leech"] = 49879,
					["mana leech"] = 49881,
				},
			},
		},
		club = {
			onehanded = {
				name = "Inferniarch Flail",
				baseId = 49525,
				versions = {
					["critical"] = 49870,
					["life leech"] = 49871,
					["mana leech"] = 49872,
				},
			},
			twohanded = {
				name = "Inferniarch Warhammer",
				baseId = 49526,
				versions = {
					["critical"] = 49873,
					["life leech"] = 49874,
					["mana leech"] = 49875,
				},
			},
		},
	},
	ranged = {
		crossbow = {
			name = "Inferniarch Arbalest",
			baseId = 49522,
			versions = {
				["critical"] = 49861,
				["life leech"] = 49862,
				["mana leech"] = 49863,
			},
		},
		bow = {
			name = "Inferniarch Bow",
			baseId = 49520,
			versions = {
				["critical"] = 49858,
				["life leech"] = 49859,
				["mana leech"] = 49860,
			},
		},
	},
	magic = {
		rod = {
			name = "Inferniarch Rod",
			baseId = 49529,
			versions = {
				["critical"] = 49885,
				["life leech"] = 49886,
				["mana leech"] = 49887,
			},
		},
		wand = {
			name = "Inferniarch Wand",
			baseId = 49528,
			versions = {
				["critical"] = 49882,
				["life leech"] = 49883,
				["mana leech"] = 49884,
			},
		},
	},
}

local forgingRequirements = {
	["critical"] = {
		{ itemId = 22728, amount = 100, name = "Vexclaw Talons" },
		{ itemId = 49894, amount = 500, name = "Demonic Matter" },
		{ itemId = 5954, amount = 750, name = "Demonic Horns" },
		{ itemId = 6499, amount = 350, name = "Demonic Essences" },
		{ itemId = 6558, amount = 350, name = "Flask of Demonic Blood" },
		{ itemId = 12541, amount = 1, name = "Demonic Finger" },
		{ itemId = 49892, amount = 1, name = "Skin of Gralvalon" },
	},
	["life leech"] = {
		{ itemId = 9663, amount = 100, name = "Pieces of Dead Brain" },
		{ itemId = 49894, amount = 500, name = "Demonic Matter" },
		{ itemId = 6558, amount = 750, name = "Flask of Demonic Blood" },
		{ itemId = 5906, amount = 50, name = "Demon Dust" },
		{ itemId = 49893, amount = 1, name = "Skin of Malvaroth" },
	},
	["mana leech"] = {
		{ itemId = 22730, amount = 100, name = "Grimeleech Wings" },
		{ itemId = 49894, amount = 500, name = "Demonic Matter" },
		{ itemId = 6499, amount = 750, name = "Demonic Essences" },
		{ itemId = 9647, amount = 200, name = "Demonic Skeletal Hands" },
		{ itemId = 49891, amount = 1, name = "Skin of Twisterror" },
	},
}

local conversationData = {}

local function resetConversation(player)
	conversationData[player:getId()] = nil
	npcHandler:setTopic(player:getId(), 0)
end

local function buildRequirementsMessage(forgeType)
	local reqs = forgingRequirements[forgeType]
	local parts = {}
	for _, req in ipairs(reqs) do
		table.insert(parts, req.amount .. " " .. req.name)
	end
	return table.concat(parts, ", ")
end

local function hasRequirements(player, weaponInfo, forgeType)
	if player:getItemCount(weaponInfo.baseId) < 1 then
		return false, weaponInfo.name
	end

	for _, req in ipairs(forgingRequirements[forgeType]) do
		if player:getItemCount(req.itemId) < req.amount then
			return false, req.name
		end
	end
	return true
end

local function consumeRequirements(player, weaponInfo, forgeType)
	player:removeItem(weaponInfo.baseId, 1)
	for _, req in ipairs(forgingRequirements[forgeType]) do
		player:removeItem(req.itemId, req.amount)
	end
end

local function giveForgedWeapon(player, weaponInfo, forgeType)
	local forgedId = weaponInfo.versions[forgeType]
	if forgedId then
		player:addItem(forgedId, 1)
	else
		return
	end
end

local function creatureSayCallback(npc, player, type, message)
	local msg = message:lower()
	local playerId = player:getId()
	local topic = npcHandler:getTopic(playerId)

	if MsgContains(message, "useful") then
		npcHandler:say({ "I'm the forgemaster, that's what they call me. Do you want to {craft} a craft a weapon in the {forge}?" }, npc, player, 1000)
	end

	-- ?? Missing "forge" keyword transcription

	if MsgContains(message, "key") then -- Reward Room Access
		if player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Access.ArbazilothHardModeKills) >= 10 then
			npcHandler:say({ "I better warn you about my former master's magical wards. You can pick only one of my early prototypes from Arbaziloth's private weapon chamber each thousand years. So choose wisely, ok? Here's the key.", "Of course you still might want to {craft} a weapon?" }, npc, player, 2500)
			if player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Access.ArbazilothRewardRoom) == -1 then
				player:setStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Access.ArbazilothRewardRoom, 1)
			end
		elseif player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Access.ArbazilothHardModeKills) < 10 then
			npcHandler:say(
				{ "Yes, yes, I understand you are interested in Arbaziloth's private weapon collection. ....", "I ... uh ... just need some more time to retrieve the key. Perhaps after some more visits here, I'll be able to find it, oh slayer of many.", "Your battle prowess is truly frightening <gulp>. But ... imagine, I JUST recovered the lost key to Arbaziloth's private weapon chamber." },
				npc,
				player,
				3000
			)
		end
	end

	if MsgContains(message, "craft") and topic == 0 then
		conversationData[playerId] = {}
		npcHandler:setTopic(playerId, 1)
		npcHandler:say({ "If you have the ingredients, I can channel the ancient demonic power into {sword}s, {axe}s, {club}s, {bow}s, {crossbow}s, {wand}s and {rod}s.", "But please know that this is only possible for unfused equipment that has not been treated at the Exaltation Forge." }, npc, player, 1000)
		return true
	end
	if topic == 1 then
		if MsgContains(message, "axe") then
			conversationData[playerId].weaponCategory = "axe"
			conversationData[playerId].isMelee = true
			npcHandler:setTopic(playerId, 2)
			npcHandler:say("{one handed} or {two handed}?", npc, player)
		elseif MsgContains(message, "sword") then
			conversationData[playerId].weaponCategory = "sword"
			conversationData[playerId].isMelee = true
			npcHandler:setTopic(playerId, 2)
			npcHandler:say("{one handed} or {two handed}?", npc, player)
		elseif MsgContains(message, "club") then
			conversationData[playerId].weaponCategory = "club"
			conversationData[playerId].isMelee = true
			npcHandler:setTopic(playerId, 2)
			npcHandler:say("{one handed} or {two handed}?", npc, player)
		elseif MsgContains(message, "crossbow") then
			conversationData[playerId].weapon = weaponCraft.ranged.crossbow
			conversationData[playerId].isMelee = false
			npcHandler:setTopic(playerId, 3)
			npcHandler:say("Do you want to craft " .. conversationData[playerId].weapon.name:lower() .. " that is destined to deal critical hits, steal the life force of your enemies or absorb the mana of your foes?", npc, player)
		elseif MsgContains(message, "bow") then
			conversationData[playerId].weapon = weaponCraft.ranged.bow
			conversationData[playerId].isMelee = false
			npcHandler:setTopic(playerId, 3)
			npcHandler:say("Do you want to craft " .. conversationData[playerId].weapon.name:lower() .. " that is destined to deal critical hits, steal the life force of your enemies or absorb the mana of your foes?", npc, player)
		elseif MsgContains(message, "rod") then
			conversationData[playerId].weapon = weaponCraft.magic.rod
			conversationData[playerId].isMelee = false
			npcHandler:setTopic(playerId, 3)
			npcHandler:say("Do you want to craft " .. conversationData[playerId].weapon.name:lower() .. " that is destined to deal critical hits, steal the life force of your enemies or absorb the mana of your foes?", npc, player)
		elseif MsgContains(message, "wand") then
			conversationData[playerId].weapon = weaponCraft.magic.wand
			conversationData[playerId].isMelee = false
			npcHandler:setTopic(playerId, 3)
			npcHandler:say("Do you want to craft " .. conversationData[playerId].weapon.name:lower() .. " that is destined to deal critical hits, steal the life force of your enemies or absorb the mana of your foes?", npc, player)
		else
			local validWeapons = { "axe", "sword", "club", "crossbow", "bow", "rod", "wand" }
			npcHandler:say("Please specify a valid weapon type. Options: {" .. table.concat(validWeapons, "}, {") .. "}.", npc, player)
		end
	end

	if topic == 2 then
		if MsgContains(message, "one handed") or MsgContains(message, "onehanded") then
			conversationData[playerId].handed = "onehanded"
		elseif MsgContains(message, "two handed") or MsgContains(message, "twohanded") then
			conversationData[playerId].handed = "twohanded"
		else
			npcHandler:say("Please answer {one handed} or {two handed}.", npc, player)
		end
		local cat = conversationData[playerId].weaponCategory
		conversationData[playerId].weapon = weaponCraft.melee[cat][conversationData[playerId].handed]
		npcHandler:setTopic(playerId, 3)
		npcHandler:say("Do you want to craft " .. conversationData[playerId].weapon.name:lower() .. " that is destined to deal critical hits, steal the life force of your enemies or absorb the mana of your foes?", npc, player)
	end

	if topic == 3 then
		if MsgContains(message, "critical") or MsgContains(message, "life leech") or MsgContains(message, "mana leech") then
			conversationData[playerId].forgeType = msg
			npcHandler:setTopic(playerId, 4)
			local reqMsg = buildRequirementsMessage(msg)
			npcHandler:say("In this case, you will need to spend the base version of your weapon, " .. reqMsg .. ". Do you want to proceed, {yes} or {no}?", npc, player)
		else
			npcHandler:say("The ancient powers are vast, but you must choose wisely. Will it be {critical} strikes, {life leech} to drain your foes, or {mana leech} to absorb the mana of your foes?", npc, player)
		end
	end

	if topic == 4 then
		if MsgContains(message, "yes") then
			local weaponInfo = conversationData[playerId].weapon
			local forgeType = conversationData[playerId].forgeType
			local hasReq, missing = hasRequirements(player, weaponInfo, forgeType)
			if hasReq then
				consumeRequirements(player, weaponInfo, forgeType)
				giveForgedWeapon(player, weaponInfo, forgeType)
				npcHandler:say("Here you go.", npc, player)
			else
				npcHandler:say("The ancient powers whisper that you lack the required item: " .. missing .. ".", npc, player)
			end
			resetConversation(player)
		elseif MsgContains(message, "no") then
			npcHandler:say("Maybe another time then.", npc, player)
			resetConversation(player)
		else
			npcHandler:say("The ancient powers require a clear answer. Please respond with {yes} or {no}.", npc, player)
		end
	end
	return true
end

local function greetCallback(npc, creature)
	local player = Player(creature)
	if player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission11) == 2 and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.QuestLine) < 12 then
		npcHandler:setMessage(MESSAGE_GREET, "Don't hurt me! I surrender to your superiority! I can be {useful} to you as the new alpha here!")
		return true
	elseif player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.Missions.Mission11) == 2 and player:getStorageValue(Storage.Quest.U14_10.NoRestForTheWicked.QuestLine) == 12 then
		npcHandler:setMessage(MESSAGE_GREET, "What brings you here this time, do you want to {craft} a weapon in the forge?")
		return true
	end
	return true
end

npcHandler:setCallback(CALLBACK_GREET, greetCallback)
npcHandler:setCallback(CALLBACK_MESSAGE_DEFAULT, creatureSayCallback)
npcHandler:addModule(FocusModule:new(), npcConfig.name, true, true, true)

npcType:register(npcConfig)
