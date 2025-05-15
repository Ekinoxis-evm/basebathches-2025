import React, { useState } from 'react';
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { useSecureVehicleTrading, TradingRole, EscrowState } from '@/hooks/useSecureVehicleTrading';
import { TransactionType } from '@/hooks/useSignatureEscrow';
import { Progress } from "./ui/progress";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";
import { useToast } from "./ui/use-toast";

interface SignatureApprovalFormProps {
  escrowId: bigint;
  listingId: bigint;
  onComplete?: () => void;
}

export function SignatureApprovalForm({ escrowId, listingId, onComplete }: SignatureApprovalFormProps) {
  const { toast } = useToast();
  const [isOffchainSigning, setIsOffchainSigning] = useState(false);
  const [signType, setSignType] = useState<'approve' | 'cancel' | null>(null);
  
  const { 
    getTradingDetails, 
    approveTransaction, 
    signTransaction,
    isLoading
  } = useSecureVehicleTrading();
  
  const [tradingDetails, setTradingDetails] = useState<Awaited<ReturnType<typeof getTradingDetails>>>(null);
  
  // Fetch trading details
  React.useEffect(() => {
    const fetchDetails = async () => {
      const details = await getTradingDetails(listingId);
      setTradingDetails(details);
    };
    
    fetchDetails();
    
    // Set up an interval to refresh the data every 15 seconds
    const interval = setInterval(fetchDetails, 15000);
    
    return () => clearInterval(interval);
  }, [getTradingDetails, listingId, escrowId]);
  
  // Get escrow state text representation
  const getEscrowStateText = (state: number) => {
    switch (state) {
      case EscrowState.Created: return "Created";
      case EscrowState.BuyerDeposited: return "Payment Deposited";
      case EscrowState.ReadyForExecution: return "Ready for Execution";
      case EscrowState.Completed: return "Completed";
      case EscrowState.Cancelled: return "Cancelled";
      default: return "Unknown";
    }
  };
  
  // Get escrow state badge color
  const getEscrowStateBadgeVariant = (state: number): 
    "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
    switch (state) {
      case EscrowState.Created: return "default";
      case EscrowState.BuyerDeposited: return "warning";
      case EscrowState.ReadyForExecution: return "success";
      case EscrowState.Completed: return "success";
      case EscrowState.Cancelled: return "destructive";
      default: return "outline";
    }
  };
  
  // Get role badge color
  const getRoleBadgeVariant = (role: TradingRole): 
    "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case TradingRole.Seller: return "default";
      case TradingRole.Buyer: return "secondary";
      case TradingRole.Arbiter: return "outline";
      default: return "outline";
    }
  };
  
  // Get role text representation
  const getRoleText = (role: TradingRole) => {
    switch (role) {
      case TradingRole.Seller: return "Seller";
      case TradingRole.Buyer: return "Buyer";
      case TradingRole.Arbiter: return "Arbiter";
      default: return "Visitor";
    }
  };
  
  // Handle on-chain signature (transaction approval)
  const handleOnChainApproval = async (txType: TransactionType) => {
    try {
      const result = await approveTransaction(escrowId, txType);
      
      if (result.success) {
        toast({
          title: "Transaction Approved",
          description: txType === TransactionType.CompleteEscrow 
            ? "You've approved completing this transaction." 
            : "You've approved cancelling this transaction.",
          variant: "default",
        });
        
        // Refresh trading details after a short delay
        setTimeout(async () => {
          const details = await getTradingDetails(listingId);
          setTradingDetails(details);
          if (onComplete) onComplete();
        }, 1000);
      } else {
        toast({
          title: "Error",
          description: "Failed to approve transaction. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  // Handle off-chain signature (gasless approval)
  const handleOffChainSignature = async (txType: TransactionType) => {
    try {
      setIsOffchainSigning(true);
      
      const result = await signTransaction(escrowId, txType);
      
      if (result.success) {
        toast({
          title: "Transaction Signed",
          description: txType === TransactionType.CompleteEscrow 
            ? "You've signed to complete this transaction." 
            : "You've signed to cancel this transaction.",
          variant: "default",
        });
        
        // Refresh trading details after a short delay
        setTimeout(async () => {
          const details = await getTradingDetails(listingId);
          setTradingDetails(details);
          if (onComplete) onComplete();
        }, 1000);
      } else {
        toast({
          title: "Error",
          description: "Failed to sign transaction. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsOffchainSigning(false);
      setSignType(null);
    }
  };
  
  if (!tradingDetails) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }
  
  if (!tradingDetails.escrowDetails) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>No Escrow Found</CardTitle>
          <CardDescription>
            This listing does not have an active escrow.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  const { 
    escrowDetails, 
    userRole, 
    canApproveCompleteEscrow, 
    requiresMoreSignatures,
    currentSignatureCount,
    requiredSignatureCount 
  } = tradingDetails;
  
  const progress = Math.round((currentSignatureCount / requiredSignatureCount) * 100);
  
  // Check if escrow is in a state that can't be further processed
  const isEscrowComplete = escrowDetails.state === EscrowState.Completed;
  const isEscrowCancelled = escrowDetails.state === EscrowState.Cancelled;
  const isEscrowFinalized = isEscrowComplete || isEscrowCancelled;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transaction Signatures</CardTitle>
          <Badge 
            variant={getEscrowStateBadgeVariant(escrowDetails.state)}
          >
            {getEscrowStateText(escrowDetails.state)}
          </Badge>
        </div>
        <CardDescription>
          Escrow ID: {escrowId.toString()} • Your Role: 
          <Badge 
            variant={getRoleBadgeVariant(userRole)} 
            className="ml-2"
          >
            {getRoleText(userRole)}
          </Badge>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress bar for signature count */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Signature Progress</span>
            <span>{currentSignatureCount} of {requiredSignatureCount} required</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        {/* Signature requirements */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Required Signers:</h4>
          <div className="space-y-1">
            {escrowDetails.requireBuyer && (
              <div className="flex items-center">
                <Badge variant="outline" className="mr-2">Buyer</Badge>
                {tradingDetails.userRole === TradingRole.Buyer && <span className="text-xs text-muted-foreground">(You)</span>}
              </div>
            )}
            {escrowDetails.requireSeller && (
              <div className="flex items-center">
                <Badge variant="outline" className="mr-2">Seller</Badge>
                {tradingDetails.userRole === TradingRole.Seller && <span className="text-xs text-muted-foreground">(You)</span>}
              </div>
            )}
            {escrowDetails.requireArbiter && (
              <div className="flex items-center">
                <Badge variant="outline" className="mr-2">Arbiter</Badge>
                {tradingDetails.userRole === TradingRole.Arbiter && <span className="text-xs text-muted-foreground">(You)</span>}
              </div>
            )}
          </div>
        </div>
        
        {/* Status information */}
        {isEscrowFinalized ? (
          <Alert variant={isEscrowComplete ? "default" : "destructive"}>
            {isEscrowComplete ? (
              <>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Transaction Complete</AlertTitle>
                <AlertDescription>
                  This vehicle transaction has been successfully completed.
                </AlertDescription>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                <AlertTitle>Transaction Cancelled</AlertTitle>
                <AlertDescription>
                  This vehicle transaction has been cancelled.
                </AlertDescription>
              </>
            )}
          </Alert>
        ) : (
          requiresMoreSignatures && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Signatures Required</AlertTitle>
              <AlertDescription>
                This transaction requires {requiredSignatureCount} signatures to proceed.
                Currently has {currentSignatureCount} signature(s).
              </AlertDescription>
            </Alert>
          )
        )}
      </CardContent>
      
      {canApproveCompleteEscrow && !isEscrowFinalized && (
        <CardFooter className="flex-col space-y-2">
          {signType === null && (
            <>
              <Button 
                className="w-full" 
                onClick={() => setSignType('approve')}
                disabled={isLoading}
              >
                Sign to Complete Transaction
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setSignType('cancel')}
                disabled={isLoading}
              >
                Sign to Cancel Transaction
              </Button>
            </>
          )}
          
          {signType === 'approve' && (
            <div className="w-full space-y-2">
              <h4 className="text-sm font-medium">Choose signature method:</h4>
              <div className="flex space-x-2">
                <Button 
                  className="flex-1" 
                  onClick={() => handleOnChainApproval(TransactionType.CompleteEscrow)}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  On-chain (Gas fees)
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => handleOffChainSignature(TransactionType.CompleteEscrow)}
                  disabled={isOffchainSigning || isLoading}
                >
                  {isOffchainSigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Off-chain (Gasless)
                </Button>
              </div>
              <Button 
                variant="secondary" 
                onClick={() => setSignType(null)}
                disabled={isOffchainSigning || isLoading}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          )}
          
          {signType === 'cancel' && (
            <div className="w-full space-y-2">
              <h4 className="text-sm font-medium">Choose signature method:</h4>
              <div className="flex space-x-2">
                <Button 
                  variant="destructive" 
                  className="flex-1" 
                  onClick={() => handleOnChainApproval(TransactionType.CancelEscrow)}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  On-chain (Gas fees)
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => handleOffChainSignature(TransactionType.CancelEscrow)}
                  disabled={isOffchainSigning || isLoading}
                >
                  {isOffchainSigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Off-chain (Gasless)
                </Button>
              </div>
              <Button 
                variant="secondary" 
                onClick={() => setSignType(null)}
                disabled={isOffchainSigning || isLoading}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
} 