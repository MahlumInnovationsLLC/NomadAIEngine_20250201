import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

type GoalType = "weight" | "strength" | "cardio" | "nutrition";

interface Goal {
  type: GoalType;
  target: number;
  timeline: number; // weeks
  currentValue: number;
  description: string;
  specificGoal: string;
  aiRecommendations?: string[];
}

const predefinedGoals = {
  weight: [
    {
      name: "Healthy Weight Loss",
      description: "Lose 1-2 lbs per week through sustainable diet and exercise",
      recommendations: [
        "Focus on creating a moderate caloric deficit (500-750 calories/day)",
        "Incorporate both strength training and cardio",
        "Prioritize protein intake (1.6-2.2g per kg of body weight)",
        "Get 7-9 hours of quality sleep",
        "Stay hydrated (aim for 3-4 liters per day)"
      ]
    },
    {
      name: "Muscle Mass Gain",
      description: "Gain lean muscle mass through progressive overload and proper nutrition",
      recommendations: [
        "Maintain a slight caloric surplus (300-500 calories/day)",
        "Focus on compound movements with progressive overload",
        "Consume 1.8-2.2g protein per kg of body weight",
        "Ensure adequate carbohydrate intake for energy",
        "Allow proper recovery between training sessions"
      ]
    },
    {
      name: "Body Recomposition",
      description: "Simultaneously reduce body fat while maintaining/building muscle",
      recommendations: [
        "Maintain caloric maintenance or slight deficit",
        "Emphasize high protein intake (2.0-2.4g per kg)",
        "Implement resistance training 4-5 times per week",
        "Include strategic cardio sessions",
        "Focus on nutrient timing around workouts"
      ]
    }
  ],
  strength: [
    {
      name: "Progressive Overload Plan",
      description: "Systematically increase strength through structured progression",
      recommendations: [
        "Follow a structured progression scheme (5-10% increase)",
        "Focus on the big three: squat, bench press, deadlift",
        "Track and log all workouts meticulously",
        "Ensure proper form and technique",
        "Include deload weeks every 4-6 weeks"
      ]
    },
    {
      name: "Compound Lift Improvement",
      description: "Enhance performance in major compound movements",
      recommendations: [
        "Implement specific warmup routines",
        "Use periodization in training cycles",
        "Include accessory work for weak points",
        "Focus on technique mastery",
        "Monitor recovery between heavy sessions"
      ]
    },
    {
      name: "Functional Strength",
      description: "Build practical, everyday strength and mobility",
      recommendations: [
        "Incorporate bodyweight exercises",
        "Include unilateral movements",
        "Focus on core stability work",
        "Add mobility training",
        "Practice movement patterns regularly"
      ]
    }
  ],
  cardio: [
    {
      name: "Heart Rate Zone Training",
      description: "Improve cardiovascular fitness through targeted heart rate training",
      recommendations: [
        "Establish baseline heart rate zones",
        "Mix high and low-intensity sessions",
        "Include recovery workouts",
        "Monitor heart rate variability",
        "Progress gradually in intensity"
      ]
    },
    {
      name: "Endurance Building",
      description: "Increase stamina and aerobic capacity",
      recommendations: [
        "Follow the 10% rule for weekly mileage increase",
        "Include long, slow distance training",
        "Implement interval training",
        "Focus on proper breathing techniques",
        "Maintain proper hydration and nutrition"
      ]
    },
    {
      name: "VO2 Max Improvement",
      description: "Enhance maximum oxygen uptake capacity",
      recommendations: [
        "Include high-intensity interval training (HIIT)",
        "Maintain consistency in training",
        "Monitor recovery between sessions",
        "Focus on proper breathing techniques",
        "Track progress through regular testing"
      ]
    }
  ],
  nutrition: [
    {
      name: "Macro-Balanced Diet",
      description: "Optimize macronutrient ratios for your goals",
      recommendations: [
        "Calculate and track daily macronutrient needs",
        "Plan meals around training schedule",
        "Include a variety of protein sources",
        "Focus on complex carbohydrates",
        "Include healthy fats in moderation"
      ]
    },
    {
      name: "Clean Eating Transition",
      description: "Switch to whole, unprocessed foods",
      recommendations: [
        "Gradually replace processed foods",
        "Increase vegetable and fruit intake",
        "Choose whole grain alternatives",
        "Read and understand food labels",
        "Meal prep for consistency"
      ]
    },
    {
      name: "Sports Nutrition",
      description: "Optimize nutrition for athletic performance",
      recommendations: [
        "Time nutrients around workouts",
        "Include pre and post-workout nutrition",
        "Focus on recovery nutrition",
        "Stay hydrated throughout training",
        "Consider strategic supplementation"
      ]
    }
  ]
};

const getTargetInputLabel = (goalType: GoalType, specificGoal: string) => {
  switch (goalType) {
    case 'weight':
      return {
        current: 'Current Weight (lbs)',
        target: specificGoal === 'Muscle Mass Gain' ? 'Target Weight Gain (lbs)' : 'Target Weight Loss (lbs)',
        suggestion: specificGoal === 'Muscle Mass Gain'
          ? 'Recommended: 0.5-1 lb per week for lean muscle gain'
          : 'Recommended: 1-2 lbs per week for healthy weight loss'
      };
    case 'strength':
      return {
        current: 'Current Max (lbs)',
        target: 'Target Max (lbs)',
        suggestion: 'Aim for 5-10% increase over your current maximum'
      };
    case 'cardio':
      return {
        current: 'Current Resting Heart Rate (bpm)',
        target: 'Target Resting Heart Rate (bpm)',
        suggestion: 'Ideal resting heart rate: 60-100 bpm, athletes: 40-60 bpm'
      };
    case 'nutrition':
      return {
        current: 'Current Daily Calories',
        target: 'Target Daily Calories',
        suggestion: 'Based on your activity level and goals'
      };
    default:
      return {
        current: 'Current Value',
        target: 'Target Value',
        suggestion: ''
      };
  }
};

export function HealthGoalWizard({ memberId, currentHealth, onSave, onClose }: HealthGoalWizardProps) {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<Partial<Goal>>({});
  const [selectedSpecificGoal, setSelectedSpecificGoal] = useState<string>("");

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
    return !!(goal.type && goal.target && goal.timeline && goal.currentValue && goal.description && goal.specificGoal);
  };

  const getAvailableGoals = () => {
    if (!goal.type) return [];
    return predefinedGoals[goal.type];
  };

  const getRecommendations = () => {
    if (!goal.type || !selectedSpecificGoal) return [];
    const goalType = predefinedGoals[goal.type];
    const specific = goalType.find(g => g.name === selectedSpecificGoal);
    return specific?.recommendations || [];
  };

  const renderGoalTypeSelection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">What type of goal would you like to set?</h3>
      <div className="grid grid-cols-2 gap-4">
        {[
          { type: 'weight', icon: faWeightScale, label: 'Weight Management' },
          { type: 'strength', icon: faDumbbell, label: 'Strength Training' },
          { type: 'cardio', icon: faHeart, label: 'Cardiovascular Health' },
          { type: 'nutrition', icon: faCarrot, label: 'Nutrition' }
        ].map(({ type, icon, label }) => (
          <div
            key={type}
            onClick={() => {
              setGoal({ ...goal, type: type as GoalType });
              setSelectedSpecificGoal("");
            }}
            className={`p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors ${
              goal.type === type ? 'bg-accent' : ''
            }`}
          >
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={icon} className="h-4 w-4" />
              <span>{label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSpecificGoalSelection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Choose Your Specific Goal</h3>
      <div className="space-y-3">
        {getAvailableGoals().map((specificGoal) => (
          <div
            key={specificGoal.name}
            onClick={() => {
              setSelectedSpecificGoal(specificGoal.name);
              setGoal({
                ...goal,
                specificGoal: specificGoal.name,
                description: specificGoal.description
              });
            }}
            className={`p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors ${
              selectedSpecificGoal === specificGoal.name ? 'bg-accent' : ''
            }`}
          >
            <div className="font-medium">{specificGoal.name}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {specificGoal.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTargetSetting = () => {
    const labels = getTargetInputLabel(goal.type!, selectedSpecificGoal);

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Set Your Target</h3>
        <div className="space-y-4">
          <div>
            <Label>{labels.current}</Label>
            <Input
              type="number"
              value={goal.currentValue || ""}
              onChange={(e) => setGoal({ ...goal, currentValue: parseFloat(e.target.value) })}
              placeholder={`Enter your ${labels.current.toLowerCase()}`}
            />
          </div>
          <div>
            <Label>{labels.target}</Label>
            <Input
              type="number"
              value={goal.target || ""}
              onChange={(e) => setGoal({ ...goal, target: parseFloat(e.target.value) })}
              placeholder={`Enter your ${labels.target.toLowerCase()}`}
            />
            <p className="text-sm text-muted-foreground mt-1">{labels.suggestion}</p>
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
    );
  };

  return (
    <Card>
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

        {step === 2 && renderGoalTypeSelection()}
        {step === 3 && goal.type && renderSpecificGoalSelection()}
        {step === 4 && renderTargetSetting()}
        {step === 5 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faBrain} className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">AI Recommendations</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-accent/10 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Selected Goal</h4>
                <p className="text-sm mb-1"><strong>Type:</strong> {goal.type}</p>
                <p className="text-sm mb-1"><strong>Specific Goal:</strong> {selectedSpecificGoal}</p>
                <p className="text-sm mb-1"><strong>Target:</strong> {goal.target}</p>
                <p className="text-sm"><strong>Timeline:</strong> {goal.timeline} weeks</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Personalized Recommendations:</h4>
                <ul className="list-disc pl-5 space-y-2">
                  {getRecommendations().map((recommendation, index) => (
                    <li key={index} className="text-sm">{recommendation}</li>
                  ))}
                </ul>
              </div>
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
            disabled={
              (step === 2 && !goal.type) ||
              (step === 3 && !selectedSpecificGoal) ||
              (step === 4 && (!goal.currentValue || !goal.target || !goal.timeline))
            }
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