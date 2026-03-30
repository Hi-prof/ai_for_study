import { ref, reactive, computed, watch } from 'vue';

/**
 * 表单验证 Composable
 * 提供统一的表单验证逻辑和状态管理
 */
export function useFormValidation(initialData = {}, validationRules = {}) {
  // 表单数据
  const formData = reactive({ ...initialData });
  
  // 验证错误
  const errors = ref({});
  
  // 字段验证状态
  const fieldValidated = ref({});
  
  // 表单是否已提交过
  const hasSubmitted = ref(false);

  // 计算属性
  const isValid = computed(() => {
    return Object.keys(errors.value).length === 0;
  });

  const hasErrors = computed(() => {
    return Object.keys(errors.value).length > 0;
  });

  const validatedFields = computed(() => {
    return Object.keys(fieldValidated.value).filter(key => fieldValidated.value[key]);
  });

  // 内置验证规则
  const builtInRules = {
    required: (value, message = '此字段为必填项') => {
      if (value === null || value === undefined || value === '') {
        return message;
      }
      if (typeof value === 'string' && value.trim() === '') {
        return message;
      }
      if (Array.isArray(value) && value.length === 0) {
        return message;
      }
      return true;
    },

    email: (value, message = '请输入有效的邮箱地址') => {
      if (!value) return true; // 空值由required规则处理
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) ? true : message;
    },

    phone: (value, message = '请输入有效的手机号码') => {
      if (!value) return true;
      const phoneRegex = /^1[3-9]\d{9}$/;
      return phoneRegex.test(value) ? true : message;
    },

    minLength: (min, message) => (value) => {
      if (!value) return true;
      return value.length >= min ? true : (message || `最少需要${min}个字符`);
    },

    maxLength: (max, message) => (value) => {
      if (!value) return true;
      return value.length <= max ? true : (message || `最多允许${max}个字符`);
    },

    min: (min, message) => (value) => {
      if (value === null || value === undefined || value === '') return true;
      const num = Number(value);
      return num >= min ? true : (message || `最小值为${min}`);
    },

    max: (max, message) => (value) => {
      if (value === null || value === undefined || value === '') return true;
      const num = Number(value);
      return num <= max ? true : (message || `最大值为${max}`);
    },

    pattern: (regex, message = '格式不正确') => (value) => {
      if (!value) return true;
      return regex.test(value) ? true : message;
    },

    confirm: (targetField, message) => (value, formData) => {
      if (!value) return true;
      const targetValue = formData[targetField];
      return value === targetValue ? true : (message || '两次输入不一致');
    }
  };

  // 验证单个字段
  const validateField = (fieldName, value = formData[fieldName]) => {
    const rules = validationRules[fieldName];
    if (!rules) {
      delete errors.value[fieldName];
      return true;
    }

    // 确保rules是数组格式
    const ruleArray = Array.isArray(rules) ? rules : [rules];
    
    for (const rule of ruleArray) {
      let validator;
      let message;

      if (typeof rule === 'function') {
        validator = rule;
      } else if (typeof rule === 'object') {
        if (rule.validator) {
          validator = rule.validator;
          message = rule.message;
        } else if (rule.type && builtInRules[rule.type]) {
          if (rule.type === 'minLength' || rule.type === 'maxLength' || 
              rule.type === 'min' || rule.type === 'max') {
            validator = builtInRules[rule.type](rule.value, rule.message);
          } else if (rule.type === 'pattern') {
            validator = builtInRules[rule.type](rule.pattern, rule.message);
          } else if (rule.type === 'confirm') {
            validator = builtInRules[rule.type](rule.target, rule.message);
          } else {
            validator = builtInRules[rule.type];
            message = rule.message;
          }
        }
      } else if (typeof rule === 'string' && builtInRules[rule]) {
        validator = builtInRules[rule];
      }

      if (validator) {
        const result = validator(value, formData);
        if (result !== true) {
          errors.value[fieldName] = message || result;
          fieldValidated.value[fieldName] = true;
          return false;
        }
      }
    }

    delete errors.value[fieldName];
    fieldValidated.value[fieldName] = true;
    return true;
  };

  // 验证所有字段
  const validateAll = () => {
    let isFormValid = true;
    
    Object.keys(validationRules).forEach(fieldName => {
      const fieldValid = validateField(fieldName);
      if (!fieldValid) {
        isFormValid = false;
      }
    });

    hasSubmitted.value = true;
    return isFormValid;
  };

  // 清除字段错误
  const clearFieldError = (fieldName) => {
    delete errors.value[fieldName];
  };

  // 清除所有错误
  const clearAllErrors = () => {
    errors.value = {};
    fieldValidated.value = {};
  };

  // 设置字段错误
  const setFieldError = (fieldName, error) => {
    errors.value[fieldName] = error;
    fieldValidated.value[fieldName] = true;
  };

  // 设置多个字段错误
  const setErrors = (errorObj) => {
    Object.keys(errorObj).forEach(fieldName => {
      setFieldError(fieldName, errorObj[fieldName]);
    });
  };

  // 重置表单
  const resetForm = (newData = {}) => {
    Object.keys(formData).forEach(key => {
      delete formData[key];
    });
    Object.assign(formData, { ...initialData, ...newData });
    clearAllErrors();
    hasSubmitted.value = false;
  };

  // 获取字段错误
  const getFieldError = (fieldName) => {
    return errors.value[fieldName] || '';
  };

  // 检查字段是否有错误
  const hasFieldError = (fieldName) => {
    return !!errors.value[fieldName];
  };

  // 获取字段验证状态类
  const getFieldClass = (fieldName) => {
    if (!fieldValidated.value[fieldName] && !hasSubmitted.value) {
      return '';
    }
    return hasFieldError(fieldName) ? 'error' : 'valid';
  };

  // 监听表单数据变化，实时验证
  const enableRealTimeValidation = (immediate = false) => {
    Object.keys(validationRules).forEach(fieldName => {
      watch(
        () => formData[fieldName],
        (newValue) => {
          if (fieldValidated.value[fieldName] || hasSubmitted.value) {
            validateField(fieldName, newValue);
          }
        },
        { immediate }
      );
    });
  };

  return {
    // 数据
    formData,
    errors,
    fieldValidated,
    hasSubmitted,

    // 计算属性
    isValid,
    hasErrors,
    validatedFields,

    // 方法
    validateField,
    validateAll,
    clearFieldError,
    clearAllErrors,
    setFieldError,
    setErrors,
    resetForm,
    getFieldError,
    hasFieldError,
    getFieldClass,
    enableRealTimeValidation,

    // 内置规则（供外部使用）
    builtInRules
  };
}

/**
 * 创建简单的字段验证器
 */
export function createFieldValidator(rules) {
  const validator = useFormValidation({}, { field: rules });
  
  return {
    validate: (value) => {
      validator.formData.field = value;
      return validator.validateField('field', value);
    },
    error: computed(() => validator.getFieldError('field')),
    hasError: computed(() => validator.hasFieldError('field'))
  };
}

/**
 * 常用验证规则组合
 */
export const commonRules = {
  // 必填文本
  requiredText: [
    { type: 'required', message: '此字段为必填项' }
  ],

  // 邮箱
  email: [
    { type: 'required', message: '请输入邮箱地址' },
    { type: 'email', message: '请输入有效的邮箱地址' }
  ],

  // 手机号
  phone: [
    { type: 'required', message: '请输入手机号码' },
    { type: 'phone', message: '请输入有效的手机号码' }
  ],

  // 密码
  password: [
    { type: 'required', message: '请输入密码' },
    { type: 'minLength', value: 6, message: '密码至少需要6个字符' }
  ],

  // 确认密码
  confirmPassword: (passwordField = 'password') => [
    { type: 'required', message: '请确认密码' },
    { type: 'confirm', target: passwordField, message: '两次输入的密码不一致' }
  ],

  // 用户名
  username: [
    { type: 'required', message: '请输入用户名' },
    { type: 'minLength', value: 3, message: '用户名至少需要3个字符' },
    { type: 'maxLength', value: 20, message: '用户名最多20个字符' },
    { type: 'pattern', pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
  ]
};

// 默认导出
export default useFormValidation;
