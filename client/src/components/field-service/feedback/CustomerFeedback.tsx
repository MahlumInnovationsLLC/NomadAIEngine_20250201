
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { CustomerFeedbackItem } from "@/types/field-service";

export function CustomerFeedback() {
  const { data: feedbackItems = [] } = useQuery<CustomerFeedbackItem[]>({
    queryKey: ['/api/field-service/feedback'],
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {feedbackItems.map(item => (
            <div key={item.id} className="p-4 border rounded">
              <div className="flex justify-between">
                <span>Ticket ID: {item.ticketId}</span>
                <span>Rating: {item.rating}/5</span>
              </div>
              <p className="mt-2">{item.comment}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
