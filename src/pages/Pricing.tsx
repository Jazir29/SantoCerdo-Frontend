import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator, DollarSign, Percent, TrendingUp, Save, Plus, Trash2,FileText,
  Scale, CheckCircle2, Package, ArrowLeft, History, ChevronDown, ChevronUp, Clock
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { api } from '../services/api';
import { Product, ProductionBatch } from '../types';
import { Modal } from '../components/ui/Modal';

interface CostItem {
  id: string;
  name: string;
  amount: number;
}

export default function Pricing() {
  const navigate = useNavigate();

  // ── Inputs ──────────────────────────────────────────────────
  const [ingredients, setIngredients] = useState<CostItem[]>([
    { id: '1', name: 'Grasa de cerdo en rama', amount: 0 }
  ]);
  const [operations, setOperations] = useState<CostItem[]>([
    { id: '1', name: 'Gas / Electricidad', amount: 0 },
    { id: '2', name: 'Empaque y etiquetas', amount: 0 }
  ]);
  const [batchYield, setBatchYield] = useState<number>(1000); // gramos
  const [unitWeightGrams, setUnitWeightGrams] = useState<number>(500);
  const [margin, setMargin]               = useState<number>(30);
  const [notes, setNotes]                 = useState<string>('');

  // ── Save ────────────────────────────────────────────────────
  const [isSaving, setIsSaving]           = useState(false);
  const [saveSuccess, setSaveSuccess]     = useState(false);
  const [productName, setProductName]     = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('new');

  // ── Products & Batches ──────────────────────────────────────
  const [products, setProducts]           = useState<Product[]>([]);
  const [batches, setBatches]             = useState<ProductionBatch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [expandedBatchId, setExpandedBatchId] = useState<number | null>(null);
  const [showHistory, setShowHistory]     = useState(false);

  // Modal confirmacion producto
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProductDescription, setNewProductDescription] = useState('');
  const [editablePrice, setEditablePrice] = useState<number>(0);
  const [initialRealMargin, setInitialRealMargin] = useState<number>(0);

  // ── Load products ───────────────────────────────────────────
  useEffect(() => {
    api.getAllProducts()
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  // ── Load batches when product selected ─────────────────────
  useEffect(() => {
    if (selectedProductId === 'new') {
      setBatches([]);
      setShowHistory(false);
      return;
    }
    setLoadingBatches(true);
    api.getProductBatches(Number(selectedProductId))
      .then(setBatches)
      .catch(() => setBatches([]))
      .finally(() => setLoadingBatches(false));
  }, [selectedProductId]);

  // ── Reset product selection if weight changes ───────────────
  useEffect(() => {
    if (selectedProductId === 'new') return;
    const product = products.find(p => p.id.toString() === selectedProductId);
    if (product && Number(product.weight_grams) !== Number(unitWeightGrams)) {
      setSelectedProductId('new');
    }
  }, [unitWeightGrams, products, selectedProductId]);

  // ── Ingredient helpers ──────────────────────────────────────
  const addIngredient = () =>
    setIngredients([...ingredients, { id: Math.random().toString(), name: '', amount: 0 }]);
  const removeIngredient = (id: string) =>
    setIngredients(ingredients.filter(i => i.id !== id));
  const updateIngredient = (id: string, field: keyof CostItem, value: string | number) =>
    setIngredients(ingredients.map(i => i.id === id ? { ...i, [field]: value } : i));

  // ── Operation helpers ───────────────────────────────────────
  const addOperation = () =>
    setOperations([...operations, { id: Math.random().toString(), name: '', amount: 0 }]);
  const removeOperation = (id: string) =>
    setOperations(operations.filter(o => o.id !== id));
  const updateOperation = (id: string, field: keyof CostItem, value: string | number) =>
    setOperations(operations.map(o => o.id === id ? { ...o, [field]: value } : o));

  // ── Calculations ────────────────────────────────────────────
const totalIngredients  = ingredients.reduce((s, i) => s + (Number(i.amount) || 0), 0);
const totalOperations   = operations.reduce((s, o) => s + (Number(o.amount) || 0), 0);
const totalBatchCost    = totalIngredients + totalOperations;
const batchYieldKg      = batchYield / 1000;  
const costPerKg         = batchYieldKg > 0 ? totalBatchCost / batchYieldKg : 0;
const suggestedPricePerKg = margin < 100 ? costPerKg / (1 - margin / 100) : 0;
const profitPerKg       = suggestedPricePerKg - costPerKg;
const calculatedUnits   = unitWeightGrams > 0 ? batchYield / unitWeightGrams : 0;
const costPerUnit       = calculatedUnits > 0 ? totalBatchCost / calculatedUnits : 0;
const suggestedPricePerUnit = margin < 100 ? costPerUnit / (1 - margin / 100) : 0;
const profitPerUnit     = suggestedPricePerUnit - costPerUnit;
const ingPct  = suggestedPricePerKg > 0 ? ((totalIngredients / batchYieldKg) / suggestedPricePerKg) * 100 : 0;
const opPct   = suggestedPricePerKg > 0 ? ((totalOperations / batchYieldKg) / suggestedPricePerKg) * 100 : 0;
const profPct = suggestedPricePerKg > 0 ? (profitPerKg / suggestedPricePerKg) * 100 : 0;


  // ── Matching products by weight_grams ───────────────────────
  const matchingProducts = products.filter(p => Number(p.weight_grams) === Number(unitWeightGrams));

  // ── Batch payload builder ───────────────────────────────────
  const buildBatchPayload = () => ({
    batch_yield_grams: batchYield,  // ya está en gramos, sin conversión
    unit_weight_grams:        unitWeightGrams,
    units_produced:           Math.floor(calculatedUnits),
    total_ingredients_cost:   Number(totalIngredients.toFixed(2)),
    total_operations_cost:    Number(totalOperations.toFixed(2)),
    total_batch_cost:         Number(totalBatchCost.toFixed(2)),
    cost_per_unit:            Number(costPerUnit.toFixed(2)),
    price_per_unit:           Number(suggestedPricePerUnit.toFixed(2)),
    margin_percent:           margin,
    ingredients_detail:       ingredients,
    operations_detail:        operations,
    notes:                    notes || null,
    stock_delta:              Math.floor(calculatedUnits),
  });

  // ── Save ────────────────────────────────────────────────────
  const handleSave = async () => {
    if (suggestedPricePerUnit <= 0) return;

    if (selectedProductId === 'new') {
      const initialPrice = Number(suggestedPricePerUnit.toFixed(2));
      setEditablePrice(initialPrice);
      const initialReal = initialPrice > 0 ? ((initialPrice - costPerUnit) / initialPrice) * 100 : 0;
      setInitialRealMargin(initialReal);
      setIsCreateModalOpen(true);
      return;
    }

    setIsSaving(true);
    try {
      await api.createBatch(Number(selectedProductId), buildBatchPayload());

      setSaveSuccess(true);
      setNotes('');
      setTimeout(() => setSaveSuccess(false), 3000);

      const updated = await api.getAllProducts();
      setProducts(updated);

      const updatedBatches = await api.getProductBatches(Number(selectedProductId));
      setBatches(updatedBatches);
      setShowHistory(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const safe = (n: number) => isFinite(n) && n !== null ? n : 0;

  const confirmCreateProduct = async () => {
    if (!productName || editablePrice <= 0) return;

    setIsSaving(true);
    try {
      const actualMargin = editablePrice > 0
        ? ((editablePrice - costPerUnit) / editablePrice) * 100 : 0;

      const payload = {
        name: productName,
        description: newProductDescription || `Manteca artesanal ${unitWeightGrams}g`,
        ...buildBatchPayload(),
        price_per_unit: Number(editablePrice.toFixed(2)),
        margin_percent: Number(actualMargin.toFixed(2)),
      };

      console.log('Payload enviado:', payload); // ← agrega esto temporalmente

      await api.createProductWithBatch(payload);

      setSaveSuccess(true);
      setProductName('');
      setNewProductDescription('');
      setNotes('');
      setIsCreateModalOpen(false);
      setTimeout(() => setSaveSuccess(false), 3000);

      const updated = await api.getAllProducts();
      setProducts(updated);
    } catch (err) {
      console.error('Error completo:', err); // ← y esto
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/products')}
          icon={ArrowLeft} className="text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100" />
        <PageHeader
          title="Calculadora de Precios"
          subtitle="Costeo detallado por lote y cálculo de rentabilidad"
          className="mb-0"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* ── LEFT COLUMN ─────────────────────────────────────── */}
        <div className="xl:col-span-7 space-y-6">

          {/* Materia Prima */}
          <Card className="rounded-3xl">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-2 md:p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                    <Package size={16} className="md:hidden" />
                    <Package size={20} className="hidden md:block" />
                  </div>
                  <h2 className="text-base md:text-xl font-bold text-zinc-900">Materia Prima (Lote)</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={addIngredient} icon={Plus}
                  className="text-amber-600 hover:text-amber-700 bg-amber-50 text-xs md:text-sm">
                  Agregar
                </Button>
              </div>
              <div className="space-y-3">
                {ingredients.map((item) => (
                <div key={item.id} className="flex gap-2 items-end p-2 md:p-0 bg-zinc-50 md:bg-transparent rounded-xl md:rounded-none">
                  <div className="flex-1 min-w-0">
                    <Input value={item.name} onChange={(e) => updateIngredient(item.id, 'name', e.target.value)}
                      placeholder="Ej. Grasa de cerdo" label="Insumo" size="sm" />
                  </div>
                  <div className="w-20 md:w-32 shrink-0">
                    <Input type="number" value={item.amount || ''} onChange={(e) => updateIngredient(item.id, 'amount', Number(e.target.value))}
                      placeholder="0.00" icon={DollarSign} label="Costo" size="sm" />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeIngredient(item.id)}
                    icon={Trash2} className="text-zinc-400 hover:text-red-500 hover:bg-red-50 mb-0.5 shrink-0" />
                </div>
              ))}
              </div>
              <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-zinc-100 flex justify-between text-sm">
                <span className="font-medium text-zinc-500 text-xs md:text-sm">Subtotal Materia Prima:</span>
                <span className="font-bold text-zinc-900 text-xs md:text-sm">S/ {totalIngredients.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Costos Operativos */}
          <Card className="rounded-3xl">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-2 md:p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                    <Calculator size={16} className="md:hidden" />
                    <Calculator size={20} className="hidden md:block" />
                  </div>
                  <h2 className="text-base md:text-xl font-bold text-zinc-900">Costos Operativos (Lote)</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={addOperation} icon={Plus}
                  className="text-amber-600 hover:text-amber-700 bg-amber-50 text-xs md:text-sm">
                  Agregar
                </Button>
              </div>
              <div className="space-y-3">
                {operations.map((item) => (
                  <div key={item.id} className="flex gap-2 items-end p-2 md:p-0 bg-zinc-50 md:bg-transparent rounded-xl md:rounded-none">
                    <div className="flex-1 min-w-0">
                      <Input value={item.name} onChange={(e) => updateOperation(item.id, 'name', e.target.value)}
                        placeholder="Ej. Empaque" label="Operación" size="sm" />
                    </div>
                    <div className="w-20 md:w-32 shrink-0">
                      <Input type="number" value={item.amount || ''} onChange={(e) => updateOperation(item.id, 'amount', Number(e.target.value))}
                        placeholder="0.00" icon={DollarSign} label="Costo" size="sm" />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeOperation(item.id)}
                      icon={Trash2} className="text-zinc-400 hover:text-red-500 hover:bg-red-50 mb-0.5 shrink-0" />
                  </div>
                ))}
              </div>
              <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-zinc-100 flex justify-between text-sm">
                <span className="font-medium text-zinc-500 text-xs md:text-sm">Subtotal Operativo:</span>
                <span className="font-bold text-zinc-900 text-xs md:text-sm">S/ {totalOperations.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Rendimiento, Peso y Margen */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
            <Card className="rounded-2xl md:rounded-3xl">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center gap-2 mb-2 md:mb-3">
                  <div className="p-1.5 md:p-2 bg-blue-50 text-blue-600 rounded-lg md:rounded-xl">
                    <Scale size={14} className="md:hidden" />
                    <Scale size={18} className="hidden md:block" />
                  </div>
                  <h2 className="font-bold text-zinc-900 text-xs md:text-base">Rendimiento</h2>
                </div>
                <Input
                  label="Gramos por lote"
                  type="number"
                  value={batchYield || ''}
                  onChange={(e) => setBatchYield(Number(e.target.value))}
                  placeholder="1000"
                  suffix="g"
                  size="sm"
                />
                {batchYield > 0 && (
                  <p className="text-[10px] text-zinc-400 mt-1 ml-1">
                    ≈ {(batchYield / 1000).toFixed(2)} kg
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl md:rounded-3xl">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center gap-2 mb-2 md:mb-3">
                  <div className="p-1.5 md:p-2 bg-indigo-50 text-indigo-600 rounded-lg md:rounded-xl">
                    <Package size={14} className="md:hidden" />
                    <Package size={18} className="hidden md:block" />
                  </div>
                  <h2 className="font-bold text-zinc-900 text-xs md:text-base">Peso/Und</h2>
                </div>
                <Input
                  label="Gramos por producto"
                  type="number"
                  value={unitWeightGrams || ''}
                  onChange={(e) => setUnitWeightGrams(Number(e.target.value))}
                  placeholder="500"
                  suffix="g"
                  size="sm"
                />
              </CardContent>
            </Card>

            <Card className="rounded-2xl md:rounded-3xl col-span-2 md:col-span-1">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center gap-2 mb-2 md:mb-3">
                  <div className="p-1.5 md:p-2 bg-emerald-50 text-emerald-600 rounded-lg md:rounded-xl">
                    <Percent size={14} className="md:hidden" />
                    <Percent size={18} className="hidden md:block" />
                  </div>
                  <h2 className="font-bold text-zinc-900 text-xs md:text-base">Margen</h2>
                </div>
                <Input
                  label="Ganancia (%)"
                  type="number"
                  value={margin || ''}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  placeholder="30"
                  suffix="%"
                  size="sm"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────── */}
        <div className="xl:col-span-5">
          <div className="sticky top-8 space-y-6">

            {/* Results */}
            <div className="bg-zinc-900 p-4 md:p-8 rounded-3xl shadow-xl border border-zinc-800 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5"><TrendingUp size={160} /></div>
              <div className="relative z-10">
                <h2 className="text-base md:text-xl font-bold text-amber-400 mb-4 md:mb-6">Análisis de Rentabilidad</h2>
                <div className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-2 gap-3 md:gap-4 border-b border-zinc-800 pb-3 md:pb-4">
                    <div>
                      <p className="text-zinc-400 text-[10px] md:text-xs mb-1">Costo (1 kg)</p>
                      <p className="text-lg md:text-2xl font-medium text-zinc-300">S/ {safe(costPerKg).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400 text-[10px] md:text-xs mb-1">Costo (1 und)</p>
                      <p className="text-lg md:text-2xl font-medium text-zinc-300">S/ {safe(costPerUnit).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:gap-4 border-b border-zinc-800 pb-3 md:pb-4">
                    <div>
                      <p className="text-zinc-400 text-[10px] md:text-xs mb-1">Ganancia (1 kg)</p>
                      <p className="text-lg md:text-2xl font-medium text-emerald-400">S/ {safe(profitPerKg).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400 text-[10px] md:text-xs mb-1">Ganancia (1 und)</p>
                      <p className="text-lg md:text-2xl font-medium text-emerald-400">S/ {safe(profitPerUnit).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <p className="text-zinc-400 text-[10px] md:text-xs mb-1 uppercase tracking-wider font-bold">Precio (Kg)</p>
                      <p className="text-2xl md:text-3xl font-black text-white">S/ {safe(suggestedPricePerKg).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400 text-[10px] md:text-xs mb-1 uppercase tracking-wider font-bold">Precio (Und)</p>
                      <p className="text-2xl md:text-3xl font-black text-white">S/ {safe(suggestedPricePerUnit).toFixed(2)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-zinc-400 text-[10px] md:text-xs mb-1 uppercase tracking-wider font-bold">Unidades del lote</p>
                    <p className="text-base md:text-lg font-bold text-amber-400">{Math.floor(calculatedUnits)} unidades de {unitWeightGrams}g</p>
                  </div>
                  {suggestedPricePerKg > 0 && isFinite(suggestedPricePerKg) && (
                    <div className="pt-2">
                      <p className="text-[10px] text-zinc-500 mb-2 font-medium uppercase tracking-wider">Composición del Precio</p>
                      <div className="h-2 md:h-3 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                        <div style={{ width: `${ingPct}%` }} className="bg-blue-500" />
                        <div style={{ width: `${opPct}%` }} className="bg-purple-500" />
                        <div style={{ width: `${profPct}%` }} className="bg-emerald-500" />
                      </div>
                      <div className="flex justify-between mt-2 text-[10px] md:text-xs font-medium">
                        <div className="flex items-center gap-1 text-zinc-400"><div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-blue-500" />Insumos</div>
                        <div className="flex items-center gap-1 text-zinc-400"><div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-purple-500" />Operativo</div>
                        <div className="flex items-center gap-1 text-zinc-400"><div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500" />Ganancia</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Save Card */}
            <Card className="rounded-3xl">
              <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
                <h3 className="font-bold text-zinc-900 text-sm md:text-base">Guardar en Catálogo</h3>

                {/* ── COINCIDENCIA ENCONTRADA ── */}
                {matchingProducts.length > 0 && (
                  <div className="space-y-2 md:space-y-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 md:py-2 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={9} className="text-white" />
                      </div>
                      <p className="text-[10px] md:text-xs font-bold text-amber-700">
                        Coincidencia encontrada ({unitWeightGrams}g)
                      </p>
                    </div>

                    <div className="space-y-1.5 md:space-y-2">
                      {matchingProducts.map(p => (
                        <label
                          key={p.id}
                          className={`flex items-start gap-2 md:gap-3 p-2 md:p-3 rounded-xl border cursor-pointer transition-all ${
                            selectedProductId === p.id.toString()
                              ? 'border-amber-300 bg-amber-50'
                              : 'border-zinc-100 bg-zinc-50 hover:border-zinc-200'
                          }`}
                        >
                          <input
                            type="radio" name="saveMode"
                            checked={selectedProductId === p.id.toString()}
                            onChange={() => setSelectedProductId(p.id.toString())}
                            className="mt-0.5 text-amber-500 focus:ring-amber-500 shrink-0"
                          />
                          <div>
                            <p className="text-xs md:text-sm font-bold text-zinc-900">{p.name}</p>
                            <p className="text-[10px] md:text-xs text-zinc-400 mt-0.5">
                              Stock actual: {p.stock} + {Math.floor(calculatedUnits)} und
                            </p>
                          </div>
                        </label>
                      ))}

                      <label
                        className={`flex items-start gap-2 md:gap-3 p-2 md:p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedProductId === 'new'
                            ? 'border-amber-300 bg-amber-50'
                            : 'border-zinc-100 bg-zinc-50 hover:border-zinc-200'
                        }`}
                      >
                        <input
                          type="radio" name="saveMode"
                          checked={selectedProductId === 'new'}
                          onChange={() => setSelectedProductId('new')}
                          className="mt-0.5 text-amber-500 focus:ring-amber-500 shrink-0"
                        />
                        <div>
                          <p className="text-xs md:text-sm font-bold text-zinc-900">Crear como producto nuevo</p>
                          <p className="text-[10px] md:text-xs text-zinc-400 mt-0.5">Se generará una nueva entrada en el catálogo</p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* ── SIN COINCIDENCIA ── */}
                {matchingProducts.length === 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 md:py-2 bg-blue-50 border border-blue-100 rounded-xl">
                    <Plus size={12} className="text-blue-500 shrink-0" />
                    <p className="text-[10px] md:text-xs font-medium text-blue-600">
                      Nuevo peso detectado: se creará un producto nuevo.
                    </p>
                  </div>
                )}

                {/* Nombre — solo si es nuevo */}
                {selectedProductId === 'new' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                      Nombre del Producto
                    </label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="Ej. Manteca Premium 1kg"
                      className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs md:text-sm text-zinc-900 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
                    />
                  </div>
                )}

                {/* Notas */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                    Notas del lote (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej. Lote de temporada, proveedor distinto..."
                    rows={2}
                    className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs md:text-sm text-zinc-900 resize-none outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
                  />
                </div>

                <Button
                  onClick={handleSave}
                  disabled={suggestedPricePerUnit <= 0 || isSaving}
                  loading={isSaving}
                  icon={saveSuccess ? CheckCircle2 : Save}
                  className="w-full"
                  size="sm"
                >
                  {saveSuccess
                    ? '¡Lote registrado!'
                    : selectedProductId === 'new'
                    ? 'Crear Producto'
                    : 'Actualizar Producto'}
                </Button>
              </CardContent>
            </Card>

            {/* Historial de lotes */}
            {selectedProductId !== 'new' && (
              <Card className="rounded-3xl">
                <CardContent className="p-6">
                  <button
                    onClick={() => setShowHistory(h => !h)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <History size={18} className="text-amber-500" />
                      <h3 className="font-bold text-zinc-900">Historial de Lotes</h3>
                      {batches.length > 0 && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-xs font-bold rounded-full">
                          {batches.length}
                        </span>
                      )}
                    </div>
                    {showHistory ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
                  </button>

                  {showHistory && (
                    <div className="mt-4 space-y-3">
                      {loadingBatches ? (
                        <p className="text-sm text-zinc-400 text-center py-4">Cargando historial...</p>
                      ) : batches.length === 0 ? (
                        <p className="text-sm text-zinc-400 text-center py-4">Sin lotes registrados.</p>
                      ) : batches.map((batch) => (
                        <div key={batch.id} className="border border-zinc-100 rounded-2xl overflow-hidden">
                          {/* Batch header */}
                          <button
                            onClick={() => setExpandedBatchId(expandedBatchId === batch.id ? null : batch.id)}
                            className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xs font-black">
                                #{batch.id}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-zinc-900">
                                  {batch.units_produced} und · {batch.unit_weight_grams}g
                                </p>
                                <div className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5">
                                  <Clock size={10} />
                                  {new Date(batch.created_at).toLocaleDateString('es-PE', {
                                    day: '2-digit', month: 'short', year: 'numeric'
                                  })}
                                  {batch.created_by_name && ` · ${batch.created_by_name}`}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-zinc-900">S/ {Number(batch.price_per_unit).toFixed(2)}/und</p>
                              <p className="text-xs text-zinc-400">{batch.margin_percent}% margen</p>
                            </div>
                          </button>

                          {/* Batch detail */}
                          {expandedBatchId === batch.id && (
                            <div className="px-4 pb-4 space-y-3 border-t border-zinc-100 pt-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-zinc-50 rounded-xl p-3">
                                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Costo/und</p>
                                  <p className="text-base font-bold text-zinc-900">S/ {Number(batch.cost_per_unit).toFixed(2)}</p>
                                </div>
                                <div className="bg-zinc-50 rounded-xl p-3">
                                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Lote total</p>
                                  <p className="text-base font-bold text-zinc-900">S/ {Number(batch.total_batch_cost).toFixed(2)}</p>
                                </div>
                                <div className="bg-zinc-50 rounded-xl p-3">
                                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Rendimiento</p>
                                  <p className="text-base font-bold text-zinc-900">{batch.batch_yield_kg} kg</p>
                                </div>
                                <div className="bg-emerald-50 rounded-xl p-3">
                                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Ganancia/und</p>
                                  <p className="text-base font-bold text-emerald-700">
                                    S/ {(Number(batch.price_per_unit) - Number(batch.cost_per_unit)).toFixed(2)}
                                  </p>
                                </div>
                              </div>

                              {batch.ingredients_detail?.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Insumos</p>
                                  <div className="space-y-1">
                                    {batch.ingredients_detail.map((ing, i) => (
                                      <div key={i} className="flex justify-between text-xs text-zinc-600">
                                        <span>{ing.name || '—'}</span>
                                        <span className="font-medium">S/ {Number(ing.amount).toFixed(2)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {batch.operations_detail?.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Operativos</p>
                                  <div className="space-y-1">
                                    {batch.operations_detail.map((op, i) => (
                                      <div key={i} className="flex justify-between text-xs text-zinc-600">
                                        <span>{op.name || '—'}</span>
                                        <span className="font-medium">S/ {Number(op.amount).toFixed(2)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {batch.notes && (
                                <div className="bg-zinc-50 rounded-xl p-3">
                                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Notas</p>
                                  <p className="text-xs text-zinc-600 italic">{batch.notes}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>
      <Modal
  isOpen={isCreateModalOpen}
  onClose={() => setIsCreateModalOpen(false)}
  title="Detalles del Nuevo Producto"
  size="md"
  footer={
    <div className="flex gap-3">
      <Button variant="ghost" size="sm" onClick={() => setIsCreateModalOpen(false)}>
        Cancelar
      </Button>
      <Button
        size="sm"
        onClick={confirmCreateProduct}
        loading={isSaving}
        disabled={!productName || editablePrice <= 0}
        icon={Save}
      >
        Confirmar y Crear
      </Button>
    </div>
  }
>
  <div className="space-y-4">
    {/* Métricas del lote */}
    <div className="grid grid-cols-3 gap-3">
      <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
        <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider mb-1">Rendimiento Lote</p>
        <p className="text-base font-bold text-zinc-900">{batchYield}g</p>
      </div>
      <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
        <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider mb-1">Peso Unitario</p>
        <p className="text-base font-bold text-zinc-900">{unitWeightGrams}g</p>
      </div>
      <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
        <p className="text-amber-600 text-[10px] uppercase font-bold tracking-wider mb-1">Stock a Registrar</p>
        <p className="text-base font-bold text-amber-700">{Math.floor(calculatedUnits)} und</p>
      </div>
    </div>

    {/* Métricas de precio */}
    <div className="grid grid-cols-3 gap-3">
      <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
        <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider mb-1">Costo Unitario</p>
        <p className="text-base font-bold text-zinc-900">S/ {safe(costPerUnit).toFixed(2)}</p>
      </div>
      <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
        <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider mb-1">Sugerido ({margin}%)</p>
        <p className="text-base font-bold text-zinc-600">S/ {safe(suggestedPricePerUnit).toFixed(2)}</p>
      </div>
      <div className={`p-3 rounded-2xl border ${
        (editablePrice > 0 ? ((editablePrice - costPerUnit) / editablePrice) * 100 : 0) >= margin
          ? 'bg-emerald-50 border-emerald-100'
          : 'bg-amber-50 border-amber-100'
      }`}>
        <p className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${
          (editablePrice > 0 ? ((editablePrice - costPerUnit) / editablePrice) * 100 : 0) >= margin
            ? 'text-emerald-600' : 'text-amber-600'
        }`}>Margen Real</p>
        <p className={`text-base font-bold ${
          (editablePrice > 0 ? ((editablePrice - costPerUnit) / editablePrice) * 100 : 0) >= margin
            ? 'text-emerald-700' : 'text-amber-700'
        }`}>
          {(editablePrice > 0 ? ((editablePrice - costPerUnit) / editablePrice) * 100 : 0).toFixed(1)}%
        </p>
        <p className="text-[10px] text-zinc-400">Inicial: {initialRealMargin.toFixed(1)}%</p>
      </div>
    </div>

    {/* Formulario */}
    <Input
      label="Nombre del Producto"
      value={productName}
      onChange={(e) => setProductName(e.target.value)}
      placeholder="Ej. Manteca Premium 500g"
      icon={Package}
      size="sm"
    />
    <Input
      label="Precio de Venta Final"
      type="number"
      value={editablePrice || ''}
      onChange={(e) => setEditablePrice(Number(e.target.value))}
      placeholder="0.00"
      icon={DollarSign}
      size="sm"
    />
    <Input
      label="Descripción (Opcional)"
      value={newProductDescription}
      onChange={(e) => setNewProductDescription(e.target.value)}
      placeholder="Ej. Manteca de cerdo artesanal 100% pura"
      icon={FileText}
      size="sm"
    />
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
        Notas del lote (opcional)
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Ej. Lote de temporada, proveedor distinto..."
        rows={2}
        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 resize-none outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
      />
    </div>
  </div>
</Modal>
    </div>
  );
}