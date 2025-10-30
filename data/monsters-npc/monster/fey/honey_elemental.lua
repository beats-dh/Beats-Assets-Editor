local mType = Game.createMonsterType("Honey Elemental")
local monster = {}

monster.description = "a honey elemental"
monster.experience = 2400
monster.outfit = {
	lookType = 1733,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.health = 2560
monster.maxHealth = 2560
monster.race = "candy"
monster.raceId = 2551
monster.corpse = 48113
monster.speed = 200
monster.manaCost = 0

monster.Bestiary = {
	class = "Magical",
	race = BESTY_RACE_FEY,
	toKill = 1000,
	FirstUnlock = 100,
	SecondUnlock = 500,
	CharmsPoints = 25,
	Stars = 3,
	Occurrence = 0,
	Locations = "Chocolate Mines.",
}

monster.changeTarget = {
	interval = 5000,
	chance = 8,
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
	rewardBoss = false,
	illusionable = true,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 90,
	targetDistance = 0,
	runHealth = 0,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = true,
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
	{ text = "*Squelch*", yell = false },
	{ text = "*Slurp*", yell = false },
}

monster.loot = {
	{ name = "gold coin", chance = 59384, minCount = 1, maxCount = 100 },
	{ name = "platinum coin", chance = 59384, minCount = 1, maxCount = 8 },
	{ name = "magma legs", chance = 2280 },
	{ name = "magma boots", chance = 2600 },
	{ name = "terra amulet", chance = 2800 },
	{ name = "fire sword", chance = 2888 },
	{ id = 3028, chance = 2760, maxCount = 1 }, -- small diamond
	{ name = "small emerald", chance = 2920, maxCount = 2 },
	{ name = "strong health potion", chance = 14400 },
	{ id = 5902, chance = 772, maxCount = 3 }, -- honeycomb
	{ id = 48253, chance = 2050 }, -- Beijinho
	{ name = "dark chocolate coin", minCount = 1, maxCount = 6, chance = 280 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = -350, maxDamage = -450 },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_DEATHDAMAGE, minDamage = -400, maxDamage = -600, range = 7, shootEffect = CONST_ANI_SUDDENDEATH, effect = CONST_ME_MORTAREA, target = true }, -- Target precisa ser true, pra ele entender que ele vai jogar na pessoa que ele targetou
	{ name = "honeyelementalexplosion", interval = 2000, chance = 20, minDamage = -350, maxDamage = -550 },
}

monster.defenses = {
	defense = 34,
	armor = 34,
	mitigation = 1.02,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 30 },
	{ type = COMBAT_ENERGYDAMAGE, percent = -10 },
	{ type = COMBAT_EARTHDAMAGE, percent = 20 },
	{ type = COMBAT_FIREDAMAGE, percent = 20 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = -5 },
	{ type = COMBAT_HOLYDAMAGE, percent = 5 },
	{ type = COMBAT_DEATHDAMAGE, percent = 30 },
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
