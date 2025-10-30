local mType = Game.createMonsterType("Werehyaena")
local monster = {}

monster.description = "a werehyaena"
monster.experience = 2200
monster.outfit = {
	lookType = 1300,
	lookHead = 57,
	lookBody = 77,
	lookLegs = 1,
	lookFeet = 1,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 1963
monster.Bestiary = {
	class = "Lycanthrope",
	race = BESTY_RACE_LYCANTHROPE,
	toKill = 1000,
	FirstUnlock = 50,
	SecondUnlock = 500,
	CharmsPoints = 25,
	Stars = 3,
	Occurrence = 0,
	Locations = "Darashia Wyrm Hills only during night, Hyaena Lairs.",
}

monster.health = 2700
monster.maxHealth = 2700
monster.race = "blood"
monster.corpse = 33821
monster.speed = 120
monster.manaCost = 0

monster.changeTarget = {
	interval = 5000,
	chance = 0,
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
	{ text = "Snarl!", yell = false },
}

monster.loot = {
	{ name = "platinum coin", chance = 80000, maxCount = 3 },
	{ name = "great health potion", chance = 39976, maxCount = 3 },
	{ name = "meat", chance = 15256 },
	{ name = "axe", chance = 13448 },
	{ name = "knife", chance = 13296 },
	{ name = "werehyaena nose", chance = 10136 },
	{ name = "halberd", chance = 9184 },
	{ name = "red crystal fragment", chance = 7632 },
	{ name = "small enchanted amethyst", chance = 4608, maxCount = 5 },
	{ name = "life preserver", chance = 4536 },
	{ id = 3039, chance = 4472 }, -- red gem
	{ name = "yellow gem", chance = 4336 },
	{ name = "combat knife", chance = 3760 },
	{ name = "green crystal fragment", chance = 3664 },
	{ name = "ratana", chance = 3424 },
	{ name = "werehyaena talisman", chance = 600 },
	{ name = "werehyaena trophy", chance = 152 },
}

monster.attacks = {
	{ name = "melee", type = COMBAT_PHYSICALDAMAGE, interval = 2 * 1000, minDamage = 0, maxDamage = -300 },
	{ name = "combat", type = COMBAT_EARTHDAMAGE, interval = 2 * 1000, chance = 17, minDamage = -175, maxDamage = -255, radius = 3, effect = CONST_ME_HITBYPOISON },
	{ name = "combat", type = COMBAT_DEATHDAMAGE, interval = 2 * 1000, chance = 15, minDamage = -330, maxDamage = -370, target = true, range = 5, radius = 1, shootEffect = CONST_ANI_LARGEROCK, effect = CONST_ME_MORTAREA },
	{ name = "combat", type = COMBAT_DEATHDAMAGE, interval = 2 * 1000, chance = 13, minDamage = -225, maxDamage = -275, length = 3, spread = 0, effect = CONST_ME_MORTAREA },
}

monster.defenses = {
	{ name = "speed", chance = 15, interval = 2 * 1000, speed = 200, duration = 5 * 1000, effect = CONST_ME_MAGIC_BLUE },
	defense = 0,
	armor = 36,
	mitigation = 0.88,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 40 },
	{ type = COMBAT_FIREDAMAGE, percent = 50 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = -20 },
	{ type = COMBAT_HOLYDAMAGE, percent = -25 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = true },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = true },
}

mType:register(monster)
