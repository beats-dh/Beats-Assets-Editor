<script lang="ts">
  import {
    assetsState,
    setCategory,
    selectStaticDataMode,
    selectRccMode,
    selectQmMode,
    selectProficiencyMode,
  } from "../../stores/assetsState.svelte";
  import { translate } from "../../i18n";
  import { bindHandler } from "../../utils/handlerFactories";

  function selectCategory(cat: string, sub: string = "All") {
    setCategory(cat);
    assetsState.currentSubcategory = sub;
    assetsState.viewMode = "grid";
  }

  // Handler factories via closure — partial application evita recriar arrows a cada render
  const selectObjects = bindHandler(selectCategory, "Objects");
  const selectOutfits = bindHandler(selectCategory, "Outfits");
  const selectEffects = bindHandler(selectCategory, "Effects");
  const selectMissiles = bindHandler(selectCategory, "Missiles");
  const selectSounds = bindHandler(selectCategory, "Sounds");

  const selectSubArmors = bindHandler(selectCategory, "Objects", "Armors");
  const selectSubAmulets = bindHandler(selectCategory, "Objects", "Amulets");
  const selectSubBoots = bindHandler(selectCategory, "Objects", "Boots");
  const selectSubContainers = bindHandler(selectCategory, "Objects", "Containers");
  const selectSubDecoration = bindHandler(selectCategory, "Objects", "Decoration");
  const selectSubFood = bindHandler(selectCategory, "Objects", "Food");
  const selectSubHelmets = bindHandler(selectCategory, "Objects", "HelmetsHats");
  const selectSubLegs = bindHandler(selectCategory, "Objects", "Legs");
  const selectSubPotions = bindHandler(selectCategory, "Objects", "Potions");
  const selectSubRings = bindHandler(selectCategory, "Objects", "Rings");
  const selectSubRunes = bindHandler(selectCategory, "Objects", "Runes");
  const selectSubShields = bindHandler(selectCategory, "Objects", "Shields");
  const selectSubTools = bindHandler(selectCategory, "Objects", "Tools");
  const selectSubValuables = bindHandler(selectCategory, "Objects", "Valuables");
  const selectSubAxes = bindHandler(selectCategory, "Objects", "Axes");
  const selectSubClubs = bindHandler(selectCategory, "Objects", "Clubs");
  const selectSubDistance = bindHandler(selectCategory, "Objects", "DistanceWeapons");
  const selectSubSwords = bindHandler(selectCategory, "Objects", "Swords");
  const selectSubWands = bindHandler(selectCategory, "Objects", "WandsRods");

  const selectCreatures = bindHandler(selectStaticDataMode, "creatures");
  const selectBosses = bindHandler(selectStaticDataMode, "bosses");
  const selectQuests = bindHandler(selectStaticDataMode, "quests");
  const selectTitles = bindHandler(selectStaticDataMode, "titles");
  const selectHouses = bindHandler(selectStaticDataMode, "houses");
  const selectMapHouses = bindHandler(selectStaticDataMode, "map_houses");
</script>

<nav class="category-nav">
  <div class="nav-container">
    <!-- Main Categories -->
    <div class="category-cards">
      <!-- Objects -->
      <button class="category-card" onclick={selectObjects}>
        <div class="card-icon">📦</div>
        <div class="card-content">
          <h3>{translate("category.objects")}</h3>
          <p>
            {translate("category.itemsCount", {
              count: assetsState.currentStats?.object_count || 0,
            })}
          </p>
        </div>
        <div class="card-arrow">→</div>
      </button>

      <!-- Outfits -->
      <button class="category-card" onclick={selectOutfits}>
        <div class="card-icon">👕</div>
        <div class="card-content">
          <h3>{translate("category.outfits")}</h3>
          <p>
            {translate("category.itemsCount", {
              count: assetsState.currentStats?.outfit_count || 0,
            })}
          </p>
        </div>
        <div class="card-arrow">→</div>
      </button>

      <!-- Effects -->
      <button class="category-card" onclick={selectEffects}>
        <div class="card-icon">✨</div>
        <div class="card-content">
          <h3>{translate("category.effects")}</h3>
          <p>
            {translate("category.itemsCount", {
              count: assetsState.currentStats?.effect_count || 0,
            })}
          </p>
        </div>
        <div class="card-arrow">→</div>
      </button>

      <!-- Missiles -->
      <button class="category-card" onclick={selectMissiles}>
        <div class="card-icon">🏹</div>
        <div class="card-content">
          <h3>{translate("category.missiles")}</h3>
          <p>
            {translate("category.itemsCount", {
              count: assetsState.currentStats?.missile_count || 0,
            })}
          </p>
        </div>
        <div class="card-arrow">→</div>
      </button>

      <!-- Sounds -->
      <button class="category-card" onclick={selectSounds}>
        <div class="card-icon">🔊</div>
        <div class="card-content">
          <h3>{translate("category.sounds")}</h3>
          <p>{translate("category.itemsCount", { count: "" }).trim()}</p>
        </div>
        <div class="card-arrow">→</div>
      </button>

      <!-- Proficiency Editor -->
      <button class="category-card" onclick={selectProficiencyMode}>
        <div class="card-icon">⚔️</div>
        <div class="card-content">
          <h3>Proficiency</h3>
        </div>
        <div class="card-arrow">→</div>
      </button>
    </div>

    <!-- Subcategories Section -->
    <div class="subcategories-section">
      <h3 class="subcategories-title">{translate("subcategories.title")}</h3>
      <div class="subcategories-grid">
        <button
          class="subcategory-card"
          onclick={selectSubArmors}
        >
          <span class="subcat-icon">🛡️</span>
          <span class="subcat-name">{translate("subcategory.armors")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={selectSubAmulets}
        >
          <span class="subcat-icon">📿</span>
          <span class="subcat-name">{translate("subcategory.amulets")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={selectSubBoots}
        >
          <span class="subcat-icon">👢</span>
          <span class="subcat-name">{translate("subcategory.boots")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={selectSubContainers}
        >
          <span class="subcat-icon">🎒</span>
          <span class="subcat-name">{translate("subcategory.containers")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={selectSubDecoration}
        >
          <span class="subcat-icon">🎨</span>
          <span class="subcat-name">{translate("subcategory.decoration")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={selectSubFood}
        >
          <span class="subcat-icon">🍖</span>
          <span class="subcat-name">{translate("subcategory.food")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={selectSubHelmets}
        >
          <span class="subcat-icon">⛑️</span>
          <span class="subcat-name">{translate("subcategory.helmetsHats")}</span
          >
        </button>
        <button
          class="subcategory-card"
          onclick={selectSubLegs}
        >
          <span class="subcat-icon">👖</span>
          <span class="subcat-name">{translate("subcategory.legs")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={selectSubPotions}
        >
          <span class="subcat-icon">🧪</span>
          <span class="subcat-name">{translate("subcategory.potions")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={selectSubRings}
        >
          <span class="subcat-icon">💍</span>
          <span class="subcat-name">{translate("subcategory.rings")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={selectSubRunes}
        >
          <span class="subcat-icon">🔮</span>
          <span class="subcat-name">{translate("subcategory.runes")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={selectSubShields}
        >
          <span class="subcat-icon">🛡️</span>
          <span class="subcat-name">{translate("subcategory.shields")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={selectSubTools}
        >
          <span class="subcat-icon">🔧</span>
          <span class="subcat-name">{translate("subcategory.tools")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={selectSubValuables}
        >
          <span class="subcat-icon">💎</span>
          <span class="subcat-name">{translate("subcategory.valuables")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={selectSubAxes}
        >
          <span class="subcat-icon">🪓</span>
          <span class="subcat-name">{translate("subcategory.axes")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={selectSubClubs}
        >
          <span class="subcat-icon">🏏</span>
          <span class="subcat-name">{translate("subcategory.clubs")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={selectSubDistance}
        >
          <span class="subcat-icon">🏹</span>
          <span class="subcat-name">{translate("subcategory.distance")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={selectSubSwords}
        >
          <span class="subcat-icon">⚔️</span>
          <span class="subcat-name">{translate("subcategory.swords")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={selectSubWands}
        >
          <span class="subcat-icon">🪄</span>
          <span class="subcat-name">{translate("subcategory.wandsRods")}</span>
        </button>
      </div>
    </div>

    <!-- World Data Section -->
    {#if assetsState.staticDataStats || assetsState.staticMapDataStats}
      <div class="subcategories-section" style="margin-top: 2rem;">
        <h3 class="subcategories-title">{translate("category.worldData")}</h3>
        <div
          class="world-stats-grid"
          style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;"
        >
          {#if assetsState.staticDataStats}
            <button
              type="button"
              class="subcategory-card"
              onclick={selectCreatures}
            >
              <span class="subcat-icon">🐉</span>
              <span class="subcat-name"
                >{translate("category.creaturesCount", {
                  count: assetsState.staticDataStats.total_creatures,
                })}</span
              >
            </button>
            <button
              type="button"
              class="subcategory-card"
              onclick={selectBosses}
            >
              <span class="subcat-icon">👑</span>
              <span class="subcat-name"
                >{translate("category.bossesCount", {
                  count: assetsState.staticDataStats.total_bosses,
                })}</span
              >
            </button>
            <button
              type="button"
              class="subcategory-card"
              onclick={selectQuests}
            >
              <span class="subcat-icon">📜</span>
              <span class="subcat-name"
                >{translate("category.questsCount", {
                  count: assetsState.staticDataStats.total_quests,
                })}</span
              >
            </button>
            <button
              type="button"
              class="subcategory-card"
              onclick={selectTitles}
            >
              <span class="subcat-icon">🏅</span>
              <span class="subcat-name"
                >{translate("category.titlesCount", {
                  count: assetsState.staticDataStats.total_titles,
                })}</span
              >
            </button>
            <button
              type="button"
              class="subcategory-card"
              onclick={selectHouses}
            >
              <span class="subcat-icon">🏘️</span>
              <span class="subcat-name"
                >{translate("category.housesCount", {
                  count: assetsState.staticDataStats.total_houses,
                })}</span
              >
            </button>
          {/if}
          {#if assetsState.staticMapDataStats}
            <button
              type="button"
              class="subcategory-card"
              onclick={selectMapHouses}
            >
              <span class="subcat-icon">🗺️</span>
              <span class="subcat-name"
                >{translate("category.mapHousesCount", {
                  count: assetsState.staticMapDataStats.total_houses_details,
                })}</span
              >
            </button>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Tools Section -->
    <div class="subcategories-section" style="margin-top: 2rem;">
      <h3 class="subcategories-title">{translate("category.tools")}</h3>
      <div
        class="world-stats-grid"
        style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;"
      >
        <button
          type="button"
          class="subcategory-card"
          onclick={selectRccMode}
        >
          <span class="subcat-icon">🗂️</span>
          <span class="subcat-name">{translate("category.rccEditor")}</span>
        </button>
        <button
          type="button"
          class="subcategory-card"
          onclick={selectQmMode}
        >
          <span class="subcat-icon">🌐</span>
          <span class="subcat-name">{translate("category.qmEditor")}</span>
        </button>
      </div>
    </div>
  </div>
</nav>
