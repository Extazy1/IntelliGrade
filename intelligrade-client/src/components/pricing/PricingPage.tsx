"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Check } from "lucide-react";

export function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Select the perfect plan for your marking needs. Start for free or unlock advanced features with our Premium plan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <Card className="flex flex-col border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl">Free Plan</CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground ml-1">/month</span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Check className="mr-2 h-5 w-5 text-primary" />
                  <span>Basic marking tools</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-5 w-5 text-primary" />
                  <span>Up to 50 papers per month</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-5 w-5 text-primary" />
                  <span>Standard feedback templates</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-5 w-5 text-primary" />
                  <span>Email support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline">
                Get Started
              </Button>
            </CardFooter>
          </Card>

          {/* Premium Plan */}
          <Card className="flex flex-col border-2 border-primary bg-primary/5 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Premium Plan</CardTitle>
                <span className="px-3 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                  RECOMMENDED
                </span>
              </div>
              <CardDescription>For educators who need more</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$19.99</span>
                <span className="text-muted-foreground ml-1">/month</span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Check className="mr-2 h-5 w-5 text-primary" />
                  <span>All Free Plan features</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-5 w-5 text-primary" />
                  <span>Unlimited papers</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-5 w-5 text-primary" />
                  <span>Advanced AI-powered feedback</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-5 w-5 text-primary" />
                  <span>Custom marking rubrics</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-5 w-5 text-primary" />
                  <span>Batch processing</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-5 w-5 text-primary" />
                  <span>Priority support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                Get Started
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-6">
            Need a custom solution for your institution? Contact our sales team.
          </p>
          <Button variant="outline">
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  );
} 