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
โครงสร้าง frontend นี้ยังไม่ได้เชื่อม API หรือ authentication กับ backend

## ข้อกำหนดและต้นแบบ

- [ข้อกำหนดโครงการ](Assignment.md)
- [Wireframe หน้าแรก](docs/wireframes/index.html)
- [Wireframe ผลการค้นหา](docs/wireframes/search.html)

## หน้าที่สร้างจาก wireframes

- `/`: หน้าแรก พร้อมฟอร์มค้นหา ประเทศยอดนิยม รถแนะนำ และกฎการคิดราคา
- `/search`: ผลการค้นหา ตัวกรองประเทศ/เมือง ราคา ประเภทรถ พวงมาลัย เกียร์ ที่นั่ง เชื้อเพลิง และออปชั่น พร้อมจัดเรียง เปลี่ยนมุมมอง และแบ่งหน้า
- ปุ่มรายละเอียดรถและจองรถเปิด dialog; ฟอร์มสมาชิกเดิม/สมัครพร้อมจองเป็นตัวอย่าง ยังไม่ส่งข้อมูลหรือสร้างรายการจริง
- วันที่และสถานที่ส่งผ่าน query string; ค่าเช่าตัวอย่างคำนวณจากเวลาท้องถิ่นของปลายทางตามเกณฑ์ 8 ชั่วโมง / 14:00 น.
- ใช้ฟอนต์ Kanit ที่เก็บใน `public/fonts` พร้อมใบอนุญาต OFL ไม่โหลดฟอนต์จากบริการภายนอกขณะใช้งาน

ตรวจสอบกฎราคา: `npm test` (Node.js 22.18 ขึ้นไป)

อ้างอิง: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation)
และ [Docker Next.js guide](https://docs.docker.com/guides/nextjs/)

## Dependency audit

ตรวจหลังติดตั้ง: `npm audit --omit=dev` ไม่พบช่องโหว่ใน production dependencies
ส่วน `npm audit` รายงานระดับ moderate 8 รายการในสาย dependencies ของ ESLint / typescript-eslint / minimatch
ยังไม่ได้ใช้ `npm audit fix --force` เพราะคำสั่งเสนอให้เปลี่ยน major version ของ eslint-config-next
