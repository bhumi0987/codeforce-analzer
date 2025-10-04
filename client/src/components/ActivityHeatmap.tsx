import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface Submission {
  creationTimeSeconds: number;
  verdict: string;
}

interface ActivityHeatmapProps {
  submissions: Submission[];
}

export default function ActivityHeatmap({ submissions }: ActivityHeatmapProps) {
  const heatmapData = useMemo(() => {
    const activityMap: { [date: string]: number } = {};
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    submissions.forEach((sub) => {
      const date = new Date(sub.creationTimeSeconds * 1000);
      if (date >= sixMonthsAgo) {
        const dateStr = date.toISOString().split("T")[0];
        activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
      }
    });

    const days: { date: string; count: number; dateObj: Date }[] = [];
    for (let d = new Date(sixMonthsAgo); d <= now; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      days.push({
        date: dateStr,
        count: activityMap[dateStr] || 0,
        dateObj: new Date(d),
      });
    }

    return days;
  }, [submissions]);

  const getColorClass = (count: number) => {
    if (count === 0) return "bg-muted";
    if (count <= 2) return "bg-chart-2/30";
    if (count <= 5) return "bg-chart-2/60";
    if (count <= 10) return "bg-chart-2/80";
    return "bg-chart-2";
  };

  type DayData = { date: string; count: number; dateObj: Date };
  const weeks: DayData[][] = [];
  let currentWeek: DayData[] = [];

  heatmapData.forEach((day, index) => {
    if (index === 0) {
      const dayOfWeek = day.dateObj.getDay();
      for (let i = 0; i < dayOfWeek; i++) {
        currentWeek.push({ date: "", count: -1, dateObj: new Date() });
      }
    }

    currentWeek.push(day);

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ date: "", count: -1, dateObj: new Date() });
    }
    weeks.push(currentWeek);
  }

  const maxStreak = useMemo(() => {
    let streak = 0;
    let maxS = 0;
    const sortedDays = [...heatmapData].sort(
      (a, b) => a.dateObj.getTime() - b.dateObj.getTime()
    );

    for (let i = 0; i < sortedDays.length; i++) {
      if (sortedDays[i].count > 0) {
        streak++;
        maxS = Math.max(maxS, streak);
      } else {
        streak = 0;
      }
    }

    return maxS;
  }, [heatmapData]);

  const totalSubmissions = heatmapData.reduce((sum, day) => sum + day.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Activity Heatmap (Last 6 Months)
          </div>
          <div className="flex gap-4 text-sm font-normal">
            <div>
              <span className="text-muted-foreground">Total: </span>
              <span className="font-mono font-semibold">{totalSubmissions}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Max Streak: </span>
              <span className="font-mono font-semibold">{maxStreak} days</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex gap-1 text-xs text-muted-foreground mb-2">
            <div className="w-8">Mon</div>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`w-3 h-3 rounded-sm ${
                      day.count === -1 ? "bg-transparent" : getColorClass(day.count)
                    }`}
                    title={
                      day.count >= 0
                        ? `${day.date}: ${day.count} submission${day.count !== 1 ? "s" : ""}`
                        : ""
                    }
                    data-testid={day.count >= 0 ? `heatmap-${day.date}` : undefined}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-muted" />
              <div className="w-3 h-3 rounded-sm bg-chart-2/30" />
              <div className="w-3 h-3 rounded-sm bg-chart-2/60" />
              <div className="w-3 h-3 rounded-sm bg-chart-2/80" />
              <div className="w-3 h-3 rounded-sm bg-chart-2" />
            </div>
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
