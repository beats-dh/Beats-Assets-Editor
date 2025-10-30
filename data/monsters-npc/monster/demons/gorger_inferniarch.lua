local mType = Game.createMonsterType("Gorger Inferniarch")
local monster = {}

monster.description = "a gorger inferniarch"
monster.experience = 7180
monster.outfit = {
	lookType = 1797,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 2604
monster.Bestiary = {
	class = "Demon",
	race = BESTY_RACE_DEMON,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 0,
	Locations = "Azzilon Castle.",
}

monster.health = 9450
monster.maxHealth = 9450
monster.race = "blood"
monster.corpse = 50010
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
	{ text = "Kar Ath... Ul", yell = false },
	{ text = "Rezzz Kor ... Urrrgh!", yell = true },
}

monster.loot = {
	{ id = 3035, chance = 80000, maxCount = 24 }, -- platinum coin
	{ id = 3029, chance = 3216, maxCount = 3 }, -- small sapphire
	{ id = 7452, chance = 2672 }, -- spiked squelcher
	{ id = 49909, chance = 2208, maxCount = 1 }, -- demonic core essence
	{ id = 3093, chance = 1920 }, -- club ring
	{ id = 50059, chance = 1296 }, -- gorger antlers
	{ id = 49908, chance = 768 }, -- mummified demon finger
	{ id = 49894, chance = 360 }, -- demonic matter
	{ id = 3040, chance = 304 }, -- gold nugget
	{ id = 3053, chance = 288 }, -- time ring
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = -200, maxDamage = -503 },
	{ name = "combat", interval = 2000, chance = 25, type = COMBAT_DEATHDAMAGE, minDamage = -438, maxDamage = -485, radius = 4, effect = CONST_ME_MORTAREA, target = true },
	{ name = "extended fire chain sparkles", interval = 2000, chance = 6, minDamage = -389, maxDamage = -550 },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_DEATHDAMAGE, minDamage = -440, maxDamage = -600, effect = CONST_ME_REAPERSTRIKE, target = true },
}

monster.defenses = {
	defense = 20,
	armor = 74,
	mitigation = 2.20,
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_HEALING, minDamage = 200, maxDamage = 300, effect = CONST_ME_MAGIC_BLUE, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = -5 },
	{ type = COMBAT_ENERGYDAMAGE, percent = -5 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 100 },
	{ type = COMBAT_LIFEDRAIN, percent = 100 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 100 },
	{ type = COMBAT_ICEDAMAGE, percent = -5 },
	{ type = COMBAT_HOLYDAMAGE, percent = -10 },
	{ type = COMBAT_DEATHDAMAGE, percent = 10 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
