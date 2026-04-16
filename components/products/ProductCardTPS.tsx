import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Star } from 'lucide-react'
import { Product } from '@/types/product'
import { usePixel } from '@/hooks/usePixel'

interface ProductCardTPSProps {
  product: Product
  className?: string
  priority?: boolean
}

export default function ProductCardTPS({ product, className = '', priority = false }: ProductCardTPSProps) {
  const [imageError, setImageError] = useState(false)
  const pixel = usePixel()

  // Extrair URL da imagem principal
  const getMainImageUrl = () => {
    if (Array.isArray(product.images)) {
      return product.images[0] || '/images/placeholder-product.jpg'
    } else if (product.images && typeof product.images === 'object' && 'main' in product.images) {
      return product.images.main[0] || '/images/placeholder-product.jpg'
    }
    return '/images/placeholder-product.jpg'
  }

  const imageUrl = getMainImageUrl()
  const brands = product.brands || [product.brand] || ['Unknown']
  const primaryBrand = brands[0]

  // Preços
  const formatPrice = (price: string | number) => {
    if (typeof price === 'string') {
      return parseFloat(price).toFixed(2)
    }
    return price.toFixed(2)
  }

  const hasDiscount = product.price.discount_percent > 0

  // Rating (placeholder - 4 de 5 estrelas)
  const rating = 4
  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < rating ? 'fill-black text-black' : 'text-gray-300'}`}
      />
    ))
  }

  const router = useRouter()
  const { bundleSlot, returnTo } = router.query
  const isSelectionMode = typeof bundleSlot === 'string' && typeof returnTo === 'string'

  // Função para rastrear visualização do produto
  const handleViewContent = () => {
    pixel.viewContent({
      content_type: 'product',
      content_ids: [product.id.toString()],
      content_name: product.title,
      content_category: product.tags.join(','),
      value: parseFloat(product.price.regular.toString()),
      currency: 'GBP'
    })
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if (isSelectionMode) {
      e.preventDefault()
      const slotIndex = parseInt(bundleSlot as string)
      
      try {
        const stored = localStorage.getItem('bundleState')
        const state = stored ? JSON.parse(stored) : { packType: 'single', selections: [null, null, null] }
        if (!state.selections) state.selections = [null, null, null]
        
        state.selections[slotIndex] = product
        localStorage.setItem('bundleState', JSON.stringify(state))
      } catch (err) {}
      
      if (slotIndex === 0) {
        // If selecting the primary fragrance, go to its product page
        router.push(`/products/${product.handle}`)
      } else {
        router.push(returnTo as string)
      }
    } else {
      handleViewContent()
    }
  }

  const CardWrapper = isSelectionMode ? 'button' : Link
  const cardProps = isSelectionMode 
    ? { onClick: handleCardClick, className: "flex flex-col flex-grow text-left" }
    : { href: `/products/${product.handle}`, onClick: handleViewContent, className: "flex flex-col flex-grow", suppressHydrationWarning: true }

  return (
    <div className={`bg-white flex flex-col h-full ${className}`}>
      {/* Product Link - flex container para espaçamento uniforme */}
      <CardWrapper {...(cardProps as any)}>
        {/* Image Container */}
        <div className="relative bg-white mb-3">
          {/* Viewers Counter */}
          {product.popularity > 0 && (
            <div className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm text-xs py-1 px-2 rounded-full z-10">
              {product.popularity} others viewed<br />in last 8 hrs
            </div>
          )}

          {/* Product Image */}
          {!imageError ? (
            <div className="aspect-square relative">
              <Image
                src={imageUrl}
                alt={product.title}
                fill
                className="object-contain"
                style={product.image_scale ? { transform: `scale(${product.image_scale})`, transition: 'transform 0.2s' } : undefined}
                priority={priority}
                onError={() => setImageError(true)}
                sizes="(max-width: 640px) 50vw, 33vw"
              />
            </div>
          ) : (
            <div className="aspect-square flex items-center justify-center bg-gray-50">
              <span className="text-4xl text-gray-300">?</span>
            </div>
          )}

          {/* Promotional Banner */}
          <div className="bg-white border border-black text-center font-bold text-xs py-1 mb-2">
            Pick any 3 fragrances you love for only £49.99
          </div>

          {/* Badge - Canto superior direito */}
        

          {/* New/Tester Badge */}
          {product.new_arrival && !hasDiscount && (
            <div className="absolute top-2 right-2 bg-white border border-black rounded-full w-12 h-12 flex items-center justify-center">
              <span className="text-xs font-bold">NEW</span>
            </div>
          )}

          {/* Free Tester Badge */}
          {product.tags?.includes('tester') && (
            <div className="absolute top-2 right-2 bg-white border border-black rounded-full w-16 h-16 flex items-center justify-center">
              <div className="text-center">
                <div className="text-xs font-bold">FREE</div>
                <div className="text-xs font-bold">TESTER</div>
              </div>
            </div>
          )}
        </div>

        {/* Linha decorativa */}
        <div className="w-full h-px bg-black mb-3"></div>

        {/* Product Info - flex grow para empurrar botão para baixo */}
        <div className="text-center space-y-2 flex flex-col flex-grow">

          {/* Product Name - full title from folder name */}
          <h3 className="text-sm font-bold text-black leading-tight flex items-center justify-center text-center px-1">
            {product.title}
          </h3>

          {/* Product Type */}
          <div className="text-xs font-thin text-black">
            {product.is_combo ? 'Eau de Parfum Spray' : 'Eau de Parfum Spray'} - 100ML
          </div>

          {/* Spacer para empurrar conteúdo para baixo */}
          <div className="flex-grow"></div>

          {/* Pricing */}
          <div className="space-y-1 mx-auto">
            {/* Price Range */}
            <div className="flex flex-col">
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-black text-lg font-bold">£{formatPrice(product.price.regular)}</span>
                <span className="text-gray-700 line-through text-xs">
                  £{formatPrice(product.price.original_price || 169.99)}
                </span>

              </div>
            </div>

            {/* Sponsored Tag if applicable */}
            {product.featured && (
              <div className="text-xs text-gray-500">
                Sponsored
              </div>
            )}
          </div>
        </div>
      </CardWrapper>

      {/* CTA Button - sempre na parte inferior */}
      <div className="mt-4">
        {isSelectionMode ? (
          <button
            onClick={handleCardClick}
            className="block w-full bg-black rounded-[4px] text-white py-3 text-x1 font-bold uppercase tracking-wide
                     hover:bg-gray-900 transition-colors duration-200 text-center"
          >
            SELECT
          </button>
        ) : (
          <Link
            href={`/products/${product.handle}`}
            className="block w-full bg-black rounded-[4px] text-white py-3 text-x1 font-thin uppercase tracking-wide
                     hover:bg-gray-900 transition-colors duration-200 text-center"
            onClick={handleViewContent}
            suppressHydrationWarning
          >
            VIEW DETAILS
          </Link>
        )}
      </div>
    </div>
  )
}
