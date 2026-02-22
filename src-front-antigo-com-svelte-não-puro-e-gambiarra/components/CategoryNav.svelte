<script lang="ts">
  import { currentCategory, currentSubcategory, viewMode, currentStats } from '../stores/assetsStore';
  import { translate } from '../i18n';

  function selectCategory(cat: string, sub: string = 'All') {
    // Reset state before switching view
    currentCategory.set(cat);
    currentSubcategory.set(sub);
    viewMode.set('grid');
    
    // Cache clearing is handled by assetService/store reactivity if needed
  }
</script>

<nav class="category-nav">
  <div class="nav-container">
    <!-- Main Categories -->
    <div class="category-cards">
      <!-- Objects -->
      <button class="category-card" on:click={() => selectCategory('Objects')}>
        <div class="card-icon">📦</div>
        <div class="card-content">
          <h3>{translate('category.objects')}</h3>
          <p>{$currentStats?.object_count || 0} items</p>
        </div>
        <div class="card-arrow">→</div>
      </button>

      <!-- Outfits -->
      <button class="category-card" on:click={() => selectCategory('Outfits')}>
        <div class="card-icon">👕</div>
        <div class="card-content">
          <h3>{translate('category.outfits')}</h3>
          <p>{$currentStats?.outfit_count || 0} items</p>
        </div>
        <div class="card-arrow">→</div>
      </button>

      <!-- Effects -->
      <button class="category-card" on:click={() => selectCategory('Effects')}>
        <div class="card-icon">✨</div>
        <div class="card-content">
          <h3>{translate('category.effects')}</h3>
          <p>{$currentStats?.effect_count || 0} items</p>
        </div>
        <div class="card-arrow">→</div>
      </button>

      <!-- Missiles -->
      <button class="category-card" on:click={() => selectCategory('Missiles')}>
        <div class="card-icon">🏹</div>
        <div class="card-content">
          <h3>{translate('category.missiles')}</h3>
          <p>{$currentStats?.missile_count || 0} items</p>
        </div>
        <div class="card-arrow">→</div>
      </button>

      <!-- Sounds -->
      <button class="category-card" on:click={() => selectCategory('Sounds')}>
        <div class="card-icon">🔊</div>
        <div class="card-content">
          <h3>{translate('category.sounds')}</h3>
          <!-- Sounds count is usually loaded dynamically, using object count as placeholder or 0 -->
          <p>items</p> 
        </div>
        <div class="card-arrow">→</div>
      </button>
    </div>

    <!-- Subcategories Section -->
    <div class="subcategories-section">
      <h3 class="subcategories-title">{translate('subcategories.title')}</h3>
      <div class="subcategories-grid">
        <button class="subcategory-card" on:click={() => selectCategory('Objects', 'Armors')}>
          <span class="subcat-icon">🛡️</span>
          <span class="subcat-name">{translate('subcategory.armors')}</span>
        </button>
        <button class="subcategory-card" on:click={() => selectCategory('Objects', 'Amulets')}>
          <span class="subcat-icon">📿</span>
          <span class="subcat-name">{translate('subcategory.amulets')}</span>
        </button>
        <button class="subcategory-card" on:click={() => selectCategory('Objects', 'Boots')}>
          <span class="subcat-icon">👢</span>
          <span class="subcat-name">{translate('subcategory.boots')}</span>
        </button>
        <button class="subcategory-card" on:click={() => selectCategory('Objects', 'Containers')}>
          <span class="subcat-icon">🎒</span>
          <span class="subcat-name">{translate('subcategory.containers')}</span>
        </button>
        <button class="subcategory-card" on:click={() => selectCategory('Objects', 'Decoration')}>
          <span class="subcat-icon">🎨</span>
          <span class="subcat-name">{translate('subcategory.decoration')}</span>
        </button>
        <button class="subcategory-card" on:click={() => selectCategory('Objects', 'Food')}>
          <span class="subcat-icon">🍖</span>
          <span class="subcat-name">{translate('subcategory.food')}</span>
        </button>
        <button class="subcategory-card" on:click={() => selectCategory('Objects', 'HelmetsHats')}>
          <span class="subcat-icon">⛑️</span>
          <span class="subcat-name">{translate('subcategory.helmetsHats')}</span>
        </button>
        <button class="subcategory-card" on:click={() => selectCategory('Objects', 'Legs')}>
          <span class="subcat-icon">👖</span>
          <span class="subcat-name">{translate('subcategory.legs')}</span>
        </button>
        <button class="subcategory-card" on:click={() => selectCategory('Objects', 'Potions')}>
          <span class="subcat-icon">🧪</span>
          <span class="subcat-name">{translate('subcategory.potions')}</span>
        </button>
        <button class="subcategory-card" on:click={() => selectCategory('Objects', 'Rings')}>
          <span class="subcat-icon">💍</span>
          <span class="subcat-name">{translate('subcategory.rings')}</span>
        </button>
        <button class="subcategory-card" on:click={() => selectCategory('Objects', 'Runes')}>
          <span class="subcat-icon">🔮</span>
          <span class="subcat-name">{translate('subcategory.runes')}</span>
        </button>
        <button class="subcategory-card" on:click={() => selectCategory('Objects', 'Shields')}>
          <span class="subcat-icon">🛡️</span>
          <span class="subcat-name">{translate('subcategory.shields')}</span>
        </button>
        <button class="subcategory-card" on:click={() => selectCategory('Objects', 'Tools')}>
          <span class="subcat-icon">🔧</span>
          <span class="subcat-name">{translate('subcategory.tools')}</span>
        </button>
        <button class="subcategory-card" on:click={() => selectCategory('Objects', 'Valuables')}>
          <span class="subcat-icon">💎</span>
          <span class="subcat-name">{translate('subcategory.valuables')}</span>
        </button>
        <button class="subcategory-card" on:click={() => selectCategory('Objects', 'Axes')}>
          <span class="subcat-icon">🪓</span>
          <span class="subcat-name">{translate('subcategory.axes')}</span>
        </button>
        <button class="subcategory-card" on:click={() => selectCategory('Objects', 'Clubs')}>
          <span class="subcat-icon">🏏</span>
          <span class="subcat-name">{translate('subcategory.clubs')}</span>
        </button>
        <button class="subcategory-card" on:click={() => selectCategory('Objects', 'DistanceWeapons')}>
          <span class="subcat-icon">🏹</span>
          <span class="subcat-name">{translate('subcategory.distance')}</span>
        </button>
        <button class="subcategory-card" on:click={() => selectCategory('Objects', 'Swords')}>
          <span class="subcat-icon">⚔️</span>
          <span class="subcat-name">{translate('subcategory.swords')}</span>
        </button>
        <button class="subcategory-card" on:click={() => selectCategory('Objects', 'WandsRods')}>
          <span class="subcat-icon">🪄</span>
          <span class="subcat-name">{translate('subcategory.wandsRods')}</span>
        </button>
      </div>
    </div>
  </div>
</nav>
