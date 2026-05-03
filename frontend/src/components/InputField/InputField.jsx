export default function InputField({
  label,
  type = 'text',
  placeholder,
  autoComplete,
  value,
  onChange,
  name,
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
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="
          w-full rounded-xl border-2 border-slate-200 bg-white
          px-4 py-3 text-base text-slate-900
          placeholder:text-slate-400
          transition-all outline-none
          focus:border-blue-400 focus:ring-4 focus:ring-blue-100
          relative z-10
        "
      />
    </label>
  );
}