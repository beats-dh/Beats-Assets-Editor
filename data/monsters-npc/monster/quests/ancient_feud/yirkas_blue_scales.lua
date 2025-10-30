local mType = Game.createMonsterType("Yirkas Blue Scales")
local monster = {}

monster.description = "Yirkas Blue Scales"
monster.experience = 4900
monster.outfit = {
	lookType = 1196,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.bosstiary = {
	bossRaceId = 1982,
	bossRace = RARITY_ARCHFOE,
}

monster.health = 6300
monster.maxHealth = 6300
monster.race = "blood"
monster.corpse = 31409
monster.speed = 190
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 10,
}

monster.strategiesTarget = {
	nearest = 100,
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

monster.loot = {
	{ id = 31559, chance = 70000, minCount = 1, maxCount = 6 }, -- blue goanna scale
	{ id = 3035, chance = 70000, minCount = 1, maxCount = 17 }, -- platinum coin
	{ id = 7643, chance = 70000, minCount = 1, maxCount = 5 }, -- ultimate health potion
	{ id = 9058, chance = 8078 }, -- gold ingot
	{ id = 24392, chance = 6153 }, -- gemmed figurine
	{ id = 34102, chance = 5768 }, -- yirkas' egg
	{ id = 31340, chance = 4613 }, -- lizard heart
	{ id = 3038, chance = 2695 }, -- green gem
	{ id = 3041, chance = 2310 }, -- blue gem
	{ id = 821, chance = 2310 }, -- magma legs
	{ id = 5741, chance = 2310 }, -- skull helmet
	{ id = 3281, chance = 1925 }, -- giant sword
	{ id = 7422, chance = 1925 }, -- jade hammer
	{ id = 3342, chance = 1925 }, -- war axe
	{ id = 7404, chance = 1540 }, -- assassin dagger
	{ id = 3063, chance = 1540 }, -- gold ring
	{ id = 23531, chance = 1540 }, -- ring of green plasma
	{ id = 3366, chance = 1155 }, -- magic plate armor
	{ id = 3420, chance = 770 }, -- demon shield
	{ id = 7440, chance = 770 }, -- mastermind potion
	{ id = 14247, chance = 770 }, -- ornate crossbow
	{ id = 10438, chance = 770 }, -- spellweaver's robe
	{ id = 7382, chance = 385 }, -- demonrage sword
	{ id = 8074, chance = 385 }, -- spellbook of mind control
	{ id = 21168, chance = 385 }, -- alloy legs
	{ id = 33778, chance = 252 }, -- raw watermelon tourmaline
	{ id = 34258, chance = 252 }, -- red silk flower
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -100, condition = { type = CONDITION_POISON, totalDamage = 15, interval = 4000 } },
	{ name = "combat", interval = 2000, chance = 30, type = COMBAT_EARTHDAMAGE, minDamage = -400, maxDamage = -500, length = 3, spread = 0, effect = CONST_ME_POISONAREA, target = false },
	{ name = "combat", interval = 2000, chance = 30, type = COMBAT_ENERGYDAMAGE, minDamage = -250, maxDamage = -350, range = 3, radius = 3, shootEffect = CONST_ANI_ENERGY, effect = CONST_ME_ENERGYHIT, target = true },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_ENERGYDAMAGE, minDamage = -400, maxDamage = -500, shootEffect = CONST_ANI_ENERGY, effect = CONST_ME_ENERGYAREA, target = true },
	{ name = "combat", interval = 2000, chance = 30, type = COMBAT_ENERGYDAMAGE, minDamage = -200, maxDamage = -300, radius = 4, effect = CONST_ME_ENERGYAREA, target = false },
}

monster.defenses = {
	defense = 78,
	armor = 78,
	--	mitigation = ???,
	{ name = "speed", interval = 2000, chance = 5, speedChange = 350, effect = CONST_ME_MAGIC_RED, target = false, duration = 5000 },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 15 },
	{ type = COMBAT_EARTHDAMAGE, percent = 40 },
	{ type = COMBAT_FIREDAMAGE, percent = 10 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
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
