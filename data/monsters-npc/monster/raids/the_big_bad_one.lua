local mType = Game.createMonsterType("The Big Bad One")
local monster = {}

monster.description = "The Big Bad One"
monster.experience = 170
monster.outfit = {
    lookType = 3,
    lookHead = 0,
    lookBody = 0,
    lookLegs = 0,
    lookFeet = 0,
    lookAddons = 0,
    lookMount = 0,
}

monster.bosstiary = {
    bossRaceId = 423,
    bossRace = RARITY_NEMESIS,
}

monster.health = 300
monster.maxHealth = 300
monster.race = "blood"
monster.corpse = 6009
monster.speed = 132
monster.manaCost = 0

monster.changeTarget = {
    interval = 5000,
    chance = 8,
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
    staticAttackChance = 90,
    targetDistance = 1,
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

monster.summon = {
    maxSummons = 2,
    summons = {
        { name = "Wolf", chance = 20, interval = 2000, count = 2 },
    },
}

monster.voices = {
    interval = 5000,
    chance = 10,
    { text = "AWOOO!", yell = false },
}

monster.loot = {
    { name = "ham", chance = 50000, maxCount = 2 },
    { name = "wolf paw", chance = 1000, maxCount = 2 },
    { name = "meat", chance = 20000 },
	{ id = 7394, chance = 2000 }, -- wolf trophy
    { id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
    { name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -100 },
}

monster.defenses = {
    defense = 10,
    armor = 15,
    { name = "combat", interval = 4000, chance = 15, type = COMBAT_HEALING, minDamage = 0, maxDamage = 30, effect = CONST_ME_MAGIC_BLUE, target = false },
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

