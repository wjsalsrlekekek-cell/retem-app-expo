/**
 * Simulated content translation utility for MVP
 * In production, this would call a real translation API (e.g., Google Translate, DeepL)
 * For MVP, we maintain a dictionary of pre-translated sample content
 */

// Pre-translated product titles and descriptions for seed data
const productTranslations: Record<string, Record<string, { title: string; description: string }>> = {
    'prod-1': {
        ko: { title: 'MacBook Pro 2023 16인치 M3', description: '거의 사용하지 않은 M3 칩 MacBook Pro. 완벽한 상태, 정품 충전기와 박스 포함. 최신 모델로 업그레이드하여 판매합니다.' },
        ja: { title: 'MacBook Pro 2023 16インチ M3', description: 'ほとんど使用していないM3チップ搭載MacBook Pro。完璧な状態、純正充電器と箱付き。新しいモデルにアップグレードしたため販売します。' },
        zh: { title: 'MacBook Pro 2023 16英寸 M3', description: '几乎全新的M3芯片MacBook Pro。完美状态，附带原装充电器和包装盒。因升级新款而出售。' },
        vi: { title: 'MacBook Pro 2023 16 inch M3', description: 'MacBook Pro chip M3 hầu như chưa sử dụng. Tình trạng hoàn hảo, đi kèm sạc và hộp gốc. Bán vì đã nâng cấp model mới hơn.' },
        th: { title: 'MacBook Pro 2023 16 นิ้ว M3', description: 'MacBook Pro ชิป M3 แทบไม่ได้ใช้ สภาพสมบูรณ์แบบ พร้อมที่ชาร์จและกล่องเดิม ขายเพราะอัพเกรดรุ่นใหม่' },
        tl: { title: 'MacBook Pro 2023 16-inch M3', description: 'Halos hindi nagamit na MacBook Pro na may M3 chip. Perpektong kondisyon, kasama ang orihinal na charger at kahon.' },
        id: { title: 'MacBook Pro 2023 16 inci M3', description: 'MacBook Pro dengan chip M3, hampir tidak terpakai. Kondisi sempurna, dilengkapi charger dan kotak asli.' },
    },
    'prod-2': {
        ko: { title: 'IKEA MALM 책상 - 화이트', description: 'IKEA 책상, 상태 좋음. 표면에 약간의 스크래치가 있지만 완전히 기능합니다. 이태원에서 직접 픽업해야 합니다.' },
        ja: { title: 'IKEA MALM デスク - ホワイト', description: 'IKEA デスク。良好な状態。表面に若干の傷がありますが完全に使用可能。梨泰院での引き取りが必要です。' },
        zh: { title: 'IKEA MALM 书桌 - 白色', description: 'IKEA书桌，状况良好。表面有轻微划痕但功能完好。需在梨泰院自取。' },
        vi: { title: 'Bàn IKEA MALM - Trắng', description: 'Bàn IKEA tình trạng tốt. Có vài vết xước nhỏ trên bề mặt nhưng vẫn hoạt động hoàn hảo. Cần đến Itaewon lấy.' },
        th: { title: 'โต๊ะ IKEA MALM - สีขาว', description: 'โต๊ะ IKEA สภาพดี มีรอยขีดข่วนเล็กน้อยบนพื้นผิว แต่ใช้งานได้สมบูรณ์ ต้องมารับที่อิแทวอน' },
        tl: { title: 'IKEA MALM Desk - Puti', description: 'IKEA desk sa magandang kondisyon. May mga minor na gasgas sa ibabaw pero gumagana pa rin. Kailangan i-pick up sa Itaewon.' },
        id: { title: 'Meja IKEA MALM - Putih', description: 'Meja IKEA kondisi bagus. Sedikit goresan di permukaan tapi masih berfungsi penuh. Harus diambil di Itaewon.' },
    },
    'prod-3': {
        ko: { title: 'Nike Air Max 90 - 270 사이즈', description: '새 Nike Air Max 90 스니커즈. 화이트/블랙 컬러웨이. 270mm. 미착용, 정품 박스 포함.' },
        ja: { title: 'Nike Air Max 90 - サイズ270', description: '新品 Nike Air Max 90 スニーカー。ホワイト/ブラック。サイズ270mm。未使用、オリジナルの箱付き。' },
        zh: { title: 'Nike Air Max 90 - 270码', description: '全新Nike Air Max 90运动鞋。白/黑配色。270mm。从未穿过，仍在原装盒中。' },
        vi: { title: 'Nike Air Max 90 - Size 270', description: 'Giày Nike Air Max 90 mới. Phối màu Trắng/Đen. Size 270mm. Chưa mang, còn nguyên hộp.' },
        th: { title: 'Nike Air Max 90 - ไซส์ 270', description: 'รองเท้า Nike Air Max 90 ใหม่ สี ขาว/ดำ ไซส์ 270mm ยังไม่เคยใส่ อยู่ในกล่องเดิม' },
        tl: { title: 'Nike Air Max 90 - Size 270', description: 'Bagong Nike Air Max 90 sneakers. White/Black. Size 270mm. Hindi pa nagamit, nasa original na kahon.' },
        id: { title: 'Nike Air Max 90 - Ukuran 270', description: 'Sneaker Nike Air Max 90 baru. Warna Putih/Hitam. Ukuran 270mm. Belum pernah dipakai, masih dalam kotak asli.' },
    },
    'prod-4': {
        ko: { title: 'Sony WH-1000XM5 헤드폰', description: '뛰어난 노이즈 캔슬링 헤드폰. 3개월 사용. 케이스와 모든 케이블 포함. 배터리 수명 여전히 좋음.' },
        ja: { title: 'Sony WH-1000XM5 ヘッドホン', description: '優れたノイズキャンセリングヘッドホン。3ヶ月使用。キャリーケースとケーブル全て付属。バッテリー持ちも良好。' },
        zh: { title: 'Sony WH-1000XM5 耳机', description: '出色的降噪耳机。使用3个月。附带收纳盒和所有线缆。电池续航仍然很好。' },
        vi: { title: 'Tai nghe Sony WH-1000XM5', description: 'Tai nghe chống ồn tuyệt vời. Đã dùng 3 tháng. Kèm hộp đựng và tất cả dây cáp. Pin vẫn tốt.' },
        th: { title: 'หูฟัง Sony WH-1000XM5', description: 'หูฟังตัดเสียงรบกวนยอดเยี่ยม ใช้งาน 3 เดือน พร้อมกระเป๋าและสายทั้งหมด แบตเตอรี่ยังดีอยู่' },
        tl: { title: 'Sony WH-1000XM5 Headphones', description: 'Napakagaling na noise-canceling headphones. 3 buwan nang ginagamit. Kasama ang carry case at lahat ng cable.' },
        id: { title: 'Headphone Sony WH-1000XM5', description: 'Headphone noise-canceling luar biasa. Digunakan 3 bulan. Termasuk carry case dan semua kabel. Daya tahan baterai masih bagus.' },
    },
    'prod-5': {
        ko: { title: 'Samsung Galaxy S24 Ultra 256GB', description: 'Samsung 플래그십 폰, 완벽한 상태. 팬텀 블랙. S-Pen, 케이스, 화면 보호 필름 부착됨.' },
        ja: { title: 'Samsung Galaxy S24 Ultra 256GB', description: 'Samsungフラッグシップ、完璧な状態。ファントムブラック。S-Pen、ケース、画面保護フィルム付き。' },
        zh: { title: 'Samsung Galaxy S24 Ultra 256GB', description: 'Samsung旗舰手机，完美状态。幻影黑色。附带S-Pen、保护壳和已贴好的屏幕保护膜。' },
        vi: { title: 'Samsung Galaxy S24 Ultra 256GB', description: 'Điện thoại Samsung flagship tình trạng hoàn hảo. Màu Phantom Black. Kèm S-Pen, ốp lưng và dán màn hình.' },
        th: { title: 'Samsung Galaxy S24 Ultra 256GB', description: 'โทรศัพท์เรือธง Samsung สภาพสมบูรณ์ สี Phantom Black พร้อม S-Pen เคส และฟิล์มกันรอย' },
        tl: { title: 'Samsung Galaxy S24 Ultra 256GB', description: 'Samsung flagship phone sa perpektong kondisyon. Phantom Black. Kasama ang S-Pen, case, at screen protector.' },
        id: { title: 'Samsung Galaxy S24 Ultra 256GB', description: 'Ponsel flagship Samsung dalam kondisi sempurna. Warna Phantom Black. Dilengkapi S-Pen, case, dan screen protector.' },
    },
    'prod-6': {
        ko: { title: 'Canon EOS R50 카메라 키트', description: '18-45mm 렌즈 키트 포함 미러리스 카메라. 입문자와 콘텐츠 크리에이터에게 최적. 셔터 카운트 5000 미만.' },
        ja: { title: 'Canon EOS R50 カメラキット', description: '18-45mmレンズキット付きミラーレスカメラ。初心者やコンテンツクリエイターに最適。シャッター回数5000未満。' },
        zh: { title: 'Canon EOS R50 相机套装', description: '含18-45mm镜头套装的微单相机。非常适合初学者和内容创作者。快门次数低于5000次。' },
        vi: { title: 'Bộ máy ảnh Canon EOS R50', description: 'Máy ảnh mirrorless kèm lens kit 18-45mm. Phù hợp cho người mới và content creator. Số lần bấm chụp dưới 5000.' },
        th: { title: 'ชุดกล้อง Canon EOS R50', description: 'กล้องมิเรอร์เลสพร้อมเลนส์คิท 18-45mm เหมาะสำหรับมือใหม่และคอนเทนต์ครีเอเตอร์ ชัตเตอร์ต่ำกว่า 5000 ครั้ง' },
        tl: { title: 'Canon EOS R50 Camera Kit', description: 'Mirrorless camera na may 18-45mm lens kit. Perpekto para sa beginners at content creators. Shutter count mas mababa sa 5000.' },
        id: { title: 'Kit Kamera Canon EOS R50', description: 'Kamera mirrorless dengan lens kit 18-45mm. Cocok untuk pemula dan content creator. Shutter count di bawah 5000.' },
    },
    'prod-7': {
        ko: { title: 'Apple Watch Series 9 45mm', description: 'Apple Watch 훌륭한 상태. GPS 모델. 미드나이트 알루미늄 케이스, 스포츠 밴드. AppleCare 2025년 6월까지.' },
        ja: { title: 'Apple Watch Series 9 45mm', description: 'Apple Watch 優れた状態。GPSモデル。ミッドナイトアルミケース、スポーツバンド。AppleCare 2025年6月まで。' },
        zh: { title: 'Apple Watch Series 9 45mm', description: 'Apple Watch状况极佳。GPS版。午夜铝合金表壳，运动表带。AppleCare保修至2025年6月。' },
        vi: { title: 'Apple Watch Series 9 45mm', description: 'Apple Watch tình trạng tuyệt vời. Model GPS. Vỏ nhôm Midnight, dây đeo thể thao. AppleCare đến tháng 6/2025.' },
        th: { title: 'Apple Watch Series 9 45mm', description: 'Apple Watch สภาพดีเยี่ยม รุ่น GPS เคสอลูมิเนียมสี Midnight สายกีฬา AppleCare ถึงมิถุนายน 2025' },
        tl: { title: 'Apple Watch Series 9 45mm', description: 'Apple Watch sa napakagandang kondisyon. GPS model. Midnight aluminum case na may sport band. May AppleCare hanggang June 2025.' },
        id: { title: 'Apple Watch Series 9 45mm', description: 'Apple Watch kondisi sangat baik. Model GPS. Case aluminium Midnight dengan sport band. AppleCare hingga Juni 2025.' },
    },
    'prod-8': {
        ko: { title: '기계식 키보드 Cherry MX', description: 'Cherry MX Brown 스위치 커스텀 기계식 키보드. RGB 백라이트. TKL 레이아웃. 6개월 사용.' },
        ja: { title: 'メカニカルキーボード Cherry MX', description: 'Cherry MX Brownスイッチ搭載カスタムメカニカルキーボード。RGBバックライト。TKLレイアウト。6ヶ月使用。' },
        zh: { title: '机械键盘 Cherry MX', description: 'Cherry MX Brown轴定制机械键盘。RGB背光。TKL布局。使用6个月。' },
        vi: { title: 'Bàn phím cơ Cherry MX', description: 'Bàn phím cơ custom với switch Cherry MX Brown. Đèn nền RGB. Layout TKL. Đã dùng 6 tháng.' },
        th: { title: 'คีย์บอร์ดเชิงกล Cherry MX', description: 'คีย์บอร์ดเชิงกลคัสตอมสวิตช์ Cherry MX Brown ไฟ RGB เลย์เอาท์ TKL ใช้งาน 6 เดือน' },
        tl: { title: 'Mechanical Keyboard Cherry MX', description: 'Custom mechanical keyboard na may Cherry MX Brown switches. RGB backlighting. TKL layout. 6 na buwan nang ginagamit.' },
        id: { title: 'Keyboard Mekanik Cherry MX', description: 'Keyboard mekanik custom dengan switch Cherry MX Brown. Lampu latar RGB. Layout TKL. Sudah digunakan 6 bulan.' },
    },
    'prod-9': {
        ko: { title: '가죽 메신저백', description: '천연 가죽 메신저백. 업무나 학교에 적합. 15인치 노트북 수납 가능. 모서리에 약간의 사용감.' },
        ja: { title: 'レザーメッセンジャーバッグ', description: '本革メッセンジャーバッグ。仕事や学校に最適。15インチノートPC収納可能。角に若干の使用感あり。' },
        zh: { title: '真皮单肩包', description: '真皮单肩包。不论工作还是上学都合适。可放15寸笔记本。边角有轻微使用痕迹。' },
        vi: { title: 'Túi đeo chéo da', description: 'Túi đeo chéo da thật. Phù hợp đi làm hoặc đi học. Vừa laptop 15 inch. Góc hơi sờn nhẹ.' },
        th: { title: 'กระเป๋าสะพายข้างหนังแท้', description: 'กระเป๋าสะพายข้างหนังแท้ เหมาะสำหรับทำงานหรือเรียน ใส่แล็ปท็อป 15 นิ้วได้ มีรอยสึกเล็กน้อยที่มุม' },
        tl: { title: 'Leather Messenger Bag', description: 'Genuine leather messenger bag. Perpekto para sa trabaho o eskwela. Kasya ang 15-inch laptop. May kaunting gasgas sa mga gilid.' },
        id: { title: 'Tas Selempang Kulit', description: 'Tas selempang kulit asli. Cocok untuk kerja atau sekolah. Muat laptop 15 inci. Sedikit aus di bagian sudut.' },
    },
    'prod-10': {
        ko: { title: 'IKEA 소파베드 - 그레이', description: '편안한 IKEA 소파베드. 손님용으로 쉽게 변환 가능. 그레이 패브릭 커버 분리 세탁 가능.' },
        ja: { title: 'IKEA ソファベッド - グレー', description: '快適なIKEAのソファベッド。来客用に簡単に変換可能。グレーの布カバーは取り外して洗濯可能。' },
        zh: { title: 'IKEA 沙发床 - 灰色', description: '舒适的IKEA沙发床。可轻松改为客用床。灰色布套可拆卸清洗。' },
        vi: { title: 'Ghế sofa giường IKEA - Xám', description: 'Ghế sofa giường IKEA thoải mái. Dễ dàng chuyển đổi để đón khách. Vỏ bọc vải xám có thể tháo rời giặt được.' },
        th: { title: 'โซฟาเบด IKEA - สีเทา', description: 'โซฟาเบด IKEA นั่งสบาย แปลงเป็นเตียงนอนสำหรับแขกได้ง่าย ผ้าหุ้มสีเทาถอดซักได้' },
        tl: { title: 'IKEA Sofa Bed - Grey', description: 'Komportableng IKEA sofa bed. Madaling i-convert para sa mga bisita. Grey fabric cover na maaaring tanggalin at labhan.' },
        id: { title: 'Sofa Bed IKEA - Abu-abu', description: 'Sofa bed IKEA yang nyaman. Mudah diubah untuk tamu. Cover kain abu-abu bisa dilepas dan dicuci.' },
    },
    'prod-11': {
        ko: { title: 'AirPods Pro 2세대', description: 'Apple AirPods Pro 2세대 MagSafe 케이스. 액티브 노이즈 캔슬링 완벽 작동. 8개월 사용.' },
        ja: { title: 'AirPods Pro 第2世代', description: 'Apple AirPods Pro 第2世代 MagSafeケース付き。アクティブノイズキャンセリング完璧に動作。8ヶ月使用。' },
        zh: { title: 'AirPods Pro 第二代', description: 'Apple AirPods Pro 第二代，MagSafe充电盒。主动降噪功能完美运行。使用8个月。' },
        vi: { title: 'AirPods Pro thế hệ 2', description: 'Apple AirPods Pro thế hệ 2 với hộp MagSafe. Khử tiếng ồn chủ động hoạt động hoàn hảo. Đã dùng 8 tháng.' },
        th: { title: 'AirPods Pro รุ่นที่ 2', description: 'Apple AirPods Pro รุ่นที่ 2 พร้อมเคส MagSafe ระบบตัดเสียงรบกวนทำงานสมบูรณ์ ใช้งาน 8 เดือน' },
        tl: { title: 'AirPods Pro 2nd Gen', description: 'Apple AirPods Pro 2nd generation na may MagSafe case. Perpektong gumagana ang active noise cancellation. 8 buwan nang ginagamit.' },
        id: { title: 'AirPods Pro Generasi ke-2', description: 'Apple AirPods Pro generasi ke-2 dengan case MagSafe. Active noise cancellation berfungsi sempurna. Sudah digunakan 8 bulan.' },
    },
    'prod-12': {
        ko: { title: '러닝화 Nike Pegasus 40', description: 'Nike Pegasus 40 러닝화. 275 사이즈. 약 100km 주행. 훌륭한 상태.' },
        ja: { title: 'ランニングシューズ Nike Pegasus 40', description: 'Nike Pegasus 40 ランニングシューズ。サイズ275。約100km走行使用。まだ良好な状態。' },
        zh: { title: '跑步鞋 Nike Pegasus 40', description: 'Nike Pegasus 40跑步鞋。275码。已跑约100公里。状况仍然很好。' },
        vi: { title: 'Giày chạy bộ Nike Pegasus 40', description: 'Giày chạy bộ Nike Pegasus 40. Size 275. Đã chạy khoảng 100km. Vẫn trong tình trạng tốt.' },
        th: { title: 'รองเท้าวิ่ง Nike Pegasus 40', description: 'รองเท้าวิ่ง Nike Pegasus 40 ไซส์ 275 ใช้วิ่งประมาณ 100 กม. สภาพยังดีอยู่' },
        tl: { title: 'Running Shoes Nike Pegasus 40', description: 'Nike Pegasus 40 running shoes. Size 275. Ginamit para sa mga 100km na pagtakbo. Maganda pa rin ang kondisyon.' },
        id: { title: 'Sepatu Lari Nike Pegasus 40', description: 'Sepatu lari Nike Pegasus 40. Ukuran 275. Sudah dipakai lari sekitar 100km. Kondisi masih bagus.' },
    },
    'prod-13': {
        ko: { title: '퀸 사이즈 침대 프레임', description: '원목 퀸 사이즈 침대 프레임. 튼튼한 구조, 삐걱거림 없음. 운반을 위해 분해해 놓았습니다.' },
        ja: { title: 'クイーンサイズ ベッドフレーム', description: '木製クイーンサイズベッドフレーム。頑丈な構造、きしみ音なし。運搬用に分解済み。' },
        zh: { title: '双人床架', description: '实木双人床架。结构坚固，无吱响声。已拆卸方便运输。' },
        vi: { title: 'Khung giường Queen Size', description: 'Khung giường queen size bằng gỗ. Cấu trúc chắc chắn, không kêu cọt kẹt. Đã tháo rời để dễ vận chuyển.' },
        th: { title: 'โครงเตียง Queen Size', description: 'โครงเตียงไม้ Queen Size แข็งแรง ไม่มีเสียงเอี๊ยด ถอดชิ้นส่วนไว้แล้วเพื่อง่ายต่อการขนย้าย' },
        tl: { title: 'Queen Size Bed Frame', description: 'Wooden queen size bed frame. Matibay ang pagkagawa, walang tunog. Na-disassemble na para madaling i-transport.' },
        id: { title: 'Rangka Tempat Tidur Queen', description: 'Rangka tempat tidur queen kayu. Konstruksi kokoh, tidak berderit. Sudah dibongkar untuk kemudahan transportasi.' },
    },
    'prod-14': {
        ko: { title: 'PlayStation 5 + 게임 3개', description: 'PS5 디스크 에디션 + 게임 3개 (스파이더맨 2, 호라이즌, 갓 오브 워). 컨트롤러 2개 포함. 모두 완벽 작동.' },
        ja: { title: 'PlayStation 5 + ゲーム3本', description: 'PS5 ディスクエディション + ゲーム3本（スパイダーマン2、ホライゾン、ゴッド・オブ・ウォー）。コントローラー2個付き。全て完動品。' },
        zh: { title: 'PlayStation 5 + 3款游戏', description: 'PS5光驱版 + 3款游戏（蜘蛛侠2、地平线、战神）。附带两个手柄。全部完美运行。' },
        vi: { title: 'PlayStation 5 + 3 Game', description: 'PS5 bản đĩa + 3 game (Spider-Man 2, Horizon, God of War). Kèm 2 tay cầm. Tất cả hoạt động hoàn hảo.' },
        th: { title: 'PlayStation 5 + เกม 3 เกม', description: 'PS5 รุ่นแผ่น + เกม 3 เกม (Spider-Man 2, Horizon, God of War) พร้อมจอย 2 อัน ทุกอย่างทำงานสมบูรณ์' },
        tl: { title: 'PlayStation 5 + 3 Laro', description: 'PS5 Disc edition na may 3 laro (Spider-Man 2, Horizon, God of War). Dalawang controller kasama. Lahat ay perfektong gumagana.' },
        id: { title: 'PlayStation 5 + 3 Game', description: 'PS5 edisi disc + 3 game (Spider-Man 2, Horizon, God of War). Termasuk dua controller. Semua berfungsi sempurna.' },
    },
    'prod-15': {
        ko: { title: 'MTB 자전거 Trek Marlin 5', description: 'Trek Marlin 5 산악 자전거. M 사이즈 프레임. 최근 브레이크 패드와 체인 교체 정비 완료.' },
        ja: { title: 'マウンテンバイク Trek Marlin 5', description: 'Trek Marlin 5 マウンテンバイク。Mサイズフレーム。最近ブレーキパッドとチェーンを交換し整備済み。' },
        zh: { title: '山地车 Trek Marlin 5', description: 'Trek Marlin 5山地车。M号车架。最近更换了刹车片和链条，已全面保养。' },
        vi: { title: 'Xe đạp địa hình Trek Marlin 5', description: 'Xe đạp địa hình Trek Marlin 5. Khung size M. Vừa bảo dưỡng thay má phanh và xích mới.' },
        th: { title: 'จักรยานเสือภูเขา Trek Marlin 5', description: 'จักรยานเสือภูเขา Trek Marlin 5 เฟรมไซส์ M เพิ่งเปลี่ยนผ้าเบรกและโซ่ใหม่' },
        tl: { title: 'Mountain Bike Trek Marlin 5', description: 'Trek Marlin 5 mountain bike. Size M frame. Kakaservice lang na may bagong brake pads at chain.' },
        id: { title: 'Sepeda Gunung Trek Marlin 5', description: 'Sepeda gunung Trek Marlin 5. Frame ukuran M. Baru diservis dengan brake pad dan rantai baru.' },
    },
};

// Pre-translated community posts
const postTranslations: Record<string, Record<string, string>> = {
    'post-1': {
        ko: '🇰🇷 서울에 사는 외국인을 위한 팁: 외국인등록증(ARC) 만료일을 꼭 확인하세요. 가까운 출입국관리사무소에서 갱신할 수 있습니다. 꿀팁: 온라인으로 예약하면 긴 대기 줄을 피할 수 있어요!',
        ja: '🇰🇷 ソウルの外国人向けヒント: 外国人登録証（ARC）の有効期限を必ず確認してください。最寄りの入国管理局で更新できます。コツ: オンライン予約で長い待ち時間を避けましょう！',
        zh: '🇰🇷 首尔外国人小贴士：务必查看外国人登录证（ARC）的到期日。可以在任何出入境管理局续签。小技巧：在线预约可以避免长时间排队！',
        vi: '🇰🇷 Mẹo cho người nước ngoài ở Seoul: Luôn kiểm tra ngày hết hạn thẻ ARC. Bạn có thể gia hạn tại bất kỳ văn phòng xuất nhập cảnh nào. Mẹo hay: Đặt lịch hẹn online để tránh chờ đợi lâu!',
        th: '🇰🇷 เคล็ดลับสำหรับชาวต่างชาติในโซล: ตรวจสอบวันหมดอายุบัตร ARC เสมอ สามารถต่ออายุได้ที่สำนักงานตรวจคนเข้าเมือง เคล็ดลับ: จองนัดหมายออนไลน์เพื่อหลีกเลี่ยงการรอคิวนาน!',
        tl: '🇰🇷 Tips para sa mga dayuhan sa Seoul: Laging suriin ang expiration date ng iyong ARC. Puwede mong i-renew sa kahit anong immigration office. Tip: Mag-book ng appointment online para maiwasan ang mahabang pila!',
        id: '🇰🇷 Tips untuk orang asing di Seoul: Selalu periksa tanggal kedaluwarsa ARC Anda. Anda bisa memperpanjangnya di kantor imigrasi mana saja. Tips: Booking janji online untuk menghindari antrian panjang!',
    },
    'post-2': {
        ko: '서울에서 저렴한 가구 매장 추천 부탁드려요! 마포구에 새 아파트로 이사했어요. 추천 있으신가요? 🏠',
        ja: 'ソウルでお手頃な家具店のおすすめはありますか？麻浦区の新しいアパートに引っ越しました。何かおすすめはありますか？🏠',
        zh: '求推荐首尔便宜的家具店！刚搬到麻浦区的新公寓。有什么建议吗？🏠',
        vi: 'Tìm gợi ý cửa hàng nội thất giá rẻ ở Seoul! Vừa chuyển đến căn hộ mới ở Mapo-gu. Có ai gợi ý không? 🏠',
        th: 'ขอคำแนะนำร้านเฟอร์นิเจอร์ราคาประหยัดในโซลหน่อยค่ะ! เพิ่งย้ายมาอพาร์ตเมนต์ใหม่ที่มาโป-กู มีร้านแนะนำไหมคะ? 🏠',
        tl: 'Naghahanap ng mga rekomendasyon para sa affordable na furniture stores sa Seoul! Kakalipat lang sa bagong apartment sa Mapo-gu. May mga suggestion ba kayo? 🏠',
        id: 'Mencari rekomendasi toko furnitur murah di Seoul! Baru pindah ke apartemen baru di Mapo-gu. Ada saran? 🏠',
    },
    'post-3': {
        ko: '지난 주말 홍대에서 열린 Language Exchange 모임에 참석했는데 정말 좋았어요! 10개국 이상에서 온 사람들을 만났어요. 한국어 연습하고 싶은 분들께 강력 추천! 🌍',
        ja: '先週末、弘大のLanguage Exchangeミートアップに参加して素晴らしい体験でした！10カ国以上の人々と出会えました。韓国語を練習したい方にお勧めです！🌍',
        zh: '上周末在弘大参加了语言交换聚会，体验棒极了！认识了来自10多个国家的朋友。强烈推荐给想练习韩语的人！🌍',
        vi: 'Tuần trước tham gia buổi Language Exchange ở Hongdae tuyệt vời lắm! Gặp gỡ người từ hơn 10 quốc gia. Highly recommend cho ai muốn luyện tiếng Hàn! 🌍',
        th: 'ประสบการณ์ที่ยอดเยี่ยมในงาน Language Exchange ที่ฮงแดเมื่อสุดสัปดาห์ที่ผ่านมา! ได้พบคนจากมากกว่า 10 ประเทศ แนะนำมากสำหรับคนที่อยากฝึกภาษาเกาหลี! 🌍',
        tl: 'Amazing na experience sa Language Exchange meetup sa Hongdae noong nakaraang weekend! Nakilala ang mga tao mula sa mahigit 10 bansa. Highly recommend para sa gustong mag-practice ng Korean! 🌍',
        id: 'Pengalaman luar biasa di acara Language Exchange di Hongdae akhir pekan lalu! Bertemu orang dari lebih dari 10 negara. Sangat direkomendasikan untuk yang ingin berlatih bahasa Korea! 🌍',
    },
    'post-4': {
        ko: '경고: 모르는 사람에게 전자제품을 구매할 때 조심하세요. 항상 결제 전에 기기를 테스트하세요! 지난달에 고장난 노트북 때문에 안 좋은 경험을 했어요. Re;Tem의 채팅 기능으로 영상 증거를 요청하세요! 📱💡',
        ja: '警告: 知らない人から電子機器を購入する際は注意してください。支払い前に必ず動作確認を！先月故障したノートパソコンで嫌な経験をしました。Re;Temのチャット機能で動画証拠を求めましょう！📱💡',
        zh: '警告：从陌生人购买电子产品时要小心。付款前一定要测试设备！上个月我买到了一台有故障的笔记本电脑。使用Re;Tem的聊天功能要求视频证明！📱💡',
        vi: 'Cảnh báo: Hãy cẩn thận khi mua đồ điện tử từ người lạ. Luôn kiểm tra thiết bị trước khi thanh toán! Tháng trước tôi gặp trải nghiệm tệ với laptop bị lỗi. Dùng tính năng chat của Re;Tem để yêu cầu video chứng minh! 📱💡',
        th: 'คำเตือน: ระวังเมื่อซื้ออุปกรณ์อิเล็กทรอนิกส์จากคนแปลกหน้า ทดสอบอุปกรณ์ก่อนจ่ายเงินเสมอ! เดือนที่แล้วเราเจอประสบการณ์ไม่ดีกับแล็ปท็อปที่มีปัญหา ใช้ฟีเจอร์แชทของ Re;Tem เพื่อขอวิดีโอพิสูจน์! 📱💡',
        tl: 'Babala: Mag-ingat sa pagbili ng electronics mula sa mga estranghero. Laging i-test ang device bago magbayad! Nagkaroon ako ng masamang karanasan noong nakaraang buwan sa sirang laptop. Gamitin ang chat feature ng Re;Tem para humingi ng video proof! 📱💡',
        id: 'Peringatan: Hati-hati saat membeli elektronik dari orang asing. Selalu uji perangkat sebelum membayar! Bulan lalu saya punya pengalaman buruk dengan laptop rusak. Gunakan fitur chat Re;Tem untuk minta bukti video! 📱💡',
    },
};

// Pre-translated comments
const commentTranslations: Record<string, Record<string, string>> = {
    'cmt-1': {
        ko: '정말 도움이 돼요! ARC 갱신을 거의 잊을 뻔했어요. 감사합니다!',
        ja: 'とても参考になります！ARC更新をほとんど忘れるところでした。ありがとう！',
        zh: '太有帮助了！我差点忘了ARC续签。谢谢！',
        vi: 'Rất hữu ích! Tôi suýt quên gia hạn ARC. Cảm ơn!',
        th: 'มีประโยชน์มาก! เกือบลืมต่ออายุ ARC เลย ขอบคุณครับ!',
        tl: 'Nakakatulong nito! Halos nakalimutan ko na ang ARC renewal ko. Salamat!',
        id: 'Ini sangat membantu! Saya hampir lupa perpanjangan ARC saya. Terima kasih!',
    },
    'cmt-2': {
        ko: '광명에 있는 IKEA를 추천해요! 주말에 이태원 벼룩시장도 가보세요.',
        ja: '光明のIKEAがおすすめです！週末の梨泰院フリーマーケットもチェックしてみてください。',
        zh: '试试光明的IKEA！还有周末梨泰院的跳蚤市场也不错。',
        vi: 'Thử IKEA ở Gwangmyeong! Cũng nên ghé chợ trời ở Itaewon vào cuối tuần.',
        th: 'ลอง IKEA ที่ ควังมยอง ดูค่ะ! แล้วก็ตลาดนัดที่อิแทวอนช่วงสุดสัปดาห์ด้วย',
        tl: 'Subukan ang IKEA sa Gwangmyeong! Tingnan din ang mga flea market sa Itaewon tuwing weekend.',
        id: 'Coba IKEA di Gwangmyeong! Juga cek flea market di Itaewon saat akhir pekan.',
    },
    'cmt-3': {
        ko: '어떤 모임 그룹이었어요? 다음에 참석하고 싶어요!',
        ja: 'どのミートアップグループですか？次回ぜひ参加したいです！',
        zh: '是哪个聚会群组？我下次想参加！',
        vi: 'Nhóm meetup nào vậy? Tôi muốn tham gia lần sau!',
        th: 'กลุ่มมีตอัพไหนคะ? อยากเข้าร่วมครั้งหน้าค่ะ!',
        tl: 'Anong meetup group ito? Gusto ko sumali next time!',
        id: 'Grup meetup mana ini? Saya ingin ikut lain kali!',
    },
};

// Pre-translated review comments
const reviewTranslations: Record<string, Record<string, string>> = {
    'rev-1': {
        ko: '훌륭한 판매자! 상품이 설명과 정확히 일치했어요. 빠른 응답과 원활한 거래.',
        ja: '素晴らしい出品者！商品は説明通りでした。迅速な対応とスムーズな取引。',
        zh: '很棒的卖家！商品与描述完全一致。回复快速，交易顺畅。',
        vi: 'Người bán tuyệt vời! Sản phẩm đúng như mô tả. Phản hồi nhanh và giao dịch suôn sẻ.',
        th: 'ผู้ขายยอดเยี่ยม! สินค้าตรงตามที่อธิบาย ตอบกลับเร็วและทำธุรกรรมราบรื่น',
        tl: 'Magaling na seller! Eksaktong katulad ng description ang item. Mabilis na response at maayos na transaksyon.',
        id: 'Penjual hebat! Barang sesuai deskripsi. Respon cepat dan transaksi lancar.',
    },
    'rev-2': {
        ko: '전반적으로 좋은 경험이었어요. 상품 상태가 매우 좋았습니다.',
        ja: '全体的に良い経験でした。商品の状態がとても良かったです。',
        zh: '整体体验不错。产品状况很好。',
        vi: 'Trải nghiệm tốt nhìn chung. Sản phẩm trong tình trạng tốt.',
        th: 'ประสบการณ์ดีโดยรวม สินค้าอยู่ในสภาพดี',
        tl: 'Magandang karanasan sa kabuuan. Maganda ang kondisyon ng produkto.',
        id: 'Pengalaman baik secara keseluruhan. Produk dalam kondisi bagus.',
    },
    'rev-3': {
        ko: '매우 친절하고 응답이 빨라요. 다시 구매하고 싶어요!',
        ja: 'とてもフレンドリーでレスポンスが早い。また買いたい！',
        zh: '非常友好且回复及时。还会再买！',
        vi: 'Rất thân thiện và phản hồi nhanh. Sẽ mua lại!',
        th: 'เป็นมิตรมากและตอบกลับเร็ว อยากซื้ออีก!',
        tl: 'Napakafriendly at mabilis mag-respond. Bibili ulit!',
        id: 'Sangat ramah dan responsif. Pasti beli lagi!',
    },
    'rev-4': {
        ko: '카메라 상태가 설명대로였어요. 배송이 예상보다 약간 느렸습니다.',
        ja: 'カメラの状態は説明通りでした。配送が予想より少し遅かったです。',
        zh: '相机状况如描述。发货比预期稍慢。',
        vi: 'Camera đúng tình trạng như mô tả. Giao hàng hơi chậm hơn mong đợi.',
        th: 'กล้องอยู่ในสภาพตามที่อธิบาย การจัดส่งช้ากว่าที่คาดไว้เล็กน้อย',
        tl: 'Maganda ang kondisyon ng camera gaya ng inilarawan. Medyo mas mabagal ang shipping kaysa inaasahan.',
        id: 'Kamera sesuai deskripsi. Pengiriman sedikit lebih lambat dari yang diharapkan.',
    },
    'rev-5': {
        ko: '최고의 판매자! 폰이 완벽하게 포장되어 빠르게 배송되었어요.',
        ja: '最高の出品者！スマホは完璧に梱包され、迅速に届きました。',
        zh: '出色的卖家！手机包装完美，发货迅速。',
        vi: 'Người bán xuất sắc! Điện thoại được đóng gói hoàn hảo và giao hàng nhanh chóng.',
        th: 'ผู้ขายยอดเยี่ยม! โทรศัพท์ถูกแพ็คอย่างสมบูรณ์แบบและจัดส่งรวดเร็ว',
        tl: 'Napakahusay na seller! Perpektong nakabalot ang phone at mabilis na naipadala.',
        id: 'Penjual luar biasa! Ponsel dikemas sempurna dan dikirim dengan cepat.',
    },
};

/**
 * Get translated product content (title & description)
 * Falls back to original English if no translation is available
 */
export function translateProduct(productId: string, lang: string): { title?: string; description?: string } | null {
    if (lang === 'en') return null; // No translation needed
    return productTranslations[productId]?.[lang] || null;
}

/**
 * Get translated post content
 */
export function translatePost(postId: string, lang: string): string | null {
    if (lang === 'en') return null;
    return postTranslations[postId]?.[lang] || null;
}

/**
 * Get translated comment content
 */
export function translateComment(commentId: string, lang: string): string | null {
    if (lang === 'en') return null;
    return commentTranslations[commentId]?.[lang] || null;
}

/**
 * Get translated review content
 */
export function translateReview(reviewId: string, lang: string): string | null {
    if (lang === 'en') return null;
    return reviewTranslations[reviewId]?.[lang] || null;
}

/** Language name in each language for the "Translated from" banner */
export const langLabels: Record<string, Record<string, string>> = {
    en: { en: 'English', ko: '영어', ja: '英語', zh: '英语', vi: 'tiếng Anh', th: 'อังกฤษ', tl: 'Ingles', id: 'Inggris' },
};

// ────────────────────────────────────────────────
// Chat Real-Time Translation (MyMemory API)
// ────────────────────────────────────────────────

const CHAT_LANG_CODES: Record<string, string> = {
    ko: 'ko', en: 'en', ja: 'ja', zh: 'zh-CN',
    vi: 'vi', th: 'th', tl: 'tl', id: 'id',
};

/** Language display names for the translation banner */
export const LANG_DISPLAY_NAMES: Record<string, string> = {
    ko: '한국어', en: 'English', ja: '日本語', zh: '中文',
    vi: 'Tiếng Việt', th: 'ไทย', tl: 'Filipino', id: 'Bahasa Indonesia',
};

// In-memory cache to avoid re-translating same messages
const chatTranslationCache = new Map<string, string>();

function chatCacheKey(text: string, from: string, to: string): string {
    return `${from}|${to}|${text}`;
}

// ────────────────────────────────────────────────
// 텍스트 문자 집합으로 소스 언어 감지
// ────────────────────────────────────────────────

/**
 * 텍스트의 Unicode 문자 범위를 보고 언어를 추정합니다.
 */
function detectLang(text: string): string {
    const cleaned = text.replace(/\s+/g, '');
    if (!cleaned) return 'en';

    let ko = 0, ja = 0, zh = 0, th = 0, ar = 0, latin = 0;

    for (const ch of cleaned) {
        const cp = ch.codePointAt(0) || 0;
        if (cp >= 0xAC00 && cp <= 0xD7AF) ko++;       // 한글
        else if (cp >= 0x3040 && cp <= 0x30FF) ja++;   // 히라가나/가타카나
        else if (cp >= 0x4E00 && cp <= 0x9FFF) zh++;   // 한자(CJK)
        else if (cp >= 0x0E00 && cp <= 0x0E7F) th++;   // 태국어
        else if (cp >= 0x0600 && cp <= 0x06FF) ar++;   // 아랍어
        else if (cp >= 0x0041 && cp <= 0x024F) latin++; // 라틴계 (영/베트남/필리핀/인도네시아 포함)
    }

    const total = cleaned.length;
    if (ko / total > 0.2) return 'ko';
    if (th / total > 0.2) return 'th';
    if (ja / total > 0.2) return 'ja';
    if (zh / total > 0.2) return 'zh-CN';
    if (ar / total > 0.2) return 'ar';
    return 'en'; // 라틴계는 영어로 기본 처리 (vi/tl/id 구분은 단순 감지로 어려움)
}

/** MyMemory API 에러 메시지 패턴 */
const MYMEMORY_ERROR_PATTERNS = [
    'INVALID LANGUAGE PAIR',
    'MYMEMORY WARNING',
    'PLEASE SELECT',
    'NO CONTENT',
    'QUERY IS TOO LONG',
];

function isApiError(text: string): boolean {
    const upper = text.toUpperCase();
    return MYMEMORY_ERROR_PATTERNS.some(p => upper.includes(p));
}

/**
 * Translate a chat message using MyMemory free translation API.
 * - 소스 언어는 텍스트 문자 집합으로 자동 감지 ('auto' 전달 시)
 * - Returns original text if same language or on error.
 * - Caches results in-memory to avoid duplicate API calls.
 */
export async function translateChatMessage(
    text: string,
    fromLang: string,
    toLang: string,
): Promise<string> {
    if (!text || text.trim().length === 0) return text;

    const to = CHAT_LANG_CODES[toLang] || toLang;

    // 소스 언어 결정: 'auto'이면 텍스트로 감지, 아니면 지정값 사용
    const detectedFrom = fromLang === 'auto' ? detectLang(text) : (CHAT_LANG_CODES[fromLang] || fromLang);

    // 같은 언어면 번역 불필요
    if (detectedFrom === to) return text;

    const key = chatCacheKey(text, detectedFrom, to);
    if (chatTranslationCache.has(key)) return chatTranslationCache.get(key)!;

    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${detectedFrom}|${to}`;
        const res = await fetch(url);
        if (!res.ok) return text;
        const data = await res.json();
        const translated = data?.responseData?.translatedText;

        if (
            translated &&
            translated !== text &&
            translated.toUpperCase() !== text.toUpperCase() &&
            !isApiError(translated)
        ) {
            chatTranslationCache.set(key, translated);
            return translated;
        }
        return text;
    } catch {
        return text;
    }
}

/**
 * Check if two language codes are different (translation needed)
 */
export function chatNeedsTranslation(senderLang: string, myLang: string): boolean {
    return senderLang !== myLang;
}
