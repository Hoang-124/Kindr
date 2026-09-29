const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  ImageRun,
  BorderStyle,
  ShadingType
} = require('docx');

async function generateDocx() {
  const imagePath = path.join(__dirname, '../screenshots/kindr_timeline_roadmap.png');
  const imageBuffer = fs.readFileSync(imagePath);

  // Helper styles
  const createTitle = (text) => new Paragraph({
    text: text,
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    run: {
      font: 'Arial',
      size: 36,
      bold: true,
      color: '1E3A8A'
    }
  });

  const createSubtitle = (text) => new Paragraph({
    text: text,
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    run: {
      font: 'Arial',
      size: 24,
      italics: true,
      color: '475569'
    }
  });

  const createMetaBox = (text) => new Paragraph({
    text: text,
    alignment: AlignmentType.CENTER,
    spacing: { after: 360 },
    run: {
      font: 'Arial',
      size: 20,
      bold: true,
      color: '0D9488'
    }
  });

  const createH1 = (text) => new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 140 },
    run: {
      font: 'Arial',
      size: 28,
      bold: true,
      color: '1E3A8A'
    }
  });

  const createH2 = (text) => new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    run: {
      font: 'Arial',
      size: 24,
      bold: true,
      color: '0D9488'
    }
  });

  const createH3 = (text) => new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 80 },
    run: {
      font: 'Arial',
      size: 21,
      bold: true,
      color: '334155'
    }
  });

  const createP = (text, isBold = false) => new Paragraph({
    spacing: { after: 120, line: 276 },
    children: [
      new TextRun({
        text: text,
        font: 'Arial',
        size: 22,
        bold: isBold,
        color: '1E293B'
      })
    ]
  });

  const createBullet = (boldPrefix, text) => new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80, line: 260 },
    children: [
      new TextRun({
        text: boldPrefix + ' ',
        font: 'Arial',
        size: 22,
        bold: true,
        color: '0F172A'
      }),
      new TextRun({
        text: text,
        font: 'Arial',
        size: 22,
        color: '334155'
      })
    ]
  });

  const createQuote = (text) => new Paragraph({
    spacing: { before: 140, after: 180 },
    indent: { left: 720, right: 720 },
    children: [
      new TextRun({
        text: `"${text}"`,
        font: 'Arial',
        size: 22,
        italics: true,
        bold: true,
        color: '1E3A8A'
      })
    ]
  });

  // Table creator
  const createTable = (headers, rowsData) => {
    const headerRow = new TableRow({
      tableHeader: true,
      children: headers.map((h, i) => new TableCell({
        shading: { type: ShadingType.CLEAR, fill: '1E3A8A' },
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 20, font: 'Arial' })]
        })],
        margins: { top: 120, bottom: 120, left: 140, right: 140 }
      }))
    });

    const dataRows = rowsData.map((row, rIdx) => new TableRow({
      children: row.map((cellText) => new TableCell({
        shading: { type: ShadingType.CLEAR, fill: rIdx % 2 === 0 ? 'F8FAFC' : 'FFFFFF' },
        children: [new Paragraph({
          children: [new TextRun({ text: cellText, size: 19, font: 'Arial', color: '334155' })]
        })],
        margins: { top: 100, bottom: 100, left: 120, right: 120 }
      }))
    }));

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...dataRows]
    });
  };

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
        }
      },
      children: [
        // Title & Header
        createTitle('KINDR PRODUCT ROADMAP & STRATEGIC TIMELINE ANALYSIS (2026 – 2028)'),
        createSubtitle('Tài Liệu Chiến Lược Cấp Cao, Phân Tích Kỹ Thuật & Lộ Trình Triển Khai Toàn Diện'),
        createMetaBox('DỰ ÁN: KINDR | ĐỘI THI: KBFSHARK (FPT UNIVERSITY DA NANG) | KHỞI ĐỘNG: THÁNG 9/2026'),

        // Image Embed
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 180, after: 120 },
          children: [
            new ImageRun({
              data: imageBuffer,
              transformation: {
                width: 620,
                height: 318
              }
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 360 },
          children: [
            new TextRun({
              text: 'Hình 1: Biểu đồ Timeline Gantt Product Roadmap Kindr (T9/2026 – 2028) theo 4 Luồng Chuyên Môn & 16 Mốc Thời Gian',
              italics: true,
              size: 18,
              color: '64748B',
              font: 'Arial'
            })
          ]
        }),

        // 1. TỔNG QUAN CHIẾN LƯỢC
        createH1('1. TỔNG QUAN CHIẾN LƯỢC & TUYÊN NGÔN GIÁ TRỊ (EXECUTIVE SUMMARY)'),
        createP('Kindr là nền tảng kinh tế tuần hoàn và trao đổi đồ dùng trẻ em siêu cục bộ (Hyperlocal P2P Baby Goods Exchange Platform), ra đời nhằm giải quyết triệt để vấn đề lãng phí không gian sống, chi phí nuôi con đắt đỏ và nỗi sợ vi khuẩn/lừa đảo khi mua bán đồ cũ trên mạng xã hội.'),
        createQuote('Kindr giúp các bà mẹ bỉm sữa tại đô thị giải phóng không gian sống và tối ưu hóa 50%–70% chi phí nuôi con thông qua nền tảng trao đổi đồ siêu cục bộ ứng dụng Ví Xu nội bộ và Thuật toán Ký quỹ Trách nhiệm Song phương (Double Escrow); triệt tiêu hoàn toàn nạn mặc cả, lừa đảo cọc ship và đồ rác nhờ cơ chế 6 giờ kiểm định tại nhà và mạng lưới Trạm Phường (Kindr Hub).'),
        
        createH2('4 Trụ Cột Chiến Lược (The 4 Strategic Pillars):'),
        createBullet('1. Zero-Friction Exchange (Trao đổi không ma sát):', 'Không tiền mặt, không mặc cả kỳ kèo. Áp dụng Khung định giá cố định (Price Anchoring) và Ví Xu nội bộ chuẩn hóa (1 Xu = 10.000 VNĐ), giúp giao dịch chốt nhanh trong 30 giây.'),
        createBullet('2. Community Trust & Hygiene (Niềm tin & Vệ sinh tuyệt đối):', 'Giải quyết triệt để nỗi sợ lừa đảo và mầm bệnh thông qua cơ chế Ký quỹ Kép (Double Escrow), 10% Safe Fee cam kết chất lượng và 6 giờ Safeful Time kiểm tra đồ tại nhà.'),
        createBullet('3. Hyperlocal Density (Mật độ siêu cục bộ < 2km):', 'Giao dịch trong bán kính đi bộ. Biến các trường mầm non và quán cà phê thân thiện thành Trạm Phường (Kindr Hub) kèm tủ Locker thông minh, tiết kiệm 100% cước vận chuyển.'),
        createBullet('4. Sustainable Float Banking (Dòng tiền thả nổi bền vững):', 'Vận hành theo mô hình ngân hàng Starbucks: Thu phí 10% khi rút tiền mặt và tận dụng dòng tiền nhàn rỗi (Float Money) từ số dư Xu nạp trước trong tài khoản ký quỹ.'),

        // 2. CẤU TRÚC TRỤC THỜI GIAN
        createH1('2. KIẾN TRÚC TRỤC THỜI GIAN THỰC TẾ (BẮT ĐẦU THÁNG 9/2026)'),
        createP('Khác với các bản kế hoạch lý thuyết bắt đầu từ đầu năm, lộ trình Kindr được neo chuẩn xác vào mốc khởi động thực tế: Tháng 9 năm nay (T9/2026). Trục thời gian trải dài từ T9/2026 đến hết năm 2028, chia làm 16 cột mốc và 4 giai đoạn phát hành lớn (Release Horizons):'),
        createBullet('• Release 1.1: MVP Launchpad Đà Nẵng (T9/2026 – T2/2027 | 6 Tháng):', 'Tập trung toàn lực chứng minh Product-Market Fit tại 3 quận trung tâm Đà Nẵng (Hải Châu, Thanh Khê, Sơn Trà). Đóng gói ứng dụng di động Expo SDK 56, cỗ máy ký quỹ Double Escrow CAS, Webhook VietQR nạp tiền 3s và Chat Socket.IO.'),
        createBullet('• Release 1.2: Kindr Hub & Dịch Vụ Sạch (T3/2027 – T6/2027 | 4 Tháng):', 'Xây dựng mạng lưới 50 Trạm Phường Kindr Hub tại trường mầm non và quán cafe. Triển khai tủ Locker thông minh, cơ chế bàn giao mã PIN/QR một lần và dịch vụ tiệt trùng UV-C Kindr Clean 15k/món.'),
        createBullet('• Release 1.3: Toàn Quốc & Tiện Ích WHO (Q3/2027 – Q2/2028 | 4 Quý):', 'Mở rộng thị trường ra TP.HCM và Hà Nội. Tích hợp Sổ tay tiêm chủng quốc gia, Biểu đồ tăng trưởng trẻ em chuẩn WHO, liên kết vận chuyển gom chuyến Eco và mở Chợ Thanh Lý VIP.'),
        createBullet('• Release 2.1: Siêu Ứng Dụng Kinh Tế Tuần Hoàn (Q3/2028 – Q4/2028 | 2 Quý):', 'Chuyển hóa thành Super-App toàn diện: Hộp đồ chơi luân chuyển định kỳ Toy-as-a-Service (TaaS), AI Vision quét phát hiện khuyết tật đồ qua camera, cấp Thẻ Hộ Chiếu Xanh ESG và mở rộng Đông Nam Á.'),

        // 3. PHÂN TÍCH CHI TIẾT 4 LUỒNG CHUYÊN MÔN
        createH1('3. PHÂN TÍCH CHI TIẾT 4 LUỒNG CHUYÊN MÔN (THE 4 FUNCTIONAL TRACKS)'),
        
        createH2('3.1. Luồng 🟦 DEVELOPMENT (Kỹ thuật & Hệ thống)'),
        createP('Luồng Kỹ thuật chịu trách nhiệm về độ ổn định, tính toàn vẹn của dòng tiền ví Xu và khả năng mở rộng không giới hạn của hệ sinh thái phần mềm:'),
        createBullet('• Front-End App (Expo SDK 56) [T9/26 – T1/27]:', 'Ứng dụng di động đa nền tảng (iOS & Android) xây dựng trên React Native và Expo SDK 56 mới nhất, đảm bảo touch ergonomics >= 44pt và tuân thủ bảng màu ấm áp.'),
        createBullet('• Double Escrow CAS Engine [T10/26 – T2/27]:', 'Thuật toán Compare-And-Swap (CAS) nguyên tử trên MongoDB. Khi xảy ra giao dịch, hệ thống khóa số dư ví ở tầng database, triệt tiêu 100% nguy cơ chi tiêu kép (Double Spending) khi nghẽn mạng.'),
        createBullet('• Dynamic VietQR & Socket.IO [T11/26 – T2/27]:', 'Tạo mã QR thanh toán động nhúng mã giao dịch duy nhất transferCode. Webhook từ cổng thanh toán tự động khớp lệnh và cộng Xu tức thì sau 3 giây. Socket.IO quản lý tin nhắn và thông báo đẩy theo thời gian thực.'),
        createBullet('• Kindr Hub Portal Web [T3/27 – T6/27]:', 'Cổng Web Dashboard tinh gọn dành cho các cô giáo mầm non và chủ điểm Hub theo dõi danh sách đồ gửi, quét mã QR nhận/trả đồ và quản lý hoa hồng Xu.'),
        createBullet('• Smart QR / PIN Handover [T4/27 – T6/27]:', 'Hệ thống sinh mã PIN 6 số ngẫu nhiên dùng một lần (OTP) và mã QR mã hóa phục vụ việc gửi/nhận đồ tại tủ Locker thông minh mà hai người không cần chạm mặt.'),
        createBullet('• Geo-Clustering API (<2km) [T6/27 – Q3/27]:', 'Thuật toán phân cụm địa lý tự động tính toán tọa độ và gom nhóm bài đăng của các mẹ trong bán kính đi bộ, làm mờ tọa độ ngẫu nhiên +-150m để bảo vệ quyền riêng tư.'),
        createBullet('• Automated Cron Finalizer [Q4/27 – Q1/28]:', 'Robot chạy ngầm định kỳ kiểm tra các giao dịch đang trong thời gian 6h kiểm định; nếu người mua không khiếu nại thì tự động giải phóng Xu cho người bán.'),
        createBullet('• Multi-City Database Sharding [Q4/27 – Q4/28]:', 'Phân mảnh cơ sở dữ liệu theo cụm địa lý (Đà Nẵng, TP.HCM, Hà Nội) kết hợp Redis Cache, sẵn sàng đáp ứng hàng triệu người dùng hoạt động đồng thời.'),
        createBullet('• AI Vision Defect Scan [Q2/28 – Q4/28]:', 'Mô hình học máy Computer Vision quét ảnh chụp đồ chơi qua camera, tự động phát hiện vết xước, rách lớn và cảnh báo người bán điều chỉnh tình trạng về đúng độ mới thực tế.'),

        createH2('3.2. Luồng 🟩 PRODUCT (Chiến lược & Nghiệp vụ Kinh doanh)'),
        createP('Luồng Sản phẩm thiết kế các cơ chế kinh tế hành vi, chính sách kiểm soát chất lượng và kiến trúc mô hình dòng tiền bền vững:'),
        createBullet('• MVP Scope (Đà Nẵng Launch) [T9/26 – T12/26]:', 'Xác định phạm vi sản phẩm tinh gọn nhất (Core MVP), tập trung vào trao đổi đồ P2P nội quận để kiểm chứng tỷ lệ quay lại của người dùng.'),
        createBullet('• Khung Giá Cứng Chống Ngáo (Strict Price Bounds) [T10/26 – T1/27]:', 'Áp dụng thuật toán mỏ neo giá (Price Anchoring): Sách truyện 1-2 Xu, Đồ chơi nhỏ 2-4 Xu, Đồ lớn 5-10 Xu, Xe đẩy/Nôi cũi 15-30 Xu. Người bán chỉ được chọn trong khung định sẵn, xóa bỏ kỳ kèo.'),
        createBullet('• Quy Chế Ký Quỹ & 6h Safe [T10/26 – T2/27]:', 'Quy tắc song phương: Người bán ký quỹ 10% Safe Fee cam kết đồ sạch; người mua tạm khóa 100% giá trị món đồ; nhận đồ xong có 6 tiếng kiểm tra tại nhà trước khi hoàn tất.'),
        createBullet('• Kindr Hub Pilot (50 Trạm) [T3/27 – T6/27]:', 'Ký kết hợp tác đặt trạm tại 50 trường mầm non tư thục; trường được nhận hoa hồng 5% Xu trên mỗi giao dịch thành công, tạo động lực gắn kết lâu dài.'),
        createBullet('• Điểm Mẹ Bỉm Văn Minh [T3/27 – Q3/27]:', 'Hệ thống điểm uy tín cộng đồng (Karma Score). Giao đồ sạch, đúng hẹn được cộng điểm; bị khiếu nại hoặc hủy kèo vô lý bị trừ điểm và hạn chế quyền đổi đồ.'),
        createBullet('• Kindr Clean (Khử Khuẩn UV 15k) [T4/27 – Q3/27]:', 'Mô hình gia tăng giá trị: Đặt máy khử trùng tia cực tím UV-C tại mỗi trạm Hub, cấp tem niêm phong sạch khuẩn 99.9% với chi phí chỉ 15.000đ/món.'),
        createBullet('• Trạm Tặng Đồ 0 Xu (Charity Loop) [T5/27 – Q4/27]:', 'Phân hệ cho tặng miễn phí đồ cũ cho các mái ấm tình thương và gia đình khó khăn; miễn 100% Safe Fee và vinh danh danh hiệu Mẹ Bỉm Nhân Ái.'),
        createBullet('• Mở Rộng Toàn Quốc (HCM & HN) [Q3/27 – Q2/28]:', 'Chiến dịch chiếm lĩnh các cụm chung cư cao tầng tại TP. Thủ Đức, Quận 7 (TP.HCM) và Cầu Giấy, Nam Từ Liêm (Hà Nội).'),
        createBullet('• Chợ Thanh Lý Đồ VIP [Q4/27 – Q2/28]:', 'Mở rộng tính năng bán đồ cao cấp bằng tiền mặt (thu phí đăng tin 10.000đ – 20.000đ/tin).'),
        createBullet('• Thuê Đồ Chơi TaaS (Toy-as-a-Service) [Q2/28 – Q4/28]:', 'Dịch vụ rương đồ chơi giáo dục Montessori giao tận nhà mỗi tháng một rương 5 món, tháng sau đổi rương mới mà không cần mua đứt.'),

        createH2('3.3. Luồng 🟥 UX / DESIGN (Trải nghiệm & Cảm xúc)'),
        createP('Luồng Thiết kế xây dựng niềm tin tâm lý và trải nghiệm người dùng ấm áp, chạm đến trái tim của các bà mẹ bỉm sữa:'),
        createBullet('• Wireframes & Core User Flows [T9/26 – T11/26]:', 'Thiết kế luồng thao tác trực quan, loại bỏ các bước nhập liệu rườm rà; áp dụng bảng màu ấm (Terracotta, Peach, Sage) tạo cảm giác an tâm, dịu nhẹ.'),
        createBullet('• Mascot Gấu Kindy Cảm Xúc [T10/26 – T1/27]:', 'Thiết kế linh vật Gấu Kindy biểu thị các trạng thái cảm xúc: Vui vẻ khi đổi đồ thành công, Nghiêm túc che chắn khi bảo vệ số điện thoại, Ôm tim khi từ thiện.'),
        createBullet('• Khung Chat Bảo Mệ SĐT/Nhà (P2P Privacy) [T11/26 – T2/27]:', 'Giao diện nhắn tin tự động lọc và làm mờ số điện thoại, số tài khoản ngân hàng và địa chỉ nhà để bảo đảm an toàn thông tin cá nhân của mẹ và bé.'),
        createBullet('• Bản Đồ Trạm Phường Live [T3/27 – T6/27]:', 'Bản đồ tương tác hiển thị vị trí các Trạm Kindr Hub xung quanh kèm thông tin giờ mở cửa, số lượng tủ Locker còn trống và dịch vụ khử khuẩn.'),
        createBullet('• Tem Xanh Kindr Clean Verified Seal [T4/27 – Q3/27]:', 'Con tem niêm phong xanh trên hình ảnh sản phẩm thể hiện món đồ đã qua máy tiệt trùng UV-C tại Trạm, tạo niềm tin tuyệt đối cho người nhận.'),
        createBullet('• Live P2P Dispatch Tracking [Q4/27 – Q2/28]:', 'Màn hình theo dõi hành trình món đồ: từ lúc Mẹ A gửi vào tủ Locker đến khi Mẹ B nhập mã PIN nhận hàng thành công.'),
        createBullet('• Dashboard Bé Chuẩn WHO [Q1/28 – Q3/28]:', 'Giao diện nhập chiều cao, cân nặng của bé trực quan, vẽ đường cong phát triển đối chiếu với tiêu chuẩn WHO và gợi ý đồ chơi kích thích giác quan phù hợp độ tuổi.'),
        createBullet('• Thẻ Hộ Chiếu Xanh ESG [Q2/28 – Q4/28]:', 'Thẻ điện tử cá nhân hóa vinh danh số kg rác thải nhựa và lượng khí thải CO2 gia đình đã giảm bớt cho môi trường, có thể chia sẻ lên Facebook/Instagram.'),

        createH2('3.4. Luồng 🟧 QA & SECURITY (Chất lượng & An ninh Toàn diện)'),
        createP('Luồng Đảm bảo chất lượng là lá chắn bảo vệ an toàn tài chính, an ninh phần mềm và sự riêng tư tuyệt đối cho dữ liệu trẻ em:'),
        createBullet('• CAS Anti-Double Spend Audit [T10/26 – T1/27]:', 'Kiểm toán code chuyên sâu thuật toán CAS; bắn hàng nghìn request rút tiền/đổi Xu đồng thời bằng công cụ K6 để bảo đảm không có kẽ hở tài chính.'),
        createBullet('• Unit & Integration Tests (TDD) [T10/26 – T2/27]:', 'Thiết lập quy trình kiểm thử tự động Test-Driven Development (TDD) phủ trên 85% các luồng chuyển trạng thái giao dịch (pending, held, completed, disputed).'),
        createBullet('• WCAG AA Contrast Testing [T11/26 – T1/27]:', 'Kiểm tra tỷ lệ tương phản màu sắc đạt chuẩn WCAG AA trên cả Light Mode và Dark Mode để bảo vệ thị giác người dùng khi sử dụng ban đêm.'),
        createBullet('• Field Pilot 100 Mẹ Bỉm Đà Nẵng [T2/27 – T4/27]:', 'Chương trình thử nghiệm thực địa kín với 100 mẹ bỉm tại Hải Châu và Thanh Khê; trực tiếp quan sát và khắc phục 100% các điểm ma sát trong trải nghiệm.'),
        createBullet('• Smart Locker PIN/QR Pentest [T3/27 – T6/27]:', 'Kiểm thử tấn công xâm nhập mã PIN tủ Locker; bảo đảm mã PIN chỉ có hiệu lực duy nhất 1 lần (OTP) và tự động vô hiệu hóa sau 24 giờ.'),
        createBullet('• Thử Nghiệm Chịu Tải 10,000 req/s [Q4/27 – Q2/28]:', 'Giả lập kịch bản 10.000 mẹ bỉm cùng truy cập đăng bài và nạp Xu trong giờ cao điểm; tối ưu hóa Redis Cache và câu truy vấn MongoDB.'),
        createBullet('• Security Audit & ISO/IEC 27001 [Q1/28 – Q2/28]:', 'Mời đơn vị an ninh mạng độc lập thực hiện Penetration Testing toàn diện và rà soát hệ thống theo bộ tiêu chuẩn an toàn thông tin quốc tế ISO 27001.'),
        createBullet('• COPPA Child Data Privacy Compliance [Q3/28 – Q4/28]:', 'Kiểm định tuân thủ nghiêm ngặt Luật Bảo vệ Trẻ em Việt Nam và Đạo luật Bảo vệ Quyền Riêng tư Trẻ em trên Mạng (COPPA), bảo đảm không thu thập dữ liệu nhạy cảm của trẻ.'),

        // 4. MÔ HÌNH KINH DOANH & TÀI CHÍNH
        createH1('4. MÔ HÌNH KINH TẾ TOKENOMICS & DÒNG TIỀN THẢ NỔI (FLOAT MONEY)'),
        createP('Kindr áp dụng cơ chế kinh tế hành vi với Tỷ giá chuẩn hóa cố định: 1 Xu = 10.000 VNĐ. Mô hình tài chính của Kindr không phụ thuộc vào tiền quảng cáo rác, mà tạo ra 4 dòng doanh thu bền vững:'),
        createBullet('1. Phí Rút Tiền Mặt (10% Cashout Fee):', 'Khi người dùng nạp tiền mua Xu để đổi đồ, tiền mặt nằm lại hệ thống. Nếu người dùng muốn rút Xu về tài khoản ngân hàng, Kindr thu phí 10%. Cơ chế này khuyến khích Xu tiếp tục luân chuyển trong vòng lặp trao đổi đồ thay vì rút ra.'),
        createBullet('2. Lợi Nhuận Dòng Tiền Thả Nổi (Starbucks Float Model):', 'Tương tự mô hình thẻ trả trước của Starbucks (giữ hơn 1.6 tỷ USD tiền nạp nhàn rỗi), tiền nạp mua Xu của hàng trăm nghìn gia đình sẽ tạo ra một quỹ dự trữ ký quỹ an toàn (Escrow Float Pool) mang lại lợi suất phi rủi ro.'),
        createBullet('3. Dịch Vụ Khử Khuẩn Tia Cực Tím (Kindr Clean 15k):', 'Với biên lợi nhuận trên 75% cho mỗi lượt khử trùng đồ chơi tại Trạm Kindr Hub, dịch vụ này mang lại dòng tiền mặt đều đặn hàng ngày.'),
        createBullet('4. Doanh Thu Dịch Vụ Thuê Đồ Chơi (TaaS Monthly Subscription):', 'Gói thuê rương đồ chơi Montessori định kỳ mang lại dòng doanh thu định kỳ hàng tháng (ARR/MRR) có giá trị trọn đời (LTV) cao.'),

        // 5. BẢNG OKRs 3 NĂM
        createH1('5. KHUNG CHỈ SỐ ĐO LƯỜNG HIỆU QUẢ 3 NĂM (NORTH STAR & OKRs)'),
        createP('Chỉ Số Ngôi Sao Bắc Đẩu (North Star Metric - NSM): SỐ LƯỢT ĐỒ DÙNG ĐƯỢC TRAO ĐỔI THÀNH CÔNG HÀNG THÁNG. Chỉ số này phản ánh đồng thời giá trị tiết kiệm cho gia đình, lượng rác thải nhựa giảm thiểu cho xã hội và tốc độ luân chuyển Xu trong hệ thống.'),
        
        createTable(
          ['Năm', 'Mục Tiêu Chiến Lược (Objective)', 'Kết Quả Then Chốt (Key Results)'],
          [
            ['2026', 'Chứng Minh PMF & Thống Trị Đà Nẵng', '• 25.000 người dùng kích hoạt tại Đà Nẵng.\n• >= 40.000 lượt giao dịch thành công.\n• Phủ sóng 50 trạm Kindr Hub.\n• Tỷ lệ khiếu nại < 1%.'],
            ['2027', 'Chiếm Lĩnh Hà Nội & TP. Hồ Chí Minh', '• 200.000 MAU toàn quốc.\n• Mở rộng 300 trạm Kindr Hub.\n• Dòng tiền thả nổi duy trì >= 3 Tỷ VNĐ.\n• Doanh thu thuần đạt >= 2.5 Tỷ VNĐ.'],
            ['2028', 'Siêu Ứng Dụng & Mở Rộng Khu Vực', '• 1.000.000 người dùng hoạt động.\n• Tiết kiệm 150 Tỷ VNĐ chi phí nuôi con cho cộng đồng.\n• Giảm 500 tấn rác thải nhựa đồ chơi.\n• Mở chi nhánh tại Thái Lan.']
          ]
        ),

        // 6. QUẢN TRỊ RỦI RO
        createH1('6. MA TRẬN QUẢN TRỊ RỦI RO & BẢO VỆ PHÁP LÝ (DEFENSE PLAYBOOK)'),
        createTable(
          ['Rủi Ro Cốt Tử', 'Tác Động Tiêu Cực', 'Giải Pháp Đối Ứng Của Kindr'],
          [
            ['Bẫy Chợ Trống\n(Cold Start Problem)', 'Mẹ mới tải ứng dụng không thấy đồ ở gần để đổi, dẫn đến xóa app.', '• Tặng 10 Xu trải nghiệm khi tạo tài khoản.\n• Seed sẵn 500 món đồ chất lượng cao tại mỗi phường mục tiêu.'],
            ['Gian Lận & Đồ Rác\n(Moral Hazard)', 'Người bán giao đồ bẩn, rách nát, tiềm ẩn mầm bệnh cho bé.', '• Bắt buộc ký quỹ 10% Safe Fee khi đăng tin.\n• Khung đệm 6 tiếng Safeful Time kiểm tra tại nhà.\n• Hạ điểm uy tín và khóa tài khoản vi phạm.'],
            ['Ngáo Giá & Mặc Cả\n(Transaction Friction)', 'Người bán hét giá quá cao, người mua kỳ kèo trả giá gây nản lòng.', '• Áp dụng Khung định giá cứng cố định theo loại đồ.\n• Giới hạn biên độ Xu tối đa người bán được chọn.\n• AI gợi ý mức giá chuẩn xác theo thương hiệu.'],
            ['Rủi Ro Pháp Lý\n(Điểm Thưởng vs Tiền Ảo)', 'Bị nhầm lẫn là phát hành tiền tệ kỹ thuật số trái phép.', '• Định danh Xu là "Điểm Thưởng Thành Viên Nội Bộ" (Loyalty Points).\n• Áp dụng quy chuẩn pháp lý tương tự VinID, Shopee Xu, Starbucks Stars.']
          ]
        ),

        // LỜI KẾT
        createH1('7. CAM KẾT THỰC THI & LỜI KẾT'),
        createP('Bản Lộ trình Sản phẩm này là lời cam kết mạnh mẽ của đội ngũ KBFSHARK về một sản phẩm công nghệ có chiều sâu kỹ thuật, có tính nhân văn sâu sắc và có mô hình kinh doanh tuần hoàn tự sinh lời bền vững. Kindr sẵn sàng chinh phục các hội đồng chuyên gia, các quỹ đầu tư mạo hiểm và các Shark để đưa giải pháp nuôi con văn minh vươn xa toàn quốc.'),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 240 },
          children: [
            new TextRun({
              text: 'ĐỘI NGŨ SÁNG LẬP DỰ ÁN KINDR\nKBFSHARK TEAM — FPT UNIVERSITY DA NANG',
              bold: true,
              size: 20,
              color: '1E3A8A',
              font: 'Arial'
            })
          ]
        })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(__dirname, '../KINDR_PRODUCT_ROADMAP_ANALYSIS.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log('Successfully created:', outputPath);
}

generateDocx().catch(err => {
  console.error('Error generating docx:', err);
  process.exit(1);
});
