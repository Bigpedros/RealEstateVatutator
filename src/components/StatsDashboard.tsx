/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  Ruler, 
  TrendingUp, 
  Info, 
  Layers, 
  AlertTriangle,
  Euro,
  ArrowRightLeft,
  ChevronRight,
  Sparkles,
  Percent
} from 'lucide-react';
import { SearchResult, PropertyCondition, PropertyTaglio } from '../types';
import { CONDITIONS, TAGLI } from '../utils/pricingEngine';

interface StatsDashboardProps {
  result: SearchResult;
  selectedSize: number;
  onSizeChange: (size: number) => void;
  onConditionChange: (condition: PropertyCondition) => void;
}

export default function StatsDashboard({
  result,
  selectedSize,
  onSizeChange,
  onConditionChange
}: StatsDashboardProps) {
  const { zoneName, cityName, tierLabel, selectedCondition, estimates } = result;

  const [pricingMode, setPricingMode] = useState<'mix' | 'omi'>('mix');

  // Find currently selected estimate
  const currentEstimate = estimates.find(est => est.condition === selectedCondition) || estimates[0];
  const condDetails = CONDITIONS[selectedCondition];

  const getDisplayAvgPrice = (est: typeof estimates[0]) => {
    return pricingMode === 'omi' ? (est.omiPrice ?? est.avgPricePerSqM) : est.avgPricePerSqM;
  };
  
  const getDisplayMinPrice = (est: typeof estimates[0]) => {
    return pricingMode === 'omi' ? (est.omiMinPrice ?? est.minPricePerSqM) : est.minPricePerSqM;
  };

  const getDisplayMaxPrice = (est: typeof estimates[0]) => {
    return pricingMode === 'omi' ? (est.omiMaxPrice ?? est.maxPricePerSqM) : est.maxPricePerSqM;
  };

  const displayAvgPricePerSqM = getDisplayAvgPrice(currentEstimate);
  const displayMinPricePerSqM = getDisplayMinPrice(currentEstimate);
  const displayMaxPricePerSqM = getDisplayMaxPrice(currentEstimate);

  const displayEstimatedTotal = pricingMode === 'omi'
    ? displayAvgPricePerSqM * (result.commercialSize || selectedSize)
    : currentEstimate.estimatedTotal;

  // Maximum price among all conditions for building visual comparison percentages
  const maxPriceInZone = Math.max(...estimates.map(e => getDisplayAvgPrice(e)));

  // Accessori e pertinenze attivi
  const activeAccs = [];
  if (result.accessories) {
    const acc = result.accessories;
    if (acc.hasBalcone) {
      activeAccs.push({
        name: 'Balcone',
        details: `${acc.balconeSize} mq`,
        impact: `+${(acc.balconeSize * 0.3).toFixed(1)} m²`,
        desc: 'Coeff. 30%'
      });
    }
    if (acc.hasTerrazzo) {
      activeAccs.push({
        name: 'Terrazzo',
        details: `${acc.terrazzoSize} mq`,
        impact: `+${(acc.terrazzoSize * 0.35).toFixed(1)} m²`,
        desc: 'Coeff. 35%'
      });
    }
    if (acc.hasCantina) {
      activeAccs.push({
        name: 'Cantina',
        details: `${acc.cantinaSize} mq`,
        impact: `+${(acc.cantinaSize * 0.40).toFixed(1)} m²`,
        desc: 'Coeff. 40%'
      });
    }
    if (acc.hasSoffitta) {
      activeAccs.push({
        name: 'Soffitta',
        details: `${acc.soffittaSize} mq`,
        impact: `+${(acc.soffittaSize * 0.40).toFixed(1)} m²`,
        desc: 'Coeff. 40%'
      });
    }
    if (acc.hasGiardino) {
      const gSize = Number(acc.giardinoSize);
      let giardinoImpactVal = 0;
      let descTxt = '';
      if (gSize <= 100) {
        giardinoImpactVal = gSize * 0.10;
        descTxt = 'Coeff. 10% (Fino a 100 mq)';
      } else {
        giardinoImpactVal = (100 * 0.10) + ((gSize - 100) * 0.025);
        descTxt = 'Progressivo (10% fino 100mq, 2.5% oltre)';
      }
      activeAccs.push({
        name: 'Giardino',
        details: `${acc.giardinoSize} mq`,
        impact: `+${giardinoImpactVal.toFixed(1)} m²`,
        desc: descTxt
      });
    }
    if (acc.hasBox) {
      activeAccs.push({
        name: 'Box Singolo',
        details: 'Std 15 mq',
        impact: '+6.0 m²',
        desc: 'Coeff. 40%'
      });
    }
    if (acc.hasBoxDoppio) {
      activeAccs.push({
        name: 'Box Doppio',
        details: 'Std 30 mq',
        impact: '+12.0 m²',
        desc: 'Coeff. 40%'
      });
    }
    if (acc.hasPostoCoperto) {
      activeAccs.push({
        name: 'Posto Coperto',
        details: 'Forfettario',
        impact: '+6.0 m²',
        desc: 'Fattore fisso'
      });
    }
    if (acc.hasPostoScoperto) {
      activeAccs.push({
        name: 'Posto Scoperto',
        details: 'Forfettario',
        impact: '+4.0 m²',
        desc: 'Fattore fisso'
      });
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  // Pre-calculate mock liquidities for high-density dashboard
  const demandPct = zoneName.includes('Duomo') || zoneName.includes('Brera') || tierLabel.includes('Milano') ? 85 : 60;
  const supplyPct = zoneName.includes('Duomo') || zoneName.includes('Brera') ? 35 : 55;
  const liquidityLabel = demandPct - supplyPct > 25 ? 'ALTO (Molto Liquido)' : 'MEDIO-ALTO';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
      id="pricing-dashboard-results"
    >
      {/* Header Info Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">{tierLabel}</span>
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight font-display">
            {cityName}
            {zoneName && <span className="text-indigo-600 font-extrabold"> • {zoneName}</span>}
          </h2>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">
            Quotazione media e comparatore di mercato • Simulazione Dati
          </p>
        </div>
        
        {/* Rapid State Badge */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider select-none">Stato Selezionato:</span>
          <span className={`px-3 py-1.5 rounded-md text-xs font-bold border ${condDetails.colorClass}`}>
            {condDetails.label.split(' (')[0]}
          </span>
        </div>
      </div>

      {/* Main Stats Grid - 12 columns layout from High Density Design theme */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Stats (Min, Max, Avg, Estimations) - col-span-5 in mockup */}
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between gap-6"
        >
          {/* Header section with Status Info */}
          <div className="flex justify-between items-start">
            <div className={`p-3 rounded-lg border ${condDetails.colorClass} flex-1 mr-3`}>
              <p className="text-[10px] font-bold uppercase mb-1 tracking-wide opacity-80">Stato Selezionato</p>
              <p className="text-base font-bold flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${condDetails.badgeClass.split(' ')[0]}`}></span>
                {condDetails.label.split(' (')[0]}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] text-slate-400 italic font-medium mb-1">
                Stima basata su {selectedSize}m²
                {result.selectedTaglio && ` • ${TAGLI[result.selectedTaglio]?.label || result.selectedTaglio}`}
              </p>
              <div className="px-2.5 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600 border border-slate-200">
                ZONA {cityName.toUpperCase().slice(0, 3)} 01
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Floor & Exposure Factors info badge */}
            {(result.selectedFloor || result.selectedExposure) && (
              <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                <div className="flex flex-col text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[8.5px] uppercase font-bold text-slate-400 tracking-wider">Fattore Piano</span>
                  <span className="font-extrabold text-slate-705 truncate capitalize text-[11px] mt-0.5">
                    {result.selectedFloor === 'terra' && 'Piano Terra (-15%)'}
                    {result.selectedFloor === 'rialzato' && 'Piano Rialzato (-10%)'}
                    {result.selectedFloor === 'intermedio' && 'Piano Intermedio (+5%)'}
                    {result.selectedFloor === 'primo-senza' && 'Primo Piano s/asc (-5%)'}
                    {result.selectedFloor === 'secondo-senza' && 'Secondo Piano s/asc (-15%)'}
                    {result.selectedFloor === 'terzo-senza' && 'Terzo Piano s/asc (-25%)'}
                    {result.selectedFloor === 'alto-senza' && 'Alto s/asc (-10%)'}
                    {result.selectedFloor === 'ultimo' && 'Ultimo Piano (+10%)'}
                    {result.selectedFloor === 'attico' && 'Attico (+20%)'}
                  </span>
                </div>
                <div className="flex flex-col text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[8.5px] uppercase font-bold text-slate-400 tracking-wider">Fattore Esposizione</span>
                  <span className="font-extrabold text-slate-705 truncate capitalize text-[11px] mt-0.5">
                    {result.selectedExposure === 'interna' && 'Interna/Assiale (-5%)'}
                    {result.selectedExposure === 'esterna' && 'Esterna (Neutro)'}
                    {result.selectedExposure === 'doppia' && 'Doppia Esp. (+10%)'}
                    {result.selectedExposure === 'panoramica' && 'Panoramica (+15%)'}
                  </span>
                </div>
              </div>
            )}

            {/* Accessori e Pertinenze Selezionati left panel Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 select-none">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Accessori e Pertinenze
                </span>
                <span className="text-[9.5px] bg-indigo-50 border border-indigo-150 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded font-mono uppercase">
                  {activeAccs.length} {activeAccs.length === 1 ? 'Attivo' : 'Attivi'}
                </span>
              </div>
              
              {activeAccs.length === 0 ? (
                <p className="text-[10.5px] text-slate-400 italic text-left leading-relaxed select-none">
                  Nessun accessorio o pertinenza attivo. Abilita balconi, terrazzi, box, cantine o giardini nel modulo dei parametri per ricalcolare la superficie commerciale.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                  {activeAccs.map((acc, index) => (
                    <div key={index} className="flex justify-between items-center gap-2 p-2 bg-white rounded-md border border-slate-200 text-xs shadow-3xs hover:border-slate-350 transition-all">
                      <div className="flex flex-col text-left">
                        <span className="font-extrabold text-slate-700 leading-tight">{acc.name}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{acc.desc} ({acc.details})</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10.5px] whitespace-nowrap">
                          {acc.impact}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="h-px bg-slate-150"></div>

            {/* Premium Slate-900 Block for Total value estimation */}
            <div className="bg-slate-900 rounded-lg p-5 text-white shadow-inner">
              <div className="flex justify-between items-baseline mb-1">
                <p className="text-[10px] font-bold uppercase opacity-60 tracking-wider">
                  Stima Valore Immobile 
                </p>
                {result.commercialSize && result.commercialSize !== selectedSize && (
                  <span className="text-[9px] bg-indigo-500/30 px-1.5 py-0.5 rounded text-indigo-200 font-mono font-bold tracking-wide">
                    S. Comm.: {result.commercialSize} m²
                  </span>
                )}
              </div>
              <p className="text-3xl font-black tracking-tight text-white font-mono">
                {formatPrice(displayEstimatedTotal)}
              </p>
              
              {result.accessories && (
                <div className="flex flex-wrap gap-1 mt-3 pt-2.5 border-t border-white/10 text-[9px] font-semibold text-indigo-150">
                  <span className="opacity-50 select-none uppercase tracking-widest text-[8px] mr-1 self-center">Pertinenze:</span>
                  <span className="bg-white/10 px-1 py-0.5 rounded font-mono">Abitazione: {selectedSize}m²</span>
                  {result.selectedTaglio && (
                    <span className="bg-white/15 border border-white/10 px-1 py-0.5 rounded font-mono text-white">
                      Taglio: {TAGLI[result.selectedTaglio]?.label || result.selectedTaglio}
                    </span>
                  )}
                  {result.accessories.hasBalcone && <span className="bg-indigo-505/30 border border-indigo-400/20 px-1 py-0.5 rounded font-mono">Balcone: {result.accessories.balconeSize}m²</span>}
                  {result.accessories.hasTerrazzo && <span className="bg-indigo-505/30 border border-indigo-400/20 px-1 py-0.5 rounded font-mono">Terrazzo: {result.accessories.terrazzoSize}m²</span>}
                  {result.accessories.hasCantina && <span className="bg-indigo-505/30 border border-indigo-400/20 px-1 py-0.5 rounded font-mono">Cantina: {result.accessories.cantinaSize}m²</span>}
                  {result.accessories.hasSoffitta && <span className="bg-indigo-505/30 border border-indigo-400/20 px-1 py-0.5 rounded font-mono">Soffitta: {result.accessories.soffittaSize}m²</span>}
                  {result.accessories.hasGiardino && <span className="bg-indigo-505/30 border border-indigo-400/20 px-1 py-0.5 rounded font-mono">Giardino: {result.accessories.giardinoSize}m²</span>}
                  {result.accessories.hasBox && <span className="bg-indigo-505/30 border border-indigo-400/20 px-1 py-0.5 rounded">Box</span>}
                  {result.accessories.hasBoxDoppio && <span className="bg-indigo-505/30 border border-indigo-400/20 px-1 py-0.5 rounded">Box Doppio</span>}
                  {result.accessories.hasPostoCoperto && <span className="bg-indigo-505/30 border border-indigo-400/20 px-1 py-0.5 rounded">Posto Cop.</span>}
                  {result.accessories.hasPostoScoperto && <span className="bg-indigo-505/30 border border-indigo-400/20 px-1 py-0.5 rounded">Posto Scop.</span>}
                </div>
              )}

              <p className="text-[10px] mt-2.5 text-indigo-300 font-semibold tracking-wide font-mono">
                *Prezzo di acquisto stimato complessivo • Andamento 2026/2027
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-indigo-50/80 p-3 rounded-lg border border-indigo-100 mt-auto">
            <Info className="w-4 h-4 text-indigo-500 shrink-0" />
            <p className="text-[10px] text-indigo-700 leading-snug font-medium italic">
              Valori puramente simulati. Per valutazioni ufficiali, consulta l'Osservatorio OMI delle Entrate.
            </p>
          </div>
        </motion.div>

        {/* Right Side: Dynamically scalable sizes + Comparison table alternative - col-span-7 in mockup */}
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-7 flex flex-col gap-6"
        >
          {/* Sizing Slider Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 select-none">Configurazione Metratura</h3>
                <span className="text-sm font-semibold text-slate-700">Modifica la superficie e vedi ricalcolare istantaneamente</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 pl-3 pr-1 py-1 rounded-lg">
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={selectedSize || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    onSizeChange(isNaN(val) ? 0 : val);
                  }}
                  className="w-16 h-8 text-center bg-white border border-slate-200 rounded font-black text-slate-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-tighter pr-2">mq</span>
              </div>
            </div>

            {/* Dynamic Slider */}
            <div className="space-y-2">
              <input
                id="price-finder-size-slider"
                type="range"
                min="30"
                max="250"
                step="5"
                value={selectedSize}
                onChange={(e) => onSizeChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase select-none px-1">
                <span>Mono (30 mq)</span>
                <span>Standard (80 mq)</span>
                <span>Grande (150 mq)</span>
                <span>Attico (250 mq)</span>
              </div>
            </div>
          </div>

          {/* Prezzo Medio al Metro Quadro (Replacing key comparison box) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col flex-1 min-h-0">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-slate-700 uppercase text-xs tracking-widest flex items-center gap-2">
                <Euro className="w-4 h-4 text-indigo-600" />
                Quotazione e Prezzo al Metro Quadro
              </h3>
              <span className="text-[10px] px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold uppercase rounded-md tracking-wider">
                {cityName.toUpperCase()} {zoneName ? zoneName.toUpperCase().slice(0, 8) : 'CENTRO'}
              </span>
            </div>

            <div className="flex-1 p-5 space-y-5">
              {/* Modello di Calcolo (Pricing Model Mode Selector) */}
              <div className="space-y-1.5 bg-indigo-50/50 p-3.5 rounded-lg border border-indigo-100/60 flex flex-col md:flex-row md:items-center justify-between gap-3 select-none">
                <div className="text-left font-sans">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">Modello di Calcolo Quotazione</p>
                  <p className="text-[10.5px] text-indigo-700/90 font-medium">Scegli se calcolare la valutazione mista o basarti esclusivamente sui dati della banca pubblica OMI</p>
                </div>
                <div className="flex bg-slate-150 p-0.5 rounded-lg border border-slate-200 shrink-0 select-none font-sans">
                  <button
                    type="button"
                    onClick={() => setPricingMode('mix')}
                    className={`px-3 py-1.5 text-[9.5px] font-extrabold rounded-md text-center transition cursor-pointer select-none uppercase tracking-wider ${
                      pricingMode === 'mix'
                        ? 'bg-white text-slate-800 shadow-xs border border-slate-250/20'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Mix Portali + OMI
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingMode('omi')}
                    className={`px-3 py-1.5 text-[9.5px] font-extrabold rounded-md text-center transition cursor-pointer select-none uppercase tracking-wider ${
                      pricingMode === 'omi'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-indigo-600'
                    }`}
                  >
                    Solo Banca Pubblica OMI 🇮🇹
                  </button>
                </div>
              </div>

              {/* Massive typographic average price widget */}
              <div className="bg-slate-50 border border-slate-250/70 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Prezzo Medio al Metro Quadro</p>
                  <div className="flex items-baseline gap-1.5 font-mono">
                    <span className="text-5xl font-black text-slate-800 tracking-tight">
                      {Math.round(displayAvgPricePerSqM).toLocaleString('it-IT')}
                    </span>
                    <span className="text-xl font-bold text-slate-400 italic uppercase tracking-tighter">€/m²</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center sm:text-left shadow-2xs">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Range Minimo</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-700 font-mono mt-0.5">{formatPrice(displayMinPricePerSqM)}/m²</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center sm:text-left shadow-2xs">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Range Massimo</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-700 font-mono mt-0.5">{formatPrice(displayMaxPricePerSqM)}/m²</p>
                  </div>
                </div>
              </div>

              {/* Dual Benchmark Sourcing - Operatori Immobiliari & OMI Agenzia delle Entrate */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3.5">
                <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-250">
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Metodologia Benchmark di Calcolo</span>
                  <span className="text-[9px] bg-indigo-50 border border-indigo-105 text-indigo-750 font-extrabold px-2 py-0.5 rounded font-mono uppercase tracking-wide">
                    {pricingMode === 'omi' ? 'Solo Valori OMI' : 'Media Ponderata'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Real Estate Portals / Operators */}
                  <div className={`p-3 rounded-lg flex flex-col justify-between transition-all duration-300 ${
                    pricingMode !== 'omi'
                      ? 'bg-slate-50 border-2 border-slate-300 shadow-3xs'
                      : 'bg-white border border-slate-150 opacity-60'
                  }`}>
                    <div>
                      <div className="flex justify-between items-center mb-1.5 select-none font-sans">
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                          1. Operatori Immobiliari
                          {pricingMode !== 'omi' && <span className="text-[7.5px] bg-slate-600 text-white font-mono font-bold px-1 rounded uppercase tracking-tighter">In Uso</span>}
                        </span>
                        <span className="text-[9px] font-mono font-bold text-slate-600 bg-slate-100 px-1 rounded">Media 2 Portali</span>
                      </div>
                      <div className="text-lg font-black text-slate-750 font-mono mb-2">
                        {currentEstimate.operatoriAvg ? `${currentEstimate.operatoriAvg.toLocaleString('it-IT')} €/m²` : '--'}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-100 mt-1 select-none">
                      <div className="text-[8px] text-left">
                        <span className="text-slate-400 font-black block uppercase tracking-tight">tecnocasa</span>
                        <span className="text-[9.5px] font-bold text-slate-600 font-mono">
                          {currentEstimate.tecnocasaPrice ? `${currentEstimate.tecnocasaPrice.toLocaleString('it-IT')} €/m²` : '--'}
                        </span>
                      </div>
                      <div className="text-[8px] text-right border-l border-slate-100 pl-2">
                        <span className="text-slate-400 font-black block uppercase tracking-tight">frimm</span>
                        <span className="text-[9.5px] font-bold text-slate-600 font-mono">
                          {currentEstimate.frimmPrice ? `${currentEstimate.frimmPrice.toLocaleString('it-IT')} €/m²` : '--'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Agenzia delle Entrate OMI Database */}
                  <div className={`p-3 rounded-lg flex flex-col justify-between transition-all duration-300 ${
                    pricingMode === 'omi'
                      ? 'bg-indigo-50 border-2 border-indigo-500 shadow-sm'
                      : 'bg-white border border-slate-150'
                  }`}>
                    <div>
                      <div className="flex justify-between items-center mb-1.5 font-sans select-none">
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                          2. Agenzia delle Entrate
                          {pricingMode === 'omi' && <span className="text-[7.5px] bg-indigo-650 text-white font-mono font-bold px-1 rounded uppercase tracking-tighter">In Uso</span>}
                        </span>
                        <a 
                          href="https://www.agenziaentrate.gov.it/" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[8px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded hover:bg-indigo-100 transition"
                        >
                          agenziaentrate.gov.it
                        </a>
                      </div>
                      <div className="text-lg font-black text-slate-850 font-mono mb-2">
                        {currentEstimate.omiPrice ? `${currentEstimate.omiPrice.toLocaleString('it-IT')} €/m²` : '--'}
                      </div>
                    </div>

                    <div className="text-[8.5px] text-slate-500 font-medium leading-normal pt-1.5 border-t border-slate-100 italic text-left">
                      Quotazioni ufficiali OMI registrate dall'Agenzia delle Entrate per la medesima zona.
                    </div>
                  </div>
                </div>

                <p className="text-[9.5px] text-indigo-750 font-semibold leading-relaxed pt-1.5 select-none text-left border-t border-slate-200/60 font-sans">
                  {pricingMode === 'omi' ? (
                    <span>
                      La quotazione finale al mq è determinata <strong>esclusivamente</strong> in base ai valori ufficiali della <strong>banca pubblica OMI (Osservatorio del Mercato Immobiliare) dell'Agenzia delle Entrate</strong> per la zona selezionata. Questi dati riflettono le reali compravendite registrate.
                    </span>
                  ) : (
                    <span>
                      La quotazione finale al mq rappresenta la media aritmetica calcolata tra la stima media degli annunci dei portali immobiliari (Tecnocasa.it e Frimm.it) e i valori del database OMI di agenziaentrate.gov.it per la zona selezionata.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Bottom info meter bar block widget matching structural design HTML file */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 rounded-b-xl mt-auto">
              <div className="flex items-center gap-5 w-full sm:w-auto">
                <div className="text-left flex-1 sm:flex-none">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-wider">Richiesta Domanda</p>
                  <div className="h-1.5 w-full sm:w-16 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${demandPct}%` }}></div>
                  </div>
                </div>
                <div className="text-left flex-1 sm:flex-none">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-wider">Volume Offerta</p>
                  <div className="h-1.5 w-full sm:w-16 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${supplyPct}%` }}></div>
                  </div>
                </div>
              </div>
              <div className="text-right w-full sm:w-auto mt-2 sm:mt-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest bg-slate-200/50 px-2.5 py-1 rounded inline-block">
                  Indice Liquidità: <span className="text-indigo-600 font-black">{liquidityLabel}</span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Simulator Warning Info Card */}
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-amber-800 flex gap-3 text-xs leading-relaxed shadow-xs">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold uppercase tracking-wider text-[10px] select-none text-amber-900 block mb-0.5">Avviso Importante di Simulazione</span>
          <p className="text-amber-800/90 text-[11px]">
            La forchetta tariffaria e i valori di compravendita sono stime prodotte con simulazione deterministica su scala statistica per la zona "{cityName}" per fini di prototipazione di design. Per stime con rilevanza notarile, catastale o legale è necessario interpellare professionisti abilitati o fare riferimento ai bollettini ufficiali OMI stabiliti dall'Agenzia delle Entrate.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
