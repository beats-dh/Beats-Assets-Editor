local mType = Game.createMonsterType("Brinebrute Inferniarch")
local monster = {}

monster.description = "a brinebrute inferniarch"
monster.experience = 20300
monster.outfit = {
	lookType = 1794,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 2601
monster.Bestiary = {
	class = "Demon",
	race = BESTY_RACE_DEMON,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 0,
	Locations = "Castle Catacombs.",
}

monster.health = 32000
monster.maxHealth = 32000
monster.race = "fire"
monster.corpse = 49998
monster.speed = 160
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
	targetDistance = 1,
	runHealth = 0,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = false,
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
	{ text = "Garrr...Garrr!", yell = false },
}
monster.loot = {
	{ id = 3035, chance = 80000, maxCount = 40 }, -- platinum coin
	{ id = 50056, chance = 60768, maxCount = 1 }, -- brinebrute claw
	{ id = 7642, chance = 58848, maxCount = 5 }, -- great spirit potion
	{ name = "brown crystal splinter", chance = 18272, maxCount = 1 },
	{ name = "blue crystal splinter", chance = 14424, maxCount = 1 },
	{ id = 16121, chance = 13080, maxCount = 2 }, -- green crystal shard
	{ name = "green crystal splinter", chance = 12888, maxCount = 1 },
	{ id = 16119, chance = 12304, maxCount = 2 }, -- blue crystal shard
	{ id = 16120, chance = 11344, maxCount = 2 }, -- violet crystal shard
	{ id = 3039, chance = 6920, maxCount = 1 }, -- red gem
	{ id = 3029, chance = 5384, maxCount = 4 }, -- small sapphire
	{ id = 7643, chance = 3656, maxCount = 3 }, -- ultimate health potion
	{ id = 49909, chance = 2504, maxCount = 1 }, -- demonic core essence
	{ id = 50101, chance = 2112, maxCount = 1 }, -- bloodstained scythe
	{ name = "stone skin amulet", chance = 2112, maxCount = 1 },
	{ name = "giant sword", chance = 1536, maxCount = 1 },
	{ id = 3038, chance = 1344, maxCount = 1 }, -- green gem
	{ name = "might ring", chance = 1152, maxCount = 1 },
	{ id = 49894, chance = 960, maxCount = 1 }, -- demonic matter
	{ id = 3098, chance = 960, maxCount = 1 }, -- ring of healing
	{ name = "gold ring", chance = 768, maxCount = 1 },
	{ id = 49908, chance = 576, maxCount = 1 }, -- mummified demon finger
	{ name = "crusader helmet", chance = 192, maxCount = 1 },
	{ name = "demon shield", chance = 192, maxCount = 1 },
	{ name = "demonrage sword", chance = 192, maxCount = 1 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 250, maxDamage = -400 },
	{ name = "combat", interval = 2000, chance = 25, type = COMBAT_DEATHDAMAGE, minDamage = -250, maxDamage = -350, effect = CONST_ME_SMALLCLOUDS, target = true },
	{ name = "combat", interval = 2500, chance = 16, type = COMBAT_AGONYDAMAGE, minDamage = -440, maxDamage = -600, effect = CONST_ME_REAPERSTRIKE, target = true },
	{ name = "combat", interval = 2000, chance = 18, type = COMBAT_DEATHDAMAGE, minDamage = -380, maxDamage = -720, length = 7, spread = 0, effect = CONST_ME_EXPLOSIONHIT, target = false },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_ENERGYDAMAGE, minDamage = -380, maxDamage = -520, radius = 4, effect = CONST_ME_SLASH, target = false },
}

monster.defenses = {
	defense = 40,
	armor = 80,
	mitigation = 2.45,
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_HEALING, minDamage = 200, maxDamage = 300, effect = CONST_ME_REDSMOKE, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 20 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 15 },
	{ type = COMBAT_EARTHDAMAGE, percent = -10 },
	{ type = COMBAT_FIREDAMAGE, percent = 0 },
	{ type = COMBAT_LIFEDRAIN, percent = 100 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 100 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
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
