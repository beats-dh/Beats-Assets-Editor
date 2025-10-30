local mType = Game.createMonsterType("Hand of Cursed Fate")
local monster = {}

monster.description = "a hand of cursed fate"
monster.experience = 5000
monster.outfit = {
	lookType = 230,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 281
monster.Bestiary = {
	class = "Undead",
	race = BESTY_RACE_UNDEAD,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 0,
	Locations = "Pits of Inferno, The Battlefield, The Arcanum, The Blood Halls and The Crystal Caves.",
}

monster.health = 6600
monster.maxHealth = 6600
monster.race = "blood"
monster.corpse = 6311
monster.speed = 130
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
	rewardBoss = false,
	illusionable = false,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 20,
	targetDistance = 1,
	runHealth = 3500,
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

monster.voices = {
	interval = 5000,
	chance = 10,
}

monster.loot = {
	{ name = "emerald bangle", chance = 2800 },
	{ name = "small sapphire", chance = 8800, maxCount = 4 },
	{ name = "gold coin", chance = 48000, maxCount = 100 },
	{ name = "gold coin", chance = 48000, maxCount = 100 },
	{ name = "gold coin", chance = 40000, maxCount = 67 },
	{ name = "platinum coin", chance = 80000, maxCount = 7 },
	{ name = "violet gem", chance = 560 },
	{ name = "yellow gem", chance = 4752 },
	{ id = 3051, chance = 2520 }, -- energy ring
	{ name = "platinum amulet", chance = 804 },
	{ name = "mind stone", chance = 7272 },
	{ name = "wand of inferno", chance = 4472 },
	{ name = "boots of haste", chance = 432 },
	{ name = "protection amulet", chance = 6992 },
	{ name = "sudden death rune", chance = 3360, maxCount = 8 },
	{ name = "skull staff", chance = 560 },
	{ name = "knight armor", chance = 3640 },
	{ name = "crown armor", chance = 1120 },
	{ name = "mysterious voodoo skull", chance = 198 },
	{ name = "soul orb", chance = 24889 },
	{ id = 6299, chance = 1400 }, -- death ring
	{ name = "demonic essence", chance = 9600 },
	{ name = "flask of demonic blood", chance = 24000, maxCount = 4 },
	{ name = "assassin star", chance = 6154, maxCount = 5 },
	{ name = "abyss hammer", chance = 396 },
	{ name = "great mana potion", chance = 15992, maxCount = 2 },
	{ name = "ultimate health potion", chance = 14400 },
	{ name = "gold ingot", chance = 560 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -520, condition = { type = CONDITION_POISON, totalDamage = 380, interval = 4000 } },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_MANADRAIN, minDamage = 0, maxDamage = -620, range = 1, target = false },
	{ name = "drunk", interval = 2000, chance = 10, radius = 4, effect = CONST_ME_SMALLCLOUDS, target = false, duration = 3000 },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_LIFEDRAIN, minDamage = -220, maxDamage = -880, range = 1, effect = CONST_ME_SMALLCLOUDS, target = false },
}

monster.defenses = {
	defense = 25,
	armor = 53,
	mitigation = 1.88,
	{ name = "speed", interval = 2000, chance = 15, speedChange = 1000, effect = CONST_ME_MAGIC_RED, target = false, duration = 5000 },
	{ name = "invisible", interval = 2000, chance = 10, effect = CONST_ME_MAGIC_BLUE },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_HEALING, minDamage = 100, maxDamage = 250, effect = CONST_ME_MAGIC_BLUE, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 5 },
	{ type = COMBAT_EARTHDAMAGE, percent = 100 },
	{ type = COMBAT_FIREDAMAGE, percent = 100 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = -10 },
	{ type = COMBAT_HOLYDAMAGE, percent = -25 },
	{ type = COMBAT_DEATHDAMAGE, percent = 100 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
