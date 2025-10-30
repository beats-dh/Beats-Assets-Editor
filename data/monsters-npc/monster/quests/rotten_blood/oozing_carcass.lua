local mType = Game.createMonsterType("Oozing Carcass")
local monster = {}
monster.description = "an oozing carcass"
monster.experience = 20980
monster.outfit = {
	lookType = 1626,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}
monster.raceId = 2377
monster.Bestiary = {
	class = "Undead",
	race = BESTY_RACE_UNDEAD,
	toKill = 5000,
	FirstUnlock = 200,
	SecondUnlock = 2000,
	CharmsPoints = 100,
	Stars = 5,
	Occurrence = 0,
	Locations = "Putrefactory.",
}
monster.health = 27500
monster.maxHealth = 27500
monster.race = "undead"
monster.corpse = 43579
monster.speed = 215
monster.manaCost = 0
monster.changeTarget = {
	interval = 4000,
	chance = 0,
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
	canWalkOnEnergy = true,
	canWalkOnFire = true,
	canWalkOnPoison = true,
}
monster.light = {
	level = 4,
	color = 143,
}
monster.loot = {
	{
		name = "crystal coin",
		chance = 49600,
		maxCount = 1,
	},
	{
		name = "lichen gobbler",
		chance = 9895,
		maxCount = 1,
	},
	{
		name = "small emerald",
		chance = 3896,
		maxCount = 3,
	},
	{
		id = 3039,
		chance = 7846,
		maxCount = 2,
	},
	{
		name = "skull staff",
		chance = 3096,
		maxCount = 1,
	},
	{
		name = "bone shield",
		chance = 3082,
		maxCount = 1,
	},
	{
		name = "yellow gem",
		chance = 3467,
		maxCount = 3,
	},
	{
		name = "rotten roots",
		chance = 4371,
		maxCount = 4,
	},
	{
		name = "decayed finger bone",
		chance = 4371,
		maxCount = 4,
	},
	{
		name = "ultimate health potion",
		chance = 8228,
		maxCount = 2,
	},
	{
		name = "bloody edge",
		chance = 2920,
		maxCount = 1,
	},
	{
		name = "spellbook of warding",
		chance = 4867,
		maxCount = 1,
	},
	{
		id = 43854,
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
		minDamage = 300,
		maxDamage = -600,
	},
	{
		name = "combat",
		interval = 2000,
		chance = 15,
		type = COMBAT_DEATHDAMAGE,
		minDamage = -1500,
		maxDamage = -1600,
		radius = 5,
		effect = CONST_ME_BLACKSMOKE,
		target = false,
	},
	{
		name = "combat",
		interval = 2000,
		chance = 20,
		type = COMBAT_ICEDAMAGE,
		minDamage = -1400,
		maxDamage = -1500,
		radius = 5,
		effect = CONST_ME_ICEAREA,
		target = false,
	},
	{
		name = "combat",
		interval = 2000,
		chance = 25,
		type = COMBAT_ICEDAMAGE,
		minDamage = -1400,
		maxDamage = -1550,
		length = 8,
		spread = 5,
		effect = CONST_ME_ICEAREA,
		target = false,
	},
	{
		name = "largedeathring",
		interval = 2000,
		chance = 20,
		minDamage = -850,
		maxDamage = -1400,
		target = false,
	},
	{
		name = "energy chain",
		interval = 3000,
		chance = 20,
		minDamage = -1050,
		maxDamage = -1400,
		target = false,
	},
}
monster.defenses = {
	defense = 102,
	armor = 102,
	mitigation = 3.1,
}
monster.elements = {
	{
		type = COMBAT_PHYSICALDAMAGE,
		percent = 0,
	},
	{
		type = COMBAT_ENERGYDAMAGE,
		percent = 25,
	},
	{
		type = COMBAT_EARTHDAMAGE,
		percent = -20,
	},
	{
		type = COMBAT_FIREDAMAGE,
		percent = -10,
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
		percent = 35,
	},
	{
		type = COMBAT_HOLYDAMAGE,
		percent = -25,
	},
	{
		type = COMBAT_DEATHDAMAGE,
		percent = 40,
	},
}
monster.immunities = {
	{
		type = "paralyze",
		condition = true,
	},
	{
		type = "outfit",
		condition = true,
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
