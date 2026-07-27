const THUMB_WIDTH = 400
const MEDIUM_WIDTH = 1600

export interface UploadedPhoto {
  thumb_url: string
  medium_url: string
  full_url: string
  width: number
  height: number
}

async function loadBitmap(file: File) {
  if ('createImageBitmap' in window) return await createImageBitmap(file)
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = url
    })
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function resize(
  bitmap: ImageBitmap | HTMLImageElement,
  width: number | null,
  type: string,
  quality: number
): Promise<Blob> {
  const sourceWidth = 'width' in bitmap ? bitmap.width : 0
  const sourceHeight = 'height' in bitmap ? bitmap.height : 0
  const targetWidth = width ? Math.min(width, sourceWidth) : sourceWidth
  const targetHeight = Math.round((sourceHeight / sourceWidth) * targetWidth)

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const context = canvas.getContext('2d')!
  context.imageSmoothingQuality = 'high'
  context.drawImage(bitmap as CanvasImageSource, 0, 0, targetWidth, targetHeight)

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('Could not encode image'))),
      type,
      quality
    )
  })
}

/**
 * Upload one photo and get back the three versions the gallery expects.
 *
 * The resizing happens in the browser and the upload goes straight to Supabase
 * Storage — nothing large ever passes through the Vercel function, so the
 * platform's request size limit is irrelevant and full-resolution files are
 * fine.
 */
export function usePhotoUpload() {
  const supabase = useSupabase()
  const progress = ref('')

  async function upload(file: File, folder: string): Promise<UploadedPhoto> {
    const safeFolder = folder.trim().replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/^-|-$/g, '')
    if (!safeFolder) throw new Error('Give the photo a folder name first (e.g. M31).')

    progress.value = 'Reading image…'
    const bitmap = await loadBitmap(file)
    const width = 'width' in bitmap ? bitmap.width : 0
    const height = 'height' in bitmap ? bitmap.height : 0

    const versions: Array<{ name: string, blob: Blob, contentType: string }> = []

    progress.value = 'Making thumbnail…'
    versions.push({
      name: 'thumb.webp',
      blob: await resize(bitmap, THUMB_WIDTH, 'image/webp', 0.78),
      contentType: 'image/webp'
    })

    progress.value = 'Making display version…'
    versions.push({
      name: 'medium.webp',
      blob: await resize(bitmap, MEDIUM_WIDTH, 'image/webp', 0.82),
      contentType: 'image/webp'
    })

    progress.value = 'Preparing full resolution…'
    versions.push({
      name: 'full.jpg',
      blob: await resize(bitmap, null, 'image/jpeg', 0.92),
      contentType: 'image/jpeg'
    })

    const urls: Record<string, string> = {}

    for (const version of versions) {
      progress.value = `Uploading ${version.name}…`
      const path = `${safeFolder}/${version.name}`
      const { error } = await supabase.storage.from('photos').upload(path, version.blob, {
        contentType: version.contentType,
        upsert: true,
        cacheControl: '31536000'
      })
      if (error) throw error
      urls[version.name] = supabase.storage.from('photos').getPublicUrl(path).data.publicUrl
    }

    progress.value = 'Writing metadata…'
    const metadata = {
      folder: safeFolder,
      uploadedAt: new Date().toISOString(),
      original: { width, height, name: file.name, bytes: file.size },
      versions: {
        thumb: { src: urls['thumb.webp'], width: THUMB_WIDTH },
        medium: { src: urls['medium.webp'], width: MEDIUM_WIDTH },
        full: { src: urls['full.jpg'], width, height }
      }
    }
    await supabase.storage.from('photos').upload(
      `${safeFolder}/metadata.json`,
      new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' }),
      { contentType: 'application/json', upsert: true }
    )

    progress.value = ''

    return {
      thumb_url: urls['thumb.webp']!,
      medium_url: urls['medium.webp']!,
      full_url: urls['full.jpg']!,
      width,
      height
    }
  }

  /** Single-file upload used for post covers, project shots and reference frames. */
  async function uploadSingle(file: File, folder: string, name: string): Promise<string> {
    const safeFolder = folder.trim().replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/^-|-$/g, '') || 'misc'
    progress.value = 'Uploading…'
    const bitmap = await loadBitmap(file)
    const blob = await resize(bitmap, MEDIUM_WIDTH, 'image/webp', 0.82)
    const path = `${safeFolder}/${name}.webp`
    const { error } = await supabase.storage.from('photos').upload(path, blob, {
      contentType: 'image/webp',
      upsert: true,
      cacheControl: '31536000'
    })
    progress.value = ''
    if (error) throw error
    return supabase.storage.from('photos').getPublicUrl(path).data.publicUrl
  }

  return { upload, uploadSingle, progress: readonly(progress) }
}
