// ========== 通用功能 main.js | 已修复弹窗默认状态 ==========
document.addEventListener('DOMContentLoaded', function() {

    // ==============================================
    // 1. 控制面板：默认在右上角 + 向右下展开
    // ==============================================
    const controlPanel = document.getElementById('controlPanel');
    const panelMode = document.body.getAttribute('data-panel');

    if (controlPanel) {
        const panelDrag = document.getElementById('dragHandle');
        const panelContent = document.getElementById('panelContent');
        const toggleBtn = document.getElementById('toggleBtn');


        controlPanel.style.position = 'fixed';
        controlPanel.style.top = '10px';      // 顶部贴边
        controlPanel.style.right = '10px';    // 右侧贴边
        controlPanel.style.left = 'auto';      // 取消左边定位
        controlPanel.style.transform = 'none'; // 清除居中
        controlPanel.style.margin = '0';
        controlPanel.style.zIndex = '9999';

        // 默认展开/收起
        if (panelMode === 'close') {
            panelContent.style.display = 'none';
            toggleBtn.textContent = "▼";
        } else {
            panelContent.style.display = 'block';
            toggleBtn.textContent = "▲";
        }

        // ======================
        // 拖动逻辑
        // ======================
        let isDragging = false;
        let startX, startY, origRight, origTop;

        // 开始拖动
        panelDrag.addEventListener('mousedown', function(e) {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            origRight = parseInt(window.getComputedStyle(controlPanel).right);
            origTop = parseInt(window.getComputedStyle(controlPanel).top);
            e.preventDefault();
        });

        panelDrag.addEventListener('touchstart', function(e) {
            isDragging = true;
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            origRight = parseInt(window.getComputedStyle(controlPanel).right);
            origTop = parseInt(window.getComputedStyle(controlPanel).top);
            e.preventDefault();
        });

        // 拖动中
        function movePanel(e) {
            if (!isDragging) return;
            let x, y;
            if (e.type === 'touchmove') {
                x = e.touches[0].clientX;
                y = e.touches[0].clientY;
            } else {
                x = e.clientX;
                y = e.clientY;
            }

            const dx = x - startX;
            const dy = y - startY;

            // 固定右上角拖动
            controlPanel.style.right = (origRight - dx) + "px";
            controlPanel.style.top = (origTop + dy) + "px";
            controlPanel.style.left = "auto";
        }

        document.addEventListener('mousemove', movePanel);
        document.addEventListener('touchmove', movePanel, { passive: false });

        // 结束拖动
        function endDrag() {
            isDragging = false;
        }
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
        document.addEventListener('mouseleave', endDrag);

        // ======================
        // 展开/收起（向右下展开）
        // ======================
        toggleBtn.addEventListener('click', function() {
            const isHidden = panelContent.style.display === 'none';
            panelContent.style.display = isHidden ? 'block' : 'none';
            toggleBtn.textContent = isHidden ? "▲" : "▼";
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
