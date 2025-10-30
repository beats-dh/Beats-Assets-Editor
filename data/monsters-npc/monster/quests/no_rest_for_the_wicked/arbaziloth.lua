local mType = Game.createMonsterType("Arbaziloth")
local monster = {}

monster.description = "Arbaziloth"
monster.experience = 500000
monster.outfit = {
	lookType = 1798,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.events = {
	"ArbazilothChangeEvent",
}

monster.bosstiary = {
	bossRaceId = 2594,
	bossRace = RARITY_ARCHFOE,
}

monster.health = 500000
monster.maxHealth = 500000
monster.race = "fire"
monster.corpse = 50029
monster.speed = 200
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
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
	{ text = "I am superior!", yell = false },
	{ text = "You are mad to challange a demon prince!", yell = true },
	{ text = "You can't stop me or my plans!", yell = true },
	{ text = "Pesky humans!", yell = false },
	{ text = "This insolence!", yell = true },
	{ text = "Nobody can stop me!", yell = true },
	{ text = "All will have to bow to me!", yell = true },
	{ text = "With this power I can crush everyone!", yell = true },
	{ text = "All that energy is mine!", yell = true },
}

monster.loot = {
	{ id = 3043, chance = 7000, maxCount = 3 }, -- crystal Coin
	{ id = 3035, chance = 7000, maxCount = 98, minCount = 54 }, -- platinum Coins
	{ id = 238, chance = 37954, maxCount = 14, minCount = 3 }, -- great mana potion
	{ id = 237, chance = 26117, maxCount = 19, minCount = 14 }, -- strong mana potion
	{ id = 3041, chance = 15400, maxCount = 2, minCount = 1 }, -- blue gem
	{ id = 3037, chance = 15400, maxCount = 2, minCount = 1 }, -- yellow gem
	{ id = 3039, chance = 1554, minCount = 1, maxCount = 2 }, -- red gem
	{ id = 7643, chance = 18200, maxCount = 20, minCount = 14 }, -- ultimate health potion
	{ id = 23374, chance = 19600, maxCount = 14, minCount = 2 }, -- ultimate spirit potion
	{ id = 23373, chance = 19600, maxCount = 29, minCount = 23 }, -- ultimate Mana Potion
	{ id = 23375, chance = 22037, maxCount = 8, minCount = 4 }, -- supreme health potion
	{ id = 6299, chance = 10500 }, -- death ring
	{ id = 3284, chance = 11655 }, -- ice rapier
	{ id = 3052, chance = 13300 }, -- life ring
	{ id = 3373, chance = 15909 }, -- strange helmet
	{ id = 7642, chance = 12957, maxCount = 4 }, -- great spirit potion
	{ id = 3356, chance = 16100 }, -- devil helmet
	{ id = 3320, chance = 11900 }, -- fire axe
	{ id = 3281, chance = 10500 }, -- giant sword
	{ id = 50067, chance = 749 }, -- arbaziloth shoulder piece
	{ id = 50060, chance = 280 }, -- demon claws
	{ id = 49526, chance = 350 }, -- inferniarch warhammer
	{ id = 49528, chance = 210 }, -- inferniarch wand
	{ id = 49530, chance = 350 }, -- inferniarch slayer
	{ id = 49529, chance = 210 }, -- inferniarch rod
	{ id = 49524, chance = 350 }, -- inferniarch greataxe
	{ id = 49525, chance = 210 }, -- inferniarch flail
	{ id = 49520, chance = 210 }, -- inferniarch bow
	{ id = 49527, chance = 210 }, -- inferniarch blade
	{ id = 49523, chance = 210 }, -- inferniarch battleaxe
	{ id = 49522, chance = 245 }, -- inferniarch arbalest
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 300, maxDamage = -920 },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_DEATHDAMAGE, minDamage = -800, maxDamage = -1650, radius = 12, effect = CONST_ME_SMALLCLOUDS, target = false },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_PHYSICALDAMAGE, minDamage = -850, maxDamage = -1820, radius = 7, effect = CONST_ME_BLOCKHIT, target = false },
	{ name = "combat", interval = 2000, chance = 20, minDamage = -820, maxDamage = -1250, range = 6, radius = 4, effect = CONST_ME_MORTAREA, target = true },
	{ name = "combat", interval = 2000, chance = 24, type = COMBAT_ENERGYDAMAGE, minDamage = -800, maxDamage = -1290, range = 6, radius = 1, effect = CONST_ME_PINK_ENERGY_SPARK, target = true },
}

monster.defenses = {
	defense = 55,
	armor = 44,
	mitigation = 1.74,
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_HEALING, minDamage = 180, maxDamage = 250, effect = CONST_ME_MAGIC_BLUE, target = false },
	{ name = "speed", interval = 2000, chance = 15, speedChange = 320, effect = CONST_ME_MAGIC_RED, target = false, duration = 5000 },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 30 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 15 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 20 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 20 },
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
