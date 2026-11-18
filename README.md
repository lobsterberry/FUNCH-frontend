# FUNCH Frontend

Next.js App Router + TypeScript + Tailwind CSS พร้อม ESLint และ Docker

## รันบนเครื่อง

ใช้ Node.js 22 ขึ้นไป และ npm โดยเปิด Terminal ในโฟลเดอร์ repository นี้:

```sh
npm ci
npm run dev
```

เปิด http://localhost:3000 และแก้หน้าแรกได้ที่ `src/app/page.tsx`
บน Windows PowerShell หากเรียก `npm` ไม่ได้เพราะ Execution Policy ให้ใช้ `npm.cmd` แทน

## Docker สำหรับพัฒนา

เปิด Docker Desktop (Linux containers) แล้วรันในโฟลเดอร์ repository นี้:

```sh
npm run docker:up
npm run docker:logs
npm run docker:down
```

หรือใช้ `docker compose up -d --build` โดยตรง เปิด http://localhost:3000
ไฟล์ใน `src` และ `public` เชื่อมกับ container เพื่อรองรับ hot reload
โหมด Docker เปิด polling ทุก 1 วินาทีเพื่อให้ตรวจพบการแก้ไฟล์บน Windows Docker Desktop
หากใช้ Linux และรับ file events ได้ตามปกติ สามารถปิด `DOCKER_WATCH_POLLING` ใน Compose เพื่อลดภาระการตรวจไฟล์
เมื่อแก้ dependencies ใน `package.json` ให้ติดตั้งด้วย `npm install` เพื่ออัปเดต
`package-lock.json` แล้วรัน `npm run docker:up` อีกครั้งเพื่อ build image ใหม่

## Docker สำหรับ production

```sh
npm run docker:prod
npm run docker:prod:down
```

ใช้ multi-stage build และ Next.js `output: "standalone"` โดยรันด้วยผู้ใช้ `node`
พร้อม health check หน้าแรก ไม่มีการ mount source จากเครื่องเข้า container
หยุดโหมดพัฒนาก่อนเปิด production เพราะใช้ service และพอร์ตเดียวกัน
หากต้องการเปลี่ยนพอร์ต ให้ตั้ง `FRONTEND_PORT` เช่นใน PowerShell:

```powershell
$env:FRONTEND_PORT = "3001"
npm run docker:up
```

## ตรวจสอบและ build

```sh
npm run lint
npm run typecheck
npm run build
npm start
```

Backend อยู่ใน repository `FUNCH-backend` ใช้การตั้งค่า Docker แยก และรันที่ http://localhost:5000
หน้าเว็บเชื่อม Backend แล้วผ่าน Next.js API routes บน origin เดียวกัน โดยส่งต่อ session/CSRF cookie แบบ HttpOnly และไม่ cache ข้อมูลบัญชี

ตั้ง `BACKEND_URL` เป็น URL ที่ Next.js server ติดต่อ Backend ได้: เมื่อรันบนเครื่องใช้ `http://localhost:5000` (ค่าเริ่มต้น), เมื่อรัน Docker Desktop ใช้ `http://host.docker.internal:5000` (Compose กำหนดให้แล้ว) หากรัน frontend/backend บน Docker network เดียวกันให้ใช้ชื่อ service ของ Backend แทน
ตั้ง `FRONTEND_URL` ฝั่ง Backend ให้ตรงกับ origin ของเว็บ เช่น `http://localhost:3000`; production ที่ใช้ HTTPS ต้องตั้ง `AUTH_URL` ฝั่ง Backend เป็น HTTPS เพื่อใช้ Secure cookie

## ข้อกำหนดและต้นแบบ

- [ข้อกำหนดโครงการ](Assignment.md)
- [Wireframe หน้าแรก](docs/wireframes/index.html)
- [Wireframe ผลการค้นหา](docs/wireframes/search.html)

## หน้าที่สร้างจาก wireframes

- `/`: หน้าแรก พร้อมฟอร์มค้นหา ประเทศยอดนิยม รถแนะนำ และกฎการคิดราคา
- `/search`: ผลการค้นหา ตัวกรองประเทศ/เมือง ราคา ประเภทรถ พวงมาลัย เกียร์ ที่นั่ง เชื้อเพลิง และออปชั่น พร้อมจัดเรียง เปลี่ยนมุมมอง และแบ่งหน้า
- `/admin/login`: เข้าสู่ระบบหลังบ้าน เฉพาะบัญชีที่เปิดใช้งานและมี role `ADMIN`; ใช้ Auth.js session เดียวกับเว็บไซต์ โดยส่ง `scope: "admin"` เพื่อปฏิเสธสมาชิกทั่วไปก่อนออก session
- `/admin/cars`: จัดการรถตาม `../wireframes/admin-cars.html` ใช้ข้อมูลจริง เพิ่ม/แก้ไขข้อมูลและออปชั่น เปลี่ยนสถานะพร้อมบริการ/ซ่อมบำรุง ค้นหา กรอง แบ่งหน้า และส่งออก CSV ตามตัวกรอง พร้อมตรวจสิทธิ์ฝั่ง server และ API
- `/admin/bookings`: ระบบอนุมัติการจองตาม `../wireframes/admin-bookings.html` แสดงสรุป 5 สถานะ ค้นหา กรองประเทศ/สถานะ เรียงลำดับและแบ่งหน้าจาก backend ตรวจรายละเอียดผู้ขับขี่ ราคาเดิมและเวลาท้องถิ่นก่อนยืนยันอนุมัติ/ปฏิเสธ พร้อมบันทึกเหตุผลและผู้พิจารณา ป้องกันบันทึกทับเมื่อแอดมินคนอื่นแก้ไขรายการ และรองรับยกเลิก/ยืนยันรับรถคืนสำหรับรายการที่อนุมัติแล้ว
- `/admin/members`: จัดการสมาชิกตาม `../wireframes/admin-members.html` ค้นหาชื่อ/อีเมล/เบอร์โทร กรองสิทธิ์และสถานะ แบ่งหน้า เพิ่ม/แก้ไขสมาชิก เปิดใช้/ระงับบัญชี ดูประวัติการจองและยอดอนุมัติ/สำเร็จ และส่งออก CSV ตามตัวกรอง ใช้ข้อมูลจริง ตรวจสิทธิ์ทั้งหน้าและ API ป้องกันลดสิทธิ์/ระงับบัญชีตนเอง และยกเลิกเซสชันเดิมเมื่อเปลี่ยนสิทธิ์หรือระงับบัญชี
- `/admin/reports`: รายงานสรุปยอดจองรถจากข้อมูลจริง เลือกช่วงวัน ประเทศ หมวดรถ สกุลเงิน และวันที่อ้างอิง เปรียบเทียบช่วงก่อนหน้าหรือปีก่อน ดูกราฟ รายการจอง และส่งออก CSV/พิมพ์ PDF
- `/admin`: ไปยัง `/admin/cars`; เมนูอนุมัติการจองและรายงานพร้อมใช้งาน
- สมัครสมาชิกแล้วเข้าสู่ระบบอัตโนมัติ, เข้าสู่ระบบด้วยบัญชีเดิม, คง session เมื่อรีเฟรช/เปลี่ยนหน้า และออกจากระบบได้
- ปุ่มจองเปิด dialog ให้ตรวจวันเวลา สถานที่คืนรถ ชื่อผู้ขับขี่และใบขับขี่ คำนวณราคาจาก Backend ก่อนยืนยัน และแสดงเลขจองจริง/ยอดรวม/สถานะ PENDING เมื่อบันทึกสำเร็จ
- ผู้ที่ยังไม่เข้าสู่ระบบเลือกเข้าสู่ระบบก่อนยืนยันจอง หรือสมัครพร้อมจองใน transaction เดียวได้ หากจองไม่สำเร็จจะไม่สร้างบัญชีใหม่ค้างไว้
- วันเวลาที่กรอกแปลงเป็น UTC ด้วย IANA time zone ของจุดรับรถ ระบบปฏิเสธเวลาที่ไม่มีหรือซ้ำในช่วงเปลี่ยน DST และไม่รับวันรับรถในอดีต
- Backend ป้องกันการจองช่วงเวลาทับกันสำหรับสถานะ PENDING/APPROVED รวมถึงคำขอพร้อมกัน; ผู้ใช้ต้องเก็บเลขจองไว้ติดต่อเจ้าหน้าที่ (ยังไม่มีหน้าประวัติการจอง)
- วันที่และสถานที่ส่งผ่าน query string; ค่าเช่าตัวอย่างคำนวณจากเวลาท้องถิ่นของปลายทางตามเกณฑ์ 8 ชั่วโมง / 14:00 น.
- ใช้ฟอนต์ Kanit ที่เก็บใน `public/fonts` พร้อมใบอนุญาต OFL ไม่โหลดฟอนต์จากบริการภายนอกขณะใช้งาน

ตรวจสอบกฎราคา: `npm test` (Node.js 22.18 ขึ้นไป)

## Layout หลังบ้านที่ใช้ร่วมกัน

`src/app/admin/(dashboard)/layout.tsx` ตรวจสิทธิ์และครอบหน้าด้วย `src/components/admin/layout/admin-layout.tsx` ซึ่งเรียก `admin-sidebar.tsx` และ `admin-navbar.tsx` แยกกัน เพิ่มหน้าใหม่ใน route group `(dashboard)` เพื่อใช้ layout เดียวกัน; หน้า login อยู่ภายนอก group นี้

หน้าที่เพิ่มใหม่ควรเรียก `requireAdminPage()` ภายใน `Suspense` ก่อนส่งข้อมูลที่จำกัดสิทธิ์ และ API ทุกจุดต้องตรวจสิทธิ์ด้วย `requireAdmin` เพราะ Next.js อาจเก็บ layout ระหว่างการเปลี่ยนหน้า ดูหน้า `cars/page.tsx` เป็นตัวอย่าง

บัญชีตัวอย่างคือ `admin@funch.example` รหัสผ่านเป็นค่าที่กำหนดไว้ตอน seed ด้วย `SEED_USER_PASSWORD` ดู `../backend/prisma/README.md` ไม่มีการฝังรหัสผ่านใน frontend

อ้างอิง: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation)
และ [Docker Next.js guide](https://docs.docker.com/guides/nextjs/)

## Dependency audit

ตรวจหลังติดตั้ง: `npm audit --omit=dev` ไม่พบช่องโหว่ใน production dependencies
ส่วน `npm audit` รายงานระดับ moderate 8 รายการในสาย dependencies ของ ESLint / typescript-eslint / minimatch
ยังไม่ได้ใช้ `npm audit fix --force` เพราะคำสั่งเสนอให้เปลี่ยน major version ของ eslint-config-next
# Fleet: รุ่นรถและหลายสาขา

หน้า `/admin/fleet` จัดการรุ่นและราคาแต่ละสาขา หน้า `/admin/cars` เพิ่มทะเบียนและดูตารางรถ หน้าค้นหาเลือกสาขาด้วย ID และเรียก `/api/fleet/search` เพื่อนับรถที่ว่างตลอดช่วงเช่า การจองส่ง `carModelLocationId` ให้ backend จัดสรรรถจริง และตรวจยอดราคาที่ลูกค้าเห็นก่อนยืนยัน

ก่อนใช้งานให้อัปเกรด backend ตาม `backend/docs/fleet.md` แล้วตรวจด้วย `npm run lint`, `npm run build`, `npm test`

## รายงานสรุปยอดจองรถ

`/admin/reports` ใช้ layout และการตรวจสิทธิ์ผู้ดูแลระบบเดิม เรียก `GET /api/admin/reports` ผ่าน Next.js proxy โดยไม่ cache ข้อมูล ตัวกรองอยู่ใน URL เพื่อเปิดซ้ำหรือแชร์ภายในทีมผู้ดูแลได้ มีสถานะกำลังโหลด ข้อผิดพลาด/ลองใหม่ และกรณีไม่พบข้อมูล รองรับมือถือและตารางเลื่อนแนวนอน

วันที่อ้างอิงใช้ `Asia/Bangkok` รวมวันสิ้นสุด เลือกช่วงได้ 1–366 วัน ค่าเริ่มต้น 30 วันล่าสุด; วันรับ–คืนรถในตารางใช้เขตเวลาที่บันทึกตอนจอง ส่วนประเทศใช้จุดรับรถและ fallback เป็นประเทศของรถสำหรับรายการเก่า ประเภทรถอ้างอิงหมวดหมู่ปัจจุบัน

ยอดยืนยันหมายถึงมูลค่า `APPROVED + COMPLETED` ตามสถานะปัจจุบัน ไม่ใช่ยอดรับชำระหรือกำไร ไม่มีการสมมติภาษี ค่าธรรมเนียม หรือคืนเงิน และแยกทุกสกุลเงินโดยไม่มีการแปลงอัตราแลกเปลี่ยน ปุ่มเลือกสกุลเงินข้างช่วงเวลาควบคุมยอดเงินบนการ์ด กราฟ ประเทศ และอันดับรถ ส่วนจำนวนคำขอรวมยังอ้างอิงตัวกรองหลัก

CSV มี UTF-8 BOM สำหรับ Excel สรุปตามสกุลเงินและรายการจองครบทุกหน้าตามตัวกรอง พร้อม escape ข้อความและป้องกัน spreadsheet formula injection ปุ่มพิมพ์เปิดหน้าต่างพิมพ์ของเบราว์เซอร์เพื่อบันทึก PDF เฉพาะสรุปและกราฟ พร้อมช่วงเวลา/ตัวกรองที่ใช้ (รายละเอียดครบอยู่ใน CSV)
