local mType = Game.createMonsterType("Cult Scholar")
local monster = {}

monster.description = "a cult scholar"
monster.experience = 1100
monster.outfit = {
	lookType = 145,
	lookHead = 19,
	lookBody = 77,
	lookLegs = 3,
	lookFeet = 20,
	lookAddons = 1,
	lookMount = 0,
}

monster.events = {
	"CarlinVortexDeath",
}

monster.raceId = 1514
monster.Bestiary = {
	class = "Human",
	race = BESTY_RACE_HUMAN,
	toKill = 1000,
	FirstUnlock = 50,
	SecondUnlock = 500,
	CharmsPoints = 25,
	Stars = 3,
	Occurrence = 1,
	Locations = "Forbidden Temple (Carlin).",
}

monster.health = 1650
monster.maxHealth = 1650
monster.race = "blood"
monster.corpse = 22017
monster.speed = 130
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
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
	rewardBoss = false,
	illusionable = false,
	canPushItems = true,
	canPushCreatures = false,
	staticAttackChance = 90,
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
	{ text = "The Secrets are ours alone!", yell = false },
}

monster.loot = {
	{ id = 3446, chance = 72360, maxCount = 10 }, -- bolt
	{ id = 3031, chance = 60328, maxCount = 30 }, -- gold coin
	{ id = 3592, chance = 12320 }, -- grapes
	{ id = 239, chance = 9872, maxCount = 2 }, -- great health potion
	{ id = 3577, chance = 4000 }, -- meat
	{ id = 3349, chance = 664 }, -- crossbow
	{ id = 3563, chance = 608 }, -- green tunic
	{ id = 3048, chance = 560, maxCount = 2 }, -- might ring
	{ id = 3003, chance = 800 }, -- rope
	{ id = 3572, chance = 800 }, -- scarf
	{ id = 2815, chance = 664 }, -- scroll
	{ id = 3028, chance = 664 }, -- small diamond
	{ id = 3279, chance = 104 }, -- war hammer
	{ id = 3269, chance = 664 }, -- halberd
	{ id = 3415, chance = 264 }, -- guardian shield
	{ id = 3371, chance = 184 }, -- knight legs
	{ id = 3369, chance = 160 }, -- warrior helmet
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 10, maxDamage = -580 },
}

monster.defenses = {
	defense = 50,
	armor = 30,
	mitigation = 1.18,
	{ name = "combat", interval = 4000, chance = 25, type = COMBAT_HEALING, minDamage = 20, maxDamage = 80, effect = CONST_ME_MAGIC_BLUE, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 20 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 30 },
	{ type = COMBAT_EARTHDAMAGE, percent = 30 },
	{ type = COMBAT_FIREDAMAGE, percent = 30 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 30 },
	{ type = COMBAT_HOLYDAMAGE, percent = 30 },
	{ type = COMBAT_DEATHDAMAGE, percent = 30 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
