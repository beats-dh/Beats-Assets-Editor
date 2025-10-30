local mType = Game.createMonsterType("The Rootkraken")
local monster = {}

monster.name = "The Rootkraken"
monster.experience = 600000
monster.outfit = {
	lookType = 1765,
}

monster.bosstiary = {
	bossRaceId = 2528,
	bossRace = RARITY_ARCHFOE,
}

monster.health = 360000
monster.maxHealth = 360000
monster.race = "venom"
monster.corpse = 49124
monster.speed = 180

monster.changeTarget = {
	interval = 4000,
	chance = 25,
}

monster.strategiesTarget = {
	nearest = 70,
	health = 10,
	damage = 10,
	random = 10,
}

monster.flags = {
	attackable = true,
	hostile = true,
	summonable = false,
	convinceable = false,
	illusionable = false,
	boss = true,
	rewardBoss = true,
	ignoreSpawnBlock = false,
	pushable = false,
	canPushItems = false,
	canPushCreatures = false,
	staticAttackChance = 90,
	targetDistance = 1,
	healthHidden = false,
	canWalkOnEnergy = false,
	canWalkOnFire = false,
	canWalkOnPoison = false,
}

monster.events = {
	"theRootkrakenFirstDeath",
}

monster.light = {
	level = 0,
	color = 0,
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{ text = "", yell = false },
}

monster.loot = {
	{ id = 3043, chance = 70000, maxCount = 3 }, -- crystal coin
	{ id = 3035, chance = 70000, maxCount = 100 }, -- platinum coin
	{ id = 32626, chance = 31111 }, -- amber
	{ id = 7643, chance = 29815, maxCount = 20 }, -- ultimate health potion
	{ id = 7642, chance = 29815, maxCount = 14 }, -- great spirit potion
	{ id = 238, chance = 22037, maxCount = 14 }, -- great mana potion
	{ id = 23375, chance = 22037, maxCount = 8 }, -- supreme health potion
	{ id = 23374, chance = 18148, maxCount = 15 }, -- ultimate spirit potion
	{ id = 237, chance = 18148, maxCount = 20 }, -- strong mana potion
	{ id = 3037, chance = 16852, maxCount = 2 }, -- yellow gem
	{ id = 32769, chance = 14259, maxCount = 2 }, -- white gem
	{ id = 47368, chance = 250 }, -- amber slayer
	{ id = 47369, chance = 250 }, -- amber greataxe
	{ id = 47370, chance = 250 }, -- amber bludgeon
	{ id = 47374, chance = 250 }, -- amber sabre
	{ id = 47375, chance = 250 }, -- amber axe
	{ id = 47376, chance = 250 }, -- amber cudgel
	{ id = 47377, chance = 250 }, -- amber crossbow
	{ id = 50239, chance = 250 }, -- amber kusarigama
	{ id = 32624, chance = 12963 }, -- amber with a bug
	{ id = 32625, chance = 12963 }, -- amber with a dragonfly
	{ id = 3041, chance = 12963, maxCount = 2 }, -- blue gem
	{ id = 32623, chance = 5185 }, -- giant topa
	{ id = 48516, chance = 3889 }, -- root tentacle
	{ id = 32622, chance = 3889 }, -- giant amethyst
	{ id = 30061, chance = 2593 }, -- giant sapphire
	{ id = 48517, chance = 1296 }, -- fish eye
	{ id = 30060, chance = 1296 }, -- giant emerald
	{ id = 50152, chance = 1120 }, -- collar of orange plasma
	{ id = 48514, chance = 1000 }, -- strange inedible fruit
	{ id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = -800, maxDamage = -1200 },
	{ name = "rootkraken cross beam", interval = 2000, chance = 25, minDamage = -800, maxDamage = -1800 },
	{ name = "rootkraken rootthing", interval = 2000, chance = 20, minDamage = -800, maxDamage = -1700 },
	{ name = "combat", interval = 2000, chance = 40, type = COMBAT_DEATHDAMAGE, minDamage = -450, maxDamage = -700, range = 6, shootEffect = CONST_ANI_DEATH, target = false },
}

monster.defenses = {
	defense = 85,
	armor = 85,
	mitigation = 2.00,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 15 },
	{ type = COMBAT_EARTHDAMAGE, percent = -10 },
	{ type = COMBAT_FIREDAMAGE, percent = -15 },
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
	{ type = "drunk", condition = true },
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
