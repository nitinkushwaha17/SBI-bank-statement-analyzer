import './Dropdown.css';

function Dropdown({ 
  value, 
  onChange, 
  options = [], 
  placeholder = 'Select...', 
  className = '',
  disabled = false,
  size = 'medium' // 'small', 'medium', 'large'
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`dropdown dropdown-${size} ${className}`}
      disabled={disabled}
    >
      {placeholder && (
        <option value="">{placeholder}</option>
      )}
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export default Dropdown;
