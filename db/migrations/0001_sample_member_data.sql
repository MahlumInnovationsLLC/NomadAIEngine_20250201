-- Insert sample members
INSERT INTO members (first_name, last_name, email, phone_number, membership_type, user_id, total_visits)
VALUES 
  ('John', 'Smith', 'john.smith@example.com', '555-0123', 'premium', 'user1', 45),
  ('Sarah', 'Johnson', 'sarah.j@example.com', '555-0124', 'standard', 'user2', 32),
  ('Michael', 'Brown', 'michael.b@example.com', '555-0125', 'premium', 'user3', 28);

-- Insert sample health data
INSERT INTO member_health_data (member_id, metric_type, value, unit, source)
VALUES 
  (1, 'steps', 8500, 'steps', 'fitbit'),
  (1, 'heart_rate', 72, 'bpm', 'fitbit'),
  (1, 'weight', 175.5, 'lbs', 'smart_scale'),
  (2, 'steps', 10200, 'steps', 'apple_health'),
  (2, 'sleep', 7.5, 'hours', 'apple_health'),
  (3, 'calories', 2100, 'kcal', 'myfitnesspal');

-- Insert sample preferences
INSERT INTO member_preferences (member_id, category, preferences)
VALUES 
  (1, 'workout', '{"preferred_time": "morning", "focus_areas": ["strength", "cardio"], "equipment": ["treadmill", "weights"]}'),
  (1, 'nutrition', '{"dietary_restrictions": ["gluten-free"], "meal_preferences": ["high-protein", "low-carb"]}'),
  (2, 'workout', '{"preferred_time": "evening", "focus_areas": ["yoga", "flexibility"], "equipment": ["mat", "bands"]}'),
  (3, 'goals', '{"primary": "weight_loss", "target": {"weight": 170, "timeline": "3_months"}}');

-- Insert sample AI insights
INSERT INTO member_ai_insights (member_id, insight_type, content, confidence)
VALUES 
  (1, 'health_trend', '{"trend": "improving", "metrics": ["steps", "heart_rate"], "analysis": "Consistent improvement in cardiovascular health based on daily activity patterns"}', 0.89),
  (1, 'recommendation', '{"type": "workout_adjustment", "details": "Consider increasing weight training frequency based on recent performance metrics"}', 0.85),
  (2, 'behavior_pattern', '{"pattern": "evening_exerciser", "consistency": "high", "recommendation": "Schedule high-intensity workouts between 6-8pm for optimal engagement"}', 0.92),
  (3, 'risk_assessment', '{"risk_level": "low", "factors": ["regular_attendance", "balanced_routine"], "suggestions": "Maintain current program with minor adjustments for progression"}', 0.88);
