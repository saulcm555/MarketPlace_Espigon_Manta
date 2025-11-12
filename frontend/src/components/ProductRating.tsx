/**
 * ProductRating Component
 * Muestra el rating de un producto con estrellas
 */

import { Star } from "lucide-react";
import type { Product } from "@/types/api";

interface ProductRatingProps {
  product: Product;
  showCount?: boolean; // Mostrar contador de reviews
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ProductRating = ({ 
  product, 
  showCount = true, 
  size = 'md',
  className = '' 
}: ProductRatingProps) => {
  const rating = product.avgRating || 0;
  const reviewCount = product.reviewCount || 0;
  
  // Si no hay reviews, no mostrar nada
  if (reviewCount === 0) {
    return null;
  }

  // Tamaños de las estrellas
  const starSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const starSize = starSizes[size];
  const textSize = textSizes[size];

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Star className={`${starSize} fill-yellow-400 text-yellow-400`} />
      <span className={`${textSize} font-semibold`}>
        {rating.toFixed(1)}
      </span>
      {showCount && (
        <span className={`${textSize} text-muted-foreground`}>
          ({reviewCount} {reviewCount === 1 ? 'valoración' : 'valoraciones'})
        </span>
      )}
    </div>
  );
};

export default ProductRating;
