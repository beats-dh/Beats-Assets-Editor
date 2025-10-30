local mType = Game.createMonsterType("Young Goanna")
local monster = {}

monster.description = "a young goanna"
monster.experience = 6100
monster.outfit = {
	lookType = 1196,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 1817
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

monster.health = 6200
monster.maxHealth = 6200
monster.race = "blood"
monster.corpse = 31409
monster.speed = 190
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
	{ name = "envenomed arrow", chance = 56320, maxCount = 35 },
	{ name = "snakebite rod", chance = 8496 },
	{ name = "goanna meat", chance = 8024 },
	{ name = "blue crystal shard", chance = 7288 },
	{ name = "terra rod", chance = 7152 },
	{ name = "blue goanna scale", chance = 6608 },
	{ name = "small enchanted emerald", chance = 3912 },
	{ name = "leaf star", chance = 3640, maxCount = 3 },
	{ name = "rainbow quartz", chance = 3240, maxCount = 3 },
	{ name = "onyx chip", chance = 3240 },
	{ name = "goanna claw", chance = 3104 },
	{ name = "violet gem", chance = 2832 },
	{ name = "serpent sword", chance = 2696 },
	{ name = "springsprout rod", chance = 2696 },
	{ name = "green crystal shard", chance = 2360 },
	{ name = "scared frog", chance = 2088 },
	{ name = "yellow gem", chance = 2024 },
	{ name = "silver amulet", chance = 1824 },
	{ name = "terra amulet", chance = 1144 },
	{ name = "blue gem", chance = 944 },
	{ name = "terra hood", chance = 880 },
	{ name = "blue crystal splinter", chance = 808 },
	{ name = "sacred tree amulet", chance = 672 },
	{ name = "small tortoise", chance = 536 },
	{ name = "lizard heart", chance = 472 },
	{ name = "wooden spellbook", chance = 136 },
	{ name = "fur armor", chance = 64 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -500, condition = { type = CONDITION_POISON, totalDamage = 200, interval = 4000 } },
	{ name = "combat", interval = 2500, chance = 30, type = COMBAT_EARTHDAMAGE, minDamage = -300, maxDamage = -490, range = 3, shootEffect = CONST_ANI_EARTH, effect = CONST_ME_HITBYPOISON, target = true },
	{ name = "combat", interval = 3000, chance = 30, type = COMBAT_EARTHDAMAGE, minDamage = -300, maxDamage = -500, radius = 1, effect = CONST_ME_GROUNDSHAKER, target = false },
	{ name = "combat", interval = 3500, chance = 30, type = COMBAT_EARTHDAMAGE, minDamage = -300, maxDamage = -490, lenght = 8, spread = 0, effect = CONST_ME_GREEN_RINGS, target = false },
}

monster.defenses = {
	defense = 78,
	armor = 78,
	mitigation = 2.16,
	{ name = "speed", interval = 2000, chance = 15, speedChange = 420, effect = CONST_ME_MAGIC_RED, target = false, duration = 5000 },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = -20 },
	{ type = COMBAT_EARTHDAMAGE, percent = 20 },
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
