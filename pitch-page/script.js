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

  // ================= 1. 4-STEP INTERACTIVE FLOW CONTROLLER =================
  let currentFlowStep = 1;
  let autoPlayInterval = null;
  let isAutoPlaying = false;
  let safefulTimerInterval = null;

  const flowScreens = {
    1: document.getElementById('flowScreen1'),
    2: document.getElementById('flowScreen2'),
    3: document.getElementById('flowScreen3'),
    4: document.getElementById('flowScreen4')
  };

  const stepBtns = document.querySelectorAll('.flow-step-btn');
  const narratorDots = document.querySelectorAll('.n-dot');
  const narratorStepPill = document.getElementById('narratorStepPill');
  const narratorHeaderTitle = document.getElementById('narratorHeaderTitle');
  const narratorBodyText = document.getElementById('narratorBodyText');
  const btnNarratorPrev = document.getElementById('btnNarratorPrev');
  const btnNarratorNext = document.getElementById('btnNarratorNext');
  const btnAutoPlayToggle = document.getElementById('btnAutoPlayToggle');
  const autoPlayLabel = document.getElementById('autoPlayLabel');
  const flowUserXu = document.getElementById('flowUserXu');

  const narratorContent = {
    1: {
      pill: 'Bước 1: Chọn Đồ',
      title: 'Khám phá đồ mẹ bé chất lượng gần nhà trong bán kính 1km',
      body: 'Giao diện thực tế của app Kindr: Mẹ Lan duyệt nguồn cấp đồ chơi gần nhà. Chạm vào món "Bộ đường ray tàu gỗ" để xem chi tiết.'
    },
    2: {
      pill: 'Bước 2: Ký Quỹ Kép',
      title: 'Cơ chế Double Escrow bảo vệ giao dịch song phương',
      body: 'Người bán cọc 1 Xu SafeFee (10%), người mua khóa 10 Xu. Hệ thống ký quỹ tạm giữ an toàn, chưa chuyển cho người bán.'
    },
    3: {
      pill: 'Bước 3: Nhận Đồ',
      title: 'Tạm khóa Xu ký quỹ & Mở liên hệ hẹn gặp',
      body: 'Hệ thống mở số liên hệ của người bán để hai mẹ tự hẹn gặp giao nhận tiện đường. Nhận đồ và xác nhận mã 6 ký tự để bắt đầu 6H.'
    },
    4: {
      pill: 'Bước 4: 6H Kiểm Định',
      title: 'Mang về phòng cho bé kiểm tra 6 tiếng trước khi tất toán',
      body: 'Nếu đồ đúng mô tả, mẹ bấm Giải phóng Xu. Nếu phát sinh sai lệch, bấm Khiếu nại để Ban quản trị tạm khóa giải ngân và đối soát.'
    }
  };

  // Safeful 6H Live Countdown Timer
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

  function setFlowStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > 4) return;
    currentFlowStep = stepNumber;

    // Update screens
    Object.keys(flowScreens).forEach(key => {
      const screen = flowScreens[key];
      if (screen) {
        if (parseInt(key, 10) === currentFlowStep) {
          screen.classList.add('active');
        } else {
          screen.classList.remove('active');
        }
      }
    });

    // Reset Step 4 sub-states when navigating
    if (inspectionActiveBox) inspectionActiveBox.style.display = 'block';
    if (disputeActiveBox) disputeActiveBox.style.display = 'none';
    if (exchangeCelebrationBox) {
      exchangeCelebrationBox.classList.add('hidden');
      exchangeCelebrationBox.style.display = 'none';
    }

    // Manage 6H Timer
    if (currentFlowStep === 4) {
      startSafefulTimer();
    } else {
      stopSafefulTimer();
    }

    // Update Stepper Buttons
    stepBtns.forEach(btn => {
      const bStep = parseInt(btn.dataset.step, 10);
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
      if (bStep === currentFlowStep) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
      } else if (bStep < currentFlowStep) {
        btn.classList.add('completed');
      } else {
        btn.classList.remove('completed');
      }
    });

    // Update Narrator Panel
    const info = narratorContent[currentFlowStep];
    if (info) {
      if (narratorStepPill) narratorStepPill.textContent = info.pill;
      if (narratorHeaderTitle) narratorHeaderTitle.textContent = info.title;
      if (narratorBodyText) narratorBodyText.textContent = info.body;
    }

    // Update Narrator Dots
    narratorDots.forEach(dot => {
      const dStep = parseInt(dot.dataset.step, 10);
      if (dStep === currentFlowStep) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    // Update Prev / Next Controls
    if (btnNarratorPrev) {
      btnNarratorPrev.disabled = (currentFlowStep === 1);
    }
    if (btnNarratorNext) {
      btnNarratorNext.textContent = (currentFlowStep === 4) ? '↺ Về Bước 1' : 'Tiếp theo →';
    }

    // Update Xu balance simulation
    if (flowUserXu) {
      if (currentFlowStep >= 2) {
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

  // Narrator Dot clicks
  narratorDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const targetStep = parseInt(dot.dataset.step, 10);
      if (targetStep) {
        setFlowStep(targetStep);
        stopAutoPlay();
      }
    });
  });

  // Narrator Prev / Next clicks
  if (btnNarratorPrev) {
    btnNarratorPrev.addEventListener('click', () => {
      if (currentFlowStep > 1) {
        setFlowStep(currentFlowStep - 1);
        stopAutoPlay();
      }
    });
  }

  if (btnNarratorNext) {
    btnNarratorNext.addEventListener('click', () => {
      if (currentFlowStep < 4) {
        setFlowStep(currentFlowStep + 1);
      } else {
        setFlowStep(1);
      }
      stopAutoPlay();
    });
  }

  // In-Screen Action Buttons with keyboard a11y
  const btnActionStep1 = document.getElementById('btnActionStep1');
  if (btnActionStep1) {
    const triggerStep1 = () => {
      setFlowStep(2);
      stopAutoPlay();
    };
    btnActionStep1.addEventListener('click', triggerStep1);
    btnActionStep1.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerStep1();
      }
    });
  }

  const btnActionStep2 = document.getElementById('btnActionStep2');
  if (btnActionStep2) {
    btnActionStep2.addEventListener('click', () => {
      setFlowStep(3);
      stopAutoPlay();
    });
  }

  const btnActionStep3 = document.getElementById('btnActionStep3');
  if (btnActionStep3) {
    btnActionStep3.addEventListener('click', () => {
      setFlowStep(4);
      stopAutoPlay();
    });
  }

  // Back Navigation Handlers
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

  const btnBackTo3 = document.getElementById('btnBackTo3');
  if (btnBackTo3) {
    btnBackTo3.addEventListener('click', () => {
      setFlowStep(3);
      stopAutoPlay();
    });
  }

  // Native Bottom Tabs Navigation
  const tabHome = document.getElementById('tabHome');
  if (tabHome) {
    tabHome.addEventListener('click', () => {
      setFlowStep(1);
      stopAutoPlay();
    });
  }

  // Step 4: In-Screen Substates (Release Xu, Dispute Simulation, Cancel Dispute)
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
      }
      stopAutoPlay();
    });
  }

  if (btnRestartFlow) {
    btnRestartFlow.addEventListener('click', () => {
      setFlowStep(1);
      stopAutoPlay();
    });
  }

  // In-Screen Dispute Simulation (NO alert())
  if (btnSimulateDispute) {
    btnSimulateDispute.addEventListener('click', () => {
      if (inspectionActiveBox && disputeActiveBox) {
        inspectionActiveBox.style.display = 'none';
        disputeActiveBox.style.display = 'block';
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

  // Auto-play Toggle
  function startAutoPlay() {
    isAutoPlaying = true;
    if (btnAutoPlayToggle) btnAutoPlayToggle.classList.add('playing');
    if (autoPlayLabel) autoPlayLabel.textContent = 'Đang chạy';

    autoPlayInterval = setInterval(() => {
      if (currentFlowStep < 4) {
        setFlowStep(currentFlowStep + 1);
      } else {
        setFlowStep(1);
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
    'Chào mẹ! Em là Gấu Kindy — Xu được bảo chứng minh bạch qua Ký Quỹ Double Escrow nhé!',
    'Khung giờ 6H Safeful Time: Mẹ mang đồ về phòng ngủ kiểm tra êm ái, ưng ý mới chuyển Xu cho người bán!',
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
