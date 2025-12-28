<script lang="ts">
  import AppHeader from "./AppHeader.svelte";
  import CategoryNav from "./CategoryNav.svelte";
  import CategoryView from "./CategoryView.svelte";
  import { appState } from "../stores/app.svelte";

  // Derived state
  let currentView = $derived(appState.currentView);
  let currentCategory = $derived(appState.currentCategory);

  // Category view state (hoisted for header display only)
  let categoryDisplayName = $state("");
  let categoryCount = $state(0);
  let currentPage = $state(0);
  let totalPages = $state(0);
  let searchQuery = $state("");
  let pageSize = $state(100);

  // Page request counter - increments when header requests page change
  let pageRequestId = $state(0);
  let requestedPage = $state(0);

  // Page size request - increments when header changes page size
  let pageSizeRequestId = $state(0);

  // Store pagination per category (plain object, not reactive)
  const categoryPages: Record<string, number> = {};

  // Get saved page for a category
  function getSavedPage(category: string): number {
    return categoryPages[category] ?? 0;
  }

  // Callbacks from CategoryView - these update header display
  function handleCategoryInfo(info: { name: string; count: number; page: number; pages: number }) {
    categoryDisplayName = info.name;
    categoryCount = info.count;
    currentPage = info.page;
    totalPages = info.pages;
    
    // Save the page for this category
    if (currentCategory) {
      categoryPages[currentCategory] = info.page;
    }
  }

  // Called from header when user clicks pagination
  function handlePageChange(page: number) {
    currentPage = page;
    requestedPage = page;
    pageRequestId++; // Trigger reactivity
    
    // Save when page changes
    if (currentCategory) {
      categoryPages[currentCategory] = page;
    }
  }

  // Called from header when user changes page size
  function handlePageSizeChange(size: number) {
    pageSize = size;
    pageSizeRequestId++;
    // Reset to page 0 when changing page size
    currentPage = 0;
    requestedPage = 0;
    pageRequestId++;
    if (currentCategory) {
      categoryPages[currentCategory] = 0;
    }
  }

  function handleSearch(query: string) {
    searchQuery = query;
  }

  // Go back to launcher
  function goToLauncher() {
    appState.reset();
  }

  // Reset state when going back to home
  $effect(() => {
    if (currentView === "home") {
      searchQuery = "";
      pageRequestId = 0;
      pageSizeRequestId = 0;
    }
  });
</script>

<!-- Main Application View - Using original CSS classes -->
<div class="main-app" style="display: block;">
  <AppHeader 
    onhome={goToLauncher}
    categoryName={currentView === "category" ? categoryDisplayName : undefined}
    categoryCount={categoryCount}
    currentPage={currentPage}
    totalPages={totalPages}
    pageSize={pageSize}
    onPageChange={handlePageChange}
    onPageSizeChange={handlePageSizeChange}
    onSearch={handleSearch}
  />

  {#if currentView === "home"}
    <CategoryNav />
  {:else if currentView === "category" && currentCategory}
    {#key currentCategory}
      <CategoryView 
        category={currentCategory} 
        initialPage={getSavedPage(currentCategory)}
        requestedPage={requestedPage}
        pageRequestId={pageRequestId}
        pageSize={pageSize}
        pageSizeRequestId={pageSizeRequestId}
        onInfoChange={handleCategoryInfo}
        onPageChange={handlePageChange}
        searchQuery={searchQuery}
      />
    {/key}
  {/if}
</div>
