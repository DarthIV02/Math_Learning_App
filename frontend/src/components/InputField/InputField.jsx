export default function InputField({
  label,
  type = 'text',
  placeholder,
  autoComplete,
  value,
  onChange,
  name,
  readOnly = false,
  min,
  max,
}) {
  return (
    <label className="block relative z-10">
      <span className="block mb-2 ml-1 text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        autoComplete={autoComplete}
        min={min}
        max={max}
        className={`
          w-full rounded-xl border-2 border-slate-200
          px-4 py-3 text-base
          placeholder:text-slate-400
          transition-all outline-none
          relative z-10
          ${
            readOnly
              ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
              : 'bg-white text-slate-900 focus:border-blue-400 focus:ring-4 focus:ring-blue-100'
          }
        `}
      />
    </label>
  );
}