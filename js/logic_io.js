/**
 * 导出当前完整存档为 .json 文件
 */
async function exportDataWithPicker() {
    // 1. 准备数据
    const exportData = {
        version: "2.0",
        timestamp: new Date().toLocaleString(),
        docTitle: docTitle, 
        config: CONFIG,
        subjects: SUBJECT_LIST,
        rules: EVOLUTION_RULES,
        students: students,
        history: historyData,
        products: products
    };
    const jsonString = JSON.stringify(exportData, null, 4);

    // ==========================================
    // 🕒 核心修改：生成纯净文件名 (无"存档"字样，无重复)
    // ==========================================
    
    // 1. 生成当前时间 (格式：20260121_093005)
    const now = new Date();
    const timeStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

    // 2. 清洗 docTitle (还原出最干净的标题)
    let cleanTitle = docTitle;

    // 正则 A：去掉旧的时间戳 (匹配结尾的 _8位数字_6位数字)
    // 例如： "萌宠养成记_20221212_122343" -> "萌宠养成记"
    const datePattern = /_?\d{8}_\d{6}$/; 
    if (datePattern.test(cleanTitle)) {
        cleanTitle = cleanTitle.replace(datePattern, '');
    }

    // 正则 B：去掉以前残留的 "_存档" 字样
    // 例如： "萌宠养成记_存档" -> "萌宠养成记"
    // 如果您之前的标题里已经堆积了 "萌宠养成记_存档_存档"，这里会把最后一个去掉
    // 建议用循环彻底洗净，或者只去尾部即可，通常去尾部就够了
    const archivePattern = /_?存档$/;
    while (archivePattern.test(cleanTitle)) {
        cleanTitle = cleanTitle.replace(archivePattern, '');
    }

    // 3. 拼接最终文件名
    // 格式： 干净标题_新时间.json
    // 注意：这里中间删除了 "存档" 两个字
    const fileName = `${cleanTitle}_${timeStr}.json`;

    // ==========================================
    // 🕒 修改结束
    // ==========================================

    try {
        if (window.showSaveFilePicker) {
            const handle = await window.showSaveFilePicker({
                suggestedName: fileName,
                types: [{
                    description: 'JSON Files',
                    accept: { 'application/json': ['.json'] }
                }]
            });
            const writable = await handle.createWritable();
            await writable.write(jsonString);
            await writable.close();
        } else {
            // 兼容模式
            const blob = new Blob([jsonString], { type: "application/json" });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            link.click();
            URL.revokeObjectURL(link.href);
        }
        isDataDirty = false;
        showToast("💾 导出成功！");
    } catch (error) {
        if (error.name !== 'AbortError') showToast("❌ 导出失败");
    }
}
