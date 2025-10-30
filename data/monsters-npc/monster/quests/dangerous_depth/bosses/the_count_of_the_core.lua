local mType = Game.createMonsterType("The Count of the Core")
local monster = {}

monster.description = "The Count Of The Core"
monster.experience = 300000
monster.outfit = {
	lookType = 1046,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.events = {
	"DepthWarzoneBossDeath",
}

monster.health = 350000
monster.maxHealth = 350000
monster.race = "blood"
monster.corpse = 27637
monster.speed = 135
monster.manaCost = 0

monster.changeTarget = {
	interval = 5000,
	chance = 10,
}

monster.bosstiary = {
	bossRaceId = 1519,
	bossRace = RARITY_BANE,
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
	{ text = "Shluush!", yell = false },
	{ text = "Sluuurp!", yell = false },
}

monster.loot = {
	{ name = "platinum coin", chance = 70000, maxCount = 54 },
	{ id = 27713, chance = 70000, maxCount = 7 }, -- heavy crystal fragment
	{ name = "mastermind potion", chance = 70000, maxCount = 3 },
	{ name = "stone skin amulet", chance = 70000 },
	{ name = "amber staff", chance = 70000 },
	{ name = "ultimate health potion", chance = 56000, maxCount = 15 },
	{ name = "great mana potion", chance = 42000, maxCount = 23 },
	{ name = "small topaz", chance = 42000, maxCount = 10 },
	{ name = "green crystal shard", chance = 42000 },
	{ name = "wand of inferno", chance = 42000 },
	{ name = "huge spiky snail shell", chance = 42000 },
	{ name = "small diamond", chance = 28000 },
	{ name = "huge chunk of crude iron", chance = 28000, maxCount = 3 },
	{ id = 282, chance = 28000 }, -- giant shimmering pearl
	{ name = "great spirit potion", chance = 14000 },
	{ name = "silver token", chance = 14000 },
	{ name = "yellow gem", chance = 14000 },
	{ name = "fire sword", chance = 14000 },
	{ id = 3039, chance = 14000 }, -- red gem
	{ name = "green gem", chance = 14000 },
	{ name = "slightly rusted helmet", chance = 14000 },
	{ name = "gold token", chance = 14000 },
	{ name = "magic sulphur", chance = 28476 },
	{ id = 27626, chance = 16611 }, -- chitinous mouth (count)
	{ name = "blue gem", chance = 15421 },
	{ name = "small emerald", chance = 13048 },
	{ name = "slightly rusted shield", chance = 11865 },
	{ name = "small ruby", chance = 9492 },
	{ name = "small amethyst", chance = 8302 },
	{ name = "luminous orb", chance = 5929 },
	{ name = "crystal coin", chance = 4746 },
	{ name = "harpoon of a giant snail", chance = 3556 },
	{ name = "gnome shield", chance = 3556 },
	{ name = "gnome helmet", chance = 2373 },
	{ name = "magma coat", chance = 2373 },
	{ name = "gnome sword", chance = 2373 },
	{ name = "violet gem", chance = 2373 },
	{ name = "crystalline armor", chance = 1183 },
	{ name = "giant sword", chance = 1183 },
	{ name = "guardian axe", chance = 1183 },
	{ name = "twiceslicer", chance = 1183 },
	{ name = "tinged pot", chance = 1183 },
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -900 },
	{ name = "combat", interval = 6000, chance = 20, type = COMBAT_DEATHDAMAGE, minDamage = 0, maxDamage = -1500, range = 3, length = 9, spread = 0, effect = CONST_ME_MORTAREA, target = false },
	{ name = "combat", interval = 4000, chance = 20, type = COMBAT_DEATHDAMAGE, minDamage = 0, maxDamage = -1500, range = 3, length = 9, spread = 4, effect = CONST_ME_SMALLCLOUDS, target = false },
	{ name = "combat", interval = 4000, chance = 15, type = COMBAT_PHYSICALDAMAGE, minDamage = 0, maxDamage = -1500, radius = 8, effect = CONST_ME_HITAREA, target = false },
	{ name = "combat", interval = 4000, chance = 15, type = COMBAT_DEATHDAMAGE, minDamage = 0, maxDamage = -1500, radius = 8, effect = CONST_ME_BLACKSMOKE, target = false },
}

monster.defenses = {
	defense = 160,
	armor = 160,
	--	mitigation = ???,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 25 },
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
