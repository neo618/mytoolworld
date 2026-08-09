<template>
  <div class="calc-plugin">
    <div class="calc-main">
      <div class="display">
        <div class="expr">{{ expr || '0' }}</div>
        <div class="result" v-if="result !== ''">= {{ result }}</div>
        <div class="cn" v-if="cnResult">{{ cnResult }}</div>
      </div>
      <div class="keypad">
        <button v-for="k in keys" :key="k.v" class="key" :class="k.cls" @click="press(k.v)">{{ k.label }}</button>
      </div>
    </div>
    <div class="history">
      <div class="history-header">
        <span>计算历史</span>
        <button class="btn btn-xs btn-ghost" @click="clearHistory" v-if="history.length">清空</button>
      </div>
      <div v-if="history.length === 0" class="history-empty">暂无记录</div>
      <div v-else class="history-list">
        <div v-for="(h, i) in history" :key="i" class="history-item" @click="reuse(h)">
          <div class="h-expr">{{ h.expr }}</div>
          <div class="h-result">= {{ h.result }}</div>
          <div class="h-cn" v-if="h.cn">{{ h.cn }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { loadData, saveData } from '@/plugins/storage'

const PID = 'calculator'
const expr = ref('')
const result = ref('')
const cnResult = ref('')
const history = ref(loadData(PID, 'history', []))

const keys = [
  { v: 'C', label: 'C', cls: 'op' },
  { v: 'back', label: '⌫', cls: 'op' },
  { v: '(', label: '(', cls: 'op' },
  { v: ')', label: ')', cls: 'op' },
  { v: '7', label: '7' }, { v: '8', label: '8' }, { v: '9', label: '9' },
  { v: '/', label: '÷', cls: 'op' },
  { v: '4', label: '4' }, { v: '5', label: '5' }, { v: '6', label: '6' },
  { v: '*', label: '×', cls: 'op' },
  { v: '1', label: '1' }, { v: '2', label: '2' }, { v: '3', label: '3' },
  { v: '-', label: '−', cls: 'op' },
  { v: '0', label: '0' }, { v: '.', label: '.' },
  { v: 'cn', label: '大写', cls: 'cn' },
  { v: '+', label: '+', cls: 'op' },
  { v: '=', label: '=', cls: 'eq span2' }
]

function press(k) {
  if (k === 'C') { expr.value = ''; result.value = ''; cnResult.value = ''; return }
  if (k === 'back') { expr.value = expr.value.slice(0, -1); return }
  if (k === 'cn') {
    const num = parseFloat(result.value !== '' ? result.value : expr.value)
    if (!isNaN(num) && isFinite(num)) cnResult.value = toChineseUpper(num)
    return
  }
  if (k === '=') { calc(); return }
  // 防止连续运算符
  const ops = ['+', '-', '*', '/']
  const last = expr.value.slice(-1)
  if (ops.includes(k) && ops.includes(last)) {
    expr.value = expr.value.slice(0, -1) + k
    return
  }
  expr.value += k
}

function calc() {
  if (!expr.value) return
  try {
    // 仅允许数字和基本运算符，防止注入
    if (!/^[\d+\-*/.() ]+$/.test(expr.value)) throw new Error('非法表达式')
    const val = Function(`"use strict"; return (${expr.value})`)()
    if (typeof val !== 'number' || !isFinite(val)) throw new Error('无法计算')
    const rounded = Math.round(val * 1e10) / 1e10
    result.value = String(rounded)
    cnResult.value = toChineseUpper(rounded)
    history.value.unshift({ expr: expr.value, result: String(rounded), cn: cnResult.value })
    if (history.value.length > 30) history.value.pop()
    saveData(PID, 'history', history.value)
  } catch {
    result.value = '错误'
    cnResult.value = ''
  }
}

function reuse(h) {
  expr.value = h.expr
  result.value = h.result
  cnResult.value = h.cn
}

function clearHistory() {
  history.value = []
  saveData(PID, 'history', [])
}

function toChineseUpper(num) {
  if (isNaN(num) || !isFinite(num)) return ''
  if (Math.abs(num) >= 1e12) return '数值过大'
  const digits = '零壹贰叁肆伍陆柒捌玖'
  const neg = num < 0
  const n = Math.abs(num)
  const intPart = Math.floor(n)
  const decPart = Math.round((n - intPart) * 100)
  let r = ''
  if (intPart === 0) r = '零'
  else {
    // 按 4 位分组（个级/万级/亿级），组内转中文，组间补零
    const s = String(intPart)
    const groups = []
    for (let i = s.length; i > 0; i -= 4) groups.unshift(s.slice(Math.max(0, i - 4), i))
    const bigUnits = ['', '万', '亿']
    const sectionToCn = (g) => {
      const units = ['仟', '佰', '拾', '']
      const padded = g.padStart(4, '0')
      let out = '', zp = false
      for (let i = 0; i < 4; i++) {
        const d = +padded[i]
        if (d === 0) { zp = true }
        else { if (zp && out) out += '零'; zp = false; out += digits[d] + units[i] }
      }
      return out.replace(/^零+/, '')
    }
    groups.forEach((g, gi) => {
      const val = parseInt(g, 10)
      if (val === 0) return
      if (r && val < 1000) r += '零'
      r += sectionToCn(g) + bigUnits[groups.length - 1 - gi]
    })
  }
  r += '元'
  if (decPart === 0) r += '整'
  else {
    const jiao = Math.floor(decPart / 10)
    const fen = decPart % 10
    if (jiao > 0) r += digits[jiao] + '角'
    else if (fen > 0 && intPart > 0) r += '零'
    if (fen > 0) r += digits[fen] + '分'
  }
  return (neg ? '负' : '') + r
}
</script>

<style scoped>
.calc-plugin { display: flex; gap: 24px; max-width: 860px; margin: 0 auto; align-items: flex-start; }
.calc-main { flex-shrink: 0; width: 340px; }
.display {
  background: var(--bg-surface);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 20px; margin-bottom: 12px;
  text-align: right; min-height: 110px;
  box-shadow: var(--shadow-sm);
}
.expr { font-size: 26px; font-weight: 500; font-family: 'Consolas', monospace; word-break: break-all; min-height: 34px; }
.result { font-size: 20px; color: var(--accent); font-weight: 600; font-family: 'Consolas', monospace; margin-top: 4px; }
.cn { font-size: 15px; color: var(--text-secondary); margin-top: 6px; word-break: break-all; }
.keypad { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.key {
  height: 52px; border-radius: var(--radius-sm);
  border: 1px solid var(--border-light);
  background: var(--bg-surface);
  font-size: 17px; font-weight: 500;
  color: var(--text-primary); cursor: pointer;
  transition: all var(--transition);
  box-shadow: var(--shadow-sm);
}
.key:hover { background: var(--bg-hover); }
.key:active { transform: scale(0.95); }
.key.op { color: var(--accent); font-weight: 600; }
.key.cn { color: var(--warning); font-weight: 600; font-size: 15px; }
.key.eq { background: var(--accent); color: #fff; font-weight: 600; font-size: 19px; }
.key.eq:hover { filter: brightness(1.08); }
.key.span2 { grid-column: span 2; }
.history { flex: 1; min-width: 0; }
.history-header {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 13px; font-weight: 600; color: var(--text-secondary);
  margin-bottom: 10px;
}
.history-empty { font-size: 13px; color: var(--text-muted); padding: 30px 0; text-align: center; }
.history-list { display: flex; flex-direction: column; gap: 6px; max-height: 420px; overflow-y: auto; }
.history-item {
  background: var(--bg-surface);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  cursor: pointer;
  transition: all var(--transition);
}
.history-item:hover { border-color: var(--accent); }
.h-expr { font-size: 13px; color: var(--text-muted); font-family: 'Consolas', monospace; }
.h-result { font-size: 15px; font-weight: 600; color: var(--text-primary); font-family: 'Consolas', monospace; margin-top: 2px; }
.h-cn { font-size: 12.5px; color: var(--text-secondary); margin-top: 3px; }
</style>
