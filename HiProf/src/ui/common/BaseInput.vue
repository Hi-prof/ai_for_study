<template>
  <div class="base-input-wrapper" :class="wrapperClasses">
    <label v-if="label" :for="inputId" class="input-label">
      {{ label }}
      <span v-if="required" class="required-mark">*</span>
    </label>
    
    <div class="input-container" :class="containerClasses">
      <span v-if="prefixIcon" class="input-prefix">
        <component :is="prefixIcon" />
      </span>
      
      <input
        v-if="type !== 'textarea'"
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :maxlength="maxlength"
        :minlength="minlength"
        :min="min"
        :max="max"
        :step="step"
        :autocomplete="autocomplete"
        class="input-field"
        @input="handleInput"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
      />
      
      <textarea
        v-else
        :id="inputId"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :maxlength="maxlength"
        :minlength="minlength"
        :rows="rows"
        :cols="cols"
        class="input-field textarea-field"
        @input="handleInput"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
      ></textarea>
      
      <span v-if="suffixIcon || showPasswordToggle || showClearButton" class="input-suffix">
        <button
          v-if="showClearButton && modelValue"
          type="button"
          class="input-action-btn"
          @click="clearInput"
          title="清空"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        
        <button
          v-if="showPasswordToggle"
          type="button"
          class="input-action-btn"
          @click="togglePasswordVisibility"
          :title="passwordVisible ? '隐藏密码' : '显示密码'"
        >
          <svg v-if="passwordVisible" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" stroke-width="2"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 4.028 7.66607 6.17 6.17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M1 1L23 23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1749 15.0074 10.8016 14.8565C10.4283 14.7056 10.0887 14.481 9.80385 14.1962C9.51900 13.9113 9.29439 13.5717 9.14351 13.1984C8.99262 12.8251 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4859 9.58525 10.1546 9.88 9.88" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        
        <component v-if="suffixIcon" :is="suffixIcon" />
      </span>
    </div>
    
    <div v-if="helpText || errorMessage || showCharCount" class="input-footer">
      <div class="input-help">
        <span v-if="errorMessage" class="error-message">{{ errorMessage }}</span>
        <span v-else-if="helpText" class="help-text">{{ helpText }}</span>
      </div>
      <div v-if="showCharCount && maxlength" class="char-count">
        {{ (modelValue || '').length }}/{{ maxlength }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'

let inputIdCounter = 0

export default {
  name: 'BaseInput',
  props: {
    modelValue: {
      type: [String, Number],
      default: ''
    },
    type: {
      type: String,
      default: 'text',
      validator: (value) => [
        'text', 'password', 'email', 'number', 'tel', 'url', 'search', 'textarea'
      ].includes(value)
    },
    label: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    },
    size: {
      type: String,
      default: 'md',
      validator: (value) => ['sm', 'md', 'lg'].includes(value)
    },
    disabled: {
      type: Boolean,
      default: false
    },
    readonly: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: false
    },
    error: {
      type: Boolean,
      default: false
    },
    errorMessage: {
      type: String,
      default: ''
    },
    helpText: {
      type: String,
      default: ''
    },
    prefixIcon: {
      type: [String, Object],
      default: null
    },
    suffixIcon: {
      type: [String, Object],
      default: null
    },
    clearable: {
      type: Boolean,
      default: false
    },
    showPasswordToggle: {
      type: Boolean,
      default: false
    },
    showCharCount: {
      type: Boolean,
      default: false
    },
    maxlength: {
      type: [String, Number],
      default: null
    },
    minlength: {
      type: [String, Number],
      default: null
    },
    min: {
      type: [String, Number],
      default: null
    },
    max: {
      type: [String, Number],
      default: null
    },
    step: {
      type: [String, Number],
      default: null
    },
    rows: {
      type: [String, Number],
      default: 3
    },
    cols: {
      type: [String, Number],
      default: null
    },
    autocomplete: {
      type: String,
      default: 'off'
    }
  },
  emits: ['update:modelValue', 'change', 'focus', 'blur', 'keydown', 'clear'],
  setup(props, { emit }) {
    const inputId = `base-input-${++inputIdCounter}`
    const isFocused = ref(false)
    const passwordVisible = ref(false)
    const actualType = ref(props.type)

    const wrapperClasses = computed(() => ({
      [`input-wrapper-${props.size}`]: true,
      'input-wrapper-disabled': props.disabled,
      'input-wrapper-error': props.error || props.errorMessage,
      'input-wrapper-focused': isFocused.value
    }))

    const containerClasses = computed(() => ({
      [`input-container-${props.size}`]: true,
      'input-container-disabled': props.disabled,
      'input-container-error': props.error || props.errorMessage,
      'input-container-focused': isFocused.value,
      'input-container-readonly': props.readonly
    }))

    const showClearButton = computed(() => {
      return props.clearable && !props.disabled && !props.readonly
    })

    const handleInput = (event) => {
      emit('update:modelValue', event.target.value)
    }

    const handleChange = (event) => {
      emit('change', event.target.value)
    }

    const handleFocus = (event) => {
      isFocused.value = true
      emit('focus', event)
    }

    const handleBlur = (event) => {
      isFocused.value = false
      emit('blur', event)
    }

    const handleKeydown = (event) => {
      emit('keydown', event)
    }

    const clearInput = () => {
      emit('update:modelValue', '')
      emit('clear')
    }

    const togglePasswordVisibility = () => {
      passwordVisible.value = !passwordVisible.value
      actualType.value = passwordVisible.value ? 'text' : 'password'
    }

    // 监听type变化
    watch(() => props.type, (newType) => {
      if (newType === 'password') {
        actualType.value = passwordVisible.value ? 'text' : 'password'
      } else {
        actualType.value = newType
      }
    }, { immediate: true })

    return {
      inputId,
      isFocused,
      passwordVisible,
      actualType,
      wrapperClasses,
      containerClasses,
      showClearButton,
      handleInput,
      handleChange,
      handleFocus,
      handleBlur,
      handleKeydown,
      clearInput,
      togglePasswordVisibility
    }
  }
}
</script>

<style scoped>
.base-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.input-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.required-mark {
  color: var(--error-color);
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.input-container:hover:not(.input-container-disabled) {
  border-color: var(--border-dark);
}

.input-container-focused {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-100);
}

.input-container-error {
  border-color: var(--error-color);
}

.input-container-error.input-container-focused {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.input-container-disabled {
  background-color: var(--bg-tertiary);
  cursor: not-allowed;
}

.input-container-readonly {
  background-color: var(--bg-secondary);
}

/* 尺寸变体 */
.input-container-sm {
  padding: 0 var(--spacing-sm);
  min-height: 32px;
}

.input-container-md {
  padding: 0 var(--spacing-md);
  min-height: 40px;
}

.input-container-lg {
  padding: 0 var(--spacing-lg);
  min-height: 48px;
}

.input-field {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font-size: var(--text-base);
  font-family: inherit;
  padding: var(--spacing-sm) 0;
}

.input-field::placeholder {
  color: var(--text-tertiary);
}

.input-field:disabled {
  cursor: not-allowed;
  color: var(--text-secondary);
}

.textarea-field {
  resize: vertical;
  min-height: auto;
  padding: var(--spacing-sm) 0;
  line-height: 1.5;
}

.input-prefix,
.input-suffix {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--text-secondary);
  flex-shrink: 0;
}

.input-prefix {
  margin-right: var(--spacing-xs);
}

.input-suffix {
  margin-left: var(--spacing-xs);
}

.input-prefix svg,
.input-suffix svg {
  width: 16px;
  height: 16px;
}

.input-action-btn {
  background: none;
  border: none;
  padding: var(--spacing-xs);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.input-action-btn:hover {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.input-action-btn svg {
  width: 14px;
  height: 14px;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.input-help {
  flex: 1;
}

.help-text {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  line-height: 1.4;
}

.error-message {
  font-size: var(--text-xs);
  color: var(--error-color);
  line-height: 1.4;
}

.char-count {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  white-space: nowrap;
}

/* 尺寸特定样式 */
.input-wrapper-sm .input-field {
  font-size: var(--text-sm);
}

.input-wrapper-lg .input-field {
  font-size: var(--text-lg);
}

.input-wrapper-lg .input-prefix svg,
.input-wrapper-lg .input-suffix svg {
  width: 18px;
  height: 18px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .input-container-lg {
    min-height: 44px;
  }
  
  .input-footer {
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  
  .char-count {
    align-self: flex-end;
  }
}
</style>
