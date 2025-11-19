import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';
import useSnackbarStore from './useSnackbarStore';

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

      // Toggle favorito con actualización optimista y feedback
      toggleFavorite: async (product) => {
        const show = useSnackbarStore.getState().show;
        const productId = product?.idProducto || product?.id;
        if (!productId) return;

        // Requiere sesión válida con token
        let token = null;
        try { token = localStorage.getItem('token'); } catch {}
        if (!token) {
          show('Inicia sesión para usar favoritos', 'warning');
          return;
        }

        // Comprobar estado actual
        const isFav = get().favorites.some((fav) => (fav.idProducto || fav.id) === productId);

        // Optimista: aplicar cambio local inmediato
        if (!isFav) {
          set((state) => ({ favorites: [...state.favorites, product] }));
          try {
            await api.post('/favorites', { idProducto: productId });
            show('Añadido a favoritos', 'success');
          } catch (err) {
            // revertir
            set((state) => ({ favorites: state.favorites.filter((fav) => (fav.idProducto || fav.id) !== productId) }));
            const status = err?.response?.status;
            if (status === 401) show('Inicia sesión para usar favoritos', 'warning');
            else show('No se pudo agregar a favoritos', 'error');
          }
        } else {
          // eliminar optimista
          const prev = get().favorites;
          set({ favorites: prev.filter((fav) => (fav.idProducto || fav.id) !== productId) });
          try {
            await api.delete(`/favorites/${productId}`);
            show('Quitado de favoritos', 'success');
          } catch (err) {
            // revertir
            set({ favorites: prev });
            const status = err?.response?.status;
            if (status === 401) show('Inicia sesión para usar favoritos', 'warning');
            else show('No se pudo quitar de favoritos', 'error');
          }
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
          // si no hay token, no intentes y deja vacío en silencio
          let token = null; try { token = localStorage.getItem('token'); } catch {}
          if (!token) { set({ favorites: [], loading: false, error: null }); return; }

          const response = await api.get('/favorites');
          set({ 
            favorites: response.data || [],
            loading: false 
          });
        } catch (error) {
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