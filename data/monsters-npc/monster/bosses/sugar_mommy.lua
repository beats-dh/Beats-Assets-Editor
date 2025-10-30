local mType = Game.createMonsterType("Sugar Mommy")
local monster = {}
monster.description = "a sugar mommy"
monster.experience = 6800
monster.outfit = {
	lookType = 1764,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 94,
	lookAddons = 1,
	lookMount = 0,
}
monster.health = 6000
monster.maxHealth = 6000
monster.corpse = 48417
monster.race = "candy"
monster.speed = 165
monster.manaCost = 0

monster.bosstiary = {
	bossRaceId = 2580,
	bossRace = RARITY_BANE,
}

monster.changeTarget = {
	interval = 5000,
	chance = 8,
}
monster.strategiesTarget = {
	nearest = 100,
}
monster.flags = {
	summonable = false,
	attackable = true,
	hostile = true,
	convinceable = false,
	pushable = false,
	rewardBoss = true,
	illusionable = true,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 90,
	targetDistance = 4,
	runHealth = 0,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = false,
	canWalkOnFire = false,
	canWalkOnPoison = false,
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
	{ id = 3035, chance = 70000, maxCount = 13 }, -- Platinum Coin
	{ id = 3590, maxCount = 2, chance = 70000 }, -- Cherry
	{ id = 48249, maxCount = 64, chance = 4760 }, -- Milk Chocolate Coin
	{ id = 48250, maxCount = 64, chance = 4760 }, -- Dark Chocolate Coin
	{ id = 3039, chance = 7000 }, -- Red Gem
	{ id = 3037, chance = 8400 }, -- Yellow Gem
	{ id = 48273, chance = 3500 }, -- Taiyaki Ice Cream
	{ id = 6393, chance = 9800 }, -- Cream Cake
	{ id = 25737, maxCount = 2, chance = 4200 }, -- Rainbow Quartz
	{ id = 25700, chance = 4900 }, -- Dream Blossom Staff
}
monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = -650, maxDamage = -950 },
	{ name = "combat", interval = 1500, chance = 100, type = COMBAT_ENERGYDAMAGE, minDamage = -300, maxDamage = -450, range = 7, shootEffect = 62, target = true },
	{ name = "sugar mommy wave", interval = 2000, chance = 20, minDamage = -350, maxDamage = -750 },
	{ name = "sugar mommy energy wave", interval = 2000, chance = 20, minDamage = -350, maxDamage = -750 },
	{ name = "sugar mommy explosion", interval = 2000, chance = 20, minDamage = -650, maxDamage = -950 },
}
monster.defenses = {
	defense = 50,
	armor = 50,
	{ name = "combat", interval = 2000, chance = 12, type = COMBAT_HEALING, minDamage = 250, maxDamage = 300, radius = 4, effect = CONST_ME_HEART_CIRCLE, target = false },
}
monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 10 },
	{ type = COMBAT_EARTHDAMAGE, percent = 5 },
	{ type = COMBAT_FIREDAMAGE, percent = 5 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 15 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 },
}
monster.immunities = {
	{ type = "paralyze", condition = false },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}
mType.onThink = function(monster, interval) end
mType.onAppear = function(monster, creature)
	if monster:getType():isRewardBoss() then
		monster:setReward(true)
	end
end
mType.onDisappear = function(monster, creature) end
mType.onMove = function(monster, creature, fromPosition, toPosition) end
mType.onSay = function(monster, creature, type, message) end
mType:register(monster)
