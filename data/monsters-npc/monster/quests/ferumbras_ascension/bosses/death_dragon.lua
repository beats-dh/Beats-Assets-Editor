local mType = Game.createMonsterType("Death Dragon")
local monster = {}

monster.description = "a death dragon"
monster.experience = 350
monster.outfit = {
	lookType = 231,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.health = 8350
monster.maxHealth = 8350
monster.race = "undead"
monster.corpse = 0
monster.speed = 165
monster.manaCost = 0

monster.changeTarget = {
	interval = 2000,
	chance = 5,
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
	runHealth = 700,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = true,
	canWalkOnFire = true,
	canWalkOnPoison = true,
}

monster.events = {
	"DeathDragon",
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
	{ id = 6499, chance = 11664 }, -- demonic essence
	{ id = 3031, chance = 80000, maxCount = 198 }, -- gold coin
	{ id = 239, chance = 18992, maxCount = 3 }, -- great health potion
	{ id = 238, chance = 20528, maxCount = 3 }, -- great mana potion
	{ id = 5925, chance = 11664 }, -- hardened bone
	{ id = 3035, chance = 39832, maxCount = 5 }, -- platinum coin
	{ id = 9058, chance = 1304 }, -- gold ingot
	{ id = 10316, chance = 25808 }, -- unholy bone
	{ id = 3061, chance = 912 }, -- life crystal
	{ id = 7430, chance = 3432 }, -- dragonbone staff
	{ id = 3342, chance = 1304 }, -- war axe
	{ id = 7368, chance = 19704, maxCount = 5 }, -- assassin star
	{ id = 3450, chance = 12576, maxCount = 15 }, -- power bolt
	{ id = 3360, chance = 680 }, -- golden armor
	{ id = 10438, chance = 680 }, -- spellweaver's robe
	{ id = 3370, chance = 3944 }, -- knight armor
	{ id = 8057, chance = 400 }, -- divine plate
	{ id = 8061, chance = 424 }, -- skullcracker armor
	{ id = 3027, chance = 17032, maxCount = 2 }, -- black pearl
	{ id = 3029, chance = 22088, maxCount = 2 }, -- small sapphire
	{ id = 3041, chance = 936 }, -- blue gem
	{ id = 3392, chance = 736 }, -- royal helmet
	{ id = 6299, chance = 1560 }, -- death ring
	{ id = 2903, chance = 4032 }, -- golden mug
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, skill = 150, attack = 60 },
	{ name = "combat", interval = 2000, chance = 9, type = COMBAT_EARTHDAMAGE, minDamage = -100, maxDamage = -400, range = 7, radius = 4, shootEffect = CONST_ANI_POISON, effect = CONST_ME_POISONAREA, target = true },
	{ name = "combat", interval = 2000, chance = 9, type = COMBAT_LIFEDRAIN, minDamage = -100, maxDamage = -400, range = 7, radius = 4, shootEffect = CONST_ANI_DEATH, effect = CONST_ME_MORTAREA, target = true },
	{ name = "combat", interval = 2000, chance = 11, type = COMBAT_PHYSICALDAMAGE, minDamage = 0, maxDamage = -615, range = 7, shootEffect = CONST_ANI_DEATH, effect = CONST_ME_MORTAREA, target = false },
	{ name = "undead dragon curse", interval = 2000, chance = 9, target = false },
	{ name = "combat", interval = 2000, chance = 9, type = COMBAT_LIFEDRAIN, minDamage = -200, maxDamage = -700, length = 8, spread = 3, effect = CONST_ME_MAGIC_RED, target = false },
	{ name = "combat", interval = 2000, chance = 9, type = COMBAT_DEATHDAMAGE, minDamage = -400, maxDamage = -550, length = 8, spread = 3, effect = CONST_ME_SMALLCLOUDS, target = false },
}

monster.defenses = {
	defense = 63,
	armor = 45,
	--	mitigation = ???,
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_HEALING, minDamage = 200, maxDamage = 250, effect = CONST_ME_MAGIC_RED, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 1 - 1 },
	{ type = COMBAT_FIREDAMAGE, percent = 0 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 1 },
	{ type = COMBAT_HOLYDAMAGE, percent = -1 },
	{ type = COMBAT_DEATHDAMAGE, percent = 100 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
