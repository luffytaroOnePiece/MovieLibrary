import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './AppleSelect.css';

const AppleSelect = ({ value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className="apple-custom-select" ref={dropdownRef}>
      <div className={`apple-select-trigger ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        <span className="apple-select-label">{selectedOption.label}</span>
        <ChevronDown size={14} className={`apple-select-icon ${isOpen ? 'open' : ''}`} />
      </div>
      {isOpen && (
        <div className="apple-select-dropdown">
          {options.map((opt) => (
            <div 
              key={opt.value} 
              className={`apple-select-option ${value === opt.value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppleSelect;
