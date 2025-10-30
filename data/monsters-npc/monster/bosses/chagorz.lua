local mType = Game.createMonsterType("Chagorz")
local monster = {}
monster.description = "Chagorz"
monster.experience = 3250000
monster.outfit = {
	lookType = 1666,
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
	bossRaceId = 2366,
	bossRace = RARITY_ARCHFOE,
}
monster.health = 350000
monster.maxHealth = 350000
monster.race = "undead"
monster.corpse = 44024
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
		chance = 37577,
		maxCount = 108,
	},
	{
		name = "mastermind potion",
		chance = 3871,
		maxCount = 28,
	},
	{
		name = "supreme health potion",
		chance = 3531,
		maxCount = 154,
	},
	{
		name = "giant sapphire",
		chance = 7382,
		maxCount = 1,
	},
	{
		name = "ultimate mana potion",
		chance = 4026,
		maxCount = 107,
	},
	{
		name = "violet gem",
		chance = 9252,
		maxCount = 4,
	},
	{
		id = 3039,
		chance = 9426,
		maxCount = 1,
	},
	{
		name = "yellow gem",
		chance = 9850,
		maxCount = 1,
	},
	{
		name = "blue gem",
		chance = 7809,
		maxCount = 3,
	},
	{
		name = "bullseye potion",
		chance = 4754,
		maxCount = 21,
	},
	{
		name = "giant amethyst",
		chance = 8122,
		maxCount = 1,
	},
	{
		name = "giant topaz",
		chance = 8596,
		maxCount = 1,
	},
	{
		name = "green gem",
		chance = 5844,
		maxCount = 1,
	},
	{
		name = "ultimate spirit potion",
		chance = 7654,
		maxCount = 18,
	},
	{
		name = "white gem",
		chance = 6720,
		maxCount = 3,
	},
	{
		name = "darklight figurine",
		chance = 7679,
	},
	{
		name = "the essence of chagorz",
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
		minDamage = 0,
		maxDamage = -1600,
	},
	{
		name = "combat",
		interval = 2000,
		chance = 18,
		type = COMBAT_ENERGYDAMAGE,
		minDamage = -1600,
		maxDamage = -2800,
		effect = CONST_ME_YELLOWSPARKLES,
	},
	{
		name = "combat",
		interval = 2000,
		chance = 25,
		type = COMBAT_DEATHDAMAGE,
		minDamage = -850,
		maxDamage = -1500,
		radius = 7,
		target = true,
		shootEffect = CONST_ANI_DEATH,
		effect = CONST_ME_MORTAREA,
	},
	{
		name = "combat",
		interval = 2000,
		chance = 30,
		type = COMBAT_DEATHDAMAGE,
		minDamage = -900,
		maxDamage = -2800,
		radius = 8,
		target = false,
		effect = CONST_ME_MORTAREA,
	},
	{
		name = "combat",
		interval = 2000,
		chance = 15,
		type = COMBAT_MANADRAIN,
		minDamage = -500,
		maxDamage = -1800,
		radius = 8,
		target = false,
		effect = CONST_ME_STUN,
	},
	{
		name = "speed",
		interval = 2000,
		chance = 35,
		speed = {
			min = -400,
			max = -400,
		},
		duration = 20000,
		radius = 8,
		target = false,
		effect = CONST_ME_SOUND_RED,
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
		minDamage = 700,
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
