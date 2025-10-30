local mType = Game.createMonsterType("Rateye Ric")
local monster = {}

monster.description = "Rateye Ric"
monster.experience = 0
monster.outfit = {
	lookType = 533,
	lookHead = 115,
	lookBody = 100,
	lookLegs = 115,
	lookFeet = 115,
	lookAddons = 0,
	lookMount = 0
}

monster.health = 60000
monster.maxHealth = 60000
monster.race = "blood"
monster.corpse = 0
monster.speed = 120
monster.manaCost = 0
monster.maxSummons = 0

monster.changeTarget = {
	interval = 2000,
	chance = 90
}

monster.strategiesTarget = {
	nearest = 100,
}

monster.events = {
	"RateyeRicRetreat"
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
	targetDistance = 4,
	runHealth = 0,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = true,
	canWalkOnFire = true,
	canWalkOnPoison = true,
	isPreyExclusive = true,
}

monster.light = {
	level = 0,
	color = 0
}

monster.voices = {
	{ text = "There's a hefty price on ya' head, I bet!", interval = 5000 }
}


monster.attacks = {
	{name ="melee", interval = 2000, chance = 100, minDamage = -300, maxDamage = -800, condition = {type = CONDITION_POISON, totalDamage = 10, interval = 4000}},
	{name ="combat", interval = 2000, chance = 30, type = COMBAT_PHYSICALDAMAGE, minDamage = -500, maxDamage = -1000, range = 7, radius = 1, shootEffect = CONST_ANI_EXPLOSION, target = true}
}

monster.defenses = {
	defense = 25,
	armor = 25,
    { name = "invisible", interval = 2500, chance = 20, effect = CONST_ME_MAGIC_BLUE },
}

monster.elements = {
	{type = COMBAT_PHYSICALDAMAGE, percent = 0},
	{type = COMBAT_ENERGYDAMAGE, percent = 0},
	{type = COMBAT_EARTHDAMAGE, percent = 0},
	{type = COMBAT_FIREDAMAGE, percent = 0},
	{type = COMBAT_LIFEDRAIN, percent = 0},
	{type = COMBAT_MANADRAIN, percent = 0},
	{type = COMBAT_DROWNDAMAGE, percent = 0},
	{type = COMBAT_ICEDAMAGE, percent = 0},
	{type = COMBAT_HOLYDAMAGE , percent = 0},
	{type = COMBAT_DEATHDAMAGE , percent = 0}
}

monster.immunities = {
	{type = "paralyze", condition = false},
	{type = "outfit", condition = false},
	{type = "invisible", condition = true},
	{type = "bleed", condition = false}
}

mType:register(monster)