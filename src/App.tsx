import React, { useState, useCallback } from 'react';
import { MapComponent } from './components/MapComponent';
import { SearchForm } from './components/SearchForm';
import { Spinner } from './components/Spinner';
import { getCoordinatesForLocation, getPointsOfInterest } from './services/geminiService';
import type { Coordinates, PointOfInterest } from './types';

const INITIAL_CENTER: Coordinates = { lat: 16.047079, lng: 108.206230 }; // Da Nang, Vietnam

export default function App() {
  const [mapCenter, setMapCenter] = useState<Coordinates>(INITIAL_CENTER);
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchedLocation, setSearchedLocation] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleSearch = useCallback(async (locationName: string) => {
    if (!locationName.trim()) {
      setError("Vui lòng nhập tên địa điểm.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setPois([]);
    setSearchedLocation(locationName);

    try {
      const coords = await getCoordinatesForLocation(locationName);
      if (!coords) {
        throw new Error("Không thể tìm thấy tọa độ cho địa điểm đã chỉ định.");
      }
      setMapCenter(coords);

      const fetchedPois = await getPointsOfInterest(coords);
      setPois(fetchedPois);
      // FIX: Added opening brace for the catch block and moved the block's content inside.
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định. Vui lòng thử lại.");
      setMapCenter(INITIAL_CENTER); // Reset to default on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans overflow-hidden">
      <aside
        className={`
          bg-white shadow-lg flex flex-col z-20 transition-all duration-300 ease-in-out
          w-full
          ${isSidebarOpen ? 'md:w-96' : 'md:w-0'}
        `}
      >
        <div 
          className={`
            h-full overflow-y-auto overflow-x-hidden
            transition-opacity duration-300
            ${isSidebarOpen ? 'opacity-100 p-6' : 'opacity-0 p-0'}
          `}
        >
          <div className="space-y-6 min-w-[20rem]">
            <header>
              <h1 className="text-3xl font-bold text-gray-800">Khám Phá Địa Điểm Việt Nam</h1>
              <p className="text-gray-500 mt-1">Khám phá các địa điểm thú vị trên khắp Việt Nam.</p>
            </header>
            
            <SearchForm onSearch={handleSearch} isLoading={isLoading} />

            {isLoading && (
              <div className="flex flex-col items-center justify-center text-center p-4 bg-blue-50 rounded-lg">
                <Spinner />
                <p className="text-blue-600 mt-2 font-semibold">Đang tìm kiếm "{searchedLocation}"...</p>
                <p className="text-blue-500 text-sm">Gemini đang tìm tọa độ và các địa điểm thú vị.</p>
              </div>
            )}

            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                <p className="font-bold">Lỗi</p>
                <p>{error}</p>
              </div>
            )}

            {!isLoading && pois.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-3">
                  5 địa điểm hàng đầu cho <span className="text-blue-600">{searchedLocation}</span>
                </h2>
                <ul className="space-y-3">
                  {pois.map((poi, index) => (
                    <li key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="font-semibold text-gray-800">{index + 1}. {poi.name}</p>
                      <p className="text-sm text-gray-600">{poi.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 relative">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden md:flex items-center justify-center w-6 h-16 rounded-r-lg bg-white shadow-lg absolute top-1/2 -translate-y-1/2 left-0 z-20 border-y-2 border-r-2 border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          aria-label={isSidebarOpen ? 'Thu gọn thanh bên' : 'Mở rộng thanh bên'}
        >
          <svg
            className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${!isSidebarOpen && 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <MapComponent center={mapCenter} pois={pois} isSidebarOpen={isSidebarOpen} />
      </main>
    </div>
  );
}