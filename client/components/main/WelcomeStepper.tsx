"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress"; // We will add this component next

const steps = [
  {
    title: "Step 1: Be Confident",
    description: "You are brilliant and capable of amazing things. Believe in yourself and your abilities every single day.",
  },
  {
    title: "Step 2: Be Honest",
    description: "This is your personal space. Feel free to be open and honest about your thoughts and feelings.",
  },
  {
    title: "Step 3: We're Here to Help",
    description: "If you ever have a problem or just need to vent, the Help & Support portal is always here for you.",
  },
  {
    title: "Step 4: Your Safe Space",
    description: "This app was built just for you. Consider it your digital sanctuary. Enjoy!",
  },
];

export function WelcomeStepper() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check sessionStorage to see if the user has seen the stepper before
    const hasSeenStepper = sessionStorage.getItem("hasSeenWelcomeStepper");
    if (!hasSeenStepper) {
      setIsOpen(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    // Mark as seen in sessionStorage and close the dialog
    sessionStorage.setItem("hasSeenWelcomeStepper", "true");
    setIsOpen(false);
  };

  const progressValue = ((currentStep + 1) / steps.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-pink-600">{steps[currentStep].title}</DialogTitle>
          <DialogDescription>{steps[currentStep].description}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
           <Progress value={progressValue} className="w-full [&>*]:bg-pink-500" />
        </div>
        <DialogFooter>
          {currentStep > 0 && (
            <Button variant="outline" onClick={handlePrev}>
              Previous
            </Button>
          )}
          <Button onClick={handleNext} className="ml-auto">
            {currentStep === steps.length - 1 ? "Finish" : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}