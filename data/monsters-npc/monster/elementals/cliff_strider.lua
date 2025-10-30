local mType = Game.createMonsterType("Cliff Strider")
local monster = {}

monster.description = "a cliff strider"
monster.experience = 7100
monster.outfit = {
	lookType = 497,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 889
monster.Bestiary = {
	class = "Elemental",
	race = BESTY_RACE_ELEMENTAL,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 1,
	Locations = "Warzone 3.",
}

monster.health = 9400
monster.maxHealth = 9400
monster.race = "undead"
monster.corpse = 16075
monster.speed = 123
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
	canPushCreatures = false,
	staticAttackChance = 80,
	targetDistance = 1,
	runHealth = 0,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = true,
	canWalkOnFire = false,
	canWalkOnPoison = false,
	isPreyExclusive = true,
}

monster.light = {
	level = 0,
	color = 0,
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{ text = "Knorrrr", yell = false },
}

monster.loot = {
	{ name = "white pearl", chance = 7704, maxCount = 3 },
	{ name = "black pearl", chance = 7272 },
	{ name = "gold coin", chance = 80000, maxCount = 100 },
	{ name = "gold coin", chance = 80000, maxCount = 95 },
	{ name = "platinum coin", chance = 80000, maxCount = 10 },
	{ id = 3039, chance = 4888 }, -- red gem
	{ name = "blue gem", chance = 664 },
	{ name = "giant sword", chance = 496 },
	{ name = "hammer of wrath", chance = 56 },
	{ name = "knight legs", chance = 664 },
	{ name = "crown armor", chance = 248 },
	{ name = "crusader helmet", chance = 328 },
	{ name = "steel boots", chance = 80 },
	{ name = "iron ore", chance = 11592 },
	{ name = "magic sulphur", chance = 1160 },
	{ name = "soul orb", chance = 13664 },
	{ name = "sapphire hammer", chance = 1080 },
	{ name = "spiked squelcher", chance = 832 },
	{ name = "great mana potion", chance = 24760, maxCount = 4 },
	{ name = "ultimate health potion", chance = 20208, maxCount = 2 },
	{ name = "crystal of balance", chance = 2152 },
	{ name = "crystal of power", chance = 576 },
	{ name = "shiny stone", chance = 9024 },
	{ name = "wand of defiance", chance = 1600 },
	{ name = "glacial rod", chance = 992 },
	{ name = "blue crystal shard", chance = 5216 },
	{ name = "blue crystal splinter", chance = 6376, maxCount = 2 },
	{ name = "cyan crystal fragment", chance = 6456 },
	{ name = "pulverized ore", chance = 12088 },
	{ name = "cliff strider claw", chance = 12504 },
	{ name = "vein of ore", chance = 14400, maxCount = 2 },
	{ name = "prismatic bolt", chance = 7272, maxCount = 8 },
	{ name = "crystalline sword", chance = 496 },
	{ name = "crystal crossbow", chance = 664 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -499 },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_PHYSICALDAMAGE, minDamage = 0, maxDamage = -800, radius = 4, shootEffect = CONST_ANI_LARGEROCK, effect = CONST_ME_STONES, target = true },
	{ name = "cliff strider skill reducer", interval = 2000, chance = 10, target = false },
	{ name = "cliff strider electrify", interval = 2000, chance = 15, range = 1, target = false },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_PHYSICALDAMAGE, minDamage = 0, maxDamage = -1000, length = 6, spread = 0, effect = CONST_ME_GROUNDSHAKER, target = false },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_MANADRAIN, minDamage = -100, maxDamage = -300, radius = 4, effect = CONST_ME_YELLOWENERGY, target = false },
}

monster.defenses = {
	defense = 55,
	armor = 89,
	mitigation = 2.60,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 10 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 5 },
	{ type = COMBAT_EARTHDAMAGE, percent = 100 },
	{ type = COMBAT_FIREDAMAGE, percent = 20 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 20 },
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
