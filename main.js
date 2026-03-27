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
    // 2. 缩放 + 移动
    // ===========================
    (function() {
        function initControls() {
            let graphContainer = document.querySelector('.mxgraph > div');
            if (!graphContainer) graphContainer = document.querySelector('.mxgraph');
            if (!graphContainer) return false;

            let graphContent = graphContainer.children[0];
            if (!graphContent) return false;

            let originalWidth = graphContent.clientWidth;
            let originalHeight = graphContent.clientHeight;
            if (originalWidth === 0 || originalHeight === 0) {
                originalWidth = graphContainer.clientWidth;
                originalHeight = graphContainer.clientHeight;
            }

            graphContainer.style.position = 'relative';
            graphContainer.style.overflow = 'auto';
            graphContainer.style.webkitOverflowScrolling = 'touch';

            let placeholder = document.createElement('div');
            placeholder.style.width = originalWidth + 'px';
            placeholder.style.height = originalHeight + 'px';
            placeholder.style.pointerEvents = 'none';
            graphContainer.appendChild(placeholder);

            graphContent.style.position = 'absolute';
            graphContent.style.top = '0';
            graphContent.style.left = '0';
            graphContent.style.transformOrigin = '0 0';

            let scale = 1;
            const step = 0.2;
            const minScale = 0.2;
            const maxScale = 3;
            const panStep = 50;

            function updateScale() {
                graphContent.style.transform = `scale(${scale})`;
                placeholder.style.width = (originalWidth * scale) + 'px';
                placeholder.style.height = (originalHeight * scale) + 'px';
            }

            document.getElementById('zoomInBtn').addEventListener('click', function() {
                scale = Math.min(scale + step, maxScale);
                updateScale();
            });
            document.getElementById('zoomOutBtn').addEventListener('click', function() {
                scale = Math.max(scale - step, minScale);
                updateScale();
            });
            document.getElementById('zoomResetBtn').addEventListener('click', function() {
                scale = 1;
                updateScale();
            });

            document.getElementById('panUpBtn').addEventListener('click', function() {
                graphContainer.scrollTop -= panStep;
            });
            document.getElementById('panDownBtn').addEventListener('click', function() {
                graphContainer.scrollTop += panStep;
            });
            document.getElementById('panLeftBtn').addEventListener('click', function() {
                graphContainer.scrollLeft -= panStep;
            });
            document.getElementById('panRightBtn').addEventListener('click', function() {
                graphContainer.scrollLeft += panStep;
            });

            return true;
        }

        if (!initControls()) {
            const interval = setInterval(function() {
                if (initControls()) clearInterval(interval);
            }, 500);
        }
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