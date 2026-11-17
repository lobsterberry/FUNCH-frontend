export function AdminIcon({ name, className = "h-5 w-5" }: { name: "car" | "booking" | "users" | "report" | "menu" | "logout"; className?: string }) {
  const paths = {
    car: "M5 17H3v-6l2-6h14l2 6v6h-2M5 17h14M5 11h14M7 14h.01M17 14h.01M5 17v3h3v-3m8 0v3h3v-3",
    booking: "M9 5H5v16h14V5h-4M9 3h6v4H9zM8 14l3 3 5-6",
    users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m8-7.87a4 4 0 0 1 0 7.75",
    report: "M4 20h16M7 16v-5m5 5V4m5 12V8",
    menu: "M4 6h16M4 12h16M4 18h16",
    logout: "M9 5H4v14h5m6-14 7 7-7 7m-7-7h14",
  };
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>;
}
