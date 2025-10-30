local mType = Game.createMonsterType("Vemiath")
local monster = {}
monster.description = "Vemiath"
monster.experience = 3250000
monster.outfit = {
	lookType = 1668,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.events = {
	"RottenBloodBossDeath",
}

monster.bosstiary = {
	bossRaceId = 2365,
	bossRace = RARITY_ARCHFOE,
}

monster.health = 350000
monster.maxHealth = 350000
monster.race = "undead"
monster.corpse = 44021
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

monster.summons = {}
monster.voices = {
	interval = 5000,
	chance = 10,
	{
		text = "The light... that... drains!",
		yell = false,
	},
	{
		text = "RAAAR!",
		yell = false,
	},
	{
		text = "WILL ... PUNISH ... YOU!",
		yell = false,
	},
	{
		text = "Darkness ... devours!",
		yell = false,
	},
}

monster.loot = {
	{
		name = "crystal coin",
		chance = 38277,
		maxCount = 125,
	},
	{
		name = "ultimate mana potion",
		chance = 7936,
		maxCount = 211,
	},
	{
		name = "giant emerald",
		chance = 4496,
		maxCount = 1,
	},
	{
		name = "supreme health potion",
		chance = 5870,
		maxCount = 179,
	},
	{
		name = "yellow gem",
		chance = 6023,
		maxCount = 5,
	},
	{
		name = "berserk potion",
		chance = 6576,
		maxCount = 45,
	},
	{
		name = "blue gem",
		chance = 9901,
		maxCount = 5,
	},
	{
		name = "green gem",
		chance = 4355,
		maxCount = 4,
	},
	{
		name = "bullseye potion",
		chance = 4571,
		maxCount = 26,
	},
	{
		name = "mastermind potion",
		chance = 3990,
		maxCount = 44,
	},
	{
		name = "ultimate spirit potion",
		chance = 6451,
		maxCount = 25,
	},
	{
		name = "giant topaz",
		chance = 7834,
		maxCount = 1,
	},
	{
		name = "giant amethyst",
		chance = 5969,
		maxCount = 1,
	},
	{
		name = "gold ingot",
		chance = 7606,
		maxCount = 1,
	},
	{
		id = 3039,
		chance = 6262,
		maxCount = 1,
	},
	{
		name = "dragon figurine",
		chance = 8051,
		maxCount = 1,
	},
	{
		name = "raw watermelon tourmaline",
		chance = 6511,
		maxCount = 1,
	},
	{
		name = "vemiath's infused basalt",
		chance = 5540,
		maxCount = 1,
	},
	{
		name = "violet gem",
		chance = 5047,
		maxCount = 1,
	},
	{
		name = "the essence of vemiath",
		chance = 175,
	},
	{
		id = 43895,
		chance = 35,
	},
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{
		name = "melee",
		interval = 2000,
		chance = 100,
		minDamage = 350,
		maxDamage = -1600,
	},
	{
		name = "combat",
		interval = 3000,
		chance = 25,
		type = COMBAT_FIREDAMAGE,
		minDamage = -600,
		maxDamage = -1800,
		length = 10,
		spread = 3,
		effect = 244,
		target = false,
	},
	{
		name = "speed",
		interval = 2000,
		chance = 30,
		speedChange = -600,
		radius = 7,
		effect = CONST_ME_MAGIC_RED,
		target = false,
		duration = 15000,
	},
	{
		name = "combat",
		interval = 2000,
		chance = 16,
		type = COMBAT_ENERGYDAMAGE,
		minDamage = -1200,
		maxDamage = -3500,
		radius = 5,
		effect = 243,
		target = false,
	},
	{
		name = "combat",
		interval = 2000,
		chance = 19,
		type = COMBAT_DEATHDAMAGE,
		minDamage = -900,
		maxDamage = -2800,
		length = 10,
		spread = 3,
		effect = CONST_ME_EXPLOSIONHIT,
		target = false,
	},
	{
		name = "combat",
		interval = 2000,
		chance = 24,
		type = COMBAT_FIREDAMAGE,
		minDamage = -650,
		maxDamage = -1600,
		length = 8,
		spread = 3,
		effect = CONST_ME_FIREATTACK,
		target = false,
	},
	{
		name = "rotten blood energy pillars spawn",
		interval = RottenBlood.pillarsConfiguration.spawnInterval,
		chance = 100,
		minDamage = 0,
		maxDamage = 0,
	},
}

monster.defenses = {
	defense = 105,
	armor = 105,
	{
		name = "combat",
		interval = 3000,
		chance = 10,
		type = COMBAT_HEALING,
		minDamage = 800,
		maxDamage = 1500,
		effect = CONST_ME_MAGIC_RED,
		target = false,
	},
}

monster.elements = {
	{
		type = COMBAT_PHYSICALDAMAGE,
		percent = 15,
	},
	{
		type = COMBAT_ENERGYDAMAGE,
		percent = 15,
	},
	{
		type = COMBAT_EARTHDAMAGE,
		percent = 15,
	},
	{
		type = COMBAT_FIREDAMAGE,
		percent = 15,
	},
	{
		type = COMBAT_LIFEDRAIN,
		percent = 0,
	},
	{
		type = COMBAT_MANADRAIN,
		percent = 0,
	},
	{
		type = COMBAT_DROWNDAMAGE,
		percent = 0,
	},
	{
		type = COMBAT_ICEDAMAGE,
		percent = 15,
	},
	{
		type = COMBAT_HOLYDAMAGE,
		percent = 15,
	},
	{
		type = COMBAT_DEATHDAMAGE,
		percent = 15,
	},
}

monster.immunities = {
	{
		type = "paralyze",
		condition = true,
	},
	{
		type = "outfit",
		condition = false,
	},
	{
		type = "invisible",
		condition = true,
	},
	{
		type = "bleed",
		condition = false,
	},
}

mType.onAppear = function(monster, creature)
	if (monster:getType()):isRewardBoss() then
		monster:setReward(true)
	end
end

local playerFields = {}

mType.onMove = function(monster, creature, fromPosition, toPosition)
	if monster == nil or (not creature:isPlayer()) then
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
		table.insert(playerFields[playerId], {
			position = position,
			timestamp = currentTime,
		})
		Game.createItem(43927, 1, position)
	end
end

mType.onThink = function(monster, interval)
	local currentTime = os.time() * 1000
	for playerId, fields in pairs(playerFields) do
		for i = #fields, 1, -1 do
			if currentTime - fields[i].timestamp > RottenBlood.darkFieldsConfiguration.fieldLifeTime then
				local oldPosition = (table.remove(fields, i)).position
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

mType:register(monster)
