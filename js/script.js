// ================= 数据中心 =================
let students = []; 
let products = {};
let historyData = []; 
let currentFeedName = ''; 
let currentDetailName = ''; 
let docTitle = '萌宠成绩养成记'; 
let isDataDirty = false; 

let CONFIG = { 
    pointsPerLevel: 100, 
    expRate: 1.0,   
    pointRate: 1.0,  
    password: "888888" 
};

// 1. 直接定义为对象数组
let SUBJECT_LIST = [];

let EVOLUTION_RULES = [3, 6, 10, 20]; 

let PET_LIBRARY = {
    "xiongmao": { 
        images: ["img/xiongmao/1.png", "img/xiongmao/2.png", "img/xiongmao/3.png", "img/xiongmao/4.png", "img/xiongmao/5.png"], 
        titles: ["翡翠青竹", "功夫学徒", "竹林侠客", "宗师风范", "神龙尊者"] 
    },
    "jingling": { 
        images: ["img/jingling/1.png", "img/jingling/2.png", "img/jingling/3.png", "img/jingling/4.png", "img/jingling/5.png"], 
        titles: ["魔法之心", "森林微光", "元素使者", "月光贤者", "水晶天使"] 
    },
    "linghu": { 
        images: ["img/linghu/1.png", "img/linghu/2.png", "img/linghu/3.png", "img/linghu/4.png", "img/linghu/5.png"], 
        titles: ["祈愿宝珠", "灵山幼狐", "九尾灵狐", "青丘国主", "祥瑞天女"] 
    },
    "renyu": { 
        images: ["img/renyu/1.png", "img/renyu/2.png", "img/renyu/3.png", "img/renyu/4.png", "img/renyu/5.png"], 
        titles: ["深海灵珠", "人鱼公主", "海潮歌者", "深蓝女皇", "海洋天使"] 
    },
    "konglong": { 
        images: ["img/konglong/1.png", "img/konglong/2.png", "img/konglong/3.png", "img/konglong/4.png", "img/konglong/5.png"], 
        titles: ["远古龙蛋", "机甲幼龙", "合金暴龙", "机械领主", "机甲龙神"] 
    }
};

// ================= 公共工具函数 =================

function formatAnyTime(timeInput) {
    if (!timeInput && timeInput !== 0) return ""; 
    let date;
    if (timeInput instanceof Date) {
        date = timeInput;
    } else if (typeof timeInput === 'number') {
        date = new Date((timeInput - 25569) * 86400 * 1000); 
    } else if (typeof timeInput === 'string') {
        if(timeInput.includes('T')) date = new Date(timeInput);
        else date = new Date(timeInput.replace(/-/g, '/'));
    }
    if (!date || isNaN(date.getTime())) return String(timeInput);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hh}:${mm}:${ss}`;
}

// 时间范围判断辅助函数 (左侧排行榜和右侧列表都用这个)
function isTimeInRange(recordTimeStr, rangeType, startDate, endDate) {
    if (rangeType === 'all') return true;

    const recordDate = new Date(recordTimeStr);
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    let targetDate = new Date(now);

    if (rangeType === 'week') {
        targetDate.setDate(now.getDate() - 7);
    } else if (rangeType === 'month') {
        targetDate.setMonth(now.getMonth() - 1);
    } else if (rangeType === 'year') {
        targetDate.setFullYear(now.getFullYear() - 1);
    } else if (rangeType === 'custom') {
        const sDate = new Date(startDate); sDate.setHours(0,0,0,0);
        const eDate = new Date(endDate); eDate.setHours(23,59,59,999);
        return recordDate >= sDate && recordDate <= eDate;
    }
    return recordDate >= targetDate;
}

function getPetInfo(student) {
    let pathKey = student.petPath || "xiongmao"; 
    if (!PET_LIBRARY[pathKey]) pathKey = "xiongmao";
    const libraryItem = PET_LIBRARY[pathKey];
    const pathImages = libraryItem.images || [];
    const pathTitles = libraryItem.titles || [];
    let stageIndex = 0;
    for (let i = 0; i < EVOLUTION_RULES.length; i++) { if (student.level >= EVOLUTION_RULES[i]) stageIndex = i + 1; }
    if (stageIndex >= pathImages.length) stageIndex = pathImages.length - 1;
    let media = pathImages[stageIndex] || "❓";
    let title = pathTitles[stageIndex] || `${pathKey} (阶${stageIndex+1})`;
    let styleClass = ""; if (stageIndex >= 2) styleClass = "mid"; if (stageIndex >= 4) styleClass = "high";
    let htmlContent = '';
    if (media.match(/\.(jpeg|jpg|gif|png|webp)$/i) || media.startsWith('http')) {
        htmlContent = `<img src="${media}" class="pet-avatar" alt="pet" onerror="this.onerror=null;this.parentNode.innerHTML='<span class=\\'pet-avatar\\'>🥚</span>';">`;
    } else { htmlContent = `<span class="pet-avatar">${media}</span>`; }
    return { html: htmlContent, raw: media, title: title, class: styleClass, pathName: pathKey };
}

function showToast(msg) {
    const toast = document.getElementById('centerToast');
    if(!toast) return;
    document.getElementById('toastMsg').innerText = msg;
    toast.style.display = 'block'; toast.style.opacity = '0';
    toast.animate([{opacity: 0, transform: 'translate(-50%, -40%)'}, {opacity: 1, transform: 'translate(-50%, -50%)'}], {duration: 300, fill: 'forwards'});
    if (msg !== "📤 数据导出中，请稍候...") setTimeout(() => { toast.style.display = 'none'; }, 2000);
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// ================= 初始化与核心流程 =================

window.addEventListener('beforeunload', function (e) {
    if (isDataDirty) { e.preventDefault(); e.returnValue = ''; return ''; }
});

// === 人性化操作：点击日期输入框任意位置均弹出日历选择器 ===
document.addEventListener('click', function(e) {
    // 检查点击的对象是否是日期输入框（通过类名判断，不影响其他逻辑）
    if (e.target && e.target.classList.contains('v2-filter-date-input')) {
        try {
            // 调用原生的 showPicker() 方法（现代浏览器支持）
            if (typeof e.target.showPicker === 'function') {
                e.target.showPicker();
            }
        } catch (err) {
            // 如果浏览器不支持 showPicker，它依然会保持原有的点击小图标弹出的行为
            console.log("浏览器暂不支持自动弹出日历");
        }
    }
});

window.onload = function() {
    const savedData = localStorage.getItem('petGameData');
    if (savedData) {
        const parsed = JSON.parse(savedData);
        students = parsed.students || [];
		
		// 2. 【核心修复】必须把历史记录也读回来！
        // 如果没有这行，刷新后 historyData 就是空的，图表自然也就没数据了
        historyData = parsed.history || [];
        // 兼容旧产品数据
        if (parsed.products && !Array.isArray(parsed.products)) {
            products = parsed.products;
        } else {
            products = {}; 
        }
        
        if(parsed.subjects) SUBJECT_LIST = parsed.subjects;
        if(parsed.rules) EVOLUTION_RULES = parsed.rules;
        if(parsed.title) docTitle = parsed.title;
        // document.getElementById('mainTitle').innerText = `🔥 ${docTitle} 萌宠养成`;
        
        refreshUI();
        
        if (CONFIG.password) {
            // lockScreen(); 刷新锁屏
        }
    } else { 
        initDemoData(); 
        if(CONFIG.password) lockScreen();
    }
    
    setTimeout(() => { isDataDirty = false; }, 500); 
    
    const today = new Date().toISOString().split('T')[0];
    const bDate = document.getElementById('batchDate');
    const sDate = document.getElementById('singleDate');
    if(bDate) bDate.value = today;
    if(sDate) sDate.value = today;
	
	
};


function initDemoData() {
    students = [];
	products = {};
    historyData = [];
    saveData(); 
    refreshUI();
}

function saveData() {
    const data = { students, history: historyData, config: CONFIG, subjects: SUBJECT_LIST, title: docTitle, rules: EVOLUTION_RULES, products };
    localStorage.setItem('petGameData', JSON.stringify(data));
}

// 全局刷新入口 (协调各个模块)
function refreshUI() {
    // 1. 调用 logic_table.js 的函数
    if(typeof initClassOptions === 'function') initClassOptions();
    if(typeof renderMainTable === 'function') renderMainTable();

    // 2. 调用 logic_rank.js 的函数
    if(typeof applyRankFilter === 'function') applyRankFilter();

    // 3. 本地刷新
    renderSubjectDropdowns(); 
    const configEl = document.getElementById('configDisplay');
    if(configEl) configEl.innerText = `[1级=${CONFIG.pointsPerLevel}经验 | 1分=${CONFIG.expRate}经验 / ${CONFIG.pointRate}积分]`;
	
	// 如果当前正在看分析报表，且分析相关的函数存在，就强制刷新一下图表
    const anaPanel = document.getElementById('ana_left_panel');
    if (anaPanel && anaPanel.style.display === 'flex' && typeof initAllCharts === 'function') {
        // 这里调用 refreshAnalysisPage 会更稳妥，因为它会更新左侧列表（防止人名变了）
        if(typeof refreshAnalysisPage === 'function') {
            refreshAnalysisPage(); 
        } else {
            initAllCharts();
        }
    }
}

// 2. 更新渲染函数以读取 .name 属性
function renderSubjectDropdowns() {
    const ids = ['singleSubject', 'batchSubject'];
    ids.forEach(id => {
        const select = document.getElementById(id);
        if(!select) return;
        select.innerHTML = '';
        SUBJECT_LIST.forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub.name;      // 存储科目名称
            opt.textContent = sub.name; // 显示科目名称
            // 将类型存入 dataset，方便后续逻辑判断（如自动切换正负号）
            opt.dataset.type = sub.type; 
            select.appendChild(opt);
        });
    });
}


/**
 * 核心积分变动函数 (addPoints)
 * 逻辑检查：
 * 1. 喂养/惩罚: 可用积分 (currentPoints) 与 总积分 (accumulatedPoints) 同步增加或减少。
 * 2. 商城兑换: 仅扣除 可用积分，总积分 保持不动。
 */
// [script.js] 替换原有的 addPoints 函数

function addPoints(studentIndex, score, subject, dateStr, isDirectPoints = false) {
    const student = students[studentIndex];
    let pointsChange = 0;
    let expChange = 0;
    let recordScore = 0; 

    // --- 第一步：计算分值变动 (保持不变) ---
    if (isDirectPoints) {
        pointsChange = parseInt(score); 
        expChange = 0; 
        recordScore = pointsChange;
    } else {
        const rawScore = parseInt(score);
        recordScore = rawScore;
        pointsChange = Math.floor(rawScore * CONFIG.pointRate);
        expChange = (rawScore > 0) ? Math.floor(rawScore * CONFIG.expRate) : 0;
    }

    // --- 第二步：更新 可用积分 (保持不变) ---
    if(student.currentPoints === undefined) student.currentPoints = 0;
    student.currentPoints += pointsChange; 

    // --- 第三步：更新 累计总积分 (保持不变) ---
    if(student.accumulatedPoints === undefined) student.accumulatedPoints = 0;
    if (!isDirectPoints) {
        student.accumulatedPoints += pointsChange; 
    }

    // --- 第四步：更新经验和等级 (保持不变) ---
    if (expChange > 0) {
        student.exp += expChange;
        student.totalPoints = (student.totalPoints || 0) + expChange;
        
        while (student.exp >= CONFIG.pointsPerLevel) {
            student.exp -= CONFIG.pointsPerLevel;
            student.level += 1;
        }
    }

    // --- 第五步：写入日志 (这里是核心修改点！) ---
    
    // 1. 系统录入时间：永远记录“此时此刻” (用于追溯是谁什么时候操作的)
    const systemTime = formatAnyTime(new Date());
    
    // 2. 归属日期：使用传入的 dateStr (也就是界面上选择的日期)
    // 如果没传，就默认归属到今天
    // dateStr 格式通常是 "2026-01-20"，非常规范
    const attributionDate = dateStr || new Date().toISOString().split('T')[0];

    historyData.unshift({
        time: systemTime,        // 改动：存入系统当前操作时间
        targetDate: attributionDate, // 新增：存入你选择的“昨天/今天”
        name: student.name,
        subject: subject,
        score: recordScore, 
        expChange: expChange,
        pointsChange: pointsChange,
        isExchange: isDirectPoints && pointsChange < 0, 
        revoked: false
    });
    
    isDataDirty = true;
    return pointsChange;
}

function openAnalysisModal() {
    // 1. 获取元素
    const mainLeft = document.querySelector('.ranking-panel');
    const mainRight = document.querySelector('.list-panel');
    const chatView = document.getElementById('chat_analysis_view');

    // 2. 隐藏原来的左右两块
    if(mainLeft) mainLeft.style.display = 'none';
    if(mainRight) mainRight.style.display = 'none';

    // 3. 显示分析面板
    if(chatView) chatView.style.display = 'block'; 
}

function closeChatAnalysis() {
    const mainLeft = document.querySelector('.ranking-panel');
    const mainRight = document.querySelector('.list-panel');
    const chatView = document.getElementById('chat_analysis_view');

    // 1. 隐藏分析面板
    if(chatView) chatView.style.display = 'none';

    // 2. 恢复显示原来的两块 (恢复 flex 布局的默认显示)
    if(mainLeft) mainLeft.style.display = ''; 
    if(mainRight) mainRight.style.display = '';
}

/**
 * 【通用核心】计算时间范围
 * @param {string} rangeType - 时间类型：week, month, year, custom, all
 * @param {string} startVal - 自定义开始时间 (可选)
 * @param {string} endVal - 自定义结束时间 (可选)
 * @returns {object} { startDate, endDate, label }
 */
function getCommonDateRange(rangeType, startVal, endVal) {
    let endDate = new Date();
    let startDate = new Date();
    
    // 统一设置结束时间为当天的 23:59:59
    endDate.setHours(23, 59, 59, 999);
    // 统一设置开始时间为当天的 00:00:00 (后续计算再调整)
    startDate.setHours(0, 0, 0, 0);

    let label = ""; // 用于报表显示的具体日期
    const formatDate = (d) => `${d.getMonth() + 1}月${d.getDate()}日`;

    if (rangeType === 'week') {
        // 近7天：当前日期 - 6天
        startDate.setDate(endDate.getDate() - 6);
        label = `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
    } 
    else if (rangeType === 'month') {
        // 近一月：固定按30天计算，当前日期 - 29天
        startDate.setDate(endDate.getDate() - 29);
        label = `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
    } 
    else if (rangeType === 'year') {
         // 近一年 (可选)
         startDate.setFullYear(endDate.getFullYear() - 1);
         label = `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
    }
    else if (rangeType === 'custom') {
        // 自定义时间
        if (startVal) startDate = new Date(startVal.replace(/-/g, '/'));
        if (endVal) endDate = new Date(endVal.replace(/-/g, '/'));
        endDate.setHours(23, 59, 59, 999); // 确保自定义结束那一天包含全天
        label = `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
    } 
    else if (rangeType === 'all') {
        // 全部
        startDate = new Date(0); // 1970年
        label = "全部历史数据";
    }

    return { startDate, endDate, label };
}