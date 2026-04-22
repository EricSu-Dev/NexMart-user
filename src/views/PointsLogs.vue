<template>
  <div class="points-logs">
    <!-- Breadcrumb navigation -->
    <div class="top-nav-bar">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/points' }">签到领积分</el-breadcrumb-item>
        <el-breadcrumb-item>积分明细</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- Header Section -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-box">
          <h1 class="title">积分明细</h1>
          <p class="subtitle">记录你的财富变动情况</p>
        </div>
        
        <div class="mall-entry-card" @click="$router.push('/points/mall')">
          <div class="entry-text">
            <span>前往</span>
            <strong>积分商城</strong>
          </div>
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <!-- Logs Table -->
    <div v-loading="loading" class="log-section">
      <div class="section-title">
        <el-icon><List /></el-icon>
        明细记录
      </div>

      <div class="log-table-wrapper">
        <el-table :data="logs" style="width: 100%" header-cell-class-name="log-header-cell">
          <el-table-column label="变动类型" width="160">
            <template #default="{ row }">
              <div class="type-cell">
                <el-tag :type="row.changeType === 1 ? 'success' : 'danger'" effect="light" round size="default">
                  <el-icon>
                    <component :is="row.changeType === 1 ? 'CirclePlus' : 'Remove'" />
                  </el-icon>
                  {{ row.changeType === 1 ? '签到奖励' : '兑换支出' }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="变动数值">
            <template #default="{ row }">
              <span :class="['delta-text', row.pointsDelta > 0 ? 'plus' : 'minus']">
                {{ row.pointsDelta > 0 ? '+' : '' }}{{ row.pointsDelta }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="变动说明" prop="remark" />
          
          <el-table-column label="余额" prop="balance" width="140">
            <template #default="{ row }">
              <span class="balance-num">{{ row.balance }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="变动时间" prop="createdAt" width="200">
            <template #default="{ row }">
              <span class="time-text">{{ formatDate(row.createdAt) }}</span>
            </template>
          </el-table-column>
        </el-table>

        <!-- Pagination -->
        <div class="pagination-box">
          <el-pagination
            v-model:current-page="pagination.current"
            v-model:page-size="pagination.size"
            layout="prev, pager, next"
            :total="pagination.total"
            @current-change="loadLogs"
            background
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { 
  List, CirclePlus, Remove, ArrowRight 
} from '@element-plus/icons-vue'
import { pointsApi } from '@/api/points'
import dayjs from 'dayjs'

const loading = ref(false)
const logs = ref([])

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

const loadLogs = async () => {
  loading.value = true
  try {
    const res = await pointsApi.getPointsLogs({
      current: pagination.current,
      size: pagination.size
    })
    if (res.code === 200) {
      logs.value = res.data.records || []
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('Failed to load points logs:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.points-logs {
  max-width: 1000px;
  margin: 0 auto;
  padding: 10px 20px 60px;
}

.top-nav-bar {
  margin-bottom: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
  border: 1px solid #f1f5f9;
}

.title {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 8px;
  color: #1e293b;
}

.subtitle {
  color: #94a3b8;
  font-size: 15px;
}

.mall-entry-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #fef2f2 0%, #fff 100%);
  border: 1px solid #fee2e2;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mall-entry-card:hover {
  transform: translateX(-5px);
  box-shadow: 4px 4px 15px rgba(239, 68, 68, 0.1);
}

.entry-text {
  display: flex;
  flex-direction: column;
}

.entry-text span {
  font-size: 12px;
  color: #ef4444;
}

.entry-text strong {
  font-size: 16px;
  color: #b91c1c;
}

.mall-entry-card .el-icon {
  color: #ef4444;
}

.log-section {
  background: #fff;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.04);
  border: 1px solid #f1f5f9;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 24px;
}

.section-title .el-icon {
  color: #ef4444;
}

.log-table-wrapper {
  margin-top: 10px;
}

.type-cell {
  display: flex;
  align-items: center;
}

.delta-text {
  font-size: 16px;
  font-weight: 700;
}

.plus { color: #10b981; }
.minus { color: #ef4444; }

.balance-num {
  font-weight: 600;
  color: #475569;
}

.time-text {
  color: #94a3b8;
  font-size: 13px;
}

.pagination-box {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}

:deep(.log-header-cell) {
  background-color: #f8fafc !important;
  color: #475569;
  font-weight: 700;
}
</style>
