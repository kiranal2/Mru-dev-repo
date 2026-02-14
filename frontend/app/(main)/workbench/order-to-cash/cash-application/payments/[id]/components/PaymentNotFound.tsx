"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, AlertCircle } from "lucide-react";

interface PaymentNotFoundProps {
  onGoBack: () => void;
}

export function PaymentNotFound({ onGoBack }: PaymentNotFoundProps) {
  return (
    <div className="p-8">
      <Card className="p-12 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment not found</h2>
        <p className="text-gray-600 mb-6">The payment you are looking for does not exist.</p>
        <Button onClick={onGoBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </Card>
    </div>
  );
}
