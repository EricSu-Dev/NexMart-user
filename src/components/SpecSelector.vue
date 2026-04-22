<template>
  <div class="spec-selector" v-if="specs.length">
    <div class="spec-row">
      <span class="label">规格：</span>
      <div class="spec-list">
        <div v-for="spec in sortedSpecs" :key="spec.id" class="spec-item">
          <el-button
            :class="{
              active: String(modelValue) === String(spec.id),
              'spec-disabled': Number(spec.stock || 0) === 0
            }"
            @click="selectSpec(spec)"
          >
            {{ spec.specName }}
          </el-button>
          <div
            v-if="showSpecItemStock"
            class="spec-stock"
            :class="{ out: Number(spec.stock || 0) === 0 }"
          >
            <span v-if="Number(spec.stock || 0) === 0">库存不足</span>
            <span v-else>{{ spec.stock }} 件</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showSpecStock" class="stock-info">
      <span class="label">{{ stockLabel }}：</span>
      <span :class="displayStock > 0 ? 'in-stock' : 'out-stock'">
        {{ displayStock > 0 ? `${displayStock} 件` : '库存不足' }}
      </span>
    </div>

    <div v-if="showQuantity" class="quantity-row">
      <span class="label">数量：</span>
      <el-input-number
        v-model="innerQuantity"
        :min="currentStock > 0 ? 1 : 0"
        :max="currentStock > 0 ? currentStock : 0"
        :disabled="currentStock === 0"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  specs: { type: Array, default: () => [] },
  modelValue: { type: [Number, String], default: null },
  quantity: { type: Number, default: 1 },
  showQuantity: { type: Boolean, default: false },
  showSpecStock: { type: Boolean, default: true },
  showSpecItemStock: { type: Boolean, default: true },
  stockLabel: { type: String, default: '库存' },
  stockValue: { type: Number, default: null },
  allowOutOfStockClick: { type: Boolean, default: true },
  outOfStockTip: { type: String, default: '该规格商品已售空' },
  overStockTip: { type: String, default: '该规格商品库存不足' }
})

const emit = defineEmits(['update:modelValue', 'update:quantity'])

const sortedSpecs = computed(() => {
  return [...props.specs].sort((a, b) => (a.specSort ?? 0) - (b.specSort ?? 0))
})

const currentSpec = computed(() => {
  return sortedSpecs.value.find(spec => String(spec.id) === String(props.modelValue)) || null
})

const currentStock = computed(() => {
  return currentSpec.value ? Number(currentSpec.value.stock || 0) : 0
})

const displayStock = computed(() => {
  if (props.stockValue === null || props.stockValue === undefined) {
    return currentStock.value
  }
  return Number(props.stockValue || 0)
})

const innerQuantity = computed({
  get: () => props.quantity,
  set: (val) => emit('update:quantity', val)
})

const selectSpec = (spec) => {
  if (Number(spec.stock || 0) === 0) {
    if (props.allowOutOfStockClick) {
      ElMessage.warning({ message: props.outOfStockTip, duration: 1500 })
    }
    return
  }
  if (String(spec.id) !== String(props.modelValue)) {
    emit('update:modelValue', spec.id)
  }
}

const ensureValidSelection = () => {
  if (!sortedSpecs.value.length) return
  const selected = sortedSpecs.value.find(spec => String(spec.id) === String(props.modelValue))
  if (selected && Number(selected.stock || 0) > 0) return
  const firstAvailable = sortedSpecs.value.find(spec => Number(spec.stock || 0) > 0)
  if (!firstAvailable) {
    if (props.modelValue !== null) emit('update:modelValue', null)
    return
  }
  if (String(firstAvailable.id) !== String(props.modelValue)) {
    emit('update:modelValue', firstAvailable.id)
  }
}

watch(sortedSpecs, ensureValidSelection, { immediate: true })
watch(() => props.modelValue, ensureValidSelection)

watch(currentStock, (val) => {
  if (!props.showQuantity) return
  if (val === 0) {
    if (props.quantity !== 0) emit('update:quantity', 0)
    return
  }
  if (props.quantity < 1) emit('update:quantity', 1)
  if (props.quantity > val) emit('update:quantity', val)
})
</script>

<style scoped>
.spec-row {
  margin: 20px 0;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.spec-list {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.spec-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.spec-list .el-button {
  border: 1px solid var(--border-color-base);
}

.spec-list .el-button.active {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background-color: var(--primary-color-light);
}

.spec-list .el-button.spec-disabled {
  border-color: var(--border-color-base);
  color: #c0c4cc;
  background-color: #f5f7fa;
  cursor: not-allowed;
}

.spec-stock {
  font-size: 12px;
  color: #67c23a;
}

.spec-stock.out {
  color: #f56c6c;
}

.label {
  color: #909399;
  font-size: 14px;
  white-space: nowrap;
}

.stock-info,
.quantity-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
}

.in-stock { color: #67c23a; }
.out-stock { color: #f56c6c; }
</style>
