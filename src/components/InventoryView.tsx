import React, { useState, useMemo } from 'react';
import { useDealership } from '../context/DealershipContext';
import { Bike } from '../types';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit3, 
  Trash2, 
  DollarSign, 
  Wrench, 
  Gauge, 
  LayoutGrid, 
  List, 
  Receipt,
  TrendingUp,
  Sparkles,
  Bike as BikeIcon
} from 'lucide-react';
import { formatCurrency, formatNumber, calculateTotalOtherCosts } from '../utils/formatters';

export const InventoryView: React.FC = () => {
  const { 
    bikes, 
    settings, 
    setIsAddBikeModalOpen, 
    openSaleModalForBike, 
    openDetailModalForBike, 
    openEditModalForBike, 
    deleteBike,
    openInvoiceForSale,
    setActiveTab
  } = useDealership();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'price-high' | 'price-low' | 'cost-high' | 'profit-high'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const symbol = settings.currencySymbol;

  // Bikes Inventory section strictly displays In-Stock motorbikes. Sold items do NOT show here.
  const inStockBikes = useMemo(() => bikes.filter(b => b.status === 'In Stock'), [bikes]);
  const inStockCount = inStockBikes.length;
  const soldCount = useMemo(() => bikes.filter(b => b.status === 'Sold').length, [bikes]);

  const filteredBikes = useMemo(() => {
    return inStockBikes.filter((bike) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !query ||
        bike.make.toLowerCase().includes(query) ||
        bike.model.toLowerCase().includes(query) ||
        bike.vin.toLowerCase().includes(query) ||
        bike.regPlate.toLowerCase().includes(query) ||
        bike.year.toString().includes(query);

      const matchesCategory = categoryFilter === 'All' || bike.category === categoryFilter;

      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'price-high') {
        return b.targetSalePrice - a.targetSalePrice;
      }
      if (sortBy === 'price-low') {
        return a.targetSalePrice - b.targetSalePrice;
      }
      if (sortBy === 'cost-high') {
        return b.totalCost - a.totalCost;
      }
      if (sortBy === 'profit-high') {
        const profitA = a.targetSalePrice - a.totalCost;
        const profitB = b.targetSalePrice - b.totalCost;
        return profitB - profitA;
      }
      return 0;
    });
  }, [inStockBikes, searchQuery, categoryFilter, sortBy]);

  const [bikeToDelete, setBikeToDelete] = useState<Bike | null>(null);

  const categories = [
    'All', 
    'Standard / Commuter', 
    'Scooter', 
    'Sport', 
    'Cruiser', 
    'Adventure', 
    'Naked', 
    'Cafe Racer', 
    'Touring', 
    'Off-Road',
    'Sedan',
    'Hatchback',
    'SUV',
    'Van / Wagon'
  ];

  const handleConfirmDelete = () => {
    if (bikeToDelete) {
      deleteBike(bikeToDelete.id);
      setBikeToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Motorbike <span className="text-sky-400">Inventory</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 font-mono font-bold">
              {inStockCount} In Stock
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Active showroom stock available for sale. Sold vehicles do not show here and are automatically recorded in Sales & Commissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Ledger Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsAddBikeModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Motorbike</span>
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="sm:col-span-2 lg:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search make, model, registration plate, VIN..."
              aria-label="Search motorbikes by make, model, plate, or VIN"
              className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 rounded-xl pl-10 pr-4 py-2.5 min-h-[44px] text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all font-medium"
            />
          </div>

          <div className="sm:col-span-1 lg:col-span-3 flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 min-h-[44px] text-xs">
            <span className="flex items-center gap-2 font-bold text-sky-400">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" aria-hidden="true" />
              Active Showroom Stock: <strong className="text-white font-mono text-sm">{inStockBikes.length}</strong>
            </span>
          </div>

          <div className="sm:col-span-1 lg:col-span-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter motorbikes by category"
              className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 rounded-xl px-3 py-2.5 min-h-[44px] text-xs text-slate-200 outline-none cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Sort motorbikes"
              className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 rounded-xl px-3 py-2.5 min-h-[44px] text-xs text-slate-200 outline-none cursor-pointer font-medium"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="profit-high">Sort: Highest Profit</option>
              <option value="price-high">Sort: Price (High to Low)</option>
              <option value="price-low">Sort: Price (Low to High)</option>
              <option value="cost-high">Sort: Total Cost (High to Low)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              Showing <strong className="text-white font-mono">{filteredBikes.length}</strong> available in-stock motorbikes
            </span>
            {soldCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('sales')}
                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1 min-h-[32px] rounded-full border border-emerald-500/30 transition-colors font-medium"
                title="View sold vehicles in the Sales Ledger and Monthly Summary"
              >
                <span>🔒 {soldCount} sold vehicle{soldCount === 1 ? '' : 's'} archived in Sales</span>
                <span className="font-bold" aria-hidden="true">→</span>
              </button>
            )}
          </div>
          {(searchQuery || categoryFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('All');
              }}
              className="text-sky-400 hover:text-sky-300 font-bold px-2 py-1 min-h-[32px] rounded-lg hover:bg-sky-500/10 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Grid Mode */}
      {viewMode === 'grid' && filteredBikes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredBikes.map((bike) => {
            const isSold = bike.status === 'Sold';
            const otherCostsTotal = calculateTotalOtherCosts(bike.repairCosts);
            const costPrice = bike.purchasePrice;
            const totalCost = bike.totalCost;
            const targetPrice = bike.targetSalePrice;
            const potentialProfit = targetPrice - totalCost;
            const potentialMargin = targetPrice > 0 ? (potentialProfit / targetPrice) * 100 : 0;

            return (
              <div
                key={bike.id}
                className="group flex flex-col rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Photo & Status */}
                <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                  <img
                    src={bike.imageUrl || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80'}
                    alt={`${bike.make} ${bike.model}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-black tracking-wide shadow-md ${
                      isSold 
                        ? 'bg-emerald-500 text-slate-950' 
                        : 'bg-sky-500 text-slate-950'
                    }`}>
                      {bike.status.toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-950/80 backdrop-blur-md text-slate-300 border border-slate-700">
                      {bike.category}
                    </span>
                  </div>

                  {isSold && bike.sale && (
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border shadow-md ${
                        bike.sale.saleMethod === 'Finance'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 backdrop-blur-md'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 backdrop-blur-md'
                      }`}>
                        {bike.sale.saleMethod.toUpperCase()} SALE
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-300 font-medium">
                    <span className="bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800 text-slate-300 text-[11px]">
                      {bike.engineCapacityCc} cc
                    </span>
                    <span className="bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800 text-amber-300 text-[11px] font-bold">
                      {bike.condition}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 
                      onClick={() => openDetailModalForBike(bike)}
                      className="text-base font-black text-white hover:text-sky-400 cursor-pointer transition-colors leading-tight truncate"
                      title={`${bike.year} ${bike.make} ${bike.model}`}
                    >
                      {bike.year} {bike.make} {bike.model}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                      <span>Plate: <strong className="text-slate-200">{bike.regPlate}</strong></span>
                      {bike.mileage > 0 && (
                        <>
                          <span>•</span>
                          <span>{formatNumber(bike.mileage)} km</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Financial Breakdown Card with Cost Price, Other Costs, and Profit */}
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Cost Price:</span>
                      <span className="font-semibold text-slate-200 font-mono">{formatCurrency(costPrice, symbol)}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-400">
                      <span className="flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-amber-400" />
                        Other Costs ({bike.repairCosts.length}):
                      </span>
                      <span className="font-semibold text-amber-400 font-mono">+{formatCurrency(otherCostsTotal, symbol)}</span>
                    </div>

                    <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center font-bold">
                      <span className="text-slate-300">Total Cost:</span>
                      <span className="text-white font-black font-mono">{formatCurrency(totalCost, symbol)}</span>
                    </div>

                    {isSold && bike.sale ? (
                      <div className="pt-2 border-t border-slate-800/80 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Sale Amount:</span>
                          <span className="font-black text-white font-mono">{formatCurrency(bike.sale.saleAmount, symbol)}</span>
                        </div>
                        {bike.sale.saleMethod === 'Finance' && (
                          <div className="flex justify-between items-center text-[11px] text-amber-400">
                            <span>3% Finance Comm:</span>
                            <span className="font-bold font-mono">+{formatCurrency(bike.sale.financeCommission, symbol)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center font-black pt-1 border-t border-slate-800/60">
                          <span className="text-emerald-400 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Realized Profit:
                          </span>
                          <span className="text-emerald-400 font-mono">{formatCurrency(bike.sale.netProfit, symbol)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-800/80 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Target Selling Price:</span>
                          <span className="font-black text-sky-400 font-mono">{formatCurrency(targetPrice, symbol)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-black pt-1 border-t border-slate-800/60">
                          <span className="text-emerald-400 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Target Profit:
                          </span>
                          <span className="text-emerald-400 font-mono">
                            +{formatCurrency(potentialProfit, symbol)} ({potentialMargin.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => openDetailModalForBike(bike)}
                      className="flex-1 py-2.5 px-3 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-sky-400"
                      aria-label={`View details for ${bike.make} ${bike.model}`}
                    >
                      <Eye className="w-4 h-4 text-sky-400" aria-hidden="true" />
                      <span>Details</span>
                    </button>

                    {!isSold ? (
                      <button
                        type="button"
                        onClick={() => openSaleModalForBike(bike)}
                        className="flex-1 py-2.5 px-3 min-h-[44px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-400"
                        aria-label={`Record sale for ${bike.make} ${bike.model}`}
                      >
                        <DollarSign className="w-4 h-4 stroke-[3]" aria-hidden="true" />
                        <span>Sell</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openInvoiceForSale(bike.sale!)}
                        className="flex-1 py-2.5 px-3 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-emerald-400"
                        title="Print / View Invoice"
                        aria-label={`View invoice for ${bike.make} ${bike.model}`}
                      >
                        <Receipt className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                        <span>Invoice</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openEditModalForBike(bike)}
                      className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-sky-400"
                      title="Edit Specs, Costs & Expenses"
                      aria-label={`Edit ${bike.make} ${bike.model}`}
                    >
                      <Edit3 className="w-4 h-4" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setBikeToDelete(bike)}
                      className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition-colors focus-visible:ring-2 focus-visible:ring-rose-400"
                      title="Delete Motorbike"
                      aria-label={`Delete ${bike.make} ${bike.model}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table Mode */}
      {viewMode === 'table' && filteredBikes.length > 0 && (
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Motorbike</th>
                  <th className="py-3 px-4">Specs & Plate</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4 text-right">Other Costs</th>
                  <th className="py-3 px-4 text-right">Total Cost</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">Profit</th>
                  <th className="py-3 px-4 sm:px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredBikes.map((bike) => {
                  const isSold = bike.status === 'Sold';
                  const otherCostsTotal = calculateTotalOtherCosts(bike.repairCosts);
                  const netProfit = isSold && bike.sale ? bike.sale.netProfit : (bike.targetSalePrice - bike.totalCost);

                  return (
                    <tr key={bike.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div 
                          onClick={() => openDetailModalForBike(bike)}
                          className="font-bold text-white hover:text-sky-400 cursor-pointer"
                        >
                          {bike.year} {bike.make} {bike.model}
                        </div>
                        <div className="text-[10px] text-slate-400">{bike.category}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-slate-200 font-bold">{bike.regPlate}</div>
                        <div className="text-[10px] text-slate-400">{bike.engineCapacityCc}cc</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isSold ? 'bg-emerald-500/20 text-emerald-300' : 'bg-sky-500/20 text-sky-400'
                        }`}>
                          {bike.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        {formatCurrency(bike.purchasePrice, symbol)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-amber-400">
                        +{formatCurrency(otherCostsTotal, symbol)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                        {formatCurrency(bike.totalCost, symbol)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-black text-sky-400">
                        {isSold && bike.sale ? formatCurrency(bike.sale.saleAmount, symbol) : formatCurrency(bike.targetSalePrice, symbol)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-400">
                        +{formatCurrency(netProfit, symbol)}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openDetailModalForBike(bike)}
                            className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400"
                            title="View Details"
                            aria-label={`View details for ${bike.make} ${bike.model}`}
                          >
                            <Eye className="w-4 h-4" aria-hidden="true" />
                          </button>

                          {!isSold ? (
                            <button
                              type="button"
                              onClick={() => openSaleModalForBike(bike)}
                              className="px-3 py-1.5 min-h-[38px] rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm flex items-center justify-center focus-visible:ring-2 focus-visible:ring-emerald-400"
                              aria-label={`Sell ${bike.make} ${bike.model}`}
                            >
                              Sell
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openInvoiceForSale(bike.sale!)}
                              className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400"
                              title="Invoice"
                              aria-label={`View invoice for ${bike.make} ${bike.model}`}
                            >
                              <Receipt className="w-4 h-4" aria-hidden="true" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openEditModalForBike(bike)}
                            className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white focus-visible:ring-2 focus-visible:ring-sky-400"
                            title="Edit"
                            aria-label={`Edit ${bike.make} ${bike.model}`}
                          >
                            <Edit3 className="w-4 h-4" aria-hidden="true" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setBikeToDelete(bike)}
                            className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 focus-visible:ring-2 focus-visible:ring-rose-400"
                            title="Delete"
                            aria-label={`Delete ${bike.make} ${bike.model}`}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredBikes.length === 0 && (
        <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 p-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
            <BikeIcon className="w-8 h-8" />
          </div>

          {soldCount > 0 && inStockBikes.length === 0 ? (
            <>
              <h3 className="text-lg font-black text-white">All Showroom Motorbikes Have Been Sold</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                You currently have 0 in-stock motorbikes. All {soldCount} recorded vehicle{soldCount === 1 ? '' : 's'} have been sold and are archived in the Sales Ledger and Monthly Summary.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsAddBikeModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add New Motorbike</span>
                </button>
                <button
                  onClick={() => setActiveTab('sales')}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition-colors"
                >
                  View Sales Ledger ({soldCount})
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-lg font-black text-white">
                No In-Stock Motorbikes Found
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                {searchQuery || categoryFilter !== 'All'
                  ? 'No available motorbikes matched your search and filter criteria.'
                  : 'Your inventory is clean and ready. Add your first motorbike to enter the cost price, log any other repair or transport costs, and track your profits.'}
              </p>
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setIsAddBikeModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add Motorbike</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Accessible In-App Delete Confirmation Modal */}
      {bikeToDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                <Trash2 className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h3 id="delete-dialog-title" className="text-base font-black text-white">
                  Delete Vehicle Record?
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
              <div><strong className="text-white">{bikeToDelete.year} {bikeToDelete.make} {bikeToDelete.model}</strong></div>
              <div className="text-slate-400 font-mono">Reg Plate: {bikeToDelete.regPlate} • Cost: {formatCurrency(bikeToDelete.totalCost, symbol)}</div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setBikeToDelete(null)}
                className="px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/25 transition-all active:scale-95"
              >
                Delete Motorbike
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
