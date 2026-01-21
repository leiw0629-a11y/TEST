// ===========================================
// 逻辑模块：喂养系统 (Logic Feed)
// ===========================================

// 全局变量：记录批量选中 和 单个喂养选中的科目
let currentBatchSubData = null;
let currentSingleSubData = null; // 新增：单个喂养的当前科目

/**
 * 1. 打开单个喂养弹窗 (重构版：胶囊按钮 + 自动变色)
 */
function openSingleFeed(name) {
    currentFeedName = name;
    
    // 1. 设置标题
    const nameEl = document.getElementById('singleFeedName');
    if(nameEl) nameEl.innerText = name;
    
    // 2. 清空分数输入框
    const scoreInput = document.getElementById('singleScore');
    if(scoreInput) scoreInput.value = '';

    // 3. 渲染科目胶囊
    renderSingleSubjectUI();
    
    // 4. 显示弹窗
    document.getElementById('singleFeedModal').style.display = 'flex';
    
    // 5. 自动聚焦输入框
    setTimeout(() => {
        if(scoreInput) scoreInput.focus();
    }, 100);
	
	// --- 新增：初始化日期选择器 ---
    const dateInput = document.getElementById('singleFeedDate');
    if(dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today; // 默认显示今天
        dateInput.max = today;   // 不允许选未来
    }
}

/**
 * 1. 渲染单个喂养胶囊 (紧凑版：大符号在外部，换行靠左)
 */
function renderSingleSubjectUI() {
    const container = document.getElementById('singleSubjectContainer');
    if (!container) return;
    // 【修改点1】强制把间距改小（比如 4px），这样胶囊就挨得近了
    container.style.gap = '4px';
    container.innerHTML = ''; 

    // 分组
    const posSubs = SUBJECT_LIST.filter(s => s.type === 1);
    const negSubs = SUBJECT_LIST.filter(s => s.type === -1);

    // --- 内部函数：创建胶囊 ---
    const createCapsule = (sub, isFirst) => {
        const btn = document.createElement('div');
        btn.style.cssText = `
            padding: 6px 14px;            /* 内边距缩小一点，更紧凑 */
            border-radius: 50px;
            font-size: 13px;              /* 字号微调 */
            cursor: pointer;
            border: 1px solid #FFEEE4;
            background: #fff;
            color: #8D6E63;
            transition: all 0.2s;
            font-weight: bold;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            user-select: none;
            
            /* 【核心修改】间距变小，换行时自然靠左 */
            margin-right: 0px;  
            margin-bottom: 6px; 
            display: inline-block;        /* 保证流式排列 */
        `;
        btn.innerText = sub.name;
        btn.onclick = () => handleSingleSubjectClick(sub, btn);
        container.appendChild(btn);

        if (isFirst) handleSingleSubjectClick(sub, btn);
    };

    // --- 内部函数：创建大符号 ---
    const createSymbol = (symbol, color) => {
        const icon = document.createElement('div');
        icon.innerText = symbol;
        icon.style.cssText = `
            font-size: 32px; 
            font-weight: 900; 
            color: ${color}; 
            margin-right: 6px;   /* 符号和第一个胶囊的距离 */
            margin-bottom: 6px;  /* 保持垂直对齐 */
            display: inline-flex; 
            align-items: center;
            height: 32px;        /* 高度与胶囊对齐 */
        `;
        container.appendChild(icon);
    }

    // --- 1. 渲染加分区域 ---
    if (posSubs.length > 0) {
        createSymbol('+', '#2E7D32'); // 插入绿色加号
        posSubs.forEach((sub, index) => {
            createCapsule(sub, index === 0);
        });
    }

    // --- 2. 渲染分隔线 ---
    if (posSubs.length > 0 && negSubs.length > 0) {
        const line = document.createElement('div');
        // width: 100% 强制换行并在中间画线
        line.style.cssText = 'width: 100%; border-bottom: 2px dashed #EEEEEE; margin: 4px 0 10px 0;';
        container.appendChild(line);
    }

    // --- 3. 渲染扣分区域 ---
    if (negSubs.length > 0) {
        createSymbol('-', '#C62828'); // 插入红色减号
        negSubs.forEach(sub => {
            createCapsule(sub, false);
        });
    }
}

/**
 * 2. 处理点击 (修改：切换时直接清空 + 变灰)
 */
function handleSingleSubjectClick(sub, targetBtn) {
    currentSingleSubData = sub;
    
    // --- A. 胶囊样式重置 (全变默认) ---
    const container = document.getElementById('singleSubjectContainer');
    // 注意：container.children 里现在混杂了 div 分隔线，需要过滤一下或者只重置胶囊
    Array.from(container.children).forEach(el => {
        // 【修改点】排除掉 + 和 - 符号，只重置真正的科目按钮
        if(el.innerText && el.innerText !== '+' && el.innerText !== '-') { 
            el.style.background = '#fff';
            el.style.color = '#8D6E63'; 
            el.style.borderColor = '#FFEEE4';
            el.style.transform = 'scale(1)';
        }
    });

    // --- B. 选中样式 (绿/红文字，空心背景) ---
    const isPositive = (sub.type === 1);
    const activeColor = isPositive ? '#2E7D32' : '#C62828'; // 绿 / 红
    const activeBg    = isPositive ? '#E8F5E9' : '#FFEBEE'; 
    
    targetBtn.style.background = activeBg;
    targetBtn.style.color = activeColor;
    targetBtn.style.borderColor = activeColor;
    targetBtn.style.transform = 'scale(1.05)';

    // --- C. 【核心修改】直接清空输入框 + 样式变灰 ---
    const input = document.getElementById('singleScore');
    if(input) {
        input.value = ''; // 直接清空
        input.focus();    // 聚焦
        
        // 恢复成灰色默认态
        input.style.color = '#BDBDBD';        // 浅灰色文字
        input.style.borderBottomColor = '#E0E0E0'; // 浅灰色下划线
    }

    // --- D. 重置底部预览 ---
    updateSingleFeedPreview('');
}

/**
 * 3. 处理输入 (修改：输入内容后才变色)
 */
function handleSingleInput(input) {
    if (!currentSingleSubData) return;

    let val = input.value;
    let rawNum = val.replace(/[^0-9]/g, ''); 
    
    // 1. 处理数值 (强制负号逻辑保持不变)
    if (rawNum === '') {
        input.value = ''; 
    } else {
        if (currentSingleSubData.type === -1) {
            input.value = '-' + rawNum;
        } else {
            input.value = rawNum;
        }
    }

    // 2. 【核心修改】样式响应 (有值变色，无值变灰)
    if (rawNum.length > 0) {
        // 有数字：根据类型变成 绿 或 红
        const isPositive = (currentSingleSubData.type === 1);
        const activeColor = isPositive ? '#2E7D32' : '#C62828';
        
        input.style.color = activeColor;
        input.style.borderBottomColor = activeColor;
    } else {
        // 没数字：变回灰色
        input.style.color = '#BDBDBD';
        input.style.borderBottomColor = '#E0E0E0';
    }

    // 3. 实时预览
    updateSingleFeedPreview(input.value);
}
/**
 * 3. 实时预览计算 (修改版：文字固定深咖色，仅数字变色 + 金币Emoji)
 */
function updateSingleFeedPreview(val) {
    const hint = document.getElementById('singleScoreHint');
    if (!hint) return;
    
    // 1. 基础校验
    if (!currentSingleSubData || !val || val === '-' || val === '') {
        hint.innerText = '请选择科目并输入分值';
        hint.style.color = '#999';
        return;
    }

    const score = parseInt(val); 
    if (isNaN(score)) return;

    // 2. 获取配置
    const expRate = (window.CONFIG && window.CONFIG.expRate) || 1;
    const pointRate = (window.CONFIG && window.CONFIG.pointRate) || 1;

    // 3. 计算数值
    const pointsChange = Math.floor(score * pointRate);
    const expChange = (score > 0) ? Math.floor(score * expRate) : 0;

    // --- 样式定义 ---
    // labelStyle: 固定深咖色 (用于中文文字、Exp、积分、符号等)
    const labelStyle = 'color: #795548; font-weight: bold;';
    
    // valueStyle: 动态颜色 (用于纯数字，绿或红)
    const valueColor = (score > 0) ? '#2E7D32' : '#C62828';
    const valueStyle = `color: ${valueColor}; font-weight: bold; margin-left: 2px;`;

    // --- 生成 HTML ---
    if (score > 0) {
        // 加分预览：Exp 和 积分🪙 是深咖色，只有 +5 和 +10 是绿色
        hint.innerHTML = `
            <span style="${labelStyle}">预计获得：</span>
            <span style="${labelStyle}">Exp</span><span style="${valueStyle}">+${expChange}</span>
            <span style="${labelStyle} margin: 0 5px;">|</span>
            <span style="${labelStyle}">积分🪙</span><span style="${valueStyle}">+${pointsChange}</span>
        `;
    } else {
        // 扣分预览：积分🪙 是深咖色，-10 是红色
        hint.innerHTML = `
            <span style="${labelStyle}">预计扣除：</span>
            <span style="${labelStyle}">积分🪙</span><span style="${valueStyle}">${pointsChange}</span>
            <span style="${labelStyle} font-size: 12px; margin-left: 6px; opacity: 0.8;">(经验不变)</span>
        `;
    }
}

/**
 * 2. 新增：通用的侧边栏 UI 抓取过滤函数
 */
function filterAnaSidebarBySearch() {
    const keyword = document.getElementById('ana_sidebar_Search').value.trim().toLowerCase();
    const cards = document.querySelectorAll('#ana_target_list .student-card');

    cards.forEach(card => {
        const nameEl = card.querySelector('.card-name');
        if (nameEl) {
            const nameText = nameEl.textContent.toLowerCase();
            // 匹配则显示，不匹配则隐藏 (保持 flex 布局)
            card.style.display = nameText.includes(keyword) ? "flex" : "none";
        }
    });
}

/**
 * 2. 提交单个喂养 (重构版：自动处理正负号)
 */
function submitSingleFeed() {
    const scoreStr = document.getElementById('singleScore').value;
    
    // 校验
    if (!scoreStr) return showToast("⚠️ 请输入分数");
    if (!currentSingleSubData) return showToast("⚠️ 请选择科目");

    // 查找学生
    const idx = students.findIndex(s => s.name === currentFeedName);
    if (idx === -1) return;

    // 核心逻辑：自动判断正负号
    // 用户输入 "10"，如果当前是“违纪”，则 logicScore = -10
    let rawVal = Math.abs(parseInt(scoreStr)); // 确保获取绝对值
    if (rawVal === 0) return showToast("⚠️ 分数不能为 0");

    // 根据科目类型决定最终符号
    const finalScore = (currentSingleSubData.type === -1) ? -rawVal : rawVal;

    // 获取当前时间
// 获取选中的归属日期
    const dateInput = document.getElementById('singleFeedDate');
    const targetDate = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
	
    const oldLevel = students[idx].level;
    
    // 调用核心加分函数
    addPoints(idx, finalScore, currentSingleSubData.name, targetDate);
    
    // 升级检测
    if (students[idx].level > oldLevel) showLevelUpModal(idx);

    // 保存与刷新
    saveData();
    refreshUI();
    closeModal('singleFeedModal');
    
    // 提示语差异化
    const actionText = (finalScore > 0) ? "投喂成功！" : "记录成功！";
    showToast(`🥕 ${actionText}`);
}

/**
 * 打开批量喂养弹窗 (逻辑保持不变，但为了代码完整性列出)
 */
function openBatchModal() {
    if (students.length === 0) return alert("请先导入名单");
    const dateInput = document.getElementById('batchFeedDate');
	
    if(dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today; // 默认显示今天
        dateInput.max = today;   // 不允许选未来
    }
    const classSelect = document.getElementById('classSelect'); 
    const selectedClass = classSelect ? classSelect.value : 'all';

    const titleEl = document.getElementById('batchTitleText');
    if (titleEl) {
        const classNameDisplay = selectedClass === 'all' ? '全校' : selectedClass;
        titleEl.innerText = `⚡ ${classNameDisplay} 批量成绩录入`;
    }

    renderBatchSubjectUI();

    const tbody = document.getElementById('batchTableBody');
    tbody.innerHTML = '';
    
    let visibleCount = 0;
    students.forEach((stu, idx) => {
        if (selectedClass !== 'all' && stu.className !== selectedClass) return;
        visibleCount++;

        const cp = stu.currentPoints === undefined ? (stu.totalPoints || 0) : stu.currentPoints;
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td style="font-weight:bold; color:#5D4037; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${stu.name}</td>
            <td style="color:#FF8A65; font-weight:bold;">🪙${cp}</td>
            <td>
                <input type="tel" class="batch-input score-input form-input" 
                       data-name="${stu.name}" 
                       data-idx="${idx}" 
                       oninput="this.value = this.value.replace(/[^0-9]/g, '')" 
                       placeholder="分值" 
                       style="width: 90% !important; height: 32px; line-height: 32px; text-align: center; background: #FFFBF7; margin: 0 auto; display: block;">
            </td>
            <td id="prev-info-${idx}" style="color:#ccc; font-size:12px; font-weight:bold; white-space:nowrap;">-</td>
        `;
        tbody.appendChild(tr);
    });
    
    if (visibleCount === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#999; padding:20px;">该班级暂无学生数据</td></tr>';
    }
    
    document.getElementById('batchModal').style.display = 'flex';
    
    setTimeout(() => { const i = document.querySelector('.score-input'); if(i) i.focus(); }, 300);
    
    // 绑定回车切换
    const scoreInputs = document.querySelectorAll('.score-input');
    scoreInputs.forEach((input, index) => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const nextInput = scoreInputs[index + 1];
                if (nextInput) nextInput.focus();
            }
        });
    });
}

/**
 * 渲染批量左侧的科目胶囊按钮
 */
function renderBatchSubjectUI() {
    const posContainer = document.getElementById('batchPosTags');
    const negContainer = document.getElementById('batchNegTags');
    
    if(!posContainer || !negContainer) return;

    posContainer.innerHTML = '';
    negContainer.innerHTML = '';

    let firstItem = null;

    SUBJECT_LIST.forEach(sub => {
        const btn = document.createElement('div');
        btn.className = 'batch-sub-tag'; 
        btn.style.cssText = `
            padding: 6px 12px; 
            border-radius: 50px; 
            font-size: 13px; 
            cursor: pointer; 
            border: 1px solid #FFEEE4; 
            background: #fff; 
            color: #8D6E63; 
            transition: all 0.2s;
            font-weight: bold;
            display: inline-block;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        `;
        btn.innerText = sub.name;
        btn.dataset.name = sub.name;
        btn.dataset.type = sub.type;
        
        btn.onclick = () => handleBatchSubjectClick(sub.name, sub.type);

        if (sub.type == 1) posContainer.appendChild(btn);
        else negContainer.appendChild(btn);

        if (!firstItem) firstItem = sub;
    });

    if(firstItem) {
        handleBatchSubjectClick(firstItem.name, firstItem.type);
    }
}

/**
 * 处理批量左侧科目点击逻辑
 */
function handleBatchSubjectClick(name, type) {
    currentBatchSubData = { name, type };
    
    const todayStr = new Date().toISOString().split('T')[0]; 
    const label = document.getElementById('selectedBatchSubjectLabel');
    if(label) {
        label.innerHTML = `${name} ${type == 1 ? '(加分)' : '(扣分)'}`;
        label.style.color = (type == 1) ? '#2E7D32' : '#C62828';
    }

    const allTags = document.querySelectorAll('.batch-sub-tag');
    allTags.forEach(tag => {
        tag.style.background = '#fff';
        tag.style.color = '#8D6E63';
        tag.style.borderColor = '#FFEEE4';
        tag.style.transform = 'scale(1)';
        tag.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
        
        if (tag.dataset.name === name) {
            if (type == 1) {
                tag.style.background = '#E8F5E9';
                tag.style.color = '#2E7D32';
                tag.style.borderColor = '#2E7D32';
                tag.style.boxShadow = '0 2px 6px rgba(46, 125, 50, 0.2)';
            } else {
                tag.style.background = '#FFEBEE';
                tag.style.color = '#C62828';
                tag.style.borderColor = '#C62828';
                tag.style.boxShadow = '0 2px 6px rgba(198, 40, 40, 0.2)';
            }
            tag.style.transform = 'scale(1)'; 
        }
    });

    const inputs = document.querySelectorAll('.score-input');
    inputs.forEach(inp => {
        inp.value = ''; 
        const idx = inp.getAttribute('data-idx');
        const infoEl = document.getElementById(`prev-info-${idx}`);
        if(infoEl) {
            infoEl.innerText = '-';
            infoEl.style.color = '#ccc';
        }
    });
}

/**
 * 提交批量喂养
 */
function submitBatchFeed() {
    if (!currentBatchSubData) return alert("请先选择科目！");

    const inputs = document.querySelectorAll('.score-input');
    // 获取选中的归属日期
    const dateInput = document.getElementById('batchFeedDate');
    const targetDate = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
    
    // ...
   
    
    let count = 0; 
    let levelUpCount = 0;
    
    inputs.forEach(inp => {
        if(inp.value !== '') {
            const idx = students.findIndex(s => s.name === inp.getAttribute('data-name'));
            if(idx !== -1) { 
                const oldLevel = students[idx].level;
                
                let rawVal = Math.abs(parseInt(inp.value));
                let finalScore = (currentBatchSubData.type == -1) ? -rawVal : rawVal;

                 // 在循环内部调用 addPoints
    addPoints(idx, finalScore, currentBatchSubData.name, targetDate);
                count++; 
                if (students[idx].level > oldLevel) levelUpCount++;
            }
        }
    });
    
    if(count) { 
        saveData(); 
        refreshUI(); 
        let msg = `⚡ ${currentBatchSubData.name} 录入 ${count} 条！`;
        if (levelUpCount > 0) msg += `\n🎉 有 ${levelUpCount} 人升级了！`;
        showToast(msg); 
        closeModal('batchModal'); 
    } else {
        showToast("⚠️ 没有检测到输入分值");
    }
}

/**
 * 显示升级特效弹窗 (保持不变)
 */
function showLevelUpModal(idx) {
    const stu = students[idx];
    const pet = getPetInfo(stu);
    const elName = document.getElementById('levelUpName');
    const elTitle = document.getElementById('levelUpTitle');
    const elImg = document.getElementById('levelUpImgContainer');
    const elModal = document.getElementById('levelUpModal');

    if(elName) elName.innerText = stu.name;
    if(elTitle) elTitle.innerText = pet.title;
    
    let bigImgHtml = pet.html;
    if(bigImgHtml.includes('<img')) {
        bigImgHtml = bigImgHtml.replace('class="pet-avatar"', 'style="width:300px; height:300px; object-fit:contain; filter:drop-shadow(0 5px 10px rgba(0,0,0,0.2));"');
    } else {
        bigImgHtml = bigImgHtml.replace('class="pet-avatar"', 'style="font-size:120px;"');
    }
    
    if(elImg) elImg.innerHTML = bigImgHtml;
    if(elModal) {
        elModal.style.zIndex = "3001"; 
        elModal.style.display = 'flex';
    }
}

// 批量喂养的实时预览监听 (适配正负自动着色)
document.addEventListener('input', function(e){
    if(e.target.classList.contains('score-input')) {
        const input = e.target;
        const scoreStr = input.value;
        const idx = input.getAttribute('data-idx'); 
        const infoEl = document.getElementById(`prev-info-${idx}`);
        
        if (!currentBatchSubData || !infoEl) return;

        if (scoreStr === '') {
            infoEl.innerText = '-'; 
            infoEl.style.color = '#ccc';
            return;
        }

        const rawVal = Math.abs(parseInt(scoreStr)); 
        const isNegative = (currentBatchSubData.type == -1);
        const finalScore = isNegative ? -rawVal : rawVal;

        const pointsChange = Math.floor(finalScore * CONFIG.pointRate);
        const expChange = (finalScore > 0) ? Math.floor(finalScore * CONFIG.expRate) : 0;

        let html = '';
        if (isNegative) {
            html = `<span style=" font-size: 13px; color:#C62828;">积分🪙${pointsChange}</span>`;
        } else {
            html = `<span style="font-size: 13px;color:#795548; margin-right:4px;">Exp+${expChange}</span> <span style="font-size: 13px;color:#2E7D32;">🪙+${pointsChange}</span>`;
        }

        infoEl.innerHTML = html;
        infoEl.style.color = isNegative ? '#C62828' : '#2E7D32';
    }
});
