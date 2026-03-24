import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, DollarSign, Percent, TrendingUp, Save, Plus, Trash2, Scale, CheckCircle2, Package, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { api } from '../services/api';
import { Product } from '../types';

interface CostItem {
  id: string;
  name: string;
  amount: number;
}

export default function Pricing() {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState<CostItem[]>([
    { id: '1', name: 'Grasa de cerdo en rama', amount: 0 }
  ]);
  const [operations, setOperations] = useState<CostItem[]>([
    { id: '1', name: 'Gas / Electricidad', amount: 0 },
    { id: '2', name: 'Empaque y etiquetas', amount: 0 }
  ]);
  
  const [batchYield, setBatchYield] = useState<number>(1); // kg
  const [unitWeightGrams, setUnitWeightGrams] = useState<number>(500); // grams
  const [margin, setMargin] = useState<number>(30); // %
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [productName, setProductName] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('new');

  useEffect(() => {
    api.getAllProducts()
      .then(setProducts)
      .catch(err => {
        console.error(err);
        setProducts([]);
      });
  }, []);

  useEffect(() => {
    if (selectedProductId !== 'new') {
      const stillMatches = products.some(p => (p.id || '').toString() === selectedProductId && p.description.includes(`${unitWeightGrams}g`));
      if (!stillMatches) {
        setSelectedProductId('new');
      }
    }
  }, [unitWeightGrams, products, selectedProductId]);

  const addIngredient = () => {
    setIngredients([...ingredients, { id: Math.random().toString(), name: '', amount: 0 }]);
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter(i => i.id !== id));
  };

  const updateIngredient = (id: string, field: keyof CostItem, value: string | number) => {
    setIngredients(ingredients.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const addOperation = () => {
    setOperations([...operations, { id: Math.random().toString(), name: '', amount: 0 }]);
  };

  const removeOperation = (id: string) => {
    setOperations(operations.filter(o => o.id !== id));
  };

  const updateOperation = (id: string, field: keyof CostItem, value: string | number) => {
    setOperations(operations.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  // Calculations
  const totalIngredients = ingredients.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalOperations = operations.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalBatchCost = totalIngredients + totalOperations;
  
  const costPerKg = batchYield > 0 ? totalBatchCost / batchYield : 0;
  const suggestedPricePerKg = margin < 100 ? costPerKg / (1 - (Number(margin) / 100)) : 0;
  const profitPerKg = suggestedPricePerKg - costPerKg;

  const calculatedUnits = (batchYield > 0 && unitWeightGrams > 0) ? (batchYield * 1000) / unitWeightGrams : 0;
  const costPerUnit = calculatedUnits > 0 ? totalBatchCost / calculatedUnits : 0;
  const suggestedPricePerUnit = margin < 100 ? costPerUnit / (1 - (Number(margin) / 100)) : 0;
  const profitPerUnit = suggestedPricePerUnit - costPerUnit;

  // Breakdown percentages for visual bar
  const ingPct = suggestedPricePerKg > 0 ? ((totalIngredients / batchYield) / suggestedPricePerKg) * 100 : 0;
  const opPct = suggestedPricePerKg > 0 ? ((totalOperations / batchYield) / suggestedPricePerKg) * 100 : 0;
  const profPct = suggestedPricePerKg > 0 ? (profitPerKg / suggestedPricePerKg) * 100 : 0;

  const matchingProducts = products.filter(p => p.description.includes(`${unitWeightGrams}g`));

  const handleSaveProduct = async () => {
    if (selectedProductId === 'new' && !productName) return;
    if (suggestedPricePerUnit <= 0) return;
    
    setIsSaving(true);
    try {
      const unitsToAdd = Math.floor(calculatedUnits);

      if (selectedProductId === 'new') {
        await api.createProduct({
          name: productName,
          description: `Producto de ${unitWeightGrams}g calculado con margen del ${margin}%`,
          price: Number((suggestedPricePerUnit || 0).toFixed(2)),
          cost: Number((costPerUnit || 0).toFixed(2)),
          stock: unitsToAdd
        });
        
        setSaveSuccess(true);
        setProductName('');
        setTimeout(() => setSaveSuccess(false), 3000);
        api.getAllProducts().then(setProducts);
      } else {
        const existingProduct = products.find(p => (p.id || '').toString() === selectedProductId);
        if (!existingProduct) return;

        await api.updateProduct(existingProduct.id, {
          ...existingProduct,
          price: Number((suggestedPricePerUnit || 0).toFixed(2)),
          cost: Number((costPerUnit || 0).toFixed(2)),
          stock: existingProduct.stock + unitsToAdd,
          description: `Producto de ${unitWeightGrams}g calculado con margen del ${margin}%`
        });

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        api.getAllProducts().then(setProducts);
      }
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost"
          size="sm"
          onClick={() => navigate('/products')}
          icon={ArrowLeft}
          className="text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
        />
        <PageHeader 
          title="Calculadora de Precios"
          subtitle="Costeo detallado por lote y cálculo de rentabilidad"
          className="mb-0"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Column: Inputs */}
        <div className="xl:col-span-7 space-y-6">
          
          {/* Materia Prima */}
          <Card className="rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                    <Package size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900">Materia Prima (Lote)</h2>
                </div>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={addIngredient}
                  icon={Plus}
                  className="text-amber-600 hover:text-amber-700 bg-amber-50"
                >
                  Agregar
                </Button>
              </div>

              <div className="space-y-4">
                {ingredients.map((item) => (
              <div className="grid grid-cols-2 sm:flex gap-3 items-start sm:items-center p-3 sm:p-0 bg-zinc-50 sm:bg-transparent rounded-2xl sm:rounded-none">
                <div className="col-span-2 sm:flex-1 w-full">
                  <Input
                    value={item.name}
                    onChange={(e) => updateIngredient(item.id, 'name', e.target.value)}
                    placeholder="Ej. Grasa de cerdo"
                    label="Insumo"
                    className="sm:label-hidden"
                  />
                </div>
                <div className="w-full sm:w-32">
                  <Input
                    type="number"
                    value={item.amount || ''}
                    onChange={(e) => updateIngredient(item.id, 'amount', Number(e.target.value))}
                    placeholder="0.00"
                    icon={DollarSign}
                    label="Costo"
                    className="sm:label-hidden"
                  />
                </div>
                <div className="flex items-end justify-end h-full sm:h-auto pb-1 sm:pb-0">
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => removeIngredient(item.id)}
                    icon={Trash2}
                    className="text-zinc-400 hover:text-red-500 hover:bg-red-50"
                  />
                </div>
              </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-100 flex justify-between items-center text-sm">
                <span className="font-medium text-zinc-500">Subtotal Materia Prima:</span>
                <span className="font-bold text-zinc-900">S/ {(totalIngredients || 0).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Costos Operativos */}
          <Card className="rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                    <Calculator size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900">Costos Operativos (Lote)</h2>
                </div>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={addOperation}
                  icon={Plus}
                  className="text-amber-600 hover:text-amber-700 bg-amber-50"
                >
                  Agregar
                </Button>
              </div>

              <div className="space-y-4">
                {operations.map((item) => (
                  <div key={item.id} className="grid grid-cols-2 sm:flex gap-3 items-start sm:items-center p-3 sm:p-0 bg-zinc-50 sm:bg-transparent rounded-2xl sm:rounded-none">
                <div className="col-span-2 sm:flex-1 w-full">
                  <Input
                    value={item.name}
                    onChange={(e) => updateOperation(item.id, 'name', e.target.value)}
                    placeholder="Ej. Empaque"
                    label="Operación"
                    className="sm:label-hidden"
                  />
                </div>
                <div className="w-full sm:w-32">
                  <Input
                    type="number"
                    value={item.amount || ''}
                    onChange={(e) => updateOperation(item.id, 'amount', Number(e.target.value))}
                    placeholder="0.00"
                    icon={DollarSign}
                    label="Costo"
                    className="sm:label-hidden"
                  />
                </div>
                <div className="flex items-end justify-end h-full sm:h-auto pb-1 sm:pb-0">
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOperation(item.id)}
                    icon={Trash2}
                    className="text-zinc-400 hover:text-red-500 hover:bg-red-50"
                  />
                </div>
              </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-100 flex justify-between items-center text-sm">
                <span className="font-medium text-zinc-500">Subtotal Operativo:</span>
                <span className="font-bold text-zinc-900">S/ {(totalOperations || 0).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
 
          {/* Rendimiento y Margen */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <Card className="rounded-2xl md:rounded-3xl">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                  <div className="p-2 md:p-2.5 bg-blue-50 text-blue-600 rounded-lg md:rounded-xl">
                    <Scale size={16} className="md:hidden" />
                    <Scale size={20} className="hidden md:block" />
                  </div>
                  <h2 className="font-bold text-zinc-900 text-xs md:text-base">Rendimiento</h2>
                </div>
                <Input
                  label="Kilos por lote"
                  type="number"
                  value={batchYield || ''}
                  onChange={(e) => setBatchYield(Number(e.target.value))}
                  placeholder="1"
                  suffix="kg"
                  size="sm"
                />
              </CardContent>
            </Card>
 
            <Card className="rounded-2xl md:rounded-3xl">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                  <div className="p-2 md:p-2.5 bg-indigo-50 text-indigo-600 rounded-lg md:rounded-xl">
                    <Package size={16} className="md:hidden" />
                    <Package size={20} className="hidden md:block" />
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
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                  <div className="p-2 md:p-2.5 bg-emerald-50 text-emerald-600 rounded-lg md:rounded-xl">
                    <Percent size={16} className="md:hidden" />
                    <Percent size={20} className="hidden md:block" />
                  </div>
                  <h2 className="font-bold text-zinc-900 text-xs md:text-base">Margen Deseado</h2>
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
 
        {/* Right Column: Results & Save */}
        <div className="xl:col-span-5">
          <div className="sticky top-8 space-y-6">
            
            {/* Results Card */}
            <div className="bg-zinc-900 p-5 md:p-8 rounded-3xl shadow-xl border border-zinc-800 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <TrendingUp size={160} />
              </div>
              
              <div className="relative z-10">
                <h2 className="text-xl font-bold text-amber-400 mb-6 md:mb-8">Análisis de Rentabilidad</h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 border-b border-zinc-800 pb-4">
                    <div>
                      <p className="text-zinc-400 text-xs md:text-sm mb-1">Costo (1 kg)</p>
                      <p className="text-xl md:text-2xl font-medium text-zinc-300">S/ {(isFinite(costPerKg) && costPerKg !== null) ? costPerKg.toFixed(2) : '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400 text-xs md:text-sm mb-1">Costo (1 und)</p>
                      <p className="text-xl md:text-2xl font-medium text-zinc-300">S/ {(isFinite(costPerUnit) && costPerUnit !== null) ? costPerUnit.toFixed(2) : '0.00'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-b border-zinc-800 pb-4">
                    <div>
                      <p className="text-zinc-400 text-xs md:text-sm mb-1">Ganancia (1 kg)</p>
                      <p className="text-xl md:text-2xl font-medium text-emerald-400">S/ {(isFinite(profitPerKg) && profitPerKg !== null) ? profitPerKg.toFixed(2) : '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400 text-xs md:text-sm mb-1">Ganancia (1 und)</p>
                      <p className="text-xl md:text-2xl font-medium text-emerald-400">S/ {(isFinite(profitPerUnit) && profitPerUnit !== null) ? profitPerUnit.toFixed(2) : '0.00'}</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-4">
                    <div>
                      <p className="text-zinc-400 text-xs md:text-sm mb-2 uppercase tracking-wider font-bold">Precio Sugerido (Kg)</p>
                      <p className="text-3xl md:text-4xl font-black text-white tracking-tight">
                        S/ {(isFinite(suggestedPricePerKg) && suggestedPricePerKg !== null) ? suggestedPricePerKg.toFixed(2) : '0.00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-400 text-xs md:text-sm mb-2 uppercase tracking-wider font-bold">Precio Sugerido (Und)</p>
                      <p className="text-3xl md:text-4xl font-black text-white tracking-tight">
                        S/ {(isFinite(suggestedPricePerUnit) && suggestedPricePerUnit !== null) ? suggestedPricePerUnit.toFixed(2) : '0.00'}
                      </p>
                    </div>
                  </div>

                  {/* Visual Breakdown Bar */}
                  {suggestedPricePerKg > 0 && isFinite(suggestedPricePerKg) && (
                    <div className="pt-6">
                      <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">Composición del Precio</p>
                      <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                        <div style={{ width: `${ingPct}%` }} className="bg-blue-500" title="Materia Prima"></div>
                        <div style={{ width: `${opPct}%` }} className="bg-purple-500" title="Operativo"></div>
                        <div style={{ width: `${profPct}%` }} className="bg-emerald-500" title="Ganancia"></div>
                      </div>
                      <div className="flex justify-between mt-3 text-xs font-medium">
                        <div className="flex items-center gap-1.5 text-zinc-400"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Insumos</div>
                        <div className="flex items-center gap-1.5 text-zinc-400"><div className="w-2 h-2 rounded-full bg-purple-500"></div>Operativo</div>
                        <div className="flex items-center gap-1.5 text-zinc-400"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Ganancia</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Save Product Form */}
            <Card className="rounded-3xl">
              <CardContent className="p-6">
                <h3 className="font-bold text-zinc-900 mb-4">Guardar en Catálogo</h3>
                <div className="space-y-4">
                  
                  {matchingProducts.length > 0 && (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                      <p className="text-sm text-amber-800 font-medium mb-3">
                        Se encontraron productos de {unitWeightGrams}g:
                      </p>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                          <input 
                            type="radio" 
                            name="saveMode" 
                            checked={selectedProductId === 'new'} 
                            onChange={() => setSelectedProductId('new')}
                            className="text-amber-500 focus:ring-amber-500"
                          />
                          Crear nuevo producto
                        </label>
                        {matchingProducts.map(p => (
                          <label key={p.id} className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                            <input 
                              type="radio" 
                              name="saveMode" 
                              checked={selectedProductId === (p.id || '').toString()} 
                              onChange={() => setSelectedProductId((p.id || '').toString())}
                              className="text-amber-500 focus:ring-amber-500"
                            />
                            Actualizar "{p.name}" (+{Math.floor(calculatedUnits)} und)
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProductId === 'new' && (
                    <Input
                      label="Nombre del Producto"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="Ej. Manteca Premium 1kg"
                    />
                  )}

                  <Button 
                    onClick={handleSaveProduct}
                    disabled={(selectedProductId === 'new' && !productName) || suggestedPricePerUnit <= 0 || isSaving}
                    loading={isSaving}
                    icon={saveSuccess ? CheckCircle2 : Save}
                    className="w-full"
                  >
                    {saveSuccess ? '¡Guardado exitosamente!' : (selectedProductId === 'new' ? 'Crear Producto' : 'Actualizar Producto')}
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
