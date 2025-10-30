local mType = Game.createMonsterType("Bakragore")
local monster = {}

monster.description = "Bakragore"
monster.experience = 15000000
monster.outfit = {
	lookType = 1671,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.events = {
	"RottenBloodBakragoreDeath",
}

monster.bosstiary = {
	bossRaceId = 2367,
	bossRace = RARITY_NEMESIS,
}

monster.health = 660000
monster.maxHealth = 660000
monster.race = "undead"
monster.corpse = 44012
monster.speed = 250
monster.manaCost = 0

monster.changeTarget = {
	interval = 10000,
	chance = 20,
}

monster.strategiesTarget = {
	nearest = 70,
	health = 10,
	damage = 10,
	random = 10,
}

monster.flags = {
	summonable = false,
	attackable = true,
	hostile = true,
	convinceable = false,
	pushable = false,
	boss = true,
	rewardBoss = true,
	illusionable = false,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 98,
	targetDistance = 1,
	runHealth = 0,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = true,
	canWalkOnFire = true,
	canWalkOnPoison = true,
}

monster.light = {
	level = 0,
	color = 0,
}

monster.summon = {}

monster.voices = {
	interval = 5000,
	chance = 10,
	{ text = "Light ... darkens!", yell = false },
	{ text = "Light .. the ... darkness!", yell = false },
	{ text = "Darkness ... is ... light!", yell = false },
	{ text = "WILL ... PUNISH ... YOU!", yell = false },
	{ text = "RAAAR!", yell = false },
}

monster.loot = {
	{ id = 23373, chance = 70000, maxCount = 198 }, -- ultimate mana potion
	{ id = 3043, chance = 70000, maxCount = 168 }, -- crystal coin
	{ id = 32623, chance = 11667, maxCount = 6 }, -- giant topaz
	{ id = 23374, chance = 11667, maxCount = 200 }, -- ultimate spirit potion
	{ id = 32622, chance = 11667, maxCount = 4 }, -- giant amethyst
	{ id = 44048, chance = 525 }, -- spiritual horseshoe
	{ id = 7440, chance = 23333, maxCount = 23 }, -- mastermind potion
	{ id = 3037, chance = 5133, maxCount = 9 }, -- yellow gem
	{ id = 3036, chance = 5133, maxCount = 8 }, -- violet gem
	{ id = 30059, chance = 5133, maxCount = 6 }, -- giant ruby
	{ id = 30061, chance = 5133, maxCount = 6 }, -- giant sapphire
	{ id = 3039, chance = 5133, maxCount = 3 }, -- red gem
	{ id = 43948, chance = 486 }, -- revised promotion scroll
	{ id = 43962, chance = 2415 }, -- putrefactive figurine
	{ id = 43963, chance = 3115 }, -- figurine of bakragore
	{ id = 43949, chance = 416 }, -- extended promotion scroll
	{ id = 30053, chance = 4551 }, -- dragon figurine
	{ id = 43961, chance = 2415 }, -- darklight figurine
	{ id = 7443, chance = 3500, maxCount = 28 }, -- bullseye potion
	{ id = 3041, chance = 3500, maxCount = 9 }, -- blue gem
	{ id = 7439, chance = 3500, maxCount = 81 }, -- berserk potion
	{ id = 43947, chance = 556 }, -- basic promotion scroll
	{ id = 43968, chance = 3381 }, -- bakragore's amalgamation
	{ id = 43895, chance = 252 }, -- bag you covet
	{ id = 43950, chance = 346 }, -- advanced promotion scroll
	{ id = 39040, chance = 3101 }, -- fiery tear
	{ id = 43946, chance = 396 }, -- abridged promotion scroll
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 300, maxDamage = -3000 },
	{ name = "combat", interval = 3000, chance = 35, type = COMBAT_ICEDAMAGE, minDamage = -900, maxDamage = -1100, range = 7, radius = 7, shootEffect = CONST_ANI_ICE, effect = 243, target = true },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_DEATHDAMAGE, minDamage = -700, maxDamage = -1000, length = 8, spread = 0, effect = CONST_ME_MORTAREA, target = false },
	{ name = "combat", interval = 3000, chance = 30, type = COMBAT_FIREDAMAGE, minDamage = -1000, maxDamage = -2000, length = 8, spread = 0, effect = CONST_ME_MORTAREA, target = false },
	{ name = "combat", interval = 2000, chance = 30, type = COMBAT_ICEDAMAGE, minDamage = -950, maxDamage = -2400, range = 7, radius = 3, shootEffect = 37, effect = CONST_ANI_ICE, target = true },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_DEATHDAMAGE, minDamage = -1000, maxDamage = -2500, length = 8, spread = 0, effect = 249, target = false },
	{ name = "rotten blood mushroom spawn", interval = RottenBlood.mushroomConfiguration.spawnInterval, chance = 100, minDamage = 0, maxDamage = 0 },
	{ name = "rotten blood energy pillars spawn", interval = RottenBlood.pillarsConfiguration.spawnInterval, chance = 100, minDamage = 0, maxDamage = 0 },
	{ name = "bakragore burden fear", interval = 2500, chance = 10, minDamage = 0, maxDamage = 0 },
}

monster.defenses = {
	defense = 135,
	armor = 135,
	{ name = "combat", interval = 3000, chance = 15, type = COMBAT_HEALING, minDamage = 2500, maxDamage = 3500, effect = CONST_ME_MAGIC_RED, target = false },
	{ name = "speed", interval = 4000, chance = 80, speedChange = 700, effect = CONST_ME_MAGIC_RED, target = false, duration = 6000 },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 15 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 15 },
	{ type = COMBAT_EARTHDAMAGE, percent = 15 },
	{ type = COMBAT_FIREDAMAGE, percent = 15 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 15 },
	{ type = COMBAT_HOLYDAMAGE, percent = 15 },
	{ type = COMBAT_DEATHDAMAGE, percent = 15 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

local playerFields = {}

mType.onThink = function(monster, interval)
	local currentTime = os.time() * 1000
	for playerId, fields in pairs(playerFields) do
		for i = #fields, 1, -1 do
			if currentTime - fields[i].timestamp > RottenBlood.darkFieldsConfiguration.fieldLifeTime then
				local oldPosition = table.remove(fields, i).position
				local oldTile = Tile(oldPosition)
				if oldTile then
					local item = oldTile:getItemById(43927)
					if item then
						item:remove()
					end
				end
			end
		end
	end
end

mType.onMove = function(monster, creature, fromPosition, toPosition)
	if monster == nil or not creature:isPlayer() then
		return false
	end

	local playerId = creature:getId()
	local position = Position(fromPosition.x, fromPosition.y, fromPosition.z)
	local tile = Tile(position)
	local currentTime = os.time() * 1000

	if not playerFields[playerId] then
		playerFields[playerId] = {}
	end

	local fieldExists = false
	if tile then
		local item = tile:getItemById(43927)
		if item then
			fieldExists = true
		end
	end

	if tile and not fieldExists then
		if #playerFields[playerId] >= RottenBlood.darkFieldsConfiguration.maxFieldsPerPlayers then
			local oldestField = table.remove(playerFields[playerId], 1)
			local oldTile = Tile(oldestField.position)
			if oldTile then
				local item = oldTile:getItemById(43927)
				if item then
					item:remove()
				end
			end
		end

		if tile:hasFlag(TILESTATE_PROTECTIONZONE) then
			return false
		end
		table.insert(playerFields[playerId], { position = position, timestamp = currentTime })
		Game.createItem(43927, 1, position)
	end
end

mType.onAppear = function(monster, creature)
	if monster:getType():isRewardBoss() then
		monster:setReward(true)
	end
end

mType.onDisappear = function(monster, creature)
	for playerId, fields in pairs(playerFields) do
		for i = #fields, 1, -1 do
			local position = fields[i].position
			local tile = Tile(position)
			if tile then
				local item = tile:getItemById(43927)
				if item then
					item:remove()
				end
			end
			table.remove(fields, i)
		end
	end
	playerFields = {}
end

mType.onSay = function(monster, creature, type, message) end

mType:register(monster)
