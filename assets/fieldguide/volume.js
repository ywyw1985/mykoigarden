(() => {
  const calculator = document.querySelector("[data-volume]");
  if (!calculator) return;

  const form = calculator.querySelector("form");
  const fields = ["length", "width", "depth"].map(name => form.elements.namedItem(name));
  const unit = form.elements.namedItem("unit");
  const shape = form.elements.namedItem("shape");
  const percent = form.elements.namedItem("percent");
  const display = calculator.querySelector("[data-results]");
  const status = calculator.querySelector('[role="status"]');
  const metres = new Map();
  const litrePerGallon = 3.785411784;
  const metrePerFoot = 0.3048;
  const locale = document.documentElement.lang;
  const format = new Intl.NumberFormat(locale, { maximumSignificantDigits: 4 });
  const scientific = new Intl.NumberFormat(locale, { notation: "scientific", maximumSignificantDigits: 4 });

  function printNumber(value) {
    if (value !== 0 && (Math.abs(value) < 0.0001 || Math.abs(value) >= 1e12)) {
      return scientific.format(value);
    }
    return format.format(value);
  }

  function storeDimension(field) {
    const value = field.valueAsNumber;
    metres.set(field.name, unit.value === "ft" ? value * metrePerFoot : value);
    field.setCustomValidity(Number.isFinite(value) && value <= 0 ? calculator.dataset.positive : "");
  }

  function resetResults() {
    display.hidden = true;
    status.textContent = "";
  }

  function render() {
    const valid = fields.every(field => field.validity.valid) && percent.validity.valid;
    if (!valid) {
      resetResults();
      return;
    }
    const [length, width, depth] = fields.map(field => metres.get(field.name));
    const shapeFactor = shape.value === "oval" ? Math.PI / 4 : 1;
    const litres = length * width * depth * shapeFactor * 1000;
    const changed = litres * (percent.valueAsNumber / 100);
    if (!(litres > 0 && Number.isFinite(litres))) {
      resetResults();
      status.textContent = calculator.dataset.range;
      return;
    }
    display.querySelector("[data-total-l]").textContent = printNumber(litres);
    display.querySelector("[data-total-gal]").textContent = printNumber(litres / litrePerGallon);
    display.querySelector("[data-change-l]").textContent = printNumber(changed);
    display.querySelector("[data-change-gal]").textContent = printNumber(changed / litrePerGallon);
    display.querySelector("[data-change-pct]").textContent = printNumber(percent.valueAsNumber);
    display.hidden = false;
    status.textContent = "";
  }

  unit.addEventListener("change", () => {
    calculator.dataset.unit = unit.value;
    for (const field of fields) {
      const value = metres.get(field.name);
      // Retain full precision across toggles, round only the editable representation.
      if (Number.isFinite(value)) {
        const converted = unit.value === "ft" ? value / metrePerFoot : value;
        field.value = String(Number(converted.toPrecision(12)));
      }
    }
    calculator.querySelectorAll("[data-dim-unit]").forEach(label => { label.textContent = unit.value; });
    render();
  });

  fields.forEach(field => {
    storeDimension(field);
    field.addEventListener("input", () => { storeDimension(field); render(); });
  });
  shape.addEventListener("change", render);
  percent.addEventListener("input", render);
  form.addEventListener("submit", event => {
    event.preventDefault();
    render();
    if (!display.hidden) display.focus();
  });
  form.hidden = false;
  render();
})();
