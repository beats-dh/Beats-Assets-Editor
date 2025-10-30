local mType = Game.createMonsterType("Bluebeak")
local monster = {}

monster.description = "a bluebeak"
monster.experience = 2070
monster.outfit = {
	lookType = 1849,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 2673
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

monster.health = 2430
monster.maxHealth = 2430
monster.race = "ink"
monster.corpse = 51505
monster.speed = 120
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
	{ id = 3029, chance = 10000, minCount = 1, maxCount = 3 }, -- small sapphire
	{ id = 51420, chance = 15000 }, -- paper boat
	{ id = 51422, chance = 15000 }, -- star ink
	{ id = 3067, chance = 3500 }, -- hailstorm rod
	{ id = 3092, chance = 3500 }, -- grape
	{ id = 16124, chance = 3500 }, -- blue crystal splinter
	{ id = 815, chance = 2000 }, -- glacier amulet
	{ id = 819, chance = 2000 }, -- glacier shoes
	{ id = 16119, chance = 2000 }, -- blue crystal shard
	{ id = 51443, chance = 2000 }, -- etcher
	{ id = 3041, chance = 800 }, -- blue gem
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, type = COMBAT_ICEDAMAGE, effect = CONST_ME_ICEATTACK, minDamage = -80, maxDamage = -240 },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_PHYSICALDAMAGE, minDamage = -200, maxDamage = -230, range = 3, shooteffect = CONST_ANI_HUNTINGSPEAR, target = true },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_ICEDAMAGE, minDamage = -249, maxDamage = -260, range = 3, radius = 1, shootEffect = CONST_ANI_EXPLOSION, effect = CONST_ME_ICEAREA, target = true },
}

monster.defenses = {
	defense = 55,
	armor = 40,
	mitigation = 1.04,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = -5 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = -5 },
	{ type = COMBAT_LIFEDRAIN, percent = 100 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 10 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
