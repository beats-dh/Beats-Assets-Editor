local mType = Game.createMonsterType("Hellgorak")
local monster = {}

monster.description = "Hellgorak"
monster.experience = 10000
monster.outfit = {
	lookType = 12,
	lookHead = 19,
	lookBody = 77,
	lookLegs = 3,
	lookFeet = 80,
	lookAddons = 0,
	lookMount = 0,
}

monster.events = {
	"InquisitionBossDeath",
}

monster.bosstiary = {
	bossRaceId = 403,
	bossRace = RARITY_BANE,
}

monster.health = 25850
monster.maxHealth = 25850
monster.race = "blood"
monster.corpse = 6068
monster.speed = 165
monster.manaCost = 0

monster.changeTarget = {
	interval = 5000,
	chance = 8,
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
	staticAttackChance = 85,
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
	{ text = "I'll sacrifice yours souls to seven!", yell = false },
	{ text = "I'm bad news for you mortals!", yell = false },
	{ text = "No man can defeat me!", yell = false },
	{ text = "Your puny skills are no match for me.", yell = false },
	{ text = "I smell your fear.", yell = false },
	{ text = "Delicious!", yell = false },
}

monster.loot = {
	{ id = 3031, chance = 80000, maxCount = 200 }, -- gold coin
	{ id = 8899, chance = 39936 }, -- slightly rusted legs
	{ id = 7643, chance = 33400, maxCount = 2 }, -- ultimate health potion
	{ id = 8073, chance = 24808 }, -- spellbook of warding
	{ id = 8896, chance = 24448 }, -- slightly rusted armor
	{ id = 3344, chance = 23960 }, -- beastslayer axe
	{ id = 3035, chance = 17432, maxCount = 30 }, -- platinum coin
	{ id = 7642, chance = 16944 }, -- great spirit potion
	{ id = 239, chance = 16456 }, -- great health potion
	{ id = 3381, chance = 15736 }, -- crown armor
	{ id = 238, chance = 12952 }, -- great mana potion
	{ id = 3027, chance = 11256, maxCount = 25 }, -- black pearl
	{ id = 3026, chance = 11136, maxCount = 25 }, -- white pearl
	{ id = 7456, chance = 10288 }, -- noble axe
	{ id = 3028, chance = 10288, maxCount = 25 }, -- small diamond
	{ id = 3030, chance = 10408, maxCount = 5 }, -- small ruby
	{ id = 3008, chance = 10168 }, -- crystal necklace
	{ id = 3033, chance = 9928, maxCount = 25 }, -- small amethyst
	{ id = 3016, chance = 9440 }, -- ruby necklace
	{ id = 3029, chance = 9320, maxCount = 25 }, -- small sapphire
	{ id = 821, chance = 9080 }, -- magma legs
	{ id = 9057, chance = 8960, maxCount = 25 }, -- small topaz
	{ id = 3032, chance = 8592, maxCount = 25 }, -- small emerald
	{ id = 3554, chance = 8592 }, -- steel boots
	{ id = 8043, chance = 8472 }, -- focus cape
	{ id = 3382, chance = 8112 }, -- crown legs
	{ id = 8042, chance = 8112 }, -- spirit cloak
	{ id = 3013, chance = 7744 }, -- golden amulet
	{ id = 3371, chance = 7624 }, -- knight legs
	{ id = 5954, chance = 7384, maxCount = 2 }, -- demon horn
	{ id = 8074, chance = 7016 }, -- spellbook of mind control
	{ id = 8075, chance = 6896 }, -- spellbook of lost souls
	{ id = 3567, chance = 6536 }, -- blue robe
	{ id = 3360, chance = 2296 }, -- golden armor
	{ id = 7412, chance = 2176 }, -- butcher's axe
	{ id = 7388, chance = 1576 }, -- vile axe
	{ id = 8076, chance = 1088 }, -- spellscroll of prophecies
	{ id = 7453, chance = 488 }, -- executioner
	{ id = 8098, chance = 360 }, -- demonwing axe
	{ id = 3364, chance = 360 }, -- golden legs
	{ id = 8051, chance = 360 }, -- voltage armor
	{ id = 8090, chance = 240 }, -- spellbook of dark mysteries
	{ id = 3019, chance = 120 }, -- demonbone amulet
	{ id = 3303, chance = 80 }, -- great axe
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -910 },
	{ name = "combat", interval = 1000, chance = 11, type = COMBAT_ENERGYDAMAGE, minDamage = -250, maxDamage = -819, length = 8, spread = 3, effect = CONST_ME_PURPLEENERGY, target = false },
	{ name = "combat", interval = 2000, chance = 14, type = COMBAT_MANADRAIN, minDamage = -90, maxDamage = -500, radius = 5, effect = CONST_ME_STUN, target = false },
	{ name = "combat", interval = 1000, chance = 11, type = COMBAT_FIREDAMAGE, minDamage = -50, maxDamage = -520, radius = 5, effect = CONST_ME_FIREAREA, target = true },
	{ name = "combat", interval = 2000, chance = 5, type = COMBAT_LIFEDRAIN, minDamage = 0, maxDamage = -150, radius = 7, effect = CONST_ME_POFF, target = false },
}

monster.defenses = {
	defense = 65,
	armor = 70,
	--	mitigation = ???,
	{ name = "combat", interval = 1000, chance = 11, type = COMBAT_HEALING, minDamage = 400, maxDamage = 900, effect = CONST_ME_MAGIC_GREEN, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 98 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 98 },
	{ type = COMBAT_EARTHDAMAGE, percent = 98 },
	{ type = COMBAT_FIREDAMAGE, percent = 98 },
	{ type = COMBAT_LIFEDRAIN, percent = 100 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = -205 },
	{ type = COMBAT_ICEDAMAGE, percent = 98 },
	{ type = COMBAT_HOLYDAMAGE, percent = 95 },
	{ type = COMBAT_DEATHDAMAGE, percent = 98 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
