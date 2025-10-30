local mType = Game.createMonsterType("Twisterror")
local monster = {}

monster.description = "Twisterror"
monster.experience = 25000
monster.outfit = {
	lookType = 1792,
	lookAddons = 1,
}

monster.bosstiary = {
	bossRaceId = 2605,
	bossRace = RARITY_BANE,
}

monster.health = 35000
monster.maxHealth = 35000
monster.race = "fire"
monster.corpse = 50042
monster.speed = 200
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 20,
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
	targetDistance = 3,
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
}

monster.loot = {
	{id = 49894, chance = 70000}, -- demonic matter
	{id = 3035, chance = 70000, maxCount = 30}, -- platinum coin
	{id = 49909, chance = 6417}, -- demonic core essence
	{id = 3041, chance = 5250}, -- blue gem
	{id = 49891, chance = 1167}, -- skin of Twisterror
	{id = 3027, chance = 1167}, -- black pearl
	{id = 3731, chance = 583}, -- fire mushroom
	{id = 50054, chance = 583} -- spellreaper staff totem
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 300, maxDamage = -500 },
	{ name = "combat", interval = 2000, chance = 18, type = COMBAT_AGONYDAMAGE, minDamage = -300, maxDamage = -600, range = 7, effect = 263, target = true },
	{ name = "combat", interval = 2000, chance = 17, type = COMBAT_DEATHDAMAGE, minDamage = -600, maxDamage = -850, radius = 4, effect = CONST_ME_INSECTS, target = false },
	{ name = "combat", interval = 2000, chance = 18, type = COMBAT_ENERGYDAMAGE, minDamage = -650, maxDamage = -950, range = 7, shootEffect = CONST_ANI_ENERGY, effect = CONST_ME_ENERGYHIT, target = true },
	{ name = "combat", interval = 3000, chance = 10, type = COMBAT_MANADRAIN, minDamage = -250, maxDamage = -450, range = 4, effect = CONST_ME_SOUND_PURPLE, target = true },
}

monster.defenses = {
	defense = 55,
	armor = 45,
	mitigation = 1.50,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 10 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 100 },
	{ type = COMBAT_EARTHDAMAGE, percent = -15 },
	{ type = COMBAT_FIREDAMAGE, percent = -5 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 10 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = -15 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
