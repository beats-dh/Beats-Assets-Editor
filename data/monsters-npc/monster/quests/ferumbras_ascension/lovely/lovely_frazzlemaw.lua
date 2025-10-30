local mType = Game.createMonsterType("Lovely Frazzlemaw")
local monster = {}

monster.description = "a lovely frazzlemaw"
monster.experience = 3400
monster.outfit = {
	lookType = 594,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.health = 4100
monster.maxHealth = 4100
monster.race = "blood"
monster.corpse = 20233
monster.speed = 200
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
	{ text = "Mwaaaahnducate youuuuuu *gurgle*, mwaaah!", yell = false },
	{ text = "Mmmwahmwahmwahah, mwaaah!", yell = false },
	{ text = "MMMWAHMWAHMWAHMWAAAAH!", yell = true },
}

monster.loot = {
	{ id = 20062, chance = 3592 }, -- cluster of solace
	{ id = 20198, chance = 14848 }, -- frazzle tongue
	{ id = 3031, chance = 80000, maxCount = 100 }, -- gold coin
	{ id = 239, chance = 11592, maxCount = 2 }, -- great health potion
	{ id = 238, chance = 11848, maxCount = 3 }, -- great mana potion
	{ id = 3035, chance = 80000, maxCount = 7 }, -- platinum coin
	{ id = 3104, chance = 7936 }, -- banana skin
	{ id = 3110, chance = 8168 }, -- piece of iron
	{ id = 3111, chance = 8032 }, -- fishbone
	{ id = 3114, chance = 9904 }, -- skull
	{ id = 3115, chance = 7608 }, -- bone
	{ id = 3116, chance = 4288 }, -- big bone
	{ id = 3578, chance = 5424, maxCount = 3 }, -- fish
	{ id = 3582, chance = 4768, maxCount = 2 }, -- ham
	{ id = 5880, chance = 2400 }, -- iron ore
	{ id = 5895, chance = 3720 }, -- fish fin
	{ id = 5925, chance = 4152 }, -- hardened bone
	{ id = 5951, chance = 8536 }, -- fish tail
	{ id = 7404, chance = 792 }, -- assassin dagger
	{ id = 7407, chance = 1688 }, -- haunted blade
	{ id = 3265, chance = 2536 }, -- two handed sword
	{ id = 7418, chance = 824 }, -- nightmare blade
	{ id = 9058, chance = 1864 }, -- gold ingot
	{ id = 10389, chance = 1280 }, -- sai
	{ id = 16120, chance = 2400 }, -- violet crystal shard
	{ id = 16123, chance = 12512 }, -- brown crystal splinter
	{ id = 16126, chance = 4184 }, -- red crystal fragment
	{ id = 20131, chance = 7712 }, -- remains of a crude dream
	{ id = 20199, chance = 12792 }, -- frazzle skin
	{ id = 3125, chance = 7544 }, -- remains of a fish
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, skill = 90, attack = 80 },
	{ name = "combat", interval = 2000, chance = 12, type = COMBAT_PHYSICALDAMAGE, minDamage = 0, maxDamage = -400, radius = 3, effect = CONST_ME_HITAREA, target = false },
	{ name = "combat", interval = 2000, chance = 13, type = COMBAT_LIFEDRAIN, minDamage = -100, maxDamage = -700, length = 5, spread = 0, effect = CONST_ME_EXPLOSIONAREA, target = true },
	-- bleed
	{ name = "condition", type = CONDITION_BLEEDING, interval = 2000, chance = 16, minDamage = -400, maxDamage = -600, radius = 2, shootEffect = CONST_ANI_LARGEROCK, effect = CONST_ME_STONES, target = true },
	{ name = "frazzlemaw paralyze", interval = 2000, chance = 15, target = false },
}

monster.defenses = {
	defense = 30,
	armor = 30,
	{ name = "combat", interval = 2000, chance = 13, type = COMBAT_HEALING, minDamage = 250, maxDamage = 425, effect = CONST_ME_HITBYPOISON, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 100 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 100 },
	{ type = COMBAT_EARTHDAMAGE, percent = 100 },
	{ type = COMBAT_FIREDAMAGE, percent = 100 },
	{ type = COMBAT_LIFEDRAIN, percent = 100 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 100 },
	{ type = COMBAT_HOLYDAMAGE, percent = 100 },
	{ type = COMBAT_DEATHDAMAGE, percent = 15 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
