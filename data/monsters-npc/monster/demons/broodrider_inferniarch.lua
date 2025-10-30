local mType = Game.createMonsterType("Broodrider Inferniarch")
local monster = {}

monster.description = "a broodrider inferniarch"
monster.experience = 7400
monster.outfit = {
	lookType = 1796,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 2603
monster.Bestiary = {
	class = "Demon",
	race = BESTY_RACE_DEMON,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 0,
	Locations = "Azzilon Castle.",
}

monster.health = 9600
monster.maxHealth = 9600
monster.race = "blood"
monster.corpse = 50006
monster.speed = 160
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
	canPushCreatures = true,
	staticAttackChance = 90,
	targetDistance = 1,
	runHealth = 0,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = false,
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
	{ text = "Mah...Hun Hur...!", yell = true },
}

monster.loot = {
	{ id = 3035, chance = 80000, maxCount = 25 }, -- platinum coin
	{ name = "onyx chip", chance = 4176, maxCount = 3 },
	{ name = "blue crystal splinter", chance = 4056, maxCount = 1 },
	{ name = "power bolt", chance = 2256, maxCount = 5 },
	{ name = "drill bolt", chance = 2224, maxCount = 5 },
	{ id = 49909, chance = 2160, maxCount = 1 }, -- demonic core essence
	{ id = 50058, chance = 1624, maxCount = 1 }, -- broodrider saddle
	{ id = 49908, chance = 936, maxCount = 1 }, -- mummified demon finger
	{ id = 821, chance = 536, maxCount = 1 }, -- magma legs
	{ id = 49894, chance = 384, maxCount = 1 }, -- demonic matter
	{ id = 5803, chance = 72, maxCount = 1 }, -- arbalest
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = -167, maxDamage = -374, condition = { type = CONDITION_FIRE, totalDamage = 400, interval = 9000 } },
	{ name = "combat", interval = 2000, chance = 16, type = COMBAT_DEATHDAMAGE, minDamage = -400, maxDamage = -500, range = 7, shootEffect = CONST_ANI_INFERNALBOLT, effect = CONST_ME_MORTAREA, target = true },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_PHYSICALDAMAGE, minDamage = -402, maxDamage = -500, effect = CONST_ME_BITE, target = true },
}

monster.defenses = {
	defense = 20,
	armor = 70,
	mitigation = 2.05,
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_HEALING, minDamage = 80, maxDamage = 95, effect = CONST_ME_MAGIC_BLUE, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = -5 },
	{ type = COMBAT_EARTHDAMAGE, percent = 10 },
	{ type = COMBAT_FIREDAMAGE, percent = 20 },
	{ type = COMBAT_LIFEDRAIN, percent = 100 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 100 },
	{ type = COMBAT_ICEDAMAGE, percent = -15 },
	{ type = COMBAT_HOLYDAMAGE, percent = -10 },
	{ type = COMBAT_DEATHDAMAGE, percent = 15 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
