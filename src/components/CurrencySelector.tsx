import React from 'react';
import { ICurrency } from '../domain/currency';

interface CurrencySelectorProps {
  currencies: ICurrency[];
  selectedCurrency: ICurrency;
  onChange: (currency: ICurrency) => void;
  label?: string;
}

/**
 * Component for selecting a currency from a dropdown
 */
export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  currencies,
  selectedCurrency,
  onChange,
  label = 'Currency'
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const currencyCode = e.target.value;
    const currency = currencies.find(c => c.code === currencyCode);
    if (currency) {
      onChange(currency);
    }
  };

  return (
    <div className="currency-selector">
      <label className="currency-selector-label">
        {label}:
        <select 
          value={selectedCurrency.code}
          onChange={handleChange}
          className="currency-selector-dropdown"
        >
          {currencies.map(currency => (
            <option key={currency.code} value={currency.code}>
              {currency.code} ({currency.symbol}) - {currency.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}; 