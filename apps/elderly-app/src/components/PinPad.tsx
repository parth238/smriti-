type PinPadProps = {
  value: string;
  onChange: (next: string) => void;
  label: string;
  clearLabel: string;
  backLabel: string;
};

export function PinPad({
  value,
  onChange,
  label,
  clearLabel,
  backLabel,
}: PinPadProps) {
  const digits = value.padEnd(4, " ").slice(0, 4).split("");

  function press(digit: string) {
    if (value.length >= 4) {
      return;
    }
    onChange(`${value}${digit}`);
  }

  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-3 text-body">{label}</legend>
      <div className="mb-5 grid grid-cols-4 gap-3" aria-hidden="true">
        {digits.map((digit, index) => (
          <div
            key={`${index}-${digit}`}
            className="flex min-h-[76px] items-center justify-center rounded-2xl border-[3px] border-mist-blue bg-white font-display text-h1"
          >
            {digit.trim() ? "•" : ""}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"].map(
          (key) => (
            <button
              key={key}
              type="button"
              className="pressable surface min-h-tap text-button-label text-deep-hill"
              onClick={() => {
                if (key === "clear") {
                  onChange("");
                  return;
                }
                if (key === "back") {
                  onChange(value.slice(0, -1));
                  return;
                }
                press(key);
              }}
            >
              {key === "clear" ? clearLabel : key === "back" ? backLabel : key}
            </button>
          ),
        )}
      </div>
    </fieldset>
  );
}
