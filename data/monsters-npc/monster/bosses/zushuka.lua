local mType = Game.createMonsterType("Zushuka")
local monster = {}

monster.description = "zushuka" -- (immortal) // (mortal): lookType = 149, lookHead = 86, lookBody = 10, lookLegs = 11, lookFeet = 4, lookAddons = 0, lookMount = 0
monster.experience = 9000
monster.outfit = {
	lookType = 149,
	lookHead = 0,
	lookBody = 10,
	lookLegs = 0,
	lookFeet = 4,
	lookAddons = 0,
	lookMount = 0,
}

monster.bosstiary = {
	bossRaceId = 969,
	bossRace = RARITY_NEMESIS,
}

monster.health = 15000
monster.maxHealth = 15000
monster.race = "blood"
monster.corpse = 18265
monster.speed = 110
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
	rewardBoss = true,
	illusionable = false,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 70,
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
	{ text = "Cool down, will you?", yell = false },
	{ text = "And stay cool.", yell = false },
	{ text = "Your cold dead body will be a marvelous ice statue.", yell = false },
	{ text = "Pay for your ignorance!", yell = false },
	{ text = "Is this all you've got?", yell = false },
	{ text = "Freeze!", yell = false },
}

monster.loot = {
	{ id = 3031, chance = 64400, maxCount = 200 }, -- gold coin
	{ id = 19083, chance = 64400 }, -- silver raid token
	{ id = 7290, chance = 39900 }, -- shard
	{ id = 7449, chance = 29400 }, -- crystal sword
	{ id = 7642, chance = 29400, maxCount = 5 }, -- great spirit potion
	{ id = 3284, chance = 29400 }, -- ice rapier
	{ id = 3052, chance = 29400 }, -- life ring
	{ id = 7443, chance = 24500 }, -- bullseye potion
	{ id = 819, chance = 24500 }, -- glacier shoes
	{ id = 7440, chance = 24500 }, -- mastermind potion
	{ id = 3035, chance = 24500 }, -- platinum coin
	{ id = 5909, chance = 24500, maxCount = 2 }, -- white piece of cloth
	{ id = 7439, chance = 19600 }, -- berserk potion
	{ id = 3041, chance = 19600 }, -- blue gem
	{ id = 3574, chance = 19600 }, -- mystic turban
	{ id = 815, chance = 14700 }, -- glacier amulet
	{ id = 238, chance = 14700, maxCount = 5 }, -- great mana potion
	{ id = 5912, chance = 9800 }, -- blue piece of cloth
	{ id = 3333, chance = 9800 }, -- crystal mace
	{ id = 3085, chance = 9800 }, -- dragon necklace
	{ id = 823, chance = 9800 }, -- glacier kilt
	{ id = 824, chance = 9800 }, -- glacier robe
	{ id = 9058, chance = 9800 }, -- gold ingot
	{ id = 239, chance = 9800, maxCount = 5 }, -- great health potion
	{ id = 7459, chance = 9800 }, -- pair of earmuffs
	{ id = 3324, chance = 9800 }, -- skull staff
	{ id = 3079, chance = 4900 }, -- boots of haste
	{ id = 829, chance = 4900 }, -- glacier mask
	{ id = 5911, chance = 4900 }, -- red piece of cloth
	{ id = 19365, chance = 4900 }, -- trapped lightning
	{ id = 19366, chance = 2100 }, -- icy culottes
	{ id = 7410, chance = 2100 }, -- queen's sceptre
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -560 },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_ICEDAMAGE, minDamage = 0, maxDamage = -100, length = 8, spread = 0, effect = CONST_ME_ICEATTACK, target = false },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_ICEDAMAGE, minDamage = 0, maxDamage = -110, range = 7, shootEffect = CONST_ANI_SNOWBALL, target = false },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_ICEDAMAGE, minDamage = -300, maxDamage = -750, length = 8, spread = 0, effect = CONST_ME_ICEAREA, target = false },
	{ name = "outfit", interval = 2000, chance = 10, range = 7, effect = CONST_ME_MAGIC_BLUE, target = false, duration = 4000, outfitItem = 7172 },
	{ name = "speed", interval = 2000, chance = 15, speedChange = -330, range = 7, effect = CONST_ME_ICETORNADO, target = false, duration = 20000 },
}

monster.defenses = {
	defense = 20,
	armor = 20,
	--	mitigation = ???,
	{ name = "combat", interval = 10000, chance = 1, type = COMBAT_HEALING, minDamage = 7500, maxDamage = 7515, effect = CONST_ME_MAGIC_BLUE, target = false },
	{ name = "combat", interval = 3000, chance = 15, type = COMBAT_HEALING, minDamage = 200, maxDamage = 500, effect = CONST_ME_MAGIC_BLUE, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = -10 },
	{ type = COMBAT_EARTHDAMAGE, percent = 50 },
	{ type = COMBAT_FIREDAMAGE, percent = 50 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 100 },
	{ type = COMBAT_HOLYDAMAGE, percent = 30 },
	{ type = COMBAT_DEATHDAMAGE, percent = -10 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
