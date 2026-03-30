import { ref, reactive, computed } from 'vue';

/**
 * API调用状态管理 Composable
 * 提供统一的API调用状态管理和错误处理
 */
export function useApi(options = {}) {
  // 默认配置
  const defaultOptions = {
    immediate: false, // 是否立即执行
    resetOnExecute: true, // 执行时是否重置数据
    throwOnError: false, // 是否抛出错误
    ...options
  };

  // 状态管理
  const isLoading = ref(false);
  const isError = ref(false);
  const error = ref(null);
  const data = ref(null);

  // 计算属性
  const isReady = computed(() => !isLoading.value && !isError.value);
  const hasData = computed(() => data.value !== null && data.value !== undefined);

  // 执行API调用
  const execute = async (apiFunction, ...args) => {
    if (typeof apiFunction !== 'function') {
      throw new Error('API函数必须是一个函数');
    }

    try {
      isLoading.value = true;
      isError.value = false;
      error.value = null;

      if (defaultOptions.resetOnExecute) {
        data.value = null;
      }

      const result = await apiFunction(...args);

      data.value = result;

      return result;
    } catch (err) {
      console.error('API调用失败:', err);
      isError.value = true;
      error.value = err;

      if (defaultOptions.throwOnError) {
        throw err;
      }

      return null;
    } finally {
      isLoading.value = false;
    }
  };

  // 重置状态
  const reset = () => {
    isLoading.value = false;
    isError.value = false;
    error.value = null;
    data.value = null;
  };

  // 重试操作
  const retry = async (apiFunction, ...args) => {
    reset();
    return await execute(apiFunction, ...args);
  };

  return {
    // 状态
    isLoading,
    isError,
    error,
    data,
    
    // 计算属性
    isReady,
    hasData,
    
    // 方法
    execute,
    reset,
    retry
  };
}

/**
 * 列表数据管理 Composable
 * 专门用于管理列表类型的API数据
 */
export function useApiList(fetchFunction, options = {}) {
  const api = useApi(options);
  
  // 列表特有状态
  const list = ref([]);
  const total = ref(0);
  const currentPage = ref(1);
  const pageSize = ref(options.pageSize || 10);

  // 计算属性
  const isEmpty = computed(() => list.value.length === 0);
  const hasMore = computed(() => list.value.length < total.value);

  // 获取列表数据
  const fetchList = async (params = {}) => {
    const result = await api.execute(fetchFunction, {
      page: currentPage.value,
      size: pageSize.value,
      ...params
    });

    if (result) {
      // 处理不同的API响应格式
      if (result.rows && Array.isArray(result.rows)) {
        list.value = result.rows;
        total.value = result.total || result.rows.length;
      } else if (Array.isArray(result)) {
        list.value = result;
        total.value = result.length;
      } else if (result.data && Array.isArray(result.data)) {
        list.value = result.data;
        total.value = result.total || result.data.length;
      } else {
        console.warn('未知的列表数据格式:', result);
        list.value = [];
        total.value = 0;
      }
    }

    return result;
  };

  // 刷新列表
  const refresh = () => {
    return fetchList();
  };

  // 加载更多
  const loadMore = async (params = {}) => {
    if (!hasMore.value || api.isLoading.value) {
      return;
    }

    currentPage.value += 1;
    const result = await fetchList(params);

    if (result && result.rows) {
      list.value = [...list.value, ...result.rows];
    }

    return result;
  };

  // 重置分页
  const resetPagination = () => {
    currentPage.value = 1;
    list.value = [];
    total.value = 0;
  };

  // 添加项目到列表
  const addItem = (item) => {
    list.value.unshift(item);
    total.value += 1;
  };

  // 更新列表中的项目
  const updateItem = (id, updates) => {
    const index = list.value.findIndex(item => item.id === id);
    if (index !== -1) {
      list.value[index] = { ...list.value[index], ...updates };
    }
  };

  // 从列表中移除项目
  const removeItem = (id) => {
    const index = list.value.findIndex(item => item.id === id);
    if (index !== -1) {
      list.value.splice(index, 1);
      total.value -= 1;
    }
  };

  return {
    ...api,
    
    // 列表状态
    list,
    total,
    currentPage,
    pageSize,
    
    // 计算属性
    isEmpty,
    hasMore,
    
    // 方法
    fetchList,
    refresh,
    loadMore,
    resetPagination,
    addItem,
    updateItem,
    removeItem
  };
}

/**
 * 表单提交 Composable
 * 专门用于处理表单提交的API调用
 */
export function useApiForm(submitFunction, options = {}) {
  const api = useApi(options);
  
  // 表单状态
  const formData = ref({});
  const formErrors = ref({});

  // 提交表单
  const submit = async (data = formData.value, validationRules = {}) => {
    // 清除之前的错误
    formErrors.value = {};

    // 验证表单
    if (Object.keys(validationRules).length > 0) {
      const isValid = validateForm(data, validationRules);
      if (!isValid) {
        return false;
      }
    }

    // 提交数据
    const result = await api.execute(submitFunction, data);
    
    if (result && result.success) {
      // 重置表单数据
      if (options.resetOnSuccess !== false) {
        formData.value = {};
      }
    } else if (result && result.errors) {
      // 处理服务器返回的验证错误
      formErrors.value = result.errors;
    }

    return result;
  };

  // 验证表单
  const validateForm = (data, rules) => {
    const errors = {};
    let isValid = true;

    Object.keys(rules).forEach(field => {
      const rule = rules[field];
      const value = data[field];

      if (rule.required && (!value || value.toString().trim() === '')) {
        errors[field] = rule.message || `${field}是必填项`;
        isValid = false;
      } else if (rule.validator && typeof rule.validator === 'function') {
        const result = rule.validator(value, data);
        if (result !== true) {
          errors[field] = result || `${field}验证失败`;
          isValid = false;
        }
      }
    });

    formErrors.value = errors;
    return isValid;
  };

  // 重置表单
  const resetForm = (initialData = {}) => {
    formData.value = { ...initialData };
    formErrors.value = {};
    api.reset();
  };

  return {
    ...api,
    
    // 表单状态
    formData,
    formErrors,
    
    // 方法
    submit,
    validateForm,
    resetForm
  };
}

/**
 * 批量操作 Composable
 * 用于处理批量API操作
 */
export function useApiBatch(options = {}) {
  const isLoading = ref(false);
  const results = ref([]);
  const errors = ref([]);
  const progress = ref(0);

  // 执行批量操作
  const executeBatch = async (operations) => {
    if (!Array.isArray(operations) || operations.length === 0) {
      throw new Error('操作列表不能为空');
    }

    isLoading.value = true;
    results.value = [];
    errors.value = [];
    progress.value = 0;

    const total = operations.length;
    let completed = 0;

    try {
      for (let i = 0; i < operations.length; i++) {
        const operation = operations[i];
        
        try {
          const result = await operation();
          results.value.push({ index: i, success: true, data: result });
        } catch (error) {
          console.error(`批量操作第${i + 1}项失败:`, error);
          errors.value.push({ index: i, error });
          results.value.push({ index: i, success: false, error });
        }

        completed += 1;
        progress.value = Math.round((completed / total) * 100);
      }

      return {
        success: errors.value.length === 0,
        results: results.value,
        errors: errors.value,
        total,
        completed
      };
    } finally {
      isLoading.value = false;
    }
  };

  // 重置状态
  const reset = () => {
    isLoading.value = false;
    results.value = [];
    errors.value = [];
    progress.value = 0;
  };

  return {
    isLoading,
    results,
    errors,
    progress,
    executeBatch,
    reset
  };
}

// 默认导出主要的 useApi
export default useApi;
