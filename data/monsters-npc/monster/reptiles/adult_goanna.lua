local mType = Game.createMonsterType("Adult Goanna")
local monster = {}

monster.description = "an adult goanna"
monster.experience = 6650
monster.outfit = {
	lookType = 1195,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 1818
monster.Bestiary = {
	class = "Reptile",
	race = BESTY_RACE_REPTILE,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 0,
	Locations = "Kilmaresh Central Steppe, Kilmaresh Southern Steppe, Green Belt.",
}

monster.health = 8300
monster.maxHealth = 8300
monster.race = "blood"
monster.corpse = 31405
monster.speed = 210
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 10,
}

monster.strategiesTarget = {
	nearest = 100,
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
	staticAttackChance = 90,
	targetDistance = 1,
	runHealth = 10,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = false,
	canWalkOnFire = false,
	canWalkOnPoison = false,
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
	{ name = "platinum coin", chance = 80000, maxCount = 3 },
	{ name = "envenomed arrow", chance = 48096, maxCount = 8 },
	{ name = "earth arrow", chance = 10544, maxCount = 30 },
	{ name = "emerald bangle", chance = 9792 },
	{ name = "goanna meat", chance = 9320 },
	{ name = "small enchanted emerald", chance = 8024 },
	{ name = "green crystal splinter", chance = 7280 },
	{ name = "terra rod", chance = 6600 },
	{ name = "red goanna scale", chance = 6328 },
	{ name = "blue crystal shard", chance = 6256 },
	{ name = "small sapphire", chance = 5512, maxCount = 2 },
	{ name = "terra hood", chance = 5304 },
	{ name = "goanna claw", chance = 4968 },
	{ name = "terra amulet", chance = 4832 },
	{ name = "yellow gem", chance = 3400 },
	{ name = "silver brooch", chance = 3200 },
	{ name = "green gem", chance = 2520 },
	{ name = "serpent sword", chance = 2248 },
	{ name = "scared frog", chance = 2176 },
	{ name = "opal", chance = 2112, maxCount = 2 },
	{ name = "onyx chip", chance = 2112 },
	{ name = "gemmed figurine", chance = 1224 },
	{ name = "small amethyst", chance = 1088 },
	{ name = "fur armor", chance = 1088 },
	{ name = "wood cape", chance = 1024 },
	{ name = "white pearl", chance = 1024 },
	{ name = "small tortoise", chance = 952 },
	{ name = "sacred tree amulet", chance = 816 },
	{ name = "coral brooch", chance = 616 },
	{ name = "lizard heart", chance = 616 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -400, condition = { type = CONDITION_POISON, totalDamage = 200, interval = 4000 } },
	{ name = "combat", interval = 2500, chance = 30, type = COMBAT_EARTHDAMAGE, minDamage = -300, maxDamage = -600, range = 3, shootEffect = CONST_ANI_EARTH, effect = CONST_ME_HITBYPOISON, target = true },
	{ name = "combat", interval = 3000, chance = 30, type = COMBAT_EARTHDAMAGE, minDamage = -300, maxDamage = -380, radius = 2, effect = CONST_ME_GROUNDSHAKER, target = false },
	{ name = "combat", interval = 3600, chance = 40, type = COMBAT_EARTHDAMAGE, minDamage = -300, maxDamage = -390, length = 8, spread = 3, effect = CONST_ME_GREEN_RINGS, target = false },
}

monster.defenses = {
	defense = 84,
	armor = 84,
	mitigation = 2.6,
	{ name = "speed", interval = 2000, chance = 15, speedChange = 420, effect = CONST_ME_MAGIC_RED, target = false, duration = 5000 },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = -10 },
	{ type = COMBAT_EARTHDAMAGE, percent = 25 },
	{ type = COMBAT_FIREDAMAGE, percent = 0 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
