local mType = Game.createMonsterType("Nibblemaw")
local monster = {}

monster.description = "a nibblemaw"
monster.experience = 2700
monster.outfit = {
	lookType = 1737,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 94,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 2531
monster.Bestiary = {
	class = "Magical",
	race = BESTY_RACE_FEY,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 0,
	Locations = "Chocolate Mines.",
}

monster.health = 2900
monster.maxHealth = 2900
monster.race = "candy"
monster.corpse = 48260
monster.speed = 200
monster.manaCost = 0

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
	rewardBoss = false,
	illusionable = false,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 80,
	targetDistance = 0,
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
	{ text = "*chomp* Mmmoh! *chomp*", yell = false },
	{ text = "Mwaaahgod! Overmwaaaaah! *gurgle*", yell = false },
	{ text = "Mmmwahmwahmwhah, mwaaah!", yell = false },
}

monster.loot = {
	{ name = "gold coin", chance = 80000, maxCount = 100 },
	{ name = "platinum coin", chance = 59336, minCount = 1, maxCount = 6 },
	{ name = "frazzle tongue", chance = 12000 },
	{ name = "frazzle skin", chance = 11200 },
	{ name = "assassin dagger", chance = 2128 },
	{ name = "onyx chip", chance = 3040, minCount = 1, maxCount = 3 },
	{ name = "yellow gem", chance = 2560 },
	{ name = "red crystal fragment", chance = 3032 },
	{ name = "melon", chance = 2866 },
	{ name = "strong health potion", chance = 2635 },
	{ name = "dark chocolate coin", minCount = 1, maxCount = 64, chance = 280 },
	{ name = "raspberry", minCount = 1, maxCount = 2, chance = 1966 },
	{ name = "lime tart", minCount = 1, maxCount = 2, chance = 2026 },
	{ name = "gummy rotworm", minCount = 1, maxCount = 2, chance = 2674 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = -300, maxDamage = -500 },
	{ name = "nibblemawwave", interval = 3000, chance = 15, minDamage = -300, maxDamage = -650 },
	{ name = "nibblemawstonearea", interval = 2500, chance = 12, minDamage = -300, maxDamage = -650 },
	{ name = "combat", interval = 2500, chance = 13, type = COMBAT_DEATHDAMAGE, minDamage = -300, maxDamage = -450, shootEffect = CONST_ANI_SUDDENDEATH, effect = CONST_ME_MORTAREA, target = false },
}

monster.defenses = {
	defense = 48,
	armor = 48,
	mitigation = 1.10,
	{ name = "combat", interval = 2000, chance = 8, type = COMBAT_HEALING, minDamage = 250, maxDamage = 425, effect = CONST_ME_HITBYPOISON, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 10 },
	{ type = COMBAT_ENERGYDAMAGE, percent = -15 },
	{ type = COMBAT_EARTHDAMAGE, percent = 10 },
	{ type = COMBAT_FIREDAMAGE, percent = 0 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = -10 },
	{ type = COMBAT_DEATHDAMAGE, percent = 40 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
