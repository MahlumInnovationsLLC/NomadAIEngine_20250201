import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faWeightScale, 
  faDumbbell, 
  faHeart, 
  faCarrot, 
  faBrain,
  faChevronRight,
  faChevronLeft
} from "@fortawesome/free-solid-svg-icons";

interface HealthGoalWizardProps {
  memberId: string;
  currentHealth: {
    weight: number[];
    bodyFat: number[];
    heartRate: number[];
    bloodPressure: {
      systolic: number[];
      diastolic: number[];
    };
  };
  onSave: (goal: any) => Promise<void>;
  onClose: () => void;
}

type GoalType = "weight" | "strength" | "cardio" | "nutrition" | "wellness";

interface Goal {
  type: GoalType;
  target: number;
  timeline: number; // weeks
  currentValue: number;
  description: string;
  aiRecommendations?: string[];
}

export function HealthGoalWizard({ memberId, currentHealth, onSave, onClose }: HealthGoalWizardProps) {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<Partial<Goal>>({});

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (isGoalComplete(goal)) {
      await onSave(goal);
      onClose();
    }
  };

  const isGoalComplete = (goal: Partial<Goal>): goal is Goal => {
    return !!(goal.type && goal.target && goal.timeline && goal.currentValue && goal.description);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Set Your Health Goals</CardTitle>
        <CardDescription>
          Let's create personalized health goals tailored to your needs
        </CardDescription>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Health Assessment</h3>
            <div className="grid gap-4">
              <div>
                <Label>Current Weight (lbs)</Label>
                <Input 
                  type="number" 
                  value={currentHealth.weight[currentHealth.weight.length - 1] || ""} 
                  disabled
                />
              </div>
              <div>
                <Label>Current Body Fat %</Label>
                <Input 
                  type="number" 
                  value={currentHealth.bodyFat[currentHealth.bodyFat.length - 1] || ""} 
                  disabled
                />
              </div>
              <div>
                <Label>Resting Heart Rate (bpm)</Label>
                <Input 
                  type="number" 
                  value={currentHealth.heartRate[currentHealth.heartRate.length - 1] || ""} 
                  disabled
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">What type of goal would you like to set?</h3>
            <RadioGroup
              value={goal.type}
              onValueChange={(value: GoalType) => setGoal({ ...goal, type: value })}
            >
              <div className="grid grid-cols-2 gap-4">
                <Label className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="weight" id="weight" />
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faWeightScale} className="h-4 w-4" />
                    <span>Weight Management</span>
                  </div>
                </Label>
                <Label className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="strength" id="strength" />
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faDumbbell} className="h-4 w-4" />
                    <span>Strength Training</span>
                  </div>
                </Label>
                <Label className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="cardio" id="cardio" />
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faHeart} className="h-4 w-4" />
                    <span>Cardiovascular Health</span>
                  </div>
                </Label>
                <Label className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="nutrition" id="nutrition" />
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faCarrot} className="h-4 w-4" />
                    <span>Nutrition</span>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Set Your Target</h3>
            <div className="space-y-4">
              <div>
                <Label>Current Value</Label>
                <Input 
                  type="number" 
                  value={goal.currentValue || ""}
                  onChange={(e) => setGoal({ ...goal, currentValue: parseFloat(e.target.value) })}
                  placeholder="Enter current value"
                />
              </div>
              <div>
                <Label>Target Value</Label>
                <Input 
                  type="number" 
                  value={goal.target || ""}
                  onChange={(e) => setGoal({ ...goal, target: parseFloat(e.target.value) })}
                  placeholder="Enter target value"
                />
              </div>
              <div>
                <Label>Timeline (weeks)</Label>
                <Select 
                  value={goal.timeline?.toString()}
                  onValueChange={(value) => setGoal({ ...goal, timeline: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4 weeks</SelectItem>
                    <SelectItem value="8">8 weeks</SelectItem>
                    <SelectItem value="12">12 weeks</SelectItem>
                    <SelectItem value="16">16 weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faBrain} className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">AI Recommendations</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p>Based on your goals and current health metrics, here are some personalized recommendations:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Aim for a sustainable pace of progress</li>
                <li>Include regular check-ins with your trainer</li>
                <li>Track your progress weekly</li>
                <li>Adjust your nutrition plan to support your goals</li>
              </ul>
            </div>
            <div>
              <Label>Goal Description</Label>
              <textarea 
                className="w-full min-h-[100px] p-2 border rounded-md"
                value={goal.description || ""}
                onChange={(e) => setGoal({ ...goal, description: e.target.value })}
                placeholder="Describe your goal and motivation"
              />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Confirm Your Goal</h3>
            <div className="space-y-2">
              <p><strong>Goal Type:</strong> {goal.type}</p>
              <p><strong>Current Value:</strong> {goal.currentValue}</p>
              <p><strong>Target Value:</strong> {goal.target}</p>
              <p><strong>Timeline:</strong> {goal.timeline} weeks</p>
              <p><strong>Description:</strong> {goal.description}</p>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            <FontAwesomeIcon icon={faChevronLeft} className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handleNext}
          >
            {step === totalSteps ? "Complete" : "Next"}
            {step !== totalSteps && (
              <FontAwesomeIcon icon={faChevronRight} className="ml-2 h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
