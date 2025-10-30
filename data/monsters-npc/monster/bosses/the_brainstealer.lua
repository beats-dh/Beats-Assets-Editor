local mType = Game.createMonsterType("The Brainstealer")
local monster = {}

monster.description = "The Brainstealer"
monster.experience = 72000
monster.outfit = {
	lookType = 1412,
	lookHead = 94,
	lookBody = 88,
	lookLegs = 88,
	lookFeet = 114,
	lookAddons = 0,
	lookMount = 0,
}

monster.bosstiary = {
	bossRaceId = 2055,
	bossRace = RARITY_ARCHFOE,
}

monster.health = 300000
monster.maxHealth = monster.health
monster.race = "undead"
monster.corpse = 36843
monster.speed = 425

monster.summon = {
	maxSummons = 2,
	summons = {
		{ name = "brain parasite", chance = 20, interval = 4000, count = 1 },
	},
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
	{ name = "platinum coin", mincount = 10, maxcount = 50, chance = 70000 },
	{ name = "crystal coin", mincount = 1, maxcount = 5, chance = 70000 },
	{ name = "violet gem", chance = 35000 },
	{ name = "mastermind potion", chance = 35000 },
	{ name = "transcendence potion", chance = 35000 },
	{ name = "moonstone", chance = 35000 },
	{ name = "ultimate spirit potion", chance = 35000 },
	{ name = "white gem", chance = 35000 },
	{ name = "brainstealer's tissue", chance = 4200 },
	{ name = "brainstealer's brain", chance = 3500 },
	{ name = "brainstealer's brainwave", chance = 1750 },
	{ name = "eldritch breeches", chance = 126 },
	{ name = "eldritch monk boots", chance = 126 },
	{ name = "eldritch cowl", chance = 168 },
	{ name = "eldritch hood", chance = 158 },
	{ name = "eldritch bow", chance = 147 },
	{ name = "eldritch quiver", chance = 175 },
	{ name = "eldritch claymore", chance = 91 },
	{ name = "eldritch greataxe", chance = 77 },
	{ name = "eldritch warmace", chance = 224 },
	{ name = "eldritch crescent moon spade", chance = 105 },
	{ name = "eldritch shield", chance = 126 },
	{ name = "eldritch cuirass", chance = 112 },
	{ name = "eldritch folio", chance = 119 },
	{ name = "eldritch tome", chance = 133 },
	{ name = "eldritch rod", chance = 140 },
	{ name = "eldritch wand", chance = 126 },
	{ name = "gilded eldritch claymore", chance = 98 },
	{ name = "gilded eldritch greataxe", chance = 84 },
	{ name = "gilded eldritch warmace", chance = 70 },
	{ name = "gilded eldritch wand", chance = 56 },
	{ name = "gilded eldritch rod", chance = 42 },
	{ name = "gilded eldritch bow", chance = 35 },
	{ name = "gilded eldritch crescent moon spade", chance = 42 },
	{ name = "eldritch crystal", chance = 21 },
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", type = COMBAT_PHYSICALDAMAGE, interval = 2000, minDamage = 0, maxDamage = -900 },
	{ name = "combat", type = COMBAT_DEATHDAMAGE, interval = 2000, chance = 20, radius = 4, minDamage = -1200, maxDamage = -1900, effect = CONST_ME_MORTAREA, shootEffect = CONST_ANI_SUDDENDEATH, target = true, range = 7 },
	{ name = "combat", type = COMBAT_LIFEDRAIN, interval = 2000, chance = 20, radius = 4, minDamage = -700, maxDamage = -1000, effect = CONST_ME_DRAWBLOOD },
	{ name = "combat", type = COMBAT_LIFEDRAIN, interval = 2000, chance = 10, length = 8, spread = 0, minDamage = -1200, maxDamage = -1600, effect = CONST_ME_ELECTRICALSPARK },
}

monster.defenses = {
	defense = 78,
	armor = 78,
	mitigation = 3.27,
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
	{ type = COMBAT_DEATHDAMAGE, percent = 100 },
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
