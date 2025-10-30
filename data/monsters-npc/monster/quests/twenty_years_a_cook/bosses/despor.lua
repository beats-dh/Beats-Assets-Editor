local mType = Game.createMonsterType("Despor")
local monster = {}

monster.description = "Despor"
monster.experience = 0
monster.outfit = {
	lookType = 1712,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.events = {
	"TwentyYearsACookBossDeath",
}

monster.health = 50000
monster.maxHealth = 50000
monster.race = "blood"
monster.corpse = 0
monster.speed = 197
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 0,
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
	convinceable = true,
	pushable = false,
	rewardBoss = true,
	illusionable = false,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 90,
	targetDistance = 0,
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
	chance = 20,
	{ text = "MAGIC IS AN ILLUSION!!!", yell = true },
	{ text = "STICKS DON'T HURT!!!", yell = true },
	{ text = "THE AGE OF DRAGONS WILL RETURN!", yell = true },
	{ text = "CAN'T HIT ME!!!", yell = true },
	{ text = "THE DRAGON WARS ARE JUST THE BEGINNING!", yell = true },
}

monster.loot = {}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = -300, maxDamage = -600, shootEffect = CONST_ANI_FIRE },
	{ name = "combat", interval = 2500, chance = 15, type = COMBAT_PHYSICALDAMAGE, minDamage = -650, maxDamage = -1200, length = 12, spread = 0, effect = CONST_ME_GROUNDSHAKER, target = false },
	{ name = "malizfirearea", interval = 2500, chance = 25, minDamage = -650, maxDamage = -1000, target = true, shootEffect = CONST_ANI_FIRE, effect = CONST_ME_FIREAREA },
	{ name = "malizearthring", interval = 2000, chance = 10, minDamage = -700, maxDamage = -1400 },
	{ name = "vilearenergywave", interval = 2000, chance = 15, minDamage = -650, maxDamage = -950 },
	{ name = "greedokdeatharea", interval = 2000, chance = 20, minDamage = -650, maxDamage = -1000 },
	{ name = "brutonphysicalwave", interval = 2000, chance = 15, minDamage = -650, maxDamage = -900 },
	{ name = "silencer skill reducer", interval = 2000, chance = 10, range = 4, target = false }, -- Skill Reducer
}

monster.defenses = {
	defense = 5,
	armor = 10,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 75 },
	{ type = COMBAT_FIREDAMAGE, percent = 100 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 100 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = true },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = true },
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
