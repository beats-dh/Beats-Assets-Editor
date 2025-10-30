local mType = Game.createMonsterType("Hero")
local monster = {}

monster.description = "a hero"
monster.experience = 1200
monster.outfit = {
	lookType = 73,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 73
monster.Bestiary = {
	class = "Human",
	race = BESTY_RACE_HUMAN,
	toKill = 1000,
	FirstUnlock = 50,
	SecondUnlock = 500,
	CharmsPoints = 25,
	Stars = 3,
	Occurrence = 0,
	Locations = "In Hero Cave in Edron, it has many rooms with many kinds of monsters and different amounts of Heroes. \z
		Also in Magician Quarter, accompanied by other monsters. Old Fortress.",
}

monster.health = 1400
monster.maxHealth = 1400
monster.race = "blood"
monster.corpse = 18134
monster.speed = 140
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 10,
}

monster.strategiesTarget = {
	nearest = 80,
	health = 10,
	damage = 10,
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
	staticAttackChance = 90,
	targetDistance = 1,
	runHealth = 0,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = true,
	canWalkOnFire = false,
	canWalkOnPoison = true,
}

monster.light = {
	level = 0,
	color = 0,
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{ text = "Let's have a fight!", yell = false },
	{ text = "I will sing a tune at your grave.", yell = false },
	{ text = "Have you seen princess Lumelia?", yell = false },
	{ text = "Welcome to my battleground!", yell = false },
}

monster.loot = {
	{ id = 2815, chance = 36000 }, -- scroll
	{ id = 2949, chance = 1312 }, -- lyre
	{ name = "piggy bank", chance = 64 },
	{ id = 3003, chance = 1752 }, -- rope
	{ name = "wedding ring", chance = 3928 },
	{ name = "gold coin", chance = 47600, maxCount = 100 },
	{ name = "might ring", chance = 376 },
	{ name = "two handed sword", chance = 1200 },
	{ name = "war hammer", chance = 696 },
	{ name = "fire sword", chance = 440 },
	{ name = "bow", chance = 10640 },
	{ name = "crown armor", chance = 392 },
	{ name = "crown legs", chance = 528 },
	{ name = "crown helmet", chance = 360 },
	{ name = "crown shield", chance = 224 },
	{ name = "arrow", chance = 20800, maxCount = 13 },
	{ name = "green tunic", chance = 6400 },
	{ name = "scarf", chance = 888 },
	{ name = "meat", chance = 6560, maxCount = 3 },
	{ name = "grapes", chance = 15880 },
	{ name = "red rose", chance = 16360 },
	{ name = "red piece of cloth", chance = 1605 },
	{ name = "sniper arrow", chance = 9120, maxCount = 4 },
	{ name = "great health potion", chance = 576 },
	{ name = "small notebook", chance = 744 },
	{ name = "scroll of heroic deeds", chance = 4000 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -240 },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_PHYSICALDAMAGE, minDamage = 0, maxDamage = -120, range = 7, shootEffect = CONST_ANI_ARROW, target = false },
}

monster.defenses = {
	defense = 40,
	armor = 35,
	mitigation = 1.32,
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_HEALING, minDamage = 200, maxDamage = 250, effect = CONST_ME_MAGIC_BLUE, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 10 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 40 },
	{ type = COMBAT_EARTHDAMAGE, percent = 50 },
	{ type = COMBAT_FIREDAMAGE, percent = 30 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 10 },
	{ type = COMBAT_HOLYDAMAGE, percent = 50 },
	{ type = COMBAT_DEATHDAMAGE, percent = -20 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
