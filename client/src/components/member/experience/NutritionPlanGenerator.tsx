import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCarrot,
  faBrain,
  faCircleCheck,
  faLeaf,
  faDumbbell,
  faAppleWhole,
} from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MealPlan {
  id: string;
  type: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: string[];
  preparationTime: string;
  aiRecommendation?: string;
}

interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

// Mock data for demonstration
const mockDailyGoals: NutritionGoals = {
  calories: 2500,
  protein: 180,
  carbs: 250,
  fats: 65,
};

const mockMealPlans: MealPlan[] = [
  {
    id: "1",
    type: "breakfast",
    name: "High-Protein Oatmeal Bowl",
    calories: 450,
    protein: 25,
    carbs: 65,
    fats: 12,
    ingredients: [
      "Rolled oats",
      "Protein powder",
      "Banana",
      "Almond butter",
      "Chia seeds",
    ],
    preparationTime: "10 mins",
    aiRecommendation:
      "Perfect pre-workout meal based on your morning training schedule",
  },
  {
    id: "2",
    type: "lunch",
    name: "Lean Chicken Power Bowl",
    calories: 650,
    protein: 45,
    carbs: 75,
    fats: 18,
    ingredients: [
      "Grilled chicken breast",
      "Quinoa",
      "Mixed vegetables",
      "Avocado",
      "Olive oil",
    ],
    preparationTime: "20 mins",
    aiRecommendation:
      "Balanced macros to support your strength training goals",
  },
  {
    id: "3",
    type: "dinner",
    name: "Salmon with Sweet Potato",
    calories: 550,
    protein: 35,
    carbs: 45,
    fats: 25,
    ingredients: [
      "Wild-caught salmon",
      "Sweet potato",
      "Broccoli",
      "Coconut oil",
      "Lemon",
    ],
    preparationTime: "25 mins",
    aiRecommendation:
      "Rich in omega-3s to support recovery and reduce inflammation",
  },
];

export function NutritionPlanGenerator() {
  const [selectedDay, setSelectedDay] = useState("today");

  const calculateTotalMacros = () => {
    return mockMealPlans.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.calories,
        protein: acc.protein + meal.protein,
        carbs: acc.carbs + meal.carbs,
        fats: acc.fats + meal.fats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  };

  const totals = calculateTotalMacros();

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FontAwesomeIcon icon={faCarrot} className="h-5 w-5 text-green-500" />
            AI Nutrition Planner
          </CardTitle>
          <Badge variant="secondary" className="animate-pulse">
            AI Generating
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="meals" className="space-y-4">
          <TabsList>
            <TabsTrigger value="meals">Meal Plan</TabsTrigger>
            <TabsTrigger value="macros">Macro Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="meals" className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button
                variant={selectedDay === "today" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDay("today")}
              >
                Today
              </Button>
              <Button
                variant={selectedDay === "tomorrow" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDay("tomorrow")}
              >
                Tomorrow
              </Button>
            </div>

            <div className="space-y-4">
              {mockMealPlans.map((meal) => (
                <div
                  key={meal.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{meal.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {meal.type} • {meal.preparationTime}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {meal.calories} kcal
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="p-2 bg-muted rounded-lg text-center">
                      <div className="font-medium">{meal.protein}g</div>
                      <div className="text-muted-foreground">Protein</div>
                    </div>
                    <div className="p-2 bg-muted rounded-lg text-center">
                      <div className="font-medium">{meal.carbs}g</div>
                      <div className="text-muted-foreground">Carbs</div>
                    </div>
                    <div className="p-2 bg-muted rounded-lg text-center">
                      <div className="font-medium">{meal.fats}g</div>
                      <div className="text-muted-foreground">Fats</div>
                    </div>
                  </div>

                  {meal.aiRecommendation && (
                    <div className="flex items-start gap-2 p-2 bg-muted rounded-lg">
                      <FontAwesomeIcon
                        icon={faBrain}
                        className="h-4 w-4 mt-1 text-purple-500"
                      />
                      <p className="text-sm">{meal.aiRecommendation}</p>
                    </div>
                  )}

                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <FontAwesomeIcon icon={faAppleWhole} className="h-4 w-4" />
                    View Recipe
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="macros" className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg space-y-3">
                <h3 className="font-medium">Daily Targets vs Actual</h3>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Calories</span>
                      <span>{totals.calories} / {mockDailyGoals.calories} kcal</span>
                    </div>
                    <Progress
                      value={(totals.calories / mockDailyGoals.calories) * 100}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Protein</span>
                      <span>{totals.protein} / {mockDailyGoals.protein}g</span>
                    </div>
                    <Progress
                      value={(totals.protein / mockDailyGoals.protein) * 100}
                      className="bg-blue-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Carbs</span>
                      <span>{totals.carbs} / {mockDailyGoals.carbs}g</span>
                    </div>
                    <Progress
                      value={(totals.carbs / mockDailyGoals.carbs) * 100}
                      className="bg-green-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Fats</span>
                      <span>{totals.fats} / {mockDailyGoals.fats}g</span>
                    </div>
                    <Progress
                      value={(totals.fats / mockDailyGoals.fats) * 100}
                      className="bg-yellow-100"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 p-2 bg-muted rounded-lg">
                        <FontAwesomeIcon
                          icon={faBrain}
                          className="h-4 w-4 mt-1 text-purple-500"
                        />
                        <p className="text-sm">
                          Your protein intake aligns well with your muscle-building goals
                        </p>
                      </div>
                      <div className="flex items-start gap-2 p-2 bg-muted rounded-lg">
                        <FontAwesomeIcon
                          icon={faLeaf}
                          className="h-4 w-4 mt-1 text-green-500"
                        />
                        <p className="text-sm">
                          Consider adding more fiber-rich foods to support gut health
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 p-2 bg-muted rounded-lg">
                        <FontAwesomeIcon
                          icon={faDumbbell}
                          className="h-4 w-4 mt-1 text-blue-500"
                        />
                        <p className="text-sm">
                          Time your protein intake around your workouts
                        </p>
                      </div>
                      <div className="flex items-start gap-2 p-2 bg-muted rounded-lg">
                        <FontAwesomeIcon
                          icon={faCircleCheck}
                          className="h-4 w-4 mt-1 text-green-500"
                        />
                        <p className="text-sm">
                          Try meal prepping to maintain consistent nutrition
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between gap-4">
          <Button className="flex-1 gap-2">
            <FontAwesomeIcon icon={faBrain} className="h-4 w-4" />
            Regenerate Plan
          </Button>
          <Button variant="outline" className="flex-1 gap-2">
            <FontAwesomeIcon icon={faCarrot} className="h-4 w-4" />
            Adjust Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
