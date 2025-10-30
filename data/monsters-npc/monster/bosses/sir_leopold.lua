local mType = Game.createMonsterType("Sir Leopold")
local monster = {}

monster.description = "Sir Leopold"
monster.experience = 26000
monster.outfit = {
	lookType = 1847,
	lookHead = 78,
	lookBody = 19,
	lookLegs = 94,
	lookFeet = 95,
	lookAddons = 3,
	lookMount = 0,
}

monster.health = 18000
monster.maxHealth = 18000
monster.race = "undead"
monster.corpse = 51497
monster.speed = 125
monster.manaCost = 0

monster.events = {}

monster.changeTarget = { interval = 4000, chance = 10 }

monster.bosstiary = {
	bossRaceId = 2694,
	bossRace = RARITY_NEMESIS,
}

monster.strategiesTarget = { nearest = 100 }

monster.flags = {
	summonable = false,
	attackable = true,
	hostile = true,
	convinceable = false,
	pushable = false,
	rewardBoss = true,
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
}

monster.loot = {
	{ name = "platinum coin", minCount = 20, maxCount = 100, chance = 50000 },
	{ name = "etcher", minCount = 1, maxCount = 1, chance = 45000 },
	{ name = "blank imbuement scroll", minCount = 1, maxCount = 2, chance = 35000 },
	{ name = "proficiency catalyst", minCount = 1, maxCount = 1, chance = 25000 },
	{ name = "ancient shield", chance = 5000 },
	{ name = "blue gem", chance = 5000 },
	{ name = "stone skin amulet", chance = 5000 },
	{ id = 3063, chance = 5000 }, -- time ring	
	{ id = 3092, chance = 5000 }, -- axe ring	
	{ id = 6299, chance = 5000 }, -- axe ring
	{ name = "warrior helmet", chance = 5000 },
	{ name = "white gem", chance = 5000 },
	{ name = "protection amulet", chance = 5000 },
	{ name = "bronze amulet", chance = 5000 },
	{ name = "knight armor", chance = 5000 },
	{ name = "silver amulet", chance = 5000 },
	{ name = "colourful quill", chance = 5000 },
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -900, effect = CONST_ME_DRAWBLOOD },
	{ name = "combat", interval = 2500, chance = 25, type = COMBAT_FIREDAMAGE, minDamage = -450, maxDamage = -850, radius = 3, shootEffect = CONST_ANI_FIRE, effect = CONST_ME_FIREAREA, target = false },
	{ name = "combat", interval = 2600, chance = 22, type = COMBAT_DEATHDAMAGE, minDamage = -550, maxDamage = -750, range = 6, shootEffect = CONST_ANI_SUDDENDEATH, effect = CONST_ME_MORTAREA, target = true },
}

monster.defenses = {
	defense = 30,
	armor = 55,
	{ name = "combat", interval = 2500, chance = 20, type = COMBAT_HEALING, minDamage = 200, maxDamage = 325, effect = CONST_ME_MAGIC_BLUE, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
