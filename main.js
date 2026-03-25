// ========== 通用功能 main.js | 已修复弹窗默认状态 ==========
document.addEventListener('DOMContentLoaded', function() {

    // ==============================================
    // 1. 控制面板（拖动已修复）
    // ==============================================
    const controlPanel = document.getElementById('controlPanel');
    const panelMode = document.body.getAttribute('data-panel');

    if (controlPanel) {
        const panelDrag = document.getElementById('dragHandle');
        const panelContent = document.getElementById('panelContent');
        const toggleBtn = document.getElementById('toggleBtn');

        // 默认状态
        if (panelMode === 'close') {
            panelContent.style.display = 'none';
            toggleBtn.textContent = '▼';
        } else {
            panelContent.style.display = 'block';
            toggleBtn.textContent = '▲';
        }

        // ======================
        // ✅ 修复：控制面板拖动
        // ======================
        let isDragging = false;
        let offsetX, offsetY;

        // 按下
        panelDrag.addEventListener('mousedown', function(e) {
            isDragging = true;

            const rect = controlPanel.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            controlPanel.style.left = rect.left + "px";
            controlPanel.style.top = rect.top + "px";
            controlPanel.style.right = "auto";

            e.preventDefault();
        });

        // 移动
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;

            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;

            controlPanel.style.left = x + "px";
            controlPanel.style.top = y + "px";
        });

        // 松开
        document.addEventListener('mouseup', function() {
            isDragging = false;
        });

        // 展开/收起
        toggleBtn.addEventListener('click', function() {
            const hidden = panelContent.style.display === 'none';
            panelContent.style.display = hidden ? 'block' : 'none';
            toggleBtn.textContent = hidden ? '▲' : '▼';
        });
    }

    // ==============================================
    // 2. 主弹窗：data-modal 
    // ==============================================
    const tipsModal = document.getElementById('tipsModal');
    const tipsToggleBtn = document.getElementById('tipsToggleBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const feedbackBtn = document.getElementById('feedbackBtn');
    const modalMode = document.body.getAttribute('data-modal');

    function closeModal() {
        if (tipsModal) tipsModal.style.display = 'none';
        if (tipsToggleBtn) tipsToggleBtn.style.display = 'flex';
    }

    function openModal() {
        if (tipsModal) tipsModal.style.display = 'flex';
        if (tipsToggleBtn) tipsToggleBtn.style.display = 'none';
    }

    // 修复位置：这里现在 100% 生效
    if (modalMode === 'open') {
        openModal();
    } else {
        closeModal();
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    if (tipsToggleBtn) {
        tipsToggleBtn.addEventListener('click', openModal);
    }

    // ==============================================
    // 3. 致谢弹窗
    // ==============================================
    const thanksTag = document.querySelector('.thanks-tag');
    const thanksModal = document.getElementById('thanksModal');
    const thanksCloseBtn = document.getElementById('closeThanksBtn');

    if (thanksTag && thanksModal) {
        thanksTag.addEventListener('click', function() {
            thanksModal.style.display = 'flex';
        });
    }

    if (thanksCloseBtn && thanksModal) {
        thanksCloseBtn.addEventListener('click', function() {
            thanksModal.style.display = 'none';
        });
    }

    // 点击外部关闭
    if (thanksModal) {
        thanksModal.addEventListener('click', function(e) {
            if (e.target === thanksModal) {
                thanksModal.style.display = 'none';
            }
        });
    }


    // ==============================================
    // 4. 图表缩放平移（配合 diagrams.net）
    // ==============================================
    const graph = document.querySelector('.mxgraph');
    if (!graph) return;

    const zoomIn = document.getElementById('zoomInBtn');
    const zoomOut = document.getElementById('zoomOutBtn');
    const zoomReset = document.getElementById('zoomResetBtn');
    const panUp = document.getElementById('panUpBtn');
    const panDown = document.getElementById('panDownBtn');
    const panLeft = document.getElementById('panLeftBtn');
    const panRight = document.getElementById('panRightBtn');

    let scale = 1;
    const step = 0.1;

    if (zoomIn) zoomIn.addEventListener('click', () => { scale += step; graph.style.transform = `scale(${scale})`; });
    if (zoomOut) zoomOut.addEventListener('click', () => { scale -= step; graph.style.transform = `scale(${scale})`; });
    if (zoomReset) zoomReset.addEventListener('click', () => { scale = 1; graph.style.transform = `scale(1)`; });

    const panStep = 50;
    if (panUp) panUp.addEventListener('click', () => graph.scrollTop -= panStep);
    if (panDown) panDown.addEventListener('click', () => graph.scrollTop += panStep);
    if (panLeft) panLeft.addEventListener('click', () => graph.scrollLeft -= panStep);
    if (panRight) panRight.addEventListener('click', () => graph.scrollLeft += panStep);
});
