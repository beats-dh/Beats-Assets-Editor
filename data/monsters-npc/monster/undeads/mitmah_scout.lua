local mType = Game.createMonsterType("Mitmah Scout")
local monster = {}

monster.name = "Mitmah Scout"
monster.description = "a mitmah scout"
monster.experience = 3230
monster.outfit = {
	lookType = 1709,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.health = 3940
monster.maxHealth = 3940
monster.runHealth = 0
monster.race = "blood"
monster.corpse = 44667
monster.speed = 140
monster.summonCost = 0
monster.raceId = 2460

monster.Bestiary = {
	class = "Undead",
	race = BESTY_RACE_EXTRA_DIMENSIONAL,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 1,
	Locations = "Iksupan",
}

monster.changeTarget = {
	interval = 2000,
	chance = 0,
}

monster.flags = {
	attackable = true,
	hostile = true,
	summonable = false,
	convinceable = false,
	illusionable = false,
	boss = false,
	ignoreSpawnBlock = false,
	pushable = false,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 90,
	critChance = 10,
	targetDistance = 4,
	healthHidden = false,
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
	{ text = "Die for us!", yell = false },
	{ text = "Humans ought to be extinct!", yell = false },
	{ text = "This belongs to us now!", yell = false },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "drunk", condition = true },
	{ type = "bleed", condition = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 5 },
	{ type = COMBAT_ENERGYDAMAGE, percent = -5 },
	{ type = COMBAT_EARTHDAMAGE, percent = -15 },
	{ type = COMBAT_FIREDAMAGE, percent = 10 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 15 },
	{ type = COMBAT_HOLYDAMAGE, percent = -10 },
	{ type = COMBAT_DEATHDAMAGE, percent = 15 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = -130, maxDamage = -250, type = PHYSICALDAMAGE },
	{ name = "combat", interval = 2000, chance = 40, type = COMBAT_ENERGYDAMAGE, minDamage = -200, maxDamage = -350, range = 7, shootEffect = CONST_ANI_ARROW, effect = CONST_ME_ENERGYAREA, target = false },
	{ name = "combat", interval = 2000, chance = 8, type = COMBAT_PHYSICALDAMAGE, minDamage = -250, maxDamage = -400, radius = 3, effect = CONST_ME_GROUNDSHAKER, target = false },
}

monster.defenses = {
	defense = 45,
	armor = 45,
	mitigation = 2.02,
}

monster.loot = {
	{ id = 3035, chance = 38490, maxCount = 10 },
	{ id = 44438, chance = 13548 },
	{ id = 16123, chance = 6110 },
	{ id = 281, chance = 5880 },
	{ id = 16122, chance = 5758 },
	{ id = 236, chance = 4890, maxCount = 3 },
	{ id = 22194, chance = 3428 },
	{ id = 22193, chance = 2737 },
	{ id = 9058, chance = 2317 },
	{ id = 3037, chance = 2046 },
	{ id = 40529, chance = 2000 },
	{ id = 24962, chance = 1910 },
	{ id = 3016, chance = 1518 },
	{ id = 16142, chance = 1002, maxCount = 10 },
	{ id = 3040, chance = 285 },
	{ id = 14247, chance = 82 },
	{ id = 44433, chance = 447 },
}

mType:register(monster)
