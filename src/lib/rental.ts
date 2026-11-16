export const countries = [
  {
    code: "JP",
    name: "ญี่ปุ่น",
    english: "Japan",
    flag: "🇯🇵",
    city: "โตเกียว",
    location: "โตเกียว - สนามบินฮาเนดะ (HND Airport)",
    steering: "right",
    cities: ["โตเกียว", "โอซาก้า", "ฟุกุโอกะ", "ฮอกไกโด"],
  },
  {
    code: "TH",
    name: "ไทย",
    english: "Thailand",
    flag: "🇹🇭",
    city: "กรุงเทพฯ",
    location: "กรุงเทพฯ - สนามบินสุวรรณภูมิ (BKK Airport)",
    steering: "right",
    cities: ["กรุงเทพฯ", "ภูเก็ต", "เชียงใหม่"],
  },
  {
    code: "DE",
    name: "เยอรมนี",
    english: "Germany",
    flag: "🇩🇪",
    city: "แฟรงก์เฟิร์ต",
    location: "แฟรงก์เฟิร์ต - สนามบินแฟรงก์เฟิร์ต (FRA)",
    steering: "left",
    cities: ["แฟรงก์เฟิร์ต", "มิวนิก"],
  },
  {
    code: "GB",
    name: "สหราชอาณาจักร",
    english: "UK",
    flag: "🇬🇧",
    city: "ลอนดอน",
    location: "ลอนดอน - สนามบินฮีทโธรว์ (LHR)",
    steering: "right",
    cities: ["ลอนดอน", "แมนเชสเตอร์"],
  },
  {
    code: "US",
    name: "สหรัฐอเมริกา",
    english: "USA",
    flag: "🇺🇸",
    city: "ลอสแอนเจลิส",
    location: "ลอสแอนเจลิส - สนามบิน LAX",
    steering: "left",
    cities: ["ลอสแอนเจลิส", "นิวยอร์ก"],
  },
  {
    code: "SG",
    name: "สิงคโปร์",
    english: "Singapore",
    flag: "🇸🇬",
    city: "สิงคโปร์",
    location: "สิงคโปร์ - สนามบินชางงี (SIN)",
    steering: "right",
    cities: ["สิงคโปร์"],
  },
] as const;

export type Car = {
  id: string;
  name: string;
  model: string;
  country: string;
  city: string;
  category: "SUV" | "Sedan" | "MPV" | "Luxury";
  badge: string;
  description: string;
  seats: number;
  bags: number;
  gear: string;
  fuel: "Hybrid" | "EV" | "Diesel" | "Petrol";
  steering: "right" | "left";
  day: number;
  hour: number;
  rating: number;
  reviews: number;
  features: string[];
  provider: string;
  color: string;
  featured?: boolean;
};

export const cars: Car[] = [
  {
    id: "toyota-harrier",
    name: "Toyota Harrier Hybrid 2.5",
    model: "Toyota Harrier Hybrid 2024",
    country: "JP",
    city: "โตเกียว",
    category: "SUV",
    badge: "SUV Premium",
    description: "ระบบไฮบริด ประหยัดน้ำมัน ขับนุ่มนวล เดินทางไกลสบาย",
    seats: 5,
    bags: 3,
    gear: "อัตโนมัติ E-Four",
    fuel: "Hybrid",
    steering: "right",
    day: 2200,
    hour: 280,
    rating: 4.9,
    reviews: 142,
    features: [
      "GPS เมนูอังกฤษ",
      "Apple CarPlay",
      "กล้องรอบคัน 360°",
      "ETC Card Reader",
      "รวมประกันภัยพื้นฐาน",
    ],
    provider: "Times Car Rental Haneda",
    color: "text-slate-700",
    featured: true,
  },
  {
    id: "honda-city",
    name: "Honda City e:HEV RS",
    model: "Honda City e:HEV RS 2024",
    country: "TH",
    city: "กรุงเทพฯ",
    category: "Sedan",
    badge: "Eco Sedan",
    description: "คล่องตัว ขับง่ายในเมือง พร้อม Honda SENSING ครบครัน",
    seats: 5,
    bags: 2,
    gear: "e-CVT",
    fuel: "Hybrid",
    steering: "right",
    day: 1200,
    hour: 150,
    rating: 4.8,
    reviews: 98,
    features: ["Apple CarPlay", "Honda SENSING", "รวมประกันภัยพื้นฐาน"],
    provider: "FUNCH Bangkok",
    color: "text-slate-600",
    featured: true,
  },
  {
    id: "tesla-model-y",
    name: "Tesla Model Y Long Range",
    model: "Tesla Model Y Long Range 2024",
    country: "DE",
    city: "แฟรงก์เฟิร์ต",
    category: "SUV",
    badge: "EV 100%",
    description: "ระยะทาง 533 กม./ชาร์จ ขับบน Autobahn สบายด้วย Autopilot",
    seats: 5,
    bags: 4,
    gear: "AWD ไฟฟ้า",
    fuel: "EV",
    steering: "left",
    day: 3400,
    hour: 420,
    rating: 4.95,
    reviews: 210,
    features: ["Autopilot", "GPS เมนูอังกฤษ", "Supercharger", "รวมประกันภัยพื้นฐาน"],
    provider: "FUNCH Frankfurt",
    color: "text-blue-600",
    featured: true,
  },
  {
    id: "nissan-serena",
    name: "Nissan Serena e-POWER (7 Seats)",
    model: "Nissan Serena e-POWER 2024",
    country: "JP",
    city: "โตเกียว",
    category: "MPV",
    badge: "MPV / 7 ที่นั่ง",
    description: "เหมาะสำหรับครอบครัว เดินทางพร้อมสัมภาระขนาดใหญ่",
    seats: 7,
    bags: 5,
    gear: "ออโต้ e-POWER",
    fuel: "Hybrid",
    steering: "right",
    day: 2600,
    hour: 320,
    rating: 4.88,
    reviews: 160,
    features: [
      "GPS เมนูอังกฤษ",
      "ประตูสไลด์ไฟฟ้า",
      "ETC Card Reader",
      "รวมประกันภัยพื้นฐาน",
    ],
    provider: "Nissan Rent a Car Haneda",
    color: "text-slate-600",
    featured: true,
  },
  {
    id: "bmw-touring",
    name: "BMW 320d M Sport Touring",
    model: "BMW 320d M Sport Touring",
    country: "GB",
    city: "ลอนดอน",
    category: "Luxury",
    badge: "Luxury Estate",
    description: "สมรรถนะยอดเยี่ยม เดินทางในชนบทอังกฤษได้อย่างคล่องตัว",
    seats: 5,
    bags: 3,
    gear: "Steptronic 8-Spd",
    fuel: "Diesel",
    steering: "right",
    day: 4100,
    hour: 510,
    rating: 4.92,
    reviews: 85,
    features: ["Apple CarPlay", "GPS เมนูอังกฤษ", "รวมประกันภัยพื้นฐาน"],
    provider: "FUNCH London",
    color: "text-slate-800",
    featured: true,
  },
  {
    id: "toyota-yaris-cross",
    name: "Toyota Yaris Cross HEV Premium",
    model: "Toyota Yaris Cross HEV 2024",
    country: "TH",
    city: "ภูเก็ต",
    category: "SUV",
    badge: "Compact Crossover",
    description: "ยกสูงทัศนวิสัยดี ประหยัดน้ำมัน ขับเที่ยวภูเก็ตได้สบาย",
    seats: 5,
    bags: 3,
    gear: "E-CVT",
    fuel: "Hybrid",
    steering: "right",
    day: 1500,
    hour: 190,
    rating: 4.87,
    reviews: 104,
    features: ["Apple CarPlay", "กล้องรอบคัน 360°", "รวมประกันภัยพื้นฐาน"],
    provider: "FUNCH Phuket",
    color: "text-emerald-700",
    featured: true,
  },
  {
    id: "tesla-model-3",
    name: "Tesla Model 3 Highland",
    model: "Tesla Model 3 Long Range 2024",
    country: "JP",
    city: "โตเกียว",
    category: "Sedan",
    badge: "EV 100%",
    description: "รถยนต์ไฟฟ้า 100% เงียบ นุ่มนวล พร้อมเทคโนโลยีอัจฉริยะ",
    seats: 5,
    bags: 3,
    gear: "อัตโนมัติ AWD",
    fuel: "EV",
    steering: "right",
    day: 3100,
    hour: 390,
    rating: 4.95,
    reviews: 86,
    features: [
      "Autopilot",
      "GPS เมนูอังกฤษ",
      "กล้องรอบคัน 360°",
      "รวมประกันภัยพื้นฐาน",
    ],
    provider: "EV Rental Tokyo",
    color: "text-blue-600",
  },
  {
    id: "toyota-corolla-cross",
    name: "Toyota Corolla Cross Hybrid",
    model: "Toyota Corolla Cross Hybrid 2024",
    country: "JP",
    city: "โตเกียว",
    category: "SUV",
    badge: "Compact SUV",
    description: "คล่องตัว ประหยัดน้ำมัน พร้อมพื้นที่สำหรับทุกการเดินทาง",
    seats: 5,
    bags: 3,
    gear: "อัตโนมัติ E-CVT",
    fuel: "Hybrid",
    steering: "right",
    day: 1800,
    hour: 230,
    rating: 4.85,
    reviews: 112,
    features: [
      "GPS เมนูอังกฤษ",
      "Apple CarPlay",
      "ETC Card Reader",
      "รวมประกันภัยพื้นฐาน",
    ],
    provider: "Toyota Rent a Car Haneda",
    color: "text-emerald-700",
  },
];

export type SearchCriteria = {
  country: string;
  location: string;
  pickup_date: string;
  pickup_time: string;
  return_date: string;
  return_time: string;
  return_location?: string;
  service?: string;
};
export const defaultCriteria: SearchCriteria = {
  country: "JP",
  location: countries[0].location,
  pickup_date: "2026-11-20",
  pickup_time: "10:00",
  return_date: "2026-11-22",
  return_time: "15:00",
  service: "self-drive",
};
export const getCountry = (code: string) =>
  countries.find((country) => country.code === code) ?? countries[0];
export const money = (amount: number) => `฿${amount.toLocaleString("th-TH")}`;

function wallTime(date: string, time: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
  )
    return NaN;
  const parsed = Date.parse(`${date}T${time}:00Z`);
  return Number.isFinite(parsed) &&
    new Date(parsed).toISOString().slice(0, 10) === date
    ? parsed
    : NaN;
}

// Treat inputs as wall-clock time at the destination, independent of the viewer's timezone.
export function rentalDuration(criteria: SearchCriteria) {
  const start = wallTime(criteria.pickup_date, criteria.pickup_time);
  const end = wallTime(criteria.return_date, criteria.return_time);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
    return null;
  const elapsedHours = Math.ceil((end - start) / 3_600_000);
  let days = Math.floor(elapsedHours / 24);
  let hours = elapsedHours % 24;
  const lateReturn = criteria.return_time > "14:00";
  if (hours > 8 || (lateReturn && hours > 0)) {
    days += 1;
    hours = 0;
  }
  return {
    days,
    hours,
    elapsedDays: Math.floor(elapsedHours / 24),
    elapsedHours: elapsedHours % 24,
    lateReturn,
    label: [days > 0 ? `${days} วัน` : "", hours > 0 ? `${hours} ชั่วโมง` : ""]
      .filter(Boolean)
      .join(" "),
  };
}

export function rentalTotal(
  car: Pick<Car, "day" | "hour">,
  criteria: SearchCriteria,
) {
  const duration = rentalDuration(criteria);
  return duration
    ? duration.days * car.day + Math.min(duration.hours * car.hour, car.day)
    : null;
}
