local mType = Game.createMonsterType("Horror")
local monster = {}

monster.description = "a horror"
monster.experience = 0
monster.outfit = {
	lookType = 273,
	lookHead = 114,
	lookBody = 0,
	lookLegs = 114,
	lookFeet = 0,
	lookAddons = 3,
	lookMount = 0,
}

monster.health = 8000
monster.maxHealth = 8000
monster.race = "blood"
monster.corpse = 0
monster.speed = 135
monster.manaCost = 0

monster.changeTarget = {
	interval = 5000,
	chance = 8,
}

monster.strategiesTarget = {
	nearest = 100,
}

monster.events = {
	"HorrorTransformation"
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
	targetDistance = 4,
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

monster.voices = {
	interval = 5000,
	chance = 10,
}

monster.loot = {}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = -250, maxDamage = -450 },
	{ name = "combat", interval = 1500, chance = 30, minDamage = -250, maxDamage = -450, range = 4, shootEffect = CONST_ANI_DEATH, effect = CONST_ME_MORTAREA, target = true },
	{ name = "horrorgiftscircle", interval = 2000, chance = 25, minDamage = -350, shootEffect = CONST_ANI_EXPLOSION, maxDamage = -500 },
	{ name = "horrorcakecircle", interval = 1500, chance = 20, minDamage = -300, shootEffect = CONST_ANI_CAKE, maxDamage = -500 },
	{ name = "horror healing", interval = 2000, chance = 30, target = false },
}

monster.defenses = {
	defense = 35,
	armor = 35,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 0 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 100 },
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
