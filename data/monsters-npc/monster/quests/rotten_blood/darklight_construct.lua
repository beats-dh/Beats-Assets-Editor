local mType = Game.createMonsterType("Darklight Construct")
local monster = {}
monster.description = "a darklight construct"
monster.experience = 22050
monster.outfit = {
	lookType = 1622,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 2378
monster.Bestiary = {
	class = "Magical",
	race = BESTY_RACE_MAGICAL,
	toKill = 5000,
	FirstUnlock = 200,
	SecondUnlock = 2000,
	CharmsPoints = 100,
	Stars = 5,
	Occurrence = 0,
	Locations = "Darklight Core",
}

monster.health = 32200
monster.maxHealth = 32200
monster.race = "undead"
monster.corpse = 43840
monster.speed = 220
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
	illusionable = false,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 90,
	targetDistance = 0,
	runHealth = 0,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = true,
	canWalkOnFire = true,
	canWalkOnPoison = true,
}

monster.light = {
	level = 0,
	color = 0,
}

monster.loot = {
	{
		name = "crystal coin",
		chance = 46632,
		maxCount = 3,
	},
	{
		name = "dark obsidian splinter",
		chance = 4520,
		maxCount = 3,
	},
	{
		id = 3039,
		chance = 3440,
		maxCount = 3,
	},
	{
		name = "small emerald",
		chance = 3877,
		maxCount = 5,
	},
	{
		name = "zaoan shoes",
		chance = 3637,
		maxCount = 1,
	},
	{
		name = "darklight core",
		chance = 4677,
		maxCount = 3,
	},
	{
		name = "darklight obsidian axe",
		chance = 1840,
		maxCount = 1,
	},
	{
		name = "magma amulet",
		chance = 3712,
		maxCount = 1,
	},
	{
		name = "small ruby",
		chance = 3886,
		maxCount = 5,
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
		minDamage = 350,
		maxDamage = -1050,
	},
	{
		name = "combat",
		interval = 2000,
		chance = 15,
		type = COMBAT_FIREDAMAGE,
		minDamage = -1000,
		maxDamage = -1500,
		length = 8,
		spread = 3,
		effect = CONST_ME_HITBYFIRE,
		target = false,
	},
	{
		name = "combat",
		interval = 2000,
		chance = 20,
		type = COMBAT_ENERGYDAMAGE,
		minDamage = -1000,
		maxDamage = -1900,
		length = 7,
		spread = 0,
		effect = CONST_ME_PINK_ENERGY_SPARK,
		target = false,
	},
	{
		name = "extended fire chain",
		interval = 2000,
		chance = 14,
		minDamage = -800,
		maxDamage = -1200,
		target = true,
	},
	{
		name = "largefirering",
		interval = 2800,
		chance = 20,
		minDamage = -1000,
		maxDamage = -1300,
		target = false,
	},
}

monster.defenses = {
	defense = 117,
	armor = 117,
	mitigation = 2.98,
}

monster.elements = {
	{
		type = COMBAT_PHYSICALDAMAGE,
		percent = -15,
	},
	{
		type = COMBAT_ENERGYDAMAGE,
		percent = -5,
	},
	{
		type = COMBAT_EARTHDAMAGE,
		percent = 10,
	},
	{
		type = COMBAT_FIREDAMAGE,
		percent = 55,
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
		percent = -5,
	},
	{
		type = COMBAT_HOLYDAMAGE,
		percent = 40,
	},
	{
		type = COMBAT_DEATHDAMAGE,
		percent = -20,
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

mType:register(monster)
