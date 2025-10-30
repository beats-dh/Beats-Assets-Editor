local mType = Game.createMonsterType("Moohtant Wallbreaker")
local monster = {}

monster.description = "Moohtant Wallbreaker"
monster.experience = 0
monster.outfit = {
    lookType = 607,
    lookHead = 0,
    lookBody = 0,
    lookLegs = 0,
    lookFeet = 0,
    lookAddons = 0,
    lookMount = 0,
}

monster.health = 120000
monster.maxHealth = 120000
monster.race = "blood"
monster.corpse = 0
monster.speed = 20
monster.manaCost = 0

monster.changeTarget = {
    interval = 5000,
    chance = 0,
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
    rewardBoss = false,
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

monster.voices = {
    interval = 5000,
    chance = 10,
    { text = "RAAAWWWGH!", yell = true },
    { text = "RRRAAAARRRGH!", yell = true },
    { text = "GNAAARRRR!", yell = true },
}

monster.loot = {
    { name = "gold coin", chance = 50000, maxCount = 76 },
    { name = "platinum coin", chance = 30000, maxCount = 30 },
    { name = "great health potion", chance = 20000, maxCount = 13 },
    { name = "great mana potion", chance = 20000, maxCount = 13 },
    { name = "meat", chance = 15000, maxCount = 9 },
    { name = "moohtant horn", chance = 5000, maxCount = 2 },
    { name = "small diamond", chance = 5000, maxCount = 5 },
    { name = "small ruby", chance = 2000 },
    { name = "giant pacifier", chance = 100 },
    { name = "gold ingot", chance = 500 },
    { name = "minotaur horn", chance = 2000 },
    { name = "moohtant cudgel", chance = 300 },
    { name = "mooh'tah shell", chance = 500 },
	{ id = 3098, chance = 2000 }, -- ring of healing
    { name = "roll of covering", chance = 2000 },
    { id = 60080, chance = 25000 }, -- boss token
}

monster.attacks = {
    { name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -340 },
    { name = "combat", interval = 2000, chance = 15, type = COMBAT_PHYSICALDAMAGE, minDamage = -300, maxDamage = -300, length = 8, spread = 3, effect = CONST_ME_HITAREA, target = false },
    { name = "combat", interval = 4000, chance = 15, type = COMBAT_PHYSICALDAMAGE, minDamage = -300, maxDamage = -300, radius = 1, effect = CONST_ME_HITAREA, target = false },
    { name = "combat", interval = 4000, chance = 10, type = COMBAT_PHYSICALDAMAGE, minDamage = -200, maxDamage = -200, length = 8, effect = CONST_ME_HITAREA, target = true },
}

monster.defenses = {
    defense = 60,
    armor = 60,
}

monster.elements = {
    { type = COMBAT_PHYSICALDAMAGE, percent = 90 },
    { type = COMBAT_ENERGYDAMAGE, percent = 85 },
    { type = COMBAT_EARTHDAMAGE, percent = 85 },
    { type = COMBAT_FIREDAMAGE, percent = 85 },
    { type = COMBAT_LIFEDRAIN, percent = 100 },
    { type = COMBAT_MANADRAIN, percent = 100 },
    { type = COMBAT_DROWNDAMAGE, percent = 100 },
    { type = COMBAT_ICEDAMAGE, percent = 90 },
    { type = COMBAT_HOLYDAMAGE, percent = 90 },
    { type = COMBAT_DEATHDAMAGE, percent = 90 },
}

monster.immunities = {
    { type = "paralyze", condition = true },
    { type = "outfit", condition = false },
    { type = "invisible", condition = true },
    { type = "bleed", condition = false },
}

mType:register(monster)

