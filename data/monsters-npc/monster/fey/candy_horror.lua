local mType = Game.createMonsterType("Candy Horror")
local monster = {}

monster.description = "a candy horror"
monster.experience = 3000
monster.outfit = {
	lookType = 1739,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.health = 3100
monster.maxHealth = 3100
monster.race = "candy"
monster.corpse = 48268
monster.speed = 200
monster.manaCost = 0

monster.changeTarget = {
	interval = 5000,
	chance = 8,
}

monster.strategiesTarget = {
	nearest = 100,
}

monster.raceId = 2535
monster.Bestiary = {
	class = "Magical",
	race = BESTY_RACE_FEY,
	toKill = 2500,
	FirstUnlock = 500,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 0,
	Locations = "Chocolate Mines.",
}

monster.flags = {
	summonable = false,
	attackable = true,
	hostile = true,
	convinceable = false,
	pushable = false,
	rewardBoss = false,
	illusionable = true,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 90,
	targetDistance = 0,
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
	{ text = "We will devour you", yell = false },
	{ text = "Wait for us, little treat", yell = false },
	{ text = "Horrraa!", yell = false },
}
monster.loot = {
	{ name = "gold coin", chance = 80000, maxCount = 30 },
	{ name = "platinum coin", chance = 59336, minCount = 1, maxCount = 6 },
	{ id = 281, chance = 5248 }, -- Giant Shimmering Pearl
	{ id = 3039, chance = 4504 }, -- Red Gem
	{ name = "energy bar", chance = 4272 }, -- Energy Bar
	{ id = 3429, chance = 2000 }, -- Black Shield
	{ name = "gummy rotworm", minCount = 1, maxCount = 2, chance = 2674 },
	{ id = 3072, chance = 1392 }, -- Wand of Decay
	{ name = "strawberry", chance = 1112, maxCount = 2 },
	{ id = 48252, chance = 1064 }, -- Brigadeiro
	{ id = 3036, chance = 2592 }, -- violet gem
	{ name = "dark chocolate coin", minCount = 1, maxCount = 64, chance = 280 },
	{ id = 7419, chance = 2240 }, -- Dreaded Cleaver
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = -450, maxDamage = -650 },
	{ name = "sugar daddy explosion", interval = 3000, chance = 20, minDamage = -300, maxDamage = -650 },
	{ name = "candyhorrorclaws", interval = 2500, chance = 15, minDamage = -250, maxDamage = -490 },
	{ name = "combat", interval = 2500, chance = 15, type = COMBAT_DEATHDAMAGE, minDamage = -400, maxDamage = -650, length = 3, spread = 3, effect = CONST_ME_CAKE, target = true },
}

monster.defenses = {
	defense = 43,
	armor = 43,
	mitigation = 1.21,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 5 },
	{ type = COMBAT_ENERGYDAMAGE, percent = -10 },
	{ type = COMBAT_EARTHDAMAGE, percent = 10 },
	{ type = COMBAT_FIREDAMAGE, percent = 5 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = -15 },
	{ type = COMBAT_DEATHDAMAGE, percent = 50 },
}

monster.immunities = {
	{ type = "paralyze", condition = false },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType.onThink = function(monster, interval) end

mType.onAppear = function(monster, creature) end

mType.onDisappear = function(monster, creature) end

mType.onMove = function(monster, creature, fromPosition, toPosition) end

mType.onSay = function(monster, creature, type, message) end

mType:register(monster)
