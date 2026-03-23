import { computed, ref, unref } from 'vue';
import { useRouter } from 'vue-router';

export function useWorkspacePage(options) {
  const {
    defaultTab,
    storageKey,
    tabs,
    initialTab
  } = options;

  const router = useRouter();
  const activeTab = ref(defaultTab);
  const tabKeys = tabs.map(tab => tab.key);

  const resolveTab = (candidate) => {
    if (typeof candidate !== 'string') {
      return defaultTab;
    }

    return tabKeys.includes(candidate) ? candidate : defaultTab;
  };

  const persistTab = (tabKey) => {
    if (storageKey) {
      localStorage.setItem(storageKey, tabKey);
    }
  };

  const switchTab = (tabKey) => {
    const nextTab = resolveTab(tabKey);
    activeTab.value = nextTab;
    persistTab(nextTab);
  };

  const restoreTab = () => {
    const queryTab = unref(initialTab);
    const savedTab = storageKey ? localStorage.getItem(storageKey) : null;
    const nextTab = resolveTab(queryTab || savedTab);

    activeTab.value = nextTab;
    persistTab(nextTab);
  };

  const handleBackToHome = async () => {
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }

    try {
      await router.replace('/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('返回首页失败:', error);
      window.location.href = '/';
    }
  };

  const activeTabMeta = computed(() => {
    return tabs.find(tab => tab.key === activeTab.value) || tabs[0];
  });

  return {
    activeTab,
    activeTabMeta,
    switchTab,
    restoreTab,
    handleBackToHome
  };
}
