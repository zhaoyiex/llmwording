// 应用状态
const appState = {
  apiKey: "2ac7080b71104d31bc5f318f6cba9858.jaRTuoW5ZS0RLEEP", // 临时 API key，调试后会删除
  selectedDictionary: "",
  dictionaries: [],
  words: [],
  dictionaryData: {}, // 词典数据，用于查询单词释义
  currentRound: [],
  currentWordIndex: 0,
  wordFamiliarity: {},
  wordReviewDates: {}, // 记录单词的记忆日期
  reviewQueue: []
};

// DOM 元素
const elements = {
  // 屏幕
  welcomeScreen: document.getElementById('welcome-screen'),
  loadingScreen: document.getElementById('loading-screen'),
  wordScreen: document.getElementById('word-screen'),
  roundCompleteScreen: document.getElementById('round-complete-screen'),
  reviewScreen: document.getElementById('review-screen'),
  
  // 统计信息
  learnedCount: document.getElementById('learned-count'),
  unlearnedCount: document.getElementById('unlearned-count'),
  
  // 标签页
  homeTab: document.getElementById('home-tab'),
  reviewTab: document.getElementById('review-tab'),
  reviewList: document.getElementById('review-list'),
  
  // 按钮
  startBtn: document.getElementById('start-btn'),
  settingsBtn: document.getElementById('settings-btn'),
  nextRoundBtn: document.getElementById('next-round-btn'),
  backHomeBtn: document.getElementById('back-home-btn'),
  saveSettingsBtn: document.getElementById('save-settings-btn'),
  closeSettingsBtn: document.getElementById('close-settings-btn'),
  
  // 设置模态框
  settingsModal: document.getElementById('settings-modal'),
  apiKeyInput: document.getElementById('api-key'),
  dictionarySelect: document.getElementById('dictionary'),
  
  // 单词屏幕
  contextText: document.getElementById('context-text'),
  optionBtns: document.querySelectorAll('.option-btn'),
  progressBar: document.getElementById('progress-bar'),
  progressText: document.getElementById('progress-text'),
  
  // 便利贴元素
  stickyNote: document.getElementById('word-sticky-note'),
  stickyWord: document.getElementById('sticky-word'),
  stickyMeaning: document.getElementById('sticky-meaning')
};

// 初始化应用
async function initApp() {
  // 加载本地存储的设置
  loadSettings();
  
  // 加载词典列表
  await loadDictionaries();
  
  // 加载词典数据
  if (appState.selectedDictionary) {
    await loadDictionaryData(appState.selectedDictionary);
  }
  
  // 加载单词熟悉度数据
  loadWordFamiliarity();
  
  // 绑定事件监听器
  bindEventListeners();
  
  // 更新统计信息
  updateStats();
  
  // 注册 Service Worker
  registerServiceWorker();
}

// 加载本地存储的设置
function loadSettings() {
  const savedApiKey = localStorage.getItem('apiKey');
  const savedDictionary = localStorage.getItem('selectedDictionary');
  
  if (savedApiKey) {
    appState.apiKey = savedApiKey;
    elements.apiKeyInput.value = savedApiKey;
  }
  
  if (savedDictionary) {
    appState.selectedDictionary = savedDictionary;
  }
}

// 保存设置到本地存储
function saveSettings() {
  const apiKey = elements.apiKeyInput.value.trim();
  const dictionary = elements.dictionarySelect.value;
  
  if (apiKey) {
    appState.apiKey = apiKey;
    localStorage.setItem('apiKey', apiKey);
  }
  
  if (dictionary) {
    appState.selectedDictionary = dictionary;
    localStorage.setItem('selectedDictionary', dictionary);
  }
}

// 加载词典列表
async function loadDictionaries() {
  try {
    // 这里应该是从服务器或本地文件系统加载词典列表
    // 由于是本地开发环境，我们直接硬编码词典列表
    appState.dictionaries = [
      { id: '1-初中-顺序.json', name: '初中英语' },
      { id: '2-高中-顺序.json', name: '高中英语' },
      { id: '3-CET4-顺序.json', name: '大学英语四级' },
      { id: '4-CET6-顺序.json', name: '大学英语六级' },
      { id: '5-考研-顺序.json', name: '考研英语' },
      { id: '6-托福-顺序.json', name: '托福英语' },
      { id: '7-SAT-顺序.json', name: 'SAT英语' }
    ];
    
    // 填充词典选择下拉框
    populateDictionarySelect();
  } catch (error) {
    console.error('加载词典列表失败:', error);
  }
}

// 填充词典选择下拉框
function populateDictionarySelect() {
  elements.dictionarySelect.innerHTML = '<option value="">请选择词典</option>';
  
  appState.dictionaries.forEach(dict => {
    const option = document.createElement('option');
    option.value = dict.id;
    option.textContent = dict.name;
    if (dict.id === appState.selectedDictionary) {
      option.selected = true;
    }
    elements.dictionarySelect.appendChild(option);
  });
}

// 加载词典数据
async function loadDictionaryData(dictionaryId) {
  try {
    // 从 memory word 文件夹加载 JSON 文件
    const response = await fetch(`resourcepack/memory%20word/${dictionaryId}`);
    if (!response.ok) {
      throw new Error('加载词典文件失败');
    }
    
    const jsonData = await response.json();
    
    // 提取单词列表和词典数据
    if (Array.isArray(jsonData)) {
      // 检查数组元素类型
      if (jsonData.length > 0 && typeof jsonData[0] === 'object' && jsonData[0].word) {
        appState.words = jsonData.map(item => item.word);
        // 同时也保存到 dictionaryData，方便查询单词
        jsonData.forEach(item => {
          appState.dictionaryData[item.word.toLowerCase()] = {
            translations: item.translations || [{ translation: '暂无释义' }]
          };
        });
      } else if (jsonData.length > 0 && typeof jsonData[0] === 'string') {
        appState.words = jsonData;
        // 同时也保存到 dictionaryData，方便查询单词
        jsonData.forEach(word => {
          appState.dictionaryData[word.toLowerCase()] = {
            translations: [{ translation: '暂无释义' }]
          };
        });
      } else {
        appState.words = jsonData;
      }
    } else if (jsonData.words && Array.isArray(jsonData.words)) {
      appState.words = jsonData.words;
      // 同时也保存到 dictionaryData，方便查询单词
      jsonData.words.forEach(word => {
        appState.dictionaryData[word.toLowerCase()] = {
          translations: [{ translation: '暂无释义' }]
        };
      });
    } else {
      console.error('词典格式错误:', jsonData);
      appState.words = [];
    }
    
    console.log('词典数据加载完成:', dictionaryId, '共', appState.words.length, '个单词');
    
    // 更新统计信息
    updateStats();
  } catch (error) {
    console.error('加载词典数据失败:', error);
    // 使用默认单词列表
    appState.words = [
      'accomplish', 'acquire', 'adapt', 'adequate', 'adjacent',
      'adjective', 'adverb', 'advocate', 'aesthetic', 'affection',
      'affirm', 'afford', 'aggressive', 'agile', 'agonize',
      'agreeable', 'ahead', 'aim', 'airline', 'airport',
      'aisle', 'album', 'alcohol', 'alert', 'algebra',
      'alien', 'alley', 'allocate', 'allowance', 'ally'
    ];
    
    // 更新统计信息
    updateStats();
  }
}

// 加载 dictionary.csv 文件
async function loadDictionaryCSV() {
  try {
    const response = await fetch('resourcepack/dictionary.csv');
    if (!response.ok) {
      throw new Error('加载 dictionary.csv 失败');
    }
    
    const csvText = await response.text();
    const lines = csvText.split('\n');
    
    // 跳过标题行
    const headers = lines[0].split(',');
    
    // 解析 CSV 数据
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // 处理 CSV 行，考虑引号内的逗号
      const values = parseCSVLine(line);
      
      if (values.length >= 2) {
        const word = values[0].replace(/"/g, '').toLowerCase();
        const translation = values[1].replace(/"/g, '');
        appState.dictionaryData[word] = translation;
      }
    }
    
    console.log('词典 CSV 数据加载完成，共', Object.keys(appState.dictionaryData).length, '个单词');
  } catch (error) {
    console.error('加载 dictionary.csv 失败:', error);
    // 使用模拟数据
    appState.dictionaryData = {
      'accomplish': '完成；实现',
      'acquire': '获得；取得',
      'adapt': '适应；改编',
      'adequate': '足够的；适当的',
      'adjacent': '邻近的；毗连的'
    };
  }
}

// 解析 CSV 行的辅助函数
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

// 从词典中查询单词释义
function getWordMeaning(word) {
  const lowerWord = word.toLowerCase();
  
  if (appState.dictionaryData[lowerWord]) {
    const wordData = appState.dictionaryData[lowerWord];
    
    // 检查数据结构
    if (wordData.translations && Array.isArray(wordData.translations) && wordData.translations.length > 0) {
      return wordData.translations[0].translation;
    }
    
    // 如果数据结构不同，返回第一个翻译
    if (wordData.translations && wordData.translations[0]) {
      return wordData.translations[0].translation;
    }
    
    // 如果词典中没有，返回默认释义
    return '该单词暂无释义';
  } else {
    // 如果词典中没有，返回默认释义
    return '该单词暂无释义';
  }
}

// 加载单词熟悉度数据
function loadWordFamiliarity() {
  const savedFamiliarity = localStorage.getItem('wordFamiliarity');
  if (savedFamiliarity) {
    appState.wordFamiliarity = JSON.parse(savedFamiliarity);
  }
  
  // 加载单词记忆日期
  const savedReviewDates = localStorage.getItem('wordReviewDates');
  if (savedReviewDates) {
    appState.wordReviewDates = JSON.parse(savedReviewDates);
  }
}

// 保存单词熟悉度数据
function saveWordFamiliarity() {
  localStorage.setItem('wordFamiliarity', JSON.stringify(appState.wordFamiliarity));
  localStorage.setItem('wordReviewDates', JSON.stringify(appState.wordReviewDates));
}

// 切换标签页
function switchTab(tab) {
  if (tab === 'home') {
    elements.homeTab.classList.add('active');
    elements.reviewTab.classList.remove('active');
    elements.reviewScreen.classList.add('hidden');
  } else if (tab === 'review') {
    elements.homeTab.classList.remove('active');
    elements.reviewTab.classList.add('active');
    elements.reviewScreen.classList.remove('hidden');
    showReviewList();
  }
}

// 更新统计信息
function updateStats() {
  // 计算已记忆单词数（熟悉度 > 0）
  const learnedWords = Object.keys(appState.wordFamiliarity).filter(word => appState.wordFamiliarity[word] > 0);
  const learnedCount = learnedWords.length;
  
  // 计算未记忆单词数
  const totalWords = appState.words.length;
  const unlearnedCount = totalWords - learnedCount;
  
  // 更新 UI
  elements.learnedCount.textContent = learnedCount;
  elements.unlearnedCount.textContent = unlearnedCount;
}

// 显示已记忆单词列表
function showReviewList() {
  elements.reviewList.innerHTML = '';
  
  // 获取已记忆单词（熟悉度 > 0）
  const learnedWords = Object.keys(appState.wordFamiliarity)
    .filter(word => appState.wordFamiliarity[word] > 0)
    .sort((a, b) => appState.wordFamiliarity[b] - appState.wordFamiliarity[a]); // 按熟悉度降序排列
  
  if (learnedWords.length === 0) {
    elements.reviewList.innerHTML = '<p class="no-words">暂无已记忆单词</p>';
    return;
  }
  
  // 创建已记忆单词列表
  learnedWords.forEach(word => {
    const familiarity = appState.wordFamiliarity[word];
    const reviewDate = appState.wordReviewDates[word] || '未知';
    
    // 从词典中获取释义
    const meaning = getWordMeaning(word);
    
    const reviewItem = document.createElement('div');
    reviewItem.className = 'review-item';
    
    reviewItem.innerHTML = `
      <div class="word-info">
        <p class="word">${word}</p>
        <p class="meaning">${meaning}</p>
        <div class="metadata">
          <span>记忆日期: ${reviewDate}</span>
        </div>
      </div>
      <div class="familiarity">熟悉度: ${familiarity}</div>
    `;
    
    elements.reviewList.appendChild(reviewItem);
  });
}

// 绑定事件监听器
function bindEventListeners() {
  // 开始按钮
  elements.startBtn.addEventListener('click', startNewRound);
  
  // 下一轮按钮
  elements.nextRoundBtn.addEventListener('click', startNewRound);
  
  // 返回首页按钮
  elements.backHomeBtn.addEventListener('click', () => {
    elements.roundCompleteScreen.classList.add('hidden');
    elements.welcomeScreen.classList.remove('hidden');
    // 更新统计信息
    updateStats();
  });
  
  // 选项按钮
  elements.optionBtns.forEach(btn => {
    btn.addEventListener('click', handleOptionClick);
  });
  
  // 标签页按钮
  elements.homeTab.addEventListener('click', () => {
    switchTab('home');
  });
  
  elements.reviewTab.addEventListener('click', () => {
    switchTab('review');
    showReviewList();
  });
  
  // 设置按钮
  elements.settingsBtn.addEventListener('click', () => {
    elements.settingsModal.classList.remove('hidden');
  });
  
  // 保存设置按钮
  elements.saveSettingsBtn.addEventListener('click', async () => {
    saveSettings();
    elements.settingsModal.classList.add('hidden');
    
    // 如果词典发生变化，重新加载词典数据
    if (appState.selectedDictionary) {
      await loadDictionaryData(appState.selectedDictionary);
    }
  });
  
  // 关闭设置按钮
  elements.closeSettingsBtn.addEventListener('click', () => {
    elements.settingsModal.classList.add('hidden');
  });
  
  // 点击模态框外部关闭
  elements.settingsModal.addEventListener('click', (e) => {
    if (e.target === elements.settingsModal) {
      elements.settingsModal.classList.add('hidden');
    }
  });
  
  // 点击屏幕任意地方关闭便利贴
  document.addEventListener('click', (e) => {
    // 如果点击的不是可点击单词，则关闭便利贴
    if (!e.target.classList.contains('clickable-word')) {
      hideStickyNote();
    }
  });
  
  // 监听窗口大小变化，重新定位便利贴
  window.addEventListener('resize', () => {
    if (!elements.stickyNote.classList.contains('hidden')) {
      hideStickyNote();
    }
  });
}

// 注册 Service Worker
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker 注册成功:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker 注册失败:', error);
        });
    });
  }
}

// 开始新一轮记忆
async function startNewRound() {
  // 检查是否选择了词典
  if (!appState.selectedDictionary) {
    alert('请先在设置中选择词典');
    elements.settingsModal.classList.remove('hidden');
    return;
  }
  
  // 检查是否有 API Key
  if (!appState.apiKey) {
    alert('请先在设置中填写 API Key');
    elements.settingsModal.classList.remove('hidden');
    return;
  }
  
  // 显示加载屏幕
  elements.welcomeScreen.classList.add('hidden');
  elements.roundCompleteScreen.classList.add('hidden');
  elements.wordScreen.classList.add('hidden');
  elements.loadingScreen.classList.remove('hidden');
  
  try {
    // 选择待记忆单词
    await selectWordsForRound();
    
    // 生成学习内容
    await generateRoundContent();
  } catch (error) {
    console.error('开始新一轮失败:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);
    alert(`生成学习内容失败: ${error.message || error}，请重试`);
    elements.loadingScreen.classList.add('hidden');
    elements.welcomeScreen.classList.remove('hidden');
  }
}

// 选择待记忆单词
async function selectWordsForRound() {
  // 清空当前轮次
  appState.currentRound = [];
  appState.currentWordIndex = 0;
  
  // 过滤出没背过的单词（熟悉度为 0 或不存在的单词）
  const unlearnedWords = appState.words.filter(word => {
    return !appState.wordFamiliarity[word] || appState.wordFamiliarity[word] === 0;
  });
  
  // 如果没背过的单词不足 5 个，则从所有单词中随机选择
  let availableWords = unlearnedWords.length >= 5 ? unlearnedWords : appState.words;
  
  // 随机乱序
  const shuffledWords = [...availableWords].sort(() => Math.random() - 0.5);
  
  // 选择5个单词，确保不都是同一个字母开头
  const selectedWords = [];
  const usedFirstLetters = new Set();
  
  for (const word of shuffledWords) {
    if (selectedWords.length >= 5) break;
    
    const firstLetter = word.charAt(0).toLowerCase();
    
    // 如果这个首字母已经被使用了，并且已经有超过2个单词使用了相同首字母，跳过
    if (usedFirstLetters.has(firstLetter) && 
        selectedWords.filter(w => w.charAt(0).toLowerCase() === firstLetter).length >= 2) {
      continue;
    }
    
    selectedWords.push(word);
    usedFirstLetters.add(firstLetter);
  }
  
  // 如果选择不足5个，用剩余的单词补充
  if (selectedWords.length < 5) {
    for (const word of shuffledWords) {
      if (selectedWords.length >= 5) break;
      if (!selectedWords.includes(word)) {
        selectedWords.push(word);
      }
    }
  }
  
  // 为每个单词生成学习内容
  for (const word of selectedWords) {
    appState.currentRound.push({
      word: word,
      context: '',
      options: [],
      correctIndex: 0,
      meaning: ''
    });
  }
}

// 生成轮次内容
async function generateRoundContent() {
  // 获取当前轮次的所有单词
  const words = appState.currentRound.map(item => item.word);
  
  // 先显示单词屏幕，显示加载状态
  elements.loadingScreen.classList.add('hidden');
  elements.wordScreen.classList.remove('hidden');
  elements.contextText.innerHTML = '<p>正在生成学习内容...</p>';
  
  // 生成包含所有单词的段落（流式调用）
  const content = await generateContentWithLLM(words);
  
  // LLM返回完成后，只显示passage内容
  if (content && content.passage) {
    elements.contextText.innerHTML = '<p>' + content.passage + '</p>';
  }
  
  // 生成错误释义的辅助函数
  function generateFalseMeaning(word) {
    // 先尝试从词典中获取其他单词的释义作为错误选项
    const dictKeys = Object.keys(appState.dictionaryData);
    if (dictKeys.length > 0) {
      // 随机选择一个不同的单词的释义
      const randomWord = dictKeys[Math.floor(Math.random() * dictKeys.length)];
      if (randomWord.toLowerCase() !== word.toLowerCase()) {
        const randomMeaning = getWordMeaning(randomWord);
        if (randomMeaning && randomMeaning !== '该单词暂无释义') {
          return randomMeaning;
        }
      }
    }
    
    // 如果词典中没有合适的释义，生成基于正确释义的变体
    const correctMeaning = getWordMeaning(word);
    if (correctMeaning && correctMeaning !== '该单词暂无释义') {
      // 基于正确释义生成错误释义
      const modifiers = ['不', '非', '反', '错误地'];
      const suffixes = ['的行为', '的过程', '的状态', '的方式'];
      const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      return modifier + correctMeaning + suffix;
    }
    
    // 最后的备用方案
    const fallbackMeanings = ['无法确定', '不清楚', '未知含义', '需要更多上下文'];
    return fallbackMeanings[Math.floor(Math.random() * fallbackMeanings.length)];
  }
  
  // 生成相反释义的辅助函数
  function generateOppositeMeaning(word) {
    // 尝试从词典中获取其他单词的释义
    const dictKeys = Object.keys(appState.dictionaryData);
    if (dictKeys.length > 0) {
      // 随机选择一个不同的单词的释义
      const randomWord = dictKeys[Math.floor(Math.random() * dictKeys.length)];
      if (randomWord.toLowerCase() !== word.toLowerCase()) {
        const randomMeaning = getWordMeaning(randomWord);
        if (randomMeaning && randomMeaning !== '该单词暂无释义') {
          return randomMeaning;
        }
      }
    }
    
    // 基于正确释义生成相反含义
    const correctMeaning = getWordMeaning(word);
    if (correctMeaning && correctMeaning !== '该单词暂无释义') {
      const opposites = ['不' + correctMeaning, '非' + correctMeaning, '与' + correctMeaning + '相反'];
      return opposites[Math.floor(Math.random() * opposites.length)];
    }
    
    // 备用方案
    const fallbackOpposites = ['相反', '对立', '反面', '否定'];
    return fallbackOpposites[Math.floor(Math.random() * fallbackOpposites.length)];
  }
  
  // 更新每个单词的内容
  for (let i = 0; i < appState.currentRound.length; i++) {
    const wordItem = appState.currentRound[i];
    wordItem.context = content.passage;
    
    // 从 LLM 返回的 words 数组中查找对应单词的释义
    const wordInfo = content.words.find(w => w.word.toLowerCase() === wordItem.word.toLowerCase());
    if (wordInfo) {
      wordItem.meaning = wordInfo.true_meaning;
      wordItem.falseMeaning1 = wordInfo.false_meaning_1;
      wordItem.falseMeaning2 = wordInfo.false_meaning_2;
      wordItem.oppositeMeaning = wordInfo.opposite_meaning;
    } else {
      // 如果LLM没有返回对应单词的信息，使用词典中的释义
      const dictMeaning = getWordMeaning(wordItem.word);
      wordItem.meaning = dictMeaning;
      // 生成一些相关的错误释义
      wordItem.falseMeaning1 = generateFalseMeaning(wordItem.word);
      wordItem.falseMeaning2 = generateFalseMeaning(wordItem.word);
      wordItem.oppositeMeaning = generateOppositeMeaning(wordItem.word);
    }
    
    // 生成选择题选项（中文释义）
    const options = [];
    const correctMeaning = wordItem.meaning;
    
    // 添加正确释义
    options.push(correctMeaning);
    
    // 添加易混淆释义
    if (wordItem.falseMeaning1 && !options.includes(wordItem.falseMeaning1)) {
      options.push(wordItem.falseMeaning1);
    }
    
    // 添加另外两个毫不相干的释义
    const otherWords = appState.currentRound.filter(item => item.word !== wordItem.word);
    const usedMeanings = new Set(options);
    
    for (const otherWord of otherWords) {
      if (otherWord.meaning && !usedMeanings.has(otherWord.meaning)) {
        options.push(otherWord.meaning);
        usedMeanings.add(otherWord.meaning);
      }
      if (options.length >= 4) break;
    }
    
    // 如果选项不足4个，使用词典中的其他单词释义
    while (options.length < 4) {
      const dictKeys = Object.keys(appState.dictionaryData);
      if (dictKeys.length > 0) {
        const randomWord = dictKeys[Math.floor(Math.random() * dictKeys.length)];
        const randomMeaning = getWordMeaning(randomWord);
        if (randomMeaning && randomMeaning !== '该单词暂无释义' && !usedMeanings.has(randomMeaning)) {
          options.push(randomMeaning);
          usedMeanings.add(randomMeaning);
        }
      } else {
        // 最后的备用方案
        options.push('未知含义');
      }
    }
    
    // 打乱选项顺序
    const shuffledOptions = shuffleArray(options);
    wordItem.options = shuffledOptions;
    wordItem.correctIndex = shuffledOptions.indexOf(correctMeaning);
  }
  
  // 显示第一个单词
  showCurrentWord();
}

// 生成单个单词的学习内容
async function generateWordContent(wordItem) {
  try {
    // 使用 LLM 生成包含单词的文本和选项
    const content = await generateContentWithLLM(wordItem.word);
    
    // 解析生成的内容
    wordItem.context = content.context;
    wordItem.options = content.options;
    wordItem.correctIndex = content.correctIndex;
  } catch (error) {
    console.error('生成单词内容失败:', error);
    
    // 使用备用方案
    wordItem.context = `This is a sample sentence containing the word ${wordItem.word}. The word ${wordItem.word} means to complete something successfully.`;
    wordItem.options = [wordItem.word, 'sample', 'sentence', 'complete'];
    wordItem.correctIndex = 0;
  }
}

// 打乱数组顺序的辅助函数
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 使用 LLM 生成内容（流式调用）
async function generateContentWithLLM(words) {
  try {
    // 调用实际的 LLM API（流式调用）
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appState.apiKey}`
      },
      body: JSON.stringify({
        model: 'glm-4.7-flash',
        messages: [
          {
            role: 'system',
            content: `你是一位专业的高考英语词汇辅导老师，擅长编写语境记忆文本和辨析词义。请根据用户输入的单词列表和难度等级，生成一段用于语境记忆的英文短文，短文要有一定的科普作用或者育人价值，并以 JSON 格式输出单词的详细释义辨析。注意：如果输入单词有拼写错误（如abondon），请在生成结果中自动修正。`
          },
          {
            role: 'user',
            content: `请为单词列表 [${words.join(', ')}] 成一段 200 词左右的英语短文，短文要自然地包含所有单词，并有一定的科普作用或育人价值。同时，请以 JSON 格式返回，包含以下字段：passage（短文内容），words（单词详细信息数组，每个单词包含 word、true_meaning、false_meaning_1、false_meaning_2、opposite_meaning 字段, 给出的是中文释义）。注意：所有单词必须在同一篇短文中同时出现，不要遗漏任何一个单词。`
          }
        ],
        temperature: 0.8,
        max_tokens: 2048,
        stream: true
      })
    });
    
    if (!response.ok) {
      throw new Error('LLM API 调用失败');
    }
    
    // 处理流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            
            if (content) {
              fullContent += content;
              
              // 实时更新显示
              if (elements.contextText) {
                elements.contextText.innerHTML = `<p>正在生成学习内容...<br><br>${fullContent}</p>`;
              }
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
    
    // 尝试解析完整的 JSON 内容
    try {
      const parsedContent = JSON.parse(fullContent);
      return parsedContent;
    } catch (parseError) {
      console.error('解析 LLM 返回的 JSON 失败:', parseError);
      // 如果解析失败，使用备用方案，但使用真实的词典释义
      const passage = `When learning English, it's important to ${words[0]} new words every day. You should ${words[1]} practicing them regularly. You can ${words[2]} with friends in English to improve. Don't let the ${words[3]} of learning discourage you. With patience, you can ${words[4]} your goals.`;
      
      const wordDetails = words.map(word => {
        const dictMeaning = getWordMeaning(word);
        const otherMeanings = [];
        const dictKeys = Object.keys(appState.dictionaryData);
        
        // 从词典中获取其他单词的释义作为错误选项
        for (let i = 0; i < 3 && otherMeanings.length < 3; i++) {
          if (dictKeys.length > 0) {
            const randomWord = dictKeys[Math.floor(Math.random() * dictKeys.length)];
            if (randomWord.toLowerCase() !== word.toLowerCase()) {
              const randomMeaning = getWordMeaning(randomWord);
              if (randomMeaning && randomMeaning !== '该单词暂无释义' && !otherMeanings.includes(randomMeaning)) {
                otherMeanings.push(randomMeaning);
              }
            }
          }
        }
        
        return {
          word: word,
          true_meaning: dictMeaning,
          false_meaning_1: otherMeanings[0] || '易混淆释义1',
          false_meaning_2: otherMeanings[1] || '易混淆释义2',
          opposite_meaning: otherMeanings[2] || '相反释义'
        };
      });
      
      return {
        passage: passage,
        words: wordDetails
      };
    }
  } catch (error) {
    console.error('生成单词内容失败:', error);
    
    // 使用备用方案，但使用真实的词典释义
    const passage = `When learning English, it's important to ${words[0]} new words every day. You should ${words[1]} practicing them regularly. You can ${words[2]} with friends in English to improve. Don't let the ${words[3]} of learning discourage you. With patience, you can ${words[4]} your goals.`;
    
    const wordDetails = words.map(word => {
      const dictMeaning = getWordMeaning(word);
      const otherMeanings = [];
      const dictKeys = Object.keys(appState.dictionaryData);
      
      // 从词典中获取其他单词的释义作为错误选项
      for (let i = 0; i < 3 && otherMeanings.length < 3; i++) {
        if (dictKeys.length > 0) {
          const randomWord = dictKeys[Math.floor(Math.random() * dictKeys.length)];
          if (randomWord.toLowerCase() !== word.toLowerCase()) {
            const randomMeaning = getWordMeaning(randomWord);
            if (randomMeaning && randomMeaning !== '该单词暂无释义' && !otherMeanings.includes(randomMeaning)) {
              otherMeanings.push(randomMeaning);
            }
          }
        }
      }
      
      return {
        word: word,
        true_meaning: dictMeaning,
        false_meaning_1: otherMeanings[0] || '易混淆释义1',
        false_meaning_2: otherMeanings[1] || '易混淆释义2',
        opposite_meaning: otherMeanings[2] || '相反释义'
      };
    });
    
    return {
      passage: passage,
      words: wordDetails
    };
  }
}

// 显示当前单词
function showCurrentWord() {
  if (appState.currentWordIndex >= appState.currentRound.length) {
    showRoundComplete();
    return;
  }
  
  const currentItem = appState.currentRound[appState.currentWordIndex];
  
  // 更新上下文文本
  elements.contextText.innerHTML = currentItem.context;
  
  // 获取所有待记忆单词列表（小写）
  const targetWords = appState.currentRound.map(item => item.word.toLowerCase());
  const currentTargetWord = currentItem.word.toLowerCase();
  
  // 分割文本为单词，保留标点符号
  const words = currentItem.context.split(/(\s+|[.,!?;:"'()])/);
  
  // 处理每个单词
  const processedWords = words.map(word => {
    const cleanWord = word.replace(/^[.,!?;:"'()]+|[.,!?;:"'()]+$/g, '').toLowerCase();
    const punctuation = word.match(/^[.,!?;:"'()]+/);
    const trailingPunctuation = word.match(/[.,!?;:"'()]+$/);
    
    if (cleanWord && targetWords.includes(cleanWord)) {
      // 待记忆单词：高亮显示，但不可点击
      const isCurrentWord = (cleanWord === currentTargetWord);
      const className = isCurrentWord ? 'highlight-current' : 'highlight';
      const prefix = punctuation ? punctuation[0] : '';
      const suffix = trailingPunctuation ? trailingPunctuation[0] : '';
      return `${prefix}<span class="${className}" data-word="${cleanWord}">${word.replace(/^[.,!?;:"'()]+|[.,!?;:"'()]+$/g, '')}</span>${suffix}`;
    } else if (cleanWord && /^[a-zA-Z]+$/.test(cleanWord)) {
      // 普通英文单词：可以点击查询释义，不高亮
      const prefix = punctuation ? punctuation[0] : '';
      const suffix = trailingPunctuation ? trailingPunctuation[0] : '';
      return `${prefix}<span class="clickable-word" data-word="${cleanWord}">${word.replace(/^[.,!?;:"'()]+|[.,!?;:"'()]+$/g, '')}</span>${suffix}`;
    } else {
      // 其他内容（标点符号、空格等）
      return word;
    }
  });
  
  // 重新组合文本
  elements.contextText.innerHTML = processedWords.join('');
  
  // 为可点击的普通单词添加点击事件
  const clickableElements = elements.contextText.querySelectorAll('.clickable-word');
  clickableElements.forEach(element => {
    element.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const word = element.dataset.word;
      showStickyNote(word, e.clientX, e.clientY);
    });
  });
  
  // 更新选项
  currentItem.options.forEach((option, index) => {
    elements.optionBtns[index].textContent = option;
    elements.optionBtns[index].classList.remove('correct', 'incorrect');
  });
  
  // 更新进度
  const progress = ((appState.currentWordIndex + 1) / appState.currentRound.length) * 100;
  elements.progressBar.style.width = `${progress}%`;
  elements.progressText.textContent = `${appState.currentWordIndex + 1}/${appState.currentRound.length}`;
}

// 显示便利贴
function showStickyNote(word, x, y) {
  const meaning = getWordMeaning(word);
  
  elements.stickyWord.textContent = word;
  elements.stickyMeaning.textContent = meaning;
  
  // 计算便利贴位置
  const noteWidth = 250;
  const noteHeight = 150;
  
  let left = x + 20;
  let top = y - 50;
  
  // 确保便利贴不会超出屏幕
  if (left + noteWidth > window.innerWidth) {
    left = x - noteWidth - 20;
  }
  
  if (top + noteHeight > window.innerHeight) {
    top = window.innerHeight - noteHeight - 20;
  }
  
  if (top < 20) {
    top = 20;
  }
  
  if (left < 10) {
    left = 10;
  }
  
  elements.stickyNote.style.left = `${left}px`;
  elements.stickyNote.style.top = `${top}px`;
  elements.stickyNote.classList.remove('hidden');
  elements.stickyNote.style.pointerEvents = 'auto';
}

// 隐藏便利贴
function hideStickyNote() {
  elements.stickyNote.classList.add('hidden');
  elements.stickyNote.style.pointerEvents = 'none';
}

// 处理选项点击
function handleOptionClick(e) {
  const selectedIndex = parseInt(e.target.dataset.index);
  const currentItem = appState.currentRound[appState.currentWordIndex];
  
  // 禁用所有选项按钮
  elements.optionBtns.forEach(btn => {
    btn.disabled = true;
  });
  
  // 标记正确和错误选项
  elements.optionBtns.forEach((btn, index) => {
    if (index === currentItem.correctIndex) {
      btn.classList.add('correct');
    } else if (index === selectedIndex) {
      btn.classList.add('incorrect');
    }
  });
  
  // 更新单词熟悉度
  const word = currentItem.word;
  if (!appState.wordFamiliarity[word]) {
    appState.wordFamiliarity[word] = 0;
  }
  
  if (selectedIndex === currentItem.correctIndex) {
    appState.wordFamiliarity[word] += 1;
    // 记录单词记忆日期
    appState.wordReviewDates[word] = new Date().toDateString();
  } else {
    appState.wordFamiliarity[word] = Math.max(0, appState.wordFamiliarity[word] - 1);
  }
  
  // 保存熟悉度数据
  saveWordFamiliarity();
  
  // 延迟进入下一个单词
  setTimeout(() => {
    // 启用所有选项按钮
    elements.optionBtns.forEach(btn => {
      btn.disabled = false;
    });
    
    // 进入下一个单词
    appState.currentWordIndex++;
    showCurrentWord();
  }, 1000);
}

// 显示轮次完成屏幕
function showRoundComplete() {
  elements.wordScreen.classList.add('hidden');
  elements.roundCompleteScreen.classList.remove('hidden');
}

// 注册 Service Worker
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('ServiceWorker 注册成功:', registration.scope);
        })
        .catch(error => {
          console.log('ServiceWorker 注册失败:', error);
        });
    });
  }
}

// 初始化应用
window.addEventListener('DOMContentLoaded', initApp);