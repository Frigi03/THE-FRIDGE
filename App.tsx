
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  ChefHat, 
  LayoutGrid, 
  Users, 
  Package, 
  Trash2, 
  ChevronRight, 
  Utensils,
  Share2,
  Clock,
  Sparkles,
  X,
  PlusCircle,
  Camera
} from 'lucide-react';
import { Category, InventoryItem, Recipe, View } from './types';
import { suggestRecipesFromInventory, chatWithChef, identifyProductFromImage } from './services/claudeService';
import { getExpiryStatus, formatExpiryLabel, compareByExpiry } from './utils/expiry';
import { groupByCategory } from './utils/inventory';
import CameraCapture from './components/CameraCapture';

// Mock Initial Community Recipes
const MOCK_COMMUNITY: Recipe[] = [
  {
    id: 'c1',
    title: 'Pasta alla Carbonara Classica',
    description: 'La vera ricetta romana con pecorino romano e guanciale croccante.',
    ingredients: [
      { name: 'Pasta', amount: '320g' },
      { name: 'Guanciale', amount: '150g' },
      { name: 'Tuorli d\'uovo', amount: '6' },
      { name: 'Pecorino Romano', amount: '50g' }
    ],
    instructions: ['Rosolare il guanciale', 'Mescolare uova e formaggio', 'Cuocere la pasta', 'Amalgamare a fuoco spento'],
    prepTime: '20 min',
    servings: 4,
    author: 'Marco Rossi',
    image: 'https://picsum.photos/800/600?random=1',
    isPublic: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'c2',
    title: 'Risotto ai Funghi Porcini',
    description: 'Un cremoso risotto autunnale dal profumo intenso.',
    ingredients: [
      { name: 'Riso Carnaroli', amount: '300g' },
      { name: 'Funghi Porcini', amount: '200g' },
      { name: 'Brodo Vegetale', amount: '1L' }
    ],
    instructions: ['Tostare il riso', 'Aggiungere i funghi', 'Sfumare col vino', 'Mantecare con burro'],
    prepTime: '35 min',
    servings: 2,
    author: 'Elena Bianchi',
    image: 'https://picsum.photos/800/600?random=2',
    isPublic: true,
    createdAt: new Date().toISOString()
  }
];

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('inventory');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([]);
  const [communityRecipes, setCommunityRecipes] = useState<Recipe[]>(MOCK_COMMUNITY);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isCreateRecipeModalOpen, setIsCreateRecipeModalOpen] = useState(false);
  const [viewingRecipe, setViewingRecipe] = useState<Partial<Recipe> | null>(null);
  const [isChefLoading, setIsChefLoading] = useState(false);
  const [chefSuggestions, setChefSuggestions] = useState<Partial<Recipe>[]>([]);
  const [chefError, setChefError] = useState<string | null>(null);

  const expiringCount = useMemo(
    () => inventory.filter(item => {
      const status = getExpiryStatus(item.expiryDate);
      return status === 'expired' || status === 'soon';
    }).length,
    [inventory]
  );

  // Loading & LocalStorage
  useEffect(() => {
    const savedInventory = localStorage.getItem('gusto_inventory');
    const savedMyRecipes = localStorage.getItem('gusto_my_recipes');
    if (savedInventory) setInventory(JSON.parse(savedInventory));
    if (savedMyRecipes) setMyRecipes(JSON.parse(savedMyRecipes));
  }, []);

  useEffect(() => {
    localStorage.setItem('gusto_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('gusto_my_recipes', JSON.stringify(myRecipes));
  }, [myRecipes]);

  const addItem = (item: Omit<InventoryItem, 'id'>) => {
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
    setInventory(prev => [...prev, newItem]);
    setIsAddItemModalOpen(false);
  };

  const removeItem = (id: string) => {
    setInventory(prev => prev.filter(item => item.id !== id));
  };

  const publishRecipe = (recipe: Recipe) => {
    const updatedRecipe = { ...recipe, isPublic: true };
    setMyRecipes(prev => prev.map(r => r.id === recipe.id ? updatedRecipe : r));
    setCommunityRecipes(prev => [updatedRecipe, ...prev]);
  };

  const createRecipe = (recipe: Omit<Recipe, 'id' | 'author' | 'isPublic' | 'createdAt'>) => {
    const newRecipe: Recipe = {
      ...recipe,
      id: Math.random().toString(36).substr(2, 9),
      author: 'Tu',
      isPublic: false,
      createdAt: new Date().toISOString(),
    };
    setMyRecipes(prev => [newRecipe, ...prev]);
    setIsCreateRecipeModalOpen(false);
  };

  const handleSuggestRecipes = async () => {
    setIsChefLoading(true);
    setChefError(null);
    try {
      const suggestions = await suggestRecipesFromInventory(inventory);
      setChefSuggestions(suggestions);
    } catch (error) {
      console.error(error);
      setChefError('Non sono riuscito a generare ricette in questo momento. Riprova tra poco.');
    } finally {
      setIsChefLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 flex justify-around items-center z-50 md:relative md:flex-col md:w-24 md:border-t-0 md:border-r md:h-screen md:py-8">
        <NavIcon icon={<Package />} label="Dispensa" active={activeView === 'inventory'} onClick={() => setActiveView('inventory')} />
        <NavIcon icon={<LayoutGrid />} label="Scopri" active={activeView === 'discover'} onClick={() => setActiveView('discover')} />
        <NavIcon icon={<ChefHat />} label="Chef AI" active={activeView === 'chef'} onClick={() => setActiveView('chef')} />
        <NavIcon icon={<Users />} label="Community" active={activeView === 'community'} onClick={() => setActiveView('community')} />
        <NavIcon icon={<Utensils />} label="Miei Piatti" active={activeView === 'my-recipes'} onClick={() => setActiveView('my-recipes')} />
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 mb-20 md:mb-0 overflow-y-auto max-w-6xl mx-auto w-full">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {activeView === 'inventory' && 'La Tua Dispensa'}
              {activeView === 'discover' && 'Cosa cuciniamo oggi?'}
              {activeView === 'chef' && 'Lo Chef AI di Gusto'}
              {activeView === 'community' && 'Cucina Condivisa'}
              {activeView === 'my-recipes' && 'Ricettario Personale'}
            </h1>
            <p className="text-slate-500 mt-1">
              {activeView === 'inventory' && (
                expiringCount > 0
                  ? `${inventory.length} prodotti · ${expiringCount} in scadenza`
                  : `${inventory.length} prodotti in inventario`
              )}
              {activeView === 'chef' && 'Suggerimenti basati su ciò che hai'}
            </p>
          </div>
          {activeView === 'inventory' && (
            <button
              onClick={() => setIsAddItemModalOpen(true)}
              aria-label="Aggiungi prodotto"
              className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-2xl shadow-lg transition-all flex items-center gap-2"
            >
              <Plus size={20} />
              <span className="hidden sm:inline font-medium">Aggiungi</span>
            </button>
          )}
          {activeView === 'my-recipes' && (
            <button
              onClick={() => setIsCreateRecipeModalOpen(true)}
              aria-label="Crea nuova ricetta"
              className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-2xl shadow-lg transition-all flex items-center gap-2"
            >
              <PlusCircle size={20} />
              <span className="hidden sm:inline font-medium">Crea Ricetta</span>
            </button>
          )}
        </header>

        {/* Views */}
        <div className="space-y-6">
          {activeView === 'inventory' && (
            <InventoryGrid inventory={inventory} onRemove={removeItem} />
          )}

          {activeView === 'discover' && (
            <div className="space-y-6">
               <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 flex flex-col items-center text-center">
                  <ChefHat className="text-orange-500 mb-4" size={48} />
                  <h2 className="text-xl font-bold text-orange-900 mb-2">Lasciati Ispirare</h2>
                  <p className="text-orange-700 max-w-md mb-6">Analizziamo la tua dispensa per proporti ricette intelligenti che riducono gli sprechi.</p>
                  <button 
                    onClick={() => { setActiveView('chef'); handleSuggestRecipes(); }}
                    className="bg-orange-500 text-white px-8 py-3 rounded-full font-bold shadow-md hover:scale-105 transition-transform"
                  >
                    Genera Ricette AI
                  </button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {communityRecipes.slice(0, 3).map(recipe => (
                   <RecipeCard key={recipe.id} recipe={recipe} onViewDetails={setViewingRecipe} />
                 ))}
               </div>
            </div>
          )}

          {activeView === 'chef' && (
            <ChefView
              inventory={inventory}
              suggestions={chefSuggestions}
              isLoading={isChefLoading}
              error={chefError}
              onRegenerate={handleSuggestRecipes}
              onViewDetails={setViewingRecipe}
            />
          )}

          {activeView === 'community' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communityRecipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} isCommunity onViewDetails={setViewingRecipe} />
              ))}
            </div>
          )}

          {activeView === 'my-recipes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myRecipes.length === 0 ? (
                <div className="col-span-full py-20 text-center">
                  <Utensils className="mx-auto text-slate-300 mb-4" size={64} />
                  <p className="text-slate-500">Non hai ancora creato nessuna ricetta.</p>
                </div>
              ) : (
                myRecipes.map(recipe => (
                  <RecipeCard key={recipe.id} recipe={recipe} onPublish={publishRecipe} onViewDetails={setViewingRecipe} />
                ))
              )}
            </div>
          )}
        </div>

        {/* Add Item Modal */}
        {isAddItemModalOpen && (
          <AddItemModal onClose={() => setIsAddItemModalOpen(false)} onAdd={addItem} />
        )}

        {/* Create Recipe Modal */}
        {isCreateRecipeModalOpen && (
          <CreateRecipeModal onClose={() => setIsCreateRecipeModalOpen(false)} onCreate={createRecipe} />
        )}

        {/* Recipe Detail Modal */}
        {viewingRecipe && (
          <RecipeDetailModal recipe={viewingRecipe} onClose={() => setViewingRecipe(null)} />
        )}
      </main>
    </div>
  );
};

const NavIcon: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
  >
    <div className={`p-2 rounded-xl ${active ? 'bg-orange-100' : 'bg-transparent'}`}>
      {icon}
    </div>
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

const InventoryGrid: React.FC<{ inventory: InventoryItem[], onRemove: (id: string) => void }> = ({ inventory, onRemove }) => {
  if (inventory.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-300">
        <Package className="text-slate-300 mb-4" size={64} />
        <h3 className="text-xl font-semibold text-slate-900">Dispensa Vuota</h3>
        <p className="text-slate-500">Inizia aggiungendo gli ingredienti che hai in casa.</p>
      </div>
    );
  }

  const grouped = groupByCategory(inventory);

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([category, items]) => (
        <section key={category}>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            {category}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Explicitly cast items to InventoryItem[] to ensure .map is available and correctly typed. */}
            {(items as InventoryItem[]).slice().sort(compareByExpiry).map(item => {
              const status = getExpiryStatus(item.expiryDate);
              return (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center group hover:shadow-md transition-all">
                  <div>
                    <h4 className="font-semibold text-slate-800">{item.name}</h4>
                    <p className="text-sm text-slate-500">{item.quantity} {item.unit}</p>
                    {item.expiryDate && (
                      <span className={`inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        status === 'expired' ? 'bg-red-100 text-red-700' :
                        status === 'soon' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {formatExpiryLabel(item.expiryDate)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onRemove(item.id)}
                    aria-label={`Rimuovi ${item.name} dalla dispensa`}
                    className="text-slate-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

const AddItemModal: React.FC<{ onClose: () => void, onAdd: (item: Omit<InventoryItem, 'id'>) => void }> = ({ onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('pz');
  const [category, setCategory] = useState<Category>(Category.PANTRY);
  const [expiryDate, setExpiryDate] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const handleCapture = async (base64: string, mediaType: string) => {
    setIsScanning(true);
    setScanError(null);
    try {
      const result = await identifyProductFromImage(base64, mediaType);
      if (!result) {
        setScanError('Non sono riuscito a riconoscere il prodotto. Riprova o inseriscilo manualmente.');
        return;
      }
      setName(result.name);
      setCategory(result.category);
      setUnit(result.unit);
      setQuantity(result.quantity);
      setIsCameraOpen(false);
    } catch (e) {
      console.error(e);
      setScanError('Errore durante il riconoscimento. Riprova o inseriscilo manualmente.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Aggiungi Prodotto</h3>
          <button onClick={onClose} aria-label="Chiudi" className="p-2 hover:bg-slate-100 rounded-full">
            <X size={24} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => { setScanError(null); setIsCameraOpen(true); }}
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mb-4"
        >
          <Camera size={18} />
          Scansiona con Fotocamera
        </button>
        {isCameraOpen && (
          <CameraCapture
            onClose={() => setIsCameraOpen(false)}
            onCapture={handleCapture}
            isProcessing={isScanning}
            error={scanError}
          />
        )}
        <form onSubmit={(e) => { e.preventDefault(); onAdd({ name, quantity, unit, category, expiryDate: expiryDate || undefined }); }} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nome Prodotto</label>
            <input
              autoFocus
              required
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="es. Pasta, Latte, Sale..."
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-700 mb-1">Quantità</label>
              <input 
                type="number"
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none" 
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-700 mb-1">Unità</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none"
                value={unit}
                onChange={e => setUnit(e.target.value)}
              >
                <option value="pz">Pezzi</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">Litri</option>
                <option value="ml">ml</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Categoria</label>
            <select
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none"
              value={category}
              onChange={e => setCategory(e.target.value as Category)}
            >
              {Object.values(Category).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Data di scadenza (opzionale)</label>
            <input
              type="date"
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-orange-600 transition-colors mt-4"
          >
            Aggiungi alla Dispensa
          </button>
        </form>
      </div>
    </div>
  );
};

const RecipeCard: React.FC<{ recipe: Partial<Recipe>, isCommunity?: boolean, onPublish?: (r: Recipe) => void, onViewDetails?: (r: Partial<Recipe>) => void }> = ({ recipe, isCommunity, onPublish, onViewDetails }) => (
  <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col">
    <div className="h-48 relative">
      <img
        src={recipe.image || `https://picsum.photos/800/600?random=${recipe.id || Math.random()}`}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        alt={recipe.title || 'Foto ricetta'}
      />
      <div className="absolute inset-0 recipe-card-gradient flex flex-col justify-end p-4">
        <h4 className="text-white font-bold text-xl drop-shadow-md">{recipe.title}</h4>
        <div className="flex items-center gap-3 text-white/90 text-xs mt-1">
          <span className="flex items-center gap-1"><Clock size={12}/> {recipe.prepTime}</span>
          <span className="flex items-center gap-1"><Utensils size={12}/> {recipe.servings} porz.</span>
        </div>
      </div>
    </div>
    <div className="p-4 flex-1 flex flex-col">
      <p className="text-sm text-slate-600 line-clamp-2 mb-4">{recipe.description}</p>
      <div className="mt-auto flex justify-between items-center">
        {isCommunity && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-[10px] font-bold text-orange-600 uppercase">
              {recipe.author?.charAt(0) || 'G'}
            </div>
            <span className="text-xs text-slate-500 font-medium">{recipe.author || 'Gusto AI'}</span>
          </div>
        )}
        {!isCommunity && !recipe.isPublic && onPublish && (
          <button 
            onClick={() => onPublish(recipe as Recipe)}
            className="text-orange-500 text-xs font-bold flex items-center gap-1 hover:underline"
          >
            <Share2 size={14} /> Pubblica
          </button>
        )}
        <button
          onClick={() => onViewDetails?.(recipe)}
          aria-label="Vedi dettagli ricetta"
          className="bg-slate-100 p-2 rounded-xl text-slate-600 hover:bg-orange-100 hover:text-orange-600 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  </div>
);

const RecipeDetailModal: React.FC<{ recipe: Partial<Recipe>, onClose: () => void }> = ({ recipe, onClose }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
      <div className="h-56 relative">
        <img
          src={recipe.image || `https://picsum.photos/800/600?random=${recipe.id || Math.random()}`}
          className="w-full h-full object-cover"
          alt={recipe.title || 'Foto ricetta'}
        />
        <div className="absolute inset-0 recipe-card-gradient flex flex-col justify-end p-6">
          <h3 className="text-white font-bold text-2xl drop-shadow-md">{recipe.title}</h3>
          <div className="flex items-center gap-3 text-white/90 text-sm mt-1">
            <span className="flex items-center gap-1"><Clock size={14}/> {recipe.prepTime}</span>
            <span className="flex items-center gap-1"><Utensils size={14}/> {recipe.servings} porz.</span>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Chiudi dettagli ricetta"
          className="absolute top-4 right-4 bg-white/90 p-2 rounded-full hover:bg-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      <div className="p-6 space-y-6">
        {recipe.description && <p className="text-slate-600">{recipe.description}</p>}

        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div>
            <h4 className="font-bold text-slate-800 mb-2">Ingredienti</h4>
            <ul className="space-y-1">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="text-sm text-slate-600 flex justify-between border-b border-slate-100 py-1.5">
                  <span>{ing.name}</span>
                  <span className="text-slate-400">{ing.amount}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {recipe.instructions && recipe.instructions.length > 0 && (
          <div>
            <h4 className="font-bold text-slate-800 mb-2">Preparazione</h4>
            <ol className="space-y-3">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-600">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center">{i + 1}</span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  </div>
);

const CreateRecipeModal: React.FC<{ onClose: () => void, onCreate: (recipe: Omit<Recipe, 'id' | 'author' | 'isPublic' | 'createdAt'>) => void }> = ({ onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [servings, setServings] = useState(2);
  const [ingredients, setIngredients] = useState<{ name: string, amount: string }[]>([{ name: '', amount: '' }]);
  const [instructions, setInstructions] = useState<string[]>(['']);

  const updateIngredient = (idx: number, field: 'name' | 'amount', value: string) => {
    setIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing));
  };

  const updateInstruction = (idx: number, value: string) => {
    setInstructions(prev => prev.map((step, i) => i === idx ? value : step));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      title,
      description,
      prepTime,
      servings,
      ingredients: ingredients.filter(ing => ing.name.trim()),
      instructions: instructions.filter(step => step.trim()),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Crea Ricetta</h3>
          <button onClick={onClose} aria-label="Chiudi" className="p-2 hover:bg-slate-100 rounded-full">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Titolo</label>
            <input
              autoFocus
              required
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="es. Pasta al pomodoro"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Descrizione</label>
            <textarea
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none resize-none"
              rows={2}
              placeholder="Una breve descrizione del piatto"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-700 mb-1">Tempo di preparazione</label>
              <input
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none"
                placeholder="es. 20 min"
                value={prepTime}
                onChange={e => setPrepTime(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-700 mb-1">Porzioni</label>
              <input
                type="number"
                min={1}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none"
                value={servings}
                onChange={e => setServings(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Ingredienti</label>
            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="flex-1 bg-slate-50 border border-slate-200 p-2 rounded-xl outline-none text-sm"
                    placeholder="Nome"
                    value={ing.name}
                    onChange={e => updateIngredient(i, 'name', e.target.value)}
                  />
                  <input
                    className="w-24 bg-slate-50 border border-slate-200 p-2 rounded-xl outline-none text-sm"
                    placeholder="Quantità"
                    value={ing.amount}
                    onChange={e => updateIngredient(i, 'amount', e.target.value)}
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIngredients(prev => [...prev, { name: '', amount: '' }])}
              className="text-orange-500 text-xs font-bold mt-2 hover:underline"
            >
              + Aggiungi ingrediente
            </button>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Preparazione</label>
            <div className="space-y-2">
              {instructions.map((step, i) => (
                <input
                  key={i}
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl outline-none text-sm"
                  placeholder={`Passo ${i + 1}`}
                  value={step}
                  onChange={e => updateInstruction(i, e.target.value)}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setInstructions(prev => [...prev, ''])}
              className="text-orange-500 text-xs font-bold mt-2 hover:underline"
            >
              + Aggiungi passo
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-orange-600 transition-colors mt-4"
          >
            Salva Ricetta
          </button>
        </form>
      </div>
    </div>
  );
};

const ChefView: React.FC<{
  inventory: InventoryItem[],
  suggestions: Partial<Recipe>[],
  isLoading: boolean,
  error: string | null,
  onRegenerate: () => void,
  onViewDetails: (r: Partial<Recipe>) => void
}> = ({ inventory, suggestions, isLoading, error, onRegenerate, onViewDetails }) => {
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const sendMessage = async () => {
    if (!input.trim() || isChatting) return;
    const userMsg = input;
    setInput('');
    setChatError(null);
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatting(true);

    try {
      const response = await chatWithChef(chatHistory, userMsg, inventory);
      if (response) {
        setChatHistory(prev => [...prev, { role: 'model', text: response }]);
      }
    } catch (e) {
      console.error(e);
      setChatError('Lo chef non è riuscito a risponderti. Riprova tra poco.');
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Recipe Suggestions Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="text-orange-500" size={24} />
            Ricette Suggerite
          </h3>
          <button
            onClick={onRegenerate}
            disabled={isLoading}
            className="text-sm font-bold text-orange-600 hover:underline disabled:opacity-50"
          >
            {isLoading ? 'Analizzando...' : 'Rigenera'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-slate-100 h-64 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : suggestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestions.map((recipe, idx) => (
              <RecipeCard key={idx} recipe={recipe} onViewDetails={onViewDetails} />
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl text-center border border-slate-100 shadow-sm">
            <ChefHat size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">Aggiungi ingredienti in dispensa e chiedi consiglio allo chef!</p>
          </div>
        )}
      </section>

      {/* Chat Section */}
      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[500px]">
        <div className="bg-slate-50 p-4 border-b border-slate-100">
          <h3 className="font-bold flex items-center gap-2">
            <ChefHat size={20} className="text-orange-500" />
            Chiedi allo Chef
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.length === 0 && (
            <div className="text-center py-10 opacity-50 italic text-slate-500">
              "Chef, ho della pasta e dei pomodorini, cosa posso inventare?"
            </div>
          )}
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-orange-500 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isChatting && (
            <div className="flex justify-start">
              <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none animate-pulse text-slate-400">
                Lo chef sta scrivendo...
              </div>
            </div>
          )}
          {chatError && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl">
              {chatError}
            </div>
          )}
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
          <input
            aria-label="Scrivi un messaggio allo chef"
            disabled={isChatting}
            className="flex-1 bg-white border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition-all disabled:opacity-50"
            placeholder="Chiedi una variante, un consiglio tecnico o un menù..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={sendMessage}
            disabled={isChatting}
            aria-label="Invia messaggio"
            className="bg-orange-500 text-white p-3 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </section>
    </div>
  );
};

export default App;
