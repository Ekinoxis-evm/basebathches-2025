import { useState } from 'react';
import { useEscrow } from '@/app/hooks/useEscrow';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface SellNFTFormProps {
  tokenId: string;
  tokenName: string;
  tokenImage: string;
  onSuccess?: (escrowId: string) => void;
}

export function SellNFTForm({ tokenId, tokenName, tokenImage, onSuccess }: SellNFTFormProps) {
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'initial' | 'approval' | 'listing'>('initial');
  const { createEscrow, isLoading, error } = useEscrow();
  const { toast } = useToast();

  async function handleSell() {
    if (!price || parseFloat(price) <= 0) {
      toast({
        title: 'Invalid price',
        description: 'Please enter a valid price greater than 0',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    setStep('approval');

    try {
      // Use the escrow hook to create a new escrow for the NFT
      const result = await createEscrow(tokenId, price);
      
      if (result) {
        toast({
          title: 'Success!',
          description: 'Your vehicle has been listed for sale',
        });
        
        if (onSuccess) {
          // Extract escrow ID from result if available, or use dummy ID for demo
          const escrowId = typeof result === 'string' ? result : '1';
          onSuccess(escrowId);
        }
      } else {
        toast({
          title: 'Failed to list vehicle',
          description: error || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error listing vehicle for sale:', err);
      toast({
        title: 'Error',
        description: 'Failed to list your vehicle. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setStep('initial');
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sell Your Vehicle</CardTitle>
        <CardDescription>
          List your vehicle NFT for sale on the CarP2P marketplace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <img 
              src={tokenImage} 
              alt={tokenName} 
              className="rounded-md object-cover w-20 h-20" 
            />
            <div>
              <h3 className="font-medium">{tokenName}</h3>
              <p className="text-sm text-muted-foreground">Token ID: {tokenId}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="price">Price (BCOP)</Label>
            <div className="flex items-center">
              <Input
                id="price"
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the price in BCOP tokens (6 decimals)
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={handleSell}
          disabled={isSubmitting || isLoading || !price || parseFloat(price) <= 0}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {step === 'approval' ? 'Approving...' : 'Creating Listing...'}
            </>
          ) : (
            'List for Sale'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 