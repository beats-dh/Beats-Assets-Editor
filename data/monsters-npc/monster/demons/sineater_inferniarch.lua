local mType = Game.createMonsterType("Sineater Inferniarch")
local monster = {}

monster.description = "a sineater inferniarch"
monster.experience = 6750
monster.outfit = {
	lookType = 1795,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 2602
monster.Bestiary = {
	class = "Demon",
	race = BESTY_RACE_DEMON,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 0,
	Locations = "Azzilon Castle",
}

monster.health = 9150
monster.maxHealth = 9150
monster.race = "blood"
monster.corpse = 50002
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
	{ text = "Kah ... Thul... GROAR!", yell = true },
	{ text = "Bahrrr... Bharush!", yell = false },
}

monster.loot = {
	{ id = 3035, chance = 80000, maxCount = 25 }, -- platinum coin
	{ id = 238, chance = 4992 }, -- great mana potion
	{ id = 3030, chance = 3752, maxCount = 2 }, -- small ruby
	{ id = 3039, chance = 2808 }, -- red gem
	{ id = 49909, chance = 2328 }, -- demonic core essence
	{ id = 50057, chance = 1696 }, -- sineater wing
	{ id = 3016, chance = 1648 }, -- ruby necklace
	{ id = 16096, chance = 960 }, -- wand of defiance
	{ id = 49908, chance = 832 }, -- mummified demon finger
	{ id = 25699, chance = 376 }, -- wooden spellbook
	{ id = 49894, chance = 280 }, -- demonic matter
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 196, maxDamage = -352, condition = { type = CONDITION_FIRE, totalDamage = 400, interval = 9000 } },
	{ name = "combat", interval = 2000, chance = 25, type = COMBAT_FIREDAMAGE, minDamage = -390, maxDamage = -560, range = 6, radius = 4, shootEffect = CONST_ANI_FIRE, effect = CONST_ME_FIREAREA, target = true },
	{ name = "inferniarch death wave", interval = 2000, chance = 20, minDamage = -400, maxDamage = -650 },
	{ name = "combat", interval = 2000, chance = 18, type = COMBAT_DEATHDAMAGE, minDamage = -425, maxDamage = -600, effect = CONST_ME_BIG_SCRATCH, range = 1, target = true },
	{ name = "firefield", interval = 2000, chance = 16, range = 7, radius = 1, shootEffect = CONST_ANI_FIRE, target = true },
}

monster.defenses = {
	defense = 20,
	armor = 68,
	mitigation = 2.20,
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_HEALING, minDamage = 200, maxDamage = 300, effect = CONST_ME_MAGIC_BLUE, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = -5 },
	{ type = COMBAT_ENERGYDAMAGE, percent = -10 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 100 },
	{ type = COMBAT_LIFEDRAIN, percent = 100 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 100 },
	{ type = COMBAT_ICEDAMAGE, percent = -5 },
	{ type = COMBAT_HOLYDAMAGE, percent = -5 },
	{ type = COMBAT_DEATHDAMAGE, percent = 10 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
