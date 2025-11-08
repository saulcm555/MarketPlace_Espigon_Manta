/**
 * Review Dialog Component
 * Diálogo para agregar reseñas a productos
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addProductReview } from '@/api/orders';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productOrderId: number;
  productId: number;
  productName: string;
}

const ReviewDialog = ({ 
  open, 
  onOpenChange, 
  productOrderId, 
  productId,
  productName 
}: ReviewDialogProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addReviewMutation = useMutation({
    mutationFn: () => addProductReview(productOrderId, rating, comment || undefined),
    onSuccess: () => {
      toast({
        title: "¡Reseña enviada!",
        description: "Gracias por compartir tu opinión sobre este producto",
      });
      
      // Invalidar queries para refrescar las reseñas
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      
      // Resetear formulario y cerrar
      setRating(0);
      setComment('');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo enviar la reseña",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: "Calificación requerida",
        description: "Por favor selecciona una calificación",
        variant: "destructive",
      });
      return;
    }

    addReviewMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Califica tu compra</DialogTitle>
          <DialogDescription>
            ¿Qué te pareció <span className="font-semibold">{productName}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating Stars */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Calificación <span className="text-destructive">*</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm font-medium">
                  {rating === 1 && 'Muy malo'}
                  {rating === 2 && 'Malo'}
                  {rating === 3 && 'Regular'}
                  {rating === 4 && 'Bueno'}
                  {rating === 5 && 'Excelente'}
                </span>
              )}
            </div>
          </div>

          {/* Comment (Optional) */}
          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">
              Comentario <span className="text-muted-foreground">(opcional)</span>
            </label>
            <Textarea
              id="comment"
              placeholder="Cuéntanos más sobre tu experiencia con este producto..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500 caracteres
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={addReviewMutation.isPending}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={addReviewMutation.isPending || rating === 0}
          >
            {addReviewMutation.isPending ? 'Enviando...' : 'Enviar reseña'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDialog;
