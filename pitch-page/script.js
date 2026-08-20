/**
 * KINDR PROJECT LANDING PAGE - INTERACTIVE SCRIPT
 * Manages Escrow Simulation, App Mockup interactions, ROI Calculator, and UI transitions.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Sticky Navbar & Mobile Drawer
  const navbar = document.querySelector('.navbar');
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });

    // Close menu when clicking link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
      });
    });
  }

  // 2. Interactive Double Escrow Simulator
  const simBtns = document.querySelectorAll('.sim-btn');
  const simText = document.getElementById('simText');
  const simStatusBadge = document.getElementById('simStatusBadge');
  const simVaultAmount = document.getElementById('simVaultAmount');

  const escrowStepData = {
    1: {
      badge: 'Bước 1: Khóa 10% Safe Fee',
      vault: '15 Xu',
      text: 'Mẹ Lan đăng chiếc xe đẩy. Hệ thống tạm khóa 10% Phí Cam Kết (15 Xu) của Mẹ Lan để đảm bảo thông tin đúng 90% thực tế.'
    },
    2: {
      badge: 'Bước 2: Khóa Xu Người Mua',
      vault: '165 Xu',
      text: 'Mẹ Hoa chọn đổi xe đẩy. Hệ thống khóa 150 Xu trong ví Mẹ Hoa. Cả 2 bên nhận SĐT/Zalo để tự hẹn giao nhận gần nhà.'
    },
    3: {
      badge: 'Bước 3: Khung Giờ 6H',
      vault: 'Đang bảo chứng...',
      text: 'Mẹ Hoa nhận xe, bấm "Đã nhận". Hệ thống kích hoạt "6 Hours Safeful Time" để Mẹ Hoa kiểm tra bánh xe, khung sườn xem đúng cam kết không.'
    },
    4: {
      badge: 'Bước 4: Mở Khóa Dòng Xu',
      vault: '0 Xu (Hoàn tất)',
      text: 'Sau 6 tiếng an lành không có khiếu nại, 150 Xu + 15 Xu ký quỹ được tự động giải phóng vào Ví Mẹ Lan. Giao dịch thành công 100%!'
    }
  };

  simBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      simBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const step = btn.dataset.step;
      if (escrowStepData[step]) {
        simStatusBadge.textContent = escrowStepData[step].badge;
        simVaultAmount.textContent = escrowStepData[step].vault;
        simText.textContent = escrowStepData[step].text;
      }
    });
  });

  // 3. Interactive ROI / Savings Calculator for Moms
  const toyBudgetSlider = document.getElementById('toyBudget');
  const toyBudgetValue = document.getElementById('toyBudgetValue');
  const savedAmount = document.getElementById('savedAmount');
  const savedItems = document.getElementById('savedItems');

  function updateSavings() {
    if (!toyBudgetSlider) return;
    const monthlySpend = parseInt(toyBudgetSlider.value, 10); // VNĐ per month
    const formattedSpend = new Intl.NumberFormat('vi-VN').format(monthlySpend);
    toyBudgetValue.textContent = `${formattedSpend} VNĐ/tháng`;

    // 85% savings with Kindr swap model
    const annualSavings = Math.round((monthlySpend * 12) * 0.85);
    const formattedSavings = new Intl.NumberFormat('vi-VN').format(annualSavings);
    savedAmount.textContent = `${formattedSavings} VNĐ`;

    // Estimated items saved from waste
    const itemsCount = Math.round(monthlySpend / 150000) * 12;
    savedItems.textContent = `Tương đương giữ lại ~${itemsCount} món đồ chơi/sách không biến thành rác nhựa!`;
  }

  if (toyBudgetSlider) {
    toyBudgetSlider.addEventListener('input', updateSavings);
    updateSavings(); // Initial calculation
  }

  // 4. Interactive App Mockup Category Switching
  const catPills = document.querySelectorAll('.cat-pill');
  const feedContainer = document.getElementById('mockupFeed');

  const mockItems = {
    all: [
      { emoji: '🧸', name: 'Gấu bông Teddy biết hát', xu: '30 Xu', dist: '0.4 km', state: 'Mới 90%' },
      { emoji: '🚲', name: 'Xe chòi chân Holla', xu: '80 Xu', dist: '0.8 km', state: 'Mới 85%' },
      { emoji: '📚', name: 'Bộ sách Ehon Nhật Bản (10 cuốn)', xu: '45 Xu', dist: '1.2 km', state: 'Mới 95%' },
      { emoji: '🧩', name: 'Bộ xếp hình Lego Duplo', xu: '60 Xu', dist: '0.5 km', state: 'Mới 90%' }
    ],
    toys: [
      { emoji: '🧸', name: 'Gấu bông Teddy biết hát', xu: '30 Xu', dist: '0.4 km', state: 'Mới 90%' },
      { emoji: '🚲', name: 'Xe chòi chân Holla', xu: '80 Xu', dist: '0.8 km', state: 'Mới 85%' },
      { emoji: '🏎️', name: 'Xe ô tô điện điều khiển', xu: '120 Xu', dist: '1.5 km', state: 'Mới 80%' },
      { emoji: '🧩', name: 'Bộ xếp hình Lego Duplo', xu: '60 Xu', dist: '0.5 km', state: 'Mới 90%' }
    ],
    books: [
      { emoji: '📚', name: 'Bộ sách Ehon Nhật Bản (10 cuốn)', xu: '45 Xu', dist: '1.2 km', state: 'Mới 95%' },
      { emoji: '📖', name: 'Bách khoa toàn thư cho bé', xu: '50 Xu', dist: '0.9 km', state: 'Mới 90%' },
      { emoji: '🎨', name: 'Truyện tranh tương tác lật mở', xu: '25 Xu', dist: '0.3 km', state: 'Mới 85%' }
    ],
    free: [
      { emoji: '👕', name: 'Áo khoác cotton 1-2 tuổi', xu: '0 Xu (Tặng)', dist: '0.2 km', state: 'Tặng từ thiện' },
      { emoji: '🍼', name: 'Bình sữa Hegen 150ml (chưa dùng)', xu: '0 Xu (Tặng)', dist: '0.6 km', state: 'Tặng từ thiện' }
    ]
  };

  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      catPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const category = pill.dataset.cat || 'all';
      renderMockItems(mockItems[category] || mockItems.all);
    });
  });

  function renderMockItems(items) {
    if (!feedContainer) return;
    feedContainer.innerHTML = items.map(item => `
      <div class="app-card">
        <div class="app-card-img">${item.emoji}</div>
        <div class="app-card-title">${item.name}</div>
        <div class="app-card-meta">
          <span class="app-card-xu">${item.xu}</span>
          <span class="app-card-dist">📍 ${item.dist}</span>
        </div>
      </div>
    `).join('');
  }

  // 5. Modal Waitlist & Demo Handlers
  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');
  const openModalBtns = document.querySelectorAll('.open-modal-btn');
  const waitlistForm = document.getElementById('waitlistForm');

  openModalBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (modalOverlay) modalOverlay.classList.add('active');
    });
  });

  if (modalClose) {
    modalClose.addEventListener('click', () => {
      modalOverlay.classList.remove('active');
    });
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.classList.remove('active');
      }
    });
  }

  if (waitlistForm) {
    waitlistForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = waitlistForm.querySelector('input[type="email"]');
      if (input && input.value) {
        alert(`Cảm ơn mẹ đã quan tâm! ❤️ Kindr đã lưu email [${input.value}] vào danh sách trải nghiệm sớm tại Đà Nẵng.`);
        input.value = '';
        if (modalOverlay) modalOverlay.classList.remove('active');
      }
    });
  }

  // 6. Scroll Reveal Observer
  const revealElements = document.querySelectorAll('.reveal');
  const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    revealElements.forEach(el => {
      const elementTop = el.getBoundingClientRect().top;
      if (elementTop < windowHeight - 80) {
        el.classList.add('visible');
      }
    });
  };

  window.addEventListener('scroll', revealOnScroll);
  revealOnScroll(); // Trigger once on launch
});
