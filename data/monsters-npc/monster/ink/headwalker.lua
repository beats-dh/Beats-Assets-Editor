local mType = Game.createMonsterType("Headwalker")
local monster = {}

monster.description = "a headwalker"
monster.experience = 2050
monster.outfit = {
	lookType = 1856,
	lookHead = 94,
	lookBody = 43,
	lookLegs = 43,
	lookFeet = 56,
	lookAddons = 2,
	lookMount = 0,
}

monster.raceId = 2672
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

monster.health = 2460
monster.maxHealth = 2460
monster.race = "ink"
monster.corpse = 51552
monster.speed = 165
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
	{ text = "Knowledge is power!", yell = false },
	{ text = "Too... much... knowledge...", yell = false },
}

monster.loot = {
	{ name = "gold coin", chance = 100000, maxCount = 200 },
	{ name = "platinum coin", chance = 15000, minCount = 1, maxCount = 10 },
	{ id = 3032, chance = 10000, minCount = 1, maxCount = 3 }, -- small emerald
	{ id = 51427, chance = 15000 }, -- torn page
	{ id = 239, chance = 3500 }, -- great health potion
	{ id = 282, chance = 3500 }, -- giant shimmering pearl
	{ id = 3026, chance = 3500 }, -- white pearl
	{ id = 3027, chance = 3500 }, -- black pearl
	{ id = 3084, chance = 3500 }, -- protection amullet
	{ id = 53425, chance = 3500 }, -- book with a hourglass
	{ id = 51442, chance = 1450 }, -- blank imbuement scroll
	{ id = 3052, chance = 800 }, -- life ring
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, type = COMBAT_FIREDAMAGE, minDamage = -90, maxDamage = -250 },
	{ name = "headwalker wave", interval = 2000, chance = 10, minDamage = 0, maxDamage = -120, target = false },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_DEATHDAMAGE, minDamage = -200, maxDamage = -260, range = 3, shootEffect = CONST_ANI_EXPLOSION, effect = CONST_ME_INK_EXPLOSION, target = true },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_LIFEDRAIN, minDamage = -300, maxDamage = -490, range = 3, effect = CONST_ME_PAPER_PLANE, target = true },
}

monster.defenses = {
	defense = 55,
	armor = 38,
	mitigation = 0.96,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 15 },
	{ type = COMBAT_EARTHDAMAGE, percent = -5 },
	{ type = COMBAT_FIREDAMAGE, percent = 0 },
	{ type = COMBAT_LIFEDRAIN, percent = 100 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = -5 },
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
