local mType = Game.createMonsterType("Lava Golem")
local monster = {}

monster.description = "a lava golem"
monster.experience = 7900
monster.outfit = {
	lookType = 491,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 884
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

monster.health = 9000
monster.maxHealth = 9000
monster.race = "fire"
monster.corpse = 15988
monster.speed = 210
monster.manaCost = 0

monster.changeTarget = {
	interval = 5000,
	chance = 0,
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
	staticAttackChance = 90,
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
	level = 10,
	color = 206,
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{ text = "Grrrrunt", yell = false },
}

monster.loot = {
	{ name = "gold coin", chance = 80000, maxCount = 199 },
	{ name = "platinum coin", chance = 80000, maxCount = 11 },
	{ name = "yellow gem", chance = 5184 },
	{ id = 3039, chance = 944 }, -- red gem
	{ name = "wand of inferno", chance = 2360 },
	{ name = "fire sword", chance = 1368 },
	{ name = "fire axe", chance = 1248 },
	{ name = "crown shield", chance = 944 },
	{ name = "iron ore", chance = 9256 },
	{ name = "white piece of cloth", chance = 3848 },
	{ name = "red piece of cloth", chance = 2824 },
	{ name = "yellow piece of cloth", chance = 5784 },
	{ name = "strong health potion", chance = 15064, maxCount = 2 },
	{ name = "strong mana potion", chance = 14520, maxCount = 2 },
	{ name = "great mana potion", chance = 12824, maxCount = 2 },
	{ name = "mana potion", chance = 16576, maxCount = 2 },
	{ name = "magma amulet", chance = 2320 },
	{ name = "magma boots", chance = 2120 },
	{ name = "magma coat", chance = 344 },
	{ name = "ultimate health potion", chance = 12312 },
	{ name = "spellbook of mind control", chance = 360 },
	{ name = "fiery heart", chance = 10808 },
	{ name = "wand of everblazing", chance = 1112 },
	{ name = "violet crystal shard", chance = 4960 },
	{ name = "green crystal splinter", chance = 11192, maxCount = 2 },
	{ name = "red crystal fragment", chance = 8792 },
	{ name = "magma clump", chance = 12296, maxCount = 2 },
	{ name = "blazing bone", chance = 12160 },
	{ name = "prismatic bolt", chance = 10064, maxCount = 5 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -400 },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_FIREDAMAGE, minDamage = -350, maxDamage = -700, length = 8, spread = 0, effect = CONST_ME_FIREATTACK, target = false },
	{ name = "lava golem soulfire", interval = 2000, chance = 15, target = false },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_FIREDAMAGE, minDamage = -220, maxDamage = -350, radius = 4, effect = CONST_ME_FIREAREA, target = true },
	{ name = "speed", interval = 2000, chance = 10, speedChange = -800, length = 5, spread = 3, effect = CONST_ME_BLOCKHIT, target = false, duration = 30000 },
	{ name = "combat", interval = 2000, chance = 30, type = COMBAT_FIREDAMAGE, minDamage = -280, maxDamage = -350, radius = 3, effect = CONST_ME_HITBYFIRE, target = false },
}

monster.defenses = {
	defense = 60,
	armor = 84,
	mitigation = 2.51,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 30 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 30 },
	{ type = COMBAT_EARTHDAMAGE, percent = 100 },
	{ type = COMBAT_FIREDAMAGE, percent = 100 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = -5 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 35 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
