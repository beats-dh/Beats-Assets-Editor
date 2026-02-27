<script lang="ts">
  import { assetsState } from "../../stores/assetsState.svelte";
  import Header from "../components/Header.svelte";
  import CategoryNav from "../components/CategoryNav.svelte";
  import CategoryView from "../components/CategoryView.svelte";
  import StaticDataBrowser from "../components/StaticDataBrowser.svelte";
  import RccBrowser from "../components/RccBrowser.svelte";
  import AssetDetailsModal from "../components/AssetDetailsModal.svelte";
  import ConfirmModal from "../components/ConfirmModal.svelte";
  import ImportStartIdModal from "../components/ImportStartIdModal.svelte";
  import SpriteLibraryDrawer from "../components/SpriteLibraryDrawer.svelte";
</script>

{#if assetsState.viewMode === "categories"}
  <Header />
  <CategoryNav />
{:else if assetsState.viewMode === "grid"}
  <CategoryView />
{:else if assetsState.viewMode === "staticdata"}
  <StaticDataBrowser />
{:else if assetsState.viewMode === "rcc"}
  <RccBrowser />
{/if}

<AssetDetailsModal />
<ConfirmModal />
<ImportStartIdModal />
<SpriteLibraryDrawer />
