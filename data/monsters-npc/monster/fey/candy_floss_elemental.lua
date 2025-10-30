local mType = Game.createMonsterType("candy floss elemental")
local monster = {}

monster.description = "a candy floss elemental"
monster.experience = 3540
monster.outfit = {
	lookType = 1749, --Checar looktype
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 94,
	lookAddons = 0,
	lookMount = 0,
}

monster.health = 3700
monster.maxHealth = 3700
monster.race = "candy"
monster.corpse = 48346
monster.speed = 200
monster.manaCost = 0

monster.raceId = 2533
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
	{ text = "Come into my fluffy embrace!" },
	{ text = "Want fairy floss? I will feed you up." },
}

monster.loot = {
	{ name = "gold coin", chance = 76928, minCount = 7, maxCount = 144 }, -- Gold Coin
	{ name = "platinum coin", chance = 70040, maxCount = 7 }, -- Platinum Coin
	{ id = 25694, chance = 5272 }, -- Fairy Wings
	{ name = "energy bar", chance = 80000 },
	{ name = "opal", chance = 2824 }, -- Opal
	{ name = "gummy rotworm", maxCount = 2, chance = 2674 },
	{ name = "springsprout rod", chance = 2240 },
	{ name = "violet gem", chance = 2376, maxCount = 2 },
	{ name = "rainbow quartz", chance = 2176, maxCount = 2 },
	{ id = 3054, chance = 1040 }, -- silver amulet
	{ id = 3093, chance = 960 }, -- club ring
	{ name = "milk chocolate coin", chance = 792 }, -- Milk Chocolate Coin
	-- {id = 10311, chance = 1248}, -- Wad of Fairy Floss ?????????????????
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = -650, maxDamage = -950 },
	{ name = "combat", interval = 2000, chance = 18, type = COMBAT_ENERGYDAMAGE, minDamage = -350, maxDamage = -550, range = 7, shootEffect = 62, effect = CONST_ME_PURPLEENERGY, target = true },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_ICEDAMAGE, minDamage = -400, maxDamage = -650, range = 7, shootEffect = 42, effect = CONST_ME_ICEATTACK, target = true },
	{ name = "candyflossexplosion", interval = 2000, chance = 20, minDamage = -350, maxDamage = -600 },
}

monster.defenses = {
	defense = 45,
	armor = 45,
	mitigation = 1.26,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 40 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 15 },
	{ type = COMBAT_EARTHDAMAGE, percent = -10 },
	{ type = COMBAT_FIREDAMAGE, percent = -15 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 15 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 20 },
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
