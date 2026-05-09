// the overflow dropdown
import { useState } from 'react';
import { SwitchButtonBasic } from './SwitchButtonBasic';

export function SwitchButtonMenu({ options, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="difficulty-more">
      <button
        type="button"
        className="difficulty-button difficulty-button--blue"
        onClick={() => setOpen(v => !v)}
      >
        <span className="difficulty-button__label">More</span>
      </button>
      {open && (
        <div className="difficulty-more__menu">
          {options.map(option => (
            <SwitchButtonBasic
              key={option.key}
              option={option}
              selected={selected}
              onSelect={(key) => { onSelect(key); setOpen(false); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}