import React, { useMemo } from 'react';
import { ICurrency } from '../domain/currency';

interface CurrencySelectorProps {
  currencies: ICurrency[];
  selectedCurrency: ICurrency;
  onChange: (currency: ICurrency) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * Component for selecting a currency from a dropdown
 * Memoized to prevent unnecessary re-renders
 */
const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  currencies,
  selectedCurrency,
  onChange,
  label = 'Currency',
  disabled = false,
  id
}) => {
  // Memoize the sorted currencies list
  const sortedCurrencies = useMemo(() => {
    return [...currencies].sort((a, b) => a.code.localeCompare(b.code));
  }, [currencies]);

  // Memoize the change handler to prevent recreation on every render
  const handleChange = useMemo(() => {
    return (e: React.ChangeEvent<HTMLSelectElement>) => {
      const currencyCode = e.target.value;
      const currency = sortedCurrencies.find(c => c.code === currencyCode);
      if (currency) {
        onChange(currency);
      }
    };
  }, [sortedCurrencies, onChange]);

  // Generate an accessible label for screen readers
  const getAccessibleCurrencyLabel = (currency: ICurrency): string => {
    return `${currency.name} (${currency.code})`;
  };

  return (
    <div className="currency-selector">
      <label className="currency-selector-label" htmlFor={id}>
        {label}:
        <select 
          id={id}
          value={selectedCurrency.code}
          onChange={handleChange}
          className="currency-selector-dropdown"
          disabled={disabled}
          aria-label={`Select ${label.toLowerCase()}`}
        >
          {sortedCurrencies.map(currency => (
            <option 
              key={currency.code} 
              value={currency.code}
              aria-label={getAccessibleCurrencyLabel(currency)}
            >
              {currency.code} ({currency.symbol}) - {currency.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

// Export a memoized version of the component to prevent unnecessary re-renders
export default React.memo(CurrencySelector);

// Also export the non-memoized version for cases where memoization is not needed
export { CurrencySelector }; 