local mType = Game.createMonsterType("Sir Leonard")
local monster = {}

monster.description = "Sir Leonard"
monster.experience = 26000
monster.outfit = {
	lookType = 1847,
	lookHead = 0,
	lookBody = 19,
	lookLegs = 100,
	lookFeet = 95,
	lookAddons = 3,
	lookMount = 0,
}

monster.health = 22000
monster.maxHealth = 22000
monster.race = "undead"
monster.corpse = 51497
monster.speed = 125
monster.manaCost = 0

monster.events = {}

monster.changeTarget = { interval = 4000, chance = 10 }

monster.bosstiary = {
    bossRaceId = 2680,
	bossRace = RARITY_BANE,
}

monster.events = {
	"BetweenTheLinesMiniBossFirstKillRewards"
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

monster.light = { level = 0, color = 0 }

monster.voices = { interval = 5000, chance = 10 }

monster.summon = {
	maxSummons = 5,
	summons = {
		{ name = "Crusader Guardian", chance = 30, interval = 2000, count = 5 },
	},
}

monster.loot = {
	{ name = "platinum coin", minCount = 1, maxCount = 20, chance = 50000 },
	{ name = "etcher", minCount = 1, maxCount = 1, chance = 15000 },
	{ name = "blank imbuement scroll", minCount = 1, maxCount = 2, chance = 10000 },
	{ name = "proficiency catalyst", minCount = 1, maxCount = 1, chance = 3000 },
	{ name = "bronze amulet", chance = 5000 },
	{ name = "gearwheel chain", chance = 5000 },
	{ name = "protection amulet", chance = 5000 },
	{ name = "silver amulet", chance = 5000 },
	{ id = 3063, chance = 5000 }, -- time ring	
	{ id = 3092, chance = 5000 }, -- axe ring	
	{ id = 6299, chance = 5000 }, -- axe ring
	{ name = "ancient shield", chance = 4000 },
	{ name = "axe of Sir Leonard", chance = 3500 },
	{ name = "blank imbuement scroll", chance = 3000 },
	{ name = "green gem", chance = 3500 },
	{ id = 51430, chance = 3000 }, -- helmet of sir leonard
	{ id = 51429, chance = 3000 }, -- axe of sir leonard
	{ name = "knight armor", chance = 3000 },
	{ name = "knight axe", chance = 3000 },
	{ name = "knight legs", chance = 3000 },
	{ name = "warrior helmet", chance = 3000 },
	{ name = "white gem", chance = 3000 },
	{ name = "ink blade", chance = 250 },
	{ name = "ink brush", chance = 250 },
	{ name = "ink claw", chance = 250 },
	{ name = "ink quill", chance = 250 },
	{ name = "ink vine", chance = 250 },
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -420, effect = CONST_ME_DRAWBLOOD },

	{ name = "combat", interval = 2600, chance = 22, type = COMBAT_DEATHDAMAGE,
	  minDamage = -400, maxDamage = -520, range = 6, shootEffect = CONST_ANI_SUDDENDEATH, effect = CONST_ME_MORTAREA, target = true },

	{ name = "combat", interval = 2500, chance = 25, type = COMBAT_EARTHDAMAGE,
	  minDamage = 0, maxDamage = -480, radius = 3, shootEffect = CONST_ANI_SMALLEARTH, effect = CONST_ME_GREEN_RINGS, target = false },

	{ name = "combat", interval = 2800, chance = 18, type = COMBAT_DEATHDAMAGE,
	  minDamage = -400, maxDamage = -430, radius = 3, effect = CONST_ME_MORTAREA, target = false },
}

monster.defenses = {
	defense = 30,
	armor = 55,
	{ name = "combat", interval = 2500, chance = 15, type = COMBAT_HEALING, minDamage = 150, maxDamage = 300, effect = CONST_ME_MAGIC_BLUE, target = false },
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
