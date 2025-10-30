local mType = Game.createMonsterType("Lady Tenebris")
local monster = {}

monster.description = "Lady Tenebris"
monster.experience = 50000
monster.outfit = {
	lookType = 433,
	lookHead = 76,
	lookBody = 95,
	lookLegs = 38,
	lookFeet = 94,
	lookAddons = 2,
	lookMount = 0,
}

monster.events = {
	"ForgottenKnowledgeBossDeath",
	"HealthForgotten",
}

monster.bosstiary = {
	bossRaceId = 1315,
	bossRace = RARITY_ARCHFOE,
}

monster.health = 150000
monster.maxHealth = 150000
monster.race = "blood"
monster.corpse = 6560
monster.speed = 185
monster.manaCost = 0

monster.changeTarget = {
	interval = 2000,
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
	staticAttackChance = 98,
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
	{ text = "May the embrace of darkness kill you!", yell = false },
	{ text = "I'm the one and only mistress of shadows!", yell = false },
	{ text = "Blackout!", yell = false },
}

monster.loot = {
	{ id = 3031, chance = 7000, maxCount = 50 }, -- gold coin
	{ id = 3035, chance = 7000, maxCount = 50 }, -- platinum coin
	{ id = 3033, chance = 7000, maxCount = 10 }, -- small amethyst
	{ id = 3028, chance = 7000, maxCount = 10 }, -- small diamond
	{ id = 3030, chance = 7000, maxCount = 10 }, -- small ruby
	{ id = 9057, chance = 7000, maxCount = 10 }, -- small topaz
	{ id = 238, chance = 7000, maxCount = 100 }, -- great mana potion
	{ id = 7642, chance = 7000, maxCount = 100 }, -- great spirit potion
	{ id = 20062, chance = 8400, maxCount = 2 }, -- cluster of solace
	{ id = 16119, chance = 1400, maxCount = 3 }, -- blue crystal shard
	{ id = 16121, chance = 3500, maxCount = 5 }, -- green crystal shard
	{ id = 20062, chance = 1400, maxCount = 2 }, -- cluster of solace
	{ id = 16120, chance = 3500, maxCount = 3 }, -- violet crystal shard
	{ id = 281, chance = 4200 }, -- giant shimmering pearl (green)
	{ id = 3038, chance = 1400 }, -- green gem
	{ id = 7440, chance = 1400 }, -- mastermind potion
	{ id = 22195, chance = 1400 }, -- onyx pendant
	{ id = 3039, chance = 700 }, -- red gem
	{ id = 3006, chance = 1400 }, -- ring of the sky
	{ id = 7451, chance = 1400 }, -- shadow sceptre
	{ id = 8075, chance = 700 }, -- spellbook of lost souls
	{ id = 8073, chance = 700 }, -- spellbook of warding
	{ id = 3324, chance = 700 }, -- skull staff
	{ id = 3037, chance = 700 }, -- yellow gem
	{ id = 16096, chance = 700 }, -- wand of defiance
	{ id = 22721, chance = 70000 }, -- gold token
	{ id = 22516, chance = 70000 }, -- silver token
	{ id = 3341, chance = 140 }, -- arcane staff
	{ id = 24973, chance = 140 }, -- shadow mask
	{ id = 24974, chance = 140 }, -- shadow paint
	{ id = 22755, chance = 140 }, -- book of lies
	{ id = 20088, chance = 140 }, -- crude umbral spellbook
	{ id = 24957, chance = 350, unique = true }, -- part of a rune
	{ id = 3021, chance = 140 }, -- sapphire amulet
	{ id = 20089, chance = 140 }, -- umbral spellbook
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = -800, maxDamage = -1800 },
	{ name = "combat", interval = 6000, chance = 13, type = COMBAT_DEATHDAMAGE, minDamage = -1200, maxDamage = -1500, length = 8, spread = 0, effect = CONST_ME_MORTAREA, target = false },
	{ name = "combat", interval = 2000, chance = 13, type = COMBAT_DEATHDAMAGE, minDamage = -400, maxDamage = -600, radius = 4, shootEffect = CONST_ANI_DEATH, effect = CONST_ME_SMALLCLOUDS, target = true },
	{ name = "tenebris summon", interval = 2000, chance = 14, target = false },
	{ name = "tenebris ultimate", interval = 15000, chance = 30, target = false },
}

monster.defenses = {
	defense = 65,
	armor = 55,
	--	mitigation = ???,
	{ name = "combat", interval = 3000, chance = 25, type = COMBAT_HEALING, minDamage = 600, maxDamage = 2700, effect = CONST_ME_MAGIC_BLUE, target = false },
	{ name = "speed", interval = 2000, chance = 15, speedChange = 320, effect = CONST_ME_MAGIC_RED, target = false, duration = 5000 },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 5 },
	{ type = COMBAT_EARTHDAMAGE, percent = 20 },
	{ type = COMBAT_FIREDAMAGE, percent = 5 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 15 },
	{ type = COMBAT_HOLYDAMAGE, percent = 1 },
	{ type = COMBAT_DEATHDAMAGE, percent = 60 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
