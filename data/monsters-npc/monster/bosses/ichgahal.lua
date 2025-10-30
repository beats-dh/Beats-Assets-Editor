local mType = Game.createMonsterType("Ichgahal")
local monster = {}

monster.description = "Ichgahal"
monster.experience = 3250000
monster.outfit = {
	lookType = 1665,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.events = {
	"RottenBloodBossDeath",
}

monster.bosstiary = {
	bossRaceId = 2364,
	bossRace = RARITY_ARCHFOE,
}

monster.health = 350000
monster.maxHealth = 350000
monster.race = "undead"
monster.corpse = 44018
monster.speed = 250
monster.manaCost = 0

monster.changeTarget = {
	interval = 10000,
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
	boss = true,
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
	{ text = "Rott!!", yell = false },
	{ text = "Putrefy!", yell = false },
	{ text = "Decay!", yell = false },
}

monster.loot = {
	{ name = "crystal coin", chance = 38277, maxCount = 115 },
	{ name = "ultimate spirit potion", chance = 5018, maxCount = 153 },
	{ name = "mastermind potion", chance = 10256, maxCount = 45 },
	{ name = "yellow gem", chance = 6470, maxCount = 5 },
	{ name = "amber with a bug", chance = 5057, maxCount = 2 },
	{ name = "ultimate mana potion", chance = 9196, maxCount = 179 },
	{ name = "violet gem", chance = 10113, maxCount = 4 },
	{ name = "raw watermelon tourmaline", chance = 4752, maxCount = 2 },
	{ id = 3039, chance = 6333, maxCount = 1 }, -- red gem
	{ name = "supreme health potion", chance = 10244, maxCount = 37 },
	{ name = "berserk potion", chance = 10481, maxCount = 45 },
	{ name = "amber with a dragonfly", chance = 4529, maxCount = 1 },
	{ name = "gold ingot", chance = 7995, maxCount = 1 },
	{ name = "blue gem", chance = 5876, maxCount = 1 },
	{ name = "bullseye potion", chance = 9648, maxCount = 36 },
	{ name = "putrefactive figurine", chance = 7991, maxCount = 1 },
	{ name = "ichgahal's fungal infestation", chance = 5531, maxCount = 1 },
	{ name = "white gem", chance = 9491, maxCount = 3 },
	{ name = "the essence of ichgahal", chance = 175 },
	{ id = 43895, chance = 35 }, -- Bag you covet
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 350, maxDamage = -1900 },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_DEATHDAMAGE, minDamage = 650, maxDamage = -4500, effect = CONST_ME_INSECTS },
	{ name = "combat", interval = 2000, chance = 18, type = COMBAT_DEATHDAMAGE, minDamage = 650, maxDamage = -2500, length = 8, spread = 0, effect = CONST_ME_MORTAREA },
	{ name = "speed", interval = 2000, chance = 12, speed = { min = -400, max = -400 }, duration = 20000, radius = 7, target = false, effect = CONST_ME_SOUND_RED },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_EARTHDAMAGE, minDamage = 650, maxDamage = -1800, radius = 8, target = false, effect = CONST_ME_SMALLPLANTS },
	{ name = "combat", interval = 2000, chance = 18, type = COMBAT_PHYSICALDAMAGE, minDamage = 500, maxDamage = -2000, radius = 7, target = true, shootEffect = CONST_ANI_POISON, effect = CONST_ME_POISONAREA },
	{ name = "combat", interval = 2000, chance = 25, type = COMBAT_MANADRAIN, minDamage = 650, maxDamage = -1500, range = 5, radius = 1, target = true, effect = CONST_ME_PURPLETELEPORT },
	{ name = "combat", interval = 2000, chance = 23, type = COMBAT_MANADRAIN, minDamage = 650, maxDamage = -1200, radius = 8, target = false, effect = CONST_ME_STUN },
	{ name = "rotten blood mushroom spawn", interval = RottenBlood.mushroomConfiguration.spawnInterval, chance = 100, minDamage = 0, maxDamage = 0 },
}

monster.defenses = {
	defense = 105,
	armor = 105,
	{ name = "combat", interval = 3000, chance = 10, type = COMBAT_HEALING, minDamage = 800, maxDamage = 1200, effect = CONST_ME_MAGIC_RED, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 15 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 15 },
	{ type = COMBAT_EARTHDAMAGE, percent = 15 },
	{ type = COMBAT_FIREDAMAGE, percent = 15 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 15 },
	{ type = COMBAT_HOLYDAMAGE, percent = 15 },
	{ type = COMBAT_DEATHDAMAGE, percent = 15 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType.onAppear = function(monster, creature)
	if monster:getType():isRewardBoss() then
		monster:setReward(true)
	end
end

mType:register(monster)
