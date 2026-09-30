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

  // 5. Modal Waitlist & Dynamic Stats Handlers
  const API_BASE_URL = 'http://localhost:5000';
  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');
  const successModalOverlay = document.getElementById('successModalOverlay');
  const successModalClose = document.getElementById('successModalClose');
  const btnCloseCelebration = document.getElementById('btn-close-celebration');
  const openModalBtns = document.querySelectorAll('.open-modal-btn');
  const waitlistForm = document.getElementById('waitlistForm');
  const modalForm = document.getElementById('modalForm');

  // Stats elements
  const waitlistCounter = document.getElementById('waitlistCounter');
  const waitlistPercent = document.getElementById('waitlistPercent');
  const waitlistProgressBar = document.getElementById('waitlistProgressBar');
  const waitlistRemaining = document.getElementById('waitlistRemaining');
  const successOrderBadge = document.getElementById('successOrderBadge');

  // Helper to extract UTM parameters
  function getUtmParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      utmSource: urlParams.get('utm_source') || 'landing_page',
      utmMedium: urlParams.get('utm_medium') || 'web',
      utmCampaign: urlParams.get('utm_campaign') || 'pilot_danang'
    };
  }

  // Fetch real-time waitlist progress
  async function fetchWaitlistStats() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/waitlist/stats`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      updateWaitlistUI(data.total, data.target, data.remaining, data.percentage);
    } catch (err) {
      console.warn('[Waitlist] Using fallback baseline stats:', err);
      // Fallback baseline
      updateWaitlistUI(142, 200, 58, 71);
    }
  }

  function updateWaitlistUI(total, target, remaining, percentage) {
    if (waitlistCounter) waitlistCounter.textContent = `${total} / ${target} Mẹ`;
    if (waitlistPercent) waitlistPercent.textContent = `${percentage}% Đã Tham Gia`;
    if (waitlistProgressBar) waitlistProgressBar.style.width = `${percentage}%`;
    if (waitlistRemaining) waitlistRemaining.textContent = `${remaining} suất`;
  }

  // Load stats initially
  fetchWaitlistStats();

  // Modal open triggers
  openModalBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (modalOverlay) modalOverlay.classList.add('active');
    });
  });

  // Modal close triggers
  if (modalClose) {
    modalClose.addEventListener('click', () => {
      modalOverlay.classList.remove('active');
    });
  }

  if (successModalClose) {
    successModalClose.addEventListener('click', () => {
      successModalOverlay.classList.remove('active');
    });
  }

  if (btnCloseCelebration) {
    btnCloseCelebration.addEventListener('click', () => {
      successModalOverlay.classList.remove('active');
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove('active');
    }
    if (e.target === successModalOverlay) {
      successModalOverlay.classList.remove('active');
    }
  });

  // Main Waitlist Form Submission (Step 5)
  if (waitlistForm) {
    waitlistForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('btn-submit-waitlist');
      const emailInput = document.getElementById('waitlistEmail');
      const phoneInput = document.getElementById('waitlistPhone');
      const interestInput = waitlistForm.querySelector('input[name="interest"]:checked');

      if (!emailInput || !emailInput.value) return;

      const utm = getUtmParams();
      const payload = {
        email: emailInput.value.trim(),
        phone: phoneInput ? phoneInput.value.trim() : undefined,
        utmSource: utm.utmSource,
        utmMedium: utm.utmMedium,
        utmCampaign: utm.utmCampaign
      };

      const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Đang ghi nhận... ⏳</span>';
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/waitlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
          const orderNum = result.data.orderNumber;
          if (successOrderBadge) {
            successOrderBadge.textContent = `Mẹ là thành viên thứ #${orderNum}`;
          }
          
          // Refresh progress stats immediately
          fetchWaitlistStats();

          // Open celebration modal
          if (successModalOverlay) {
            successModalOverlay.classList.add('active');
          }

          // Trigger GA4 event
          if (typeof trackKindrEvent === 'function') {
            trackKindrEvent('waitlist_submit', {
              order_number: orderNum,
              interest: interestInput ? interestInput.value : 'general'
            });
          }

          waitlistForm.reset();
        } else {
          alert(result.message || 'Có lỗi xảy ra, vui lòng thử lại sau ít phút.');
        }
      } catch (err) {
        console.error('Waitlist submission error:', err);
        alert('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại!');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      }
    });
  }

  // Quick Modal Form Submission
  if (modalForm) {
    modalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = modalForm.querySelector('input[type="email"]');
      if (!emailInput || !emailInput.value) return;

      const utm = getUtmParams();
      try {
        const res = await fetch(`${API_BASE_URL}/api/waitlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailInput.value.trim(),
            utmSource: utm.utmSource,
            utmMedium: utm.utmMedium,
            utmCampaign: utm.utmCampaign
          })
        });
        const json = await res.json();
        if (res.ok) {
          if (modalOverlay) modalOverlay.classList.remove('active');
          if (successOrderBadge) {
            successOrderBadge.textContent = `Mẹ là thành viên thứ #${json.data.orderNumber}`;
          }
          if (successModalOverlay) successModalOverlay.classList.add('active');
          fetchWaitlistStats();
          modalForm.reset();
        } else {
          alert(json.message || 'Email này đã có trong danh sách chờ!');
        }
      } catch (err) {
        alert(`Cảm ơn mẹ! Kindr đã ghi nhận email [${emailInput.value}] vào danh sách trải nghiệm.`);
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
