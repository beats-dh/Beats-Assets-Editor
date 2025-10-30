local mType = Game.createMonsterType("Lion Hydra")
local monster = {}

monster.description = "a lion hydra"
monster.experience = 2450
monster.outfit = {
	lookType = 1859,
	lookHead = 94,
	lookBody = 43,
	lookLegs = 43,
	lookFeet = 56,
	lookAddons = 2,
	lookMount = 0,
}

monster.raceId = 2678
monster.Bestiary = {
	class = "Inkborn",
	race = BESTY_RACE_INKBORN,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 500,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 1,
	Locations = "Book World",
}

monster.health = 2760
monster.maxHealth = 2760
monster.race = "ink"
monster.corpse = 51564
monster.speed = 115
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

monster.voices = {
	interval = 5000,
	chance = 10,
	{ text = "Roarrr!", yell = false },
}

monster.loot = {
	{ name = "gold coin", chance = 100000, maxCount = 200 },
	{ name = "platinum coin", chance = 15000, minCount = 1, maxCount = 10 },
	{ id = 51426, chance = 15000 }, -- sealing wax
	{ id = 3017, chance = 3500 }, -- silver brooch
	{ id = 3028, chance = 3500, minCount = 1, maxCount = 3 }, -- small diamond
	{ id = 3582, chance = 3500 }, -- ham
	{ id = 10282, chance = 3500 }, -- hydra head
	{ id = 22193, chance = 3500 }, -- onyx chip
	{ id = 7413, chance = 1450 }, -- titan axe
	{ id = 9302, chance = 1450 }, -- sacred tree amulet
	{ id = 3436, chance = 800 }, -- medusa shield
	{ id = 9058, chance = 800 }, -- gold ingot
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, type = COMBAT_FIREDAMAGE, minDamage = -80, maxDamage = -200 },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_FIREDAMAGE, minDamage = -210, maxDamage = -280, range = 3, target = true },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_FIREDAMAGE, minDamage = -150, maxDamage = -250, effect = CONST_ME_BITE, target = true },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_HOLYDAMAGE, minDamage = -230, maxDamage = -290, radius = 4, effect = CONST_ME_YELLOW_ENERGY_SPARK, target = false },
}

monster.defenses = {
	defense = 55,
	armor = 42,
	mitigation = 1.15,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = -5 },
	{ type = COMBAT_FIREDAMAGE, percent = 0 },
	{ type = COMBAT_LIFEDRAIN, percent = 100 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = -5 },
	{ type = COMBAT_DEATHDAMAGE, percent = -10 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
