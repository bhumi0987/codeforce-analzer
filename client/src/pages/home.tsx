import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts";
import { Search, Zap, Dices, Target, TrendingUp, BookOpen, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import ProblemRecommendations from "@/components/ProblemRecommendations";
import HandleComparison from "@/components/HandleComparison";

interface UserInfo {
  handle: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
  maxRank?: string;
}

interface Problem {
  contestId: number;
  index: string;
  name: string;
  rating?: number;
  tags: string[];
}

interface Submission {
  problem: Problem;
  verdict: string;
  creationTimeSeconds: number;
}

interface RatingChange {
  contestId: number;
  contestName: string;
  newRating: number;
  oldRating: number;
}

interface TagStat {
  name: string;
  value: number;
}

export default function Home() {
  const [handle, setHandle] = useState("");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tagStats, setTagStats] = useState<TagStat[]>([]);
  const [randomProblem, setRandomProblem] = useState<Problem | null>(null);
  const [ratingProblem, setRatingProblem] = useState<Problem | null>(null);
  const [ratingInput, setRatingInput] = useState("");
  const [weakTags, setWeakTags] = useState<string[]>([]);
  const [ratings, setRatings] = useState<RatingChange[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  useEffect(() => {
    if (handle && handle.trim()) {
      fetchUserData();
    }
  }, [handle]);

  const fetchUserData = async () => {
    setLoading(true);
    setError(null);

    try {
      const userResponse = await fetch(
        `https://codeforces.com/api/user.info?handles=${handle}`
      );
      const userData = await userResponse.json();
      if (userData.status === "OK") {
        setUserInfo(userData.result[0]);
      }

      const submissionsResponse = await fetch(
      `https://codeforces.com/api/user.status?handle=${handle}`
      );
      const submissionsData = await submissionsResponse.json();
      if (submissionsData.status === "OK") {
        setSubmissions(submissionsData.result);
        const tagsStats: { [key: string]: { total: number; accepted: number } } = {};
// tag logic 
        submissionsData.result.forEach((sub: Submission) => {
          sub.problem.tags.forEach((tag: string) => {
            if (!tagsStats[tag]) {
              tagsStats[tag] = { total: 0, accepted: 0 };
            }
            tagsStats[tag].total += 1;
            if (sub.verdict === "OK") {
              tagsStats[tag].accepted += 1;
            }
          });
        });
        // accepantance rate
        const tagStatsWithRate = Object.entries(tagsStats).map(([tag, stats]) => {
          const rate = stats.total > 0 ? stats.accepted / stats.total : 0;
          return { name: tag, value: stats.accepted, rate };
        });

        const sortedByRate = [...tagStatsWithRate].sort((a, b) => a.rate - b.rate);

        setWeakTags(sortedByRate.slice(0, 3).map(t => t.name));

        setTagStats(tagStatsWithRate);
      }


      const ratingsResponse = await fetch(
        `https://codeforces.com/api/user.rating?handle=${handle}`
      );
      const ratingsData = await ratingsResponse.json();
      if (ratingsData.status === "OK") {
        setRatings(ratingsData.result);
      }
    } catch (err) {
      setError("Failed to fetch data. Please check the handle and try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pickRandomProblem = () => {
    const solved = submissions.filter((s: Submission) => s.verdict === "OK");
    if (solved.length > 0) {
      const random = solved[Math.floor(Math.random() * solved.length)];
      setRandomProblem(random.problem);
    }
  };

  const pickProblemByRating = () => {
    const solved = submissions.filter(
      (s: Submission) => s.verdict === "OK" && s.problem.rating == parseInt(ratingInput)
    );
    if (solved.length > 0) {
      const random = solved[Math.floor(Math.random() * solved.length)];
      setRatingProblem(random.problem);
    } else {
      setRatingProblem(null);
    }
  };

  const solvedProblems = useMemo(() => {
    const solved = new Set<string>();
    submissions.forEach((sub) => {
      if (sub.verdict === "OK") {
        solved.add(`${sub.problem.contestId}-${sub.problem.index}`);
      }
    });
    return solved;
  }, [submissions]);

  const dsaTopics = [
    { name: "Basics of Programming", link: "https://www.youtube.com/playlist?list=PLfqMhTWNBTe0b2nM6JHVCnAkhQRGiZMSJ" },
    { name: "Arrays", link: "https://youtube.com/playlist?list=PLgUwDviBIf0rENwdL0nEH0uGom9no0nyB&si=LsrYf3rLjpq7wC1L" },
    { name: "Strings", link: "https://youtube.com/playlist?list=PLPyD8bF-abzsMF6e44aiWzlTT2VrZwjLu&si=6GZOMwFTAwUylJeU" },
    { name: "Recursion & Backtracking", link: "https://youtube.com/playlist?list=PLgUwDviBIf0rGlzIn_7rsaR2FQ5e6ZOL9&si=1f8vXETYJhDi_ejB" },
    { name: "Linked List", link: "https://youtube.com/playlist?list=PLgUwDviBIf0rAuz8tVcM0AymmhTRsfaLU&si=s3h7fHhW_XabqWa4" },
    { name: "Stacks & Queues", link: "https://youtube.com/playlist?list=PLzjZaW71kMwRTtDWYVPvkJypUpKWbuT7_&si=RTxncMtppdeCDDQz" },
    { name: "Binary Trees", link: "https://youtube.com/playlist?list=PLzjZaW71kMwQ-JABTOTypnpRk1BnD2Nx4&si=_YJbfIBPeD_enVIn" },
    { name: "Binary Search Trees", link: "https://youtube.com/playlist?list=PLzjZaW71kMwQ-JABTOTypnpRk1BnD2Nx4&si=_YJbfIBPeD_enVIn" },
    { name: "Heaps & Priority Queue", link: "https://youtube.com/playlist?list=PLzjZaW71kMwTF8ZcUwm9md_3MvtOfwGow&si=JwYf5uO3MsdKNgWE" },
    { name: "Hashing & HashMaps", link: "https://youtube.com/playlist?list=PLzjZaW71kMwQ-D3oxCEDHAvYu8VC1XOsS&si=F8lTpJ0SOp7-rKRM" },
    { name: "Graphs (BFS, DFS, Shortest Path, MST)", link: "https://youtube.com/playlist?list=PLgUwDviBIf0oE3gA41TKO2H5bHpPd7fzn&si=VzA5i7-EuEPpU5Sb" },
    { name: "Dynamic Programming", link: "https://youtube.com/playlist?list=PLgUwDviBIf0qUlt5H_kiKYaNSqJ81PMMY&si=Og6an1X-4dhwjKVK" },
    { name: "Greedy Algorithms", link: "https://youtube.com/playlist?list=PLgUwDviBIf0rF1w2Koyh78zafB0cz7tea&si=mHwZsLm8KZ0-vc2m" },
    { name: "Segment Trees & Fenwick Trees", link: "https://youtube.com/playlist?list=PLEL7R4Pm6EmA1wAlmJs1LwPmSWmRnsA3H&si=CmpBHhMnpNZP15j6" },
    { name: "Advanced Graphs & Flows", link: "https://youtube.com/playlist?list=PLgUwDviBIf0oE3gA41TKO2H5bHpPd7fzn&si=VzA5i7-EuEPpU5Sb" },
    { name: "Number Theory", link: "https://youtube.com/playlist?list=PLauivoElc3giVROwL-6g9hO-LlSen_NaV&si=HID_xDfgz5T6W7bD" },
    { name: "Bit Manipulation", link: "https://youtube.com/playlist?list=PL-Jc9J83PIiFJRioti3ZV7QabwoJK6eKe&si=g2urh44aEfy6-zFB" },
    { name: "Tries", link: "https://youtube.com/playlist?list=PLgUwDviBIf0pcIDCZnxhv0LkHf5KzG9zp&si=yobWYwz8Q9TomlME" },
    { name: "Disjoint Set Union (DSU)", link: "https://youtu.be/zEAmQqOpfzM?si=mPx7GpSXQKbTwLCB" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Zap className="w-12 h-12 text-primary" />
            <h1 className="text-5xl font-bold text-foreground">
              Codeforces Analyzer
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Analyze your competitive programming journey with detailed insights
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  data-testid="input-handle"
                  className="pl-10"
                  placeholder="Enter Codeforces Handle (e.g., tourist, Benq)"
                  value={handle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHandle(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && fetchUserData()}
                />
              </div>
              <Button data-testid="button-search" onClick={fetchUserData} disabled={loading}>
                {loading ? "Loading..." : "Analyze"}
              </Button>
            </div>
            {error && (
              <p className="text-destructive text-sm mt-2" data-testid="text-error">
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        <HandleComparison />

        {userInfo && (
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="text-2xl" data-testid="text-username">
                {userInfo.handle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Rating</p>
                  <p className="text-2xl font-mono font-bold" data-testid="text-rating">
                    {userInfo.rating || "Unrated"}
                  </p>
                  {userInfo.rank && (
                    <Badge className="mt-1">
                      {userInfo.rank}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Max Rating</p>
                  <p className="text-2xl font-mono font-bold" data-testid="text-max-rating">
                    {userInfo.maxRating || "N/A"}
                  </p>
                  {userInfo.maxRank && (
                    <Badge className="mt-1">
                      {userInfo.maxRank}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {tagStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Problem Tags Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={tagStats}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry: TagStat) => entry.name}
                  >
                    {tagStats.map((entry: TagStat, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              {weakTags.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <p className="text-sm text-muted-foreground">Weakest Topics:</p>
                  {weakTags.map((tag: string) => (
                    <Badge key={tag} data-testid={`badge-weak-${tag}`}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {submissions.length > 0 && (
          <ActivityHeatmap submissions={submissions} />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dices className="w-5 h-5" />
                Random Problem Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                data-testid="button-random-problem"
                onClick={pickRandomProblem}
                disabled={submissions.length === 0}
                className="w-full"
              >
                Pick Random Problem
              </Button>
              {randomProblem && (
                <div className="p-4 bg-accent rounded-md">
                  <a
                    data-testid="link-random-problem"
                    href={`https://codeforces.com/problemset/problem/${randomProblem.contestId}/${randomProblem.index}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-semibold flex items-center gap-2"
                  >
                    {randomProblem.name}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  {randomProblem.rating && (
                    <Badge className="mt-2">
                      Rating: {randomProblem.rating}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Problem by Rating
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  data-testid="input-rating"
                  type="number"
                  placeholder="Enter Rating (e.g., 1200)"
                  value={ratingInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRatingInput(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && pickProblemByRating()}
                />
                <Button
                  data-testid="button-pick-by-rating"
                  onClick={pickProblemByRating}
                  disabled={!ratingInput || submissions.length === 0}
                >
                  Pick
                </Button>
              </div>
              {ratingProblem && (
                <div className="p-4 bg-accent rounded-md">
                  <a
                    data-testid="link-rating-problem"
                    href={`https://codeforces.com/problemset/problem/${ratingProblem.contestId}/${ratingProblem.index}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-semibold flex items-center gap-2"
                  >
                    {ratingProblem.name}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
              {ratingProblem === null && ratingInput && submissions.length > 0 && (
                <p className="text-sm text-destructive" data-testid="text-no-problems">
                  No solved problems found with this rating.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {weakTags.length > 0 && submissions.length > 0 && (
          <ProblemRecommendations
            weakTags={weakTags}
            solvedProblems={solvedProblems}
            userRating={userInfo?.rating}
          />
        )}

        {ratings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Contest Rating Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ratings}>
                  <XAxis dataKey="contestId" hide />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-card border border-border p-3 rounded-md shadow-lg">
                            <p className="font-semibold">{data.contestName}</p>
                            <p className="text-sm text-muted-foreground">
                              Contest {data.contestId}
                            </p>
                            <p className="text-primary font-mono">
                              Rating: {data.newRating}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Change: {data.newRating - data.oldRating > 0 ? "+" : ""}
                              {data.newRating - data.oldRating}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="newRating" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Free DSA & CP Resources (Beginner → Advanced)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dsaTopics.map((topic: { name: string; link: string }, index: number) => (
                <a
                  key={index}
                  data-testid={`link-resource-${index}`}
                  href={topic.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-md bg-accent hover-elevate active-elevate-2 transition-colors group"
                >
                  <span className="font-medium text-sm">{topic.name}</span>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
