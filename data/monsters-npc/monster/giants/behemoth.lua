local mType = Game.createMonsterType("Behemoth")
local monster = {}

monster.description = "a behemoth"
monster.experience = 2500
monster.outfit = {
	lookType = 55,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 55
monster.Bestiary = {
	class = "Giant",
	race = BESTY_RACE_GIANT,
	toKill = 1000,
	FirstUnlock = 50,
	SecondUnlock = 500,
	CharmsPoints = 25,
	Stars = 3,
	Occurrence = 0,
	Locations = "Cyclopolis, deepest part of Tarpit Tomb after the flame, Forbidden Lands, Vandura Mountain, \z
		Deeper Banuta, Serpentine Tower (unreachable), deep into the Formorgar Mines, Arena and Zoo Quarter, \z
		The Dark Path, Lower Spike, Chyllfroest, Medusa Tower and Underground Glooth Factory (west side).",
}

monster.health = 4000
monster.maxHealth = 4000
monster.race = "blood"
monster.corpse = 5999
monster.speed = 170
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 10,
}

monster.strategiesTarget = {
	nearest = 70,
	damage = 30,
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
	canWalkOnEnergy = false,
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
	{ text = "Crush the intruders!", yell = false },
	{ text = "You're so little!", yell = false },
	{ text = "Human flesh -  delicious!", yell = false },
}

monster.loot = {
	{ id = 2893, chance = 80 }, -- amphora
	{ name = "crystal necklace", chance = 2024 },
	{ name = "gold coin", chance = 80000, maxCount = 200 },
	{ name = "small amethyst", chance = 5104, maxCount = 5 },
	{ name = "platinum coin", chance = 47840, maxCount = 5 },
	{ name = "strange symbol", chance = 600 },
	{ id = 3116, chance = 536 }, -- big bone
	{ name = "two handed sword", chance = 4784 },
	{ name = "double axe", chance = 8408 },
	{ name = "giant sword", chance = 805 },
	{ name = "crowbar", chance = 80 },
	{ name = "war axe", chance = 40 },
	{ name = "plate armor", chance = 3144 },
	{ name = "dark armor", chance = 3496 },
	{ id = 3456, chance = 520 }, -- pick
	{ name = "steel boots", chance = 304 },
	{ name = "meat", chance = 24000, maxCount = 6 },
	{ name = "perfect behemoth fang", chance = 872 },
	{ name = "behemoth claw", chance = 688 },
	{ name = "assassin star", chance = 7800, maxCount = 5 },
	{ id = 7396, chance = 136 }, -- behemoth trophy
	{ name = "titan axe", chance = 72 },
	{ name = "great health potion", chance = 4096 },
	{ name = "battle stone", chance = 11200 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -450 },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_PHYSICALDAMAGE, minDamage = 0, maxDamage = -200, range = 7, shootEffect = CONST_ANI_LARGEROCK, target = false },
}

monster.defenses = {
	defense = 45,
	armor = 50,
	mitigation = 1.74,
	{ name = "speed", interval = 2000, chance = 15, speedChange = 300, effect = CONST_ME_MAGIC_RED, target = false, duration = 5000 },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 10 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 10 },
	{ type = COMBAT_EARTHDAMAGE, percent = 80 },
	{ type = COMBAT_FIREDAMAGE, percent = 30 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = -10 },
	{ type = COMBAT_HOLYDAMAGE, percent = 30 },
	{ type = COMBAT_DEATHDAMAGE, percent = -5 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
