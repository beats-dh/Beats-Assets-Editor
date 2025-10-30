local mType = Game.createMonsterType("Lost Berserker")
local monster = {}

monster.description = "a lost berserker"
monster.experience = 4800
monster.outfit = {
	lookType = 496,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 888
monster.Bestiary = {
	class = "Humanoid",
	race = BESTY_RACE_HUMANOID,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 0,
	Locations = "Warzones 2 and 3.",
}

monster.health = 5900
monster.maxHealth = 5900
monster.race = "blood"
monster.corpse = 16071
monster.speed = 150
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 15,
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
	{ text = "Kill! Kiill! Kill!", yell = false },
	{ text = "Death! Death! Death!", yell = false },
}

monster.loot = {
	{ name = "piggy bank", chance = 3136 },
	{ name = "gold coin", chance = 40000, maxCount = 100 },
	{ name = "gold coin", chance = 40000, maxCount = 100 },
	{ name = "platinum coin", chance = 80000, maxCount = 9 },
	{ id = 3097, chance = 1824 }, -- dwarven ring
	{ name = "knight axe", chance = 1656 },
	{ name = "fire axe", chance = 304 },
	{ name = "royal helmet", chance = 120 },
	{ name = "guardian shield", chance = 1120 },
	{ name = "tower shield", chance = 802 },
	{ name = "black shield", chance = 512 },
	{ name = "brown mushroom", chance = 12152, maxCount = 2 },
	{ name = "iron ore", chance = 6792 },
	{ name = "magic sulphur", chance = 576 },
	{ name = "chaos mace", chance = 440 },
	{ name = "spiked squelcher", chance = 648 },
	{ name = "great mana potion", chance = 10920 },
	{ name = "great health potion", chance = 10920 },
	{ name = "terra boots", chance = 512 },
	{ name = "small topaz", chance = 6376, maxCount = 2 },
	{ name = "clay lump", chance = 744 },
	{ id = 12600, chance = 1640 }, -- coal
	{ name = "violet crystal shard", chance = 2800 },
	{ name = "brown crystal splinter", chance = 6032, maxCount = 2 },
	{ name = "blue crystal splinter", chance = 3688 },
	{ name = "green crystal fragment", chance = 5496 },
	{ name = "drill bolt", chance = 6568, maxCount = 10 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -501 },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_PHYSICALDAMAGE, minDamage = 0, maxDamage = -300, range = 7, shootEffect = CONST_ANI_WHIRLWINDAXE, target = false },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_PHYSICALDAMAGE, minDamage = 0, maxDamage = -250, range = 7, radius = 3, shootEffect = CONST_ANI_EXPLOSION, effect = CONST_ME_EXPLOSIONAREA, target = true },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_MANADRAIN, minDamage = -50, maxDamage = -100, radius = 5, effect = CONST_ME_MAGIC_RED, target = false },
	{ name = "speed", interval = 2000, chance = 10, speedChange = -800, radius = 2, effect = CONST_ME_MAGIC_RED, target = false, duration = 20000 },
}

monster.defenses = {
	defense = 40,
	armor = 80,
	mitigation = 2.40,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 20 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 100 },
	{ type = COMBAT_EARTHDAMAGE, percent = 100 },
	{ type = COMBAT_FIREDAMAGE, percent = 10 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 10 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 15 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = false },
	{ type = "bleed", condition = false },
}

mType:register(monster)
