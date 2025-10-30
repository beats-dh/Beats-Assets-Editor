local mType = Game.createMonsterType("The Sandking")
local monster = {}

monster.description = "The Sandking"
monster.experience = 0
monster.outfit = {
	lookType = 1013,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.events = {
	"CultsOfTibiaBossDeath",
}

monster.bosstiary = {
	bossRaceId = 1444,
	bossRace = RARITY_ARCHFOE,
}

monster.health = 50000
monster.maxHealth = 50000
monster.race = "venom"
monster.corpse = 25866
monster.speed = 125
monster.manaCost = 0

monster.changeTarget = {
	interval = 5000,
	chance = 30,
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
	canPushCreatures = false,
	staticAttackChance = 95,
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
	{ text = "CRRRK!", yell = true },
}

monster.loot = {
	{ name = "small amethyst", chance = 14700, maxCount = 10 },
	{ name = "small emerald", chance = 13300, maxCount = 10 },
	{ id = 3039, chance = 8400 }, -- red gem
	{ name = "platinum coin", chance = 47809, maxCount = 30 },
	{ name = "gold coin", chance = 70000, maxCount = 200 },
	{ name = "small diamond", chance = 14700, maxCount = 10 },
	{ name = "green gem", chance = 8400 },
	{ name = "luminous orb", chance = 24500 },
	{ name = "great mana potion", chance = 21861, maxCount = 10 },
	{ name = "ultimate health potion", chance = 19761, maxCount = 10 },
	{ name = "cobra crown", chance = 280 },
	{ name = "silver token", chance = 1750 },
	{ name = "gold token", chance = 1072 },
	{ name = "small topaz", chance = 8064, maxCount = 10 },
	{ name = "blue gem", chance = 15324 },
	{ name = "yellow gem", chance = 20622 },
	{ name = "magic sulphur", chance = 13244 },
	{ id = 7440, chance = 1400 }, -- mastermind potion
	{ id = 20062, chance = 8400, maxCount = 2 }, -- cluster of solace
	{ name = "hailstorm rod", chance = 2429 },
	{ id = 3036, chance = 700 }, -- violet gem
	{ id = 3098, chance = 14000 }, -- ring of healing
	{ id = 3030, chance = 5152, maxCount = 10 }, -- small ruby
	{ id = 281, chance = 19978 }, -- giant shimmering pearl (green)
	{ name = "skull staff", chance = 9653 },
	{ name = "grasshopper legs", chance = 9653 },
	{ name = "huge chunk of crude iron", chance = 7000, maxCount = 2 },
	{ id = 7404, chance = 301 }, -- assassin dagger
	{ name = "runed sword", chance = 4666 },
	{ name = "djinn blade", chance = 140 },
	{ id = 16121, chance = 7000, maxCount = 3 }, -- green crystal shard
	{ id = 16120, chance = 7000, maxCount = 3 }, -- violet crystal shard
	{ id = 16119, chance = 7000, maxCount = 3 }, -- blue crystal shard
	{ id = 7642, chance = 3360 }, -- great spirit potion
	{ id = 16161, chance = 4921 }, -- crystalline axe
	{ id = 3341, chance = 140 }, -- arcane staff
	{ name = "heart of the mountain", chance = 280 },
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -400 },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_EARTHDAMAGE, minDamage = 0, maxDamage = -500, range = 4, radius = 4, effect = CONST_ME_STONES, target = true },
	{ name = "speed", interval = 2000, chance = 20, speedChange = -650, radius = 5, effect = CONST_ME_MAGIC_RED, target = false, duration = 5000 },
}

monster.defenses = {
	defense = 30,
	armor = 30,
	--	mitigation = ???,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 0 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
