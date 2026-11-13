"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upgradeToPro } from "../actions";

// DEMO ONLY. The card inputs are deliberately uncontrolled, have no `name`, and sit in
// no <form>: their values are never read, sent or stored. The button calls a server
// action that takes no arguments.
export function CheckoutForm() {
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pro, $9.99/month</CardTitle>
        <CardDescription>Demo billing: no real payments are made.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Demo only. Do not enter a real card number.
        </p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="demo-card-name">Name on card</Label>
          <Input id="demo-card-name" autoComplete="off" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="demo-card-number">Card number</Label>
          <Input id="demo-card-number" inputMode="numeric" autoComplete="off" placeholder="Any value works" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="demo-card-expiry">Expiry</Label>
            <Input id="demo-card-expiry" autoComplete="off" placeholder="MM/YY" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="demo-card-cvc">CVC</Label>
            <Input id="demo-card-cvc" inputMode="numeric" autoComplete="off" />
          </div>
        </div>
        <Button type="button" disabled={pending} onClick={() => startTransition(() => upgradeToPro())}>
          {pending ? "Processing..." : "Pay $9.99 (demo)"}
        </Button>
      </CardContent>
    </Card>
  );
}
