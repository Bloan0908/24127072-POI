
import React, { useState } from 'react';

interface SearchFormProps {
  onSearch: (location: string) => void;
  isLoading: boolean;
}

export const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isLoading }) => {
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(location);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label htmlFor="location-search" className="block font-semibold text-gray-700">
        Nhập một địa điểm tại Việt Nam
      </label>
      <div className="flex gap-2">
        <input
          id="location-search"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="ví dụ: Vịnh Hạ Long, Thành phố Hồ Chí Minh"
          className="flex-grow px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white font-semibold py-3 px-5 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out shadow disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          disabled={isLoading}
        >
          {isLoading ? 'Đang tìm...' : 'Tìm kiếm'}
        </button>
      </div>
    </form>
  );
};
