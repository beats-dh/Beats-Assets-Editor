local mType = Game.createMonsterType("Varnished Diremaw")
local monster = {}

monster.description = "a varnished diremaw"
monster.experience = 5900
monster.outfit = {
	lookType = 1397,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 2090
monster.Bestiary = {
	class = "Vermin",
	race = BESTY_RACE_VERMIN,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 0,
	Locations = "Dwelling of the Forgotten.",
}

monster.health = 9000
monster.maxHealth = 9000
monster.race = "blood"
monster.corpse = 36688
monster.speed = 120
monster.manaCost = 0

monster.changeTarget = {
	interval = 5000,
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
	staticAttackChance = 90,
	targetDistance = 1,
	runHealth = 0,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = true,
	canWalkOnFire = true,
	canWalkOnPoison = true,
}

monster.light = {
	level = 3,
	color = 71,
}

monster.voices = {
	interval = 5000,
	chance = 10,
}

monster.loot = {
	{ name = "platinum coin", chance = 56000, maxCount = 18 },
	{ name = "terra rod", chance = 24072 },
	{ name = "emerald bangle", chance = 14864, maxCount = 1 },
	{ name = "brown crystal splinter", chance = 7080, maxCount = 3 },
	{ id = 3039, chance = 8496, maxCount = 1 }, -- red gem
	{ name = "green crystal splinter", chance = 4952, maxCount = 3 },
	{ name = "small diamond", chance = 7784, maxCount = 6 },
	{ name = "varnished diremaw legs", chance = 10616, maxCount = 4 },
	{ name = "violet crystal shard", chance = 7784, maxCount = 3 },
	{ name = "cyan crystal fragment", chance = 4248 },
	{ name = "varnished diremaw brainpan", chance = 2120 },
	{ name = "green gem", chance = 4952, maxCount = 1 },
	{ name = "small emerald", chance = 7784, maxCount = 5 },
	{ name = "green crystal shard", chance = 9200, maxCount = 3 },
	{ name = "hailstorm rod", chance = 4952 },
	{ name = "diamond sceptre", chance = 2120 },
	{ name = "wand of starstorm", chance = 2120 },
	{ name = "springsprout rod", chance = 5664 },
	{ name = "glacier shoes", chance = 2120 },
	{ name = "spellbook of warding", chance = 1416 },
	{ name = "fur armor", chance = 1312 },
	{ name = "wood cape", chance = 2120 },
	{ name = "haunted blade", chance = 1096 },
	{ name = "glacier kilt", chance = 704 },
	{ name = "crown shield", chance = 704 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -400 },
	{ name = "combat", interval = 2000, chance = 30, type = COMBAT_ICEDAMAGE, minDamage = -700, maxDamage = -750, radius = 4, shootEffect = CONST_ANI_ICE, effect = CONST_ME_ICEATTACK, target = true }, -- avalanche
	{ name = "combat", interval = 2000, chance = 50, type = COMBAT_HOLYDAMAGE, minDamage = -730, maxDamage = -750, radius = 3, effect = CONST_ME_HOLYAREA, target = false },
	{ name = "combat", interval = 2000, chance = 40, type = COMBAT_ICEDAMAGE, minDamage = -800, maxDamage = -850, range = 4, shootEffect = CONST_ANI_ICE, target = true },
}

monster.defenses = {
	defense = 5,
	armor = 50,
	mitigation = 1.60,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = -5 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 15 },
	{ type = COMBAT_EARTHDAMAGE, percent = -5 },
	{ type = COMBAT_FIREDAMAGE, percent = 0 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 5 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
