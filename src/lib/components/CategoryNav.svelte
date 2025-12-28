<script lang="ts">
  import { appState } from "../stores/app.svelte";

  // Derived state
  let stats = $derived(appState.stats);

  // Categories - using actual_* which are the real counts from backend
  const categories = [
    { id: "Objects", icon: "📦", label: "Objects", countKey: "actual_objects" },
    { id: "Outfits", icon: "👕", label: "Outfits", countKey: "actual_outfits" },
    { id: "Effects", icon: "✨", label: "Effects", countKey: "actual_effects" },
    { id: "Missiles", icon: "🏹", label: "Missiles", countKey: "actual_missiles" },
    { id: "Sounds", icon: "🔊", label: "Sounds", countKey: "sounds" },
  ] as const;

  // Subcategories
  const subcategories = [
    { id: "Armors", icon: "🛡️", label: "Armors" },
    { id: "Amulets", icon: "📿", label: "Amulets" },
    { id: "Boots", icon: "👢", label: "Boots" },
    { id: "Containers", icon: "🎒", label: "Containers" },
    { id: "Decoration", icon: "🎨", label: "Decoration" },
    { id: "Food", icon: "🍖", label: "Food" },
    { id: "HelmetsHats", icon: "⛑️", label: "Helmets & Hats" },
    { id: "Legs", icon: "👖", label: "Legs" },
    { id: "Potions", icon: "🧪", label: "Potions" },
    { id: "Rings", icon: "💍", label: "Rings" },
    { id: "Runes", icon: "🔮", label: "Runes" },
    { id: "Shields", icon: "🛡️", label: "Shields" },
    { id: "Tools", icon: "🔧", label: "Tools" },
    { id: "Valuables", icon: "💎", label: "Valuables" },
    { id: "Axes", icon: "🪓", label: "Axes" },
    { id: "Clubs", icon: "🏏", label: "Clubs" },
    { id: "DistanceWeapons", icon: "🏹", label: "Distance" },
    { id: "Swords", icon: "⚔️", label: "Swords" },
    { id: "WandsRods", icon: "🪄", label: "Wands & Rods" },
  ];

  function getCount(key: string): number {
    if (!stats) return 0;
    return (stats as Record<string, number>)[key] ?? 0;
  }

  function selectCategory(id: string) {
    appState.setCurrentCategory(id);
    appState.setCurrentView("category");
  }
</script>

<!-- Category Navigation - Using original CSS classes -->
<nav class="category-nav">
  <div class="nav-container">
    <!-- Main Categories -->
    <div class="category-cards">
      {#each categories as cat}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
          class="category-card"
          data-category={cat.id}
          onclick={() => selectCategory(cat.id)}
        >
          <div class="card-icon">{cat.icon}</div>
          <div class="card-content">
            <h3>{cat.label}</h3>
            <p id="{cat.id.toLowerCase()}-count">
              {getCount(cat.countKey).toLocaleString()} items
            </p>
          </div>
          <div class="card-arrow">→</div>
        </div>
      {/each}
    </div>

    <!-- Subcategories Section -->
    <div class="subcategories-section">
      <h3 class="subcategories-title">Object Subcategories</h3>
      <div class="subcategories-grid">
        {#each subcategories as subcat}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div
            class="subcategory-card"
            data-category="Objects"
            data-subcategory={subcat.id}
            onclick={() => selectCategory(`Objects:${subcat.id}`)}
          >
            <span class="subcat-icon">{subcat.icon}</span>
            <span class="subcat-name">{subcat.label}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>
</nav>
