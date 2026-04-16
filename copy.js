document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    // ===========================
    // 1. 控制面板拖动 + 展开收起（无瞬移+方向固定）
    // ===========================
    const panel = document.getElementById('controlPanel');
    if (panel) {
        const dragHandle = document.getElementById('dragHandle');
        const content = document.getElementById('panelContent');
        const toggleBtn = document.getElementById('toggleBtn');
        const panelMode = document.body.getAttribute('data-panel');
        
        // 核心：定义变量记录面板实时的右偏移值，避免瞬移
        let panelRight = 10; // 初始右偏移10px，和初始位置一致
        // 初始位置：右上角，基于right/top定位
        panel.style.position = 'fixed';
        panel.style.top = '10px';
        panel.style.right = panelRight + 'px';
        panel.style.left = 'auto';
        panel.style.transform = 'none';
        panel.style.zIndex = '9999';
        // 初始布局：保证收起向右上、展开向左下
        panel.style.textAlign = 'right';
        content.style.textAlign = 'left'; 

        // 初始展开/收起状态
        if (panelMode === 'close') {
            content.style.display = 'none';
            toggleBtn.textContent = "▼";
        } else {
            content.style.display = 'block';
            toggleBtn.textContent = "▲";
        }

        let isDragging = false, startX, startY, left, top;

        // 拖动开始：记录初始位置
        dragHandle.addEventListener('mousedown', function(e) {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            left = panel.offsetLeft;
            top = panel.offsetTop;
        });
        dragHandle.addEventListener('touchstart', function(e) {
            isDragging = true;
            const t = e.touches[0];
            startX = t.clientX;
            startY = t.clientY;
            left = panel.offsetLeft;
            top = panel.offsetTop;
        }, { passive: true });

        // 拖动中：正常拖动，实时更新右偏移值panelRight
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            const x = left + e.clientX - startX;
            const y = top + e.clientY - startY;
            panel.style.left = x + "px";
            panel.style.top = y + "px";
            panel.style.right = 'auto';
            // 实时计算并更新右偏移值（关键：解决瞬移）
            panelRight = window.innerWidth - (panel.getBoundingClientRect().right);
        });
        document.addEventListener('touchmove', function(e) {
            if (!isDragging) return;
            e.preventDefault();
            const t = e.touches[0];
            const x = left + t.clientX - startX;
            const y = top + t.clientY - startY;
            panel.style.left = x + "px";
            panel.style.top = y + "px";
            panel.style.right = 'auto';
            // 实时计算并更新右偏移值（关键：解决瞬移）
            panelRight = window.innerWidth - (panel.getBoundingClientRect().right);
        }, { passive: false });

        // 结束拖动
        document.addEventListener('mouseup', function() { isDragging = false; });
        document.addEventListener('touchend', function() { isDragging = false; });
        document.addEventListener('touchcancel', function() { isDragging = false; });

        // 展开/收起核心修复：复用实时panelRight，不瞬移+方向固定
        toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // 阻止事件冒泡，避免误触
            const isHidden = content.style.display === 'none';
            // 始终基于实时的panelRight定位，绝不重置为初始值，避免瞬移
            panel.style.right = panelRight + 'px';
            panel.style.left = 'auto'; // 强制切回right定位，保证左下展开/右上收起
            if (isHidden) {
                content.style.display = 'block';
                toggleBtn.textContent = "▲";
            } else {
                content.style.display = 'none';
                toggleBtn.textContent = "▼";
            }
        });
    }

// ===========================
// 2. 缩放 + 移动（支持双指缩放/单指拖拽 + 保留按钮）
// ===========================
(function() {
    let graphContainer = document.querySelector('.mxgraph');
    if (!graphContainer) return;

    // 获取实际内容（viewer.diagrams.net 生成的内层 div）
    let graphContent = graphContainer.children[0];
    if (!graphContent) return;

    // 获取原始尺寸
    let originalWidth = graphContent.clientWidth || graphContent.scrollWidth;
    let originalHeight = graphContent.clientHeight || graphContent.scrollHeight;
    if (originalWidth === 0) originalWidth = 1400;  // fallback
    if (originalHeight === 0) originalHeight = 1800;

    // 改造容器结构：相对定位 + 绝对定位内容 + 占位符撑开滚动区域
    graphContainer.style.position = 'relative';
    graphContainer.style.overflow = 'auto';
    graphContainer.style.touchAction = 'none';   // 禁止原生手势

    let placeholder = document.createElement('div');
    placeholder.style.width = originalWidth + 'px';
    placeholder.style.height = originalHeight + 'px';
    placeholder.style.pointerEvents = 'none';
    graphContainer.appendChild(placeholder);

    graphContent.style.position = 'absolute';
    graphContent.style.top = '0';
    graphContent.style.left = '0';
    graphContent.style.transformOrigin = '0 0';
    graphContent.style.willChange = 'transform';

    let scale = 1;
    const MIN_SCALE = 0.3;
    const MAX_SCALE = 4.0;

    function updateTransform() {
        graphContent.style.transform = `scale(${scale})`;
        placeholder.style.width = (originalWidth * scale) + 'px';
        placeholder.style.height = (originalHeight * scale) + 'px';
    }
    updateTransform();

    // 手势状态
    let initialDistance = 0, initialScale = 1;
    let isTouching = false, isPinching = false;
    let touchStartScrollLeft = 0, touchStartScrollTop = 0;
    let touchStartX = 0, touchStartY = 0;

    // 辅助函数：计算双指距离
    function getDistance(touches) {
        if (touches.length < 2) return 0;
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.hypot(dx, dy);
    }
    function getCenter(touches) {
        if (touches.length === 1) return { x: touches[0].clientX, y: touches[0].clientY };
        let sumX = 0, sumY = 0;
        for (let i = 0; i < touches.length; i++) {
            sumX += touches[i].clientX;
            sumY += touches[i].clientY;
        }
        return { x: sumX / touches.length, y: sumY / touches.length };
    }

    // 基于缩放中心设置新缩放（保持视觉点不变）
    function setScaleWithCenter(newScale, centerX, centerY) {
        let oldScale = scale;
        let clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
        if (clamped === scale) return;
        const rect = graphContainer.getBoundingClientRect();
        const scrollLeftBefore = graphContainer.scrollLeft;
        const scrollTopBefore = graphContainer.scrollTop;
        const contentX = (centerX - rect.left + scrollLeftBefore) / oldScale;
        const contentY = (centerY - rect.top + scrollTopBefore) / oldScale;
        scale = clamped;
        updateTransform();
        let newScrollLeft = contentX * scale - (centerX - rect.left);
        let newScrollTop = contentY * scale - (centerY - rect.top);
        graphContainer.scrollLeft = Math.max(0, Math.min(placeholder.clientWidth - rect.width, newScrollLeft));
        graphContainer.scrollTop = Math.max(0, Math.min(placeholder.clientHeight - rect.height, newScrollTop));
    }

    // 触摸事件
    graphContainer.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touches = e.touches;
        if (touches.length === 1) {
            isPinching = false;
            isTouching = true;
            touchStartScrollLeft = graphContainer.scrollLeft;
            touchStartScrollTop = graphContainer.scrollTop;
            touchStartX = touches[0].clientX;
            touchStartY = touches[0].clientY;
        } else if (touches.length === 2) {
            isPinching = true;
            isTouching = false;
            initialDistance = getDistance(touches);
            initialScale = scale;
            const center = getCenter(touches);
            touchStartX = center.x;
            touchStartY = center.y;
        }
    }, { passive: false });

    graphContainer.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touches = e.touches;
        if (!isPinching && touches.length === 1 && isTouching) {
            const dx = touches[0].clientX - touchStartX;
            const dy = touches[0].clientY - touchStartY;
            let newLeft = touchStartScrollLeft - dx;
            let newTop = touchStartScrollTop - dy;
            graphContainer.scrollLeft = Math.max(0, Math.min(placeholder.clientWidth - graphContainer.clientWidth, newLeft));
            graphContainer.scrollTop = Math.max(0, Math.min(placeholder.clientHeight - graphContainer.clientHeight, newTop));
        } else if (touches.length === 2 && initialDistance > 0) {
            const newDist = getDistance(touches);
            if (newDist === 0) return;
            let scaleFactor = newDist / initialDistance;
            let newScale = initialScale * scaleFactor;
            const center = getCenter(touches);
            setScaleWithCenter(newScale, center.x, center.y);
            // 连续缩放更新基准
            initialScale = scale;
            initialDistance = newDist;
        }
    }, { passive: false });

    graphContainer.addEventListener('touchend', () => {
        isTouching = false;
        isPinching = false;
        initialDistance = 0;
    });
    graphContainer.addEventListener('touchcancel', () => {
        isTouching = false;
        isPinching = false;
    });

    // 鼠标拖拽平移（PC 增强）
    let isMouseDown = false;
    let mouseStartX = 0, mouseStartY = 0;
    let startScrollLeft = 0, startScrollTop = 0;
    graphContainer.addEventListener('mousedown', (e) => {
        if (e.target.closest('button')) return;
        isMouseDown = true;
        mouseStartX = e.clientX;
        mouseStartY = e.clientY;
        startScrollLeft = graphContainer.scrollLeft;
        startScrollTop = graphContainer.scrollTop;
        graphContainer.style.cursor = 'grabbing';
        e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
        if (!isMouseDown) return;
        const dx = e.clientX - mouseStartX;
        const dy = e.clientY - mouseStartY;
        graphContainer.scrollLeft = Math.max(0, Math.min(placeholder.clientWidth - graphContainer.clientWidth, startScrollLeft - dx));
        graphContainer.scrollTop = Math.max(0, Math.min(placeholder.clientHeight - graphContainer.clientHeight, startScrollTop - dy));
    });
    window.addEventListener('mouseup', () => {
        isMouseDown = false;
        graphContainer.style.cursor = '';
    });

    // 保留原有按钮功能
    const zoomIn = document.getElementById('zoomInBtn');
    const zoomOut = document.getElementById('zoomOutBtn');
    const zoomReset = document.getElementById('zoomResetBtn');
    const panUp = document.getElementById('panUpBtn');
    const panDown = document.getElementById('panDownBtn');
    const panLeft = document.getElementById('panLeftBtn');
    const panRight = document.getElementById('panRightBtn');

    if (zoomIn) zoomIn.addEventListener('click', () => setScaleWithCenter(scale + 0.2, window.innerWidth/2, window.innerHeight/2));
    if (zoomOut) zoomOut.addEventListener('click', () => setScaleWithCenter(scale - 0.2, window.innerWidth/2, window.innerHeight/2));
    if (zoomReset) zoomReset.addEventListener('click', () => setScaleWithCenter(1, window.innerWidth/2, window.innerHeight/2));

    const step = 80;
    if (panUp) panUp.addEventListener('click', () => graphContainer.scrollTop -= step);
    if (panDown) panDown.addEventListener('click', () => graphContainer.scrollTop += step);
    if (panLeft) panLeft.addEventListener('click', () => graphContainer.scrollLeft -= step);
    if (panRight) panRight.addEventListener('click', () => graphContainer.scrollLeft += step);
})();

    // ===========================
    // 3. 主弹窗
    // ===========================
    const tipsModal = document.getElementById('tipsModal');
    const tipsToggle = document.getElementById('tipsToggleBtn');
    const closeModal = document.getElementById('closeModalBtn');
    const modalMode = document.body.dataset.modal;
    const FEEDBACK_URL = 'https://v.wjx.cn/vm/Yk92DWx.aspx'; 

    const setModalVisible = (show) => {
        if (tipsModal) tipsModal.style.display = show ? 'flex' : 'none';
        if (tipsToggle) tipsToggle.style.display = show ? 'none' : 'flex';
    };


    setModalVisible(modalMode === 'open');
    if (closeModal) closeModal.onclick = () => setModalVisible(false);
    if (tipsToggle) tipsToggle.onclick = () => setModalVisible(true);

    feedbackBtn.addEventListener('click', () => {
        window.open(FEEDBACK_URL, '_blank'); 
        // 可选：跳转后自动缩至角落（取消注释即可）
        // closeModal();
    });
    // ===========================
    // 4. 致谢弹窗
    // ===========================
    const thanksTag = document.querySelector('.thanks-tag');
    const thanksModal = document.getElementById('thanksModal');
    const closeThanks = document.getElementById('closeThanksBtn');

    if (thanksTag) thanksTag.onclick = () => { thanksModal.style.display = 'flex'; };
    if (closeThanks) closeThanks.onclick = () => { thanksModal.style.display = 'none'; };
    if (thanksModal) thanksModal.onclick = (e) => {
        if (e.target === thanksModal) thanksModal.style.display = 'none';
    };
});
window.addEventListener('load', function () {
  document.documentElement.classList.add('loaded');
});