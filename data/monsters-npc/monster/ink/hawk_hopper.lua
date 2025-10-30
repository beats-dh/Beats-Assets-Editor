local mType = Game.createMonsterType("Hawk Hopper")
local monster = {}

monster.description = "a hawk hopper"
monster.experience = 1770
monster.outfit = {
	lookType = 1858,
	lookHead = 94,
	lookBody = 43,
	lookLegs = 43,
	lookFeet = 56,
	lookAddons = 2,
	lookMount = 0,
}

monster.raceId = 2674
monster.Bestiary = {
	class = "Inkborn",
	race = BESTY_RACE_INKBORN,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 3,
	Occurrence = 1,
	Locations = "Book World.",
}

monster.health = 2180
monster.maxHealth = 2180
monster.race = "ink"
monster.corpse = 51560
monster.speed = 150
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
	{ text = "Sniff, sniff", yell = false },
	{ text = "Chipper", yell = false },
}

monster.loot = {
	{ name = "gold coin", chance = 100000, maxCount = 200 },
	{ name = "platinum coin", chance = 15000, minCount = 1, maxCount = 10 },
	{ id = 774, chance = 10000, minCount = 1, maxCount = 3 }, -- earth arrow
	{ id = 9057, chance = 10000, minCount = 1, maxCount = 3 }, -- small topaz
	{ id = 25737, chance = 10000, minCount = 1, maxCount = 3 }, -- rainbow quartz
	{ id = 3578, chance = 3500 }, -- fishs
	{ id = 3595, chance = 3500 }, -- carrot
	{ id = 22194, chance = 3500 }, -- opal
	{ id = 25759, chance = 3500 }, -- royal star
	{ id = 25698, chance = 1450 }, -- butterfly
	{ id = 51443, chance = 1450 }, -- Etcher
	{ id = 7438, chance = 800 }, -- life ring
}

monster.attacks = {
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_PHYSICALDAMAGE, minDamage = -200, maxDamage = -240, range = 7, effect = CONST_ME_BIG_SCRATCH, target = true },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_EARTHDAMAGE, minDamage = -150, maxDamage = -200, range = 7, effect = CONST_ME_PLANTATTACK, target = true },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_EARTHDAMAGE, minDamage = -190, maxDamage = -230, radius = 2, effect = CONST_ME_STONES, target = false },
}

monster.defenses = {
	defense = 55,
	armor = 36,
	mitigation = 0.94,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = -5 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 10 },
	{ type = COMBAT_EARTHDAMAGE, percent = 15 },
	{ type = COMBAT_FIREDAMAGE, percent = -10 },
	{ type = COMBAT_LIFEDRAIN, percent = 100 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = -15 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
