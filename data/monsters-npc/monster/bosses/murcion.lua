local mType = Game.createMonsterType("Murcion")
local monster = {}

monster.description = "Murcion"
monster.experience = 3250000
monster.outfit = {
	lookType = 1664,
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
	bossRaceId = 2362,
	bossRace = RARITY_ARCHFOE,
}

monster.health = 350000
monster.maxHealth = 350000
monster.race = "undead"
monster.corpse = 44015
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

monster.summon = {}

monster.voices = {}

monster.loot = {
	{ name = "crystal coin", chance = 34077, maxCount = 91 },
	{ id = 3039, chance = 7627, maxCount = 2 }, -- red gem
	{ name = "amber with a bug", chance = 10213, maxCount = 1 },
	{ name = "amber with a dragonfly", chance = 3783, maxCount = 1 },
	{ name = "bullseye potion", chance = 7575, maxCount = 44 },
	{ name = "green gem", chance = 5434, maxCount = 4 },
	{ name = "mastermind potion", chance = 6674, maxCount = 15 },
	{ name = "supreme health potion", chance = 4348, maxCount = 102 },
	{ name = "ultimate mana potion", chance = 6150, maxCount = 29 },
	{ name = "ultimate spirit potion", chance = 6148, maxCount = 161 },
	{ name = "putrefactive figurine", chance = 7679 },
	{ name = "the essence of murcion", chance = 175 },
	{ id = 43895, chance = 35 }, -- Bag you covet
	{ id = 60080, chance = 25000 }, -- boss token
}
monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 350, maxDamage = -1600 },
	{ name = "combat", interval = 2000, chance = 17, type = COMBAT_DEATHDAMAGE, minDamage = 650, maxDamage = -3000, radius = 8, target = false, effect = CONST_ME_MORTAREA },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_DEATHDAMAGE, minDamage = 550, maxDamage = -2600, effect = CONST_ME_INSECTS },
	{ name = "combat", interval = 2000, chance = 25, type = COMBAT_AGONYDAMAGE, minDamage = 650, maxDamage = -2200, range = 8, effect = CONST_ME_MORTAREA },
	{ name = "combat", interval = 2000, chance = 16, type = COMBAT_MANADRAIN, minDamage = 650, maxDamage = -750, radius = 8, target = false, effect = CONST_ME_STUN },
	{ name = "speed", interval = 2000, chance = 20, speed = { min = -400, max = -400 }, duration = 20000, radius = 7, target = false, effect = CONST_ME_SOUND_RED },
	{ name = "rotten blood mushroom spawn", interval = RottenBlood.mushroomConfiguration.spawnInterval, chance = 100, minDamage = 0, maxDamage = 0 },
}

monster.defenses = {
	defense = 105,
	armor = 105,
	{ name = "combat", interval = 3000, chance = 10, type = COMBAT_HEALING, minDamage = 800, maxDamage = 1500, effect = CONST_ME_MAGIC_RED, target = false },
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
