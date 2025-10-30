local mType = Game.createMonsterType("The Last Lore Keeper")
local monster = {}

monster.description = "the last lore keeper"
monster.experience = 45000
monster.outfit = {
	lookType = 939,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.events = {
	"ForgottenKnowledgeBossDeath",
}

monster.health = 750000
monster.maxHealth = 750000
monster.race = "undead"
monster.corpse = 0
monster.speed = 225
monster.manaCost = 0

monster.changeTarget = {
	interval = 2000,
	chance = 8,
}

monster.bosstiary = {
	bossRaceId = 1304,
	bossRace = RARITY_NEMESIS,
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
	runHealth = 340,
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

monster.summon = {
	maxSummons = 6,
	summons = {
		{ name = "sword of vengeance", chance = 50, interval = 2000, count = 6 },
	},
}

monster.voices = {
	interval = 5000,
	chance = 10,
}

monster.loot = {
	{ id = 16119, chance = 2100, maxCount = 3 }, -- blue crystal shard
	{ id = 3031, chance = 35224, maxCount = 200 }, -- gold coin
	{ id = 3035, chance = 35224, maxCount = 35 }, -- platinum coin
	{ id = 22721, chance = 2100, maxCount = 3 }, -- gold token
	{ id = 5909, chance = 2100, maxCount = 4 }, -- white piece of cloth
	{ id = 16120, chance = 2100, maxCount = 3 }, -- violet crystal shard
	{ id = 281, chance = 350 }, -- giant shimmering pearl (green)
	{ id = 3037, chance = 700 }, -- yellow gem
	{ id = 3032, chance = 2100, maxCount = 20 }, -- small emerald
	{ id = 7450, chance = 105, unique = true }, -- hammer of prophecy
	{ id = 5880, chance = 2100, maxCount = 2 }, -- iron ore
	{ id = 9632, chance = 700 }, -- ancient stone
	{ id = 3360, chance = 700 }, -- golden armor
	{ id = 7642, chance = 2100, maxCount = 10 }, -- great spirit potion
	{ id = 20079, chance = 280 }, -- crude umbral hammer
	{ id = 22193, chance = 2100 }, -- onyx chip
	{ id = 9660, chance = 700 }, -- mystical hourglass
	{ id = 5887, chance = 700 }, -- piece of royal steel
	{ id = 23533, chance = 2100 }, -- ring of red plasma
	{ id = 7643, chance = 2100, maxCount = 5 }, -- ultimate health potion
	{ id = 22516, chance = 7000, maxCount = 4 }, -- silver token
	{ id = 238, chance = 49000, maxCount = 10 }, -- great mana potion
	{ id = 3029, chance = 175, maxCount = 20 }, -- small sapphire
	{ id = 3039, chance = 6510, maxCount = 1 }, -- red gem
	{ id = 9058, chance = 5384, maxCount = 2 }, -- gold ingot
	{ id = 22194, chance = 1540, maxCount = 2 }, -- opal
	{ id = 3038, chance = 8960, maxCount = 2 }, -- green gem
	{ id = 9057, chance = 1876, maxCount = 20 }, -- small topaz
	{ id = 3030, chance = 1421, maxCount = 20 }, -- small ruby
	{ id = 5904, chance = 2100 }, -- magic sulphur
	{ id = 3033, chance = 10290, maxCount = 20 }, -- small amethyst
	{ id = 5891, chance = 5384 }, -- enchanted chicken wing
	{ id = 3324, chance = 5810 }, -- skull staff
	{ id = 3036, chance = 1638, maxCount = 1 }, -- violet gem
	{ id = 7437, chance = 9800 }, -- sapphire hammer
	{ id = 8029, chance = 490 }, -- silkweaver bow
	{ id = 8051, chance = 140 }, -- voltage armor
	{ id = 3418, chance = 630 }, -- bonelord shield
	{ id = 8076, chance = 1750 }, -- spellscroll of prophecies
	{ id = 7418, chance = 266 }, -- nightmare blade
	{ id = 16160, chance = 434 }, -- crystalline sword
	{ id = 5809, chance = 574 }, -- soul stone
	{ id = 24971, chance = 350 }, -- forbidden tome
	{ id = 24972, chance = 560 }, -- key to knowledge
	{ id = 20080, chance = 280 }, -- umbral hammer
	{ id = 24954, chance = 280 }, -- part of a rune
	{ id = 23375, chance = 2100, maxCount = 5 }, -- supreme health potion
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, skill = 140, attack = 80 },
	{ name = "combat", interval = 2000, chance = 7, type = COMBAT_PHYSICALDAMAGE, minDamage = -650, maxDamage = -900, length = 8, spread = 0, effect = CONST_ME_EXPLOSIONAREA, target = false },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_LIFEDRAIN, minDamage = -850, maxDamage = -2260, length = 10, spread = 0, effect = CONST_ME_MAGIC_RED, target = false },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_LIFEDRAIN, minDamage = -640, maxDamage = -800, radius = 5, effect = CONST_ME_SMALLCLOUDS, target = false },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_ENERGYDAMAGE, minDamage = -420, maxDamage = -954, length = 8, spread = 0, effect = CONST_ME_PURPLEENERGY, target = false },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_EARTHDAMAGE, minDamage = -640, maxDamage = -800, radius = 5, effect = CONST_ME_STONES, target = true },
	{ name = "medusa paralyze", interval = 2000, chance = 20, target = false },
}

monster.defenses = {
	defense = 50,
	armor = 50,
	{ name = "combat", interval = 2000, chance = 25, type = COMBAT_HEALING, minDamage = 1500, maxDamage = 3000, effect = CONST_ME_MAGIC_GREEN, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 20 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 20 },
	{ type = COMBAT_EARTHDAMAGE, percent = 20 },
	{ type = COMBAT_FIREDAMAGE, percent = 20 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 20 },
	{ type = COMBAT_HOLYDAMAGE, percent = 20 },
	{ type = COMBAT_DEATHDAMAGE, percent = 20 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
