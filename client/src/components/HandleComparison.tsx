import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Trophy, Target } from "lucide-react";

interface UserInfo {
  handle: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
  maxRank?: string;
  contribution?: number;
}

interface Submission {
  verdict: string;
}

interface ComparisonData {
  user: UserInfo;
  solvedCount: number;
  totalSubmissions: number;
  acceptanceRate: number;
}

export default function HandleComparison() {
  const [handle1, setHandle1] = useState("");
  const [handle2, setHandle2] = useState("");
  const [comparison, setComparison] = useState<{
    user1: ComparisonData | null;
    user2: ComparisonData | null;
  }>({ user1: null, user2: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async (handle: string) => {
    const userResponse = await fetch(
      `https://codeforces.com/api/user.info?handles=${handle}`
    );
    const userData = await userResponse.json();
    if (userData.status !== "OK") throw new Error("User not found");

    const submissionsResponse = await fetch(
      `https://codeforces.com/api/user.status?handle=${handle}`
    );
    const submissionsData = await submissionsResponse.json();
    if (submissionsData.status !== "OK") throw new Error("Failed to fetch submissions");

    const submissions: Submission[] = submissionsData.result;
    const solvedProblems = new Set<string>();

    submissions.forEach((sub: any) => {
      if (sub.verdict === "OK") {
        solvedProblems.add(`${sub.problem.contestId}-${sub.problem.index}`);
      }
    });

    return {
      user: userData.result[0],
      solvedCount: solvedProblems.size,
      totalSubmissions: submissions.length,
      acceptanceRate:
        submissions.length > 0
          ? Math.round((solvedProblems.size / submissions.length) * 100)
          : 0,
    };
  };

  const handleCompare = async () => {
    if (!handle1.trim() || !handle2.trim()) {
      setError("Please enter both handles");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [data1, data2] = await Promise.all([
        fetchUserData(handle1),
        fetchUserData(handle2),
      ]);

      setComparison({ user1: data1, user2: data2 });
    } catch (err: any) {
      setError(err.message || "Failed to compare users");
      setComparison({ user1: null, user2: null });
    } finally {
      setLoading(false);
    }
  };

  const ComparisonMetric = ({
    label,
    value1,
    value2,
    icon: Icon,
  }: {
    label: string;
    value1: string | number;
    value2: string | number;
    icon: any;
  }) => {
    const val1Num = typeof value1 === "number" ? value1 : parseInt(String(value1)) || 0;
    const val2Num = typeof value2 === "number" ? value2 : parseInt(String(value2)) || 0;
    const winner = val1Num > val2Num ? 1 : val1Num < val2Num ? 2 : 0;

    return (
      <div className="grid grid-cols-3 gap-4 items-center py-3 border-b last:border-b-0">
        <div
          className={`text-center font-mono font-bold ${
            winner === 1 ? "text-primary" : "text-foreground"
          }`}
          data-testid={`comparison-value1-${label}`}
        >
          {value1}
        </div>
        <div className="text-center flex flex-col items-center gap-1">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <div
          className={`text-center font-mono font-bold ${
            winner === 2 ? "text-primary" : "text-foreground"
          }`}
          data-testid={`comparison-value2-${label}`}
        >
          {value2}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Compare Handles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input
            data-testid="input-handle1"
            placeholder="First handle"
            value={handle1}
            onChange={(e) => setHandle1(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCompare()}
          />
          <Button
            data-testid="button-compare"
            onClick={handleCompare}
            disabled={loading}
            className="md:col-start-2"
          >
            {loading ? "Comparing..." : "Compare"}
          </Button>
          <Input
            data-testid="input-handle2"
            placeholder="Second handle"
            value={handle2}
            onChange={(e) => setHandle2(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCompare()}
          />
        </div>

        {error && (
          <p className="text-destructive text-sm" data-testid="text-comparison-error">
            {error}
          </p>
        )}

        {comparison.user1 && comparison.user2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 items-center pb-3 border-b-2">
              <div className="text-center">
                <p className="font-semibold text-lg" data-testid="text-handle1">
                  {comparison.user1.user.handle}
                </p>
                {comparison.user1.user.rank && (
                  <Badge className="mt-1">{comparison.user1.user.rank}</Badge>
                )}
              </div>
              <div className="text-center text-sm text-muted-foreground font-semibold">
                VS
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg" data-testid="text-handle2">
                  {comparison.user2.user.handle}
                </p>
                {comparison.user2.user.rank && (
                  <Badge className="mt-1">{comparison.user2.user.rank}</Badge>
                )}
              </div>
            </div>

            <div>
              <ComparisonMetric
                label="Rating"
                value1={comparison.user1.user.rating || 0}
                value2={comparison.user2.user.rating || 0}
                icon={TrendingUp}
              />
              <ComparisonMetric
                label="Max Rating"
                value1={comparison.user1.user.maxRating || 0}
                value2={comparison.user2.user.maxRating || 0}
                icon={Trophy}
              />
              <ComparisonMetric
                label="Problems Solved"
                value1={comparison.user1.solvedCount}
                value2={comparison.user2.solvedCount}
                icon={Target}
              />
              <ComparisonMetric
                label="Acceptance Rate"
                value1={`${comparison.user1.acceptanceRate}%`}
                value2={`${comparison.user2.acceptanceRate}%`}
                icon={Target}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
