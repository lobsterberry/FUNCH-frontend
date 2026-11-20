# FUNCH Frontend

เว็บระบบเช่ารถ FUNCH ใช้ Next.js 16 App Router, React 19, TypeScript และ Tailwind CSS 4 รองรับการค้นหารถรายสาขา คำนวณราคา จองรถ ดูประวัติการจอง และจัดการข้อมูลผ่านหน้าผู้ดูแลระบบ

## เริ่มใช้งานบนเครื่อง

ใช้ Node.js 22 ขึ้นไปและ npm รันคำสั่งจากโฟลเดอร์ `frontend` ใช้ Node.js 22.18 ขึ้นไปสำหรับชุดทดสอบ

1. เริ่ม backend และเตรียมฐานข้อมูลตาม [คู่มือ backend](../backend/README.md) หากต้องการรถและบัญชีตัวอย่าง ให้รัน seed ตามคู่มือเดียวกัน
2. ติดตั้ง dependencies แล้วเปิด Next.js

   ```bash
   npm ci
   npm run dev
   ```

3. เปิด `http://localhost:3000` หน้าแรกอยู่ที่ [`src/app/(site)/page.tsx`](src/app/%28site%29/page.tsx)

บน Windows PowerShell หาก Execution Policy บล็อก `npm` ให้ใช้ `npm.cmd` แทน เช่น `npm.cmd run dev`

### เชื่อมต่อ backend

เบราว์เซอร์เรียก `/api/*` บน origin ของ frontend โดย Next.js ส่งคำขอไปยัง backend ฝั่ง server สำหรับ API ที่ใช้บัญชี ระบบส่งต่อ session/CSRF cookie และ `Set-Cookie` พร้อมปิด cache ของผลลัพธ์

| ตัวแปร | การตั้งค่า |
| --- | --- |
| `BACKEND_URL` | URL ของ backend ที่ Next.js server เข้าถึงได้ ค่าเริ่มต้นบนเครื่องคือ `http://localhost:5000` หากใช้ URL อื่นให้กำหนดใน `frontend/.env.local` หรือ environment ที่ใช้รัน Next.js |
| `BACKEND_URL` ใน Docker Compose | ค่าเริ่มต้นของทั้งโหมดพัฒนาและ production คือ `http://host.docker.internal:5000` Docker Desktop รองรับชื่อนี้ ส่วน Docker Engine บน Linux ใช้ `compose.engine.yml` ตามขั้นตอนด้านล่าง กำหนด URL อื่นใน environment หรือ `frontend/.env` หาก frontend กับ backend ใช้ Docker network เดียวกัน ให้ใช้ชื่อบริการและพอร์ตภายในของ backend |
| `FRONTEND_PORT` | พอร์ตที่ Compose เปิดบนเครื่อง ค่าเริ่มต้น `3000` |
| `FRONTEND_URL` ฝั่ง backend | Origin ที่ผู้ใช้เปิดเว็บไซต์จริง เช่น `http://localhost:3000` ตั้งให้ตรงเมื่อเปลี่ยนพอร์ตหรือโดเมน |
| `AUTH_URL` ฝั่ง backend | ตั้งเป็น URL แบบ `https://` เมื่อให้บริการผ่าน HTTPS เพื่อเปิดใช้ Secure cookie |

หลัง seed ใช้ `somchai@funch.example` สำหรับทดสอบหน้าสมาชิก หรือ `admin@funch.example` สำหรับ `/admin/login` รหัสผ่านใช้ค่าที่กำหนดใน `SEED_USER_PASSWORD` ตอนสร้างบัญชี ดู [คู่มือ Auth API](../backend/AUTH.md)

## Docker Compose

รันจากโฟลเดอร์ `frontend` ทั้งโหมดพัฒนาและ production ใช้ backend ที่เปิดแยกไว้

เปลี่ยนพอร์ตฝั่งเครื่องด้วย `FRONTEND_PORT` ใน environment หรือ `frontend/.env` เช่น `FRONTEND_PORT=3001` จากนั้นตั้ง `FRONTEND_URL` ฝั่ง backend ให้ตรงกับ origin ใหม่

### Docker Desktop

เปิด Docker Desktop ในโหมด Linux containers

#### พัฒนา

```bash
npm run docker:up
npm run docker:logs
npm run docker:down
```

เปิด `http://localhost:3000` Compose เชื่อม `src` และ `public` จากเครื่องเพื่อให้แก้ไขแล้วโหลดใหม่ และเปิดการตรวจไฟล์ทุก 1 วินาทีสำหรับ Docker Desktop หากเปลี่ยน dependencies ให้ใช้ `npm install` เพื่ออัปเดต `package-lock.json` แล้วรัน `npm run docker:up` เพื่อ build image ใหม่

#### Production

```bash
npm run docker:prod
npm run docker:prod:down
```

โหมด production ใช้ Next.js standalone server จาก multi-stage [Dockerfile](Dockerfile) รันด้วยผู้ใช้ `node` และตรวจ HTTP ที่หน้าแรก หยุดโหมดพัฒนาก่อนสลับ เพราะทั้งสองไฟล์ Compose ใช้ project, service และพอร์ตเริ่มต้นเดียวกัน

### Docker Engine บน Linux หรือ WSL 2

ติดตั้ง Docker Engine และ Docker Compose plugin บน Linux หากใช้ Windows ให้เปิดเทอร์มินัลของ Linux ใน WSL 2 เช่น Ubuntu แล้วติดตั้งและรันทั้ง frontend และ backend ใน Linux distro เดียวกัน หาก Docker daemon ยังไม่ทำงานและ distro ใช้ systemd ให้เริ่มด้วย `sudo systemctl start docker` [ติดตั้ง Docker Engine](https://docs.docker.com/engine/install/) · [ติดตั้ง Compose plugin](https://docs.docker.com/compose/install/linux/) · [ตั้งค่า systemd บน WSL 2](https://learn.microsoft.com/en-us/windows/wsl/systemd)

```bash
docker info
docker compose version
```

เริ่ม backend และเตรียมฐานข้อมูลก่อน เมื่อใช้ค่าเริ่มต้น API จะเปิดที่พอร์ต `5000` บนเครื่องที่รัน Docker Engine [คู่มือ backend](../backend/README.md)

สร้างไฟล์ `compose.engine.yml` ในโฟลเดอร์ `frontend` เพื่อให้ `host.docker.internal` ชี้ไปยัง host ของ Docker Engine และใช้ `BACKEND_URL` ค่าเริ่มต้นได้ [Docker Compose networking](https://docs.docker.com/compose/how-tos/networking/#custom-dns-with-extra_hosts)

```yaml
services:
  frontend:
    extra_hosts:
      - "host.docker.internal=host-gateway"
```

รันจากโฟลเดอร์ `frontend` ใช้ไฟล์ Compose ตามโหมดที่ต้องการ คู่กับ `compose.engine.yml`

```bash
# โหมดพัฒนา
docker compose -f docker-compose.yml -f compose.engine.yml up -d --build

# โหมด production
docker compose -f docker-compose.prod.yml -f compose.engine.yml up -d --build
```

เปิด `http://localhost:3000` และตรวจการเชื่อมต่อกับ backend ที่ `http://localhost:3000/api/countries` ซึ่งควรคืน JSON ถ้า backend ใช้พอร์ตอื่น ให้ตั้ง `BACKEND_URL` ใน `frontend/.env` เช่น `http://host.docker.internal:5001` ถ้า backend อยู่คนละเครื่อง ให้ตั้งเป็น URL ที่คอนเทนเนอร์เข้าถึงได้

ใช้ไฟล์ Compose คู่เดิมเมื่อตรวจสถานะ ดู log หรือหยุดบริการ ตัวอย่างสำหรับโหมดพัฒนา

```bash
docker compose -f docker-compose.yml -f compose.engine.yml ps
docker compose -f docker-compose.yml -f compose.engine.yml logs -f frontend
docker compose -f docker-compose.yml -f compose.engine.yml down
```

## หน้าเว็บและขั้นตอนการจอง

| หน้า | การใช้งาน |
| --- | --- |
| `/` | ฟอร์มค้นหารถ ประเทศยอดนิยม รถแนะนำ และกฎการคิดราคา |
| `/search` | ผลการค้นหาตามสาขาและช่วงเช่า แสดงจำนวนรถว่าง กรองราคา ประเภทรถ พวงมาลัย เกียร์ ที่นั่ง เชื้อเพลิง และอุปกรณ์ พร้อมเรียงลำดับ เปลี่ยนมุมมอง และแบ่งหน้า |
| `/bookings` | ประวัติการจองของบัญชีที่เข้าสู่ระบบ แสดงเลขจอง สถานะ รถ ยอดรวม และวันเวลาในเขตเวลาของสาขารับ–คืนรถ เปิดจากเมนูบัญชีได้ หน้าเว็บเรียก `GET /api/bookings/mine` ผ่าน Next.js |

- ฟอร์มเลือกเวลารับและคืนได้ทุก 30 นาที ป้ายระยะเวลาแสดงทั้งเวลาที่ใช้จริงและจำนวนวันหรือชั่วโมงที่ใช้คิดราคา ข้อมูลสาขาและช่วงเช่าจะติดไปกับ URL ของหน้าค้นหา
- เมื่อส่งช่วงเช่า หน้าเว็บใช้รหัสสาขาและเวลาเพื่อค้นหาข้อเสนอผ่าน `GET /api/cars/search` ฟอร์มจองแปลงเวลาท้องถิ่นของสาขารับและคืนเป็น UTC และแจ้งเมื่อเวลาอยู่ในช่วง DST ที่กำกวมหรือไม่มีอยู่จริง หรือเมื่อเวลารับรถอยู่ในอดีต
- ฟอร์มจองตรวจสาขาคืนรถและข้อมูลผู้ขับขี่ แล้วขอราคาจาก `POST /api/bookings/calculate` ก่อนยืนยัน การจองส่งรหัสข้อเสนอ `carModelLocationId` และราคาที่แสดงให้ backend ตรวจความว่าง จัดสรรรถ และยืนยันยอดอีกครั้ง เมื่อบันทึกสำเร็จจะแสดงเลขจอง ยอดรวม และสถานะ `PENDING`
- ผู้ใช้เข้าสู่ระบบก่อนจองหรือสมัครพร้อมจองได้ การสมัครพร้อมจองบันทึกบัญชีและรายการจองใน transaction เดียว จากนั้นหน้าเว็บพยายามเข้าสู่ระบบด้วยบัญชีใหม่

## หน้าผู้ดูแลระบบ

| หน้า | การใช้งาน |
| --- | --- |
| `/admin/login` | เข้าสู่ระบบสำหรับบัญชีที่เปิดใช้งานและมี role `ADMIN` โดยใช้ Auth.js session เดียวกับหน้าลูกค้า |
| `/admin` | ไปยัง `/admin/cars` |
| `/admin/cars` | จัดการสเปกรุ่น ข้อเสนอและราคารายสาขา และรถรายคัน ดูตามรุ่น สาขา หรือทะเบียน เพิ่มหลายคัน ย้ายรถข้ามสาขา เปลี่ยนสถานะ ดูตารางจองและประวัติการย้าย และส่งออก CSV |
| `/admin/bookings` | ค้นหา กรอง เรียง และแบ่งหน้ารายการจอง ตรวจรายละเอียดผู้ขับขี่ ราคา และวันเวลา ก่อนอนุมัติ ปฏิเสธ ยกเลิก หรือบันทึกการคืนรถ ระบบตรวจการแก้ไขพร้อมกันด้วยเวลาอัปเดตรายการ |
| `/admin/members` | ค้นหาและกรองสมาชิก เพิ่มหรือแก้ไขบัญชี เปิดใช้หรือระงับบัญชี ดูประวัติและยอดจองที่อนุมัติหรือเสร็จสิ้น และส่งออกรายชื่อ CSV |
| `/admin/reports` | รายงานยอดจองตามช่วงวันที่ ประเทศ หมวดรถ สกุลเงิน และวันที่อ้างอิง พร้อมการเปรียบเทียบช่วงก่อนหน้าหรือปีก่อน กราฟ ตารางรายละเอียด CSV และการพิมพ์หรือบันทึก PDF ผ่านเบราว์เซอร์ |

รายงานใช้วันที่ตาม `Asia/Bangkok` รวมวันสิ้นสุด เลือกได้ 1–366 วันและเริ่มต้นที่ 30 วันล่าสุด ยอดยืนยันรวมมูลค่ารายการที่ปัจจุบันเป็น `APPROVED` หรือ `COMPLETED` แยกตามสกุลเงิน CSV ส่งออกทุกรายการตามตัวกรอง ส่วนหน้าพิมพ์แสดงสรุปและกราฟ

หน้าผู้ดูแลใช้ layout ร่วมใน `src/app/admin/(dashboard)/layout.tsx` ที่ตรวจ session ด้วย `requireAdminPage()` หน้าใหม่ที่ส่งข้อมูลจำกัดสิทธิ์ควรเรียกฟังก์ชันนี้ภายใน `Suspense` เช่น [หน้าจัดการรถ](src/app/admin/%28dashboard%29/cars/page.tsx) สิทธิ์ของ API ตรวจซ้ำที่ backend

## ตรวจสอบและ build

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

`npm test` ครอบคลุมการคิดราคา เวลาและเขตเวลาของสาขา ตัวกรองค้นหา มุมมองจัดการรถ และการคำนวณในหน้ารายงาน ใช้ขั้นตอน production ในหัวข้อ Docker Compose เมื่อต้องการรันผล build แบบ standalone พร้อมไฟล์ static

โปรเจกต์ใช้ฟอนต์ Kanit ที่เก็บใน `public/fonts` พร้อม [ใบอนุญาต OFL](public/fonts/OFL.txt)
