local mType = Game.createMonsterType("Converter")
local monster = {}
monster.description = "a converter"
monster.experience = 21425
monster.outfit = {
	lookType = 1623,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}
monster.raceId = 2379
monster.Bestiary = {
	class = "Elemental",
	race = BESTY_RACE_ELEMENTAL,
	toKill = 5000,
	FirstUnlock = 200,
	SecondUnlock = 2000,
	CharmsPoints = 100,
	Stars = 5,
	Occurrence = 0,
	Locations = "Gloom Pillars.",
}
monster.health = 29600
monster.maxHealth = 29600
monster.race = "undead"
monster.corpse = 43567
monster.speed = 250
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
	illusionable = true,
	canPushItems = true,
	canPushCreatures = false,
	staticAttackChance = 80,
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
monster.loot = {
	{
		name = "crystal coin",
		chance = 46584,
		maxCount = 3,
	},
	{
		name = "darklight obsidian axe",
		chance = 2048,
		maxCount = 1,
	},
	{
		name = "darklight matter",
		chance = 3808,
		maxCount = 3,
	},
	{
		name = "darklight core",
		chance = 3488,
		maxCount = 4,
	},
	{
		name = "wand of starstorm",
		chance = 6106,
		maxCount = 1,
	},
	{
		name = "blue gem",
		chance = 2760,
		maxCount = 3,
	},
	{
		name = "ultimate health potion",
		chance = 7881,
		maxCount = 5,
	},
	{
		name = "focus cape",
		chance = 4360,
		maxCount = 1,
	},
	{
		name = "white gem",
		chance = 2760,
		maxCount = 3,
	},
	{
		id = 43855,
		chance = 12,
		maxCount = 1,
	},
}
monster.events = {
	"rottenBloodMonsterDeath",
}
monster.attacks = {
	{
		name = "melee",
		interval = 2000,
		chance = 100,
		minDamage = 0,
		maxDamage = -900,
	},
	{
		name = "combat",
		interval = 2000,
		chance = 18,
		type = COMBAT_ENERGYDAMAGE,
		minDamage = -1400,
		maxDamage = -1800,
		length = 7,
		spread = 0,
		effect = CONST_ME_PINK_ENERGY_SPARK,
		target = false,
	},
	{
		name = "combat",
		interval = 2000,
		chance = 20,
		type = COMBAT_FIREDAMAGE,
		minDamage = -1400,
		maxDamage = -1900,
		radius = 5,
		effect = CONST_ME_HITBYFIRE,
		target = true,
	},
	{
		name = "largeholyring",
		interval = 2000,
		chance = 15,
		minDamage = -800,
		maxDamage = -1200,
	},
	{
		name = "energy chain",
		interval = 3200,
		chance = 20,
		minDamage = -1400,
		maxDamage = -1600,
	},
}
monster.defenses = {
	defense = 100,
	armor = 100,
	mitigation = 3.31,
}
monster.elements = {
	{
		type = COMBAT_PHYSICALDAMAGE,
		percent = -20,
	},
	{
		type = COMBAT_ENERGYDAMAGE,
		percent = -10,
	},
	{
		type = COMBAT_EARTHDAMAGE,
		percent = 10,
	},
	{
		type = COMBAT_FIREDAMAGE,
		percent = 25,
	},
	{
		type = COMBAT_LIFEDRAIN,
		percent = 0,
	},
	{
		type = COMBAT_MANADRAIN,
		percent = 0,
	},
	{
		type = COMBAT_DROWNDAMAGE,
		percent = 0,
	},
	{
		type = COMBAT_ICEDAMAGE,
		percent = 0,
	},
	{
		type = COMBAT_HOLYDAMAGE,
		percent = 35,
	},
	{
		type = COMBAT_DEATHDAMAGE,
		percent = -15,
	},
}
monster.immunities = {
	{
		type = "paralyze",
		condition = true,
	},
	{
		type = "outfit",
		condition = false,
	},
	{
		type = "invisible",
		condition = true,
	},
	{
		type = "bleed",
		condition = false,
	},
}
mType.onThink = function(monster, interval) end
mType:register(monster)
