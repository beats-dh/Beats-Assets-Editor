local mType = Game.createMonsterType("Bramble Wyrmling")
local monster = {}

monster.description = "a bramble wyrmling"
monster.experience = 1950
monster.outfit = {
	lookType = 1850,
	lookHead = 63,
	lookBody = 63,
	lookLegs = 71,
	lookFeet = 71,
	lookAddons = 2,
	lookMount = 0,
}

monster.raceId = 2671
monster.Bestiary = {
	class = "Inkborn",
	race = BESTY_RACE_INKBORN,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 1,
	Locations = "Book World.",
}

monster.health = 2350
monster.maxHealth = 2350
monster.race = "ink"
monster.corpse = 51501
monster.speed = 125
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
	{ name = "platinum coin", chance = 15000, minCount = 1, maxCount = 4 },
	{ id = 3032, chance = 10000, minCount = 1, maxCount = 3 }, -- small emerald
	{ id = 16127, chance = 10000, minCount = 1, maxCount = 2 }, -- green crystal fragment
	{ id = 51423, chance = 3500 }, -- bok with a dragon
	{ id = 830, chance = 3500 }, -- terra hood
	{ id = 3038, chance = 1450 }, -- green gem
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, type = COMBAT_EARTHDAMAGE, minDamage = -180, maxDamage = -250 },
	{ name = "bramble wyrmling terra wave", interval = 2000, chance = 10, minDamage = -200, maxDamage = -280, target = false },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_EARTHDAMAGE, minDamage = -250, maxDamage = -350, range = 1, shootEffect = CONST_ANI_WHIRLWINDSWORD, effect = CONST_ME_HITBYPOISON, target = true },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_PHYSICALDAMAGE, minDamage = -180, maxDamage = -250, effect = CONST_ME_BITE, target = true },
}

monster.defenses = {
	defense = 55,
	armor = 38,
	mitigation = 0.94,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 5 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 20 },
	{ type = COMBAT_FIREDAMAGE, percent = 5 },
	{ type = COMBAT_LIFEDRAIN, percent = 100 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 5 },
	{ type = COMBAT_DEATHDAMAGE, percent = -10 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
