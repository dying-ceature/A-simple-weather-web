<!--
  @file ErrorMessage.vue
  @description 通用消息提示组件 — 支持 error / success / info 三种类型
-->
<script setup>
defineProps({
  /** 消息类型 */
  type: {
    type: String,
    default: 'error',
    validator: (v) => ['error', 'success', 'info'].includes(v),
  },
  /** 消息文本 */
  message: {
    type: String,
    default: '',
  },
  /** 是否可见 */
  visible: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <Transition name="fade">
    <div
      v-if="visible && message"
      :class="['msg-banner', `msg-banner--${type}`]"
      role="alert"
    >
      <span class="msg-icon">
        {{ type === 'error' ? '⚠' : type === 'success' ? '✓' : 'ℹ' }}
      </span>
      <span>{{ message }}</span>
    </div>
  </Transition>
</template>

<style scoped>
.msg-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  margin-bottom: 12px;
  line-height: 1.5;
}

.msg-banner--error {
  background-color: #fff5f5;
  color: #c53030;
  border: 1px solid #feb2b2;
}

.msg-banner--success {
  background-color: #f0fff4;
  color: #276749;
  border: 1px solid #9ae6b4;
}

.msg-banner--info {
  background-color: #ebf8ff;
  color: #2a4365;
  border: 1px solid #90cdf4;
}

[data-theme='dark'] .msg-banner--error {
  background-color: #3b1a1a;
  color: #fc8181;
  border-color: #9b2c2c;
}

[data-theme='dark'] .msg-banner--success {
  background-color: #1a3a2a;
  color: #68d391;
  border-color: #276749;
}

[data-theme='dark'] .msg-banner--info {
  background-color: #1a2a3a;
  color: #90cdf4;
  border-color: #2a4365;
}

.msg-icon {
  flex-shrink: 0;
  font-weight: 700;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
