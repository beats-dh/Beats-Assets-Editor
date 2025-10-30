local mType = Game.createMonsterType("Cinder Wyrmling")
local monster = {}

monster.description = "a cinder wyrmling"
monster.experience = 1950
monster.outfit = {
	lookType = 1850,
	lookHead = 77,
	lookBody = 94,
	lookLegs = 94,
	lookFeet = 79,
	lookAddons = 1,
	lookMount = 0,
}

monster.raceId = 2670
monster.Bestiary = {
	class = "Inkborn",
	race = BESTY_RACE_INKBORN,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 1,
	Locations = "Crumbling Caverns.",
}

monster.health = 2350
monster.maxHealth = 2350
monster.race = "ink"
monster.corpse = 51509
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

monster.voices = {
	interval = 5000,
	chance = 10,
	{ text = "Chirp", yell = false },
}

monster.loot = {
	{ name = "gold coin", chance = 100000, maxCount = 200 },
	{ name = "platinum coin", chance = 15000, minCount = 1, maxCount = 4 },
	{ id = 3030, chance = 10000, minCount = 1, maxCount = 3 }, -- small ruby
	{ id = 16126, chance = 10000, minCount = 1, maxCount = 2 }, -- red crystal fragment
	{ id = 51423, chance = 3500 }, -- bok with a dragon
	{ id = 3039, chance = 3500 }, -- red gem
	{ id = 3075, chance = 3500 }, -- wand of dragonbreath
	{ id = 826, chance = 2000 }, -- magma coat
	{ id = 827, chance = 2000 }, -- magma monocle
	{ id = 3416, chance = 800 }, -- dragon shield
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, type = COMBAT_FIREDAMAGE, minDamage = -100, maxDamage = -200 },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_FIREDAMAGE, minDamage = -200, maxDamage = -300, length = 5, spread = 3, effect = CONST_ME_HITBYFIRE, target = false },
}

monster.defenses = {
	defense = 55,
	armor = 38,
	mitigation = 0.94,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 5 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = -5 },
	{ type = COMBAT_FIREDAMAGE, percent = 20 },
	{ type = COMBAT_LIFEDRAIN, percent = 100 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = -10 },
	{ type = COMBAT_HOLYDAMAGE, percent = 5 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
