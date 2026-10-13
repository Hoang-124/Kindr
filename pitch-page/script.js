/**
 * KINDR — DENSE & HIGH SIGNAL INTERACTIVE SCRIPT
 * Manages 4-Step Interactive Simulator, Truthful Copy,
 * Decree 13 Consent Validation, and Real-time Waitlist API Integration
 */

document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = window.KINDR_API_URL || 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000'
      : 'https://kindr-backend-rl2t.onrender.com');

  // ================= 1. MULTI-FLOW INTERACTIVE APP SIMULATOR CONTROLLER =================
  let currentFlowStep = 1;
  let autoPlayInterval = null;
  let isAutoPlaying = false;
  let safefulTimerInterval = null;
  let toastTimer = null;

  const flowScreens = {
    1: document.getElementById('flowScreen1'),
    2: document.getElementById('flowScreen2'),
    3: document.getElementById('flowScreen3'),
    4: document.getElementById('flowScreenChat'),
    5: document.getElementById('flowScreen4'),
    post: document.getElementById('flowScreenPost'),
    wallet: document.getElementById('flowScreenWallet'),
    search: document.getElementById('flowScreenSearch')
  };

  const stepBtns = document.querySelectorAll('.flow-step-btn');
  const narratorDots = document.querySelectorAll('.n-dot');
  const narratorStepPill = document.getElementById('narratorStepPill');
  const narratorHeaderTitle = document.getElementById('narratorHeaderTitle');
  const narratorBodyText = document.getElementById('narratorBodyText');
  const narratorHighlight1 = document.getElementById('narratorHighlight1');
  const narratorHighlight2 = document.getElementById('narratorHighlight2');
  const btnNarratorPrev = document.getElementById('btnNarratorPrev');
  const btnNarratorNext = document.getElementById('btnNarratorNext');
  const btnAutoPlayToggle = document.getElementById('btnAutoPlayToggle');
  const autoPlayLabel = document.getElementById('autoPlayLabel');
  const flowUserXu = document.getElementById('flowUserXu');

  // Bottom Navigation Tabs
  const tabHome = document.getElementById('tabHome');
  const tabSearch = document.getElementById('tabSearch');
  const tabFabPost = document.getElementById('tabFabPost');
  const tabChat = document.getElementById('tabChat');
  const tabProfile = document.getElementById('tabProfile');
  const bottomTabs = [tabHome, tabSearch, tabChat, tabProfile];

  // Flow Selector Pills on Narrator
  const flowSelPills = document.querySelectorAll('.flow-sel-pill');

  // Multi-Flow Content Matrix (5-step Core Exchange + 3 Standalone Showcases)
  const narratorContent = {
    1: {
      pill: 'Bước 1/5: Chọn Đồ',
      title: 'Khám phá đồ mẹ bé chất lượng cao trong bán kính 1km',
      body: 'Giao diện thực tế ứng dụng Kindr: Mẹ Lan duyệt nguồn cấp đồ chơi gần nhà tại cụm chung cư FPT Plaza. Người bán đã cọc trước 10% Phí Bảo Đảm cam kết chuẩn mô tả.',
      h1: 'Ký quỹ kép song phương: Cả 2 bên đều được bảo hộ an toàn',
      h2: 'Vị trí siêu cục bộ: Cùng chung cư FPT Plaza 2 (cách 400m)',
      flow: 'escrow'
    },
    2: {
      pill: 'Bước 2/5: Ký Quỹ Kép',
      title: 'Cơ chế Ký Quỹ Song Phương bảo vệ giao dịch an toàn',
      body: 'Mẹ Lan bấm "Ký Quỹ Đổi Ngay (10 Xu)". Hệ thống tạm khóa 10 Xu vào Rương Ký Quỹ trung gian. Người bán cũng đã cọc sẵn 1 Xu Phí Bảo Đảm (10%) từ trước.',
      h1: 'Người bán cọc trước 10% Phí Bảo Đảm - Chống hàng hỏng & tin ảo',
      h2: 'Người mua khóa Xu vào Rương Ký Quỹ trung gian minh bạch',
      flow: 'escrow'
    },
    3: {
      pill: 'Bước 3/5: Rương Ký Quỹ & Mã Nhận',
      title: 'Tạm khóa Xu ký quỹ & Cấp mã nhận hàng KND-889',
      body: 'Rương Ký Quỹ bảo hộ an toàn 10 Xu. Hệ thống mở khóa ngay SĐT của mẹ bán để tự hẹn gặp, đồng thời cấp mã nhận hàng 6 ký tự độc quyền cho mẹ mua giữ.',
      h1: 'Mã xác thực nhận hàng KND-889: Chống gian lận khi nhận đồ',
      h2: 'Mở khóa SĐT 0905 123 456 & Nhắn tin trao đổi trực tiếp',
      flow: 'escrow'
    },
    4: {
      pill: 'Bước 4/5: Hẹn Sảnh & Giao Đồ',
      title: 'Nhắn tin trực tiếp thỏa thuận giờ gặp tại sảnh chung cư',
      body: 'Hai mẹ nhắn tin hẹn gặp tại Sảnh B FPT Plaza 2 lúc 17h15 tiện đường đón con. Khi gặp mặt kiểm tra đồ, mẹ bấm xác nhận để bắt đầu 6 Giờ Kiểm Định.',
      h1: 'Khung trạng thái Ký Quỹ ghim cố định: Xem trạng thái cọc & mã nhận KND-889',
      h2: 'Bấm xác nhận bàn giao tại sảnh để kích hoạt 6 giờ kiểm định',
      flow: 'escrow'
    },
    5: {
      pill: 'Bước 5/5: 6H Kiểm Định & Tất Toán',
      title: 'Mang về phòng cho bé kiểm tra 6 tiếng trước khi tất toán',
      body: 'Đồng hồ đếm ngược 6 giờ kiểm định chạy trực tiếp. Nếu đồ đúng mô tả, mẹ bấm Giải phóng Xu (Người bán nhận 10 Xu + hoàn 1 Xu cọc). Nếu sai lệch, bấm Khiếu nại để đóng băng bảo vệ 100% Xu.',
      h1: 'Đồng hồ đếm ngược 6 giờ kiểm định chạy trực tiếp tại nhà',
      h2: 'Tất toán Ký Quỹ minh bạch: Hoàn 100% cọc cho người bán uy tín',
      flow: 'escrow'
    },
    post: {
      pill: 'Tính Năng: Mẹ Bán Đăng Đồ',
      title: 'Trí tuệ nhân tạo Kindr AI định giá & Cam kết Phí Bảo Đảm 10%',
      body: 'Trí tuệ nhân tạo Kindr AI tự nhận diện đồ chơi & gợi ý phân loại. Người bán cọc trước 10% Phí Bảo Đảm (1 Xu) để cam kết trung thực và loại bỏ 100% tin ảo rác.',
      h1: 'Trí tuệ nhân tạo nhận diện ảnh: gợi ý tên, độ tuổi bé, tình trạng mới',
      h2: 'Cọc Phí Bảo Đảm 10%: Hoàn 100% khi mẹ mua ưng ý sau 6 giờ',
      flow: 'post'
    },
    wallet: {
      pill: 'Tính Năng: Ví Xu & Uy Tín',
      title: 'Quản lý Ví Kindr Xu & Điểm Mẹ Bỉm Văn Minh 99/100',
      body: 'Minh bạch số dư khả dụng (90 Xu) và Xu đang trong rương ký quỹ trung gian (10 Xu). Điểm uy tín cộng dồn qua mỗi giao dịch trung thực, mở khóa đặc quyền tiên phong.',
      h1: '1 Xu = 10.000 VNĐ, quản lý nạp rút & tiền cọc ký quỹ',
      h2: 'Điểm uy tín 99/100 chứng nhận "Mẹ Bỉm Tin Cậy"',
      flow: 'wallet'
    },
    search: {
      pill: 'Tính Năng: Lọc Bán Kính <1km',
      title: 'Bộ lọc bán kính siêu cục bộ (<500m / <1km)',
      body: 'Thuật toán tìm kiếm ưu tiên hàng xóm cùng tòa nhà và bán kính đi bộ 10 phút. Lọc theo độ tuổi bé và đồ chơi Trạm Tặng (0 Xu) lan tỏa yêu thương.',
      h1: 'Lọc siêu cục bộ: <500m cùng sảnh chung cư FPT Plaza',
      h2: 'Trạm Tặng 0 Xu: Lan tỏa đồ chơi cũ cho các bé lân cận',
      flow: 'search'
    }
  };

  // Live Safeful 6H Countdown Timer
  const liveSafefulDigits = document.getElementById('liveSafefulDigits');
  function startSafefulTimer() {
    stopSafefulTimer();
    let remainingSecs = 6 * 3600; // 6 hours
    const pad = (n) => String(n).padStart(2, '0');
    
    function renderDigits(secs) {
      if (!liveSafefulDigits) return;
      const hrs = Math.floor(secs / 3600);
      const mins = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      liveSafefulDigits.textContent = `${pad(hrs)}h ${pad(mins)}m ${pad(s)}s`;
    }

    renderDigits(remainingSecs);
    safefulTimerInterval = setInterval(() => {
      if (remainingSecs > 0) {
        remainingSecs--;
        renderDigits(remainingSecs);
      } else {
        stopSafefulTimer();
      }
    }, 1000);
  }

  function stopSafefulTimer() {
    if (safefulTimerInterval) {
      clearInterval(safefulTimerInterval);
      safefulTimerInterval = null;
    }
    if (liveSafefulDigits) {
      liveSafefulDigits.textContent = '06h 00m 00s';
    }
  }

  // In-Phone Dynamic Toast Function (Pure Crisp SVGs only, Zero Emojis)
  const TOAST_SVGS = {
    check: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
    lock: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    shield: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2EC4B6" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    refresh: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4361EE" stroke-width="2.2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>',
    camera: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E05A36" stroke-width="2.2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
    wallet: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 9v6"/></svg>',
    search: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8E7C80" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
    chat: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E05A36" stroke-width="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    clock: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0D9488" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    star: '<svg width="13" height="13" viewBox="0 0 24 24" fill="#D97706"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    phone: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    heart: '<svg width="13" height="13" viewBox="0 0 24 24" fill="#EF4444" stroke="#EF4444" stroke-width="1"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
    warning: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    box: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E05A36" stroke-width="2.2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
    gift: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E63946" stroke-width="2.2"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/></svg>'
  };

  const phoneDynamicToast = document.getElementById('phoneDynamicToast');
  const phoneToastIcon = document.getElementById('phoneToastIcon');
  const phoneToastMsg = document.getElementById('phoneToastMsg');

  function showPhoneToast(msg, iconKey = 'check') {
    if (!phoneDynamicToast || !phoneToastMsg) return;
    phoneToastMsg.textContent = msg;
    if (phoneToastIcon) {
      phoneToastIcon.innerHTML = TOAST_SVGS[iconKey] || TOAST_SVGS.check;
    }
    phoneDynamicToast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      phoneDynamicToast.classList.remove('show');
    }, 2800);
  }

  // Master Flow Switcher
  function setFlowStep(stepTarget) {
    currentFlowStep = stepTarget;

    // 1. Toggle Screen Viewports
    Object.keys(flowScreens).forEach(key => {
      const screen = flowScreens[key];
      if (screen) {
        if (key == currentFlowStep) {
          screen.classList.add('active');
        } else {
          screen.classList.remove('active');
        }
      }
    });

    // 2. Reset Step 4 sub-states when navigating
    if (inspectionActiveBox) inspectionActiveBox.style.display = 'block';
    if (disputeActiveBox) disputeActiveBox.style.display = 'none';
    if (exchangeCelebrationBox) {
      exchangeCelebrationBox.classList.add('hidden');
      exchangeCelebrationBox.style.display = 'none';
    }

    // 3. Manage 6H Timer
    // 3. Manage 6H Timer (Step 5 is 6H Safeful Time)
    if (currentFlowStep === 5) {
      startSafefulTimer();
    } else {
      stopSafefulTimer();
    }

    // 4. Update Bottom Tabs Active States
    bottomTabs.forEach(t => t?.classList.remove('active'));
    if (tabFabPost) {
      const fabCircle = tabFabPost.querySelector('.fab-circle');
      if (fabCircle) fabCircle.style.transform = (currentFlowStep === 'post') ? 'scale(1.12)' : '';
    }

    if (currentFlowStep === 1 || currentFlowStep === 2 || currentFlowStep === 3 || currentFlowStep === 5) {
      tabHome?.classList.add('active');
    } else if (currentFlowStep === 4) {
      tabChat?.classList.add('active');
    } else if (currentFlowStep === 'search') {
      tabSearch?.classList.add('active');
    } else if (currentFlowStep === 'wallet') {
      tabProfile?.classList.add('active');
    }

    // 5. Update Narrator Panel Info
    const info = narratorContent[currentFlowStep];
    if (info) {
      if (narratorStepPill) narratorStepPill.textContent = info.pill;
      if (narratorHeaderTitle) narratorHeaderTitle.textContent = info.title;
      if (narratorBodyText) narratorBodyText.textContent = info.body;
      if (narratorHighlight1) narratorHighlight1.textContent = info.h1;
      if (narratorHighlight2) narratorHighlight2.textContent = info.h2;

      // Sync Flow Selector Pills
      flowSelPills.forEach(pill => {
        const pFlow = pill.dataset.flow;
        if (pFlow === info.flow) {
          pill.classList.add('active');
          pill.setAttribute('aria-selected', 'true');
        } else {
          pill.classList.remove('active');
          pill.setAttribute('aria-selected', 'false');
        }
      });
    }

    // 6. Update Narrator Dots & Controls (for 5-step escrow exchange)
    const isEscrowStep = (typeof currentFlowStep === 'number');
    narratorDots.forEach(dot => {
      const dStep = parseInt(dot.dataset.step, 10);
      if (isEscrowStep && dStep === currentFlowStep) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    if (btnNarratorPrev) {
      btnNarratorPrev.disabled = (currentFlowStep === 1);
    }
    if (btnNarratorNext) {
      if (currentFlowStep === 5) {
        btnNarratorNext.textContent = 'Khám phá Đăng Đồ →';
      } else if (currentFlowStep === 'search') {
        btnNarratorNext.textContent = '↺ Về Bước 1';
      } else {
        btnNarratorNext.textContent = 'Tiếp theo →';
      }
    }

    // 7. Update Stepper Buttons if present
    stepBtns.forEach(btn => {
      const bStep = parseInt(btn.dataset.step, 10);
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
      if (isEscrowStep && bStep === currentFlowStep) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
      } else if (isEscrowStep && bStep < currentFlowStep) {
        btn.classList.add('completed');
      } else {
        btn.classList.remove('completed');
      }
    });

    // 8. Update Xu balance simulation
    if (flowUserXu) {
      if (currentFlowStep === 3 || currentFlowStep === 4 || currentFlowStep === 5) {
        flowUserXu.textContent = '90 Xu';
      } else {
        flowUserXu.textContent = '100 Xu';
      }
    }
  }

  // Stepper Bar clicks
  stepBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetStep = parseInt(btn.dataset.step, 10);
      setFlowStep(targetStep);
      stopAutoPlay();
    });
  });

  // Narrator Dot clicks (1..5)
  narratorDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const targetStep = parseInt(dot.dataset.step, 10);
      if (targetStep) {
        setFlowStep(targetStep);
        stopAutoPlay();
      }
    });
  });

  // Flow Selector Strip Clicks on Narrator Top
  flowSelPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const flow = pill.dataset.flow;
      stopAutoPlay();
      if (flow === 'escrow') {
        setFlowStep(1);
        showPhoneToast('Mở Luồng: Ký Quỹ Đổi Đồ', 'refresh');
      } else if (flow === 'post') {
        setFlowStep('post');
        showPhoneToast('Mở Luồng: Mẹ Bán Đăng Đồ', 'camera');
      } else if (flow === 'wallet') {
        setFlowStep('wallet');
        showPhoneToast('Mở Luồng: Ví Xu & Uy Tín', 'wallet');
      } else if (flow === 'search') {
        setFlowStep('search');
        showPhoneToast('Mở Luồng: Lọc Bán Kính <1km', 'search');
      }
    });
  });

  // Narrator Prev / Next navigation sequence (5-step core + 3 showcases)
  const flowSequence = [1, 2, 3, 4, 5, 'post', 'wallet', 'search'];

  if (btnNarratorPrev) {
    btnNarratorPrev.addEventListener('click', () => {
      const idx = flowSequence.indexOf(currentFlowStep);
      if (idx > 0) {
        setFlowStep(flowSequence[idx - 1]);
        stopAutoPlay();
      }
    });
  }

  if (btnNarratorNext) {
    btnNarratorNext.addEventListener('click', () => {
      const idx = flowSequence.indexOf(currentFlowStep);
      if (idx < flowSequence.length - 1) {
        setFlowStep(flowSequence[idx + 1]);
      } else {
        setFlowStep(flowSequence[0]);
      }
      stopAutoPlay();
    });
  }

  // ================= PHONE IN-APP TRIGGERS & ACTIONS =================

  // 1. Screen 1 -> Screen 2: Tap item 1
  const btnActionStep1 = document.getElementById('btnActionStep1');
  if (btnActionStep1) {
    const triggerStep1 = () => {
      setFlowStep(2);
      stopAutoPlay();
      showPhoneToast('Đã chọn Bộ đường ray tàu gỗ (10 Xu)', 'box');
    };
    btnActionStep1.addEventListener('click', triggerStep1);
    btnActionStep1.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerStep1();
      }
    });
  }

  // 2. Screen 2 -> Screen 3: Escrow Exchange (Lock 10 Xu)
  const btnActionStep2 = document.getElementById('btnActionStep2');
  if (btnActionStep2) {
    btnActionStep2.addEventListener('click', () => {
      setFlowStep(3);
      stopAutoPlay();
      showPhoneToast('Đã khóa 10 Xu vào Rương Ký Quỹ', 'lock');
    });
  }

  // 3. Screen 3 -> Screen 4: Move to Chat to arrange meetup
  const btnStep3ToChat = document.getElementById('btnStep3ToChat');
  if (btnStep3ToChat) {
    btnStep3ToChat.addEventListener('click', () => {
      setFlowStep(4);
      stopAutoPlay();
      showPhoneToast('Mở trò chuyện hẹn gặp sảnh chung cư', 'chat');
    });
  }

  // 4. Screen 4 (Chat) -> Screen 5: Confirm Meetup & Handover to start 6H Inspection
  const btnChatToInspection = document.getElementById('btnChatToInspection');
  if (btnChatToInspection) {
    btnChatToInspection.addEventListener('click', () => {
      setFlowStep(5);
      stopAutoPlay();
      showPhoneToast('Bắt đầu 6H kiểm định tại nhà', 'clock');
    });
  }

  // Back Buttons
  const btnBackToHome = document.getElementById('btnBackToHome');
  if (btnBackToHome) {
    btnBackToHome.addEventListener('click', () => {
      setFlowStep(1);
      stopAutoPlay();
    });
  }

  const btnBackTo2 = document.getElementById('btnBackTo2');
  if (btnBackTo2) {
    btnBackTo2.addEventListener('click', () => {
      setFlowStep(2);
      stopAutoPlay();
    });
  }

  const btnBackFromChat = document.getElementById('btnBackFromChat');
  if (btnBackFromChat) {
    btnBackFromChat.addEventListener('click', () => {
      setFlowStep(3);
      stopAutoPlay();
    });
  }

  const btnBackTo3 = document.getElementById('btnBackTo3');
  if (btnBackTo3) {
    btnBackTo3.addEventListener('click', () => {
      setFlowStep(4);
      stopAutoPlay();
    });
  }

  const btnBackFromPost = document.getElementById('btnBackFromPost');
  if (btnBackFromPost) {
    btnBackFromPost.addEventListener('click', () => {
      setFlowStep(1);
      stopAutoPlay();
    });
  }

  const btnBackFromWallet = document.getElementById('btnBackFromWallet');
  if (btnBackFromWallet) {
    btnBackFromWallet.addEventListener('click', () => {
      setFlowStep(1);
      stopAutoPlay();
    });
  }

  const btnBackFromSearch = document.getElementById('btnBackFromSearch');
  if (btnBackFromSearch) {
    btnBackFromSearch.addEventListener('click', () => {
      setFlowStep(1);
      stopAutoPlay();
    });
  }

  // Cross-Screen Jump Triggers
  const nativeSearchTrigger = document.getElementById('nativeSearchTrigger');
  if (nativeSearchTrigger) {
    nativeSearchTrigger.addEventListener('click', () => {
      setFlowStep('search');
      stopAutoPlay();
    });
  }

  const btnHomePostTrigger = document.getElementById('btnHomePostTrigger');
  if (btnHomePostTrigger) {
    btnHomePostTrigger.addEventListener('click', () => {
      setFlowStep('post');
      stopAutoPlay();
    });
  }

  const btnNativeProfileTrigger = document.getElementById('btnNativeProfileTrigger');
  if (btnNativeProfileTrigger) {
    btnNativeProfileTrigger.addEventListener('click', () => {
      setFlowStep('wallet');
      stopAutoPlay();
    });
  }

  const btnNativeWalletTrigger = document.getElementById('btnNativeWalletTrigger');
  if (btnNativeWalletTrigger) {
    btnNativeWalletTrigger.addEventListener('click', () => {
      setFlowStep('wallet');
      stopAutoPlay();
    });
  }

  const btnDetailChatTrigger = document.getElementById('btnDetailChatTrigger');
  if (btnDetailChatTrigger) {
    btnDetailChatTrigger.addEventListener('click', () => {
      setFlowStep(4);
      stopAutoPlay();
    });
  }

  const btnContactChatTrigger = document.getElementById('btnContactChatTrigger');
  if (btnContactChatTrigger) {
    btnContactChatTrigger.addEventListener('click', () => {
      setFlowStep(4);
      stopAutoPlay();
    });
  }

  // Bottom Navigation Tabs Handling
  if (tabHome) {
    tabHome.addEventListener('click', () => {
      setFlowStep(1);
      stopAutoPlay();
    });
  }
  if (tabSearch) {
    tabSearch.addEventListener('click', () => {
      setFlowStep('search');
      stopAutoPlay();
    });
  }
  if (tabFabPost) {
    tabFabPost.addEventListener('click', () => {
      setFlowStep('post');
      stopAutoPlay();
    });
  }
  if (tabChat) {
    tabChat.addEventListener('click', () => {
      setFlowStep(4);
      stopAutoPlay();
    });
  }
  if (tabProfile) {
    tabProfile.addEventListener('click', () => {
      setFlowStep('wallet');
      stopAutoPlay();
    });
  }

  // 7. Step 4 Actions: Release Xu & Dispute
  const btnConfirmReleaseXu = document.getElementById('btnConfirmReleaseXu');
  const inspectionActiveBox = document.getElementById('inspectionActiveBox');
  const disputeActiveBox = document.getElementById('disputeActiveBox');
  const exchangeCelebrationBox = document.getElementById('exchangeCelebrationBox');
  const btnRestartFlow = document.getElementById('btnRestartFlow');
  const btnSimulateDispute = document.getElementById('btnSimulateDispute');
  const btnCancelDispute = document.getElementById('btnCancelDispute');

  if (btnConfirmReleaseXu) {
    btnConfirmReleaseXu.addEventListener('click', () => {
      if (inspectionActiveBox && exchangeCelebrationBox) {
        inspectionActiveBox.style.display = 'none';
        if (disputeActiveBox) disputeActiveBox.style.display = 'none';
        exchangeCelebrationBox.classList.remove('hidden');
        exchangeCelebrationBox.style.display = 'block';
        showPhoneToast('Giao dịch thành công! Đã giải ngân Xu', 'check');
      }
      stopAutoPlay();
    });
  }

  if (btnRestartFlow) {
    btnRestartFlow.addEventListener('click', () => {
      setFlowStep(1);
      stopAutoPlay();
      showPhoneToast('Đã đánh giá 5 sao cho Mẹ Mai Thảo', 'star');
    });
  }

  if (btnSimulateDispute) {
    btnSimulateDispute.addEventListener('click', () => {
      if (inspectionActiveBox && disputeActiveBox) {
        inspectionActiveBox.style.display = 'none';
        disputeActiveBox.style.display = 'block';
        showPhoneToast('Đã tiếp nhận khiếu nại! Tạm khóa giải ngân', 'warning');
      }
      stopAutoPlay();
    });
  }

  if (btnCancelDispute) {
    btnCancelDispute.addEventListener('click', () => {
      if (inspectionActiveBox && disputeActiveBox) {
        disputeActiveBox.style.display = 'none';
        inspectionActiveBox.style.display = 'block';
      }
    });
  }

  // 8. Screen Post Interactions (Mode Chips & Submit)
  const chipModeXu = document.getElementById('chipModeXu');
  const chipModeDonate = document.getElementById('chipModeDonate');
  const postXuVal = document.getElementById('postXuVal');
  const postSafeFeeVal = document.getElementById('postSafeFeeVal');
  const postNetRefund = document.getElementById('postNetRefund');
  const btnSubmitPostLabel = document.getElementById('btnSubmitPostLabel');
  const btnSubmitPostDemo = document.getElementById('btnSubmitPostDemo');

  if (chipModeXu && chipModeDonate) {
    chipModeXu.addEventListener('click', () => {
      chipModeXu.classList.add('active');
      chipModeDonate.classList.remove('active');
      if (postXuVal) postXuVal.textContent = '10 Xu';
      if (postSafeFeeVal) postSafeFeeVal.textContent = '1 Xu';
      if (postNetRefund) postNetRefund.textContent = '10 Xu + hoàn 1 Xu cọc';
      if (btnSubmitPostLabel) btnSubmitPostLabel.textContent = 'Đăng Tin & Ký Quỹ 1 Xu Phí Bảo Đảm';
    });

    chipModeDonate.addEventListener('click', () => {
      chipModeDonate.classList.add('active');
      chipModeXu.classList.remove('active');
      if (postXuVal) postXuVal.textContent = '0 Xu (Trạm Tặng)';
      if (postSafeFeeVal) postSafeFeeVal.textContent = '0 Xu (Miễn phí cọc)';
      if (postNetRefund) postNetRefund.textContent = 'Niềm vui chia sẻ cộng đồng';
      if (btnSubmitPostLabel) btnSubmitPostLabel.textContent = 'Đăng Tin Trạm Tặng (0 Xu)';
    });
  }

  if (btnSubmitPostDemo) {
    btnSubmitPostDemo.addEventListener('click', () => {
      showPhoneToast('Đăng đồ thành công! Tin đã xuất hiện trên Trang Chủ', 'check');
      setTimeout(() => {
        setFlowStep(1);
      }, 1500);
      stopAutoPlay();
    });
  }

  // 9. Screen Chat Interactions
  const btnChatCall = document.getElementById('btnChatCall');
  if (btnChatCall) {
    btnChatCall.addEventListener('click', () => {
      showPhoneToast('Đang kết nối gọi thoại an toàn đến Mẹ Mai Thảo', 'phone');
    });
  }

  const btnChatViewEscrow = document.getElementById('btnChatViewEscrow');
  if (btnChatViewEscrow) {
    btnChatViewEscrow.addEventListener('click', () => {
      setFlowStep(3);
      stopAutoPlay();
    });
  }

  const btnDemoSendMsg = document.getElementById('btnDemoSendMsg');
  const chatInputTrigger = document.getElementById('chatInputTrigger');
  const chatMessagesStream = document.getElementById('chatMessagesStream');

  function sendChatSample() {
    if (!chatMessagesStream) return;
    const newBubble = document.createElement('div');
    newBubble.className = 'chat-bubble chat-bubble-outgoing';
    newBubble.innerHTML = `
      <div class="bubble-text">Dạ mẹ ơi mình vừa xuống sảnh rồi nha!</div>
      <div class="bubble-time">Vừa xong</div>
    `;
    chatMessagesStream.appendChild(newBubble);
    chatMessagesStream.scrollTop = chatMessagesStream.scrollHeight;
    showPhoneToast('Đã gửi tin nhắn đến Mẹ Mai Thảo', 'chat');
  }

  if (btnDemoSendMsg) btnDemoSendMsg.addEventListener('click', sendChatSample);
  if (chatInputTrigger) chatInputTrigger.addEventListener('click', sendChatSample);

  // 10. Screen Wallet Actions
  const btnWalletTopUp = document.getElementById('btnWalletTopUp');
  if (btnWalletTopUp) {
    btnWalletTopUp.addEventListener('click', () => {
      showPhoneToast('Nạp Xu VietQR tự động 24/7 (1 Xu = 10.000đ)', 'wallet');
    });
  }

  const btnWalletWithdraw = document.getElementById('btnWalletWithdraw');
  if (btnWalletWithdraw) {
    btnWalletWithdraw.addEventListener('click', () => {
      showPhoneToast('Rút Xu về tài khoản ngân hàng chính chủ', 'wallet');
    });
  }

  const btnWalletEscrowHistory = document.getElementById('btnWalletEscrowHistory');
  if (btnWalletEscrowHistory) {
    btnWalletEscrowHistory.addEventListener('click', () => {
      setFlowStep(3);
      stopAutoPlay();
    });
  }

  const btnWalletDonate = document.getElementById('btnWalletDonate');
  if (btnWalletDonate) {
    btnWalletDonate.addEventListener('click', () => {
      setFlowStep('search');
      stopAutoPlay();
    });
  }

  // 11. Screen Search Actions
  const searchFilterPills = document.querySelectorAll('.search-filter-pill');
  searchFilterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      // sibling pill toggle
      const siblings = pill.parentElement.querySelectorAll('.search-filter-pill');
      siblings.forEach(s => s.classList.remove('active'));
      pill.classList.add('active');
      showPhoneToast(`Đã lọc: ${pill.textContent}`, 'search');
    });
  });

  const searchItemResult1 = document.getElementById('searchItemResult1');
  if (searchItemResult1) {
    searchItemResult1.addEventListener('click', () => {
      setFlowStep(2);
      stopAutoPlay();
    });
  }

  const searchItemResult2 = document.getElementById('searchItemResult2');
  if (searchItemResult2) {
    searchItemResult2.addEventListener('click', () => {
      showPhoneToast('Đã chọn Ô tô mô hình cổ điển (4 Xu)', 'box');
    });
  }

  const searchItemResult3 = document.getElementById('searchItemResult3');
  if (searchItemResult3) {
    searchItemResult3.addEventListener('click', () => {
      showPhoneToast('Trạm Tặng: Bạn có thể nhận món này 0 Xu', 'gift');
    });
  }

  // 12. Full-Cycle Autoplay Engine
  function startAutoPlay() {
    isAutoPlaying = true;
    if (btnAutoPlayToggle) btnAutoPlayToggle.classList.add('playing');
    if (autoPlayLabel) autoPlayLabel.textContent = 'Đang chạy';

    autoPlayInterval = setInterval(() => {
      const idx = flowSequence.indexOf(currentFlowStep);
      if (idx < flowSequence.length - 1) {
        setFlowStep(flowSequence[idx + 1]);
      } else {
        setFlowStep(flowSequence[0]);
      }
    }, 4500);
  }

  function stopAutoPlay() {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
    }
    isAutoPlaying = false;
    if (btnAutoPlayToggle) btnAutoPlayToggle.classList.remove('playing');
    if (autoPlayLabel) autoPlayLabel.textContent = 'Tự chạy';
  }

  if (btnAutoPlayToggle) {
    btnAutoPlayToggle.addEventListener('click', () => {
      if (isAutoPlaying) {
        stopAutoPlay();
      } else {
        startAutoPlay();
      }
    });
  }

  // ================= 2. REAL-TIME WAITLIST API INTEGRATION =================
  const waitlistForm = document.getElementById('waitlistForm');
  const waitlistCounter = document.getElementById('waitlistCounter');
  const waitlistPercent = document.getElementById('waitlistPercent');
  const waitlistProgressBar = document.getElementById('waitlistProgressBar');
  const waitlistRemaining = document.getElementById('waitlistRemaining');
  const navWaitlistCount = document.getElementById('navWaitlistCount');
  const goldCardSerial = document.getElementById('goldCardSerial');
  const goldCardScarcity = document.getElementById('goldCardScarcity');

  const waitlistEmail = document.getElementById('waitlistEmail');
  const waitlistPhone = document.getElementById('waitlistPhone');
  const waitlistConsent = document.getElementById('waitlistConsent');
  const emailError = document.getElementById('emailError');
  const phoneError = document.getElementById('phoneError');
  const consentError = document.getElementById('consentError');

  const successModalOverlay = document.getElementById('successModalOverlay');
  const successModalClose = document.getElementById('successModalClose');
  const successModalTitle = document.getElementById('successModalTitle');
  const successModalDesc = document.getElementById('successModalDesc');
  const successOrderBadge = document.getElementById('successOrderBadge');
  const roleInputs = document.querySelectorAll('input[name="userRole"]');
  const labelEmail = document.getElementById('labelEmail');
  const btnSubmitWaitlist = document.getElementById('btn-submit-waitlist');

  // Client-Side Validation Helpers
  function setEmailError(msg) {
    if (!emailError || !waitlistEmail) return;
    if (msg) {
      waitlistEmail.classList.add('is-invalid');
      emailError.textContent = msg;
      emailError.style.display = 'block';
    } else {
      waitlistEmail.classList.remove('is-invalid');
      emailError.textContent = '';
      emailError.style.display = 'none';
    }
  }

  function setPhoneError(msg) {
    if (!phoneError || !waitlistPhone) return;
    if (msg) {
      waitlistPhone.classList.add('is-invalid');
      phoneError.textContent = msg;
      phoneError.style.display = 'block';
    } else {
      waitlistPhone.classList.remove('is-invalid');
      phoneError.textContent = '';
      phoneError.style.display = 'none';
    }
  }

  function setConsentError(msg) {
    if (!consentError || !waitlistConsent) return;
    if (msg) {
      consentError.textContent = msg;
      consentError.style.display = 'block';
    } else {
      consentError.textContent = '';
      consentError.style.display = 'none';
    }
  }

  function validateEmail(val) {
    const trimmed = (val || '').trim();
    if (!trimmed) {
      setEmailError('Vui lòng nhập địa chỉ email nhận thông báo');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError('Địa chỉ email không đúng định dạng (ví dụ: me@example.com)');
      return false;
    }
    setEmailError('');
    return true;
  }

  function validatePhone(val) {
    const trimmed = (val || '').trim().replace(/[\s.-]/g, '');
    if (!trimmed) {
      setPhoneError('');
      return true; // Phone is optional
    }
    const vnPhoneRegex = /^(0[35789])[0-9]{8}$/;
    if (!vnPhoneRegex.test(trimmed)) {
      setPhoneError('Số điện thoại phải gồm 10 chữ số (ví dụ: 0905123456)');
      return false;
    }
    setPhoneError('');
    return true;
  }

  function validateConsent() {
    if (!waitlistConsent) return true;
    if (!waitlistConsent.checked) {
      setConsentError('Vui lòng tích đồng ý với Chính sách bảo mật để tiếp tục');
      return false;
    }
    setConsentError('');
    return true;
  }

  // Real-time Input Listeners
  if (waitlistEmail) {
    waitlistEmail.addEventListener('input', () => {
      if (waitlistEmail.classList.contains('is-invalid')) {
        validateEmail(waitlistEmail.value);
      }
    });
    waitlistEmail.addEventListener('blur', () => {
      if (waitlistEmail.value.trim()) {
        validateEmail(waitlistEmail.value);
      }
    });
  }

  if (waitlistPhone) {
    waitlistPhone.addEventListener('input', () => {
      if (waitlistPhone.classList.contains('is-invalid')) {
        validatePhone(waitlistPhone.value);
      }
    });
    waitlistPhone.addEventListener('blur', () => {
      if (waitlistPhone.value.trim()) {
        validatePhone(waitlistPhone.value);
      }
    });
  }

  if (waitlistConsent) {
    waitlistConsent.addEventListener('change', () => {
      if (waitlistConsent.checked) {
        setConsentError('');
      }
    });
  }

  // Role toggle
  roleInputs.forEach(r => {
    r.addEventListener('change', () => {
      if (r.value === 'genz') {
        if (labelEmail) labelEmail.innerHTML = 'Email của bạn (để nhận thông báo gửi Mẹ/Chị) <span class="text-coral">*</span>';
      } else {
        if (labelEmail) labelEmail.innerHTML = 'Địa chỉ Email nhận thông báo <span class="text-coral">*</span>';
      }
    });
  });

  function updateTrackerUI(total, target, remaining, percentage) {
    if (waitlistCounter) waitlistCounter.textContent = `${total} / ${target} Mẹ`;
    if (waitlistPercent) waitlistPercent.textContent = `${percentage}% Đạt Mốc`;
    if (waitlistProgressBar) waitlistProgressBar.style.width = `${percentage}%`;
    if (waitlistRemaining) waitlistRemaining.textContent = `${remaining} suất`;
    if (navWaitlistCount) navWaitlistCount.textContent = total;
    const currentCardNum = total === 0 ? 1 : total;
    if (goldCardSerial) goldCardSerial.textContent = `MÃ THẺ: #KD-${String(currentCardNum).padStart(4, '0')}/${target}`;
    if (goldCardScarcity) {
      if (remaining > 0) {
        goldCardScarcity.textContent = `Chỉ còn ${remaining} suất đầu tiên`;
      } else {
        goldCardScarcity.textContent = `Đã đủ 200 suất đầu tiên`;
      }
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/waitlist/stats`);
      if (!res.ok) throw new Error('API Offline');
      const data = await res.json();
      const s = data.data || data;
      updateTrackerUI(s.total, s.target, s.remaining, s.percentage);
    } catch {
      // Keep existing displayed numbers gracefully
    }
  }

  // Initial fetch and synchronization poller (every 30s, paused when tab is hidden)
  fetchStats();
  setInterval(() => {
    if (!document.hidden) {
      fetchStats();
    }
  }, 30000);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      fetchStats();
    }
  });

  // Modal Open & Close with Focus Trap and Esc Key
  let previousActiveElement = null;

  function openSuccessModal() {
    if (!successModalOverlay) return;
    previousActiveElement = document.activeElement;
    successModalOverlay.classList.add('active');
    if (successModalClose) {
      successModalClose.focus();
    }
  }

  function closeSuccessModal() {
    if (!successModalOverlay) return;
    successModalOverlay.classList.remove('active');
    if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
      previousActiveElement.focus();
    }
  }

  if (waitlistForm) {
    waitlistForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const isEmailValid = validateEmail(waitlistEmail ? waitlistEmail.value : '');
      const isPhoneValid = validatePhone(waitlistPhone ? waitlistPhone.value : '');
      const isConsentValid = validateConsent();

      if (!isEmailValid) {
        if (waitlistEmail) waitlistEmail.focus();
        return;
      }
      if (!isPhoneValid) {
        if (waitlistPhone) waitlistPhone.focus();
        return;
      }
      if (!isConsentValid) {
        if (waitlistConsent) waitlistConsent.focus();
        return;
      }

      const interestInput = waitlistForm.querySelector('input[name="interest"]:checked');
      const selectedRole = waitlistForm.querySelector('input[name="userRole"]:checked');
      const submitBtn = document.getElementById('btn-submit-waitlist');

      const origBtn = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 0.8s linear infinite; vertical-align: middle; margin-right: 6px;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><span>Đang đăng ký & gửi email...</span>';

      try {
        const payloadRole = selectedRole && selectedRole.value === 'genz' ? 'genz' : 'mom';
        const response = await fetch(`${API_BASE_URL}/api/waitlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: waitlistEmail.value.trim(),
            phone: waitlistPhone ? waitlistPhone.value.trim() : '',
            userRole: payloadRole,
            interest: interestInput ? interestInput.value : 'Đồ chơi vận động',
            consent: true,
            utmSource: 'landing_compact',
            utmMedium: payloadRole,
            utmCampaign: 'pilot_danang'
          })
        });

        const json = await response.json();

        if (response.ok && json.success) {
          const orderNum = json.orderNumber || json.data?.orderNumber || 1;
          const newTotal = json.total || json.data?.total;
          const newTarget = json.target || json.data?.target || 200;
          const newRemaining = json.remaining ?? json.data?.remaining ?? (newTarget - (newTotal || 0));
          const newPct = json.percentage ?? json.data?.percentage ?? Math.round(((newTotal || 0) / newTarget) * 100);

          if (json.alreadyRegistered) {
            if (successModalTitle) successModalTitle.textContent = 'Email Đã Được Đăng Ký Giữ Chỗ';
            if (successOrderBadge) successOrderBadge.textContent = 'Thông Tin Đã Được Bảo Lưu';
            if (successModalDesc) {
              successModalDesc.innerHTML = `Hòm thư của mẹ/bạn đã có trong danh sách giữ chỗ trước đó! Gói quà 5 Xu Tiên Phong đã được lưu trữ an toàn. Kindr sẽ gửi email thông báo ngay khi cụm thử nghiệm mở cửa.`;
            }
          } else {
            const isFounding = json.foundingMember ?? true;
            if (isFounding) {
              if (successModalTitle) successModalTitle.textContent = 'Chào Mừng Mẹ Tiên Phong!';
              if (successOrderBadge) successOrderBadge.textContent = `Mẹ/Bạn là thành viên thứ #${orderNum}`;
              if (successModalDesc) {
                successModalDesc.innerHTML = `Kindr đã ghi nhận thông tin và gửi email xác nhận đến hòm thư của bạn! Gói quà <strong>5 Xu Tiên Phong</strong> đã được khóa bảo lưu và sẽ gửi thẳng vào ví tài khoản của bạn khi hệ thống chính thức mở cửa!`;
              }
            } else {
              if (successModalTitle) successModalTitle.textContent = 'Chào Mừng Đến Với Kindr!';
              if (successOrderBadge) successOrderBadge.textContent = `Thành viên thứ #${orderNum}`;
              if (successModalDesc) {
                successModalDesc.innerHTML = `Kindr đã ghi nhận thông tin giữ chỗ của bạn vào danh sách chờ thử nghiệm Đà Nẵng!`;
              }
            }
          }

          // Immediate real-time UI progression
          if (newTotal) {
            updateTrackerUI(newTotal, newTarget, newRemaining, newPct);
          } else {
            fetchStats();
          }

          openSuccessModal();

          waitlistForm.reset();
          setEmailError('');
          setPhoneError('');
          setConsentError('');
        } else {
          const errText = json.error || json.message || 'Có lỗi xảy ra, mẹ vui lòng thử lại sau nhé!';
          setEmailError(errText);
          if (waitlistEmail) waitlistEmail.focus();
        }
      } catch (err) {
        console.error('Waitlist submit error:', err);
        setEmailError('Không thể kết nối máy chủ. Mẹ vui lòng kiểm tra kết nối mạng nhé!');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origBtn;
      }
    });
  }

  // ================= POP-UP FPT PLAZA SURVEY (5 CÂU HỎI -> ĐIỀN KHUNG BÊN DƯỚI) =================
  (() => {
    const form = document.getElementById('surveyForm');
    if (!form) return;

    const TOTAL_QUESTIONS = 5;
    const steps = Array.from(form.querySelectorAll('.survey-step'));
    const progress = document.getElementById('surveyProgress');
    const progressFill = document.getElementById('surveyProgressFill');
    const stepLabel = document.getElementById('surveyStepLabel');
    const backBtn = document.getElementById('btn-survey-back');
    const slotsEl = document.getElementById('surveySlotsLeft');
    const resultEl = document.getElementById('surveyResult');
    const navEl = backBtn ? backBtn.parentElement : null;
    const scrollBtn = document.getElementById('btn-survey-scroll-waitlist');

    const answers = {};
    let current = 1;

    const showStep = (n, moveFocus = true) => {
      current = n;
      steps.forEach((s) => s.classList.toggle('active', Number(s.dataset.step) === n));
      const answered = Math.min(n - 1, TOTAL_QUESTIONS);
      if (progressFill) progressFill.style.width = `${(answered / TOTAL_QUESTIONS) * 100}%`;
      if (progress) progress.setAttribute('aria-valuenow', String(answered));
      if (stepLabel) stepLabel.textContent = `Câu hỏi ${n} / ${TOTAL_QUESTIONS}`;
      if (backBtn) backBtn.disabled = n === 1;
      const active = steps[n - 1];
      const focusTarget = active ? (active.querySelector('.survey-choice.selected') || active.querySelector('.survey-choice')) : null;
      if (moveFocus && focusTarget) focusTarget.focus({ preventScroll: true });
    };

    const scrollToWaitlist = () => {
      const waitlistSec = document.getElementById('waitlist');
      if (waitlistSec) {
        waitlistSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const emailInput = document.getElementById('waitlistEmail');
        if (emailInput) setTimeout(() => emailInput.focus(), 650);
      }
    };

    const completeSurvey = () => {
      if (progressFill) progressFill.style.width = '100%';
      if (progress) progress.setAttribute('aria-valuenow', String(TOTAL_QUESTIONS));
      if (stepLabel) stepLabel.textContent = 'Hoàn thành 5/5 câu hỏi';
      form.hidden = true;
      if (navEl) navEl.hidden = true;
      if (resultEl) {
        resultEl.hidden = false;
        resultEl.setAttribute('tabindex', '-1');
        resultEl.focus({ preventScroll: true });
      }

      // Lưu câu trả lời khảo sát để đồng bộ cùng form đăng ký
      window.kindrSurveyAnswers = { ...answers };
      try {
        localStorage.setItem('kindr_survey_answers', JSON.stringify(answers));
      } catch (e) {}

      // Tự động cuộn mượt xuống khung Cán mốc 200 Mẹ Tiên Phong bên dưới sau 650ms
      setTimeout(scrollToWaitlist, 650);
    };

    form.addEventListener('click', (e) => {
      const btn = e.target.closest('.survey-choice');
      if (!btn) return;
      const { key, value } = btn.dataset;
      answers[key] = value === 'true' ? true : value === 'false' ? false : value;
      btn.parentElement.querySelectorAll('.survey-choice').forEach((b) => {
        const isSel = b === btn;
        b.classList.toggle('selected', isSel);
        b.setAttribute('aria-pressed', String(isSel));
      });

      if (current < TOTAL_QUESTIONS) {
        setTimeout(() => showStep(current + 1), 220);
      } else {
        setTimeout(completeSurvey, 260);
      }
    });

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (current > 1) showStep(current - 1);
      });
    }

    if (scrollBtn) {
      scrollBtn.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToWaitlist();
      });
    }

    showStep(1, false);
  })();

  if (successModalClose) {
    successModalClose.addEventListener('click', closeSuccessModal);
  }
  const btnModalCloseSecondary = document.getElementById('btnModalCloseSecondary');
  if (btnModalCloseSecondary) {
    btnModalCloseSecondary.addEventListener('click', closeSuccessModal);
  }
  window.addEventListener('click', (e) => {
    if (e.target === successModalOverlay) {
      closeSuccessModal();
    }
  });

  // Modal Focus Trap & Esc Key
  window.addEventListener('keydown', (e) => {
    if (!successModalOverlay || !successModalOverlay.classList.contains('active')) return;
    if (e.key === 'Escape') {
      closeSuccessModal();
      return;
    }
    if (e.key === 'Tab') {
      const focusable = successModalOverlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const firstElem = focusable[0];
      const lastElem = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === firstElem) {
        e.preventDefault();
        lastElem.focus();
      } else if (!e.shiftKey && document.activeElement === lastElem) {
        e.preventDefault();
        firstElem.focus();
      }
    }
  });

  // ================= 3. COMPACT FAQ ACCORDION =================
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const q = item.querySelector('.faq-q');
    if (q) {
      q.addEventListener('click', () => {
        const isOpen = item.classList.contains('active');
        faqItems.forEach(i => i.classList.remove('active'));
        if (!isOpen) {
          item.classList.add('active');
        }
      });
    }
  });

  // ================= 4. FLOATING MASCOT COMPANION (GẤU KINDY) =================
  const mascotAvatarBtn = document.getElementById('mascotAvatarBtn');
  const mascotBubble = document.getElementById('mascotBubble');
  const bubbleCloseBtn = document.getElementById('bubbleCloseBtn');
  const mascotQuote = document.getElementById('mascotQuote');

  const mascotQuotes = [
    'Chào mẹ! Em là Gấu Kindy — Xu được bảo chứng an toàn qua Ký Quỹ Song Phương minh bạch nhé!',
    'Khung giờ 6 tiếng kiểm định: Mẹ mang đồ về phòng kiểm tra êm ái, ưng ý mới bấm chuyển Xu cho người bán!',
    'Người bán cọc 10% Xu cam kết mô tả trung thực — hạn chế tối đa tình trạng đồ lỗi hay ảnh mạng!',
    'Mẹ để lại email bên dưới để nhận ngay 5 Xu Tiên Phong (tương đương 50.000 VNĐ) vào ví nhé!',
    'Gặp nhau ngay sảnh chung cư hoặc công viên gần nhà — siêu cục bộ Đà Nẵng, an tâm và tiện lợi!'
  ];
  let quoteIndex = 0;

  function cycleMascotQuote() {
    if (!mascotQuote) return;
    mascotQuote.style.opacity = '0';
    setTimeout(() => {
      quoteIndex = (quoteIndex + 1) % mascotQuotes.length;
      mascotQuote.textContent = mascotQuotes[quoteIndex];
      mascotQuote.style.transition = 'opacity 0.3s ease';
      mascotQuote.style.opacity = '1';
    }, 200);
  }

  let bubbleAutoDismissTimeout = null;

  if (mascotAvatarBtn) {
    mascotAvatarBtn.addEventListener('click', () => {
      // Trigger wobble bounce animation
      mascotAvatarBtn.classList.remove('mascot-wobble');
      void mascotAvatarBtn.offsetWidth; // trigger reflow
      mascotAvatarBtn.classList.add('mascot-wobble');

      if (mascotBubble) {
        if (mascotBubble.classList.contains('hidden')) {
          mascotBubble.classList.remove('hidden');
          // Auto-dismiss after 8s so it never permanently blocks content
          clearTimeout(bubbleAutoDismissTimeout);
          bubbleAutoDismissTimeout = setTimeout(() => {
            mascotBubble.classList.add('hidden');
          }, 8000);
        } else {
          cycleMascotQuote();
        }
      }
    });
  }

  if (bubbleCloseBtn && mascotBubble) {
    bubbleCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearTimeout(bubbleAutoDismissTimeout);
      mascotBubble.classList.add('hidden');
    });
  }

  // ================= 5. 3D PERSPECTIVE TILT ON HOVER (DESKTOP) =================
  const tiltElements = document.querySelectorAll('.bento-card, .phone-outer-frame, .founding-gold-card');
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!isTouchDevice && !prefersReducedMotion) {
    tiltElements.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -4;
        const rotateY = ((x - centerX) / centerX) * 4;

        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-3px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
      });
    });
  }

  // ================= 6. CLOCK PULSE ON SAFEFUL TIME =================
  const clockIcons = document.querySelectorAll('.bento-clock-badge, .bento-clock-icon');
  clockIcons.forEach(icon => icon.classList.add('clock-pulse-active'));

  // ================= 7. FOOTER BACK TO TOP SMOOTH SCROLL =================
  const btnBackToTop = document.getElementById('btnBackToTop');
  if (btnBackToTop) {
    btnBackToTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
});
