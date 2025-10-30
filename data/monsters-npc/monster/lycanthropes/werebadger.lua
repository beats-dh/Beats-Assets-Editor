local mType = Game.createMonsterType("Werebadger")
local monster = {}

monster.description = "a werebadger"
monster.experience = 1600
monster.outfit = {
	lookType = 729,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 1144
monster.Bestiary = {
	class = "Lycanthrope",
	race = BESTY_RACE_LYCANTHROPE,
	toKill = 1000,
	FirstUnlock = 50,
	SecondUnlock = 500,
	CharmsPoints = 25,
	Stars = 3,
	Occurrence = 0,
	Locations = "Grimvale: -1 floor from ground level, also seen on surface during full moon (12th-14th of every month). \z
		Also in the were-beasts cave south-west of Edron and in the Last Sanctum.",
}

monster.health = 1700
monster.maxHealth = 1700
monster.race = "blood"
monster.corpse = 22067
monster.speed = 130
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
	targetDistance = 1,
	runHealth = 275,
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
	{ text = "SNUFFLE", yell = true },
	{ text = "Sniff Sniff", yell = false },
}

monster.loot = {
	{ id = 3031, chance = 77600, maxCount = 242 }, -- gold coin
	{ id = 3035, chance = 14560, maxCount = 5 }, -- platinum coin
	{ id = 8017, chance = 1600 }, -- beetroot
	{ id = 3725, chance = 1600 }, -- brown mushroom
	{ id = 268, chance = 1768 }, -- mana potion
	{ id = 237, chance = 960 }, -- strong mana potion
	{ id = 3741, chance = 1520 }, -- troll green
	{ id = 22051, chance = 760 }, -- werebadger claws
	{ id = 22055, chance = 624 }, -- werebadger skull
	{ id = 22086, chance = 160 }, -- badger boots
	{ id = 3055, chance = 128 }, -- platinum amulet
	{ id = 3098, chance = 344 }, -- ring of healing
	{ id = 8082, chance = 176 }, -- underworld rod
	{ id = 8094, chance = 160 }, -- wand of voodoo
	{ id = 22083, chance = 120 }, -- moonlight crystals
	{ id = 22060, chance = 160 }, -- werewolf amulet
	{ id = 22101, chance = 80 }, -- werebadger trophy
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, skill = 50, attack = 60, condition = { type = CONDITION_POISON, totalDamage = 140, interval = 4000 } },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_LIFEDRAIN, minDamage = -21, maxDamage = -150, range = 7, shootEffect = CONST_ANI_EARTH, effect = CONST_ME_CARNIPHILA, target = true },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_EARTHDAMAGE, minDamage = -10, maxDamage = -100, length = 8, spread = 0, effect = CONST_ME_CARNIPHILA, target = false },
	{ name = "speed", interval = 4000, chance = 20, radius = 7, effect = CONST_ME_POFF, target = true },
}

monster.defenses = {
	defense = 30,
	armor = 31,
	mitigation = 0.75,
	{ name = "combat", interval = 2000, chance = 25, type = COMBAT_HEALING, minDamage = 50, maxDamage = 100, effect = CONST_ME_MAGIC_BLUE, target = false },
	{ name = "invisible", interval = 2000, chance = 20, effect = CONST_ME_MAGIC_BLUE },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 5 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 10 },
	{ type = COMBAT_EARTHDAMAGE, percent = 50 },
	{ type = COMBAT_FIREDAMAGE, percent = -5 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = -5 },
	{ type = COMBAT_HOLYDAMAGE, percent = -5 },
	{ type = COMBAT_DEATHDAMAGE, percent = 40 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
