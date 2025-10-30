local mType = Game.createMonsterType("Mitmah Seer")
local monster = {}

monster.name = "Mitmah Seer"
monster.description = "a mitmah seer"
monster.experience = 3230
monster.outfit = {
	lookType = 1710,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.health = 3940
monster.maxHealth = 3940
monster.runHealth = 0
monster.race = "blood"
monster.corpse = 44671
monster.speed = 140
monster.summonCost = 0
monster.raceId = 2461

monster.Bestiary = {
	class = "Undead",
	race = BESTY_RACE_EXTRA_DIMENSIONAL,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 1,
	Locations = "Iksupan",
}

monster.changeTarget = {
	interval = 2000,
	chance = 0,
}

monster.flags = {
	attackable = true,
	hostile = true,
	summonable = false,
	convinceable = false,
	illusionable = false,
	boss = false,
	ignoreSpawnBlock = false,
	pushable = false,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 90,
	targetDistance = 1,
	healthHidden = false,
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
	{ text = "Die for us!", yell = false },
	{ text = "Humans ought to be extinct!", yell = false },
	{ text = "This belongs to us now!", yell = false },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "drunk", condition = true },
	{ type = "bleed", condition = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 5 },
	{ type = COMBAT_ENERGYDAMAGE, percent = -5 },
	{ type = COMBAT_EARTHDAMAGE, percent = -15 },
	{ type = COMBAT_FIREDAMAGE, percent = 10 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 15 },
	{ type = COMBAT_HOLYDAMAGE, percent = -10 },
	{ type = COMBAT_DEATHDAMAGE, percent = 15 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = -130, maxDamage = -250, range = 8, type = COMBAT_ENERGYDAMAGE, shootEffect = CONST_ANI_ARROW, effect = CONST_ME_ENERGYAREA },
	{ name = "combat", interval = 2000, chance = 8, type = COMBAT_DEATHDAMAGE, minDamage = -250, maxDamage = -400, range = 8, radius = 3, effect = CONST_ME_MORTAREA, target = true },
	{ name = "combat", interval = 2000, chance = 8, type = combat_ENERGYDAMAGE, minDamage = -300, maxDamage = -500, length = 9, spread = 3, effect = CONST_ME_PURPLESMOKE },
}

monster.defenses = {
	defense = 45,
	armor = 45,
	mitigation = 2.02,
}

monster.loot = {
	{ id = 3035, chance = 38490, maxCount = 15 }, -- Planitum Coins
	{ id = 238, chance = 8000, maxCount = 1 }, -- Great Mana Potion
	{ id = 22194, chance = 3428, maxCount = 3 }, -- Opal
	{ id = 44439, chance = 13548 }, -- Crystal Of Mitmah
	{ id = 236, chance = 4890, maxCount = 3 }, -- Strong Health Potion
	{ id = 3038, chance = 2846 }, -- Green Gem
	{ id = 3039, chance = 4446 }, -- Red Gem
	{ id = 3063, chance = 5200 }, -- Gold Ring
	{ id = 40529, chance = 2000 }, -- Gold-Brocaded Cloth
	{ id = 3016, chance = 1518 }, -- Ruby Necklace
	{ id = 3073, chance = 6954 }, -- Wand of Cosmic Energy
	{ id = 25699, chance = 3863 }, -- Wooden Spellbook
	{ id = 3040, chance = 3063 }, -- Gold Nuget
	{ id = 44433, chance = 447 }, -- Cerimonial Brush
}

mType:register(monster)
