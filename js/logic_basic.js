/**
 * 基础设置模块 - 数据双向绑定逻辑
 */

// 打开弹窗时的初始化
function openBaseConfigModal() {
    const modal = document.getElementById('baseConfigModal');
    if (!modal) return;
    
    // 如果没有引入 basicSet 模板，先加载（防止报错）
    if (!document.getElementById('baseConfigModal') && window.AppTemplates && window.AppTemplates.basicSet) {
         document.body.insertAdjacentHTML('beforeend', window.AppTemplates.basicSet);
    }
    
    modal.style.display = 'flex';

    // 填充左侧数字项
    document.getElementById('cfg_exp_rate').value = (CONFIG.expRate !== undefined) ? CONFIG.expRate : "";
    document.getElementById('cfg_point_rate').value = (CONFIG.pointRate !== undefined) ? CONFIG.pointRate : "";
    document.getElementById('cfg_level_exp').value = (CONFIG.pointsPerLevel !== undefined) ? CONFIG.pointsPerLevel : "";
    
    const evoInput = document.getElementById('cfg_evo_rules');
    if (evoInput) {
        evoInput.value = (EVOLUTION_RULES && EVOLUTION_RULES.length > 0) ? EVOLUTION_RULES.join(',') : "";
    }

    // --- 核心改动：默认查看加分项 (Type=1) ---
    SubjectTagHandler.currentViewType = 1; 
    SubjectTagHandler.updateTabStyles(); // 刷新Tab样式
    SubjectTagHandler.renderTags();      // 刷新列表

    // 清空下方的输入框
    if(document.getElementById('v2-input-plus')) document.getElementById('v2-input-plus').value = "";
    if(document.getElementById('v2-input-minus')) document.getElementById('v2-input-minus').value = "";
}

const SubjectTagHandler = {
    // 状态：1 代表加分项，-1 代表扣分项
    currentViewType: 1,

    // --- 1. 切换查看的类型 (由 HTML 点击触发) ---
    switchView: function(type) {
        this.currentViewType = type;
        this.updateTabStyles();
        this.renderTags();
    },

    // --- 2. 更新 Tab 的高亮样式 ---
    updateTabStyles: function() {
        const tabPlus = document.getElementById('v2-tab-tag-plus');
        const tabMinus = document.getElementById('v2-tab-tag-minus');
        
        if(tabPlus && tabMinus) {
            tabPlus.classList.remove('active');
            tabMinus.classList.remove('active');
            
            if (this.currentViewType === 1) {
                tabPlus.classList.add('active');
            } else {
                tabMinus.classList.add('active');
            }
        }
    },

    // --- 3. 渲染科目标签 (带过滤) ---
    renderTags: function() {
        const tagContainer = document.getElementById('cfg_subject_tags');
        if (!tagContainer) return;

        tagContainer.innerHTML = '';

        // 过滤：只显示当前 type 的科目
        // 注意：script.js 中定义的数据结构是 { name: "语文", type: 1 }
        const filteredList = SUBJECT_LIST.filter(item => item.type === this.currentViewType);

        if (!filteredList || filteredList.length === 0) {
            const typeName = this.currentViewType === 1 ? "加分" : "扣分";
            tagContainer.innerHTML = `<div class="v2-cfg-empty-hint">当前暂无${typeName}科目...</div>`;
            return;
        }

        filteredList.forEach((item) => {
            const tag = document.createElement('div');
            tag.className = 'v2-cfg-tag';
            // 样式微调：扣分项可以用红色背景，这里仅做基础展示
            tag.style.borderColor = this.currentViewType === 1 ? '#C8E6C9' : '#FFCDD2';
            tag.style.backgroundColor = this.currentViewType === 1 ? '#E8F5E9' : '#FFEBEE';
            
            tag.innerHTML = `
                <span>${item.name}</span>
                <span class="tag-del" onclick="SubjectTagHandler.removeTag('${item.name}', ${item.type})">×</span>
            `;
            tagContainer.appendChild(tag);
        });
    },

    // --- 4. 删除科目逻辑 (按名称和类型删除) ---
    removeTag: function(name, type) {
        if (confirm(`确定要删除科目「${name}」吗？`)) {
            // 找到在原数组中的索引
            const realIndex = SUBJECT_LIST.findIndex(item => item.name === name && item.type === type);
            
            if (realIndex !== -1) {
                SUBJECT_LIST.splice(realIndex, 1);
                saveData(); // 调用 script.js 的保存
                if(typeof refreshUI === 'function') refreshUI();
                
                // 重新渲染当前列表
                this.renderTags();
                if(typeof showToast === 'function') showToast(`🗑️ 已删除「${name}」`);
            }
        }
    }
};

const BasicConfigHandler = {
    // --- 1. 初始化并打开弹窗 (保留原有逻辑，对接新入口) ---
    open: function() {
        openBaseConfigModal();
    },

    // --- 2. 提取数据并保存 (核心改动：分别处理两个输入框) ---
    save: function() {
        const modal = document.getElementById('baseConfigModal');

        // A. 保存基础参数 (数字配置)
        CONFIG.expRate = parseInt(document.getElementById('cfg_exp_rate').value) || 0;
        CONFIG.pointRate = parseInt(document.getElementById('cfg_point_rate').value) || 0;
        CONFIG.pointsPerLevel = parseInt(document.getElementById('cfg_level_exp').value) || 100;

        let levelStr = document.getElementById('cfg_evo_rules').value;
        if (levelStr) {
            EVOLUTION_RULES = levelStr.replace(/，/g, ',').split(',')
                .map(item => parseInt(item.trim())).filter(num => !isNaN(num));
        }

        // B. 获取输入框内容并构建对象
        const pInput = document.getElementById('v2-input-plus');
        const mInput = document.getElementById('v2-input-minus');
        
        // 辅助函数：解析文本并添加到列表
        const addItems = (text, typeVal) => {
            if (!text) return;
            const lines = text.split('\n').map(s => s.trim()).filter(s => s !== "");
            lines.forEach(name => {
                // 查重：名字和类型都一样才算重复
                const exists = SUBJECT_LIST.some(existing => existing.name === name && existing.type === typeVal);
                if (!exists) {
                    SUBJECT_LIST.push({ name: name, type: typeVal });
                }
            });
        };

        // 分别处理加分框(type=1) 和 扣分框(type=-1)
        addItems(pInput.value, 1);
        addItems(mInput.value, -1);

        // 清空输入框
        pInput.value = "";
        mInput.value = "";

        // C. 执行保存和刷新
        saveData();
        if(typeof refreshUI === 'function') refreshUI();
        
        // 关闭弹窗前重新渲染一下列表，或者直接关闭
        SubjectTagHandler.renderTags(); 
        
        modal.style.display = 'none';
        if(typeof showToast === 'function') showToast("💾 配置已保存");
    }
};