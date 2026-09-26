import type { Photo } from '~~/app/types/shop'

export async function useShopPhotos() {
  const data = await useContentItems<Photo>('gallery-photos', 'gallery')
  return { data, error: ref<Error | null>(null) }
}
