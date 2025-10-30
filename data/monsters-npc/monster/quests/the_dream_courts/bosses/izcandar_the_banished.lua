local mType = Game.createMonsterType("Izcandar the Banished")
local monster = {}

monster.description = "Izcandar the Banished"
monster.experience = 55000
monster.outfit = {
	lookType = 1137,
	lookHead = 19,
	lookBody = 95,
	lookLegs = 76,
	lookFeet = 38,
	lookAddons = 2,
	lookMount = 0,
}

monster.bosstiary = {
	bossRaceId = 1699,
	bossRace = RARITY_NEMESIS,
}

monster.health = 320000
monster.maxHealth = 320000
monster.race = "blood"
monster.corpse = 6068
monster.speed = 125
monster.manaCost = 0

monster.events = {
	"dreamCourtsDeath",
	"izcandarThink",
}

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
	{ id = 23529, chance = 4375 }, -- ring of blue plasma
	{ id = 23531, chance = 11669 }, -- ring of green plasma
	{ id = 23531, chance = 2191 }, -- ring of green plasma
	{ id = 23542, chance = 23331 }, -- collar of blue plasma
	{ id = 23542, chance = 6566 }, -- collar of blue plasma
	{ id = 23543, chance = 8750 }, -- collar of green plasma
	{ id = 23544, chance = 6566 }, -- collar of red plasma
	{ id = 3039, chance = 23331 }, -- red gem
	{ id = 3341, chance = 2191 }, -- arcane staff
	{ name = "berserk potion", chance = 13125 },
	{ name = "blue gem", chance = 35000 },
	{ name = "bullseye potion", chance = 17500 },
	{ name = "chaos mace", chance = 6566 },
	{ name = "crystal coin", chance = 23331, maxCount = 3 },
	{ name = "energy bar", chance = 70000 },
	{ name = "energy bar", chance = 65625 },
	{ name = "giant sapphire", chance = 2191 },
	{ id = 282, chance = 23331 }, -- giant shimmering pearl
	{ name = "gold ingot", chance = 23331 },
	{ name = "gold token", chance = 50316 },
	{ name = "green gem", chance = 15316, maxCount = 2 },
	{ name = "huge chunk of crude iron", chance = 23331 },
	{ name = "izcandar's snow globe", chance = 2191 },
	{ name = "izcandar's sundial", chance = 2191 },
	{ name = "magic sulphur", chance = 11669 },
	{ name = "mastermind potion", chance = 6566 },
	{ name = "mysterious remains", chance = 65625 },
	{ name = "piggy bank", chance = 65625 },
	{ name = "platinum coin", chance = 70000, maxCount = 9 },
	{ name = "pomegranate", chance = 11669 },
	{ name = "ring of the sky", chance = 8750 },
	{ name = "royal star", chance = 35000, maxCount = 199 },
	{ name = "silver token", chance = 70000, maxCount = 2 },
	{ name = "skull staff", chance = 4375 },
	{ name = "soul stone", chance = 11669 },
	{ name = "summerblade", chance = 2191 },
	{ name = "supreme health potion", chance = 46669, maxCount = 14 },
	{ name = "ultimate mana potion", chance = 39375, maxCount = 20 },
	{ name = "ultimate spirit potion", chance = 46669, maxCount = 5 },
	{ name = "violet gem", chance = 2191 },
	{ name = "winterblade", chance = 4375 },
	{ name = "yellow gem", chance = 24066, maxCount = 2 },
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -1000 },
	{ name = "combat", interval = 3600, chance = 17, type = COMBAT_FIREDAMAGE, minDamage = -500, maxDamage = -1500, length = 5, spread = 2, effect = CONST_ME_FIREAREA, target = false },
	{ name = "combat", interval = 4100, chance = 20, type = COMBAT_FIREDAMAGE, minDamage = -500, maxDamage = -2000, length = 8, spread = 0, effect = CONST_ME_FIREAREA, target = false },
	{ name = "combat", interval = 4700, chance = 17, type = COMBAT_ICEDAMAGE, minDamage = -500, maxDamage = -1500, length = 5, spread = 2, effect = CONST_ME_ICEATTACK, target = false },
	{ name = "combat", interval = 3100, chance = 20, type = COMBAT_ICEDAMAGE, minDamage = -500, maxDamage = -2000, length = 8, spread = 0, effect = CONST_ME_ICETORNADO, target = false },
	{ name = "speed", interval = 2000, chance = 15, speedChange = -700, radius = 1, effect = CONST_ME_MAGIC_RED, target = true, duration = 30000 },
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
	{ type = COMBAT_FIREDAMAGE, percent = 0 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 10 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
