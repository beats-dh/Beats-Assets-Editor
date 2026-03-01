<script lang="ts">
  import {
    assetsState,
    setCategory,
    selectStaticDataMode,
    selectRccMode,
    selectQmMode,
  } from "../../stores/assetsState.svelte";
  import { translate } from "../../i18n";

  function selectCategory(cat: string, sub: string = "All") {
    setCategory(cat);
    assetsState.currentSubcategory = sub;
    assetsState.viewMode = "grid";
  }
</script>

<nav class="category-nav">
  <div class="nav-container">
    <!-- Main Categories -->
    <div class="category-cards">
      <!-- Objects -->
      <button class="category-card" onclick={() => selectCategory("Objects")}>
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
      <button class="category-card" onclick={() => selectCategory("Outfits")}>
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
      <button class="category-card" onclick={() => selectCategory("Effects")}>
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
      <button class="category-card" onclick={() => selectCategory("Missiles")}>
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
      <button class="category-card" onclick={() => selectCategory("Sounds")}>
        <div class="card-icon">🔊</div>
        <div class="card-content">
          <h3>{translate("category.sounds")}</h3>
          <p>{translate("category.itemsCount", { count: "" }).trim()}</p>
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
          onclick={() => selectCategory("Objects", "Armors")}
        >
          <span class="subcat-icon">🛡️</span>
          <span class="subcat-name">{translate("subcategory.armors")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={() => selectCategory("Objects", "Amulets")}
        >
          <span class="subcat-icon">📿</span>
          <span class="subcat-name">{translate("subcategory.amulets")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={() => selectCategory("Objects", "Boots")}
        >
          <span class="subcat-icon">👢</span>
          <span class="subcat-name">{translate("subcategory.boots")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={() => selectCategory("Objects", "Containers")}
        >
          <span class="subcat-icon">🎒</span>
          <span class="subcat-name">{translate("subcategory.containers")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={() => selectCategory("Objects", "Decoration")}
        >
          <span class="subcat-icon">🎨</span>
          <span class="subcat-name">{translate("subcategory.decoration")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={() => selectCategory("Objects", "Food")}
        >
          <span class="subcat-icon">🍖</span>
          <span class="subcat-name">{translate("subcategory.food")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={() => selectCategory("Objects", "HelmetsHats")}
        >
          <span class="subcat-icon">⛑️</span>
          <span class="subcat-name">{translate("subcategory.helmetsHats")}</span
          >
        </button>
        <button
          class="subcategory-card"
          onclick={() => selectCategory("Objects", "Legs")}
        >
          <span class="subcat-icon">👖</span>
          <span class="subcat-name">{translate("subcategory.legs")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={() => selectCategory("Objects", "Potions")}
        >
          <span class="subcat-icon">🧪</span>
          <span class="subcat-name">{translate("subcategory.potions")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={() => selectCategory("Objects", "Rings")}
        >
          <span class="subcat-icon">💍</span>
          <span class="subcat-name">{translate("subcategory.rings")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={() => selectCategory("Objects", "Runes")}
        >
          <span class="subcat-icon">🔮</span>
          <span class="subcat-name">{translate("subcategory.runes")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={() => selectCategory("Objects", "Shields")}
        >
          <span class="subcat-icon">🛡️</span>
          <span class="subcat-name">{translate("subcategory.shields")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={() => selectCategory("Objects", "Tools")}
        >
          <span class="subcat-icon">🔧</span>
          <span class="subcat-name">{translate("subcategory.tools")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={() => selectCategory("Objects", "Valuables")}
        >
          <span class="subcat-icon">💎</span>
          <span class="subcat-name">{translate("subcategory.valuables")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={() => selectCategory("Objects", "Axes")}
        >
          <span class="subcat-icon">🪓</span>
          <span class="subcat-name">{translate("subcategory.axes")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={() => selectCategory("Objects", "Clubs")}
        >
          <span class="subcat-icon">🏏</span>
          <span class="subcat-name">{translate("subcategory.clubs")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={() => selectCategory("Objects", "DistanceWeapons")}
        >
          <span class="subcat-icon">🏹</span>
          <span class="subcat-name">{translate("subcategory.distance")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={() => selectCategory("Objects", "Swords")}
        >
          <span class="subcat-icon">⚔️</span>
          <span class="subcat-name">{translate("subcategory.swords")}</span>
        </button>
        <button
          class="subcategory-card"
          onclick={() => selectCategory("Objects", "WandsRods")}
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
              onclick={() => selectStaticDataMode("creatures")}
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
              onclick={() => selectStaticDataMode("bosses")}
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
              onclick={() => selectStaticDataMode("quests")}
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
              onclick={() => selectStaticDataMode("titles")}
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
              onclick={() => selectStaticDataMode("houses")}
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
              onclick={() => selectStaticDataMode("map_houses")}
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
          onclick={() => selectRccMode()}
        >
          <span class="subcat-icon">🗂️</span>
          <span class="subcat-name">{translate("category.rccEditor")}</span>
        </button>
        <button
          type="button"
          class="subcategory-card"
          onclick={() => selectQmMode()}
        >
          <span class="subcat-icon">🌐</span>
          <span class="subcat-name">{translate("category.qmEditor")}</span>
        </button>
      </div>
    </div>
  </div>
</nav>
