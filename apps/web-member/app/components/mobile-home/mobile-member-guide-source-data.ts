export type MobileGuideCategory = 'finance' | 'activity' | 'play' | 'network' | 'benefit' | 'problem';

export type MobileGuideBlock =
  | Readonly<{ type: 'html'; html: string }>
  | Readonly<{ type: 'image'; source: string; alt: string }>;

export type MobileGuideItem = Readonly<{
  id: string;
  title: string;
  blocks: readonly MobileGuideBlock[];
}>;

export type MobileGuideSection = Readonly<{
  id: string;
  title: string;
  category: MobileGuideCategory;
  items: readonly MobileGuideItem[];
}>;

export const MOBILE_GUIDE_SECTIONS: readonly MobileGuideSection[] = [
  {
    "id": "section-1",
    "title": "การฝากเงิน",
    "category": "finance",
    "items": [
      {
        "id": "section-1-item-1",
        "title": "ฝากเงินแบบ โอนผ่านธนาคาร",
        "blocks": [
          {
            "type": "html",
            "html": "<p><span>ไปที่เมนู</span><span style=\"color:#ff4b4b;\"><strong>“ฝาก”</strong></span><span>มุมซ้ายล่าง รูปสัญลักษณ์กระเป๋าเงิน</span></p>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725938593250-89ca8ca6-1262-4788-b0a7-9a2a311e91ed.png",
            "alt": "ฝากเงินแบบ โอนผ่านธนาคาร"
          },
          {
            "type": "html",
            "html": "<p><span>เลือกวิธีฝากเงิน เลือก</span><span style=\"color:#ff4b4b;\"><strong>“โอนเงินผ่านธนาคาร”</strong></span></p>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725938601567-c551d627-bf2d-4b8b-8b26-cc504e9fa071.png",
            "alt": "ฝากเงินแบบ โอนผ่านธนาคาร"
          },
          {
            "type": "html",
            "html": "<p><span style=\"color:#ff4b4b;\"><strong>กรอกจำนวนที่ต้องการฝาก</strong></span><span>(ขั้นต่ำ : 20 / สูงสุด : 10,000,000)</span></p>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725938469074-c80bae14-b9ec-4a60-92cb-f765a652110d.png",
            "alt": "ฝากเงินแบบ โอนผ่านธนาคาร"
          },
          {
            "type": "html",
            "html": "<p><span>กด</span><span style=\"color:#ff4b4b;\"><strong>ยืนยัน</strong></span><span>ยอดที่ต้องการฝาก</span></p>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725938505132-615e78b4-68f9-40e5-b3f9-784eaaaaec59.png",
            "alt": "ฝากเงินแบบ โอนผ่านธนาคาร"
          },
          {
            "type": "html",
            "html": "<ul><li><span>หน้ารายละเอียดฝากเงิน จะแจ้ง</span><span style=\"color:#ff4b4b;\"><strong>เลขบัญชีที่ต้องโอน</strong></span><span>สามารถ</span><span style=\"color:#ff4b4b;\"><strong>คัดลอก</strong></span><span>ได้เลย</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725938511168-d749953c-29d5-4be1-a06d-7d47a06fc0c9.png",
            "alt": "ฝากเงินแบบ โอนผ่านธนาคาร"
          },
          {
            "type": "html",
            "html": "<ul><li><span>เมื่อทำรายการโอนผ่านแอปธนาคารแล้ว กด</span><span style=\"color:#ff4b4b;\"><strong>ยืนยันการโอน</strong></span><span>ยอดเงินจะเข้าทันที</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725938525565-b7e3cbf9-c9e2-4fa0-9747-50e6c409c996.png",
            "alt": "ฝากเงินแบบ โอนผ่านธนาคาร"
          },
          {
            "type": "html",
            "html": "<ul><li><span>รายการฝาก</span><span style=\"color:#4caf50;\"><strong>สำเร็จ</strong></span><span>ขอให้เพลิดเพลินกับทุกความสนุกครบวงจร</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725938578792-73a9ac80-8db9-4a54-ba96-99d58df7cc92.png",
            "alt": "ฝากเงินแบบ โอนผ่านธนาคาร"
          }
        ]
      },
      {
        "id": "section-1-item-2",
        "title": "ฝากเงินแบบ โอนผ่าน QR Payment",
        "blocks": [
          {
            "type": "html",
            "html": "<ul><li><span>ไปที่เมนู</span><span style=\"color:#ff4b4b;\"><strong>“ฝาก”</strong></span><span>มุมซ้ายล่าง รูปสัญลักษณ์กระเป๋าเงิน</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725938715741-bdc45ad1-33e3-43be-b15e-6be0bc60a132.png",
            "alt": "ฝากเงินแบบ โอนผ่าน QR Payment"
          },
          {
            "type": "html",
            "html": "<ul><li><span>เลือกวิธีฝากเงิน เลือก<strong> </strong></span><span style=\"color:#ff4b4b;\"><strong>“QR Payment”</strong></span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725938865047-974b1a37-2aed-48be-923c-7173d9912898.png",
            "alt": "ฝากเงินแบบ โอนผ่าน QR Payment"
          },
          {
            "type": "html",
            "html": "<ul><li><span style=\"color:#ff4b4b;\"><strong>กรอกจำนวนที่ต้องการฝาก</strong></span><span>(ขั้นต่ำ : 20 / สูงสุด : 10,000,000)</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725938840874-4b484329-881d-4a5c-8c82-9c0511174691.png",
            "alt": "ฝากเงินแบบ โอนผ่าน QR Payment"
          },
          {
            "type": "html",
            "html": "<ul><li><span>กด</span><span style=\"color:#ff4b4b;\"><strong>ยืนยัน</strong></span><span>ยอดที่ต้องการฝาก</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725938845279-9eda97fa-a2b4-4d8f-bb9c-5e4e8a20ecde.png",
            "alt": "ฝากเงินแบบ โอนผ่าน QR Payment"
          },
          {
            "type": "html",
            "html": "<ul><li><span>ดาวน์โหลด หรือ</span><span style=\"color:#ff4b4b;\"><strong>แคปภาพหน้าจอ</strong></span><span>เพื่อสแกนโอนผ่าน QR Code</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725938881089-10860d89-a5c3-40c3-8a13-dd3da1ed4bde.png",
            "alt": "ฝากเงินแบบ โอนผ่าน QR Payment"
          },
          {
            "type": "html",
            "html": "<ul><li><span>เมื่อทำรายการโอนผ่านแอปธนาคารแล้ว กด</span><span style=\"color:#ff4b4b;\"><strong>ยืนยันการโอน</strong></span><span>ยอดเงินจะเข้าทันที</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725938904772-fb382ef2-c249-4825-be42-9d23edd6a873.png",
            "alt": "ฝากเงินแบบ โอนผ่าน QR Payment"
          },
          {
            "type": "html",
            "html": "<ul><li><span>รายการฝาก</span><span style=\"color:#4caf50;\"><strong>สำเร็จ</strong></span><span>ขอให้เพลิดเพลินกับทุกความสนุกครบวงจร</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725938917346-23429af8-ef5e-4769-96ee-a932e6867391.png",
            "alt": "ฝากเงินแบบ โอนผ่าน QR Payment"
          }
        ]
      },
      {
        "id": "section-1-item-3",
        "title": "ฝากเงินแบบ ฝากจุดทศนิยม",
        "blocks": [
          {
            "type": "html",
            "html": "<ul><li><span>ไปที่เมนู</span><span style=\"color:#ff4b4b;\"><strong>“ฝาก”</strong></span><span>มุมซ้ายล่าง รูปสัญลักษณ์กระเป๋าเงิน</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725938966684-01809102-568f-4137-83a9-74af6ee0fa8f.png",
            "alt": "ฝากเงินแบบ ฝากจุดทศนิยม"
          },
          {
            "type": "html",
            "html": "<ul><li><span>เลือกวิธีฝากเงิน เลือก<strong> </strong></span><span style=\"color:#ff4b4b;\"><strong>“ฝากจุดทศนิยม” </strong></span><span>แล้วใส่</span><span style=\"color:#ff4b4b;\"><strong> จำนวนเงินที่ต้องการฝาก</strong></span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725938990251-696f26ff-ef28-441e-bff7-654aae24a557.png",
            "alt": "ฝากเงินแบบ ฝากจุดทศนิยม"
          },
          {
            "type": "html",
            "html": "<ul><li><span>ดาวน์โหลด หรือ</span><span style=\"color:#ff4b4b;\"><strong>แคปภาพหน้าจอ</strong></span><span>เพื่อสแกนโอนเงิน </span><br/><span><strong>หมายเหตุ :</strong> ระบบจะสุ่มทศนิยมให้ใหม่ทุกครั้งที่แจ้งฝาก รบกวนทำรายการภายใน 15 นาที </span><br/><span>และยอดเงินจะเข้าตามจำนวนตามทศนิยม ไม่ถูกหักเ</span><span>ศษ</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725938998353-7f194e83-5b99-4ac7-bcdb-f83c63f181e8.png",
            "alt": "ฝากเงินแบบ ฝากจุดทศนิยม"
          },
          {
            "type": "html",
            "html": "<ul><li><span>รายการฝาก</span><span style=\"color:#4caf50;\"><strong>สำเร็จ</strong></span><span>ขอให้เพลิดเพลินกับทุกความสนุกครบวงจร</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725939007520-2e4a4cda-d84b-401e-9608-22204cdb46c3.png",
            "alt": "ฝากเงินแบบ ฝากจุดทศนิยม"
          }
        ]
      },
      {
        "id": "section-1-item-4",
        "title": "วิธีการฝากแบบ TrueWallet",
        "blocks": [
          {
            "type": "html",
            "html": "<ul><li><span>ไปที่เมนู<strong> </strong></span><span style=\"color:#ff4b4b;\"><strong>“ฝาก”</strong></span><span>มุมซ้ายล่าง รูปสัญลักษณ์กระเป๋าเงิน</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725939016984-5d9d32b7-833d-4ed4-9df5-a08dede562db.png",
            "alt": "วิธีการฝากแบบ TrueWallet"
          },
          {
            "type": "html",
            "html": "<ul><li><span>เลือกวิธีฝากเงิน เลือก</span><span style=\"color:#ff4b4b;\"><strong>“True Wallet”</strong></span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725939109756-2a9a5f4b-6ac2-4c95-8fe5-19640585faf1.png",
            "alt": "วิธีการฝากแบบ TrueWallet"
          },
          {
            "type": "html",
            "html": "<ul><li><span>ใส่</span><span style=\"color:#ff4b4b;\"><strong>จำนวนเงินที่ต้องการฝาก</strong></span><span>แล้วกด ยืนยัน</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725939133220-dabb255f-9bba-4b04-81de-f51e95995c55.png",
            "alt": "วิธีการฝากแบบ TrueWallet"
          },
          {
            "type": "html",
            "html": "<ul><li><span>คัดลอกหมายเลข<strong> </strong></span><span style=\"color:#ff4b4b;\"><strong>True Wallet</strong></span><span>แล้วโอนผ่าน</span><span style=\"color:#ff4b4b;\"><strong>แอป ทรู มันนี่ วอลเล็ท</strong></span><span><strong> </strong>เท่านั้น!!</span></li><li><span>รอยอดเงินอัปเดต ภายใน 30 วินาที หากยังไม่เข้า</span><span style=\"color:#ff4b4b;\"><strong>แนบสลิป</strong></span><span>ที่โอนเพื่อแจ้งเจ้าหน้าที่คำเตือน</span></li><li><span style=\"color:#ff4b4b;\"><strong>เบอร์สมัคร</strong></span><span>และเบอร์</span><span style=\"color:#ff4b4b;\"><strong>ทรู มันนี่ วอลเล็ท</strong></span><span>ต้องเป็น</span><span style=\"color:#ff4b4b;\"><strong>เบอร์เดียวกัน!!</strong></span></li><li><span>ต้องใช้แอปทรู มันนี่ วอลเล็ท ในการโอนเท่านั้น</span><span style=\"color:#ff4b4b;\"><strong>ห้ามใช้บัญชีธนาคารโอนเข้า!!</strong></span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725939167450-f2dbc9de-3630-4fae-ac8b-2066e31ad8b6.png",
            "alt": "วิธีการฝากแบบ TrueWallet"
          }
        ]
      },
      {
        "id": "section-1-item-5",
        "title": "ยอดไม่เข้าทันที ทำยังไงดี?",
        "blocks": [
          {
            "type": "html",
            "html": "<ul><li><span>เมื่อแจ้งฝากแล้วตามขั้นตอนแล้ว ยอดยังไม่เข้า<strong> </strong></span><span style=\"color:#ff4b4b;\"><strong>ให้รอ 30 วินาที ระบบจะขึ้นให้แนบสลิป</strong></span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725939232936-efaaa837-dffa-412f-8274-03b05e5f4f95.png",
            "alt": "ยอดไม่เข้าทันที ทำยังไงดี?"
          },
          {
            "type": "html",
            "html": "<ul><li><span>เมื่อแนบสลิปแล้ว กด</span><span style=\"color:#ff4b4b;\"><strong>ยืนยันสลิป </strong></span><span>ยอดจะเข้าทันที</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725946764747-982387dd-8a86-42ae-af75-398471e48938.png",
            "alt": "ยอดไม่เข้าทันที ทำยังไงดี?"
          },
          {
            "type": "html",
            "html": "<ul><li><span>รายการฝาก</span><span style=\"color:#4caf50;\"><strong>สำเร็จ</strong></span><span>ขอให้เพลิดเพลินกับทุกความสนุกครบวงจร</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725939282111-34151ca8-be6a-4c38-a832-dcdc76a95717.png",
            "alt": "ยอดไม่เข้าทันที ทำยังไงดี?"
          }
        ]
      }
    ]
  },
  {
    "id": "section-2",
    "title": "การถอนเงิน",
    "category": "finance",
    "items": [
      {
        "id": "section-2-item-1",
        "title": "การถอนเงิน",
        "blocks": [
          {
            "type": "html",
            "html": "<ul><li><span>ไปที่เมนู</span><span style=\"color:#ff4b4b;\"><strong>“ถอน”</strong></span><span>มุมขวาล่าง รูปสัญลักษณ์เงิน</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725939356037-ca1bb304-9624-439e-a634-faa6767f06cd.png",
            "alt": "การถอนเงิน"
          },
          {
            "type": "html",
            "html": "<ul><li><span>ใส่จำนวนเงินที่ต้องการถอน (ขั้นต่ำ : 100 / สูงสุด : 2,000,000)</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725939437313-cc950b89-d632-4fac-91cd-ac6b2a36448b.png",
            "alt": "การถอนเงิน"
          },
          {
            "type": "html",
            "html": "<ul><li><span>รายการ</span><span style=\"color:#ff4b4b;\"><strong>ถอนเงินสำเร็จ</strong></span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725939463693-efaa2ab2-3c15-4433-9eba-2653b29f2954.png",
            "alt": "การถอนเงิน"
          }
        ]
      }
    ]
  },
  {
    "id": "section-3",
    "title": "โปรโมชั่น",
    "category": "activity",
    "items": [
      {
        "id": "section-3-item-1",
        "title": "โปรโมชั่นแนะนำ",
        "blocks": [
          {
            "type": "html",
            "html": "<p><span>รวบรวมทุกโปรโมชั่นยอดฮิต ทั้งโปรโมชั่นสมาชิกใหม่ และเก่า</span></p>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725939510670-4cabf305-d4f6-42b9-b2dc-0e49af900ee9.png",
            "alt": "โปรโมชั่นแนะนำ"
          }
        ]
      }
    ]
  },
  {
    "id": "section-4",
    "title": "รวบรวมทุกกิจกรรม",
    "category": "activity",
    "items": [
      {
        "id": "section-4-item-1",
        "title": "กิจกรรมทายผลคืออะไร?",
        "blocks": [
          {
            "type": "html",
            "html": "<ul><li><span><strong>กิจกรรมทายผล</strong> คือ กิจกรรมที่ให้ลูกค้าได้ร่วมสนุกทายผลต่างๆ เช่น</span><span style=\"color:#ff4b4b;\"><strong>ทายผลการแข่งขันกีฬา ทายผลมวย ทายผลหวย และทายผลอื่นๆอีกมากมาย</strong></span><span>เรามีกิจกรรมให้เลือกหลากหลายรูปแบบสามารถกดเข้าเลือกกิจกรรมทายผลที่คุณต้องการได้เลย</span></li></ul>"
          }
        ]
      },
      {
        "id": "section-4-item-2",
        "title": "สิ่งที่ต้องทำก่อนทายผล",
        "blocks": [
          {
            "type": "html",
            "html": "<ul><li><span>ก่อนทายผล ลูกค้าจะต้อง</span><span style=\"color:#ff4b4b;\"><strong>ทำตามเงื่อนไขกิจกรรม</strong></span><span>ที่แจ้งไว้ในกิจกรรมนั้นๆ จึงจะสามารถทายผลได้</span></li><li><span><strong>ตัวอย่างเงื่อนไขกิจกรรม :</strong> ฝากเงินขั้นต่ำ 100 บาท ภายใน 3 วันย้อนหลัง</span></li></ul>"
          }
        ]
      },
      {
        "id": "section-4-item-3",
        "title": "เข้าร่วมกิจกรรมทายผลยังไง?",
        "blocks": [
          {
            "type": "html",
            "html": "<ul><li><span>กดที่เมนู</span><span style=\"color:#ff4b4b;\"><strong>กิจกรรม</strong></span><span>แถบเมนูด้านบน</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725939548746-967090e0-11cc-45cb-923d-f49c6edba4e4.png",
            "alt": "เข้าร่วมกิจกรรมทายผลยังไง?"
          },
          {
            "type": "html",
            "html": "<ul><li><span>เลือกรายการ</span><span style=\"color:#ff4b4b;\"><strong>กิจกรรมทายผล</strong></span><span>ที่ต้องการ</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725939577861-e024b2c6-cb58-4c60-812a-8f310e633be3.png",
            "alt": "เข้าร่วมกิจกรรมทายผลยังไง?"
          },
          {
            "type": "html",
            "html": "<ul><li><span>ตรวจสอบเงื่อนไข และ เลือกตัวเลือกที่ต้องการ แล้วกด</span><span style=\"color:#ff4b4b;\"><strong>ยืนยันตัวเลือก</strong></span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725939597651-d9d7e0dc-1775-4d5e-96d6-d4b65a448b84.png",
            "alt": "เข้าร่วมกิจกรรมทายผลยังไง?"
          }
        ]
      },
      {
        "id": "section-4-item-4",
        "title": "การประกาศรางวัล",
        "blocks": [
          {
            "type": "html",
            "html": "<ul><li><span>รางวัลจะประกาศหลังจากกิจกรรมทายผลจบภายใน</span><span style=\"color:#ff4b4b;\"><strong>24 ชั่วโมง</strong></span></li><li><span>รางวัลจะ</span><span style=\"color:#ff4b4b;\"><strong>เครดิตเข้ายอดเงิน</strong></span><span>ลูกค้าที่ทายผลถูกอัตโนมัติ</span></li></ul>"
          }
        ]
      },
      {
        "id": "section-4-item-5",
        "title": "ล็อคอินประจำวัน / ภารกิจ",
        "blocks": [
          {
            "type": "html",
            "html": "<p><span><strong><u>กิจกรรมล็อคอินประจำวัน</u></strong></span></p><ul><li><span>กิจกรรมสำหรับสมาชิกที่</span><span style=\"color:#ff4b4b;\"><strong>ล็อคอินประจำทุกวัน</strong></span><span>เพื่อรับรางวัลในเเต่ละวัน </span></li><li><span>คลิกเลือกวัน เพื่อตรวจสอบเงื่อนไขกิจกรรม</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725939656330-23511fa2-7418-41a9-a9a9-54d3624ab663.png",
            "alt": "ล็อคอินประจำวัน / ภารกิจ"
          },
          {
            "type": "html",
            "html": "<ul><li><span>ตรวจสอบเงื่อนไขจากหน้าต่างป๊อบอัพ</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725939645099-95af6fb0-add0-4c93-aad3-b1cb913bf760.png",
            "alt": "ล็อคอินประจำวัน / ภารกิจ"
          },
          {
            "type": "html",
            "html": "<p><span><strong><u>ภารกิจ</u></strong></span></p><ul><li><span>เลื่อนลงจะพบกับหน้า</span><span style=\"color:#ff4b4b;\"><strong>รายการภารกิจ</strong></span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725939684605-7bf82a2a-fe37-4a74-85e2-2f366c3dd93d.png",
            "alt": "ล็อคอินประจำวัน / ภารกิจ"
          },
          {
            "type": "html",
            "html": "<ul><li><span>คลิกที่ภารกิจ เพื่อ</span><span style=\"color:#ff4b4b;\"><strong>ตรวจสอบเงื่อนไข</strong></span><span>ได้เลย </span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725939707027-34c0caac-42c1-4ea9-a60f-0c3435f09486.png",
            "alt": "ล็อคอินประจำวัน / ภารกิจ"
          }
        ]
      },
      {
        "id": "section-4-item-6",
        "title": "ขั้นตอน : ทายผลบอล",
        "blocks": [
          {
            "type": "html",
            "html": "<ul><li><span>เลือกกิจกรรม</span><span style=\"color:#ff4b4b;\"><strong>ทายผลบอล</strong></span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725940153339-44ee67c4-1874-4cbf-a169-12e7230ef4a6.png",
            "alt": "ขั้นตอน : ทายผลบอล"
          },
          {
            "type": "html",
            "html": "<ul><li><span>ตรวจสอบเงื่อนไขการเข้าร่วมกิจกรรม</span></li><li><span>ทายผลเลือกทีมชนะ หรือ เสมอ</span></li><li><span>ยืนยันตัวเลือก แล้วรอลุ้นกันได้เลย !!</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725940252716-5a8c7b80-52c7-4fce-811e-a14e0ffefb80.png",
            "alt": "ขั้นตอน : ทายผลบอล"
          }
        ]
      },
      {
        "id": "section-4-item-7",
        "title": "ขั้นตอน : ทายผลมวย",
        "blocks": [
          {
            "type": "html",
            "html": "<ul><li><span>เลือกกิจกรรม</span><span style=\"color:#ff4b4b;\"><strong>ทายผลมวย</strong></span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725940320515-dff6185c-5135-42c6-8fd5-ee148816f510.png",
            "alt": "ขั้นตอน : ทายผลมวย"
          },
          {
            "type": "html",
            "html": "<ul><li><span>ตรวจสอบเงื่อนไขการเข้าร่วมกิจกรรม</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725940343984-58e3480a-fcb3-42bc-ba3b-322b19d324d5.png",
            "alt": "ขั้นตอน : ทายผลมวย"
          },
          {
            "type": "html",
            "html": "<ul><li><span>ทายผล เลือกฝั่งชนะ</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725940366347-9252355e-17d1-48b6-866d-241c8516c5ea.png",
            "alt": "ขั้นตอน : ทายผลมวย"
          },
          {
            "type": "html",
            "html": "<ul><li><span>หากเลือก ชนะคะแนน กดยืนยันตัวเลือกทายผลได้เลย</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725940382417-5f435290-d0d2-40cd-ac84-3cbc370c8f10.png",
            "alt": "ขั้นตอน : ทายผลมวย"
          },
          {
            "type": "html",
            "html": "<ul><li><span>หากเลือก ชนะน็อค ต้องเลือกยกที่น๊อค ก่อนยืนยันตัวเลือก</span></li><li><span style=\"color:#ff4b4b;\"><strong>ยืนยันตัวเลือก</strong></span><span>แล้วรอลุ้นกันได้เลย !!</span></li></ul>"
          }
        ]
      },
      {
        "id": "section-4-item-8",
        "title": "ขั้นตอน : ทายผลหวย",
        "blocks": [
          {
            "type": "html",
            "html": "<ul><li><span>เลือกกิจกรรม</span><span style=\"color:#ff4b4b;\"><strong>ทายผลหวย</strong></span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725940401347-4e57ba05-ef27-4146-b63d-8526fbddee08.png",
            "alt": "ขั้นตอน : ทายผลหวย"
          },
          {
            "type": "html",
            "html": "<ul><li><span style=\"color:#ff4b4b;\"><strong>ทายถูก 3 ตัวท้าย</strong></span><span>รับ 10,000 บาท </span></li><li><span style=\"color:#ff4b4b;\"><strong>ทายถูก 2 ตัวล่าง</strong></span><span>รับ 1,000 บาท</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725940430523-f83caab9-1230-4d3b-b141-27503e87be01.png",
            "alt": "ขั้นตอน : ทายผลหวย"
          },
          {
            "type": "html",
            "html": "<ul><li><span>ทายผลให้ครบทั้ง 3 ตัวบน และ 2 ตัวล่าง</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725940437012-a9f8e8e0-0e73-4916-a425-efa2d24574d6.png",
            "alt": "ขั้นตอน : ทายผลหวย"
          },
          {
            "type": "html",
            "html": "<ul><li><span>ตรวจสอบตัวเลข</span><span style=\"color:#ff4b4b;\">ยืนยันตัวเลือก</span><span>แล้วรอลุ้นกันได้เลย !!</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725940456234-9dc4e961-6650-441a-a46c-aa3c7b3be319.png",
            "alt": "ขั้นตอน : ทายผลหวย"
          }
        ]
      }
    ]
  },
  {
    "id": "section-5",
    "title": "ข่าวสาร",
    "category": "activity",
    "items": [
      {
        "id": "section-5-item-1",
        "title": "ติดตามข่าวสาร",
        "blocks": [
          {
            "type": "html",
            "html": "<ul><li><span>ติดตามข่าวสารต่างๆ อัปเดตใหม่ได้ทุกวันที่เมนู</span><span style=\"color:#ff4b4b;\"><strong>ข่าวสาร</strong></span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725940498966-d1672227-774c-456c-916d-8a05a2cd52a1.png",
            "alt": "ติดตามข่าวสาร"
          }
        ]
      }
    ]
  },
  {
    "id": "section-6",
    "title": "การเข้าเล่นคาสิโน",
    "category": "play",
    "items": [
      {
        "id": "section-6-item-1",
        "title": "เข้าเล่น : คาสิโน",
        "blocks": [
          {
            "type": "html",
            "html": "<ul><li><span>เลือกเมนู</span><span style=\"color:#ff4b4b;\"><strong>คาสิโน</strong></span><span>จากแถบด้านบน</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725940614857-b59726bc-9257-42ac-a0e9-40c8e1fc700c.png",
            "alt": "เข้าเล่น : คาสิโน"
          },
          {
            "type": "html",
            "html": "<ul><li><span>เลือกค่ายคาสิโนที่ต้องการเข้าเล่น</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725940629358-bf07bad4-7001-44ce-8908-5f191aec1f66.png",
            "alt": "เข้าเล่น : คาสิโน"
          }
        ]
      },
      {
        "id": "section-6-item-2",
        "title": "เข้าเล่น : สล็อต",
        "blocks": [
          {
            "type": "html",
            "html": "<ul><li><span>เลือกเมนู</span><span style=\"color:#ff4b4b;\"><strong>สล็อต</strong></span><span>จากแถบด้านบน</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725940664551-c4c50e23-2cc1-464c-91bc-98328d7ea965.png",
            "alt": "เข้าเล่น : สล็อต"
          },
          {
            "type": "html",
            "html": "<ul><li><span>เลือกค่ายสล็อตที่ต้องการเข้าเล่น</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725940679518-7ff565d6-a8aa-4acb-8ee6-2531c2352728.png",
            "alt": "เข้าเล่น : สล็อต"
          }
        ]
      },
      {
        "id": "section-6-item-3",
        "title": "เข้าเล่น : ยิงปลา",
        "blocks": [
          {
            "type": "html",
            "html": "<ul><li><span>เลือกเมนู</span><span style=\"color:#ff4b4b;\"><strong>ยิงปลา</strong></span><span>จากแถบด้านบน</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725940716649-77c42777-8b90-42ea-b49f-0fe270dc91d8.png",
            "alt": "เข้าเล่น : ยิงปลา"
          },
          {
            "type": "html",
            "html": "<ul><li><span>เลือกค่ายยิงปลาที่ต้องการเข้าเล่น</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725940729538-b072dfb8-f652-46e1-b68d-1d936f6a2ef0.png",
            "alt": "เข้าเล่น : ยิงปลา"
          }
        ]
      },
      {
        "id": "section-6-item-4",
        "title": "เข้าเล่น : กีฬา",
        "blocks": [
          {
            "type": "html",
            "html": "<ul><li><span>เลือกเมนู</span><span style=\"color:#ff4b4b;\"><strong>กีฬา</strong></span><span>จากแถบด้านบน</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725940770057-bc29208f-68aa-41bb-984a-34e85655ca5a.png",
            "alt": "เข้าเล่น : กีฬา"
          },
          {
            "type": "html",
            "html": "<ul><li><span>เลือกค่ายกีฬาที่ต้องการเข้าเล่น</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725940795622-f660bce7-23c0-4e4a-872f-8247237a129c.png",
            "alt": "เข้าเล่น : กีฬา"
          }
        ]
      },
      {
        "id": "section-6-item-5",
        "title": "เข้าเล่น : ไพ่",
        "blocks": [
          {
            "type": "html",
            "html": "<ul><li><span>เลือกเมนู</span><span style=\"color:#ff4b4b;\"><strong>ไพ่</strong></span><span>จากแถบด้านบน</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725940833637-a52c9b08-32df-4f48-a154-4a585740df31.png",
            "alt": "เข้าเล่น : ไพ่"
          }
        ]
      },
      {
        "id": "section-6-item-6",
        "title": "เข้าเล่น : หวย",
        "blocks": [
          {
            "type": "html",
            "html": "<ul><li><span>เลือกเมนู</span><span style=\"color:#ff4b4b;\"><strong>หวย</strong></span><span>จากแถบด้านบน</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725940861401-ce345703-e9e9-42ee-99a3-32186c93d2c0.png",
            "alt": "เข้าเล่น : หวย"
          }
        ]
      }
    ]
  },
  {
    "id": "section-7",
    "title": "ระบบสร้างรายได้เครือข่าย",
    "category": "network",
    "items": [
      {
        "id": "section-7-item-1",
        "title": "สร้างรายได้เครือข่าย",
        "blocks": [
          {
            "type": "html",
            "html": "<ul><li><span>เลือกเมนู</span><span style=\"color:#ff4b4b;\"><strong>แนะนำเพื่อน</strong></span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725940955310-52beaec5-43df-4000-80fa-0bfdfbf6026f.png",
            "alt": "สร้างรายได้เครือข่าย"
          }
        ]
      },
      {
        "id": "section-7-item-2",
        "title": "ถอนรายได้เครือข่าย (แนะนำเพื่อน)",
        "blocks": [
          {
            "type": "html",
            "html": "<ul><li><span>กดที่ยอดรายได้เครือข่าย เพื่อถอนรายได้เข้ากระเป๋าหลัก</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725941020784-dd54c922-469c-4ad4-9017-df72f70b7444.png",
            "alt": "ถอนรายได้เครือข่าย (แนะนำเพื่อน)"
          }
        ]
      }
    ]
  },
  {
    "id": "section-8",
    "title": "สิทธิประโยชน์ลูกค้าเเต่ระดับ",
    "category": "benefit",
    "items": [
      {
        "id": "section-8-item-1",
        "title": "วิธีการตรวจสอบระดับ",
        "blocks": [
          {
            "type": "html",
            "html": "<ul><li><span>เลือกเมนู</span><span style=\"color:#ff4b4b;\"><strong>ระดับสมาชิก VIP</strong></span><span>เพื่อตรวจสอบระดับและสิทธิประโยชน์</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725941118067-60f91374-7c47-446a-bdaf-c1041a370abf.png",
            "alt": "วิธีการตรวจสอบระดับ"
          }
        ]
      },
      {
        "id": "section-8-item-2",
        "title": "ระดับ Silver",
        "blocks": [
          {
            "type": "html",
            "html": "<ul><li><span>ยอดแทงสะสมครบตามเงื่อนไข จะได้รับสิทธิประโยชน์ระดับ Silver</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725941149667-184041f8-288f-40ad-9fe2-a4a3ef2f6595.png",
            "alt": "ระดับ Silver"
          }
        ]
      },
      {
        "id": "section-8-item-3",
        "title": "ระดับ Gold",
        "blocks": [
          {
            "type": "html",
            "html": "<ul><li><span>ยอดแทงสะสมครบตามเงื่อนไข จะได้รับสิทธิประโยชน์ระดับ Gold</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725941166712-28fa2bd4-d785-420e-a4b5-3ce701537ec2.png",
            "alt": "ระดับ Gold"
          }
        ]
      },
      {
        "id": "section-8-item-4",
        "title": "ระดับ Platinum",
        "blocks": [
          {
            "type": "html",
            "html": "<ul><li><span>ยอดแทงสะสมครบตามเงื่อนไข จะได้รับสิทธิประโยชน์ระดับ Platinum</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725941182480-6aaee1f2-18ff-46d8-aa1a-b3c782c8f0ce.png",
            "alt": "ระดับ Platinum"
          }
        ]
      },
      {
        "id": "section-8-item-5",
        "title": "ระดับ Titanium",
        "blocks": [
          {
            "type": "html",
            "html": "<ul><li><span>ยอดแทงสะสมครบตามเงื่อนไข จะได้รับสิทธิประโยชน์ระดับ Titanium</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725941197952-ae48e348-a262-4a38-9988-e14ed2d29ff1.png",
            "alt": "ระดับ Titanium"
          }
        ]
      },
      {
        "id": "section-8-item-6",
        "title": "ระดับ Diamond",
        "blocks": [
          {
            "type": "html",
            "html": "<ul><li><span>ยอดแทงสะสมครบตามเงื่อนไข จะได้รับสิทธิประโยชน์ระดับ Diamond</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725941214214-b481f50a-9bb8-47ac-998c-0fa31fec35cf.png",
            "alt": "ระดับ Diamond"
          }
        ]
      },
      {
        "id": "section-8-item-7",
        "title": "ระดับ VVIP",
        "blocks": [
          {
            "type": "html",
            "html": "<ul><li><span>ยอดแทงสะสมครบตามเงื่อนไข จะได้รับสิทธิประโยชน์ระดับ VVIP</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725941230100-65c8d82f-8d08-41da-bfb5-884fc5090aaf.png",
            "alt": "ระดับ VVIP"
          }
        ]
      }
    ]
  },
  {
    "id": "section-9",
    "title": "ปัญหาอินเตอร์เน็ต",
    "category": "problem",
    "items": [
      {
        "id": "section-9-item-1",
        "title": "หากเกิดปัญหาในการเล่นเกม เช่น เกมค้าง, ไม่สามารถเข้าเกมได้",
        "blocks": [
          {
            "type": "html",
            "html": "<p><span>หากเกิดปัญหาในการเล่นเกม เช่น เกมค้าง, ไม่สามารถเข้าเกมได้</span></p><p><span><strong>ตรวจสอบสัญญาณ </strong></span><span style=\"color:#ff4b4b;\"><strong>WIFI</strong></span><span><strong>ที่ใช้บริการ</strong></span><br/><span>สังเกตไอคอนสัญญาณ Wi-Fi บนอุปกรณ์</span></p>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725941671367-008c1385-22e0-416a-ab1f-bfdc18ef5b61.png",
            "alt": "หากเกิดปัญหาในการเล่นเกม เช่น เกมค้าง, ไม่สามารถเข้าเกมได้"
          },
          {
            "type": "html",
            "html": "<ul><li><span><strong>จำนวนขีด :</strong> ยิ่งมีขีดมากเท่าไหร่ สัญญาณก็จะยิ่งแรงมากขึ้นเท่านั้น</span></li><li><span><strong>สัญลักษณ์ :</strong> บางครั้งจะมีสัญลักษณ์แสดงประเภทของเครือข่าย เช่น 2.4 GHz หรือ 5 GHz</span></li></ul><p><span><strong>ตรวจสอบสัญญาณ</strong></span><span style=\"color:#ff4b4b;\"><strong>มือถือ</strong></span><span><strong>ที่ใช้บริการ</strong></span><br/><span>สังเกตไอคอนสัญญาณมือถือ บนอุปกรณ์</span></p>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725941704940-f2f20f41-c52e-4eb1-b334-039537301d04.png",
            "alt": "หากเกิดปัญหาในการเล่นเกม เช่น เกมค้าง, ไม่สามารถเข้าเกมได้"
          },
          {
            "type": "html",
            "html": "<ul><li><span><strong>จำนวนขีด :</strong> ยิ่งมีขีดมากเท่าไหร่ สัญญาณก็จะยิ่งแรงมากขึ้นเท่านั้น</span></li><li><span><strong>ตัวอักษร :</strong> ตัวอักษรที่แสดงประเภทของเครือข่าย เช่น 3G, 4G หรือ 5G</span></li></ul><p><span><strong>ทดสอบความเร็วอินเตอร์เน็ต</strong></span></p><ul><li><span>เข้าเว็บไซต์ทดสอบความเร็วอินเตอร์เน็ต</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725941728504-b8971937-ce6c-46c5-8d54-dc7936f9b91d.png",
            "alt": "หากเกิดปัญหาในการเล่นเกม เช่น เกมค้าง, ไม่สามารถเข้าเกมได้"
          },
          {
            "type": "html",
            "html": "<ul><li><span>กด GO เพื่อเริ่มทดสอบ</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725941742519-1b0af1d3-08a3-4e27-934e-b2497e375d13.png",
            "alt": "หากเกิดปัญหาในการเล่นเกม เช่น เกมค้าง, ไม่สามารถเข้าเกมได้"
          },
          {
            "type": "html",
            "html": "<ul><li><span>รอผลการทดสอบ</span></li><li><span>หากอินเตอร์เน็ตช้า ให้ลองเปลี่ยนเครือข่าย หรือติดต่อผู้ให้บริการอินเตอร์เน็ต</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725941760858-c93196c2-b0d7-4303-ab18-6d6a339d6eef.png",
            "alt": "หากเกิดปัญหาในการเล่นเกม เช่น เกมค้าง, ไม่สามารถเข้าเกมได้"
          }
        ]
      },
      {
        "id": "section-9-item-2",
        "title": "รีเฟรชหน้าเว็บไซต์",
        "blocks": [
          {
            "type": "html",
            "html": "<p><span>หากหน้าเว็บไซต์หรือเกมค้าง ให้ลองรีเฟรชหน้าเว็บไซต์</span></p>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725941787186-a4ae3e82-44d6-4c29-a282-1099b93ed5ad.png",
            "alt": "รีเฟรชหน้าเว็บไซต์"
          }
        ]
      },
      {
        "id": "section-9-item-3",
        "title": "ติดต่อฝ่ายบริการลูกค้า",
        "blocks": [
          {
            "type": "html",
            "html": "<p><span>หากทำตามขั้นตอนแล้วยังพบปัญหา กรุณาติดต่อฝ่ายบริการลูกค้า พร้อมแจ้งรายละเอียดและภาพหน้าจอ</span></p>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725941806937-97af4a90-7218-4bb3-ab2a-c8e76d9a75ef.png",
            "alt": "ติดต่อฝ่ายบริการลูกค้า"
          },
          {
            "type": "html",
            "html": "<ul><li><span>แจ้งชื่อเกม ค่ายเกม และเวลาที่เกิดปัญหา</span></li><li><span>แนบภาพหน้าจอหรือวิดีโอ เพื่อให้เจ้าหน้าที่ตรวจสอบได้เร็วขึ้น</span></li></ul>"
          },
          {
            "type": "image",
            "source": "https://cdn.zabbet.com/FEZX/user-guides/1725941827399-c51cb1db-195e-4bed-a3ad-63124606edbd.png",
            "alt": "ติดต่อฝ่ายบริการลูกค้า"
          }
        ]
      }
    ]
  }
] as const;
