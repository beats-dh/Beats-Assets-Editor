local mType = Game.createMonsterType("Shell Drake")
local monster = {}

monster.description = "a shell drake"
monster.experience = 2370
monster.outfit = {
	lookType = 1857,
	lookHead = 0,
	lookBody = 99,
	lookLegs = 67,
	lookFeet = 78,
	lookAddons = 2,
	lookMount = 0,
}

monster.raceId = 2675
monster.Bestiary = {
	class = "Inkborn",
	race = BESTY_RACE_INKBORN,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 3,
	Occurrence = 1,
	Locations = "Crumbling Caverns.",
}

monster.health = 2800
monster.maxHealth = 2800
monster.race = "ink"
monster.corpse = 51556
monster.speed = 90
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
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
	rewardBoss = false,
	illusionable = false,
	canPushItems = true,
	canPushCreatures = false,
	staticAttackChance = 70,
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

monster.loot = {
	{ name = "gold coin", chance = 100000, maxCount = 200 },
	{ name = "platinum coin", chance = 15000, minCount = 1, maxCount = 10 },
	{ id = 51419, chance = 15000 }, -- paper plane
	{ id = 238, chance = 3500 }, -- great mana potion
	{ id = 678, chance = 3500 }, -- small enchanted amethyst
	{ id = 7452, chance = 3500 }, -- spiked squelcher
	{ id = 16120, chance = 3500 }, -- violet crystal shard
	{ id = 24383, chance = 3500 }, -- cave turnip
	{ id = 24962, chance = 3500 }, -- prismatic quartz
	{ id = 51442, chance = 1450 }, -- blank imbuement scroll
	{ id = 14042, chance = 800 }, -- warrior's shield
}

monster.attacks = {
	{ name = "combat", interval = 2000, chance = 100, type = COMBAT_FIREDAMAGE, minDamage = -200, maxDamage = -280, range = 7, target = true },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_PHYSICALDAMAGE, minDamage = -200, maxDamage = -260, radius = 1, shootEffect = CONST_ANI_SMALLEARTH, effect = CONST_ME_STONES, range = 7, target = true },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_PHYSICALDAMAGE, minDamage = -230, maxDamage = -320, radius = 3, effect = CONST_ME_EXPLOSIONHIT, target = false },
}

monster.defenses = {
	defense = 55,
	armor = 43,
	mitigation = 1.04,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 5 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = -5 },
	{ type = COMBAT_FIREDAMAGE, percent = 20 },
	{ type = COMBAT_LIFEDRAIN, percent = 100 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = -5 },
	{ type = COMBAT_HOLYDAMAGE, percent = -5 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
