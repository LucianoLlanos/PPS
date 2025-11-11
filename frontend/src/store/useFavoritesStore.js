import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

const useFavoritesStore = create(
  persist(
    (set, get) => ({
      favorites: [],
      loading: false,
      error: null,

      // Agregar producto a favoritos
      addFavorite: async (product) => {
        try {
          set({ loading: true, error: null });
          
          // Llamar al backend para agregar a favoritos
          await api.post('/favorites', {
            idProducto: product.idProducto || product.id
          });

          // Actualizar estado local
          const currentFavorites = get().favorites;
          const isAlreadyFavorite = currentFavorites.some(
            fav => (fav.idProducto || fav.id) === (product.idProducto || product.id)
          );

          if (!isAlreadyFavorite) {
            set(state => ({
              favorites: [...state.favorites, product],
              loading: false
            }));
          } else {
            set({ loading: false });
          }
        } catch (error) {
          console.error('Error adding favorite:', error);
          set({ 
            error: 'Error al agregar a favoritos',
            loading: false 
          });
        }
      },

      // Quitar producto de favoritos
      removeFavorite: async (productId) => {
        try {
          set({ loading: true, error: null });
          
          // Llamar al backend para quitar de favoritos
          await api.delete(`/favorites/${productId}`);

          // Actualizar estado local
          set(state => ({
            favorites: state.favorites.filter(
              fav => (fav.idProducto || fav.id) !== productId
            ),
            loading: false
          }));
        } catch (error) {
          console.error('Error removing favorite:', error);
          set({ 
            error: 'Error al quitar de favoritos',
            loading: false 
          });
        }
      },

      // Toggle favorito
      toggleFavorite: async (product) => {
        const favorites = get().favorites;
        const productId = product.idProducto || product.id;
        const isCurrentlyFavorite = favorites.some(
          fav => (fav.idProducto || fav.id) === productId
        );

        if (isCurrentlyFavorite) {
          await get().removeFavorite(productId);
        } else {
          await get().addFavorite(product);
        }
      },

      // Verificar si un producto es favorito
      isFavorite: (productId) => {
        const favorites = get().favorites;
        return favorites.some(
          fav => (fav.idProducto || fav.id) === productId
        );
      },

      // Cargar favoritos del servidor
      loadFavorites: async () => {
        try {
          set({ loading: true, error: null });
          
          const response = await api.get('/favorites');
          set({ 
            favorites: response.data || [],
            loading: false 
          });
        } catch (error) {
          console.error('Error loading favorites:', error);
          // Si es error 401, no mostrar error (usuario no autenticado)
          if (error.response?.status !== 401) {
            set({ 
              error: 'Error al cargar favoritos',
              loading: false,
              favorites: []
            });
          } else {
            set({ 
              loading: false,
              favorites: [],
              error: null
            });
          }
        }
      },

      // Limpiar errores
      clearError: () => set({ error: null }),

      // Limpiar favoritos (logout)
      clearFavorites: () => set({ favorites: [], error: null })
    }),
    {
      name: 'favorites-storage',
      partialize: (state) => ({ favorites: state.favorites })
    }
  )
);

export default useFavoritesStore;