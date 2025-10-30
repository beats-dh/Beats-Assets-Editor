local mType = Game.createMonsterType("Malofur Mangrinder")
local monster = {}

monster.description = "Malofur Mangrinder"
monster.experience = 55000
monster.outfit = {
	lookType = 1120,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.health = 320000
monster.maxHealth = 320000
monster.race = "blood"
monster.corpse = 30017
monster.speed = 125
monster.manaCost = 0

monster.events = {
	"dreamCourtsDeath",
}

monster.changeTarget = {
	interval = 4000,
	chance = 10,
}

monster.bosstiary = {
	bossRaceId = 1696,
	bossRace = RARITY_NEMESIS,
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
	{ text = "RAAAARGH! I'M MASHING YE TO DUST BOOM!", yell = true },
	{ text = "BOOOM!", yell = true },
	{ text = "BOOOOM!!!", yell = true },
	{ text = "BOOOOOM!!!", yell = true },
}

monster.loot = {
	{ id = 23544, chance = 15554 }, -- collar of red plasma
	{ id = 23529, chance = 9723 }, --  ring of blue plasma
	{ id = 23531, chance = 5831 }, -- ring of green plasma
	{ id = 23542, chance = 5831 }, -- collar of blue plasma
	{ id = 23543, chance = 11669 }, -- collar of green plasma
	{ id = 3039, chance = 33054 }, -- red gem
	{ name = "berserk potion", chance = 14000 },
	{ name = "blue gem", chance = 14000 },
	{ name = "bullseye potion", chance = 14000 },
	{ name = "chaos mace", chance = 5831 },
	{ name = "crystal coin", chance = 17500, maxCount = 2 },
	{ name = "energy bar", chance = 62223 },
	{ id = 282, chance = 5831 }, -- giant shimmering pearl
	{ name = "gold ingot", chance = 15554 },
	{ name = "gold token", chance = 42000, maxCount = 3 },
	{ name = "green gem", chance = 7777 },
	{ name = "huge chunk of crude iron", chance = 28000 },
	{ name = "magic sulphur", chance = 3892 },
	{ name = "mastermind potion", chance = 15554 },
	{ name = "mysterious remains", chance = 62223 },
	{ name = "piggy bank", chance = 68054 },
	{ name = "platinum coin", chance = 70000, maxCount = 8 },
	{ name = "pomegranate", chance = 11669 },
	{ name = "resizer", chance = 1946 },
	{ id = 23533, chance = 3892 }, -- ring of red plasma
	{ name = "ring of the sky", chance = 1946 },
	{ name = "royal star", chance = 36946 },
	{ name = "silver token", chance = 64169, maxCount = 3 },
	{ name = "skull staff", chance = 5831 },
	{ name = "soul stone", chance = 5831 },
	{ name = "supreme health potion", chance = 56000, maxCount = 29 },
	{ name = "ultimate mana potion", chance = 38892, maxCount = 20 },
	{ name = "ultimate spirit potion", chance = 56000, maxCount = 13 },
	{ name = "violet gem", chance = 5831 },
	{ name = "yellow gem", chance = 31108, maxCount = 2 },
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "combat", interval = 2000, chance = 100, type = COMBAT_PHYSICALDAMAGE, minDamage = -400, maxDamage = -2500, target = true }, -- basic attack
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_PHYSICALDAMAGE, minDamage = -400, maxDamage = -5500, effect = CONST_ME_GROUNDSHAKER, radius = 4, target = false }, -- groundshaker
}

monster.defenses = {
	defense = 60,
	armor = 60,
	--	mitigation = ???,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 5 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 100 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
