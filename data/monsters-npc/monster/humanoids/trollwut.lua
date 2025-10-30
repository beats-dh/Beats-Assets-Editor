local mType = Game.createMonsterType("Trollwut")
local monster = {}

monster.description = "a trollwut"
monster.experience = 250
monster.outfit = {
	lookType = 15,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.health = 280
monster.maxHealth = 280
monster.race = "blood"
monster.corpse = 5960
monster.speed = 63
monster.manaCost = 290

monster.changeTarget = {
	interval = 4000,
	chance = 0,
}

monster.strategiesTarget = {
	nearest = 100,
}

monster.flags = {
	summonable = true,
	attackable = true,
	hostile = true,
	convinceable = true,
	pushable = false,
	rewardBoss = false,
	illusionable = true,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 90,
	targetDistance = 1,
	runHealth = 0,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = false,
	canWalkOnFire = false,
	canWalkOnPoison = false,
}

monster.light = {
	level = 0,
	color = 0,
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{ text = "Hrrrrngh, humans!!!", yell = false },
	{ text = "FOOD FOR MY WOLVES!!!", yell = false },
	{ text = "SICK'EM!!!", yell = false },
}

monster.loot = {
	{ id = 3003, chance = 6360 }, -- rope
	{ name = "gold coin", chance = 52240, maxCount = 12 },
	{ name = "silver amulet", chance = 64 },
	{ name = "hand axe", chance = 14400 },
	{ name = "spear", chance = 10400 },
	{ name = "studded club", chance = 4000 },
	{ name = "leather helmet", chance = 9600 },
	{ id = 3412, chance = 3784 }, -- wooden shield
	{ name = "leather boots", chance = 8000 },
	{ name = "meat", chance = 12000 },
	{ name = "bunch of troll hair", chance = 800 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = 55 },
}

monster.defenses = {
	defense = 10,
	armor = 6,
	-- mitigation = ??,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 20 },
	{ type = COMBAT_EARTHDAMAGE, percent = -10 },
	{ type = COMBAT_FIREDAMAGE, percent = 0 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 10 },
	{ type = COMBAT_DEATHDAMAGE, percent = -10 },
}

monster.immunities = {
	{ type = "paralyze", condition = false },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = false },
	{ type = "bleed", condition = false },
}

mType:register(monster)
