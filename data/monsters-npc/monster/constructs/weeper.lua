local mType = Game.createMonsterType("Weeper")
local monster = {}

monster.description = "a weeper"
monster.experience = 5800
monster.outfit = {
	lookType = 489,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 882
monster.Bestiary = {
	class = "Construct",
	race = BESTY_RACE_CONSTRUCT,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 1,
	Locations = "Warzone 2.",
}

monster.health = 6800
monster.maxHealth = 6800
monster.race = "fire"
monster.corpse = 15907
monster.speed = 170
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 10,
}

monster.strategiesTarget = {
	nearest = 80,
	random = 20,
}

monster.flags = {
	summonable = false,
	attackable = true,
	hostile = true,
	convinceable = false,
	pushable = false,
	rewardBoss = false,
	illusionable = false,
	canPushItems = false,
	canPushCreatures = true,
	staticAttackChance = 70,
	targetDistance = 1,
	runHealth = 0,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = false,
	canWalkOnFire = true,
	canWalkOnPoison = true,
	isPreyExclusive = true,
}

monster.light = {
	level = 5,
	color = 157,
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{ text = "Moooaaan", yell = false },
}

monster.loot = {
	{ name = "small ruby", chance = 12552, maxCount = 3 },
	{ name = "gold coin", chance = 40000, maxCount = 100 },
	{ name = "gold coin", chance = 40000, maxCount = 99 },
	{ id = 3035, chance = 80000, maxCount = 7 }, -- platinum coin
	{ name = "fire sword", chance = 2624 },
	{ name = "fire axe", chance = 1720 },
	{ name = "great mana potion", chance = 11840, maxCount = 2 },
	{ name = "magma legs", chance = 632 },
	{ name = "magma coat", chance = 632 },
	{ name = "ultimate health potion", chance = 12352, maxCount = 2 },
	{ name = "fiery heart", chance = 10856 },
	{ id = 12600, chance = 1056 }, -- coal
	{ name = "wand of everblazing", chance = 1184 },
	{ name = "violet crystal shard", chance = 4344 },
	{ name = "brown crystal splinter", chance = 9680, maxCount = 2 },
	{ name = "red crystal fragment", chance = 7104 },
	{ name = "magma clump", chance = 10592 },
	{ name = "blazing bone", chance = 11912 },
	{ name = "eye of a weeper", chance = 12696 },
	{ name = "prismatic bolt", chance = 8720, maxCount = 5 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -450 },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_FIREDAMAGE, minDamage = -400, maxDamage = -1000, length = 8, spread = 0, effect = CONST_ME_FIREATTACK, target = false },
	{ name = "combat", interval = 3000, chance = 100, type = COMBAT_FIREDAMAGE, minDamage = -80, maxDamage = -250, radius = 3, effect = CONST_ME_HITBYFIRE, target = false },
	{ name = "speed", interval = 2000, chance = 10, speedChange = -600, length = 5, spread = 0, effect = CONST_ME_BLOCKHIT, target = false, duration = 30000 },
}

monster.defenses = {
	defense = 50,
	armor = 76,
	mitigation = 2.19,
	{ name = "invisible", interval = 2000, chance = 5, effect = CONST_ME_MAGIC_RED },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = -5 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 100 },
	{ type = COMBAT_FIREDAMAGE, percent = 100 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = -5 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 30 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = true },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
