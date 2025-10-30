local mType = Game.createMonsterType("Bane Lord")
local monster = {}

monster.description = "Bane Lord"
monster.experience = 500
monster.outfit = {
    lookType = 310,
    lookHead = 0,
    lookBody = 0,
    lookLegs = 0,
    lookFeet = 0,
    lookAddons = 0,
    lookMount = 0,
}

monster.bosstiary = {
    bossRaceId = 768,
    bossRace = RARITY_NEMESIS,
}

monster.health = 3000
monster.maxHealth = 3000
monster.race = "venom"
monster.corpse = 8953
monster.speed = 115
monster.manaCost = 0

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
    illusionable = false,
    canPushItems = true,
    canPushCreatures = true,
    staticAttackChance = 90,
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

monster.loot = {
    { name = "dry piece of wood", chance = 100000, maxCount = 3 },
	{ id = 398, chance = 10000 }, -- wodden trash
    { name = "bag of apple slices", chance = 20000 },
    { name = "bamboo leaves", chance = 20000 },
    { name = "golden fir cone", chance = 5000 },
    { name = "slug drug", chance = 5000 },
    { name = "sugar oat", chance = 100000 },
    { id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
    { name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -150 },
    { name = "combat", interval = 4000, chance = 20, type = COMBAT_EARTHDAMAGE, minDamage = -50, maxDamage = -120, radius = 3, effect = CONST_ME_POISONAREA, target = true },
}

monster.defenses = {
    defense = 35,
    armor = 35,
    { name = "combat", interval = 4000, chance = 15, type = COMBAT_HEALING, minDamage = 22, maxDamage = 294, effect = CONST_ME_MAGIC_BLUE, target = false },
}

monster.elements = {
    { type = COMBAT_PHYSICALDAMAGE, percent = -10 },
    { type = COMBAT_ENERGYDAMAGE, percent = 90 },
    { type = COMBAT_EARTHDAMAGE, percent = 90 },
    { type = COMBAT_FIREDAMAGE, percent = 90 },
    { type = COMBAT_LIFEDRAIN, percent = 100 },
    { type = COMBAT_MANADRAIN, percent = 100 },
    { type = COMBAT_DROWNDAMAGE, percent = 100 },
    { type = COMBAT_ICEDAMAGE, percent = 90 },
    { type = COMBAT_HOLYDAMAGE, percent = 90 },
    { type = COMBAT_DEATHDAMAGE, percent = 90 },
}

monster.immunities = {
    { type = "paralyze", condition = false },
    { type = "outfit", condition = false },
    { type = "invisible", condition = true },
    { type = "bleed", condition = false },
}

mType:register(monster)

