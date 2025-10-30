local mType = Game.createMonsterType("Kroazur")
local monster = {}

monster.description = "Kroazur"
monster.experience = 2700
monster.outfit = {
	lookType = 842,
	lookHead = 0,
	lookBody = 114,
	lookLegs = 94,
	lookFeet = 80,
	lookAddons = 2,
	lookMount = 0,
}

monster.events = {
	"ThreatenedDreamsNightmareMonstersDeath",
}

monster.bosstiary = {
	bossRaceId = 1515,
	bossRace = RARITY_BANE,
}

monster.health = 3000
monster.maxHealth = 3000
monster.race = "undead"
monster.corpse = 6324
monster.speed = 250
monster.manaCost = 0

monster.changeTarget = {
	interval = 2000,
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
	rewardBoss = true,
	illusionable = false,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 98,
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
}

monster.loot = {
	{ name = "fairy wings", chance = 70000 },
	{ name = "gold coin", chance = 70000, maxCount = 365 },
	{ name = "platinum coin", chance = 70000, maxCount = 7 },
	{ name = "strong health potion", chance = 64022, maxCount = 2 },
	{ name = "great health potion", chance = 53431, maxCount = 3 },
	{ name = "small enchanted amethyst", chance = 37492, maxCount = 5 },
	{ name = "ancient coin", chance = 32886, maxCount = 3 },
	{ name = "gemmed figurine", chance = 22421 },
	{ name = "small enchanted emerald", chance = 7702, maxCount = 5 },
	{ name = "small enchanted ruby", chance = 1400 },
	{ name = "silver token", chance = 7098 },
	{ name = "cluster of solace", chance = 13972 },
	{ name = "red crystal fragment", chance = 6972 },
	{ name = "small enchanted sapphire", chance = 6230 },
	{ name = "assassin star", chance = 5978 },
	{ name = "gold token", chance = 4606 },
	{ name = "gold ingot", chance = 4487 },
	{ name = "nightmare blade", chance = 2114 },
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 200, chance = 20, minDamage = 0, maxDamage = -650 },
	{ name = "combat", interval = 200, chance = 20, type = COMBAT_DEATHDAMAGE, minDamage = -300, maxDamage = -500, target = false },
	{ name = "combat", interval = 500, chance = 10, type = COMBAT_DEATHDAMAGE, minDamage = -200, maxDamage = -300, length = 8, spread = 0, effect = CONST_ME_MORTAREA, target = true },
	{ name = "combat", interval = 500, chance = 10, type = COMBAT_DEATHDAMAGE, minDamage = -250, maxDamage = -300, radius = 8, effect = CONST_ME_MORTAREA, target = false },
}

monster.defenses = {
	defense = 65,
	armor = 55,
	--	mitigation = ???,
	{ name = "combat", interval = 3000, chance = 35, type = COMBAT_HEALING, minDamage = 400, maxDamage = 500, effect = CONST_ME_MAGIC_BLUE, target = false },
	{ name = "speed", interval = 2000, chance = 15, speedChange = 320, effect = CONST_ME_MAGIC_RED, target = false, duration = 5000 },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 20 },
	{ type = COMBAT_EARTHDAMAGE, percent = 80 },
	{ type = COMBAT_FIREDAMAGE, percent = 55 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 10 },
	{ type = COMBAT_HOLYDAMAGE, percent = -5 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
