/**
 * KINDR — DENSE & HIGH SIGNAL INTERACTIVE SCRIPT
 * Manages Console Mode Switching, Escrow Sandbox, ROI Slider & Real-time Waitlist
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
      title: 'Khám phá đồ mẹ bé chất lượng cao bán kính < 1km',
      body: 'Giao diện chính xác của app Kindr: Mẹ Lan duyệt nguồn cấp đồ chơi gần nhà. Chạm vào món "Xe hơi cổ tích" để xem chi tiết.'
    },
    2: {
      pill: 'Bước 2: Ký Quỹ Kép',
      title: 'Cơ chế Double Escrow bảo chứng 100% an toàn',
      body: 'Người bán đã cọc 1 Xu SafeFee (10%), người mua khóa 10 Xu. Xu được Rương Escrow giữ hộ, chưa chuyển cho người bán.'
    },
    3: {
      pill: 'Bước 3: Nhận Đồ',
      title: 'Đang tạm khóa Xu ký quỹ & Mở khóa liên hệ SĐT/Zalo',
      body: 'Hệ thống mở khóa số điện thoại và Zalo của Mẹ Mai Thảo để hai mẹ tự hẹn gặp giao nhận tiện đường. Nhận xong bấm Bắt đầu 6H.'
    },
    4: {
      pill: 'Bước 4: 6H Kiểm Định',
      title: 'Mang về phòng ngủ cho bé dùng thử 6 tiếng rồi mới giải ngân',
      body: 'Nếu đồ êm đúng mô tả, mẹ bấm Giải phóng Xu ngay. Nếu có lỗi trầy bánh, bấm Khiếu nại để nhận lại 100% Xu tức thì.'
    }
  };

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

    // Update Stepper Buttons (if any exist)
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

  // In-Screen Action Buttons
  const btnActionStep1 = document.getElementById('btnActionStep1');
  if (btnActionStep1) {
    btnActionStep1.addEventListener('click', () => {
      setFlowStep(2);
      stopAutoPlay();
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

  // Step 4: Release Xu & Celebration
  const btnConfirmReleaseXu = document.getElementById('btnConfirmReleaseXu');
  const inspectionActiveBox = document.getElementById('inspectionActiveBox');
  const exchangeCelebrationBox = document.getElementById('exchangeCelebrationBox');
  const btnRestartFlow = document.getElementById('btnRestartFlow');
  const btnSimulateDispute = document.getElementById('btnSimulateDispute');

  if (btnConfirmReleaseXu) {
    btnConfirmReleaseXu.addEventListener('click', () => {
      if (inspectionActiveBox && exchangeCelebrationBox) {
        inspectionActiveBox.style.display = 'none';
        exchangeCelebrationBox.classList.remove('hidden');
        exchangeCelebrationBox.style.display = 'block';
      }
      stopAutoPlay();
    });
  }

  if (btnRestartFlow) {
    btnRestartFlow.addEventListener('click', () => {
      if (inspectionActiveBox && exchangeCelebrationBox) {
        inspectionActiveBox.style.display = 'block';
        exchangeCelebrationBox.classList.add('hidden');
        exchangeCelebrationBox.style.display = 'none';
      }
      setFlowStep(1);
      stopAutoPlay();
    });
  }

  if (btnSimulateDispute) {
    btnSimulateDispute.addEventListener('click', () => {
      alert('[Khung Giờ Vàng 6H Safeful Time - Bảo Chứng Kindr]\n\nMẹ bấm khiếu nại chất lượng vì xe bị kẹt bánh hoặc không đúng cam kết.\n\nHệ thống lập tức đóng băng lệnh giải ngân, Ban Quản Trị đối soát và hoàn trả 100% (10 Xu) về ví của mẹ!');
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
        // Reset substate if was celebrated
        if (inspectionActiveBox && exchangeCelebrationBox) {
          inspectionActiveBox.style.display = 'block';
          exchangeCelebrationBox.classList.add('hidden');
          exchangeCelebrationBox.style.display = 'none';
        }
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

  // Live countdown ticker in Step 4
  const liveSafefulDigits = document.getElementById('liveSafefulDigits');
  let countdownSecs = 5 * 3600 + 59 * 60 + 42;
  setInterval(() => {
    if (countdownSecs > 0) {
      countdownSecs--;
      const hrs = Math.floor(countdownSecs / 3600);
      const mins = Math.floor((countdownSecs % 3600) / 60);
      const secs = countdownSecs % 60;
      const pad = (n) => String(n).padStart(2, '0');
      if (liveSafefulDigits) {
        liveSafefulDigits.textContent = `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
      }
    }
  }, 1000);

  // ================= 5. REAL-TIME WAITLIST API INTEGRATION =================
  const waitlistForm = document.getElementById('waitlistForm');
  const waitlistCounter = document.getElementById('waitlistCounter');
  const waitlistPercent = document.getElementById('waitlistPercent');
  const waitlistProgressBar = document.getElementById('waitlistProgressBar');
  const waitlistRemaining = document.getElementById('waitlistRemaining');
  const navWaitlistCount = document.getElementById('navWaitlistCount');
  const goldCardSerial = document.getElementById('goldCardSerial');

  const waitlistEmail = document.getElementById('waitlistEmail');
  const waitlistPhone = document.getElementById('waitlistPhone');
  const emailError = document.getElementById('emailError');
  const phoneError = document.getElementById('phoneError');

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
      setPhoneError('Số điện thoại / Zalo phải gồm 10 chữ số (ví dụ: 0905123456)');
      return false;
    }
    setPhoneError('');
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

  // Role toggle
  roleInputs.forEach(r => {
    r.addEventListener('change', () => {
      if (r.value === 'genz') {
        if (labelEmail) labelEmail.innerHTML = 'Email của bạn (để nhận thông báo gửi Mẹ/Chị) <span class="text-coral">*</span>';
        if (btnSubmitWaitlist) {
          const span = btnSubmitWaitlist.querySelector('span');
          if (span) span.textContent = 'Đăng Ký Giữ Chỗ & Nhận 5 Xu Tiên Phong';
        }
      } else {
        if (labelEmail) labelEmail.innerHTML = 'Địa chỉ Email nhận thông báo <span class="text-coral">*</span>';
        if (btnSubmitWaitlist) {
          const span = btnSubmitWaitlist.querySelector('span');
          if (span) span.textContent = 'Đăng Ký Giữ Chỗ & Nhận 5 Xu Tiên Phong';
        }
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

  // Initial fetch and real-time live synchronization poller (every 4s)
  fetchStats();
  setInterval(fetchStats, 4000);

  if (waitlistForm) {
    waitlistForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const isEmailValid = validateEmail(waitlistEmail ? waitlistEmail.value : '');
      const isPhoneValid = validatePhone(waitlistPhone ? waitlistPhone.value : '');

      if (!isEmailValid) {
        if (waitlistEmail) waitlistEmail.focus();
        return;
      }
      if (!isPhoneValid) {
        if (waitlistPhone) waitlistPhone.focus();
        return;
      }

      const interestInput = waitlistForm.querySelector('input[name="interest"]:checked');
      const selectedRole = waitlistForm.querySelector('input[name="userRole"]:checked');
      const submitBtn = document.getElementById('btn-submit-waitlist');

      const origBtn = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 0.8s linear infinite; vertical-align: middle; margin-right: 6px;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><span>Đang đăng ký & gửi email...</span>';

      try {
        const response = await fetch(`${API_BASE_URL}/api/waitlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: waitlistEmail.value.trim(),
            phone: waitlistPhone ? waitlistPhone.value.trim() : '',
            userRole: selectedRole ? selectedRole.value : 'mother',
            interest: interestInput ? interestInput.value : 'Đồ chơi vận động',
            utmSource: 'landing_compact',
            utmMedium: selectedRole ? selectedRole.value : 'web',
            utmCampaign: 'pilot_danang'
          })
        });

        const json = await response.json();

        if (response.ok && json.success) {
          const orderNum = json.orderNumber || json.data?.orderNumber || 1;
          const newTotal = json.total || json.data?.total;
          const newTarget = json.target || json.data?.target || 200;
          const newRemaining = json.remaining ?? json.data?.remaining ?? (newTarget - newTotal);
          const newPct = json.percentage ?? json.data?.percentage ?? Math.round((newTotal / newTarget) * 100);

          if (json.alreadyRegistered) {
            if (successModalTitle) successModalTitle.textContent = 'Mẹ/Bạn Đã Đăng Ký Giữ Chỗ Trước Đó!';
            if (successOrderBadge) successOrderBadge.textContent = `Số thứ tự ưu đãi của bạn: #${orderNum}`;
            if (successModalDesc) {
              successModalDesc.innerHTML = `Bạn đã giữ chỗ thành công trước đó với vị trí thành viên <strong>#${orderNum}</strong> (gói quà 5 Xu Tiên Phong đã được lưu trữ an toàn). Hiện tại cộng đồng đã có <strong>${newTotal}/200 Mẹ</strong> tham gia!`;
            }
          } else {
            if (successModalTitle) successModalTitle.textContent = 'Chào Mừng Mẹ Tiên Phong!';
            if (successOrderBadge) successOrderBadge.textContent = `Mẹ/Bạn là thành viên thứ #${orderNum}`;
            if (successModalDesc) {
              successModalDesc.innerHTML = `Kindr đã ghi nhận thông tin và gửi email xác nhận đến hòm thư của bạn! Gói quà <strong>5 Xu Tiên Phong</strong> đã được khóa bảo lưu và sẽ gửi thẳng vào ví tài khoản của bạn khi hệ thống chính thức mở cửa!`;
            }
          }

          // Immediate real-time UI progression!
          if (newTotal) {
            updateTrackerUI(newTotal, newTarget, newRemaining, newPct);
          } else {
            fetchStats();
          }

          if (successModalOverlay) {
            successModalOverlay.classList.add('active');
          }

          waitlistForm.reset();
          setEmailError('');
          setPhoneError('');
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

  // ================= ZALO SHARE BUTTON =================
  const btnShareZalo = document.getElementById('btnShareZalo');
  const zaloToast = document.getElementById('zaloToast');

  if (btnShareZalo) {
    btnShareZalo.addEventListener('click', () => {
      const shareText = `Mẹ/chị ơi, con vừa đăng ký nhận thông báo và giữ chỗ nhận 5 Xu Tiên Phong (trị giá 50.000đ) trên nền tảng Kindr để đổi đồ dùng em bé an toàn tại Đà Nẵng nè! Con gửi mẹ xem thử nè: ${window.location.origin}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareText).then(() => {
          if (zaloToast) {
            zaloToast.classList.add('show');
            setTimeout(() => zaloToast.classList.remove('show'), 4000);
          }
          setTimeout(() => {
            window.open('https://zalo.me', '_blank');
          }, 500);
        }).catch(() => {
          window.open('https://zalo.me', '_blank');
        });
      } else {
        window.open('https://zalo.me', '_blank');
      }
    });
  }

  if (successModalClose) {
    successModalClose.addEventListener('click', () => {
      successModalOverlay.classList.remove('active');
    });
  }
  const btnModalCloseSecondary = document.getElementById('btnModalCloseSecondary');
  if (btnModalCloseSecondary) {
    btnModalCloseSecondary.addEventListener('click', () => {
      successModalOverlay.classList.remove('active');
    });
  }
  window.addEventListener('click', (e) => {
    if (e.target === successModalOverlay) {
      successModalOverlay.classList.remove('active');
    }
  });

  // ================= 6. COMPACT FAQ ACCORDION =================
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

  // ================= 7. FLOATING MASCOT COMPANION (GẤU KINDY) =================
  const mascotAvatarBtn = document.getElementById('mascotAvatarBtn');
  const mascotBubble = document.getElementById('mascotBubble');
  const bubbleCloseBtn = document.getElementById('bubbleCloseBtn');
  const mascotQuote = document.getElementById('mascotQuote');

  const mascotQuotes = [
    'Chào mẹ! Em là Gấu Kindy — 100% Xu được bảo chứng an lành qua Ký Quỹ Double Escrow nhé!',
    'Khung giờ 6H Safeful Time: Mẹ mang đồ về phòng ngủ kiểm tra êm ái, ưng ý mới chuyển Xu cho người bán!',
    'Người bán cọc 10% Xu cam kết mô tả trung thực — triệt tiêu 100% tình trạng hàng lỗi hay ảnh mạng!',
    'Mẹ để lại email bên dưới để nhận ngay 5 Xu Tiên Phong (tương đương 50.000 VNĐ) vào ví nhé!',
    'Gặp nhau ngay sảnh chung cư hoặc công viên gần nhà — siêu cục bộ Đà Nẵng, an tâm tuyệt đối!'
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
          // On mobile, auto-dismiss after 5s so it never permanently blocks content
          if (window.innerWidth <= 768) {
            clearTimeout(bubbleAutoDismissTimeout);
            bubbleAutoDismissTimeout = setTimeout(() => {
              mascotBubble.classList.add('hidden');
            }, 5000);
          }
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

  // On desktop only: gently show speech bubble after 3.5s to welcome user
  if (window.innerWidth > 768 && mascotBubble) {
    setTimeout(() => {
      mascotBubble.classList.remove('hidden');
    }, 3500);
  }

  // Auto-cycle quote occasionally when visible
  setInterval(() => {
    if (mascotBubble && !mascotBubble.classList.contains('hidden')) {
      cycleMascotQuote();
    }
  }, 14000);

  // ================= 8. 3D PERSPECTIVE TILT ON HOVER (DESKTOP) =================
  const tiltElements = document.querySelectorAll('.bento-card, .phone-outer-frame, .founding-gold-card');
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

  if (!isTouchDevice) {
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

  // ================= 9. SMOOTH STATS COUNTER ROLLUP =================
  function animateValue(elem, start, end, duration, formatFn) {
    if (!elem) return;
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (end - start) * easeOut);

      elem.textContent = formatFn ? formatFn(current) : current;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        elem.textContent = formatFn ? formatFn(end) : end;
      }
    }
    requestAnimationFrame(step);
  }

  // Animate stats when visible
  let animatedStats = false;
  const statTrio = document.querySelector('.hero-stat-trio');
  if (statTrio && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !animatedStats) {
          animatedStats = true;
          const navCount = document.getElementById('navWaitlistCount');
          if (navCount) {
            animateValue(navCount, 0, 143, 1400);
          }
        }
      });
    }, { threshold: 0.2 });
    observer.observe(statTrio);
  }

  // ================= 10. CLOCK PULSE ON SAFEFUL TIME =================
  const clockIcons = document.querySelectorAll('.bento-clock-badge, .bento-clock-icon');
  clockIcons.forEach(icon => icon.classList.add('clock-pulse-active'));
});
