local mType = Game.createMonsterType("Count Vlarkorth")
local monster = {}

monster.description = "Count Vlarkorth"
monster.experience = 55000
monster.outfit = {
	lookType = 1221,
	lookHead = 19,
	lookBody = 0,
	lookLegs = 83,
	lookFeet = 20,
	lookAddons = 1,
	lookMount = 0,
}

monster.events = {
	"CountVlarkorthTransform",
	"graveDangerBossDeath",
}

monster.health = 150000
monster.maxHealth = 150000
monster.race = "venom"
monster.corpse = 31599
monster.speed = 125
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 10,
}

monster.bosstiary = {
	bossRaceId = 1753,
	bossRace = RARITY_ARCHFOE,
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

monster.summon = {}

monster.voices = {
	interval = 5000,
	chance = 10,
}

monster.loot = {
	{ name = "platinum coin", minCount = 1, maxCount = 5, chance = 70000 },
	{ name = "crystal coin", minCount = 0, maxCount = 2, chance = 35000 },
	{ name = "supreme health potion", minCount = 0, maxCount = 6, chance = 24500 },
	{ name = "ultimate mana potion", minCount = 0, maxCount = 20, chance = 22400 },
	{ name = "ultimate spirit potion", minCount = 0, maxCount = 20, chance = 22400 },
	{ name = "bullseye potion", minCount = 0, maxCount = 10, chance = 8400 },
	{ name = "mastermind potion", minCount = 0, maxCount = 10, chance = 8400 },
	{ name = "transcendence potion", minCount = 0, maxCount = 10, chance = 8400 },
	{ name = "silver token", minCount = 0, maxCount = 2, chance = 5600 },
	{ name = "blue gem", chance = 6300 },
	{ id = 23542, chance = 3640 }, -- collar of blue plasma
	{ id = 23544, chance = 3640 }, -- collar of red plasma
	{ name = "blue gem", chance = 5950 },
	{ name = "gold ingot", minCount = 0, maxCount = 1, chance = 7000 },
	{ name = "green gem", chance = 5740 },
	{ name = "magic sulphur", chance = 4550 },
	{ id = 3039, chance = 5600 }, -- red gem
	{ id = 23529, chance = 3500 }, -- ring of blue plasma
	{ id = 23533, chance = 3500 }, -- ring of red plasma
	{ id = 23531, chance = 3500 }, -- ring of green plasma
	{ name = "skull staff", chance = 4900 },
	{ name = "yellow gem", chance = 5950 },
	{ name = "young lich worm", chance = 3850 },
	{ name = "bear skin", chance = 1120 },
	{ name = "embrace of nature", chance = 770 },
	{ name = "giant emerald", chance = 1190 },
	{ name = "giant ruby", chance = 1330 },
	{ name = "giant sapphire", chance = 1260 },
	{ name = "medal of valiance", chance = 840 },
	{ name = "terra helmet", chance = 490 },
	{ name = "final judgement", chance = 280 },
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -800, effect = CONST_ME_DRAWBLOOD },
	{ name = "combat", interval = 2300, chance = 20, type = COMBAT_LIFEDRAIN, minDamage = -250, maxDamage = -350, range = 1, effect = CONST_ME_MAGIC_RED, target = true },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_MANADRAIN, minDamage = -1, maxDamage = -250, length = 7, spread = 0, effect = CONST_ME_SMALLCLOUDS, target = false },
	{ name = "combat", interval = 2500, chance = 20, type = COMBAT_FIREDAMAGE, minDamage = -500, maxDamage = -1500, length = 7, spread = 0, effect = CONST_ME_HITBYFIRE, target = false },
}

monster.defenses = {
	defense = 25,
	armor = 78,
	--	mitigation = ???,
	{ name = "combat", interval = 2000, chance = 14, type = COMBAT_HEALING, minDamage = 150, maxDamage = 350, effect = CONST_ME_MAGIC_BLUE, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 5 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 5 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = -10 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
