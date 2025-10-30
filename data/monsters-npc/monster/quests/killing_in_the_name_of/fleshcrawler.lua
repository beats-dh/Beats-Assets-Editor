local mType = Game.createMonsterType("Fleshcrawler")
local monster = {}

monster.description = "Fleshcrawler"
monster.experience = 1000
monster.outfit = {
	lookType = 79,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.health = 1450
monster.maxHealth = 1450
monster.race = "venom"
monster.corpse = 6021
monster.speed = 115
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 10,
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
	rewardBoss = true,
	illusionable = false,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 80,
	targetDistance = 1,
	runHealth = 0,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = false,
	canWalkOnFire = false,
	canWalkOnPoison = true,
}

monster.light = {
	level = 0,
	color = 0,
}

monster.summon = {
	maxSummons = 3,
	summons = {
		{ name = "Larva", chance = 10, interval = 2000, count = 3 },
	},
}

monster.voices = {
	interval = 5000,
	chance = 10,
}

monster.loot = {
	{ id = 3035, chance = 69223, maxCount = 15 }, -- platinum coin
	{ id = 3042, chance = 69223, maxCount = 2 }, -- scarab coin
	{ id = 3032, chance = 62223, maxCount = 3 }, -- small emerald
	{ id = 3033, chance = 61054, maxCount = 4 }, -- small amethyst
	{ id = 9631, chance = 70000 }, -- scarab pincers
	{ id = 3025, chance = 31892 }, -- ancient amulet
	{ id = 3018, chance = 36554 }, -- scarab amulet
	{ id = 811, chance = 7777 }, -- terra mantle
	{ id = 236, chance = 30331 }, -- strong health potion
	{ id = 8084, chance = 52892 }, -- springsprout rod
	{ id = 3440, chance = 30723 }, -- scarab shield
	{ id = 7426, chance = 21392 }, -- amber staff
	{ id = 11468, chance = 10108 }, -- ornamented brooch
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -330 },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_EARTHDAMAGE, minDamage = 0, maxDamage = -150, range = 7, shootEffect = CONST_ANI_POISON, effect = CONST_ME_POISONAREA, target = false },
	{ name = "speed", interval = 2000, chance = 15, speedChange = -700, range = 7, shootEffect = CONST_ANI_POISON, effect = CONST_ME_POISONAREA, target = false, duration = 25000 },
	-- poison
	{ name = "condition", type = CONDITION_POISON, interval = 2000, chance = 30, minDamage = 0, maxDamage = -520, radius = 5, effect = CONST_ME_POISONAREA, target = false },
}

monster.defenses = {
	defense = 30,
	armor = 30,
	mitigation = 0.96,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = -15 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = -10 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
