local mType = Game.createMonsterType("Wandering Pillar")
local monster = {}
monster.description = "a wandering pillar"
monster.experience = 23200
monster.outfit = {
	lookType = 1657,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}
monster.raceId = 2395
monster.Bestiary = {
	class = "Construct",
	race = BESTY_RACE_CONSTRUCT,
	toKill = 5000,
	FirstUnlock = 200,
	SecondUnlock = 2000,
	CharmsPoints = 100,
	Stars = 5,
	Occurrence = 0,
	Locations = "Darklight Core",
}
monster.health = 37000
monster.maxHealth = 37000
monster.race = "undead"
monster.corpse = 43828
monster.speed = 190
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
	{
		text = "POWERRR!!",
		yell = false,
	},
	{
		text = "DARKNESS. DEATH. ENERGIES.",
		yell = false,
	},
	{
		text = "TREMMMBLE!",
		yell = false,
	},
}
monster.loot = {
	{
		name = "crystal coin",
		chance = 46663,
		maxCount = 3,
	},
	{
		name = "darklight obsidian axe",
		chance = 1722,
		maxCount = 1,
	},
	{
		name = "basalt crumb",
		chance = 4547,
		maxCount = 4,
	},
	{
		name = "sulphurous stone",
		chance = 4538,
		maxCount = 3,
	},
	{
		name = "magma boots",
		chance = 3904,
		maxCount = 1,
	},
	{
		id = 12600, -- Coal
		chance = 4280,
		maxCount = 6,
	},
	{
		name = "dark helmet",
		chance = 3752,
		maxCount = 1,
	},
	{
		name = "magma coat",
		chance = 3722,
		maxCount = 1,
	},
	{
		name = "onyx chip",
		chance = 3849,
		maxCount = 4,
	},
	{
		name = "darklight core",
		chance = 4544,
		maxCount = 3,
	},
	{
		name = "fire sword",
		chance = 3840,
		maxCount = 1,
	},
	{
		name = "magma clump",
		chance = 3600,
		maxCount = 3,
	},
	{
		id = 3039,
		chance = 3440,
		maxCount = 3,
	},
	{
		name = "green gem",
		chance = 3600,
		maxCount = 3,
	},
	{
		name = "basalt core",
		chance = 4510,
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
		minDamage = 300,
		maxDamage = -1200,
	},
	{
		name = "combat",
		interval = 2000,
		chance = 20,
		type = COMBAT_ENERGYDAMAGE,
		minDamage = -1400,
		maxDamage = -1650,
		length = 8,
		spread = 3,
		effect = CONST_ME_BLUE_ENERGY_SPARK,
		target = false,
	},
	{
		name = "combat",
		intervall = 2000,
		chance = 15,
		type = COMBAT_ENERGYDAMAGE,
		minDamage = -1100,
		maxDamage = -1500,
		radius = 5,
		effect = CONST_ME_PINK_BEAM,
		target = false,
	},
	{
		name = "combat",
		interval = 2000,
		chance = 20,
		type = COMBAT_FIREDAMAGE,
		minDamage = -1400,
		maxDamage = -1700,
		radius = 5,
		effect = CONST_ME_HITBYFIRE,
		target = true,
	},
	{
		name = "largeholyring",
		interval = 3000,
		chance = 15,
		minDamage = -750,
		maxDamage = -1250,
	},
}
monster.defenses = {
	defense = 120,
	armor = 120,
	mitigation = 2.75,
}
monster.elements = {
	{
		type = COMBAT_PHYSICALDAMAGE,
		percent = -15,
	},
	{
		type = COMBAT_ENERGYDAMAGE,
		percent = -10,
	},
	{
		type = COMBAT_EARTHDAMAGE,
		percent = 0,
	},
	{
		type = COMBAT_FIREDAMAGE,
		percent = 60,
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
		percent = 50,
	},
	{
		type = COMBAT_DEATHDAMAGE,
		percent = -10,
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
