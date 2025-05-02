import React, { useMemo } from 'react';
import { ICurrency } from '../domain/currency';
import { cn } from '@/lib/utils';

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
      <label className="currency-selector-label font-medium text-sm" htmlFor={id}>
        {label}:
        <select 
          id={id}
          value={selectedCurrency.code}
          onChange={handleChange}
          className={cn(
            "w-full p-2 mt-1 rounded-md border border-input bg-background text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "hover:border-primary/50",
            "dark:text-foreground dark:bg-background dark:border-input",
            "dark:[&>option]:bg-popover dark:[&>option]:text-popover-foreground"
          )}
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