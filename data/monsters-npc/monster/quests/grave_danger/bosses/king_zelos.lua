local mType = Game.createMonsterType("King Zelos")
local monster = {}

monster.description = "King Zelos"
monster.experience = 75000
monster.outfit = {
	lookType = 1224,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.health = 480000
monster.maxHealth = 480000
monster.race = "venom"
monster.corpse = 31611
monster.speed = 212

monster.events = {
	"zelos_damage",
	"zelos_init",
	"graveDangerBossDeath",
}

monster.bosstiary = {
	bossRaceId = 1784,
	bossRace = RARITY_ARCHFOE,
}

monster.changeTarget = {
	interval = 4000,
	chance = 10,
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
	canWalkOnEnergy = true,
	canWalkOnFire = true,
	canWalkOnPoison = true,
}

monster.loot = {
	{ name = "platinum coin", minCount = 1, maxCount = 5, chance = 70000 },
	{ name = "crystal coin", minCount = 0, maxCount = 5, chance = 35000 },
	{ name = "supreme health potion", minCount = 0, maxCount = 20, chance = 31500 },
	{ name = "ultimate mana potion", minCount = 0, maxCount = 6, chance = 29400 },
	{ name = "ultimate spirit potion", minCount = 0, maxCount = 14, chance = 29400 },
	{ name = "bullseye potion", minCount = 0, maxCount = 10, chance = 15400 },
	{ name = "berserk potion", minCount = 0, maxCount = 10, chance = 15400 },
	{ name = "gold token", minCount = 0, maxCount = 3, chance = 12600 },
	{ name = "silver token", minCount = 0, maxCount = 3, chance = 17500 },
	{ name = "green gem", chance = 13300 },
	{ id = 3039, chance = 12950 }, -- red gem
	{ name = "yellow gem", chance = 12950 },
	{ name = "giant sapphire", chance = 11760 },
	{ id = 23543, chance = 10640 }, -- collar of green plasma
	{ name = "magma coat", chance = 10640 },
	{ name = "gold ingot", minCount = 0, maxCount = 1, chance = 12600 },
	{ name = "red tome", chance = 12740 },
	{ id = 23529, chance = 8400 }, -- ring of blue plasma
	{ id = 23533, chance = 8400 }, -- ring of red plasma
	{ name = "young lich worm", chance = 3850 },
	{ name = "mortal mace", chance = 910 },
	{ name = "golden hyaena pendant", chance = 770 },
	{ name = "bow of cataclysm", chance = 420 },
	{ name = "galea mortis", chance = 385 },
	{ name = "shadow cowl", chance = 371 },
	{ name = "toga mortis", chance = 350 },
	{ name = "death oyoroi", chance = 350 },
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", type = COMBAT_PHYSICALDAMAGE, interval = 2000, minDamage = -900, maxDamage = -2700 },
	{ name = "combat", type = COMBAT_FIREDAMAGE, interval = 2000, chance = 15, length = 8, spread = 0, minDamage = -1200, maxDamage = -3200, effect = CONST_ME_HITBYFIRE },
	{ name = "combat", type = COMBAT_LIFEDRAIN, interval = 2000, chance = 10, length = 8, spread = 0, minDamage = -600, maxDamage = -1600, effect = CONST_ME_SMALLCLOUDS },
	{ name = "combat", type = COMBAT_DEATHDAMAGE, interval = 2000, chance = 30, radius = 6, minDamage = -1200, maxDamage = -1500, effect = CONST_ME_MORTAREA, target = false },
	{ name = "combat", type = COMBAT_DEATHDAMAGE, interval = 2000, chance = 20, length = 8, minDamage = -1700, maxDamage = -2000, effect = CONST_ME_MORTAREA, target = false },
}

monster.defenses = {
	defense = 130,
	armor = 130,
	{ name = "combat", type = COMBAT_HEALING, chance = 15, interval = 2000, minDamage = 1450, maxDamage = 5350, effect = CONST_ME_MAGIC_BLUE },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 10 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 3 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 5 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "invisible", condition = true },
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{ text = "Feel the power of death unleashed!", yell = false },
	{ text = "I will rule again and my realm of death will span the world!", yell = false },
	{ text = "My lich-knights will conquer this world for me!", yell = false },
}

mType:register(monster)
