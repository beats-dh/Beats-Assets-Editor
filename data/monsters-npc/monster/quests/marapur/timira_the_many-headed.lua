local mType = Game.createMonsterType("Timira the Many-Headed")
local monster = {}

monster.name = "Timira The Many-Headed"
monster.description = "Timira the Many-Headed"
monster.experience = 45500
monster.outfit = {
	lookType = 1542,
	lookAddons = 3,
}

monster.bosstiary = {
	bossRaceId = 2250,
	bossRace = RARITY_ARCHFOE,
}

monster.health = 75000
monster.maxHealth = 75000
monster.race = "blood"
monster.corpse = 39712
monster.speed = 120
monster.manaCost = 0

monster.changeTarget = {
	interval = 2000,
	chance = 25,
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
	{ text = "Harmony is just a vain illusion! ", yell = false },
	{ text = " I'm ashamed of my former self! ", yell = false },
	{ text = " You won't lead me astray!", yell = false },
}

monster.loot = {
	{ name = "crystal coin", chance = 70000, maxCount = 22 },
	{ name = "ultimate mana potion", chance = 22857, maxCount = 14 },
	{ name = "ultimate health potion", chance = 21428, maxCount = 14 },
	{ name = "bullseye potion", chance = 17143, maxCount = 5 },
	{ name = "berserk potion", chance = 15714, maxCount = 5 },
	{ name = "mastermind potion", chance = 12857, maxCount = 5 },
	{ name = "naga basin", chance = 8572 },
	{ name = "transcendence potion", chance = 12857, maxCount = 5 },
	{ name = "piece of timira's sensors", chance = 7143 },
	{ name = "giant amethyst", chance = 4285 },
	{ name = "giant ruby", chance = 2857 },
	{ name = "giant emerald", chance = 2857 },
	{ name = "one of timira's many heads", chance = 1429 },
	{ name = "giant sapphire", chance = 1429 },
	{ name = "giant topaz", chance = 1429 },
	{ name = "dawnfire sherwani", chance = 140 },
	{ name = "frostflower boots", chance = 140 },
	{ name = "feverbloom boots", chance = 140 },
	{ id = 39233, chance = 140 }, -- enchanted turtle amulet
	{ name = "midnight tunic", chance = 140 },
	{ name = "midnight sarong", chance = 140 },
	{ name = "naga quiver", chance = 140 },
	{ name = "naga sword", chance = 140 },
	{ name = "naga axe", chance = 140 },
	{ name = "naga club", chance = 140 },
	{ name = "naga wand", chance = 140 },
	{ name = "naga rod", chance = 140 },
	{ name = "naga crossbow", chance = 140 },
	{ name = "naga tanko", chance = 140 },
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -600 },
	{ name = "timira fire ring", interval = 3500, chance = 50, minDamage = -360, maxDamage = -425 },
	{ name = "death chain", interval = 2500, chance = 30, minDamage = -190, maxDamage = -225, range = 3, target = true },
	{ name = "mana drain chain", interval = 2500, chance = 20, minDamage = -100, maxDamage = -130 },
	{ name = "timira explosion", interval = 4200, chance = 40, minDamage = -350, maxDamage = -560 },
	{ name = "combat", interval = 5500, chance = 45, type = COMBAT_PHYSICALDAMAGE, minDamage = -580, maxDamage = -620, length = 6, spread = 2, effect = CONST_ME_EXPLOSIONAREA, target = false },
	{ name = "combat", interval = 5000, chance = 60, type = COMBAT_ENERGYDAMAGE, minDamage = -230, maxDamage = -450, range = 1, radius = 1, shootEffect = CONST_ANI_ENERGYBALL, effect = CONST_ME_ENERGYHIT, target = true },
}

monster.defenses = {
	defense = 60,
	armor = 82,
	mitigation = 2.07,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 10 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 10 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 10 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 10 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
