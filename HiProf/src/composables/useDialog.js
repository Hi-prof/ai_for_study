import { ref, reactive, computed } from 'vue';

/**
 * 对话框状态管理 Composable
 * 提供统一的对话框状态管理和操作方法
 */
export function useDialog(options = {}) {
  // 默认配置
  const defaultOptions = {
    title: '对话框',
    width: '90%',
    maxWidth: '500px',
    showFooter: true,
    showConfirm: true,
    cancelText: '取消',
    confirmText: '确认',
    loadingText: '处理中...',
    closeOnOverlay: true,
    ...options
  };

  // 对话框状态
  const isVisible = ref(false);
  const isLoading = ref(false);
  const config = reactive({ ...defaultOptions });

  // 计算属性
  const dialogProps = computed(() => ({
    modelValue: isVisible.value,
    title: config.title,
    width: config.width,
    maxWidth: config.maxWidth,
    showFooter: config.showFooter,
    showConfirm: config.showConfirm,
    cancelText: config.cancelText,
    confirmText: config.confirmText,
    loadingText: config.loadingText,
    loading: isLoading.value,
    closeOnOverlay: config.closeOnOverlay
  }));

  // 显示对话框
  const show = (newConfig = {}) => {
    // 合并新配置
    Object.assign(config, newConfig);
    isVisible.value = true;
    isLoading.value = false;
  };

  // 隐藏对话框
  const hide = () => {
    isVisible.value = false;
    isLoading.value = false;
  };

  // 设置加载状态
  const setLoading = (loading) => {
    isLoading.value = loading;
  };

  // 更新配置
  const updateConfig = (newConfig) => {
    Object.assign(config, newConfig);
  };

  // 重置配置
  const resetConfig = () => {
    Object.assign(config, defaultOptions);
  };

  // 确认操作（返回Promise以支持异步操作）
  const confirm = async (handler) => {
    if (typeof handler !== 'function') {
      hide();
      return;
    }

    try {
      setLoading(true);
      const result = await handler();
      
      // 如果处理函数返回false，不关闭对话框
      if (result !== false) {
        hide();
      }
      
      return result;
    } catch (error) {
      console.error('对话框确认操作失败:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 取消操作
  const cancel = (handler) => {
    if (typeof handler === 'function') {
      handler();
    }
    hide();
  };

  return {
    // 状态
    isVisible,
    isLoading,
    config,
    
    // 计算属性
    dialogProps,
    
    // 方法
    show,
    hide,
    setLoading,
    updateConfig,
    resetConfig,
    confirm,
    cancel
  };
}

/**
 * 创建确认对话框 Composable
 * 用于快速创建确认/取消类型的对话框
 */
export function useConfirmDialog(options = {}) {
  const dialog = useDialog({
    showFooter: true,
    showConfirm: true,
    ...options
  });

  // 显示确认对话框
  const showConfirm = (config = {}) => {
    return new Promise((resolve, reject) => {
      dialog.show({
        ...config,
        onConfirm: async () => {
          try {
            if (config.onConfirm) {
              const result = await config.onConfirm();
              resolve(result);
            } else {
              resolve(true);
            }
          } catch (error) {
            reject(error);
          }
        },
        onCancel: () => {
          if (config.onCancel) {
            config.onCancel();
          }
          resolve(false);
        }
      });
    });
  };

  return {
    ...dialog,
    showConfirm
  };
}

/**
 * 创建表单对话框 Composable
 * 用于创建包含表单的对话框
 */
export function useFormDialog(options = {}) {
  const dialog = useDialog(options);
  
  // 表单数据
  const formData = ref({});
  const formErrors = ref({});
  const isFormValid = ref(true);

  // 重置表单
  const resetForm = (initialData = {}) => {
    formData.value = { ...initialData };
    formErrors.value = {};
    isFormValid.value = true;
  };

  // 验证表单
  const validateForm = (rules = {}) => {
    const errors = {};
    let valid = true;

    Object.keys(rules).forEach(field => {
      const rule = rules[field];
      const value = formData.value[field];

      if (rule.required && (!value || value.toString().trim() === '')) {
        errors[field] = rule.message || `${field}是必填项`;
        valid = false;
      } else if (rule.validator && typeof rule.validator === 'function') {
        const result = rule.validator(value, formData.value);
        if (result !== true) {
          errors[field] = result || `${field}验证失败`;
          valid = false;
        }
      }
    });

    formErrors.value = errors;
    isFormValid.value = valid;
    return valid;
  };

  // 显示表单对话框
  const showForm = (config = {}) => {
    resetForm(config.initialData);
    dialog.show(config);
  };

  // 提交表单
  const submitForm = async (handler, rules = {}) => {
    if (!validateForm(rules)) {
      return false;
    }

    return await dialog.confirm(async () => {
      if (typeof handler === 'function') {
        return await handler(formData.value);
      }
      return true;
    });
  };

  return {
    ...dialog,
    
    // 表单相关状态
    formData,
    formErrors,
    isFormValid,
    
    // 表单相关方法
    resetForm,
    validateForm,
    showForm,
    submitForm
  };
}

/**
 * 创建删除确认对话框 Composable
 * 专门用于删除操作的确认对话框
 */
export function useDeleteDialog(options = {}) {
  const defaultConfig = {
    title: '确认删除',
    confirmText: '删除',
    cancelText: '取消',
    ...options
  };

  const dialog = useConfirmDialog(defaultConfig);

  // 显示删除确认对话框
  const showDeleteConfirm = (itemName, onConfirm) => {
    return dialog.showConfirm({
      title: defaultConfig.title,
      message: `确定要删除"${itemName}"吗？此操作不可撤销。`,
      onConfirm
    });
  };

  return {
    ...dialog,
    showDeleteConfirm
  };
}

// 默认导出主要的 useDialog
export default useDialog;
