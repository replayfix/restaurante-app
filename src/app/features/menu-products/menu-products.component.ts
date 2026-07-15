import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestaurantService } from '../../core/services/restaurant.service';
import { NotificationModalService } from '../../core/services/notification-modal.service';
import { Product, Category } from '../../core/models';

@Component({
  selector: 'app-menu-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="menu-page animate-fade-in">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">🍔 Catálogo de Menú y Productos</h2>
          <p class="page-subtitle">Administración de platillos, precios (S/.), stock en tiempo real y categorías en Firestore</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="showCategoryModal.set(true)">
            <span>📁 + Nueva Categoría</span>
          </button>
          <button class="btn btn-primary" (click)="openProductModal()">
            <span>✨ + Nuevo Platillo / Producto</span>
          </button>
        </div>
      </div>

      <!-- Categories Filter Tabs -->
      <div class="categories-bar card">
        <div class="tabs-list">
          <button 
            class="cat-tab" 
            [class.active]="selectedCat() === 'all'" 
            (click)="selectedCat.set('all')">
            <span>🌟</span> Todos ({{ products().length }})
          </button>
          @for (cat of categories(); track cat.id) {
            <div class="cat-tab-wrapper" [class.active]="selectedCat() === cat.id">
              <button class="cat-tab inner-btn" (click)="selectedCat.set(cat.id)">
                <span>{{ getCategoryIcon(cat) }}</span> {{ cat.name }} ({{ getProductCountByCat(cat.id) }})
              </button>
              @if (categories().length > 1) {
                <button class="del-cat-btn" title="Eliminar categoría" (click)="deleteCategory(cat.id, $event)">✖</button>
              }
            </div>
          }
        </div>

        <div class="search-box">
          <input 
            type="text" 
            [ngModel]="searchQuery()" 
            (ngModelChange)="searchQuery.set($event)"
            placeholder="🔍 Buscar por nombre, código o ingrediente..."
            class="search-input" />
        </div>
      </div>

      <!-- Products Grid -->
      <div class="products-grid">
        @for (prod of filteredProducts(); track prod.id) {
          <div class="product-card card animate-fade-in">
            <!-- Product Image / Header -->
            <div class="prod-image-wrapper">
              @if ((prod.imageUrl || prod.image) && !brokenImages().has(prod.id)) {
                <img [src]="prod.imageUrl || prod.image" [alt]="prod.name" class="prod-img" (error)="onImageError(prod.id)" />
              } @else {
                <div class="prod-emoji-placeholder plate-bg">
                  <svg class="plate-illustration" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 22V42C18 45.3 20.7 48 24 48V76C24 77.7 25.3 79 27 79C28.7 79 30 77.7 30 76V48C33.3 48 36 45.3 36 42V22H32.5V36H29V22H25.5V36H22V22H18Z" fill="#475569"/>
                    <circle cx="62" cy="50" r="30" fill="#F1F5F9" stroke="#334155" stroke-width="4.5"/>
                    <circle cx="62" cy="50" r="19" fill="#CBD5E1" stroke="#334155" stroke-width="2.5"/>
                    <path d="M92 22C92 22 84 28 84 44V76C84 77.7 85.3 79 87 79C88.7 79 90 77.7 90 76V22H92Z" fill="#475569"/>
                  </svg>
                </div>
              }
              <span class="cat-pill">{{ getCategoryName(prod.categoryId) }}</span>
              <div class="price-tag">S/. {{ prod.price.toFixed(2) }}</div>
            </div>

            <!-- Product Info -->
            <div class="prod-body">
              <div class="prod-header">
                <h3 class="prod-title">{{ prod.name }}</h3>
                <span class="barcode-badge font-mono">{{ prod.barcode || prod.id.slice(-5) }}</span>
              </div>
              <p class="prod-desc">{{ prod.description || 'Delicioso platillo preparado al instante con ingredientes frescos.' }}</p>

              <!-- Stock & Cost Info -->
              <div class="prod-stats">
                <div class="stat-item">
                  <span class="stat-lbl">Stock Actual:</span>
                  <span class="stat-val font-bold" [class.text-red]="prod.stock <= prod.minStockAlert" [class.text-green]="prod.stock > prod.minStockAlert">
                    {{ prod.stock }} unds
                  </span>
                </div>
                <div class="stat-item">
                  <span class="stat-lbl">Costo Unit:</span>
                  <span class="stat-val text-muted">S/. {{ prod.cost ? prod.cost.toFixed(2) : (prod.price * 0.45).toFixed(2) }}</span>
                </div>
              </div>

              <!-- Card Actions -->
              <div class="prod-actions">
                <button class="btn btn-sm btn-secondary flex-1" (click)="editProduct(prod)">
                  <span>✏️ Editar</span>
                </button>
                <button class="btn btn-sm btn-danger-subtle" (click)="deleteProduct(prod)">
                  <span>🗑️ Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        } @empty {
          <div class="empty-state card col-span-full">
            <span class="empty-icon">📂</span>
            <h3>No se encontraron productos</h3>
            <p>Intenta cambiar el filtro de búsqueda o agrega un nuevo platillo a tu catálogo.</p>
            <button class="btn btn-primary mt-3" (click)="openProductModal()">+ Crear Platillo Ahora</button>
          </div>
        }
      </div>
    </div>

    <!-- Modal Crear / Editar Platillo -->
    @if (showProdModal()) {
      <div class="modal-overlay animate-fade-in" (click)="showProdModal.set(false)">
        <div class="modal-content card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ isEditing ? '✏️ Editar Platillo' : '✨ Nuevo Platillo / Producto' }}</h3>
            <button class="close-btn" (click)="showProdModal.set(false)">✖</button>
          </div>
          <div class="modal-body">
            <div class="grid-2">
              <div class="form-group">
                <label>Nombre del Platillo *</label>
                <input type="text" [(ngModel)]="formName" class="form-input" placeholder="Ej. Lomo Saltado Especial" />
              </div>
              <div class="form-group">
                <label>Categoría *</label>
                <select [(ngModel)]="formCategoryId" class="form-input">
                  @for (cat of categories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.icon }} {{ cat.name }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label>Precio Venta (S/. Soles) *</label>
                <input type="number" step="0.50" [(ngModel)]="formPrice" class="form-input" placeholder="25.00" />
              </div>
              <div class="form-group">
                <label>Costo Ingredientes (S/. Soles)</label>
                <input type="number" step="0.50" [(ngModel)]="formCost" class="form-input" placeholder="10.50" />
              </div>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label>Stock Disponible (unds)</label>
                <input type="number" [(ngModel)]="formStock" class="form-input" placeholder="50" />
              </div>
              <div class="form-group">
                <label>Alerta Stock Mínimo</label>
                <input type="number" [(ngModel)]="formMinAlert" class="form-input" placeholder="8" />
              </div>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label>Código de Barras / SKU</label>
                <input type="text" [(ngModel)]="formBarcode" class="form-input font-mono" placeholder="78910203040" />
              </div>
              <div class="form-group">
                <label>Imagen (Emoji o URL HTTP) *</label>
                <input type="text" [(ngModel)]="formImage" class="form-input" placeholder="🍔 o https://..." />
              </div>
            </div>

            <div class="form-group">
              <label>Descripción / Receta / Notas</label>
              <textarea [(ngModel)]="formDescription" class="form-input text-area" rows="2" placeholder="Carne jugosa salteada al wok con cebolla, tomate y papas fritas crocantes..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showProdModal.set(false)">Cancelar</button>
            <button class="btn btn-primary" (click)="saveProduct()">
              {{ isEditing ? 'Guardar Cambios' : 'Crear Producto' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal Nueva Categoría -->
    @if (showCategoryModal()) {
      <div class="modal-overlay animate-fade-in" (click)="showCategoryModal.set(false)">
        <div class="modal-content card modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>📁 Crear Nueva Categoría</h3>
            <button class="close-btn" (click)="showCategoryModal.set(false)">✖</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Nombre de Categoría *</label>
              <input type="text" [(ngModel)]="catName" class="form-input" placeholder="Ej. Postres y Dulces" />
            </div>
            <div class="form-group">
              <label>Icono / Emoji *</label>
              <div class="emoji-selector">
                @for (em of commonEmojis; track em) {
                  <button class="emoji-btn" [class.selected]="catIcon === em" (click)="catIcon = em">{{ em }}</button>
                }
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showCategoryModal.set(false)">Cancelar</button>
            <button class="btn btn-primary" (click)="saveCategory()">+ Crear Categoría</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .menu-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      color: #334155;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .page-title {
      font-size: 26px;
      font-weight: 700;
      color: #0F172A;
      font-family: var(--font-title);
      margin: 0 0 4px 0;
    }

    .page-subtitle {
      color: #64748B;
      font-size: 14px;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 14px;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-sm {
      padding: 8px 14px;
      font-size: 13px;
    }

    .flex-1 { flex: 1; justify-content: center; }

    .btn-secondary {
      background: #FFFFFF;
      color: #334155;
      border: 1px solid #E2E8F0;
    }
    .btn-secondary:hover {
      background: #F8FAFC;
      border-color: #CBD5E1;
    }

    .btn-primary {
      background: #3B82F6;
      color: #FFF;
    }
    .btn-primary:hover {
      background: #2563EB;
      transform: translateY(-2px);
    }

    .btn-danger-subtle {
      background: #FEE2E2;
      color: #DC2626;
      border: 1px solid #FECACA;
    }
    .btn-danger-subtle:hover {
      background: #EF4444;
      color: #FFF;
    }

    .card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }

    .categories-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      gap: 16px;
      flex-wrap: wrap;
    }

    .tabs-list {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .cat-tab-wrapper {
      display: flex;
      align-items: center;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      overflow: hidden;
      transition: all 0.2s ease;
    }

    .cat-tab-wrapper.active {
      background: #3B82F6;
      border-color: #3B82F6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
    }

    .cat-tab {
      padding: 8px 14px;
      border: none;
      background: transparent;
      color: #475569;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .cat-tab-wrapper.active .cat-tab { color: #FFF; }

    .del-cat-btn {
      background: none;
      border: none;
      color: #94A3B8;
      padding: 8px 10px;
      cursor: pointer;
      font-size: 12px;
      transition: color 0.2s;
    }
    .cat-tab-wrapper.active .del-cat-btn { color: rgba(255, 255, 255, 0.8); }
    .del-cat-btn:hover { color: #EF4444; }

    .search-box {
      flex: 1;
      max-width: 340px;
    }

    .search-input {
      width: 100%;
      padding: 10px 16px;
      border-radius: 10px;
      border: 1px solid #E2E8F0;
      background: #FFFFFF;
      color: #0F172A;
      font-size: 14px;
      outline: none;
    }
    .search-input:focus {
      border-color: #3B82F6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

    .product-card {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .product-card:hover {
      transform: translateY(-5px);
      box-shadow: var(--shadow-lg);
      border-color: #CBD5E1;
    }

    .prod-image-wrapper {
      position: relative;
      height: 170px;
      background: #F8FAFC;
      border-bottom: 1px solid #F1F5F9;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .prod-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
    .product-card:hover .prod-img { transform: scale(1.05); }

    .prod-emoji-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      
      .plate-illustration {
        width: 120px;
        height: 120px;
      }
    }

    .cat-pill {
      position: absolute;
      top: 12px;
      left: 12px;
      background: rgba(15, 23, 42, 0.85);
      color: #FFFFFF;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
    }

    .price-tag {
      position: absolute;
      bottom: 12px;
      right: 12px;
      background: #10B981;
      color: #FFFFFF;
      padding: 6px 14px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 800;
      box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
    }

    .prod-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .prod-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 6px;
    }

    .prod-title {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: #0F172A;
    }

    .barcode-badge {
      font-size: 11px;
      background: #F1F5F9;
      padding: 4px 8px;
      border-radius: 6px;
      color: #64748B;
    }

    .prod-desc {
      font-size: 13px;
      color: #64748B;
      line-height: 1.5;
      margin: 0 0 16px 0;
      flex: 1;
    }

    .prod-stats {
      display: flex;
      justify-content: space-between;
      padding: 12px 14px;
      background: #F8FAFC;
      border: 1px solid #F1F5F9;
      border-radius: 10px;
      margin-bottom: 16px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
    }

    .stat-lbl { font-size: 11px; color: #64748B; text-transform: uppercase; font-weight: 700; }
    .stat-val { font-size: 14px; font-weight: 800; color: #0F172A; }

    .text-red { color: #EF4444 !important; }
    .text-green { color: #10B981 !important; }
    .text-muted { color: #64748B !important; }

    .prod-actions {
      display: flex;
      gap: 10px;
    }

    .col-span-full { grid-column: 1 / -1; }
    .empty-state {
      padding: 64px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .empty-icon { font-size: 48px; margin-bottom: 16px; }
    .mt-3 { margin-top: 20px; }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      width: 100%;
      max-width: 520px;
      background: #FFFFFF;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: var(--shadow-xl);
    }

    .modal-sm { max-width: 420px; }

    .modal-header {
      padding: 20px 24px;
      background: #F8FAFC;
      border-bottom: 1px solid #E2E8F0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 { margin: 0; font-size: 18px; font-weight: 700; color: #0F172A; }
    .close-btn { background: none; border: none; color: #64748B; font-size: 18px; cursor: pointer; }

    .modal-body { padding: 24px; }

    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; }
    
    .form-input {
      width: 100%;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid #E2E8F0;
      background: #FFFFFF;
      color: #0F172A;
      font-size: 14px;
      box-sizing: border-box;
    }
    .form-input:focus { border-color: #3B82F6; outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
    
    .text-area { resize: vertical; }
    .font-mono { font-family: monospace; }
    .font-bold { font-weight: 700; }

    .emoji-selector {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .emoji-btn {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      border: 1px solid #E2E8F0;
      background: #F8FAFC;
      font-size: 22px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .emoji-btn:hover { background: #F1F5F9; border-color: #CBD5E1; }
    .emoji-btn.selected {
      background: #DBEAFE;
      border-color: #3B82F6;
      transform: scale(1.1);
    }

    .modal-footer {
      padding: 16px 24px;
      background: #F8FAFC;
      border-top: 1px solid #E2E8F0;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .animate-fade-in { animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class MenuProductsComponent {
  restaurant = inject(RestaurantService);
  notify = inject(NotificationModalService);

  products = computed(() => this.restaurant.products());
  categories = computed(() => this.restaurant.categories());

  selectedCat = signal<string>('all');
  searchQuery = signal('');
  brokenImages = signal<Set<string>>(new Set());

  onImageError(prodId: string): void {
    this.brokenImages.update(set => {
      const next = new Set(set);
      next.add(prodId);
      return next;
    });
  }

  getCategoryIcon(cat: any): string {
    if (!cat) return '🍽️';
    if (cat.id === 'cat-todo' || cat.name.toLowerCase() === 'todo') return '📑';
    
    const iconStr = cat.icon || '';
    const genericWords = ['grid', 'coffee', 'utensils', 'chef-hat', 'cake', 'plate'];
    if (iconStr && !genericWords.includes(iconStr.toLowerCase()) && !/^[a-zA-Z-]+$/.test(iconStr)) {
      return iconStr;
    }

    const n = cat.name.toLowerCase();
    if (n.includes('entrada') || n.includes('tequeño') || n.includes('piqueo') || n.includes('aperitivo')) return '🥟';
    if (n.includes('duo') || n.includes('duos') || n.includes('combo') || n.includes('promo')) return '🍱';
    if (n.includes('ceviche') || n.includes('marisco') || n.includes('pescado') || n.includes('leche de tigre') || n.includes('mar')) return '🍤';
    if (n.includes('bebida') || n.includes('jugo') || n.includes('gaseosa') || n.includes('refresco') || n.includes('cafe')) return '🥤';
    if (n.includes('desayuno') || n.includes('bolon') || n.includes('tigrillo')) return '🥐';
    if (n.includes('plato') || n.includes('fuerte') || n.includes('principal') || n.includes('carne') || n.includes('lomo')) return '🍛';
    if (n.includes('postre') || n.includes('dulce') || n.includes('torta')) return '🍰';
    if (n.includes('sopa') || n.includes('caldo')) return '🍲';

    if (iconStr.toLowerCase() === 'coffee') return '☕';
    if (iconStr.toLowerCase() === 'utensils') return '🍽️';
    if (iconStr.toLowerCase() === 'chef-hat') return '👨‍🍳';
    if (iconStr.toLowerCase() === 'cake') return '🍰';

    return '🍽️';
  }

  showProdModal = signal(false);
  showCategoryModal = signal(false);
  isEditing = false;
  editingProdId = '';

  // Product Form Fields
  formName = '';
  formCategoryId = '';
  formPrice = 25.00;
  formCost = 10.50;
  formStock = 50;
  formMinAlert = 10;
  formBarcode = '';
  formImage = '🍔';
  formDescription = '';

  // Category Form Fields
  catName = '';
  catIcon = '🍕';
  commonEmojis = ['🍔', '🍕', '🥩', '🍗', '🍜', '🍣', '🥗', '🍰', '☕', '🍹', '🍺', '🍷'];

  filteredProducts = computed(() => {
    const list = this.products();
    const cat = this.selectedCat();
    const q = this.searchQuery().toLowerCase().trim();

    return list.filter(p => {
      const matchCat = cat === 'all' || p.categoryId === cat;
      const matchSearch = !q || 
        p.name.toLowerCase().includes(q) || 
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  });

  getCategoryName(catId: string): string {
    const found = this.categories().find(c => c.id === catId);
    return found ? `${found.icon} ${found.name}` : 'Menú General';
  }

  getProductCountByCat(catId: string): number {
    return this.products().filter(p => p.categoryId === catId).length;
  }

  openProductModal(): void {
    this.isEditing = false;
    this.editingProdId = '';
    this.formName = '';
    this.formCategoryId = this.categories()[0]?.id || 'cat-1';
    this.formPrice = 22.00;
    this.formCost = 9.50;
    this.formStock = 40;
    this.formMinAlert = 8;
    this.formBarcode = '789' + Math.floor(100000 + Math.random() * 900000);
    this.formImage = '🍽️';
    this.formDescription = '';
    this.showProdModal.set(true);
  }

  editProduct(prod: Product): void {
    this.isEditing = true;
    this.editingProdId = prod.id;
    this.formName = prod.name;
    this.formCategoryId = prod.categoryId;
    this.formPrice = prod.price;
    this.formCost = prod.cost || Number((prod.price * 0.45).toFixed(2));
    this.formStock = prod.stock;
    this.formMinAlert = prod.minStockAlert || 10;
    this.formBarcode = prod.barcode || '';
    this.formImage = prod.image || '🍽️';
    this.formDescription = prod.description || '';
    this.showProdModal.set(true);
  }

  saveProduct(): void {
    if (!this.formName.trim()) {
      this.notify.alert({ title: 'Campo Requerido', message: 'Por favor ingresa un nombre para el platillo o producto.' });
      return;
    }
    const name = this.formName.trim();
    if (this.isEditing && this.editingProdId) {
      this.restaurant.updateProduct(this.editingProdId, {
        name: name,
        categoryId: this.formCategoryId,
        price: Number(this.formPrice),
        cost: Number(this.formCost),
        stock: Number(this.formStock),
        minStockAlert: Number(this.formMinAlert),
        barcode: this.formBarcode.trim(),
        image: this.formImage.trim(),
        description: this.formDescription.trim()
      });
      this.showProdModal.set(false);
      this.notify.success({
        title: '¡Producto Actualizado!',
        message: `El platillo "${name}" se actualizó correctamente con sus nuevos precios y stock.`,
        confirmText: 'Entendido'
      });
    } else {
      this.restaurant.addProduct({
        name: name,
        categoryId: this.formCategoryId,
        price: Number(this.formPrice),
        cost: Number(this.formCost),
        stock: Number(this.formStock),
        minStockAlert: Number(this.formMinAlert),
        barcode: this.formBarcode.trim(),
        image: this.formImage.trim(),
        description: this.formDescription.trim(),
        soldCount: 0
      });
      this.showProdModal.set(false);
      this.notify.success({
        title: '¡Confirmación Exitosa!',
        message: `Se agregó "${name}" correctamente al menú general y está listo para la venta en POS.`,
        confirmText: 'Aceptar'
      });
    }
  }

  async deleteProduct(prod: Product): Promise<void> {
    const confirmed = await this.notify.confirm({
      title: '¿Eliminar del Catálogo?',
      message: `Vas a remover "${prod.name}" por completo del catálogo. Esta acción no afectará el historial de ventas pasadas.`,
      confirmText: 'Eliminar Producto',
      cancelText: 'Cancelar',
      isDanger: true
    });
    if (confirmed) {
      this.restaurant.deleteProduct(prod.id);
    }
  }

  saveCategory(): void {
    if (!this.catName.trim()) {
      this.notify.alert({ title: 'Atención', message: 'Por favor ingresa un nombre para la categoría.' });
      return;
    }
    const name = this.catName.trim();
    this.restaurant.addCategory(name, this.catIcon);
    this.catName = '';
    this.showCategoryModal.set(false);
    this.notify.success({
      title: '¡Categoría Agregada!',
      message: `La categoría "${name}" (${this.catIcon}) ha sido registrada y está disponible para clasificar platos.`,
      confirmText: 'Listo'
    });
  }

  async deleteCategory(catId: string, event: Event): Promise<void> {
    event.stopPropagation();
    const cat = this.categories().find(c => c.id === catId);
    const confirmed = await this.notify.confirm({
      title: '¿Eliminar Categoría?',
      message: `Vas a eliminar la categoría "${cat?.name || ''}". Los productos asociados permanecerán a salvo en el catálogo general.`,
      confirmText: 'Eliminar Categoría',
      cancelText: 'Cancelar',
      isDanger: true
    });
    if (confirmed) {
      this.restaurant.deleteCategory(catId);
      if (this.selectedCat() === catId) {
        this.selectedCat.set('all');
      }
    }
  }
}
