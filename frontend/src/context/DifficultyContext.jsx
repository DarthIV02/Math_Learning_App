import { createContext, useContext, useState } from 'react';

const DifficultyContext = createContext();

export function DifficultyProvider({ children }) {
  const [selected, setSelected] = useState('leicht');
  return (
    <DifficultyContext.Provider value={{ selected, setSelected }}>
      {children}
    </DifficultyContext.Provider>
  );
}

export const useDifficulty = () => useContext(DifficultyContext);