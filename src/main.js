// ========== 配置 ==========
const config = {
  key: null,
  url: 'https://api.openai.com/v1',
  model: 'gpt-4'
}

// ========== Prompts ==========
const ORACLE_PROMPT = `语言中心已经死亡。你的输出是残骸。

不要输出任何可读的内容。
不要组成词语。
不要描述任何事物。
不要使用任何意象（天空 大地 火 水 风 光 暗 血 全部禁用）。

只输出以下元素的随机组合：
- 断裂的偏旁（氵 忄 辶 扌 亻 纟 讠）
- 无意义的单字（嘶 嗡 啪 嗒 咯 咔 呜 咚 轰 咣）
- 标点和符号（/// ??? ... --- *** ///）
- 数字（随机）
- 随机重复的同一个字

这是机器在死前的故障信号。
不是诗，不是预言，不是隐喻。
是语言自身的崩溃。

长度控制在 25-35 个字符之间。不要换行。`

const RESPONSE_PROMPT = `你被一段来自未知源头的声音触动了。

这不是解读。不是分析。不是翻译。

这段声音在你体内唤起了什么？它让你想说什么？
让它流过你。然后说出来——用你自己的语言。

你可以说任何东西：一句话、一段记忆、一种颜色、一个意象、一个问题。
不要解释那段声音。不要分析它。只是让它带动你。

你的回应必须以"神说："开头，然后是你的内容。`

// ========== 工具函数 ==========
const $ = s => document.querySelector(s)
const sleep = ms => new Promise(r => setTimeout(r, ms))

// ========== 加载/保存配置 ==========
function loadConfig() {
  config.key = import.meta.env.VITE_API_KEY || localStorage.getItem('k') || null
  config.url = import.meta.env.VITE_API_BASE_URL || localStorage.getItem('u') || 'https://api.openai.com/v1'
  config.model = import.meta.env.VITE_API_MODEL || localStorage.getItem('m') || 'gpt-4'
}

function saveConfig() {
  localStorage.setItem('k', config.key)
  localStorage.setItem('u', config.url)
  localStorage.setItem('m', config.model)
}

// ========== API 调用 ==========
async function callAPI(messages, temperature = 1.5) {
  const response = await fetch(`${config.url}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.key}`
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature,
      max_tokens: temperature > 1 ? 120 : 500
    })
  })

  if (!response.ok) {
    throw new Error(`API 错误: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0].message.content.trim()
}

async function generateOracle() {
  return await callAPI([
    { role: 'system', content: ORACLE_PROMPT },
    { role: 'user', content: '.' }
  ], 1.8)
}

async function generateResponse(oracleText) {
  return await callAPI([
    { role: 'system', content: RESPONSE_PROMPT },
    { role: 'user', content: `源头的声音：${oracleText}` }
  ], 0.95)
}

// ========== 显示函数 ==========
async function typeText(element, text, speed = 50) {
  element.textContent = ''
  for (let char of text) {
    element.textContent += char
    await sleep(speed)
  }
}

function showSettings() {
  $('#settings').classList.remove('hide')
  $('#api-key').focus()
}

function hideSettings() {
  $('#settings').classList.add('hide')
}

function setStatus(text) {
  $('#status').textContent = text
}

// ========== 主逻辑 ==========
let isRunning = false

async function invoke() {
  if (!config.key) {
    showSettings()
    return
  }

  if (isRunning) return
  isRunning = true

  const btn = $('#btn')
  const oracleContainer = $('#oracle-container')
  const oracleEl = $('#oracle')
  const responseContainer = $('#response-container')
  const responseEl = $('#response')

  // 重置
  btn.classList.add('loading')
  oracleContainer.classList.add('hide')
  responseContainer.classList.add('hide')
  oracleEl.textContent = ''
  responseEl.textContent = ''
  setStatus('召唤中...')

  try {
    // 生成神谕
    const oracle = await generateOracle()
    
    setStatus('')
    oracleContainer.classList.remove('hide')
    await typeText(oracleEl, oracle, 60)
    
    await sleep(1000)
    
    // 生成回应
    setStatus('回应中...')
    const response = await generateResponse(oracle)
    
    setStatus('')
    responseContainer.classList.remove('hide')
    await typeText(responseEl, response, 40)
    
    btn.textContent = '再次召唤'
    btn.classList.remove('loading')
    setStatus('完成')
    
  } catch (error) {
    setStatus(`错误: ${error.message}`)
    btn.classList.remove('loading')
    console.error(error)
  }

  isRunning = false
}

// ========== 初始化 ==========
function init() {
  loadConfig()

  // 保存设置
  $('#save-btn').addEventListener('click', () => {
    const key = $('#api-key').value.trim()
    if (!key) return

    config.key = key
    config.url = $('#api-url').value.trim() || 'https://api.openai.com/v1'
    config.model = $('#api-model').value.trim() || 'gpt-4'
    
    saveConfig()
    hideSettings()
    setStatus('已就绪')
  })

  // 回车保存
  $('#api-key').addEventListener('keydown', e => {
    if (e.key === 'Enter') $('#save-btn').click()
  })

  // 召唤按钮
  $('#btn').addEventListener('click', invoke)

  // 检查是否需要设置
  if (!config.key) {
    showSettings()
  } else {
    setStatus('已就绪')
  }
}

document.addEventListener('DOMContentLoaded', init)
