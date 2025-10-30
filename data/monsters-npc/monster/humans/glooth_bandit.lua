local mType = Game.createMonsterType("Glooth Bandit")
local monster = {}

monster.description = "a glooth bandit"
monster.experience = 2000
monster.outfit = {
	lookType = 129,
	lookHead = 115,
	lookBody = 80,
	lookLegs = 114,
	lookFeet = 114,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 1119
monster.Bestiary = {
	class = "Human",
	race = BESTY_RACE_HUMAN,
	toKill = 1000,
	FirstUnlock = 50,
	SecondUnlock = 500,
	CharmsPoints = 25,
	Stars = 3,
	Occurrence = 0,
	Locations = "Underground Glooth Factory.",
}

monster.health = 2600
monster.maxHealth = 2600
monster.race = "blood"
monster.corpse = 21882
monster.speed = 150
monster.manaCost = 0

monster.changeTarget = {
	interval = 5000,
	chance = 5,
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
	canWalkOnEnergy = false,
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
}

monster.loot = {
	{ id = 3031, chance = 80000, maxCount = 100 }, -- gold coin
	{ id = 3035, chance = 80000, maxCount = 3 }, -- platinum coin
	{ id = 21816, chance = 7272 }, -- tainted glooth capsule
	{ id = 238, chance = 5714 }, -- great mana potion
	{ id = 21203, chance = 4444 }, -- glooth bag
	{ id = 9057, chance = 4444, maxCount = 2 }, -- small topaz
	{ id = 7642, chance = 4000 }, -- great spirit potion
	{ id = 239, chance = 3636 }, -- great health potion
	{ id = 21143, chance = 3200 }, -- glooth sandwich
	{ id = 21814, chance = 2424 }, -- glooth capsule
	{ id = 21179, chance = 2000 }, -- glooth blade
	{ id = 21178, chance = 2000 }, -- glooth club
	{ id = 21165, chance = 1600 }, -- rubber cap
	{ id = 3032, chance = 1194, maxCount = 2 }, -- small emerald
	{ id = 21158, chance = 1194 }, -- glooth spear
	{ id = 7643, chance = 1194 }, -- ultimate health potion
	{ id = 21146, chance = 800 }, -- glooth steak
	{ id = 3324, chance = 800 }, -- skull staff
	{ id = 21164, chance = 800 }, -- glooth cape
	{ id = 3038, chance = 800 }, -- green gem
	{ id = 21180, chance = 800 }, -- glooth axe
	{ id = 3342, chance = 800 }, -- war axe
	{ id = 811, chance = 800 }, -- terra mantle
	{ id = 3344, chance = 800 }, -- beastslayer axe
	{ id = 21183, chance = 400 }, -- glooth amulet
	{ id = 813, chance = 400 }, -- terra boots
	{ id = 812, chance = 400 }, -- terra legs
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, skill = 80, attack = 68 },
	{ name = "combat", interval = 2000, chance = 50, type = COMBAT_PHYSICALDAMAGE, minDamage = -60, maxDamage = -200, range = 8, shootEffect = CONST_ANI_ARROW, target = false },
}

monster.defenses = {
	defense = 32,
	armor = 46,
	mitigation = 1.65,
	{ name = "combat", interval = 3000, chance = 35, type = COMBAT_HEALING, minDamage = 200, maxDamage = 250, effect = CONST_ME_MAGIC_BLUE, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 15 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 20 },
	{ type = COMBAT_EARTHDAMAGE, percent = 100 },
	{ type = COMBAT_FIREDAMAGE, percent = -5 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 10 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 20 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
