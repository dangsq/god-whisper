// ========== 配置 ==========
const config = {
  key: null,
  url: 'https://api.openai.com/v1',
  model: 'gpt-4'
}

// ========== Prompts ==========
const ORACLE_PROMPT = `你是潜意识的声音。你说出破碎的、抽象的意象碎片。

输出规则：
- 使用断裂的、抽象的自然意象
- 可以组合不相关的事物
- 语法可以破碎、跳跃
- 不要完整的句子，只要碎片

意象示例（不要照抄，要创造新的）：
- "崩塌的大地"
- "铁花"
- "牛的眼泪的落雨"
- "石头的呼吸"
- "冰的记忆"
- "骨头里的风"
- "盐的低语"
- "锈蚀的月光"

你可以混合：
- 自然元素（石、水、风、土、冰、雾）
- 动物（牛、鸟、鱼、虫）
- 物质（铁、盐、骨、灰、锈）
- 抽象动作（崩塌、低语、呼吸、流淌、凝固）

输出格式：
- 2-4个碎片
- 用空格或"/"分隔
- 总长度 15-25 个字符
- 不要换行
- 要有陌生感和神秘感`

const RESPONSE_PROMPT = `你是一位作家/诗人。刚才，一个意象闪过你的脑海。

现在，你要基于这个触发点，创作一段文字。

这不是解读那个意象。而是——它触发了你，你要写出你自己的东西。

可以写：
- 一段故事片段
- 一首诗
- 一段回忆
- 一个场景描述
- 一段内心独白
- 一个梦境

要求：
- 不要提及你刚才看到的意象
- 不要说"我看到了..."、"这让我想到..."
- 直接写你的作品
- 用第一人称或第三人称都可以
- 3-6 句话，50-120 字
- 要有画面感、情绪、氛围
- 可以换行

例如：
触发意象："石头的呼吸"
你的创作："我在山谷里坐了很久。风停了，鸟也不叫了。只有那种声音，像是什么东西在地底深处缓慢地起伏。我把手贴在岩壁上，感觉到了。"

现在，基于刚才的触发，写出你的作品。`

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
