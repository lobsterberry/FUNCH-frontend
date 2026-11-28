const rentalTimes = Array.from({ length: 24 }, (_, hour) =>
  String(hour).padStart(2, "0"),
).flatMap((hour) => [`${hour}:00`, `${hour}:30`]);

export function selectableRentalTime(value: string) {
  return rentalTimes.includes(value) ? value : "";
}

export function RentalTimeSelect({
  label,
  name,
  value,
  onChange,
  className = "form-input",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <select
      aria-label={label}
      name={name}
      required
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={className}
    >
      <option value="" disabled>
        เลือกเวลา
      </option>
      {rentalTimes.map((time) => (
        <option key={time} value={time}>
          {time} น.
        </option>
      ))}
    </select>
  );
}
