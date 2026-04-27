document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeModalBtn = document.querySelector('.close-modal');
    const modalActionBtn = document.getElementById('modal-action');
    
    // Buttons
    const btnGiftPack = document.getElementById('btn-giftpack');
    const btnRechargeEvent = document.getElementById('btn-recharge-event');
    const btnRechargeHeader = document.getElementById('btn-recharge-header');
    const navItems = document.querySelectorAll('.nav-item');

    // State
    let balance = 177553;
    const balanceDisplay = document.getElementById('user-balance');

    // Helper: Format number with commas
    const formatNumber = (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    // Helper: Show Modal
    const showModal = (title, content) => {
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        modalOverlay.classList.remove('hidden');
    };

    // Helper: Hide Modal
    const hideModal = () => {
        modalOverlay.classList.add('hidden');
    };

    // Event Listeners

    // Close Modal
    closeModalBtn.addEventListener('click', hideModal);
    modalActionBtn.addEventListener('click', hideModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) hideModal();
    });

    // Gift Pack Click
    btnGiftPack.addEventListener('click', () => {
        showModal('限时礼包', '恭喜！您获得了一个新手大礼包！<br>包含：50,000 金币，特殊头像框，VIP体验卡。');
    });

    // Recharge Event Click
    btnRechargeEvent.addEventListener('click', () => {
        showModal('充值返利', '现在充值任意金额，即可获得 100% 返利！<br>活动剩余时间：02:15:30');
    });

    // Header Buy Click
    btnRechargeHeader.addEventListener('click', () => {
        // Simulate recharge
        const amount = 10000;
        balance += amount;
        balanceDisplay.textContent = formatNumber(balance);
        showModal('充值成功', `您已成功充值 ${formatNumber(amount)} 金币！`);
    });

    // Navigation Switching
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked
            // Handle if icon or span was clicked
            const target = e.target.closest('.nav-item');
            target.classList.add('active');

            const tabName = target.dataset.tab;
            console.log(`Switched to tab: ${tabName}`);

            // Logic to switch content based on tab
            if (tabName === 'activities') {
                showModal('活动中心', '这里显示所有正在进行的精彩活动列表。<br>1. 周末狂欢<br>2. 每日签到');
            } else if (tabName === 'tasks') {
                showModal('每日任务', '今日任务进度：<br>- 旋转 50 次 (20/50)<br>- 赢得 1000 金币 (完成)');
            } else if (tabName === 'profile') {
                showModal('个人中心', '用户：Guest_001<br>VIP等级：2<br>总赢取：5,000,000');
            }
        });
    });
});