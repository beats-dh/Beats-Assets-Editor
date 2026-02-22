<script lang="ts">
  import Header from './Header.svelte';
  import CategoryNav from './CategoryNav.svelte';
  import CategoryView from './CategoryView.svelte';
  import AssetDetailsModal from './modals/AssetDetailsModal.svelte';
  import SpriteLibraryDrawer from './drawers/SpriteLibraryDrawer.svelte';
  import ConfirmModal from './ConfirmModal.svelte';
  import AddSoundModal from './AddSoundModal.svelte';
  
  import { viewMode } from '../stores/assetsStore';
</script>

<div id="main-app" class="main-app" style="display: block;">
  {#if $viewMode === 'categories'}
    <Header />
    <CategoryNav />
  {:else}
    <CategoryView />
  {/if}

  <AssetDetailsModal />
  <SpriteLibraryDrawer />
  <ConfirmModal />
  <AddSoundModal />
</div>
