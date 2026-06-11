/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  Sparkles, 
  History, 
  HelpCircle, 
  Home, 
  Loader2, 
  SlidersHorizontal,
  TrendingDown,
  Building,
  DollarSign,
  Info,
  Calendar,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PropertyCondition, SearchResult, FloorOption, ExposureOption, AccessoriesInput, PropertyTaglio } from './types';
import { CONDITIONS, PRESETS_ZONES, calculatePricesForZone, FLOORS, EXPOSURES, TAGLI } from './utils/pricingEngine';
import StatsDashboard from './components/StatsDashboard';

interface HistoryItem {
  id: string;
  term: string;
  condition: PropertyCondition;
  size: number;
  taglio?: PropertyTaglio;
  cityName: string;
  zoneName: string;
  floor?: FloorOption;
  exposure?: ExposureOption;
  accessories?: AccessoriesInput;
}

export default function App() {
  const [searchTerm, setSearchTerm] = useState<string>('Milano Brera');
  const [selectedCondition, setSelectedCondition] = useState<PropertyCondition>('buono');
  const [selectedSize, setSelectedSize] = useState<number>(80);
  const [selectedTaglio, setSelectedTaglio] = useState<PropertyTaglio>('3-locali');
  const [selectedFloor, setSelectedFloor] = useState<FloorOption>('intermedio');
  const [selectedExposure, setSelectedExposure] = useState<ExposureOption>('esterna');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchHistory, setSearchHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [accessories, setAccessories] = useState<AccessoriesInput>({
    hasBalcone: false,
    balconeSize: 0,
    hasTerrazzo: false,
    terrazzoSize: 0,
    hasBox: false,
    hasBoxDoppio: false,
    hasPostoCoperto: false,
    hasPostoScoperto: false,
    hasCantina: false,
    cantinaSize: 0,
    hasSoffitta: false,
    soffittaSize: 0,
    hasGiardino: false,
    giardinoSize: 0
  });

  const updateAccessory = <K extends keyof AccessoriesInput>(key: K, value: AccessoriesInput[K]) => {
    setAccessories(prev => {
      const updatedAcc = { ...prev, [key]: value };
      if (searchResult) {
        const updated = calculatePricesForZone(searchTerm, selectedCondition, selectedSize, selectedFloor, selectedExposure, updatedAcc, selectedTaglio);
        setSearchResult(updated);
      }
      return updatedAcc;
    });
  };
  
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load first result on mount so the page has instant, attractive interactive content
  useEffect(() => {
    handleSearch(true);
    // Setup history with some default relevant items
    setSearchHistory([
      { id: '1', term: 'Roma Trastevere', condition: 'ristrutturato', size: 75, taglio: '3-locali', cityName: 'Roma', zoneName: 'Trastevere', floor: 'intermedio', exposure: 'esterna' },
      { id: '2', term: 'Milano Isola', condition: 'nuovo', size: 90, taglio: '3-locali', cityName: 'Milano', zoneName: 'Porta Nuova / Isola', floor: 'ultimo', exposure: 'doppia' },
      { id: '3', term: 'Bologna Centro', condition: 'buono', size: 85, taglio: '3-locali', cityName: 'Bologna', zoneName: 'Centro', floor: 'intermedio', exposure: 'esterna' }
    ]);
  }, []);

  // Filter presets based on user input
  const filteredSuggestions = PRESETS_ZONES.filter(preset => {
    const term = searchTerm.toLowerCase().trim();
    if (term.length < 2) return false;
    return preset.name.toLowerCase().includes(term) || preset.city.toLowerCase().includes(term);
  }).slice(0, 5); // Max 5 suggestions

  // Close suggestions box on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Perform calculations and handle simulation timing
  const handleSearch = (immediate = false) => {
    if (!searchTerm.trim()) return;

    if (immediate) {
      const res = calculatePricesForZone(searchTerm, selectedCondition, selectedSize, selectedFloor, selectedExposure, accessories, selectedTaglio);
      setSearchResult(res);
      addSearchToHistory(res);
    } else {
      setIsLoading(true);
      setShowSuggestions(false);
      
      // Artificial delay (500ms) to make simulation feel realistic
      setTimeout(() => {
        const res = calculatePricesForZone(searchTerm, selectedCondition, selectedSize, selectedFloor, selectedExposure, accessories, selectedTaglio);
        setSearchResult(res);
        addSearchToHistory(res);
        setIsLoading(false);

        // Scroll to results on mobile view
        const targetElement = document.getElementById('pricing-dashboard-results');
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 550);
    }
  };

  // Add the computed search to previous searches history without duplication
  const addSearchToHistory = (res: SearchResult) => {
    const key = `${res.cityName}-${res.zoneName}-${res.selectedCondition}-${res.selectedFloor}-${res.selectedExposure}-${res.selectedTaglio || ''}`;
    
    setSearchHistory(prev => {
      // Check if it already exists
      const exists = prev.some(item => `${item.cityName}-${item.zoneName}-${item.condition}-${item.floor}-${item.exposure}-${item.taglio || ''}` === key);
      if (exists) return prev;

      const newItem: HistoryItem = {
        id: Date.now().toString(),
        term: searchTerm,
        condition: res.selectedCondition,
        size: res.selectedSize,
        taglio: res.selectedTaglio,
        cityName: res.cityName,
        zoneName: res.zoneName,
        floor: res.selectedFloor,
        exposure: res.selectedExposure,
        accessories: res.accessories
      };

      // Limit to 5 elements max
      return [newItem, ...prev].slice(0, 5);
    });
  };

  // Load a historic query directly back into the interface
  const handleLoadHistory = (item: HistoryItem) => {
    setSearchTerm(item.term);
    setSelectedCondition(item.condition);
    setSelectedSize(item.size);
    if (item.taglio) setSelectedTaglio(item.taglio);
    if (item.floor) setSelectedFloor(item.floor);
    if (item.exposure) setSelectedExposure(item.exposure);
    if (item.accessories) setAccessories(item.accessories);
    setIsHistoryOpen(false);
    
    // Trigger calculation
    setIsLoading(true);
    setTimeout(() => {
      const res = calculatePricesForZone(
        item.term, 
        item.condition, 
        item.size, 
        item.floor || 'intermedio', 
        item.exposure || 'esterna',
        item.accessories,
        item.taglio
      );
      setSearchResult(res);
      setIsLoading(false);
    }, 300);
  };

  const handleSuggestionClick = (preset: typeof PRESETS_ZONES[0]) => {
    setSearchTerm(`${preset.city} ${preset.name}`);
    setShowSuggestions(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900" style={{ backgroundColor: '#f8fafc' }} id="realestate-pricefinder-root">
      
      {/* Top Professional Header - Restyled into High Density */}
      <nav id="main-navigation-navbar" className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200 z-30 px-6 py-4 shadow-sm shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-800 font-display">
                RealEstate<span className="text-indigo-600">PriceFinder</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Market Intelligence Tool v1.2
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* History Selector Trigger */}
            <button
              id="history-drawer-toggle"
              type="button"
              onClick={() => setIsHistoryOpen(prev => !prev)}
              className="flex items-center gap-1.5 h-10 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-indigo-600 hover:bg-slate-50 bg-white border border-slate-200 rounded-md transition-colors shadow-sm cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>Cronologia</span>
              {searchHistory.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block animate-pulse"></span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        
        {/* Intro Hero Header */}
        <section className="text-center py-4 max-w-2xl mx-auto space-y-2">
          <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold px-3 py-1 rounded uppercase tracking-wider select-none">
            Stime immobiliari determinate ad alta precisione
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-800 font-display">
            Valutazione ed Analisi dei Prezzi al m²
          </h2>
          <p className="text-xs text-slate-500 max-w-lg mx-auto uppercase tracking-wide font-medium">
            Seleziona la zona d'interesse ed ottieni subito i parametri previsionali completi.
          </p>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Search Controls Panel */}
          <div className="lg:col-span-4 bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-5 lg:sticky lg:top-24">
            <h3 className="font-bold text-slate-700 uppercase text-xs tracking-widest border-b border-slate-100 pb-2 select-none">
              Configuratore Ricerca
            </h3>

            {/* Parameter Input: Area / Zone */}
            <div className="space-y-1 relative" ref={suggestionsRef}>
              <label htmlFor="price-finder-zone-input" className="text-[10px] uppercase font-bold text-slate-500 ml-1 flex items-center justify-between">
                <span>Zona / Quartiere / Città</span>
                <HelpCircle className="w-3 h-3 text-slate-400" title="Milano Centrale, Roma Trastevere, Bologna San Donato" />
              </label>
              
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="price-finder-zone-input"
                  type="text"
                  placeholder="Es: Bologna San Donato"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full h-10 pl-9 pr-3 bg-white border border-slate-200 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-800 transition-all placeholder:text-slate-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                />
              </div>

              {/* Interactive Autocomplete Suggestions Drawer */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white mt-1.5 border border-slate-200 rounded-md shadow-lg z-40 overflow-hidden divide-y divide-slate-100">
                  <div className="text-[9px] font-black tracking-wider text-slate-400 bg-slate-50 px-3 py-1.5 uppercase select-none">
                    Località Corrispondenti:
                  </div>
                  {filteredSuggestions.map((preset) => (
                    <button
                      key={`${preset.city}-${preset.name}`}
                      type="button"
                      onClick={() => handleSuggestionClick(preset)}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-between"
                    >
                      <span className="font-semibold">{preset.city} • <strong className="text-indigo-600 font-medium">{preset.name}</strong></span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter bg-slate-100 px-1 py-0.5 rounded">Preset</span>
                    </button>
                  ))}
                </div>
              )}
            </div>



            {/* Parameter Selector: Property Condition (Stato di conservazione) */}
            <div className="space-y-1">
              <label htmlFor="price-finder-condition-select" className="text-[10px] uppercase font-bold text-slate-500 ml-1">Stato Conservazione</label>
              
              <div className="relative">
                <select
                  id="price-finder-condition-select"
                  value={selectedCondition}
                  onChange={(e) => {
                    const cond = e.target.value as PropertyCondition;
                    setSelectedCondition(cond);
                    if (searchResult) {
                      const updated = calculatePricesForZone(searchTerm, cond, selectedSize, selectedFloor, selectedExposure, accessories, selectedTaglio);
                      setSearchResult(updated);
                    }
                  }}
                  className="w-full h-10 pl-3 pr-8 bg-white border border-slate-200 rounded-md shadow-sm text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none animate-fadeIn"
                >
                  {Object.values(CONDITIONS).map((cond) => (
                    <option key={cond.id} value={cond.id}>
                      {cond.label}
                    </option>
                  ))}
                </select>
                {/* Arrow visual picker */}
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-505" />
                </div>
              </div>
            </div>

            {/* Parameter Selector: Coefficiente Piano */}
            <div className="space-y-1">
              <label htmlFor="price-finder-floor-select" className="text-[10px] uppercase font-bold text-slate-500 ml-1">Coefficiente Piano</label>
              
              <div className="relative">
                <select
                  id="price-finder-floor-select"
                  value={selectedFloor}
                  onChange={(e) => {
                    const floor = e.target.value as FloorOption;
                    setSelectedFloor(floor);
                    if (searchResult) {
                      const updated = calculatePricesForZone(searchTerm, selectedCondition, selectedSize, floor, selectedExposure, accessories, selectedTaglio);
                      setSearchResult(updated);
                    }
                  }}
                  className="w-full h-10 pl-3 pr-8 bg-white border border-slate-200 rounded-md shadow-sm text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none animate-fadeIn"
                >
                  {Object.values(FLOORS).map((floor) => (
                    <option key={floor.id} value={floor.id}>
                      {floor.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                </div>
              </div>
            </div>

            {/* Parameter Selector: Esposizione */}
            <div className="space-y-1">
              <label htmlFor="price-finder-exposure-select" className="text-[10px] uppercase font-bold text-slate-500 ml-1">Esposizione</label>
              
              <div className="relative">
                <select
                  id="price-finder-exposure-select"
                  value={selectedExposure}
                  onChange={(e) => {
                    const exposure = e.target.value as ExposureOption;
                    setSelectedExposure(exposure);
                    if (searchResult) {
                      const updated = calculatePricesForZone(searchTerm, selectedCondition, selectedSize, selectedFloor, exposure, accessories, selectedTaglio);
                      setSearchResult(updated);
                    }
                  }}
                  className="w-full h-10 pl-3 pr-8 bg-white border border-slate-200 rounded-md shadow-sm text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none animate-fadeIn"
                >
                  {Object.values(EXPOSURES).map((exp) => (
                    <option key={exp.id} value={exp.id}>
                      {exp.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" />
                </div>
              </div>
            </div>

            {/* Parameter Selector: Taglio dell'Immobile */}
            <div className="space-y-1">
              <label htmlFor="price-finder-taglio-select" className="text-[10px] uppercase font-bold text-slate-500 ml-1">Taglio dell'Immobile</label>
              
              <div className="relative">
                <select
                  id="price-finder-taglio-select"
                  value={selectedTaglio}
                  onChange={(e) => {
                    const tagline = e.target.value as PropertyTaglio;
                    setSelectedTaglio(tagline);
                    if (searchResult) {
                      const updated = calculatePricesForZone(searchTerm, selectedCondition, selectedSize, selectedFloor, selectedExposure, accessories, tagline);
                      setSearchResult(updated);
                    }
                  }}
                  className="w-full h-10 pl-3 pr-8 bg-white border border-slate-200 rounded-md shadow-sm text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none animate-fadeIn"
                >
                  {Object.entries(TAGLI).map(([key, item]) => (
                    <option key={key} value={key as PropertyTaglio}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Home className="w-3.5 h-3.5 text-indigo-505 text-indigo-500" />
                </div>
              </div>
            </div>

            {/* Superficie Manuale (con Presets rapidi) */}
            <div className="space-y-1.5">
              <label htmlFor="price-finder-size-manual-input" className="text-[10px] uppercase font-bold text-slate-500 ml-1 flex items-center justify-between">
                <span>Superficie Immobile</span>
                <span className="text-[10px] font-mono font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{selectedSize} m²</span>
              </label>
              
              <div className="relative">
                <input
                  id="price-finder-size-manual-input"
                  type="number"
                  min="10"
                  max="1000"
                  placeholder="Inserisci mq, es: 85"
                  value={selectedSize || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    const newSize = isNaN(val) ? 0 : val;
                    setSelectedSize(newSize);
                    if (searchResult) {
                      const updated = calculatePricesForZone(searchTerm, selectedCondition, newSize, selectedFloor, selectedExposure, accessories, selectedTaglio);
                      setSearchResult(updated);
                    }
                  }}
                  className="w-full h-10 pl-3 pr-12 bg-white border border-slate-200 rounded-md shadow-sm text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[11px] font-extrabold text-slate-400 uppercase tracking-wider font-mono select-none">
                  MQ
                </div>
              </div>

              {/* Scelte rapide mq */}
              <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                {[50, 80, 110, 150].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setSelectedSize(size);
                      if (searchResult) {
                        const updated = calculatePricesForZone(searchTerm, selectedCondition, size, selectedFloor, selectedExposure, accessories, selectedTaglio);
                        setSearchResult(updated);
                      }
                    }}
                    className={`h-7 text-[10.5px] font-bold rounded-md text-center border transition select-none cursor-pointer ${
                      selectedSize === size
                        ? 'border-indigo-600 text-indigo-700 bg-indigo-50 font-mono font-extrabold shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-500 bg-white'
                    }`}
                  >
                    {size} m²
                  </button>
                ))}
              </div>
            </div>

            {/* Campi di Valutazione Accessori */}
            <div className="space-y-3 border-t border-slate-100 pt-3">
              <span className="text-[10px] uppercase font-bold text-slate-500 ml-1 block select-none">Accessori e Pertinenze</span>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {[
                  { key: 'hasBalcone', sizeKey: 'balconeSize', label: 'Balcone' },
                  { key: 'hasTerrazzo', sizeKey: 'terrazzoSize', label: 'Terrazzo' },
                  { key: 'hasCantina', sizeKey: 'cantinaSize', label: 'Cantina' },
                  { key: 'hasSoffitta', sizeKey: 'soffittaSize', label: 'Soffitta' },
                  { key: 'hasGiardino', sizeKey: 'giardinoSize', label: 'Giardino' }
                ].map((item) => {
                  const isChecked = (accessories as any)[item.key];
                  const sizeVal = (accessories as any)[item.sizeKey] || '';
                  return (
                    <div key={item.key} className="flex items-center justify-between gap-2 p-1.5 rounded-md border border-slate-150 bg-slate-50/50 hover:bg-slate-50/80 transition-all">
                      <div className="flex items-center gap-2">
                        <input
                          id={`accessory-checkbox-${item.key}`}
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => updateAccessory(item.key as any, e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                        />
                        <label htmlFor={`accessory-checkbox-${item.key}`} className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                          {item.label}
                        </label>
                      </div>
                      
                      {/* Metratura Input adjacent to selection checkbox */}
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-bold uppercase transition-all ${isChecked ? 'text-indigo-600' : 'text-slate-400'}`}>Superficie:</span>
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            min="0"
                            max="500"
                            placeholder="mq"
                            disabled={!isChecked}
                            value={sizeVal || ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              updateAccessory(item.sizeKey as any, isNaN(val) ? 0 : val);
                            }}
                            className={`w-14 h-7 text-center rounded text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all border ${
                              isChecked 
                                ? 'bg-white border-indigo-400 text-slate-800 shadow-xs' 
                                : 'bg-slate-100 border-slate-250 text-slate-400 cursor-not-allowed'
                            }`}
                          />
                          <span className="text-[10px] text-slate-400 font-bold ml-1 font-mono uppercase">mq</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Plain checkboxes for boxes and parkings */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {[
                    { key: 'hasBox', label: 'Box' },
                    { key: 'hasBoxDoppio', label: 'Box Doppio' },
                    { key: 'hasPostoCoperto', label: 'Posto Auto Cop.' },
                    { key: 'hasPostoScoperto', label: 'Posto Auto Scop.' }
                  ].map((item) => {
                    const isChecked = (accessories as any)[item.key];
                    return (
                      <div key={item.key} className="flex items-center gap-2 p-1.5 rounded-md border border-slate-150 bg-slate-50/50 hover:bg-slate-50 transition-all">
                        <input
                          id={`accessory-checkbox-${item.key}`}
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => updateAccessory(item.key as any, e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                        />
                        <label htmlFor={`accessory-checkbox-${item.key}`} className="text-[10px] font-bold text-slate-700 cursor-pointer select-none truncate">
                          {item.label}
                        </label>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>

            {/* Action Search CTA Trigger Button - Styled with slate-900 like in High Density mockup */}
            <button
              id="price-finder-submit-button"
              type="button"
              onClick={() => handleSearch()}
              disabled={isLoading || !searchTerm.trim()}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-sm tracking-wide uppercase rounded-md flex items-center justify-center gap-2 cursor-pointer shadow-md transitionactive:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Elaborazione...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Calcola Prezzi</span>
                </>
              )}
            </button>

          </div>

          {/* RIGHT: Results & Info Display Dashboard */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Slide-out/Toggle History Drawer Inline */}
            <AnimatePresence>
              {isHistoryOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-slate-100 border border-slate-250 rounded-xl p-4 overflow-hidden"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-650 flex items-center gap-1.5 select-none">
                      <History className="w-3.5 h-3.5 text-indigo-600" />
                      Cronologia Ricerche Recenti
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setIsHistoryOpen(false)}
                      className="text-slate-400 hover:text-slate-600 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {searchHistory.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">Nessuna ricerca recente effettuata in questa sessione.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {searchHistory.map((item) => {
                        const iconColor = CONDITIONS[item.condition]?.badgeClass;
                        return (
                          <div 
                            key={item.id}
                            onClick={() => handleLoadHistory(item)}
                            className="bg-white border border-slate-200 hover:border-indigo-400 p-3 rounded-lg cursor-pointer transition flex items-center justify-between gap-2"
                          >
                            <div className="overflow-hidden">
                              <span className="text-xs font-bold text-slate-800 block truncate">{item.term}</span>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {item.size} mq • {CONDITIONS[item.condition].label.split(' (')[0]}
                              </span>
                            </div>
                            <span className={`w-2 h-2 rounded-full shrink-0 ${iconColor}`}></span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loader-skeleton"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[400px]"
                >
                  <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                  <h4 className="text-lg font-bold text-slate-700">Ricerca e simulazione del mercato locale in corso</h4>
                  <p className="text-sm text-slate-400 max-w-sm mt-1">
                    Analisi dei parametri territoriali e comparazione dello stato manutentivo per l'immobile richiesto...
                  </p>
                </motion.div>
              ) : searchResult ? (
                <StatsDashboard
                  result={searchResult}
                  selectedSize={selectedSize}
                  onSizeChange={(newSize) => {
                    setSelectedSize(newSize);
                    // Dynamically recalculate immediately as the slider is dragged
                    const updated = calculatePricesForZone(searchTerm, selectedCondition, newSize, selectedFloor, selectedExposure, accessories, selectedTaglio);
                    setSearchResult(updated);
                  }}
                  onConditionChange={(newCondition) => {
                    setSelectedCondition(newCondition);
                    const updated = calculatePricesForZone(searchTerm, newCondition, selectedSize, selectedFloor, selectedExposure, accessories, selectedTaglio);
                    setSearchResult(updated);
                  }}
                />
              ) : (
                <motion.div
                  key="empty-state-welcome-message"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm min-h-[350px] flex flex-col items-center justify-center space-y-4"
                >
                  <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-full text-indigo-600">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-800">Cerca una zona o città italiana</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
                      Immetti il nome di un quartiere o capoluogo per visualizzare i grafici e la tabella comparativa dei costi di acquisto immobiliari.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
          </div>
        </section>

        {/* Informative Grid Row detailing Methodology and Conditions */}
        <section className="bg-slate-100 rounded-xl p-5 md:p-6 border border-slate-200" id="comparative-methodology-guide">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700 flex items-center gap-2 select-none mb-3">
            <Info className="w-4 h-4 text-indigo-600" />
            Metodologia di Stima RealEstatePriceFinder (Benchmark Media)
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            I prezzi immobiliari medi visualizzati sul nostro portale fanno riferimento alle quotazioni dei siti immobiliari leader <strong className="text-slate-700">Tecnocasa.it</strong>, <strong className="text-slate-700">Frimm.it</strong> e <strong className="text-slate-700">Immobiliare.it</strong>, calcolandone ed elaborandone la media aritmetica dinamica per compensare e mappare fedelmente le oscillazioni territoriali sul territorio nazionale.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 block mb-1">Differenze Territoriali</span>
              <p className="text-[11px] text-slate-400">
                Le grandi piazze storiche come Milano e Roma registrano i massimi (€8.000+). Torino e Bologna presentano quotazioni ribassate del 40-50%, mentre i capoluoghi di provincia variano tra il -60% e il -70%.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 block mb-1">L'Effetto Ristrutturazione</span>
              <p className="text-[11px] text-slate-400">
                Comprare un immobile "Da ristrutturare" richiede mediamente il 55% in meno al metro quadro rispetto a un "Nuovo" d'impresa, compensando la spesa dei successivi lavori strutturali.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 block mb-1">Efficienza Energetica</span>
              <p className="text-[11px] text-slate-400">
                I valori degli immobili "Nuovo" e "Recente" incorporano la plusvalenza di classi energetiche superiori (A+, A, B) riducendo le future spese energetiche e adeguandosi alle normative europee.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* footer detailing data simulation warning and official links */}
      <footer id="price-finder-applet-footer" className="bg-slate-900 text-slate-400 text-center py-8 px-6 mt-auto border-t border-slate-800">
        <div className="max-w-4xl mx-auto space-y-4">
          <p className="text-[10px] tracking-wider uppercase font-semibold text-slate-500">
            © 2026 RealEstatePriceFinder. Tutti i diritti riservati.
          </p>
          <p className="text-xs leading-relaxed max-w-2xl mx-auto text-slate-400">
            Note di Simulazione: I prezzi delle unità immobiliari e i range di stima sono generati tramite algoritmo predittivo fittizio integrato. Non sostituiscono quotazioni certificate, perizie asseverate o indici bancari reali.
          </p>
          <p className="text-[11px] text-slate-500">
            Per dati legali o compravendite reali consultare l'Osservatorio OMI gestito dall'Agenzia delle Entrate italiana, o i principali portali professionali quali Immobiliare.it o Idealista.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-1 text-[11px] font-semibold">
            <a 
              href="https://www.agenziaentrate.gov.it/portale/schede/provvedimenti/omi" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-indigo-400 hover:text-indigo-300 hover:underline transition"
            >
              OMI Agenzia delle Entrate
            </a>
            <span className="text-slate-700">|</span>
            <a 
              href="https://www.tecnocasa.it/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-indigo-400 hover:text-indigo-300 hover:underline transition"
            >
              Tecnocasa.it
            </a>
            <span className="text-slate-700">|</span>
            <a 
              href="https://www.frimm.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-indigo-400 hover:text-indigo-300 hover:underline transition"
            >
              Frimm.it
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
