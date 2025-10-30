local mType = Game.createMonsterType("Glooth Fairy")
local monster = {}

monster.description = "Glooth Fairy"
monster.experience = 19000
monster.outfit = {
	lookType = 600,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.bosstiary = {
	bossRaceId = 1058,
	bossRace = RARITY_BANE,
}

monster.health = 59000
monster.maxHealth = 59000
monster.race = "blood"
monster.corpse = 20972
monster.speed = 130
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 80,
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
	rewardBoss = true,
	illusionable = false,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 90,
	targetDistance = 1,
	runHealth = 0,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = false,
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
}

monster.loot = {
	{ id = 3031, chance = 70000, maxCount = 199 }, -- gold coin
	{ id = 3035, chance = 26019, maxCount = 14 }, -- platinum coin
	{ id = 21103, chance = 10241 }, -- glooth injection tube
	{ id = 238, chance = 7889 }, -- great mana potion
	{ id = 21143, chance = 7385 }, -- glooth sandwich
	{ id = 9057, chance = 3024, maxCount = 2 }, -- small topaz
	{ id = 3032, chance = 2520, maxCount = 2 }, -- small emerald
	{ id = 21183, chance = 1680 }, -- glooth amulet
	{ id = 8775, chance = 1344 }, -- gear wheel
	{ id = 21180, chance = 840 }, -- glooth axe
	{ id = 21158, chance = 840 }, -- glooth spear
	{ id = 21167, chance = 840 }, -- heat core
	{ id = 3037, chance = 672 }, -- yellow gem
	{ id = 21179, chance = 504 }, -- glooth blade
	{ id = 21178, chance = 336 }, -- glooth club
	{ id = 21165, chance = 336 }, -- rubber cap
	{ id = 3039, chance = 686 }, -- red gem
	{ id = 21292, chance = 336 }, -- feedbag
	{ id = 5880, chance = 686 }, -- iron ore
	{ id = 21144, chance = 196 }, -- bowl of glooth soup
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -1900 },
	{ name = "combat", interval = 1000, chance = 7, type = COMBAT_ENERGYDAMAGE, minDamage = -300, maxDamage = -4000, radius = 6, effect = CONST_ME_ENERGYHIT, target = false }, -- blue energy ultimate explosion
	{ name = "war golem skill reducer", interval = 2000, chance = 10, target = false }, -- reduces shield "yellow stars beam"
	{ name = "glooth fairy skill reducer", interval = 2000, chance = 5, target = false }, -- reduces magic level "great energy beam"
	{ name = "speed", interval = 2000, chance = 20, speedChange = -400, radius = 6, effect = CONST_ME_POISONAREA, target = true, duration = 60000 }, -- paralyze, poison ultimate explosion
}

monster.defenses = {
	defense = 150,
	armor = 165,
	mitigation = 2.37,
	{ name = "combat", interval = 1000, chance = 10, type = COMBAT_HEALING, minDamage = 200, maxDamage = 250, effect = CONST_ME_MAGIC_BLUE, target = false },
	{ name = "combat", interval = 1000, chance = 1, type = COMBAT_HEALING, minDamage = 7500, maxDamage = 8000, effect = CONST_ME_MAGIC_BLUE, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 5 },
	{ type = COMBAT_EARTHDAMAGE, percent = 100 },
	{ type = COMBAT_FIREDAMAGE, percent = -5 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 15 },
	{ type = COMBAT_DEATHDAMAGE, percent = 30 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
