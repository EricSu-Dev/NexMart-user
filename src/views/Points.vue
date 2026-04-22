<template>
  <div class="points-page">
    <!-- 1. Breadcrumb navigation -->
    <div class="breadcrumb-container">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>签到领积分</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="main-content">
      <!-- 2. Combined Dashboard (Check-in + Mall) -->
      <section class="content-section dashboard-section">
        <div class="dashboard-grid">
          <!-- Left: Check-in Info -->
          <div class="checkin-part">
            <div class="points-data">
              <span class="label">当前总积分</span>
              <div class="value-container">
                <span class="value">{{ state.totalPoints }}</span>
              </div>
            </div>
            <div class="checkin-action">
              <el-button 
                class="primary-red-btn"
                :class="{ 'is-checked': state.todayChecked }"
                :disabled="state.todayChecked" 
                @click="doCheckin"
                :loading="loading.checkin"
              >
                <el-icon v-if="state.todayChecked"><CircleCheckFilled /></el-icon>
                {{ state.todayChecked ? '今日已打卡' : '立即签到领积分' }}
              </el-button>
              <p class="consecutive-text" v-if="state.consecutiveDays > 0">
                已逐渐变得富有：连续签到 <span class="highlight">{{ state.consecutiveDays }}</span> 天
              </p>
              <div class="logs-link-wrapper" v-if="state.consecutiveDays > 0">
                <el-link type="danger" underline="never" @click="$router.push('/points/logs')">
                  查看积分明细 <el-icon><ArrowRight /></el-icon>
                </el-link>
              </div>
            </div>
          </div>

          <!-- Divider Removed -->

          <!-- Right: Mall Teaser -->
          <div class="mall-part" @click="$router.push('/points/mall')">
            <div class="mall-content-wrapper">
              <div class="mall-text">
                <h3>积分兑换好礼</h3>
                <p>小积分 抽大奖</p>
                <el-button type="warning" size="small" round>进入积分商城</el-button>
              </div>
              <div class="mall-icon">
                <img src="https://img.icons8.com/bubbles/100/gift.png" alt="Gift" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. Calendar Grid Section -->
      <section class="content-section calendar-section">
        <div class="section-header">
          <h2 class="section-title">
            <el-icon><Calendar /></el-icon>
            签到日历
          </h2>
          <div class="month-selector">
            <el-button link class="arrow-btn" @click="prevMonth"><el-icon><ArrowLeft /></el-icon></el-button>
            <span class="month-label">{{ currentYear }}年{{ currentMonth }}月</span>
            <el-button link class="arrow-btn" @click="nextMonth" :disabled="isCurrentMonth"><el-icon><ArrowRight /></el-icon></el-button>
          </div>
        </div>
        
        <div class="calendar-wrapper">
          <div class="weekdays">
            <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
          </div>
          <div class="days-grid">
            <div 
              v-for="empty in firstDayOffset" 
              :key="'empty-' + empty" 
              class="day-cell empty"
            ></div>
            <div 
              v-for="day in daysInMonth" 
              :key="'day-' + day" 
              class="day-cell"
              :class="{
                'is-checked': state.checkedDays.includes(day),
                'is-today': isToday(day)
              }"
            >
              <div class="cell-content">
                <span class="day-number">{{ day }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Removed Tasks Section -->
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted, ref, watch } from 'vue'
import { 
  Calendar, Check, CircleCheckFilled, Star, 
  ShoppingBag, ChatDotRound, Share, ArrowRight, ArrowLeft 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const loading = reactive({
  status: false,
  checkin: false
})

const state = reactive({
  checkedDays: [],
  consecutiveDays: 0,
  todayChecked: false,
  totalPoints: 0
})

const date = new Date()
const realYear = date.getFullYear()
const realMonth = date.getMonth() + 1
const realDay = date.getDate()

const currentYear = ref(realYear)
const currentMonth = ref(realMonth)

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

const daysInMonth = computed(() => new Date(currentYear.value, currentMonth.value, 0).getDate())
const firstDayOffset = computed(() => new Date(currentYear.value, currentMonth.value - 1, 1).getDay())

const isToday = (day) => day === realDay && currentMonth.value === realMonth && currentYear.value === realYear
const isCurrentMonth = computed(() => currentYear.value === realYear && currentMonth.value === realMonth)

const prevMonth = () => {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
  fetchStatus()
}

const nextMonth = () => {
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
  fetchStatus()
}

const mockTasks = [
  { id: 1, name: '完成购物', desc: '每消费 10 元积 1 分', points: 50, icon: 'ShoppingBag', bgColor: '#e3f2fd', done: false },
  { id: 2, name: '发表评价', desc: '分享购物体验', points: 10, icon: 'ChatDotRound', bgColor: '#f3e5f5', done: false },
  { id: 3, name: '分享好友', desc: '邀请好友注册', points: 30, icon: 'Share', bgColor: '#fff3e0', done: false }
]

const fetchStatus = async () => {
  loading.status = true
  try {
    // 强制把参数拼接到 URL 上，防止被自定义的 request 拦截器吞掉 params 对象
    const url = `/user/checkin/status?year=${currentYear.value}&month=${currentMonth.value}`
    const res = await request.get(url)
    
    if (res.code === 200 && res.data) {
      // 后端已支持按年月查询历史数据，直接赋值
      state.checkedDays = res.data.checkedDays || []

      // 保护顶部总览数据：只有在查看当前月时，才覆盖总览数据（防止用户看历史月份导致顶部总积分和打卡天数突变）
      if (isCurrentMonth.value) {
        state.consecutiveDays = res.data.consecutiveDays || 0
        state.todayChecked = res.data.todayChecked || false
        state.totalPoints = res.data.totalPoints || 0
      }
    }
  } catch (error) {
    console.error('Failed to get checkin status:', error)
  } finally {
    loading.status = false
  }
}


const doCheckin = async () => {
  if (state.todayChecked) return
  
  loading.checkin = true
  try {
    const res = await request.post('/user/checkin')
    if (res.code === 200 && res.data) {
      const data = res.data
      state.consecutiveDays = data.consecutiveDays || state.consecutiveDays + 1
      state.totalPoints = data.totalPoints || state.totalPoints
      state.todayChecked = true
      
      if (!state.checkedDays.includes(realDay)) {
        state.checkedDays.push(realDay)
      }
      
      let msg = `签到成功！获得 ${data.pointsEarned} 积分。`
      if (data.bonusRemark) msg += ` ${data.bonusRemark}`
      ElMessage.success({
        message: msg,
        type: 'success',
        duration: 3000
      })
    }
  } catch (error) {
    console.error('Checkin failed:', error)
  } finally {
    loading.checkin = false
  }
}

onMounted(() => {
  fetchStatus()
})
</script>

<style scoped>
.points-page {
  min-height: 100vh;
  background-color: #f8fafc;
  padding-bottom: 60px;
}

/* Breadcrumb */
.breadcrumb-container {
  max-width: 1000px;
  margin: 20px auto 0;
  padding: 0 20px;
}

/* Main Content */
.main-content {
  max-width: 1000px;
  margin: 30px auto 30px;
  padding: 0 20px;
}

/* Dashboard Styling (Combined Check-in + Mall) */
.dashboard-grid {
  display: flex;
  align-items: stretch; /* Make children same height */
  gap: 0;
  padding: 0;
  border-radius: 24px;
  overflow: hidden;
}

.checkin-part {
  flex: 3;
  text-align: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
  color: #fff;
}

.mall-part {
  flex: 2;
  cursor: pointer;
  padding: 40px 20px;
  background: linear-gradient(135deg, #fbd38d 0%, #f6ad55 100%); /* Deeper Gold */
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.mall-part:hover {
  background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%);
}

.mall-content-wrapper {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  gap: 20px;
}

.mall-text h3 {
  font-size: 19px;
  font-weight: 800;
  color: #744210; /* Darker brown for contrast */
  margin: 0 0 10px;
}

.mall-text p {
  font-size: 14px;
  color: #975a16;
  margin-bottom: 20px;
}

.mall-icon img {
  width: 90px;
  filter: drop-shadow(0 6px 10px rgba(0,0,0,0.1));
}

.points-data .label {
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.value-container {
  margin: 12px 0 20px;
}

.value {
  font-size: 84px; /* Back to bigger size */
  font-weight: 900;
  color: #fff; /* White text on red background */
  line-height: 1;
  text-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

.primary-red-btn {
  height: 52px;
  padding: 0 44px;
  font-size: 17px;
  font-weight: 700;
  border-radius: 26px;
  border: none;
  background: #fff;
  color: #e53e3e; /* Red button on red background */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.primary-red-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.15);
  background: #fdf2f2;
}

.primary-red-btn.is-checked {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  box-shadow: none;
}

.consecutive-text {
  margin-top: 20px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
}

.logs-link-wrapper {
  margin-top: 8px;
}

.logs-link-wrapper :deep(.el-link) {
  background: rgba(255, 255, 255, 0.15);
  padding: 4px 12px;
  border-radius: 12px;
  color: #fff !important;
  font-size: 12px;
  transition: all 0.3s ease;
}

.logs-link-wrapper :deep(.el-link:hover) {
  background: rgba(255, 255, 255, 0.25);
}

.highlight {
  color: #fefcbf;
  font-weight: 700;
  font-size: 18px;
  margin: 0 2px;
}

.content-section {
  background: #fff;
  border-radius: 24px;
  padding: 0; /* Padding handled by internal parts */
  margin-bottom: 24px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.02);
  overflow: hidden;
}

.calendar-section {
  padding: 30px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 24px;
}

.section-title .el-icon {
  color: #e53e3e; /* Theme color */
}

/* Calendar Section */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.month-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.arrow-btn {
  font-size: 18px;
  color: #64748b;
  padding: 4px;
}

.arrow-btn:hover {
  color: #e53e3e;
}

.arrow-btn.is-disabled {
  color: #cbd5e1;
}

.month-label {
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
}

.calendar-wrapper {
  background: #fff;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 12px;
}

.weekday {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
}

.day-cell {
  aspect-ratio: 1;
  border-radius: 16px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.day-cell.empty {
  background: transparent;
  visibility: hidden;
}

.cell-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.day-number {
  font-size: 16px;
  font-weight: 600;
  color: #475569;
}

.day-cell.is-today {
  /* Special today highlight removed per user request */
  background: #f8fafc;
}

.day-cell.is-today .day-number {
  color: #475569;
}

.day-cell.is-checked {
  background: #ed9521; /* Deep Blue background */
  border: none; 
  transform: scale(1.02);
}

.day-cell.is-checked .day-number {
  color: #fff; /* Number changed to white for contrast */
  font-weight: 800;
}


/* Tasks Section */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-card {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 16px;
  background: #f8fafc;
}

.task-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.task-info {
  flex: 1;
}

.task-name {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.task-desc {
  font-size: 13px;
  color: #64748b;
}

.task-reward {
  margin: 0 20px;
  font-weight: 700;
  color: #e53e3e;
}

/* Mall Teaser */
.mall-banner {
  height: 160px;
  background: linear-gradient(135deg, #feb2b2 0%, #e53e3e 100%);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 60px;
  cursor: pointer;
  overflow: hidden;
}

.banner-text h2 {
  color: #fff;
  font-size: 24px;
  margin-bottom: 8px;
}

.banner-text p {
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 20px;
}

.banner-img img {
  width: 140px;
}

@media (max-width: 640px) {
  .header-content {
    padding: 0 10px;
  }
  .points-card {
    padding: 24px 15px;
  }
  .value { font-size: 48px; }
  .mall-banner { padding: 0 20px; }
  .banner-img { display: none; }
  .primary-red-btn { padding: 0 30px; }
}
</style>
