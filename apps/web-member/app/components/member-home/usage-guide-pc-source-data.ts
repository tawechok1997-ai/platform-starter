export type PcGuidePartTone = 'default' | 'danger' | 'success';

export type PcGuidePart = Readonly<{
  text: string;
  tone?: PcGuidePartTone;
  strong?: boolean;
}>;

export type PcGuideStep = Readonly<{
  bullet?: boolean;
  lines: readonly (readonly PcGuidePart[])[];
  image: string;
  alt: string;
}>;

export type PcSourceGuideItem = Readonly<{
  steps: readonly PcGuideStep[];
}>;

const plain = (text: string): PcGuidePart => ({ text });
const danger = (text: string): PcGuidePart => ({ text, tone: 'danger', strong: true });
const success = (text: string): PcGuidePart => ({ text, tone: 'success', strong: true });

export const PC_USAGE_GUIDE_SOURCE_BY_QUESTION: Readonly<Record<string, PcSourceGuideItem>> = {
  'ฝากเงินแบบ โอนผ่านธนาคาร': {
    steps: [
      {
        lines: [[plain('ไปที่เมนู '), danger('“ฝาก”'), plain(' มุมซ้ายล่าง รูปสัญลักษณ์กระเป๋าเงิน')]],
        image: 'https://cdn.zabbet.com/FEZX/user-guides/1725938593250-89ca8ca6-1262-4788-b0a7-9a2a311e91ed.png',
        alt: 'เมนูฝากเงินมุมซ้ายล่าง',
      },
      {
        lines: [[plain('เลือกวิธีฝากเงิน เลือก '), danger('“โอนเงินผ่านธนาคาร”')]],
        image: 'https://cdn.zabbet.com/FEZX/user-guides/1725938601567-c551d627-bf2d-4b8b-8b26-cc504e9fa071.png',
        alt: 'เลือกโอนเงินผ่านธนาคาร',
      },
      {
        lines: [[danger('กรอกจำนวนที่ต้องการฝาก'), plain(' (ขั้นต่ำ : 20 / สูงสุด : 10,000,000)')]],
        image: 'https://cdn.zabbet.com/FEZX/user-guides/1725938469074-c80bae14-b9ec-4a60-92cb-f765a652110d.png',
        alt: 'กรอกจำนวนเงินฝากผ่านธนาคาร',
      },
      {
        lines: [[plain('กด '), danger('ยืนยัน'), plain(' ยอดที่ต้องการฝาก')]],
        image: 'https://cdn.zabbet.com/FEZX/user-guides/1725938505132-615e78b4-68f9-40e5-b3f9-784eaaaaec59.png',
        alt: 'ยืนยันยอดฝากผ่านธนาคาร',
      },
      {
        bullet: true,
        lines: [[plain('หน้ารายละเอียดฝากเงิน จะแจ้ง '), danger('เลขบัญชีที่ต้องโอน'), plain(' สามารถ '), danger('คัดลอก'), plain(' ได้เลย')]],
        image: 'https://cdn.zabbet.com/FEZX/user-guides/1725938511168-d749953c-29d5-4be1-a06d-7d47a06fc0c9.png',
        alt: 'รายละเอียดบัญชีรับเงินฝาก',
      },
      {
        bullet: true,
        lines: [[plain('เมื่อทำรายการโอนผ่านแอปธนาคารแล้ว กด '), danger('ยืนยันการโอน'), plain(' ยอดเงินจะเข้าทันที')]],
        image: 'https://cdn.zabbet.com/FEZX/user-guides/1725938525565-b7e3cbf9-c9e2-4fa0-9747-50e6c409c996.png',
        alt: 'ยืนยันการโอนเงินผ่านธนาคาร',
      },
      {
        bullet: true,
        lines: [[plain('รายการฝาก '), success('สำเร็จ'), plain(' ขอให้เพลิดเพลินกับทุกความสนุกครบวงจร')]],
        image: 'https://cdn.zabbet.com/FEZX/user-guides/1725938578792-73a9ac80-8db9-4a54-ba96-99d58df7cc92.png',
        alt: 'รายการฝากเงินผ่านธนาคารสำเร็จ',
      },
    ],
  },
  'ฝากเงินแบบ โอนผ่าน QR Payment': {
    steps: [
      {
        bullet: true,
        lines: [[plain('ไปที่เมนู '), danger('“ฝาก”'), plain(' มุมซ้ายล่าง รูปสัญลักษณ์กระเป๋าเงิน')]],
        image: 'https://cdn.zabbet.com/FEZX/user-guides/1725938715741-bdc45ad1-33e3-43be-b15e-6be0bc60a132.png',
        alt: 'เมนูฝากเงินสำหรับ QR Payment',
      },
      {
        bullet: true,
        lines: [[plain('เลือกวิธีฝากเงิน เลือก '), danger('“QR Payment”')]],
        image: 'https://cdn.zabbet.com/FEZX/user-guides/1725938865047-974b1a37-2aed-48be-923c-7173d9912898.png',
        alt: 'เลือกวิธีฝาก QR Payment',
      },
      {
        bullet: true,
        lines: [[danger('กรอกจำนวนที่ต้องการฝาก'), plain(' (ขั้นต่ำ : 20 / สูงสุด : 10,000,000)')]],
        image: 'https://cdn.zabbet.com/FEZX/user-guides/1725938840874-4b484329-881d-4a5c-8c82-9c0511174691.png',
        alt: 'กรอกจำนวนเงินฝาก QR Payment',
      },
      {
        bullet: true,
        lines: [[plain('กด '), danger('ยืนยัน'), plain(' ยอดที่ต้องการฝาก')]],
        image: 'https://cdn.zabbet.com/FEZX/user-guides/1725938845279-9eda97fa-a2b4-4d8f-bb9c-5e4e8a20ecde.png',
        alt: 'ยืนยันยอดฝาก QR Payment',
      },
      {
        bullet: true,
        lines: [[plain('ดาวน์โหลด หรือ '), danger('แคปภาพหน้าจอ'), plain(' เพื่อสแกนโอนผ่าน QR Code')]],
        image: 'https://cdn.zabbet.com/FEZX/user-guides/1725938881089-10860d89-a5c3-40c3-8a13-dd3da1ed4bde.png',
        alt: 'ดาวน์โหลดหรือแคป QR Code',
      },
      {
        bullet: true,
        lines: [[plain('เมื่อทำรายการโอนผ่านแอปธนาคารแล้ว กด '), danger('ยืนยันการโอน'), plain(' ยอดเงินจะเข้าทันที')]],
        image: 'https://cdn.zabbet.com/FEZX/user-guides/1725938904772-fb382ef2-c249-4825-be42-9d23edd6a873.png',
        alt: 'ยืนยันการโอน QR Payment',
      },
      {
        bullet: true,
        lines: [[plain('รายการฝาก '), success('สำเร็จ'), plain(' ขอให้เพลิดเพลินกับทุกความสนุกครบวงจร')]],
        image: 'https://cdn.zabbet.com/FEZX/user-guides/1725938917346-23429af8-ef5e-4769-96ee-a932e6867391.png',
        alt: 'รายการฝาก QR Payment สำเร็จ',
      },
    ],
  },
  'ฝากเงินแบบ ฝากจุดทศนิยม': {
    steps: [
      {
        bullet: true,
        lines: [[plain('ไปที่เมนู '), danger('“ฝาก”'), plain(' มุมซ้ายล่าง รูปสัญลักษณ์กระเป๋าเงิน')]],
        image: 'https://cdn.zabbet.com/FEZX/user-guides/1725938966684-01809102-568f-4137-83a9-74af6ee0fa8f.png',
        alt: 'เมนูฝากเงินแบบจุดทศนิยม',
      },
      {
        bullet: true,
        lines: [[plain('เลือกวิธีฝากเงิน เลือก '), danger('“ฝากจุดทศนิยม”'), plain(' แล้วใส่ '), danger('จำนวนเงินที่ต้องการฝาก')]],
        image: 'https://cdn.zabbet.com/FEZX/user-guides/1725938990251-696f26ff-ef28-441e-bff7-654aae24a557.png',
        alt: 'เลือกฝากจุดทศนิยมและกรอกจำนวนเงิน',
      },
      {
        bullet: true,
        lines: [
          [plain('ดาวน์โหลด หรือ '), danger('แคปภาพหน้าจอ'), plain(' เพื่อสแกนโอนเงิน')],
          [plain('หมายเหตุ : ระบบจะสุ่มทศนิยมให้ใหม่ทุกครั้งที่แจ้งฝาก รบกวนทำรายการภายใน 15 นาที')],
          [plain('และยอดเงินจะเข้าตามจำนวนตามทศนิยม ไม่ถูกหักเศษ')],
        ],
        image: 'https://cdn.zabbet.com/FEZX/user-guides/1725938998353-7f194e83-5b99-4ac7-bcdb-f83c63f181e8.png',
        alt: 'QR สำหรับฝากเงินแบบจุดทศนิยม',
      },
      {
        bullet: true,
        lines: [[plain('รายการฝาก '), success('สำเร็จ'), plain(' ขอให้เพลิดเพลินกับทุกความสนุกครบวงจร')]],
        image: 'https://cdn.zabbet.com/FEZX/user-guides/1725939007520-2e4a4cda-d84b-401e-9608-22204cdb46c3.png',
        alt: 'รายการฝากจุดทศนิยมสำเร็จ',
      },
    ],
  },
  'วิธีการฝากแบบ TrueWallet': {
    steps: [
      {
        bullet: true,
        lines: [[plain('ไปที่เมนู '), danger('“ฝาก”'), plain(' มุมซ้ายล่าง รูปสัญลักษณ์กระเป๋าเงิน')]],
        image: 'https://cdn.zabbet.com/FEZX/user-guides/1725939016984-5d9d32b7-833d-4ed4-9df5-a08dede562db.png',
        alt: 'เมนูฝากเงินสำหรับ TrueWallet',
      },
      {
        bullet: true,
        lines: [[plain('เลือกวิธีฝากเงิน เลือก '), danger('“True Wallet”')]],
        image: 'https://cdn.zabbet.com/FEZX/user-guides/1725939109756-2a9a5f4b-6ac2-4c95-8fe5-19640585faf1.png',
        alt: 'เลือกวิธีฝาก True Wallet',
      },
      {
        bullet: true,
        lines: [[plain('ใส่ '), danger('จำนวนเงินที่ต้องการฝาก'), plain(' แล้วกด ยืนยัน')]],
        image: 'https://cdn.zabbet.com/FEZX/user-guides/1725939133220-dabb255f-9bba-4b04-81de-f51e95995c55.png',
        alt: 'กรอกจำนวนเงินฝาก True Wallet',
      },
      {
        bullet: true,
        lines: [
          [plain('คัดลอกหมายเลข '), danger('True Wallet'), plain(' แล้วโอนผ่าน '), danger('แอป ทรู มันนี่ วอลเล็ท'), plain(' เท่านั้น!!')],
          [plain('รอยอดเงินอัปเดต ภายใน 30 วินาที หากยังไม่เข้า '), danger('แนบสลิป'), plain(' ที่โอนเพื่อแจ้งเจ้าหน้าที่')],
          [danger('เบอร์สมัคร'), plain(' และเบอร์ '), danger('ทรู มันนี่ วอลเล็ท'), plain(' ต้องเป็น '), danger('เบอร์เดียวกัน!!')],
          [plain('ต้องใช้แอปทรู มันนี่ วอลเล็ท ในการโอนเท่านั้น '), danger('ห้ามใช้บัญชีธนาคารโอนเข้า!!')],
        ],
        image: 'https://cdn.zabbet.com/FEZX/user-guides/1725939167450-f2dbc9de-3630-4fae-ac8b-2066e31ad8b6.png',
        alt: 'รายละเอียดการโอนผ่าน True Wallet',
      },
    ],
  },
  'ยอดไม่เข้าทันที ทำยังไงดี?': {
    steps: [
      {
        bullet: true,
        lines: [[plain('เมื่อแจ้งฝากแล้วตามขั้นตอนแล้ว ยอดยังไม่เข้า '), danger('ให้รอ 30 วินาที ระบบจะขึ้นให้แนบสลิป')]],
        image: 'https://cdn.zabbet.com/FEZX/user-guides/1725939232936-efaaa837-dffa-412f-8274-03b05e5f4f95.png',
        alt: 'รอระบบแสดงปุ่มแนบสลิป',
      },
      {
        bullet: true,
        lines: [[plain('เมื่อแนบสลิปแล้ว กด '), danger('ยืนยันสลิป'), plain(' ยอดจะเข้าทันที')]],
        image: 'https://cdn.zabbet.com/FEZX/user-guides/1725946764747-982387dd-8a86-42ae-af75-398471e48938.png',
        alt: 'ยืนยันสลิปฝากเงิน',
      },
      {
        bullet: true,
        lines: [[plain('รายการฝาก '), success('สำเร็จ'), plain(' ขอให้เพลิดเพลินกับทุกความสนุกครบวงจร')]],
        image: 'https://cdn.zabbet.com/FEZX/user-guides/1725939282111-34151ca8-be6a-4c38-a832-dcdc76a95717.png',
        alt: 'รายการฝากหลังแนบสลิปสำเร็จ',
      },
    ],
  },
};

export const PC_USAGE_GUIDE_DEFAULT_OPEN_KEYS = [
  'deposit:0',
  'deposit:1',
  'deposit:2',
  'deposit:3',
  'deposit:4',
] as const;
