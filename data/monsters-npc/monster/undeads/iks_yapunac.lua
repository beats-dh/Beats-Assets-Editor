local mType = Game.createMonsterType("Iks Yapunac")
local monster = {}

monster.description = "an iks yapunac"
monster.experience = 3125
monster.outfit = {
	lookType = 1702,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 2437
monster.Bestiary = {
	class = "Undead",
	race = BESTY_RACE_UNDEAD,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 500,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 1,
	Locations = "Iksupan Waterways",
}

monster.health = 3125
monster.maxHealth = 3125
monster.race = "blood"
monster.corpse = 44448
monster.speed = 120
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
	{ text = "MIT-MAH!", yell = false },
	{ text = "Grrrmh...", yell = false },
	{ text = "CHAHAAAR!!!", yell = false },
}

monster.loot = {
	{ id = 3035, chance = 28000, maxCount = 10 },
	{ id = 3031, chance = 12000, maxCount = 50 },
	{ id = 239, chance = 11732 },
	{ id = 281, chance = 11732 },
	{ id = 44440, chance = 10705 },
	{ id = 24961, chance = 3966 },
	{ id = 16123, chance = 3417 },
	{ id = 16122, chance = 3393 },
	{ id = 22194, chance = 2796, maxCount = 2 },
	{ id = 21170, chance = 2485 },
	{ id = 22193, chance = 1935 },
	{ id = 40528, chance = 1935 },
	{ id = 7452, chance = 1410 },
	{ id = 11514, chance = 1266 },
	{ id = 44432, chance = 95 },
	{ id = 48091, chance = 48 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -250, effect = CONST_ME_PURPLEENERGY },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_PHYSICALDAMAGE, minDamage = -77, maxDamage = -97, length = 5, spread = 0, effect = CONST_ME_GROUNDSHAKER },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_PHYSICALDAMAGE, minDamage = -150, maxDamage = -220, range = 3, radius = 0, effect = CONST_ME_EXPLOSIONHIT, target = true },
}

monster.defenses = {
	defense = 45,
	armor = 45,
	mitigation = 2.02,
}
monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 15 },
	{ type = COMBAT_ENERGYDAMAGE, percent = -10 },
	{ type = COMBAT_EARTHDAMAGE, percent = 10 },
	{ type = COMBAT_FIREDAMAGE, percent = 10 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = -5 },
	{ type = COMBAT_HOLYDAMAGE, percent = 15 },
	{ type = COMBAT_DEATHDAMAGE, percent = -20 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "drunk", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
