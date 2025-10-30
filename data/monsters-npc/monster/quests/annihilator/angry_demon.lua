local mType = Game.createMonsterType("Angry Demon")
local monster = {}

monster.description = "an angry demon"
monster.experience = 6000
monster.outfit = {
	lookType = 35,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.health = 8200
monster.maxHealth = 8200
monster.race = "fire"
monster.corpse = 5995
monster.speed = 128
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 20,
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

monster.summon = {
	maxSummons = 1,
	summons = {
		{ name = "fire elemental", chance = 10, interval = 2000, count = 1 },
	},
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{ text = "Your soul will be mine!", yell = false },
	{ text = "CHAMEK ATH UTHUL ARAK!", yell = true },
	{ text = "I SMELL FEEEEAAAAAR!", yell = true },
	{ text = "Your resistance is futile!", yell = false },
	{ text = "MUHAHAHA", yell = true },
}

monster.loot = {
	{ name = "purple tome", chance = 944 },
	{ name = "gold coin", chance = 48000, maxCount = 100 },
	{ name = "platinum coin", chance = 48000, maxCount = 6 },
	{ name = "small emerald", chance = 7752, maxCount = 5 },
	{ name = "small amethyst", chance = 5800, maxCount = 5 },
	{ name = "small ruby", chance = 5944, maxCount = 5 },
	{ name = "small topaz", chance = 5976, maxCount = 5 },
	{ id = 3039, chance = 1776 }, -- red gem
	{ name = "demonic essence", chance = 11704 },
	{ name = "talon", chance = 2744 },
	{ name = "might ring", chance = 1512 },
	{ id = 3049, chance = 1736 }, -- stealth ring
	{ name = "platinum amulet", chance = 544 },
	{ name = "orb", chance = 2283 },
	{ name = "gold ring", chance = 840 },
	{ id = 3098, chance = 1592 }, -- ring of healing
	{ name = "giant sword", chance = 1584 },
	{ name = "ice rapier", chance = 1240 },
	{ name = "golden sickle", chance = 1152 },
	{ name = "fire axe", chance = 3224 },
	{ name = "devil helmet", chance = 944 },
	{ name = "golden legs", chance = 352 },
	{ name = "magic plate armor", chance = 104 },
	{ name = "mastermind shield", chance = 384 },
	{ name = "demon shield", chance = 592 },
	{ name = "fire mushroom", chance = 15728, maxCount = 6 },
	{ name = "demon horn", chance = 11936 },
	{ name = "assassin star", chance = 10040, maxCount = 10 },
	{ name = "demonrage sword", chance = 56 },
	{ id = 7393, chance = 72 }, -- demon trophy
	{ name = "great mana potion", chance = 17776, maxCount = 3 },
	{ name = "ultimate health potion", chance = 15632, maxCount = 3 },
	{ name = "great spirit potion", chance = 14808, maxCount = 3 },
}

monster.attacks = {
	-- {name ="melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -520},
	-- {name ="combat", interval = 2000, chance = 10, type = COMBAT_MANADRAIN, minDamage = 0, maxDamage = -120, range = 7, target = false},
	-- {name ="combat", interval = 2000, chance = 20, type = COMBAT_FIREDAMAGE, minDamage = -150, maxDamage = -250, range = 7, radius = 7, shootEffect = CONST_ANI_FIRE, effect = CONST_ME_FIREAREA, target = true},
	-- {name ="firefield", interval = 2000, chance = 10, range = 7, radius = 1, shootEffect = CONST_ANI_FIRE, target = true},
	-- {name ="combat", interval = 2000, chance = 10, type = COMBAT_LIFEDRAIN, minDamage = -300, maxDamage = -490, length = 8,spread = 03, effect = CONST_ME_PURPLEENERGY, target = false},
	-- {name ="combat", interval = 2000, chance = 10, type = COMBAT_ENERGYDAMAGE, minDamage = -210, maxDamage = -300, range = 1, shootEffect = CONST_ANI_ENERGY, target = false},
	-- {name ="speed", interval = 2000, chance = 15, speedChange = -700, radius = 1, effect = CONST_ME_MAGIC_RED, target = true, duration = 30000}
	{ name = "melee", interval = 2000, chance = 500, minDamage = 0, maxDamage = -1940 },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_MANADRAIN, minDamage = 0, maxDamage = -150, range = 7, target = false },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_FIREDAMAGE, minDamage = -650, maxDamage = -900, range = 7, radius = 7, shootEffect = CONST_ANI_FIRE, effect = CONST_ME_FIREAREA, target = true },
	{ name = "firefield", interval = 2000, chance = 10, range = 7, radius = 1, shootEffect = CONST_ANI_FIRE, target = true },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_LIFEDRAIN, minDamage = -300, maxDamage = -800, length = 8, spread = 0, effect = CONST_ME_PURPLEENERGY, target = false },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_ENERGYDAMAGE, minDamage = -1050, maxDamage = -1500, range = 1, shootEffect = CONST_ANI_ENERGY, target = true },
	{ name = "speed", interval = 2000, chance = 15, speedChange = -700, radius = 1, effect = CONST_ME_MAGIC_RED, target = true, duration = 30000 },
}

monster.defenses = {
	defense = 40,
	armor = 40,
	mitigation = 1.74,
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_HEALING, minDamage = 900, maxDamage = 1250, effect = CONST_ME_MAGIC_BLUE, target = false },
	{ name = "speed", interval = 2000, chance = 15, speedChange = 320, effect = CONST_ME_MAGIC_RED, target = false, duration = 5000 },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 25 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 50 },
	{ type = COMBAT_EARTHDAMAGE, percent = 40 },
	{ type = COMBAT_FIREDAMAGE, percent = 100 },
	{ type = COMBAT_LIFEDRAIN, percent = 100 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 100 },
	{ type = COMBAT_ICEDAMAGE, percent = -12 },
	{ type = COMBAT_HOLYDAMAGE, percent = -12 },
	{ type = COMBAT_DEATHDAMAGE, percent = 20 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
